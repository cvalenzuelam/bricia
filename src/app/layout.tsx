import type { Metadata } from "next";
import { Playfair_Display, Inter, Aboreto } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ClientShell from "@/components/ClientShell";
import {
  loadSiteMetadata,
  resolveSiteOrigin,
  toAbsoluteAssetUrl,
} from "@/data/site-metadata-loader";

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

export async function generateMetadata(): Promise<Metadata> {
  const siteUrl = resolveSiteOrigin();
  const meta = await loadSiteMetadata();
  const ogImageUrl = toAbsoluteAssetUrl(meta.ogImageSrc, siteUrl);

  const openGraphImages = ogImageUrl
    ? [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: meta.ogImageAlt,
        },
      ]
    : undefined;

  return {
    metadataBase: new URL(siteUrl),
    title: meta.title,
    description: meta.description,
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: siteUrl,
      siteName: "Bricia",
      locale: "es_MX",
      type: "website",
      ...(openGraphImages ? { images: openGraphImages } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
      ...(ogImageUrl ? { images: [ogImageUrl] } : {}),
    },
  };
}

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
