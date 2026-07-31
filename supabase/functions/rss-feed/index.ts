import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SITE = "https://startupfactoryhub.com";

const esc = (s: unknown) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const url = new URL(req.url);
  const feed = (url.searchParams.get("feed") || "startups").toLowerCase();
  const limit = Math.min(Number(url.searchParams.get("limit") || 25) || 25, 50);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    { auth: { persistSession: false } }
  );

  try {
    let items: Array<{ title: string; link: string; description: string; date: string; guid: string; image?: string | null }> = [];
    let feedTitle = "Startup Factory Hub — New Startups";
    let feedDesc = "Newly onboarded startups in the Startup Factory Hub ecosystem.";

    if (feed === "blog") {
      feedTitle = "Startup Factory Hub — Blog";
      feedDesc = "Latest articles from Startup Factory Hub.";
      const { data, error } = await supabase
        .from("blog_posts")
        .select("id, title, content, cover_image, created_at, published")
        .eq("published", true)
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      items = (data ?? []).map((p: any) => ({
        title: p.title ?? "Untitled",
        link: `${SITE}/blog?post=${p.id}`,
        description: String(p.content ?? "").replace(/<[^>]*>/g, "").slice(0, 400),
        date: new Date(p.created_at).toUTCString(),
        guid: `blog-${p.id}`,
        image: p.cover_image,
      }));
    } else if (feed === "events") {
      feedTitle = "Startup Factory Hub — Events";
      feedDesc = "Upcoming events across the Startup Factory Hub network.";
      const { data, error } = await supabase
        .from("events")
        .select("id, title, description, image_url, start_date, created_at")
        .order("start_date", { ascending: false })
        .limit(limit);
      if (error) throw error;
      items = (data ?? []).map((e: any) => ({
        title: e.title ?? "Event",
        link: `${SITE}/dashboard?tab=events&id=${e.id}`,
        description: String(e.description ?? "").slice(0, 400),
        date: new Date(e.created_at ?? e.start_date).toUTCString(),
        guid: `event-${e.id}`,
        image: e.image_url,
      }));
    } else {
      const [{ data, error }, { data: template }] = await Promise.all([
        supabase
          .from("companies")
          .select("id, name, description, logo_url, industry, stage, website, created_at")
          .not("logo_url", "is", null)
          .not("description", "is", null)
          .order("created_at", { ascending: false })
          .limit(limit),
        supabase
          .from("marketing_templates")
          .select("headline, subtext")
          .eq("type", "startup_announcement")
          .eq("is_default", true)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      if (error) throw error;

      const render = (tpl: string, c: any) =>
        String(tpl ?? "")
          .replace(/\{startup_name\}/g, c.name ?? "")
          .replace(/\{industry\}/g, c.industry || "innovative")
          .replace(/\{stage\}/g, c.stage || "early-stage")
          .replace(/\{founder\}/g, "")
          .replace(/[ \t]+/g, " ")
          .trim();

      const fallbackHeadline = "Welcome {startup_name} to Startup Factory Hub";
      const fallbackSubtext =
        "{startup_name} just joined our ecosystem — a {stage} venture reshaping {industry}.";

      items = (data ?? []).map((c: any) => {
        const headline = render(template?.headline || fallbackHeadline, c);
        const body = render(template?.subtext || fallbackSubtext, c);
        const about = String(c.description ?? "").replace(/\s+/g, " ").trim().slice(0, 280);
        return {
          title: headline,
          link: `${SITE}/dashboard?tab=network&company=${c.id}`,
          description: [body, about].filter(Boolean).join("\n\n"),
          date: new Date(c.created_at).toUTCString(),
          guid: `company-${c.id}`,
          image: `${Deno.env.get("SUPABASE_URL")}/functions/v1/announcement-banner?company_id=${c.id}`,
        };
      });
    }


    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <title>${esc(feedTitle)}</title>
    <link>${SITE}</link>
    <description>${esc(feedDesc)}</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${esc(url.href)}" rel="self" type="application/rss+xml" />
${items
  .map(
    (i) => `    <item>
      <title>${esc(i.title)}</title>
      <link>${esc(i.link)}</link>
      <guid isPermaLink="false">${esc(i.guid)}</guid>
      <pubDate>${i.date}</pubDate>
      <description>${esc(i.description)}</description>${
      i.image ? `\n      <enclosure url="${esc(i.image)}" type="image/jpeg" />\n      <media:content url="${esc(i.image)}" medium="image" />` : ""
    }
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;

    return new Response(xml, {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=300",
      },
    });
  } catch (error) {
    console.error("rss-feed error:", error);
    return new Response(`<?xml version="1.0"?><error>${esc((error as Error).message)}</error>`, {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/xml" },
    });
  }
});
