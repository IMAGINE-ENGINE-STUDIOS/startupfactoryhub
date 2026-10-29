/**
 * SOCIALITE → Genius (every paying user, once the admin connects a provider).
 * Writes posts / emails / texts, rewrites, hashtags, creates pictures, plans
 * full multi-channel campaigns (posts land in the Queue) and analyses results.
 * All calls go through socialite-ai, which meters usage against the plan.
 */
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { genius } from "@/lib/socialite/billing";
import SocialiteKnowledge from "./SocialiteKnowledge";

type Task = "post" | "hashtags" | "rewrite" | "email" | "sms" | "image" | "campaign" | "analyse";
const TASKS: { id: Task; label: string; hint: string }[] = [
  { id: "post", label: "Write a post", hint: "What is the post about? e.g. New outdoor kitchen collection, 10% off this week" },
  { id: "image", label: "Create a picture", hint: "Describe the picture, e.g. Luxury backyard pool at sunset, editorial photo" },
  { id: "campaign", label: "Plan a campaign", hint: "Goal, offer, audience and length, e.g. 2-week spring pool campaign for Florida homeowners" },
  { id: "email", label: "Write an email", hint: "What should the email say?" },
  { id: "sms", label: "Write a text", hint: "What should the text say?" },
  { id: "rewrite", label: "Improve text", hint: "Paste the text to improve" },
  { id: "hashtags", label: "Hashtags", hint: "Paste the post" },
  { id: "analyse", label: "Analyse my results", hint: "Anything specific to look at? (optional)" },
];
const PLATS = ["facebook", "instagram", "threads", "x", "tiktok", "youtube"];

export type GeniusPost = { text: string; platforms: string[]; when: Date; image?: string };

export default function SocialiteGenius({ onUsePost, onAddPosts, queueSummary }: {
  onUsePost: (text: string, image?: string) => void;
  onAddPosts: (posts: GeniusPost[]) => void;
  queueSummary: string;
}) {
  const [on, setOn] = useState<boolean | null>(null);
  const [view, setView] = useState<"create" | "knowledge">("create");
  const [task, setTask] = useState<Task>("post");
  const [prompt, setPrompt] = useState("");
  const [platforms, setPlatforms] = useState<string[]>(["facebook", "instagram"]);
  const [out, setOut] = useState<{ text?: string; image?: string; campaign?: any; credits?: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => { genius({ action: "get_config" }).then((c) => setOn(!!c.enabled)).catch(() => setOn(false)); }, []);

  const analyseContext = async () => {
    const since = new Date(Date.now() - 30 * 86400_000).toISOString();
    const { data } = await supabase.from("communication_logs").select("channel, status, opened_at").gte("created_at", since).limit(2000);
    const by: Record<string, { sent: number; failed: number; opened: number; clicked: number }> = {};
    (data ?? []).forEach((l: any) => {
      const k = (by[l.channel] ??= { sent: 0, failed: 0, opened: 0, clicked: 0 });
      k.sent++; if (l.status === "failed") k.failed++; if (l.opened_at) k.opened++; if (l.status === "clicked") k.clicked++;
    });
    return `Messages last 30 days: ${JSON.stringify(by)}\nPosts: ${queueSummary}`;
  };

  const run = async () => {
    setBusy(true); setErr(""); setOut(null);
    try {
      if (task === "image") {
        const r = await genius({ action: "image", prompt });
        setOut({ image: r.url, credits: r.credits });
      } else {
        const context = task === "analyse" ? await analyseContext() : undefined;
        const r = await genius({ action: "generate", task, prompt, platforms, context });
        setOut({ text: r.text, campaign: r.campaign, credits: r.credits });
      }
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };

  const addCampaign = () => {
    const c = out?.campaign; if (!c?.posts?.length) return;
    const start = new Date(); start.setHours(0, 0, 0, 0);
    onAddPosts(c.posts.map((p: any) => {
      const d = new Date(start); d.setDate(d.getDate() + Math.max(1, Number(p.day) || 1));
      const [h, m] = String(p.time || "10:00").split(":").map(Number); d.setHours(h || 10, m || 0);
      return { text: p.text, platforms: (p.platforms ?? platforms).filter((x: string) => PLATS.includes(x)), when: d };
    }));
  };

  if (on === null) return <div className="p-8 text-[13px] text-zinc-400">Loading Genius…</div>;
  if (!on) return (
    <div className="p-4 lg:p-8 max-w-[760px]">
      <h1 className="text-[22px] font-semibold">Genius</h1>
      <div className="mt-4 rounded-[18px] border border-zinc-800 bg-[#161617] p-6 text-[13px] text-zinc-400">Genius is not switched on yet. The owner connects it in Accounts.</div>
    </div>
  );
  const t = TASKS.find((x) => x.id === task)!;

  return (
    <div className="p-4 lg:p-8 max-w-[1000px] space-y-5">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Genius</h1>
        <p className="text-[12px] text-zinc-500 mt-1">Your helper for posts, pictures, emails, texts, full campaigns and reading your results.</p>
        <div className="mt-3 inline-flex rounded-full border border-zinc-800 p-1">
          {(["create", "knowledge"] as const).map((v) => <button key={v} onClick={() => setView(v)} className={`px-4 py-1.5 rounded-full text-[12px] font-medium ${view === v ? "bg-white text-black" : "text-zinc-400"}`}>{v === "create" ? "Create" : "Knowledge"}</button>)}
        </div>
      </div>
      {view === "knowledge" ? <SocialiteKnowledge /> : <>
      <div className="flex flex-wrap gap-2">
        {TASKS.map((x) => <button key={x.id} onClick={() => { setTask(x.id); setOut(null); }} className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition ${task === x.id ? "bg-white text-black" : "bg-zinc-900 text-zinc-400 hover:text-zinc-100"}`}>{x.label}</button>)}
      </div>
      <div className="rounded-[18px] border border-zinc-800 bg-[#161617] p-5 space-y-3">
        <textarea rows={task === "rewrite" || task === "hashtags" ? 6 : 3} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t.hint}
          className="w-full bg-[#0f0f10] border border-zinc-800 rounded-[12px] p-3 text-[13px] text-zinc-100 outline-none focus:border-zinc-600" />
        {(task === "post" || task === "campaign") && (
          <div className="flex flex-wrap gap-2">
            {PLATS.map((p) => <button key={p} onClick={() => setPlatforms((s) => s.includes(p) ? s.filter((x) => x !== p) : [...s, p])} className={`px-3 py-1 rounded-full text-[11.5px] border ${platforms.includes(p) ? "bg-white text-black border-white" : "border-zinc-800 text-zinc-400"}`}>{p}</button>)}
          </div>
        )}
        <button disabled={busy || (!prompt.trim() && task !== "analyse")} onClick={run} className="px-5 py-2 rounded-full bg-white text-black text-[12.5px] font-semibold disabled:opacity-40">{busy ? "Working…" : t.label}</button>
        {err && <div className="text-[12.5px] text-amber-300">{err}</div>}
      </div>

      {out && (
        <div className="rounded-[18px] border border-zinc-800 bg-[#161617] p-5 space-y-3">
          {out.image && <img src={out.image} alt="Created by Genius" loading="lazy" className="w-full max-w-[420px] rounded-[12px] border border-zinc-800" />}
          {out.campaign ? (
            <div className="space-y-3 text-[12.5px]">
              <div className="text-[16px] font-semibold">{out.campaign.name}</div>
              <div className="text-zinc-400">{out.campaign.summary}</div>
              <div className="text-[12px] text-zinc-500">{out.campaign.posts?.length ?? 0} posts · {out.campaign.emails?.length ?? 0} emails · {out.campaign.sms?.length ?? 0} texts</div>
              <div className="divide-y divide-zinc-800">
                {(out.campaign.posts ?? []).map((p: any, i: number) => <div key={i} className="py-2"><span className="text-zinc-500 mono">Day {p.day} · {p.time} · {(p.platforms ?? []).join(", ")}</span><div className="text-zinc-200 whitespace-pre-wrap mt-1">{p.text}</div></div>)}
                {(out.campaign.emails ?? []).map((e: any, i: number) => <div key={`e${i}`} className="py-2"><span className="text-zinc-500 mono">Day {e.day} · Email</span><div className="text-zinc-200 font-medium mt-1">{e.subject}</div><div className="text-zinc-400 whitespace-pre-wrap">{e.body}</div></div>)}
                {(out.campaign.sms ?? []).map((s: any, i: number) => <div key={`s${i}`} className="py-2"><span className="text-zinc-500 mono">Day {s.day} · Text</span><div className="text-zinc-200 mt-1">{s.text}</div></div>)}
              </div>
              <button onClick={addCampaign} className="px-4 py-2 rounded-full bg-white text-black text-[12px] font-semibold">Add the posts to my queue</button>
              <div className="text-[11px] text-zinc-500">Emails and texts can be copied into Email · SMS · Calls.</div>
            </div>
          ) : out.text ? <div className="text-[13px] text-zinc-200 whitespace-pre-wrap">{out.text}</div> : null}
          <div className="flex flex-wrap gap-2 items-center">
            {(out.text && !out.campaign && ["post", "rewrite", "hashtags"].includes(task)) || out.image ? (
              <button onClick={() => onUsePost(out.text ?? "", out.image)} className="px-4 py-2 rounded-full bg-white text-black text-[12px] font-semibold">Open in Composer</button>
            ) : null}
            {out.text && <button onClick={() => navigator.clipboard.writeText(out.text!)} className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-[12px] text-zinc-200">Copy</button>}
            {!!out.credits && <span className="text-[11px] text-zinc-500 ml-auto">{out.credits} credits used</span>}
          </div>
        </div>
      )}
      </>}
    </div>
  );
}
