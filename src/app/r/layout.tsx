import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Team roster",
  manifest: "/team.webmanifest",
  appleWebApp: { capable: true, title: "Roster", statusBarStyle: "default" },
  robots: { index: false, follow: false },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
