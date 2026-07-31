export type ExportDataset =
  | "movimientos"
  | "cuentas"
  | "proximos-pagos"
  | "inversiones";

export type CsvCell = string | number | boolean | null;

const FORMULA_PREFIX = /^[=+\-@\t\r]/;

export function safeSpreadsheetCell(value: CsvCell): string {
  const plain = value === null ? "" : String(value);
  const safe = FORMULA_PREFIX.test(plain) ? `'${plain}` : plain;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function toSemicolonCsv(headers: readonly string[], rows: readonly CsvCell[][]): string {
  const lines = [
    headers.map(safeSpreadsheetCell).join(";"),
    ...rows.map((row) => row.map(safeSpreadsheetCell).join(";")),
  ];
  return `\uFEFF${lines.join("\r\n")}\r\n`;
}

export const PRIVATE_DOWNLOAD_HEADERS = {
  "Cache-Control": "private, no-store, max-age=0",
  Pragma: "no-cache",
  "X-Content-Type-Options": "nosniff",
} as const;
