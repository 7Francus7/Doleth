/**
 * Devuelve una ruta de retorno segura y estrictamente interna.
 *
 * Acepta solo rutas absolutas dentro de Doleth (`/movimientos?tipo=...`).
 * Rechaza URLs externas, esquemas de red relativos (`//host`), backslashes,
 * traversal (`..`), caracteres de control y codificación malformada.
 * Ante cualquier duda, devuelve `fallback`.
 */
function hasControlChars(input: string): boolean {
  for (let index = 0; index < input.length; index += 1) {
    const code = input.charCodeAt(index);
    if (code <= 0x1f || code === 0x7f) return true;
  }
  return false;
}

export function sanitizeReturnPath(value: string | null | undefined, fallback = "/movimientos"): string {
  if (typeof value !== "string") return fallback;

  const raw = value.trim();
  if (raw === "") return fallback;

  // Debe ser una ruta interna absoluta.
  if (!raw.startsWith("/")) return fallback;
  // Esquema de red relativo o backslash-escape del origen.
  if (raw.startsWith("//") || raw.startsWith("/\\")) return fallback;
  // Backslashes no pertenecen a rutas internas legítimas.
  if (raw.includes("\\")) return fallback;
  // Caracteres de control (incluye salto de línea, tab y NUL).
  if (hasControlChars(raw)) return fallback;

  // Decodifica para detectar traversal o esquemas ocultos tras codificación.
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    return fallback;
  }
  if (decoded.includes("\\") || decoded.startsWith("//") || hasControlChars(decoded)) return fallback;

  const hasTraversal = (input: string) => input.split(/[/?#]/).some((segment) => segment === "..");
  if (hasTraversal(raw) || hasTraversal(decoded)) return fallback;

  return raw;
}
