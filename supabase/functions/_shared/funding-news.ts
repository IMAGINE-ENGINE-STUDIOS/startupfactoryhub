import { aiFetch, aiKeysConfigured } from "./ai.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const FUNDING_QUERIES = [
  'startup "raises" ("Series A" OR "Series B" OR "seed round")',
  'startup "funding round" ("led by" OR "venture capital")',
  '"pre-seed" OR "seed funding" startup million',
];

export function weekOf(date = new Date()): string {
  // Monday of the current week (UTC)
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

interface RawArticle {
  title: string;
  text: string;
  url: string;
  site: string;
  published: string;
  image: string | null;
}

async function fetchWebz(token: string, query: string, size: number): Promise<{ posts: RawArticle[]; requestsLeft: number }> {
  const q = encodeURIComponent(`site_type:(news OR blogs) is_first:true language:english ${query}`);
  const url = `https://api.webz.io/filterWebContent?token=${token}&q=${q}&format=json&size=${size}&sort=crawled`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    // 4xx will not recover on retry — surface it instead of looping.
    throw new Error(`Webz API ${res.status}: ${body.slice(0, 300)}`);
  }
  const data = await res.json();
  const posts: RawArticle[] = (data.posts ?? []).map((p: any) => ({
    title: p.title ?? "Untitled",
    text: String(p.text ?? "").slice(0, 700),
    url: p.url,
    site: p.site ?? "",
    published: p.published ?? null,
    image: p.thread?.main_image ?? null,
  }));
  return { posts, requestsLeft: data.requestsLeft ?? 0 };
}

async function extractFunding(apiKey: string, articles: RawArticle[]) {
  const payload = articles.map((a, i) => ({ i, title: a.title, text: a.text, site: a.site }));

  const res = await aiFetch("ai:chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3.6-flash",
      messages: [
        {
          role: "system",
          content:
            "You extract startup funding rounds from news articles. Return ONLY items that clearly announce a startup raising capital. Ignore public-market news, M&A, fund launches without a startup, and generic commentary.",
        },
        {
          role: "user",
          content:
            `For each article below, if it announces a startup funding round return an object with: i (the index), startup, amount (e.g. "$12M", or null), round (e.g. "Seed", "Series A", or null), investors (comma separated lead/participating investors, or null), one_liner (max 22 words, what the startup does + the raise).\n` +
            `Respond as JSON: {"items":[...]}. Omit articles that are not startup funding rounds.\n\n` +
            JSON.stringify(payload),
        },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`AI gateway ${res.status}: ${body.slice(0, 300)}`);
  }

  const data = await res.json();
  const raw = data?.choices?.[0]?.message?.content ?? "{}";
  let parsed: any = {};
  try {
    parsed = JSON.parse(raw);
  } catch {
    parsed = {};
  }
  return Array.isArray(parsed.items) ? parsed.items : [];
}

export async function collectFundingNews(limitPerQuery = 12) {
  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, { auth: { persistSession: false } });
  const token = Deno.env.get("WEBZ_API_TOKEN");
  const aiKey = aiKeysConfigured();
  if (!token) throw new Error("WEBZ_API_TOKEN is not configured");
  if (!aiKey) throw new Error("AI provider keys are not configured");

  const week = weekOf();
  const seen = new Map<string, RawArticle>();
  let requestsLeft = 0;

  for (const q of FUNDING_QUERIES) {
    const { posts, requestsLeft: left } = await fetchWebz(token, q, limitPerQuery);
    requestsLeft = left;
    for (const p of posts) {
      if (p.url && !seen.has(p.url)) seen.set(p.url, p);
    }
  }

  await supabase.from("api_usage_logs").insert({
    service_name: "webzio",
    endpoint: "/filterWebContent",
    request_count: FUNDING_QUERIES.length,
    estimated_cost: 0.01 * FUNDING_QUERIES.length,
    metadata: { context: "collect-funding-news", requests_remaining: requestsLeft },
  });

  const urls = [...seen.keys()];
  if (urls.length === 0) return { collected: 0, week_of: week };

  const { data: existing } = await supabase
    .from("weekly_funding_news")
    .select("source_url")
    .in("source_url", urls);

  const known = new Set((existing ?? []).map((r: any) => r.source_url));
  const fresh = [...seen.values()].filter((a) => !known.has(a.url)).slice(0, 30);
  if (fresh.length === 0) return { collected: 0, week_of: week };

  const items = await extractFunding(aiKey, fresh);

  const rows = items
    .filter((it: any) => it && typeof it.i === "number" && fresh[it.i] && it.startup)
    .map((it: any) => {
      const a = fresh[it.i];
      return {
        source_url: a.url,
        title: a.title,
        startup_name: String(it.startup).slice(0, 200),
        amount_text: it.amount ? String(it.amount).slice(0, 60) : null,
        round_type: it.round ? String(it.round).slice(0, 60) : null,
        investors: it.investors ? String(it.investors).slice(0, 400) : null,
        summary: it.one_liner ? String(it.one_liner).slice(0, 400) : null,
        image_url: a.image,
        source_site: a.site,
        published_at: a.published || null,
        week_of: week,
      };
    });

  if (rows.length === 0) return { collected: 0, week_of: week };

  const { error } = await supabase
    .from("weekly_funding_news")
    .upsert(rows, { onConflict: "source_url", ignoreDuplicates: true });
  if (error) throw new Error(error.message);

  return { collected: rows.length, week_of: week };
}
