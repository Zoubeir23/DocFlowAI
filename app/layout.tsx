import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { ThemeProvider } from "@/components/theme-provider";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
});

const ibmMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  variable: "--font-ibm-mono",
});

const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://docflow.ia";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "DocFlow IA — Logiciel Gestion Cabinet Médical avec IA",
    template: "%s · DocFlow IA",
  },
  description:
    "DocFlow IA automatise la prise de rendez-vous médicaux 24h/24 avec l'IA. Agenda médical intelligent, dossiers patients et gestion de cabinet pour médecins. Gratuit dès 0€.",
  keywords: [
    "logiciel cabinet médical",
    "prise de rendez-vous en ligne",
    "gestion clinique IA",
    "agenda médical intelligent",
    "assistant IA médecin",
    "logiciel médical",
    "booking médical automatique",
    "dossier patient numérique",
  ],
  authors: [{ name: "DocFlow IA" }],
  creator: "DocFlow IA",
  publisher: "DocFlow IA",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    alternateLocale: "en_US",
    url: siteUrl,
    siteName: "DocFlow IA",
    title: "DocFlow IA — Logiciel de gestion de clinique avec IA",
    description:
      "Automatisez la prise de rendez-vous et la gestion de votre cabinet médical grâce à l'IA. Disponible 24h/24, 7j/7.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "DocFlow IA — Gestion de clinique intelligente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "DocFlow IA — Logiciel de gestion de clinique avec IA",
    description:
      "Automatisez la prise de rendez-vous et la gestion de votre cabinet médical grâce à l'IA.",
    images: ["/og-image.jpg"],
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  alternates: {
    canonical: siteUrl,
    languages: {
      "fr": `${siteUrl}`,
      "en": `${siteUrl}`,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning className={`${cormorant.variable} ${dmSans.variable} ${ibmMono.variable}`}>
      <body className="font-sans bg-background text-foreground antialiased transition-colors duration-300">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <Providers>
              {children}
              <Toaster position="top-right" richColors />
            </Providers>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
