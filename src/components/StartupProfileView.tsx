import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, Users, TrendingUp, DollarSign, Globe, MapPin, FileText, ExternalLink } from 'lucide-react';
import ProfileSubscriptionTab from './ProfileSubscriptionTab';
import ProfilePayoutsTab from './ProfilePayoutsTab';

interface StartupProfileViewProps {
  company: {
    id: string;
    name: string;
    description: string;
    industry: string;
    stage: string;
    website?: string;
    location?: string;
    team_size?: number;
    funding_amount?: number;
    logo_url?: string;
    pitch_deck_url?: string;
  };
}

export default function StartupProfileView({ company }: StartupProfileViewProps) {
  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'pre-seed': 'border-blue-500 text-blue-500',
      'seed': 'border-green-500 text-green-500',
      'series-a': 'border-purple-500 text-purple-500',
      'series-b': 'border-orange-500 text-orange-500',
      'series-c': 'border-red-500 text-red-500',
      'ipo': 'border-yellow-500 text-yellow-500'
    };
    return colors[stage] || 'border-primary text-primary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="tech-card border-0">
        <CardContent className="p-8">
          <div className="flex items-start space-x-6">
            <Avatar className="h-20 w-20">
              {company.logo_url ? (
                <AvatarImage src={company.logo_url} alt={company.name} />
              ) : (
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-2xl">
                  {company.name?.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-foreground mb-2">{company.name}</h1>
              <p className="text-muted-foreground mb-4 max-w-2xl">{company.description}</p>
              <div className="flex flex-wrap items-center gap-3">
                {company.stage && (
                  <Badge className={getStageColor(company.stage)} variant="outline">
                    {company.stage?.replace('-', ' ').charAt(0).toUpperCase() + company.stage?.slice(1)}
                  </Badge>
                )}
                <Badge variant="secondary">{company.industry}</Badge>
                {company.location && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mr-1" />
                    {company.location}
                  </div>
                )}
                {company.website && (
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Globe className="h-4 w-4 mr-1" />
                    <a href={company.website} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                      Website
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Team Size</p>
                <p className="text-2xl font-bold text-foreground">{company.team_size || 'N/A'}</p>
              </div>
              <Users className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Funding Raised</p>
                <p className="text-2xl font-bold text-foreground">
                  {company.funding_amount ? `$${(company.funding_amount / 1000000).toFixed(1)}M` : 'N/A'}
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Stage</p>
                <p className="text-2xl font-bold text-foreground">
                  {company.stage?.replace('-', ' ') || 'Startup'}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-accent" />
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Industry</p>
                <p className="text-xl font-bold text-foreground">{company.industry}</p>
              </div>
              <Building className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Details */}
      <Tabs defaultValue={new URLSearchParams(window.location.search).get('subtab') || "about"} className="space-y-6">
        <TabsList className="flex w-full max-w-3xl overflow-x-auto scrollbar-hide whitespace-nowrap">
          <TabsTrigger value="about" className="flex-1">About</TabsTrigger>
          <TabsTrigger value="details" className="flex-1">Company Details</TabsTrigger>
          <TabsTrigger value="deck" className="flex-1">Pitch Deck</TabsTrigger>
          <TabsTrigger value="subscription" className="flex-1">Subscription</TabsTrigger>
          <TabsTrigger value="payouts" className="flex-1">Payouts</TabsTrigger>
        </TabsList>

        <TabsContent value="about" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Company Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                {company.description || 'No description provided yet.'}
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle>Key Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Industry:</span>
                  <span className="font-medium">{company.industry}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Stage:</span>
                  <span className="font-medium">{company.stage || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{company.location || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Team Size:</span>
                  <span className="font-medium">{company.team_size || 'Not specified'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Funding:</span>
                  <span className="font-medium">
                    {company.funding_amount ? `$${(company.funding_amount / 1000000).toFixed(1)}M` : 'Not specified'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="deck" className="space-y-4">
          <Card className="tech-card border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Pitch Deck
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.pitch_deck_url ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 p-4 bg-muted/50 rounded-lg">
                    <FileText className="h-12 w-12 text-primary" />
                    <div className="flex-1">
                      <p className="font-medium text-lg">{company.name} - Pitch Deck</p>
                      <p className="text-sm text-muted-foreground">PDF Document</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => window.open(company.pitch_deck_url, '_blank')}
                    className="w-full"
                    size="lg"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    View Pitch Deck
                  </Button>
                  <p className="text-sm text-muted-foreground text-center">
                    Download or view the complete pitch deck to learn more about {company.name}
                  </p>
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-30" />
                  <p className="text-muted-foreground">No pitch deck available yet</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    The company hasn't uploaded their pitch deck
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscription" className="space-y-4">
          <ProfileSubscriptionTab />
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <ProfilePayoutsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
