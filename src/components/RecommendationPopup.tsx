import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, Lightbulb, Users, TrendingUp, GraduationCap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
export interface Recommendation {
  type: 'connection' | 'investor' | 'course' | 'general';
  title: string;
  description: string;
  reference_id?: string;
}
interface RecommendationPopupProps {
  onRecommendationsLoad?: (count: number) => void;
}
export default function RecommendationPopup({
  onRecommendationsLoad
}: RecommendationPopupProps) {
  const {
    user
  } = useAuth();
  const {
    toast
  } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  useEffect(() => {
    if (!user) return;
    loadRecommendations();
  }, [user]);
  const loadRecommendations = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const {
        data,
        error
      } = await supabase.functions.invoke('generate-recommendations');
      if (error) throw error;
      const recs = data.recommendations || [];
      setRecommendations(recs);
      onRecommendationsLoad?.(recs.length);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recommendations. Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  const getIcon = (type: string) => {
    switch (type) {
      case 'connection':
        return <Users className="h-5 w-5" />;
      case 'investor':
        return <TrendingUp className="h-5 w-5" />;
      case 'course':
        return <GraduationCap className="h-5 w-5" />;
      default:
        return <Lightbulb className="h-5 w-5" />;
    }
  };
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'connection':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'investor':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'course':
        return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      default:
        return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    }
  };
  return <ScrollArea className="h-[400px] w-full">
      {isLoading ? <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground text-sm">Loading recommendations...</p>
        </div> : recommendations.length === 0 ? <div className="flex flex-col items-center justify-center py-12 px-4">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-sm text-center">No recommendations available at the moment</p>
        </div> : <div className="space-y-3 p-4">
          {recommendations.map((rec, index) => (
            <Card key={index} className="p-3 hover:bg-accent/50 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                <Badge variant="outline" className={getTypeColor(rec.type)}>
                  {getIcon(rec.type)}
                </Badge>
                <div className="flex-1">
                  <h4 className="font-medium text-sm mb-1">{rec.title}</h4>
                  <p className="text-xs text-muted-foreground">{rec.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>}
    </ScrollArea>;
}