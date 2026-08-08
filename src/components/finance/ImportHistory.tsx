"use client";

import { useActionState } from "react";
import { revertImportAction, type ImportCommitState } from "../../app/importar/actions";
import { StatusMessage } from "../../design-system/feedback";
import { SubmitButton } from "./SubmitButton";
import importStyles from "./import.module.css";

/**
 * Historial de importaciones.
 *
 * Existe para que deshacer sea una acción visible y no un rescate. Saber de
 * antemano que el botón está ahí es lo que permite importar un archivo del que
 * no se está del todo seguro, que es la mayoría de las veces.
 */

const initial: ImportCommitState = { ok: false, message: "" };

export interface ImportBatchSummary {
  id: string;
  originalName: string;
  accountName: string;
  status: "PREVIEWED" | "COMMITTED" | "REVERTED";
  rowCount: number;
  committedCount: number;
  createdAt: string;
}

const STATUS_LABELS: Record<ImportBatchSummary["status"], string> = {
  PREVIEWED: "Sin confirmar",
  COMMITTED: "Importado",
  REVERTED: "Deshecho",
};

const dateFormatter = new Intl.DateTimeFormat("es-AR", {
  day: "2-digit",
  month: "long",
  hour: "2-digit",
  minute: "2-digit",
});

export function ImportHistory({ batches }: { batches: readonly ImportBatchSummary[] }) {
  const [state, action] = useActionState(revertImportAction, initial);

  if (batches.length === 0) return null;

  return (
    <section className={importStyles.tableWrap}>
      <h2 className={importStyles.summaryTitle}>Importaciones anteriores</h2>
      {state.message ? (
        <StatusMessage tone={state.ok ? "success" : "error"}>{state.message}</StatusMessage>
      ) : null}
      {state.ok && state.detail ? <p className={importStyles.summaryNote}>{state.detail}</p> : null}

      <div className={importStyles.tableScroll}>
        <table className={importStyles.table}>
          <thead>
            <tr>
              <th scope="col">Archivo</th>
              <th scope="col">Cuenta</th>
              <th scope="col">Cuándo</th>
              <th scope="col">Movimientos</th>
              <th scope="col">Estado</th>
              <th scope="col" />
            </tr>
          </thead>
          <tbody>
            {batches.map((batch) => (
              <tr data-state={batch.status === "COMMITTED" ? "ok" : "skip"} key={batch.id}>
                <td>{batch.originalName}</td>
                <td>{batch.accountName}</td>
                <td>{dateFormatter.format(new Date(batch.createdAt))}</td>
                <td className={importStyles.amount}>
                  {batch.committedCount} de {batch.rowCount}
                </td>
                <td>{STATUS_LABELS[batch.status]}</td>
                <td>
                  {batch.status === "COMMITTED" ? (
                    <form action={action}>
                      <input name="batchId" type="hidden" value={batch.id} />
                      <SubmitButton pendingLabel="Deshaciendo…">
                        Deshacer
                      </SubmitButton>
                    </form>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={importStyles.summaryNote}>
        Deshacer anula los movimientos del lote: siguen visibles en el historial, marcados como anulados, y dejan de
        participar de tus saldos. Nada se borra.
      </p>
    </section>
  );
}
