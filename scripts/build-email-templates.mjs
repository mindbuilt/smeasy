// Builds SMEasy's branded Supabase Auth emails from one shared layout.
// Run: node scripts/build-email-templates.mjs
// Output: supabase/templates/<name>.html (paste into Supabase → Authentication → Emails → Templates)
//         supabase/templates/preview.html (open in a browser to see them all)
// Email-safe: tables + inline styles, no images (the logo is a coloured cell), no web fonts.
import { writeFileSync, mkdirSync } from "node:fs";

const c = { bg: "#faf8f3", white: "#ffffff", dark: "#211f1a", accent: "#b7e021", border: "#e7e2d6", muted: "#6e6a5e", secondary: "#5b584f" };
const font = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";

function layout({ preheader, heading, body, button, after }) {
  return `<!DOCTYPE html>
<html lang="en-AU">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only">
<title>${heading}</title>
</head>
<body style="margin:0;padding:0;background:${c.bg};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${c.bg};">
<tr><td align="center" style="padding:32px 16px;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;table-layout:fixed;">
    <tr><td style="padding:0 4px 20px;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
        <td width="22" height="22" style="width:22px;height:22px;background:${c.accent};border-radius:4px;font-size:0;line-height:0;">&nbsp;</td>
        <td style="padding-left:8px;font-family:${font};font-size:18px;font-weight:700;color:${c.dark};">SMEasy</td>
      </tr></table>
    </td></tr>
    <tr><td style="background:${c.white};border:1px solid ${c.border};border-radius:6px;padding:32px 28px;font-family:${font};color:${c.dark};">
      <h1 style="margin:0 0 14px;font-size:22px;line-height:1.3;font-weight:700;color:${c.dark};">${heading}</h1>
      ${body.map((p) => `<p style="margin:0 0 14px;font-size:16px;line-height:1.55;color:${c.secondary};">${p}</p>`).join("\n      ")}
      ${button ? `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:10px 0 22px;"><tr>
        <td style="background:${c.dark};border-radius:4px;">
          <a href="${button.href}" style="display:inline-block;padding:14px 26px;font-family:${font};font-size:16px;font-weight:600;color:${c.white};text-decoration:none;border-radius:4px;">${button.label}</a>
        </td></tr></table>
      <p style="margin:0 0 6px;font-size:13px;line-height:1.5;color:${c.muted};">Button not working? Copy this link into your browser:</p>
      <p style="margin:0 0 18px;font-size:13px;line-height:1.5;word-break:break-all;overflow-wrap:anywhere;"><a href="${button.href}" style="color:${c.secondary};">${button.href}</a></p>` : ""}
      ${after.map((p) => `<p style="margin:0 0 8px;font-size:13px;line-height:1.5;color:${c.muted};">${p}</p>`).join("\n      ")}
    </td></tr>
    <tr><td style="padding:18px 4px 0;font-family:${font};font-size:12px;line-height:1.6;color:${c.muted};">
      SMEasy · Simple rostering for Australian small businesses<br>
      Open County Pty Ltd · ABN 19 679 154 557<br>
      <a href="https://www.smeasy.au" style="color:${c.muted};">smeasy.au</a> · <a href="https://www.smeasy.au/contact/" style="color:${c.muted};">Contact us</a> · <a href="https://www.smeasy.au/privacy/" style="color:${c.muted};">Privacy</a>
    </td></tr>
  </table>
</td></tr>
</table>
</body>
</html>
`;
}

const ignore = "Didn't ask for this? You can safely ignore this email. Nothing changes unless someone uses the link.";

const templates = [
  {
    file: "magic-link", supabase: "Magic Link", subject: "Your SMEasy login link",
    preheader: "Tap to log in to SMEasy. The link works once and expires in an hour.",
    heading: "Log in to SMEasy",
    body: ["Tap the button below to log in as {{ .Email }}. The link works once and expires in an hour."],
    button: { href: "{{ .ConfirmationURL }}", label: "Log in to SMEasy" },
    after: ["Open the link on any device: your phone, tablet or computer.", ignore],
  },
  {
    file: "confirm-signup", supabase: "Confirm signup", subject: "Welcome to SMEasy: confirm your email",
    preheader: "One tap to confirm your email and set up your first roster.",
    heading: "Welcome to SMEasy",
    body: [
      "Thanks for signing up. Tap the button below to confirm {{ .Email }} and log in.",
      "You'll answer three quick questions about your business, then you can build your first roster. Most people have one ready in about five minutes.",
    ],
    button: { href: "{{ .ConfirmationURL }}", label: "Confirm and log in" },
    after: ["The link works once and expires in an hour.", "Didn't sign up for SMEasy? You can safely ignore this email. No account is created unless someone uses the link."],
  },
  {
    file: "reset-password", supabase: "Reset Password", subject: "Reset your SMEasy password",
    preheader: "Set a new password for your SMEasy account.",
    heading: "Set a new password",
    body: ["Someone asked to reset the password for {{ .Email }}. Tap the button below to choose a new one."],
    button: { href: "{{ .ConfirmationURL }}", label: "Choose a new password" },
    after: ["The link works once and expires in an hour.", "Didn't ask for this? You can safely ignore this email. Your password stays the same unless someone uses the link."],
  },
  {
    file: "change-email", supabase: "Change Email Address", subject: "Confirm your new SMEasy email address",
    preheader: "Confirm the new email address for your SMEasy account.",
    heading: "Confirm your new email address",
    body: ["Someone asked to change the email address on a SMEasy account from {{ .Email }} to {{ .NewEmail }}. Tap the button below to confirm the change."],
    button: { href: "{{ .ConfirmationURL }}", label: "Confirm new email" },
    after: ["Didn't ask for this? Ignore this email and your login stays the same. If you're worried, reply or contact us at hello@smeasy.au."],
  },
  {
    file: "reauthentication", supabase: "Reauthentication", subject: "Your SMEasy verification code",
    preheader: "Your SMEasy verification code.",
    heading: "Your verification code",
    body: [
      "Enter this code in SMEasy to confirm it's you:",
      `<span style="display:inline-block;font-size:28px;font-weight:700;letter-spacing:6px;color:${c.dark};background:${c.bg};border:1px solid ${c.border};border-radius:4px;padding:10px 16px;">{{ .Token }}</span>`,
    ],
    after: ["The code expires shortly. Never share it with anyone, including anyone claiming to be from SMEasy.", ignore],
  },
];

const dir = new URL("../supabase/templates/", import.meta.url);
mkdirSync(dir, { recursive: true });
const sample = (html) => html
  .replaceAll("{{ .ConfirmationURL }}", "https://www.smeasy.au/auth/callback/#example")
  .replaceAll("{{ .Email }}", "sam@yourcafe.com.au").replaceAll("{{ .NewEmail }}", "manager@yourcafe.com.au")
  .replaceAll("{{ .Token }}", "482913");

let preview = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SMEasy email previews</title></head><body style="margin:0;background:#ddd;font-family:sans-serif">`;
for (const t of templates) {
  const html = layout(t);
  writeFileSync(new URL(`${t.file}.html`, dir), html);
  preview += `<div style="padding:16px 20px 4px"><b>${t.supabase}</b> · Subject: ${t.subject}</div><iframe style="width:100%;height:760px;border:0" srcdoc="${sample(html).replaceAll("&", "&amp;").replaceAll('"', "&quot;")}"></iframe>`;
}
writeFileSync(new URL("preview.html", dir), preview + "</body></html>");
writeFileSync(new URL("README.md", dir), `# SMEasy auth emails

Generated by \`node scripts/build-email-templates.mjs\`. Edit the script, not the HTML.
Open \`preview.html\` in a browser to see them.

Paste each into **Supabase → Authentication → Emails → Templates**:

| Supabase template | File | Subject |
|---|---|---|
${templates.map((t) => `| ${t.supabase} | \`${t.file}.html\` | ${t.subject} |`).join("\n")}

SMEasy uses login links (no passwords), so **Magic Link** and **Confirm signup** are the ones people actually get.
Sender (SMTP settings): \`SMEasy <hello@smeasy.au>\` via Resend.
`);
console.log("wrote", templates.map((t) => t.file).join(", "), "+ preview.html");
