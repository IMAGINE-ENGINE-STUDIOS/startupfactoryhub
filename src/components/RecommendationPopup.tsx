import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Loader2, Lightbulb, Users, TrendingUp, GraduationCap, Target, Zap, BookOpen } from 'lucide-react';
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
  const { user } = useAuth();
  const { toast } = useToast();
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
      const { data, error } = await supabase.functions.invoke('generate-recommendations');
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
      case 'connection': return <Users className="h-5 w-5" />;
      case 'investor': return <TrendingUp className="h-5 w-5" />;
      case 'course': return <GraduationCap className="h-5 w-5" />;
      case 'strategy': return <Target className="h-5 w-5" />;
      case 'tip': return <Zap className="h-5 w-5" />;
      case 'action': return <BookOpen className="h-5 w-5" />;
      case 'resource': return <Lightbulb className="h-5 w-5" />;
      default: return <Lightbulb className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'connection': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'investor': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'course': return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
      case 'strategy': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      case 'tip': return 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20';
      case 'action': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
      case 'resource': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      default: return 'bg-orange-500/10 text-orange-500 border-orange-500/20';
    }
  };

  return (
    <ScrollArea className="h-[60vh] max-h-[400px] w-full">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
          <p className="text-muted-foreground text-sm">Loading recommendations...</p>
        </div>
      ) : recommendations.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground text-sm text-center">No recommendations available at the moment</p>
        </div>
      ) : (
        <div className="space-y-3 p-4">
          {recommendations.map((rec, index) => (
            <Card key={index} className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${getTypeColor(rec.type)}`}>
                  {getIcon(rec.type)}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{rec.title}</h4>
                    <Badge variant="outline" className={getTypeColor(rec.type)}>
                      {rec.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </ScrollArea>
  );
}
