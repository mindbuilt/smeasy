import type { Metadata } from "next";
import { SITE_URL } from "@/lib/site";
import { IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

// Downloaded at build time and served from our own domain — visitors'
// browsers never contact Google Fonts.
const plex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
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
