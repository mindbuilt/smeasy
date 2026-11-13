import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "Smeasy — simple rostering for Australian small businesses",
  description:
    "Build your weekly roster, send it to staff, and export hours to Xero or MYOB.",
  openGraph: {
    title: "Smeasy — Roster Management Made Simple",
    description: "Create weekly rosters in minutes. Staff notified instantly. Export to Xero or MYOB. Free for up to 10 staff.",
    url: "https://smeasy.au",
    siteName: "Smeasy",
    locale: "en_AU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smeasy — Roster Management Made Simple",
    description: "Create weekly rosters in minutes. Staff notified instantly.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Google Tag Manager */}
        <Script async src="https://www.googletagmanager.com/gtag/js?id=GTM-P4V884NF" />
        <Script
          id="gtag-init"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'GTM-P4V884NF');
            `,
          }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
