import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { createTestUser, deleteTestUser, formData, hasDatabase, type TestUser } from "../../test/fixtures";

/**
 * El ciclo completo de una importación, contra una base real.
 *
 * Lo que se prueba no es el parser —eso ya está cubierto en las pruebas puras—
 * sino las tres promesas que la pantalla le hace a la persona: que
 * previsualizar **no escribe nada**, que confirmar entra **completo o nada**, y
 * que deshacer **anula sin borrar**.
 *
 * Las tres son promesas sobre su plata. Si alguna se rompe, el importador es
 * peor que no tenerlo: cargar a mano al menos no miente.
 */

const currentUserId = { value: "" };

vi.mock("next/cache", () => ({ revalidatePath: () => undefined }));

vi.mock("../auth/guards", async () => {
  const actual = await vi.importActual<typeof import("../auth/guards")>("../auth/guards");
  const { getDb } = await import("../db");
  return {
    ...actual,
    requireOnboardedUserForAction: async () => {
      if (!currentUserId.value) throw new actual.UnauthorizedError();
      return getDb().user.findUniqueOrThrow({ where: { id: currentUserId.value } });
    },
  };
});

const { commitImportAction, previewImportAction, revertImportAction } = await import("../../app/importar/actions");
const { getAccountsWithBalances } = await import("../finance/data");
const { getDb } = await import("../db");

const previewIdle = { ok: false, message: "" };
const commitIdle = { ok: false, message: "" };

/** Un extracto bancario típico: punto y coma, importes argentinos, encabezado. */
const EXTRACTO = [
  "Banco Ejemplo S.A.",
  "Cuenta 0123456789",
  "Fecha;Descripcion;Importe",
  "05/08/2026;COMPRA EN COTO CICSA 0345;-12.500,00",
  "06/08/2026;MERPAGO*SPOTIFY;-3.999,00",
  "07/08/2026;SUELDO AGOSTO;850.000,00",
  "08/08/2026;;-1.000,00",
  "09/08/2026;SHELL 1234;no disponible",
].join("\r\n");

const upload = (contents: string, name = "extracto.csv") =>
  new File([new TextEncoder().encode(contents)], name, { type: "text/csv" });

const balanceOf = async (userId: string, accountId: string) =>
  (await getAccountsWithBalances(userId)).find((account) => account.id === accountId)!.balanceCents;

describe.skipIf(!hasDatabase)("importación de un resumen", () => {
  let usuario: TestUser;
  let cuenta: string;

  beforeAll(async () => {
    usuario = await createTestUser("importacion");
    currentUserId.value = usuario.id;
    cuenta = usuario.accountId;
  });

  afterAll(async () => {
    await getDb().importRow.deleteMany({ where: { userId: usuario.id } });
    await getDb().importBatch.deleteMany({ where: { userId: usuario.id } });
    await deleteTestUser(usuario.id);
  });

  describe("previsualizar", () => {
    it("lee el archivo y propone los movimientos", async () => {
      const result = await previewImportAction(
        previewIdle,
        formData({ accountId: cuenta }, { file: upload(EXTRACTO) }),
      );

      expect(result.ok).toBe(true);
      const plan = result.preview!.plan;
      expect(plan.rows).toHaveLength(5);
      expect(plan.usableCount).toBe(3);
      expect(plan.expenseCents).toBe(1_649_900n);
      expect(plan.incomeCents).toBe(85_000_000n);
      expect(plan.rows[0]?.merchant).toBe("Coto Cicsa");
      expect(plan.rows[1]?.processor).toBe("Mercado Pago");
    });

    /**
     * La promesa que hace usable al importador: se puede subir el archivo,
     * mirar, corregir y volver a mirar sin ninguna consecuencia.
     */
    it("no escribe absolutamente nada", async () => {
      const movimientosAntes = await getDb().transaction.count({ where: { userId: usuario.id } });
      const lotesAntes = await getDb().importBatch.count({ where: { userId: usuario.id } });
      const saldoAntes = await balanceOf(usuario.id, cuenta);

      await previewImportAction(previewIdle, formData({ accountId: cuenta }, { file: upload(EXTRACTO) }));

      expect(await getDb().transaction.count({ where: { userId: usuario.id } })).toBe(movimientosAntes);
      expect(await getDb().importBatch.count({ where: { userId: usuario.id } })).toBe(lotesAntes);
      expect(await balanceOf(usuario.id, cuenta)).toBe(saldoAntes);
    });

    it("declara cada fila que no se puede usar, con su motivo", async () => {
      const result = await previewImportAction(
        previewIdle,
        formData({ accountId: cuenta }, { file: upload(EXTRACTO) }),
      );
      const rows = result.preview!.plan.rows;
      expect(rows[3]?.issues).toContain("description-missing");
      expect(rows[4]?.issues).toContain("amount-invalid");
    });

    it("una cuenta ajena no se puede usar como destino", async () => {
      const vecino = await createTestUser("importacion-vecino");
      try {
        const result = await previewImportAction(
          previewIdle,
          formData({ accountId: vecino.accountId }, { file: upload(EXTRACTO) }),
        );
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe("account-unavailable");
      } finally {
        await deleteTestUser(vecino.id);
      }
    });

    it("sin archivo lo pide en vez de fallar de forma genérica", async () => {
      const result = await previewImportAction(previewIdle, formData({ accountId: cuenta }));
      expect(result.ok).toBe(false);
      expect(result.error?.field).toBe("file");
    });
  });

  describe("confirmar", () => {
    let batchId: string;

    it("crea los movimientos y ajusta el saldo", async () => {
      const preview = await previewImportAction(
        previewIdle,
        formData({ accountId: cuenta }, { file: upload(EXTRACTO) }),
      );
      const data = preview.preview!;
      const saldoAntes = await balanceOf(usuario.id, cuenta);

      const result = await commitImportAction(
        commitIdle,
        formData({
          accountId: cuenta,
          payload: data.payload,
          fileName: data.fileName,
          settings: JSON.stringify(data.settings),
        }),
      );

      expect(result.ok).toBe(true);
      batchId = result.batchId!;
      // 850.000 de sueldo menos 12.500 y 3.999 de gastos.
      expect(await balanceOf(usuario.id, cuenta)).toBe(saldoAntes + 85_000_000n - 1_649_900n);
    });

    /**
     * Una fila descartada en silencio es un movimiento que la persona cree tener
     * y no tiene, y no hay forma de descubrirlo después.
     */
    it("guarda todas las filas, incluidas las que no se pudieron usar", async () => {
      const rows = await getDb().importRow.findMany({
        where: { batchId },
        orderBy: { sourceRowNumber: "asc" },
      });
      expect(rows).toHaveLength(5);
      expect(rows.filter((row) => row.transactionId !== null)).toHaveLength(3);
      // La evidencia original queda guardada tal cual vino.
      expect(JSON.parse(rows[0]!.rawJson)).toEqual(["05/08/2026", "COMPRA EN COTO CICSA 0345", "-12.500,00"]);
    });

    it("guarda el comercio normalizado como descripción del movimiento", async () => {
      const movimiento = await getDb().transaction.findFirstOrThrow({
        where: { userId: usuario.id, idempotencyKey: `import:${batchId}:1` },
      });
      expect(movimiento.description).toBe("Coto Cicsa");
      expect(movimiento.type).toBe("EXPENSE");
      expect(movimiento.amountCents).toBe(1_250_000n);
    });

    /**
     * El mismo archivo dos veces no puede duplicar: la segunda lectura reconoce
     * lo que ya está en el ledger y no queda nada por importar.
     */
    it("reimportar el mismo archivo no duplica nada", async () => {
      const preview = await previewImportAction(
        previewIdle,
        formData({ accountId: cuenta }, { file: upload(EXTRACTO) }),
      );
      expect(preview.preview!.alreadyImported).toBe(true);
      expect(preview.preview!.plan.usableCount).toBe(0);
      expect(preview.preview!.plan.duplicateCount).toBe(3);

      const result = await commitImportAction(
        commitIdle,
        formData({
          accountId: cuenta,
          payload: preview.preview!.payload,
          fileName: preview.preview!.fileName,
          settings: JSON.stringify(preview.preview!.settings),
        }),
      );
      expect(result.ok).toBe(false);
      expect(result.error?.code).toBe("nothing-to-import");
    });

    describe("deshacer", () => {
      it("anula los movimientos y devuelve el saldo", async () => {
        const saldoConImport = await balanceOf(usuario.id, cuenta);

        const result = await revertImportAction(commitIdle, formData({ batchId }));
        expect(result.ok).toBe(true);

        const saldoDespues = await balanceOf(usuario.id, cuenta);
        expect(saldoDespues).toBe(saldoConImport - 85_000_000n + 1_649_900n);
      });

      /**
       * Anula, no borra. El ledger conserva lo anulado visible y fuera de los
       * saldos; un import revertido no puede ser la excepción que abra la puerta
       * al borrado físico.
       */
      it("los movimientos siguen existiendo, marcados como anulados", async () => {
        const movimientos = await getDb().transaction.findMany({
          where: { userId: usuario.id, idempotencyKey: { startsWith: `import:${batchId}:` } },
        });
        expect(movimientos).toHaveLength(3);
        expect(movimientos.every((movimiento) => movimiento.voidedAt !== null)).toBe(true);
        expect(movimientos.every((movimiento) => movimiento.voidReason?.includes("extracto.csv"))).toBe(true);
      });

      it("el lote queda marcado como deshecho", async () => {
        const batch = await getDb().importBatch.findUniqueOrThrow({ where: { id: batchId } });
        expect(batch.status).toBe("REVERTED");
        expect(batch.revertedAt).not.toBeNull();
      });

      it("deshacer dos veces no vuelve a anular nada", async () => {
        const result = await revertImportAction(commitIdle, formData({ batchId }));
        expect(result.ok).toBe(false);
        expect(result.error?.code).toBe("batch-not-committed");
      });

      it("un lote ajeno no se puede deshacer", async () => {
        const vecino = await createTestUser("importacion-ajeno");
        const previo = currentUserId.value;
        try {
          currentUserId.value = vecino.id;
          const result = await revertImportAction(commitIdle, formData({ batchId }));
          expect(result.ok).toBe(false);
          expect(result.error?.code).toBe("batch-missing");
        } finally {
          currentUserId.value = previo;
          await deleteTestUser(vecino.id);
        }
      });
    });
  });
});
