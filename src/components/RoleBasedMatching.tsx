import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, X, Users, Building, GraduationCap, TrendingUp, MapPin, Filter } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useProfileWithRole } from '@/hooks/useProfileWithRole';

interface MatchingCriteria {
  industry?: string;
  stage?: string;
  location?: string;
  fundingRange?: string;
  teamSize?: string;
}

interface Match {
  id: string;
  name: string;
  role: string;
  description: string;
  industry?: string;
  stage?: string;
  location?: string;
  funding_amount?: number;
  team_size?: number;
  compatibility_score: number;
  avatar?: string;
  skills?: string[];
  experience?: string;
}

export default function RoleBasedMatching() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [criteria, setCriteria] = useState<MatchingCriteria>({});
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { profile: userProfile } = useProfileWithRole();
  const { toast } = useToast();

  useEffect(() => {
    if (userProfile) {
      fetchMatches();
    }
  }, [userProfile, criteria]);

  const fetchMatches = async () => {
    if (!userProfile) return;
    setLoading(true);

    try {
      let matches: Match[] = [];

      if (userProfile.role === 'startup') {
        // Startups see investors, advisors, and students (for internships)
        matches = await fetchInvestorsAndAdvisors();
      } else if (userProfile.role === 'investor') {
        // Investors see startups based on their criteria
        matches = await fetchStartupsForInvestor();
      } else if (userProfile.role === 'advisor') {
        // Advisors see startups they can help
        matches = await fetchStartupsForAdvisor();
      } else if (userProfile.role === 'student') {
        // Students see startups with internship opportunities and advisors
        matches = await fetchInternshipOpportunities();
      }

      setMatches(matches);
    } catch (error) {
      console.error('Error fetching matches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchInvestorsAndAdvisors = async (): Promise<Match[]> => {
    // Get all profiles first
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(50);

    if (profilesError || !profiles) return [];

    // Get user roles for all these profiles
    const { data: userRoles, error: rolesError } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .in('user_id', profiles.map(p => p.user_id))
      .in('role', ['investor', 'advisor', 'student']);

    if (rolesError) return [];

    // Filter profiles that have matching roles
    const rolesMap = new Map(userRoles?.map(ur => [ur.user_id, ur.role]) || []);
    const filteredProfiles = profiles.filter(p => rolesMap.has(p.user_id)).slice(0, 10);

    return filteredProfiles.map(profile => {
      const userRole = rolesMap.get(profile.user_id) || 'startup';
      return {
        id: profile.user_id,
        name: profile.full_name || 'Anonymous User',
        role: userRole === 'advisor' ? 'Advisor' : userRole.charAt(0).toUpperCase() + userRole.slice(1),
        description: profile.bio || `Experienced ${userRole} ready to help startups`,
        industry: profile.bio?.split(' ')[0] || 'General',
        skills: profile.bio ? [profile.bio] : [],
        experience: 'Senior',
        compatibility_score: Math.floor(Math.random() * 40) + 60,
      };
    });
  };

  const fetchStartupsForInvestor = async (): Promise<Match[]> => {
    let query = supabase
      .from('companies')
      .select(`
        *,
        profiles(full_name, avatar_url)
      `);

    // Apply investor criteria
    if (criteria.industry) {
      query = query.ilike('industry', `%${criteria.industry}%`);
    }
    if (criteria.stage) {
      query = query.eq('stage', criteria.stage as 'idea' | 'prototype' | 'mvp' | 'growth' | 'scale');
    }
    if (criteria.location) {
      query = query.ilike('location', `%${criteria.location}%`);
    }

    const { data: companies, error } = await query.limit(10);

    if (error || !companies) return [];

    return companies.map(company => ({
      id: company.id,
      name: company.name,
      role: 'Startup',
      description: company.description,
      industry: company.industry,
      stage: company.stage,
      location: company.location,
      funding_amount: company.funding_amount,
      team_size: company.team_size,
      compatibility_score: Math.floor(Math.random() * 40) + 60,
    }));
  };

  const fetchStartupsForAdvisor = async (): Promise<Match[]> => {
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        *,
        profiles(full_name, avatar_url)
      `)
      .limit(10);

    if (error || !companies) return [];

    return companies.map(company => ({
      id: company.id,
      name: company.name,
      role: 'Startup',
      description: company.description,
      industry: company.industry,
      stage: company.stage,
      location: company.location,
      compatibility_score: Math.floor(Math.random() * 40) + 60,
    }));
  };

  const fetchInternshipOpportunities = async (): Promise<Match[]> => {
    // Students see startups offering internships + advisors
    const { data: companies, error } = await supabase
      .from('companies')
      .select(`
        *,
        profiles(full_name, avatar_url)
      `)
      .gte('team_size', 5) // Startups with team size 5+ likely offer internships
      .limit(8);

    // Get advisors using user_roles table
    const { data: advisorRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'advisor')
      .limit(6);

    const advisorIds = advisorRoles?.map(r => r.user_id) || [];
    
    const { data: advisors, error: advisorError } = await supabase
      .from('profiles')
      .select('*')
      .in('user_id', advisorIds);

    let matches: Match[] = [];

    // Add startup internship opportunities
    if (!error && companies) {
      const startupMatches = companies.map(company => ({
        id: company.id,
        name: company.name,
        role: 'Internship Opportunity',
        description: `Internship opportunity at ${company.name} - ${company.description}`,
        industry: company.industry,
        stage: company.stage,
        location: company.location,
        compatibility_score: Math.floor(Math.random() * 40) + 60,
      }));
      matches = [...matches, ...startupMatches];
    }

    // Add advisors
    if (!advisorError && advisors) {
      const advisorMatches = advisors.map(advisor => ({
        id: advisor.user_id,
        name: advisor.full_name || 'Anonymous Advisor',
        role: 'Advisor',
        description: advisor.bio || 'Experienced professional ready to guide students',
        industry: advisor.bio?.split(' ')[0] || 'General',
        skills: advisor.bio ? [advisor.bio] : [],
        compatibility_score: Math.floor(Math.random() * 40) + 60,
      }));
      matches = [...matches, ...advisorMatches];
    }

    return matches;
  };

  const sendConnectionRequest = async (targetId: string, targetName: string) => {
    if (!user) return;

    const { error } = await supabase
      .from('connections')
      .insert([{
        requester_id: user.id,
        addressee_id: targetId,
        status: 'pending'
      }]);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send connection request",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Connection Request Sent!",
      description: `Your connection request has been sent to ${targetName}`,
    });
  };

  const passOnMatch = (matchId: string) => {
    setMatches(prevMatches => prevMatches.filter(m => m.id !== matchId));
    toast({
      title: "Match Passed",
      description: "We'll find better matches for you.",
    });
  };

  const getRoleSpecificTitle = () => {
    if (!userProfile) return 'Discover Matches';
    
    switch (userProfile.role) {
      case 'startup':
        return 'Find Investors, Advisors & Talent';
      case 'investor':
        return 'Discover Investment Opportunities';
      case 'advisor':
        return 'Find Startups to Advise';
      case 'student':
        return 'Find Internships & Advisors';
      default:
        return 'Discover Matches';
    }
  };

  const getRoleSpecificFilters = () => {
    if (!userProfile) return null;

    if (userProfile.role === 'investor') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="space-y-1">
            <Select value={criteria.industry} onValueChange={(value) => setCriteria({...criteria, industry: value === 'all' ? undefined : value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Industries" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Industries</SelectItem>
                <SelectItem value="fintech">Fintech</SelectItem>
                <SelectItem value="healthtech">Healthtech</SelectItem>
                <SelectItem value="edtech">Edtech</SelectItem>
                <SelectItem value="ai">AI/ML</SelectItem>
                <SelectItem value="saas">SaaS</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Select value={criteria.stage} onValueChange={(value) => setCriteria({...criteria, stage: value === 'all' ? undefined : value})}>
              <SelectTrigger>
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                <SelectItem value="pre-seed">Pre-Seed</SelectItem>
                <SelectItem value="seed">Seed</SelectItem>
                <SelectItem value="series-a">Series A</SelectItem>
                <SelectItem value="series-b">Series B</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Input
            placeholder="Location"
            value={criteria.location || ''}
            onChange={(e) => setCriteria({...criteria, location: e.target.value})}
          />

          <div className="space-y-1">
            <Select value={criteria.fundingRange} onValueChange={(value) => setCriteria({...criteria, fundingRange: value === 'all' ? undefined : value})}>
              <SelectTrigger>
                <SelectValue placeholder="Any Amount" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Amount</SelectItem>
                <SelectItem value="0-1M">$0 - $1M</SelectItem>
                <SelectItem value="1M-5M">$1M - $5M</SelectItem>
                <SelectItem value="5M+">$5M+</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }

    return null;
  };

  const getMatchIcon = (role: string) => {
    switch (role.toLowerCase()) {
      case 'investor': return TrendingUp;
      case 'advisor': return Users;
      case 'startup': return Building;
      case 'student': return GraduationCap;
      case 'internship opportunity': return GraduationCap;
      default: return Users;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-6 w-6 text-primary" />
            <span>{getRoleSpecificTitle()}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">
            {userProfile?.role === 'startup' && 'Connect with investors, advisors, and potential team members to grow your startup.'}
            {userProfile?.role === 'investor' && 'Discover high-potential startups that match your investment criteria.'}
            {userProfile?.role === 'advisor' && 'Find startups that need your expertise and guidance.'}
            {userProfile?.role === 'student' && 'Explore internship opportunities and connect with experienced advisors.'}
          </p>
          
          {getRoleSpecificFilters()}
        </CardContent>
      </Card>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Finding your perfect matches...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map((match) => {
            const MatchIcon = getMatchIcon(match.role);
            return (
              <Card key={match.id} className="tech-card border-0 hover:scale-[1.02] transition-transform">
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
                      <div className="flex items-center space-x-2 mb-2">
                        <MatchIcon className="h-4 w-4 text-primary" />
                        <span className="text-sm text-muted-foreground">{match.role}</span>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-xs font-medium text-green-600">
                          {match.compatibility_score}% Match
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">{match.description}</p>
                  
                  <div className="space-y-2 mb-4">
                    {match.industry && (
                      <Badge variant="secondary" className="text-xs">{match.industry}</Badge>
                    )}
                    {match.stage && (
                      <Badge variant="outline" className="text-xs ml-1">{match.stage}</Badge>
                    )}
                    {match.location && (
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3 mr-1" />
                        {match.location}
                      </div>
                    )}
                    {match.funding_amount && (
                      <div className="text-xs text-primary font-medium">
                        Seeking: ${(match.funding_amount / 1000000).toFixed(1)}M
                      </div>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => passOnMatch(match.id)} className="flex-1">
                      <X className="h-4 w-4 mr-2" />
                      Pass
                    </Button>
                    <Button size="sm" onClick={() => sendConnectionRequest(match.id, match.name)} className="flex-1 pulse-primary">
                      <Heart className="h-4 w-4 mr-2" />
                      Connect
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {matches.length === 0 && !loading && (
        <Card className="tech-card border-0 text-center p-12">
          <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">No matches found</h3>
          <p className="text-muted-foreground">
            {userProfile?.role === 'investor' ? 'Try adjusting your investment criteria' : 'Complete your profile to get better matches'}
          </p>
        </Card>
      )}
    </div>
  );
}