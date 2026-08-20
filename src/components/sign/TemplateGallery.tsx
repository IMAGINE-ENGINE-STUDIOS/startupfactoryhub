import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Eye, LayoutTemplate, Minus, Plus, Search } from "lucide-react";
import {
  SIGN_TEMPLATES,
  renderTemplate,
  type SignTemplate,
  type TemplateSigner,
} from "@/lib/signTemplates";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Called with the rendered document HTML + suggested title. */
  onUse: (payload: { html: string; title: string }) => void;
}

const MAX_SIGNERS = 8;

export default function TemplateGallery({ open, onOpenChange, onUse }: Props) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("All");
  const [selected, setSelected] = useState<SignTemplate | null>(null);
  const [signerCount, setSignerCount] = useState(2);

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(SIGN_TEMPLATES.map((t) => t.category)))],
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SIGN_TEMPLATES.filter(
      (t) =>
        (category === "All" || t.category === category) &&
        (!q || t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q)),
    );
  }, [query, category]);

  const signersFor = (t: SignTemplate): TemplateSigner[] => {
    const base = t.defaultSigners.length ? t.defaultSigners : [{ name: "", role: "" }];
    const out = [...base];
    while (out.length < signerCount) out.push({ name: "", role: "" });
    return out.slice(0, signerCount);
  };

  const pick = (t: SignTemplate) => {
    setSelected(t);
    setSignerCount(Math.max(1, t.defaultSigners.length || 1));
  };

  const use = (t: SignTemplate) => {
    onUse({ html: renderTemplate(t, {}, signersFor(t)), title: t.defaultTitle });
    onOpenChange(false);
    setSelected(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-background backdrop-blur-none max-h-[88vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LayoutTemplate className="h-5 w-5 text-primary" />
            Document templates
          </DialogTitle>
          <DialogDescription>
            Professional, ready-to-sign documents. Signature blocks are generated automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search templates..."
              className="pl-8"
            />
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs text-muted-foreground hidden sm:inline">Signers</span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSignerCount((n) => Math.max(1, n - 1))}
              disabled={signerCount <= 1}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-5 text-center font-semibold tabular-nums">{signerCount}</span>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9"
              onClick={() => setSignerCount((n) => Math.min(MAX_SIGNERS, n + 1))}
              disabled={signerCount >= MAX_SIGNERS}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => (
            <Button
              key={c}
              size="sm"
              variant={c === category ? "default" : "outline"}
              className="h-7 text-xs shrink-0"
              onClick={() => setCategory(c)}
            >
              {c}
            </Button>
          ))}
        </div>

        <ScrollArea className="flex-1 -mx-1 px-1">
          <div className="grid sm:grid-cols-2 gap-2 pb-2">
            {filtered.map((t) => (
              <div
                key={t.id}
                className="rounded-xl border border-border hover:border-primary/50 transition-colors p-3 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-sm font-semibold leading-tight">{t.name}</span>
                  <Badge variant="secondary" className="text-[10px] shrink-0">
                    {t.category}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground leading-snug flex-1">{t.description}</p>
                <div className="flex gap-1.5">
                  <Button size="sm" className="h-8 text-xs flex-1" onClick={() => use(t)}>
                    Use template
                  </Button>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8"
                    onClick={() => pick(t)}
                    title="Preview"
                  >
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-muted-foreground col-span-full py-6 text-center">
                No templates match your search.
              </p>
            )}
          </div>
        </ScrollArea>

        {selected && (
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-semibold">{selected.name} — preview</span>
              <Button size="sm" className="h-7 text-xs" onClick={() => use(selected)}>
                Use this
              </Button>
            </div>
            <div className="rounded-lg border border-border bg-white p-4 max-h-48 overflow-y-auto">
              <div
                className="text-[12px] text-[#111827]"
                dangerouslySetInnerHTML={{ __html: renderTemplate(selected, {}, signersFor(selected)) }}
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
