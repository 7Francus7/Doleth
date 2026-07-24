import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { applyPostings, createPostings, summarizeMonth } from "../lib/finance/domain";

const root = process.cwd();
const read = (rel: string) => readFileSync(join(root, rel), "utf8");

describe("ledger intacto: la transferencia no mueve el patrimonio", () => {
  it("los postings de una transferencia suman cero", () => {
    const postings = createPostings("TRANSFER", 5_000_000n, "banco", "efectivo");
    expect(postings.reduce((total, posting) => total + posting.amountCents, 0n)).toBe(0n);
  });

  it("el patrimonio total queda igual antes y después", () => {
    const before = { banco: 8_000_000n, efectivo: 1_000_000n };
    const after = applyPostings(before, createPostings("TRANSFER", 5_000_000n, "banco", "efectivo"));
    const total = (balances: Record<string, bigint>) => Object.values(balances).reduce((a, b) => a + b, 0n);
    expect(total(after)).toBe(total(before));
    expect(after.banco).toBe(3_000_000n);
    expect(after.efectivo).toBe(6_000_000n);
  });

  it("origen y destino iguales siguen siendo imposibles", () => {
    expect(() => createPostings("TRANSFER", 1000n, "banco", "banco")).toThrow();
  });

  it("los anulados siguen sin contar en el resumen", () => {
    const summary = summarizeMonth([
      { type: "EXPENSE", amountCents: 1000n, voidedAt: null },
      { type: "EXPENSE", amountCents: 9999n, voidedAt: new Date() },
    ]);
    expect(summary.expenseCents).toBe(1000n);
  });
});

describe("cableado de formularios", () => {
  const form = read("src/components/finance/MovementForm.tsx");
  const nuevo = read("src/app/movimientos/nuevo/page.tsx");
  const editar = read("src/app/movimientos/[id]/editar/page.tsx");
  const detalle = read("src/app/movimientos/[id]/page.tsx");
  const actions = read("src/app/actions/finance.ts");

  it("el importe es el primer campo del formulario", () => {
    const amountAt = form.indexOf("<AmountInput");
    const typeAt = form.indexOf("<fieldset");
    const accountAt = form.indexOf("movement-sourceAccountId");
    expect(amountAt).toBeGreaterThan(0);
    expect(amountAt).toBeLessThan(typeAt);
    expect(amountAt).toBeLessThan(accountAt);
  });

  it("el CTA cambia según la operación", () => {
    expect(form).toContain("Registrar gasto");
    expect(form).toContain("Registrar ingreso");
    expect(form).toContain("Confirmar transferencia");
    expect(form).toContain("Registrando gasto…");
    expect(form).toContain("Transfiriendo…");
  });

  it("nuevo y editar aceptan y sanean el contexto de retorno", () => {
    for (const page of [nuevo, editar]) {
      expect(page).toContain("sanitizeReturnPath");
      expect(page).toContain("returnTo={returnTo}");
    }
    expect(form).toContain('<input name="volver" type="hidden" value={returnTo} />');
  });

  it("las acciones sanean el retorno antes de devolverlo", () => {
    expect(actions).toContain('sanitizeReturnPath(value(formData, "volver") || null');
  });

  it("el detalle ofrece repetir y corregir conservando contexto", () => {
    expect(detalle).toContain("Registrar otro igual");
    expect(detalle).toContain("repetir=${id}");
    expect(detalle).toContain("/editar?volver=");
  });

  it("la anulación se confirma y nunca se llama eliminar", () => {
    const flow = read("src/components/finance/VoidMovementFlow.tsx");
    expect(flow).toContain("¿Anular este movimiento?");
    expect(flow).toContain("Dejará de afectar tus saldos, pero continuará en el historial.");
    expect(flow).toContain('loadingLabel="Anulando…"');
    expect(flow.toLowerCase()).not.toContain("eliminar");
    expect(flow.toLowerCase()).not.toContain("borrar");
  });

  it("la corrección se anuncia como auditable, no como edición destructiva", () => {
    expect(form).toContain("Doleth conservará el movimiento anterior y creará una corrección auditable.");
    expect(actions).toContain("correctedFromId: originalId");
  });

  it("descartar pide confirmación con las dos salidas", () => {
    expect(form).toContain("¿Descartar este movimiento?");
    expect(form).toContain("Los datos que escribiste no se van a guardar.");
    expect(form).toContain("Seguir editando");
  });

  it("el borrador se avisa en vez de restaurarse solo", () => {
    expect(form).toContain("Tenés un movimiento sin guardar.");
    expect(form).toContain("Continuar");
    expect(form).toContain("setPendingDraft(null)");
  });

  it("tras un éxito se descarta el borrador y se renueva la idempotency key", () => {
    expect(form).toContain("clearDraft()");
    expect(form).toContain("setFormKey(crypto.randomUUID())");
  });

  // Regresión: useActionState conserva el resultado, así que mostrar el éxito solo
  // con state.ok dejaba "Registrar otro" sin efecto y el formulario inalcanzable.
  it("Registrar otro devuelve el formulario en vez de dejar el éxito fijo", () => {
    expect(form).toContain("state.ok && state !== dismissedResult");
    expect(form).toContain("setDismissedResult(state)");
  });

  it("el doble submit está frenado en cliente y el servidor sigue mandando", () => {
    expect(read("src/components/finance/SubmitButton.tsx")).toContain("useFormStatus");
    expect(actions).toContain("idempotencyDecision");
    expect(actions).toContain('error.code === "P2002"');
  });
});
