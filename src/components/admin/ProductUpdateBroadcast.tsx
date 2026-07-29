import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Megaphone, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

/**
 * Compact admin control to broadcast the "What's New" product update email
 * in batches (default 100/day) via the send-product-update edge function.
 */
export function ProductUpdateBroadcast() {
  const { toast } = useToast();
  const [sending, setSending] = useState(false);
  const [offset, setOffset] = useState(0);
  const [limit, setLimit] = useState(100);
  const [testEmail, setTestEmail] = useState("");

  async function run(payload: Record<string, unknown>, label: string) {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-product-update", { body: payload });
      if (error) throw error;
      const sent = (data as any)?.sent ?? 0;
      const errors = (data as any)?.errors ?? 0;
      if ((data as any)?.nextOffset != null && !payload.testEmail) {
        setOffset((data as any).nextOffset);
      }
      toast({
        title: `${label} completado`,
        description: `${sent} enviados, ${errors} errores.`,
        variant: errors > 0 ? "destructive" : "default",
      });
    } catch (err: any) {
      toast({ title: "Error al enviar", description: err.message || "Error desconocido", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="tech-card border-0 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3">
      <div className="flex items-center gap-2 mr-auto">
        <Megaphone className="h-4 w-4 text-primary" />
        <div>
          <p className="text-sm font-semibold leading-tight">Product Update Broadcast</p>
          <p className="text-[11px] text-muted-foreground">Envía el resumen de novedades por lotes para no superar el límite diario</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Input
          type="email"
          placeholder="tu@email.com"
          value={testEmail}
          onChange={(e) => setTestEmail(e.target.value)}
          className="h-8 w-48 text-xs"
        />
        <Button
          size="sm"
          variant="outline"
          disabled={sending || !testEmail}
          onClick={() => run({ testEmail }, "Prueba")}
          className="gap-1.5"
        >
          <Send className="h-3.5 w-3.5" /> Prueba
        </Button>
      </div>

      <div className="flex items-center gap-2">
        <Label className="text-xs text-muted-foreground">Desde</Label>
        <Input
          type="number"
          value={offset}
          onChange={(e) => setOffset(Math.max(0, Number(e.target.value) || 0))}
          className="h-8 w-20 text-xs"
        />
        <Label className="text-xs text-muted-foreground">Cantidad</Label>
        <Input
          type="number"
          value={limit}
          onChange={(e) => setLimit(Math.min(500, Math.max(1, Number(e.target.value) || 1)))}
          className="h-8 w-20 text-xs"
        />
        <Badge variant="outline" className="text-[10px]">{offset}–{offset + limit - 1}</Badge>
        <Button
          size="sm"
          disabled={sending}
          onClick={() => {
            if (!window.confirm(`¿Enviar el email de novedades a los usuarios ${offset + 1}–${offset + limit}?`)) return;
            run({ offset, limit }, "Lote");
          }}
          className="gap-1.5"
        >
          {sending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          {sending ? "Enviando…" : "Enviar lote"}
        </Button>
      </div>
    </div>
  );
}

export default ProductUpdateBroadcast;
