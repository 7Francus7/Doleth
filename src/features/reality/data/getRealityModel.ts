import "server-only";
import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import type { EvidenceBreakdown } from "../../evidence/model";
import { formatCents } from "../../../lib/finance/domain";
import { describeMonthAR, describePlainDateAR } from "../../../lib/finance/movementDate";
import { computeReality, type RealityResult, type RealitySignalId } from "../../../lib/finance/reality";
import { getRealityData } from "../../../lib/finance/data";
import type {
  RealityQuality,
  RealitySection,
  RealitySignalRow,
  RealityViewModel,
} from "../model";

const money = (cents: bigint): string => formatCents(cents < 0n ? -cents : cents);
const prefix = (cents: bigint): string => (cents < 0n ? "-$" : "$");
const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

const ACCOUNT_TYPE: Record<string, string> = {
  CASH: "Efectivo",
  BANK: "Banco",
  WALLET: "Billetera virtual",
  SAVINGS: "Ahorro",
  OTHER: "Otra",
};

/**
 * Cómo se llama cada estado de la representación. "Completa para análisis" no
 * dice que Doleth conozca toda la vida financiera de la persona: dice que lo
 * cargado alcanza para explicar lo registrado.
 */
const COMPLETENESS_LABEL: Record<RealityResult["completeness"], string> = {
  empty: "Sin base registrada",
  initial: "Información inicial",
  partial: "Representación parcial",
  sufficient: "Información suficiente",
  "analysis-ready": "Completa para análisis",
};

const COMPLETENESS_SUMMARY: Record<RealityResult["completeness"], string> = {
  empty: "Todavía no hay cuentas registradas, así que no hay una situación que describir.",
  initial: "Ya representaste dónde está tu dinero. Falta información para explicar cómo cambia.",
  partial: "Esta lectura usa únicamente la información cargada en Doleth.",
  sufficient: "Doleth tiene suficiente información para explicar tu situación registrada.",
  "analysis-ready":
    "Doleth tiene suficiente información para explicar tu situación registrada y compararla entre períodos.",
};

interface SignalCopy {
  label: string;
  met: (result: RealityResult) => string;
  missing: (result: RealityResult) => string;
  matters: string;
  action?: { label: string; href: string };
}

/**
 * Seis señales explícitas, cada una verificable contra un objeto real. No hay
 * puntaje: la razón "4 de 6" se puede auditar señal por señal.
 */
const SIGNAL_COPY: Record<RealitySignalId, SignalCopy> = {
  "active-account": {
    label: "Al menos una cuenta activa",
    met: (result) =>
      `${result.activeCount} ${plural(result.activeCount, "cuenta activa", "cuentas activas")} en uso.`,
    missing: () => "No hay cuentas activas: no hay dónde ubicar tu dinero.",
    matters: "Sin una cuenta activa no hay patrimonio que componer ni movimientos que registrar.",
    action: { label: "Crear cuenta", href: "/cuentas/nueva" },
  },
  "accounts-with-origin": {
    label: "Cada cuenta tiene origen",
    met: () => "Todas tus cuentas tienen saldo inicial o actividad registrada.",
    missing: () =>
      "Alguna cuenta quedó en cero y sin movimientos: su saldo no proviene de nada cargado.",
    matters: "Una cuenta sin saldo inicial ni movimientos aporta cero al patrimonio sin decir por qué.",
    action: { label: "Ver cuentas", href: "/cuentas" },
  },
  movements: {
    label: "Movimientos en el período",
    met: (result) =>
      `${result.activity.movementCount} ${plural(result.activity.movementCount, "movimiento registrado", "movimientos registrados")} este mes.`,
    missing: () => "Este mes todavía no tiene movimientos registrados.",
    matters: "Sin movimientos Doleth puede decir cuánto tenés, pero no cómo cambió.",
    action: { label: "Registrar movimiento", href: "/movimientos/nuevo" },
  },
  income: {
    label: "Ingresos registrados",
    met: (result) => `$${money(result.activity.incomeCents)} en ingresos registrados este mes.`,
    missing: () => "No encontramos ingresos registrados en el período.",
    matters:
      "Sin ingresos cargados el resultado del mes solo muestra gastos, aunque hayas cobrado.",
    action: { label: "Registrar ingreso", href: "/movimientos/nuevo" },
  },
  upcoming: {
    label: "Compromisos cargados",
    met: (result) =>
      `${result.commitments.totalCount} ${plural(result.commitments.totalCount, "pago próximo cargado", "pagos próximos cargados")}.`,
    missing: () => "No hay compromisos próximos cargados.",
    matters: "Sin compromisos cargados la proyección solo refleja el dinero actual.",
    action: { label: "Cargar un pago", href: "/proximo/nuevo" },
  },
  "reviewed-overdue": {
    label: "Sin pagos vencidos por revisar",
    met: () => "Ningún pago cargado quedó con la fecha pasada.",
    missing: (result) =>
      `${result.commitments.overdueCount} ${plural(result.commitments.overdueCount, "pago venció", "pagos vencieron")} y sigue${result.commitments.overdueCount === 1 ? "" : "n"} sin confirmar.`,
    matters:
      "Un pago vencido sin confirmar puede significar que ya lo pagaste y falta registrarlo.",
    action: { label: "Revisar próximos pagos", href: "/proximo" },
  },
};

function buildSignals(result: RealityResult): RealitySignalRow[] {
  return result.signals.map((signal) => {
    const copy = SIGNAL_COPY[signal.id];
    return {
      id: signal.id,
      label: copy.label,
      state: signal.met ? "met" : "missing",
      reading: signal.met ? copy.met(result) : copy.missing(result),
      matters: copy.matters,
      ...(signal.met || !copy.action
        ? {}
        : { actionLabel: copy.action.label, actionHref: copy.action.href }),
    } satisfies RealitySignalRow;
  });
}

/** "3 cuentas activas, 1 archivada y 2 inversiones": la síntesis dice la fórmula real. */
function buildSynthesis(result: RealityResult): string {
  const parts: string[] = [
    `${result.activeCount} ${plural(result.activeCount, "cuenta activa", "cuentas activas")}`,
  ];
  if (result.archivedCount > 0) {
    parts.push(`${result.archivedCount} ${plural(result.archivedCount, "archivada", "archivadas")}`);
  }
  const accounts = parts.length === 1 ? parts[0]! : `${parts[0]} y ${parts.slice(1).join(", ")}`;
  const base = `Tu patrimonio registrado está distribuido en ${accounts}.`;
  if (!result.investmentsAvailable) return base;
  if (result.investmentCount === 0) return base;
  return `${base} Además tenés ${result.investmentCount} ${plural(result.investmentCount, "inversión registrada, que se cuenta aparte", "inversiones registradas, que se cuentan aparte")}.`;
}

function accountRows(
  accounts: RealityResult["activeAccounts"],
  today: string,
  archived: boolean,
): FinancialRowProps[] {
  return accounts.map((account) => {
    const type = ACCOUNT_TYPE[account.type] ?? "Cuenta";
    const share =
      account.sharePercent === null ? null : `${account.sharePercent}% del dinero operativo`;
    const activity = account.lastActivityOn
      ? `última actividad el ${describePlainDateAR(account.lastActivityOn, today)}`
      : "sin movimientos registrados";
    return {
      kind: "with-status" as const,
      label: account.name,
      supportingLabel: [type, share].filter(Boolean).join(" · "),
      status: archived ? `Fuera del uso cotidiano · ${activity}` : activity,
      value: money(account.balanceCents),
      valuePrefix: prefix(account.balanceCents),
      ...(account.balanceCents < 0n ? { state: "attention" as const } : {}),
    };
  });
}

function buildSections(result: RealityResult, today: string): RealitySection[] {
  const sections: RealitySection[] = [];
  const monthLabel = describeMonthAR(result.period.start.slice(0, 7), today);

  // 1. Dónde está mi dinero -------------------------------------------------
  if (result.activeCount > 0) {
    sections.push({
      id: "money",
      title: "Dónde está tu dinero",
      supportingLine: "Cuentas activas, con su participación sobre el total operativo",
      rows: [
        ...accountRows(result.activeAccounts, today, false),
        {
          label: "Dinero operativo",
          supportingLabel: `Σ saldos de ${result.activeCount} ${plural(result.activeCount, "cuenta activa", "cuentas activas")}`,
          value: money(result.activeCents),
          valuePrefix: prefix(result.activeCents),
        },
      ],
      note: "El saldo de cada cuenta es su saldo inicial más los movimientos no anulados. La participación se calcula sobre el dinero operativo.",
      noteKind: "stable",
      actionLabel: "Ver cuentas",
      actionHref: "/cuentas",
    });
  }

  // 2. Fuera del uso cotidiano ---------------------------------------------
  const outsideRows: FinancialRowProps[] = [];
  if (result.archivedCount > 0) {
    outsideRows.push(...accountRows(result.archivedAccounts, today, true));
  }
  if (result.investmentsAvailable && result.investmentCount > 0) {
    outsideRows.push({
      kind: "with-status",
      label: "Inversiones",
      supportingLabel: `${result.investmentCount} ${plural(result.investmentCount, "posición registrada", "posiciones registradas")}`,
      status: "No suma al patrimonio en cuentas",
      value: money(result.investedCents),
      valuePrefix: "$",
    });
  }
  if (outsideRows.length > 0 || !result.investmentsAvailable) {
    sections.push({
      id: "outside",
      title: "Fuera del uso cotidiano",
      supportingLine: "Lo que conserva su historia y lo que vive en otro dominio",
      rows: outsideRows,
      note:
        result.archivedCount > 0
          ? "Estas cuentas conservan su historia, pero están fuera del uso cotidiano. Sus saldos siguen dentro del patrimonio; las inversiones no, porque no tienen una cuenta que las respalde."
          : "Las inversiones se muestran aparte: no tienen una cuenta que las respalde, así que sumarlas al patrimonio contaría dos veces lo mismo.",
      noteKind: "neutral",
      ...(result.investmentCount > 0
        ? { actionLabel: "Ver inversiones", actionHref: "/inversiones" }
        : {}),
      ...(result.investmentsAvailable
        ? {}
        : {
            notice:
              "No pudimos cargar las inversiones. Tu patrimonio en cuentas sigue disponible y no depende de ellas.",
          }),
    });
  }

  // 3. Qué tengo comprometido ----------------------------------------------
  const commitments = result.commitments;
  if (!result.commitmentsAvailable) {
    sections.push({
      id: "commitments",
      title: "Qué tenés comprometido",
      supportingLine: "Próximos pagos cargados, sin restar del patrimonio",
      rows: [],
      note: "Los compromisos no se restan del patrimonio: todavía no ocurrieron.",
      noteKind: "neutral",
      notice:
        "No pudimos cargar los próximos pagos. Esta lectura queda sin la parte comprometida, no en cero.",
    });
  } else if (commitments.totalCount > 0) {
    const rows: FinancialRowProps[] = [];
    if (commitments.overdueCount > 0) {
      rows.push({
        kind: "with-status",
        label: "Vencidos",
        supportingLabel: `${commitments.overdueCount} ${plural(commitments.overdueCount, "pago con fecha pasada", "pagos con fecha pasada")}`,
        status: "Sin confirmar",
        value: money(commitments.overdueCents),
        valuePrefix: "$",
        state: "attention",
      });
    }
    if (commitments.horizonCount > 0) {
      rows.push({
        kind: "with-status",
        label: `Próximos ${commitments.horizonDays} días`,
        supportingLabel: `${commitments.horizonCount} ${plural(commitments.horizonCount, "pago pendiente", "pagos pendientes")} hasta el ${describePlainDateAR(commitments.horizonEnd, today)}`,
        status: "Dentro del horizonte de la proyección",
        value: money(commitments.horizonCents),
        valuePrefix: "$",
      });
    }
    if (commitments.beyondCount > 0) {
      rows.push({
        kind: "with-status",
        label: "Más adelante",
        supportingLabel: `${commitments.beyondCount} ${plural(commitments.beyondCount, "pago", "pagos")} después del ${describePlainDateAR(commitments.horizonEnd, today)}`,
        status: "Fuera del horizonte: no se proyecta",
        value: money(commitments.beyondCents),
        valuePrefix: "$",
      });
    }
    rows.push({
      label: "Total comprometido",
      supportingLabel: `Σ de ${commitments.totalCount} ${plural(commitments.totalCount, "pago pendiente", "pagos pendientes")}`,
      value: money(commitments.totalCents),
      valuePrefix: "$",
    });
    sections.push({
      id: "commitments",
      title: "Qué tenés comprometido",
      supportingLine: `Pagos pendientes, con el horizonte de ${commitments.horizonDays} días declarado`,
      rows,
      note: "Ninguno de estos importes se resta del patrimonio: son compromisos cargados, no movimientos ocurridos.",
      noteKind: commitments.overdueCount > 0 ? "attention" : "neutral",
      actionLabel: "Ver Próximo",
      actionHref: "/proximo",
    });
  } else {
    sections.push({
      id: "commitments",
      title: "Qué tenés comprometido",
      supportingLine: "Todavía sin pagos próximos cargados",
      rows: [],
      note: "No hay compromisos próximos cargados. Tu proyección solo refleja el dinero actual.",
      noteKind: "neutral",
      actionLabel: "Cargar un pago",
      actionHref: "/proximo/nuevo",
    });
  }

  // 4. Actividad del período ------------------------------------------------
  const activity = result.activity;
  const activityRows: FinancialRowProps[] = [
    {
      kind: "with-status",
      label: "Ingresos del mes",
      supportingLabel: `${activity.movementCount === 0 ? "Sin movimientos" : `${activity.movementCount} ${plural(activity.movementCount, "movimiento", "movimientos")} en total`}`,
      status: activity.incomeCents > 0n ? "Registrados y no anulados" : "Sin ingresos registrados",
      value: money(activity.incomeCents),
      valuePrefix: "$",
    },
    {
      kind: "with-status",
      label: "Gastos del mes",
      supportingLabel: `Movimientos vigentes de ${monthLabel}`,
      status: "Registrados y no anulados",
      value: money(activity.expenseCents),
      valuePrefix: "$",
    },
    {
      label: "Resultado del mes",
      supportingLabel: "Ingresos − gastos, sin transferencias",
      value: money(activity.netCents),
      valuePrefix: prefix(activity.netCents),
      ...(activity.netCents < 0n ? { state: "attention" as const } : {}),
    },
  ];
  const transferNote =
    activity.transferCount > 0
      ? ` Se movieron $${money(activity.transferCents)} entre cuentas propias en ${activity.transferCount} ${plural(activity.transferCount, "transferencia", "transferencias")}: no cambian el patrimonio, así que quedan fuera del resultado.`
      : "";
  const voidedNote =
    activity.voidedCount > 0
      ? ` ${activity.voidedCount} ${plural(activity.voidedCount, "movimiento anulado sigue", "movimientos anulados siguen")} en el historial sin efecto sobre las cifras.`
      : "";

  sections.push({
    id: "activity",
    title: `Actividad de ${monthLabel}`,
    supportingLine: `Del ${describePlainDateAR(result.period.start, today)} al ${describePlainDateAR(result.period.end, today)}`,
    rows: activityRows,
    note: `Solo cuentan los movimientos vigentes del período.${transferNote}${voidedNote}`,
    noteKind: "neutral",
    actionLabel: "Ver movimientos",
    actionHref: "/movimientos",
  });

  return sections;
}

function buildEvidence(result: RealityResult, today: string): EvidenceBreakdown | null {
  if (result.activeCount + result.archivedCount === 0) return null;

  const lines = [
    ...result.activeAccounts.map((account) => ({
      id: account.id,
      label: `${account.name} · activa`,
      amount: Number(account.balanceCents),
      displayValue: money(account.balanceCents),
      valuePrefix: "$",
      sign: (account.balanceCents < 0n ? "-" : "+") as "+" | "-",
      status: "confirmed" as const,
    })),
    ...result.archivedAccounts.map((account) => ({
      id: account.id,
      label: `${account.name} · archivada`,
      amount: Number(account.balanceCents),
      displayValue: money(account.balanceCents),
      valuePrefix: "$",
      sign: (account.balanceCents < 0n ? "-" : "+") as "+" | "-",
      status: "confirmed" as const,
    })),
  ];

  const excluded = [
    result.investmentsAvailable && result.investmentCount > 0
      ? `Inversiones: $${money(result.investedCents)} en ${result.investmentCount} ${plural(result.investmentCount, "posición", "posiciones")}, fuera del patrimonio en cuentas porque no tienen cuenta que las respalde.`
      : null,
    result.commitmentsAvailable && result.commitments.totalCount > 0
      ? `Compromisos: $${money(result.commitments.totalCents)} en ${result.commitments.totalCount} ${plural(result.commitments.totalCount, "pago pendiente", "pagos pendientes")}, no restados porque todavía no ocurrieron.`
      : null,
    result.activity.transferCount > 0
      ? `Transferencias del mes: $${money(result.activity.transferCents)} con efecto patrimonial cero.`
      : null,
    result.activity.voidedCount > 0
      ? `Movimientos anulados del mes: ${result.activity.voidedCount}, sin efecto sobre ninguna cifra.`
      : null,
  ].filter((line): line is string => line !== null);

  return {
    status: "complete",
    title: "Cómo se calculó tu patrimonio",
    subtitle: `Σ saldos de ${result.activeCount + result.archivedCount} ${plural(result.activeCount + result.archivedCount, "cuenta", "cuentas")}; cada saldo es su saldo inicial más los movimientos no anulados`,
    summary: [
      "Fórmula: patrimonio = Σ saldos de cuentas activas + Σ saldos de cuentas archivadas.",
      ...excluded,
      "De una corrección pesa solo el reemplazo: el original queda anulado en el ledger.",
    ].join(" "),
    lines,
    total: {
      label: "Patrimonio registrado",
      amount: Number(result.patrimonyCents),
      displayValue: money(result.patrimonyCents),
      valuePrefix: prefix(result.patrimonyCents),
    },
    metadata: [
      `Corte del ${describePlainDateAR(today, today)}`,
      "ARS",
      "Personal",
      COMPLETENESS_LABEL[result.completeness],
    ] as const,
  };
}

function buildQuality(result: RealityResult): RealityQuality {
  return {
    title: "Calidad de la información",
    supportingLine: "Señales explícitas, no un puntaje",
    stateLabel: COMPLETENESS_LABEL[result.completeness],
    ratioLabel: `${result.metSignals} de ${result.totalSignals} ${plural(result.totalSignals, "señal", "señales")}`,
    summary: COMPLETENESS_SUMMARY[result.completeness],
    signals: buildSignals(result),
    ...(result.unverifiableSignals.length > 0
      ? {
          notice: `No pudimos verificar ${result.unverifiableSignals.length} ${plural(result.unverifiableSignals.length, "señal", "señales")} sobre próximos pagos: quedan fuera del recuento en vez de contarse como faltantes.`,
        }
      : {}),
  };
}

export async function getRealityModel(): Promise<RealityViewModel> {
  const data = await getRealityData();
  const result = computeReality({
    today: data.today,
    period: data.period,
    accounts: data.accounts,
    investments: data.investments,
    commitments: data.commitments,
    movements: data.movements,
  });

  const hasAccounts = result.activeCount + result.archivedCount > 0;
  const label = COMPLETENESS_LABEL[result.completeness];
  const metadata = [
    `Corte del ${describePlainDateAR(data.today, data.today)}`,
    "ARS",
    "Personal",
    label,
  ] as const;
  const complete = result.completeness === "analysis-ready" || result.completeness === "sufficient";
  const monthLabel = describeMonthAR(data.period.start.slice(0, 7), data.today);

  const hero: RealityViewModel["hero"] = hasAccounts
    ? {
        scenario: result.patrimonyCents < 0n ? "attention" : "stable",
        stateText:
          result.patrimonyCents < 0n
            ? "Tu patrimonio registrado está en negativo."
            : "Tu patrimonio es la suma de lo que ya registraste.",
        value: money(result.patrimonyCents),
        valuePrefix: prefix(result.patrimonyCents),
        valueLabel: "Patrimonio registrado",
        inlineNote:
          "Inversiones y compromisos se muestran aparte: no suman ni restan de esta cifra.",
        coverage: {
          title: "Calidad de la información",
          value: Math.round((result.metSignals / result.totalSignals) * 100),
          leftSummary: label,
          rightSummary: `${result.metSignals} de ${result.totalSignals} ${plural(result.totalSignals, "señal", "señales")}`,
          state: complete ? "stable" : result.metSignals === 0 ? "empty" : "partial",
          accessibleLabel: `Se cumplen ${result.metSignals} de las ${result.totalSignals} señales de información verificadas.`,
        },
      }
    : {
        scenario: "new",
        stateText: "Tu realidad financiera todavía está vacía.",
        valueLabel: "Creá una cuenta para empezar a representar dónde está tu dinero.",
      };

  return {
    rail: { items: metadata, state: complete ? "complete" : "partial", wrap: "truncate" },
    banner: null,
    hero,
    evidence: buildEvidence(result, data.today),
    synthesis: hasAccounts
      ? buildSynthesis(result)
      : "Creá una cuenta para empezar a representar dónde está tu dinero.",
    sections: hasAccounts ? buildSections(result, data.today) : [],
    stability: {
      children: hasAccounts
        ? "Cada cifra de esta pantalla proviene de objetos registrados y localizables: cuentas, inversiones, compromisos y movimientos."
        : "Creá tu primera cuenta para empezar a representar tu realidad.",
      container: "none",
      kind: hasAccounts ? "stable" : "neutral",
    },
    primaryAction: hasAccounts
      ? {
          label: `Revisar ${monthLabel}`,
          href: "/mi-realidad/cierre",
          supportingLine:
            "Una revisión guiada del mes: cuentas, movimientos, compromisos y resultado. No cierra nada ni bloquea movimientos.",
        }
      : null,
    quality: hasAccounts ? buildQuality(result) : null,
    missing: complete
      ? null
      : {
          title: hasAccounts ? "Tu realidad está parcialmente representada" : "Falta tu base financiera",
          primaryLine: hasAccounts
            ? COMPLETENESS_SUMMARY[result.completeness]
            : "Sin cuentas registradas no hay patrimonio ni composición para mostrar.",
          causalLine: hasAccounts
            ? "Cada señal de abajo dice qué falta y por qué cambia lo que Doleth puede explicar."
            : "Creá al menos una cuenta con su saldo inicial para habilitar esta pantalla.",
          linkLabel: hasAccounts ? "Registrar movimiento" : "Crear cuenta",
          linkHref: hasAccounts ? "/movimientos/nuevo" : "/cuentas/nueva",
          state: "partial",
        },
    information: {
      title: "De dónde sale esta composición",
      primaryLine: "No usa saldos editables, estimaciones ni cifras simuladas.",
      causalLine:
        "El patrimonio se deriva del saldo inicial de cada cuenta y del ledger, excluyendo movimientos anulados. Las inversiones y los compromisos se contabilizan por separado y se declaran como tales.",
      linkLabel: "Ver cuentas",
      linkHref: "/cuentas",
      state: complete ? "complete" : "partial",
    },
  };
}
