import { LoginForm } from "./LoginForm";
import { DolethBrand } from "../../components/brand/DolethBrand";
import styles from "../../components/finance/finance.module.css";

export const metadata = { title: "Ingresar" };

const first = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

const errorCopy: Record<string, string> = {
  invalid: "La clave no coincide. Revisala e intentá nuevamente.",
  config: "No pudimos verificar el acceso en este momento. Intentá de nuevo en unos minutos.",
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const code = first((await searchParams).error);
  const error = code ? (errorCopy[code] ?? errorCopy.invalid) : undefined;
  return (
    <main className={`app-canvas ${styles.loginCanvas}`}>
      <div className={styles.loginShell}>
        <DolethBrand />
        <header className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Entrá a Doleth</h1>
          <p className={styles.loginLede}>Accedé a tu espacio financiero privado.</p>
        </header>
        <LoginForm {...(error ? { error } : {})} />
        <p className={styles.loginFootnote}>Tus datos se usan únicamente para mostrarte tu situación financiera.</p>
      </div>
    </main>
  );
}
