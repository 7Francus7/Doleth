import "server-only";
import { appUrl, isProduction } from "./config";

/**
 * Envío de correo.
 *
 * Dos transportes:
 *   - `resend`: proveedor real por HTTP, configurado con RESEND_API_KEY.
 *   - `console`: sólo desarrollo. Imprime el contenido para poder abrir el enlace.
 *
 * Regla no negociable: si el proveedor falla, `sendEmail` lanza. Nunca decimos
 * "te mandamos un correo" cuando el envío no ocurrió.
 */

export class EmailDeliveryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
  text: string;
}

type Transport = "resend" | "console";

function resolveTransport(): Transport {
  const configured = process.env.DOLETH_EMAIL_TRANSPORT?.trim().toLowerCase();
  if (configured === "resend" || configured === "console") return configured;
  return process.env.RESEND_API_KEY ? "resend" : "console";
}

async function sendWithResend(message: EmailMessage): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DOLETH_EMAIL_FROM;
  if (!apiKey) throw new EmailDeliveryError("RESEND_API_KEY no está configurada.");
  if (!from) throw new EmailDeliveryError("DOLETH_EMAIL_FROM no está configurada.");

  let response: Response;
  try {
    response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [message.to], subject: message.subject, html: message.html, text: message.text }),
    });
  } catch (error) {
    throw new EmailDeliveryError(
      `No pudimos contactar al proveedor de correo: ${error instanceof Error ? error.name : "error de red"}.`,
    );
  }

  if (!response.ok) {
    // El cuerpo puede traer el destinatario; guardamos sólo el código.
    throw new EmailDeliveryError(`El proveedor de correo respondió ${response.status}.`);
  }
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  const transport = resolveTransport();

  if (transport === "console") {
    if (isProduction()) {
      throw new EmailDeliveryError(
        "El transporte de correo `console` no puede usarse en producción. Configurá RESEND_API_KEY.",
      );
    }
    console.info(`\n─── correo de Doleth (desarrollo) ───\npara: ${message.to}\nasunto: ${message.subject}\n\n${message.text}\n────────────────────────────────────\n`);
    return;
  }

  await sendWithResend(message);
}

// ---------------------------------------------------------------------------
// Plantillas
// ---------------------------------------------------------------------------

const BRAND_BACKGROUND = "#F7F5F1";
const BRAND_INK = "#1B1A17";
const BRAND_ACCENT = "#184E47";

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };
    return entities[character] ?? character;
  });
}

function layout(options: { heading: string; body: string; ctaLabel: string; ctaHref: string; footer: string }): string {
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" /><title>Doleth</title></head>
<body style="margin:0;padding:24px;background:${BRAND_BACKGROUND};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:${BRAND_INK};">
  <table role="presentation" cellpadding="0" cellspacing="0" style="max-width:520px;margin:0 auto;width:100%;">
    <tr><td style="padding:8px 0 24px;font-size:18px;letter-spacing:0.08em;text-transform:uppercase;color:${BRAND_ACCENT};">Doleth</td></tr>
    <tr><td style="background:#FFFFFF;border-radius:16px;padding:32px;">
      <h1 style="margin:0 0 16px;font-size:22px;line-height:1.3;font-weight:600;">${options.heading}</h1>
      <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#4A4740;">${options.body}</p>
      <a href="${options.ctaHref}" style="display:inline-block;background:${BRAND_ACCENT};color:#FFFFFF;text-decoration:none;padding:14px 24px;border-radius:999px;font-size:15px;font-weight:600;">${options.ctaLabel}</a>
      <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6B675E;">Si el botón no funciona, copiá y pegá este enlace:<br /><span style="word-break:break-all;color:${BRAND_ACCENT};">${options.ctaHref}</span></p>
    </td></tr>
    <tr><td style="padding:20px 4px 0;font-size:12px;line-height:1.6;color:#6B675E;">${options.footer}</td></tr>
  </table>
</body></html>`;
}

export function verificationEmail(to: string, token: string, expiresInHours: number): EmailMessage {
  const href = `${appUrl()}/verificar-email?token=${encodeURIComponent(token)}`;
  return {
    to,
    subject: "Confirmá tu correo para entrar a Doleth",
    html: layout({
      heading: "Confirmá tu correo",
      body: `Con esto activamos tu cuenta y podés empezar a usar Doleth. El enlace vence en ${expiresInHours} horas.`,
      ctaLabel: "Confirmar correo",
      ctaHref: href,
      footer: "Si no creaste una cuenta en Doleth, ignorá este mensaje: nadie accede sin confirmar este enlace.",
    }),
    text: `Confirmá tu correo para activar tu cuenta de Doleth.\n\n${href}\n\nEl enlace vence en ${expiresInHours} horas. Si no creaste la cuenta, ignorá este mensaje.`,
  };
}

export function passwordResetEmail(to: string, token: string, expiresInMinutes: number): EmailMessage {
  const href = `${appUrl()}/restablecer-contrasena?token=${encodeURIComponent(token)}`;
  return {
    to,
    subject: "Restablecer tu contraseña de Doleth",
    html: layout({
      heading: "Elegí una contraseña nueva",
      body: `Pediste restablecer tu contraseña. El enlace vence en ${expiresInMinutes} minutos y se puede usar una sola vez.`,
      ctaLabel: "Elegir contraseña nueva",
      ctaHref: href,
      footer: "Si no pediste este cambio, no hace falta que hagas nada: tu contraseña actual sigue vigente.",
    }),
    text: `Pediste restablecer tu contraseña de Doleth.\n\n${href}\n\nEl enlace vence en ${expiresInMinutes} minutos y se usa una sola vez. Si no lo pediste, ignorá este mensaje.`,
  };
}

export function emailChangeEmail(to: string, token: string, expiresInMinutes: number): EmailMessage {
  const href = `${appUrl()}/configuracion/cuenta/confirmar-email?token=${encodeURIComponent(token)}`;
  return {
    to,
    subject: "Confirmá tu nuevo correo de Doleth",
    html: layout({
      heading: "Confirmá tu nuevo correo",
      body: `Pediste usar esta dirección para entrar a Doleth. Hasta que confirmes, tu correo anterior sigue siendo el válido. El enlace vence en ${expiresInMinutes} minutos.`,
      ctaLabel: "Confirmar dirección",
      ctaHref: href,
      footer: "Si no pediste este cambio, ignorá este mensaje.",
    }),
    text: `Confirmá tu nuevo correo de Doleth.\n\n${href}\n\nEl enlace vence en ${expiresInMinutes} minutos.`,
  };
}

export function emailChangeNoticeEmail(to: string, newEmail: string): EmailMessage {
  const href = `${appUrl()}/configuracion/cuenta`;
  const safeNewEmail = escapeHtml(newEmail);
  return {
    to,
    subject: "Se pidió cambiar el correo de tu cuenta de Doleth",
    html: layout({
      heading: "Se pidió cambiar tu correo",
      body: `Alguien con acceso a tu cuenta pidió mover el inicio de sesión a <strong>${safeNewEmail}</strong>. Si fuiste vos, no hace falta hacer nada más.`,
      ctaLabel: "Revisar mi cuenta",
      ctaHref: href,
      footer: "Si no reconocés este pedido, cambiá tu contraseña ahora mismo: eso cierra todas las sesiones abiertas.",
    }),
    text: `Se pidió cambiar el correo de tu cuenta de Doleth a ${newEmail}.\n\nSi no fuiste vos, cambiá tu contraseña ahora: ${href}`,
  };
}

export function passwordChangedEmail(to: string): EmailMessage {
  const href = `${appUrl()}/olvide-mi-contrasena`;
  return {
    to,
    subject: "Tu contraseña de Doleth cambió",
    html: layout({
      heading: "Tu contraseña cambió",
      body: "Se actualizó la contraseña de tu cuenta y se cerraron todas las sesiones abiertas.",
      ctaLabel: "No fui yo",
      ctaHref: href,
      footer: "Si no reconocés este cambio, restablecé tu contraseña desde el enlace de arriba.",
    }),
    text: `Tu contraseña de Doleth cambió y se cerraron todas las sesiones abiertas.\n\nSi no fuiste vos: ${href}`,
  };
}
