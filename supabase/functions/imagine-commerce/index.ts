// Imagine Engine: account storage sync, media uploads, storage overage billing,
// shared cart checkout (Stripe) and per-user payment setup.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@18.5.0";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const json = (b: unknown, status = 200) =>
  new Response(JSON.stringify(b), { status, headers: { ...cors, "Content-Type": "application/json" } });

const PRIV = "imagine-ai-private"; // shared with imagine-ai (settings.json lives here)
const MEDIA = "imagine-media"; // public media bucket
const STORAGE_DEFAULTS = { storage_included_mb: 500, storage_price_per_gb: 2.5, platform_fee_percent: 0 };

async function ensure(admin: any) {
  const a = await admin.storage.getBucket(PRIV);
  if (!a.data) await admin.storage.createBucket(PRIV, { public: false });
  const b = await admin.storage.getBucket(MEDIA);
  if (!b.data) await admin.storage.createBucket(MEDIA, { public: true });
}
async function readJson(admin: any, path: string) {
  const { data } = await admin.storage.from(PRIV).download(path);
  if (!data) return null;
  try { return JSON.parse(await data.text()); } catch { return null; }
}
async function writeJson(admin: any, path: string, v: unknown) {
  const body = JSON.stringify(v);
  const { error } = await admin.storage.from(PRIV).upload(path, new Blob([body], { type: "application/json" }), { upsert: true });
  if (error) throw error;
  return body.length;
}
async function folderBytes(admin: any, bucket: string, prefix: string): Promise<number> {
  let total = 0, offset = 0;
  for (;;) {
    const { data } = await admin.storage.from(bucket).list(prefix, { limit: 1000, offset });
    if (!data || !data.length) break;
    for (const f of data) {
      if (f.id === null) total += await folderBytes(admin, bucket, `${prefix}/${f.name}`);
      else total += Number(f.metadata?.size || 0);
    }
    if (data.length < 1000) break;
    offset += 1000;
  }
  return total;
}
async function usageFor(admin: any, uid: string, settings: any) {
  const bytes = (await folderBytes(admin, MEDIA, uid)) + (await folderBytes(admin, PRIV, `users/${uid}`));
  const included = Number(settings.storage_included_mb) * 1024 * 1024;
  const overGb = Math.max(0, bytes - included) / 1024 ** 3;
  return {
    bytes, included_bytes: included, over_gb: overGb,
    price_per_gb: Number(settings.storage_price_per_gb),
    monthly_charge_usd: Math.round(overGb * Number(settings.storage_price_per_gb) * 100) / 100,
  };
}
const hint = (k: string) => "••••" + k.slice(-4);

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const authed = createClient(url, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    });
    const { data: { user } } = await authed.auth.getUser();
    if (!user) return json({ error: "Please sign in first." }, 401);
    const admin = createClient(url, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, { auth: { persistSession: false } });
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");
    await ensure(admin);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
    const isAdmin = !!roleRow;
    const settings: any = { ...STORAGE_DEFAULTS, ...((await readJson(admin, "settings.json")) || {}) };
    const base = `users/${user.id}`;

    // ── account storage (no cap) ──
    if (action === "load") {
      const state = await readJson(admin, `${base}/state.json`);
      return json({ state, isAdmin });
    }
    if (action === "save") {
      const ls = body.ls;
      if (!ls || typeof ls !== "object" || Array.isArray(ls)) return json({ error: "Invalid state" }, 400);
      const clean: Record<string, string> = {};
      for (const [k, v] of Object.entries(ls)) if (/^ie-/.test(k) && typeof v === "string") clean[k] = v;
      const at = new Date().toISOString();
      await writeJson(admin, `${base}/state.json`, { ls: clean, updated_at: at });
      return json({ ok: true, updated_at: at });
    }
    // ── app data for apps built in Imagine Engine (IE.db) ──
    if (action === "appdb") {
      const ns = String(body.ns || "");
      const col = String(body.collection || "").replace(/[^a-zA-Z0-9_-]/g, "_").slice(0, 60);
      if (!/^[0-9a-f-]{36}\/[a-zA-Z0-9_-]{1,80}$/.test(ns) || !col) return json({ error: "Invalid app data request" }, 400);
      const creator = ns.split("/")[0];
      const path = `appdata/${ns}/${col}.json`;
      let rows: any[] = (await readJson(admin, path)) || [];
      const op = String(body.op || "list");
      const canEdit = (r: any) => r && (r._owner === user.id || creator === user.id || isAdmin);
      const view = (r: any) => ({ ...r, _mine: r._owner === user.id });
      if (op === "list") return json({ result: rows.map(view) });
      if (op === "insert") {
        const rec = body.record && typeof body.record === "object" && !Array.isArray(body.record) ? body.record : {};
        if (JSON.stringify(rec).length > 50000) return json({ error: "Record too large" }, 400);
        if (rows.length >= 20000) return json({ error: "Collection is full" }, 400);
        const r = { ...rec, id: crypto.randomUUID(), _owner: user.id, created_at: new Date().toISOString() };
        rows.push(r); await writeJson(admin, path, rows); return json({ result: view(r) });
      }
      const idx = rows.findIndex((r) => r.id === body.id);
      if (idx < 0) return json({ error: "Record not found" }, 404);
      if (!canEdit(rows[idx])) return json({ error: "You can only change your own records" }, 403);
      if (op === "update") {
        const patch = body.patch && typeof body.patch === "object" ? body.patch : {};
        delete patch.id; delete patch._owner;
        rows[idx] = { ...rows[idx], ...patch, updated_at: new Date().toISOString() };
        await writeJson(admin, path, rows); return json({ result: view(rows[idx]) });
      }
      if (op === "delete") { rows.splice(idx, 1); await writeJson(admin, path, rows); return json({ result: true }); }
      return json({ error: "Unknown op" }, 400);
    }
    if (action === "upload_url") {
      const name = String(body.name || "file").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
      const type = String(body.type || "");
      if (!/^(image|video)\//.test(type)) return json({ error: "Only images and videos can be uploaded." }, 400);
      const path = `${user.id}/${Date.now()}_${name}`;
      const { data, error } = await admin.storage.from(MEDIA).createSignedUploadUrl(path);
      if (error) throw error;
      const pub = admin.storage.from(MEDIA).getPublicUrl(path).data.publicUrl;
      return json({ path, token: data.token, signedUrl: data.signedUrl, publicUrl: pub });
    }
    if (action === "usage") return json(await usageFor(admin, user.id, settings));

    // admin: charge every user's storage over the included amount (run monthly)
    if (action === "bill_storage") {
      if (!isAdmin) return json({ error: "Forbidden" }, 403);
      const sk = Deno.env.get("STRIPE_SECRET_KEY");
      if (!sk) return json({ error: "Stripe is not configured." }, 400);
      const stripe = new Stripe(sk, { apiVersion: "2025-08-27.basil" });
      const month = new Date().toISOString().slice(0, 7);
      const ledger: any = (await readJson(admin, `billing/storage-${month}.json`)) || { charged: {} };
      const { data: dirs } = await admin.storage.from(MEDIA).list("", { limit: 1000 });
      const results: any[] = [];
      for (const d of dirs || []) {
        const uid = d.name;
        if (ledger.charged[uid]) continue;
        const u = await usageFor(admin, uid, settings);
        if (u.monthly_charge_usd < 0.5) continue; // Stripe minimum
        const { data: au } = await admin.auth.admin.getUserById(uid);
        const email = au?.user?.email;
        if (!email) continue;
        const found = await stripe.customers.list({ email, limit: 1 });
        const customer = found.data[0]?.id || (await stripe.customers.create({ email })).id;
        await stripe.invoiceItems.create({ customer, amount: Math.round(u.monthly_charge_usd * 100), currency: "usd", description: `Imagine Engine storage ${u.over_gb.toFixed(2)} GB over included (${month})` });
        const inv = await stripe.invoices.create({ customer, collection_method: "send_invoice", days_until_due: 14, pending_invoice_items_behavior: "include" });
        await stripe.invoices.sendInvoice(inv.id!);
        ledger.charged[uid] = { amount: u.monthly_charge_usd, invoice: inv.id };
        results.push({ email, amount: u.monthly_charge_usd });
      }
      await writeJson(admin, `billing/storage-${month}.json`, ledger);
      return json({ ok: true, charged: results });
    }

    // ── payments setup ──
    const payPath = `${base}/payments.json`;
    const pay: any = (await readJson(admin, payPath)) || {};
    if (action === "payment_status") {
      return json({
        isAdmin, platform_fee_percent: Number(settings.platform_fee_percent) || 0,
        stripe_connect: pay.connect_account_id ? { id: pay.connect_account_id } : null,
        keys: Object.fromEntries(Object.entries(pay.keys || {}).map(([k, v]) => [k, hint(String(v))])),
      });
    }
    if (action === "save_payment_key" || action === "delete_payment_key") {
      const provider = String(body.provider || "");
      if (!/^[a-z0-9_-]{2,30}$/.test(provider)) return json({ error: "Invalid provider" }, 400);
      pay.keys = pay.keys || {};
      if (action === "save_payment_key") {
        const k = String(body.key || "").trim();
        if (k.length < 8 || k.length > 500) return json({ error: "That key does not look valid." }, 400);
        if (provider === "stripe" && !/^(sk|rk)_(live|test)_/.test(k)) return json({ error: "Paste your Stripe secret key (starts with sk_)." }, 400);
        pay.keys[provider] = k;
      } else delete pay.keys[provider];
      await writeJson(admin, payPath, pay);
      return json({ ok: true });
    }
    if (action === "connect_stripe") {
      const sk = Deno.env.get("STRIPE_SECRET_KEY");
      if (!sk) return json({ error: "Stripe is not configured." }, 400);
      const stripe = new Stripe(sk, { apiVersion: "2025-08-27.basil" });
      if (!pay.connect_account_id) {
        const acct = await stripe.accounts.create({ type: "express", email: user.email, capabilities: { card_payments: { requested: true }, transfers: { requested: true } } });
        pay.connect_account_id = acct.id;
        await writeJson(admin, payPath, pay);
      }
      const ret = String(body.returnUrl || "https://startupfactoryhub.com/Imagine-Engine");
      const link = await stripe.accountLinks.create({ account: pay.connect_account_id, refresh_url: ret, return_url: ret, type: "account_onboarding" });
      return json({ url: link.url });
    }

    // ── shared cart checkout ──
    if (action === "checkout") {
      const items = Array.isArray(body.items) ? body.items.slice(0, 50) : [];
      const line_items = items.map((it: any) => {
        const price = Number(it.price), qty = Math.max(1, Math.min(99, Math.floor(Number(it.qty) || 1)));
        const name = String(it.name || "").slice(0, 120);
        if (!name || !(price > 0) || price > 100000) throw new Error("Invalid cart item");
        const img = typeof it.image === "string" && /^https:\/\//.test(it.image) ? [it.image] : undefined;
        return { quantity: qty, price_data: { currency: "usd", unit_amount: Math.round(price * 100), product_data: { name, images: img } } };
      });
      if (!line_items.length) return json({ error: "Your cart is empty." }, 400);
      const ret = String(body.returnUrl || "https://startupfactoryhub.com/Imagine-Engine");
      const sep = ret.includes("?") ? "&" : "?";
      const common: any = { mode: "payment", line_items, success_url: `${ret}${sep}checkout=success`, cancel_url: `${ret}${sep}checkout=cancel` };
      const total = line_items.reduce((s: number, l: any) => s + l.price_data.unit_amount * l.quantity, 0);
      let session;
      if (isAdmin) {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
        session = await stripe.checkout.sessions.create(common);
      } else if (pay.connect_account_id) {
        const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY")!, { apiVersion: "2025-08-27.basil" });
        const acct = await stripe.accounts.retrieve(pay.connect_account_id);
        if (!acct.charges_enabled) return json({ error: "Finish setting up your Stripe account before taking payments." }, 400);
        const fee = Math.round(total * (Number(settings.platform_fee_percent) || 0) / 100);
        session = await stripe.checkout.sessions.create({ ...common, payment_intent_data: { application_fee_amount: fee || undefined, transfer_data: { destination: pay.connect_account_id } } });
      } else if (pay.keys?.stripe) {
        const stripe = new Stripe(pay.keys.stripe, { apiVersion: "2025-08-27.basil" });
        session = await stripe.checkout.sessions.create(common);
      } else {
        return json({ error: "Set up payments first: connect Stripe or paste your Stripe key in the Content tab." }, 400);
      }
      return json({ url: session.url });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e) {
    console.error("[imagine-commerce]", e);
    return json({ error: e instanceof Error ? e.message : "Something went wrong" }, 500);
  }
});
