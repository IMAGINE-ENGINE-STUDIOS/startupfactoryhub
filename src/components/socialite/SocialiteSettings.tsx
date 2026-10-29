/**
 * SOCIALITE → Settings (every user). Profile, default time zone, composer
 * defaults, notifications, security and a plan summary. Values live in
 * pf_settings / pf_profile (cached, cloud-synced for the owner).
 */
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import TimezoneSelect from "./TimezoneSelect";
import { TZ_KEY } from "@/lib/socialite/sendTime";

const card = "rounded-[18px] border border-zinc-800 bg-[#161617] p-5 space-y-4";
const input = "bg-[#0f0f10] border border-zinc-800 rounded-lg px-3 py-2 text-[12.5px] text-zinc-100 outline-none focus:border-zinc-600 w-full";

const Row = ({ label, desc, on, set }: { label: string; desc: string; on: boolean; set: (v: boolean) => void }) => (
  <div className="flex items-center justify-between gap-4">
    <div><div className="text-[13px] font-medium">{label}</div><div className="text-[11px] text-zinc-500">{desc}</div></div>
    <button onClick={() => set(!on)} className={`w-9 h-5 rounded-full p-0.5 transition shrink-0 ${on ? "bg-white" : "bg-zinc-700"}`}><div className={`w-4 h-4 rounded-full bg-black transition ${on ? "translate-x-4" : ""}`} /></button>
  </div>
);

export default function SocialiteSettings({ settings, setSettings, profile, setProfile, toast, openBilling }: {
  settings: any; setSettings: (fn: (s: any) => any) => void;
  profile: { name: string; email: string; avatar: string }; setProfile: (p: any) => void;
  toast: (m: string, t?: "success" | "error") => void; openBilling: () => void;
}) {
  const [p, setP] = useState(profile);
  const [tz, setTz] = useState(() => localStorage.getItem(TZ_KEY) || Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [pw, setPw] = useState("");
  const set = (k: string) => (v: boolean) => setSettings((s: any) => ({ ...s, [k]: v }));

  const notify = async (v: boolean) => {
    if (v && "Notification" in window && Notification.permission !== "granted") {
      const r = await Notification.requestPermission();
      if (r !== "granted") return toast("Notifications are blocked in this browser", "error");
    }
    set("notifications")(v);
  };

  return (
    <div className="p-4 lg:p-8 max-w-[760px] space-y-5">
      <h1 className="text-[22px] font-semibold tracking-tight">Settings</h1>

      <div className={card}>
        <div className="text-[14px] font-semibold">Profile</div>
        <div className="grid sm:grid-cols-2 gap-3">
          <label className="text-[11px] text-zinc-500">Name<input className={input} value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} /></label>
          <label className="text-[11px] text-zinc-500">Reply email<input className={input} value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} /></label>
          <label className="text-[11px] text-zinc-500 sm:col-span-2">Photo link<input className={input} value={p.avatar} onChange={(e) => setP({ ...p, avatar: e.target.value })} /></label>
        </div>
        <button onClick={() => { setProfile(p); toast("Profile saved"); }} className="px-4 py-2 rounded-full bg-white text-black text-[12px] font-semibold">Save profile</button>
      </div>

      <div className={card}>
        <div className="text-[14px] font-semibold">Time & scheduling</div>
        <div className="flex items-center justify-between gap-4">
          <div><div className="text-[13px] font-medium">Default time zone</div><div className="text-[11px] text-zinc-500">Used by Composer, Calendar, Automation and scheduled sends</div></div>
          <TimezoneSelect value={tz} onChange={setTz} />
        </div>
        <Row label="Pick the best time automatically" desc="Suggests the slot that did best for you" on={!!settings.bestTimeAuto} set={set("bestTimeAuto")} />
        <Row label="Weekly repeat" desc="Offer weekly repeats when scheduling" on={!!settings.recurring} set={set("recurring")} />
      </div>

      <div className={card}>
        <div className="text-[14px] font-semibold">Composer defaults</div>
        <Row label="Adapt text per platform" desc="Shorten and adjust for each network's limits" on={!!settings.crossAdapt} set={set("crossAdapt")} />
        <Row label="Add hashtags" desc="Suggest hashtags while writing" on={!!settings.autoHashtags} set={set("autoHashtags")} />
        <Row label="Square crop for Instagram" desc="Crop pictures to fit Instagram" on={!!settings.igCrop} set={set("igCrop")} />
        <Row label="First comment" desc="Put hashtags in the first comment instead of the post" on={!!settings.firstComment} set={set("firstComment")} />
        <Row label="Frosted look" desc="Glass effect on cards" on={!!settings.glassmorphism} set={set("glassmorphism")} />
      </div>

      <div className={card}>
        <div className="text-[14px] font-semibold">Notifications</div>
        <Row label="Browser notifications" desc="Tell me when a post goes out or a send fails" on={!!settings.notifications} set={notify} />
        <Row label="Weekly summary email" desc="A short weekly results email" on={!!settings.weeklyDigest} set={set("weeklyDigest")} />
      </div>

      <div className={card}>
        <div className="text-[14px] font-semibold">Security</div>
        <div className="flex gap-2">
          <input type="password" autoComplete="new-password" className={input} placeholder="New password (8+ characters)" value={pw} onChange={(e) => setPw(e.target.value)} />
          <button disabled={pw.length < 8} onClick={async () => { const { error } = await supabase.auth.updateUser({ password: pw }); setPw(""); toast(error ? error.message : "Password changed", error ? "error" : "success"); }} className="px-4 py-2 rounded-full bg-white text-black text-[12px] font-semibold disabled:opacity-40 shrink-0">Change</button>
        </div>
        <button onClick={async () => { await supabase.auth.signOut({ scope: "global" }); window.location.reload(); }} className="px-4 py-2 rounded-full bg-zinc-900 border border-zinc-800 text-[12px] text-zinc-200">Sign out on every device</button>
      </div>

      <div className={card}>
        <div className="flex items-center justify-between">
          <div><div className="text-[14px] font-semibold">Plan & billing</div><div className="text-[11px] text-zinc-500">Your plan, usage and credits</div></div>
          <button onClick={openBilling} className="px-4 py-2 rounded-full bg-white text-black text-[12px] font-semibold">Open</button>
        </div>
      </div>
    </div>
  );
}
