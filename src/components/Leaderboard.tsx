import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Trophy, Medal, Award, TrendingUp } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface LeaderboardEntry {
  id: string;
  user_id: string;
  points: number;
  rank: number | null;
  achievements_count: number;
  courses_completed: number;
  profile?: {
    full_name: string;
    avatar_url?: string;
  };
}

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [userEntry, setUserEntry] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchLeaderboard();
      fetchOrCreateUserEntry();
    }
  }, [user]);

  const fetchLeaderboard = async () => {
    const { data, error } = await supabase
      .from('leaderboard_entries')
      .select(`
        *,
        profile:user_id (
          full_name,
          avatar_url
        )
      `)
      .order('points', { ascending: false })
      .limit(10);

    if (!error && data) {
      // Calculate ranks
      const rankedData = data.map((entry, index) => ({
        ...entry,
        rank: index + 1,
        profile: Array.isArray(entry.profile) ? entry.profile[0] : entry.profile
      }));
      setEntries(rankedData);
    }
    setLoading(false);
  };

  const fetchOrCreateUserEntry = async () => {
    if (!user) return;

    let { data, error } = await supabase
      .from('leaderboard_entries')
      .select(`
        *,
        profile:user_id (
          full_name,
          avatar_url
        )
      `)
      .eq('user_id', user.id)
      .single();

    // If no entry exists, create one
    if (error && error.code === 'PGRST116') {
      const { data: newEntry, error: insertError } = await supabase
        .from('leaderboard_entries')
        .insert([{ user_id: user.id, points: 0 }])
        .select(`
          *,
          profile:user_id (
            full_name,
            avatar_url
          )
        `)
        .single();

      if (!insertError && newEntry) {
        data = newEntry;
      }
    }

    if (data) {
      setUserEntry({
        ...data,
        profile: Array.isArray(data.profile) ? data.profile[0] : data.profile
      });
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2:
        return <Medal className="h-6 w-6 text-gray-400" />;
      case 3:
        return <Medal className="h-6 w-6 text-orange-600" />;
      default:
        return <Award className="h-5 w-5 text-muted-foreground" />;
    }
  };

  if (loading) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="p-6">
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-primary" />
            <span>Leaderboard</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className={`flex items-center justify-between p-4 rounded-lg transition-all ${
                entry.user_id === user?.id
                  ? 'bg-primary/10 border-2 border-primary'
                  : 'bg-muted/30 hover:bg-muted/50'
              }`}
            >
              <div className="flex items-center space-x-4 flex-1">
                <div className="flex items-center justify-center w-10">
                  {getRankIcon(entry.rank || index + 1)}
                </div>
                <Avatar className="h-12 w-12">
                  <AvatarImage src={entry.profile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {entry.profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-semibold text-foreground">
                    {entry.profile?.full_name || 'Anonymous'}
                    {entry.user_id === user?.id && (
                      <Badge variant="secondary" className="ml-2 text-xs">You</Badge>
                    )}
                  </p>
                  <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                    <span>{entry.achievements_count} achievements</span>
                    <span>•</span>
                    <span>{entry.courses_completed} courses</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-primary">{entry.points}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          ))}

          {entries.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No leaderboard entries yet</p>
              <p className="text-sm">Complete courses to earn points!</p>
            </div>
          )}
        </CardContent>
      </Card>

      {userEntry && !entries.find(e => e.user_id === user?.id) && (
        <Card className="tech-card border-0">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-2">Your Rank</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={userEntry.profile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                    {userEntry.profile?.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{userEntry.profile?.full_name}</span>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-primary">{userEntry.points}</p>
                <p className="text-xs text-muted-foreground">points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
