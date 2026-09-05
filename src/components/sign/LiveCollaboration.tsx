import { History, PenLine, Radio, ShieldCheck, Users } from "lucide-react";
import type { LedgerEntry, LiveSignature, SignAccessMode } from "@/hooks/useLiveSignDocument";

const relative = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min} min ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h} h ago`;
  return new Date(iso).toLocaleDateString();
};

export const ACCESS_LABEL: Record<SignAccessMode, { title: string; help: string }> = {
  view: {
    title: "View only",
    help: "Anyone with the link can read this document. No edits, no signatures.",
  },
  sign: {
    title: "Sign only",
    help: "Anyone with the link can read and sign. The text stays locked.",
  },
  edit: {
    title: "Live editing + signing",
    help: "Everyone with the link edits the same live document and can sign it. Every change is logged.",
  },
};

export function AccessBadge({ mode }: { mode: SignAccessMode }) {
  const label = ACCESS_LABEL[mode];
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3 py-1">
      {mode === "edit" ? (
        <Radio className="h-3.5 w-3.5 text-primary animate-pulse" />
      ) : (
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
      )}
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em]">{label.title}</span>
    </div>
  );
}

export function LiveNotice({ message }: { message: string }) {
  return (
    <div className="sticky top-2 z-40 mb-3 flex items-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-3 py-2 backdrop-blur">
      <Radio className="h-4 w-4 text-primary animate-pulse shrink-0" />
      <span className="text-xs sm:text-sm font-medium">{message}</span>
    </div>
  );
}

export function SignatureStrip({
  signatures,
  onDelete,
}: {
  signatures: LiveSignature[];
  /** When provided (document owner), each signature can be erased. */
  onDelete?: (signature: LiveSignature) => void;
}) {
  if (signatures.length === 0) return null;
  return (
    <section className="tech-card border-0 rounded-2xl p-4 sm:p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">
          Signatures ({signatures.length})
        </h2>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {signatures.map((s) => (
          <div key={s.id} className="relative rounded-xl border border-border/50 bg-background/60 p-3">
            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(s)}
                title={`Erase the signature of ${s.signer_name}`}
                aria-label={`Erase the signature of ${s.signer_name}`}
                className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
            <img
              src={s.signature_data}
              alt={`Signature of ${s.signer_name}`}
              className="h-16 w-full object-contain"
            />
            <div className="mt-2 border-t border-border/50 pt-2">
              <p className="text-sm font-semibold truncate">{s.signer_name}</p>
              <p className="text-[11px] text-muted-foreground">
                Signed {relative(s.signed_at)}
              </p>
              {s.note && <p className="text-xs text-muted-foreground mt-1 italic">{s.note}</p>}
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}

export function ActivityLedger({ entries }: { entries: LedgerEntry[] }) {
  return (
    <section className="tech-card border-0 rounded-2xl p-4 sm:p-6 mt-6">
      <div className="flex items-center gap-2 mb-4">
        <History className="h-4 w-4 text-primary" />
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em]">Activity ledger</h2>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No activity yet. Every edit and signature will be recorded here with the author's name.
        </p>
      ) : (
        <ol className="space-y-3">
          {entries.map((e) => (
            <li key={e.id} className="flex items-start gap-3">
              <span className="mt-0.5 rounded-lg bg-primary/10 p-1.5 shrink-0">
                {e.action === "sign" ? (
                  <PenLine className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <History className="h-3.5 w-3.5 text-primary" />
                )}
              </span>
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{e.editor_name}</span>{" "}
                  {e.action === "sign" ? "signed the document" : "edited the document"}
                  {typeof e.chars_delta === "number" && e.action === "edit" && (
                    <span className="text-muted-foreground">
                      {" "}
                      ({e.chars_delta >= 0 ? "+" : ""}
                      {e.chars_delta} chars)
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">{relative(e.created_at)}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
