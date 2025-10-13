import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Sparkles, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Recommendation {
  title: string;
  description: string;
  action: string;
  type: string;
}

export default function StartupAIRecommendations() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchRecommendations();
    }
  }, [user]);

  const fetchRecommendations = async () => {
    if (!user) return;

    try {
      setLoading(true);

      // Fetch user's profile and company data for context
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: companyData } = await supabase
        .from('companies')
        .select('*')
        .eq('user_id', user.id)
        .single();

      // Call the generate-recommendations edge function
      const { data, error } = await supabase.functions.invoke('generate-recommendations', {
        body: {
          user_id: user.id,
          role: 'startup',
          context: {
            company_name: companyData?.name,
            industry: companyData?.industry,
            stage: companyData?.stage,
            description: companyData?.description,
            location: profileData?.location,
          }
        }
      });

      if (error) {
        console.error('Error fetching recommendations:', error);
        throw error;
      }

      if (data?.recommendations) {
        setRecommendations(data.recommendations);
      }
    } catch (error) {
      console.error('Error:', error);
      toast({
        title: "Unable to fetch recommendations",
        description: "We'll try again shortly.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>AI Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>AI Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-4">
            Complete your profile to get personalized recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>AI Recommendations</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[600px] overflow-y-auto">
        {recommendations.map((rec, index) => (
          <div
            key={index}
            className="p-4 rounded-lg border border-border bg-card"
          >
            <h4 className="font-semibold text-foreground mb-2">{rec.title}</h4>
            <p className="text-sm text-muted-foreground">{rec.description}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
