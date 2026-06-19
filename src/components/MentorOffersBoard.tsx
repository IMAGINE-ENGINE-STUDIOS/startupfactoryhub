import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Send, Building, TrendingUp, Search, Sparkles, ArrowUpRight, Target, MapPin, SlidersHorizontal, Sparkle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { scoreCompanyForViewer } from '@/lib/startupMatching';

interface Startup {
  id: string;
  user_id: string;
  name: string;
  description: string;
  stage: string;
  industry: string;
  location?: string | null;
  funding_amount?: number | null;
  logo_url?: string;
  looking_for?: string[];
}

export default function MentorOffersBoard() {
  const [startups, setStartups] = useState<Startup[]>([]);
  const [mentorProfile, setMentorProfile] = useState<{ expertise_areas?: string[] | null } | null>(null);
  const [selectedStartup, setSelectedStartup] = useState<Startup | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [goals, setGoals] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [processingStartupId, setProcessingStartupId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [locationFilter, setLocationFilter] = useState<string>('all');
  const [matchLevel, setMatchLevel] = useState<number>(0);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) fetchStartups();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('mentor-offers-sync')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'mentorship_relationships',
        filter: `mentor_id=eq.${user.id}`,
      }, () => fetchStartups())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchStartups = async () => {
    if (!user) return;
    const { data: allCompanies, error } = await supabase
      .from('companies').select('*').order('created_at', { ascending: true }).limit(50);
    if (error || !allCompanies) return;
    const { data: existing } = await supabase
      .from('mentorship_relationships').select('mentee_id').eq('mentor_id', user.id);
    const taken = new Set((existing || []).map(r => r.mentee_id));
    setStartups(allCompanies.filter(c => c.user_id !== user.id && !taken.has(c.user_id)).slice(0, 20));
    const { data: mp } = await supabase
      .from('mentor_profiles').select('expertise_areas').eq('user_id', user.id).maybeSingle();
    setMentorProfile(mp || { expertise_areas: [] });
  };

  const offerMentorship = async () => {
    if (!user || !selectedStartup) return;
    setLoading(true);
    const { data: existing } = await supabase
      .from('mentorship_relationships').select('id, status')
      .eq('mentor_id', user.id).eq('mentee_id', selectedStartup.user_id).maybeSingle();
    if (existing) {
      toast({ title: 'Already Connected', description: 'A relationship already exists with this startup.', variant: 'destructive' });
      setLoading(false); return;
    }
    const { error } = await supabase.from('mentorship_relationships').insert({
      mentor_id: user.id, mentee_id: selectedStartup.user_id, status: 'pending', goals, notes,
    });
    if (error) {
      toast({ title: 'Error', description: 'Failed to send offer.', variant: 'destructive' });
      setLoading(false); return;
    }
    toast({ title: 'Offer Sent', description: `Your offer was sent to ${selectedStartup.name}` });
    setStartups(prev => prev.filter(s => s.id !== selectedStartup.id));
    setDialogOpen(false); setGoals(''); setNotes(''); setLoading(false); setProcessingStartupId(null);
  };

  const stages = Array.from(new Set(startups.map(s => s.stage).filter(Boolean)));
  const industries = useMemo(
    () => Array.from(new Set(startups.map(s => s.industry).filter(Boolean))).sort(),
    [startups]
  );
  const locations = useMemo(
    () => Array.from(new Set(startups.map(s => s.location).filter(Boolean) as string[])).sort(),
    [startups]
  );

  const scored = useMemo(() => startups.map(s => ({
    s,
    match: scoreCompanyForViewer('mentor', { expertise: mentorProfile?.expertise_areas || [] }, s).score,
  })), [startups, mentorProfile]);

  const filtered = scored.filter(({ s, match }) => {
    const matchesQ = !query || s.name.toLowerCase().includes(query.toLowerCase()) || s.industry?.toLowerCase().includes(query.toLowerCase());
    const matchesStage = stageFilter === 'all' || s.stage === stageFilter;
    const matchesIndustry = industryFilter === 'all' || s.industry === industryFilter;
    const matchesLocation = locationFilter === 'all' || s.location === locationFilter;
    const matchesScore = match >= matchLevel;
    return matchesQ && matchesStage && matchesIndustry && matchesLocation && matchesScore;
  });

  const activeFilterCount =
    (industryFilter !== 'all' ? 1 : 0) +
    (locationFilter !== 'all' ? 1 : 0) +
    (matchLevel > 0 ? 1 : 0);

  const clearAdvanced = () => {
    setIndustryFilter('all');
    setLocationFilter('all');
    setMatchLevel(0);
  };

  return (
    <>
      <div className="space-y-4">
        {/* Header strip */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 rounded-lg bg-primary/10 ring-1 ring-primary/20">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-semibold leading-tight">Startup Opportunities</h3>
              <p className="text-xs text-muted-foreground">{filtered.length} open to mentorship</p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-1 sm:flex-none sm:min-w-[320px]">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search startups…"
                className="h-8 pl-8 text-xs bg-background/40 backdrop-blur-xl border-white/10"
              />
            </div>
          </div>
        </div>

        {/* Stage filter chips */}
        {stages.length > 0 && (
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setStageFilter('all')}
              className={cn(
                'h-7 px-3 rounded-full text-[11px] font-medium border transition-all flex-shrink-0',
                stageFilter === 'all'
                  ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_16px_hsl(var(--primary)/0.35)]'
                  : 'bg-white/[0.03] border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20'
              )}
            >All</button>
            {stages.map(st => (
              <button
                key={st}
                onClick={() => setStageFilter(st)}
                className={cn(
                  'h-7 px-3 rounded-full text-[11px] font-medium border transition-all flex-shrink-0',
                  stageFilter === st
                    ? 'bg-primary text-primary-foreground border-primary shadow-[0_0_16px_hsl(var(--primary)/0.35)]'
                    : 'bg-white/[0.03] border-white/10 text-muted-foreground hover:text-foreground hover:border-white/20'
                )}
              >{st}</button>
            ))}
          </div>
        )}

        {/* Opportunity feed */}
        {filtered.length === 0 ? (
          <div className="text-center py-14 rounded-2xl border border-dashed border-white/10 bg-white/[0.02]">
            <div className="inline-flex p-3 rounded-xl bg-muted/30 mb-3">
              <Building className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No matching opportunities</p>
            <p className="text-xs text-muted-foreground mt-1">Try clearing filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filtered.map(({ s, match }) => (
              <article
                key={s.id}
                className="group relative overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl p-4 transition-all duration-300 hover:border-primary/40 hover:bg-white/[0.05] hover:-translate-y-0.5 hover:shadow-[0_8px_40px_-12px_hsl(var(--primary)/0.45)]"
              >
                {/* Glow accent */}
                <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-primary/10 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="relative flex items-start gap-3">
                  <Avatar className="h-11 w-11 rounded-xl ring-1 ring-white/10 group-hover:ring-primary/40 transition-all">
                    {s.logo_url && <AvatarImage src={s.logo_url} alt={s.name} className="rounded-xl" />}
                    <AvatarFallback className="rounded-xl bg-gradient-to-br from-primary/80 to-emerald-500/80 text-primary-foreground font-bold text-sm">
                      {s.name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-semibold text-sm truncate group-hover:text-primary transition-colors">{s.name}</h4>
                      <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:text-primary transition-all flex-shrink-0" />
                    </div>
                    <div className="flex flex-wrap items-center gap-1 mt-1">
                      {s.stage && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
                          <TrendingUp className="h-2.5 w-2.5" /> {s.stage}
                        </span>
                      )}
                      {s.industry && (
                        <>
                          <span className="text-muted-foreground/50 text-[10px]">·</span>
                          <span className="text-[10px] text-muted-foreground">{s.industry}</span>
                        </>
                      )}
                      {s.location && (
                        <>
                          <span className="text-muted-foreground/50 text-[10px]">·</span>
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-muted-foreground">
                            <MapPin className="h-2.5 w-2.5" /> {s.location}
                          </span>
                        </>
                      )}
                      {match > 0 && (
                        <span className={cn(
                          'ml-1 inline-flex items-center gap-0.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full border',
                          match >= 75 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : match >= 50 ? 'bg-primary/10 text-primary border-primary/30'
                            : 'bg-white/[0.04] text-muted-foreground border-white/10'
                        )}>
                          <Sparkle className="h-2.5 w-2.5" /> {match}%
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <p className="relative text-xs text-muted-foreground leading-relaxed mt-3 line-clamp-2">
                  {s.description || 'No description provided.'}
                </p>

                {s.looking_for && s.looking_for.length > 0 && (
                  <div className="relative flex items-center gap-1.5 mt-3 flex-wrap">
                    <Target className="h-3 w-3 text-muted-foreground" />
                    {s.looking_for.slice(0, 3).map((item, i) => (
                      <Badge key={i} variant="outline" className="h-5 px-1.5 text-[10px] font-normal border-white/10 bg-white/[0.02]">
                        {item}
                      </Badge>
                    ))}
                    {s.looking_for.length > 3 && (
                      <span className="text-[10px] text-muted-foreground">+{s.looking_for.length - 3}</span>
                    )}
                  </div>
                )}

                <div className="relative mt-3 pt-3 border-t border-white/[0.06] flex items-center justify-between gap-2">
                  <span className="text-[10px] text-muted-foreground">Open to mentorship</span>
                  <Button
                    onClick={() => { setProcessingStartupId(s.id); setSelectedStartup(s); setDialogOpen(true); }}
                    disabled={processingStartupId === s.id}
                    size="sm"
                    className="h-7 px-3 text-[11px] rounded-full bg-primary hover:bg-primary/90 shadow-[0_0_20px_hsl(var(--primary)/0.25)]"
                  >
                    <Send className="h-3 w-3 mr-1" />
                    Offer
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Offer Mentorship to {selectedStartup?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="goals">Mentorship Goals</Label>
              <Textarea id="goals" value={goals} onChange={(e) => setGoals(e.target.value)}
                placeholder="What do you hope to help them achieve?"
                className="mt-1 min-h-[100px]" />
            </div>
            <div>
              <Label htmlFor="notes">Your Message</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)}
                placeholder="Introduce yourself and explain why you'd be a good mentor…"
                className="mt-1 min-h-[100px]" />
            </div>
            <div className="flex space-x-3">
              <Button onClick={offerMentorship} disabled={loading || !goals.trim()} className="pulse-primary">
                {loading ? 'Sending...' : 'Send Offer'}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
