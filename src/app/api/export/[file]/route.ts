import { NextResponse } from "next/server";
import { createFinancialExport, datasetRows } from "../../../../lib/export/data";
import {
  PRIVATE_DOWNLOAD_HEADERS,
  toSemicolonCsv,
  type ExportDataset,
} from "../../../../lib/export/format";
import { logServerError } from "../../../../lib/observability";

const CSV_FILES = new Map<string, ExportDataset>([
  ["movimientos.csv", "movimientos"],
  ["cuentas.csv", "cuentas"],
  ["proximos-pagos.csv", "proximos-pagos"],
  ["inversiones.csv", "inversiones"],
]);

export async function GET(
  _request: Request,
  context: { params: Promise<{ file: string }> },
) {
  const { file } = await context.params;
  if (file !== "datos.json" && !CSV_FILES.has(file)) {
    return NextResponse.json(
      { error: "Exportación no disponible." },
      { status: 404, headers: PRIVATE_DOWNLOAD_HEADERS },
    );
  }

  try {
    const snapshot = await createFinancialExport();
    if (file === "datos.json") {
      return new NextResponse(JSON.stringify(snapshot, null, 2), {
        headers: {
          ...PRIVATE_DOWNLOAD_HEADERS,
          "Content-Disposition": 'attachment; filename="doleth-datos.json"',
          "Content-Type": "application/json; charset=utf-8",
        },
      });
    }

    const dataset = CSV_FILES.get(file)!;
    const { headers, rows } = datasetRows(snapshot, dataset);
    return new NextResponse(toSemicolonCsv(headers, rows), {
      headers: {
        ...PRIVATE_DOWNLOAD_HEADERS,
        "Content-Disposition": `attachment; filename="doleth-${file}"`,
        "Content-Type": "text/csv; charset=utf-8",
      },
    });
  } catch {
    const reference = logServerError({
      route: `/api/export/${file}`,
      operation: "financial-export",
      code: "export-failed",
    });
    return NextResponse.json(
      { error: "No pudimos preparar la copia de datos.", reference },
      { status: 500, headers: PRIVATE_DOWNLOAD_HEADERS },
    );
  }
}
