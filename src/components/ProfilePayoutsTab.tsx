import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DollarSign, TrendingUp, Percent, Calendar, Gift } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import PayoutAccountSetup from './PayoutAccountSetup';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface EventEarning {
  eventId: string;
  title: string;
  startDate: string;
  ticketPriceCents: number;
  ticketsSold: number;
  grossRevenue: number;
  platformFee: number;
  netPayout: number;
}

export default function ProfilePayoutsTab() {
  const { user } = useAuth();
  const [earnings, setEarnings] = useState<EventEarning[]>([]);
  const [loading, setLoading] = useState(true);
  const [referralAccount, setReferralAccount] = useState<any>(null);

  useEffect(() => {
    if (user?.id) {
      fetchEarnings();
      fetchReferralAccount();
    }
  }, [user?.id]);

  const fetchReferralAccount = async () => {
    if (!user?.id) return;
    const { data } = await supabase
      .from('referral_accounts')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();
    setReferralAccount(data);
  };

  const fetchEarnings = async () => {
    if (!user?.id) return;
    setLoading(true);

    try {
      const { data: events } = await supabase
        .from('events')
        .select('id, title, start_date, ticket_price_cents')
        .eq('organizer_id', user.id)
        .eq('is_paid', true)
        .order('start_date', { ascending: false });

      if (!events || events.length === 0) {
        setEarnings([]);
        setLoading(false);
        return;
      }

      const eventIds = events.map(e => e.id);
      const { data: payments } = await supabase
        .from('event_payments')
        .select('event_id, amount_cents, platform_fee_cents')
        .in('event_id', eventIds)
        .eq('payment_status', 'paid');

      const earningsMap = new Map<string, { tickets: number; gross: number; fees: number }>();
      (payments || []).forEach(p => {
        const existing = earningsMap.get(p.event_id) || { tickets: 0, gross: 0, fees: 0 };
        existing.tickets += 1;
        existing.gross += (p.amount_cents || 0);
        existing.fees += (p.platform_fee_cents || 0);
        earningsMap.set(p.event_id, existing);
      });

      const result: EventEarning[] = events.map(e => {
        const agg = earningsMap.get(e.id) || { tickets: 0, gross: 0, fees: 0 };
        return {
          eventId: e.id,
          title: e.title,
          startDate: e.start_date,
          ticketPriceCents: e.ticket_price_cents || 0,
          ticketsSold: agg.tickets,
          grossRevenue: agg.gross,
          platformFee: agg.fees,
          netPayout: agg.gross - agg.fees,
        };
      });

      setEarnings(result);
    } catch (err) {
      console.error('Error fetching earnings:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCents = (cents: number) => `$${(cents / 100).toFixed(2)}`;

  const totalGross = earnings.reduce((sum, e) => sum + e.grossRevenue, 0);
  const totalFees = earnings.reduce((sum, e) => sum + e.platformFee, 0);
  const totalNet = totalGross - totalFees;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payout Account Setup */}
      <PayoutAccountSetup />

      {/* Referral Earnings Quick Link */}
      <Card className="tech-card border-0">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Gift className="h-6 w-6 text-primary" />
              <div>
                <p className="font-medium">Referral Program</p>
                <p className="text-sm text-muted-foreground">
                  {referralAccount 
                    ? `${referralAccount.total_referrals || 0} referrals · ${formatCents(referralAccount.total_earned_cents || 0)} earned`
                    : 'Earn 20% commission on referred subscriptions'
                  }
                </p>
              </div>
            </div>
            <Link to="/referral">
              <Button variant="outline" size="sm">
                {referralAccount ? 'View Dashboard' : 'Join Program'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Gross Revenue</p>
                <p className="text-2xl font-bold text-foreground">{formatCents(totalGross)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Platform Fees (10%)</p>
                <p className="text-2xl font-bold text-foreground">{formatCents(totalFees)}</p>
              </div>
              <Percent className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="tech-card border-0">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Net Payout</p>
                <p className="text-2xl font-bold text-foreground">{formatCents(totalNet)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Event Earnings Table */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Event Earnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {earnings.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-30" />
              <p className="text-muted-foreground">No paid events yet</p>
              <p className="text-sm text-muted-foreground mt-1">
                Create a paid event to start earning revenue
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event</TableHead>
                  <TableHead className="text-right">Ticket Price</TableHead>
                  <TableHead className="text-right">Sold</TableHead>
                  <TableHead className="text-right">Gross</TableHead>
                  <TableHead className="text-right">Fee (10%)</TableHead>
                  <TableHead className="text-right">Net Payout</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {earnings.map(e => (
                  <TableRow key={e.eventId}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{e.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.startDate ? format(new Date(e.startDate), 'MMM d, yyyy') : 'TBD'}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">{formatCents(e.ticketPriceCents)}</TableCell>
                    <TableCell className="text-right">{e.ticketsSold}</TableCell>
                    <TableCell className="text-right">{formatCents(e.grossRevenue)}</TableCell>
                    <TableCell className="text-right text-orange-500">{formatCents(e.platformFee)}</TableCell>
                    <TableCell className="text-right font-medium">{formatCents(e.netPayout)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* District Earnings Placeholder */}
      <Card className="tech-card border-0">
        <CardHeader>
          <CardTitle>District Earnings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-muted-foreground">No district payouts yet</p>
            <p className="text-sm text-muted-foreground mt-1">
              District creation fees are paid to the platform. Payout features coming soon.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
