import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Star, Target, Zap } from "lucide-react";
interface Achievement {
  id: string;
  type: string;
  title: string;
  description: string;
  icon: string;
  earned_at: string;
}
const AchievementsBadges = () => {
  const {
    user
  } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  useEffect(() => {
    if (user) {
      fetchAchievements();
    }
  }, [user]);
  const fetchAchievements = async () => {
    if (!user) return;
    try {
      const {
        data,
        error
      } = await supabase.from('achievements').select('*').eq('user_id', user.id).order('earned_at', {
        ascending: false
      });
      if (!error && data) {
        const mappedData = data.map(a => ({
          id: a.id,
          type: a.achievement_type,
          title: a.title,
          description: a.description || '',
          icon: a.icon || 'trophy',
          earned_at: a.earned_at || new Date().toISOString()
        }));
        setAchievements(mappedData);
      } else {
        // If no achievements found, check for potential new ones to auto-award
        await checkAndAwardAchievements();
      }
    } catch (error) {
      console.error('Error fetching achievements:', error);
    }
  };
  const checkAndAwardAchievements = async () => {
    if (!user) return;

    // Check for connections achievement
    const {
      data: connections
    } = await supabase.from('connections').select('*').or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`).eq('status', 'accepted');

    // Check for posts achievement
    const {
      data: posts
    } = await supabase.from('feed_posts').select('*').eq('user_id', user.id);
    const newAchievements: any[] = [];
    if (connections && connections.length >= 5) {
      newAchievements.push({
        user_id: user.id,
        achievement_type: 'connection',
        title: 'Networker',
        description: 'Made 5+ connections',
        icon: 'trophy'
      });
    }
    if (posts && posts.length >= 3) {
      newAchievements.push({
        user_id: user.id,
        achievement_type: 'post',
        title: 'Content Creator',
        description: 'Published 3+ posts',
        icon: 'star'
      });
    }
    if (newAchievements.length > 0) {
      await supabase.from('achievements').insert(newAchievements);
      fetchAchievements(); // Refresh after inserting
    }
  };
  const getAchievementIcon = (icon: string) => {
    switch (icon) {
      case 'trophy':
        return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 'star':
        return <Star className="h-6 w-6 text-blue-500" />;
      case 'target':
        return <Target className="h-6 w-6 text-green-500" />;
      case 'zap':
        return <Zap className="h-6 w-6 text-purple-500" />;
      default:
        return <Trophy className="h-6 w-6 text-yellow-500" />;
    }
  };
  return <Card>
      
      
    </Card>;
};
export default AchievementsBadges;