import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { randomUUID } from "node:crypto";
import { createTestUser, deleteTestUser, hasDatabase, type TestUser } from "../../test/fixtures";
import { todayInArgentina } from "../../lib/finance/domain";

/**
 * /en-que-se-fue, de punta a punta contra una base real.
 *
 * Verifica lo que el cálculo puro no puede: que la pantalla lea del ledger de
 * verdad, que las transferencias no se cuelen en el total, y que un gasto que se
 * repite todos los meses aparezca como tal.
 */

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

const { getSpendingModel } = await import("./data/getSpendingModel");
const { getDb } = await import("../../lib/db");

/** Mes en curso: el reporte abre siempre en el mes que la persona está viviendo. */
const MONTH = todayInArgentina().slice(0, 7);
const day = (dayOfMonth: number) => `${MONTH}-${String(dayOfMonth).padStart(2, "0")}`;

/** Mes N meses antes del actual, para sembrar historia de recurrencia. */
function monthsAgo(count: number): string {
  const [year, month] = MONTH.split("-").map(Number) as [number, number];
  const date = new Date(Date.UTC(year, month - 1 - count, 1));
  return date.toISOString().slice(0, 7);
}

describe.skipIf(!hasDatabase)("en qué se fue la plata", () => {
  let usuario: TestUser;
  let vecino: TestUser;
  let comida: string;
  let alquiler: string;

  const gasto = async (
    userId: string,
    accountId: string,
    categoryId: string,
    amountCents: bigint,
    occurredOn: string,
    description: string,
  ) => {
    await getDb().transaction.create({
      data: {
        userId,
        type: "EXPENSE",
        amountCents,
        currency: "ARS",
        occurredOn: new Date(`${occurredOn}T00:00:00.000Z`),
        description,
        sourceAccountId: accountId,
        categoryId,
        idempotencyKey: `spending-${randomUUID()}`,
        entries: { create: [{ accountId, amountCents: -amountCents }] },
      },
    });
  };

  beforeAll(async () => {
    usuario = await createTestUser("gasto");
    vecino = await createTestUser("gasto-vecino");

    comida = (await getDb().category.findFirstOrThrow({ where: { userId: usuario.id, slug: "food" } })).id;
    const rent = await getDb().category.findFirst({ where: { userId: usuario.id, slug: "rent" } });
    alquiler = rent?.id ?? comida;

    // Gastos del mes en curso.
    await gasto(usuario.id, usuario.accountId, comida, 30_000n, day(5), "Coto");
    await gasto(usuario.id, usuario.accountId, comida, 20_000n, day(12), "Dia");
    await gasto(usuario.id, usuario.secondAccountId, alquiler, 500_000n, day(1), "Alquiler");

    // Una transferencia entre cuentas propias: no es gasto.
    await getDb().transaction.create({
      data: {
        userId: usuario.id,
        type: "TRANSFER",
        amountCents: 900_000n,
        currency: "ARS",
        occurredOn: new Date(`${day(3)}T00:00:00.000Z`),
        description: "Paso a ahorro",
        sourceAccountId: usuario.accountId,
        destinationAccountId: usuario.secondAccountId,
        idempotencyKey: `spending-${randomUUID()}`,
        entries: {
          create: [
            { accountId: usuario.accountId, amountCents: -900_000n },
            { accountId: usuario.secondAccountId, amountCents: 900_000n },
          ],
        },
      },
    });

    // Un gasto anulado.
    const anulado = await getDb().transaction.create({
      data: {
        userId: usuario.id,
        type: "EXPENSE",
        amountCents: 700_000n,
        currency: "ARS",
        occurredOn: new Date(`${day(7)}T00:00:00.000Z`),
        description: "Cargado por error",
        sourceAccountId: usuario.accountId,
        categoryId: comida,
        idempotencyKey: `spending-${randomUUID()}`,
        entries: { create: [{ accountId: usuario.accountId, amountCents: -700_000n }] },
      },
    });
    await getDb().transaction.update({
      where: { id: anulado.id },
      data: { voidedAt: new Date(), voidReason: "prueba" },
    });

    // Suscripción con cadencia mensual, sembrada hacia atrás.
    for (const back of [1, 2, 3]) {
      await gasto(usuario.id, usuario.accountId, comida, 39_990n, `${monthsAgo(back)}-06`, "Spotify");
    }
    await gasto(usuario.id, usuario.accountId, comida, 39_990n, day(6), "Spotify");

    // Y un gasto del mes anterior, para que exista comparación.
    await gasto(usuario.id, usuario.accountId, comida, 10_000n, `${monthsAgo(1)}-15`, "Kiosco");
  });

  afterAll(async () => {
    await deleteTestUser(usuario.id);
    await deleteTestUser(vecino.id);
  });

  it("suma sólo los gastos del mes", async () => {
    const model = await getSpendingModel(usuario.id, MONTH);
    // Los cuatro gastos sembrados acá —$300 + $200 + $5.000 + $399,90— más el
    // que trae el propio fixture del usuario de prueba, de $123,45.
    expect(model.headline.amount).toBe("6.023,35");
    expect(model.empty).toBe(false);
  });

  /**
   * Contar la transferencia habría inflado el total en 900.000 con plata que
   * sigue estando. Es el error que hace que la gente desconfíe del reporte.
   */
  it("la transferencia entre cuentas propias no aparece en ningún corte", async () => {
    const model = await getSpendingModel(usuario.id, MONTH);
    const etiquetas = model.breakdowns.flatMap((breakdown) => breakdown.rows.map((row) => row.label));
    expect(etiquetas).not.toContain("Paso a ahorro");
    expect(model.rail.items).toContain("Sin transferencias ni anulados");
  });

  it("el gasto anulado tampoco", async () => {
    const model = await getSpendingModel(usuario.id, MONTH);
    const etiquetas = model.breakdowns.flatMap((breakdown) => breakdown.rows.map((row) => row.label));
    expect(etiquetas).not.toContain("Cargado por error");
  });

  it("desglosa por categoría, comercio y medio de pago", async () => {
    const model = await getSpendingModel(usuario.id, MONTH);
    expect(model.breakdowns.map((breakdown) => breakdown.id)).toEqual(["category", "merchant", "account"]);

    const comercios = model.breakdowns.find((breakdown) => breakdown.id === "merchant")!;
    expect(comercios.rows[0]?.label).toBe("Alquiler");
    expect(comercios.rows.map((row) => row.label)).toContain("Spotify");

    const cuentas = model.breakdowns.find((breakdown) => breakdown.id === "account")!;
    expect(cuentas.rows).toHaveLength(2);
  });

  it("cada fila enlaza a los movimientos que la componen", async () => {
    const model = await getSpendingModel(usuario.id, MONTH);
    const categorias = model.breakdowns.find((breakdown) => breakdown.id === "category")!;
    expect(categorias.rows[0]?.href).toContain("/movimientos?month=");
    expect(categorias.rows[0]?.href).toContain("categoryId=");
  });

  it("compara contra el mes anterior en la frase principal", async () => {
    const model = await getSpendingModel(usuario.id, MONTH);
    expect(model.headline.comparison).toContain("más que el mes anterior");
  });

  /**
   * La razón de mirar una ventana de varios meses: dentro del mes en curso,
   * Spotify aparece una sola vez y no habría nada que reconocer.
   */
  it("reconoce la suscripción mensual mirando hacia atrás", async () => {
    const model = await getSpendingModel(usuario.id, MONTH);
    const spotify = model.recurring.rows.find((row) => row.label === "Spotify");
    expect(spotify).toBeDefined();
    expect(spotify?.amount).toBe("399,90");
    expect(spotify?.detail).toContain("Todos los meses");
    expect(model.recurring.headline).toContain("ya están comprometidos");
  });

  it("ofrece los meses con historia, del más nuevo al más viejo", async () => {
    const model = await getSpendingModel(usuario.id, MONTH);
    expect(model.months[0]?.month).toBe(MONTH);
    expect(model.months[0]?.current).toBe(true);
    expect(model.months.length).toBeGreaterThan(1);
  });

  it("un mes sin gastos se declara vacío en vez de mostrar ceros", async () => {
    const model = await getSpendingModel(usuario.id, "2020-01");
    expect(model.empty).toBe(true);
    expect(model.headline.stateText).toContain("Todavía no hay gastos");
  });

  /** El aislamiento entre usuarios también rige acá. */
  it("no cruza los gastos de otra persona", async () => {
    const model = await getSpendingModel(vecino.id, MONTH);
    const etiquetas = model.breakdowns.flatMap((breakdown) => breakdown.rows.map((row) => row.label));
    expect(etiquetas).not.toContain("Alquiler");
    expect(etiquetas).not.toContain("Spotify");
  });

  it("un mes inválido en la URL cae al mes en curso en vez de romper", async () => {
    const model = await getSpendingModel(usuario.id, "no-es-un-mes");
    expect(model.months.find((month) => month.current)?.month).toBe(MONTH);
  });
});
