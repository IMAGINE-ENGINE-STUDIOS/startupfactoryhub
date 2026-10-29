/**
 * SOCIALITE → Genius → Knowledge. Users teach Genius what to remember: faces,
 * scenarios, wording, prohibited words/imagery, pitches, logic, pipelines.
 * Rows live in socialite_knowledge (RLS: owner only); pictures in the private
 * "socialite-knowledge" bucket under <user id>/. Active items are applied to
 * every Genius call by supabase/functions/_shared/socialiteKnowledge.ts.
 */
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const KINDS: { id: string; label: string; hint: string }[] = [
  { id: "face", label: "Face", hint: "Who is this? e.g. Khalia, founder — always smiling" },
  { id: "scenario", label: "Scenario", hint: "Describe the setting, e.g. Our showroom backyard at golden hour" },
  { id: "wording", label: "Wording", hint: "Phrases, tone or sign-offs to use" },
  { id: "prohibited_words", label: "Banned words", hint: "Words or phrases Genius must never use" },
  { id: "prohibited_imagery", label: "Banned imagery", hint: "Things Genius must never show" },
  { id: "pitch", label: "Pitch", hint: "Your pitch, word for word" },
  { id: "logic", label: "Logic", hint: "A rule, e.g. Always mention free consultation for offers over $5k" },
  { id: "pipeline", label: "Pipeline", hint: "Steps to follow, one per line" },
  { id: "note", label: "Note", hint: "Anything else to remember" },
];
type Item = { id: string; kind: string; title: string; content: string; image_path: string | null; active: boolean };

export default function SocialiteKnowledge() {
  const [items, setItems] = useState<Item[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, string>>({});
  const [uid, setUid] = useState("");
  const [kind, setKind] = useState("face");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [filter, setFilter] = useState("all");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    const { data } = await supabase.from("socialite_knowledge" as any).select("id,kind,title,content,image_path,active").order("created_at", { ascending: false });
    const rows = (data ?? []) as unknown as Item[];
    setItems(rows);
    const paths = rows.filter((r) => r.image_path).map((r) => r.image_path!);
    if (paths.length) {
      const { data: s } = await supabase.storage.from("socialite-knowledge").createSignedUrls(paths, 3600);
      const map: Record<string, string> = {};
      (s ?? []).forEach((x) => { if (x.path && x.signedUrl) map[x.path] = x.signedUrl; });
      setThumbs(map);
    }
  };
  useEffect(() => { supabase.auth.getUser().then(({ data }) => setUid(data.user?.id ?? "")); load(); }, []);

  const add = async () => {
    if (!title.trim() || !uid) return;
    setBusy(true); setMsg("");
    try {
      let image_path: string | null = null;
      if (file) {
        if (file.size > 10 * 1024 * 1024) throw new Error("Picture must be under 10 MB");
        image_path = `${uid}/${crypto.randomUUID()}.${(file.name.split(".").pop() || "jpg").toLowerCase()}`;
        const up = await supabase.storage.from("socialite-knowledge").upload(image_path, file, { contentType: file.type });
        if (up.error) throw up.error;
      }
      const { error } = await supabase.from("socialite_knowledge" as any).insert({ owner_id: uid, kind, title: title.trim(), content: content.trim(), image_path });
      if (error) throw error;
      setTitle(""); setContent(""); setFile(null); setMsg("Saved. Genius will remember this.");
      load();
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  const toggle = async (it: Item) => {
    setItems((s) => s.map((x) => x.id === it.id ? { ...x, active: !x.active } : x));
    await supabase.from("socialite_knowledge" as any).update({ active: !it.active }).eq("id", it.id);
  };
  const remove = async (it: Item) => {
    if (!confirm(`Forget "${it.title}"?`)) return;
    setItems((s) => s.filter((x) => x.id !== it.id));
    await supabase.from("socialite_knowledge" as any).delete().eq("id", it.id);
    if (it.image_path) await supabase.storage.from("socialite-knowledge").remove([it.image_path]);
  };

  const shown = useMemo(() => filter === "all" ? items : items.filter((i) => i.kind === filter), [items, filter]);
  const k = KINDS.find((x) => x.id === kind)!;
  const label = (id: string) => KINDS.find((x) => x.id === id)?.label ?? id;

  return (
    <div className="space-y-5">
      <div className="rounded-[18px] border border-zinc-800 bg-[#161617] p-5 space-y-3">
        <div className="text-[13px] text-zinc-300">Teach Genius something to remember. Everything switched on is used in every post, picture and campaign.</div>
        <div className="flex flex-wrap gap-2">
          {KINDS.map((x) => <button key={x.id} onClick={() => setKind(x.id)} className={`px-3 py-1 rounded-full text-[11.5px] border ${kind === x.id ? "bg-white text-black border-white" : "border-zinc-800 text-zinc-400 hover:text-zinc-100"}`}>{x.label}</button>)}
        </div>
        <input value={title} onChange={(e) => setTitle(e.target.value)} maxLength={160} placeholder="Name it, e.g. Khalia's face" className="w-full bg-[#0f0f10] border border-zinc-800 rounded-[12px] px-3 py-2 text-[13px] text-zinc-100 outline-none focus:border-zinc-600" />
        <textarea rows={3} value={content} onChange={(e) => setContent(e.target.value)} maxLength={8000} placeholder={k.hint} className="w-full bg-[#0f0f10] border border-zinc-800 rounded-[12px] p-3 text-[13px] text-zinc-100 outline-none focus:border-zinc-600" />
        <div className="flex flex-wrap items-center gap-3">
          <label className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-[12px] text-zinc-200 cursor-pointer">
            {file ? file.name.slice(0, 28) : "Add a picture (optional)"}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </label>
          <button disabled={busy || !title.trim()} onClick={add} className="px-5 py-2 rounded-full bg-white text-black text-[12.5px] font-semibold disabled:opacity-40">{busy ? "Saving…" : "Remember this"}</button>
          {msg && <span className="text-[12px] text-zinc-400">{msg}</span>}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-[12px] text-zinc-500 mr-1">{items.length} saved · {items.filter((i) => i.active).length} on</span>
        {["all", ...KINDS.map((x) => x.id)].map((f) => <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-full text-[11px] ${filter === f ? "bg-zinc-200 text-black" : "bg-zinc-900 text-zinc-500 hover:text-zinc-200"}`}>{f === "all" ? "All" : label(f)}</button>)}
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        {shown.map((it) => (
          <div key={it.id} className={`rounded-[16px] border border-zinc-800 bg-[#161617] p-4 flex gap-3 ${it.active ? "" : "opacity-50"}`}>
            {it.image_path && thumbs[it.image_path] && <img src={thumbs[it.image_path]} alt={it.title} loading="lazy" className="w-16 h-16 rounded-[10px] object-cover border border-zinc-800 shrink-0" />}
            <div className="min-w-0 flex-1">
              <div className="text-[10.5px] uppercase tracking-wider text-zinc-500">{label(it.kind)}</div>
              <div className="text-[13px] text-zinc-100 font-medium truncate">{it.title}</div>
              {it.content && <div className="text-[12px] text-zinc-400 line-clamp-3 whitespace-pre-wrap">{it.content}</div>}
              <div className="flex gap-3 mt-2 text-[11.5px]">
                <button onClick={() => toggle(it)} className="text-zinc-300 hover:text-white">{it.active ? "Switch off" : "Switch on"}</button>
                <button onClick={() => remove(it)} className="text-zinc-500 hover:text-zinc-200">Forget</button>
              </div>
            </div>
          </div>
        ))}
        {!shown.length && <div className="text-[12.5px] text-zinc-500">Nothing saved here yet.</div>}
      </div>
    </div>
  );
}
