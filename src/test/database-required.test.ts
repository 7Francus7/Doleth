import { describe, expect, it } from "vitest";
import { hasDatabase } from "./fixtures";

/**
 * Guardia del pipeline.
 *
 * Esta suite NO se omite nunca. Su único trabajo es que un CI configurado para
 * exigir base de datos no pueda terminar en verde con las pruebas de aislamiento
 * multiusuario silenciosamente salteadas, que es la forma más fácil de creer que
 * el corte está probado cuando no lo está.
 */
describe("disponibilidad de la base para las suites bloqueantes", () => {
  it("hay PostgreSQL cuando el entorno lo exige", () => {
    if (process.env.DOLETH_REQUIRE_DB !== "1") {
      expect(typeof hasDatabase).toBe("boolean");
      return;
    }
    expect(
      hasDatabase,
      "DOLETH_REQUIRE_DB=1: las pruebas de aislamiento son bloqueantes y necesitan una base real.",
    ).toBe(true);
  });
});
