import { NextResponse } from "next/server";
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { getDb } from "../../../lib/db";
import { logServerError } from "../../../lib/observability";

/**
 * Chequeo de salud del despliegue.
 *
 * Responde la única pregunta que uno se hace después de apretar "deploy": ¿quedó
 * andando, y la base tiene el esquema que este código necesita?
 *
 * Esa segunda parte es la que importa. Una aplicación puede levantar
 * perfectamente y romperse en la primera consulta porque falta una columna que
 * una migración todavía no creó, y esa falla aparece recién cuando una persona
 * abre una pantalla. Acá se detecta antes.
 *
 * No expone nada: ni cadenas de conexión, ni cuántos usuarios hay, ni datos de
 * nadie. Sólo si el proceso responde, si la base contesta y si faltan
 * migraciones por aplicar.
 */

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/** Migraciones que existen en el repositorio, por nombre de carpeta. */
function migrationsInRepo(): string[] {
  try {
    return readdirSync(join(process.cwd(), "prisma", "migrations"), { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort();
  } catch {
    return [];
  }
}

export async function GET() {
  const version = readVersion();

  let database: "up" | "down" = "down";
  let pending: string[] = [];

  try {
    // `_prisma_migrations` es la tabla que mantiene `migrate deploy`. Se consulta
    // directo para no depender de que el cliente generado conozca el esquema
    // nuevo: si faltara una migración, justamente el cliente sería el que falla.
    const applied = await getDb().$queryRawUnsafe<{ migration_name: string }[]>(
      `SELECT migration_name FROM "_prisma_migrations" WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL`,
    );
    database = "up";
    const appliedNames = new Set(applied.map((row) => row.migration_name));
    pending = migrationsInRepo().filter((name) => !appliedNames.has(name));
  } catch (error) {
    logServerError({ route: "/api/salud", operation: "check", code: "database-unreachable" });
    // El detalle del error no sale de acá: podría contener host, usuario o base.
    void error;
  }

  const ok = database === "up" && pending.length === 0;

  return NextResponse.json(
    {
      ok,
      version,
      database,
      migrations: pending.length === 0 ? "al día" : "faltan aplicar",
      // Los nombres de migración no son secretos: están en el repositorio. Saber
      // cuáles faltan es exactamente lo que hace accionable este chequeo.
      pending,
    },
    {
      status: ok ? 200 : 503,
      headers: { "cache-control": "no-store" },
    },
  );
}

function readVersion(): string {
  try {
    const raw = readFileSync(join(process.cwd(), "package.json"), "utf8");
    return (JSON.parse(raw) as { version?: string }).version ?? "desconocida";
  } catch {
    return "desconocida";
  }
}
