import type { Metadata } from "next";
import Link from "next/link";
import { OperationalShell } from "../../components/finance/OperationalShell";
import { ImportWizard } from "../../components/finance/ImportWizard";
import { ImportHistory } from "../../components/finance/ImportHistory";
import { requireOnboardedUser } from "../../lib/auth/guards";
import { getDb } from "../../lib/db";
import { EmptyState } from "../../design-system/feedback";
import styles from "../../components/finance/finance.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Importar · Doleth",
  robots: { index: false },
};

export default async function ImportPage() {
  const user = await requireOnboardedUser("/importar");
  const db = getDb();

  const [accounts, batches] = await Promise.all([
    db.account.findMany({
      where: { userId: user.id, status: "ACTIVE" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, currency: true },
    }),
    db.importBatch.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { account: { select: { name: true } } },
    }),
  ]);

  return (
    <OperationalShell
      eyebrow="Base financiera"
      intro="Subí el resumen de tu banco o tu tarjeta. Doleth lo lee, te muestra qué encontró y recién guarda cuando confirmás."
      title="Importar movimientos"
    >
      {accounts.length === 0 ? (
        <EmptyState
          description="Para importar hace falta una cuenta donde imputar los movimientos."
          primaryAction={
            <Link className={styles.primaryLink} href="/cuentas/nueva">
              Crear una cuenta
            </Link>
          }
          title="Todavía no tenés cuentas"
        />
      ) : (
        <ImportWizard accounts={accounts} />
      )}

      <ImportHistory
        batches={batches.map((batch) => ({
          id: batch.id,
          originalName: batch.originalName,
          accountName: batch.account.name,
          status: batch.status,
          rowCount: batch.rowCount,
          committedCount: batch.committedCount,
          createdAt: batch.createdAt.toISOString(),
        }))}
      />
    </OperationalShell>
  );
}
