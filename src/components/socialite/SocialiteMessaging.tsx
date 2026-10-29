/**
 * SocialiteMessaging — Email · SMS · WhatsApp · Calls inside SOCIALITE.
 * Every signed-in user: sends email / SMS / WhatsApp to "My contacts" — contacts
 * they add by hand or upload in bulk (CSV / TXT / vCard) into socialite_contacts,
 * sent through the socialite-send edge function (owner-checked on the server).
 * Voice calls and scheduling included. No decorative icons — only the four channel icons.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Mail, MessageSquare, PhoneCall, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ShieldNotice, useShieldPreview, shieldFromError } from "./SocialiteShield";
import SendTimePicker from "./SendTimePicker";
import { scheduleSend, getSavedTz, fmtIn } from "@/lib/socialite/sendTime";

type Channel = "email" | "sms" | "whatsapp" | "calls";
type Source = "contacts" | "clients";
interface Person { id: string; name: string; first: string; email: string | null; phone: string | null; note?: string }

const SIGN = "— Khalia · Startup Factory Hub";
const QUICK: [string, string][] = [
  ["Follow-up", "Hi {first_name}, just checking in — do you have a few minutes this week to talk?"],
  ["Thank you", "Hi {first_name}, thank you for your time. Let me know if there's anything I can help with."],
  ["Reminder", "Hi {first_name}, a friendly reminder about our appointment. Reply here if you need to reschedule."],
];

const card = "rounded-[20px] border border-zinc-800 bg-[#161617]";
const label = "text-[11px] font-semibold tracking-[0.18em] uppercase text-zinc-500";
const chip = (on: boolean) => `text-[12px] px-3 py-1.5 rounded-full transition ${on ? "bg-white text-black" : "bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white"}`;
const input = "w-full rounded-[12px] bg-zinc-900 border border-zinc-800 px-3 py-2 text-[13px] outline-none focus:border-zinc-600";

/* ---------- bulk file parsing (CSV / TXT / vCard) ---------- */
const EMAIL_RE = /[^\s,;<>"]+@[^\s,;<>"]+\.[a-z]{2,}/i;
const PHONE_RE = /\+?\d[\d\s().-]{7,}\d/;
function splitCsv(line: string) {
  const out: string[] = []; let cur = "", q = false;
  for (const ch of line) { if (ch === '"') q = !q; else if ((ch === "," || ch === ";" || ch === "\t") && !q) { out.push(cur); cur = ""; } else cur += ch; }
  out.push(cur); return out.map(s => s.trim());
}
const normPhone = (p: string) => { const d = p.replace(/[^\d+]/g, ""); return d.startsWith("+") ? d : d.length === 10 ? `+1${d}` : `+${d}`; };
function parseContacts(text: string, source: string) {
  const rows: { name: string; email: string | null; phone: string | null; source: string }[] = [];
  if (/BEGIN:VCARD/i.test(text)) {
    for (const block of text.split(/END:VCARD/i)) {
      const name = block.match(/\nFN[^:]*:(.+)/i)?.[1]?.trim() || "";
      const email = block.match(/\nEMAIL[^:]*:(.+)/i)?.[1]?.trim() || null;
      const tel = block.match(/\nTEL[^:]*:(.+)/i)?.[1]?.trim();
      if (email || tel) rows.push({ name, email, phone: tel ? normPhone(tel) : null, source });
    }
    return rows;
  }
  const lines = text.split(/\r?\n/).filter(l => l.trim());
  if (!lines.length) return rows;
  const head = splitCsv(lines[0]).map(h => h.toLowerCase());
  const hasHead = head.some(h => /name|email|phone|mobile/.test(h));
  const idx = (re: RegExp) => head.findIndex(h => re.test(h));
  const iFirst = idx(/^first|given/), iLast = idx(/^last|family|surname/), iName = idx(/^name$|full ?name|display/), iEmail = idx(/mail/), iPhone = idx(/phone|mobile|cell|tel/);
  for (const line of hasHead ? lines.slice(1) : lines) {
    const c = splitCsv(line);
    let name = hasHead ? (iName >= 0 ? c[iName] : [c[iFirst], c[iLast]].filter(Boolean).join(" ")) || "" : "";
    const email = (hasHead && iEmail >= 0 ? c[iEmail] : "") || line.match(EMAIL_RE)?.[0] || "";
    const phone = (hasHead && iPhone >= 0 ? c[iPhone] : "") || line.match(PHONE_RE)?.[0] || "";
    if (!hasHead) name = c.find(x => x && !EMAIL_RE.test(x) && !PHONE_RE.test(x)) || "";
    if (email || phone) rows.push({ name: name.slice(0, 120), email: email ? email.toLowerCase() : null, phone: phone ? normPhone(phone) : null, source });
  }
  return rows;
}

/* ---------- data ---------- */
async function loadMyContacts(): Promise<Person[]> {
  const { data } = await (supabase as any).from("socialite_contacts").select("id, name, email, phone, source, last_sent_at").order("created_at", { ascending: false }).limit(5000);
  return (data || []).map((c: any) => ({ id: c.id, name: c.name || c.email || c.phone, first: (c.name || "").split(" ")[0], email: c.email, phone: c.phone, note: c.last_sent_at ? `last sent ${new Date(c.last_sent_at).toLocaleDateString()}` : c.source }));
}

/* ---------- contacts: add / upload ---------- */
function ContactsTools({ onChange }: { onChange: () => void }) {
  const [open, setOpen] = useState<"" | "add" | "upload">("");
  const [f, setF] = useState({ name: "", email: "", phone: "" });
  const [paste, setPaste] = useState("");
  const [note, setNote] = useState("");
  const file = useRef<HTMLInputElement>(null);

  const save = async (rows: ReturnType<typeof parseContacts>) => {
    if (!rows.length) { setNote("No emails or phone numbers found."); return; }
    setNote(`Saving ${rows.length}…`);
    for (let i = 0; i < rows.length; i += 500) {
      const { error } = await (supabase as any).from("socialite_contacts").insert(rows.slice(i, i + 500));
      if (error) { setNote("Couldn't save — make sure you're signed in."); return; }
    }
    setNote(`Added ${rows.length} contact${rows.length > 1 ? "s" : ""}.`); setPaste(""); setF({ name: "", email: "", phone: "" }); onChange();
  };
  const onFile = async (fl?: File | null) => { if (fl) save(parseContacts(await fl.text(), "upload")); };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        <button className={chip(open === "add")} onClick={() => setOpen(open === "add" ? "" : "add")}>Add contact</button>
        <button className={chip(open === "upload")} onClick={() => setOpen(open === "upload" ? "" : "upload")}>Upload in bulk</button>
      </div>
      {open === "add" && (
        <div className="grid sm:grid-cols-3 gap-2">
          <input className={input} placeholder="Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} />
          <input className={input} placeholder="Email" value={f.email} onChange={e => setF({ ...f, email: e.target.value })} />
          <input className={input} placeholder="Phone (+1…)" value={f.phone} onChange={e => setF({ ...f, phone: e.target.value })} />
          <button disabled={!f.email && !f.phone} onClick={() => save([{ name: f.name.trim(), email: f.email.trim().toLowerCase() || null, phone: f.phone ? normPhone(f.phone) : null, source: "manual" }])}
            className="sm:col-span-3 py-2 rounded-full bg-white text-black text-[12.5px] font-semibold disabled:opacity-40">Save contact</button>
        </div>
      )}
      {open === "upload" && (
        <div className="space-y-2">
          <div onClick={() => file.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); onFile(e.dataTransfer.files[0]); }}
            className="rounded-[14px] border border-dashed border-zinc-700 p-5 text-center cursor-pointer hover:border-zinc-500">
            <div className="text-[13px] text-zinc-200">Drop a file or click to choose</div>
            <div className="text-[11.5px] text-zinc-500 mt-1">CSV, TXT or vCard (.vcf) — columns like name, email, phone. Phone exports and exports from Google, Outlook, Facebook or Instagram tools work.</div>
          </div>
          <input ref={file} type="file" accept=".csv,.txt,.vcf,text/csv,text/vcard" className="hidden" onChange={e => onFile(e.target.files?.[0])} />
          <textarea className={input} rows={3} placeholder="…or paste: one contact per line, e.g. Jane Doe, jane@mail.com, +12395550100" value={paste} onChange={e => setPaste(e.target.value)} />
          <button disabled={!paste.trim()} onClick={() => save(parseContacts(paste, "paste"))} className="w-full py-2 rounded-full bg-white text-black text-[12.5px] font-semibold disabled:opacity-40">Import pasted contacts</button>
        </div>
      )}
      {note && <div className="text-[12px] text-zinc-400">{note}</div>}
    </div>
  );
}

/* ---------- composer ---------- */
function Composer({ channel, source, isOwner }: { channel: Channel; source: Source; isOwner: boolean }) {
  const [people, setPeople] = useState<Person[]>([]);
  const [q, setQ] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("A message for you");
  const [message, setMessage] = useState("");
  const [sign, setSign] = useState(isOwner);
  const [later, setLater] = useState(false);
  const [at, setAt] = useState("");
  const [tz, setTz] = useState(getSavedTz);
  const [busy, setBusy] = useState("");
  const [note, setNote] = useState("");

  const load = () => loadMyContacts().then(setPeople);
  useEffect(() => { setPicked(new Set()); load(); }, [source]);

  const reach = (p: Person) => (channel === "email" ? p.email : p.phone);
  const shown = useMemo(() => {
    const t = q.toLowerCase();
    return people.filter(p => reach(p) && (!t || `${p.name} ${p.email} ${p.phone} ${p.note}`.toLowerCase().includes(t))).slice(0, 500);
  }, [people, q, channel]);
  const toggle = (id: string) => setPicked(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const targets = people.filter(p => picked.has(p.id) && reach(p));
  const shield = useShieldPreview(channel === "calls" ? "sms" : channel as any, { text: message, subject, recipients: Math.min(targets.length, 200), timezone: tz, scheduled: later }, true);
  const body = (p?: Person) => { const m = message.replace(/\{first_name\}/g, p?.first || "there"); return sign && channel !== "email" && channel !== "calls" ? `${m}\n${SIGN}` : m; };
  const canSchedule = true; // every channel can be timed

  const removeSelected = async () => {
    if (!picked.size || !confirm(`Delete ${picked.size} contact(s)?`)) return;
    await (supabase as any).from("socialite_contacts").delete().in("id", [...picked]);
    setPicked(new Set()); load();
  };

  const send = async () => {
    if (!message.trim() || !targets.length) return;
    setNote("");
    if (later && canSchedule) {
      try {
        const res = await scheduleSend("contact", { channel: channel === "calls" ? "call" : channel, contact_ids: targets.slice(0, 200).map(p => p.id), subject, message: sign && channel !== "email" && channel !== "calls" ? `${message}\n${SIGN}` : message }, at, tz);
        setNote(`Scheduled ${Math.min(targets.length, 200)} for ${fmtIn(res.when, tz)} — see Calendar.`);
      } catch (e: any) { setNote(e.message); }
      return;
    }
    const verb = { email: "Email", sms: "Text", whatsapp: "WhatsApp", calls: "Call" }[channel];
    if (!confirm(`${verb} ${targets.length} contact(s)?`)) return;
    let ok = 0, failed = 0;
    try {
      for (let i = 0; i < targets.length; i += 200) {
        setBusy(`Sending ${Math.min(i + 200, targets.length)}/${targets.length}…`);
        const { data, error } = await supabase.functions.invoke("socialite-send", { body: { channel: channel === "calls" ? "call" : channel, contact_ids: targets.slice(i, i + 200).map(p => p.id), subject, message: sign && channel !== "email" && channel !== "calls" ? `${message}\n${SIGN}` : message } });
        if (error) { const sh = await shieldFromError(error); if (sh) { setNote(`Shield stopped this send: ${sh.blocks.map(b => `${b.message} ${b.fix}`).join(" · ")}`); setBusy(""); return; } throw error; }
        ok += data?.successful || 0; failed += data?.failed || 0;
      }
      setNote(`${ok} sent${failed ? ` · ${failed} failed` : ""}.`);
      load();
    } catch { setNote("Couldn't send right now. Please try again."); }
    setBusy("");
  };

  const len = body().length;
  return (
    <div className="grid lg:grid-cols-[1fr_400px] gap-5">
      <div className={`${card} p-5 space-y-4`}>
        <div className="flex items-center justify-between">
          <div className={label}>My contacts</div>
          <div className="text-[12px] text-zinc-500 mono">{picked.size} selected · {shown.length} shown</div>
        </div>
        {source === "contacts" && <ContactsTools onChange={load} />}
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, email or phone" className={input} />
        <div className="flex gap-4 text-[12px] text-zinc-500">
          <button className="hover:text-white" onClick={() => setPicked(new Set(shown.map(p => p.id)))}>Select all shown</button>
          <button className="hover:text-white" onClick={() => setPicked(new Set())}>Clear</button>
          {source === "contacts" && picked.size > 0 && <button className="hover:text-white ml-auto" onClick={removeSelected}>Delete selected</button>}
        </div>
        <div className="max-h-[520px] overflow-y-auto divide-y divide-zinc-900 -mx-2">
          {shown.length === 0 && <div className="text-[13px] text-zinc-500 py-10 text-center">
            {`No contacts with ${channel === "email" ? "an email" : "a phone number"} yet — add some or upload a file.`}
          </div>}
          {shown.map(p => (
            <label key={p.id} className={`flex items-center gap-3 py-2.5 px-2 rounded-[10px] cursor-pointer transition ${picked.has(p.id) ? "bg-zinc-900" : "hover:bg-zinc-900/50"}`}>
              <input type="checkbox" className="accent-white" checked={picked.has(p.id)} onChange={() => toggle(p.id)} />
              <div className="w-8 h-8 rounded-full bg-zinc-800 grid place-items-center text-[11px] font-semibold uppercase">{p.name.split(" ").map(s => s[0]).join("").slice(0, 2)}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] truncate">{p.name}</div>
                <div className="text-[11px] text-zinc-500 truncate">{p.note}</div>
              </div>
              <div className="text-[12px] mono text-zinc-500 truncate max-w-[180px]">{reach(p)}</div>
            </label>
          ))}
        </div>
      </div>

      <div className={`${card} p-5 space-y-4 h-fit`}>
        <div className={label}>{{ email: "Email", sms: "Text message", whatsapp: "WhatsApp message", calls: "Voice message" }[channel]}</div>
        <div className="flex flex-wrap gap-1.5">
          {QUICK.map(([l, t]) => <button key={l} className={chip(false)} onClick={() => setMessage(t)}>{l}</button>)}
          <button className={chip(false)} onClick={() => setMessage(m => m + "{first_name}")}>+ first name</button>
        </div>
        {channel === "email" && <input className={input} value={subject} onChange={e => setSubject(e.target.value)} placeholder="Subject" />}
        <textarea value={message} onChange={e => setMessage(e.target.value)} rows={8} className={input}
          placeholder={channel === "calls" ? "Read aloud on the call. Use {first_name}." : "Hi {first_name}, …"} />
        {isOwner && channel !== "email" && channel !== "calls" && (
          <label className="flex items-center gap-2 text-[12px] text-zinc-400"><input type="checkbox" className="accent-white" checked={sign} onChange={e => setSign(e.target.checked)} />Add signature</label>
        )}
        <ShieldNotice shield={shield} />
        <div className="text-[11px] text-zinc-500 mono">{len} chars{channel === "sms" ? ` · ${Math.max(1, Math.ceil(len / 160))} segment(s)` : ""}</div>
        {canSchedule && (
          <div className="space-y-2">
            <div className="flex gap-1.5">{([["Send now", false], ["Schedule", true]] as const).map(([l, v]) => <button key={l} className={chip(later === v)} onClick={() => setLater(v)}>{l}</button>)}</div>
            {later && <SendTimePicker value={at} onChange={setAt} tz={tz} onTzChange={setTz} />}
          </div>
        )}
        {note && <div className="text-[12px] text-zinc-400">{note}</div>}
        <button disabled={!!busy || !targets.length || !message.trim() || (later && canSchedule && !at)} onClick={send}
          className="w-full py-2.5 rounded-full bg-white text-black text-[13px] font-semibold disabled:opacity-40">
          {busy || (later && canSchedule ? "Schedule" : `${{ email: "Send email", sms: "Send texts", whatsapp: "Send WhatsApp", calls: "Start calls" }[channel]} · ${targets.length}`)}
        </button>
      </div>
    </div>
  );
}

export default function SocialiteMessaging({ isOwner = false }: { isOwner?: boolean }) {
  const [channel, setChannel] = useState<Channel>("email");
  const tabs = [
    { id: "email" as Channel, label: "Email", icon: Mail },
    { id: "sms" as Channel, label: "SMS", icon: MessageSquare },
    { id: "whatsapp" as Channel, label: "WhatsApp", icon: MessageCircle },
    { id: "calls" as Channel, label: "Calls", icon: PhoneCall },
  ];
  const src: Source = "contacts";
  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h1 className="text-[22px] font-semibold tracking-tight">Email · SMS · Calls</h1>
        <p className="text-[13px] text-zinc-500">Add or upload your contacts, then send emails, texts, WhatsApp messages and calls.</p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <div className="inline-flex p-1 rounded-full bg-zinc-900 border border-zinc-800">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setChannel(t.id)} className={`flex items-center gap-2 px-4 py-2 rounded-full text-[12.5px] font-medium transition ${channel === t.id ? "bg-white text-black" : "text-zinc-400 hover:text-white"}`}>
              <t.icon className="w-4 h-4" /> {t.label}
            </button>
          ))}
        </div>
      </div>
      <Composer key={`${channel}-${src}`} channel={channel} source={src} isOwner={isOwner} />
    </div>
  );
}
