import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Gift, ExternalLink, Copy, Tag, Lock } from 'lucide-react';
import { useStartupProgramResources } from '@/hooks/useStartupProgramResources';
import { toast } from 'sonner';

export const ProgramResourcesWidget = () => {
  const { resources, loading, hasEnrollments } = useStartupProgramResources();

  const copyPromoCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Promo code copied to clipboard!');
  };

  // Don't show anything if startup isn't enrolled in any programs
  if (!loading && !hasEnrollments) {
    return null;
  }

  if (loading) {
    return (
      <Card className="tech-card border-0">
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[1, 2].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (resources.length === 0) {
    return (
      <Card className="tech-card border-0">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Lock className="h-5 w-5 text-emerald-400" />
            Program Perks
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Gift className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No exclusive resources available yet.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Your accelerator will share perks here.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group resources by accelerator
  const groupedResources = resources.reduce((acc, resource) => {
    const key = resource.accelerator_name;
    if (!acc[key]) {
      acc[key] = {
        logo: resource.accelerator_logo,
        cohort: resource.cohort_name,
        resources: [],
      };
    }
    acc[key].resources.push(resource);
    return acc;
  }, {} as Record<string, { logo: string | null; cohort: string; resources: typeof resources }>);

  return (
    <Card className="tech-card border-0">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Gift className="h-5 w-5 text-emerald-400" />
          Program Perks
          <Badge variant="secondary" className="ml-auto text-xs">
            {resources.length} available
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.entries(groupedResources).map(([acceleratorName, group]) => (
          <div key={acceleratorName}>
            <div className="flex items-center gap-2 mb-3">
              {group.logo ? (
                <img
                  src={group.logo}
                  alt={acceleratorName}
                  className="w-6 h-6 rounded object-cover"
                />
              ) : (
                <div className="w-6 h-6 rounded bg-emerald-500/20 flex items-center justify-center">
                  <Lock className="h-3 w-3 text-emerald-400" />
                </div>
              )}
              <span className="text-sm font-medium">{acceleratorName}</span>
              <Badge variant="outline" className="text-xs ml-auto">
                {group.cohort}
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {group.resources.map(resource => (
                <div
                  key={resource.id}
                  className="p-3 rounded-lg bg-muted/30 border border-border/50 hover:border-emerald-500/30 transition-colors"
                >
                  <div className="flex items-start gap-2 mb-2">
                    {resource.logo_url ? (
                      <img
                        src={resource.logo_url}
                        alt={resource.title}
                        className="w-8 h-8 rounded object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                        <Gift className="h-4 w-4 text-emerald-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <h4 className="text-sm font-medium truncate">{resource.title}</h4>
                      <Badge variant="outline" className="text-xs">
                        {resource.resource_type}
                      </Badge>
                    </div>
                  </div>

                  {resource.discount_details && (
                    <p className="text-xs text-amber-400 mb-2">
                      {resource.discount_details}
                    </p>
                  )}

                  {resource.promo_code && (
                    <div className="flex items-center gap-2 mb-2">
                      <Tag className="h-3 w-3 text-emerald-400" />
                      <code className="text-xs bg-emerald-500/10 px-2 py-0.5 rounded text-emerald-400">
                        {resource.promo_code}
                      </code>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() => copyPromoCode(resource.promo_code!)}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {resource.website_url && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full gap-1 h-7 text-xs"
                      onClick={() => window.open(resource.website_url!, '_blank')}
                    >
                      <ExternalLink className="h-3 w-3" />
                      Redeem
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};
