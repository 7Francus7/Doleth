"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  commitImportAction,
  previewImportAction,
  type ImportCommitState,
  type ImportPreviewState,
} from "../../app/importar/actions";
import { DUPLICATE_MESSAGES, ROW_ISSUE_MESSAGES } from "../../lib/import/plan";
import { formatCentsAR } from "../../lib/finance/amount";
import { CURRENCY_SYMBOLS } from "../../lib/finance/currency";
import { StatusMessage } from "../../design-system/feedback";
import { SubmitButton } from "./SubmitButton";
import styles from "./finance.module.css";
import importStyles from "./import.module.css";

/**
 * Importar un resumen, en dos pasos visibles.
 *
 * El primer paso lee y muestra; el segundo escribe. La pantalla insiste en esa
 * separación porque es lo que permite equivocarse sin consecuencias: mientras no
 * se toca "Confirmar", el ledger no se enteró de nada.
 */

const previewInitial: ImportPreviewState = { ok: false, message: "" };
const commitInitial: ImportCommitState = { ok: false, message: "" };

interface AccountOption {
  id: string;
  name: string;
  currency: string;
}

const abs = (value: bigint) => (value < 0n ? -value : value);

export function ImportWizard({ accounts }: { accounts: readonly AccountOption[] }) {
  const [preview, previewAction] = useActionState(previewImportAction, previewInitial);
  const [commit, commitAction] = useActionState(commitImportAction, commitInitial);
  const [accountId, setAccountId] = useState(accounts[0]?.id ?? "");

  const data = preview.preview;
  const currency = accounts.find((account) => account.id === accountId)?.currency ?? "ARS";
  const symbol = CURRENCY_SYMBOLS[currency as "ARS"] ?? currency;

  // Una vez confirmado, la propuesta ya no es una propuesta: mostrarla al lado
  // del resultado invitaría a confirmarla otra vez.
  if (commit.ok) {
    return (
      <div className={importStyles.result}>
        <StatusMessage tone="success">{commit.message}</StatusMessage>
        {commit.detail ? <p className={importStyles.resultDetail}>{commit.detail}</p> : null}
        <div className={importStyles.resultActions}>
          <Link className={styles.primaryLink} href="/movimientos">
            Ver los movimientos
          </Link>
          <Link className={importStyles.secondaryLink} href="/importar">
            Importar otro archivo
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className={importStyles.wizard}>
      <form action={previewAction} className={styles.form}>
        <label className={styles.field}>
          <span>Cuenta</span>
          <select name="accountId" onChange={(event) => setAccountId(event.target.value)} required value={accountId}>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name} · {account.currency}
              </option>
            ))}
          </select>
        </label>

        <label className={styles.field}>
          <span>Archivo del resumen</span>
          <input accept=".csv,.txt,text/csv,text/plain" name="file" required={!data} type="file" />
        </label>
        <p className={styles.fieldHint}>
          CSV o texto separado. Lo leemos y te mostramos qué encontramos: nada se guarda hasta que confirmes.
        </p>

        {/* El contenido viaja con el formulario para poder corregir el mapeo sin
            volver a buscar el archivo en Descargas. */}
        {data ? <input name="payload" type="hidden" value={data.payload} /> : null}
        {data ? <input name="fileName" type="hidden" value={data.fileName} /> : null}

        {data ? (
          <div className={styles.fieldRow}>
            <label className={styles.field}>
              <span>Fechas del archivo</span>
              <select defaultValue={data.settings.dateOrder} name="dateOrder">
                <option value="DMY">Día/mes/año</option>
                <option value="MDY">Mes/día/año</option>
              </select>
            </label>
            <label className={styles.field}>
              <span>Los gastos vienen…</span>
              <select defaultValue={data.settings.signConvention} name="signConvention">
                <option value="negative-is-expense">En negativo (extracto bancario)</option>
                <option value="positive-is-expense">En positivo (resumen de tarjeta)</option>
              </select>
            </label>
          </div>
        ) : null}

        {preview.message ? (
          <StatusMessage tone={preview.ok ? "success" : "error"}>{preview.message}</StatusMessage>
        ) : null}

        <SubmitButton pendingLabel="Leyendo…">{data ? "Volver a leer" : "Leer el archivo"}</SubmitButton>
      </form>

      {data && data.plan.rows.length > 0 ? (
        <>
          {data.signLooksInverted ? (
            <StatusMessage tone="warning">
              Casi todas las filas quedaron como ingreso. Si es un resumen de tarjeta, cambiá “Los gastos vienen…” a
              “En positivo” y volvé a leer.
            </StatusMessage>
          ) : null}
          {data.alreadyImported ? (
            <StatusMessage tone="warning">
              Este mismo archivo ya se importó antes. Las filas repetidas están marcadas y no se van a duplicar.
            </StatusMessage>
          ) : null}

          <section className={importStyles.summary}>
            <h2 className={importStyles.summaryTitle}>Qué encontramos</h2>
            <dl className={importStyles.summaryGrid}>
              <Fact label="Se importan" value={`${data.plan.usableCount}`} />
              <Fact label="Con problemas" value={`${data.plan.brokenCount}`} />
              <Fact label="Ya registradas" value={`${data.plan.duplicateCount}`} />
              <Fact label="Salidas" value={`${symbol}${formatCentsAR(data.plan.expenseCents)}`} />
              <Fact label="Entradas" value={`${symbol}${formatCentsAR(data.plan.incomeCents)}`} />
              <Fact
                label="Período"
                value={data.plan.firstDay ? `${data.plan.firstDay} → ${data.plan.lastDay}` : "—"}
              />
            </dl>
            <p className={importStyles.summaryNote}>
              Cotejá las salidas y las entradas con el total de tu resumen antes de confirmar. Si no coinciden, algo
              se leyó distinto.
            </p>
          </section>

          <section className={importStyles.tableWrap}>
            <h2 className={importStyles.summaryTitle}>Fila por fila</h2>
            <div className={importStyles.tableScroll}>
              <table className={importStyles.table}>
                <thead>
                  <tr>
                    <th scope="col">#</th>
                    <th scope="col">Fecha</th>
                    <th scope="col">Comercio</th>
                    <th scope="col">Importe</th>
                    <th scope="col">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {data.plan.rows.slice(0, 200).map((row) => (
                    <tr data-state={row.usable ? "ok" : "skip"} key={row.sourceRowNumber}>
                      <td>{row.sourceRowNumber}</td>
                      <td>{row.day ?? "—"}</td>
                      <td>
                        <span className={importStyles.merchant}>{row.merchant || "—"}</span>
                        {row.processor ? <span className={importStyles.tag}>{row.processor}</span> : null}
                        {row.installment ? (
                          <span className={importStyles.tag}>
                            Cuota {row.installment.number}/{row.installment.total}
                          </span>
                        ) : null}
                      </td>
                      <td className={importStyles.amount}>
                        {row.amountCents === null
                          ? "—"
                          : `${row.amountCents < 0n ? "-" : "+"}${symbol}${formatCentsAR(abs(row.amountCents))}`}
                      </td>
                      <td className={importStyles.status}>
                        {row.usable
                          ? "Se importa"
                          : row.duplicate
                            ? DUPLICATE_MESSAGES[row.duplicate]
                            : row.issues.map((issue) => ROW_ISSUE_MESSAGES[issue]).join(" ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data.plan.rows.length > 200 ? (
              <p className={importStyles.summaryNote}>
                Se muestran las primeras 200 filas de {data.plan.rows.length}. Se importan todas las que estén en
                condiciones.
              </p>
            ) : null}
          </section>

          <form action={commitAction} className={styles.form}>
            <input name="accountId" type="hidden" value={accountId} />
            <input name="payload" type="hidden" value={data.payload} />
            <input name="fileName" type="hidden" value={data.fileName} />
            <input name="settings" type="hidden" value={JSON.stringify(data.settings)} />
            {commit.message && !commit.ok ? <StatusMessage tone="error">{commit.message}</StatusMessage> : null}
            <SubmitButton pendingLabel="Importando…">
              {`Confirmar e importar ${data.plan.usableCount} ${data.plan.usableCount === 1 ? "movimiento" : "movimientos"}`}
            </SubmitButton>
            <p className={styles.fieldHint}>
              Se guardan como un lote. Si algo sale mal, se puede deshacer entero desde el historial de importaciones.
            </p>
          </form>
        </>
      ) : null}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className={importStyles.fact}>
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
