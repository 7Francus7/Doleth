import { randomUUID } from "node:crypto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getDb } from "../../lib/db";
import { deleteTestUser, formData, hasDatabase } from "../../test/fixtures";

/**
 * El recorrido de configuración inicial.
 *
 * Lo que importa acá es que las respuestas **lleguen a algún lado**: la moneda
 * de lectura y el tipo de cambio quedan en el usuario, y los gastos fijos se
 * convierten en pagos previstos de verdad. Un cuestionario cuyas respuestas se
 * pierden es peor que no preguntar, porque la persona cree haber cargado algo.
 */

let actingUserId = "";

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

vi.mock("next/headers", () => ({
  headers: async () => new Headers({ "user-agent": "vitest", "x-forwarded-for": "203.0.113.10" }),
}));

vi.mock("../../lib/auth/guards", async () => {
  const actual = await vi.importActual<typeof import("../../lib/auth/guards")>("../../lib/auth/guards");
  return {
    ...actual,
    requireUserForAction: async () => {
      const user = await getDb().user.findUnique({ where: { id: actingUserId } });
      if (!user) throw new actual.UnauthorizedError();
      return user;
    },
  };
});

const {
  createFirstAccountAction,
  saveFixedExpensesAction,
  saveReadingPreferencesAction,
  skipFixedExpensesAction,
} = await import("./actions");
const { emptyOnboardingState: idle } = await import("../../lib/auth/form-state");

async function createPendingUser(): Promise<string> {
  const user = await getDb().user.create({
    data: {
      name: "Persona nueva",
      email: `onboarding-${randomUUID()}@pruebas.doleth.local`,
      passwordHash: "scrypt$65536$8$2$c2FsdGVzdA$aGFzaGRlcHJ1ZWJhbm9zaXJ2ZXBhcmFuYWRhMDA",
      status: "ACTIVE",
      emailVerifiedAt: new Date(),
      onboardingStep: 2,
    },
  });
  return user.id;
}

/** Deja al usuario con su primera cuenta creada, listo para el último paso. */
async function withFirstAccount(): Promise<void> {
  await saveReadingPreferencesAction(idle, formData({ displayCurrency: "ARS", fxVariant: "BLUE" }));
  const state = await createFirstAccountAction(
    idle,
    formData({ name: "Caja de ahorro", type: "BANK", initialBalance: "150000", currency: "ARS" }),
  );
  expect(state.status).not.toBe("error");
}

describe.skipIf(!hasDatabase)("configuración inicial", () => {
  const created: string[] = [];

  beforeEach(async () => {
    actingUserId = await createPendingUser();
    created.push(actingUserId);
  });

  afterEach(async () => {
    for (const id of created.splice(0)) {
      await deleteTestUser(id).catch(() => undefined);
    }
  });

  describe("cómo lee su plata", () => {
    it("guarda la moneda de lectura y el tipo de cambio", async () => {
      const state = await saveReadingPreferencesAction(
        idle,
        formData({ displayCurrency: "USD", fxVariant: "MEP" }),
      );

      expect(state.status).not.toBe("error");
      const user = await getDb().user.findUniqueOrThrow({ where: { id: actingUserId } });
      expect(user.displayCurrency).toBe("USD");
      expect(user.fxVariant).toBe("MEP");
      expect(user.onboardingStep).toBe(3);
    });

    /**
     * `MANUAL` necesita una cotización propia que se carga en otra pantalla.
     * Aceptarlo acá dejaría los totales sin poder calcularse el primer día.
     */
    it("no acepta el tipo de cambio manual durante el onboarding", async () => {
      const state = await saveReadingPreferencesAction(
        idle,
        formData({ displayCurrency: "ARS", fxVariant: "MANUAL" }),
      );

      expect(state.status).toBe("error");
      expect(state.errors.fxVariant).toBeDefined();
    });

    it("rechaza una moneda que no existe", async () => {
      const state = await saveReadingPreferencesAction(
        idle,
        formData({ displayCurrency: "XYZ", fxVariant: "BLUE" }),
      );
      expect(state.status).toBe("error");
    });
  });

  describe("gastos fijos", () => {
    it("convierte cada fila en un pago previsto", async () => {
      await withFirstAccount();

      const state = await saveFixedExpensesAction(
        idle,
        formData({
          "concept-0": "Alquiler",
          "amount-0": "350000",
          "day-0": "5",
          "concept-1": "Internet",
          "amount-1": "25000",
          "day-1": "12",
          "concept-2": "",
          "amount-2": "",
          "day-2": "",
        }),
      );

      expect(state.status).not.toBe("error");
      const pagos = await getDb().upcomingPayment.findMany({
        where: { userId: actingUserId },
        orderBy: { concept: "asc" },
      });
      expect(pagos).toHaveLength(2);
      expect(pagos[0]?.concept).toBe("Alquiler");
      expect(pagos[0]?.estimatedCents).toBe(35_000_000n);
      expect(pagos[1]?.concept).toBe("Internet");
    });

    /** Las filas vacías son lo normal: nadie tiene exactamente tres gastos fijos. */
    it("ignora las filas vacías sin protestar", async () => {
      await withFirstAccount();

      const state = await saveFixedExpensesAction(
        idle,
        formData({ "concept-0": "Luz", "amount-0": "18000", "day-0": "20" }),
      );

      expect(state.status).not.toBe("error");
      expect(await getDb().upcomingPayment.count({ where: { userId: actingUserId } })).toBe(1);
    });

    /**
     * Una fila a medio llenar sí se marca: callarla haría desaparecer un gasto
     * que la persona creyó haber cargado.
     */
    it("marca una fila incompleta en vez de descartarla", async () => {
      await withFirstAccount();

      const state = await saveFixedExpensesAction(
        idle,
        formData({ "concept-0": "Alquiler", "amount-0": "", "day-0": "5" }),
      );

      expect(state.status).toBe("error");
      expect(state.errors["amount-0"]).toBeDefined();
      expect(await getDb().upcomingPayment.count({ where: { userId: actingUserId } })).toBe(0);
    });

    it("rechaza un día que no existe", async () => {
      await withFirstAccount();

      const state = await saveFixedExpensesAction(
        idle,
        formData({ "concept-0": "Alquiler", "amount-0": "1000", "day-0": "45" }),
      );

      expect(state.status).toBe("error");
      expect(state.errors["day-0"]).toBeDefined();
    });

    /**
     * Un pago previsto que nace vencido reclama atención por algo que todavía no
     * ocurrió.
     */
    it("agenda el vencimiento a futuro, nunca en una fecha ya pasada", async () => {
      await withFirstAccount();

      await saveFixedExpensesAction(
        idle,
        formData({ "concept-0": "Alquiler", "amount-0": "350000", "day-0": "1" }),
      );

      const pago = await getDb().upcomingPayment.findFirstOrThrow({ where: { userId: actingUserId } });
      const hoy = new Date();
      hoy.setUTCHours(0, 0, 0, 0);
      expect(pago.dueOn.getTime()).toBeGreaterThan(hoy.getTime());
    });

    it("cierra el onboarding al guardar", async () => {
      await withFirstAccount();

      await saveFixedExpensesAction(
        idle,
        formData({ "concept-0": "Luz", "amount-0": "18000", "day-0": "20" }),
      );

      const user = await getDb().user.findUniqueOrThrow({ where: { id: actingUserId } });
      expect(user.onboardingCompletedAt).not.toBeNull();
      expect(user.onboardingStep).toBe(5);
    });

    it("se puede saltear y el onboarding igual queda cerrado", async () => {
      await withFirstAccount();

      const state = await skipFixedExpensesAction();

      expect(state.status).not.toBe("error");
      const user = await getDb().user.findUniqueOrThrow({ where: { id: actingUserId } });
      expect(user.onboardingCompletedAt).not.toBeNull();
      expect(await getDb().upcomingPayment.count({ where: { userId: actingUserId } })).toBe(0);
    });

    /** Un pago previsto necesita una cuenta donde imputarse. */
    it("no acepta gastos fijos antes de crear la primera cuenta", async () => {
      const state = await saveFixedExpensesAction(
        idle,
        formData({ "concept-0": "Alquiler", "amount-0": "350000", "day-0": "5" }),
      );

      expect(state.status).toBe("error");
    });
  });

  it("la primera cuenta ya no cierra el recorrido por sí sola", async () => {
    await withFirstAccount();

    const user = await getDb().user.findUniqueOrThrow({ where: { id: actingUserId } });
    expect(user.onboardingStep).toBe(4);
    expect(user.onboardingCompletedAt).toBeNull();
  });
});
