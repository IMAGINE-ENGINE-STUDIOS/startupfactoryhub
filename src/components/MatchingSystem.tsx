import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Heart, X, Users, Star, TrendingUp, Building, UserCheck, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useNotifications } from '@/hooks/useNotifications';
import StartupBrowser from './StartupBrowser';
import NetworkBrowser from './NetworkBrowser';

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

export default function MatchingSystem() {
  const [mentorMatches, setMentorMatches] = useState<Match[]>([]);
  const [investorMatches, setInvestorMatches] = useState<Match[]>([]);
  const [startupMatches, setStartupMatches] = useState<Match[]>([]);
  const [connections, setConnections] = useState<any[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userCompany, setUserCompany] = useState<Company | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const { notifyConnection } = useNotifications();

  useEffect(() => {
    if (user) {
      fetchUserRole();
      fetchUserProfile();
      fetchUserCompany();
      fetchConnections();
    }
  }, [user]);

  useEffect(() => {
    if (user && userRole !== null) {
      fetchMatches();
    }
  }, [user, userRole, userCompany]);

  const fetchUserRole = async () => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .maybeSingle();
      
    if (!error && data) {
      setUserRole(data.role);
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

  const fetchMatches = async () => {
    if (!user) return;

    // For startups/students: fetch mentor and investor matches
    if (!userRole || userRole === 'startup' || userRole === 'student') {
      await fetchMentorMatchesForStartup();
      await fetchInvestorMatchesForStartup();
    }

    // For investors: fetch startup matches
    if (userRole === 'investor') {
      await fetchStartupMatchesForInvestor();
    }

    // For mentors/advisors: fetch startup matches
    if (userRole === 'mentor' || userRole === 'advisor') {
      await fetchStartupMatchesForMentor();
    }

    // For accelerators: fetch all types
    if (userRole === 'accelerator') {
      await fetchMentorMatchesForStartup();
      await fetchInvestorMatchesForStartup();
      await fetchStartupMatchesForInvestor();
    }
  };

  const fetchMentorMatchesForStartup = async () => {
    // Fetch advisor role IDs
    const { data: advisorRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .in('role', ['advisor', 'mentor'])
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

  const fetchInvestorMatchesForStartup = async () => {
    // Fetch investor role IDs
    const { data: investorRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'investor')
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

  const fetchStartupMatchesForInvestor = async () => {
    if (!user) return;

    // Fetch investor's profile for matching criteria
    const { data: investorProfile } = await supabase
      .from('investor_profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    // Fetch all companies
    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .limit(30);

    if (!companies || companies.length === 0) return;

    // Get profile info for each startup
    const startupIds = companies.map(c => c.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, avatar_url')
      .in('user_id', startupIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Calculate scores and create matches
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
        avatar: profileMap.get(company.user_id)?.avatar_url,
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

    // Fetch mentor's skills
    const { data: mentorSkills } = await supabase
      .from('advisor_skills')
      .select('skill_name')
      .eq('user_id', user.id);

    const skills = mentorSkills?.map(s => s.skill_name) || [];

    // Fetch all companies
    const { data: companies } = await supabase
      .from('companies')
      .select('*')
      .limit(30);

    if (!companies || companies.length === 0) return;

    // Get profile info for each startup
    const startupIds = companies.map(c => c.user_id);
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, avatar_url')
      .in('user_id', startupIds);

    const profileMap = new Map(profiles?.map(p => [p.user_id, p]) || []);

    // Calculate scores and create matches
    const matches: Match[] = companies.map(company => {
      const { score, reasons } = calculateMentorStartupScore(company, skills);

      return {
        id: company.user_id,
        name: company.name,
        role: 'Startup',
        description: company.description || 'Innovative startup seeking guidance',
        industry: company.industry || 'General',
        stage: company.stage,
        avatar: profileMap.get(company.user_id)?.avatar_url,
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

  const sendConnectionRequest = async (targetId: string, targetName: string, onSuccess: () => void) => {
    if (!user) return;

    // Remove card immediately - no matter what
    onSuccess();

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

        toast({
          title: "Connection Request Sent!",
          description: `Your request has been sent to ${targetName}.`,
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
    <Card className="tech-card border-0 hover:scale-[1.02] transition-transform">
      <CardContent className="p-6">
        <div className="flex items-start space-x-4 mb-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={match.avatar} alt={match.name} />
            <AvatarFallback className="bg-gradient-primary text-primary-foreground text-lg">
              {match.name.charAt(0)}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-foreground">{match.name}</h3>
            <p className="text-sm text-muted-foreground mb-2">{match.role}</p>
            <div className="flex items-center space-x-2 mb-2">
              <Star className={`h-4 w-4 ${getCompatibilityColor(match.compatibility_score)}`} />
              <span className={`text-sm font-medium ${getCompatibilityColor(match.compatibility_score)}`}>
                {match.compatibility_score}% • {getCompatibilityLabel(match.compatibility_score)} Match
              </span>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              <Badge variant="secondary" className="text-xs">{match.industry}</Badge>
              {match.stage && <Badge variant="outline" className="text-xs">{match.stage}</Badge>}
            </div>
          </div>
        </div>
        
        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{match.description}</p>
        
        {/* Match Reasons */}
        {match.match_reasons && match.match_reasons.length > 0 && (
          <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/10">
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

        {match.expertise && match.expertise.length > 0 && (
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
        
        <div className="flex space-x-2">
          <Button variant="outline" size="sm" onClick={onPass} className="flex-1">
            <X className="h-4 w-4 mr-2" />
            Pass
          </Button>
          <Button size="sm" onClick={onConnect} className="flex-1 pulse-primary">
            <Heart className="h-4 w-4 mr-2" />
            Connect
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Users className="h-6 w-6 text-primary" />
            <span>Smart Matching System</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Our AI-powered matching system connects you with the right people based on your profile, 
            industry, stage, and goals. Scores reflect actual compatibility based on your criteria.
          </p>
        </CardContent>
      </Card>

      <Tabs defaultValue={userRole === 'mentor' || userRole === 'advisor' || userRole === 'investor' || userRole === 'accelerator' ? 'startups' : 'mentors'} className="space-y-6">
        <TabsList className={`grid w-full ${(!userRole || userRole === 'startup' || userRole === 'student') ? 'grid-cols-4' : userRole === 'accelerator' ? 'grid-cols-4' : 'grid-cols-2'} max-w-lg`}>
          {(!userRole || userRole === 'startup' || userRole === 'student') && (
            <>
              <TabsTrigger value="mentors">Mentors</TabsTrigger>
              <TabsTrigger value="investors">Investors</TabsTrigger>
              <TabsTrigger value="startups">Startups</TabsTrigger>
              <TabsTrigger value="mynetwork">My Network</TabsTrigger>
            </>
          )}
          {userRole === 'accelerator' && (
            <>
              <TabsTrigger value="startups">Startups</TabsTrigger>
              <TabsTrigger value="investors">Investors</TabsTrigger>
              <TabsTrigger value="mentors">Mentors</TabsTrigger>
              <TabsTrigger value="mynetwork">My Network</TabsTrigger>
            </>
          )}
          {(userRole === 'investor' || userRole === 'mentor' || userRole === 'advisor') && (
            <>
              <TabsTrigger value="startups">Startups</TabsTrigger>
              <TabsTrigger value="mynetwork">My Network</TabsTrigger>
            </>
          )}
        </TabsList>

        {(!userRole || userRole === 'startup' || userRole === 'student') && (
          <TabsContent value="mentors" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <span>Recommended Mentors</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mentorMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mentorMatches.map((mentor) => (
                    <MatchCard
                      key={mentor.id}
                      match={mentor}
                      onConnect={() => sendConnectionRequest(mentor.id, mentor.name, () => {
                        setMentorMatches(mentorMatches.filter(m => m.id !== mentor.id));
                      })}
                      onPass={() => {
                        setMentorMatches(mentorMatches.filter(m => m.id !== mentor.id));
                        toast({ title: "Mentor passed", description: "We'll find better matches for you." });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No mentor matches yet</h3>
                  <p className="text-muted-foreground">Complete your profile to get better matches</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {(!userRole || userRole === 'startup' || userRole === 'student' || userRole === 'accelerator') && (
          <TabsContent value="investors" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <span>Recommended Investors</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {investorMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {investorMatches.map((investor) => (
                    <MatchCard
                      key={investor.id}
                      match={investor}
                      onConnect={() => sendConnectionRequest(investor.id, investor.name, () => {
                        setInvestorMatches(investorMatches.filter(i => i.id !== investor.id));
                      })}
                      onPass={() => {
                        setInvestorMatches(investorMatches.filter(i => i.id !== investor.id));
                        toast({ title: "Investor passed", description: "We'll find better matches for you." });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No investor matches yet</h3>
                  <p className="text-muted-foreground">Complete your startup profile to attract investors</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        {/* Mentors tab for accelerators */}
        {userRole === 'accelerator' && (
          <TabsContent value="mentors" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <UserCheck className="h-5 w-5 text-primary" />
                <span>Mentors & Advisors</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mentorMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {mentorMatches.map((mentor) => (
                    <MatchCard
                      key={mentor.id}
                      match={mentor}
                      onConnect={() => sendConnectionRequest(mentor.id, mentor.name, () => {
                        setMentorMatches(mentorMatches.filter(m => m.id !== mentor.id));
                      })}
                      onPass={() => {
                        setMentorMatches(mentorMatches.filter(m => m.id !== mentor.id));
                        toast({ title: "Mentor passed", description: "We'll find better matches for you." });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No mentor matches yet</h3>
                  <p className="text-muted-foreground">Complete your profile to get better matches</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}

        <TabsContent value="startups" className="space-y-6">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5 text-primary" />
                <span>Recommended Startups</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {startupMatches.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {startupMatches.map((startup) => (
                    <MatchCard
                      key={startup.id}
                      match={startup}
                      onConnect={() => sendConnectionRequest(startup.id, startup.name, () => {
                        setStartupMatches(startupMatches.filter(s => s.id !== startup.id));
                      })}
                      onPass={() => {
                        setStartupMatches(startupMatches.filter(s => s.id !== startup.id));
                        toast({ title: "Startup passed", description: "We'll find better matches for you." });
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Building className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No startup matches yet</h3>
                  <p className="text-muted-foreground">Update your investment preferences to see matches</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Browse All Startups */}
          <StartupBrowser />
        </TabsContent>

        {/* My Network Tab */}
        <TabsContent value="mynetwork" className="space-y-6">
          <NetworkBrowser />
        </TabsContent>
      </Tabs>
    </div>
  );
}
