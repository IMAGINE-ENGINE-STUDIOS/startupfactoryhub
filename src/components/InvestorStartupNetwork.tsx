import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { Building, Users, ExternalLink } from 'lucide-react';
import StartupProfileDialog from './StartupProfileDialog';
import { useInvestorNetwork } from '@/hooks/useInvestorNetwork';

export default function InvestorStartupNetwork() {
  const { user } = useAuth();
  const { startups, loading } = useInvestorNetwork(user?.id);
  const [selectedStartup, setSelectedStartup] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  if (loading) {
    return (
      <Card className="tech-card border-0">
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading network...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="tech-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          Your Startup Network
        </CardTitle>
      </CardHeader>
      <CardContent>
        {startups.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Building className="h-12 w-12 mx-auto mb-3 opacity-20" />
            <p>No startups in your network yet</p>
            <p className="text-sm mt-1">Start by expressing interest in startups</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {startups.map((startup) => (
              <Card key={startup.id} className="border border-border/50 hover:border-primary/50 transition-colors">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="h-10 w-10">
                      {startup.logo_url ? (
                        <AvatarImage src={startup.logo_url} alt={startup.name} />
                      ) : (
                        <AvatarFallback className="bg-gradient-primary text-primary-foreground">
                          {startup.name.charAt(0)}
                        </AvatarFallback>
                      )}
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate">{startup.name}</h3>
                      <Badge
                        variant={
                          startup.connection_type === 'invested' ? 'default' : 
                          startup.connection_type === 'interested' ? 'secondary' : 
                          'outline'
                        }
                        className="text-xs mt-1"
                      >
                        {startup.connection_type === 'invested' ? 'Invested' : 
                         startup.connection_type === 'interested' ? 'Interested' : 
                         'Available'}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {startup.description}
                  </p>
                  
                  <div className="flex gap-2 mb-3">
                  <Badge variant="outline" className="text-xs">{startup.stage}</Badge>
                  <Badge variant="outline" className="text-xs">{startup.industry}</Badge>
                </div>
                
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="w-full"
                  onClick={() => {
                    setSelectedStartup(startup);
                    setDialogOpen(true);
                  }}
                >
                  <ExternalLink className="h-3 w-3 mr-2" />
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <StartupProfileDialog 
        company={selectedStartup}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
      />
    </CardContent>
  </Card>
  );
}
