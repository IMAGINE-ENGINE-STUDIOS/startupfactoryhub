// Public demo page: pick a demo role and try the live platform in an embedded window.
import { useState } from "react";
import { Check, Copy, ExternalLink, Loader2, Rocket, TrendingUp, GraduationCap, Lightbulb, BookOpen, Building2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const PASSWORD = "Demo123!";
const ROLES = [
  { id: "startup", label: "Startup", email: "demo-startup@startupfactoryhub.com", icon: Rocket },
  { id: "investor", label: "Investor", email: "demo-investor@startupfactoryhub.com", icon: TrendingUp },
  { id: "mentor", label: "Mentor", email: "demo-mentor@startupfactoryhub.com", icon: Lightbulb },
  { id: "advisor", label: "Advisor", email: "demo-advisor@startupfactoryhub.com", icon: BookOpen },
  { id: "student", label: "Student", email: "demo-student@startupfactoryhub.com", icon: GraduationCap },
  { id: "accelerator", label: "Accelerator", email: "demo-accelerator@startupfactoryhub.com", icon: Building2 },
  { id: "member", label: "Member", email: "demo-member@startupfactoryhub.com", icon: Users },
];

const demoUrl = (role: string) => `/auth?demo=${role}&redirect=${encodeURIComponent("/dashboard?tab=social")}`;

export default function DemoAccounts() {
  const [role, setRole] = useState("startup");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  const copy = async (value: string, id: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(id);
      setTimeout(() => setCopied(null), 1500);
    } catch { /* ignore */ }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-7xl mx-auto px-4 py-10 space-y-6">
        <header className="text-center space-y-2">
          <p className="font-mono text-xs uppercase tracking-[0.3em] text-primary">Live Demo Access</p>
          <h1 className="text-3xl sm:text-5xl font-black">Try Startup Factory Hub</h1>
          <p className="text-muted-foreground">Click a role to sign in instantly. All demo accounts use password <span className="font-mono font-bold text-foreground">{PASSWORD}</span></p>
        </header>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {ROLES.map((r) => {
            const Icon = r.icon;
            const active = r.id === role;
            return (
              <div
                key={r.id}
                role="button"
                tabIndex={0}
                onClick={() => { if (!active) { setLoading(true); setRole(r.id); } }}
                onKeyDown={(e) => e.key === "Enter" && !active && (setLoading(true), setRole(r.id))}
                className={`tech-card border-0 rounded-xl p-3 cursor-pointer transition-all hover:-translate-y-0.5 ${active ? "ring-2 ring-primary" : ""}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <Icon className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm">{r.label}</span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); copy(`${r.email}\n${PASSWORD}`, r.id); }}
                  className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground hover:text-foreground w-full"
                  title="Copy email and password"
                >
                  <span className="truncate">{r.email.replace("@startupfactoryhub.com", "@…")}</span>
                  {copied === r.id ? <Check className="h-3 w-3 shrink-0 text-primary" /> : <Copy className="h-3 w-3 shrink-0" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="tech-card border-0 rounded-2xl overflow-hidden">
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/50">
            <span className="font-mono text-xs uppercase tracking-[0.2em] text-primary">● Live session · {role}</span>
            <Button size="sm" variant="ghost" className="gap-1" onClick={() => window.open(demoUrl(role), "_blank")}>
              Open full screen <ExternalLink className="h-3.5 w-3.5" />
            </Button>
          </div>
          <div className="relative h-[75vh]">
            <iframe
              key={role}
              src={demoUrl(role)}
              title={`Startup Factory Hub demo (${role})`}
              onLoad={() => setLoading(false)}
              className="w-full h-full bg-background"
            />
            {loading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/90">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="font-mono text-xs uppercase tracking-widest text-muted-foreground">Signing in as {role}…</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
