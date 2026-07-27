import { supabase } from "@/integrations/supabase/client";

/**
 * Headers for calling authenticated AI edge functions.
 * Uses the signed-in user's access token when available,
 * falling back to the publishable key.
 */
export async function getAIHeaders(): Promise<Record<string, string>> {
  let token = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
  try {
    const { data } = await supabase.auth.getSession();
    if (data.session?.access_token) token = data.session.access_token;
  } catch {
    /* ignore — fall back to publishable key */
  }
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
    apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
  };
}
