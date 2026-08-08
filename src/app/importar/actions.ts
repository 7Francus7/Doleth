"use server";

import { revalidatePath } from "next/cache";
import { getDb } from "../../lib/db";
import { UnauthorizedError, requireOnboardedUserForAction } from "../../lib/auth/guards";
import { FALLBACK_EXPENSE_SLUG } from "../../lib/finance/categories";
import { createPostings, dateOnly } from "../../lib/finance/domain";
import { financeError, toSafeError } from "../../lib/finance/errors";
import { parseCsv, trimToTable } from "../../lib/import/csv";
import { detectColumns, toMapping, validateMapping, type ColumnMapping } from "../../lib/import/detect";
import { inferDateOrder, type DateOrder } from "../../lib/import/normalize";
import { buildImportPlan, suggestsInvertedSign, type ImportPlan, type SignConvention } from "../../lib/import/plan";
import { fileFingerprint, serializeSettings, type ImportSettings } from "../../lib/import/session";
import { logServerError } from "../../lib/observability";

/**
 * Importar un resumen.
 *
 * Tres pasos separados y en este orden: **previsualizar** lee el archivo sin
 * tocar nada, **confirmar** escribe el lote entero en una transacción, y
 * **revertir** lo deshace anulando.
 *
 * Que previsualizar no escriba es lo que hace usable al importador. La persona
 * puede subir el archivo, ver que las columnas quedaron cambiadas, corregir el
 * mapeo y volver a mirar, todo sin consecuencias. Un importador que escribe al
 * subir obliga a acertar a la primera con un archivo que nadie miró todavía.
 */

export interface ImportPreviewState {
  ok: boolean;
  message: string;
  error?: { code: string; field?: string };
  preview?: {
    /** Nombre del archivo, para que se vea cuál se está mirando. */
    fileName: string;
    fingerprint: string;
    /** El contenido, para poder confirmar sin volver a subirlo. */
    payload: string;
    settings: ImportSettings;
    plan: ImportPlan;
    /** Encabezados detectados, para poder corregir el mapeo a mano. */
    headers: string[];
    /** `true` si el archivo con este contenido ya se importó antes. */
    alreadyImported: boolean;
    /** `true` cuando casi todo quedó como ingreso: probablemente el signo esté al revés. */
    signLooksInverted: boolean;
    accountName: string;
  };
}

export interface ImportCommitState {
  ok: boolean;
  message: string;
  detail?: string;
  error?: { code: string };
  batchId?: string;
}

const value = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

const failure = (error: unknown, operation: string): ImportPreviewState => {
  if (error instanceof UnauthorizedError) {
    return { ok: false, message: "Tu sesión venció. Volvé a iniciar sesión para continuar.", error: { code: "unauthorized" } };
  }
  const safe = toSafeError(error);
  if (safe.code === "unexpected") logServerError({ route: "/importar", operation, code: safe.code });
  return { ok: false, message: safe.message, error: { code: safe.code, ...(safe.field ? { field: safe.field } : {}) } };
};

/** Tope de tamaño. Un resumen real no llega ni cerca; algo más grande no es un resumen. */
const MAX_FILE_BYTES = 5 * 1024 * 1024;

/** Tope de filas por lote, para que una confirmación no quede corriendo sin fin. */
const MAX_ROWS = 5_000;

/**
 * Lee el archivo y devuelve la propuesta, sin escribir nada.
 *
 * El contenido vuelve en el estado, codificado, para que confirmar no obligue a
 * subir el archivo de nuevo. Es la diferencia entre corregir el mapeo tres veces
 * cómodamente y volver a buscar el archivo en Descargas cada vez.
 */
export async function previewImportAction(
  _previous: ImportPreviewState,
  formData: FormData,
): Promise<ImportPreviewState> {
  try {
    const user = await requireOnboardedUserForAction();
    const db = getDb();

    const accountId = value(formData, "accountId");
    const account = await db.account.findFirst({ where: { id: accountId, userId: user.id, status: "ACTIVE" } });
    if (!account) throw financeError("account-unavailable", "Elegí una cuenta activa.", "accountId");

    const { bytes, fileName } = await readUpload(formData);
    const fingerprint = fileFingerprint(bytes);

    const grid = parseCsv(bytes);
    const { rows: tableRows } = trimToTable(grid.rows);
    if (tableRows.length === 0) {
      throw financeError("empty-file", "No encontramos una tabla de movimientos en ese archivo.", "file");
    }
    if (tableRows.length > MAX_ROWS) {
      throw financeError("too-many-rows", `El archivo tiene más de ${MAX_ROWS} filas. Probá con un período más corto.`, "file");
    }

    const detection = detectColumns(tableRows);
    // El mapeo del formulario tiene prioridad: si la persona ya corrigió una
    // columna, volver a detectar pisaría su corrección con la misma propuesta
    // que estaba corrigiendo.
    const mapping = readMappingOverride(formData) ?? toMapping(detection.columns);
    const problems = validateMapping(mapping);

    const dataRows = detection.hasHeader ? tableRows.slice(1) : tableRows;
    const headers = detection.hasHeader
      ? tableRows[0]!
      : tableRows[0]!.map((_, index) => `Columna ${index + 1}`);

    const dateOrder = (value(formData, "dateOrder") || null) as DateOrder | null;
    const resolvedOrder =
      dateOrder === "DMY" || dateOrder === "MDY"
        ? dateOrder
        : inferDateOrder(dataRows.map((row) => (mapping.date === undefined ? "" : row[mapping.date] ?? "")));

    const signInput = value(formData, "signConvention");
    const signConvention: SignConvention =
      signInput === "positive-is-expense" ? "positive-is-expense" : "negative-is-expense";

    const settings: ImportSettings = {
      mapping,
      dateOrder: resolvedOrder,
      signConvention,
      delimiter: grid.delimiter,
      encoding: grid.encoding,
      hasHeader: detection.hasHeader,
    };

    if (problems.length > 0) {
      return {
        ok: false,
        message: problems.join(" "),
        error: { code: "mapping-incomplete" },
        preview: {
          fileName,
          fingerprint,
          payload: encodePayload(bytes),
          settings,
          plan: buildImportPlan({ rows: [], mapping, dateOrder: resolvedOrder, signConvention }),
          headers,
          alreadyImported: false,
          signLooksInverted: false,
          accountName: account.name,
        },
      };
    }

    // Sólo el período que cubre el archivo: traer el ledger entero para comparar
    // sería caro y no aportaría nada, porque un duplicado siempre cae en el
    // mismo día que su original.
    const existing = await readExistingForRange(user.id, account.id, dataRows, mapping, resolvedOrder);

    const plan = buildImportPlan({ rows: dataRows, mapping, dateOrder: resolvedOrder, signConvention, existing });

    const previousBatch = await db.importBatch.findFirst({
      where: { userId: user.id, fileSha256: fingerprint, status: "COMMITTED" },
    });

    return {
      ok: true,
      message: `Leímos ${plan.rows.length} ${plan.rows.length === 1 ? "fila" : "filas"}. Revisá antes de confirmar.`,
      preview: {
        fileName,
        fingerprint,
        payload: encodePayload(bytes),
        settings,
        plan,
        headers,
        alreadyImported: previousBatch !== null,
        signLooksInverted: suggestsInvertedSign(plan),
        accountName: account.name,
      },
    };
  } catch (error) {
    return failure(error, "preview-import");
  }
}

async function readUpload(formData: FormData): Promise<{ bytes: Uint8Array; fileName: string }> {
  // El contenido puede venir del archivo recién subido o del estado de una
  // previsualización anterior, cuando la persona corrigió el mapeo y volvió a
  // mirar sin subir de nuevo.
  const carried = value(formData, "payload");
  if (carried) {
    return { bytes: decodePayload(carried), fileName: value(formData, "fileName") || "archivo.csv" };
  }

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw financeError("file-missing", "Elegí el archivo del resumen.", "file");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw financeError("file-too-large", "El archivo supera los 5 MB. Un resumen no debería llegar a ese tamaño.", "file");
  }
  return { bytes: new Uint8Array(await file.arrayBuffer()), fileName: file.name };
}

const encodePayload = (bytes: Uint8Array): string => Buffer.from(bytes).toString("base64");
const decodePayload = (payload: string): Uint8Array => new Uint8Array(Buffer.from(payload, "base64"));

/** Mapeo corregido a mano desde la pantalla, si vino. */
function readMappingOverride(formData: FormData): ColumnMapping | null {
  const raw = String(formData.get("mapping") ?? "").trim();
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as ColumnMapping;
  } catch {
    return null;
  }
}

/**
 * Movimientos ya registrados en el rango del archivo, para detectar repetidos.
 *
 * Se acota a la cuenta destino: el mismo importe el mismo día en otra cuenta es
 * otro movimiento, no un duplicado, y marcarlo como tal escondería un gasto real.
 */
async function readExistingForRange(
  userId: string,
  accountId: string,
  rows: readonly string[][],
  mapping: ColumnMapping,
  dateOrder: DateOrder,
): Promise<{ day: string; amountCents: bigint; description: string }[]> {
  if (mapping.date === undefined) return [];

  const { parseImportDate } = await import("../../lib/import/normalize");
  const days = rows
    .map((row) => parseImportDate(row[mapping.date!] ?? "", dateOrder))
    .filter((day): day is string => day !== null)
    .sort();
  if (days.length === 0) return [];

  const movements = await getDb().transaction.findMany({
    where: {
      userId,
      voidedAt: null,
      sourceAccountId: accountId,
      occurredOn: { gte: dateOnly(days[0]!), lte: dateOnly(days[days.length - 1]!) },
    },
    select: { occurredOn: true, amountCents: true, description: true, type: true },
  });

  return movements.map((movement) => ({
    day: movement.occurredOn.toISOString().slice(0, 10),
    // El plan compara en valor absoluto, pero se conserva el sentido para que la
    // comparación no dependa de cómo estaba guardado el signo.
    amountCents: movement.type === "EXPENSE" ? -movement.amountCents : movement.amountCents,
    description: movement.description ?? "",
  }));
}

/**
 * Confirma el lote: crea los movimientos y guarda la trazabilidad.
 *
 * Todo en una transacción. Un import a medias sería lo peor de los dos mundos:
 * la persona no sabría cuáles filas entraron y volver a intentar duplicaría las
 * que sí. O entra completo o no entra nada.
 */
export async function commitImportAction(
  _previous: ImportCommitState,
  formData: FormData,
): Promise<ImportCommitState> {
  try {
    const user = await requireOnboardedUserForAction();
    const db = getDb();

    const accountId = value(formData, "accountId");
    const fileName = value(formData, "fileName") || "archivo.csv";
    const payload = value(formData, "payload");
    if (!payload) throw financeError("payload-missing", "Volvé a subir el archivo para confirmar.");

    const account = await db.account.findFirst({ where: { id: accountId, userId: user.id, status: "ACTIVE" } });
    if (!account) throw financeError("account-unavailable", "Elegí una cuenta activa.", "accountId");

    const settingsRaw = value(formData, "settings");
    let settings: ImportSettings;
    try {
      settings = JSON.parse(settingsRaw) as ImportSettings;
    } catch {
      throw financeError("settings-invalid", "Volvé a previsualizar el archivo antes de confirmar.");
    }

    const bytes = decodePayload(payload);
    const fingerprint = fileFingerprint(bytes);
    const grid = parseCsv(bytes);
    const { rows: tableRows } = trimToTable(grid.rows);
    const dataRows = settings.hasHeader ? tableRows.slice(1) : tableRows;

    const existing = await readExistingForRange(user.id, account.id, dataRows, settings.mapping, settings.dateOrder);
    const plan = buildImportPlan({
      rows: dataRows,
      mapping: settings.mapping,
      dateOrder: settings.dateOrder,
      signConvention: settings.signConvention,
      existing,
    });

    if (plan.usableCount === 0) {
      throw financeError("nothing-to-import", "No hay filas para importar: todas tienen problemas o ya estaban registradas.");
    }

    const category = await db.category.findFirst({ where: { userId: user.id, slug: FALLBACK_EXPENSE_SLUG } });
    if (!category) {
      throw financeError("seed-missing", "Falta la categoría de respaldo. Completá la configuración inicial antes de importar.");
    }
    const incomeCategory = await db.category.findFirst({ where: { userId: user.id, kind: "INCOME" } });

    let batchId = "";
    await db.$transaction(async (tx) => {
      const batch = await tx.importBatch.create({
        data: {
          userId: user.id,
          accountId: account.id,
          originalName: fileName,
          fileSha256: fingerprint,
          status: "COMMITTED",
          committedAt: new Date(),
          settingsJson: serializeSettings(settings),
          rowCount: plan.rows.length,
          committedCount: plan.usableCount,
          skippedCount: plan.rows.length - plan.usableCount,
        },
      });
      batchId = batch.id;

      for (const row of plan.rows) {
        let transactionId: string | null = null;

        if (row.usable) {
          const type = row.type!;
          const amountCents = row.amountCents! < 0n ? -row.amountCents! : row.amountCents!;
          const categoryId = type === "INCOME" ? incomeCategory?.id : category.id;
          if (!categoryId) {
            throw financeError("seed-missing", "Falta una categoría de ingresos para importar acreditaciones.");
          }

          const created = await tx.transaction.create({
            data: {
              userId: user.id,
              type,
              amountCents,
              currency: account.currency,
              occurredOn: dateOnly(row.day!),
              sourceAccountId: account.id,
              categoryId,
              // El comercio normalizado es lo que la persona va a leer y lo que
              // agrupan los reportes. El texto crudo queda en la fila del lote,
              // así que no se pierde nada al guardar el nombre limpio.
              description: row.merchant.slice(0, 160),
              idempotencyKey: `import:${batch.id}:${row.sourceRowNumber}`,
              entries: { create: createPostings(type, amountCents, account.id) },
            },
          });
          transactionId = created.id;
        }

        await tx.importRow.create({
          data: {
            userId: user.id,
            batchId: batch.id,
            sourceRowNumber: row.sourceRowNumber,
            rawJson: JSON.stringify(row.cells),
            ...(row.day ? { day: dateOnly(row.day) } : {}),
            ...(row.amountCents !== null ? { amountCents: row.amountCents } : {}),
            ...(row.merchant ? { merchant: row.merchant.slice(0, 160) } : {}),
            issuesJson: JSON.stringify({
              issues: row.issues,
              ...(row.duplicate ? { duplicate: row.duplicate } : {}),
              ...(row.processor ? { processor: row.processor } : {}),
              ...(row.installment ? { installment: row.installment } : {}),
            }),
            ...(transactionId ? { transactionId } : {}),
          },
        });
      }
    });

    refreshImportSurfaces();
    const skipped = plan.rows.length - plan.usableCount;
    return {
      ok: true,
      message: `Importamos ${plan.usableCount} ${plan.usableCount === 1 ? "movimiento" : "movimientos"} a ${account.name}.`,
      detail:
        skipped > 0
          ? `Quedaron ${skipped} ${skipped === 1 ? "fila" : "filas"} sin importar: podés verlas en el detalle del lote. Si algo salió mal, se puede deshacer entero.`
          : "Si algo salió mal, el lote se puede deshacer entero.",
      batchId,
    };
  } catch (error) {
    const state = failure(error, "commit-import");
    return { ok: false, message: state.message, ...(state.error ? { error: { code: state.error.code } } : {}) };
  }
}

/**
 * Deshace un lote anulando sus movimientos.
 *
 * Anula, no borra. El ledger de Doleth conserva lo anulado visible y fuera de los
 * saldos, y un import revertido no puede ser la excepción que abre la puerta al
 * borrado físico: la persona tiene que poder ver que ese import existió y que se
 * deshizo.
 */
export async function revertImportAction(
  _previous: ImportCommitState,
  formData: FormData,
): Promise<ImportCommitState> {
  try {
    const user = await requireOnboardedUserForAction();
    const db = getDb();
    const batchId = value(formData, "batchId");

    let reverted = 0;
    await db.$transaction(async (tx) => {
      const batch = await tx.importBatch.findFirst({
        where: { id: batchId, userId: user.id },
        include: { rows: { where: { transactionId: { not: null } } } },
      });
      if (!batch) throw financeError("batch-missing", "Ese lote no existe.");
      if (batch.status !== "COMMITTED") {
        throw financeError("batch-not-committed", "Ese lote no está confirmado, así que no hay nada que deshacer.");
      }

      const transactionIds = batch.rows.map((row) => row.transactionId!).filter(Boolean);
      const result = await tx.transaction.updateMany({
        where: { id: { in: transactionIds }, userId: user.id, voidedAt: null },
        data: { voidedAt: new Date(), voidReason: `Importación deshecha (${batch.originalName})` },
      });
      reverted = result.count;

      await tx.importBatch.update({
        where: { id: batch.id },
        data: { status: "REVERTED", revertedAt: new Date() },
      });
    });

    refreshImportSurfaces();
    return {
      ok: true,
      message: `Importación deshecha: ${reverted} ${reverted === 1 ? "movimiento anulado" : "movimientos anulados"}.`,
      detail: "Siguen visibles en el historial, marcados como anulados, y ya no participan de tus saldos.",
      batchId,
    };
  } catch (error) {
    const state = failure(error, "revert-import");
    return { ok: false, message: state.message, ...(state.error ? { error: { code: state.error.code } } : {}) };
  }
}

function refreshImportSurfaces() {
  revalidatePath("/ahora");
  revalidatePath("/movimientos");
  revalidatePath("/cuentas");
  revalidatePath("/importar");
}
