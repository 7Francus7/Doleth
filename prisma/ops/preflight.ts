import { writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../src/generated/prisma/client";
import {
  captureChecksums,
  financialTables,
  hasOwnershipColumns,
  renderChecksums,
  serializeChecksums,
  tableExists,
} from "./checksums";

/**
 * Preflight productivo: auditoría READ-ONLY.
 *
 * No escribe una sola fila en la base. Su trabajo es decir si el corte se puede
 * ejecutar y dejar la evidencia contra la cual se comparará después.
 *
 * Uso:
 *   pnpm db:preflight -- --owner-email=vos@ejemplo.com
 *   pnpm db:preflight -- --owner-email=vos@ejemplo.com --out=evidencia/pre.json
 *
 * Código de salida:
 *   0  se puede continuar
 *   1  hay bloqueos; no continuar
 */

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

/** Oculta credenciales y host: la salida del preflight se pega en un documento. */
function redactDatabaseUrl(raw: string): string {
  try {
    const url = new URL(raw);
    const host = url.hostname;
    const visible = host.length <= 6 ? host : `${host.slice(0, 3)}…${host.slice(-4)}`;
    return `${url.protocol}//<usuario>:<oculto>@${visible}:${url.port || "5432"}${url.pathname}`;
  } catch {
    return "<no parseable>";
  }
}

const blockers: string[] = [];
const warnings: string[] = [];
const block = (message: string) => blockers.push(message);
const warn = (message: string) => warnings.push(message);

function section(title: string) {
  console.info(`\n${"═".repeat(70)}\n${title}\n${"═".repeat(70)}`);
}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL es obligatoria.");

  const ownerEmail = (argument("owner-email") ?? process.env.DOLETH_OWNER_EMAIL ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFKC");
  const outPath = argument("out");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    section("PREFLIGHT · Doleth · corte multiusuario");
    console.info(`Base objetivo: ${redactDatabaseUrl(connectionString)}`);
    console.info(`Momento:       ${new Date().toISOString()}`);
    console.info(`Owner buscado: ${ownerEmail ? `${ownerEmail.slice(0, 2)}…@${ownerEmail.split("@")[1] ?? "?"}` : "(no indicado)"}`);
    if (!ownerEmail) block("Falta --owner-email (o DOLETH_OWNER_EMAIL). El owner no se deduce por orden de creación.");

    const serverRows = await prisma.$queryRaw<{ version: string; schema: string }[]>`
      SELECT version() AS version, current_schema() AS schema
    `;
    console.info(`Servidor:      ${serverRows[0]?.version.split(",")[0] ?? "?"}`);
    console.info(`Esquema:       ${serverRows[0]?.schema ?? "?"}`);

    // -----------------------------------------------------------------------
    section("1 · Migraciones");
    const hasMigrationsTable = await tableExists(prisma, "_prisma_migrations");
    if (!hasMigrationsTable) {
      block("No existe _prisma_migrations: esta base no fue gestionada por Prisma Migrate.");
    } else {
      const applied = await prisma.$queryRaw<
        { migration_name: string; finished_at: Date | null; rolled_back_at: Date | null; checksum: string }[]
      >`
        SELECT migration_name, finished_at, rolled_back_at, checksum
        FROM _prisma_migrations ORDER BY started_at
      `;
      for (const migration of applied) {
        const state = migration.rolled_back_at
          ? "REVERTIDA"
          : migration.finished_at
            ? "aplicada"
            : "INCOMPLETA";
        console.info(`  ${state.padEnd(10)} ${migration.migration_name}  checksum=${migration.checksum.slice(0, 12)}…`);
        if (!migration.finished_at && !migration.rolled_back_at) {
          block(`La migración ${migration.migration_name} quedó a medio aplicar. Resolvela antes de seguir.`);
        }
      }
      const names = new Set(applied.filter((m) => m.finished_at && !m.rolled_back_at).map((m) => m.migration_name));
      const identityApplied = names.has("202607270001_multiuser_identity");
      console.info(`\n  Migración de identidad aplicada: ${identityApplied ? "sí" : "NO (pendiente)"}`);
      if (!identityApplied) {
        warn("La migración 202607270001_multiuser_identity está pendiente. El preflight mide el estado previo.");
      }
    }

    // -----------------------------------------------------------------------
    section("2 · Estructura de identidad");
    const identityTables = ["User", "Session", "AuthToken", "AuthEvent", "RateLimitCounter", "OwnerBackfillRun"];
    const identityPresence: Record<string, boolean> = {};
    for (const table of identityTables) {
      identityPresence[table] = await tableExists(prisma, table);
      console.info(`  ${identityPresence[table] ? "✔" : "✖"} ${table}`);
    }
    const owned = await hasOwnershipColumns(prisma);
    console.info(`  ${owned ? "✔" : "✖"} columnas userId en las 6 tablas financieras`);

    const identityReady = identityTables.every((table) => identityPresence[table]) && owned;

    // -----------------------------------------------------------------------
    section("3 · Tabla de pre-chequeo");
    const rows: { tabla: string; total: number; conDueño: number; sinDueño: number; invalidas: number }[] = [];

    if (identityPresence.User) {
      const userRows = await prisma.$queryRaw<{ total: bigint; activos: bigint; pendientes: bigint; otros: bigint }[]>`
        SELECT COUNT(*)::bigint AS total,
               COUNT(*) FILTER (WHERE status = 'ACTIVE')::bigint AS activos,
               COUNT(*) FILTER (WHERE status = 'PENDING_VERIFICATION')::bigint AS pendientes,
               COUNT(*) FILTER (WHERE status NOT IN ('ACTIVE','PENDING_VERIFICATION'))::bigint AS otros
        FROM "User"
      `;
      const users = userRows[0];
      rows.push({
        tabla: "User",
        total: Number(users?.total ?? 0n),
        conDueño: Number(users?.total ?? 0n),
        sinDueño: 0,
        invalidas: 0,
      });
      console.info(
        `  Usuarios: total=${users?.total} activos=${users?.activos} pendientes=${users?.pendientes} otros=${users?.otros}`,
      );

      const sessions = await prisma.$queryRaw<{ total: bigint; vivas: bigint }[]>`
        SELECT COUNT(*)::bigint AS total,
               COUNT(*) FILTER (WHERE "revokedAt" IS NULL AND "expiresAt" > now())::bigint AS vivas
        FROM "Session"
      `;
      const tokens = await prisma.$queryRaw<{ total: bigint; vivos: bigint }[]>`
        SELECT COUNT(*)::bigint AS total,
               COUNT(*) FILTER (WHERE "consumedAt" IS NULL AND "expiresAt" > now())::bigint AS vivos
        FROM "AuthToken"
      `;
      console.info(`  Sesiones: total=${sessions[0]?.total} vivas=${sessions[0]?.vivas}`);
      console.info(`  Tokens:   total=${tokens[0]?.total} vigentes=${tokens[0]?.vivos}`);

      // Duplicados por email normalizado: la unicidad es sobre el valor guardado,
      // así que dos filas que sólo difieren en mayúsculas o espacios pasarían.
      const duplicates = await prisma.$queryRaw<{ normalizado: string; total: bigint }[]>`
        SELECT lower(btrim(email)) AS normalizado, COUNT(*)::bigint AS total
        FROM "User" GROUP BY 1 HAVING COUNT(*) > 1
      `;
      if (duplicates.length > 0) {
        for (const duplicate of duplicates) {
          block(`Hay ${duplicate.total} usuarios cuyo email normalizado coincide. Resolvelo antes de seguir.`);
        }
      } else {
        console.info("  Duplicados de email normalizado: ninguno ✔");
      }
    } else {
      warn("Todavía no existe la tabla User: la migración de identidad no fue aplicada.");
    }

    let orphanTotal = 0;
    const orphansByTable: Record<string, number> = {};

    for (const table of financialTables) {
      const totalRows = await prisma.$queryRawUnsafe<{ total: bigint }[]>(
        `SELECT COUNT(*)::bigint AS total FROM "${table}"`,
      );
      const total = Number(totalRows[0]?.total ?? 0n);
      let withOwner = 0;
      let without = 0;
      if (owned) {
        const ownedRows = await prisma.$queryRawUnsafe<{ con: bigint; sin: bigint }[]>(
          `SELECT COUNT("userId")::bigint AS con, (COUNT(*) - COUNT("userId"))::bigint AS sin FROM "${table}"`,
        );
        withOwner = Number(ownedRows[0]?.con ?? 0n);
        without = Number(ownedRows[0]?.sin ?? 0n);
      } else {
        without = total;
      }
      orphansByTable[table] = without;
      orphanTotal += without;
      rows.push({ tabla: table, total, conDueño: withOwner, sinDueño: without, invalidas: 0 });
    }

    console.info("\n  tabla            total   con dueño   sin dueño");
    console.info("  " + "─".repeat(50));
    for (const row of rows) {
      console.info(
        `  ${row.tabla.padEnd(16)} ${String(row.total).padStart(5)}   ${String(row.conDueño).padStart(9)}   ${String(row.sinDueño).padStart(9)}`,
      );
    }
    console.info(`\n  Filas financieras sin propietario: ${orphanTotal}`);

    // -----------------------------------------------------------------------
    section("4 · Integridad relacional");

    if (owned) {
      // Una transacción cuya cuenta pertenece a otra persona es exactamente el
      // caso que el backfill NO puede resolver solo.
      const crossed = await prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*)::bigint AS total FROM "Transaction" t
        JOIN "Account" a ON a.id = t."sourceAccountId"
        WHERE t."userId" IS NOT NULL AND a."userId" IS NOT NULL AND t."userId" <> a."userId"
      `;
      const crossedDestination = await prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*)::bigint AS total FROM "Transaction" t
        JOIN "Account" a ON a.id = t."destinationAccountId"
        WHERE t."userId" IS NOT NULL AND a."userId" IS NOT NULL AND t."userId" <> a."userId"
      `;
      const crossedEntries = await prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*)::bigint AS total FROM "LedgerEntry" le
        JOIN "Account" a ON a.id = le."accountId"
        WHERE le."userId" IS NOT NULL AND a."userId" IS NOT NULL AND le."userId" <> a."userId"
      `;
      const crossedCategory = await prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*)::bigint AS total FROM "Transaction" t
        JOIN "Category" c ON c.id = t."categoryId"
        WHERE t."userId" IS NOT NULL AND c."userId" IS NOT NULL AND t."userId" <> c."userId"
      `;
      const crossedUpcoming = await prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*)::bigint AS total FROM "UpcomingPayment" u
        JOIN "Account" a ON a.id = u."plannedAccountId"
        WHERE u."userId" IS NOT NULL AND a."userId" IS NOT NULL AND u."userId" <> a."userId"
      `;

      const crossings: [string, number][] = [
        ["movimiento ↔ cuenta origen", Number(crossed[0]?.total ?? 0n)],
        ["movimiento ↔ cuenta destino", Number(crossedDestination[0]?.total ?? 0n)],
        ["asiento ↔ cuenta", Number(crossedEntries[0]?.total ?? 0n)],
        ["movimiento ↔ categoría", Number(crossedCategory[0]?.total ?? 0n)],
        ["próximo pago ↔ cuenta", Number(crossedUpcoming[0]?.total ?? 0n)],
      ];
      for (const [label, count] of crossings) {
        console.info(`  ${count === 0 ? "✔" : "✖"} ${label}: ${count} inconsistencia(s)`);
        if (count > 0) block(`Hay ${count} filas donde ${label} apuntan a propietarios distintos.`);
      }

      // Propiedad parcial: un grupo que quedaría a medio asignar tras el backfill.
      const partialTransactions = await prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*)::bigint AS total FROM "Transaction" t
        WHERE t."userId" IS NULL
          AND EXISTS (SELECT 1 FROM "LedgerEntry" le WHERE le."transactionId" = t.id AND le."userId" IS NOT NULL)
      `;
      const partialEntries = await prisma.$queryRaw<{ total: bigint }[]>`
        SELECT COUNT(*)::bigint AS total FROM "LedgerEntry" le
        JOIN "Transaction" t ON t.id = le."transactionId"
        WHERE le."userId" IS NULL AND t."userId" IS NOT NULL
      `;
      const partials: [string, number][] = [
        ["movimientos huérfanos con asientos ya asignados", Number(partialTransactions[0]?.total ?? 0n)],
        ["asientos huérfanos con movimiento ya asignado", Number(partialEntries[0]?.total ?? 0n)],
      ];
      for (const [label, count] of partials) {
        console.info(`  ${count === 0 ? "✔" : "✖"} ${label}: ${count}`);
        if (count > 0) block(`Propiedad parcial detectada: ${count} ${label}.`);
      }

      // Si hay huérfanos y además más de un usuario con datos propios, la
      // pertenencia de los huérfanos deja de ser determinable con certeza.
      if (orphanTotal > 0) {
        const ownersWithData = await prisma.$queryRaw<{ total: bigint }[]>`
          SELECT COUNT(DISTINCT "userId")::bigint AS total FROM (
            SELECT "userId" FROM "Account" WHERE "userId" IS NOT NULL
            UNION SELECT "userId" FROM "Transaction" WHERE "userId" IS NOT NULL
            UNION SELECT "userId" FROM "Investment" WHERE "userId" IS NOT NULL
            UNION SELECT "userId" FROM "UpcomingPayment" WHERE "userId" IS NOT NULL
          ) s
        `;
        const distinct = Number(ownersWithData[0]?.total ?? 0n);
        console.info(`\n  Usuarios con datos financieros propios: ${distinct}`);
        if (distinct > 1) {
          block(
            `Hay ${orphanTotal} filas sin propietario y ${distinct} usuarios distintos con datos propios. ` +
              "La pertenencia de las filas huérfanas no se puede determinar con certeza. No continuar.",
          );
        }
      }
    } else {
      console.info("  (sin columnas de propiedad todavía: nada que cruzar)");
    }

    // Referencias rotas, independientes de la propiedad.
    const brokenEntries = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COUNT(*)::bigint AS total FROM "LedgerEntry" le
      LEFT JOIN "Transaction" t ON t.id = le."transactionId"
      LEFT JOIN "Account" a ON a.id = le."accountId"
      WHERE t.id IS NULL OR a.id IS NULL
    `;
    const transfersWithoutDestination = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COUNT(*)::bigint AS total FROM "Transaction"
      WHERE type = 'TRANSFER' AND "destinationAccountId" IS NULL
    `;
    console.info(`  ${Number(brokenEntries[0]?.total ?? 0n) === 0 ? "✔" : "✖"} asientos con referencia rota: ${brokenEntries[0]?.total}`);
    console.info(
      `  ${Number(transfersWithoutDestination[0]?.total ?? 0n) === 0 ? "✔" : "✖"} transferencias sin destino: ${transfersWithoutDestination[0]?.total}`,
    );
    if (Number(brokenEntries[0]?.total ?? 0n) > 0) block("Hay asientos con referencias rotas.");
    if (Number(transfersWithoutDestination[0]?.total ?? 0n) > 0) block("Hay transferencias sin cuenta de destino.");

    // -----------------------------------------------------------------------
    section("5 · Owner designado");
    let ownerId: string | null = null;
    if (ownerEmail && identityPresence.User) {
      const matches = await prisma.$queryRaw<{ id: string; email: string; status: string; verified: Date | null }[]>`
        SELECT id, email, status::text AS status, "emailVerifiedAt" AS verified
        FROM "User" WHERE lower(btrim(email)) = ${ownerEmail}
      `;
      if (matches.length === 0) {
        console.info("  ✖ No existe un usuario con ese correo.");
        warn(
          "El owner todavía no existe. Creá la cuenta desde /crear-cuenta y verificá el correo antes del backfill.",
        );
      } else if (matches.length > 1) {
        block(`Hay ${matches.length} usuarios con el mismo correo normalizado. No se puede elegir el owner.`);
      } else {
        const owner = matches[0]!;
        ownerId = owner.id;
        console.info(`  ✔ Owner encontrado: id=${owner.id}`);
        console.info(`    estado=${owner.status}  correo verificado=${owner.verified ? "sí" : "no"}`);
        if (owner.status === "SUSPENDED" || owner.status === "DELETED") {
          block(`El owner está en estado ${owner.status}. No se le puede asignar datos.`);
        }
        if (!owner.verified) {
          warn("El owner todavía no verificó su correo. Se recomienda completar la verificación antes del backfill.");
        }
      }
    } else if (!identityPresence.User) {
      console.info("  (la tabla User todavía no existe)");
    }

    // -----------------------------------------------------------------------
    section("6 · Sumas de control contables");
    const checksums = await captureChecksums(prisma);
    console.info(renderChecksums(checksums, "Estado contable actual (toda la base)"));

    if (outPath) {
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(outPath, serializeChecksums(checksums), "utf8");
      console.info(`\n  Evidencia guardada en ${outPath}`);
    } else {
      warn("No se indicó --out: la evidencia contable no quedó guardada en disco.");
    }

    // -----------------------------------------------------------------------
    section("7 · Veredicto del preflight");
    console.info(`  Identidad lista:            ${identityReady ? "sí" : "no"}`);
    console.info(`  Owner identificado:         ${ownerId ? "sí" : "no"}`);
    console.info(`  Filas sin propietario:      ${orphanTotal}`);
    console.info(`  Cuentas medidas:            ${checksums.accounts.length}`);
    console.info(`  Movimientos medidos:        ${checksums.movements.total}`);

    if (warnings.length > 0) {
      console.info("\n  Advertencias:");
      for (const warning of warnings) console.info(`   ⚠ ${warning}`);
    }

    if (blockers.length > 0) {
      console.error("\n  BLOQUEOS:");
      for (const blocker of blockers) console.error(`   ✖ ${blocker}`);
      console.error("\n✖ PREFLIGHT BLOQUEADO. No ejecutes migración ni backfill.");
      process.exitCode = 1;
      return;
    }

    console.info("\n✔ PREFLIGHT OK. Se puede continuar con backup → migración → backfill.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`\n✖ Preflight abortado: ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
