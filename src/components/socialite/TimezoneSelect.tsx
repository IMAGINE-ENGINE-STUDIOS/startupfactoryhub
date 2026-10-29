/** Compact time-zone picker used by Automation, Calendar and messaging. */
import { SEND_TIMEZONES, TZ_KEY } from "@/lib/socialite/sendTime";

export default function TimezoneSelect({ value, onChange }: { value: string; onChange: (tz: string) => void }) {
  return (
    <select value={value} aria-label="Time zone"
      onChange={(e) => { onChange(e.target.value); localStorage.setItem(TZ_KEY, e.target.value); }}
      className="bg-[#0f0f10] border border-zinc-800 rounded-full px-3 py-1.5 text-[12px] text-zinc-200 outline-none focus:border-zinc-600">
      {SEND_TIMEZONES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
    </select>
  );
}
