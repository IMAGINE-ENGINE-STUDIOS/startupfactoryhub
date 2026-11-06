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
const BASE = "https://startupfactoryhub.com";

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

const foundersBlock = () => `
  <tr><td style="padding:22px 32px 30px;">
    <div style="font-family:'SFMono-Regular',Consolas,monospace;color:#14b8a6;font-size:10px;font-weight:700;letter-spacing:1.8px;margin-bottom:8px;">STARTUP FACTORY HUB FOUNDERS</div>
    <p style="margin:0;color:#94a3b8;font-size:13px;line-height:1.7;">
      Khalia Padilla — Managing Partner &amp; Founder<br/>
      Ricardo Font — Managing Partner &amp; Founder
    </p>
    <p style="margin:12px 0 0;font-size:13px;">
      <a href="${BASE}/forpartners" style="color:#22d3ee;text-decoration:none;">Learn more about us →</a>
    </p>
  </td></tr>`;

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface QueueRow {
  id: string;
  document_id: string | null;
  email: string;
  company_name: string | null;
  step: string;
  period: string;
}

const firstName = (company: string) => company || "there";

const EMAILS: Record<
  string,
  (row: QueueRow) => { subject: string; html: string }
> = {
  profile: (row) => ({
    subject: "Complete your startup profile — unlock your matching",
    html: modernShell({
      title: "Complete your startup profile",
      preheader:
        "A complete profile is what our matching runs on — grants, investors, mentors and resources picked for you.",
      kicker: "Accelerator Program &middot; Your Profile",
      heading: "Complete your startup profile",
      intro: `Five minutes now saves you hours later, ${firstName(row.company_name || "")} — this is the information our AI matching works from.`,
      body:
        paragraph(
          "Tell us who you are and what you need, and the platform starts working for you: grants and funding matched to your stage, resources for your industry, mentors who have done it before, and your personalized resource report."
        ) +
        listCard("WHAT TO COMPLETE", [
          "Company information — what you do, in one clear description",
          "Industry and stage — so matching is precise, not generic",
          "Team — size and who is building",
          "Traction — where you are today, honestly stated",
          "Funding requirements — how much, and what it unlocks",
        ]) +
        ctaBlock("Complete your profile", `${BASE}/profile-setup`) +
        foundersBlock(),
    }),
  }),

  perks: (row) => ({
    subject: "Unlock your startup perks — your partner benefits are waiting",
    html: modernShell({
      title: "Unlock your startup perks",
      preheader:
        "Credits, discounts and partner benefits included in your program — here is what is available and how to claim it.",
      kicker: "Accelerator Program &middot; Perks",
      heading: "Unlock your startup perks",
      intro:
        "Your program includes benefits from our partner network of 50+ companies. Here are the ones founders claim first.",
      body:
        listCard("MOST-CLAIMED BENEFITS", [
          "<strong style='color:#e5e7eb'>NVIDIA Inception</strong> — GPU credits, technical resources and the Inception community for AI startups",
          "<strong style='color:#e5e7eb'>Carta</strong> — cap table management: free Carta Launch for early raises, 20% off premium plans",
          "<strong style='color:#e5e7eb'>Cloud &amp; hosting</strong> — Hostinger and infrastructure partners for your product stack",
          "<strong style='color:#e5e7eb'>Security</strong> — Sucuri website security and NordVPN / NordPass for your team",
          "<strong style='color:#e5e7eb'>Defense &amp; space</strong> — Defense Innovation Unit and Lockheed Martin SBIR pathways for deep-tech teams",
          "<strong style='color:#e5e7eb'>Press &amp; tools</strong> — 24-7PressRelease distribution and Corel creative software",
        ]) +
        paragraph(
          "The complete, current list — every partner, what they offer and how to claim each benefit — lives on our partners page. Claim what fits; new partners are added as the network grows."
        ) +
        ctaBlock("See all partner benefits", `${BASE}/forpartners`) +
        foundersBlock(),
    }),
  }),

  nvidia: (row) => ({
    subject: "Join NVIDIA Inception — recommended for your program",
    html: modernShell({
      title: "Join NVIDIA Inception",
      preheader:
        "Free to join for eligible startups: GPU credits, technical training and go-to-market support from NVIDIA.",
      kicker: "Accelerator Program &middot; Partner Spotlight",
      heading: "Join NVIDIA Inception",
      intro:
        "One of the highest-value free programs a technology startup can join — and you are eligible through your stage.",
      body:
        paragraph(
          "NVIDIA Inception is NVIDIA's program for startups building with AI and accelerated computing. Members receive cloud and GPU credits, technical training and SDK access, hardware discounts, and introductions across NVIDIA's investor and enterprise network."
        ) +
        listCard("WHY FOUNDERS JOIN", [
          "Credits and discounts that cut your compute bill",
          "Technical resources and training for your engineering team",
          "Visibility inside a global AI ecosystem of startups and investors",
          "Free to apply — membership is by application through NVIDIA",
        ]) +
        paragraph(
          "Apply through the official NVIDIA Inception enrollment page. Mention your accelerator participation where the form asks about your ecosystem."
        ) +
        ctaBlock("Apply to NVIDIA Inception", "https://www.nvidia.com/en-us/startups/") +
        foundersBlock(),
    }),
  }),

  partners_meet: (row) => ({
    subject: "Meet our managing partners — book your strategy session",
    html: modernShell({
      title: "Meet our managing partners",
      preheader:
        "A one-on-one strategy session with Khalia Padilla and Ricardo Font — your roadmap, your Phase 1 goal, your next moves.",
      kicker: "Accelerator Program &middot; Strategy Session",
      heading: "Meet our managing partners",
      intro:
        "Every company in the program gets direct time with the people who run it. This is that invitation.",
      body:
        paragraph(
          "Book an intelligent strategy session with our managing partners, <strong style='color:#e5e7eb'>Khalia Padilla</strong> and <strong style='color:#e5e7eb'>Ricardo Font</strong>. Come with your product, your numbers and your hardest problem — leave with a clear plan for your Phase 1 milestone: what to build, who to sell to, and how the raise comes together."
        ) +
        listCard("IN THE SESSION", [
          "Your roadmap reviewed against your Phase 1 fundraising goal",
          "Your next three moves, sequenced",
          "Which program resources, mentors and partners to activate first",
        ]) +
        paragraph(
          "Sessions run on the platform's own video — book from your Meetings tab and the meeting link is created for you automatically."
        ) +
        ctaBlock("Book your strategy session", `${BASE}/dashboard`) +
        foundersBlock(),
    }),
  }),

  deck_readiness: (row) => ({
    subject: "Get investor-ready — your deck and data room",
    html: modernShell({
      title: "Get investor-ready",
      preheader:
        "Investors decide in minutes. Make sure your deck and your numbers are ready before the first introduction.",
      kicker: "Accelerator Program &middot; Investor Readiness",
      heading: "Get investor-ready: deck & data room",
      intro: "Introductions only work when the materials are ready. Two things to put in place this week.",
      body:
        listCard("YOUR CHECKLIST", [
          "<strong style='color:#e5e7eb'>Pitch deck</strong> — upload your current deck to your startup profile so it is one click from any introduction",
          "<strong style='color:#e5e7eb'>The story in ten slides</strong> — problem, product, market, traction, team, the ask",
          "<strong style='color:#e5e7eb'>Your numbers</strong> — revenue, burn and runway, stated the same way every time",
          "<strong style='color:#e5e7eb'>Your Phase 1 goal</strong> — the amount, and exactly what it buys the company",
        ]) +
        paragraph(
          "When your deck is on your profile, our team can review it and start matching you with the right rooms. Upload it from your profile:"
        ) +
        ctaBlock("Update your profile & deck", `${BASE}/profile-setup`) +
        foundersBlock(),
    }),
  }),

  mentor_match: (row) => ({
    subject: "Meet your mentor — your match is ready to start",
    html: modernShell({
      title: "Meet your mentor",
      preheader:
        "Operators who have built what you are building. Your mentorship track starts in your dashboard.",
      kicker: "Accelerator Program &middot; Mentorship",
      heading: "Meet your mentor",
      intro:
        "No founder in this program builds alone. Mentorship is matched on your industry, your stage and the problems you are solving now.",
      body:
        paragraph(
          "Your dashboard's mentorship section is where matching happens: tell it what you are working on — product, fundraising, sales, hiring — and book time with mentors from our network of operators and domain experts."
        ) +
        listCard("MAKE IT COUNT", [
          "Bring one specific problem per session, not a general update",
          "Share your numbers before the call so the time goes to decisions",
          "Close every session with the actions you committed to — and do them",
        ]) +
        ctaBlock("Open your mentorship", `${BASE}/dashboard`) +
        foundersBlock(),
    }),
  }),

  demo_day: (row) => ({
    subject: "Demo Day — how it works, and how to be the company everyone remembers",
    html: modernShell({
      title: "Demo Day",
      preheader:
        "Cohort companies present to investors and partners. Here is how selection works and what to prepare.",
      kicker: "Accelerator Program &middot; Demo Day",
      heading: "Demo Day — be ready",
      intro:
        "Demo Day is where the cohort meets the money. Companies present to our investor network and partners — live, on the platform.",
      body:
        listCard("HOW SELECTION WORKS", [
          "Companies with a complete profile and an uploaded deck are considered first",
          "Traction and a clear Phase 1 ask make the shortlist",
          "Selected companies rehearse with our team before the day",
        ]) +
        paragraph(
          "Whether you present this round or the next, the preparation pays for itself in every investor conversation. Watch the events calendar for dates and pitch nights to practice:"
        ) +
        ctaBlock("See upcoming events", `${BASE}/events`) +
        foundersBlock(),
    }),
  }),

  investor_update: (row) => ({
    subject: "Your monthly investor update — the template that keeps investors warm",
    html: modernShell({
      title: "Your monthly investor update",
      preheader:
        "Ten lines a month keeps your raise alive. Here is the format our investors actually read.",
      kicker: "Accelerator Program &middot; Investor Update",
      heading: "Your monthly investor update",
      intro:
        "The companies that raise are the ones investors hear from. Send this every month — to us, and to every investor following you.",
      body:
        listCard("THE FORMAT (COPY IT)", [
          "<strong style='color:#e5e7eb'>Headline</strong> — the month's one big fact, in one line",
          "<strong style='color:#e5e7eb'>Metrics</strong> — revenue, users, pipeline: this month vs last",
          "<strong style='color:#e5e7eb'>Wins</strong> — two or three, concrete",
          "<strong style='color:#e5e7eb'>Problems</strong> — one honest blocker (investors respect it)",
          "<strong style='color:#e5e7eb'>Phase 1 progress</strong> — where you stand against your fundraising goal",
          "<strong style='color:#e5e7eb'>Asks</strong> — introductions, hires, customers: specific names beat general hopes",
        ]) +
        paragraph(
          "Keep it short, keep it monthly, never miss. Your update goes out from your dashboard — and our team reads every one."
        ) +
        ctaBlock("Open your dashboard", `${BASE}/dashboard`) +
        foundersBlock(),
    }),
  }),
};

/* ------------------------------------------------------------------ */
/* Reports build (job 3): resource report, weekly opportunities,       */
/* weekly grants and the daily Top 10 — personalized from the          */
/* company's profile, the resources library and the events calendar.   */
/* ------------------------------------------------------------------ */

const isoDate = (d: Date) => d.toISOString().slice(0, 10);

const isoWeek = (d: Date) => {
  const t = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  const day = (t.getUTCDay() + 6) % 7;
  t.setUTCDate(t.getUTCDate() - day + 3);
  const firstThu = new Date(Date.UTC(t.getUTCFullYear(), 0, 4));
  const fd = (firstThu.getUTCDay() + 6) % 7;
  firstThu.setUTCDate(firstThu.getUTCDate() - fd + 3);
  const week = 1 + Math.round((t.getTime() - firstThu.getTime()) / (7 * 86400000));
  return `${t.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
};

/** Next occurrence of a weekday (Mon=1 … Sun=0) at hourUTC; today counts
 *  only if that time is still ahead. */
const nextWeekday = (weekday: number, hourUTC: number) => {
  const now = new Date();
  const d = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), hourUTC, 0, 0)
  );
  let add = (weekday - d.getUTCDay() + 7) % 7;
  if (add === 0 && d.getTime() <= now.getTime()) add = 7;
  d.setUTCDate(d.getUTCDate() + add);
  return d;
};

const itemLine = (title: string, meta: string, desc: string, url: string | null) =>
  `<div style="margin-top:10px;">` +
  `<div style="color:#e5e7eb;font-size:14px;font-weight:700;">${title}</div>` +
  (meta ? `<div style="color:#22d3ee;font-size:11px;margin-top:2px;">${meta}</div>` : "") +
  (desc ? `<div style="color:#94a3b8;font-size:12.5px;line-height:1.55;margin-top:3px;">${desc}</div>` : "") +
  (url
    ? `<div style="margin-top:3px;"><a href="${url}" style="color:#22d3ee;font-size:12.5px;text-decoration:none;">Open →</a></div>`
    : "") +
  `</div>`;

const esc = (s: string | null | undefined) =>
  String(s || "").replace(/</g, "&lt;").slice(0, 400);

interface CompanyProfile {
  name: string | null;
  industry: string | null;
  stage: string | null;
  description: string | null;
  tags: string[] | null;
  pitch_deck_url: string | null;
}

interface ResourceRow {
  title: string;
  description: string | null;
  resource_type: string;
  website_url: string | null;
  is_verified: boolean | null;
  created_at: string;
}

const TYPE_LABELS: Record<string, string> = {
  government_grant: "GRANT / FUNDING",
  investor_network: "INVESTORS",
  accelerator_incubator: "ACCELERATOR",
  lab: "LAB / R&D",
  perk: "PERK",
  university: "UNIVERSITY",
  technology_transfer: "TECH TRANSFER",
  coworking: "WORKSPACE",
  community: "COMMUNITY",
  event: "EVENT",
  other: "RESOURCE",
};

const keywordsOf = (c: CompanyProfile | null): string[] => {
  if (!c) return [];
  const text = [c.industry || "", c.description || "", ...(c.tags || [])]
    .join(" ")
    .toLowerCase();
  return Array.from(new Set(text.split(/[^a-z0-9]+/).filter((w) => w.length > 3))).slice(0, 40);
};

const scoreResource = (r: ResourceRow, keywords: string[]): number => {
  const hay = `${r.title} ${r.description || ""} ${r.resource_type}`.toLowerCase();
  let score = r.is_verified ? 2 : 0;
  for (const k of keywords) if (hay.includes(k)) score += 3;
  return score;
};

const fmtEventDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  }) + " ET";

const ASYNC_EMAILS: Record<
  string,
  (
    supabase: ReturnType<typeof createClient>,
    row: QueueRow,
    company: CompanyProfile | null
  ) => Promise<{ subject: string; html: string }>
> = {
  resource_report: async (supabase, row, company) => {
    const { data } = await supabase
      .from("resources")
      .select("title, description, resource_type, website_url, is_verified, created_at")
      .order("is_verified", { ascending: false })
      .limit(250);
    const resources = (data || []) as ResourceRow[];
    const keywords = keywordsOf(company);
    const scored = resources
      .map((r) => ({ r, s: scoreResource(r, keywords) }))
      .sort((a, b) => b.s - a.s);
    const top = scored.slice(0, 8).map((x) => x.r);
    const funding = scored
      .filter((x) => ["government_grant", "investor_network"].includes(x.r.resource_type))
      .slice(0, 3)
      .map((x) => x.r);
    const render = (r: ResourceRow) =>
      itemLine(
        esc(r.title),
        TYPE_LABELS[r.resource_type] || "RESOURCE",
        esc(r.description),
        r.website_url
      );
    return {
      subject: "Your personalized startup resource report",
      html: modernShell({
        title: "Your personalized startup resource report",
        preheader: `Resources matched to ${company?.industry || "your industry"} at the ${company?.stage || "your"} stage — from our library of 560+ verified resources.`,
        kicker: "Accelerator Program &middot; Resource Report",
        heading: "Your personalized resource report",
        intro: `Built from your completed profile${company?.industry ? ` — ${esc(company.industry)}` : ""}${company?.stage ? `, ${esc(company.stage)} stage` : ""}. These are the resources our matching ranks highest for you right now.`,
        body:
          listCard("TOP MATCHES FOR YOU", top.map(render)) +
          (funding.length
            ? listCard("GRANTS & FUNDING TO LOOK AT FIRST", funding.map(render))
            : "") +
          paragraph(
            "Your report refreshes as your profile and our library grow — new resources are added every week, and your weekly grants email and daily Top 10 keep you current between reports."
          ) +
          ctaBlock("Open your dashboard", `${BASE}/dashboard`) +
          foundersBlock(),
      }),
    };
  },

  weekly_opportunities: async (supabase, row) => {
    const until = new Date(Date.now() + 14 * 86400000).toISOString();
    const { data } = await supabase
      .from("events")
      .select("id, title, start_date, is_virtual, description")
      .gte("start_date", new Date().toISOString())
      .lte("start_date", until)
      .order("start_date", { ascending: true })
      .limit(8);
    const events = data || [];
    const render = (e: {
      id: string;
      title: string;
      start_date: string;
      is_virtual: boolean | null;
      description: string | null;
    }) =>
      itemLine(
        esc(e.title),
        `${fmtEventDate(e.start_date)} · ${e.is_virtual ? "Online" : "In person"}`,
        esc(e.description),
        `${BASE}/events/${e.id}/register`
      );
    return {
      subject: "Your weekly opportunities — events, workshops and pitch nights",
      html: modernShell({
        title: "Your weekly opportunities",
        preheader: "The next two weeks on the Startup Factory Hub calendar — networking, workshops, pitch events and founder activities.",
        kicker: "Accelerator Program &middot; Weekly Opportunities",
        heading: "Your weekly opportunities",
        intro: "Showing up is half of fundraising. Here is what is on in the next two weeks.",
        body:
          (events.length
            ? listCard("COMING UP", events.map(render))
            : paragraph("No public events are scheduled in the next two weeks — new dates land on the calendar weekly.")) +
          ctaBlock("See the full calendar", `${BASE}/events`) +
          foundersBlock(),
      }),
    };
  },

  weekly_grants: async (supabase, row, company) => {
    const { data } = await supabase
      .from("resources")
      .select("title, description, resource_type, website_url, is_verified, created_at")
      .in("resource_type", ["government_grant", "investor_network"])
      .order("created_at", { ascending: false })
      .limit(60);
    const resources = (data || []) as ResourceRow[];
    const keywords = keywordsOf(company);
    const picked = resources
      .map((r) => ({ r, s: scoreResource(r, keywords) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 8)
      .map((x) => x.r);
    const render = (r: ResourceRow) =>
      itemLine(
        esc(r.title),
        TYPE_LABELS[r.resource_type] || "FUNDING",
        esc(r.description),
        r.website_url
      );
    return {
      subject: "Grants and funding opportunities — this week",
      html: modernShell({
        title: "Grants and funding opportunities",
        preheader: "Grants, accelerators, competitions and funding programs — refreshed weekly and matched to your profile.",
        kicker: "Accelerator Program &middot; Funding Weekly",
        heading: "Grants & funding — this week",
        intro: `Fresh and matched for ${row.company_name || "your company"}: the funding programs our library ranks highest for your industry and stage.`,
        body:
          listCard("THIS WEEK'S SELECTION", picked.map(render)) +
          paragraph(
            "Deadlines move fast — if one fits, start the application this week and tell our team in your dashboard so we can support it."
          ) +
          ctaBlock("Open your dashboard", `${BASE}/dashboard`) +
          foundersBlock(),
      }),
    };
  },

  daily_top10: async (supabase, row, company) => {
    const keywords = keywordsOf(company);
    const [{ data: resData }, { data: evData }] = await Promise.all([
      supabase
        .from("resources")
        .select("title, description, resource_type, website_url, is_verified, created_at")
        .order("is_verified", { ascending: false })
        .limit(250),
      supabase
        .from("events")
        .select("id, title, start_date, is_virtual, description")
        .gte("start_date", new Date().toISOString())
        .order("start_date", { ascending: true })
        .limit(3),
    ]);
    const resources = (resData || []) as ResourceRow[];
    const byScore = (list: ResourceRow[]) =>
      list
        .map((r) => ({ r, s: scoreResource(r, keywords) }))
        .sort((a, b) => b.s - a.s)
        .map((x) => x.r);
    const funding = byScore(
      resources.filter((r) => ["government_grant", "investor_network"].includes(r.resource_type))
    ).slice(0, 3);
    const growth = byScore(
      resources.filter((r) =>
        ["accelerator_incubator", "lab", "technology_transfer", "university"].includes(r.resource_type)
      )
    ).slice(0, 3);
    const perks = byScore(resources.filter((r) => r.resource_type === "perk")).slice(0, 2);
    const items: string[] = [];
    let n = 0;
    const push = (title: string, meta: string, desc: string, url: string | null) => {
      n += 1;
      items.push(itemLine(`${n}. ${title}`, meta, desc, url));
    };
    for (const r of funding)
      push(esc(r.title), TYPE_LABELS[r.resource_type] || "FUNDING", esc(r.description), r.website_url);
    for (const e of (evData || []) as Array<{
      id: string;
      title: string;
      start_date: string;
      is_virtual: boolean | null;
      description: string | null;
    }>)
      push(
        esc(e.title),
        `EVENT · ${fmtEventDate(e.start_date)}`,
        esc(e.description),
        `${BASE}/events/${e.id}/register`
      );
    for (const r of growth)
      push(esc(r.title), TYPE_LABELS[r.resource_type] || "RESOURCE", esc(r.description), r.website_url);
    for (const r of perks)
      push(esc(r.title), "PERK", esc(r.description), r.website_url);
    return {
      subject: "Your daily Top 10 opportunities",
      html: modernShell({
        title: "Your daily Top 10 opportunities",
        preheader: `Ten opportunities ranked for ${company?.industry || "your industry"} at the ${company?.stage || "your"} stage — refreshed daily.`,
        kicker: "Accelerator Program &middot; Daily Top 10",
        heading: "Your daily Top 10",
        intro: `Ranked for ${row.company_name || "your company"} from today's grants, events, programs and perks. Work the top of the list first.`,
        body:
          listCard("TODAY'S TOP 10", items.slice(0, 10)) +
          ctaBlock("Open your dashboard", `${BASE}/dashboard`) +
          foundersBlock(),
      }),
    };
  },
};

/** Steps this tick sends: the one-time sequence plus the reports build. */
const SENDABLE = new Set([...Object.keys(EMAILS), ...Object.keys(ASYNC_EMAILS)]);
const RECURRING = new Set(["weekly_opportunities", "weekly_grants", "daily_top10"]);

/**
 * Engagement journey tick (founder order, 2026-11-06). Invoked hourly by
 * pg_cron. Sends every due one-time step in startup_engagement_queue:
 * - 'profile' is skipped when the company's profile is already complete.
 * - 'investor_update' re-seeds itself monthly after its first send.
 * Rows are claimed by marking them before the send, so two ticks can
 * never send the same email twice.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Seed the recurring steps for every enrolled recipient (job 3): the
    // unique (email, step, period) index makes re-seeding a no-op.
    {
      const { data: welcomed } = await supabase
        .from("startup_engagement_queue")
        .select("email, company_name, document_id")
        .eq("step", "welcome")
        .limit(500);
      const seen = new Map<string, { company_name: string | null; document_id: string | null }>();
      for (const w of welcomed || []) {
        if (!seen.has(w.email as string)) {
          seen.set(w.email as string, {
            company_name: w.company_name as string | null,
            document_id: w.document_id as string | null,
          });
        }
      }
      const now = new Date();
      const monday = nextWeekday(1, 14);
      const wednesday = nextWeekday(3, 14);
      const todayDue = new Date(now);
      if (todayDue.getUTCHours() >= 13) todayDue.setUTCHours(now.getUTCHours() + 1, 0, 0, 0);
      else todayDue.setUTCHours(13, 0, 0, 0);
      for (const [email, info] of seen) {
        const seeds = [
          { step: "daily_top10", period: isoDate(now), due_at: todayDue.toISOString() },
          { step: "weekly_opportunities", period: isoWeek(monday), due_at: monday.toISOString() },
          { step: "weekly_grants", period: isoWeek(wednesday), due_at: wednesday.toISOString() },
        ];
        for (const s of seeds) {
          await supabase.from("startup_engagement_queue").insert({
            document_id: info.document_id,
            email,
            company_name: info.company_name,
            step: s.step,
            period: s.period,
            due_at: s.due_at,
            status: "pending",
          });
        }
      }
    }

    const { data: due } = await supabase
      .from("startup_engagement_queue")
      .select("id, document_id, email, company_name, step, period")
      .eq("status", "pending")
      .lte("due_at", new Date().toISOString())
      .order("due_at", { ascending: true })
      .limit(50);

    const rows = (due || []).filter((r) => SENDABLE.has(r.step as string)) as QueueRow[];

    // Profile completeness is checked once per email address.
    const profileCache = new Map<string, boolean>();
    const profileComplete = async (email: string): Promise<boolean> => {
      if (profileCache.has(email)) return profileCache.get(email)!;
      let complete = false;
      try {
        const { data: users } = await supabase.auth.admin.listUsers({ perPage: 200 });
        const user = users?.users?.find(
          (u) => (u.email || "").toLowerCase() === email.toLowerCase()
        );
        if (user) {
          const { data: companies } = await supabase
            .from("companies")
            .select("description, industry, stage, funding_amount, looking_for")
            .eq("user_id", user.id)
            .limit(1);
          const c = companies?.[0];
          complete = !!(
            c &&
            c.description?.trim() &&
            c.industry?.trim() &&
            c.stage?.trim() &&
            (c.funding_amount || c.looking_for?.trim())
          );
        }
      } catch {
        complete = false;
      }
      profileCache.set(email, complete);
      return complete;
    };

    // Full company profile per email (for the personalized reports).
    const companyCache = new Map<string, CompanyProfile | null>();
    const getCompany = async (email: string): Promise<CompanyProfile | null> => {
      if (companyCache.has(email)) return companyCache.get(email)!;
      let company: CompanyProfile | null = null;
      try {
        const { data: users } = await supabase.auth.admin.listUsers({ perPage: 200 });
        const user = users?.users?.find(
          (u) => (u.email || "").toLowerCase() === email.toLowerCase()
        );
        if (user) {
          const { data: companies } = await supabase
            .from("companies")
            .select("name, industry, stage, description, tags, pitch_deck_url")
            .eq("user_id", user.id)
            .limit(1);
          company = (companies?.[0] as CompanyProfile) || null;
        }
      } catch {
        company = null;
      }
      companyCache.set(email, company);
      return company;
    };

    const results: Array<{ step: string; email: string; outcome: string }> = [];

    for (const row of rows) {
      // The resource report exists only once the profile is complete —
      // until then the row simply waits for a later tick.
      if (row.step === "resource_report" && !(await profileComplete(row.email))) {
        results.push({ step: row.step, email: row.email, outcome: "waiting-profile" });
        continue;
      }
      if (row.step === "profile" && (await profileComplete(row.email))) {
        await supabase
          .from("startup_engagement_queue")
          .update({ status: "skipped" })
          .eq("id", row.id);
        results.push({ step: row.step, email: row.email, outcome: "skipped-profile-complete" });
        continue;
      }

      // Claim the row before sending.
      const { data: claimed } = await supabase
        .from("startup_engagement_queue")
        .update({ status: "sending" })
        .eq("id", row.id)
        .eq("status", "pending")
        .select("id")
        .maybeSingle();
      if (!claimed) continue;

      const mail = ASYNC_EMAILS[row.step]
        ? await ASYNC_EMAILS[row.step](supabase, row, await getCompany(row.email))
        : EMAILS[row.step](row);
      const { error } = await resend.emails.send({
        from: "Startup Factory Hub <info@startupfactoryhub.com>",
        to: [row.email],
        subject: mail.subject,
        html: mail.html,
      });

      await supabase
        .from("startup_engagement_queue")
        .update({
          status: error ? "failed" : "sent",
          sent_at: error ? null : new Date().toISOString(),
        })
        .eq("id", row.id);
      results.push({ step: row.step, email: row.email, outcome: error ? "failed" : "sent" });

      // The monthly investor update re-seeds itself for next month.
      if (!error && row.step === "investor_update") {
        const next = new Date();
        next.setMonth(next.getMonth() + 1);
        const period = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
        await supabase.from("startup_engagement_queue").insert({
          document_id: row.document_id,
          email: row.email,
          company_name: row.company_name,
          step: "investor_update",
          period,
          due_at: next.toISOString(),
          status: "pending",
        });
      }
    }

    return json({ success: true, processed: results.length, results });
  } catch (e) {
    console.error("engagement-tick", e);
    return json({ error: "Unexpected error" }, 500);
  }
});
