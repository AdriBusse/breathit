import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Script from "next/script";
import { headers } from "next/headers";
import { I18nProvider } from "@/components/i18n/I18nProvider";
import LanguageSwitcher from "@/components/i18n/LanguageSwitcher";
import { pickLocale, type Locale } from "@/lib/i18n";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Breathit — Guided Breathing for Calm & Focus",
    template: "%s | Breathit",
  },
  description:
    "Breathit is a friendly, mobile‑first breathing coach. Start a guided 4‑4‑4 session, customize your pace, and build a healthy habit — no sign‑up needed.",
  applicationName: "Breathit",
  openGraph: {
    type: "website",
    title: "Breathit — Guided Breathing for Calm & Focus",
    description:
      "A simple, soothing breathing app for healthier habits. Customize inhale, hold, and exhale durations and follow along with a clean, animated guide.",
    url: "/",
    siteName: "Breathit",
  },
  twitter: {
    card: "summary",
    title: "Breathit — Guided Breathing for Calm & Focus",
    description:
      "A friendly, mobile‑first breathing coach. Guided sessions with customizable phases. No accounts, just breathe.",
  },
  keywords: [
    "breathing app",
    "breath coach",
    "box breathing",
    "relaxation",
    "mindfulness",
    "health",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const h = headers();
  const accept = h.get("accept-language");
  // Try common provider headers for geolocation; fallback to Accept-Language
  const country =
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    h.get("x-country") ||
    h.get("x-country-code") ||
    null;
  const initialLocale: Locale = pickLocale(accept, country);
  return (
    <html lang={initialLocale}>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <I18nProvider initialLocale={initialLocale}>
          <LanguageSwitcher />
          {children}
        </I18nProvider>
        <Script
          defer
          data-domain="breathit-adrianbusse.xyz"
          src="https://plausible.adrianbusse.xyz/js/script.pageview-props.tagged-events.js"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
