import { useState, useEffect } from 'react';
import { Wallet, Plane, Building, CreditCard, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import frontierPassImg from '@/assets/frontier-pass.webp';
import sfhPassImg from '@/assets/sfh-pass.png';
import SoftLandingRequestDialog from '@/components/SoftLandingRequestDialog';

interface Pass {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tier: string;
  active: boolean;
  details: string;
  gradient: string;
  image?: string;
  action?: React.ReactNode;
}

export default function WalletPasses({ className }: { className?: string }) {
  const { isSubscribed, tier } = useMembershipStatus();
  const { user } = useAuth();
  const [frontierApproved, setFrontierApproved] = useState(false);
  const [frontierRequested, setFrontierRequested] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [softLandingRequest, setSoftLandingRequest] = useState<any>(null);
  const [softLandingDialogOpen, setSoftLandingDialogOpen] = useState(false);

  useEffect(() => {
    if (!user || !isSubscribed) return;
    const checkStatuses = async () => {
      // Check frontier status (corporate only)
      if (tier === 'corporate') {
        const { data } = await supabase
          .from('flight_pass_requests')
          .select('status')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) {
          setFrontierApproved(data.status === 'approved');
          setFrontierRequested(true);
        }
      }
      // Check soft landing request
      const { data: slData } = await supabase
        .from('soft_landing_requests')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (slData) {
        setSoftLandingRequest(slData);
      }
    };
    checkStatuses();
  }, [user, isSubscribed, tier]);

  const requestFrontierPass = async () => {
    if (!user) return;
    setRequesting(true);
    const { error } = await supabase
      .from('flight_pass_requests')
      .insert({ user_id: user.id, tier: 'corporate' });
    if (!error) {
      setFrontierRequested(true);
    }
    setRequesting(false);
  };

  const passes: Pass[] = [];

  // Frontier Airlines Pass — Corporate tier only, approved by admin
  if (isSubscribed && tier === 'corporate' && frontierApproved) {
    passes.push({
      id: 'frontier-airlines',
      title: 'Frontier Airlines',
      subtitle: 'GoWild! All-You-Can-Fly',
      icon: <Plane className="h-5 w-5" />,
      tier: 'Corporate',
      active: true,
      details: 'Unlimited travel to 11 countries. Pay only ticket taxes.',
      gradient: 'from-emerald-600 to-teal-500',
      image: frontierPassImg,
    });
  }

  // Coworking Pass — All paid tiers
  if (isSubscribed) {
    const coworkingLabel =
      tier === 'corporate'
        ? 'Premium Office'
        : tier === 'global_access'
        ? 'Office Access'
        : tier === 'self_paced'
        ? 'Desk Access'
        : 'Community Space';

    passes.push({
      id: 'coworking',
      title: 'Startup Factory Hub',
      subtitle: coworkingLabel + ' — Global Network',
      icon: <Building className="h-5 w-5" />,
      tier: tier.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      active: true,
      details: 'Access coworking spaces worldwide.',
      gradient: 'from-primary to-accent',
      image: sfhPassImg,
    });
  }

  // Soft Landing — show for all subscribers, different pricing
  if (isSubscribed) {
    const isCorporate = tier === 'corporate';
    const price = isCorporate ? '$5,000' : '$7,500';
    const hasActiveRequest = softLandingRequest && ['pending', 'in_progress'].includes(softLandingRequest.status);
    const isCompleted = softLandingRequest?.status === 'completed';

    passes.push({
      id: 'soft-landing',
      title: 'Soft Landing Program',
      subtitle: `Global Expansion — ${price}`,
      icon: <Globe className="h-5 w-5" />,
      tier: isCorporate ? 'Corporate' : 'Standard',
      active: true,
      details: `Corporate registration, legal address, documents & legal advice. Expand to Japan, USA, Europe, Chile or Venezuela.${isCorporate ? ' Corporate discount applied.' : ''}`,
      gradient: 'from-violet-600 to-purple-500',
      action: hasActiveRequest ? (
        <Badge variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-600">
          {softLandingRequest.status === 'pending' ? 'Pending Review' : 'In Progress'}
          {softLandingRequest.target_country ? ` — ${softLandingRequest.target_country}` : ''}
        </Badge>
      ) : isCompleted ? (
        <Badge variant="outline" className="text-[10px] border-green-500/50 text-green-600">
          Completed — {softLandingRequest.target_country}
        </Badge>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="text-[10px] h-6 px-2"
          onClick={() => setSoftLandingDialogOpen(true)}
        >
          Request Service
        </Button>
      ),
    });
  }

  return (
    <>
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className={cn('relative', className)} title="Wallet Passes">
            <Wallet className="h-4 w-4 sm:h-5 sm:w-5" />
            {passes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[9px] sm:text-[10px] flex items-center justify-center text-primary-foreground">
                {passes.length}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 sm:w-96 p-0 bg-background border-border backdrop-blur-none" align="end">
          <div className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">My Passes</h3>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Your active membership passes & benefits
            </p>
          </div>
          <div className="p-3 space-y-3 max-h-[500px] overflow-y-auto">
            {passes.length === 0 && !frontierRequested ? (
              <div className="py-8 text-center text-muted-foreground">
                <Wallet className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No active passes</p>
                <p className="text-xs mt-1">Subscribe to a plan to unlock passes</p>
              </div>
            ) : null}

            {/* Frontier pass request CTA for corporate users who haven't requested yet */}
            {isSubscribed && tier === 'corporate' && !frontierRequested && (
              <div className="rounded-xl border border-dashed border-emerald-500/50 p-4 text-center space-y-2">
                <Plane className="h-8 w-8 mx-auto text-emerald-500" />
                <p className="text-sm font-semibold">Frontier Airlines GoWild! Pass</p>
                <p className="text-xs text-muted-foreground">Request your unlimited travel pass. Admin will set up your account and approve it.</p>
                <Button
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={requestFrontierPass}
                  disabled={requesting}
                >
                  {requesting ? 'Requesting...' : 'Request Pass'}
                </Button>
              </div>
            )}

            {/* Pending status */}
            {isSubscribed && tier === 'corporate' && frontierRequested && !frontierApproved && (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-center space-y-1">
                <Plane className="h-8 w-8 mx-auto text-yellow-500" />
                <p className="text-sm font-semibold">Frontier Pass — Pending Approval</p>
                <p className="text-xs text-muted-foreground">Your pass is being set up. The admin will approve it once your Frontier account is ready.</p>
              </div>
            )}

            {/* Apple Wallet-style pass cards */}
            {passes.map((pass) => (
              <div
                key={pass.id}
                className="rounded-2xl overflow-hidden shadow-lg"
                style={{ minHeight: pass.image ? '200px' : undefined }}
              >
                {/* Card image header */}
                {pass.image && (
                  <div className="relative w-full h-36 overflow-hidden">
                    <img
                      src={pass.image}
                      alt={pass.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3">
                      <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-[10px]">
                        {pass.tier}
                      </Badge>
                    </div>
                  </div>
                )}
                {/* Card body */}
                <div className={cn(
                  'p-4 space-y-2',
                  pass.image
                    ? 'bg-gradient-to-b from-card to-background'
                    : `bg-gradient-to-r ${pass.gradient} p-[1px]`
                )}>
                  {!pass.image && (
                    <div className="rounded-[11px] bg-background p-4 space-y-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn('p-1.5 rounded-lg bg-gradient-to-r text-white', pass.gradient)}>
                            {pass.icon}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-foreground leading-tight">{pass.title}</p>
                            <p className="text-xs text-muted-foreground">{pass.subtitle}</p>
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px] shrink-0">
                          {pass.tier}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{pass.details}</p>
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] font-medium text-green-600">Active</span>
                        </div>
                        {pass.action}
                      </div>
                    </div>
                  )}
                  {pass.image && (
                    <>
                      <div className="flex items-center gap-2">
                        <div className={cn('p-1.5 rounded-lg bg-gradient-to-r text-white', pass.gradient)}>
                          {pass.icon}
                        </div>
                        <div>
                          <p className="font-semibold text-sm text-foreground leading-tight">{pass.title}</p>
                          <p className="text-xs text-muted-foreground">{pass.subtitle}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">{pass.details}</p>
                      <div className="flex items-center justify-between gap-1.5">
                        <div className="flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-[10px] font-medium text-green-600">Active</span>
                        </div>
                        {pass.action}
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}

            {passes.length === 0 && frontierRequested && !frontierApproved && !isSubscribed && (
              <div className="py-8 text-center text-muted-foreground">
                <Wallet className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm font-medium">No active passes</p>
                <p className="text-xs mt-1">Subscribe to a plan to unlock passes</p>
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>

      <SoftLandingRequestDialog
        open={softLandingDialogOpen}
        onOpenChange={setSoftLandingDialogOpen}
        isCorporate={tier === 'corporate'}
        onSuccess={(data) => setSoftLandingRequest(data)}
      />
    </>
  );
}
