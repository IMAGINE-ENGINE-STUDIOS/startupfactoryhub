// SOCIALITE public API key helpers.
// Keys look like `sk_live_<40 random chars>`. Only a SHA-256 fingerprint is
// stored (socialite_api_keys.key_hash), so a database leak never reveals keys.
import { admin } from "./socialiteVault.ts";

export const sha256 = async (s: string) =>
  Array.from(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s))))
    .map((b) => b.toString(16).padStart(2, "0")).join("");

export function newKey() {
  const abc = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(40));
  return "sk_live_" + Array.from(bytes, (b) => abc[b % abc.length]).join("");
}

const KEY_RE = /^sk_live_[A-Za-z0-9]{40}$/;

/** Resolve a Bearer API key → owner. Returns null for any invalid/revoked key. */
export async function resolveKey(req: Request) {
  const raw = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  if (!KEY_RE.test(raw)) return null;
  const { data } = await admin().from("socialite_api_keys")
    .select("id, owner_id, scopes, revoked_at").eq("key_hash", await sha256(raw)).maybeSingle();
  if (!data || data.revoked_at) return null;
  return data as { id: string; owner_id: string; scopes: string[] };
}
