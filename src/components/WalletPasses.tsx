import { useState, useEffect } from 'react';
import { Wallet, Plane, Building, Globe, Eye, EyeOff, ExternalLink, Landmark, Mail, Satellite } from 'lucide-react';
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
import softLandingPassImg from '@/assets/soft-landing-pass.webp';
import hsbcPassImg from '@/assets/hsbc-pass.jpg';
import earthIntelPassImg from '@/assets/earth-intelligence-pass.jpg';
import SoftLandingRequestDialog from '@/components/SoftLandingRequestDialog';

const FRONTIER_BOOKING_URL = 'https://booking.flyfrontier.com/FrontierMiles/GoWildSignup?_ga=2.125927374.2135620265.1772270212-2039149194.1772270211&_gac=1.183458260.1772273523.Cj0KCQiAwYrNBhDcARIsAGo3u32mNyqqe-uI2l0iOVAa0s9X_nKB4dKSpaXoj604XXI-F7W_a3L0Qx4aAu6UEALw_wcB';

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
  onClick?: () => void;
}

export default function WalletPasses({ className }: { className?: string }) {
  const { isSubscribed, tier } = useMembershipStatus();
  const { user } = useAuth();
  const [frontierApproved, setFrontierApproved] = useState(false);
  const [frontierRequested, setFrontierRequested] = useState(false);
  const [frontierCredentials, setFrontierCredentials] = useState<{ username: string; password: string } | null>(null);
  const [showFrontierPassword, setShowFrontierPassword] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [softLandingRequests, setSoftLandingRequests] = useState<any[]>([]);
  const [softLandingDialogOpen, setSoftLandingDialogOpen] = useState(false);
  const [hsbcSending, setHsbcSending] = useState(false);
  const [hsbcSent, setHsbcSent] = useState(false);

  useEffect(() => {
    if (!user || !isSubscribed) return;
    const checkStatuses = async () => {
      if (tier === 'corporate') {
        const { data } = await supabase
          .from('flight_pass_requests')
          .select('status, frontier_username, frontier_password')
          .eq('user_id', user.id)
          .maybeSingle();
        if (data) {
          setFrontierApproved(data.status === 'approved');
          setFrontierRequested(true);
          if (data.status === 'approved' && data.frontier_username && data.frontier_password) {
            setFrontierCredentials({ username: data.frontier_username, password: data.frontier_password });
          }
        }
      }
      // Fetch all soft landing requests for this user
      const { data: slData } = await supabase
        .from('soft_landing_requests')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (slData) {
        setSoftLandingRequests(slData);
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
      onClick: () => window.open(FRONTIER_BOOKING_URL, '_blank'),
      action: frontierCredentials ? (
        <div className="w-full mt-2 space-y-1.5 p-2 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
          <p className="text-[10px] font-medium text-emerald-600">Your Frontier Credentials</p>
          <div className="text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-mono text-foreground">{frontierCredentials.username}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Password:</span>
              <div className="flex items-center gap-1">
                <span className="font-mono text-foreground">
                  {showFrontierPassword ? frontierCredentials.password : '••••••••'}
                </span>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowFrontierPassword(!showFrontierPassword); }}
                  className="p-0.5 hover:bg-muted rounded"
                >
                  {showFrontierPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </button>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full h-6 text-[10px] mt-1 border-emerald-500/30 text-emerald-600"
            onClick={(e) => { e.stopPropagation(); window.open(FRONTIER_BOOKING_URL, '_blank'); }}
          >
            <ExternalLink className="h-3 w-3 mr-1" />
            Book on Frontier
          </Button>
        </div>
      ) : undefined,
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

  // HSBC Banking Pass — All paid tiers, free
  if (isSubscribed) {
    passes.push({
      id: 'hsbc-banking',
      title: 'HSBC Innovation Banking',
      subtitle: 'Free Business Account',
      icon: <Landmark className="h-5 w-5" />,
      tier: 'All Members',
      active: true,
      details: 'Free HSBC Innovation Banking account for all Startup Factory Hub members. We will send an introduction email on your behalf.',
      gradient: 'from-red-600 to-red-500',
      image: hsbcPassImg,
      action: (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-[11px] mt-1 border-red-500/30 text-red-600"
          disabled={hsbcSending || hsbcSent}
          onClick={async (e) => {
            e.stopPropagation();
            setHsbcSending(true);
            try {
              const { error } = await supabase.functions.invoke('send-hsbc-intro');
              if (error) throw error;
              setHsbcSent(true);
            } catch (err) {
              console.error('HSBC intro error:', err);
            } finally {
              setHsbcSending(false);
            }
          }}
        >
          <Mail className="h-3 w-3 mr-1" />
          {hsbcSent ? 'Introduction Sent ✓' : hsbcSending ? 'Sending...' : 'Request Account Introduction'}
        </Button>
      ),
    });
  }

  // Earth Intelligence Pass — $550+ tiers only
  const earthAccessTiers = ['self_paced_office', 'global_access', 'corporate'];
  if (isSubscribed && earthAccessTiers.includes(tier)) {
    passes.push({
      id: 'earth-intelligence',
      title: 'Earth Intelligence',
      subtitle: 'Satellite Data & Analytics',
      icon: <Satellite className="h-5 w-5" />,
      tier: tier.replace('_', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      active: true,
      details: 'Access global satellite datasets: land surface temperature, sea surface temperature, precipitation radar, elevation, and shortwave radiation from JAXA & NASA.',
      gradient: 'from-blue-600 to-cyan-500',
      image: earthIntelPassImg,
    });
  }

  // Soft Landing — show for all subscribers with request button
  if (isSubscribed) {
    const isCorporate = tier === 'corporate';
    const price = isCorporate ? '$5,000' : '$7,500';
    const activeRequests = softLandingRequests.filter(r => ['pending', 'in_progress'].includes(r.status));
    const completedRequests = softLandingRequests.filter(r => r.status === 'completed');

    passes.push({
      id: 'soft-landing',
      title: 'Soft Landing Program',
      subtitle: `Global Expansion — ${price}`,
      icon: <Globe className="h-5 w-5" />,
      tier: isCorporate ? 'Corporate' : 'Standard',
      active: true,
      details: `Corporate registration, legal address, documents & legal advice. Expand to Japan, USA, Europe, Chile or Venezuela.${isCorporate ? ' Corporate discount applied.' : ''}`,
      image: softLandingPassImg,
      gradient: 'from-violet-600 to-purple-500',
      action: (
        <div className="w-full space-y-1.5">
          {activeRequests.map(r => (
            <Badge key={r.id} variant="outline" className="text-[10px] border-yellow-500/50 text-yellow-600 mr-1">
              {r.status === 'pending' ? 'Pending' : 'In Progress'} — {r.target_country}
            </Badge>
          ))}
          {completedRequests.map(r => (
            <Badge key={r.id} variant="outline" className="text-[10px] border-green-500/50 text-green-600 mr-1">
              Completed — {r.target_country}
            </Badge>
          ))}
          <Button
            size="sm"
            variant="outline"
            className="text-[10px] h-6 px-2"
            onClick={(e) => { e.stopPropagation(); setSoftLandingDialogOpen(true); }}
          >
            Request for Another Country
          </Button>
        </div>
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

            {isSubscribed && tier === 'corporate' && frontierRequested && !frontierApproved && (
              <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/5 p-4 text-center space-y-1">
                <Plane className="h-8 w-8 mx-auto text-yellow-500" />
                <p className="text-sm font-semibold">Frontier Pass — Pending Approval</p>
                <p className="text-xs text-muted-foreground">Your pass is being set up. The admin will approve it once your Frontier account is ready.</p>
              </div>
            )}

            {passes.map((pass) => (
              <div
                key={pass.id}
                className={cn('rounded-2xl overflow-hidden shadow-lg', pass.onClick && 'cursor-pointer hover:shadow-xl transition-shadow')}
                style={{ minHeight: pass.image ? '200px' : undefined }}
                onClick={pass.onClick}
              >
                {pass.image && (
                  <div className="relative w-full h-36 overflow-hidden">
                    <img src={pass.image} alt={pass.title} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
                    <div className="absolute bottom-2 left-3 right-3">
                      <Badge className="bg-white/20 backdrop-blur-sm text-white border-0 text-[10px]">
                        {pass.tier}
                      </Badge>
                    </div>
                  </div>
                )}
                <div className={cn(
                  'p-4 space-y-2',
                  pass.image ? 'bg-gradient-to-b from-card to-background' : `bg-gradient-to-r ${pass.gradient} p-[1px]`
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
                        <Badge variant="secondary" className="text-[10px] shrink-0">{pass.tier}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">{pass.details}</p>
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-medium text-green-600">Active</span>
                      </div>
                      {pass.action}
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
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] font-medium text-green-600">Active</span>
                      </div>
                      {pass.action}
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
        onSuccess={(data) => setSoftLandingRequests(prev => [data, ...prev])}
      />
    </>
  );
}
