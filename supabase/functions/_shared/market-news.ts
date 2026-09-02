// Shared live-news grounding helper for market intelligence features.
// Uses Webz.io (WEBZ_API_TOKEN) so the AI always reasons over REAL, recent articles
// instead of its stale training data.

export interface NewsArticle {
  title: string;
  text: string;
  url: string;
  site: string;
  published: string | null;
}

/**
 * Fetch recent English news/blog articles matching a query.
 * @param query      free-text search
 * @param days       how far back to look (default 45 days)
 * @param size       max articles (default 20)
 */
export async function fetchMarketNews(
  query: string,
  days = 45,
  size = 20,
): Promise<NewsArticle[]> {
  const token = Deno.env.get("WEBZ_API_TOKEN");
  if (!token) {
    console.warn("[market-news] WEBZ_API_TOKEN not configured — no live grounding");
    return [];
  }

  const since = Date.now() - days * 24 * 60 * 60 * 1000;
  const q = encodeURIComponent(
    `site_type:news language:english ${query}`,
  );
  const url =
    `https://api.webz.io/filterWebContent?token=${token}&q=${q}&format=json&size=${size}&sort=crawled&ts=${since}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.error("[market-news] Webz error", res.status, (await res.text()).slice(0, 300));
      return [];
    }
    const data = await res.json();
    return (data.posts ?? []).map((p: any): NewsArticle => ({
      title: p.title ?? "Untitled",
      text: String(p.text ?? "").slice(0, 900),
      url: p.url,
      site: p.thread?.site ?? p.site ?? "",
      published: p.published ?? null,
    }));
  } catch (err) {
    console.error("[market-news] fetch failed:", err);
    return [];
  }
}

/** Human readable "today" block injected into every prompt. */
export function todayContext(): string {
  const now = new Date();
  return `TODAY'S DATE IS ${now.toISOString().slice(0, 10)} (${now.getUTCFullYear()}). ` +
    `Never claim a date later than today is "in the future" — you are operating in ${now.getUTCFullYear()}.`;
}

/** Compact article digest for prompting. */
export function articlesBlock(articles: NewsArticle[]): string {
  if (!articles.length) return "";
  return `\n\nLIVE NEWS ARTICLES (real, retrieved minutes ago — ground every fact in these):\n` +
    articles
      .map((a, i) =>
        `[${i + 1}] ${a.title}\n    source: ${a.site} | published: ${a.published ?? "n/a"}\n    url: ${a.url}\n    ${a.text.slice(0, 600)}`
      )
      .join("\n");
}
