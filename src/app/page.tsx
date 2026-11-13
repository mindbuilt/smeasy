import { redirect } from "next/navigation";

// Smeasy is rostering only. The old tax set-aside calculator is parked in
// src/app/_tax-calculator (underscore folders are not routed by Next.js).
// The login page forwards already-signed-in managers to /dashboard.
export default function Home() {
  redirect("/auth/login");
}
