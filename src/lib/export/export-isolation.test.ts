import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { getDb } from "../db";
import { createPostings } from "../finance/domain";
import { createFinancialExport, datasetRows, type FinancialExportSnapshot } from "./data";
import { toSemicolonCsv, type ExportDataset } from "./format";
import { createTestUser, deleteTestUser, hasDatabase, type TestUser } from "../../test/fixtures";

/**
 * Aislamiento de la copia de datos.
 *
 * Prueba bloqueante y deliberadamente ejecutable, no un grep: `createFinancialExport`
 * nació en la etapa de un solo usuario con las cinco consultas sin filtro, y con
 * una sola persona en la base daba exactamente el mismo resultado que la versión
 * correcta. Una revisión de texto no distingue esos dos mundos; dos usuarios con
 * datos distintos, sí.
 *
 * Si alguien vuelve a dejar una consulta global en el módulo de exportaciones,
 * acá aparece una fila ajena y esto se pone en rojo.
 */

/** Marca única por usuario: si aparece del otro lado, hubo fuga. */
interface Marked {
  user: TestUser;
  mark: string;
  categoryId: string;
  categoryName: string;
  transferId: string;
  voidedId: string;
}

async function markUser(label: string): Promise<Marked> {
  const db = getDb();
  const user = await createTestUser(label);
  const mark = `${label}-${randomUUID().slice(0, 8)}`;

  // Categoría propia con nombre irrepetible: el catálogo por omisión comparte
  // nombres entre usuarios y no serviría para detectar una fuga.
  const category = await db.category.create({
    data: { userId: user.id, name: `Categoria ${mark}`, slug: `cat-${mark}`, kind: "EXPENSE" },
  });

  const transfer = await db.transaction.create({
    data: {
      userId: user.id,
      type: "TRANSFER",
      amountCents: 7_777n,
      occurredOn: new Date("2026-07-12T00:00:00.000Z"),
      description: `Transferencia ${mark}`,
      sourceAccountId: user.accountId,
      destinationAccountId: user.secondAccountId,
      idempotencyKey: `transfer-${mark}`,
      entries: { create: createPostings("TRANSFER", 7_777n, user.accountId, user.secondAccountId) },
    },
  });

  const voided = await db.transaction.create({
    data: {
      userId: user.id,
      type: "EXPENSE",
      amountCents: 4_444n,
      occurredOn: new Date("2026-07-14T00:00:00.000Z"),
      description: `Anulado ${mark}`,
      sourceAccountId: user.accountId,
      categoryId: category.id,
      idempotencyKey: `voided-${mark}`,
      voidedAt: new Date("2026-07-15T00:00:00.000Z"),
      voidReason: "cargado por error",
      entries: { create: createPostings("EXPENSE", 4_444n, user.accountId) },
    },
  });

  await db.upcomingPayment.create({
    data: {
      userId: user.id,
      concept: `Servicio ${mark}`,
      estimatedCents: 55_000n,
      dueOn: new Date("2026-08-05T00:00:00.000Z"),
      plannedAccountId: user.secondAccountId,
    },
  });

  await db.investment.create({
    data: {
      userId: user.id,
      name: `Fondo ${mark}`,
      kind: "FUND",
      investedCents: 900_000n,
      currentValueCents: 950_000n,
    },
  });

  return {
    user,
    mark,
    categoryId: category.id,
    categoryName: category.name,
    transferId: transfer.id,
    voidedId: voided.id,
  };
}

/** Todo el texto del snapshot, para buscar marcas ajenas sin recorrer campo por campo. */
const flatten = (snapshot: FinancialExportSnapshot): string => JSON.stringify(snapshot);

const DATASETS: ExportDataset[] = ["movimientos", "cuentas", "proximos-pagos", "inversiones"];

describe.skipIf(!hasDatabase)("aislamiento de la copia de datos entre usuarios", () => {
  let a: Marked;
  let b: Marked;
  let exportA: FinancialExportSnapshot;
  let exportB: FinancialExportSnapshot;

  beforeAll(async () => {
    // En serie: los slugs de categoría son únicos por usuario y crear en
    // paralelo hace más ruido que velocidad gana.
    a = await markUser("aurora");
    b = await markUser("bruno");
    exportA = await createFinancialExport(a.user.id);
    exportB = await createFinancialExport(b.user.id);
  });

  afterAll(async () => {
    await deleteTestUser(a.user.id);
    await deleteTestUser(b.user.id);
  });

  it("cada copia trae exactamente las cuentas de su dueño", () => {
    expect(exportA.accounts).toHaveLength(2);
    expect(exportB.accounts).toHaveLength(2);

    const idsA = exportA.accounts.map((account) => account.id);
    expect(idsA).toEqual(expect.arrayContaining([a.user.accountId, a.user.secondAccountId]));
    expect(idsA).not.toContain(b.user.accountId);
    expect(idsA).not.toContain(b.user.secondAccountId);

    const idsB = exportB.accounts.map((account) => account.id);
    expect(idsB).toEqual(expect.arrayContaining([b.user.accountId, b.user.secondAccountId]));
    expect(idsB).not.toContain(a.user.accountId);
    expect(idsB).not.toContain(a.user.secondAccountId);
  });

  it("los movimientos no cruzan, ni los anulados ni las transferencias", () => {
    const idsA = exportA.movements.map((movement) => movement.id);
    const idsB = exportB.movements.map((movement) => movement.id);

    expect(idsA).toEqual(expect.arrayContaining([a.user.transactionId, a.transferId, a.voidedId]));
    expect(idsA).not.toContain(b.user.transactionId);
    expect(idsA).not.toContain(b.transferId);
    expect(idsA).not.toContain(b.voidedId);

    expect(idsB).toEqual(expect.arrayContaining([b.user.transactionId, b.transferId, b.voidedId]));
    expect(idsB).not.toContain(a.user.transactionId);
    expect(idsB).not.toContain(a.transferId);
    expect(idsB).not.toContain(a.voidedId);
  });

  it("las inversiones no cruzan", () => {
    expect(exportA.investments).toHaveLength(2);
    expect(exportA.investments.map((item) => item.name).join(" ")).toContain(a.mark);
    expect(exportA.investments.map((item) => item.name).join(" ")).not.toContain(b.mark);

    expect(exportB.investments).toHaveLength(2);
    expect(exportB.investments.map((item) => item.name).join(" ")).not.toContain(a.mark);
  });

  it("los próximos pagos no cruzan", () => {
    expect(exportA.upcomingPayments).toHaveLength(2);
    expect(exportA.upcomingPayments.map((payment) => payment.concept).join(" ")).not.toContain(b.mark);
    expect(exportB.upcomingPayments.map((payment) => payment.concept).join(" ")).not.toContain(a.mark);
  });

  it("las categorías privadas del otro no aparecen en ningún movimiento", () => {
    const categoriasA = exportA.movements.map((movement) => movement.category);
    expect(categoriasA).toContain(a.categoryName);
    expect(categoriasA).not.toContain(b.categoryName);

    const categoriasB = exportB.movements.map((movement) => movement.category);
    expect(categoriasB).toContain(b.categoryName);
    expect(categoriasB).not.toContain(a.categoryName);
  });

  it("ninguna marca del otro usuario sobrevive en ningún campo del snapshot", () => {
    expect(flatten(exportA)).not.toContain(b.mark);
    expect(flatten(exportB)).not.toContain(a.mark);
  });

  it("los saldos se calculan sólo con asientos propios", () => {
    // Las dos personas nacen con los mismos saldos iniciales y movimientos
    // equivalentes: si una consulta sumara asientos ajenos, los totales se
    // dispararían y dejarían de coincidir entre sí.
    const totalA = exportA.accounts.reduce((sum, account) => sum + BigInt(account.currentBalanceCents), 0n);
    const totalB = exportB.accounts.reduce((sum, account) => sum + BigInt(account.currentBalanceCents), 0n);
    expect(totalA).toBe(totalB);

    // 150.000 iniciales − 12.345 del gasto sembrado − 4.444 no, que está anulado.
    // La transferencia no mueve el patrimonio: sale de una cuenta y entra en otra.
    expect(totalA).toBe(150_000n - 12_345n);
  });

  it("los cuatro CSV preservan el aislamiento", () => {
    const markers: Record<ExportDataset, { own: string; foreign: string }> = {
      movimientos: { own: a.mark, foreign: b.mark },
      cuentas: { own: a.user.accountId, foreign: b.user.accountId },
      "proximos-pagos": { own: a.mark, foreign: b.mark },
      inversiones: { own: a.mark, foreign: b.mark },
    };

    for (const dataset of DATASETS) {
      const propio = datasetRows(exportA, dataset);
      const csv = toSemicolonCsv(propio.headers, propio.rows);
      expect(csv, dataset).toContain(markers[dataset].own);
      expect(csv, dataset).not.toContain(markers[dataset].foreign);
    }
  });

  it("un usuario sin datos recibe una copia vacía, no la de otro", async () => {
    const nuevo = await createTestUser("recien-llegada");
    try {
      await getDb().ledgerEntry.deleteMany({ where: { userId: nuevo.id } });
      await getDb().upcomingPayment.deleteMany({ where: { userId: nuevo.id } });
      await getDb().transaction.deleteMany({ where: { userId: nuevo.id } });
      await getDb().investment.deleteMany({ where: { userId: nuevo.id } });
      await getDb().account.deleteMany({ where: { userId: nuevo.id } });

      const vacio = await createFinancialExport(nuevo.id);
      expect(vacio.accounts).toHaveLength(0);
      expect(vacio.movements).toHaveLength(0);
      expect(vacio.investments).toHaveLength(0);
      expect(vacio.upcomingPayments).toHaveLength(0);
      expect(flatten(vacio)).not.toContain(a.mark);
      expect(flatten(vacio)).not.toContain(b.mark);
    } finally {
      await deleteTestUser(nuevo.id);
    }
  });
});
