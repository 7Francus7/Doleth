import type { PrismaClient } from "../../src/generated/prisma/client";

/**
 * Sumas de control contables.
 *
 * Se usan tres veces: en el preflight (antes de tocar nada), inmediatamente
 * antes del backfill y después. La comparación no es "el total global coincide":
 * se compara por cuenta, por tipo de operación y por estado, porque un backfill
 * que mueva filas entre cuentas puede dejar el total global intacto.
 *
 * Todo el dinero se lee como `bigint` en centavos. Los importes viajan como
 * texto desde Postgres para no pasar nunca por un `number` de punto flotante.
 */

export interface AccountChecksum {
  accountId: string;
  name: string;
  currency: string;
  status: string;
  initialBalanceCents: bigint;
  /** Suma de asientos de movimientos NO anulados. */
  ledgerLiveCents: bigint;
  /** Suma de todos los asientos, incluidos los de movimientos anulados. */
  ledgerAllCents: bigint;
  balanceCents: bigint;
  entryCount: number;
}

export interface TypeChecksum {
  type: string;
  total: number;
  voided: number;
  live: number;
  amountLiveCents: bigint;
  amountAllCents: bigint;
}

export interface Checksums {
  capturedAt: string;
  tables: Record<string, number>;
  accounts: AccountChecksum[];
  types: TypeChecksum[];
  ledger: {
    entries: number;
    debitCents: bigint;
    creditCents: bigint;
    netCents: bigint;
    liveDebitCents: bigint;
    liveCreditCents: bigint;
  };
  movements: {
    total: number;
    voided: number;
    corrections: number;
    transfers: number;
  };
  investments: { total: number; active: number; investedCents: bigint; currentValueCents: bigint };
  upcomingPayments: { total: number; pending: number; paid: number; estimatedCents: bigint };
  categories: { total: number };
}

const FINANCIAL_TABLES = [
  "Account",
  "Category",
  "Transaction",
  "LedgerEntry",
  "Investment",
  "UpcomingPayment",
] as const;

export type FinancialTable = (typeof FINANCIAL_TABLES)[number];
export const financialTables: readonly FinancialTable[] = FINANCIAL_TABLES;

const big = (value: string | null | undefined): bigint => BigInt(value ?? "0");
const num = (value: string | number | bigint | null | undefined): number => Number(value ?? 0);

/** ¿La base ya tiene las columnas de propiedad? El preflight corre antes y después de la migración. */
export async function hasOwnershipColumns(prisma: PrismaClient): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ total: bigint }[]>`
    SELECT COUNT(*)::bigint AS total
    FROM information_schema.columns
    WHERE table_schema = 'public' AND column_name = 'userId'
      AND table_name IN ('Account','Category','Transaction','LedgerEntry','Investment','UpcomingPayment')
  `;
  return Number(rows[0]?.total ?? 0n) === 6;
}

export async function tableExists(prisma: PrismaClient, table: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ total: bigint }[]>`
    SELECT COUNT(*)::bigint AS total FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${table}
  `;
  return Number(rows[0]?.total ?? 0n) > 0;
}

/**
 * Captura el estado contable completo.
 *
 * `scope` acota a un propietario. Sin `scope` mide toda la base, que es lo que
 * hace falta para comparar antes y después de un backfill: la propiedad cambia,
 * la contabilidad no.
 */
export async function captureChecksums(
  prisma: PrismaClient,
  scope?: { userId: string },
): Promise<Checksums> {
  const owned = await hasOwnershipColumns(prisma);
  if (scope && !owned) throw new Error("No se puede acotar por propietario: faltan las columnas userId.");

  const params = scope ? [scope.userId] : [];
  const where = (alias: string) => (scope ? `WHERE ${alias}."userId" = $1` : "");

  const tables: Record<string, number> = {};
  for (const table of FINANCIAL_TABLES) {
    const rows = await prisma.$queryRawUnsafe<{ total: bigint }[]>(
      `SELECT COUNT(*)::bigint AS total FROM "${table}" t ${where("t")}`,
      ...params,
    );
    tables[table] = num(rows[0]?.total);
  }

  const accountRows = await prisma.$queryRawUnsafe<
    {
      accountId: string;
      name: string;
      currency: string;
      status: string;
      initialBalanceCents: string;
      ledgerLiveCents: string;
      ledgerAllCents: string;
      entryCount: bigint;
    }[]
  >(
    `SELECT a.id AS "accountId", a.name, a.currency, a.status::text AS status,
            a."initialBalanceCents"::text AS "initialBalanceCents",
            COALESCE(SUM(CASE WHEN t."voidedAt" IS NULL THEN le."amountCents" ELSE 0 END), 0)::text AS "ledgerLiveCents",
            COALESCE(SUM(le."amountCents"), 0)::text AS "ledgerAllCents",
            COUNT(le.id)::bigint AS "entryCount"
     FROM "Account" a
     LEFT JOIN "LedgerEntry" le ON le."accountId" = a.id
     LEFT JOIN "Transaction" t ON t.id = le."transactionId"
     ${where("a")}
     GROUP BY a.id, a.name, a.currency, a.status, a."initialBalanceCents"
     ORDER BY a.id`,
    ...params,
  );

  const accounts: AccountChecksum[] = accountRows.map((row) => ({
    accountId: row.accountId,
    name: row.name,
    currency: row.currency,
    status: row.status,
    initialBalanceCents: big(row.initialBalanceCents),
    ledgerLiveCents: big(row.ledgerLiveCents),
    ledgerAllCents: big(row.ledgerAllCents),
    balanceCents: big(row.initialBalanceCents) + big(row.ledgerLiveCents),
    entryCount: num(row.entryCount),
  }));

  const typeRows = await prisma.$queryRawUnsafe<
    {
      type: string;
      total: bigint;
      voided: bigint;
      amountLiveCents: string;
      amountAllCents: string;
    }[]
  >(
    `SELECT t.type::text AS type,
            COUNT(*)::bigint AS total,
            COUNT(*) FILTER (WHERE t."voidedAt" IS NOT NULL)::bigint AS voided,
            COALESCE(SUM(t."amountCents") FILTER (WHERE t."voidedAt" IS NULL), 0)::text AS "amountLiveCents",
            COALESCE(SUM(t."amountCents"), 0)::text AS "amountAllCents"
     FROM "Transaction" t ${where("t")}
     GROUP BY t.type ORDER BY t.type`,
    ...params,
  );

  const types: TypeChecksum[] = typeRows.map((row) => ({
    type: row.type,
    total: num(row.total),
    voided: num(row.voided),
    live: num(row.total) - num(row.voided),
    amountLiveCents: big(row.amountLiveCents),
    amountAllCents: big(row.amountAllCents),
  }));

  const ledgerRows = await prisma.$queryRawUnsafe<
    {
      entries: bigint;
      debitCents: string;
      creditCents: string;
      liveDebitCents: string;
      liveCreditCents: string;
    }[]
  >(
    `SELECT COUNT(*)::bigint AS entries,
            COALESCE(SUM(le."amountCents") FILTER (WHERE le."amountCents" < 0), 0)::text AS "debitCents",
            COALESCE(SUM(le."amountCents") FILTER (WHERE le."amountCents" > 0), 0)::text AS "creditCents",
            COALESCE(SUM(le."amountCents") FILTER (WHERE le."amountCents" < 0 AND t."voidedAt" IS NULL), 0)::text AS "liveDebitCents",
            COALESCE(SUM(le."amountCents") FILTER (WHERE le."amountCents" > 0 AND t."voidedAt" IS NULL), 0)::text AS "liveCreditCents"
     FROM "LedgerEntry" le
     JOIN "Transaction" t ON t.id = le."transactionId"
     ${where("le")}`,
    ...params,
  );
  const ledgerRow = ledgerRows[0];

  const movementRows = await prisma.$queryRawUnsafe<
    { total: bigint; voided: bigint; corrections: bigint; transfers: bigint }[]
  >(
    `SELECT COUNT(*)::bigint AS total,
            COUNT(*) FILTER (WHERE t."voidedAt" IS NOT NULL)::bigint AS voided,
            COUNT(*) FILTER (WHERE t."correctedFromId" IS NOT NULL)::bigint AS corrections,
            COUNT(*) FILTER (WHERE t.type = 'TRANSFER')::bigint AS transfers
     FROM "Transaction" t ${where("t")}`,
    ...params,
  );
  const movementRow = movementRows[0];

  const investmentRows = await prisma.$queryRawUnsafe<
    { total: bigint; active: bigint; investedCents: string; currentValueCents: string }[]
  >(
    `SELECT COUNT(*)::bigint AS total,
            COUNT(*) FILTER (WHERE i.status = 'ACTIVE')::bigint AS active,
            COALESCE(SUM(i."investedCents"), 0)::text AS "investedCents",
            COALESCE(SUM(i."currentValueCents"), 0)::text AS "currentValueCents"
     FROM "Investment" i ${where("i")}`,
    ...params,
  );
  const investmentRow = investmentRows[0];

  const upcomingRows = await prisma.$queryRawUnsafe<
    { total: bigint; pending: bigint; paid: bigint; estimatedCents: string }[]
  >(
    `SELECT COUNT(*)::bigint AS total,
            COUNT(*) FILTER (WHERE u.status = 'PENDING')::bigint AS pending,
            COUNT(*) FILTER (WHERE u.status = 'PAID')::bigint AS paid,
            COALESCE(SUM(u."estimatedCents"), 0)::text AS "estimatedCents"
     FROM "UpcomingPayment" u ${where("u")}`,
    ...params,
  );
  const upcomingRow = upcomingRows[0];

  return {
    capturedAt: new Date().toISOString(),
    tables,
    accounts,
    types,
    ledger: {
      entries: num(ledgerRow?.entries),
      debitCents: big(ledgerRow?.debitCents),
      creditCents: big(ledgerRow?.creditCents),
      netCents: big(ledgerRow?.debitCents) + big(ledgerRow?.creditCents),
      liveDebitCents: big(ledgerRow?.liveDebitCents),
      liveCreditCents: big(ledgerRow?.liveCreditCents),
    },
    movements: {
      total: num(movementRow?.total),
      voided: num(movementRow?.voided),
      corrections: num(movementRow?.corrections),
      transfers: num(movementRow?.transfers),
    },
    investments: {
      total: num(investmentRow?.total),
      active: num(investmentRow?.active),
      investedCents: big(investmentRow?.investedCents),
      currentValueCents: big(investmentRow?.currentValueCents),
    },
    upcomingPayments: {
      total: num(upcomingRow?.total),
      pending: num(upcomingRow?.pending),
      paid: num(upcomingRow?.paid),
      estimatedCents: big(upcomingRow?.estimatedCents),
    },
    categories: { total: tables.Category ?? 0 },
  };
}

// ---------------------------------------------------------------------------
// Comparación
// ---------------------------------------------------------------------------

export interface Difference {
  scope: string;
  field: string;
  before: string;
  after: string;
}

/**
 * Compara dos capturas. Devuelve todas las diferencias contables encontradas.
 * Un backfill correcto sólo cambia la propiedad, así que el resultado esperado
 * es una lista vacía.
 */
export function compareChecksums(before: Checksums, after: Checksums): Difference[] {
  const differences: Difference[] = [];
  const note = (scope: string, field: string, a: unknown, b: unknown) => {
    if (String(a) !== String(b)) differences.push({ scope, field, before: String(a), after: String(b) });
  };

  for (const table of FINANCIAL_TABLES) {
    note("tablas", table, before.tables[table] ?? 0, after.tables[table] ?? 0);
  }

  const afterAccounts = new Map(after.accounts.map((account) => [account.accountId, account]));
  for (const account of before.accounts) {
    const match = afterAccounts.get(account.accountId);
    const scope = `cuenta ${account.name}`;
    if (!match) {
      differences.push({ scope, field: "existencia", before: "presente", after: "AUSENTE" });
      continue;
    }
    note(scope, "saldo", account.balanceCents, match.balanceCents);
    note(scope, "saldoInicial", account.initialBalanceCents, match.initialBalanceCents);
    note(scope, "ledgerVivo", account.ledgerLiveCents, match.ledgerLiveCents);
    note(scope, "ledgerTotal", account.ledgerAllCents, match.ledgerAllCents);
    note(scope, "asientos", account.entryCount, match.entryCount);
    note(scope, "moneda", account.currency, match.currency);
    note(scope, "estado", account.status, match.status);
    afterAccounts.delete(account.accountId);
  }
  for (const extra of afterAccounts.values()) {
    differences.push({ scope: `cuenta ${extra.name}`, field: "existencia", before: "AUSENTE", after: "presente" });
  }

  const afterTypes = new Map(after.types.map((type) => [type.type, type]));
  for (const type of before.types) {
    const match = afterTypes.get(type.type);
    const scope = `tipo ${type.type}`;
    if (!match) {
      differences.push({ scope, field: "existencia", before: "presente", after: "AUSENTE" });
      continue;
    }
    note(scope, "total", type.total, match.total);
    note(scope, "anulados", type.voided, match.voided);
    note(scope, "importeVivo", type.amountLiveCents, match.amountLiveCents);
    note(scope, "importeTotal", type.amountAllCents, match.amountAllCents);
    afterTypes.delete(type.type);
  }
  for (const extra of afterTypes.values()) {
    differences.push({ scope: `tipo ${extra.type}`, field: "existencia", before: "AUSENTE", after: "presente" });
  }

  note("ledger", "asientos", before.ledger.entries, after.ledger.entries);
  note("ledger", "debitos", before.ledger.debitCents, after.ledger.debitCents);
  note("ledger", "creditos", before.ledger.creditCents, after.ledger.creditCents);
  note("ledger", "neto", before.ledger.netCents, after.ledger.netCents);
  note("ledger", "debitosVivos", before.ledger.liveDebitCents, after.ledger.liveDebitCents);
  note("ledger", "creditosVivos", before.ledger.liveCreditCents, after.ledger.liveCreditCents);

  note("movimientos", "total", before.movements.total, after.movements.total);
  note("movimientos", "anulados", before.movements.voided, after.movements.voided);
  note("movimientos", "correcciones", before.movements.corrections, after.movements.corrections);
  note("movimientos", "transferencias", before.movements.transfers, after.movements.transfers);

  note("inversiones", "total", before.investments.total, after.investments.total);
  note("inversiones", "activas", before.investments.active, after.investments.active);
  note("inversiones", "aportado", before.investments.investedCents, after.investments.investedCents);
  note("inversiones", "valorActual", before.investments.currentValueCents, after.investments.currentValueCents);

  note("proximosPagos", "total", before.upcomingPayments.total, after.upcomingPayments.total);
  note("proximosPagos", "pendientes", before.upcomingPayments.pending, after.upcomingPayments.pending);
  note("proximosPagos", "pagados", before.upcomingPayments.paid, after.upcomingPayments.paid);
  note("proximosPagos", "estimado", before.upcomingPayments.estimatedCents, after.upcomingPayments.estimatedCents);

  return differences;
}

/** Serializa una captura a JSON, convirtiendo los `bigint` a texto. */
export function serializeChecksums(checksums: Checksums): string {
  return JSON.stringify(checksums, (_key, value) => (typeof value === "bigint" ? value.toString() : value), 2);
}

// ---------------------------------------------------------------------------
// Presentación
// ---------------------------------------------------------------------------

const money = (cents: bigint): string => {
  const negative = cents < 0n;
  const absolute = (negative ? -cents : cents).toString().padStart(3, "0");
  const whole = absolute.slice(0, -2).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative ? "-" : ""}${whole},${absolute.slice(-2)}`;
};

export function renderChecksums(checksums: Checksums, title: string): string {
  const lines: string[] = [`\n${title}`, "─".repeat(title.length)];

  lines.push("\nSaldos por cuenta (centavos):");
  if (checksums.accounts.length === 0) lines.push("  (sin cuentas)");
  for (const account of checksums.accounts) {
    lines.push(
      `  ${account.name.padEnd(24).slice(0, 24)} ${account.currency}  ` +
        `inicial=${account.initialBalanceCents.toString().padStart(12)}  ` +
        `ledger=${account.ledgerLiveCents.toString().padStart(12)}  ` +
        `saldo=${account.balanceCents.toString().padStart(12)}  (${money(account.balanceCents)})`,
    );
  }

  lines.push("\nMovimientos por tipo:");
  if (checksums.types.length === 0) lines.push("  (sin movimientos)");
  for (const type of checksums.types) {
    lines.push(
      `  ${type.type.padEnd(10)} total=${String(type.total).padStart(5)}  ` +
        `vivos=${String(type.live).padStart(5)}  anulados=${String(type.voided).padStart(5)}  ` +
        `importeVivo=${type.amountLiveCents.toString().padStart(12)}`,
    );
  }

  lines.push("\nLedger:");
  lines.push(`  asientos=${checksums.ledger.entries}`);
  lines.push(`  débitos=${checksums.ledger.debitCents}  créditos=${checksums.ledger.creditCents}`);
  lines.push(`  débitos vivos=${checksums.ledger.liveDebitCents}  créditos vivos=${checksums.ledger.liveCreditCents}`);

  lines.push("\nOtros:");
  lines.push(
    `  movimientos=${checksums.movements.total} anulados=${checksums.movements.voided} ` +
      `correcciones=${checksums.movements.corrections} transferencias=${checksums.movements.transfers}`,
  );
  lines.push(
    `  inversiones=${checksums.investments.total} (activas ${checksums.investments.active}) ` +
      `aportado=${checksums.investments.investedCents} valor=${checksums.investments.currentValueCents}`,
  );
  lines.push(
    `  próximos pagos=${checksums.upcomingPayments.total} ` +
      `(pendientes ${checksums.upcomingPayments.pending}, pagados ${checksums.upcomingPayments.paid}) ` +
      `estimado=${checksums.upcomingPayments.estimatedCents}`,
  );
  lines.push(`  categorías=${checksums.categories.total}`);

  return lines.join("\n");
}

export function renderDifferences(differences: Difference[]): string {
  if (differences.length === 0) return "\n✔ Sin diferencias contables.";
  const lines = ["\n✖ DIFERENCIAS CONTABLES DETECTADAS:"];
  for (const difference of differences) {
    lines.push(`  ${difference.scope} · ${difference.field}: ${difference.before} → ${difference.after}`);
  }
  return lines.join("\n");
}
