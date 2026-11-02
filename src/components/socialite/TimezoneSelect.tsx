/** Compact time-zone picker used by Automation, Calendar and messaging. */
import { SEND_TIMEZONES, TZ_KEY } from "@/lib/socialite/sendTime";

export default function TimezoneSelect({ value, onChange }: { value: string; onChange: (tz: string) => void }) {
  return (
    <select value={value} aria-label="Time zone"
      onChange={(e) => { onChange(e.target.value); localStorage.setItem(TZ_KEY, e.target.value); }}
      className="bg-[#05201a] border border-cyan-400/15 rounded-full px-3 py-1.5 text-[12px] text-white outline-none focus:border-cyan-400/30">
      {SEND_TIMEZONES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
    </select>
  );
}
