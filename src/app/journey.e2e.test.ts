import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import type { EmailMessage } from "../lib/auth/email";
import { formData, hasDatabase } from "../test/fixtures";

/**
 * El recorrido completo de una persona que nunca vio Doleth, extremo a extremo.
 *
 * Por qué existe además de las suites de identidad y de autorización. Esas
 * prueban cada pieza contra Postgres, pero cada una con su propia guardia de
 * sesión sustituida por un doble. Acá **no se sustituye ninguna guardia**: la
 * sesión que abre la verificación del correo es la que autoriza la creación de la
 * cuenta financiera, y la que autoriza el gasto. Lo único que se reemplaza son
 * las fronteras del framework —cookies, headers, redirect— y el envío de correo,
 * que se captura para poder leer el enlace como lo leería la persona.
 *
 * Lo que se comprueba es la afirmación que ninguna prueba unitaria puede hacer:
 * que las piezas encajan. Alta → verificación → sesión → onboarding → primera
 * cuenta → ingreso → gasto → saldo → cierre de sesión → reingreso → los datos
 * siguen ahí. Y que un segundo usuario, recorriendo lo mismo, no ve ni un dato
 * del primero ni puede alcanzarlo escribiendo su id a mano.
 *
 * Prueba bloqueante.
 */

// ---------------------------------------------------------------------------
// Dobles de las fronteras. Un único frasco de cookies: es el "navegador".
// ---------------------------------------------------------------------------

const cookieJar = new Map<string, { value: string }>();

class RedirectError extends Error {
  constructor(readonly destination: string) {
    super(`REDIRECT:${destination}`);
    this.name = "RedirectError";
  }
}

const sentEmails: EmailMessage[] = [];

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

vi.mock("next/navigation", () => ({
  redirect: (destination: string) => {
    throw new RedirectError(destination);
  },
  notFound: () => {
    throw new RedirectError("/404");
  },
}));

vi.mock("next/headers", () => ({
  cookies: async () => ({
    get: (name: string) => cookieJar.get(name),
    set: (name: string, value: string) => cookieJar.set(name, { value }),
    delete: (name: string) => cookieJar.delete(name),
    has: (name: string) => cookieJar.has(name),
  }),
  headers: async () => new Headers({ "user-agent": "vitest", "x-forwarded-for": "203.0.113.10" }),
}));

vi.mock("../lib/auth/email", async () => {
  const actual = await vi.importActual<typeof import("../lib/auth/email")>("../lib/auth/email");
  return {
    ...actual,
    sendEmail: async (message: EmailMessage) => {
      sentEmails.push(message);
    },
  };
});

const { loginAction, logoutAction, registerAction, verifyEmailAction } = await import("./auth/actions");
const {
  createFirstAccountAction,
  savePreferencesAction,
  saveReadingPreferencesAction,
  skipFixedExpensesAction,
} = await import("./onboarding/actions");
const { createAccountAction, createMovementAction, voidMovementAction } = await import("./actions/finance");
const { emptyAuthState, emptyAccountState, emptyOnboardingState } = await import("../lib/auth/form-state");
const { getSession } = await import("../lib/auth/session");
const { getDashboardData, getMovements, getOwnedMovement } = await import("../lib/finance/data");
const { deleteAccountAction } = await import("./configuracion/cuenta/actions");
const { getDb } = await import("../lib/db");
const { deleteTestUser } = await import("../test/fixtures");

// ---------------------------------------------------------------------------
// Ayudas
// ---------------------------------------------------------------------------

const PASSWORD = "melon tranquilo 2026";
const IDLE_FINANCE = { ok: false, message: "" };
const createdUserIds: string[] = [];

async function expectRedirect(run: Promise<unknown>): Promise<string> {
  try {
    const state = await run;
    throw new Error(`Se esperaba una redirección y se obtuvo: ${JSON.stringify(state)}`);
  } catch (error) {
    if (error instanceof RedirectError) return error.destination;
    throw error;
  }
}

function tokenFromLastEmail(): string {
  const last = sentEmails.at(-1);
  if (!last) throw new Error("No se envió ningún correo.");
  const match = last.text.match(/token=([\w-]+)/);
  if (!match?.[1]) throw new Error("No se encontró el token en el correo.");
  return decodeURIComponent(match[1]);
}

/** El día de hoy, que es lo que un formulario propone por omisión. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Mes en curso, que es el que muestra la pantalla de movimientos por omisión. */
function currentMonth(): string {
  return today().slice(0, 7);
}

interface Persona {
  userId: string;
  email: string;
  accountId: string;
}

/**
 * Todo el recorrido de alta de una persona, tal cual lo haría en el navegador.
 *
 * Devuelve la sesión abierta y su primera cuenta financiera. No recibe ningún
 * `userId`: el que quede es el que la sesión diga, que es exactamente el punto.
 */
async function altaCompleta(label: string, saldoInicial: string): Promise<Persona> {
  const email = `${label}-${randomUUID()}@pruebas.doleth.local`;

  // 1-3. Crear cuenta con correo y contraseña.
  const trasRegistro = await expectRedirect(
    registerAction(
      emptyAuthState,
      formData({
        name: `Persona ${label}`,
        email,
        password: PASSWORD,
        passwordConfirmation: PASSWORD,
        acceptedTerms: "on",
      }),
    ),
  );
  expect(trasRegistro).toContain("/crear-cuenta/revisa-tu-correo");

  const creada = await getDb().user.findUniqueOrThrow({ where: { email } });
  createdUserIds.push(creada.id);
  // Nace sin poder entrar y sin un solo dato financiero.
  expect(creada.status).toBe("PENDING_VERIFICATION");
  expect(await getDb().account.count({ where: { userId: creada.id } })).toBe(0);

  // 4-5. Verificar con el enlace del correo.
  const trasVerificar = await expectRedirect(
    verifyEmailAction(emptyAuthState, formData({ token: tokenFromLastEmail() })),
  );
  expect(trasVerificar).toBe("/onboarding");

  // 6. La verificación deja la sesión abierta: ya hay quién pide las cosas.
  const sesion = await getSession();
  expect(sesion?.user.id).toBe(creada.id);

  // 7. Onboarding.
  expect(
    (
      await savePreferencesAction(
        emptyOnboardingState,
        formData({ primaryCurrency: "ARS", timeZone: "America/Argentina/Cordoba", locale: "es-AR" }),
      )
    ).status,
  ).not.toBe("error");
  expect(
    (
      await saveReadingPreferencesAction(
        emptyOnboardingState,
        formData({ displayCurrency: "ARS", fxVariant: "BLUE" }),
      )
    ).status,
  ).not.toBe("error");

  // 8-9. Primera cuenta financiera, con su saldo inicial real.
  const primeraCuenta = await createFirstAccountAction(
    emptyOnboardingState,
    formData({
      name: "Mercado Pago",
      type: "WALLET",
      currency: "ARS",
      initialBalance: saldoInicial,
      balanceDate: today(),
    }),
  );
  expect(primeraCuenta.status).not.toBe("error");

  // Los gastos fijos son opcionales: saltearlos cierra el recorrido.
  expect((await skipFixedExpensesAction()).status).not.toBe("error");

  const listo = await getDb().user.findUniqueOrThrow({ where: { id: creada.id } });
  expect(listo.status).toBe("ACTIVE");
  expect(listo.onboardingCompletedAt).not.toBeNull();

  const cuenta = await getDb().account.findFirstOrThrow({ where: { userId: creada.id } });
  return { userId: creada.id, email, accountId: cuenta.id };
}

async function categoriaDe(userId: string, kind: "INCOME" | "EXPENSE"): Promise<string> {
  const categoria = await getDb().category.findFirstOrThrow({ where: { userId, kind } });
  return categoria.id;
}

async function registrarMovimiento(
  persona: Persona,
  type: "INCOME" | "EXPENSE",
  amount: string,
): Promise<string> {
  const estado = await createMovementAction(
    IDLE_FINANCE,
    formData({
      type,
      amount,
      occurredOn: today(),
      sourceAccountId: persona.accountId,
      categoryId: await categoriaDe(persona.userId, type),
      description: type === "INCOME" ? "Sueldo" : "Supermercado",
      idempotencyKey: randomUUID(),
    }),
  );
  expect(estado.ok, estado.message).toBe(true);
  return String(estado.data?.transactionId ?? "");
}

// ---------------------------------------------------------------------------

describe.skipIf(!hasDatabase)("recorrido completo de una persona nueva", () => {
  beforeEach(async () => {
    process.env.DOLETH_ACCESS_MODE = "public";
    cookieJar.clear();
    sentEmails.length = 0;
    await getDb().rateLimitCounter.deleteMany({});
  });

  afterAll(async () => {
    for (const id of createdUserIds) await deleteTestUser(id).catch(() => undefined);
    await getDb().rateLimitCounter.deleteMany({});
  }, 180_000);

  it("se registra, verifica, configura, anota su plata, se va y vuelve a encontrarla", async () => {
    // Saldo inicial $100.000, ingreso $50.000, gasto $20.000 → $130.000.
    const persona = await altaCompleta("journey", "100000");

    await registrarMovimiento(persona, "INCOME", "50000");
    await registrarMovimiento(persona, "EXPENSE", "20000");

    const panel = await getDashboardData(persona.userId);
    expect(panel.totalCents).toBe(13_000_000n);

    // 11. Cerrar sesión.
    expect(await expectRedirect(logoutAction())).toBe("/iniciar-sesion");
    expect(await getSession()).toBeNull();

    // 12. Volver a entrar con las mismas credenciales.
    const trasLogin = await expectRedirect(
      loginAction(emptyAuthState, formData({ email: persona.email, password: PASSWORD })),
    );
    expect(trasLogin).toBe("/ahora");
    expect((await getSession())?.user.id).toBe(persona.userId);

    // 13. Los datos siguen intactos.
    const despues = await getDashboardData(persona.userId);
    expect(despues.totalCents).toBe(13_000_000n);
    const movimientos = await getMovements(persona.userId, { month: currentMonth() });
    expect(movimientos.movements.length).toBe(2);
    expect(movimientos.accounts.length).toBe(1);
  });

  it("una contraseña equivocada no abre sesión ni toca los datos", async () => {
    const persona = await altaCompleta("journey-clave", "100000");
    await registrarMovimiento(persona, "INCOME", "50000");
    cookieJar.clear();

    const estado = await loginAction(
      emptyAuthState,
      formData({ email: persona.email, password: "otra clave cualquiera 9" }),
    );

    expect(estado.status).toBe("error");
    expect(await getSession()).toBeNull();
    expect((await getDashboardData(persona.userId)).totalCents).toBe(15_000_000n);
  });

  // -------------------------------------------------------------------------
  describe("dos personas en la misma base", () => {
    it("la segunda no ve ni un dato de la primera, ni escribiendo sus ids a mano", async () => {
      const una = await altaCompleta("journey-a", "100000");
      await registrarMovimiento(una, "INCOME", "50000");
      const gastoDeUna = await registrarMovimiento(una, "EXPENSE", "20000");

      // La otra persona abre Doleth en su propio navegador.
      cookieJar.clear();
      sentEmails.length = 0;
      const otra = await altaCompleta("journey-b", "7000");
      await registrarMovimiento(otra, "EXPENSE", "1000");

      // Arranca con lo suyo y nada más.
      const panelOtra = await getDashboardData(otra.userId);
      expect(panelOtra.totalCents).toBe(600_000n);
      const movimientosOtra = await getMovements(otra.userId, { month: currentMonth() });
      expect(movimientosOtra.movements.length).toBe(1);
      // Ni el movimiento ajeno ni la cuenta ajena aparecen en su listado.
      expect(movimientosOtra.movements.some((m) => m.id === gastoDeUna)).toBe(false);
      expect(movimientosOtra.accounts.some((a) => a.id === una.accountId)).toBe(false);

      // La sesión abierta es la de la segunda persona.
      expect((await getSession())?.user.id).toBe(otra.userId);

      // Leer un movimiento ajeno por id directo: no existe para ella.
      expect(await getOwnedMovement(otra.userId, gastoDeUna)).toBeNull();

      // Anular un movimiento ajeno pasándole el id en el formulario.
      const anulacionAjena = await voidMovementAction(IDLE_FINANCE, formData({ id: gastoDeUna }));
      expect(anulacionAjena.ok).toBe(false);
      // Y el movimiento de la otra persona sigue vivo.
      expect((await getDb().transaction.findUniqueOrThrow({ where: { id: gastoDeUna } })).voidedAt).toBeNull();

      // Crear un movimiento contra la cuenta ajena.
      const contraCuentaAjena = await createMovementAction(
        IDLE_FINANCE,
        formData({
          type: "EXPENSE",
          amount: "5000",
          occurredOn: today(),
          sourceAccountId: una.accountId,
          categoryId: await categoriaDe(otra.userId, "EXPENSE"),
          idempotencyKey: randomUUID(),
        }),
      );
      expect(contraCuentaAjena.ok).toBe(false);

      // Usar una categoría ajena con una cuenta propia.
      const conCategoriaAjena = await createMovementAction(
        IDLE_FINANCE,
        formData({
          type: "EXPENSE",
          amount: "5000",
          occurredOn: today(),
          sourceAccountId: otra.accountId,
          categoryId: await categoriaDe(una.userId, "EXPENSE"),
          idempotencyKey: randomUUID(),
        }),
      );
      expect(conCategoriaAjena.ok).toBe(false);

      // Nada de lo anterior movió un centavo de ninguna de las dos.
      expect((await getDashboardData(una.userId)).totalCents).toBe(13_000_000n);
      expect((await getDashboardData(otra.userId)).totalCents).toBe(600_000n);
    });

    it("una cuenta creada por cada una queda a nombre de quien la creó, no de quien dice el formulario", async () => {
      const una = await altaCompleta("journey-owner-a", "1000");
      cookieJar.clear();
      const otra = await altaCompleta("journey-owner-b", "1000");

      // El formulario miente sobre el dueño. La acción lo ignora: el propietario
      // sale de la sesión y de ningún otro lado.
      const estado = await createAccountAction(
        IDLE_FINANCE,
        formData({
          name: "Cuenta nueva",
          type: "BANK",
          currency: "ARS",
          initialBalance: "5000",
          userId: una.userId,
        }),
      );
      expect(estado.ok, estado.message).toBe(true);

      const creada = await getDb().account.findFirstOrThrow({ where: { name: "Cuenta nueva" } });
      expect(creada.userId).toBe(otra.userId);
      expect(await getDb().account.count({ where: { userId: una.userId } })).toBe(1);
    });

    it("dar de baja una cuenta no toca la de la otra persona", async () => {
      const una = await altaCompleta("journey-baja-a", "100000");
      await registrarMovimiento(una, "EXPENSE", "20000");

      cookieJar.clear();
      const otra = await altaCompleta("journey-baja-b", "80000");
      await registrarMovimiento(otra, "INCOME", "5000");

      // La segunda se da de baja con la sesión abierta.
      await expect(
        deleteAccountAction(emptyAccountState, formData({ currentPassword: PASSWORD, confirmation: "ELIMINAR" })),
      ).rejects.toThrow("REDIRECT:/cuenta-eliminada");

      expect(await getDb().user.count({ where: { id: otra.userId } })).toBe(0);
      expect(await getDb().account.count({ where: { userId: otra.userId } })).toBe(0);

      // La primera sigue entera y puede volver a entrar.
      cookieJar.clear();
      expect(
        await expectRedirect(loginAction(emptyAuthState, formData({ email: una.email, password: PASSWORD }))),
      ).toBe("/ahora");
      expect((await getDashboardData(una.userId)).totalCents).toBe(8_000_000n);
    });
  });
});
