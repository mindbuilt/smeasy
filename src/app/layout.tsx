import type { Metadata, Viewport } from "next";
import { SITE_URL, HOLDING_PAGE } from "@/lib/site";
import localFont from "next/font/local";
import "./globals.css";

// Figtree (SIL Open Font License), the one face for the whole site, marketing and app.
// Latin subset, five weights, self-hosted: no Google Fonts requests.
const figtree = localFont({
  src: [
    { path: "../fonts/figtree-latin-400.woff2", weight: "400", style: "normal" },
    { path: "../fonts/figtree-latin-500.woff2", weight: "500", style: "normal" },
    { path: "../fonts/figtree-latin-600.woff2", weight: "600", style: "normal" },
    { path: "../fonts/figtree-latin-700.woff2", weight: "700", style: "normal" },
    { path: "../fonts/figtree-latin-800.woff2", weight: "800", style: "normal" },
  ],
  display: "swap",
  variable: "--font-app",
});

export const viewport: Viewport = {
  themeColor: "#ffffff",
  viewportFit: "cover",
};

export const metadata: Metadata = {
  robots: HOLDING_PAGE ? { index: false, follow: false } : undefined,
  metadataBase: new URL(SITE_URL),
  title: {
    default: "SMEasy — simple rostering for Australian small businesses",
    template: "%s | SMEasy",
  },
  description:
    "Build your weekly staff roster in minutes, share it with one link or a PDF, handle time-off requests and send hours to payroll. Free for small teams.",
  openGraph: {
    siteName: "SMEasy",
    locale: "en_AU",
    type: "website",
  },
  twitter: { card: "summary" },
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "SMEasy", statusBarStyle: "default" },
  icons: { icon: "/icons/icon-192.png", apple: "/icons/apple-touch-icon.png" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={figtree.variable}>
      <body>{children}</body>
    </html>
  );
}
