import "server-only";
import { formatCents } from "../../../lib/finance/domain";
import { describeMissing, describeRate } from "../../../lib/finance/display";
import { getSpendingData } from "../../../lib/finance/data";
import { buildSpendingReport, formatShare, type SpendingSlice } from "../../../lib/finance/spending";
import type { RecurringRow, SpendingBreakdown, SpendingViewModel } from "../model";

/**
 * Modelo de vista de /en-que-se-fue.
 *
 * Traduce números a frases. La regla que ordena el archivo: **cada corte responde
 * una pregunta distinta**, y el subtítulo la dice. Tres tablas sin explicar para
 * qué sirve cada una es exactamente la clase de densidad que hace que nadie mire
 * un reporte dos veces.
 */

const money = (cents: bigint): string => formatCents(cents < 0n ? -cents : cents);

const MONTH_NAMES = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

const monthLabel = (month: string): string => {
  const [year, index] = month.split("-").map(Number) as [number, number];
  return `${MONTH_NAMES[index - 1] ?? month} ${year}`;
};

const plural = (count: number, one: string, many: string) => (count === 1 ? one : many);

const describeDay = (day: string): string => {
  const [, month, dayOfMonth] = day.split("-").map(Number) as [number, number, number];
  return `${dayOfMonth} de ${MONTH_NAMES[month - 1] ?? ""}`;
};

/**
 * Traduce una porción del desglose a una fila.
 *
 * El enlace lleva al historial ya filtrado. Es lo que convierte el reporte en
 * algo accionable en vez de un cartel: ver que se fueron $84.000 en comida no
 * sirve si después hay que buscar a mano cuáles fueron esos movimientos.
 */
function toRow(
  slice: SpendingSlice,
  symbol: string,
  month: string,
  linkFor: (slice: SpendingSlice) => string,
): SpendingViewModel["breakdowns"][number]["rows"][number] {
  const delta = slice.deltaCents;
  return {
    key: slice.key,
    label: slice.label,
    amount: money(slice.amountCents),
    amountPrefix: symbol,
    share: formatShare(slice.shareBasisPoints),
    sharePercent: slice.shareBasisPoints / 100,
    detail: `${slice.movementCount} ${plural(slice.movementCount, "movimiento", "movimientos")}`,
    delta:
      delta === null || delta === 0n
        ? null
        : `${delta > 0n ? "+" : "-"}${symbol}${money(delta)} vs. el mes anterior`,
    deltaDirection: delta === null ? null : delta > 0n ? "up" : delta < 0n ? "down" : "flat",
    href: linkFor(slice),
  };
}

export async function getSpendingModel(userId: string, month: string | undefined): Promise<SpendingViewModel> {
  const data = await getSpendingData(userId, month);
  const report = buildSpendingReport({
    period: data.period,
    movements: data.movements,
    previousMovements: data.previousMovements,
    recurringWindow: data.recurringWindow,
  });

  const symbol = data.display.symbol;
  const back = encodeURIComponent(`/en-que-se-fue?mes=${data.month}`);
  const missingLine = describeMissing(data.display);
  const rateLine = describeRate(data.display);
  const empty = report.movementCount === 0;

  const breakdowns: SpendingBreakdown[] = [
    {
      id: "category",
      title: "Por categoría",
      subtitle: "En qué tipo de cosas se fue.",
      emptyLabel: "No hay gastos categorizados este mes.",
      rows: report.byCategory.map((slice) =>
        toRow(slice, symbol, data.month, (item) =>
          item.key === "sin-categoria"
            ? `/movimientos?month=${data.month}&type=EXPENSE&volver=${back}`
            : `/movimientos?month=${data.month}&categoryId=${item.key}&volver=${back}`,
        ),
      ),
    },
    {
      id: "merchant",
      title: "Por comercio",
      subtitle: "A quién se le pagó. Es el corte que responde “¿otra vez acá?”.",
      emptyLabel: "Todavía no hay comercios que mostrar.",
      rows: report.byMerchant
        .slice(0, 12)
        .map((slice) => toRow(slice, symbol, data.month, () => `/movimientos?month=${data.month}&volver=${back}`)),
    },
    {
      id: "account",
      title: "Por medio de pago",
      subtitle: "Desde dónde salió: qué tanto pasó por tarjeta y qué tanto por caja.",
      emptyLabel: "Todavía no hay movimientos con cuenta asignada.",
      rows: report.byAccount.map((slice) =>
        toRow(
          slice,
          symbol,
          data.month,
          (item) => `/movimientos?month=${data.month}&accountId=${item.key}&volver=${back}`,
        ),
      ),
    },
  ];

  const recurringRows: RecurringRow[] = report.recurring.slice(0, 8).map((item) => ({
    key: item.merchant.toLowerCase(),
    label: item.merchant,
    amount: money(item.typicalCents),
    amountPrefix: symbol,
    detail:
      item.cadence === "monthly"
        ? `Todos los meses · ${item.occurrences} ${plural(item.occurrences, "vez", "veces")} · último el ${describeDay(item.lastSeenOn)}`
        : `Todas las semanas · unos ${symbol}${money(item.monthlyCents)} por mes · último el ${describeDay(item.lastSeenOn)}`,
  }));

  // La comparación con el mes anterior es lo primero que una persona quiere
  // saber, así que va en la frase y no escondida en una tabla.
  const comparison =
    report.deltaCents === null
      ? null
      : report.deltaCents === 0n
        ? "Gastaste exactamente lo mismo que el mes anterior."
        : report.deltaCents > 0n
          ? `Son ${symbol}${money(report.deltaCents)} más que el mes anterior.`
          : `Son ${symbol}${money(report.deltaCents)} menos que el mes anterior.`;

  const topCause = report.increases[0];
  const stateText = empty
    ? "Todavía no hay gastos registrados en este mes."
    : topCause
      ? `Lo que más creció fue ${topCause.label.toLowerCase()}.`
      : report.byCategory[0]
        ? `Lo que más pesó fue ${report.byCategory[0].label.toLowerCase()}.`
        : "Esto es lo que salió este mes.";

  const informationComplete = data.display.complete && !empty;

  return {
    rail: {
      items: [
        "Gasto del mes",
        data.display.stale ? `${data.display.currency} · cotización desactualizada` : data.display.currency,
        "Sin transferencias ni anulados",
        informationComplete ? "Información completa" : "Información incompleta",
      ] as const,
      state: informationComplete ? "complete" : "partial",
      wrap: "truncate",
    },
    months: data.availableMonths.slice(0, 12).map((item) => ({
      month: item,
      label: monthLabel(item),
      href: `/en-que-se-fue?mes=${item}`,
      current: item === data.month,
    })),
    headline: {
      stateText,
      amount: money(report.totalCents),
      amountPrefix: symbol,
      label: `Salió en ${monthLabel(data.month)}`,
      comparison: missingLine ?? comparison,
      dailyAverage: `${symbol}${money(report.dailyAverageCents)} por día`,
    },
    breakdowns,
    recurring: {
      title: "Lo que se repite",
      headline:
        report.recurring.length === 0
          ? "Todavía no encontramos gastos que se repitan con regularidad."
          : `Unos ${symbol}${money(report.recurringMonthlyCents)} por mes ya están comprometidos antes de que empiece el mes.`,
      rows: recurringRows,
      emptyLabel:
        "Hacen falta al menos tres cargos parejos del mismo comercio para poder llamarlo recurrente. Con más historia va a aparecer solo.",
    },
    stability: {
      children: empty
        ? "Cuando registres o importes movimientos, este reporte va a poder decirte adónde fue tu plata."
        : "El total suma únicamente gastos no anulados. Las transferencias entre tus cuentas quedan afuera: mover plata de un lado a otro no la gasta.",
      container: "none",
      kind: "neutral",
    },
    information: {
      title: "De dónde sale esta lectura",
      primaryLine: empty
        ? "No hay gastos registrados en este mes."
        : `${report.movementCount} ${plural(report.movementCount, "gasto", "gastos")} entre el ${describeDay(data.period.start)} y el ${describeDay(data.period.end)}.`,
      causalLine: [
        "Cada importe sale del ledger, excluyendo anulados y transferencias.",
        rateLine ? `Lo que estaba en otra moneda se convirtió a ${data.display.currency}: ${rateLine}` : null,
        missingLine,
      ]
        .filter(Boolean)
        .join(" "),
      linkLabel: "Ver los movimientos del mes",
      linkHref: `/movimientos?month=${data.month}`,
      state: informationComplete ? "complete" : "partial",
    },
    empty,
  };
}
