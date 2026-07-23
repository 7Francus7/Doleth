import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { LoginForm } from "./LoginForm";
import { DolethBrand } from "../../components/brand/DolethBrand";
import { Button } from "../../design-system/primitives/Button";
import styles from "../../components/finance/finance.module.css";

function LoginFrame({ error }: { error?: string }) {
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

const meta = {
  title: "App/Login",
  component: LoginFrame,
  parameters: { layout: "fullscreen", nextjs: { appDirectory: true } },
} satisfies Meta<typeof LoginFrame>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Acceso en reposo: submit deshabilitado hasta escribir la clave. */
export const Default: Story = {};

/** Error humano asociado al campo, sin tecnicismos. */
export const ConError: Story = {
  args: { error: "La clave no coincide. Revisala e intentá nuevamente." },
};

/** Ancho de teléfono estándar. */
export const Mobile: Story = {
  globals: { viewport: { value: "mobile1" } },
};

/** Estado de verificación: submit ocupado, sin doble envío. */
export const Cargando: Story = {
  render: () => (
    <main className={`app-canvas ${styles.loginCanvas}`}>
      <div className={styles.loginShell}>
        <DolethBrand />
        <header className={styles.loginHeader}>
          <h1 className={styles.loginTitle}>Entrá a Doleth</h1>
          <p className={styles.loginLede}>Accedé a tu espacio financiero privado.</p>
        </header>
        <form className={styles.loginForm}>
          <div className={styles.field}>
            <label htmlFor="password-loading">Clave personal</label>
            <div className={styles.passwordRow}>
              <input defaultValue="············" id="password-loading" readOnly type="password" />
              <button className={styles.passwordToggle} type="button">Mostrar</button>
            </div>
          </div>
          <Button loading loadingLabel="Verificando…" size="lg" type="submit" width="fill">Entrar</Button>
        </form>
      </div>
    </main>
  ),
};
