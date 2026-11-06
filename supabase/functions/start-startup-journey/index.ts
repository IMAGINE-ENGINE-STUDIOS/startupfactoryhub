import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "npm:@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOGO_URL =
  "https://zqiihhmdsdgwdcwmryym.supabase.co/storage/v1/object/public/company-logos/StartupfactoryHubLogo.png";
const PROFILE_URL = "https://startupfactoryhub.com/profile-setup";

/** The modern SFH email shell (same design system as send-equity-contract). */
const modernShell = (opts: {
  title: string;
  preheader: string;
  kicker: string;
  heading: string;
  intro: string;
  body: string;
}) => `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#04140f;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${opts.preheader}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#04140f;padding:24px 12px;">
<tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#05201a;border:1px solid rgba(34,211,238,0.18);border-radius:22px;overflow:hidden;">

  <tr><td style="height:3px;background:linear-gradient(90deg,#14b8a6 0%,#22d3ee 50%,#818cf8 100%);line-height:3px;font-size:0;">&nbsp;</td></tr>

  <tr><td align="center" style="background:#062a21;padding:26px 32px 0;">
    <img src="${LOGO_URL}" alt="Startup Factory Hub" width="150" style="display:block;width:150px;max-width:60%;height:auto;border:0;outline:none;" />
  </td></tr>

  <tr><td style="background:#062a21;padding:34px 32px 30px;">
    <div style="font-family:'SFMono-Regular',Consolas,monospace;font-size:10px;font-weight:700;letter-spacing:2.4px;color:#22d3ee;text-transform:uppercase;">${opts.kicker}</div>
    <div style="margin:14px 0 0;color:#f8fafc;font-size:25px;font-weight:800;line-height:1.25;">${opts.heading}</div>
    <p style="margin:12px 0 0;color:#94a3b8;font-size:13.5px;line-height:1.7;">${opts.intro}</p>
  </td></tr>

  ${opts.body}

  <tr><td style="background:#031a14;padding:24px 32px;text-align:center;border-top:1px solid rgba(255,255,255,0.06);">
    <p style="margin:0 0 6px;color:#64748b;font-size:12px;">Imagine Engine Studios Corp d/b/a Startup Factory Hub &middot; 6900 Tavistock Lakes Blvd, Suite 400, Orlando, FL 32827</p>
    <p style="margin:0;color:#475569;font-size:11px;">Questions? Reply to this email or write to <a href="mailto:info@startupfactoryhub.com" style="color:#22d3ee;text-decoration:none;">info@startupfactoryhub.com</a></p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

const paragraph = (html: string) =>
  `<tr><td style="padding:24px 32px 0;"><p style="margin:0;color:#94a3b8;font-size:14px;line-height:1.7;">${html}</p></td></tr>`;

const listCard = (label: string, items: string[]) => `
  <tr><td style="padding:20px 32px 0;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#083026;border:1px solid rgba(34,211,238,0.16);border-radius:16px;">
      <tr><td style="padding:16px 20px;">
        <div style="font-family:'SFMono-Regular',Consolas,monospace;color:#64748b;font-size:9px;letter-spacing:1.6px;">${label}</div>
        ${items
          .map(
            (i) =>
              `<div style="color:#cbd5e1;font-size:13.5px;line-height:1.6;margin-top:7px;">▸ ${i}</div>`
          )
          .join("")}
      </td></tr>
    </table>
  </td></tr>`;

const ctaBlock = (label: string, url: string) => `
  <tr><td style="padding:26px 32px 6px;text-align:center;">
    <a href="${url}" style="display:inline-block;background:#0f766e;background-image:linear-gradient(135deg,#14b8a6,#22d3ee 55%,#818cf8);color:#05201a;font-size:15px;font-weight:800;text-decoration:none;padding:15px 38px;border-radius:999px;letter-spacing:0.4px;">${label}</a>
    <p style="margin:14px 0 0;color:#64748b;font-size:12px;">Or copy this link: <a href="${url}" style="color:#22d3ee;text-decoration:none;word-break:break-all;">${url}</a></p>
  </td></tr>`;

const foundersBlock = (partnersUrl: string) => `
  <tr><td style="padding:22px 32px 30px;">
    <div style="font-family:'SFMono-Regular',Consolas,monospace;color:#14b8a6;font-size:10px;font-weight:700;letter-spacing:1.8px;margin-bottom:8px;">STARTUP FACTORY HUB FOUNDERS</div>
    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.7;">
      Khalia Padilla — Managing Partner &amp; Founder<br/>
      Ricardo Font — Managing Partner &amp; Founder
    </p>
    <p style="margin:12px 0 0;font-size:13px;">
      <a href="${partnersUrl}" style="color:#22d3ee;text-decoration:none;">Learn more about us →</a>
    </p>
  </td></tr>`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface ContractValues {
  companyName?: string;
  companyNoticeEmail?: string;
  phase1Financing?: string;
}

const extractValues = (html: string | null): ContractValues | null => {
  if (!html) return null;
  const m = html.match(/SFH_CONTRACT_VALUES:([^>]*)-->/);
  if (!m) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1])) as ContractValues;
  } catch {
    return null;
  }
};

/** One-time journey steps after the Welcome, as day offsets from signing.
 *  Founder's journey (2026-11-06) + the accelerator-standard additions
 *  (deck readiness, mentor match, demo day, monthly investor update).
 *  Recurring steps (weekly opportunities, weekly grants, daily Top 10)
 *  are seeded by engagement-tick itself. */
const SCHEDULE: Array<{ step: string; days: number }> = [
  { step: "profile", days: 1 },
  { step: "perks", days: 2 },
  { step: "nvidia", days: 3 },
  { step: "partners_meet", days: 4 },
  { step: "resource_report", days: 5 },
  { step: "deck_readiness", days: 6 },
  { step: "mentor_match", days: 8 },
  { step: "demo_day", days: 21 },
  { step: "investor_update", days: 30 },
];

const welcomeHtml = (name: string, company: string, goal: string) =>
  modernShell({
    title: "Welcome to Startup Factory Hub",
    preheader:
      "Your accelerator journey starts now — here is what your program includes and your first steps.",
    kicker: "Accelerator Program &middot; Welcome",
    heading: "Welcome to Startup Factory Hub",
    intro: `Congratulations — ${company} is officially in the program. This is what happens next.`,
    body:
      paragraph(
        `Hello ${name || "there"},<br/><br/>` +
          `Welcome aboard. Startup Factory Hub is an AI-powered venture builder and accelerator: we work with your team hands-on — technology development, test customers, customer discovery, mentors, market competition, validation, commercialization and go-to-market — until you reach your Phase 1 fundraising goal${goal ? ` of <strong style="color:#e5e7eb">${goal}</strong>` : ""}. ` +
          `From today, the platform, the community and our partner network are working for you.`
      ) +
      listCard("WHAT YOUR PROGRAM INCLUDES", [
        "A venture-building team beside you: product, validation and go-to-market support",
        "Mentors and direct access to our managing partners",
        "Partner perks, discounts and credits from our network of 50+ partners",
        "Events, workshops, pitch opportunities and demo days",
        "Investor readiness and warm introductions as your milestones land",
        "AI-matched grants, funding opportunities and resources, delivered to your inbox",
      ]) +
      listCard("YOUR FIRST STEPS", [
        "<strong style='color:#e5e7eb'>1.</strong> Complete your startup profile — industry, stage, team, traction and funding needs — so our matching can work for you",
        "<strong style='color:#e5e7eb'>2.</strong> Unlock your startup perks and claim your partner benefits",
        "<strong style='color:#e5e7eb'>3.</strong> Book your strategy session with our managing partners",
      ]) +
      paragraph(
        "Over the coming days we will walk you through each step by email — one thing at a time, like a real accelerator. Start with your profile:"
      ) +
      ctaBlock("Complete your startup profile", PROFILE_URL) +
      foundersBlock("https://startupfactoryhub.com/forpartners"),
  });

/**
 * Founder order (2026-11-06): every startup that signs the Accelerator
 * Program Participation Agreement is enrolled in the engagement journey.
 * Invoked fire-and-forget by the signing page after a signature lands.
 * Idempotent: the queue's unique (email, step, period) index means a
 * re-invoke never re-sends the Welcome or duplicates a step.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token }: { token?: string } = await req.json().catch(() => ({}));
    if (!token) return json({ error: "Missing token" }, 400);

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: doc } = await supabase
      .from("sign_documents")
      .select("id, title, recipient_email, recipient_name, content_html, source_type")
      .eq("share_token", token)
      .maybeSingle();

    if (!doc) return json({ error: "Invalid document token" }, 404);
    if (doc.source_type !== "equity_contract") return json({ skipped: "not a contract" });

    const { count } = await supabase
      .from("sign_signatures")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id);
    if (!count || count < 1) return json({ skipped: "not signed yet" });

    const values = extractValues(doc.content_html);
    const company = values?.companyName?.trim() || doc.recipient_name || "your company";
    const recipients = Array.from(
      new Set(
        [doc.recipient_email, values?.companyNoticeEmail]
          .map((e) => (e || "").trim().toLowerCase())
          .filter((e) => e.includes("@"))
      )
    );
    if (recipients.length === 0) return json({ skipped: "no recipient email" });

    const goalNum = Number(String(values?.phase1Financing || "").replace(/[^0-9.]/g, ""));
    const goal =
      goalNum > 0 ? `$${Math.round(goalNum).toLocaleString("en-US")}` : "";

    const enrolled: string[] = [];
    for (const email of recipients) {
      // Welcome row first: only a fresh insert triggers the Welcome email.
      const { data: welcomeRow, error: welcomeErr } = await supabase
        .from("startup_engagement_queue")
        .insert({
          document_id: doc.id,
          email,
          company_name: company,
          step: "welcome",
          period: "once",
          due_at: new Date().toISOString(),
          status: "pending",
        })
        .select("id")
        .maybeSingle();

      if (!welcomeErr && welcomeRow) {
        const { error: mailError } = await resend.emails.send({
          from: "Startup Factory Hub <info@startupfactoryhub.com>",
          to: [email],
          subject: "Welcome to Startup Factory Hub — your accelerator journey starts now",
          html: welcomeHtml(doc.recipient_name || "", company, goal),
        });
        await supabase
          .from("startup_engagement_queue")
          .update({
            status: mailError ? "failed" : "sent",
            sent_at: mailError ? null : new Date().toISOString(),
          })
          .eq("id", welcomeRow.id);
        if (!mailError) enrolled.push(email);
      }

      // The rest of the one-time sequence — conflicts are ignored by design
      // (a 23505 simply means this recipient is already enrolled).
      for (const { step, days } of SCHEDULE) {
        await supabase.from("startup_engagement_queue").insert({
          document_id: doc.id,
          email,
          company_name: company,
          step,
          period: "once",
          due_at: new Date(Date.now() + days * 86400000).toISOString(),
          status: "pending",
        });
      }
    }

    return json({ success: true, enrolled, recipients });
  } catch (e) {
    console.error("start-startup-journey", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
