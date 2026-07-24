import { describe, expect, it } from "vitest";
import { describeDateAR, isFutureDate, previousCivilDay } from "./movementDate";
import {
  DRAFT_MAX_AGE_MS,
  draftStorageKey,
  isDraftWorthKeeping,
  parseDraft,
  serializeDraft,
  type MovementDraftValues,
} from "./movementDraft";
import { clearDestinationIfSameAsSource, recentAccountKey, resolveDefaultAccount } from "./recentAccounts";
import { buildRepeatDefaults, canRepeat, currentVersionId, isReferenceOnly, type RepeatableMovement } from "./repeatMovement";
import { formatCentsAR } from "./amount";
import { todayInArgentina } from "./domain";

describe("fecha argentina", () => {
  it("dice Hoy y Ayer con el día civil", () => {
    expect(describeDateAR("2026-07-23", "2026-07-23")).toBe("Hoy, 23 de julio");
    expect(describeDateAR("2026-07-22", "2026-07-23")).toBe("Ayer, 22 de julio");
  });

  it("omite el año dentro del mismo año y lo agrega cuando cambia", () => {
    expect(describeDateAR("2026-07-21", "2026-07-23")).toBe("21 de julio");
    expect(describeDateAR("2025-12-20", "2026-01-01")).toBe("20 de diciembre de 2025");
  });

  it("cruza fin de mes y fin de año", () => {
    expect(previousCivilDay("2026-08-01")).toBe("2026-07-31");
    expect(previousCivilDay("2026-01-01")).toBe("2025-12-31");
    expect(describeDateAR("2026-07-31", "2026-08-01")).toBe("Ayer, 31 de julio");
    // Ayer manda sobre el año: es más claro que "31 de diciembre de 2025".
    expect(describeDateAR("2025-12-31", "2026-01-01")).toBe("Ayer, 31 de diciembre");
  });

  it("cruza años bisiestos", () => {
    expect(previousCivilDay("2028-03-01")).toBe("2028-02-29");
  });

  it("reconoce fecha futura sin depender del huso del navegador", () => {
    expect(isFutureDate("2026-07-24", "2026-07-23")).toBe(true);
    expect(isFutureDate("2026-07-23", "2026-07-23")).toBe(false);
    expect(isFutureDate("2026-07-22", "2026-07-23")).toBe(false);
  });
});

describe("todayInArgentina cerca de medianoche", () => {
  it("a las 02:30 UTC en Argentina todavía es el día anterior", () => {
    expect(todayInArgentina(new Date("2026-07-24T02:30:00.000Z"))).toBe("2026-07-23");
  });

  it("a las 03:30 UTC ya cambió el día en Argentina", () => {
    expect(todayInArgentina(new Date("2026-07-24T03:30:00.000Z"))).toBe("2026-07-24");
  });

  it("el cambio de mes también se resuelve en hora argentina", () => {
    expect(todayInArgentina(new Date("2026-08-01T02:00:00.000Z"))).toBe("2026-07-31");
  });

  it("el cambio de año también", () => {
    expect(todayInArgentina(new Date("2027-01-01T02:00:00.000Z"))).toBe("2026-12-31");
  });
});

const baseValues: MovementDraftValues = {
  type: "EXPENSE",
  amount: "",
  sourceAccountId: "",
  destinationAccountId: "",
  categoryId: "",
  occurredOn: "2026-07-23",
  description: "",
};

describe("borradores", () => {
  it("separa nuevo de corrección y cada corrección de las demás", () => {
    expect(draftStorageKey({ kind: "new" })).toBe("doleth:draft:movimiento:nuevo");
    expect(draftStorageKey({ kind: "correction", movementId: "abc" })).toContain("abc");
    expect(draftStorageKey({ kind: "correction", movementId: "abc" })).not.toBe(
      draftStorageKey({ kind: "correction", movementId: "xyz" }),
    );
    expect(draftStorageKey({ kind: "new" })).not.toBe(draftStorageKey({ kind: "correction", movementId: "abc" }));
  });

  it("no considera borrador un formulario intacto", () => {
    expect(isDraftWorthKeeping(baseValues, baseValues)).toBe(false);
  });

  it("considera borrador cualquier cambio real", () => {
    expect(isDraftWorthKeeping({ ...baseValues, amount: "12.500" }, baseValues)).toBe(true);
    expect(isDraftWorthKeeping({ ...baseValues, description: "café" }, baseValues)).toBe(true);
    expect(isDraftWorthKeeping({ ...baseValues, type: "INCOME" }, baseValues)).toBe(true);
  });

  it("guarda y restaura los valores junto con el retorno", () => {
    const values = { ...baseValues, amount: "12.500", description: "café" };
    const raw = serializeDraft(values, "/movimientos?type=EXPENSE", 1000);
    const restored = parseDraft(raw, 2000);
    expect(restored?.values).toEqual(values);
    expect(restored?.returnTo).toBe("/movimientos?type=EXPENSE");
  });

  it("nunca persiste la idempotency key ni el id del movimiento creado", () => {
    const raw = serializeDraft({ ...baseValues, amount: "100" }, null, 1000);
    expect(raw).not.toContain("idempotency");
    expect(raw).not.toContain("transactionId");
  });

  it("caduca a las 24 horas", () => {
    const raw = serializeDraft(baseValues, null, 1000);
    expect(parseDraft(raw, 1000 + DRAFT_MAX_AGE_MS - 1)).not.toBeNull();
    expect(parseDraft(raw, 1000 + DRAFT_MAX_AGE_MS + 1)).toBeNull();
  });

  it("descarta borradores ilegibles, vacíos o con futuro imposible", () => {
    expect(parseDraft(null, 1000)).toBeNull();
    expect(parseDraft("{no json", 1000)).toBeNull();
    expect(parseDraft(JSON.stringify({ values: baseValues }), 1000)).toBeNull();
    expect(parseDraft(serializeDraft(baseValues, null, 5000), 1000)).toBeNull();
  });

  it("descarta un borrador con tipo inválido en vez de restaurar algo ajeno", () => {
    const raw = JSON.stringify({ values: { ...baseValues, type: "RARO" }, returnTo: null, savedAt: 1000 });
    expect(parseDraft(raw, 1100)).toBeNull();
  });
});

const accounts = [
  { id: "banco", name: "Banco" },
  { id: "efectivo", name: "Efectivo" },
];

describe("cuenta reciente", () => {
  it("usa claves distintas por rol", () => {
    const roles = ["expense", "income", "transfer-source", "transfer-destination"] as const;
    expect(new Set(roles.map(recentAccountKey)).size).toBe(roles.length);
  });

  it("restaura la última cuenta usada", () => {
    expect(resolveDefaultAccount({ remembered: "efectivo", accounts })).toBe("efectivo");
  });

  it("respeta la elección explícita por encima de la recordada", () => {
    expect(resolveDefaultAccount({ explicit: "banco", remembered: "efectivo", accounts })).toBe("banco");
  });

  it("cae en fallback si la cuenta recordada ya no está disponible", () => {
    expect(resolveDefaultAccount({ remembered: "borrada", accounts })).toBe("");
    expect(resolveDefaultAccount({ remembered: "archivada", accounts: [accounts[0]!] })).toBe("banco");
  });

  it("preselecciona cuando hay una sola cuenta posible", () => {
    expect(resolveDefaultAccount({ accounts: [accounts[0]!] })).toBe("banco");
  });

  it("no propone como destino la cuenta de origen", () => {
    expect(resolveDefaultAccount({ remembered: "banco", accounts, exclude: "banco" })).toBe("efectivo");
    expect(clearDestinationIfSameAsSource("banco", "banco")).toBe("");
    expect(clearDestinationIfSameAsSource("banco", "efectivo")).toBe("efectivo");
  });
});

const movement: RepeatableMovement = {
  id: "mov-1",
  type: "EXPENSE",
  amountCents: 1_850_000n,
  sourceAccountId: "banco",
  destinationAccountId: null,
  categoryId: "cat-food",
  description: "Almuerzo",
  voidedAt: null,
  correctionId: null,
};

describe("repetir movimiento", () => {
  it("copia la intención: tipo, importe, cuenta, categoría y descripción", () => {
    const defaults = buildRepeatDefaults(movement, "2026-07-23", formatCentsAR);
    expect(defaults.type).toBe("EXPENSE");
    expect(defaults.amount).toBe("18.500");
    expect(defaults.sourceAccountId).toBe("banco");
    expect(defaults.categoryId).toBe("cat-food");
    expect(defaults.description).toBe("Almuerzo");
  });

  it("usa la fecha de hoy, no la del movimiento anterior", () => {
    expect(buildRepeatDefaults(movement, "2026-07-23", formatCentsAR).occurredOn).toBe("2026-07-23");
  });

  it("no copia identificadores ni auditoría", () => {
    const defaults = buildRepeatDefaults(movement, "2026-07-23", formatCentsAR);
    expect(Object.keys(defaults)).toEqual([
      "type", "amount", "sourceAccountId", "destinationAccountId", "categoryId", "description", "occurredOn",
    ]);
    expect(JSON.stringify(defaults)).not.toContain("mov-1");
  });

  it("copia la cuenta de destino en transferencias", () => {
    const transfer = { ...movement, type: "TRANSFER" as const, destinationAccountId: "efectivo", categoryId: null };
    const defaults = buildRepeatDefaults(transfer, "2026-07-23", formatCentsAR);
    expect(defaults.destinationAccountId).toBe("efectivo");
    expect(defaults.categoryId).toBe("");
  });

  it("un movimiento corregido manda a su reemplazo vigente", () => {
    const corrected = { ...movement, correctionId: "mov-2" };
    expect(canRepeat(corrected)).toBe(false);
    expect(currentVersionId(corrected)).toBe("mov-2");
    expect(currentVersionId(movement)).toBe("mov-1");
  });

  it("un anulado sirve como referencia y queda señalado", () => {
    const voided = { ...movement, voidedAt: new Date("2026-07-22T00:00:00Z") };
    expect(canRepeat(voided)).toBe(true);
    expect(isReferenceOnly(voided)).toBe(true);
    expect(isReferenceOnly(movement)).toBe(false);
  });
});
