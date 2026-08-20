import { useState } from "react";
import { Globe, Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage, LANGUAGES } from "@/contexts/LanguageContext";

interface Props {
  html: string;
  onTranslated: (html: string | null) => void;
  translated: boolean;
  className?: string;
}

/** Language bar that machine-translates a document body while keeping its HTML structure. */
export default function DocumentLanguageBar({ html, onTranslated, translated, className }: Props) {
  const { language, t } = useLanguage();
  const [target, setTarget] = useState<string>(language === "en" ? "es" : language);
  const [busy, setBusy] = useState(false);

  const run = async () => {
    if (!html.trim()) return;
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("translate-document", {
      body: { html, targetLanguage: target },
    });
    setBusy(false);
    if (error || !data?.translated) {
      toast.error(data?.error || "Translation failed");
      return;
    }
    onTranslated(data.translated as string);
  };

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className ?? ""}`}>
      <Globe className="h-4 w-4 text-primary shrink-0" />
      <Select value={target} onValueChange={setTarget}>
        <SelectTrigger className="h-9 w-[170px] rounded-full bg-background backdrop-blur-none">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-background backdrop-blur-none max-h-[50vh]">
          {LANGUAGES.map((l) => (
            <SelectItem key={l.code} value={l.code}>
              {l.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button size="sm" variant="outline" className="rounded-full min-h-9" onClick={run} disabled={busy}>
        {busy ? (
          <>
            <Loader2 className="h-4 w-4 mr-1 animate-spin" /> {t("sign.view.translating")}
          </>
        ) : (
          t("sign.view.translate")
        )}
      </Button>
      {translated && (
        <Button
          size="sm"
          variant="ghost"
          className="rounded-full min-h-9"
          onClick={() => onTranslated(null)}
        >
          <RotateCcw className="h-4 w-4 mr-1" /> {t("sign.view.original")}
        </Button>
      )}
    </div>
  );
}
