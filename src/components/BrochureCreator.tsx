import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { BookOpen, Loader2, Plus, ArrowUpRight } from "lucide-react";

/* Brochure Studio entry: create your own brochure at /b/:slug and open
   the ones you've made. The Studio editor itself lives on the brochure
   page (mounted in App) — owners edit and publish their own slugs. */

const STORE_KEY = "sfh-my-brochures";
const SUPA_URL = import.meta.env.VITE_SUPABASE_URL as string;

interface Mine {
  slug: string; // path form, e.g. "orbit-meals-pitch"
  name: string;
  createdAt: number;
}

const slugify = (name: string) =>
  name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);

function loadMine(): Mine[] {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    const list = raw ? (JSON.parse(raw) as Mine[]) : [];
    return Array.isArray(list) ? list.filter((m) => m && m.slug && m.name) : [];
  } catch {
    return [];
  }
}

export default function BrochureCreator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [name, setName] = useState("");
  const [mine, setMine] = useState<Mine[]>([]);
  const [checking, setChecking] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    setMine(loadMine());
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  const create = async () => {
    const slug = slugify(name);
    if (!slug) {
      toast({ title: "Name your brochure", description: "Use letters and numbers — e.g. “Orbit Meals Pitch Deck”.", variant: "destructive" });
      return;
    }
    setChecking(true);
    try {
      // The published doc for a slug is public — check who owns the name.
      const res = await fetch(`${SUPA_URL}/storage/v1/object/public/studio-published/brochures/b-${slug}.json?t=${Date.now()}`);
      if (res.ok) {
        const doc = await res.json().catch(() => null);
        if (doc?.by && userId && doc.by !== userId) {
          toast({ title: "That name is taken", description: "Another account already publishes a brochure with this name. Try a different one.", variant: "destructive" });
          return;
        }
      }
      const entry: Mine = { slug, name: name.trim(), createdAt: Date.now() };
      const next = [entry, ...loadMine().filter((m) => m.slug !== slug)];
      try { localStorage.setItem(STORE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
      setMine(next);
      navigate(`/b/${slug}`);
    } catch {
      toast({ title: "Couldn't check that name", description: "Check your connection and try again.", variant: "destructive" });
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto pr-1 space-y-6">
      <div className="rounded-2xl border border-border p-4 sm:p-5 space-y-3">
        <h3 className="font-semibold flex items-center gap-2">
          <Plus className="h-4 w-4 text-amber-500" /> Create a new brochure
        </h3>
        <p className="text-sm text-muted-foreground">
          Name it, and the Studio opens on your new brochure — blank pages, the full toolkit:
          layouts, text, images, backgrounds, even 3D models. Hit <strong>Publish</strong> there and
          your brochure is live at its own link, ready to share.
        </p>
        <div className="flex gap-2">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Orbit Meals — Investor Deck"
            onKeyDown={(e) => { if (e.key === "Enter") create(); }}
          />
          <Button onClick={create} disabled={checking || !name.trim()} className="gap-2 shrink-0">
            {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
            Create & open Studio
          </Button>
        </div>
        {name.trim() && (
          <p className="text-xs text-muted-foreground">
            Your link will be <span className="font-mono">startupfactoryhub.com/b/{slugify(name) || "…"}</span>
          </p>
        )}
      </div>

      <div>
        <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-muted-foreground mb-3">
          Your brochures
        </h3>
        {mine.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            None yet — your first brochure is one name away. Pitch decks, product brochures,
            event flyers: if it flips like a book, build it here.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {mine.map((m) => (
              <button
                key={m.slug}
                type="button"
                onClick={() => navigate(`/b/${m.slug}`)}
                className="text-left rounded-2xl border border-border p-4 hover:bg-muted/50 transition group"
              >
                <span className="font-medium flex items-center justify-between gap-2">
                  {m.name}
                  <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition" />
                </span>
                <span className="text-xs text-muted-foreground font-mono block mt-1">/b/{m.slug}</span>
                <span className="text-xs text-muted-foreground block">
                  Created {new Date(m.createdAt).toLocaleDateString()} · tap to open in the Studio
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
