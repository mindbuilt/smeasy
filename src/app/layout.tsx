import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "smeasy",
  description:
    "A private tax set-aside estimator for Australian sole traders. Upload your bank export or spreadsheet and get a rough estimate — no login, no stored data.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
