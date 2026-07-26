import Link from "next/link";
import { notFound } from "next/navigation";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { ConfirmPaymentForm } from "../../../components/finance/ConfirmPaymentForm";
import { RepeatUpcomingPaymentForm } from "../../../components/finance/RepeatUpcomingPaymentForm";
import { SensitiveAmount } from "../../../components/privacy/AmountPrivacy";
import { getDb } from "../../../lib/db";
import { formatCentsAR } from "../../../lib/finance/amount";
import { todayInArgentina } from "../../../lib/finance/domain";
import { nextMonthSameDay, paymentState } from "../../../lib/finance/projection";
import { describeDueDateAR } from "../../../lib/finance/upcomingDate";
import { sanitizeReturnPath } from "../../../lib/navigation/returnPath";
import styles from "../../../components/finance/finance.module.css";

export const dynamic = "force-dynamic";

const STATE_LABELS = {
  overdue: "Vencido",
  "due-today": "Vence hoy",
  pending: "Pendiente",
  paid: "Pagado",
} as const;

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function UpcomingPaymentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const returnTo = sanitizeReturnPath(first((await searchParams).volver) ?? null, "/proximo");
  const payment = await getDb().upcomingPayment.findUnique({
    where: { id },
    include: { plannedAccount: true, transaction: true },
  });
  if (!payment) notFound();

  const today = todayInArgentina();
  const dueOn = payment.dueOn.toISOString().slice(0, 10);
  const state = paymentState(dueOn, today, payment.status);

  // El saldo de la cuenta prevista se deriva del ledger, igual que en /cuentas.
  const entries = await getDb().ledgerEntry.aggregate({
    where: { accountId: payment.plannedAccountId, transaction: { voidedAt: null } },
    _sum: { amountCents: true },
  });
  const balanceCents = payment.plannedAccount.initialBalanceCents + (entries._sum.amountCents ?? 0n);

  return (
    <OperationalShell
      back={{ href: returnTo, label: "Volver a Próximo" }}
      eyebrow={STATE_LABELS[state]}
      title={payment.concept}
    >
      <section className={styles.panel}>
        <dl className={styles.detailGrid}>
          <div className={styles.detailRow}>
            <dt>Importe previsto</dt>
            <dd><SensitiveAmount>${formatCentsAR(payment.estimatedCents)}</SensitiveAmount></dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Vencimiento</dt>
            <dd>{describeDueDateAR(dueOn, today)}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Cuenta prevista</dt>
            <dd>{payment.plannedAccount.name}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Frecuencia</dt>
            <dd>{payment.frequency || "Única"}</dd>
          </div>
          <div className={styles.detailRow}>
            <dt>Estado</dt>
            <dd>{STATE_LABELS[state]}</dd>
          </div>
        </dl>
        <p className={styles.fieldHelp}>
          Los importes de próximos pagos son los que vos cargaste. Este pago no descuenta de tus
          cuentas hasta que lo confirmes.
        </p>
      </section>

      {payment.transaction ? (
        <section className={styles.panel}>
          <p className={styles.fieldHelp}>
            Este pago ya se confirmó: salieron <SensitiveAmount>${formatCentsAR(payment.transaction.amountCents)}</SensitiveAmount> de{" "}
            {payment.plannedAccount.name}.
          </p>
          <Link className={styles.primaryLink} href={`/movimientos/${payment.transaction.id}`}>
            Ver movimiento
          </Link>
          <RepeatUpcomingPaymentForm
            nextDueLabel={describeDueDateAR(nextMonthSameDay(dueOn), today).toLowerCase()}
            paymentId={payment.id}
          />
        </section>
      ) : (
        <>
          <ConfirmPaymentForm
            accountBalanceCents={balanceCents.toString()}
            accountName={payment.plannedAccount.name}
            concept={payment.concept}
            paymentId={payment.id}
            plannedAmount={formatCentsAR(payment.estimatedCents)}
            returnTo={returnTo}
            today={today}
          />
          <section className={styles.panel}>
            <RepeatUpcomingPaymentForm
              nextDueLabel={describeDueDateAR(nextMonthSameDay(dueOn), today).toLowerCase()}
              paymentId={payment.id}
            />
          </section>
        </>
      )}
    </OperationalShell>
  );
}
