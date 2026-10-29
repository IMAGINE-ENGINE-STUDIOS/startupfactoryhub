// SOCIALITE key vault — AES-GCM encryption for social media tokens stored in
// public.socialite_credentials (service-role only). Key: SOCIALITE_ENC_KEY secret.
import { createClient } from "npm:@supabase/supabase-js@2";

const enc = new TextEncoder();
const dec = new TextDecoder();
const b64 = (u: Uint8Array) => btoa(String.fromCharCode(...u));
const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

async function key() {
  const raw = Deno.env.get("SOCIALITE_ENC_KEY");
  if (!raw) throw new Error("Vault key missing");
  const hash = await crypto.subtle.digest("SHA-256", enc.encode(raw));
  return crypto.subtle.importKey("raw", hash, "AES-GCM", false, ["encrypt", "decrypt"]);
}

export async function encrypt(plain: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, await key(), enc.encode(plain)));
  return `${b64(iv)}.${b64(ct)}`;
}

export async function decrypt(cipher: string) {
  const [iv, ct] = cipher.split(".");
  return dec.decode(await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, await key(), unb64(ct)));
}

export const admin = () => createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

/** Verifies the caller is a signed-in main admin. */
export async function requireMainAdmin(req: Request) {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return { error: "Sign in required", status: 401 } as const;
  const { data: ok } = await sb.rpc("is_main_admin");
  if (!ok) return { error: "Admins only", status: 403 } as const;
  return { userId: u.user.id } as const;
}

/** Verifies the caller is signed in (any SOCIALITE user). */
export async function requireUser(req: Request) {
  const sb = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
  });
  const { data: u } = await sb.auth.getUser();
  if (!u?.user) return { error: "Sign in required", status: 401 } as const;
  const { data: isAdmin } = await sb.rpc("is_main_admin");
  return { userId: u.user.id, isAdmin: !!isAdmin, email: u.user.email ?? "" } as const;
}

/** Each user's own keys (owner_id). */
export async function getCredential(platform: string, ownerId: string) {
  const { data } = await admin().from("socialite_credentials").select("*").eq("platform", platform).eq("owner_id", ownerId).maybeSingle();
  if (!data) return null;
  return { accountId: data.account_id as string | null, extraId: data.extra_id as string | null, token: await decrypt(data.token_cipher) };
}
