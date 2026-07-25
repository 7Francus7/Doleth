/**
 * Lectura humana de la fecha de un movimiento.
 *
 * Trabaja sobre fechas civiles `YYYY-MM-DD` ya resueltas en Argentina por
 * `todayInArgentina`, así que el resultado no depende del huso del navegador.
 */
export const MONTHS = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
] as const;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/** Día civil anterior, sin pasar por husos horarios. */
export function previousCivilDay(iso: string): string {
  if (!ISO_DATE.test(iso)) throw new Error("Fecha inválida.");
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() - 1);
  return date.toISOString().slice(0, 10);
}

/**
 * "Hoy, 23 de julio" · "Ayer, 22 de julio" · "21 de julio de 2026".
 * El año solo aparece cuando deja de ser obvio.
 */
export function describeDateAR(iso: string, todayIso: string): string {
  if (!ISO_DATE.test(iso)) return iso;
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  const monthName = MONTHS[month - 1] ?? "";
  const dayAndMonth = `${day} de ${monthName}`;

  if (iso === todayIso) return `Hoy, ${dayAndMonth}`;
  if (ISO_DATE.test(todayIso) && iso === previousCivilDay(todayIso)) return `Ayer, ${dayAndMonth}`;

  const sameYear = ISO_DATE.test(todayIso) && todayIso.slice(0, 4) === iso.slice(0, 4);
  return sameYear ? dayAndMonth : `${dayAndMonth} de ${year}`;
}

/**
 * "21 de julio" · "21 de julio de 2025". Sin "Hoy" ni "Ayer": dentro de un
 * rango —"del 18 al 24 de julio"— lo relativo se lee mal y confunde el período.
 */
export function describePlainDateAR(iso: string, todayIso: string): string {
  if (!ISO_DATE.test(iso)) return iso;
  const [year, month, day] = iso.split("-").map(Number) as [number, number, number];
  const dayAndMonth = `${day} de ${MONTHS[month - 1] ?? ""}`;
  const sameYear = ISO_DATE.test(todayIso) && todayIso.slice(0, 4) === iso.slice(0, 4);
  return sameYear ? dayAndMonth : `${dayAndMonth} de ${year}`;
}

/** ¿La fecha cae después de hoy? El dominio no acepta movimientos futuros. */
export function isFutureDate(iso: string, todayIso: string): boolean {
  if (!ISO_DATE.test(iso) || !ISO_DATE.test(todayIso)) return false;
  return iso > todayIso;
}
