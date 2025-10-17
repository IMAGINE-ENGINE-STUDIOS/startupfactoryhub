import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Lightbulb, X, Users, TrendingUp, GraduationCap, Sparkles } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Recommendation {
  type: 'connection' | 'investor' | 'course' | 'general';
  title: string;
  description: string;
  reference_id?: string;
}

export default function RecommendationPopup() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);

  useEffect(() => {
    if (!user) return;

    // Show popup 5 seconds after login
    const timer = setTimeout(() => {
      loadRecommendations();
    }, 5000);

    return () => clearTimeout(timer);
  }, [user]);

  const loadRecommendations = async () => {
    if (!user) return;

    setIsLoading(true);
    setIsOpen(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-recommendations');

      if (error) throw error;

      setRecommendations(data.recommendations || []);
    } catch (error) {
      console.error('Error loading recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load recommendations. Please try again later.',
        variant: 'destructive',
      });
      setIsOpen(false);
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[85vh] shadow-2xl border-2 flex flex-col">
        <CardHeader className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-4 top-4"
            onClick={() => setIsOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-primary" />
            <CardTitle className="text-xl sm:text-2xl break-words">AI-Powered Recommendations</CardTitle>
          </div>
          <CardDescription>
            Personalized suggestions to help you grow your startup
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-y-auto flex-1">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <p className="text-muted-foreground text-sm sm:text-base">Generating personalized recommendations...</p>
            </div>
          ) : (
            <div className="space-y-4 pb-4">
              {recommendations.map((rec, index) => (
                <Card key={index} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Badge variant="outline" className={`${getTypeColor(rec.type)} mt-1 flex-shrink-0`}>
                        {getIcon(rec.type)}
                      </Badge>
                      <div className="flex-1 min-w-0 space-y-2">
                        <h3 className="font-semibold text-base sm:text-lg break-words">{rec.title}</h3>
                        <p className="text-muted-foreground text-sm leading-relaxed break-words">
                          {rec.description}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
