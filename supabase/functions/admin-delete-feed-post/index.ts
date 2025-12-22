import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type AdminDeleteFeedPostRequest = {
  postId: string;
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function extractFeedMediaPath(url: string): string | null {
  // Supports:
  // - /storage/v1/object/public/feed-media/<path>
  // - /storage/v1/object/sign/feed-media/<path>?token=...
  const publicMatch = url.match(/\/storage\/v1\/object\/public\/feed-media\/(.+)$/);
  if (publicMatch?.[1]) return decodeURIComponent(publicMatch[1]);

  const signedMatch = url.match(/\/storage\/v1\/object\/sign\/feed-media\/(.+)$/);
  if (signedMatch?.[1]) {
    const withQuery = decodeURIComponent(signedMatch[1]);
    return withQuery.split("?")[0] || null;
  }

  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      return jsonResponse({ error: "Server not configured" }, 500);
    }

    const authHeader = req.headers.get("authorization") || req.headers.get("Authorization") || "";

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: authHeader,
        },
      },
    });

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const requesterId = userData.user.id;

    const service = createClient(supabaseUrl, supabaseServiceKey);

    const { data: isAdmin, error: roleErr } = await service.rpc("has_role", {
      _user_id: requesterId,
      _role: "admin",
    });

    if (roleErr) {
      console.error("Role check error:", roleErr);
      return jsonResponse({ error: "Role check failed" }, 500);
    }

    if (!isAdmin) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const { postId }: AdminDeleteFeedPostRequest = await req.json();
    if (!postId) {
      return jsonResponse({ error: "postId is required" }, 400);
    }

    // Fetch the post to get media_urls
    const { data: post, error: postErr } = await service
      .from("feed_posts")
      .select("id, media_urls")
      .eq("id", postId)
      .maybeSingle();

    if (postErr) {
      console.error("Fetch post error:", postErr);
      return jsonResponse({ error: "Failed to fetch post" }, 500);
    }

    if (!post) {
      return jsonResponse({ error: "Post not found" }, 404);
    }

    // Delete media files in feed-media bucket (only if they are Supabase storage URLs)
    const mediaUrls = (post as any).media_urls as string[] | null;
    const feedMediaPaths = (mediaUrls || [])
      .map((u) => extractFeedMediaPath(String(u)))
      .filter((p): p is string => Boolean(p));

    let deletedMediaCount = 0;
    if (feedMediaPaths.length > 0) {
      const { error: storageErr } = await service.storage.from("feed-media").remove(feedMediaPaths);
      if (storageErr) {
        console.error("Storage delete error:", storageErr);
        // Continue: post deletion should still happen even if media delete fails
      } else {
        deletedMediaCount = feedMediaPaths.length;
      }
    }

    // Delete the post
    const { error: deleteErr } = await service.from("feed_posts").delete().eq("id", postId);
    if (deleteErr) {
      console.error("Post delete error:", deleteErr);
      return jsonResponse({ error: "Failed to delete post" }, 500);
    }

    return jsonResponse({ ok: true, deletedMediaCount });
  } catch (e) {
    console.error("admin-delete-feed-post error:", e);
    return jsonResponse({ error: "Unexpected error" }, 500);
  }
});
