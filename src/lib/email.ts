import { Resend } from "resend";
import type { Order } from "@/data/orders";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// Mientras no haya un dominio propio verificado en Resend, hay que enviar desde
// `onboarding@resend.dev` (es la única dirección que Resend permite por default).
// Lo que sí podemos personalizar libremente es el nombre que aparece como
// remitente: `CASABRICIA <onboarding@resend.dev>` se ve como "CASABRICIA" en
// el inbox de la mayoría de clientes (Gmail, iCloud, Outlook, etc.).
const DEFAULT_EMAIL_FROM = "CASABRICIA <onboarding@resend.dev>";

/**
 * Acepta cualquier variante razonable y la normaliza a un valor válido para
 * Resend. Resend solo admite dos formas:
 *   1) `correo@dominio.com`
 *   2) `Nombre <correo@dominio.com>`
 * Si el usuario pegó comillas (rectas o tipográficas), espacios extra, o se
 * olvidó de los signos `<` `>`, intentamos arreglarlo. Si no se puede,
 * regresamos null para que el caller use el default y lo reporte.
 */
function sanitizeFromAddress(raw: string | undefined): {
  value: string;
  warning?: string;
} {
  if (!raw) return { value: DEFAULT_EMAIL_FROM };

  let v = raw.trim();
  // Normaliza comillas tipográficas a comillas rectas y luego elimina envolturas.
  v = v.replace(/[\u201C\u201D\u201E\u00AB\u00BB]/g, '"').replace(/[\u2018\u2019]/g, "'");
  // Quita comillas envolventes (rectas)
  v = v.replace(/^["']+/, "").replace(/["']+$/, "").trim();

  const emailRe = /^[^\s<>@]+@[^\s<>@]+\.[^\s<>@]+$/;

  // Caso 1: solo el email
  if (emailRe.test(v)) return { value: v };

  // Caso 2: ya viene con `Nombre <email>`
  const namedMatch = v.match(/^(.+?)\s*<\s*([^\s<>]+@[^\s<>]+)\s*>\s*$/);
  if (namedMatch && emailRe.test(namedMatch[2])) {
    const name = namedMatch[1].replace(/^["']+|["']+$/g, "").trim();
    return { value: name ? `${name} <${namedMatch[2]}>` : namedMatch[2] };
  }

  // Caso 3: viene `Nombre email@dominio` sin <>
  const looseMatch = v.match(/^(.+?)\s+([^\s<>]+@[^\s<>]+)\s*$/);
  if (looseMatch && emailRe.test(looseMatch[2])) {
    return { value: `${looseMatch[1].trim()} <${looseMatch[2]}>` };
  }

  return {
    value: DEFAULT_EMAIL_FROM,
    warning: `EMAIL_FROM con formato inválido (${raw}). Usando el default ${DEFAULT_EMAIL_FROM}. Debe ser \"correo@dominio.com\" o \"Nombre <correo@dominio.com>\".`,
  };
}

const { value: EMAIL_FROM, warning: EMAIL_FROM_WARNING } = sanitizeFromAddress(
  process.env.EMAIL_FROM
);
if (EMAIL_FROM_WARNING) {
  console.warn("[email]", EMAIL_FROM_WARNING);
}

const EMAIL_BCC = process.env.EMAIL_BCC; // optional admin copy
const PUBLIC_BASE_URL =
  process.env.NEXT_PUBLIC_BASE_URL ||
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://casabricia.vercel.app");
const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || "casabricia@gmail.com";

const COLORS = {
  bg: "#FAF9F4",
  card: "#FFFFFF",
  ink: "#1D1D1B",
  muted: "#7A7A78",
  accent: "#B08D57",
  border: "#E8E2D6",
} as const;

// Stacks de fuentes para el correo. Para el cuerpo y los titulos serif usamos
// web fonts (Aboreto + Playfair Display) con fallback a Georgia: en Apple Mail,
// Gmail web, iCloud, Yahoo se ven idénticas a las del sitio; en Gmail mobile
// y Outlook desktop caen a Georgia. Para el wordmark del header sí garantizamos
// Aboreto en todos los clientes renderizándolo como imagen (ver buildWordmark()).
const FONT_LOGO = `'Aboreto', Georgia, 'Times New Roman', serif`;
const FONT_TITLE = `'Playfair Display', Georgia, 'Times New Roman', serif`;
const FONT_BODY = `Helvetica, Arial, sans-serif`;
const FONT_GOOGLE_HREF =
  "https://fonts.googleapis.com/css2?family=Aboreto&family=Playfair+Display:ital,wght@0,400;0,500;1,400&display=swap";

/**
 * El wordmark `|BRICIA|` se renderiza como texto con el font-stack del logo
 * (Aboreto con fallback a Georgia). En clientes que soportan web fonts se ve
 * en Aboreto; en los que no, se ve en Georgia, que mantiene una estética
 * editorial muy similar y nunca se rompe.
 */
function buildWordmarkHTML(): string {
  return `
    <a href="${PUBLIC_BASE_URL}" target="_blank" style="text-decoration:none; color: ${COLORS.ink};">
      <span style="font-family: ${FONT_LOGO}; font-size: 30px; letter-spacing: 0.32em; color: ${COLORS.ink}; font-weight: 400; line-height: 1;">
        |BRICIA|
      </span>
    </a>
  `;
}

function formatMXN(amount: number): string {
  return `$${amount.toLocaleString("es-MX")} MXN`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function firstName(fullName: string): string {
  const trimmed = fullName.trim();
  if (!trimmed) return "";
  return trimmed.split(/\s+/)[0];
}

function buildOrderConfirmationHTML(order: Order): string {
  const itemsRows = order.items
    .map((item) => {
      const name = escapeHtml(item.name);
      const subtitle = item.subtitle ? escapeHtml(item.subtitle) : "";
      return `
        <tr>
          <td style="padding: 18px 0; border-bottom: 1px solid ${COLORS.border};" valign="top">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td valign="top">
                  <div style="font-family: ${FONT_TITLE}; font-size: 17px; color: ${COLORS.ink}; text-transform: lowercase; line-height: 1.3;">
                    ${name}
                  </div>
                  ${
                    subtitle
                      ? `<div style="font-family: ${FONT_BODY}; font-size: 12px; color: ${COLORS.muted}; margin-top: 4px; line-height: 1.5;">${subtitle}</div>`
                      : ""
                  }
                  <div style="font-family: ${FONT_BODY}; font-size: 11px; color: ${COLORS.muted}; margin-top: 8px; letter-spacing: 0.08em; text-transform: uppercase;">
                    Cantidad · ${item.quantity}
                  </div>
                </td>
                <td valign="top" align="right" style="font-family: ${FONT_TITLE}; font-size: 16px; color: ${COLORS.ink}; white-space: nowrap; padding-left: 16px;">
                  ${formatMXN(item.price * item.quantity)}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      `;
    })
    .join("");

  const shippingLine =
    order.shippingCost === 0
      ? `<span style="font-family: ${FONT_TITLE}; font-style: italic; color: ${COLORS.accent};">Cortesía</span>`
      : formatMXN(order.shippingCost);

  const shippingMethodBlock = order.shippingMethod
    ? `
      <tr>
        <td style="padding: 4px 0 12px; font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: ${COLORS.muted};">
          ${escapeHtml(order.shippingMethod.name)} · ${escapeHtml(order.shippingMethod.eta)}
        </td>
      </tr>
    `
    : "";

  const notesBlock = order.shipping.notes
    ? `<p style="font-family: ${FONT_TITLE}; font-style: italic; font-size: 13px; color: ${COLORS.muted}; margin: 12px 0 0; padding: 12px 14px; background: ${COLORS.bg}; border-radius: 8px; border-left: 2px solid ${COLORS.accent};">"${escapeHtml(order.shipping.notes)}"</p>`
    : "";

  const orderUrl = `${PUBLIC_BASE_URL}/pago/exito?orderId=${encodeURIComponent(order.id)}`;
  const shopUrl = `${PUBLIC_BASE_URL}/productos`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu pedido en Bricia · ${escapeHtml(order.id)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${FONT_GOOGLE_HREF}" rel="stylesheet">
  <style type="text/css">
    @import url("${FONT_GOOGLE_HREF}");
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.bg}; font-family: ${FONT_BODY}; color: ${COLORS.ink};">
  <!-- Pre-header (oculto, mejora la previsualización en clientes) -->
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    Pedido ${escapeHtml(order.id)} confirmado · ${formatMXN(order.total)} · Lo preparamos con cariño.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.bg}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: ${COLORS.bg};">

          <!-- Brand mark -->
          <tr>
            <td align="center" style="padding: 8px 0 40px 0;">
              ${buildWordmarkHTML()}
              <div style="height: 1px; width: 40px; background: ${COLORS.accent}; margin: 14px auto 0; opacity: 0.6;"></div>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td align="center" style="padding: 0 32px 36px;">
              <p style="font-family: ${FONT_BODY}; font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase; color: ${COLORS.accent}; margin: 0 0 16px; font-weight: 700;">
                Pedido confirmado
              </p>
              <h1 style="font-family: ${FONT_TITLE}; font-size: 34px; line-height: 1.15; color: ${COLORS.ink}; margin: 0 0 18px; font-weight: 400;">
                Gracias, ${escapeHtml(firstName(order.customer.name))}.
              </h1>
              <p style="font-family: ${FONT_TITLE}; font-style: italic; font-size: 16px; line-height: 1.65; color: ${COLORS.muted}; margin: 0 auto; max-width: 440px;">
                Recibimos tu pedido y ya lo estamos preparando con cariño.
                La preparación toma de 1 a 3 días hábiles, y te avisaremos
                en cuanto salga rumbo a tu casa.
              </p>
            </td>
          </tr>

          <!-- Order ref -->
          <tr>
            <td align="center" style="padding: 0 32px 36px;">
              <div style="display: inline-block; background: ${COLORS.card}; border: 1px solid ${COLORS.border}; border-radius: 12px; padding: 16px 28px;">
                <div style="font-family: ${FONT_BODY}; font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: ${COLORS.muted}; margin-bottom: 6px;">
                  Folio del pedido
                </div>
                <div style="font-family: ${FONT_BODY}; font-size: 18px; letter-spacing: 0.18em; color: ${COLORS.ink}; font-weight: 600;">
                  ${escapeHtml(order.id)}
                </div>
              </div>
            </td>
          </tr>

          <!-- Items card -->
          <tr>
            <td style="padding: 0 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.card}; border:1px solid ${COLORS.border}; border-radius:16px;">
                <tr>
                  <td style="padding: 24px 28px 8px;">
                    <h2 style="font-family: ${FONT_TITLE}; font-size: 18px; color: ${COLORS.ink}; margin: 0 0 4px; font-weight: 400;">
                      Tu selección
                    </h2>
                    <div style="height:1px; background:${COLORS.border}; margin: 14px 0 0;"></div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 28px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      ${itemsRows}
                    </table>
                  </td>
                </tr>

                <!-- Totals -->
                <tr>
                  <td style="padding: 16px 28px 0;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding: 6px 0; font-family: ${FONT_BODY}; font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.18em;">Subtotal</td>
                        <td style="padding: 6px 0; text-align: right; font-family: ${FONT_TITLE}; font-size: 14px; color: ${COLORS.ink};">${formatMXN(order.subtotal)}</td>
                      </tr>
                      <tr>
                        <td style="padding: 6px 0; font-family: ${FONT_BODY}; font-size: 11px; color: ${COLORS.muted}; text-transform: uppercase; letter-spacing: 0.18em;">Envío</td>
                        <td style="padding: 6px 0; text-align: right; font-family: ${FONT_TITLE}; font-size: 14px; color: ${COLORS.ink};">${shippingLine}</td>
                      </tr>
                      ${shippingMethodBlock}
                      <tr>
                        <td style="padding: 14px 0 22px; border-top: 1px solid ${COLORS.border}; font-family: ${FONT_BODY}; font-size: 11px; color: ${COLORS.ink}; text-transform: uppercase; letter-spacing: 0.22em; font-weight: 700;">Total</td>
                        <td style="padding: 14px 0 22px; border-top: 1px solid ${COLORS.border}; text-align: right; font-family: ${FONT_TITLE}; font-size: 22px; color: ${COLORS.ink};">${formatMXN(order.total)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping address card -->
          <tr>
            <td style="padding: 24px 12px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.card}; border:1px solid ${COLORS.border}; border-radius:16px;">
                <tr>
                  <td style="padding: 24px 28px;">
                    <h2 style="font-family: ${FONT_TITLE}; font-size: 18px; color: ${COLORS.ink}; margin: 0 0 14px; font-weight: 400; border-bottom: 1px solid ${COLORS.border}; padding-bottom: 12px;">
                      Dirección de envío
                    </h2>
                    <p style="font-family: ${FONT_BODY}; font-size: 14px; line-height: 1.7; color: ${COLORS.ink}; margin: 0;">
                      <strong style="font-weight: 600;">${escapeHtml(order.customer.name)}</strong><br>
                      ${escapeHtml(order.shipping.street)} ${escapeHtml(order.shipping.exterior)}${order.shipping.interior ? ` Int. ${escapeHtml(order.shipping.interior)}` : ""}<br>
                      Col. ${escapeHtml(order.shipping.neighborhood)}<br>
                      ${escapeHtml(order.shipping.city)}, ${escapeHtml(order.shipping.state)}, C.P. ${escapeHtml(order.shipping.zip)}<br>
                      ${escapeHtml(order.shipping.country)}<br>
                      <span style="color: ${COLORS.muted}; font-size: 13px;">Tel. ${escapeHtml(order.customer.phone)}</span>
                    </p>
                    ${notesBlock}
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- CTA -->
          <tr>
            <td align="center" style="padding: 36px 32px 8px;">
              <a href="${orderUrl}"
                 style="display:inline-block; padding:14px 28px; font-family: ${FONT_BODY}; font-size:11px; letter-spacing:0.28em; text-transform:uppercase; font-weight:700; color:${COLORS.bg}; background:${COLORS.ink}; text-decoration:none; border-radius:10px;">
                Ver mi pedido
              </a>
              <div style="margin-top:16px;">
                <a href="${shopUrl}" style="font-family: ${FONT_BODY}; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:${COLORS.muted}; text-decoration:none;">
                  Seguir explorando
                </a>
              </div>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td align="center" style="padding: 40px 32px 8px;">
              <div style="height: 1px; width: 40px; background: ${COLORS.accent}; margin: 0 auto 22px; opacity: 0.45;"></div>
              <p style="font-family: ${FONT_TITLE}; font-style: italic; font-size: 15px; line-height: 1.7; color: ${COLORS.muted}; margin: 0 0 18px;">
                Cocinar y compartir es un gesto de amor.<br>
                Gracias por dejarnos ser parte de tu mesa.
              </p>
              <p style="font-family: ${FONT_TITLE}; font-size: 14px; color: ${COLORS.ink}; margin: 0;">
                — Bricia Elizalde
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 32px; border-top: 1px solid ${COLORS.border}; margin-top: 24px;">
              <p style="font-family: ${FONT_BODY}; font-size: 11px; color: ${COLORS.muted}; margin: 0 0 8px;">
                Pedido realizado el ${formatDate(order.createdAt)}
              </p>
              <p style="font-family: ${FONT_BODY}; font-size: 11px; color: ${COLORS.muted}; margin: 0;">
                ¿Alguna pregunta? Escríbenos a
                <a href="mailto:${SUPPORT_EMAIL}" style="color: ${COLORS.accent}; text-decoration: none;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildOrderConfirmationText(order: Order): string {
  const lines: string[] = [];
  lines.push(`Bricia · Pedido confirmado`);
  lines.push(`Folio: ${order.id}`);
  lines.push("");
  lines.push(`Hola ${firstName(order.customer.name)}, recibimos tu pedido.`);
  lines.push("");
  lines.push("Tu selección:");
  for (const item of order.items) {
    lines.push(`- ${item.name} x${item.quantity} — ${formatMXN(item.price * item.quantity)}`);
  }
  lines.push("");
  lines.push(`Subtotal: ${formatMXN(order.subtotal)}`);
  lines.push(
    `Envío: ${order.shippingCost === 0 ? "Cortesía" : formatMXN(order.shippingCost)}`
  );
  lines.push(`Total: ${formatMXN(order.total)}`);
  lines.push("");
  lines.push("Enviaremos a:");
  lines.push(order.customer.name);
  const interior = order.shipping.interior ? ` Int. ${order.shipping.interior}` : "";
  lines.push(`${order.shipping.street} ${order.shipping.exterior}${interior}`);
  lines.push(`Col. ${order.shipping.neighborhood}`);
  lines.push(
    `${order.shipping.city}, ${order.shipping.state}, C.P. ${order.shipping.zip}`
  );
  lines.push(order.shipping.country);
  lines.push("");
  lines.push(`Sigue tu pedido: ${PUBLIC_BASE_URL}/pago/exito?orderId=${encodeURIComponent(order.id)}`);
  lines.push("");
  lines.push("Gracias por dejarnos ser parte de tu mesa. — Bricia Elizalde");
  return lines.join("\n");
}

export interface SendEmailResult {
  ok: boolean;
  error?: string;
}

function summarizeError(err: unknown): string {
  if (!err) return "Error desconocido";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  if (typeof err === "object") {
    const e = err as { message?: unknown; name?: unknown; statusCode?: unknown };
    const parts = [
      typeof e.statusCode === "number" || typeof e.statusCode === "string"
        ? `HTTP ${e.statusCode}`
        : null,
      typeof e.name === "string" ? e.name : null,
      typeof e.message === "string" ? e.message : null,
    ].filter(Boolean);
    return parts.join(" · ") || JSON.stringify(err).slice(0, 240);
  }
  return String(err);
}

export async function sendOrderConfirmationEmail(
  order: Order
): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    const error = "RESEND_API_KEY no está configurado en el servidor.";
    console.warn("[email]", error);
    return { ok: false, error };
  }

  if (!order.customer?.email) {
    const error = "La orden no tiene email de cliente.";
    console.warn("[email]", error);
    return { ok: false, error };
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const html = buildOrderConfirmationHTML(order);
    const text = buildOrderConfirmationText(order);

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: order.customer.email,
      ...(EMAIL_BCC ? { bcc: EMAIL_BCC } : {}),
      subject: `Tu pedido en Bricia · ${order.id}`,
      html,
      text,
      replyTo: SUPPORT_EMAIL,
      headers: {
        "X-Entity-Ref-ID": order.id,
      },
      tags: [
        { name: "type", value: "order-confirmation" },
        { name: "order_id", value: order.id },
      ],
    });

    const apiError = (result as { error?: unknown }).error;
    if (apiError) {
      const error = summarizeError(apiError);
      console.error("[email] Resend error:", apiError);
      return { ok: false, error };
    }

    return { ok: true };
  } catch (err) {
    const error = summarizeError(err);
    console.error("[email] excepción al enviar:", err);
    return { ok: false, error };
  }
}

// ─── Correo de envío ────────────────────────────────────────────────────────

function buildShippingEmailHTML(order: Order): string {
  const trackingNumber = escapeHtml(order.trackingNumber ?? "");
  const trackingUrl = order.trackingUrl ?? "";
  const carrier = order.shippingMethod?.name
    ? escapeHtml(order.shippingMethod.name)
    : "";
  const eta = order.shippingMethod?.eta ? escapeHtml(order.shippingMethod.eta) : "";
  const orderUrl = `${PUBLIC_BASE_URL}/pago/exito?orderId=${encodeURIComponent(order.id)}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu pedido va en camino · ${escapeHtml(order.id)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${FONT_GOOGLE_HREF}" rel="stylesheet">
  <style type="text/css">
    @import url("${FONT_GOOGLE_HREF}");
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: ${COLORS.bg}; font-family: ${FONT_BODY}; color: ${COLORS.ink};">
  <div style="display:none; max-height:0; overflow:hidden; opacity:0; mso-hide:all;">
    Tu pedido ${escapeHtml(order.id)} ya va en camino${carrier ? ` con ${carrier}` : ""}.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: ${COLORS.bg}; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: ${COLORS.bg};">

          <!-- Brand mark -->
          <tr>
            <td align="center" style="padding: 8px 0 40px 0;">
              ${buildWordmarkHTML()}
              <div style="height: 1px; width: 40px; background: ${COLORS.accent}; margin: 14px auto 0; opacity: 0.6;"></div>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td align="center" style="padding: 0 32px 36px;">
              <p style="font-family: ${FONT_BODY}; font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase; color: ${COLORS.accent}; margin: 0 0 16px; font-weight: 700;">
                Tu pedido va en camino
              </p>
              <h1 style="font-family: ${FONT_TITLE}; font-size: 34px; line-height: 1.15; color: ${COLORS.ink}; margin: 0 0 18px; font-weight: 400;">
                ${escapeHtml(firstName(order.customer.name))}, ya salió rumbo a tu casa.
              </h1>
              <p style="font-family: ${FONT_TITLE}; font-style: italic; font-size: 16px; line-height: 1.65; color: ${COLORS.muted}; margin: 0 auto; max-width: 460px;">
                Tu pedido salió de nuestro taller${carrier ? ` con <strong style="font-style:normal; color:${COLORS.ink};">${carrier}</strong>` : ""}.
                Te dejamos los datos de rastreo para que puedas seguirlo.
              </p>
            </td>
          </tr>

          <!-- Tracking card -->
          <tr>
            <td style="padding: 0 12px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.card}; border:1px solid ${COLORS.border}; border-radius:16px;">
                <tr>
                  <td align="center" style="padding: 32px 28px 16px;">
                    <p style="font-family: ${FONT_BODY}; font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: ${COLORS.muted}; margin: 0 0 10px;">
                      Número de guía
                    </p>
                    <p style="font-family: ${FONT_BODY}; font-size: 22px; letter-spacing: 0.16em; color: ${COLORS.ink}; font-weight: 600; margin: 0; word-break: break-all;">
                      ${trackingNumber || "—"}
                    </p>
                    ${
                      carrier
                        ? `<p style="font-family: ${FONT_TITLE}; font-style: italic; font-size: 14px; color: ${COLORS.muted}; margin: 12px 0 0;">
                            ${carrier}${eta ? ` · ${eta}` : ""}
                          </p>`
                        : ""
                    }
                  </td>
                </tr>
                ${
                  trackingUrl
                    ? `<tr>
                        <td align="center" style="padding: 8px 28px 32px;">
                          <a href="${trackingUrl}"
                             style="display:inline-block; padding:14px 32px; font-family: ${FONT_BODY}; font-size:11px; letter-spacing:0.28em; text-transform:uppercase; font-weight:700; color:${COLORS.bg}; background:${COLORS.ink}; text-decoration:none; border-radius:10px;">
                            Rastrear mi envío
                          </a>
                        </td>
                      </tr>`
                    : ""
                }
              </table>
            </td>
          </tr>

          <!-- Order ref -->
          <tr>
            <td align="center" style="padding: 28px 32px 0;">
              <p style="font-family: ${FONT_BODY}; font-size: 11px; color: ${COLORS.muted}; margin: 0 0 6px; letter-spacing: 0.2em; text-transform: uppercase;">
                Folio del pedido
              </p>
              <p style="font-family: ${FONT_BODY}; font-size: 14px; color: ${COLORS.ink}; letter-spacing: 0.18em; margin: 0; font-weight: 600;">
                ${escapeHtml(order.id)}
              </p>
            </td>
          </tr>

          <!-- Shipping address (recordatorio) -->
          <tr>
            <td style="padding: 28px 12px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COLORS.card}; border:1px solid ${COLORS.border}; border-radius:16px;">
                <tr>
                  <td style="padding: 24px 28px;">
                    <h2 style="font-family: ${FONT_TITLE}; font-size: 18px; color: ${COLORS.ink}; margin: 0 0 14px; font-weight: 400; border-bottom: 1px solid ${COLORS.border}; padding-bottom: 12px;">
                      Enviamos a
                    </h2>
                    <p style="font-family: ${FONT_BODY}; font-size: 14px; line-height: 1.7; color: ${COLORS.ink}; margin: 0;">
                      <strong style="font-weight: 600;">${escapeHtml(order.customer.name)}</strong><br>
                      ${escapeHtml(order.shipping.street)} ${escapeHtml(order.shipping.exterior)}${order.shipping.interior ? ` Int. ${escapeHtml(order.shipping.interior)}` : ""}<br>
                      Col. ${escapeHtml(order.shipping.neighborhood)}<br>
                      ${escapeHtml(order.shipping.city)}, ${escapeHtml(order.shipping.state)}, C.P. ${escapeHtml(order.shipping.zip)}<br>
                      ${escapeHtml(order.shipping.country)}
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Secondary CTA -->
          <tr>
            <td align="center" style="padding: 28px 32px 8px;">
              <a href="${orderUrl}" style="font-family: ${FONT_BODY}; font-size:11px; letter-spacing:0.22em; text-transform:uppercase; color:${COLORS.muted}; text-decoration:none;">
                Ver detalle del pedido
              </a>
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td align="center" style="padding: 36px 32px 8px;">
              <div style="height: 1px; width: 40px; background: ${COLORS.accent}; margin: 0 auto 22px; opacity: 0.45;"></div>
              <p style="font-family: ${FONT_TITLE}; font-style: italic; font-size: 15px; line-height: 1.7; color: ${COLORS.muted}; margin: 0 0 18px;">
                Cocinar y compartir es un gesto de amor.<br>
                Disfrútalo cuando llegue.
              </p>
              <p style="font-family: ${FONT_TITLE}; font-size: 14px; color: ${COLORS.ink}; margin: 0;">
                — Bricia Elizalde
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 32px; border-top: 1px solid ${COLORS.border}; margin-top: 24px;">
              <p style="font-family: ${FONT_BODY}; font-size: 11px; color: ${COLORS.muted}; margin: 0 0 8px;">
                Pedido enviado el ${formatDate(order.shippedAt ?? new Date().toISOString())}
              </p>
              <p style="font-family: ${FONT_BODY}; font-size: 11px; color: ${COLORS.muted}; margin: 0;">
                ¿Alguna pregunta? Escríbenos a
                <a href="mailto:${SUPPORT_EMAIL}" style="color: ${COLORS.accent}; text-decoration: none;">${SUPPORT_EMAIL}</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function buildShippingEmailText(order: Order): string {
  const lines: string[] = [];
  lines.push(`Bricia · Tu pedido va en camino`);
  lines.push(`Folio: ${order.id}`);
  lines.push("");
  lines.push(
    `Hola ${firstName(order.customer.name)}, tu pedido salió de nuestro taller${
      order.shippingMethod?.name ? ` con ${order.shippingMethod.name}` : ""
    }.`
  );
  lines.push("");
  if (order.trackingNumber) lines.push(`Número de guía: ${order.trackingNumber}`);
  if (order.trackingUrl) lines.push(`Rastrea tu envío: ${order.trackingUrl}`);
  if (order.shippingMethod?.eta) lines.push(`Tiempo estimado: ${order.shippingMethod.eta}`);
  lines.push("");
  lines.push("Enviamos a:");
  lines.push(order.customer.name);
  const interior = order.shipping.interior ? ` Int. ${order.shipping.interior}` : "";
  lines.push(`${order.shipping.street} ${order.shipping.exterior}${interior}`);
  lines.push(`Col. ${order.shipping.neighborhood}`);
  lines.push(
    `${order.shipping.city}, ${order.shipping.state}, C.P. ${order.shipping.zip}`
  );
  lines.push(order.shipping.country);
  lines.push("");
  lines.push("Disfrútalo cuando llegue. — Bricia Elizalde");
  return lines.join("\n");
}

export async function sendShippingNotificationEmail(
  order: Order
): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    const error = "RESEND_API_KEY no está configurado en el servidor.";
    console.warn("[email]", error);
    return { ok: false, error };
  }

  if (!order.customer?.email) {
    const error = "La orden no tiene email de cliente.";
    console.warn("[email]", error);
    return { ok: false, error };
  }

  if (!order.trackingNumber) {
    const error = "La orden no tiene número de guía.";
    console.warn("[email]", error);
    return { ok: false, error };
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const html = buildShippingEmailHTML(order);
    const text = buildShippingEmailText(order);

    const result = await resend.emails.send({
      from: EMAIL_FROM,
      to: order.customer.email,
      ...(EMAIL_BCC ? { bcc: EMAIL_BCC } : {}),
      subject: `Tu pedido va en camino · ${order.id}`,
      html,
      text,
      replyTo: SUPPORT_EMAIL,
      headers: {
        "X-Entity-Ref-ID": order.id,
      },
      tags: [
        { name: "type", value: "order-shipping" },
        { name: "order_id", value: order.id },
      ],
    });

    const apiError = (result as { error?: unknown }).error;
    if (apiError) {
      const error = summarizeError(apiError);
      console.error("[email] Resend error (shipping):", apiError);
      return { ok: false, error };
    }

    return { ok: true };
  } catch (err) {
    const error = summarizeError(err);
    console.error("[email] excepción al enviar (shipping):", err);
    return { ok: false, error };
  }
}
