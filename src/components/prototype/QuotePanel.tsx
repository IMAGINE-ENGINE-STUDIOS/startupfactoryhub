import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, Factory, Loader2, Send } from "lucide-react";
import type { PackageDesign } from "./bom";
import { behaviourSummary, buildBom, wiringSummary } from "./bom";

/*
 * Prototype Studio — manufacture step (Job 5). A valid design plus a
 * completed DVT/DFM readiness checklist becomes a quote request
 * routed into Startup Factory Hub, with the full design package
 * attached. Status stays visible here. (The manufacturing partners
 * who receive requests are named by the founder — until then every
 * request lands with the SFH team, which is stated honestly in the
 * panel copy.)
 */

export const DVT_DFM_CHECKS: Array<{ id: string; label: string }> = [
  { id: "valid", label: "Design passes the Studio's validity checks (power, voltages, pins)" },
  { id: "power", label: "Power budget reviewed — supply covers the full load with headroom" },
  { id: "enclosure", label: "Enclosure / physical form planned (the 3D Modeler can draft it from a photo)" },
  { id: "cabling", label: "Cables, connectors and mounting thought through for assembly" },
  { id: "behaviour", label: "Behaviour rules reviewed — the twin does what the product should do" },
  { id: "testing", label: "A test plan exists: how the first units get verified (DVT)" },
  { id: "certs", label: "Certifications considered for the target market (e.g. FCC / CE for radios)" },
  { id: "manufacturability", label: "Parts are standard and sourceable — nothing exotic or single-source without a reason (DFM)" },
];

interface QuoteRequest {
  id: string;
  project_name: string;
  quantity: number;
  status: string;
  created_at: string;
}

interface Props {
  projectId: string;
  projectName: string;
  design: PackageDesign;
  valid: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const quotesTable = () => (supabase as any).from("prototype_quote_requests");

export default function QuotePanel({ projectId, projectName, design, valid }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [checks, setChecks] = useState<Record<string, boolean>>({});
  const [quantity, setQuantity] = useState(10);
  const [targetDate, setTargetDate] = useState("");
  const [notes, setNotes] = useState("");
  const [email, setEmail] = useState("");
  const [sending, setSending] = useState(false);
  const [mine, setMine] = useState<QuoteRequest[]>([]);

  const loadMine = useCallback(async () => {
    if (!user) return;
    const { data } = await quotesTable()
      .select("id, project_name, quantity, status, created_at")
      .eq("user_id", user.id)
      .eq("project_id", projectId)
      .order("created_at", { ascending: false });
    if (data) setMine(data as QuoteRequest[]);
  }, [user, projectId]);

  useEffect(() => { loadMine(); }, [loadMine]);
  useEffect(() => { if (user?.email && !email) setEmail(user.email); }, [user, email]);

  const allChecked = DVT_DFM_CHECKS.every((c) => checks[c.id]);

  const submit = async () => {
    if (!user) return;
    setSending(true);
    const pkg = {
      bom: buildBom(design),
      wiring: wiringSummary(design),
      behaviours: behaviourSummary(design),
    };
    const { error } = await quotesTable().insert({
      user_id: user.id,
      project_id: projectId,
      project_name: projectName,
      contact_email: email.trim(),
      quantity,
      target_date: targetDate || null,
      notes: notes.trim() || null,
      checklist: checks,
      package: pkg,
      status: "submitted",
    });
    setSending(false);
    if (error) {
      toast({ title: "Couldn't send the request", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Quote request sent", description: "The SFH team has your design package — status will update here." });
    setNotes("");
    loadMine();
  };

  return (
    <div className="h-full overflow-y-auto pr-1">
      <div className="max-w-3xl mx-auto space-y-5 py-2">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Factory className="h-5 w-5 text-indigo-400" /> Take it to manufacture
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Requests route into Startup Factory Hub with your full design package (parts list, wiring,
            behaviours) attached. The SFH team reviews and brings manufacturing partners in — no
            partner is promised until one is named on your request.
          </p>
        </div>

        {!valid && (
          <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-xs">
            This design isn't valid yet — fix the issues on the Design tab first. Only valid designs
            can go to manufacture, so a quote is never priced on a broken design.
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
          <p className="text-sm font-medium">DVT / DFM readiness checklist</p>
          {DVT_DFM_CHECKS.map((c) => (
            <label key={c.id} className="flex items-start gap-2.5 text-sm cursor-pointer">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 accent-indigo-500"
                checked={!!checks[c.id]}
                onChange={(e) => setChecks((prev) => ({ ...prev, [c.id]: e.target.checked }))}
              />
              <span className={checks[c.id] ? "" : "text-muted-foreground"}>{c.label}</span>
            </label>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="text-xs font-medium text-muted-foreground">Quantity (first run)</label>
            <Input type="number" min={1} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Target date (optional)</label>
            <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} className="mt-1" />
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground">Contact email</label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground">Notes for the manufacturing team</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="mt-1 resize-none" placeholder="Materials, finish, markets you sell into, anything the quote depends on…" />
        </div>

        <Button onClick={submit} disabled={!valid || !allChecked || !email.trim() || sending} className="gap-2">
          {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Request a manufacture quote
        </Button>
        {valid && !allChecked && (
          <p className="text-xs text-muted-foreground -mt-3">Complete the checklist to send — every box is a question a manufacturer will ask anyway.</p>
        )}

        {mine.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm font-medium">Your requests for this project</p>
            {mine.map((q) => (
              <div key={q.id} className="rounded-xl border border-border px-3 py-2 flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="flex-1">{q.project_name} — {q.quantity} units</span>
                <span className="text-xs rounded-full border border-border px-2 py-0.5 capitalize">{q.status}</span>
                <span className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString([], { month: "short", day: "numeric" })}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
