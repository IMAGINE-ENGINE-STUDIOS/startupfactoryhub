import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Plug, Loader2, CheckCircle2, ExternalLink, Trash2, KeyRound, Link2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useIntegrations, type IntegrationProvider } from "./useIntegrations";

const PROVIDER_DESCRIPTIONS: Record<string, string> = {
  google_calendar: "Read and create events in your Google Calendar.",
  google_drive: "Browse and store files in your Google Drive.",
  slack: "Send messages and read channels in your Slack workspace.",
  notion: "Read and write pages in the Notion workspaces you grant.",
  canva: "Read your Canva designs and assets.",
  openai: "Use your own ChatGPT (OpenAI) API key for AI features.",
};

export default function IntegrationsSection() {
  const { providers, connections, isLoading, startOAuth, setApiKey, disconnect } = useIntegrations();
  const { toast } = useToast();
  const [params, setParams] = useSearchParams();
  const [apiKeyTarget, setApiKeyTarget] = useState<IntegrationProvider | null>(null);
  const [apiKeyValue, setApiKeyValue] = useState("");

  // Handle OAuth return state
  useEffect(() => {
    const status = params.get("integration");
    if (!status) return;
    const provider = params.get("provider") ?? "the provider";
    const message = params.get("message");
    if (status === "success") {
      toast({ title: "Connected", description: `${provider} is now linked to your account.` });
    } else {
      toast({
        title: "Connection failed",
        description: message ? `${provider}: ${message}` : `Could not connect ${provider}.`,
        variant: "destructive",
      });
    }
    params.delete("integration"); params.delete("provider"); params.delete("message");
    setParams(params, { replace: true });
  }, [params, setParams, toast]);

  const connectionFor = (id: string) => connections.find((c) => c.provider_id === id && c.status === "active");

  const handleConnect = async (p: IntegrationProvider) => {
    if (p.auth_type === "api_key") {
      setApiKeyTarget(p);
      setApiKeyValue("");
      return;
    }
    try { await startOAuth.mutateAsync(p.id); }
    catch (e: any) {
      toast({ title: "Cannot start connection", description: e.message ?? "Try again", variant: "destructive" });
    }
  };

  const submitApiKey = async () => {
    if (!apiKeyTarget) return;
    try {
      await setApiKey.mutateAsync({ provider_id: apiKeyTarget.id, api_key: apiKeyValue });
      toast({ title: "Connected", description: `${apiKeyTarget.name} is linked.` });
      setApiKeyTarget(null); setApiKeyValue("");
    } catch (e: any) {
      toast({ title: "Invalid key", description: e.message ?? "Could not verify the API key", variant: "destructive" });
    }
  };

  const handleDisconnect = async (id: string, name: string) => {
    try {
      await disconnect.mutateAsync(id);
      toast({ title: "Disconnected", description: `${name} removed.` });
    } catch (e: any) {
      toast({ title: "Could not disconnect", description: e.message, variant: "destructive" });
    }
  };

  return (
    <div className="mb-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
          <Plug className="h-5 w-5 text-primary" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold">Connected Apps</h2>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading integrations…
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {providers.map((p) => {
            const conn = connectionFor(p.id);
            const isApiKey = p.auth_type === "api_key";
            return (
              <Card key={p.id} className="tech-card border-0">
                <CardContent className="p-5 flex flex-col h-full min-h-[180px]">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-gradient-to-br from-primary/15 to-accent/15">
                        {isApiKey ? <KeyRound className="h-5 w-5 text-primary" /> : <Link2 className="h-5 w-5 text-primary" />}
                      </div>
                      <div>
                        <h3 className="font-semibold">{p.name}</h3>
                        <p className="text-xs text-muted-foreground capitalize">
                          {p.auth_type.replace("_", " ")}
                        </p>
                      </div>
                    </div>
                    {conn && (
                      <Badge variant="secondary" className="gap-1">
                        <CheckCircle2 className="h-3 w-3" /> Connected
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground flex-1">
                    {PROVIDER_DESCRIPTIONS[p.id] ?? "External integration."}
                  </p>
                  {conn?.account_label && (
                    <p className="text-xs mt-2 truncate text-foreground/80">
                      Account: <span className="font-mono">{conn.account_label}</span>
                    </p>
                  )}
                  <div className="flex gap-2 mt-4">
                    {conn ? (
                      <Button
                        variant="outline" size="sm" className="flex-1"
                        onClick={() => handleDisconnect(conn.id, p.name)}
                        disabled={disconnect.isPending}
                      >
                        <Trash2 className="h-4 w-4 mr-2" /> Disconnect
                      </Button>
                    ) : (
                      <Button
                        size="sm" className="flex-1"
                        onClick={() => handleConnect(p)}
                        disabled={startOAuth.isPending}
                      >
                        {startOAuth.isPending && startOAuth.variables === p.id
                          ? <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          : <Plug className="h-4 w-4 mr-2" />}
                        Connect
                      </Button>
                    )}
                    {p.docs_url && (
                      <Button asChild variant="ghost" size="icon" title="Provider docs">
                        <a href={p.docs_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!apiKeyTarget} onOpenChange={(open) => !open && setApiKeyTarget(null)}>
        <DialogContent className="tech-card border-0">
          <DialogHeader>
            <DialogTitle>Connect {apiKeyTarget?.name}</DialogTitle>
            <DialogDescription>
              Paste your API key. It's encrypted before being stored — only server-side functions can read it.
              {apiKeyTarget?.docs_url && (
                <>
                  {" "}
                  <a className="underline" href={apiKeyTarget.docs_url} target="_blank" rel="noreferrer">
                    Where to find your key
                  </a>
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <Input
            type="password"
            placeholder={apiKeyTarget?.id === "openai" ? "sk-..." : "API key"}
            value={apiKeyValue}
            onChange={(e) => setApiKeyValue(e.target.value)}
            autoComplete="off"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setApiKeyTarget(null)}>Cancel</Button>
            <Button onClick={submitApiKey} disabled={!apiKeyValue || setApiKey.isPending}>
              {setApiKey.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save & verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
