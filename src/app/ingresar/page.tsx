import { loginAction } from "./actions";
import { OperationalShell } from "../../components/finance/OperationalShell";
import styles from "../../components/finance/finance.module.css";

const first = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const error = first((await searchParams).error);
  return (
    <OperationalShell eyebrow="Acceso personal" title="Entrar a Doleth" intro="Tus datos financieros están protegidos por la clave personal configurada en el entorno.">
      <form action={loginAction} className={styles.form}>
        <label className={styles.field}><span>Clave personal</span><input autoComplete="current-password" autoFocus minLength={12} name="password" required type="password" /></label>
        {error ? <p className={styles.error} role="alert">{error === "config" ? "Faltan DOLETH_ACCESS_PASSWORD o DOLETH_SESSION_SECRET seguros en el entorno." : "Clave incorrecta."}</p> : null}
        <button className={styles.filterButton} type="submit">Entrar</button>
      </form>
    </OperationalShell>
  );
}
