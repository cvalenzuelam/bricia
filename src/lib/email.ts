import { Resend } from "resend";
import type { Order } from "@/data/orders";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const EMAIL_FROM = process.env.EMAIL_FROM || "Bricia López <onboarding@resend.dev>";
const EMAIL_BCC = process.env.EMAIL_BCC; // optional admin copy

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

function buildOrderConfirmationHTML(order: Order): string {
  const itemsRows = order.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 16px 0; border-bottom: 1px solid #E8E2D6;">
            <div style="font-family: Georgia, serif; font-size: 16px; color: #1D1D1B; text-transform: lowercase; line-height: 1.3;">
              ${item.name}
            </div>
            ${
              item.subtitle
                ? `<div style="font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #7A7A78; margin-top: 4px;">${item.subtitle}</div>`
                : ""
            }
          </td>
          <td style="padding: 16px 0; border-bottom: 1px solid #E8E2D6; text-align: center; font-family: Helvetica, Arial, sans-serif; font-size: 13px; color: #7A7A78;">
            ${item.quantity}
          </td>
          <td style="padding: 16px 0; border-bottom: 1px solid #E8E2D6; text-align: right; font-family: Georgia, serif; font-size: 14px; color: #1D1D1B;">
            ${formatMXN(item.price * item.quantity)}
          </td>
        </tr>
      `
    )
    .join("");

  const shippingLine = order.shippingCost === 0
    ? `<span style="font-family: Georgia, serif; font-style: italic; color: #B08D57;">Cortesía</span>`
    : formatMXN(order.shippingCost);

  return `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tu pedido en Bricia · ${order.id}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #FAF9F4; font-family: Helvetica, Arial, sans-serif; color: #1D1D1B;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #FAF9F4; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; background-color: #FAF9F4;">

          <!-- Brand mark -->
          <tr>
            <td align="center" style="padding: 8px 0 48px 0;">
              <div style="font-family: Georgia, serif; font-size: 32px; letter-spacing: 0.3em; color: #1D1D1B; font-weight: 400;">
                BRICIA
              </div>
              <div style="height: 1px; width: 40px; background: #B08D57; margin: 16px auto 0; opacity: 0.5;"></div>
            </td>
          </tr>

          <!-- Hero -->
          <tr>
            <td align="center" style="padding: 0 32px 40px;">
              <p style="font-family: Helvetica, Arial, sans-serif; font-size: 10px; letter-spacing: 0.3em; text-transform: uppercase; color: #B08D57; margin: 0 0 16px;">
                Pedido confirmado
              </p>
              <h1 style="font-family: Georgia, serif; font-size: 36px; line-height: 1.15; color: #1D1D1B; margin: 0 0 20px; font-weight: 400;">
                Gracias, ${order.customer.name.split(" ")[0]}.
              </h1>
              <p style="font-family: Georgia, serif; font-style: italic; font-size: 16px; line-height: 1.6; color: #7A7A78; margin: 0; max-width: 440px;">
                Recibimos tu pedido y ya lo estamos preparando con cariño.
                Te avisaremos en cuanto salga rumbo a tu casa.
              </p>
            </td>
          </tr>

          <!-- Order ref -->
          <tr>
            <td align="center" style="padding: 0 32px 40px;">
              <div style="display: inline-block; background: #FFFFFF; border: 1px solid #E8E2D6; border-radius: 12px; padding: 18px 28px;">
                <div style="font-family: Helvetica, Arial, sans-serif; font-size: 9px; letter-spacing: 0.3em; text-transform: uppercase; color: #7A7A78; margin-bottom: 6px;">
                  Folio del pedido
                </div>
                <div style="font-family: Helvetica, Arial, sans-serif; font-size: 18px; letter-spacing: 0.15em; color: #1D1D1B; font-weight: 600;">
                  ${order.id}
                </div>
              </div>
            </td>
          </tr>

          <!-- Items -->
          <tr>
            <td style="padding: 0 32px;">
              <h2 style="font-family: Georgia, serif; font-size: 18px; color: #1D1D1B; margin: 0 0 16px; font-weight: 400; border-bottom: 1px solid #E8E2D6; padding-bottom: 12px;">
                Tu selección
              </h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${itemsRows}
              </table>
            </td>
          </tr>

          <!-- Totals -->
          <tr>
            <td style="padding: 24px 32px 0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="padding: 6px 0; font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #7A7A78; text-transform: uppercase; letter-spacing: 0.15em;">Subtotal</td>
                  <td style="padding: 6px 0; text-align: right; font-family: Georgia, serif; font-size: 14px; color: #1D1D1B;">${formatMXN(order.subtotal)}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; font-family: Helvetica, Arial, sans-serif; font-size: 12px; color: #7A7A78; text-transform: uppercase; letter-spacing: 0.15em;">Envío</td>
                  <td style="padding: 6px 0; text-align: right; font-family: Georgia, serif; font-size: 14px; color: #1D1D1B;">${shippingLine}</td>
                </tr>
                <tr>
                  <td style="padding: 14px 0 0; border-top: 1px solid #E8E2D6; font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: #1D1D1B; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 700;">Total</td>
                  <td style="padding: 14px 0 0; border-top: 1px solid #E8E2D6; text-align: right; font-family: Georgia, serif; font-size: 22px; color: #1D1D1B;">${formatMXN(order.total)}</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Shipping -->
          <tr>
            <td style="padding: 48px 32px 0;">
              <h2 style="font-family: Georgia, serif; font-size: 18px; color: #1D1D1B; margin: 0 0 16px; font-weight: 400; border-bottom: 1px solid #E8E2D6; padding-bottom: 12px;">
                Dirección de envío
              </h2>
              <p style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; line-height: 1.7; color: #1D1D1B; margin: 0;">
                <strong style="font-weight: 600;">${order.customer.name}</strong><br>
                ${order.shipping.street} ${order.shipping.exterior}${order.shipping.interior ? ` Int. ${order.shipping.interior}` : ""}<br>
                Col. ${order.shipping.neighborhood}<br>
                ${order.shipping.city}, ${order.shipping.state}, C.P. ${order.shipping.zip}<br>
                ${order.shipping.country}<br>
                <span style="color: #7A7A78; font-size: 13px;">Tel. ${order.customer.phone}</span>
              </p>
              ${
                order.shipping.notes
                  ? `<p style="font-family: Georgia, serif; font-style: italic; font-size: 13px; color: #7A7A78; margin: 12px 0 0; padding: 12px; background: #FFFFFF; border-radius: 8px;">"${order.shipping.notes}"</p>`
                  : ""
              }
            </td>
          </tr>

          <!-- Closing -->
          <tr>
            <td align="center" style="padding: 56px 32px 32px;">
              <div style="height: 1px; width: 40px; background: #B08D57; margin: 0 auto 24px; opacity: 0.4;"></div>
              <p style="font-family: Georgia, serif; font-style: italic; font-size: 15px; line-height: 1.7; color: #7A7A78; margin: 0 0 24px;">
                Cocinar y compartir es un gesto de amor.
                Gracias por dejarnos ser parte de tu mesa.
              </p>
              <p style="font-family: Georgia, serif; font-size: 14px; color: #1D1D1B; margin: 0;">
                — Bricia
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 32px; border-top: 1px solid #E8E2D6;">
              <p style="font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: #7A7A78; margin: 0 0 8px;">
                Pedido realizado el ${formatDate(order.createdAt)}
              </p>
              <p style="font-family: Helvetica, Arial, sans-serif; font-size: 11px; color: #7A7A78; margin: 0;">
                ¿Alguna pregunta? Escríbenos a <a href="mailto:hola@bricia.com" style="color: #B08D57; text-decoration: none;">hola@bricia.com</a>
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  if (!RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY no configurado — skip email");
    return;
  }

  try {
    const resend = new Resend(RESEND_API_KEY);
    const html = buildOrderConfirmationHTML(order);

    await resend.emails.send({
      from: EMAIL_FROM,
      to: order.customer.email,
      ...(EMAIL_BCC ? { bcc: EMAIL_BCC } : {}),
      subject: `Tu pedido en Bricia · ${order.id}`,
      html,
    });
  } catch (err) {
    console.error("[email] error al enviar:", err);
  }
}
