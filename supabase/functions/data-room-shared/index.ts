// Public token-based read access to the Investor Data Room (external share links).
// Validates the token server-side and returns documents with short-lived signed URLs.
// Credits: Imagine Engine Studios Corp.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  try {
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === "string" ? body.token.trim() : "";
    if (!/^[A-Za-z0-9_-]{16,128}$/.test(token)) return json({ error: "Invalid link" }, 400);

    const service = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: link } = await service
      .from("data_room_links")
      .select("token, expires_at")
      .eq("token", token)
      .maybeSingle();
    if (!link || (link.expires_at && new Date(link.expires_at).getTime() < Date.now())) {
      return json({ error: "This link is no longer active" }, 404);
    }

    const { data: docs, error } = await service
      .from("data_room_documents")
      .select("id, category, title, description, file_path, external_url, created_at")
      .order("created_at", { ascending: false });
    if (error) return json({ error: error.message }, 500);

    // One batched signing call for every file (was one sequential call per
    // document, which made the shared page wait seconds on "Loading...").
    const paths = (docs ?? []).map((d) => d.file_path).filter(Boolean) as string[];
    const signed = new Map<string, string>();
    if (paths.length) {
      const { data: arr } = await service.storage.from("data-room").createSignedUrls(paths, 3600);
      for (const item of arr ?? []) {
        if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
      }
    }
    const documents = (docs ?? []).map((d) => ({
      id: d.id,
      category: d.category,
      title: d.title,
      description: d.description,
      external_url: d.external_url,
      signedUrl: d.file_path ? signed.get(d.file_path) ?? null : null,
      created_at: d.created_at,
    }));
    return json({ documents });
  } catch (e) {
    console.error("data-room-shared failed:", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
