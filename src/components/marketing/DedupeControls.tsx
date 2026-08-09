import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Save, ShieldCheck } from 'lucide-react';

interface Props {
  table: 'mvp_campaign_settings' | 'partners_campaign_settings';
  settingsId: string;
  lookbackPosts: number;
  windowDays: number;
  threshold: number;
  onSaved: () => void;
}

const WINDOWS = [7, 14, 30, 45, 60, 90, 180];

export default function DedupeControls({
  table,
  settingsId,
  lookbackPosts,
  windowDays,
  threshold,
  onSaved,
}: Props) {
  const [posts, setPosts] = useState(lookbackPosts ?? 12);
  const [days, setDays] = useState(windowDays ?? 45);
  const [limit, setLimit] = useState(Math.round((threshold ?? 0.62) * 100));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase
      .from(table)
      .update({
        dedupe_lookback_posts: posts,
        dedupe_window_days: days,
        similarity_threshold: limit / 100,
      })
      .eq('id', settingsId);
    setSaving(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Duplicate prevention updated');
    onSaved();
  };

  return (
    <div className="tech-card border-0 rounded-xl p-5 space-y-5">
      <div>
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.25em] text-primary">
          <ShieldCheck className="h-4 w-4" /> Duplicate Prevention
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          New copy is compared against recent posts from <strong>both</strong> campaigns. Anything
          above the similarity limit — or reusing the same opening line — is regenerated, and
          blocked from publishing if it still repeats.
        </p>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Compare against last N posts
          </Label>
          <Select value={String(posts)} onValueChange={(v) => setPosts(Number(v))}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background backdrop-blur-none">
              {[5, 8, 10, 12, 15, 20, 25, 30].map((n) => (
                <SelectItem key={n} value={String(n)}>
                  Last {n} posts (per campaign)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Repost blocking window
          </Label>
          <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
            <SelectTrigger className="bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background backdrop-blur-none">
              {WINDOWS.map((d) => (
                <SelectItem key={d} value={String(d)}>
                  {d} days
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Similarity limit
          </Label>
          <span className="text-sm font-semibold text-primary">{limit}%</span>
        </div>
        <Slider
          value={[limit]}
          min={30}
          max={95}
          step={1}
          onValueChange={(v) => setLimit(v[0])}
        />
        <p className="text-xs text-muted-foreground">
          Lower is stricter. Posts scoring at or above this against any post in the last {days} days
          are rejected.
        </p>
      </div>

      <Button onClick={save} disabled={saving} size="sm">
        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
        Save rules
      </Button>
    </div>
  );
}
