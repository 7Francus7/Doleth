import Link from "next/link";
import { archiveInvestmentAction } from "../../app/actions/finance";
import { SensitiveAmount } from "../../components/privacy/AmountPrivacy";
import type { InvestmentDetailModel } from "./model";
import styles from "./investmentDetail.module.css";

export function InvestmentDetail({ model }: { model: InvestmentDetailModel }) {
  return <div className={styles.page}>
    <section className={styles.hero} data-tone={model.tone}>
      <p>{model.status === "ARCHIVED" ? "Inversión archivada" : "Inversión"}</p>
      <h1>{model.identity}</h1>
      <strong><SensitiveAmount>{model.value}</SensitiveAmount></strong>
      <span data-tone={model.tone}>{model.resultPrefix}{model.result}{model.returnLabel ? ` · ${model.returnLabel}` : ""}</span>
    </section>

    <dl className={styles.facts}>
      <div><dt>Activo</dt><dd>{model.name}</dd></div>
      <div><dt>Clase</dt><dd>{model.kindLabel}</dd></div>
      <div><dt>Símbolo</dt><dd>{model.symbol || "No cargado"}</dd></div>
      <div><dt>Cantidad</dt><dd>{model.quantity || "No aplica"}</dd></div>
      <div><dt>Aportaste</dt><dd><SensitiveAmount>{model.invested}</SensitiveAmount></dd></div>
      <div><dt>Hoy vale</dt><dd><SensitiveAmount>{model.value}</SensitiveAmount></dd></div>
      <div><dt>Resultado</dt><dd>{model.resultPrefix}{model.result}{model.returnLabel ? ` · ${model.returnLabel}` : " · sin porcentaje"}</dd></div>
      <div><dt>Moneda</dt><dd>{model.currency}</dd></div>
      <div className={styles.wide}><dt>Fuente de valuación</dt><dd>{model.source}</dd></div>
      <div className={styles.wide}><dt>Nota</dt><dd>{model.note || "Sin nota"}</dd></div>
    </dl>

    <aside className={styles.boundary}><strong>Snapshot actual</strong><p>Doleth no tiene operaciones históricas de esta inversión. Aportado y valor actual son los datos vigentes de la tenencia.</p></aside>

    <div className={styles.actions}>
      {model.symbol ? <Link href="/integraciones">Gestionar precios</Link> : null}
      <form action={archiveInvestmentAction}>
        <input name="id" type="hidden" value={model.id} />
        <input name="status" type="hidden" value={model.status === "ACTIVE" ? "ARCHIVED" : "ACTIVE"} />
        <button type="submit">{model.status === "ACTIVE" ? "Archivar inversión" : "Reactivar inversión"}</button>
      </form>
    </div>
  </div>;
}
