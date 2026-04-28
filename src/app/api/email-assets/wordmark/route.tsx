import { ImageResponse } from "next/og";

export const runtime = "edge";

/**
 * GET /api/email-assets/wordmark
 *
 * Genera un PNG con el wordmark `|BRICIA|` en la fuente Aboreto.
 *
 * Por qué existe: muchos clientes de correo (Gmail Android/iOS, Outlook
 * desktop, Outlook 365 web) ignoran las web fonts sin importar el <link>
 * o el @import que pongamos en el <head>. La única forma 100% confiable de
 * mostrar el logo en Aboreto en cualquier cliente es renderizarlo como
 * imagen. Lo cacheamos un mes en CDN porque el contenido nunca cambia.
 */

let cachedFont: ArrayBuffer | null = null;

async function loadAboretoTTF(): Promise<ArrayBuffer> {
  if (cachedFont) return cachedFont;
  // Pedir la CSS de Google Fonts con un User-Agent antiguo nos devuelve
  // URLs de TTF (no WOFF2) que es lo que ImageResponse soporta.
  const cssRes = await fetch(
    "https://fonts.googleapis.com/css?family=Aboreto:400&display=swap",
    { headers: { "User-Agent": "Mozilla/4.0 (compatible; MSIE 6.0)" } }
  );
  const css = await cssRes.text();
  const match = css.match(/url\((https:\/\/[^)]+\.ttf)\)/);
  if (!match) {
    throw new Error("No se pudo localizar la TTF de Aboreto en Google Fonts");
  }
  const buffer = await fetch(match[1]).then((r) => r.arrayBuffer());
  cachedFont = buffer;
  return buffer;
}

export async function GET() {
  try {
    const font = await loadAboretoTTF();

    return new ImageResponse(
      (
        <div
          style={{
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#FAF9F4",
            fontFamily: "Aboreto",
            fontSize: 110,
            letterSpacing: 28,
            color: "#1D1D1B",
            paddingLeft: 28, // compensa el letter-spacing visual
          }}
        >
          |BRICIA|
        </div>
      ),
      {
        width: 900,
        height: 200,
        fonts: [
          {
            name: "Aboreto",
            data: font,
            weight: 400,
            style: "normal",
          },
        ],
        headers: {
          "Cache-Control":
            "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=2592000, immutable",
        },
      }
    );
  } catch (err) {
    console.error("[wordmark og]", err);
    return new Response("Error generando wordmark", { status: 500 });
  }
}
