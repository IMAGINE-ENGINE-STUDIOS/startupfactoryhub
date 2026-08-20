import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { BookmarkPlus, Eye, Minus, Plus, Star, Trash2 } from "lucide-react";
import {
  SIGN_TEMPLATES,
  loadSavedTemplates,
  persistSavedTemplates,
  renderTemplate,
  type SavedTemplate,
  type SignTemplate,
  type TemplateSigner,
} from "@/lib/signTemplates";

interface Props {
  /** Emits the rendered HTML each time the composition changes. */
  onHtmlChange: (html: string) => void;
  /** Suggests a title when a template is selected and the title is empty. */
  onTitleSuggest: (title: string) => void;
}

const MAX_SIGNERS = 8;

export default function TemplateComposer({ onHtmlChange, onTitleSuggest }: Props) {
  const [templateId, setTemplateId] = useState<string>(SIGN_TEMPLATES[0].id);
  const [values, setValues] = useState<Record<string, string>>({});
  const [signers, setSigners] = useState<TemplateSigner[]>(SIGN_TEMPLATES[0].defaultSigners);
  const [saved, setSaved] = useState<SavedTemplate[]>(loadSavedTemplates);
  const [preview, setPreview] = useState(false);
  const [saveName, setSaveName] = useState("");

  const template = useMemo(
    () => SIGN_TEMPLATES.find((t) => t.id === templateId) ?? SIGN_TEMPLATES[0],
    [templateId],
  );

  const html = useMemo(() => renderTemplate(template, values, signers), [template, values, signers]);

  useEffect(() => {
    onHtmlChange(html);
  }, [html, onHtmlChange]);

  const pickTemplate = (t: SignTemplate) => {
    setTemplateId(t.id);
    const defaults: Record<string, string> = {};
    t.fields.forEach((f) => {
      if (f.defaultValue) defaults[f.key] = f.defaultValue;
    });
    setValues(defaults);
    setSigners(t.defaultSigners.length ? t.defaultSigners : [{ name: "", role: "" }]);
    onTitleSuggest(t.defaultTitle);
  };

  const applySaved = (s: SavedTemplate) => {
    setTemplateId(s.baseTemplateId);
    setValues(s.values);
    setSigners(s.signers);
    onTitleSuggest(s.title);
    toast.success(`Plantilla "${s.name}" cargada`);
  };

  const saveTemplate = () => {
    const name = saveName.trim();
    if (!name) return toast.error("Ponle un nombre a la plantilla");
    const entry: SavedTemplate = {
      id: crypto.randomUUID(),
      name,
      baseTemplateId: template.id,
      values,
      signers,
      title: template.defaultTitle,
      savedAt: new Date().toISOString(),
    };
    const next = [entry, ...saved];
    setSaved(next);
    persistSavedTemplates(next);
    setSaveName("");
    toast.success("Plantilla guardada para reutilizar");
  };

  const removeSaved = (id: string) => {
    const next = saved.filter((s) => s.id !== id);
    setSaved(next);
    persistSavedTemplates(next);
  };

  const setSignerCount = (count: number) => {
    const n = Math.min(MAX_SIGNERS, Math.max(1, count));
    setSigners((prev) => {
      if (n <= prev.length) return prev.slice(0, n);
      return [...prev, ...Array.from({ length: n - prev.length }, () => ({ name: "", role: "" }))];
    });
  };

  return (
    <div className="space-y-5">
      {/* Template gallery */}
      <div className="space-y-2">
        <Label>Plantilla</Label>
        <div className="grid sm:grid-cols-2 gap-2">
          {SIGN_TEMPLATES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => pickTemplate(t)}
              className={`text-left rounded-xl border p-3 transition-colors ${
                t.id === templateId
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/50"
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-sm font-medium leading-tight">{t.name}</span>
                <Badge variant="secondary" className="text-[10px] shrink-0">
                  {t.category}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground leading-snug">{t.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Saved templates */}
      {saved.length > 0 && (
        <div className="space-y-2">
          <Label className="flex items-center gap-1.5">
            <Star className="h-3.5 w-3.5 text-primary" /> Mis plantillas
          </Label>
          <div className="flex flex-wrap gap-2">
            {saved.map((s) => (
              <div
                key={s.id}
                className="flex items-center gap-1 rounded-full border border-border pl-3 pr-1 py-1"
              >
                <button
                  type="button"
                  className="text-xs font-medium"
                  onClick={() => applySaved(s)}
                >
                  {s.name}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeSaved(s.id)}
                >
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fields */}
      <div className="grid sm:grid-cols-2 gap-3">
        {template.fields.map((f) => (
          <div
            key={f.key}
            className={`space-y-1.5 ${f.type === "textarea" ? "sm:col-span-2" : ""}`}
          >
            <Label className="text-xs">{f.label}</Label>
            {f.type === "textarea" ? (
              <Textarea
                rows={4}
                value={values[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            ) : (
              <Input
                type={f.type === "date" ? "date" : "text"}
                value={values[f.key] ?? ""}
                placeholder={f.placeholder}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              />
            )}
          </div>
        ))}
      </div>

      {/* Signer count */}
      <div className="space-y-2.5 rounded-xl border border-border p-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <Label className="text-xs">¿Cuántas personas firman?</Label>
            <p className="text-[11px] text-muted-foreground">
              Los espacios de firma se crean automáticamente.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSignerCount(signers.length - 1)}
              disabled={signers.length <= 1}
            >
              <Minus className="h-3.5 w-3.5" />
            </Button>
            <span className="w-6 text-center font-semibold tabular-nums">{signers.length}</span>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setSignerCount(signers.length + 1)}
              disabled={signers.length >= MAX_SIGNERS}
            >
              <Plus className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          {signers.map((s, i) => (
            <div key={i} className="grid grid-cols-2 gap-2">
              <Input
                value={s.name}
                placeholder={`Nombre del firmante ${i + 1}`}
                onChange={(e) =>
                  setSigners((prev) =>
                    prev.map((x, idx) => (idx === i ? { ...x, name: e.target.value } : x)),
                  )
                }
              />
              <Input
                value={s.role}
                placeholder="Cargo (opcional)"
                onChange={(e) =>
                  setSigners((prev) =>
                    prev.map((x, idx) => (idx === i ? { ...x, role: e.target.value } : x)),
                  )
                }
              />
            </div>
          ))}
        </div>
      </div>

      {/* Save + preview */}
      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          value={saveName}
          onChange={(e) => setSaveName(e.target.value)}
          placeholder="Guardar como plantilla reutilizable..."
        />
        <Button type="button" variant="outline" onClick={saveTemplate} className="shrink-0">
          <BookmarkPlus className="h-4 w-4 mr-2" /> Guardar
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => setPreview((p) => !p)}
          className="shrink-0"
        >
          <Eye className="h-4 w-4 mr-2" /> {preview ? "Ocultar" : "Vista previa"}
        </Button>
      </div>

      {preview && (
        <div className="rounded-xl border border-border bg-white p-5 max-h-72 overflow-y-auto">
          <div
            className="text-[13px] text-[#111827]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      )}
    </div>
  );
}
