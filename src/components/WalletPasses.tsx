import { Wallet, Plane, Building, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { cn } from '@/lib/utils';

interface Pass {
  id: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  tier: string;
  active: boolean;
  details: string;
  gradient: string;
}

export default function WalletPasses({ className }: { className?: string }) {
  const { isSubscribed, tier } = useMembershipStatus();

  const passes: Pass[] = [];

  // Frontier Airlines Pass — Corporate tier only
  if (isSubscribed && tier === 'corporate') {
    passes.push({
      id: 'frontier-airlines',
      title: 'Frontier Airlines Pass',
      subtitle: 'Unlimited Travel — Pay Only Taxes',
      icon: <Plane className="h-5 w-5" />,
      tier: 'Corporate',
      active: true,
      details: 'Travel to 11 countries. Only pay ticket taxes.',
      gradient: 'from-emerald-600 to-teal-500',
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
      title: 'Startup Factory Hub Pass',
      subtitle: coworkingLabel + ' — Global Network',
      icon: <Building className="h-5 w-5" />,
      tier: tier.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      active: true,
      details: 'Access coworking spaces worldwide.',
      gradient: 'from-primary to-accent',
    });
  }

  // Soft Landing discount — Corporate only
  if (isSubscribed && tier === 'corporate') {
    passes.push({
      id: 'soft-landing',
      title: '$5,000 Soft Landing Discount',
      subtitle: 'Expansion to Japan, USA, Europe & more',
      icon: <CreditCard className="h-5 w-5" />,
      tier: 'Corporate',
      active: true,
      details: 'Discount on Soft Landing program for global expansion.',
      gradient: 'from-violet-600 to-purple-500',
    });
  }

  const isMobileNav = className?.includes('flex-col');

  return (
    <Popover>
      <PopoverTrigger asChild>
        {isMobileNav ? (
          <button className={cn(className)}>
            <Wallet className="w-6 h-6 text-primary" />
            <span className="text-[10px] font-medium">Wallet</span>
          </button>
        ) : (
          <Button variant="ghost" size="sm" className={cn('relative', className)}>
            <Wallet className="w-4 h-4" />
            {passes.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[10px] flex items-center justify-center text-primary-foreground">
                {passes.length}
              </span>
            )}
          </Button>
        )}
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
        <div className="p-3 space-y-3 max-h-[400px] overflow-y-auto">
          {passes.length === 0 ? (
            <div className="py-8 text-center text-muted-foreground">
              <Wallet className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No active passes</p>
              <p className="text-xs mt-1">Subscribe to a plan to unlock passes</p>
            </div>
          ) : (
            passes.map((pass) => (
              <div
                key={pass.id}
                className={cn(
                  'relative rounded-xl overflow-hidden bg-gradient-to-r p-[1px]',
                  pass.gradient
                )}
              >
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
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-medium text-green-600">Active</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
