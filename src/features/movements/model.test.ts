import { describe, expect, it } from "vitest";
import {
  activeMovementFilterCount,
  groupMovementsByDay,
  movementDayLabel,
  movementPath,
  parseMovementQuery,
  signedMovementAmount,
  type MovementListItem,
} from "./model";

const item = (id: string, occurredOn: string): MovementListItem => ({
  id, occurredOn, type: "EXPENSE", amount: "24.300", currency: "ARS",
  description: "Supermercado", categoryName: "Comida", sourceAccountName: "Mercado Pago",
  destinationAccountName: null, voided: false, corrected: false,
});

describe("movements model", () => {
  it("normaliza query y descarta valores inválidos", () => {
    expect(parseMovementQuery({ month: "mal", type: "OTHER", page: "-2", q: "  nafta  " }, "2026-08-13"))
      .toEqual({ month: "2026-08", page: 1, q: "nafta" });
  });

  it("serializa contexto completo y omite página uno", () => {
    expect(movementPath({ month: "2026-08", type: "EXPENSE", q: "comida", page: 1 }))
      .toBe("/movimientos?month=2026-08&q=comida&type=EXPENSE");
  });

  it("cuenta filtros activos", () => {
    expect(activeMovementFilterCount({ month: "2026-08", type: "EXPENSE", q: "nafta", page: 3 }, "2026-08")).toBe(2);
  });

  it("agrupa fechas sin perder orden", () => {
    const groups = groupMovementsByDay([item("a", "2026-08-13"), item("b", "2026-08-13"), item("c", "2026-08-12")], "2026-08-13");
    expect(groups.map((group) => [group.label, group.movements.length])).toEqual([["HOY", 2], ["AYER", 1]]);
    expect(movementDayLabel("2026-08-11", "2026-08-13")).toBe("11 AGO");
  });

  it("expresa signo, moneda y tipo por texto", () => {
    expect(signedMovementAmount(item("a", "2026-08-13"))).toBe("−$24.300");
    expect(signedMovementAmount({ type: "INCOME", amount: "50", currency: "USD" })).toBe("+USD 50");
  });
});
