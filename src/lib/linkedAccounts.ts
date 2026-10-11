import { createClient } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

const URL = import.meta.env.VITE_SUPABASE_URL || 'https://zqiihhmdsdgwdcwmryym.supabase.co';
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const STORE = 'sfh-linked-sessions';

export interface LinkedAccount {
  user_id: string;
  full_name: string | null;
  avatar_url: string | null;
  role: string | null;
  email: string;
  is_current: boolean;
}

type Store = Record<string, string>; // user_id -> refresh token (this device only)
const read = (): Store => { try { return JSON.parse(localStorage.getItem(STORE) || '{}'); } catch { return {}; } };
const write = (s: Store) => { try { localStorage.setItem(STORE, JSON.stringify(s)); } catch { /* storage full */ } };
const remember = (userId: string, refresh: string) => { const s = read(); s[userId] = refresh; write(s); };
export const hasSavedSession = (userId: string) => !!read()[userId];

export async function listLinkedAccounts(): Promise<LinkedAccount[]> {
  const { data, error } = await (supabase as any).rpc('get_my_linked_accounts');
  if (error) throw error;
  return (data || []) as LinkedAccount[];
}

/** Sign in to another account (proof of ownership) and link it to the current one. */
export async function linkAccount(email: string, password: string) {
  const temp = createClient(URL, KEY, { auth: { persistSession: false, autoRefreshToken: false, storageKey: 'sfh-link-tmp' } });
  const { data, error } = await temp.auth.signInWithPassword({ email, password });
  if (error || !data.session) throw error || new Error('Could not sign in to that account');
  const { data: code, error: codeErr } = await temp.rpc('create_account_link_code' as any);
  if (codeErr) throw codeErr;
  const { error: redeemErr } = await (supabase as any).rpc('redeem_account_link_code', { _code: code });
  if (redeemErr) throw redeemErr;
  remember(data.session.user.id, data.session.refresh_token);
}

/** Switch the app to a linked account. Returns false if that account must sign in again on this device. */
export async function switchToAccount(userId: string): Promise<boolean> {
  const token = read()[userId];
  if (!token) return false;
  const { data: cur } = await supabase.auth.getSession();
  if (cur.session) remember(cur.session.user.id, cur.session.refresh_token);
  const { data, error } = await supabase.auth.refreshSession({ refresh_token: token });
  if (error || !data.session) {
    const s = read(); delete s[userId]; write(s);
    if (cur.session) await supabase.auth.refreshSession({ refresh_token: read()[cur.session.user.id] });
    return false;
  }
  remember(data.session.user.id, data.session.refresh_token);
  return true;
}

export async function unlinkCurrentAccount() {
  const { error } = await (supabase as any).rpc('unlink_my_account');
  if (error) throw error;
}

/** Map of user_id -> group_id for any of the given ids that are linked. */
export async function fetchAccountGroups(ids: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>();
  if (!ids.length) return map;
  const { data } = await (supabase as any).rpc('get_account_groups', { user_ids: ids });
  (data || []).forEach((r: any) => map.set(r.user_id, r.group_id));
  return map;
}

/**
 * Collapse linked accounts into one card per person. Startup accounts always stay separate.
 * The primary is the account with an official badge, then a photo, then the longest bio.
 */
export function unifyLinked<T extends { user_id: string; role?: string | null; avatar_url?: string | null; bio?: string | null; is_official_mentor?: boolean }>(
  list: T[], groups: Map<string, string>,
): (T & { linked_roles?: string[] })[] {
  const byGroup = new Map<string, T[]>();
  const out: (T & { linked_roles?: string[] })[] = [];
  for (const m of list) {
    const g = groups.get(m.user_id);
    if (!g || m.role === 'startup') { out.push(m); continue; }
    if (!byGroup.has(g)) byGroup.set(g, []);
    byGroup.get(g)!.push(m);
  }
  const score = (m: T) => (m.is_official_mentor ? 1000 : 0) + (m.avatar_url ? 100 : 0) + Math.min((m.bio || '').length, 99);
  byGroup.forEach(members => {
    const primary = [...members].sort((a, b) => score(b) - score(a))[0];
    const roles = Array.from(new Set(members.map(m => m.role).filter(Boolean) as string[]));
    out.push({ ...primary, linked_roles: roles.length > 1 ? roles : undefined });
  });
  return out;
}
