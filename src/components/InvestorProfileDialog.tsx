import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { 
  DollarSign, 
  TrendingUp, 
  Briefcase, 
  Target,
  MessageSquare,
  Building
} from 'lucide-react';

interface Investor {
  id: string;
  user_id: string;
  full_name: string;
  avatar_url?: string;
  preferred_industries: string[];
  investment_range_min?: number;
  investment_range_max?: number;
  portfolio_size?: number;
  bio?: string;
  connection_type?: 'invested' | 'interested';
  investment_amount?: number;
  investment_date?: string;
  preferred_stages?: string[];
  total_invested?: number;
}

interface InvestorProfileDialogProps {
  investor: Investor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onMessage?: (userId: string) => void;
}

export default function InvestorProfileDialog({ 
  investor, 
  open, 
  onOpenChange,
  onMessage 
}: InvestorProfileDialogProps) {
  if (!investor) return null;

  const formatCurrency = (amount: number) => {
    if (!amount) return 'Not disclosed';
    if (amount >= 1000000) {
      return `$${(amount / 1000000).toFixed(1)}M`;
    } else if (amount >= 1000) {
      return `$${(amount / 1000).toFixed(0)}K`;
    }
    return `$${amount}`;
  };

  const getConnectionBadge = () => {
    if (investor.connection_type === 'invested') {
      return (
        <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
          <DollarSign className="h-3 w-3 mr-1" />
          Invested
        </Badge>
      );
    }
    if (investor.connection_type === 'interested') {
      return (
        <Badge variant="outline" className="border-primary/50 text-primary">
          Interested
        </Badge>
      );
    }
    return null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto !transition-none">
        <DialogHeader>
          <DialogTitle className="sr-only">{investor.full_name} Profile</DialogTitle>
        </DialogHeader>

        {/* Header */}
        <div className="space-y-4">
          <div className="flex items-start gap-4">
            <Avatar className="h-16 w-16">
              {investor.avatar_url ? (
                <AvatarImage src={investor.avatar_url} alt={investor.full_name} />
              ) : (
                <AvatarFallback className="bg-gradient-primary text-primary-foreground text-xl">
                  {investor.full_name?.charAt(0)}
                </AvatarFallback>
              )}
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-foreground mb-2">{investor.full_name}</h2>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="secondary">Investor</Badge>
                {getConnectionBadge()}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3">
            <Card className="tech-card border-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">Portfolio</p>
                    <p className="text-sm font-semibold">{investor.portfolio_size || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="tech-card border-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Range</p>
                    <p className="text-sm font-semibold">
                      {investor.investment_range_min && investor.investment_range_max 
                        ? `${formatCurrency(investor.investment_range_min)}-${formatCurrency(investor.investment_range_max)}`
                        : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="tech-card border-0">
              <CardContent className="p-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-accent" />
                  <div>
                    <p className="text-xs text-muted-foreground">Invested</p>
                    <p className="text-sm font-semibold">
                      {formatCurrency(investor.total_invested || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="about" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="focus">Investment Focus</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4 mt-4">
            <div>
              <h3 className="font-semibold mb-2">Bio</h3>
              <p className="text-sm text-muted-foreground">
                {investor.bio || 'No bio provided.'}
              </p>
            </div>

            {investor.connection_type === 'invested' && investor.investment_amount && (
              <div>
                <h3 className="font-semibold mb-2">Investment Details</h3>
                <div className="p-4 bg-green-500/5 rounded-lg border border-green-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Amount Invested</span>
                    <span className="text-lg font-bold text-green-500">
                      {formatCurrency(investor.investment_amount)}
                    </span>
                  </div>
                  {investor.investment_date && (
                    <div className="text-sm text-muted-foreground">
                      Invested on {new Date(investor.investment_date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="focus" className="space-y-4 mt-4">
            {investor.preferred_stages && investor.preferred_stages.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Preferred Stages
                </h3>
                <div className="flex flex-wrap gap-2">
                  {investor.preferred_stages.map((stage, idx) => (
                    <Badge key={idx} variant="outline" className="border-primary/50">
                      {stage}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {investor.preferred_industries && investor.preferred_industries.length > 0 && (
              <div>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Building className="h-4 w-4" />
                  Preferred Industries
                </h3>
                <div className="flex flex-wrap gap-2">
                  {investor.preferred_industries.map((industry, idx) => (
                    <Badge key={idx} variant="secondary">
                      {industry}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {investor.investment_range_min && investor.investment_range_max && (
              <div>
                <h3 className="font-semibold mb-3">Investment Range</h3>
                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Minimum</p>
                      <p className="text-lg font-semibold">{formatCurrency(investor.investment_range_min)}</p>
                    </div>
                    <div className="text-muted-foreground">—</div>
                    <div>
                      <p className="text-sm text-muted-foreground">Maximum</p>
                      <p className="text-lg font-semibold">{formatCurrency(investor.investment_range_max)}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t border-border/50">
          {onMessage && (
            <Button 
              className="flex-1" 
              size="lg"
              onClick={() => {
                onMessage(investor.user_id);
                onOpenChange(false);
              }}
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Send Message
            </Button>
          )}
          <Button variant="outline" size="lg" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
