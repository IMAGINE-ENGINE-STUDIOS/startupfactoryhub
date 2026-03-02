import { useState, useCallback } from 'react';
import { Search, UserCheck, Users, Building, TrendingUp, Rocket, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface SearchResult {
  user_id: string;
  full_name: string;
  avatar_url: string | null;
  bio: string | null;
  role: string | null;
  company_name: string | null;
  company_industry: string | null;
  is_connected: boolean;
  connection_status: string | null; // 'accepted', 'pending', null
}

export default function NetworkSearchEngine() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const performSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim() || !user) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    setHasSearched(true);

    try {
      const searchTerm = `%${searchQuery.toLowerCase()}%`;

      // Search profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url, bio')
        .or(`full_name.ilike.${searchTerm},bio.ilike.${searchTerm}`)
        .neq('user_id', user.id)
        .limit(30);

      if (profilesError) throw profilesError;

      // Search companies for company name / industry match
      const { data: companies, error: companiesError } = await supabase
        .from('companies')
        .select('user_id, name, industry')
        .or(`name.ilike.${searchTerm},industry.ilike.${searchTerm}`)
        .limit(30);

      if (companiesError) throw companiesError;

      // Get all unique user_ids from both results
      const profileUserIds = (profiles || []).map(p => p.user_id);
      const companyUserIds = (companies || []).map(c => c.user_id);
      const allUserIds = [...new Set([...profileUserIds, ...companyUserIds])].filter(id => id !== user.id);

      if (allUserIds.length === 0) {
        setResults([]);
        setIsSearching(false);
        return;
      }

      // Fetch connection statuses for these users
      const { data: connectionsData } = await supabase
        .from('connections')
        .select('requester_id, addressee_id, status')
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`);

      // Fetch roles for all users
      const { data: rolesData } = await supabase
        .from('user_roles')
        .select('user_id, role')
        .in('user_id', allUserIds);

      // Fetch profiles for company-matched users that weren't in profile results
      const missingProfileIds = companyUserIds.filter(id => !profileUserIds.includes(id) && id !== user.id);
      let additionalProfiles: any[] = [];
      if (missingProfileIds.length > 0) {
        const { data } = await supabase
          .from('profiles')
          .select('user_id, full_name, avatar_url, bio')
          .in('user_id', missingProfileIds);
        additionalProfiles = data || [];
      }

      // Fetch companies for profile-matched users that weren't in company results
      const missingCompanyIds = profileUserIds.filter(id => !companyUserIds.includes(id));
      let additionalCompanies: any[] = [];
      if (missingCompanyIds.length > 0) {
        const { data } = await supabase
          .from('companies')
          .select('user_id, name, industry')
          .in('user_id', missingCompanyIds);
        additionalCompanies = data || [];
      }

      // Merge everything
      const allProfiles = [...(profiles || []), ...additionalProfiles];
      const allCompanies = [...(companies || []), ...additionalCompanies];

      const connectionsMap = new Map<string, string>();
      (connectionsData || []).forEach(conn => {
        const otherUserId = conn.requester_id === user.id ? conn.addressee_id : conn.requester_id;
        connectionsMap.set(otherUserId, conn.status);
      });

      const rolesMap = new Map<string, string>();
      (rolesData || []).forEach(r => {
        rolesMap.set(r.user_id, r.role);
      });

      const companiesMap = new Map<string, { name: string; industry: string | null }>();
      allCompanies.forEach(c => {
        companiesMap.set(c.user_id, { name: c.name, industry: c.industry });
      });

      const profilesMap = new Map<string, any>();
      allProfiles.forEach(p => {
        profilesMap.set(p.user_id, p);
      });

      const searchResults: SearchResult[] = allUserIds
        .filter(uid => profilesMap.has(uid))
        .map(uid => {
          const profile = profilesMap.get(uid);
          const company = companiesMap.get(uid);
          const connectionStatus = connectionsMap.get(uid) || null;
          const userRole = rolesMap.get(uid) || null;

          return {
            user_id: uid,
            full_name: profile?.full_name || 'Unknown',
            avatar_url: profile?.avatar_url,
            bio: profile?.bio,
            role: userRole,
            company_name: company?.name || null,
            company_industry: company?.industry || null,
            is_connected: connectionStatus === 'accepted',
            connection_status: connectionStatus,
          };
        });

      setResults(searchResults);
    } catch (error) {
      console.error('Network search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [user]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    // Debounce
    const timeout = setTimeout(() => {
      performSearch(value);
    }, 400);

    return () => clearTimeout(timeout);
  }, [performSearch]);

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const getRoleIcon = (role: string | null) => {
    switch (role) {
      case 'investor': return <TrendingUp className="h-3 w-3" />;
      case 'mentor': case 'advisor': return <UserCheck className="h-3 w-3" />;
      case 'accelerator': return <Rocket className="h-3 w-3" />;
      case 'startup': return <Building className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  const getRoleBadgeVariant = (role: string | null): "default" | "secondary" | "outline" => {
    switch (role) {
      case 'investor': return 'default';
      case 'mentor': case 'advisor': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="tech-card border-0">
      <CardContent className="pt-6">
        {/* Search Input */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, company, industry..."
            value={query}
            onChange={handleInputChange}
            className="pl-10 pr-10"
          />
          {query && (
            <Button
              variant="ghost"
              size="icon"
              onClick={clearSearch}
              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Results */}
        {isSearching && (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            <span className="ml-3 text-sm text-muted-foreground">Searching...</span>
          </div>
        )}

        {!isSearching && hasSearched && results.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No results found for "{query}"</p>
          </div>
        )}

        {!isSearching && results.length > 0 && (
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {results.map((result) => (
              <div
                key={result.user_id}
                onClick={() => navigate(`/dashboard?tab=profile&id=${result.user_id}`)}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-accent/50 cursor-pointer transition-colors"
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage src={result.avatar_url || undefined} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm">
                    {result.full_name?.charAt(0)?.toUpperCase() || '?'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">{result.full_name}</span>
                    {result.is_connected && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 gap-1 shrink-0">
                        <UserCheck className="h-2.5 w-2.5" />
                        Connected
                      </Badge>
                    )}
                    {result.connection_status === 'pending' && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                        Pending
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    {result.role && (
                      <Badge variant={getRoleBadgeVariant(result.role)} className="text-[10px] px-1.5 py-0 h-4 gap-1">
                        {getRoleIcon(result.role)}
                        {result.role.charAt(0).toUpperCase() + result.role.slice(1)}
                      </Badge>
                    )}
                    {result.company_name && (
                      <span className="text-xs text-muted-foreground truncate">
                        {result.company_name}
                        {result.company_industry && ` • ${result.company_industry}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {!hasSearched && !isSearching && (
          <div className="text-center py-6">
            <Search className="h-10 w-10 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">
              Find users, investors, mentors, startups & accelerators
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
