import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "../../components/auth/LegalPage";
import styles from "../../components/auth/auth.module.css";

export const metadata: Metadata = {
  title: "Términos · Doleth",
  description: "Condiciones de uso de Doleth.",
};

export default function TermsPage() {
  return (
    <LegalPage eyebrow="Legal" title="Términos de uso" updatedOn="27 de julio de 2026">
      <h2>Qué es Doleth</h2>
      <p>
        Doleth es una herramienta personal para registrar cuentas, movimientos, compromisos futuros e inversiones. Te
        muestra lo que vos cargás. No es un banco, no mueve dinero, no se conecta a tus cuentas bancarias y no da
        asesoramiento financiero.
      </p>

      <h2>Tu cuenta</h2>
      <p>
        Necesitás una dirección de correo válida y una contraseña propia. Sos responsable de mantener la contraseña en
        privado. Si creés que alguien accedió a tu cuenta, cambiá la contraseña: eso cierra todas las sesiones abiertas.
      </p>

      <h2>Tus datos</h2>
      <p>
        Los datos financieros que cargás son tuyos. Cada cuenta ve exclusivamente su propia información.
      </p>

      <h2>Baja de la cuenta</h2>
      <p>
        Desde la configuración podés <strong>solicitar</strong> la baja. Eso registra tu pedido; no borra tu información
        de forma inmediata ni automática. Procesamos las bajas a mano: bloqueamos el acceso y después anonimizamos la
        identidad asociada a la cuenta. Mientras el pedido no se haya ejecutado podés cancelarlo.
      </p>

      <h2>Disponibilidad</h2>
      <p>
        Doleth está en desarrollo activo. Puede haber interrupciones, cambios de funcionalidad y períodos de
        mantenimiento. No garantizamos disponibilidad ininterrumpida.
      </p>

      <h2>Costo</h2>
      <p>
        Hoy el uso no tiene costo y no hay ningún cobro configurado. Si en el futuro existieran planes pagos, se
        comunicarían con anticipación y no se aplicarían de forma retroactiva.
      </p>

      <h2>Contacto y responsable</h2>
      <p>
        Para cualquier consulta sobre estos términos, escribinos desde la dirección con la que creaste tu cuenta.
      </p>

      <h2 id="pendiente">Lo que todavía falta definir</h2>
      <p>
        Somos explícitos con esto en lugar de completarlo con texto genérico. Estos puntos requieren una decisión
        humana y una revisión profesional que todavía no ocurrió:
      </p>
      <ul>
        <li>Razón social o persona responsable del servicio.</li>
        <li>Domicilio y dirección de contacto formal.</li>
        <li>Jurisdicción y ley aplicable.</li>
        <li>Plazos de conservación de la información.</li>
        <li>Condiciones de un eventual plan pago.</li>
      </ul>
      <p>
        Hasta que se definan, este documento describe cómo funciona Doleth hoy, no constituye asesoramiento legal y no
        afirma cumplimiento normativo de ninguna jurisdicción.
      </p>

      <p className={styles.legal}>
        <Link className={styles.link} href="/privacidad">
          Ver la política de privacidad
        </Link>
      </p>
    </LegalPage>
  );
}
