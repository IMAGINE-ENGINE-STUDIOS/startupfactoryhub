import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, XCircle, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function LinkedInReturn() {
  const [params] = useSearchParams();
  const status = params.get("status") === "success" ? "success" : "error";
  const scope = params.get("scope") === "org" ? "org" : "member";
  const message = params.get("message") || (status === "success" ? "Connected!" : "Connection failed.");
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    const type = scope === "org" ? `linkedin-org-${status}` : `linkedin-${status}`;
    try {
      window.opener?.postMessage({ type, message }, "*");
    } catch {
      /* opener unavailable */
    }
    if (status === "success") {
      setClosing(true);
      const t = window.setTimeout(() => window.close(), 2500);
      return () => window.clearTimeout(t);
    }
  }, [scope, status, message]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="tech-card border-0 rounded-2xl p-8 max-w-md w-full text-center space-y-4">
        <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
          <Linkedin className="h-7 w-7 text-primary" />
        </div>
        {status === "success" ? (
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
        ) : (
          <XCircle className="h-10 w-10 text-destructive mx-auto" />
        )}
        <h1 className="text-xl font-semibold">
          {status === "success"
            ? scope === "org"
              ? "Company Page Connected"
              : "LinkedIn Connected"
            : "LinkedIn Connection Failed"}
        </h1>
        <p className="text-sm text-muted-foreground break-words">{message}</p>
        <Button onClick={() => window.close()} className="w-full">
          {closing ? "Closing…" : "Close this window"}
        </Button>
      </div>
    </main>
  );
}
