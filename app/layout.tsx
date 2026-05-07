import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/providers";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, getMessages } from "next-intl/server";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DocFlow IA - Assistant IA pour la gestion de cliniques",
  description:
    "AI-powered appointment booking system for doctors and clinics. Let patients book appointments 24/7 with intelligent automation.",
  keywords: [
    "medical booking",
    "appointment scheduling",
    "clinic management",
    "AI booking",
    "doctor appointments",
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>
            {children}
            <Toaster position="top-right" richColors />
          </Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
