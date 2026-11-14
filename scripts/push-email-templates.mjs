// Loads SMEasy's branded auth emails into the live Supabase project.
// Changes ONLY: the 5 email subjects + bodies below, and the SMTP sender name.
// Nothing else in Supabase Auth is touched.
//
// Run: node scripts/push-email-templates.mjs
// Uses SUPABASE_ACCESS_TOKEN if set, otherwise the token saved by `npx supabase login`
// (macOS keychain). The token is never printed.
import { readFileSync } from "node:fs";
import { execFileSync } from "node:child_process";

const PROJECT = "jrbjkrukmcqxrthhpdwx";
const dir = new URL("../supabase/templates/", import.meta.url);
const html = (f) => readFileSync(new URL(`${f}.html`, dir), "utf8");

function token() {
  if (process.env.SUPABASE_ACCESS_TOKEN) return process.env.SUPABASE_ACCESS_TOKEN;
  let t = execFileSync("security", ["find-generic-password", "-s", "Supabase CLI", "-a", "supabase", "-w"], { encoding: "utf8" }).trim();
  if (t.startsWith("go-keyring-base64:")) t = Buffer.from(t.slice(18), "base64").toString("utf8");
  if (!t.startsWith("sbp_")) throw new Error("Couldn't read the Supabase CLI token. Run `npx supabase login` first, or set SUPABASE_ACCESS_TOKEN.");
  return t;
}

const body = {
  smtp_sender_name: "SMEasy",
  mailer_subjects_magic_link: "Your SMEasy login link",
  mailer_templates_magic_link_content: html("magic-link"),
  mailer_subjects_confirmation: "Welcome to SMEasy: confirm your email",
  mailer_templates_confirmation_content: html("confirm-signup"),
  mailer_subjects_recovery: "Reset your SMEasy password",
  mailer_templates_recovery_content: html("reset-password"),
  mailer_subjects_email_change: "Confirm your new SMEasy email address",
  mailer_templates_email_change_content: html("change-email"),
  mailer_subjects_reauthentication: "Your SMEasy verification code",
  mailer_templates_reauthentication_content: html("reauthentication"),
};

const res = await fetch(`https://api.supabase.com/v1/projects/${PROJECT}/config/auth`, {
  method: "PATCH",
  headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
  body: JSON.stringify(body),
});
if (!res.ok) {
  console.error(`Failed: ${res.status} ${await res.text()}`);
  process.exit(1);
}
const d = await res.json();
console.log("Updated. Supabase now has:");
for (const k of Object.keys(body)) {
  const v = d[k] ?? "";
  console.log(`  ${k}: ${k.includes("templates") ? (v.includes("SMEasy") ? "branded template ✓" : "NOT updated ✗") : v}`);
}
console.log(`  smtp_host: ${d.smtp_host ?? "(not set)"}  sender: ${d.smtp_admin_email ?? "(not set)"}`);
