import "server-only";
import { formatCents, formatDateAR } from "../../../lib/finance/domain";
import { reconcileCoverage, selectRecommendation, type ActDecisionResult, type ActRuleId } from "../../../lib/finance/analysis";
import { getActData } from "../../../lib/finance/data";
import type { RecommendationEvidence } from "../evidence/model";
import type { ActViewModel } from "../model";

const money = (cents: bigint): string => formatCents(cents < 0n ? -cents : cents);

interface RuleCopy {
  stateLabel: string;
  conclusion: string;
  consequence: string;
  reason: string;
  primaryActionLabel: string;
  completionTitle: string;
  impactActLabel: string;
  impactActSupport: string;
  impactActValue: string;
  impactWaitLabel: string;
  impactWaitSupport: string;
  impactWaitValue: string;
  evidenceTitle: string;
  evidenceSubtitle: string;
  priorityLabel: string;
  priorityReason: string;
  commitmentLabel: string;
  coverageLabel: string;
  missingLabel: string;
  waitConsequence: string;
  urgent: boolean;
}

function ruleCopy(decision: ActDecisionResult, today: string): RuleCopy {
  const payment = decision.payment;
  const concept = payment?.concept ?? "";
  const dueLabel = payment ? formatDateAR(payment.dueOn) : formatDateAR(today);

  const map: Record<ActRuleId, RuleCopy> = {
    "no-accounts": {
      stateLabel: "Primer paso",
      conclusion: "Creá tu primera cuenta",
      consequence: "Sin una cuenta con saldo real no hay nada que analizar todavía.",
      reason: "Doleth necesita al menos una cuenta con su saldo inicial para leer tu situación.",
      primaryActionLabel: "Entendido",
      completionTitle: "Crear tu primera cuenta queda marcado como próximo paso.",
      impactActLabel: "Si actuás",
      impactActSupport: "Cargás tu base real y habilitás todas las lecturas.",
      impactActValue: "Ahora",
      impactWaitLabel: "Si esperás",
      impactWaitSupport: "Las pantallas siguen sin base para mostrar.",
      impactWaitValue: "Sin datos",
      evidenceTitle: "Por qué aparece esto",
      evidenceSubtitle: "Base financiera pendiente",
      priorityLabel: "Prioridad 1",
      priorityReason: "Sin cuentas no hay patrimonio ni movimientos para evaluar.",
      commitmentLabel: "Cuentas necesarias",
      coverageLabel: "Cuentas registradas",
      missingLabel: "Falta registrar",
      waitConsequence: "Nada cambia hasta que exista una cuenta.",
      urgent: true,
    },
    "overdue-payment": {
      stateLabel: "Recomendación para hoy",
      conclusion: `Revisá el pago de ${concept}`,
      consequence: `Venció el ${dueLabel} y sigue pendiente.`,
      reason: `El pago de ${concept} venció el ${dueLabel} y todavía figura como pendiente.`,
      primaryActionLabel: "Revisar y confirmar",
      completionTitle: `Revisar ${concept} queda marcado para hoy.`,
      impactActLabel: "Si actuás",
      impactActSupport: "Resolvés un compromiso que ya está vencido.",
      impactActValue: "Hoy",
      impactWaitLabel: "Si esperás",
      impactWaitSupport: "El pago acumula más atraso.",
      impactWaitValue: "Vencido",
      evidenceTitle: "Por qué es prioridad",
      evidenceSubtitle: `${concept} · vencido`,
      priorityLabel: "Prioridad 2",
      priorityReason: "Un pago vencido es lo más urgente entre los compromisos pendientes.",
      commitmentLabel: "Importe del pago",
      coverageLabel: `Disponible en ${payment?.accountName ?? "la cuenta"}`,
      missingLabel: "Faltante para cubrirlo",
      waitConsequence: "Mientras siga pendiente, el atraso continúa.",
      urgent: true,
    },
    "uncovered-upcoming": {
      stateLabel: "Recomendación para hoy",
      conclusion: `Reforzá antes de ${concept}`,
      consequence: `Los pagos próximos superan tu patrimonio disponible.`,
      reason: `Los pagos de los próximos 7 días suman más que tu patrimonio actual. El más cercano es ${concept} (${dueLabel}).`,
      primaryActionLabel: "Revisar y confirmar",
      completionTitle: "Reforzar tus próximos pagos queda marcado para hoy.",
      impactActLabel: "Si actuás",
      impactActSupport: "Preparás cobertura antes de los vencimientos.",
      impactActValue: "Hoy",
      impactWaitLabel: "Si esperás",
      impactWaitSupport: "Llegás a los vencimientos con faltante.",
      impactWaitValue: "En riesgo",
      evidenceTitle: "Por qué es prioridad",
      evidenceSubtitle: "Próximos 7 días sin cobertura",
      priorityLabel: "Prioridad 3",
      priorityReason: "El patrimonio actual no alcanza a cubrir los pagos próximos.",
      commitmentLabel: "Pagos próximos (7 días)",
      coverageLabel: "Patrimonio disponible",
      missingLabel: "Faltante para cubrir",
      waitConsequence: "Sin refuerzo, algún pago próximo queda sin cubrir.",
      urgent: true,
    },
    "no-movements": {
      stateLabel: "Próximo paso",
      conclusion: "Registrá tu primer movimiento",
      consequence: "Con cuentas pero sin movimientos, todavía no hay actividad que leer.",
      reason: "Ya tenés cuentas, pero aún no registraste movimientos. El primero habilita las lecturas de cambios y progreso.",
      primaryActionLabel: "Entendido",
      completionTitle: "Registrar tu primer movimiento queda marcado como próximo paso.",
      impactActLabel: "Si actuás",
      impactActSupport: "Empezás a construir tu historial real.",
      impactActValue: "Ahora",
      impactWaitLabel: "Si esperás",
      impactWaitSupport: "Cambios y progreso siguen sin base.",
      impactWaitValue: "Sin datos",
      evidenceTitle: "Por qué aparece esto",
      evidenceSubtitle: "Sin movimientos registrados",
      priorityLabel: "Prioridad 4",
      priorityReason: "Sin movimientos no hay actividad para analizar.",
      commitmentLabel: "Movimientos esperados",
      coverageLabel: "Movimientos registrados",
      missingLabel: "Falta registrar",
      waitConsequence: "Nada cambia hasta que registres un movimiento.",
      urgent: false,
    },
    stable: {
      stateLabel: "Sin acciones urgentes",
      conclusion: "No hay acciones urgentes",
      consequence: "Tus próximos compromisos están cubiertos con la información disponible.",
      reason: "No hay pagos vencidos ni compromisos próximos sin cobertura. No hace falta actuar hoy.",
      primaryActionLabel: "Entendido",
      completionTitle: "Quedó registrado que revisaste tu situación.",
      impactActLabel: "Si revisás",
      impactActSupport: "Confirmás que todo está en orden.",
      impactActValue: "Hoy",
      impactWaitLabel: "Si esperás",
      impactWaitSupport: "No hay consecuencia inmediata.",
      impactWaitValue: "Estable",
      evidenceTitle: "Por qué está estable",
      evidenceSubtitle: "Compromisos cubiertos",
      priorityLabel: "Sin urgencia",
      priorityReason: "Ninguna regla de atención se activó con los datos actuales.",
      commitmentLabel: "Pagos próximos (7 días)",
      coverageLabel: "Patrimonio disponible",
      missingLabel: "Faltante",
      waitConsequence: "No hay consecuencia inmediata por esperar.",
      urgent: false,
    },
  };

  return map[decision.ruleId];
}

export async function getActModel(): Promise<ActViewModel> {
  const data = await getActData();
  const decision = selectRecommendation({
    today: data.today,
    hasAccounts: data.hasAccounts,
    movementCount: data.movementCount,
    patrimonyCents: data.patrimonyCents,
    pendingPayments: data.pendingPayments,
  });
  const copy = ruleCopy(decision, data.today);

  // Cobertura acotada para que la evidencia reconcilie: compromiso − cobertura = faltante ≥ 0.
  const commitmentCents = decision.commitmentCents;
  const { coverageCents, missingCents } = reconcileCoverage(commitmentCents, decision.coverageCents);

  const confidenceLabel = decision.hasEvidence ? "Información completa" : "Información disponible";
  const amountTone = missingCents > 0n ? "attention" : "neutral";
  const amountState = decision.hasEvidence ? "confirmed" : "estimated";

  const evidence: RecommendationEvidence = {
    title: copy.evidenceTitle,
    subtitle: copy.evidenceSubtitle,
    priorityLabel: copy.priorityLabel,
    priorityReason: copy.priorityReason,
    lines: [
      {
        id: "commitment",
        label: copy.commitmentLabel,
        amount: Number(commitmentCents),
        displayValue: money(commitmentCents),
        valuePrefix: "$",
      },
      {
        id: "coverage",
        label: copy.coverageLabel,
        amount: Number(coverageCents),
        displayValue: money(coverageCents),
        valuePrefix: "$",
      },
    ],
    missing: {
      id: "missing",
      label: copy.missingLabel,
      amount: Number(missingCents),
      displayValue: money(missingCents),
      valuePrefix: "$",
    },
    dateLabel: decision.payment ? "Vence" : "Corte de hoy",
    dateValue: decision.payment ? formatDateAR(decision.payment.dueOn) : formatDateAR(data.today),
    waitLabel: "Si esperás",
    waitConsequence: copy.waitConsequence,
  };

  const confirmationDetails = decision.payment
    ? [
        { label: "Concepto", value: decision.payment.concept },
        { label: "Cuenta prevista", value: decision.payment.accountName },
        { label: "Vencimiento", value: formatDateAR(decision.payment.dueOn) },
      ]
    : [
        { label: "Situación", value: copy.evidenceSubtitle },
        { label: "Fecha", value: formatDateAR(data.today) },
      ];

  return {
    navigation: { backHref: "/ahora", backLabel: "Ahora", title: "Actuar" },
    rail: {
      items: ["Desde Ahora", "ARS", confidenceLabel],
      state: decision.hasEvidence ? "complete" : "partial",
      wrap: "truncate",
    },
    recommendation: {
      stateLabel: copy.stateLabel,
      conclusion: copy.conclusion,
      amount: {
        value: money(missingCents),
        prefix: "$",
        size: "xl",
        tone: amountTone,
        format: "currency",
        state: amountState,
      },
      consequence: copy.consequence,
      confidenceLabel,
      evidenceTriggerLabel: "Ver por qué",
    },
    evidence,
    reason: copy.reason,
    impact: {
      title: "Qué cambia",
      rows: [
        {
          label: copy.impactActLabel,
          supportingLabel: copy.impactActSupport,
          value: copy.impactActValue,
          density: "compact",
        },
        {
          label: copy.impactWaitLabel,
          supportingLabel: copy.impactWaitSupport,
          value: copy.impactWaitValue,
          density: "compact",
        },
      ],
    },
    decision: {
      label: "Qué hacés",
      helper: "Nada se mueve. Esto solo deja registrado que lo revisaste.",
      primaryActionLabel: copy.primaryActionLabel,
      confirmation: {
        label: "Antes de confirmar",
        helper: "Esto no ejecuta ningún movimiento. Solo marca que lo revisaste.",
        amountLabel: copy.missingLabel,
        amount: {
          value: money(missingCents),
          prefix: "$",
          size: "lg",
          tone: amountTone,
          format: "currency",
          state: amountState,
        },
        details: confirmationDetails,
        primaryActionLabel: "Marcar como revisado",
        secondaryActionLabel: "Volver",
      },
      completion: {
        label: "Anotado",
        title: copy.completionTitle,
        detail: "No hubo ningún movimiento real.",
        control: "Podés deshacerlo o cerrar.",
        undoLabel: "Deshacer",
        closeLabel: "Cerrar",
      },
      secondaryActions: [
        { id: "deferred", label: "Dejar para después" },
        { id: "dismissed", label: "No insistir con esto" },
      ],
      outcomes: {
        deferred: {
          label: "La dejamos para después",
          title: "Queda en pausa.",
          detail: "La retomás cuando tengas margen.",
          resetLabel: "Retomar",
        },
        dismissed: {
          label: "No insistimos con esta",
          title: "Deja de aparecer por ahora.",
          detail: "Si cambian los datos, puede volver a aparecer.",
          resetLabel: "Volver a verla",
        },
      },
    },
  };
}
