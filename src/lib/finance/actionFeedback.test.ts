import { describe, expect, it } from "vitest";
import { successForCorrection, successForMovement, successForVoid, transferSummary } from "./actionFeedback";
import { FinanceError, financeError, toSafeError } from "./errors";

describe("éxitos con datos reales", () => {
  it("un gasto nombra el importe y la cuenta de donde salió", () => {
    const feedback = successForMovement({
      type: "EXPENSE",
      amountCents: 1_850_000n,
      sourceAccountName: "Mercado Pago",
    });
    expect(feedback.message).toBe("Gasto registrado.");
    expect(feedback.detail).toBe("Salieron $18.500 de Mercado Pago.");
  });

  it("un ingreso nombra dónde entró", () => {
    const feedback = successForMovement({
      type: "INCOME",
      amountCents: 8_000_000n,
      sourceAccountName: "Banco",
    });
    expect(feedback.message).toBe("Ingreso registrado.");
    expect(feedback.detail).toBe("Entraron $80.000 en Banco.");
  });

  it("una transferencia explica que el patrimonio no cambia", () => {
    const feedback = successForMovement({
      type: "TRANSFER",
      amountCents: 5_000_000n,
      sourceAccountName: "Banco",
      destinationAccountName: "Efectivo",
    });
    expect(feedback.message).toBe("Transferencia completada.");
    expect(feedback.detail).toBe("$50.000 pasaron de Banco a Efectivo. Tu patrimonio total no cambió.");
  });

  it("la corrección aclara que el anterior sigue disponible", () => {
    expect(successForCorrection()).toEqual({
      message: "Corrección guardada.",
      detail: "El movimiento anterior permanece disponible en el historial.",
    });
  });

  it("la anulación no dice eliminar ni borrar", () => {
    const feedback = successForVoid();
    expect(feedback.message).toBe("Movimiento anulado.");
    expect(feedback.detail).toBe("Ya no afecta tus saldos, pero continúa en el historial.");
    const copy = `${feedback.message} ${feedback.detail}`.toLowerCase();
    for (const forbidden of ["eliminar", "borrar", "quitar definitivamente"]) {
      expect(copy).not.toContain(forbidden);
    }
  });

  it("ningún éxito usa copy genérico sin importe", () => {
    const feedback = successForMovement({ type: "EXPENSE", amountCents: 100n, sourceAccountName: "Efectivo" });
    expect(feedback.detail).toContain("$1");
    expect(feedback.detail).toContain("Efectivo");
  });
});

describe("resumen de transferencia antes de confirmar", () => {
  it("dice de dónde sale, dónde entra, cuánto y qué pasa con el patrimonio", () => {
    expect(transferSummary(5_000_000n, "Banco", "Efectivo")).toEqual([
      "Sale de Banco",
      "Entra en Efectivo",
      "Importe $50.000",
      "Tu patrimonio total no cambia.",
    ]);
  });

  it("tolera datos incompletos sin inventar valores", () => {
    expect(transferSummary(null, "", "")).toEqual([
      "Sale de —",
      "Entra en —",
      "Importe —",
      "Tu patrimonio total no cambia.",
    ]);
  });
});

describe("errores que llegan a pantalla", () => {
  it("un error propio conserva código, campo y mensaje", () => {
    const safe = toSafeError(financeError("category-required", "Seleccioná una categoría.", "categoryId"));
    expect(safe).toEqual({ code: "category-required", message: "Seleccioná una categoría.", field: "categoryId" });
  });

  it("un error de base nunca expone su interior", () => {
    const prismaLike = Object.assign(new Error("Invalid `db.transaction.create()` invocation: constraint failed"), {
      code: "P2002",
      stack: "at PrismaClient...",
    });
    const safe = toSafeError(prismaLike);
    expect(safe.code).toBe("unexpected");
    expect(safe.message).not.toContain("Prisma");
    expect(safe.message).not.toContain("db.transaction");
    expect(safe.message).not.toContain("constraint");
    expect(safe.message).not.toContain("P2002");
  });

  it("el mensaje genérico avisa que los datos siguen ahí", () => {
    expect(toSafeError(new Error("cualquier cosa")).message).toContain("Los datos que escribiste siguen acá");
  });

  it("cualquier valor lanzado es tolerado", () => {
    expect(toSafeError("string suelto").code).toBe("unexpected");
    expect(toSafeError(null).code).toBe("unexpected");
    expect(toSafeError(undefined).code).toBe("unexpected");
  });

  it("FinanceError sin campo no inventa uno", () => {
    expect(toSafeError(new FinanceError("stale-form", "Recargá el formulario antes de guardar.")).field).toBeUndefined();
  });
});
