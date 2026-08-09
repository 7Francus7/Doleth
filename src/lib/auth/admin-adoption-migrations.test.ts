import { readdirSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { ADMIN_ADOPTION_MIGRATIONS } from "../../../prisma/ops/lib/private-beta-admin-adoption";

/**
 * La lista del guard contra el repositorio.
 *
 * `ADMIN_ADOPTION_MIGRATIONS` es literal a propósito —ver el comentario en el
 * módulo—, pero eso la deja libre de envejecer sola. Y envejeció: quedó con seis
 * migraciones mientras el repositorio tenía diez, así que la herramienta habría
 * abortado con `MIGRATION_STATE_MISMATCH` justo contra la base productiva que
 * pretende operar. El resto de las pruebas no lo vio porque comparan la
 * constante consigo misma.
 *
 * Esta la coteja contra el directorio real. Si alguien agrega una migración y no
 * toca la lista, falla acá —con la suite corriendo— y no la noche del release.
 */
describe("ADMIN_ADOPTION_MIGRATIONS", () => {
  const onDisk = readdirSync(join(process.cwd(), "prisma", "migrations"), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  it("enumera exactamente las migraciones del repositorio", () => {
    expect([...ADMIN_ADOPTION_MIGRATIONS]).toEqual(onDisk);
  });

  /**
   * El orden importa: el guard compara los nombres serializados contra lo que
   * devuelve la base ordenado por `migration_name`. Una lista con los mismos
   * nombres en otro orden abortaría igual que una incompleta.
   */
  it("está ordenada como la consulta que la compara", () => {
    expect([...ADMIN_ADOPTION_MIGRATIONS]).toEqual([...ADMIN_ADOPTION_MIGRATIONS].sort());
  });
});
