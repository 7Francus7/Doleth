import { NextResponse } from "next/server";
import { getOptionalUser } from "../../../../lib/auth/guards";
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

/**
 * Descarga de la copia de datos.
 *
 * El único parámetro que acepta es `file`, y se valida contra una lista cerrada.
 * El dueño de los datos sale de la sesión (`getOptionalUser()`): no hay forma de
 * pedir la copia de otra persona, porque no hay ningún lugar donde escribir un
 * identificador ajeno. La falta de sesión se responde 401 antes del `try`, para
 * que nunca quede confundida con un fallo de lectura ni disfrazada de 500.
 */
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

  const user = await getOptionalUser();
  if (!user) {
    return NextResponse.json(
      { error: "Necesitás iniciar sesión para descargar tus datos." },
      { status: 401, headers: PRIVATE_DOWNLOAD_HEADERS },
    );
  }

  try {
    const snapshot = await createFinancialExport(user.id);
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
