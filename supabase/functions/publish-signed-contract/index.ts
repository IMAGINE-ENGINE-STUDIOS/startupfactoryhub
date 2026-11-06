// @ts-nocheck
/**
 * publish-signed-contract — founder rule (2026-11-06): every time a startup
 * signs its Accelerator Program Participation Agreement, the signed PDF is
 * uploaded to the Investor Data Room under "Startup Contracts".
 *
 * Called by the public signing page right after a signature lands on an
 * equity_contract document (the caller is usually anonymous, so the share
 * token is the credential). Runs with the service role: validates the token
 * against a real equity contract that carries at least one signature, then
 * writes the PDF into the private "data-room" bucket at a deterministic
 * path (one file per contract — later signatures overwrite it with the
 * newest signed state) and inserts the data_room_documents row once.
 */
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Payload {
  token: string;
  pdfBase64: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { token, pdfBase64 }: Payload = await req.json();
    if (!token || !pdfBase64) {
      return new Response(JSON.stringify({ error: "Missing token or document" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: doc, error: docError } = await supabase
      .from("sign_documents")
      .select("id, title, source_type, status")
      .eq("share_token", token)
      .maybeSingle();

    if (docError || !doc) {
      return new Response(JSON.stringify({ error: "Invalid document token" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (doc.source_type !== "equity_contract") {
      return new Response(JSON.stringify({ error: "Not an accelerator contract" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // The rule fires when a startup has actually signed — require at least
    // one registered signature on the document.
    const { count } = await supabase
      .from("sign_signatures")
      .select("id", { count: "exact", head: true })
      .eq("document_id", doc.id);
    if (!count || count < 1) {
      return new Response(JSON.stringify({ error: "Document is not signed yet" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const bytes = Uint8Array.from(atob(pdfBase64), (c) => c.charCodeAt(0));
    const filePath = `startup-contracts/${doc.id}.pdf`;

    const { error: uploadError } = await supabase.storage
      .from("data-room")
      .upload(filePath, bytes, { contentType: "application/pdf", upsert: true });
    if (uploadError) {
      console.error("data-room upload", uploadError);
      return new Response(JSON.stringify({ error: "Upload failed" }), {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: existing } = await supabase
      .from("data_room_documents")
      .select("id")
      .eq("file_path", filePath)
      .maybeSingle();

    if (!existing) {
      const { error: insertError } = await supabase.from("data_room_documents").insert({
        category: "Startup Contracts",
        title: doc.title,
        description: "Signed Accelerator Program Participation Agreement",
        file_path: filePath,
        external_url: null,
        created_by: null,
      });
      if (insertError) {
        console.error("data_room_documents insert", insertError);
        return new Response(JSON.stringify({ error: "Could not register the document" }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ success: true, filePath }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("publish-signed-contract", e);
    return new Response(JSON.stringify({ error: "Unexpected error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
