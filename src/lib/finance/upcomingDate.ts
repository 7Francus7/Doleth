/**
 * Lectura humana de fechas de vencimiento.
 *
 * Trabaja sobre días civiles `YYYY-MM-DD` ya resueltos en Argentina, así que el
 * resultado no depende del huso del navegador. A diferencia de un movimiento,
 * un vencimiento puede estar en el futuro: por eso existe "Mañana".
 */
import { MONTHS } from "./movementDate";
import { addCivilDays, nextCivilMonth, type UpcomingGroupId } from "./projection";

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAYS = [
  "domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado",
] as const;

const capitalize = (text: string): string => text.charAt(0).toUpperCase() + text.slice(1);

function parts(iso: string): { year: number; month: number; day: number } {
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  return { year, month, day };
}

/** Día de la semana en español, derivado del día civil sin pasar por husos. */
export function weekdayAR(iso: string): string {
  const { year, month, day } = parts(iso);
  return WEEKDAYS[new Date(Date.UTC(year, month - 1, day)).getUTCDay()] ?? "";
}

/**
 * "Hoy" · "Mañana" · "Ayer" · "Viernes 31 de julio" · "Viernes 31 de julio de 2027".
 * El año solo aparece cuando deja de ser obvio.
 */
export function describeDueDateAR(iso: string, todayIso: string): string {
  if (!ISO_DATE.test(iso)) return iso;
  if (!ISO_DATE.test(todayIso)) return iso;
  if (iso === todayIso) return "Hoy";
  if (iso === addCivilDays(todayIso, 1)) return "Mañana";
  if (iso === addCivilDays(todayIso, -1)) return "Ayer";

  const { year, month, day } = parts(iso);
  const base = `${capitalize(weekdayAR(iso))} ${day} de ${MONTHS[month - 1] ?? ""}`;
  return todayIso.slice(0, 4) === iso.slice(0, 4) ? base : `${base} de ${year}`;
}

/**
 * La misma fecha, lista para meterse en una oración: "venció ayer", "vence hoy",
 * "vence el viernes 31 de julio". Evita el "el ayer" que sale de concatenar la
 * etiqueta suelta.
 */
export function describeDuePhraseAR(iso: string, todayIso: string): string {
  const label = describeDueDateAR(iso, todayIso).toLowerCase();
  return label === "hoy" || label === "ayer" || label === "mañana" ? label : `el ${label}`;
}

/** "Agosto de 2026" a partir de un día civil o de un mes `YYYY-MM`. */
export function describeMonthAR(value: string): string {
  const [year, month] = value.split("-").map(Number) as [number, number];
  return `${capitalize(MONTHS[month - 1] ?? "")} de ${year}`;
}

/**
 * Título de cada tramo de la línea temporal. "Resto del mes" y los meses
 * siguientes se nombran con su mes real para que la fecha nunca quede implícita.
 */
export function describeGroup(group: UpcomingGroupId, todayIso: string): string {
  if (group === "overdue") return "Vencidos";
  if (group === "today") return "Hoy";
  if (group === "tomorrow") return "Mañana";
  if (group === "this-week") return "Esta semana";
  if (group === "rest-of-month") return `Resto de ${MONTHS[parts(todayIso).month - 1] ?? ""}`;
  if (group === "next-month") return describeMonthAR(nextCivilMonth(todayIso));
  return "Más adelante";
}
