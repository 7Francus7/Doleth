import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "../../components/auth/LegalPage";
import styles from "../../components/auth/auth.module.css";

export const metadata: Metadata = {
  title: "Privacidad · Doleth",
  description: "Qué datos guarda Doleth y cómo los trata.",
};

export default function PrivacyPage() {
  return (
    <LegalPage eyebrow="Legal" title="Política de privacidad" updatedOn="27 de julio de 2026">
      <h2>Qué guardamos</h2>
      <ul>
        <li>Tu nombre y tu dirección de correo, para identificarte y contactarte por temas de la cuenta.</li>
        <li>
          Un hash de tu contraseña, calculado con scrypt. No guardamos la contraseña y no podemos recuperarla: si la
          perdés, sólo se puede reemplazar.
        </li>
        <li>Los datos financieros que cargás: cuentas, movimientos, compromisos futuros e inversiones.</li>
        <li>Tus preferencias: moneda, zona horaria y formato regional.</li>
        <li>
          Una bitácora de eventos de seguridad (inicios de sesión, cambios de contraseña, cierres de sesión). Ahí el
          correo y la dirección IP se guardan seudonimizados, no en claro.
        </li>
      </ul>

      <h2>Qué no guardamos</h2>
      <ul>
        <li>Contraseñas en texto plano.</li>
        <li>Enlaces de verificación o recuperación completos: en la base queda sólo su hash.</li>
        <li>Datos de tarjetas o medios de pago: no hay ninguna pasarela de pago integrada.</li>
        <li>Credenciales de tus bancos: Doleth no se conecta a entidades financieras.</li>
      </ul>

      <h2>Aislamiento entre cuentas</h2>
      <p>
        Cada consulta a la base filtra por el usuario de la sesión validada en el servidor. Ninguna pantalla, enlace o
        identificador permite ver información de otra persona.
      </p>

      <h2>Con quién compartimos</h2>
      <p>
        Con nadie, salvo los proveedores necesarios para que el servicio funcione: el hosting de la aplicación, la base
        de datos y el proveedor de envío de correo, que recibe únicamente tu dirección y el contenido del mensaje.
      </p>

      <h2>Cookies</h2>
      <p>
        Usamos una sola cookie, la de sesión. Es <code>HttpOnly</code>, tiene <code>SameSite=Lax</code>, viaja
        únicamente por HTTPS en producción y contiene un identificador aleatorio: ningún dato tuyo. No hay analítica ni
        cookies de terceros.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Podés corregir tu nombre y tu correo desde la configuración de la cuenta, y pedir la eliminación de tu cuenta
        desde la misma pantalla. La solicitud queda registrada y se procesa de forma manual.
      </p>

      <p className={styles.legal}>
        <Link className={styles.link} href="/terminos">
          Ver los términos de uso
        </Link>
      </p>
    </LegalPage>
  );
}
