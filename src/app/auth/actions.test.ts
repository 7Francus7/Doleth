import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import type { EmailMessage } from "../../lib/auth/email";
import { formData, hasDatabase } from "../../test/fixtures";

/**
 * Flujos públicos de identidad, extremo a extremo contra Postgres.
 *
 * Se sustituyen sólo las fronteras del framework (cookies, headers, redirect) y
 * el envío de correo, que se captura para poder leer el token del enlace. La
 * lógica de negocio, el hasheo, los tokens y el rate limiting corren de verdad.
 */

// ---------------------------------------------------------------------------
// Dobles de las fronteras
// ---------------------------------------------------------------------------

const cookieJar = new Map<string, { value: string }>();

class RedirectError extends Error {
  constructor(readonly destination: string) {
    super(`REDIRECT:${destination}`);
    this.name = "RedirectError";
  }
}

const sentEmails: EmailMessage[] = [];
let emailShouldFail = false;

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

vi.mock("next/navigation", () => ({
  redirect: (destination: string) => {
    throw new RedirectError(destination);
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

vi.mock("../../lib/auth/email", async () => {
  const actual = await vi.importActual<typeof import("../../lib/auth/email")>("../../lib/auth/email");
  return {
    ...actual,
    sendEmail: async (message: EmailMessage) => {
      if (emailShouldFail) throw new actual.EmailDeliveryError("El proveedor de correo respondió 502.");
      sentEmails.push(message);
    },
  };
});

const {
  loginAction,
  registerAction,
  requestPasswordResetAction,
  resendVerificationAction,
  resetPasswordAction,
  verifyEmailAction,
} = await import("./actions");
const { emptyAuthState } = await import("../../lib/auth/form-state");
const { getDb } = await import("../../lib/db");
const { deleteTestUser } = await import("../../test/fixtures");

// ---------------------------------------------------------------------------
// Ayudas
// ---------------------------------------------------------------------------

/** Ejecuta una acción que redirige y devuelve el destino en vez del estado. */
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
  if (!match?.[1]) throw new Error(`No se encontró el token en el correo:\n${last.text}`);
  return decodeURIComponent(match[1]);
}

const PASSWORD = "melon tranquilo 2026";
const createdUserIds: string[] = [];

function freshEmail(label: string): string {
  return `${label}-${randomUUID()}@pruebas.doleth.local`;
}

async function register(email: string, password = PASSWORD): Promise<string> {
  const destination = await expectRedirect(
    registerAction(
      emptyAuthState,
      formData({
        name: "Persona de prueba",
        email,
        password,
        passwordConfirmation: password,
        acceptedTerms: "on",
      }),
    ),
  );
  const user = await getDb().user.findUnique({ where: { email } });
  if (user) createdUserIds.push(user.id);
  return destination;
}

/** Limpia el rate limiting entre pruebas: cada caso mide su propio escenario. */
async function clearRateLimits() {
  await getDb().rateLimitCounter.deleteMany({});
}

describe.skipIf(!hasDatabase)("flujos de identidad", () => {
  beforeEach(async () => {
    cookieJar.clear();
    sentEmails.length = 0;
    emailShouldFail = false;
    await clearRateLimits();
  });

  afterEach(async () => {
    await clearRateLimits();
  });

  afterAll(async () => {
    for (const id of createdUserIds) await deleteTestUser(id).catch(() => undefined);
  });

  // -------------------------------------------------------------------------
  describe("registro", () => {
    it("crea la cuenta pendiente de verificación y envía el enlace", async () => {
      const email = freshEmail("registro-ok");
      const destination = await register(email);

      expect(destination).toContain("/crear-cuenta/revisa-tu-correo");
      const user = await getDb().user.findUniqueOrThrow({ where: { email } });
      expect(user.status).toBe("PENDING_VERIFICATION");
      expect(user.emailVerifiedAt).toBeNull();
      expect(user.acceptedTermsAt).not.toBeNull();
      expect(sentEmails).toHaveLength(1);
      expect(sentEmails[0]?.to).toBe(email);
    });

    it("guarda la contraseña hasheada, nunca en claro", async () => {
      const email = freshEmail("registro-hash");
      await register(email);
      const user = await getDb().user.findUniqueOrThrow({ where: { email } });
      expect(user.passwordHash).not.toContain(PASSWORD);
      expect(user.passwordHash.startsWith("scrypt$")).toBe(true);
    });

    it("no crea ningún dato financiero", async () => {
      const email = freshEmail("registro-vacio");
      await register(email);
      const user = await getDb().user.findUniqueOrThrow({ where: { email } });
      expect(await getDb().account.count({ where: { userId: user.id } })).toBe(0);
      expect(await getDb().transaction.count({ where: { userId: user.id } })).toBe(0);
      expect(await getDb().category.count({ where: { userId: user.id } })).toBe(0);
    });

    it("rechaza un correo inválido sin tocar la base", async () => {
      const antes = await getDb().user.count();
      const state = await registerAction(
        emptyAuthState,
        formData({
          name: "Persona",
          email: "no-es-un-correo",
          password: PASSWORD,
          passwordConfirmation: PASSWORD,
          acceptedTerms: "on",
        }),
      );
      expect(state.status).toBe("error");
      expect(state.errors.email).toBeDefined();
      expect(await getDb().user.count()).toBe(antes);
    });

    it("rechaza una contraseña débil", async () => {
      const state = await registerAction(
        emptyAuthState,
        formData({
          name: "Persona",
          email: freshEmail("debil"),
          password: "corta1",
          passwordConfirmation: "corta1",
          acceptedTerms: "on",
        }),
      );
      expect(state.errors.password).toBeDefined();
    });

    it("rechaza cuando la confirmación no coincide", async () => {
      const state = await registerAction(
        emptyAuthState,
        formData({
          name: "Persona",
          email: freshEmail("confirmacion"),
          password: PASSWORD,
          passwordConfirmation: `${PASSWORD} distinto`,
          acceptedTerms: "on",
        }),
      );
      expect(state.errors.passwordConfirmation).toBeDefined();
    });

    it("con un correo ya registrado responde igual y no crea un duplicado", async () => {
      const email = freshEmail("duplicado");
      await register(email);
      sentEmails.length = 0;

      const destination = await expectRedirect(
        registerAction(
          emptyAuthState,
          formData({
            name: "Otra persona",
            email,
            password: "otra clave larguísima 99",
            passwordConfirmation: "otra clave larguísima 99",
            acceptedTerms: "on",
          }),
        ),
      );

      // Mismo destino que un alta nueva: no se puede deducir si la cuenta existía.
      expect(destination).toContain("/crear-cuenta/revisa-tu-correo");
      expect(await getDb().user.count({ where: { email } })).toBe(1);
      // La contraseña original sigue siendo la válida.
      const { verifyPassword } = await import("../../lib/auth/password");
      const user = await getDb().user.findUniqueOrThrow({ where: { email } });
      expect((await verifyPassword(PASSWORD, user.passwordHash)).valid).toBe(true);
    });

    it("si el proveedor de correo falla, la acción falla y no miente", async () => {
      const email = freshEmail("correo-caido");
      emailShouldFail = true;
      const state = await registerAction(
        emptyAuthState,
        formData({
          name: "Persona",
          email,
          password: PASSWORD,
          passwordConfirmation: PASSWORD,
          acceptedTerms: "on",
        }),
      );
      expect(state.status).toBe("error");
      expect(state.message).toMatch(/no pudimos enviar el correo/i);

      const user = await getDb().user.findUnique({ where: { email } });
      if (user) createdUserIds.push(user.id);
    });

    it("aplica rate limiting al registro", async () => {
      let bloqueo = "";
      for (let intento = 0; intento < 8 && !bloqueo; intento += 1) {
        const email = freshEmail(`rate-registro-${intento}`);
        try {
          const state = await registerAction(
            emptyAuthState,
            formData({
              name: "Persona",
              email,
              password: PASSWORD,
              passwordConfirmation: PASSWORD,
              acceptedTerms: "on",
            }),
          );
          if (state.status === "error" && /demasiados intentos/i.test(state.message)) bloqueo = state.message;
        } catch (error) {
          // El alta exitosa redirige: sólo hace falta recordar el id para limpiar.
          if (!(error instanceof RedirectError)) throw error;
          const creado = await getDb().user.findUnique({ where: { email } });
          if (creado) createdUserIds.push(creado.id);
        }
      }
      expect(bloqueo).toMatch(/demasiados intentos/i);
    });
  });

  // -------------------------------------------------------------------------
  describe("verificación de correo", () => {
    it("con un token válido activa la cuenta, abre sesión y va al onboarding", async () => {
      const email = freshEmail("verificar-ok");
      await register(email);
      const token = tokenFromLastEmail();

      const destination = await expectRedirect(verifyEmailAction(emptyAuthState, formData({ token })));
      expect(destination).toBe("/onboarding");

      const user = await getDb().user.findUniqueOrThrow({ where: { email } });
      expect(user.status).toBe("ACTIVE");
      expect(user.emailVerifiedAt).not.toBeNull();
      expect(await getDb().session.count({ where: { userId: user.id, revokedAt: null } })).toBe(1);
      expect(cookieJar.has("doleth_session")).toBe(true);
    });

    it("un token inválido no activa nada", async () => {
      const state = await verifyEmailAction(emptyAuthState, formData({ token: "token-inventado" }));
      expect(state.status).toBe("error");
    });

    it("un token vencido se rechaza", async () => {
      const email = freshEmail("verificar-vencido");
      await register(email);
      const token = tokenFromLastEmail();
      const { sha256Hex } = await import("../../lib/auth/crypto");
      await getDb().authToken.update({
        where: { tokenHash: await sha256Hex(token) },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const state = await verifyEmailAction(emptyAuthState, formData({ token }));
      expect(state.status).toBe("error");
      expect(state.message).toMatch(/venció/i);
      expect((await getDb().user.findUniqueOrThrow({ where: { email } })).status).toBe("PENDING_VERIFICATION");
    });

    it("un token ya usado no se puede reutilizar", async () => {
      const email = freshEmail("verificar-reuso");
      await register(email);
      const token = tokenFromLastEmail();

      await expectRedirect(verifyEmailAction(emptyAuthState, formData({ token })));
      const state = await verifyEmailAction(emptyAuthState, formData({ token }));
      expect(state.status).toBe("error");
      expect(await getDb().user.count({ where: { email } })).toBe(1);
    });

    it("pedir un enlace nuevo invalida el anterior", async () => {
      const email = freshEmail("verificar-reenvio");
      await register(email);
      const primerToken = tokenFromLastEmail();

      const state = await resendVerificationAction(emptyAuthState, formData({ email }));
      expect(state.status).toBe("success");
      const segundoToken = tokenFromLastEmail();
      expect(segundoToken).not.toBe(primerToken);

      expect((await verifyEmailAction(emptyAuthState, formData({ token: primerToken }))).status).toBe("error");
      expect(await expectRedirect(verifyEmailAction(emptyAuthState, formData({ token: segundoToken })))).toBe(
        "/onboarding",
      );
    });

    it("el reenvío responde igual para una dirección inexistente", async () => {
      const state = await resendVerificationAction(emptyAuthState, formData({ email: freshEmail("no-existe") }));
      expect(state.status).toBe("success");
      expect(sentEmails).toHaveLength(0);
    });

    it("aplica rate limiting al reenvío", async () => {
      const email = freshEmail("rate-reenvio");
      await register(email);
      let mensaje = "";
      for (let intento = 0; intento < 8; intento += 1) {
        const state = await resendVerificationAction(emptyAuthState, formData({ email }));
        if (state.status === "error") mensaje = state.message;
      }
      expect(mensaje).toMatch(/demasiados intentos/i);
    });
  });

  // -------------------------------------------------------------------------
  describe("inicio de sesión", () => {
    async function verifiedUser(label: string) {
      const email = freshEmail(label);
      await register(email);
      await expectRedirect(verifyEmailAction(emptyAuthState, formData({ token: tokenFromLastEmail() })));
      cookieJar.clear();
      await clearRateLimits();
      return email;
    }

    it("con credenciales válidas abre sesión", async () => {
      const email = await verifiedUser("login-ok");
      const destination = await expectRedirect(
        loginAction(emptyAuthState, formData({ email, password: PASSWORD, destino: "/movimientos" })),
      );
      // Sin onboarding terminado, el destino pedido cede ante la configuración inicial.
      expect(destination).toBe("/onboarding");
      expect(cookieJar.has("doleth_session")).toBe(true);
    });

    it("respeta el destino interno cuando el onboarding está terminado", async () => {
      const email = await verifiedUser("login-destino");
      await getDb().user.update({
        where: { email },
        data: { onboardingCompletedAt: new Date(), onboardingStep: 3 },
      });
      const destination = await expectRedirect(
        loginAction(emptyAuthState, formData({ email, password: PASSWORD, destino: "/movimientos?month=2026-07" })),
      );
      expect(destination).toBe("/movimientos?month=2026-07");
    });

    it("rechaza un destino externo y manda al panel", async () => {
      const email = await verifiedUser("login-open-redirect");
      await getDb().user.update({ where: { email }, data: { onboardingCompletedAt: new Date() } });
      const destination = await expectRedirect(
        loginAction(
          emptyAuthState,
          formData({ email, password: PASSWORD, destino: "https://malicioso.example/robar" }),
        ),
      );
      expect(destination).toBe("/ahora");
    });

    it("con contraseña incorrecta no abre sesión", async () => {
      const email = await verifiedUser("login-password");
      const state = await loginAction(emptyAuthState, formData({ email, password: "clave equivocada 123" }));
      expect(state.status).toBe("error");
      expect(cookieJar.has("doleth_session")).toBe(false);
    });

    it("con un correo inexistente responde igual que con contraseña incorrecta", async () => {
      const email = await verifiedUser("login-mensaje");
      const conPasswordMala = await loginAction(emptyAuthState, formData({ email, password: "clave equivocada 123" }));
      await clearRateLimits();
      const sinCuenta = await loginAction(
        emptyAuthState,
        formData({ email: freshEmail("fantasma"), password: "clave equivocada 123" }),
      );
      expect(sinCuenta.message).toBe(conPasswordMala.message);
    });

    it("una cuenta sin verificar no entra pero recibe una salida clara", async () => {
      const email = freshEmail("login-sin-verificar");
      await register(email);
      await clearRateLimits();
      const state = await loginAction(emptyAuthState, formData({ email, password: PASSWORD }));
      expect(state.status).toBe("error");
      expect(state.errors.unverified).toBe("1");
      expect(cookieJar.has("doleth_session")).toBe(false);
    });

    it("una cuenta suspendida no entra", async () => {
      const email = await verifiedUser("login-suspendida");
      await getDb().user.update({ where: { email }, data: { status: "SUSPENDED" } });
      const state = await loginAction(emptyAuthState, formData({ email, password: PASSWORD }));
      expect(state.message).toMatch(/suspendida/i);
      expect(cookieJar.has("doleth_session")).toBe(false);
    });

    it("una cuenta eliminada no entra", async () => {
      const email = await verifiedUser("login-eliminada");
      await getDb().user.update({ where: { email }, data: { status: "DELETED" } });
      const state = await loginAction(emptyAuthState, formData({ email, password: PASSWORD }));
      expect(state.message).toMatch(/no está disponible/i);
    });

    it("aplica rate limiting por dirección", async () => {
      const email = await verifiedUser("login-rate");
      let mensaje = "";
      for (let intento = 0; intento < 12; intento += 1) {
        const state = await loginAction(emptyAuthState, formData({ email, password: "clave equivocada 123" }));
        if (/demasiados intentos/i.test(state.message)) mensaje = state.message;
      }
      expect(mensaje).toMatch(/demasiados intentos/i);
    });
  });

  // -------------------------------------------------------------------------
  describe("recuperación de contraseña", () => {
    async function verifiedUser(label: string) {
      const email = freshEmail(label);
      await register(email);
      await expectRedirect(verifyEmailAction(emptyAuthState, formData({ token: tokenFromLastEmail() })));
      cookieJar.clear();
      sentEmails.length = 0;
      await clearRateLimits();
      return email;
    }

    it("envía el enlace para una cuenta existente", async () => {
      const email = await verifiedUser("reset-ok");
      const state = await requestPasswordResetAction(emptyAuthState, formData({ email }));
      expect(state.status).toBe("success");
      expect(sentEmails.at(-1)?.to).toBe(email);
    });

    it("responde exactamente igual para una dirección inexistente", async () => {
      const email = await verifiedUser("reset-neutral");
      const existente = await requestPasswordResetAction(emptyAuthState, formData({ email }));
      await clearRateLimits();
      sentEmails.length = 0;
      const inexistente = await requestPasswordResetAction(
        emptyAuthState,
        formData({ email: freshEmail("no-existe-reset") }),
      );
      expect(inexistente.message).toBe(existente.message);
      expect(inexistente.status).toBe(existente.status);
      expect(sentEmails).toHaveLength(0);
    });

    it("con un token válido cambia la contraseña y revoca las sesiones", async () => {
      const email = await verifiedUser("reset-completo");
      const user = await getDb().user.findUniqueOrThrow({ where: { email } });

      // Varias sesiones abiertas antes del cambio: la de la verificación y dos más.
      const { createSession } = await import("../../lib/auth/session");
      await createSession(user.id);
      await createSession(user.id);
      expect(await getDb().session.count({ where: { userId: user.id, revokedAt: null } })).toBe(3);

      await requestPasswordResetAction(emptyAuthState, formData({ email }));
      const token = tokenFromLastEmail();

      const nueva = "sandia despierta 4040";
      const destination = await expectRedirect(
        resetPasswordAction(emptyAuthState, formData({ token, password: nueva, passwordConfirmation: nueva })),
      );
      expect(destination).toBe("/restablecer-contrasena/listo");

      expect(await getDb().session.count({ where: { userId: user.id, revokedAt: null } })).toBe(0);

      const { verifyPassword } = await import("../../lib/auth/password");
      const actualizado = await getDb().user.findUniqueOrThrow({ where: { email } });
      expect((await verifyPassword(nueva, actualizado.passwordHash)).valid).toBe(true);
      expect((await verifyPassword(PASSWORD, actualizado.passwordHash)).valid).toBe(false);
    });

    it("un token de recuperación ya usado no sirve dos veces", async () => {
      const email = await verifiedUser("reset-reuso");
      await requestPasswordResetAction(emptyAuthState, formData({ email }));
      const token = tokenFromLastEmail();
      const nueva = "sandia despierta 4040";

      await expectRedirect(
        resetPasswordAction(emptyAuthState, formData({ token, password: nueva, passwordConfirmation: nueva })),
      );
      const state = await resetPasswordAction(
        emptyAuthState,
        formData({ token, password: "otra vez otra clave 55", passwordConfirmation: "otra vez otra clave 55" }),
      );
      expect(state.status).toBe("error");

      const { verifyPassword } = await import("../../lib/auth/password");
      const user = await getDb().user.findUniqueOrThrow({ where: { email } });
      expect((await verifyPassword(nueva, user.passwordHash)).valid).toBe(true);
    });

    it("un token de recuperación vencido no sirve", async () => {
      const email = await verifiedUser("reset-vencido");
      await requestPasswordResetAction(emptyAuthState, formData({ email }));
      const token = tokenFromLastEmail();
      const { sha256Hex } = await import("../../lib/auth/crypto");
      await getDb().authToken.update({
        where: { tokenHash: await sha256Hex(token) },
        data: { expiresAt: new Date(Date.now() - 1000) },
      });

      const state = await resetPasswordAction(
        emptyAuthState,
        formData({ token, password: "sandia despierta 4040", passwordConfirmation: "sandia despierta 4040" }),
      );
      expect(state.status).toBe("error");
      expect(state.message).toMatch(/venció/i);
    });

    it("no acepta una contraseña nueva débil", async () => {
      const email = await verifiedUser("reset-debil");
      await requestPasswordResetAction(emptyAuthState, formData({ email }));
      const token = tokenFromLastEmail();
      const state = await resetPasswordAction(
        emptyAuthState,
        formData({ token, password: "corta1", passwordConfirmation: "corta1" }),
      );
      expect(state.errors.password).toBeDefined();
    });

    it("aplica rate limiting a la recuperación", async () => {
      const email = await verifiedUser("reset-rate");
      let mensaje = "";
      for (let intento = 0; intento < 8; intento += 1) {
        const state = await requestPasswordResetAction(emptyAuthState, formData({ email }));
        if (state.status === "error") mensaje = state.message;
      }
      expect(mensaje).toMatch(/demasiados intentos/i);
    });
  });

  // -------------------------------------------------------------------------
  describe("auditoría", () => {
    it("registra los eventos sin guardar secretos", async () => {
      const email = freshEmail("auditoria");
      await register(email);
      const user = await getDb().user.findUniqueOrThrow({ where: { email } });
      await expectRedirect(verifyEmailAction(emptyAuthState, formData({ token: tokenFromLastEmail() })));

      const events = await getDb().authEvent.findMany({ where: { userId: user.id } });
      expect(events.map((event) => event.type)).toEqual(
        expect.arrayContaining(["ACCOUNT_CREATED", "EMAIL_VERIFIED"]),
      );

      const serialized = JSON.stringify(events);
      expect(serialized).not.toContain(PASSWORD);
      expect(serialized).not.toContain(email);
      expect(serialized).not.toContain("203.0.113.10");
      // El correo queda seudonimizado, no en claro.
      expect(events.some((event) => event.emailHash !== null || event.userId !== null)).toBe(true);
    });
  });
});
