import { createClient } from "npm:@supabase/supabase-js@2";

/**
 * CAN-SPAM compliance helpers shared by every outbound email in the project.
 *
 * Every email must carry: clear sender identification, the organization's
 * physical mailing address, and a one-click unsubscribe link that is honored
 * immediately.
 */

export const SENDER = "Startup Factory Hub <info@startupfactoryhub.com>";
export const ORG_NAME = "Startup Factory Hub";
export const SITE_URL = "https://startupfactoryhub.com";
export const MAILING_ADDRESS =
  "6900 Tavistock Lakes Boulevard Southeast, Suite 400, Lake Nona Center, Orlando, FL 32827, USA";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

function serviceClient() {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
}

const encoder = new TextEncoder();

function toHex(buffer: ArrayBuffer) {
  return [...new Uint8Array(buffer)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** HMAC-SHA256 of the lowercased email, so unsubscribe links cannot be forged. */
export async function unsubscribeToken(email: string): Promise<string> {
  const secret = Deno.env.get("EMAIL_UNSUBSCRIBE_SECRET");
  if (!secret) throw new Error("EMAIL_UNSUBSCRIBE_SECRET is not configured");
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(email.trim().toLowerCase()));
  return toHex(sig);
}

export async function verifyUnsubscribeToken(email: string, token: string): Promise<boolean> {
  const expected = await unsubscribeToken(email);
  if (expected.length !== token.length) return false;
  let diff = 0;
  for (let i = 0; i < expected.length; i++) diff |= expected.charCodeAt(i) ^ token.charCodeAt(i);
  return diff === 0;
}

export async function unsubscribeUrl(email: string, source?: string): Promise<string> {
  const token = await unsubscribeToken(email);
  const params = new URLSearchParams({ e: email.trim().toLowerCase(), t: token });
  if (source) params.set("s", source);
  return `${SUPABASE_URL}/functions/v1/email-unsubscribe?${params.toString()}`;
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Standard footer appended to every email. `light` renders dark text for
 * light-background templates.
 */
export async function complianceFooter(email: string, source?: string, light = false): Promise<string> {
  let link = `${SITE_URL}`;
  try {
    link = await unsubscribeUrl(email, source);
  } catch (err) {
    console.error("compliance footer: could not build unsubscribe link:", err);
  }

  const muted = light ? "#6b7280" : "#6f877e";
  const accent = light ? "#0f766e" : "#34d399";
  const border = light ? "rgba(15,118,110,0.15)" : "rgba(16,185,129,0.12)";

  return `
  <div style="padding:22px 26px 30px;text-align:center;border-top:1px solid ${border};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <div style="font-size:12px;color:${muted};line-height:1.8;">
      This email was sent by <strong style="color:${accent};">${ORG_NAME}</strong>
      &middot; <a href="${SITE_URL}" style="color:${accent};text-decoration:none;">startupfactoryhub.com</a><br>
      ${esc(MAILING_ADDRESS)}<br>
      <a href="${esc(link)}" style="color:${accent};text-decoration:underline;">Unsubscribe</a>
      &nbsp;&middot;&nbsp; Unsubscribe requests are processed immediately.<br>
      &copy; ${new Date().getFullYear()} ${ORG_NAME}. All rights reserved.
    </div>
  </div>`;
}

/** RFC 8058 headers so Gmail / Apple Mail show their native unsubscribe button. */
export async function unsubscribeHeaders(email: string, source?: string): Promise<Record<string, string>> {
  try {
    const link = await unsubscribeUrl(email, source);
    return {
      "List-Unsubscribe": `<${link}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  } catch {
    return {};
  }
}

/** Remove any address that has opted out. Never call this for auth emails. */
export async function filterUnsubscribed(emails: string[]): Promise<string[]> {
  const clean = [...new Set(emails.filter(Boolean).map((e) => e.trim().toLowerCase()))];
  if (clean.length === 0) return [];
  const { data, error } = await serviceClient()
    .from("email_unsubscribes")
    .select("email")
    .in("email", clean);
  if (error) {
    console.error("filterUnsubscribed failed, sending to full list:", error.message);
    return clean;
  }
  const blocked = new Set((data ?? []).map((r: any) => r.email));
  return clean.filter((e) => !blocked.has(e));
}

export async function isUnsubscribed(email: string): Promise<boolean> {
  const remaining = await filterUnsubscribed([email]);
  return remaining.length === 0;
}

/**
 * Convenience wrapper: sends through Resend with the compliance footer,
 * unsubscribe headers, and opt-out suppression already applied.
 */
export async function sendCompliantEmail(opts: {
  to: string;
  subject: string;
  html: string;
  source: string;
  light?: boolean;
  from?: string;
  skipSuppression?: boolean;
}): Promise<{ skipped?: true } | void> {
  const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
  if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

  const to = opts.to.trim().toLowerCase();
  if (!opts.skipSuppression && (await isUnsubscribed(to))) return { skipped: true };

  const footer = await complianceFooter(to, opts.source, opts.light);
  const headers = await unsubscribeHeaders(to, opts.source);

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: opts.from ?? SENDER,
      to: [to],
      subject: opts.subject,
      html: injectFooter(opts.html, footer),
      headers,
    }),
  });

  if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 300)}`);
}

/** Puts the footer just before </body> when possible, otherwise appends it. */
export function injectFooter(html: string, footer: string): string {
  const idx = html.toLowerCase().lastIndexOf("</body>");
  if (idx === -1) return html + footer;
  return html.slice(0, idx) + footer + html.slice(idx);
}
