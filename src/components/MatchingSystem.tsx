import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, X, Users, Star, TrendingUp, Building, UserCheck, CheckCircle2, Compass, DollarSign, Clock, Globe, GraduationCap, Landmark, ScanLine, MessageCircle, User as UserIcon, Sparkles, CalendarClock } from 'lucide-react';
import UserProfileDialog from './UserProfileDialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import StartupBrowser from './StartupBrowser';
import NetworkBrowser from './NetworkBrowser';
import NetworkSearchEngine from './NetworkSearchEngine';
import InvestorDirectoryList from './InvestorDirectoryList';
import BusinessCardScannerDialog from './BusinessCardScannerDialog';
import { isVisibleCommunityName, isVisibleCommunityProfile } from '@/lib/networkProfileVisibility';

interface Match {
  id: string;
  name: string;
  role: string;
  description: string;
  industry: string;
  stage?: string;
  expertise?: string[];
  compatibility_score: number;
  avatar?: string;
  match_reasons: string[];
  funding_offered?: number;
  equity_percentage?: number;
  program_duration?: string;
  location?: string;
}

interface InvestorProfile {
  user_id: string;
  preferred_industries: string[] | null;
  preferred_stages: string[] | null;
  investment_range_min: number | null;
  investment_range_max: number | null;
  focus_industries: string[] | null;
}

interface Company {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  industry: string | null;
  stage: string | null;
  looking_for: string[] | null;
  funding_amount: number | null;
}

interface AcceleratorProfile {
  id: string;
  user_id: string;
  organization_name: string;
  description: string | null;
  industries_focus: string[] | null;
  funding_offered: number | null;
  equity_percentage: number | null;
  program_duration: string | null;
  is_accepting_applications: boolean | null;
  location: string | null;
  logo_url: string | null;
}

export default function MatchingSystem() {
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [mentorMatches, setMentorMatches] = useState<Match[]>([]);
  const [investorMatches, setInvestorMatches] = useState<Match[]>([]);
  const [startupMatches, setStartupMatches] = useState<Match[]>([]);
  const [acceleratorMatches, setAcceleratorMatches] = useState<Match[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [roleLoading, setRoleLoading] = useState(true);
  const [userCompany, setUserCompany] = useState<Company | null>(null);
  const [activeTab, setActiveTab] = useState('mentors');
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [userAcceleratorProfile, setUserAcceleratorProfile] = useState<AcceleratorProfile | null>(null);
  const [potentialMentors, setPotentialMentors] = useState<Match[]>([]);
  const [potentialInvestors, setPotentialInvestors] = useState<Match[]>([]);
  const [potentialAccelerators, setPotentialAccelerators] = useState<Match[]>([]);
  const [allUsers, setAllUsers] = useState<Match[]>([]);
  const [allStartups, setAllStartups] = useState<Match[]>([]);
  // Track requests already sent (persisted) and contacts the user passed on
  const [requestedIds, setRequestedIds] = useState<Set<string>>(new Set());
  const [passedIds, setPassedIds] = useState<Set<string>>(new Set());

  const markRequested = (id: string) => {
    setRequestedIds(prev => {
      const next = new Set(prev).add(id);
      if (user) try { localStorage.setItem(`sfh_requested_${user.id}`, JSON.stringify([...next])); } catch {}
      return next;
    });
  };

  const markPassed = (id: string) => {
    setPassedIds(prev => {
      const next = new Set(prev).add(id);
      if (user) try { localStorage.setItem(`sfh_passed_${user.id}`, JSON.stringify([...next])); } catch {}
      return next;
    });
  };
  const { user } = useAuth();
  const { toast } = useToast();
  const { notifyConnection, createNotification } = useNotifications();

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchUserProfile();
      fetchUserCompany();
      fetchConnections();
      fetchAllUsers();
      fetchAllStartups();
    }
  }, [user]);

  // Opens the member's personal booking page; if they have none, start a chat to propose a time
  const bookMeeting = async (memberId: string, name: string) => {
    const { data } = await supabase
      .from('calendar_booking_settings')
      .select('booking_slug')
      .eq('user_id', memberId)
      .maybeSingle();
    if (data?.booking_slug) {
      window.open(`/meet/${data.booking_slug}`, '_blank', 'noopener');
    } else {
      toast({ title: `${name} hasn't opened booking times yet`, description: 'A chat is opening so you can propose a time.' });
      window.dispatchEvent(new CustomEvent('openFloatingChat', { detail: { userId: memberId } }));
    }
  };

  const fetchAllUsers = async () => {
    if (!user) return;
    // Page through every registered profile (no 100-row cap)
    const profiles: any[] = [];
    for (let from = 0; ; from += 1000) {
      const { data } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, bio')
        .neq('user_id', user.id)
        .order('created_at', { ascending: true })
        .range(from, from + 999);
      if (!data || data.length === 0) break;
      profiles.push(...data);
      if (data.length < 1000) break;
    }
    if (!profiles.length) return;
    const userIds = profiles.map(p => p.user_id);
    const chunks: string[][] = [];
    for (let i = 0; i < userIds.length; i += 100) chunks.push(userIds.slice(i, i + 100));
    const [{ data: roles }, companyResults] = await Promise.all([
      // RLS on user_roles only exposes self → use security-definer RPC to get every user's role
      supabase.rpc('get_user_roles_batch', { user_ids: userIds }),
      Promise.all(chunks.map(ids => supabase.from('companies').select('user_id, name, industry').in('user_id', ids))),
    ]);
    const companies = companyResults.flatMap(r => r.data || []);
    const roleMap = new Map((roles || []).map((r: any) => [r.user_id, r.role]));
    const companyMap = new Map((companies || []).map(c => [c.user_id, c]));
    setAllUsers(profiles.filter(isVisibleCommunityProfile).map(p => {
      const r = (roleMap.get(p.user_id) || 'user') as string;
      const c = companyMap.get(p.user_id);
      return {
        id: p.user_id,
        name: p.full_name || 'Unknown',
        role: r,
        description: p.bio || '',
        industry: c?.industry || '',
        compatibility_score: 0,
        match_reasons: [],
        avatar: p.avatar_url || '',
      };
    }));
  };

  // Startups tab shows actual companies + legacy imported startups (not profiles)
  const fetchAllStartups = async () => {
    if (!user) return;
    const [{ data: companies }, { data: legacy }] = await Promise.all([
      supabase
        .from('companies')
        .select('id, user_id, name, description, industry, logo_url, location')
        .limit(100),
      supabase
        .from('legacy_imported_startups')
        .select('id, name, tagline, description, location, website, linked_company_id')
        .limit(200),
    ]);

    const companyMatches: Match[] = (companies || []).filter(c => isVisibleCommunityName(c.name)).map(c => ({
      id: c.user_id || `company-${c.id}`,
      name: c.name,
      role: 'startup',
      description: c.description || '',
      industry: c.industry || '',
      compatibility_score: 0,
      match_reasons: [],
      avatar: c.logo_url || '',
      location: c.location || undefined,
    }));

    // Exclude legacy rows already linked to a company (avoid duplicates)
    const legacyMatches: Match[] = (legacy || [])
      .filter(l => !l.linked_company_id && isVisibleCommunityName(l.name))
      .map(l => ({
        id: `legacy-${l.id}`,
        name: l.name,
        role: 'startup',
        description: l.description || l.tagline || '',
        industry: '',
        compatibility_score: 0,
        match_reasons: l.tagline ? [l.tagline] : [],
        avatar: '',
        location: l.location || undefined,
      }));

    setAllStartups([...companyMatches, ...legacyMatches]);
  };

  // Fetch accelerator profile when role is accelerator
  useEffect(() => {
    if (user && userRole === 'accelerator') {
      fetchUserAcceleratorProfile();
    }
  }, [user, userRole]);

  const fetchUserAcceleratorProfile = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('accelerator_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (!error && data) {
      setUserAcceleratorProfile(data);
    }
  };

  useEffect(() => {
    if (user && userRole !== null) {
      fetchMatches();
    }
  }, [user, userRole, userCompany]);

  // Fetch potential connections by role when no matches exist
  useEffect(() => {
    if (!user) return;
    if (mentorMatches.length === 0) fetchPotentialByRole('mentor', setPotentialMentors);
    if (investorMatches.length === 0) fetchPotentialByRole('investor', setPotentialInvestors);
    if (acceleratorMatches.length === 0) fetchPotentialAccelerators();
  }, [user, mentorMatches.length, investorMatches.length, acceleratorMatches.length]);

  const fetchPotentialByRole = async (role: string, setter: (m: Match[]) => void) => {
    if (!user) return;
    const { data: roleUsers } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', role as any)
      .neq('user_id', user.id)
      .limit(6);
    if (!roleUsers || roleUsers.length === 0) return;
    const userIds = roleUsers.map(r => r.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name, avatar_url, bio')
      .in('user_id', userIds);
    if (!profiles) return;
    const { data: companies } = await supabase
      .from('companies')
      .select('user_id, name, industry')
      .in('user_id', userIds);
    const companyMap = new Map((companies || []).map(c => [c.user_id, c]));
    setter(profiles.map(p => {
      const company = companyMap.get(p.user_id);
      return {
        id: p.user_id,
        name: p.full_name || 'Unknown',
        role,
        description: p.bio || '',
        industry: company?.industry || '',
        compatibility_score: 0,
        match_reasons: [],
        avatar: p.avatar_url || '',
      };
    }));
  };

  const fetchPotentialAccelerators = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('accelerator_profiles')
      .select('id, user_id, organization_name, description, logo_url, industries_focus, location')
      .limit(6);
    if (!data) return;
    setPotentialAccelerators(data.map(a => ({
      id: a.user_id,
      name: a.organization_name,
      role: 'accelerator',
      description: a.description || '',
      industry: (a.industries_focus || []).join(', '),
      compatibility_score: 0,
      match_reasons: [],
      avatar: a.logo_url || '',
      location: a.location || undefined,
    })));
  };

  const fetchUserRole = async () => {
    if (!user) {
      setRoleLoading(false);
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();
        
      if (!error && data) {
        setUserRole(data.role);
      }
    } finally {
      setRoleLoading(false);
    }
  };

  const fetchUserProfile = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return;
    }

    setUserProfile(data);
  };

  const fetchUserCompany = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!error && data) {
      setUserCompany(data);
    }
  };

  // Calculate investor-startup compatibility score
  const calculateInvestorStartupScore = (
    company: Company,
    investorProfile: InvestorProfile
  ): { score: number; reasons: string[] } => {
    let score = 40; // Base score
    const reasons: string[] = [];

    // Industry match (+25 points)
    const preferredIndustries = investorProfile.preferred_industries || investorProfile.focus_industries || [];
    if (company.industry && preferredIndustries.some(ind => 
      ind?.toLowerCase() === company.industry?.toLowerCase() ||
      company.industry?.toLowerCase().includes(ind?.toLowerCase()) ||
      ind?.toLowerCase().includes(company.industry?.toLowerCase())
    )) {
      score += 25;
      reasons.push(`Industry match: ${company.industry}`);
    }

    // Stage match (+25 points)
    const preferredStages = investorProfile.preferred_stages || [];
    if (company.stage && preferredStages.some(stage => 
      stage?.toLowerCase() === company.stage?.toLowerCase()
    )) {
      score += 25;
      reasons.push(`Stage match: ${company.stage}`);
    }

    // Looking for investor (+15 points)
    const lookingFor = company.looking_for || [];
    if (lookingFor.some(l => 
      l?.toLowerCase().includes('investor') || 
      l?.toLowerCase().includes('funding') ||
      l?.toLowerCase().includes('investment')
    )) {
      score += 15;
      reasons.push('Actively seeking investors');
    }

    // Funding range match (+15 points)
    const fundingAmount = company.funding_amount || 0;
    const minRange = investorProfile.investment_range_min || 0;
    const maxRange = investorProfile.investment_range_max || Infinity;
    if (fundingAmount >= minRange && fundingAmount <= maxRange) {
      score += 15;
      reasons.push('Within investment range');
    }

    return { score: Math.min(score, 100), reasons };
  };

  // Calculate startup-investor compatibility score
  const calculateStartupInvestorScore = (
    investorProfile: InvestorProfile & { full_name?: string; bio?: string; avatar_url?: string },
    company: Company
  ): { score: number; reasons: string[] } => {
    let score = 40; // Base score
    const reasons: string[] = [];

    // Investor's preferred industry matches startup's industry (+30 points)
    const preferredIndustries = investorProfile.preferred_industries || investorProfile.focus_industries || [];
    if (company.industry && preferredIndustries.some(ind => 
      ind?.toLowerCase() === company.industry?.toLowerCase() ||
      company.industry?.toLowerCase().includes(ind?.toLowerCase()) ||
      ind?.toLowerCase().includes(company.industry?.toLowerCase())
    )) {
      score += 30;
      reasons.push(`Invests in ${company.industry}`);
    }

    // Investor's preferred stage matches startup's stage (+30 points)
    const preferredStages = investorProfile.preferred_stages || [];
    if (company.stage && preferredStages.some(stage => 
      stage?.toLowerCase() === company.stage?.toLowerCase()
    )) {
      score += 30;
      reasons.push(`Invests in ${company.stage} stage`);
    }

    // Funding range compatibility (+20 points)
    const fundingAmount = company.funding_amount || 0;
    const minRange = investorProfile.investment_range_min || 0;
    const maxRange = investorProfile.investment_range_max || Infinity;
    if (fundingAmount >= minRange && fundingAmount <= maxRange) {
      score += 20;
      reasons.push('Investment range compatible');
    }

    return { score: Math.min(score, 100), reasons };
  };

  // Calculate mentor/advisor-startup compatibility score
  const calculateMentorStartupScore = (
    company: Company,
    mentorSkills: string[]
  ): { score: number; reasons: string[] } => {
    let score = 45; // Base score
    const reasons: string[] = [];

    // Looking for mentor/advisor (+30 points)
    const lookingFor = company.looking_for || [];
    if (lookingFor.some(l => 
      l?.toLowerCase().includes('mentor') || 
      l?.toLowerCase().includes('advisor') ||
      l?.toLowerCase().includes('guidance')
    )) {
      score += 30;
      reasons.push('Seeking mentorship');
    }

    // Industry/skill match (+25 points)
    if (company.industry && mentorSkills.some(skill => 
      skill?.toLowerCase().includes(company.industry?.toLowerCase()) ||
      company.industry?.toLowerCase().includes(skill?.toLowerCase())
    )) {
      score += 25;
      reasons.push(`Expertise in ${company.industry}`);
    }

    // Early stage preference (+15 points)
    const earlyStages = ['idea', 'pre-seed', 'seed', 'mvp'];
    if (company.stage && earlyStages.some(s => company.stage?.toLowerCase().includes(s))) {
      score += 15;
      reasons.push('Early-stage startup (ideal for mentoring)');
    }

    return { score: Math.min(score, 100), reasons };
  };

  // Calculate startup-mentor compatibility score
  const calculateStartupMentorScore = (
    mentorSkills: string[],
    company: Company
  ): { score: number; reasons: string[] } => {
    let score = 45; // Base score
    const reasons: string[] = [];

    // Startup is looking for mentor/advisor (+30 points)
    const lookingFor = company.looking_for || [];
    if (lookingFor.some(l => 
      l?.toLowerCase().includes('mentor') || 
      l?.toLowerCase().includes('advisor')
    )) {
      score += 30;
      reasons.push('You are seeking mentorship');
    }

    // Mentor has relevant industry skills (+30 points)
    if (company.industry && mentorSkills.some(skill => 
      skill?.toLowerCase().includes(company.industry?.toLowerCase()) ||
      company.industry?.toLowerCase().includes(skill?.toLowerCase())
    )) {
      score += 30;
      reasons.push(`Has ${company.industry} expertise`);
    }

    return { score: Math.min(score, 100), reasons };
  };

  // Calculate startup-accelerator compatibility score
  const calculateStartupAcceleratorScore = (
    accelerator: AcceleratorProfile,
    company: Company,
    hasActiveCohorts: boolean
  ): { score: number; reasons: string[] } => {
    let score = 35; // Base score
    const reasons: string[] = [];

    // Industry match (+25 points)
    const acceleratorIndustries = accelerator.industries_focus || [];
    if (company.industry && acceleratorIndustries.some(ind => 
      ind?.toLowerCase() === company.industry?.toLowerCase() ||
      company.industry?.toLowerCase().includes(ind?.toLowerCase()) ||
      ind?.toLowerCase().includes(company.industry?.toLowerCase())
    )) {
      score += 25;
      reasons.push(`Focuses on ${company.industry}`);
    }

    // Looking for accelerator/program (+20 points)
    const lookingFor = company.looking_for || [];
    if (lookingFor.some(l => 
      l?.toLowerCase().includes('accelerator') || 
      l?.toLowerCase().includes('program') ||
      l?.toLowerCase().includes('incubator')
    )) {
      score += 20;
      reasons.push('Seeking accelerator programs');
    }

    // Accepting applications (+15 points)
    if (accelerator.is_accepting_applications) {
      score += 15;
      reasons.push('Currently accepting applications');
    }

    // Has active cohorts (+10 points)
    if (hasActiveCohorts) {
      score += 10;
      reasons.push('Has active cohorts');
    }

    // Early stage preference (+15 points)
    const earlyStages = ['idea', 'pre-seed', 'seed', 'mvp'];
    if (company.stage && earlyStages.some(s => company.stage?.toLowerCase().includes(s))) {
      score += 15;
      reasons.push('Ideal stage for accelerator');
    }

    // Has funding (+5 points)
    if (accelerator.funding_offered && accelerator.funding_offered > 0) {
      score += 5;
      reasons.push(`Offers $${(accelerator.funding_offered / 1000).toFixed(0)}K funding`);
    }

    return { score: Math.min(score, 100), reasons };
  };

  // Calculate accelerator-mentor/advisor compatibility score based on industry and experience
  const calculateAcceleratorMentorScore = (
    acceleratorProfile: AcceleratorProfile,
    mentorSkills: { skill_name: string; category: string | null; endorsement_count: number | null }[],
    mentorExperiences: { title: string; company: string; start_date: string; end_date: string | null; is_current: boolean | null; description: string | null }[]
  ): { score: number; reasons: string[] } => {
    let score = 30; // Base score
    const reasons: string[] = [];

    const focusIndustries = acceleratorProfile.industries_focus || [];
    
    // Industry/skill match (+35 points) - mentor skills match accelerator's focus industries
    const matchingSkills = mentorSkills.filter(skill => 
      focusIndustries.some(ind => {
        const skillLower = skill.skill_name.toLowerCase();
        const indLower = ind.toLowerCase();
        return skillLower.includes(indLower) || indLower.includes(skillLower) ||
          // Also check category
          (skill.category && (skill.category.toLowerCase().includes(indLower) || indLower.includes(skill.category.toLowerCase())));
      })
    );
    
    if (matchingSkills.length > 0) {
      score += 35;
      reasons.push(`Expertise in ${matchingSkills[0].skill_name}`);
    }

    // Experience relevance (+25 points) - worked in startups/VC/accelerators
    const startupKeywords = ['startup', 'venture', 'accelerator', 'incubator', 'founder', 'ceo', 'cto', 'entrepreneur', 'vc', 'capital'];
    const relevantExperience = mentorExperiences.find(exp => {
      const titleLower = exp.title?.toLowerCase() || '';
      const companyLower = exp.company?.toLowerCase() || '';
      const descLower = exp.description?.toLowerCase() || '';
      return startupKeywords.some(keyword => 
        titleLower.includes(keyword) || companyLower.includes(keyword) || descLower.includes(keyword)
      );
    });
    
    if (relevantExperience) {
      score += 25;
      reasons.push(`Startup ecosystem experience at ${relevantExperience.company}`);
    }

    // Years of experience (+15 points)
    const totalYears = mentorExperiences.reduce((years, exp) => {
      const start = new Date(exp.start_date);
      const end = exp.end_date ? new Date(exp.end_date) : new Date();
      return years + ((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365));
    }, 0);
    
    if (totalYears >= 10) {
      score += 15;
      reasons.push(`${Math.floor(totalYears)}+ years experience`);
    } else if (totalYears >= 5) {
      score += 10;
      reasons.push(`${Math.floor(totalYears)} years experience`);
    }

    // High endorsements (+10 points)
    const totalEndorsements = mentorSkills.reduce((sum, s) => sum + (s.endorsement_count || 0), 0);
    if (totalEndorsements >= 10) {
      score += 10;
      reasons.push('Highly endorsed by peers');
    } else if (totalEndorsements >= 5) {
      score += 5;
      reasons.push('Endorsed by peers');
    }

    // Current role bonus (+5 points) - currently in leadership/advisory role
    const currentLeadership = mentorExperiences.find(exp => 
      exp.is_current && 
      ['advisor', 'mentor', 'director', 'partner', 'head', 'lead', 'chief', 'vp', 'president']
        .some(keyword => exp.title?.toLowerCase().includes(keyword))
    );
    if (currentLeadership) {
      score += 5;
      reasons.push(`Currently ${currentLeadership.title}`);
    }

    return { score: Math.min(score, 100), reasons };
  };

  const fetchMatches = async () => {
    if (!user) return;

    // Fetch ALL categories for ALL users so every tab has data
    // Each function fetches the respective role type (mentors, investors, accelerators, startups)
    await Promise.all([
      fetchMentorMatchesForStartup(),      // Fetch mentors/advisors
      fetchInvestorMatchesForStartup(),    // Fetch investors
      fetchAcceleratorMatchesForStartup(), // Fetch accelerators
      fetchStartupMatchesForInvestor(),    // Fetch startups
    ]);
  };

  const fetchMentorMatchesForStartup = async () => {
    if (!user) return;
    
    // Fetch advisor role IDs (excluding current user)
    const { data: advisorRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['advisor', 'mentor'])
      .neq('user_id', user.id)
      .limit(20);

    const advisorIds = advisorRoles?.map(r => r.user_id) || [];
    if (advisorIds.length === 0) return;

    // Fetch mentor profiles and their skills
    const [profilesResult, skillsResult] = await Promise.all([
      supabase.from('profiles').select('*').in('user_id', advisorIds),
      supabase.from('advisor_skills').select('user_id, skill_name').in('user_id', advisorIds)
    ]);

    const profiles = profilesResult.data || [];
    const skills = skillsResult.data || [];

    // Group skills by user
    const skillsByUser = new Map<string, string[]>();
    skills.forEach(s => {
      const existing = skillsByUser.get(s.user_id) || [];
      existing.push(s.skill_name);
      skillsByUser.set(s.user_id, existing);
    });

    // Calculate scores and create matches
    const matches: Match[] = profiles.map(mentor => {
      const mentorSkills = skillsByUser.get(mentor.user_id) || [];
      const { score, reasons } = userCompany 
        ? calculateStartupMentorScore(mentorSkills, userCompany)
        : { score: 50, reasons: ['Complete your startup profile for better matches'] };

      return {
        id: mentor.user_id,
        name: mentor.full_name || 'Anonymous Mentor',
        role: 'Mentor/Advisor',
        description: mentor.bio || 'Experienced mentor ready to guide your startup journey',
        industry: mentorSkills[0] || 'General',
        expertise: mentorSkills.slice(0, 5),
        compatibility_score: score,
        avatar: mentor.avatar_url,
        match_reasons: reasons.length > 0 ? reasons : ['Available for mentorship'],
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.compatibility_score - a.compatibility_score);
    setMentorMatches(matches.slice(0, 10));
  };

  // Fetch mentor/advisor matches for accelerators with industry and experience scoring
  const fetchMentorMatchesForAccelerator = async () => {
    if (!userAcceleratorProfile) {
      // If accelerator profile not loaded yet, use default scoring
      await fetchMentorMatchesForStartup();
      return;
    }

    // Fetch advisor/mentor role IDs (excluding current user)
    const { data: advisorRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['advisor', 'mentor'])
      .neq('user_id', user.id)
      .limit(30);

    const advisorIds = advisorRoles?.map(r => r.user_id) || [];
    if (advisorIds.length === 0) return;

    // Fetch mentor profiles, skills, and experiences in parallel
    const [profilesResult, skillsResult, experiencesResult] = await Promise.all([
      supabase.from('profiles').select('*').in('user_id', advisorIds),
      supabase.from('advisor_skills').select('user_id, skill_name, category, endorsement_count').in('user_id', advisorIds),
      supabase.from('advisor_experiences').select('user_id, title, company, start_date, end_date, is_current, description').in('user_id', advisorIds)
    ]);

    const profiles = profilesResult.data || [];
    const skills = skillsResult.data || [];
    const experiences = experiencesResult.data || [];

    // Group skills by user
    const skillsByUser = new Map<string, { skill_name: string; category: string | null; endorsement_count: number | null }[]>();
    skills.forEach(s => {
      const existing = skillsByUser.get(s.user_id) || [];
      existing.push({ skill_name: s.skill_name, category: s.category, endorsement_count: s.endorsement_count });
      skillsByUser.set(s.user_id, existing);
    });

    // Group experiences by user
    const experiencesByUser = new Map<string, { title: string; company: string; start_date: string; end_date: string | null; is_current: boolean | null; description: string | null }[]>();
    experiences.forEach(e => {
      const existing = experiencesByUser.get(e.user_id) || [];
      existing.push({
        title: e.title,
        company: e.company,
        start_date: e.start_date,
        end_date: e.end_date,
        is_current: e.is_current,
        description: e.description
      });
      experiencesByUser.set(e.user_id, existing);
    });

    // Calculate scores using accelerator-mentor scoring function
    const matches: Match[] = profiles.map(mentor => {
      const mentorSkills = skillsByUser.get(mentor.user_id) || [];
      const mentorExperiences = experiencesByUser.get(mentor.user_id) || [];
      
      const { score, reasons } = calculateAcceleratorMentorScore(
        userAcceleratorProfile,
        mentorSkills,
        mentorExperiences
      );

      // Get skill names for display
      const skillNames = mentorSkills.map(s => s.skill_name);

      return {
        id: mentor.user_id,
        name: mentor.full_name || 'Anonymous Mentor',
        role: 'Mentor/Advisor',
        description: mentor.bio || 'Experienced mentor ready to guide your startup journey',
        industry: skillNames[0] || 'General',
        expertise: skillNames.slice(0, 5),
        compatibility_score: score,
        avatar: mentor.avatar_url,
        match_reasons: reasons.length > 0 ? reasons : ['Available for mentorship'],
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.compatibility_score - a.compatibility_score);
    setMentorMatches(matches.slice(0, 15));
  };

  const fetchInvestorMatchesForStartup = async () => {
    if (!user) return;
    
    // Fetch investor role IDs (excluding current user)
    const { data: investorRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'investor')
      .neq('user_id', user.id)
      .limit(20);

    const investorIds = investorRoles?.map(r => r.user_id) || [];
    if (investorIds.length === 0) return;

    // Fetch investor profiles and user profiles
    const [investorProfilesResult, profilesResult] = await Promise.all([
      supabase.from('investor_profiles').select('*').in('user_id', investorIds),
      supabase.from('profiles').select('*').in('user_id', investorIds)
    ]);

    const investorProfiles = investorProfilesResult.data || [];
    const profiles = profilesResult.data || [];

    // Map profiles by user_id
    const profileMap = new Map(profiles.map(p => [p.user_id, p]));

    // Calculate scores and create matches
    const matches: Match[] = investorProfiles.map(investor => {
      const profile = profileMap.get(investor.user_id);
      const { score, reasons } = userCompany 
        ? calculateStartupInvestorScore(investor, userCompany)
        : { score: 50, reasons: ['Complete your startup profile for better matches'] };

      return {
        id: investor.user_id,
        name: profile?.full_name || 'Anonymous Investor',
        role: 'Investor',
        description: profile?.bio || 'Looking for promising startups to invest in',
        industry: investor.preferred_industries?.[0] || investor.focus_industries?.[0] || 'General',
        expertise: investor.preferred_industries || investor.focus_industries || [],
        stage: investor.preferred_stages?.[0],
        compatibility_score: score,
        avatar: profile?.avatar_url,
        match_reasons: reasons.length > 0 ? reasons : ['Active investor'],
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.compatibility_score - a.compatibility_score);
    setInvestorMatches(matches.slice(0, 10));
  };

  const fetchAcceleratorMatchesForStartup = async () => {
    if (!user) return;
    
    // Fetch all accelerator profiles (excluding current user)
    const { data: acceleratorProfiles } = await supabase
      .from('accelerator_profiles')
      .select('*')
      .neq('user_id', user.id)
      .limit(20);

    if (!acceleratorProfiles || acceleratorProfiles.length === 0) return;

    // Fetch active cohorts for each accelerator
    const acceleratorIds = acceleratorProfiles.map(a => a.id);
    const { data: cohorts } = await supabase
      .from('accelerator_cohorts')
      .select('accelerator_id, status')
      .in('accelerator_id', acceleratorIds)
      .in('status', ['applications_open', 'in_progress']);

    // Group cohorts by accelerator
    const cohortsByAccelerator = new Map<string, boolean>();
    cohorts?.forEach(c => {
      cohortsByAccelerator.set(c.accelerator_id, true);
    });

    // Calculate scores and create matches
    const matches: Match[] = acceleratorProfiles.map(accelerator => {
      const hasActiveCohorts = cohortsByAccelerator.get(accelerator.id) || false;
      const { score, reasons } = userCompany 
        ? calculateStartupAcceleratorScore(accelerator, userCompany, hasActiveCohorts)
        : { score: 50, reasons: ['Complete your startup profile for better matches'] };

      return {
        id: accelerator.user_id,
        name: accelerator.organization_name,
        role: 'Accelerator',
        description: accelerator.description || 'Accelerator program helping startups grow',
        industry: accelerator.industries_focus?.[0] || 'General',
        expertise: accelerator.industries_focus || [],
        compatibility_score: score,
        avatar: accelerator.logo_url,
        match_reasons: reasons.length > 0 ? reasons : ['Open to applications'],
        funding_offered: accelerator.funding_offered,
        equity_percentage: accelerator.equity_percentage,
        program_duration: accelerator.program_duration,
        location: accelerator.location,
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.compatibility_score - a.compatibility_score);
    setAcceleratorMatches(matches.slice(0, 10));
  };

  const fetchStartupMatchesForInvestor = async () => {
    if (!user) return;

    // First, get user IDs that have 'startup' role (excluding current user)
    const { data: startupRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'startup')
      .neq('user_id', user.id)
      .limit(50);

    const startupUserIds = startupRoles?.map(r => r.user_id) || [];
    if (startupUserIds.length === 0) {
      setStartupMatches([]);
      return;
    }

    // Fetch investor's profile for matching criteria
    const { data: investorProfile } = await supabase
      .from('investor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Fetch companies ONLY for users with startup role
    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .in('user_id', startupUserIds)
      .limit(30);

    if (!companies || companies.length === 0) {
      setStartupMatches([]);
      return;
    }

    // Get profile info for each startup
    const startupIds = companies.map(c => c.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, avatar_url')
      .in('user_id', startupIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Calculate scores and create matches (use company logo for startups)
    const matches: Match[] = companies.map(company => {
      const { score, reasons } = investorProfile
        ? calculateInvestorStartupScore(company, investorProfile)
        : { score: 50, reasons: ['Complete your investor profile for better matches'] };

      return {
        id: company.user_id,
        name: company.name,
        role: 'Startup',
        description: company.description || 'Innovative startup seeking growth',
        industry: company.industry || 'General',
        stage: company.stage,
        avatar: company.logo_url || profileMap.get(company.user_id)?.avatar_url,
        compatibility_score: score,
        match_reasons: reasons.length > 0 ? reasons : ['Available for investment'],
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.compatibility_score - a.compatibility_score);
    setStartupMatches(matches.slice(0, 15));
  };

  const fetchStartupMatchesForMentor = async () => {
    if (!user) return;

    // First, get user IDs that have 'startup' role (excluding current user)
    const { data: startupRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'startup')
      .neq('user_id', user.id)
      .limit(50);

    const startupUserIds = startupRoles?.map(r => r.user_id) || [];
    if (startupUserIds.length === 0) {
      setStartupMatches([]);
      return;
    }

    // Fetch mentor's skills
    const { data: mentorSkills } = await supabase
      .from('advisor_skills')
      .select('skill_name')
      .eq('user_id', user.id);

    const skills = mentorSkills?.map(s => s.skill_name) || [];

    // Fetch companies ONLY for users with startup role
    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .in('user_id', startupUserIds)
      .limit(30);

    if (!companies || companies.length === 0) {
      setStartupMatches([]);
      return;
    }

    // Get profile info for each startup
    const startupIds = companies.map(c => c.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, avatar_url')
      .in('user_id', startupIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Calculate scores and create matches (use company logo for startups)
    const matches: Match[] = companies.map(company => {
      const { score, reasons } = calculateMentorStartupScore(company, skills);

      return {
        id: company.user_id,
        name: company.name,
        role: 'Startup',
        description: company.description || 'Innovative startup seeking guidance',
        industry: company.industry || 'General',
        stage: company.stage,
        avatar: company.logo_url || profileMap.get(company.user_id)?.avatar_url,
        compatibility_score: score,
        match_reasons: reasons.length > 0 ? reasons : ['Open to mentorship'],
      };
    });

    // Sort by score descending
    matches.sort((a, b) => b.compatibility_score - a.compatibility_score);
    setStartupMatches(matches.slice(0, 15));
  };

  const fetchConnections = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
      .eq('status', 'accepted');

    if (!error && data) {
      setConnections(data);
    }
  };

  // Hydrate persisted requested/passed sets once the user is known, and also
  // pick up any pending requests already in the database.
  useEffect(() => {
    if (!user) return;
    try {
      setRequestedIds(new Set(JSON.parse(localStorage.getItem(`sfh_requested_${user.id}`) || '[]')));
      setPassedIds(new Set(JSON.parse(localStorage.getItem(`sfh_passed_${user.id}`) || '[]')));
    } catch { /* ignore corrupted storage */ }

    supabase
      .from('connections')
      .select('addressee_id')
      .eq('requester_id', user.id)
      .in('status', ['pending', 'accepted'])
      .then(({ data }) => {
        if (data?.length) {
          setRequestedIds(prev => {
            const next = new Set(prev);
            data.forEach(c => next.add(c.addressee_id));
            return next;
          });
        }
      });
  }, [user]);

  const sendConnectionRequest = async (targetId: string, targetName: string, onSuccess: () => void, targetRole?: string) => {
    if (!user) return;

    // Mark as requested immediately so the button flips to "Requested"
    markRequested(targetId);

    try {
      // Get current user's name for notification
      const senderName = userProfile?.full_name || 'Someone';

      // Check if this is a mentorship request (connecting with a mentor/advisor)
      const { data: isAdvisor } = await supabase
        .rpc('has_role', { _user_id: targetId, _role: 'advisor' });
      
      const { data: isMentor } = await supabase
        .rpc('has_role', { _user_id: targetId, _role: 'mentor' });

      if (isAdvisor || isMentor) {
        // Check if mentorship request already exists
        const { data: existingRequest } = await supabase
          .from('mentorship_relationships')
          .select('id')
          .eq('mentor_id', targetId)
          .eq('mentee_id', user.id)
          .maybeSingle();

        if (existingRequest) {
          toast({
            title: "Already Connected",
            description: "You've already sent a request to this person.",
          });
          return;
        }

        // Send mentorship request
        const { error } = await supabase
          .from('mentorship_relationships')
          .insert({
            mentor_id: targetId,
            mentee_id: user.id,
            status: 'pending'
          });

        if (error) {
          console.error('Mentorship request error:', error);
          return;
        }

        // Send notification to mentor
        await notifyConnection(targetId, senderName);

        toast({
          title: "Mentorship Request Sent!",
          description: `Your request has been sent to ${targetName}.`,
        });
      } else {
        // Check if connection request already exists
        const { data: existingConnection } = await supabase
          .from('connections')
          .select('id')
          .or(`and(requester_id.eq.${user.id},addressee_id.eq.${targetId}),and(requester_id.eq.${targetId},addressee_id.eq.${user.id})`)
          .maybeSingle();

        if (existingConnection) {
          toast({
            title: "Already Connected",
            description: "You've already sent a request to this person.",
          });
          return;
        }

        // Send regular connection request
        const { error } = await supabase
          .from('connections')
          .insert({
            requester_id: user.id,
            addressee_id: targetId,
            status: 'pending'
          });

        if (error) {
          console.error('Connection request error:', error);
          return;
        }

        // Send notification to recipient
        await notifyConnection(targetId, senderName);

        // If connecting with an accelerator, send special notification
        if (targetRole === 'Accelerator') {
          // Find the startup owner to notify them when accelerator connects
          // This handles the reverse case - when startup connects to accelerator
        }

        toast({
          title: "Connection Request Sent!",
          description: `Your request has been sent to ${targetName}.`,
        });
      }

      // If the current user is an accelerator connecting with a startup, notify the startup
      if (userRole === 'accelerator') {
        const acceleratorName = userProfile?.full_name || 'An accelerator';
        await createNotification({
          userId: targetId,
          title: 'Accelerator Interest',
          message: `${acceleratorName} is interested in your startup for their program`,
          type: 'connection',
          data: { accelerator_id: user.id }
        });
      }
    } catch (error) {
      console.error('Unexpected error sending connection:', error);
    }
  };

  const getCompatibilityColor = (score: number) => {
    if (score >= 90) return 'text-green-500';
    if (score >= 80) return 'text-primary';
    if (score >= 70) return 'text-yellow-500';
    return 'text-orange-500';
  };

  const getCompatibilityLabel = (score: number) => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Great';
    if (score >= 70) return 'Good';
    return 'Fair';
  };

  const MatchCard = ({ match, onConnect, onPass }: { match: Match; onConnect: () => void; onPass: () => void }) => (
    <Card className="tech-card border-0">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={match.avatar} alt={match.name} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
              {match.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-semibold text-foreground">{match.name}</h3>
            <div className="flex flex-wrap items-center gap-1.5 mt-1">
              <span className="inline-flex items-center rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary">
                {normalizeRole(match.role) === 'all' ? 'Member' : (match.role || 'Member')}
              </span>
              {match.compatibility_score > 0 && (
                <span className="inline-flex items-center rounded-md bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-accent-foreground">
                  {match.compatibility_score}% Match
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="secondary" className="text-xs">{match.industry}</Badge>
              {match.stage && <Badge variant="outline" className="text-xs">{match.stage}</Badge>}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{match.description}</p>
        
        {/* Accelerator-specific info */}
        {match.role === 'Accelerator' && (
          <div className="mb-4 grid grid-cols-2 gap-2 text-xs">
            {match.funding_offered && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <DollarSign className="h-3 w-3 text-green-500" />
                ${(match.funding_offered / 1000).toFixed(0)}K funding
              </div>
            )}
            {match.equity_percentage && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3 w-3 text-primary" />
                {match.equity_percentage}% equity
              </div>
            )}
            {match.program_duration && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Clock className="h-3 w-3 text-blue-500" />
                {match.program_duration}
              </div>
            )}
            {match.location && (
              <div className="flex items-center gap-1 text-muted-foreground">
                <Building className="h-3 w-3 text-orange-500" />
                {match.location}
              </div>
            )}
          </div>
        )}

        {/* Match Reasons */}
        {match.match_reasons && match.match_reasons.length > 0 && (
          <div className="mb-4 pt-3 border-t border-border/40">
            <p className="text-xs font-medium text-foreground mb-2 flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-primary" />
              Why this match:
            </p>
            <ul className="space-y-1">
              {match.match_reasons.slice(0, 3).map((reason, idx) => (
                <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                  <span className="w-1 h-1 rounded-full bg-primary/50" />
                  {reason}
                </li>
              ))}
            </ul>
          </div>
        )}

        {match.expertise && match.expertise.length > 0 && match.role !== 'Accelerator' && (
          <div className="mb-4">
            <p className="text-xs font-medium text-foreground mb-2">Expertise:</p>
            <div className="flex flex-wrap gap-1">
              {match.expertise.slice(0, 3).map((skill, idx) => (
                <Badge key={idx} variant="outline" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {!/^(legacy|company)-/.test(match.id) && (
          <div className="flex gap-2 mb-2">
            <Button variant="outline" size="sm" className="flex-1" onClick={() => setProfileUserId(match.id)}>
              <UserIcon className="h-4 w-4 mr-2" />
              View profile
            </Button>
            <Button variant="outline" size="sm" className="flex-1" onClick={() => window.dispatchEvent(new CustomEvent('openFloatingChat', { detail: { userId: match.id } }))}>
              <MessageCircle className="h-4 w-4 mr-2" />
              Message
            </Button>
          </div>
        )}
        {!/^(legacy|company)-/.test(match.id) && (
          <Button variant="outline" size="sm" className="w-full mb-2" onClick={() => bookMeeting(match.id, match.name)}>
            <CalendarClock className="h-4 w-4 mr-2" />
            Book a meeting
          </Button>
        )}
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onPass} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Pass
          </Button>
          {requestedIds.has(match.id) ? (
            <Button size="sm" variant="secondary" className="flex-1" disabled>
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Requested
            </Button>
          ) : (
            <Button size="sm" onClick={onConnect} className="flex-1 pulse-primary">
              <Heart className="h-4 w-4 mr-2" />
              Connect
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Show loading state while role is being fetched
  if (roleLoading) {
    return (
      <div className="space-y-6">
        <Card className="tech-card border-0">
          <CardContent className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">Loading your matches...</span>
          </CardContent>
        </Card>
      </div>
    );
  }


  // ---- Unified relevance-sorted list ----
  type FilterKey = 'all' | 'mentor' | 'investor' | 'startup' | 'accelerator' | 'network';

  const filterChips: { key: FilterKey; label: string; icon: any }[] = [
    { key: 'all', label: 'All Community', icon: Users },
    { key: 'mentor', label: 'Mentors', icon: GraduationCap },
    { key: 'investor', label: 'Investors', icon: DollarSign },
    { key: 'startup', label: 'Startups', icon: Compass },
    { key: 'accelerator', label: 'Accelerators', icon: Landmark },
    { key: 'network', label: 'My Network', icon: Globe },
  ];

  const normalizeRole = (r: string): FilterKey => {
    const v = (r || '').toLowerCase();
    if (v.includes('mentor') || v.includes('advisor')) return 'mentor';
    if (v.includes('investor')) return 'investor';
    if (v.includes('accelerator')) return 'accelerator';
    if (v.includes('startup')) return 'startup';
    return 'all';
  };

  // Priority by current user's role: which buckets matter most to them
  const priorityMap: Record<string, FilterKey[]> = {
    startup: ['investor', 'mentor', 'accelerator', 'startup'],
    investor: ['startup', 'mentor', 'accelerator', 'investor'],
    mentor: ['startup', 'investor', 'accelerator', 'mentor'],
    advisor: ['startup', 'investor', 'accelerator', 'mentor'],
    accelerator: ['startup', 'investor', 'mentor', 'accelerator'],
    student: ['mentor', 'startup', 'investor', 'accelerator'],
  };
  const order = priorityMap[(userRole || '').toLowerCase()] || ['mentor', 'investor', 'startup', 'accelerator'];
  const priorityOf = (k: FilterKey) => {
    const idx = order.indexOf(k);
    return idx === -1 ? 99 : idx;
  };

  // Every registered member is included; company entries share the owner's user_id,
  // so the id dedupe below keeps one card per person.
  const nonStartupUsers = allUsers;

  const allMatches: Match[] = [
    ...mentorMatches, ...potentialMentors,
    ...investorMatches, ...potentialInvestors,
    ...acceleratorMatches, ...potentialAccelerators,
    ...startupMatches, // scored startup matches first (dedupe will keep these over 0% companies)
    ...allStartups, // companies + legacy startups
    ...nonStartupUsers, // fallback: every other user at 0%
  ];
  // Fallback scoring: entries coming from directory fetches arrive with score 0.
  // Compute a real relevance score so the UI never shows "0% Match".
  const myIndustry = (userCompany?.industry || userProfile?.industry || '').toLowerCase();
  const myLocation = (userProfile?.location || '').toLowerCase();
  // Only real, shared signals count as a match. Everyone else is shown as a
  // regular community member with no invented score.
  const scoreFallback = (m: Match): Match => {
    if ((m.compatibility_score || 0) > 0) return m;
    const reasons: string[] = [];
    let score = 0;
    const theirIndustry = (m.industry || '').toLowerCase();
    if (myIndustry && theirIndustry && (theirIndustry.includes(myIndustry) || myIndustry.includes(theirIndustry))) {
      score += 60;
      reasons.push(`Same industry: ${m.industry}`);
    }
    if (myLocation && m.location && m.location.toLowerCase().includes(myLocation)) {
      score += 15;
      reasons.push(`Located in ${m.location}`);
    }
    return { ...m, compatibility_score: score, match_reasons: reasons };
  };

  // Dedupe by id — earlier entries (real matches) win over later fallback entries
  const seen = new Set<string>();
  const dedupedMatches = allMatches
    .filter(m => !passedIds.has(m.id))
    .filter(m => {
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    })
    .map(scoreFallback);


  const filtered = (activeTab === 'all' || !['mentor','investor','startup','accelerator'].includes(activeTab))
    ? dedupedMatches
    : dedupedMatches.filter(m => normalizeRole(m.role) === activeTab);

  const sorted = [...filtered].sort((a, b) => {
    // 1. Real matches (score > 0) always above 0% users
    const aHas = (a.compatibility_score || 0) > 0 ? 0 : 1;
    const bHas = (b.compatibility_score || 0) > 0 ? 0 : 1;
    if (aHas !== bHas) return aHas - bHas;
    // 2. Relevance by current user's role
    const pa = priorityOf(normalizeRole(a.role));
    const pb = priorityOf(normalizeRole(b.role));
    if (pa !== pb) return pa - pb;
    // 3. Higher score first
    return (b.compatibility_score || 0) - (a.compatibility_score || 0);
  });

  const handleRemoveMatch = (id: string) => {
    setMentorMatches(prev => prev.filter(m => m.id !== id));
    setPotentialMentors(prev => prev.filter(m => m.id !== id));
    setInvestorMatches(prev => prev.filter(m => m.id !== id));
    setPotentialInvestors(prev => prev.filter(m => m.id !== id));
    setAcceleratorMatches(prev => prev.filter(m => m.id !== id));
    setPotentialAccelerators(prev => prev.filter(m => m.id !== id));
    setStartupMatches(prev => prev.filter(m => m.id !== id));
  };

  const countFor = (key: FilterKey) => {
    if (key === 'network') return connections.length;
    if (key === 'all') return dedupedMatches.length;
    return dedupedMatches.filter(m => normalizeRole(m.role) === key).length;
  };

  return (
    <div className="space-y-5">
      {/* Compact search */}
      <NetworkSearchEngine />

      {/* Compact role filters */}
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-border/50 bg-muted/20 p-1 scrollbar-hide">
        {filterChips.map(chip => {
          const Icon = chip.icon;
          const active = activeTab === chip.key;
          const count = countFor(chip.key);
          return (
            <Button
              key={chip.key}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab(chip.key)}
              className={`shrink-0 gap-2 rounded-md px-3 ${
                active
                  ? 'bg-background text-foreground shadow-sm hover:bg-background'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="text-xs font-medium">{chip.label}</span>
              <span className={`inline-flex min-w-5 h-5 items-center justify-center rounded px-1 text-[10px] font-medium ${
                active ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>
                  {count}
              </span>
            </Button>
          );
        })}
      </div>

      {activeTab === 'network' ? (
        <NetworkBrowser />
      ) : activeTab === 'all' ? (
        <NetworkBrowser mode="community" />
      ) : (
        <Card className="tech-card border-0 overflow-hidden">
          <CardHeader className="pb-3 border-b border-border/40">
            <CardTitle className="flex items-center gap-2 text-base">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span>
                {activeTab === 'all' ? 'Recommended for you' : `${filterChips.find(c => c.key === activeTab)?.label}`}
              </span>
              <Badge variant="secondary" className="ml-auto text-[10px]">
                {sorted.length} matches
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-5">
            {sorted.length === 0 ? (
              <div className="text-center py-16">
                <div className="inline-flex h-16 w-16 rounded-2xl bg-primary/10 items-center justify-center mb-4">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  No matches yet — complete your profile to unlock smarter recommendations.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {sorted.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    onConnect={() => sendConnectionRequest(
                      match.id,
                      match.name,
                      () => markRequested(match.id),
                      normalizeRole(match.role) === 'accelerator' ? 'Accelerator' : undefined
                    )}
                    onPass={() => { markPassed(match.id); handleRemoveMatch(match.id); }}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'investor' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsScannerOpen(true)}>
              <ScanLine className="h-4 w-4 mr-2" />
              Scan business card
            </Button>
          </div>
          <InvestorDirectoryList startupName={userCompany?.name} />
        </div>
      )}

      <BusinessCardScannerDialog
        open={isScannerOpen}
        onOpenChange={setIsScannerOpen}
      />
      <UserProfileDialog userId={profileUserId} open={!!profileUserId} onOpenChange={(o) => !o && setProfileUserId(null)} />
    </div>
  );
}
