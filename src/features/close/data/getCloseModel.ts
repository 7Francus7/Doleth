import "server-only";
import type { FinancialRowProps } from "../../../design-system/composites/FinancialRow";
import { formatCents } from "../../../lib/finance/domain";
import { describeMonthAR, describePlainDateAR } from "../../../lib/finance/movementDate";
import {
  CLOSE_STEP_COUNT,
  computeClose,
  nextStep,
  previousStep,
  resolveStep,
  selectablePeriods,
  stepNumber,
  type CloseResult,
  type CloseStepId,
  type CloseWarningId,
} from "../../../lib/finance/close";
import { getCloseData } from "../../../lib/finance/data";
import type {
  CloseBlock,
  ClosePeriodOption,
  CloseSummary,
  CloseViewModel,
  CloseWarningRow,
} from "../model";

const money = (cents: bigint): string => formatCents(cents < 0n ? -cents : cents);
const prefix = (cents: bigint): string => (cents < 0n ? "-$" : "$");
const plural = (count: number, one: string, many: string): string => (count === 1 ? one : many);

export const CLOSE_ROUTE = "/mi-realidad/cierre";

const hrefFor = (month: string, step: CloseStepId): string =>
  `${CLOSE_ROUTE}?periodo=${month}&paso=${step}`;

const STEP_TITLE: Record<CloseStepId, string> = {
  periodo: "Qué período vas a revisar",
  cuentas: "Cómo quedaron tus cuentas",
  movimientos: "Qué se registró en el mes",
  compromisos: "Qué pagos tenía el período",
  informacion: "Qué información falta",
  resultado: "Cuál fue el resultado",
  resumen: "Revisión completada",
};

const STEP_SUPPORT: Record<CloseStepId, string> = {
  periodo: "Mes en curso o mes anterior",
  cuentas: "Saldo al empezar, saldo al terminar y variación",
  movimientos: "Ingresos, gastos y todo lo que no cuenta",
  compromisos: "Pagados, pendientes, vencidos y fuera del período",
  informacion: "Señales faltantes, sin llamarlas errores",
  resultado: "Reconciliación completa del período",
  resumen: "Lo que quedó y lo que sigue",
};

const WARNING_COPY: Record<
  CloseWarningId,
  { label: string; detail: (count: number) => string; action?: { label: string; href: string } }
> = {
  "period-open": {
    label: "El mes todavía está en curso",
    detail: () =>
      "Podés revisarlo igual, pero las cifras van a cambiar con cada movimiento que registres hasta fin de mes.",
  },
  "no-movements": {
    label: "Sin movimientos en el período",
    detail: () =>
      "No hay ingresos ni gastos registrados en este mes. El resultado es cero porque no hay nada cargado, no porque no haya pasado nada.",
    action: { label: "Registrar movimiento", href: "/movimientos/nuevo" },
  },
  "no-income": {
    label: "Sin ingresos registrados",
    detail: () =>
      "No encontramos ingresos en el período. Si cobraste y no lo registraste, el resultado del mes va a mostrar solo gastos.",
    action: { label: "Registrar ingreso", href: "/movimientos/nuevo" },
  },
  overdue: {
    label: "Pagos vencidos sin confirmar",
    detail: (count) =>
      `${count} ${plural(count, "pago del período venció", "pagos del período vencieron")} y sigue${count === 1 ? "" : "n"} pendiente${count === 1 ? "" : "s"}. Puede ser que ya lo hayas pagado y falte registrarlo.`,
    action: { label: "Revisar próximos pagos", href: "/proximo" },
  },
  "account-without-activity": {
    label: "Cuentas sin actividad en el mes",
    detail: (count) =>
      `${count} ${plural(count, "cuenta activa no tuvo", "cuentas activas no tuvieron")} movimientos este mes. No es un error: puede que simplemente no la hayas usado.`,
    action: { label: "Ver cuentas", href: "/cuentas" },
  },
  "archived-accounts": {
    label: "Cuentas archivadas en el período",
    detail: (count) =>
      `${count} ${plural(count, "cuenta archivada conserva", "cuentas archivadas conservan")} su historia y su saldo. Se muestran aparte del dinero operativo.`,
  },
  "payments-unavailable": {
    label: "No pudimos leer los próximos pagos",
    detail: () =>
      "Esta revisión queda sin la parte de compromisos. El resultado del período no depende de ellos y sigue siendo válido.",
  },
};

function warningRows(result: CloseResult): CloseWarningRow[] {
  return result.warnings.map((warning) => {
    const copy = WARNING_COPY[warning.id];
    return {
      id: warning.id,
      label: copy.label,
      detail: copy.detail(warning.count),
      severity: warning.severity,
      ...(copy.action ? { actionLabel: copy.action.label, actionHref: copy.action.href } : {}),
    } satisfies CloseWarningRow;
  });
}

function accountBlock(result: CloseResult, today: string): CloseBlock[] {
  const blocks: CloseBlock[] = [];
  const toRow = (account: CloseResult["accounts"][number]): FinancialRowProps => ({
    kind: "with-status",
    label: account.name,
    supportingLabel: `Empezó en ${prefix(account.openingCents)}${money(account.openingCents)} · ${
      account.lastActivityOn
        ? `última actividad el ${describePlainDateAR(account.lastActivityOn, today)}`
        : "sin movimientos registrados"
    }`,
    status: account.withoutActivity
      ? "Sin movimientos en el período"
      : `Variación de ${prefix(account.variationCents)}${money(account.variationCents)}`,
    value: money(account.closingCents),
    valuePrefix: prefix(account.closingCents),
    ...(account.closingCents < 0n ? { state: "attention" as const } : {}),
  });

  if (result.activeAccounts.length > 0) {
    blocks.push({
      id: "active-accounts",
      title: "Cuentas activas",
      supportingLine: "Saldo al cerrar el período, con el saldo inicial a la vista",
      rows: [
        ...result.activeAccounts.map(toRow),
        {
          label: "Patrimonio al cerrar el período",
          supportingLabel: `Σ saldos de ${result.accounts.length} ${plural(result.accounts.length, "cuenta", "cuentas")}, activas y archivadas`,
          value: money(result.closingCents),
          valuePrefix: prefix(result.closingCents),
        },
      ],
      note: "El saldo inicial de cada cuenta se reconstruye desde el ledger: saldo de hoy menos lo registrado después del período. No se pide ajustar nada sin evidencia.",
      noteKind: "stable",
      actionLabel: "Ver cuentas",
      actionHref: "/cuentas",
    });
  }

  if (result.archivedAccounts.length > 0) {
    blocks.push({
      id: "archived-accounts",
      title: "Cuentas archivadas",
      supportingLine: "Conservan su historia, fuera del uso cotidiano",
      rows: result.archivedAccounts.map(toRow),
      note: "Sus saldos siguen dentro del patrimonio del período. Se muestran aparte para no leerlos como dinero operativo.",
      noteKind: "neutral",
    });
  }

  return blocks;
}

function movementBlock(result: CloseResult): CloseBlock[] {
  const movements = result.movements;
  const rows: FinancialRowProps[] = [
    {
      kind: "with-status",
      label: "Ingresos",
      supportingLabel: `${movements.incomeCount} ${plural(movements.incomeCount, "movimiento", "movimientos")}`,
      status: "Suman al resultado",
      value: money(movements.incomeCents),
      valuePrefix: "$",
    },
    {
      kind: "with-status",
      label: "Gastos",
      supportingLabel: `${movements.expenseCount} ${plural(movements.expenseCount, "movimiento", "movimientos")}`,
      status: "Restan del resultado",
      value: money(movements.expenseCents),
      valuePrefix: "$",
    },
    {
      label: "Resultado del período",
      supportingLabel: "Ingresos − gastos",
      value: money(movements.netCents),
      valuePrefix: prefix(movements.netCents),
      ...(movements.netCents < 0n ? { state: "attention" as const } : {}),
    },
  ];

  const excluded: FinancialRowProps[] = [];
  if (movements.transferCount > 0) {
    excluded.push({
      kind: "with-status",
      label: "Transferencias entre tus cuentas",
      supportingLabel: `${movements.transferCount} ${plural(movements.transferCount, "movimiento", "movimientos")}`,
      status: "Efecto patrimonial cero",
      value: money(movements.transferCents),
      valuePrefix: "$",
    });
  }
  if (movements.voidedCount > 0) {
    excluded.push({
      kind: "with-status",
      label: "Movimientos anulados",
      supportingLabel: `${movements.voidedCount} ${plural(movements.voidedCount, "movimiento", "movimientos")} en el historial`,
      status: "No afectan ninguna cifra",
      value: "0",
      valuePrefix: "$",
    });
  }
  if (movements.correctedCount > 0) {
    excluded.push({
      kind: "with-status",
      label: "Originales corregidos",
      supportingLabel: `${movements.correctedCount} ${plural(movements.correctedCount, "movimiento reemplazado", "movimientos reemplazados")}`,
      status: "Pesa solo el reemplazo",
      value: "0",
      valuePrefix: "$",
    });
  }
  const blocks: CloseBlock[] = [
    {
      id: "movements",
      title: "Movimientos del período",
      supportingLine: `${movements.totalCount} ${plural(movements.totalCount, "movimiento patrimonial vigente", "movimientos patrimoniales vigentes")}`,
      rows,
      note: "Solo entran los movimientos no anulados y no transferencias: son los únicos que cambian el patrimonio.",
      noteKind: "stable",
      actionLabel: "Ver movimientos",
      actionHref: "/movimientos",
    },
  ];

  if (excluded.length > 0) {
    blocks.push({
      id: "excluded",
      title: "Qué no entra en el resultado",
      supportingLine: "Existe, está en el historial y no mueve la cifra",
      rows: excluded,
      note: "Nada de esto se descuenta ni se suma: se muestra para que la diferencia entre lo registrado y lo contado no quede sin explicación.",
      noteKind: "neutral",
    });
  }

  return blocks;
}

function paymentBlock(result: CloseResult, today: string): CloseBlock[] {
  if (!result.paymentsAvailable) {
    return [
      {
        id: "payments",
        title: "Compromisos del período",
        supportingLine: "Pagados, pendientes y vencidos",
        rows: [],
        note: "Los compromisos no cambian el resultado del período: un pago pendiente todavía no ocurrió.",
        noteKind: "neutral",
        notice:
          "No pudimos cargar los próximos pagos. Esta parte queda fuera de la revisión, no en cero.",
      },
    ];
  }

  const payments = result.payments;
  const rows: FinancialRowProps[] = [];
  if (payments.paid.length > 0) {
    rows.push({
      kind: "with-status",
      label: "Pagados",
      supportingLabel: `${payments.paid.length} ${plural(payments.paid.length, "pago confirmado", "pagos confirmados")} del período`,
      status: "Ya son movimientos registrados",
      value: money(payments.paidCents),
      valuePrefix: "$",
    });
  }
  if (payments.overdue.length > 0) {
    rows.push({
      kind: "with-status",
      label: "Vencidos",
      supportingLabel: `${payments.overdue.length} ${plural(payments.overdue.length, "pago con fecha pasada", "pagos con fecha pasada")}`,
      status: "Sin confirmar",
      value: money(payments.overdueCents),
      valuePrefix: "$",
      state: "attention",
    });
  }
  if (payments.pending.length > 0) {
    rows.push({
      kind: "with-status",
      label: "Pendientes del período",
      supportingLabel: `${payments.pending.length} ${plural(payments.pending.length, "pago", "pagos")} con fecha todavía por delante`,
      status: "No se resta del resultado",
      value: money(payments.pendingCents),
      valuePrefix: "$",
    });
  }
  if (payments.outside.length > 0) {
    rows.push({
      kind: "with-status",
      label: "Fuera del período",
      supportingLabel: `${payments.outside.length} ${plural(payments.outside.length, "pago pendiente", "pagos pendientes")} con vencimiento posterior`,
      status: "No bloquea esta revisión",
      value: money(payments.outsideCents),
      valuePrefix: "$",
    });
  }

  return [
    {
      id: "payments",
      title: "Compromisos del período",
      supportingLine:
        rows.length === 0
          ? "Todavía sin pagos cargados"
          : `Vencimientos entre el ${describePlainDateAR(result.period.start, today)} y el ${describePlainDateAR(result.period.end, today)}`,
      rows,
      note:
        rows.length === 0
          ? "No hay pagos cargados para este período. La revisión sigue siendo válida: los compromisos no cambian el resultado."
          : "Los pagos pendientes no se restan del resultado: todavía no ocurrieron. Los pagados ya son movimientos y están contados una sola vez.",
      noteKind: payments.overdue.length > 0 ? "attention" : "neutral",
      actionLabel: "Ver Próximo",
      actionHref: "/proximo",
    },
  ];
}

function resultBlock(result: CloseResult): CloseBlock[] {
  return [
    {
      id: "reconciliation",
      title: "Resultado del período",
      supportingLine: "Patrimonio inicial + ingresos − gastos = patrimonio final",
      rows: [
        {
          label: "Patrimonio inicial",
          supportingLabel: "Al primer día del período",
          value: money(result.openingCents),
          valuePrefix: prefix(result.openingCents),
        },
        {
          kind: "with-status",
          label: "Ingresos",
          supportingLabel: "Movimientos vigentes del período",
          status: "Suman",
          value: money(result.movements.incomeCents),
          valuePrefix: "$",
        },
        {
          kind: "with-status",
          label: "Gastos",
          supportingLabel: "Movimientos vigentes del período",
          status: "Restan",
          value: money(result.movements.expenseCents),
          valuePrefix: "$",
        },
        {
          label: "Resultado neto",
          supportingLabel: "Ingresos − gastos",
          value: money(result.netCents),
          valuePrefix: prefix(result.netCents),
          ...(result.netCents < 0n ? { state: "attention" as const } : {}),
        },
        {
          label: "Patrimonio final",
          supportingLabel: "Al último día del período",
          value: money(result.closingCents),
          valuePrefix: prefix(result.closingCents),
        },
      ],
      note: `La igualdad se cumple: ${prefix(result.openingCents)}${money(result.openingCents)} + $${money(result.movements.incomeCents)} − $${money(result.movements.expenseCents)} = ${prefix(result.closingCents)}${money(result.closingCents)}. Las transferencias no participan porque no cambian el patrimonio.`,
      noteKind: result.reconciles ? "stable" : "attention",
    },
    ...(result.afterCents !== 0n
      ? [
          {
            id: "after",
            title: "Lo registrado después del período",
            supportingLine: "Por qué el patrimonio de hoy no es el del cierre",
            rows: [
              {
                label: "Efecto posterior al período",
                supportingLabel: "Movimientos con fecha posterior al último día",
                value: money(result.afterCents),
                valuePrefix: prefix(result.afterCents),
              },
              {
                label: "Patrimonio de hoy",
                supportingLabel: "Patrimonio final del período + efecto posterior",
                value: money(result.closingCents + result.afterCents),
                valuePrefix: prefix(result.closingCents + result.afterCents),
              },
            ],
            note: "El cierre no congela nada: los movimientos posteriores siguen contando en tu patrimonio actual.",
            noteKind: "neutral" as const,
          },
        ]
      : []),
  ];
}

function buildSummary(result: CloseResult, periodLabel: string): CloseSummary {
  const reviewWarnings = result.warnings.filter((warning) => warning.severity === "review");
  const rows: FinancialRowProps[] = [
    {
      label: "Resultado neto",
      supportingLabel: `Ingresos − gastos de ${periodLabel}`,
      value: money(result.netCents),
      valuePrefix: prefix(result.netCents),
      ...(result.netCents < 0n ? { state: "attention" as const } : {}),
    },
    {
      label: "Patrimonio final",
      supportingLabel: "Con el que terminó el período",
      value: money(result.closingCents),
      valuePrefix: prefix(result.closingCents),
    },
  ];

  if (result.paymentsAvailable) {
    const stillPending = result.payments.pending.length + result.payments.overdue.length;
    rows.push({
      kind: "with-status",
      label: "Pagos pendientes del período",
      supportingLabel: `${stillPending} ${plural(stillPending, "compromiso sin confirmar", "compromisos sin confirmar")}`,
      status:
        result.payments.overdue.length > 0
          ? `${result.payments.overdue.length} ${plural(result.payments.overdue.length, "vencido", "vencidos")}`
          : "Ninguno vencido",
      value: money(result.payments.pendingCents + result.payments.overdueCents),
      valuePrefix: "$",
      ...(result.payments.overdue.length > 0 ? { state: "attention" as const } : {}),
    });
  }

  rows.push({
    kind: "with-status",
    label: "Información faltante",
    supportingLabel:
      reviewWarnings.length === 0
        ? "Ninguna señal quedó sin resolver"
        : `${reviewWarnings.length} ${plural(reviewWarnings.length, "señal para revisar", "señales para revisar")}`,
    status: reviewWarnings.length === 0 ? "Nada pendiente" : "Siguen visibles después de la revisión",
    value: String(reviewWarnings.length),
    valuePrefix: "",
  });

  const actions: CloseSummary["actions"] = [
    { id: "reality", label: "Volver a Mi realidad", href: "/mi-realidad" },
    ...(reviewWarnings.length > 0
      ? [{ id: "pending", label: "Revisar pendientes", href: "/proximo" }]
      : []),
    { id: "now", label: "Ir a Ahora", href: "/ahora" },
  ];

  return {
    title: `Revisión de ${periodLabel} completada`,
    // Sin persistencia, la revisión no se afirma como almacenada: se dice qué
    // se calculó y con qué información.
    statement: `Resumen calculado con la información actual de Doleth. Esta revisión no se guarda ni bloquea el período: si registrás un movimiento con fecha de ${periodLabel}, las cifras cambian y podés volver a revisarlo.`,
    rows,
    actions,
  };
}

export async function getCloseModel(
  month: string | undefined,
  step: string | undefined,
): Promise<CloseViewModel> {
  const data = await getCloseData(month);
  const result = computeClose({
    period: data.period,
    today: data.today,
    patrimonyNowCents: data.patrimonyNowCents,
    accounts: data.accounts,
    movements: data.movements,
    payments: data.payments,
    paymentsAvailable: data.paymentsAvailable,
  });

  const current = resolveStep(step);
  const periodLabel = describeMonthAR(data.period.month, data.today);
  const number = stepNumber(current);
  const back = previousStep(current);
  const forward = nextStep(current);

  const periods: ClosePeriodOption[] = selectablePeriods(data.today).map((period) => ({
    month: period.month,
    label: describeMonthAR(period.month, data.today),
    detail: `Del ${describePlainDateAR(period.start, data.today)} al ${describePlainDateAR(period.end, data.today)}${period.open ? " · todavía en curso" : " · mes cerrado en el calendario"}`,
    href: hrefFor(period.month, "periodo"),
    selected: period.month === data.period.month,
  }));

  const blocks: CloseBlock[] =
    current === "cuentas"
      ? accountBlock(result, data.today)
      : current === "movimientos"
        ? movementBlock(result)
        : current === "compromisos"
          ? paymentBlock(result, data.today)
          : current === "resultado"
            ? resultBlock(result)
            : [];

  const warnings: CloseWarningRow[] =
    current === "informacion" || current === "resumen" ? warningRows(result) : [];

  const reviewCount = result.warnings.filter((warning) => warning.severity === "review").length;

  const INTRO: Record<CloseStepId, string> = {
    periodo: `Vas a revisar ${periodLabel}. Esta revisión no cierra el período ni bloquea movimientos: es una lectura guiada de lo que ya registraste.`,
    cuentas: `Con cuánto empezó y con cuánto terminó cada cuenta en ${periodLabel}.`,
    movimientos: `Qué se registró en ${periodLabel} y qué queda fuera del resultado por regla del ledger.`,
    compromisos: `Los pagos con vencimiento en ${periodLabel} y los que quedan por delante.`,
    informacion:
      reviewCount === 0
        ? "No quedan señales sin resolver en este período. Las condiciones informativas se listan igual."
        : "Ninguna de estas advertencias es un error, y ninguna te impide completar la revisión.",
    resultado: `Cómo se compone el resultado de ${periodLabel} y por qué reconcilia.`,
    resumen: `Lo que dejó ${periodLabel} y qué queda pendiente para el mes siguiente.`,
  };

  const nav: CloseViewModel["nav"] = {
    backHref: back ? hrefFor(data.period.month, back) : "/mi-realidad",
    backLabel: back ? `Volver a ${STEP_TITLE[back].toLowerCase()}` : "Volver a Mi realidad",
    nextHref: forward ? hrefFor(data.period.month, forward) : null,
    nextLabel: forward
      ? current === "informacion" && reviewCount > 0
        ? "Continuar con las advertencias"
        : current === "resultado"
          ? "Completar la revisión"
          : "Continuar"
      : null,
  };

  return {
    rail: {
      items: [
        periodLabel,
        "ARS",
        "Personal",
        result.period.open ? "Período en curso" : "Período completo",
      ] as const,
      state: reviewCount === 0 ? "complete" : "partial",
      wrap: "truncate",
    },
    progressLabel: `Paso ${number} de ${CLOSE_STEP_COUNT}`,
    stepNumber: number,
    stepCount: CLOSE_STEP_COUNT,
    title: STEP_TITLE[current],
    supportingLine: STEP_SUPPORT[current],
    intro: INTRO[current],
    periods: current === "periodo" ? periods : null,
    blocks,
    warnings,
    notice:
      current === "informacion" && reviewCount > 0
        ? "Podés completar la revisión igualmente. Estas advertencias siguen visibles después."
        : null,
    summary: current === "resumen" ? buildSummary(result, periodLabel) : null,
    nav,
    information: {
      title: "Qué hace y qué no hace esta revisión",
      primaryLine: "No modifica movimientos, no crea asientos y no bloquea el período.",
      causalLine:
        "Todas las cifras se calculan en el momento a partir del ledger. Como no se guarda, siempre refleja la información actual: si cargás un movimiento con fecha del período, la revisión cambia.",
      linkLabel: "Volver a Mi realidad",
      linkHref: "/mi-realidad",
      state: reviewCount === 0 ? "complete" : "partial",
    },
    empty: result.hasAccounts
      ? null
      : {
          title: "Todavía no hay nada que revisar",
          description:
            "Sin cuentas registradas no hay período que cerrar: no hay saldo inicial, ni movimientos, ni resultado.",
          actionLabel: "Crear cuenta",
          actionHref: "/cuentas/nueva",
        },
  };
}
