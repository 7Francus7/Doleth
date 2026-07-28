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
        de datos y el proveedor de envío de correo, que recibe únicamente tu dirección y el contenido del mensaje. No
        vendemos ni cedemos información a terceros con fines comerciales.
      </p>

      <h2>Cookies</h2>
      <p>
        Usamos una sola cookie, la de sesión. Es <code>HttpOnly</code>, tiene <code>SameSite=Lax</code>, viaja
        únicamente por HTTPS en producción y contiene un identificador aleatorio: ningún dato tuyo. No hay analítica ni
        cookies de terceros.
      </p>

      <h2>Tus derechos</h2>
      <p>
        Podés corregir tu nombre y tu correo desde la configuración de la cuenta.
      </p>

      <h2>Qué pasa cuando pedís la baja</h2>
      <p>
        Queremos ser exactos, porque acá es fácil prometer de más:
      </p>
      <ul>
        <li>Al pedir la baja se <strong>registra tu solicitud</strong>. No se borra nada en ese momento.</li>
        <li>Podés cancelar el pedido mientras no lo hayamos ejecutado.</li>
        <li>Al procesarlo, primero bloqueamos el acceso: se cierran tus sesiones y la cuenta deja de poder entrar.</li>
        <li>
          Después anonimizamos tu identidad: tu nombre y tu correo dejan de estar asociados a la cuenta y no se puede
          volver a iniciar sesión.
        </li>
        <li>
          Los registros contables se conservan sin persona asociada. Todavía no tenemos definido un plazo de
          destrucción; cuando lo definamos, lo vamos a publicar acá.
        </li>
        <li>Nunca vamos a decirte que tu información fue eliminada si sólo quedó registrada la solicitud.</li>
      </ul>
      <p>
        Todavía no está disponible la exportación de tus datos antes de la baja. Es una deuda reconocida, no una
        función que exista y no encuentres.
      </p>

      <h2 id="pendiente">Lo que todavía falta definir</h2>
      <p>Estos puntos requieren una decisión humana y una revisión profesional que todavía no ocurrió:</p>
      <ul>
        <li>Responsable del tratamiento de los datos.</li>
        <li>Vía formal de contacto para ejercer derechos.</li>
        <li>Base legal y finalidad declarada del tratamiento.</li>
        <li>Plazos concretos de conservación y destrucción.</li>
        <li>Identificación nominal de los proveedores y sus ubicaciones.</li>
        <li>Jurisdicción aplicable y autoridad de control.</li>
      </ul>
      <p>
        Este documento describe cómo funciona Doleth hoy. No es asesoramiento legal y no afirma cumplimiento normativo
        de ninguna jurisdicción.
      </p>

      <p className={styles.legal}>
        <Link className={styles.link} href="/terminos">
          Ver los términos de uso
        </Link>
      </p>
    </LegalPage>
  );
}
