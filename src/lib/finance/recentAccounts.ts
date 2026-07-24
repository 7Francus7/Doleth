/**
 * Preferencia local de cuenta por tipo de operación.
 *
 * Es una comodidad del dispositivo, no un dato de dominio: no hay modelo nuevo
 * ni escritura en la base. Solo se guarda un identificador de cuenta.
 */
export type AccountRole = "expense" | "income" | "transfer-source" | "transfer-destination";

export interface SelectableAccount {
  id: string;
  name: string;
}

export function recentAccountKey(role: AccountRole): string {
  return `doleth:cuenta-reciente:${role}`;
}

/**
 * Elige la cuenta a preseleccionar.
 *
 * Prioridad: lo que la persona ya eligió explícitamente, después la última usada
 * y, si hay una sola cuenta posible, esa. Una cuenta archivada o borrada ya no
 * figura entre las disponibles, así que cae sola en el fallback.
 */
export function resolveDefaultAccount({
  explicit,
  remembered,
  accounts,
  exclude,
}: {
  explicit?: string | undefined;
  remembered?: string | null | undefined;
  accounts: readonly SelectableAccount[];
  exclude?: string | undefined;
}): string {
  const available = accounts.filter((account) => account.id !== exclude);
  const exists = (id: string | null | undefined) => Boolean(id) && available.some((account) => account.id === id);

  if (exists(explicit)) return explicit!;
  if (exists(remembered)) return remembered!;
  if (available.length === 1) return available[0]!.id;
  return "";
}

/** Origen y destino no pueden coincidir: si chocan, el destino se limpia. */
export function clearDestinationIfSameAsSource(sourceId: string, destinationId: string): string {
  return destinationId && destinationId === sourceId ? "" : destinationId;
}
