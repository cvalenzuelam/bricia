import type { Metadata } from "next";
import { Playfair_Display, Inter, Aboreto } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ClientShell from "@/components/ClientShell";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const aboreto = Aboreto({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-aboreto",
});

const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://casabricia.com")
).replace(/\/$/, "");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Bricia | Recetas con Historias",
  description: "Recetario personal de Bricia. Cocina con amor, historias que alimentan.",
  openGraph: {
    title: "Bricia | Recetas con Historias",
    description: "Recetario personal de Bricia. Cocina con amor, historias que alimentan.",
    url: siteUrl,
    siteName: "Bricia",
    locale: "es_MX",
    type: "website",
    images: [
      {
        url: "/images/hero-inicio-bricia.jpg",
        width: 1200,
        height: 630,
        alt: "Bricia | Recetas con Historias",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Bricia | Recetas con Historias",
    description: "Recetario personal de Bricia. Cocina con amor, historias que alimentan.",
    images: ["/images/hero-inicio-bricia.jpg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-scroll-behavior="smooth">
      <body className={`${playfair.variable} ${inter.variable} ${aboreto.variable} antialiased min-h-screen flex flex-col`}>
        <ClientShell>
          <Header />
          <div className="flex-grow">
            {children}
          </div>
          <Footer />
        </ClientShell>
      </body>
    </html>
  );
}


