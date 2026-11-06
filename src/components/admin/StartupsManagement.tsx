import { useState, useEffect, useRef } from 'react';
import { openDeckUrl, normalizeDeckUrl } from '@/lib/deckUrl';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  buildEquityContractHtml,
  DEFAULT_EQUITY_CONTRACT,
  embedContractValues,
  EquityContractValues,
} from '@/lib/equityContractTemplate';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { 
  Search, 
  Eye, 
  Star, 
  Building2,
  RefreshCw,
  Globe,
  DollarSign,
  Users,
  ExternalLink,
  MoreVertical,
  CheckCircle2,
  Clock,
  MapPin,
  TrendingUp,
  BarChart3,
  FileText,
  Rocket
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import ProfilePostsMosaic from '@/components/ProfilePostsMosaic';
import { getIndustryLabel } from '@/lib/constants';

interface Company {
  id: string;
  name: string;
  description: string | null;
  industry: string | null;
  stage: string | null;
  location: string | null;
  logo_url: string | null;
  website: string | null;
  funding_amount: number | null;
  team_size: number | null;
  founded_year: number | null;
  created_at: string;
  user_id: string;
  pitch_deck_url: string | null;
  looking_for: string[] | null;
  owner_name: string;
  owner_email: string | null;
  owner_avatar: string | null;
  journey_progress: {
    completed_steps: number;
    total_steps: number;
    current_step: number;
    percentage: number;
  };
}

interface RoadmapProgress {
  user_id: string;
  step_id: string;
  completed: boolean;
}

const STAGE_COLORS: Record<string, string> = {
  idea: '#4E7A73',
  mvp: '#00E5FF',
  seed: '#2EF8A0',
  series_a: '#FFB86A',
  series_b: '#00FFCC',
  series_c: '#7BC4B6',
  growth: '#FF8A3D'
};

const JOURNEY_STEPS = [
  'Idea Validation',
  'Market Research',
  'MVP Development',
  'User Validation',
  'Product Launch',
  'Get Customers, Sell & Grow',
  'Funding'
];


/**
 * The company's room contract panel (founder order, 2026-11-05): the
 * Accelerator Program Participation Agreement is created FROM the company,
 * with its custom terms entered here — company name, equity %, and total
 * raised come prefilled from the company record; every Schedule A figure is
 * set per startup. Creates a draft in the Contracts tab (source
 * "equity_contract"), ready to review and send from there.
 */
const CompanyContractForm = ({ company }: { company: Company }) => {
  const { toast } = useToast();
  const [values, setValues] = useState<EquityContractValues>(() => ({
    ...DEFAULT_EQUITY_CONTRACT,
    companyName: company.name || "",
    companyAddress: company.location || "",
    companyNoticeEmail: company.owner_email || "",
    companySignerName: company.owner_name || "",
    totalRaised: company.funding_amount ? String(company.funding_amount) : "",
    effectiveDate: new Date().toISOString().slice(0, 10),
  }));
  const [existing, setExisting] = useState<{ id: string; title: string; status: string; created_at: string }[]>([]);
  const [saving, setSaving] = useState(false);

  const set = (k: keyof EquityContractValues) => (val: string) =>
    setValues((prev) => ({ ...prev, [k]: val }));

  const loadExisting = async () => {
    // The company's contract library: every Accelerator contract for this
    // company — draft, sent blank, sent pre-filled, completed, signed — is a
    // sign_documents record; match it by the company's account OR by the
    // owner email it was sent to, so no contract lives only in an email.
    let query = supabase
      .from("sign_documents")
      .select("id, title, status, created_at")
      .eq("source_type", "equity_contract")
      .order("created_at", { ascending: false })
      .limit(10);
    query = company.owner_email
      ? query.or(`recipient_user_id.eq.${company.user_id},recipient_email.eq.${company.owner_email}`)
      : query.eq("recipient_user_id", company.user_id);
    const { data } = await query;
    setExisting((data || []) as typeof existing);
  };

  useEffect(() => {
    void loadExisting();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [company.id]);

  const createDraft = async () => {
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const title = `Accelerator Program Agreement — ${company.name}`;
      const html = embedContractValues(buildEquityContractHtml(values), values);
      const { error } = await supabase.from("sign_documents").insert({
        title,
        content_html: html,
        signer_message: "Please review and sign the Startup Factory Hub Accelerator Program Participation Agreement.",
        access_mode: "sign",
        status: "draft",
        recipient_name: company.owner_name || null,
        recipient_email: company.owner_email || null,
        recipient_user_id: company.user_id,
        owner_id: auth.user?.id,
        source_type: "equity_contract",
      });
      if (error) throw error;
      toast({ title: "Contract draft created", description: "Review and send it from Admin → Contracts." });
      void loadExisting();
    } catch (e) {
      toast({
        title: "Could not create the contract",
        description: e instanceof Error ? e.message : "Unknown error",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const moneyField = (label: string, k: keyof EquityContractValues) => (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input className="bg-white/[0.03] border-white/10" inputMode="numeric" value={values[k] as string} onChange={(e) => set(k)(e.target.value)} />
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">
        Accelerator Program Participation Agreement for this company. The custom terms below are
        entered here in the company's room and render into the agreement and its Schedule A —
        one milestone per agreement: the Phase One compensation appears automatically from the
        Phase 1 fundraising goal and is a flat fee, payable only when the milestone financing closes.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Effective date (admission)</Label>
          <Input className="bg-white/[0.03] border-white/10" type="date" value={values.effectiveDate} onChange={(e) => set("effectiveDate")(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Equity % (Section 2 right)</Label>
          <Input className="bg-white/[0.03] border-white/10" value={values.equityPercent} onChange={(e) => set("equityPercent")(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Total raised to date ($)</Label>
          <Input className="bg-white/[0.03] border-white/10" inputMode="numeric" value={values.totalRaised} onChange={(e) => set("totalRaised")(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Company notice email</Label>
          <Input className="bg-white/[0.03] border-white/10" type="email" value={values.companyNoticeEmail} onChange={(e) => set("companyNoticeEmail")(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Signatory name</Label>
          <Input className="bg-white/[0.03] border-white/10" value={values.companySignerName} onChange={(e) => set("companySignerName")(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Signatory title</Label>
          <Input className="bg-white/[0.03] border-white/10" value={values.companySignerTitle} onChange={(e) => set("companySignerTitle")(e.target.value)} placeholder="CEO" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs">Phase 1 fundraising goal ($)</Label>
          <Input
            className="bg-white/[0.03] border-white/10"
            inputMode="numeric"
            value={values.phase1Financing}
            onChange={(e) => {
              const goal = e.target.value;
              const n = parseFloat(goal.replace(/[^0-9.]/g, ""));
              setValues((prev) => ({
                ...prev,
                phase1Financing: goal,
                phase1Compensation:
                  Number.isFinite(n) && n > 0 ? String(Math.round(n * 0.05)) : prev.phase1Compensation,
              }));
            }}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs">Phase One compensation ($) — automatic</Label>
          <Input className="bg-white/[0.03] border-white/10" inputMode="numeric" value={values.phase1Compensation} disabled readOnly />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {values.officeAddonElected === "yes" ? (
          <div className="space-y-1.5">
            <Label className="text-xs">Payment method for the office plan</Label>
            <Input className="bg-white/[0.03] border-white/10" value={values.paymentMethod} onChange={(e) => set("paymentMethod")(e.target.value)} placeholder="Wire transfer" />
          </div>
        ) : (
          <div className="space-y-1.5">
            <Label className="text-xs">Payment method</Label>
            <p className="text-[11px] text-muted-foreground pt-1.5">
              Not collected — requested only when the office add-on is elected.
            </p>
          </div>
        )}
        <div className="space-y-1.5">
          <Label className="text-xs">Custom payment terms (optional)</Label>
          <Input className="bg-white/[0.03] border-white/10" value={values.customPaymentTerms} onChange={(e) => set("customPaymentTerms")(e.target.value)} />
        </div>
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            className="h-4 w-4 accent-emerald-500"
            checked={values.officeAddonElected === "yes"}
            onChange={(e) => set("officeAddonElected")(e.target.checked ? "yes" : "no")}
          />
          Unlimited Office Access — $950/month
        </label>
        {values.officeAddonElected === "yes" && (
          <div className="space-y-1.5">
            <Label className="text-xs">Add-on start date</Label>
            <Input className="bg-white/[0.03] border-white/10" type="date" value={values.officeAddonStart} onChange={(e) => set("officeAddonStart")(e.target.value)} />
          </div>
        )}
      </div>
      <Button onClick={() => void createDraft()} disabled={saving} className="w-full">
        <FileText className="h-4 w-4 mr-2" />
        {saving ? "Creating…" : "Create contract draft for this company"}
      </Button>
      {existing.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Contracts for this company</p>
          {existing.map((c) => (
            <div key={c.id} className="flex items-center justify-between rounded-md border border-white/10 bg-white/[0.02] px-3 py-2">
              <span className="text-sm truncate">{c.title}</span>
              <Badge variant="secondary">{c.status}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const StartupsManagement = () => {
  const { toast } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [stageFilter, setStageFilter] = useState<string>('all');
  const [industryFilter, setIndustryFilter] = useState<string>('all');
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [dialogTab, setDialogTab] = useState('overview');
  const isMounted = useRef(true);
  const companiesDebounce = useRef<NodeJS.Timeout | null>(null);
  const progressDebounce = useRef<NodeJS.Timeout | null>(null);
  const isFetching = useRef(false);

  useEffect(() => {
    isMounted.current = true;
    fetchCompanies();

    // Real-time subscription for companies
    const companiesChannel = supabase
      .channel('companies-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'companies' }, () => {
        if (companiesDebounce.current) clearTimeout(companiesDebounce.current);
        companiesDebounce.current = setTimeout(() => {
          if (isMounted.current) fetchCompanies();
        }, 100);
      })
      .subscribe();

    // Real-time subscription for roadmap progress
    const progressChannel = supabase
      .channel('roadmap-progress-admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'roadmap_progress' }, () => {
        if (progressDebounce.current) clearTimeout(progressDebounce.current);
        progressDebounce.current = setTimeout(() => {
          if (isMounted.current) fetchCompanies();
        }, 100);
      })
      .subscribe();

    return () => {
      isMounted.current = false;
      if (companiesDebounce.current) clearTimeout(companiesDebounce.current);
      if (progressDebounce.current) clearTimeout(progressDebounce.current);
      supabase.removeChannel(companiesChannel);
      supabase.removeChannel(progressChannel);
    };
  }, []);

  const fetchCompanies = async () => {
    if (!isMounted.current || isFetching.current) return;
    isFetching.current = true;
    setLoading(true);
    try {
      // Step 1: Fetch companies WITHOUT join (no FK relationship exists)
      const { data: companiesData, error: companiesError } = await supabase
        .from('companies')
        .select('*')
        .order('created_at', { ascending: false });

      if (companiesError) throw companiesError;

      // Step 2: Get user IDs and fetch profiles separately
      const userIds = companiesData?.map(c => c.user_id).filter(Boolean) || [];
      
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('user_id, full_name, email, avatar_url')
        .in('user_id', userIds.length > 0 ? userIds : ['none']);

      // Step 3: Create profiles map for quick lookup
      const profilesMap = new Map(
        (profilesData || []).map(p => [p.user_id, p])
      );

      // Step 4: Fetch roadmap progress for all users
      const { data: progressData, error: progressError } = await supabase
        .from('roadmap_progress')
        .select('*');

      if (progressError) throw progressError;

      // Map progress to companies - group by user_id
      const progressMap = new Map<string, RoadmapProgress[]>();
      (progressData || []).forEach((p: any) => {
        const existing = progressMap.get(p.user_id) || [];
        existing.push(p);
        progressMap.set(p.user_id, existing);
      });

      // Step 5: Merge companies with profiles and progress
      const companiesWithProgress = (companiesData || []).map((company: any) => {
        const profile = profilesMap.get(company.user_id);
        const progressRecords = progressMap.get(company.user_id) || [];
        const completedSteps = progressRecords.filter(p => p.completed).length;
        
        // Find first incomplete step for current_step. Positions follow the
        // Journey tab's DISPLAY order, whose step ids are 1,2,3,4,5,7,6 —
        // the merged customers step (id "7") is position 6 and Funding
        // (id "6") is the last step, position 7.
        const DISPLAY_ORDER_STEP_IDS = ['1', '2', '3', '4', '5', '7', '6'];
        let current_step = 1;
        for (let i = 0; i < DISPLAY_ORDER_STEP_IDS.length; i++) {
          const stepRecord = progressRecords.find(p => p.step_id === DISPLAY_ORDER_STEP_IDS[i]);
          if (!stepRecord || !stepRecord.completed) {
            current_step = i + 1;
            break;
          }
          if (i === DISPLAY_ORDER_STEP_IDS.length - 1 && stepRecord?.completed) current_step = 8; // All completed
        }

        return {
          ...company,
          owner_name: profile?.full_name || 'Unknown Owner',
          owner_email: profile?.email || null,
          owner_avatar: profile?.avatar_url || null,
          journey_progress: {
            completed_steps: completedSteps,
            total_steps: 7,
            current_step: Math.min(current_step, 7),
            percentage: Math.round((completedSteps / 7) * 100)
          }
        };
      });

      if (isMounted.current) {
        setCompanies(companiesWithProgress);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      toast({
        title: "Error",
        description: "Failed to fetch companies",
        variant: "destructive"
      });
    } finally {
      if (isMounted.current) setLoading(false);
      isFetching.current = false;
    }
  };

  const getStageBadgeColor = (stage: string | null) => {
    const colors: Record<string, string> = {
      idea: 'bg-[#4E7A73]/15 text-[#7BC4B6] border-[#4E7A73]/30',
      mvp: 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/30',
      seed: 'bg-[#2EF8A0]/15 text-[#2EF8A0] border-[#2EF8A0]/30',
      series_a: 'bg-[#FFB86A]/15 text-[#FFB86A] border-[#FFB86A]/30',
      series_b: 'bg-[#00FFCC]/15 text-[#00FFCC] border-[#00FFCC]/30',
      series_c: 'bg-[#7BC4B6]/15 text-[#7BC4B6] border-[#7BC4B6]/30',
      growth: 'bg-[#2EF8A0]/15 text-[#2EF8A0] border-[#2EF8A0]/30'
    };
    return colors[stage || ''] || 'bg-muted text-muted-foreground';
  };

  const getJourneyBadge = (progress: Company['journey_progress']) => {
    if (!progress) return <Badge variant="outline" className="bg-muted font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider">Not Started</Badge>;
    
    if (progress.completed_steps === 6) {
      return <Badge className="bg-[#2EF8A0]/15 text-[#2EF8A0] border-[#2EF8A0]/30 font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider">✓ Complete</Badge>;
    }
    if (progress.completed_steps === 0) {
      return <Badge variant="outline" className="bg-[#4E7A73]/15 text-[#7BC4B6] border-[#4E7A73]/30 font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider">Not Started</Badge>;
    }
    return (
      <Badge className="bg-[#FFB86A]/15 text-[#FFB86A] border-[#FFB86A]/30 font-['JetBrains_Mono'] uppercase text-[10px] tracking-wider">
        {progress.completed_steps}/6 Steps
      </Badge>
    );
  };

  const formatFunding = (amount: number | null) => {
    if (!amount) return 'N/A';
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  // Helper to format stage labels
  const formatStageLabel = (stage: string) => {
    const labels: Record<string, string> = {
      idea: 'Idea',
      mvp: 'MVP',
      seed: 'Seed',
      series_a: 'Series A',
      series_b: 'Series B',
      series_c: 'Series C',
      growth: 'Growth'
    };
    return labels[stage] || stage.charAt(0).toUpperCase() + stage.slice(1).replace(/_/g, ' ');
  };

  // Analytics data
  const industries = [...new Set(companies.map(c => c.industry).filter(Boolean))];
  const stages = [...new Set(companies.map(c => c.stage).filter(Boolean))];

  // Stage distribution with formatted labels
  const stageData = stages.map(stage => ({
    name: formatStageLabel(stage as string),
    value: companies.filter(c => c.stage === stage).length,
    color: STAGE_COLORS[stage || ''] || '#4E7A73'
  })).filter(d => d.value > 0);

  // Industry distribution with proper labels (top 6)
  const industryData = industries
    .map(industry => ({
      name: getIndustryLabel(industry as string),
      count: companies.filter(c => c.industry === industry).length
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Location distribution - deduplicate by trimming and aggregating
  const locationCounts: Record<string, number> = {};
  companies.forEach(c => {
    if (c.location) {
      const normalized = c.location.split(',')[0].trim();
      if (normalized) {
        locationCounts[normalized] = (locationCounts[normalized] || 0) + 1;
      }
    }
  });
  const locationData = Object.entries(locationCounts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  // Journey progress distribution with brighter colors
  const journeyCompleted = companies.filter(c => c.journey_progress?.completed_steps === 6).length;
  const journeyInProgress = companies.filter(c => 
    c.journey_progress && c.journey_progress.completed_steps > 0 && c.journey_progress.completed_steps < 6
  ).length;
  const journeyNotStarted = companies.filter(c => !c.journey_progress || c.journey_progress.completed_steps === 0).length;

  const journeyData = [
    { name: 'Completed', value: journeyCompleted, color: '#2EF8A0' },
    { name: 'In Progress', value: journeyInProgress, color: '#00E5FF' },
    { name: 'Not Started', value: journeyNotStarted, color: '#FFB86A' }
  ].filter(d => d.value > 0);

  // Journey step breakdown
  const stepBreakdown = JOURNEY_STEPS.map((step, i) => {
    const count = companies.filter(c => c.journey_progress?.current_step === i + 1).length;
    return { name: `Step ${i + 1}`, count, label: step };
  });

  const filteredCompanies = companies.filter(c => {
    const matchesSearch = !searchQuery || 
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStage = stageFilter === 'all' || c.stage === stageFilter;
    const matchesIndustry = industryFilter === 'all' || c.industry === industryFilter;
    return matchesSearch && matchesStage && matchesIndustry;
  });

  const handleViewCompany = (company: Company) => {
    setSelectedCompany(company);
    setDialogTab('overview');
    setShowDialog(true);
  };

  const handleFeatureCompany = async (company: Company) => {
    toast({
      title: "Featured",
      description: `${company.name} has been featured on the platform.`
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardContent className="p-4">
            <Building2 className="h-5 w-5 text-[#00E5FF] mb-2" />
            <p className="text-2xl font-bold font-['JetBrains_Mono']">{companies.length}</p>
            <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">Total Companies</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardContent className="p-4">
            <DollarSign className="h-5 w-5 text-[#2EF8A0] mb-2" />
            <p className="text-2xl font-bold font-['JetBrains_Mono']">
              {companies.reduce((sum, c) => sum + (c.funding_amount || 0), 0) > 0 
                ? formatFunding(companies.reduce((sum, c) => sum + (c.funding_amount || 0), 0))
                : '0'}
            </p>
            <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">Total Funding</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardContent className="p-4">
            <Users className="h-5 w-5 text-[#00E5FF] mb-2" />
            <p className="text-2xl font-bold font-['JetBrains_Mono']">
              {companies.reduce((sum, c) => sum + (c.team_size || 0), 0)}
            </p>
            <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">Total Team Members</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardContent className="p-4">
            <Globe className="h-5 w-5 text-[#00E5FF] mb-2" />
            <p className="text-2xl font-bold font-['JetBrains_Mono']">{industries.length}</p>
            <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">Industries</p>
          </CardContent>
        </Card>
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardContent className="p-4">
            <CheckCircle2 className="h-5 w-5 text-[#2EF8A0] mb-2" />
            <p className="text-2xl font-bold font-['JetBrains_Mono']">{journeyCompleted}</p>
            <p className="font-['JetBrains_Mono'] uppercase tracking-[0.18em] text-[10px] text-[#4E7A73]">Journey Completed</p>
          </CardContent>
        </Card>
      </div>

      {/* Demographics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stage Distribution */}
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 font-['Space_Grotesk'] tracking-wide">
              <TrendingUp className="h-4 w-4" />
              By Stage
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[180px]">
            {stageData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stageData}
                    cx="50%"
                    cy="50%"
                    innerRadius={30}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {stageData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value} startups`, name]}
                    contentStyle={{ background: '#0A1418', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No stage data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Industry Distribution */}
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 font-['Space_Grotesk'] tracking-wide">
              <BarChart3 className="h-4 w-4" />
              By Industry
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[180px]">
            {industryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={industryData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10 }} />
                  <Bar dataKey="count" fill="#00E5FF" radius={[0, 4, 4, 0]} />
                  <Tooltip 
                    formatter={(value: number) => [`${value} startups`]}
                    contentStyle={{ background: '#0A1418', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 12 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No industry data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Location Distribution */}
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 font-['Space_Grotesk'] tracking-wide">
              <MapPin className="h-4 w-4" />
              By Location
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[180px]">
            {locationData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={locationData} layout="vertical">
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" width={60} tick={{ fontSize: 10 }} />
                  <Bar dataKey="count" fill="#2EF8A0" radius={[0, 4, 4, 0]} />
                  <Tooltip 
                    formatter={(value: number) => [`${value} startups`]}
                    contentStyle={{ background: '#0A1418', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 12 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No location data
              </div>
            )}
          </CardContent>
        </Card>

        {/* Journey Progress */}
        <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2 font-['Space_Grotesk'] tracking-wide">
              <Rocket className="h-4 w-4" />
              Journey Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[180px]">
            {journeyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={journeyData}
                    cx="50%"
                    cy="45%"
                    innerRadius={25}
                    outerRadius={50}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {journeyData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number, name: string) => [`${value} startups`, name]}
                    contentStyle={{ background: '#0A1418', border: '1px solid rgba(0,229,255,0.25)', borderRadius: 4, fontFamily: 'JetBrains Mono', fontSize: 12 }}
                  />
                  <Legend 
                    verticalAlign="bottom"
                    height={28}
                    iconSize={10}
                    formatter={(value) => <span className="text-xs text-foreground">{value}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground text-sm">
                No journey data
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Journey Step Breakdown */}
      <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-['Space_Grotesk'] tracking-wide">Startups by Current Journey Step</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {stepBreakdown.map((step, i) => (
              <div key={i} className="p-3 rounded-lg bg-white/[0.03] text-center">
                <p className="text-xl font-bold font-['JetBrains_Mono']">{step.count}</p>
                <p className="text-xs text-muted-foreground">{step.name}</p>
                <p className="text-[10px] text-muted-foreground/70 truncate">{step.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-white/[0.03] border-white/10 focus:border-[#00E5FF]/50"
              />
            </div>
            <Select value={stageFilter} onValueChange={setStageFilter}>
              <SelectTrigger className="w-[150px] bg-white/[0.03] border-white/10">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map(stage => (
                  <SelectItem key={stage} value={stage || ''}>{stage}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={industryFilter} onValueChange={setIndustryFilter}>
              <SelectTrigger className="w-[150px] bg-white/[0.03] border-white/10">
                <SelectValue placeholder="Industry" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                {industries.map(industry => (
                  <SelectItem key={industry} value={industry || ''}>{industry}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={fetchCompanies} className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Companies Table */}
      <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-['Space_Grotesk'] tracking-wide">
            <Building2 className="h-5 w-5" />
            Companies ({filteredCompanies.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-white/[0.05]">
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Company</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Industry</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Stage</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Journey</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Funding</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Team</TableHead>
                  <TableHead className="font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Created</TableHead>
                  <TableHead className="text-right font-['JetBrains_Mono'] uppercase tracking-[0.14em] text-[10px] text-[#4E7A73]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCompanies.map((company) => (
                  <TableRow key={company.id} className="cursor-pointer hover:bg-white/[0.04]" onClick={() => handleViewCompany(company)}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={company.logo_url || ''} />
                          <AvatarFallback>{company.name?.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{company.name}</p>
                          <p className="text-xs text-muted-foreground">{company.location || 'No location'}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{company.industry || 'N/A'}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getStageBadgeColor(company.stage)}>
                        {company.stage || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {getJourneyBadge(company.journey_progress)}
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatFunding(company.funding_amount)}
                    </TableCell>
                    <TableCell>{company.team_size || 1}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {format(new Date(company.created_at), 'MMM dd, yyyy')}
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleViewCompany(company)}>
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleFeatureCompany(company)}>
                            <Star className="h-4 w-4 mr-2" />
                            Feature Company
                          </DropdownMenuItem>
                          {company.website && (
                            <DropdownMenuItem onClick={() => window.open(company.website!, '_blank')}>
                              <ExternalLink className="h-4 w-4 mr-2" />
                              Visit Website
                            </DropdownMenuItem>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Enhanced Company Detail Dialog with Tabs */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="bg-[#0A1418] border border-cyan-400/15 rounded-md !transition-none max-w-2xl max-h-[85vh]">
          <DialogHeader>
            {selectedCompany && (
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={selectedCompany.logo_url || ''} />
                  <AvatarFallback className="text-xl">{selectedCompany.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <DialogTitle className="text-xl font-['Space_Grotesk'] tracking-wide">{selectedCompany.name}</DialogTitle>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline">{selectedCompany.industry || 'N/A'}</Badge>
                    <Badge variant="outline" className={getStageBadgeColor(selectedCompany.stage)}>
                      {selectedCompany.stage || 'Unknown'}
                    </Badge>
                    {getJourneyBadge(selectedCompany.journey_progress)}
                  </div>
                </div>
              </div>
            )}
          </DialogHeader>

          {selectedCompany && (
            <Tabs value={dialogTab} onValueChange={setDialogTab} className="mt-4">
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="journey">Journey</TabsTrigger>
                <TabsTrigger value="posts">Posts</TabsTrigger>
                <TabsTrigger value="contract">Contract</TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[400px] mt-4">
                <TabsContent value="overview" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
                      <CardContent className="p-4 text-center">
                        <DollarSign className="h-5 w-5 mx-auto text-[#2EF8A0] mb-1" />
                        <p className="text-lg font-bold font-['JetBrains_Mono']">{formatFunding(selectedCompany.funding_amount)}</p>
                        <p className="text-xs text-muted-foreground">Funding Raised</p>
                      </CardContent>
                    </Card>
                    <Card className="bg-[#0A1418] border border-cyan-400/15 rounded-md">
                      <CardContent className="p-4 text-center">
                        <Users className="h-5 w-5 mx-auto text-[#00E5FF] mb-1" />
                        <p className="text-lg font-bold font-['JetBrains_Mono']">{selectedCompany.team_size || 1}</p>
                        <p className="text-xs text-muted-foreground">Team Members</p>
                      </CardContent>
                    </Card>
                  </div>

                  <div>
                    <h4 className="text-sm font-medium mb-2">Description</h4>
                    <p className="text-sm text-muted-foreground">
                      {selectedCompany.description || 'No description provided'}
                    </p>
                  </div>

                  {selectedCompany.looking_for && selectedCompany.looking_for.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Looking For</h4>
                      <div className="flex flex-wrap gap-2">
                        {selectedCompany.looking_for.map((item, i) => (
                          <Badge key={i} variant="secondary">{item}</Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="details" className="mt-0 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-medium">{selectedCompany.location || 'Not specified'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Founded</p>
                      <p className="font-medium">{selectedCompany.founded_year || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Website</p>
                      {selectedCompany.website ? (
                        <a href={selectedCompany.website} target="_blank" rel="noopener noreferrer" 
                          className="font-medium text-primary hover:underline flex items-center gap-1">
                          Visit Site <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <p className="font-medium">N/A</p>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Owner</p>
                      <p className="font-medium">
                        {selectedCompany.owner_name || 'Unknown'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Joined Platform</p>
                      <p className="font-medium">{format(new Date(selectedCompany.created_at), 'MMM dd, yyyy')}</p>
                    </div>
                  </div>

                  {selectedCompany.pitch_deck_url && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Pitch Deck</h4>
                      <Button variant="outline" size="sm" onClick={() => openDeckUrl(selectedCompany.pitch_deck_url!)}>
                        <FileText className="h-4 w-4 mr-2" />
                        View Pitch Deck
                      </Button>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="journey" className="mt-0 space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-medium">Journey Progress</h4>
                      <span className="text-sm font-bold text-primary">
                        {selectedCompany.journey_progress?.percentage || 0}%
                      </span>
                    </div>
                    <Progress value={selectedCompany.journey_progress?.percentage || 0} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {selectedCompany.journey_progress?.completed_steps || 0} of 7 steps completed
                    </p>
                  </div>

                  <div className="space-y-2">
                    {JOURNEY_STEPS.map((step, i) => {
                      const isCompleted = (selectedCompany.journey_progress?.completed_steps || 0) > i;
                      const isCurrent = selectedCompany.journey_progress?.current_step === i + 1;
                      
                      return (
                        <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${
                          isCompleted ? 'bg-[#2EF8A0]/10' : isCurrent ? 'bg-[#FFB86A]/10' : 'bg-white/[0.03]'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle2 className="h-5 w-5 text-[#2EF8A0]" />
                          ) : isCurrent ? (
                            <Clock className="h-5 w-5 text-[#FFB86A]" />
                          ) : (
                            <div className="h-5 w-5 rounded-full border-2 border-white/20" />
                          )}
                          <div>
                            <p className={`font-medium ${isCompleted ? 'text-[#2EF8A0]' : isCurrent ? 'text-[#FFB86A]' : 'text-muted-foreground'}`}>
                              Step {i + 1}: {step}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>

                <TabsContent value="posts" className="mt-0">
                  <ProfilePostsMosaic userId={selectedCompany.user_id} />
                </TabsContent>
                <TabsContent value="contract" className="mt-0">
                  <CompanyContractForm key={selectedCompany.id} company={selectedCompany} />
                </TabsContent>
              </ScrollArea>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StartupsManagement;