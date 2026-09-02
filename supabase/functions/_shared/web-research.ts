// Live internet research helper.
// Uses the Lovable AI Gateway with Google Search grounding so market features
// read the REAL, current web instead of a news API feed.

export interface WebResearch {
  digest: string;
  sources: string[];
}

/** Human readable "today" block injected into every prompt. */
export function todayContext(): string {
  const now = new Date();
  return `TODAY'S DATE IS ${now.toISOString().slice(0, 10)} (${now.getUTCFullYear()}). ` +
    `Never claim a date later than today is "in the future" — you are operating in ${now.getUTCFullYear()}.`;
}

/**
 * Search the live web and return a factual digest plus the source URLs.
 * @param query what to research
 * @param instructions extra shaping for the digest
 */
export async function researchWeb(
  query: string,
  instructions = "",
): Promise<WebResearch> {
  const key = Deno.env.get("LOVABLE_API_KEY");
  if (!key) {
    console.warn("[web-research] LOVABLE_API_KEY missing — no live grounding");
    return { digest: "", sources: [] };
  }

  const prompt = `${todayContext()}

Search the live web right now and report the most recent, verifiable facts about:
"${query}"

${instructions}

Rules:
- Only report facts you actually found on the web in the last 60 days.
- Include company names, amounts, dates (YYYY-MM-DD) and the source URL for each fact.
- If you cannot verify something, omit it. Never invent companies, rounds or numbers.
- Output a compact bulleted digest. Each bullet ends with "| source: <url>".`;

  try {
    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash",
        messages: [{ role: "user", content: prompt }],
        tools: [{ type: "google_search" }],
      }),
    });

    if (!res.ok) {
      console.error("[web-research] gateway error", res.status, (await res.text()).slice(0, 400));
      return { digest: "", sources: [] };
    }

    const data = await res.json();
    const digest: string = data.choices?.[0]?.message?.content ?? "";
    const sources = Array.from(
      new Set((digest.match(/https?:\/\/[^\s)\]|]+/g) ?? []).map((u: string) => u.replace(/[.,]$/, ""))),
    );
    console.log(`[web-research] digest ${digest.length} chars, ${sources.length} sources`);
    return { digest, sources };
  } catch (err) {
    console.error("[web-research] failed:", err);
    return { digest: "", sources: [] };
  }
}

/** Block to embed in a downstream prompt. */
export function researchBlock(r: WebResearch): string {
  if (!r.digest) return "";
  return `\n\nLIVE WEB RESEARCH (retrieved seconds ago from the open internet — ground every fact in this):\n${r.digest}`;
}
