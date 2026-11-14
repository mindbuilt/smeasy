import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "My shifts",
  manifest: "/staff.webmanifest",
  appleWebApp: { capable: true, title: "My shifts", statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
