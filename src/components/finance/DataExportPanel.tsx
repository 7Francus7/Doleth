import styles from "./finance.module.css";

const DATA_EXPORTS = [
  ["Movimientos", "/api/export/movimientos.csv", "CSV"],
  ["Cuentas", "/api/export/cuentas.csv", "CSV"],
  ["Próximos pagos", "/api/export/proximos-pagos.csv", "CSV"],
  ["Inversiones", "/api/export/inversiones.csv", "CSV"],
  ["Copia completa", "/api/export/datos.json", "JSON"],
] as const;

export function DataExportPanel() {
  return (
    <div className={styles.exportPanel}>
      <p className={styles.morePrivacyCopy}>
        Descargá una copia para revisar o guardar. Los importes se expresan en
        centavos y las fechas usan formato ISO.
      </p>
      <ul className={styles.exportList}>
        {DATA_EXPORTS.map(([label, href, format]) => (
          <li key={href}>
            <a download className={styles.exportLink} href={href}>
              {label} <span aria-hidden="true">{format}</span>
            </a>
          </li>
        ))}
      </ul>
      <p className={styles.exportFootnote}>
        Esta copia no incluye claves ni secretos. Por ahora sirve para consulta:
        Doleth todavía no permite restaurarla.
      </p>
    </div>
  );
}
