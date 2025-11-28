import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building, 
  Users, 
  TrendingUp, 
  DollarSign, 
  Globe, 
  MapPin, 
  FileText, 
  ExternalLink,
  Heart,
  Calendar
} from 'lucide-react';

interface Company {
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
  looking_for?: string[];
}

interface StartupProfileDialogProps {
  company: Company | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExpressInterest?: (companyId: string) => void;
  onSchedulePitch?: (companyId: string, companyName: string) => void;
}

export default function StartupProfileDialog({ 
  company, 
  open, 
  onOpenChange,
  onExpressInterest,
  onSchedulePitch 
}: StartupProfileDialogProps) {
  if (!company) return null;

  const getStageColor = (stage: string) => {
    const colors: Record<string, string> = {
      'pre-seed': 'border-blue-500 text-blue-500',
      'seed': 'border-green-500 text-green-500',
      'series-a': 'border-purple-500 text-purple-500',
      'series-b': 'border-orange-500 text-orange-500',
      'series-c': 'border-red-500 text-red-500',
      'ipo': 'border-yellow-500 text-yellow-500'
    };
    return colors[stage?.toLowerCase()] || 'border-primary text-primary';
  };

  const formatCurrency = (amount: number) => {
    if (!amount) return 'Not disclosed';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="sr-only">{company.name} Profile</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              {company.logo_url ? (
                <AvatarImage src={company.logo_url} alt={company.name} />
              ) : (
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl">
                  {company.name?.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-2">{company.name}</h2>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {company.stage && (
                  <Badge className={getStageColor(company.stage)} variant="outline">
                    {company.stage?.replace('-', ' ').toUpperCase()}
                  </Badge>
                )}
                <Badge variant="secondary">{company.industry}</Badge>
                {company.pitch_deck_url && (
                  <Badge variant="outline" className="gap-1">
                    <FileText className="h-3 w-3" />
                    Pitch Deck Available
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                {company.location && (
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {company.location}
                  </div>
                )}
                {company.website && (
                  <a 
                    href={company.website} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <Globe className="h-3 w-3" />
                    Website
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Team</p>
                    <p className="text-sm font-semibold">{company.team_size || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Seeking</p>
                    <p className="text-sm font-semibold">
                      {company.funding_amount ? `$${(company.funding_amount / 1000000).toFixed(1)}M` : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-border/50">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Stage</p>
                    <p className="text-sm font-semibold">{company.stage || 'N/A'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="deck">Pitch Deck</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2">Description</h3>
              <p className="text-sm text-muted-foreground">
                {company.description || 'No description provided.'}
              </p>
            </div>
            {company.looking_for && company.looking_for.length > 0 && (
              <div>
                <h3 className="font-semibold mb-2">Looking For</h3>
                <div className="flex flex-wrap gap-2">
                  {company.looking_for.map((item, idx) => (
                    <Badge key={idx} variant="secondary">
                      {item}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-3 mt-4">
            <div className="space-y-2">
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Industry</span>
                <span className="text-sm font-medium">{company.industry}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Stage</span>
                <span className="text-sm font-medium">{company.stage || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Location</span>
                <span className="text-sm font-medium">{company.location || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Team Size</span>
                <span className="text-sm font-medium">{company.team_size || 'Not specified'}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Funding Sought</span>
                <span className="text-sm font-medium">{formatCurrency(company.funding_amount || 0)}</span>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="deck" className="mt-4">
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
          </TabsContent>
        </Tabs>

        {/* Actions - only show if callbacks provided */}
        {(onSchedulePitch || onExpressInterest) && (
          <div className="flex gap-3 pt-4 border-t border-border/50">
            {onSchedulePitch && (
              <Button 
                className="flex-1" 
                size="lg"
                onClick={() => onSchedulePitch(company.id, company.name)}
              >
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Pitch
              </Button>
            )}
            {onExpressInterest && (
              <Button 
                className="flex-1" 
                size="lg"
                onClick={() => onExpressInterest(company.id)}
              >
                <Heart className="h-4 w-4 mr-2" />
                Express Interest
              </Button>
            )}
            <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
