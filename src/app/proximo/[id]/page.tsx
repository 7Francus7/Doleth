import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { OperationalShell } from "../../../components/finance/OperationalShell";
import { ConfirmPaymentForm } from "../../../components/finance/ConfirmPaymentForm";
import { RepeatUpcomingPaymentForm } from "../../../components/finance/RepeatUpcomingPaymentForm";
import { SensitiveAmount } from "../../../components/privacy/AmountPrivacy";
import { requireOnboardedUser } from "../../../lib/auth/guards";
import { getDb } from "../../../lib/db";
import { formatCentsAR } from "../../../lib/finance/amount";
import { getOwnedUpcomingPayment, loadSelectableCategories } from "../../../lib/finance/data";
import { todayInArgentina } from "../../../lib/finance/domain";
import { nextMonthSameDay, paymentState } from "../../../lib/finance/projection";
import { describeDueDateAR } from "../../../lib/finance/upcomingDate";
import { sanitizeReturnPath } from "../../../lib/navigation/returnPath";
import styles from "../../../features/plan/planDetail.module.css";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Detalle de próximo pago" };

const STATE_LABELS = {
  overdue: "Vencido",
  "due-today": "Vence hoy",
  pending: "Pendiente",
  paid: "Pagado",
} as const;

const frequencyLabel = (frequency: string | null) => frequency === "MONTHLY" ? "Mensual" : frequency || "Única";

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function UpcomingPaymentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { id } = await params;
  const user = await requireOnboardedUser(`/proximo/${id}`);
  const returnTo = sanitizeReturnPath(first((await searchParams).volver) ?? null, "/proximo");
  const payment = await getOwnedUpcomingPayment(user.id, id);
  if (!payment) notFound();

  const today = todayInArgentina();
  const dueOn = payment.dueOn.toISOString().slice(0, 10);
  const state = paymentState(dueOn, today, payment.status);

  // El saldo de la cuenta prevista se deriva del ledger, igual que en /cuentas.
  // `userId` acota la suma aunque la cuenta ya sea del usuario: el asiento es la
  // unidad que se agrega, y ninguna agregación financiera queda sin dueño.
  const entries = await getDb().ledgerEntry.aggregate({
    where: { userId: user.id, accountId: payment.plannedAccountId, transaction: { voidedAt: null } },
    _sum: { amountCents: true },
  });
  // La categoría ya elegida viaja aunque esté archivada: confirmar un pago viejo
  // no puede cambiarle el destino por una decisión posterior sobre el catálogo.
  const categories = await loadSelectableCategories(user.id, payment.categoryId);
  const balanceCents = payment.plannedAccount.initialBalanceCents + (entries._sum.amountCents ?? 0n);

  return (
    <OperationalShell
      back={{ href: returnTo, label: "Volver a Próximo" }}
      eyebrow={STATE_LABELS[state]}
      title={payment.concept}
    >
      <section className={styles.detail}>
        <div className={styles.hero} data-state={payment.status === "PAID" ? "paid" : "pending"}>
          <p>{STATE_LABELS[state]}</p>
          <strong><SensitiveAmount>{payment.plannedAccount.currency === "ARS" ? "$" : `${payment.plannedAccount.currency} `}{formatCentsAR(payment.estimatedCents)}</SensitiveAmount></strong>
          <span>{payment.concept}</span>
        </div>
        <div><dl className={styles.facts}>
          <div>
            <dt>Importe previsto</dt>
            <dd><SensitiveAmount>{payment.plannedAccount.currency === "ARS" ? "$" : `${payment.plannedAccount.currency} `}{formatCentsAR(payment.estimatedCents)}</SensitiveAmount></dd>
          </div>
          <div>
            <dt>Vencimiento</dt>
            <dd>{describeDueDateAR(dueOn, today)}</dd>
          </div>
          <div>
            <dt>Cuenta prevista</dt>
            <dd>{payment.plannedAccount.name}</dd>
          </div>
          <div>
            <dt>Categoría</dt>
            {/*
              Se dice antes de confirmar y no después: es la categoría en la que
              va a quedar el gasto, y "Otros gastos" acá es una advertencia útil,
              no un detalle administrativo.
            */}
            <dd>{payment.category?.name ?? "Sin elegir · irá a Otros gastos"}</dd>
          </div>
          <div>
            <dt>Frecuencia</dt>
            <dd>{frequencyLabel(payment.frequency)}</dd>
          </div>
          <div>
            <dt>Estado</dt>
            <dd>{STATE_LABELS[state]}</dd>
          </div>
        </dl>
        <p className={styles.note}>
          Los importes de próximos pagos son los que vos cargaste. Este pago no descuenta de tus
          cuentas hasta que lo confirmes.
        </p></div>
      </section>

      {payment.transaction ? (
        <section className={styles.paidActions}>
          <p className={styles.note}>
            Este pago ya se confirmó: salieron <SensitiveAmount>{payment.plannedAccount.currency === "ARS" ? "$" : `${payment.plannedAccount.currency} `}{formatCentsAR(payment.transaction.amountCents)}</SensitiveAmount> de{" "}
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
            categories={categories}
            categoryId={payment.categoryId}
            currency={payment.plannedAccount.currency}
            concept={payment.concept}
            paymentId={payment.id}
            plannedAmount={formatCentsAR(payment.estimatedCents)}
            returnTo={returnTo}
            today={today}
          />
          <section>
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
