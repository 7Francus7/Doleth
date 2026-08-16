import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestUser, deleteTestUser, formData, hasDatabase, type TestUser } from "../../test/fixtures";
import type { FinanceActionState } from "./finance";

/**
 * Categorías propias, contra Postgres.
 *
 * Se sustituye sólo la guardia de sesión; el resto —validación, unicidad del
 * slug, archivado, herencia de categoría al confirmar un pago previsto— corre de
 * verdad contra la base, que es donde viven las restricciones que sostienen todo
 * esto.
 *
 * Pruebas bloqueantes: dos de ellas comprueban que un id ajeno no alcance para
 * renombrar ni archivar nada.
 */

const currentUserId = { value: "" };

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

vi.mock("../../lib/auth/guards", async () => {
  const actual = await vi.importActual<typeof import("../../lib/auth/guards")>("../../lib/auth/guards");
  const { getDb } = await import("../../lib/db");
  return {
    ...actual,
    requireOnboardedUserForAction: async () => {
      if (!currentUserId.value) throw new actual.UnauthorizedError();
      return getDb().user.findUniqueOrThrow({ where: { id: currentUserId.value } });
    },
  };
});

const {
  createCategoryAction,
  createMovementAction,
  createUpcomingPaymentAction,
  payUpcomingPaymentAction,
  renameCategoryAction,
  setCategoryStatusAction,
} = await import("./finance");
const { getCategoryCatalog, getMovementFormData } = await import("../../lib/finance/data");
const { getDb } = await import("../../lib/db");
const { createPostings, todayInArgentina } = await import("../../lib/finance/domain");

const idle: FinanceActionState = { ok: false, message: "" };

describe.skipIf(!hasDatabase)("categorías propias", () => {
  let ana: TestUser;
  let beto: TestUser;

  beforeAll(async () => {
    ana = await createTestUser("ana-cat");
    beto = await createTestUser("beto-cat");
  });

  afterAll(async () => {
    await deleteTestUser(ana.id);
    await deleteTestUser(beto.id);
  });

  beforeEach(() => {
    currentUserId.value = ana.id;
  });

  describe("crear", () => {
    it("crea una categoría de gasto y queda disponible para cargar", async () => {
      const state = await createCategoryAction(idle, formData({ name: "Obra social", kind: "EXPENSE" }));
      expect(state.ok).toBe(true);

      const { categories } = await getMovementFormData(ana.id);
      expect(categories.map((category) => category.name)).toContain("Obra social");
    });

    it("deriva un slug estable a partir del nombre", async () => {
      await createCategoryAction(idle, formData({ name: "Cochera del edificio", kind: "EXPENSE" }));
      const created = await getDb().category.findFirstOrThrow({
        where: { userId: ana.id, name: "Cochera del edificio" },
      });
      expect(created.slug).toBe("cochera-del-edificio");
    });

    it("rechaza un nombre que ya existe aunque cambien acentos y mayúsculas", async () => {
      await createCategoryAction(idle, formData({ name: "Peluquería", kind: "EXPENSE" }));
      const repetida = await createCategoryAction(idle, formData({ name: "peluqueria", kind: "EXPENSE" }));
      expect(repetida.ok).toBe(false);
      expect(repetida.message).toMatch(/Ya tenés/);
    });

    it("permite el mismo nombre en gasto y en ingreso, con slugs distintos", async () => {
      const gasto = await createCategoryAction(idle, formData({ name: "Alquiler", kind: "EXPENSE" }));
      const ingreso = await createCategoryAction(idle, formData({ name: "Alquiler", kind: "INCOME" }));
      expect([gasto.ok, ingreso.ok]).toEqual([true, true]);

      const ambas = await getDb().category.findMany({ where: { userId: ana.id, name: "Alquiler" } });
      expect(ambas).toHaveLength(2);
      expect(new Set(ambas.map((categoria) => categoria.slug)).size).toBe(2);
    });

    it("rechaza un nombre vacío de letras y no escribe nada", async () => {
      const antes = await getDb().category.count({ where: { userId: ana.id } });
      const state = await createCategoryAction(idle, formData({ name: "···", kind: "EXPENSE" }));
      expect(state.ok).toBe(false);
      expect(state.error?.field).toBe("name");
      expect(await getDb().category.count({ where: { userId: ana.id } })).toBe(antes);
    });

    it("rechaza un tipo que no es ni gasto ni ingreso", async () => {
      const state = await createCategoryAction(idle, formData({ name: "Traspaso", kind: "TRANSFER" }));
      expect(state.ok).toBe(false);
      expect(state.error?.field).toBe("kind");
    });
  });

  describe("renombrar", () => {
    it("cambia el nombre sin tocar el slug ni desenganchar los movimientos", async () => {
      const original = await getDb().category.findFirstOrThrow({ where: { userId: ana.id, slug: "food" } });
      const usoPrevio = await getDb().transaction.count({ where: { userId: ana.id, categoryId: original.id } });

      const state = await renameCategoryAction(idle, formData({ id: original.id, name: "Supermercado" }));
      expect(state.ok).toBe(true);

      const despues = await getDb().category.findUniqueOrThrow({ where: { id: original.id } });
      expect(despues.name).toBe("Supermercado");
      expect(despues.slug).toBe("food");
      expect(await getDb().transaction.count({ where: { userId: ana.id, categoryId: original.id } })).toBe(usoPrevio);
    });

    it("rechaza renombrar a un nombre que ya usa otra categoría del mismo tipo", async () => {
      const transporte = await getDb().category.findFirstOrThrow({ where: { userId: ana.id, slug: "transport" } });
      const state = await renameCategoryAction(idle, formData({ id: transporte.id, name: "Gimnasio" }));
      expect(state.ok).toBe(false);
      expect(state.error?.field).toBe("name");
    });

    it("no encuentra la categoría de otra persona", async () => {
      const ajena = await getDb().category.findFirstOrThrow({ where: { userId: beto.id, slug: "gym" } });
      const state = await renameCategoryAction(idle, formData({ id: ajena.id, name: "Robada" }));
      expect(state.ok).toBe(false);
      expect(state.message).toMatch(/inexistente/i);
      expect((await getDb().category.findUniqueOrThrow({ where: { id: ajena.id } })).name).toBe("Gimnasio");
    });
  });

  describe("archivar", () => {
    it("saca la categoría del selector sin tocar lo ya cargado", async () => {
      const padel = await getDb().category.findFirstOrThrow({ where: { userId: ana.id, slug: "padel" } });
      await getDb().transaction.create({
        data: {
          userId: ana.id,
          type: "EXPENSE",
          amountCents: 5_000n,
          occurredOn: new Date(`${todayInArgentina()}T00:00:00.000Z`),
          sourceAccountId: ana.accountId,
          categoryId: padel.id,
          idempotencyKey: `archivo-${padel.id}`,
          entries: { create: createPostings("EXPENSE", 5_000n, ana.accountId) },
        },
      });

      const state = await setCategoryStatusAction(idle, formData({ id: padel.id, archived: "true" }));
      expect(state.ok).toBe(true);

      const { categories } = await getMovementFormData(ana.id);
      expect(categories.some((categoria) => categoria.id === padel.id)).toBe(false);
      expect(await getDb().transaction.count({ where: { userId: ana.id, categoryId: padel.id } })).toBe(1);
    });

    it("la sigue ofreciendo al corregir el movimiento que ya la usaba", async () => {
      const padel = await getDb().category.findFirstOrThrow({ where: { userId: ana.id, slug: "padel" } });
      const { categories } = await getMovementFormData(ana.id, padel.id);
      expect(categories.some((categoria) => categoria.id === padel.id)).toBe(true);
    });

    it("reactiva y vuelve a ofrecerla", async () => {
      const padel = await getDb().category.findFirstOrThrow({ where: { userId: ana.id, slug: "padel" } });
      const state = await setCategoryStatusAction(idle, formData({ id: padel.id, archived: "false" }));
      expect(state.ok).toBe(true);

      const { categories } = await getMovementFormData(ana.id);
      expect(categories.some((categoria) => categoria.id === padel.id)).toBe(true);
    });

    it("no permite archivar la categoría de respaldo", async () => {
      const respaldo = await getDb().category.findFirstOrThrow({
        where: { userId: ana.id, slug: "other-expense" },
      });
      const state = await setCategoryStatusAction(idle, formData({ id: respaldo.id, archived: "true" }));
      expect(state.ok).toBe(false);
      expect((await getDb().category.findUniqueOrThrow({ where: { id: respaldo.id } })).archivedAt).toBeNull();
    });

    it("no archiva la categoría de otra persona", async () => {
      const ajena = await getDb().category.findFirstOrThrow({ where: { userId: beto.id, slug: "padel" } });
      const state = await setCategoryStatusAction(idle, formData({ id: ajena.id, archived: "true" }));
      expect(state.ok).toBe(false);
      expect((await getDb().category.findUniqueOrThrow({ where: { id: ajena.id } })).archivedAt).toBeNull();
    });
  });

  describe("catálogo", () => {
    it("cuenta el uso vigente de cada categoría y no cuenta lo ajeno", async () => {
      const catalogo = await getCategoryCatalog(ana.id);
      const comida = catalogo.find((categoria) => categoria.slug === "food");
      expect(comida?.movementCount).toBe(1);

      const beto2 = await getCategoryCatalog(beto.id);
      expect(beto2.every((categoria) => categoria.kind === "EXPENSE" || categoria.kind === "INCOME")).toBe(true);
      expect(beto2.find((categoria) => categoria.slug === "food")?.movementCount).toBe(1);
    });

    it("un movimiento anulado deja de contar", async () => {
      const gimnasio = await getDb().category.findFirstOrThrow({ where: { userId: ana.id, slug: "gym" } });
      const movimiento = await getDb().transaction.create({
        data: {
          userId: ana.id,
          type: "EXPENSE",
          amountCents: 7_000n,
          occurredOn: new Date(`${todayInArgentina()}T00:00:00.000Z`),
          sourceAccountId: ana.accountId,
          categoryId: gimnasio.id,
          idempotencyKey: `anulado-${gimnasio.id}`,
          entries: { create: createPostings("EXPENSE", 7_000n, ana.accountId) },
        },
      });
      expect((await getCategoryCatalog(ana.id)).find((c) => c.slug === "gym")?.movementCount).toBe(1);

      await getDb().transaction.update({
        where: { id: movimiento.id },
        data: { voidedAt: new Date(), voidReason: "prueba" },
      });
      expect((await getCategoryCatalog(ana.id)).find((c) => c.slug === "gym")?.movementCount).toBe(0);
    });
  });

  describe("categoría del pago previsto", () => {
    it("confirma el pago en la categoría prevista y no en el respaldo", async () => {
      const servicios = await getDb().category.findFirstOrThrow({ where: { userId: ana.id, slug: "services" } });
      const creado = await createUpcomingPaymentAction(
        idle,
        formData({
          concept: "Luz",
          amount: "10.000",
          dueOn: todayInArgentina(),
          plannedAccountId: ana.accountId,
          categoryId: servicios.id,
        }),
      );
      expect(creado.ok).toBe(true);

      const pago = await getDb().upcomingPayment.findFirstOrThrow({ where: { userId: ana.id, concept: "Luz" } });
      expect(pago.categoryId).toBe(servicios.id);

      const confirmado = await payUpcomingPaymentAction(
        idle,
        formData({ paymentId: pago.id, occurredOn: todayInArgentina(), amount: "10.000" }),
      );
      expect(confirmado.ok).toBe(true);

      const movimiento = await getDb().transaction.findFirstOrThrow({
        where: { userId: ana.id, id: confirmado.data!.transactionId! },
      });
      expect(movimiento.categoryId).toBe(servicios.id);
    });

    it("lo elegido al confirmar manda sobre lo previsto", async () => {
      const servicios = await getDb().category.findFirstOrThrow({ where: { userId: ana.id, slug: "services" } });
      const compras = await getDb().category.findFirstOrThrow({ where: { userId: ana.id, slug: "shopping" } });
      const pago = await getDb().upcomingPayment.create({
        data: {
          userId: ana.id,
          concept: "Internet",
          estimatedCents: 20_000n,
          dueOn: new Date(`${todayInArgentina()}T00:00:00.000Z`),
          plannedAccountId: ana.accountId,
          categoryId: servicios.id,
        },
      });

      const confirmado = await payUpcomingPaymentAction(
        idle,
        formData({
          paymentId: pago.id,
          occurredOn: todayInArgentina(),
          amount: "20.000",
          categoryId: compras.id,
        }),
      );
      expect(confirmado.ok).toBe(true);

      const movimiento = await getDb().transaction.findFirstOrThrow({
        where: { id: confirmado.data!.transactionId! },
      });
      expect(movimiento.categoryId).toBe(compras.id);
    });

    it("un pago sin categoría sigue cayendo en la de respaldo", async () => {
      const pago = await getDb().upcomingPayment.create({
        data: {
          userId: ana.id,
          concept: "Expensas",
          estimatedCents: 30_000n,
          dueOn: new Date(`${todayInArgentina()}T00:00:00.000Z`),
          plannedAccountId: ana.accountId,
        },
      });

      const confirmado = await payUpcomingPaymentAction(
        idle,
        formData({ paymentId: pago.id, occurredOn: todayInArgentina(), amount: "30.000" }),
      );
      expect(confirmado.ok).toBe(true);

      const movimiento = await getDb().transaction.findFirstOrThrow({
        where: { id: confirmado.data!.transactionId! },
      });
      const respaldo = await getDb().category.findFirstOrThrow({
        where: { userId: ana.id, slug: "other-expense" },
      });
      expect(movimiento.categoryId).toBe(respaldo.id);
    });

    it("rechaza una categoría de ingreso al prever un pago", async () => {
      const sueldo = await getDb().category.findFirstOrThrow({ where: { userId: ana.id, slug: "salary" } });
      const state = await createUpcomingPaymentAction(
        idle,
        formData({
          concept: "Cuota",
          amount: "5.000",
          dueOn: todayInArgentina(),
          plannedAccountId: ana.accountId,
          categoryId: sueldo.id,
        }),
      );
      expect(state.ok).toBe(false);
      expect(state.error?.field).toBe("categoryId");
      expect(await getDb().upcomingPayment.count({ where: { userId: ana.id, concept: "Cuota" } })).toBe(0);
    });

    it("no acepta la categoría de otra persona al prever un pago", async () => {
      const ajena = await getDb().category.findFirstOrThrow({ where: { userId: beto.id, slug: "services" } });
      const state = await createUpcomingPaymentAction(
        idle,
        formData({
          concept: "Cable",
          amount: "5.000",
          dueOn: todayInArgentina(),
          plannedAccountId: ana.accountId,
          categoryId: ajena.id,
        }),
      );
      expect(state.ok).toBe(false);
      expect(await getDb().upcomingPayment.count({ where: { userId: ana.id, concept: "Cable" } })).toBe(0);
    });
  });

  describe("cargar un movimiento con una categoría propia", () => {
    it("registra el gasto en la categoría recién creada", async () => {
      await createCategoryAction(idle, formData({ name: "Veterinaria", kind: "EXPENSE" }));
      const veterinaria = await getDb().category.findFirstOrThrow({
        where: { userId: ana.id, name: "Veterinaria" },
      });

      const state = await createMovementAction(
        idle,
        formData({
          type: "EXPENSE",
          amount: "8.500",
          occurredOn: todayInArgentina(),
          sourceAccountId: ana.accountId,
          categoryId: veterinaria.id,
          description: "Vacuna",
          idempotencyKey: `vet-${veterinaria.id}`,
        }),
      );
      expect(state.ok).toBe(true);

      const movimiento = await getDb().transaction.findFirstOrThrow({
        where: { userId: ana.id, description: "Vacuna" },
      });
      expect(movimiento.categoryId).toBe(veterinaria.id);
    });
  });
});
