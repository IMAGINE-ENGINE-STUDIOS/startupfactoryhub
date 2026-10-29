/** "Send Times" — every timed post / email / SMS / WhatsApp waiting on the server, with cancel. */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { fmtIn } from "@/lib/socialite/sendTime";
import SocialiteAutopilot from "./SocialiteAutopilot";

type Row = { id: string; kind: string; payload: any; send_at: string; timezone: string; status: string; result: any };
const KIND: Record<string, string> = { post: "Social post", email: "Email", sms: "SMS", whatsapp: "WhatsApp" };

export default function SocialiteScheduled() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase as any).from("socialite_scheduled").select("*").order("send_at", { ascending: false }).limit(200);
    setRows(data ?? []); setLoading(false);
  }, []);
  useEffect(() => { load(); }, [load]);

  const cancel = async (id: string) => {
    await (supabase as any).from("socialite_scheduled").delete().eq("id", id).eq("status", "pending");
    load();
  };
  const summary = (r: Row) =>
    r.kind === "post" ? `${(r.payload?.platforms ?? []).join(", ")} — ${String(r.payload?.text ?? "").slice(0, 80)}`
    : r.kind === "email" ? `${r.payload?.custom_subject || r.payload?.template_name || "Campaign"} → ${r.payload?.client_ids?.length ? `${r.payload.client_ids.length} clients` : "all clients"}`
    : `${r.payload?.messages?.length ?? 0} recipients — ${String(r.payload?.messages?.[0]?.message ?? "").slice(0, 70)}`;

  return (
    <div className="p-4 lg:p-8 max-w-[960px] space-y-5">
      <SocialiteAutopilot />
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-[16px] font-semibold tracking-tight text-zinc-100">Timed sends</h2>
          <p className="text-[13px] text-zinc-500">Timed posts, emails and texts. They go out on their own, even with this page closed (within 5 minutes of the time set).</p>
        </div>
        <button onClick={load} className="px-3 py-2 rounded-full bg-zinc-900 text-zinc-300 text-[12px] flex items-center gap-1.5 hover:bg-zinc-800">Refresh</button>
      </div>
      {loading ? <div className="text-zinc-500 text-[13px] flex items-center gap-2">Loading…</div>
        : !rows.length ? <div className="rounded-2xl border border-zinc-800 p-8 text-center text-[13px] text-zinc-500">Nothing scheduled yet. Pick "Schedule" in Composer, Email, SMS or WhatsApp.</div>
        : (
          <div className="rounded-2xl border border-zinc-800 divide-y divide-zinc-800">
            {rows.map((r) => (
              <div key={r.id} className="p-4 flex items-center gap-4">
                <div className="w-28 shrink-0">
                  <div className="text-[12px] font-semibold text-zinc-200">{KIND[r.kind] ?? r.kind}</div>
                  <div className={`text-[11px] mono ${r.status === "sent" ? "text-emerald-400" : r.status === "failed" ? "text-amber-400" : "text-zinc-500"}`}>{r.status}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[13px] text-zinc-300 truncate">{summary(r)}</div>
                  <div className="text-[11px] text-zinc-500">{fmtIn(r.send_at, r.timezone)}{r.status === "failed" && r.result?.error ? ` · ${String(r.result.error).slice(0, 120)}` : ""}</div>
                </div>
                {r.status === "pending" && (
                  <button onClick={() => cancel(r.id)} aria-label="Cancel" className="px-3 h-9 rounded-full text-[12px] bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white">Cancel</button>
                )}
              </div>
            ))}
          </div>
        )}
    </div>
  );
}
