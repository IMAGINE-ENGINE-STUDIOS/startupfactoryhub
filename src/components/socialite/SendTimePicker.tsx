/** Date + time + time zone picker shared by Composer, Email, SMS and WhatsApp. */
import { SEND_TIMEZONES, TZ_KEY, zonedToDate, fmtIn } from "@/lib/socialite/sendTime";

type Props = { value: string; onChange: (v: string) => void; tz: string; onTzChange: (tz: string) => void };

export default function SendTimePicker({ value, onChange, tz, onTzChange }: Props) {
  const when = value ? zonedToDate(value, tz) : null;
  const local = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return (
    <div className="space-y-1.5">
      <div className="flex flex-wrap gap-2">
        <input type="datetime-local" value={value} onChange={(e) => onChange(e.target.value)}
          className="flex-1 min-w-[200px] bg-[#0f0f10] border border-zinc-800 rounded-xl px-3 py-2.5 text-[13px] text-zinc-100 outline-none focus:border-zinc-600" />
        <select value={tz} onChange={(e) => { onTzChange(e.target.value); localStorage.setItem(TZ_KEY, e.target.value); }}
          aria-label="Time zone"
          className="bg-[#0f0f10] border border-zinc-800 rounded-xl px-3 py-2.5 text-[13px] text-zinc-100 outline-none focus:border-zinc-600">
          {SEND_TIMEZONES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>
      </div>
      {when && !isNaN(when.getTime()) && tz !== local && (
        <p className="text-[11px] text-zinc-500">That is {fmtIn(when, local)} your time.</p>
      )}
    </div>
  );
}
