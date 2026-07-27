import { mkdirSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import {
  captureChecksums,
  compareChecksums,
  financialTables,
  hasOwnershipColumns,
  renderChecksums,
  renderDifferences,
  type Checksums,
} from "./ops/checksums";

/**
 * Backfill de propiedad para los datos anteriores al corte multiusuario.
 *
 * Reclama para un usuario existente todas las filas financieras que quedaron con
 * `userId = NULL` después de la migración `202607270001_multiuser_identity`.
 *
 * Garantías:
 *   - Determinista: sólo toca filas con `userId IS NULL`. Correrlo dos veces no
 *     cambia nada la segunda vez.
 *   - No inventa un usuario. Exige `--email` de una cuenta ya creada desde la app.
 *   - Aborta ante ambigüedad: si hay huérfanos y más de un usuario con datos
 *     propios, la pertenencia no es determinable y no se escribe nada.
 *   - Nunca toca filas que ya pertenecen a otro usuario.
 *   - Escribe únicamente la columna `userId` de las tablas financieras (más el
 *     estado de onboarding del owner). No crea ni borra ninguna fila: ni
 *     categorías, ni movimientos compensatorios. No cambia importes, monedas,
 *     fechas, tipos, estados ni relaciones contables. No reconstruye el ledger.
 *     Por eso las sumas de control tienen que dar EXACTAMENTE iguales, sin
 *     excepciones: cualquier diferencia es un error y revierte la transacción.
 *   - Compara las sumas de control contables antes y después: por cuenta, por
 *     tipo de operación, débitos, créditos, anulados, correcciones y
 *     transferencias. Cualquier diferencia revierte la transacción.
 *   - Deja evidencia en `OwnerBackfillRun`.
 *   - Reversible con `prisma/rollback-owner-backfill.ts`.
 *
 * Uso:
 *   pnpm db:backfill-owner -- --email=vos@ejemplo.com --dry-run
 *   pnpm db:backfill-owner -- --email=vos@ejemplo.com --out=evidencia/backfill.json
 */

type Counts = Record<string, number>;

function argument(name: string): string | undefined {
  const prefix = `--${name}=`;
  return process.argv.find((value) => value.startsWith(prefix))?.slice(prefix.length);
}

async function countOrphans(prisma: PrismaClient): Promise<Counts> {
  const counts: Counts = {};
  for (const table of financialTables) {
    const rows = await prisma.$queryRawUnsafe<{ total: bigint }[]>(
      `SELECT COUNT(*)::bigint AS total FROM "${table}" WHERE "userId" IS NULL`,
    );
    counts[table] = Number(rows[0]?.total ?? 0n);
  }
  return counts;
}

async function countOwned(prisma: PrismaClient, userId: string): Promise<Counts> {
  const counts: Counts = {};
  for (const table of financialTables) {
    const rows = await prisma.$queryRawUnsafe<{ total: bigint }[]>(
      `SELECT COUNT(*)::bigint AS total FROM "${table}" WHERE "userId" = $1`,
      userId,
    );
    counts[table] = Number(rows[0]?.total ?? 0n);
  }
  return counts;
}

/** Filas que pertenecen a alguien distinto del owner. Deben quedar intactas. */
async function countOthers(prisma: PrismaClient, ownerId: string): Promise<Counts> {
  const counts: Counts = {};
  for (const table of financialTables) {
    const rows = await prisma.$queryRawUnsafe<{ total: bigint }[]>(
      `SELECT COUNT(*)::bigint AS total FROM "${table}" WHERE "userId" IS NOT NULL AND "userId" <> $1`,
      ownerId,
    );
    counts[table] = Number(rows[0]?.total ?? 0n);
  }
  return counts;
}

function total(counts: Counts): number {
  return Object.values(counts).reduce((sum, value) => sum + value, 0);
}

function report(title: string, counts: Counts) {
  console.info(`\n${title}`);
  for (const table of financialTables) console.info(`  ${table.padEnd(16)} ${counts[table] ?? 0}`);
  console.info(`  ${"TOTAL".padEnd(16)} ${total(counts)}`);
}

class BackfillAbort extends Error {}

async function main() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL es obligatoria.");

  const email = (argument("email") ?? process.env.DOLETH_OWNER_EMAIL ?? "").trim().toLowerCase().normalize("NFKC");
  const dryRun = process.argv.includes("--dry-run");
  const outPath = argument("out");
  if (!email) {
    throw new Error(
      "Falta --email. Creá primero tu cuenta desde /crear-cuenta y pasá esa dirección:\n" +
        "  pnpm db:backfill-owner -- --email=vos@ejemplo.com --dry-run",
    );
  }

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });

  try {
    // ---- Pre-chequeos -----------------------------------------------------
    if (!(await hasOwnershipColumns(prisma))) {
      throw new Error("Faltan las columnas userId. Aplicá la migración 202607270001_multiuser_identity primero.");
    }

    const matches = await prisma.$queryRaw<{ id: string }[]>`
      SELECT id FROM "User" WHERE lower(btrim(email)) = ${email}
    `;
    if (matches.length === 0) {
      throw new Error(`No existe un usuario con el correo indicado. Creá la cuenta antes de correr el backfill.`);
    }
    if (matches.length > 1) {
      throw new Error(`Hay ${matches.length} usuarios con ese correo normalizado. Resolvelo antes de continuar.`);
    }
    const owner = await prisma.user.findUniqueOrThrow({ where: { id: matches[0]!.id } });
    if (owner.status === "DELETED" || owner.status === "SUSPENDED") {
      throw new Error(`El usuario está en estado ${owner.status}. No se le puede asignar datos.`);
    }

    const before = await countOrphans(prisma);
    const ownedBefore = await countOwned(prisma, owner.id);
    const othersBefore = await countOthers(prisma, owner.id);
    const checksumsBefore = await captureChecksums(prisma);

    console.info(`Owner: ${owner.email} (${owner.id})`);
    console.info(`Estado: ${owner.status} · correo verificado: ${owner.emailVerifiedAt ? "sí" : "no"}`);
    report("Filas huérfanas ANTES", before);
    report("Filas ya del owner ANTES", ownedBefore);
    report("Filas de OTROS usuarios ANTES (deben quedar intactas)", othersBefore);
    console.info(renderChecksums(checksumsBefore, "Sumas de control ANTES"));

    if (total(before) === 0) {
      console.info("\nNo hay filas huérfanas. Nada que hacer.");
      return;
    }

    // ---- Aborto ante ambigüedad -------------------------------------------
    const ownersWithData = await prisma.$queryRaw<{ total: bigint }[]>`
      SELECT COUNT(DISTINCT "userId")::bigint AS total FROM (
        SELECT "userId" FROM "Account" WHERE "userId" IS NOT NULL
        UNION SELECT "userId" FROM "Transaction" WHERE "userId" IS NOT NULL
        UNION SELECT "userId" FROM "Investment" WHERE "userId" IS NOT NULL
        UNION SELECT "userId" FROM "UpcomingPayment" WHERE "userId" IS NOT NULL
      ) s
    `;
    const distinctOwners = Number(ownersWithData[0]?.total ?? 0n);
    const otherOwners = distinctOwners - (total(ownedBefore) > 0 ? 1 : 0);
    if (otherOwners > 0) {
      throw new Error(
        `Hay ${total(before)} filas sin propietario y ${otherOwners} usuario(s) distinto(s) del owner con datos ` +
          "financieros propios. La pertenencia de las filas huérfanas no es determinable con certeza. Abortado.",
      );
    }

    // Propiedad parcial: nada debe quedar a medio asignar.
    const partial = await prisma.$queryRaw<{ movimientos: bigint; asientos: bigint }[]>`
      SELECT
        (SELECT COUNT(*)::bigint FROM "Transaction" t
           WHERE t."userId" IS NULL
             AND EXISTS (SELECT 1 FROM "LedgerEntry" le WHERE le."transactionId" = t.id AND le."userId" IS NOT NULL)
        ) AS movimientos,
        (SELECT COUNT(*)::bigint FROM "LedgerEntry" le
           JOIN "Transaction" t ON t.id = le."transactionId"
           WHERE le."userId" IS NULL AND t."userId" IS NOT NULL
        ) AS asientos
    `;
    const partialMovements = Number(partial[0]?.movimientos ?? 0n);
    const partialEntries = Number(partial[0]?.asientos ?? 0n);
    if (partialMovements > 0 || partialEntries > 0) {
      throw new Error(
        `Propiedad parcial detectada: ${partialMovements} movimiento(s) y ${partialEntries} asiento(s) ` +
          "quedarían a medio asignar. Abortado.",
      );
    }
    console.info("\n✔ Sin ambigüedad: todas las filas huérfanas corresponden al owner.");
    console.info("✔ Sin propiedad parcial.");

    if (dryRun) {
      console.info(`\n--dry-run: se modificarían ${total(before)} filas. No se escribió nada.`);
      await prisma.ownerBackfillRun.create({
        data: {
          ownerUserId: owner.id,
          dryRun: true,
          counts: JSON.stringify({ before, ownedBefore, othersBefore }),
        },
      });
      return;
    }

    // ---- Backfill ---------------------------------------------------------
    // Una sola transacción: si cualquier verificación falla, no queda nada escrito.
    const claimed: Counts = {};
    let checksumsAfter: Checksums | null = null;

    try {
      await prisma.$transaction(async (tx) => {
        for (const table of financialTables) {
          const rows = await tx.$queryRawUnsafe<{ total: bigint }[]>(
            `WITH claimed AS (
               UPDATE "${table}" SET "userId" = $1 WHERE "userId" IS NULL RETURNING 1
             ) SELECT COUNT(*)::bigint AS total FROM claimed`,
            owner.id,
          );
          claimed[table] = Number(rows[0]?.total ?? 0n);
        }

        // Un owner con datos ya no necesita pasar por el onboarding.
        await tx.user.update({
          where: { id: owner.id },
          data: {
            onboardingStep: 3,
            onboardingCompletedAt: owner.onboardingCompletedAt ?? new Date(),
          },
        });

        // ---- Verificación DENTRO de la transacción --------------------------
        // Si algo no cierra, se lanza y Postgres revierte todo.
        const orphansNow = await countOrphans(tx as unknown as PrismaClient);
        if (total(orphansNow) !== 0) {
          throw new BackfillAbort(`Quedaron ${total(orphansNow)} filas sin propietario. Revirtiendo.`);
        }

        const othersNow = await countOthers(tx as unknown as PrismaClient, owner.id);
        for (const table of financialTables) {
          if ((othersNow[table] ?? 0) !== (othersBefore[table] ?? 0)) {
            throw new BackfillAbort(
              `Cambió la cantidad de filas de otros usuarios en ${table}: ` +
                `${othersBefore[table]} → ${othersNow[table]}. Revirtiendo.`,
            );
          }
        }

        const ownedNow = await countOwned(tx as unknown as PrismaClient, owner.id);
        const expected = (table: (typeof financialTables)[number]) =>
          (ownedBefore[table] ?? 0) + (claimed[table] ?? 0);
        const mismatched = financialTables.filter((table) => (ownedNow[table] ?? 0) !== expected(table));
        if (mismatched.length > 0) {
          const detail = mismatched
            .map((table) => `${table}: esperado ${expected(table)}, encontrado ${ownedNow[table] ?? 0}`)
            .join("; ");
          throw new BackfillAbort(`Los conteos de propiedad no cierran (${detail}). Revirtiendo.`);
        }

        checksumsAfter = await captureChecksums(tx as unknown as PrismaClient);
        const differences = compareChecksums(checksumsBefore, checksumsAfter);
        if (differences.length > 0) {
          console.error(renderDifferences(differences));
          throw new BackfillAbort(
            `El backfill alteró ${differences.length} valor(es) contable(s). Revirtiendo: no se escribió nada.`,
          );
        }
      });
    } catch (error) {
      if (error instanceof BackfillAbort) {
        console.error(`\n✖ ${error.message}`);
        console.error("  La transacción fue revertida. La base quedó como estaba.");
        process.exitCode = 1;
        return;
      }
      throw error;
    }

    // ---- Post-chequeos ----------------------------------------------------
    const after = await countOrphans(prisma);
    const ownedAfter = await countOwned(prisma, owner.id);
    const othersAfter = await countOthers(prisma, owner.id);
    const finalChecksums = await captureChecksums(prisma);
    const finalDifferences = compareChecksums(checksumsBefore, finalChecksums);

    report("Filas reclamadas", claimed);
    report("Filas huérfanas DESPUÉS", after);
    report("Filas del owner DESPUÉS", ownedAfter);
    report("Filas de OTROS usuarios DESPUÉS", othersAfter);
    console.info(renderChecksums(finalChecksums, "Sumas de control DESPUÉS"));
    console.info(renderDifferences(finalDifferences));

    if (finalDifferences.length > 0) {
      console.error("\n✖ Diferencias contables después de confirmar. Restaurá desde el backup.");
      process.exitCode = 1;
      return;
    }

    const scoped = await captureChecksums(prisma, { userId: owner.id });
    console.info(renderChecksums(scoped, `Estado contable del owner (${owner.id})`));

    const evidence = {
      ownerUserId: owner.id,
      before,
      ownedBefore,
      othersBefore,
      claimed,
      after,
      ownedAfter,
      othersAfter,
      checksumsBefore,
      checksumsAfter: finalChecksums,
      ownerChecksums: scoped,
    };

    await prisma.ownerBackfillRun.create({
      data: {
        ownerUserId: owner.id,
        dryRun: false,
        counts: JSON.stringify(evidence, (_key, value) => (typeof value === "bigint" ? value.toString() : value)),
      },
    });

    if (outPath) {
      mkdirSync(dirname(outPath), { recursive: true });
      writeFileSync(
        outPath,
        JSON.stringify(evidence, (_key, value) => (typeof value === "bigint" ? value.toString() : value), 2),
        "utf8",
      );
      console.info(`\n  Evidencia guardada en ${outPath}`);
    }

    console.info("\n✔ Backfill completo, sin diferencias contables. Evidencia en OwnerBackfillRun.");
    console.info("  El backfill sólo asignó propiedad: ni una categoría, ni un importe, ni una fecha cambió.");
    console.info("  Próximos pasos:");
    console.info("   1. `pnpm db:seed` para completar el catálogo de categorías del owner (aditivo, idempotente).");
    console.info("   2. Verificar en la aplicación que el owner ve todos sus datos.");
    console.info("   3. Recién entonces aplicar la migración de endurecimiento a NOT NULL.");
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(`\n✖ ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
});
