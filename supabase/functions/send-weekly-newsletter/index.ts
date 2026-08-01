import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { collectFundingNews, weekOf } from "../_shared/funding-news.ts";
import { complianceFetch } from "../_shared/email-compliance.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SITE = "https://startupfactoryhub.com";

interface FundingItem {
  startup_name: string | null;
  amount_text: string | null;
  round_type: string | null;
  investors: string | null;
  summary: string | null;
  source_url: string;
  source_site: string | null;
  title: string;
}

interface Internal {
  startups: { name: string; tagline: string | null }[];
  investmentsTotal: number;
  investmentsCount: number;
  newMembers: number;
  events: { title: string; start_date: string | null }[];
  resources: { title: string; category: string | null }[];
}

const esc = (s: unknown) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const money = (n: number) =>
  n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `$${Math.round(n / 1000)}K` : `$${n}`;

function buildHtml(recipientName: string, news: FundingItem[], internal: Internal, unsubscribeUrl: string) {
  const dateLabel = new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

  const newsRows = news.length
    ? news
        .map(
          (n) => `
      <tr><td style="padding:14px 0;border-bottom:1px solid rgba(16,185,129,0.15);">
        <div style="font-size:15px;font-weight:700;color:#e6fff4;">
          ${esc(n.startup_name || n.title)}
          ${n.amount_text ? `<span style="color:#34d399;font-weight:700;"> · ${esc(n.amount_text)}</span>` : ""}
          ${n.round_type ? `<span style="display:inline-block;margin-left:8px;padding:2px 8px;border-radius:999px;background:rgba(16,185,129,0.12);color:#6ee7b7;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;">${esc(n.round_type)}</span>` : ""}
        </div>
        ${n.summary ? `<div style="font-size:13px;color:#9fb4ab;margin-top:5px;line-height:1.5;">${esc(n.summary)}</div>` : ""}
        ${n.investors ? `<div style="font-size:12px;color:#7e948c;margin-top:4px;">Investors: ${esc(n.investors)}</div>` : ""}
        <a href="${esc(n.source_url)}" style="font-size:12px;color:#34d399;text-decoration:none;">Read on ${esc(n.source_site || "source")} →</a>
      </td></tr>`,
        )
        .join("")
    : `<tr><td style="padding:16px 0;color:#7e948c;font-size:13px;">No qualifying funding rounds surfaced this week.</td></tr>`;

  const list = (items: string[]) =>
    items.length
      ? `<ul style="margin:8px 0 0;padding-left:18px;color:#c3d6cd;font-size:13px;line-height:1.7;">${items
          .map((i) => `<li>${i}</li>`)
          .join("")}</ul>`
      : `<div style="color:#7e948c;font-size:13px;margin-top:6px;">Nothing new this week.</div>`;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#05100c;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:640px;margin:0 auto;background:#08150f;">
    <div style="padding:32px 28px;background:linear-gradient(135deg,#064e3b 0%,#065f46 55%,#0f766e 100%);">
      <div style="font-size:11px;letter-spacing:.28em;text-transform:uppercase;color:#a7f3d0;">Startup Factory Hub</div>
      <div style="font-size:26px;font-weight:800;color:#ffffff;margin-top:8px;">Weekly Investment Brief</div>
      <div style="font-size:13px;color:#a7f3d0;margin-top:6px;">${esc(dateLabel)}</div>
    </div>

    <div style="padding:24px 28px;">
      <div style="font-size:15px;color:#e6fff4;">Hi ${esc(recipientName)},</div>
      <div style="font-size:14px;color:#9fb4ab;margin-top:6px;line-height:1.6;">
        Here is this week's capital movement across the global startup market and inside the Hub.
      </div>

      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;border-collapse:separate;border-spacing:8px 0;">
        <tr>
          ${[
            [String(internal.startups.length), "New startups"],
            [String(internal.newMembers), "New members"],
            [money(internal.investmentsTotal), "Capital logged"],
            [String(news.length), "Rounds tracked"],
          ]
            .map(
              ([v, l]) => `<td align="center" style="padding:14px 6px;background:rgba(16,185,129,0.07);border:1px solid rgba(16,185,129,0.16);border-radius:12px;">
              <div style="font-size:20px;font-weight:800;color:#34d399;">${esc(v)}</div>
              <div style="font-size:10px;color:#8ba79c;text-transform:uppercase;letter-spacing:.08em;margin-top:4px;">${esc(l)}</div>
            </td>`,
            )
            .join("")}
        </tr>
      </table>

      <div style="margin-top:28px;">
        <div style="font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#34d399;">Funding Radar</div>
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:6px;">${newsRows}</table>
      </div>

      <div style="margin-top:28px;">
        <div style="font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:#34d399;">Inside the Hub</div>
        <div style="margin-top:10px;font-size:13px;color:#c3d6cd;font-weight:600;">New startups onboarded</div>
        ${list(internal.startups.map((s) => `<strong style="color:#e6fff4;">${esc(s.name)}</strong>${s.tagline ? ` — ${esc(s.tagline)}` : ""}`))}
        <div style="margin-top:14px;font-size:13px;color:#c3d6cd;font-weight:600;">Investments recorded</div>
        ${list(
          internal.investmentsCount
            ? [`${internal.investmentsCount} new investment${internal.investmentsCount === 1 ? "" : "s"} totalling ${money(internal.investmentsTotal)}`]
            : [],
        )}
        <div style="margin-top:14px;font-size:13px;color:#c3d6cd;font-weight:600;">New events</div>
        ${list(internal.events.map((e) => `${esc(e.title)}${e.start_date ? ` — ${esc(new Date(e.start_date).toLocaleDateString("en-US", { month: "short", day: "numeric" }))}` : ""}`))}
        <div style="margin-top:14px;font-size:13px;color:#c3d6cd;font-weight:600;">New resources</div>
        ${list(internal.resources.map((r) => `${esc(r.title)}${r.category ? ` <span style="color:#7e948c;">· ${esc(r.category)}</span>` : ""}`))}
      </div>

      <div style="text-align:center;margin-top:30px;">
        <a href="${SITE}" style="display:inline-block;padding:13px 30px;border-radius:10px;background:linear-gradient(135deg,#10b981,#0d9488);color:#04140e;font-weight:700;font-size:14px;text-decoration:none;">Open the Platform</a>
      </div>
    </div>

    <div style="padding:20px 28px 4px;text-align:center;">
      <div style="font-size:11px;color:#6f877e;line-height:1.7;">
        You receive this brief as a member of Startup Factory Hub.
        <span style="display:none;">${esc(unsubscribeUrl)}</span>
      </div>
    </div>

  </div>
</body></html>`;
}

async function gatherInternal(supabase: any): Promise<Internal> {
  const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  const [companies, investments, members, events, resources] = await Promise.all([
    supabase.from("companies").select("name, tagline").gte("created_at", since).limit(12),
    supabase.from("investments").select("amount").gte("created_at", since).limit(500),
    supabase.from("profiles_data").select("user_id", { count: "exact", head: true }).gte("created_at", since),
    supabase.from("events").select("title, start_date").gte("created_at", since).limit(8),
    supabase.from("resources").select("title, category").gte("created_at", since).limit(8),
  ]);

  const amounts = (investments.data ?? []).map((i: any) => Number(i.amount) || 0);

  return {
    startups: companies.data ?? [],
    investmentsTotal: amounts.reduce((a: number, b: number) => a + b, 0),
    investmentsCount: amounts.length,
    newMembers: members.count ?? 0,
    events: events.data ?? [],
    resources: resources.data ?? [],
  };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });

  try {
    const body = await req.json().catch(() => ({} as any));
    const testEmail: string | undefined = body?.testEmail;
    const previewOnly: boolean = body?.preview === true;
    const force: boolean = body?.force === true;
    const cron: boolean = body?.cron === true;

    // Master kill-switch: cron sends are skipped when the newsletter is disabled.
    if (cron) {
      const { data: setting } = await supabase
        .from("admin_settings")
        .select("setting_value")
        .eq("setting_key", "weekly_newsletter_active")
        .maybeSingle();
      if (setting?.setting_value?.active === false) {
        return new Response(JSON.stringify({ skipped: true, reason: "Newsletter is paused in admin settings" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Cron fires at 17:00 and 18:00 UTC on Fridays; only the run that lands on
    // 13:00 America/New_York proceeds, so DST never shifts the send time.
    if (cron) {
      const etHour = Number(
        new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hour12: false }).format(new Date()),
      );
      if (etHour !== 13) {
        return new Response(JSON.stringify({ skipped: true, reason: `ET hour is ${etHour}, not 13` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const week = weekOf();

    if (!testEmail && !previewOnly && !force) {
      const { data: existing } = await supabase
        .from("newsletter_sends")
        .select("id, status")
        .eq("week_of", week)
        .maybeSingle();
      if (existing && ["sent", "processing"].includes(existing.status)) {
        return new Response(JSON.stringify({ skipped: true, reason: `already ${existing.status} for ${week}` }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Refresh external funding news (non-fatal if it fails)
    let collectError: string | null = null;
    try {
      await collectFundingNews();
    } catch (err) {
      collectError = err instanceof Error ? err.message : String(err);
      console.error("funding news collection failed:", collectError);
    }

    const { data: newsRows } = await supabase
      .from("weekly_funding_news")
      .select("startup_name, amount_text, round_type, investors, summary, source_url, source_site, title")
      .eq("week_of", week)
      .order("published_at", { ascending: false })
      .limit(10);

    const news = (newsRows ?? []) as FundingItem[];
    const internal = await gatherInternal(supabase);

    const subject = `Weekly Investment Brief — ${new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}`;

    if (previewOnly) {
      const html = buildHtml("Member", news, internal, `${SITE}/`);
      return new Response(JSON.stringify({ preview: true, subject, html, collectError }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY is not configured");

    const unsubBase = `${SUPABASE_URL}/functions/v1/newsletter-unsubscribe?u=`;

    const send = async (to: string, name: string, userId: string | null) => {
      const html = buildHtml(name, news, internal, userId ? `${unsubBase}${userId}` : `${SITE}/`);
      const res = await complianceFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from: "Startup Factory Hub <info@startupfactoryhub.com>",
          to: [to],
          subject,
          html,
        }),
      });
      if (!res.ok) throw new Error(`Resend ${res.status}: ${(await res.text()).slice(0, 200)}`);
    };

    if (testEmail) {
      await send(testEmail, "Member", null);
      return new Response(JSON.stringify({ success: true, test: true, to: testEmail, news: news.length }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: recipients } = await supabase
      .from("profiles_data")
      .select("user_id, email, full_name")
      .not("email", "is", null)
      .eq("newsletter_opt_out", false);

    const list = (recipients ?? []).filter((r: any) => r.email);

    await supabase
      .from("newsletter_sends")
      .upsert(
        {
          week_of: week,
          status: "processing",
          recipients_count: list.length,
          sent_count: 0,
          error_count: 0,
          last_error: collectError,
        },
        { onConflict: "week_of" },
      );

    let sent = 0;
    let errors = 0;
    let lastError: string | null = collectError;

    for (let i = 0; i < list.length; i += 50) {
      const batch = list.slice(i, i + 50);
      for (const r of batch) {
        try {
          await send(r.email, r.full_name || "Member", r.user_id);
          sent++;
        } catch (err) {
          errors++;
          lastError = err instanceof Error ? err.message : String(err);
          console.error(`newsletter send failed for ${r.email}:`, lastError);
        }
        await new Promise((res) => setTimeout(res, 120));
      }
      await new Promise((res) => setTimeout(res, 500));
    }

    const html = buildHtml("Member", news, internal, `${SITE}/`);
    await supabase
      .from("newsletter_sends")
      .update({
        status: sent === 0 && errors > 0 ? "failed" : "sent",
        sent_count: sent,
        error_count: errors,
        last_error: lastError,
        html_snapshot: html,
        completed_at: new Date().toISOString(),
      })
      .eq("week_of", week);

    return new Response(JSON.stringify({ success: true, week_of: week, recipients: list.length, sent, errors }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("send-weekly-newsletter error:", message);
    await supabase
      .from("newsletter_sends")
      .update({ status: "failed", last_error: message, completed_at: new Date().toISOString() })
      .eq("week_of", weekOf());
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
