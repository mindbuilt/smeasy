import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import localFont from "next/font/local";
import "./globals.css";

// IBM Plex Sans (SIL Open Font License, src/fonts/OFL-LICENSE.txt), bundled
// with the site: no Google Fonts requests at build time or in the browser.
const plex = localFont({
  src: [
    { path: "../fonts/ibm-plex-sans-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../fonts/ibm-plex-sans-latin-500-normal.woff2", weight: "500", style: "normal" },
    { path: "../fonts/ibm-plex-sans-latin-600-normal.woff2", weight: "600", style: "normal" },
    { path: "../fonts/ibm-plex-sans-latin-700-normal.woff2", weight: "700", style: "normal" },
  ],
  display: "swap",
  variable: "--font-plex",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Smeasy — simple rostering for Australian small businesses",
    template: "%s | Smeasy",
  },
  description:
    "Build your weekly staff roster in minutes, share it with one link or a PDF, handle time-off requests and download hours for payroll. Free during early access.",
  openGraph: {
    siteName: "Smeasy",
    locale: "en_AU",
    type: "website",
  },
  twitter: { card: "summary" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-AU" className={plex.variable}>
      <body>{children}</body>
    </html>
  );
}
