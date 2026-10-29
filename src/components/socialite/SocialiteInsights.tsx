/**
 * SocialiteInsights — the merged Dashboard + Analytics screen.
 * Every number is real: live platform metrics come from the `socialite-insights`
 * edge function (each user's own connected keys); email/SMS/WhatsApp/call results
 * from communication_logs; timed sends from socialite_scheduled; campaigns from
 * daily_email_sends; sales from quotes/invoices (main admin only). Zero when empty.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MessageSquare, MessageCircle, PhoneCall } from "lucide-react";

type Range = "7d" | "30d" | "90d" | "all";
type Post = { text: string; at: string; likes: number; comments: number; shares: number; views: number; url?: string };
type Plat = { connected: boolean; name?: string; followers?: number; extra?: Record<string, number>; posts?: Post[]; error?: string };
type QueueLike = { id: string; text: string; status: string; platforms: string[]; scheduledAt: Date; isAuto?: boolean };

const NAMES: Record<string, string> = { facebook: "Facebook", instagram: "Instagram", threads: "Threads", x: "X", tiktok: "TikTok", youtube: "YouTube" };
const DAYS: Record<Range, number> = { "7d": 7, "30d": 30, "90d": 90, all: 3650 };
const card = "rounded-[18px] border border-zinc-800 bg-[#161617]";
const n = (v: number) => (v >= 1e6 ? (v / 1e6).toFixed(1) + "M" : v >= 1e4 ? (v / 1e3).toFixed(1) + "k" : Math.round(v).toLocaleString());
const pct = (a: number, b: number) => (b ? `${Math.round((a / b) * 100)}%` : "—");
const money = (v: number) => `$${Math.round(v).toLocaleString()}`;
const CACHE = "pf_insights_cache";

interface Props {
  firstName: string;
  isOwner: boolean;
  queue: QueueLike[];
  bot: { enabled: boolean; perDay: number; platforms: number; nextRunAt: Date | null; autoPost: boolean };
  go: (view: string) => void;
}

export default function SocialiteInsights({ firstName, isOwner, queue, bot, go }: Props) {
  const [range, setRange] = useState<Range>(() => (localStorage.getItem("pf_insights_range") as Range) || "30d");
  const [live, setLive] = useState<{ platforms: Record<string, Plat>; fetched_at: string } | null>(() => { try { return JSON.parse(localStorage.getItem(CACHE) || "null"); } catch { return null; } });
  const [liveLoading, setLiveLoading] = useState(false);
  const [db, setDb] = useState<any>(null);
  const since = useMemo(() => new Date(Date.now() - DAYS[range] * 864e5), [range]);

  const refreshLive = useCallback(async () => {
    setLiveLoading(true);
    const { data } = await supabase.functions.invoke("socialite-insights", { body: {} });
    if (data?.platforms) { setLive(data); try { localStorage.setItem(CACHE, JSON.stringify(data)); } catch { /* quota */ } }
    setLiveLoading(false);
  }, []);
  useEffect(() => { const age = live ? Date.now() - new Date(live.fetched_at).getTime() : Infinity; if (age > 10 * 60e3) refreshLive(); }, []); // eslint-disable-line

  useEffect(() => {
    localStorage.setItem("pf_insights_range", range);
    const s = since.toISOString();
    const jobs: any[] = [
      supabase.from("communication_logs").select("channel, status, created_at").gte("created_at", s).limit(10000),
      supabase.from("socialite_scheduled").select("kind, status, send_at").gte("send_at", s).limit(5000),
      supabase.from("socialite_contacts").select("last_channel, last_sent_at").gte("last_sent_at", s).limit(10000),
    ];
    if (isOwner) jobs.push(
      supabase.from("daily_email_sends").select("campaign_key, title, successful, failed, send_date").gte("send_date", s.slice(0, 10)).limit(500),
      supabase.from("user_quotations").select("id, total_quote_amount, created_at").gte("created_at", s).limit(2000),
      supabase.from("invoices").select("quotation_id, total_amount, payment_status, created_at").gte("created_at", s).limit(2000),
      supabase.from("referrals").select("id").gte("created_at", s).limit(2000),
    );
    Promise.all(jobs).then(r => setDb({ logs: r[0].data || [], sched: r[1].data || [], contacts: r[2].data || [], camp: r[3]?.data || [], q: r[4]?.data || [], inv: r[5]?.data || [], ref: r[6]?.data || [] }));
  }, [since, isOwner]);

  // ---- live social ----
  const plats = Object.entries(live?.platforms || {});
  const connected = plats.filter(([, p]) => p.connected && !p.error);
  const livePosts = connected.flatMap(([k, p]) => (p.posts || []).filter(x => new Date(x.at) >= since).map(x => ({ ...x, platform: k })));
  const social = livePosts.reduce((a, p) => ({ likes: a.likes + p.likes, comments: a.comments + p.comments, shares: a.shares + p.shares, views: a.views + p.views }), { likes: 0, comments: 0, shares: 0, views: 0 });
  const followers = connected.reduce((s, [, p]) => s + (p.followers || 0), 0);
  const engagement = social.likes + social.comments + social.shares;
  const top = [...livePosts].sort((a, b) => (b.likes + b.comments + b.shares) - (a.likes + a.comments + a.shares)).slice(0, 5);

  // ---- messaging ----
  const ch = (c: string) => {
    const r = (db?.logs || []).filter((x: any) => x.channel === c);
    const contactSends = (db?.contacts || []).filter((x: any) => (x.last_channel === c) || (c === "voice" && x.last_channel === "calls")).length;
    const failed = r.filter((x: any) => x.status === "failed").length;
    return { sent: r.length - failed + (isOwner ? 0 : contactSends), failed, delivered: r.filter((x: any) => ["delivered", "opened", "clicked"].includes(x.status)).length, opened: r.filter((x: any) => ["opened", "clicked"].includes(x.status)).length, clicked: r.filter((x: any) => x.status === "clicked").length };
  };
  const channels = [
    { k: "email", l: "Email", I: Mail }, { k: "sms", l: "SMS", I: MessageSquare },
    { k: "whatsapp", l: "WhatsApp", I: MessageCircle }, { k: "voice", l: "Calls", I: PhoneCall },
  ].map(c => ({ ...c, ...ch(c.k) }));
  const totalMsgs = channels.reduce((s, c) => s + c.sent, 0);

  // ---- daily activity (messages + live posts) ----
  const span = Math.min(DAYS[range], 30);
  const bars = Array.from({ length: span }, (_, i) => {
    const d = new Date(Date.now() - (span - 1 - i) * 864e5).toISOString().slice(0, 10);
    return { d, msgs: (db?.logs || []).filter((x: any) => x.created_at?.slice(0, 10) === d).length, posts: livePosts.filter(p => p.at.slice(0, 10) === d).length };
  });
  const maxBar = Math.max(1, ...bars.map(b => b.msgs + b.posts));

  // ---- queue & timed ----
  const waiting = queue.filter(p => p.status !== "posted" && p.status !== "failed").sort((a, b) => +new Date(a.scheduledAt) - +new Date(b.scheduledAt));
  const postedLocal = queue.filter(p => p.status === "posted" && new Date(p.scheduledAt) >= since).length;
  const sched = (s: string) => (db?.sched || []).filter((x: any) => x.status === s).length;

  // ---- sales ----
  const invoicedQ = new Set((db?.inv || []).filter((x: any) => x.quotation_id).map((x: any) => x.quotation_id)).size;
  const paid = (db?.inv || []).filter((x: any) => x.payment_status === "paid").reduce((s: number, x: any) => s + Number(x.total_amount || 0), 0);
  const camps = new Map<string, { title: string; ok: number; fail: number; days: number }>();
  (db?.camp || []).forEach((x: any) => { const v = camps.get(x.campaign_key) || { title: x.title || x.campaign_key, ok: 0, fail: 0, days: 0 }; v.ok += x.successful || 0; v.fail += x.failed || 0; v.days++; camps.set(x.campaign_key, v); });

  const hour = new Date().getHours();
  const Stat = ({ l, v, s }: { l: string; v: React.ReactNode; s?: string }) => (
    <div className={`${card} p-4`}><div className="text-[10.5px] uppercase tracking-widest text-zinc-500">{l}</div><div className="text-[24px] font-semibold mt-1 mono tracking-tight">{v}</div>{s && <div className="text-[11.5px] text-zinc-500 mt-0.5">{s}</div>}</div>
  );
  const H = ({ t, a }: { t: string; a?: React.ReactNode }) => <div className="flex items-center justify-between mb-4"><h3 className="text-[12px] font-semibold tracking-widest uppercase text-zinc-400">{t}</h3>{a}</div>;
  const link = "text-[12px] text-zinc-400 hover:text-white";

  return (
    <div className="p-4 lg:p-8 max-w-[1200px] space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[24px] font-semibold tracking-tight">{hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening"}, {firstName}</h1>
          <p className="text-[13px] text-zinc-500 mt-0.5">Everything you posted and sent, with real results from your connected accounts.</p>
        </div>
        <div className="flex gap-1.5 p-1 rounded-full bg-[#161617] border border-zinc-800">
          {(["7d", "30d", "90d", "all"] as Range[]).map(r => (
            <button key={r} onClick={() => setRange(r)} className={`px-3 py-1 rounded-full text-[11px] mono font-medium transition ${range === r ? "bg-white text-black" : "text-zinc-500 hover:text-zinc-300"}`}>{r.toUpperCase()}</button>
          ))}
        </div>
      </div>

      {/* Headline */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat l="Audience" v={n(followers)} s={`${connected.length} account${connected.length === 1 ? "" : "s"} connected`} />
        <Stat l="Post engagement" v={n(engagement)} s={`${n(social.likes)} likes · ${n(social.comments)} comments · ${n(social.shares)} shares`} />
        <Stat l="Engagement rate" v={followers && livePosts.length ? `${((engagement / livePosts.length / followers) * 100).toFixed(2)}%` : "—"} s={`${livePosts.length} posts · ${n(social.views)} views`} />
        <Stat l="Messages sent" v={n(totalMsgs)} s={`${channels.reduce((s, c) => s + c.failed, 0)} failed`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Activity chart */}
        <div className={`${card} p-5 lg:col-span-2`}>
          <H t={`Daily activity · last ${span} days`} a={<div className="flex gap-3 text-[11px] text-zinc-500"><span className="flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-white" />Messages</span><span className="flex items-center gap-1"><i className="w-2 h-2 rounded-sm bg-zinc-500" />Posts</span></div>} />
          <div className="h-[140px] flex items-end gap-[3px]">
            {bars.map(b => (
              <div key={b.d} title={`${b.d}: ${b.msgs} messages, ${b.posts} posts`} className="flex-1 flex flex-col justify-end h-full">
                <div className="bg-zinc-500 rounded-t-[2px]" style={{ height: `${(b.posts / maxBar) * 100}%` }} />
                <div className="bg-white" style={{ height: `${(b.msgs / maxBar) * 100}%`, minHeight: b.msgs + b.posts ? 0 : 1, opacity: b.msgs + b.posts ? 1 : 0.1 }} />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] mono text-zinc-600 mt-2"><span>{bars[0]?.d}</span><span>today</span></div>
        </div>

        {/* Bot + next up */}
        <div className="space-y-4">
          <div className={`rounded-[18px] border p-5 ${bot.enabled ? "border-emerald-500/30 bg-emerald-500/10" : "border-zinc-800 bg-[#161617]"}`}>
            <div className="flex items-center justify-between"><span className="text-[11px] font-semibold tracking-widest uppercase">Automation</span><span className={`w-2 h-2 rounded-full ${bot.enabled ? "bg-emerald-400 animate-pulse" : "bg-zinc-600"}`} /></div>
            <div className="text-[15px] font-semibold mt-2">{bot.enabled ? `${bot.perDay} posts/day · ${bot.platforms} platforms` : "Paused"}</div>
            <div className="text-[11.5px] text-zinc-500 mt-1">{bot.enabled ? `Next run ${bot.nextRunAt ? bot.nextRunAt.toLocaleString() : "soon"} · auto-post ${bot.autoPost ? "on" : "off"}` : "Turn it on to create and post for you"}</div>
            <button onClick={() => go("automation")} className="mt-3 w-full py-2 rounded-full bg-zinc-900 border border-zinc-800 text-[12px] font-medium hover:bg-zinc-800">Open Automation</button>
          </div>
          <div className={`${card} p-5`}>
            <H t="Up next" a={<button onClick={() => go("queue")} className={link}>Queue →</button>} />
            {waiting.length === 0 && <div className="text-[12.5px] text-zinc-500">Nothing waiting. <button onClick={() => go("composer")} className="underline text-zinc-300">Create a post</button></div>}
            <div className="space-y-2">
              {waiting.slice(0, 3).map(p => (
                <div key={p.id} className="text-[12.5px]"><div className="mono text-[11px] text-zinc-500">{new Date(p.scheduledAt).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}{p.isAuto ? " · bot" : ""}</div><div className="truncate text-zinc-200">{p.text || "(media only)"}</div></div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-zinc-900 flex gap-4 text-[11.5px] text-zinc-500">
              <span>Timed sends: <b className="text-zinc-200 mono">{sched("pending")}</b> waiting</span><span><b className="text-zinc-200 mono">{sched("sent")}</b> sent</span><span><b className="text-zinc-200 mono">{sched("failed")}</b> failed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Social accounts */}
      <div className={`${card} p-5`}>
        <H t="Social accounts · live" a={<div className="flex items-center gap-3"><span className="text-[11px] text-zinc-600">{live ? `updated ${new Date(live.fetched_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : ""}</span><button onClick={refreshLive} disabled={liveLoading} className="px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-[11.5px] hover:bg-zinc-800 disabled:opacity-40">{liveLoading ? "Refreshing…" : "Refresh"}</button></div>} />
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.keys(NAMES).map(k => {
            const p = live?.platforms?.[k];
            const ps = (p?.posts || []).filter(x => new Date(x.at) >= since);
            const e = ps.reduce((s, x) => s + x.likes + x.comments + x.shares, 0);
            return (
              <div key={k} className="rounded-[14px] bg-[#0f0f10] border border-zinc-800 p-4">
                <div className="flex items-center justify-between"><span className="text-[13px] font-semibold">{NAMES[k]}</span><span className={`text-[10px] mono uppercase ${p?.connected && !p.error ? "text-emerald-300" : "text-zinc-600"}`}>{!p ? "—" : !p.connected ? "not connected" : p.error ? "check key" : "live"}</span></div>
                {p?.connected && !p.error ? (<>
                  <div className="text-[11.5px] text-zinc-500 truncate">{p.name}</div>
                  <div className="grid grid-cols-3 gap-2 mt-3 text-center">
                    <div><div className="mono text-[16px] font-semibold">{n(p.followers || 0)}</div><div className="text-[10px] text-zinc-500">followers</div></div>
                    <div><div className="mono text-[16px] font-semibold">{ps.length}</div><div className="text-[10px] text-zinc-500">posts</div></div>
                    <div><div className="mono text-[16px] font-semibold">{n(e)}</div><div className="text-[10px] text-zinc-500">engagement</div></div>
                  </div>
                  {p.extra && <div className="mt-2 text-[10.5px] text-zinc-600 truncate">{Object.entries(p.extra).map(([a, b]) => `${a.replace(/_/g, " ")} ${n(b)}`).join(" · ")}</div>}
                </>) : p?.error ? <div className="text-[11.5px] text-zinc-500 mt-2 line-clamp-2">{p.error}</div>
                  : <button onClick={() => go("accounts")} className="mt-3 text-[12px] underline text-zinc-400 hover:text-white">Connect in Accounts</button>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Messaging */}
        <div className={`${card} p-5`}>
          <H t="Email · SMS · WhatsApp · Calls" a={<button onClick={() => go("messaging")} className={link}>Send →</button>} />
          <div className="space-y-3">
            {channels.map(c => (
              <div key={c.k} className="flex items-center gap-3 text-[12.5px]">
                <c.I className="w-4 h-4 text-zinc-400 shrink-0" />
                <span className="w-[74px]">{c.l}</span>
                <div className="flex-1 h-1.5 rounded-full bg-zinc-900 overflow-hidden"><div className="h-full bg-white" style={{ width: `${totalMsgs ? (c.sent / totalMsgs) * 100 : 0}%` }} /></div>
                <span className="mono w-12 text-right">{n(c.sent)}</span>
                <span className="text-[11px] text-zinc-500 w-[150px] text-right">{c.k === "email" ? `${pct(c.opened, c.sent)} opened · ${pct(c.clicked, c.sent)} clicked` : `${pct(c.delivered, c.sent)} delivered`} · {c.failed} failed</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top posts */}
        <div className={`${card} p-5`}>
          <H t="Top posts" a={<span className="text-[11px] text-zinc-600">{postedLocal} published from SOCIALITE</span>} />
          {top.length === 0 && <div className="text-[12.5px] text-zinc-500">No posts with results yet in this period.</div>}
          <div className="space-y-2.5">
            {top.map((p, i) => (
              <a key={i} href={p.url} target="_blank" rel="noreferrer" className="flex gap-3 items-center text-[12.5px] group">
                <span className="text-[10px] mono uppercase text-zinc-500 w-16 shrink-0">{NAMES[p.platform]}</span>
                <span className="flex-1 truncate text-zinc-300 group-hover:text-white">{p.text || "(no caption)"}</span>
                <span className="mono text-[11.5px] text-zinc-400 shrink-0">{n(p.likes)} · {n(p.comments)} · {n(p.shares)}{p.views ? ` · ${n(p.views)} views` : ""}</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {isOwner && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="grid grid-cols-2 gap-3 lg:col-span-1">
            <Stat l="Quotes" v={(db?.q || []).length} s={`${invoicedQ} became invoices`} />
            <Stat l="Conversion" v={pct(invoicedQ, (db?.q || []).length)} />
            <Stat l="Paid revenue" v={money(paid)} />
            <Stat l="Referrals" v={(db?.ref || []).length} />
          </div>
          <div className={`${card} lg:col-span-2 p-5`}>
            <H t="Email campaigns" a={<button onClick={() => go("messaging")} className={link}>Campaigns →</button>} />
            {camps.size === 0 && <div className="text-[12.5px] text-zinc-500">No campaign sends in this period.</div>}
            <div className="divide-y divide-zinc-900">
              {[...camps.entries()].map(([k, v]) => (
                <div key={k} className="py-2.5 flex items-center gap-4 text-[12.5px]">
                  <div className="flex-1 truncate">{v.title}</div>
                  <span className="text-zinc-500">{v.days} days</span>
                  <span className="mono">{n(v.ok)} delivered</span>
                  <span className="mono text-zinc-500 w-24 text-right">{pct(v.ok, v.ok + v.fail)} success</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
