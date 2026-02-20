import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Crown, Vote, ShoppingBag, Lock, Users, DollarSign, Store,
  ShieldCheck, Trophy, Key, TrendingUp, Scale, BookOpen, X
} from 'lucide-react';

interface DistrictGuideDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const Section = ({ icon: Icon, title, color, children }: {
  icon: typeof Crown;
  title: string;
  color: string;
  children: React.ReactNode;
}) => (
  <div className="space-y-3">
    <div className="flex items-center gap-2">
      <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${color}`}>
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-semibold text-sm">{title}</h3>
    </div>
    <div className="pl-10 space-y-2">{children}</div>
  </div>
);

const Rule = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-start gap-2 text-xs text-muted-foreground leading-relaxed">
    <span className="text-primary mt-0.5 shrink-0">•</span>
    <span>{children}</span>
  </div>
);

export default function DistrictGuideDialog({ open, onOpenChange }: DistrictGuideDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] tech-card border-0 p-0 overflow-hidden max-h-[90vh]">
        {/* Gradient header */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500" />

        <div className="p-6 pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="text-lg font-bold">District Guide</h2>
                <p className="text-xs text-muted-foreground">How districts work on Startup Factory Hub</p>
              </div>
            </div>
          </div>
        </div>

        <ScrollArea className="max-h-[70vh] px-6 pb-6">
          <div className="space-y-6">

            {/* Overview */}
            <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-violet-500/10 border border-indigo-500/20 p-4">
              <p className="text-sm leading-relaxed text-foreground">
                Districts are <strong>permanent community spaces</strong> — unlike standard rooms, they never expire. 
                Anyone can <strong>found a district for $200</strong>. Every district exists in the public District Marketplace 
                and can be bought or sold.
              </p>
            </div>

            {/* District Types */}
            <Section icon={Crown} title="District Types" color="bg-indigo-500/10 text-indigo-500">
              <div className="grid grid-cols-1 gap-3">
                <div className="rounded-lg border border-indigo-500/20 bg-indigo-500/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🏛️</span>
                    <Badge className="bg-indigo-500/10 text-indigo-600 border-0 text-[10px]">Democratic Republic</Badge>
                  </div>
                  <div className="space-y-1.5">
                    <Rule>Members vote to elect a <strong>Host</strong> who leads the district (requires more than 2 votes to win).</Rule>
                    <Rule>The Host appoints a <strong>Staff</strong> (moderators, curators, ambassadors, archivists) who hold authority when the host is absent.</Rule>
                    <Rule>Each member pays an <strong>equal share</strong> of operating costs — a join fee + a government fund contribution set by the founder.</Rule>
                    <Rule>Minimum cost per member: <strong>$1 join + $1 government fund = $2 total</strong>. Founders can set higher amounts.</Rule>
                    <Rule>The district bill is <strong>divided equally</strong> among all active members each billing cycle.</Rule>
                    <Rule>Members can vote to <strong>sell the entire district</strong>. If the majority votes yes, all members receive an equal share of the sale proceeds.</Rule>
                  </div>
                </div>
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">🏪</span>
                    <Badge className="bg-amber-500/10 text-amber-600 border-0 text-[10px]">Merchant District</Badge>
                  </div>
                  <div className="space-y-1.5">
                    <Rule>You are the <strong>permanent owner and operator</strong>. No elections or voting.</Rule>
                    <Rule>Can be set as <strong>Public</strong> (open to everyone) or <strong>Private</strong> (invitation code required to join).</Rule>
                    <Rule>You control who enters if set to private — members must use your invitation code.</Rule>
                    <Rule>Ideal for commerce-focused, creator-led, or exclusive communities.</Rule>
                  </div>
                </div>
              </div>
            </Section>

            {/* Governance */}
            <Section icon={Vote} title="Democratic Governance" color="bg-violet-500/10 text-violet-500">
              <Rule>Any participant can <strong>call an election</strong> at any time from the district panel.</Rule>
              <Rule>An election requires <strong>more than 2 votes</strong> to produce a winner. If no candidate gets enough votes, re-polling happens automatically.</Rule>
              <Rule>The elected Host can <strong>appoint staff members</strong> (moderators, curators, ambassadors, archivists).</Rule>
              <Rule>If the Host is offline, <strong>Staff members hold acting authority</strong> over the district.</Rule>
              <Rule>Districts cannot be closed or deleted while participants are present.</Rule>
            </Section>

            {/* Membership & Costs */}
            <Section icon={DollarSign} title="Membership & Costs" color="bg-emerald-500/10 text-emerald-500">
              <Rule>Founding a district costs a <strong>one-time $200 fee</strong> — regardless of district type.</Rule>
              <Rule>In Democratic Republics, each member pays their share: <strong>join fee + government fund contribution</strong>.</Rule>
              <Rule>The total member bill is split equally — the more members join, the lower the individual cost.</Rule>
              <Rule>Founders set the per-member price (minimum $1 join + $1 gov fund). This can be updated by the community.</Rule>
            </Section>

            {/* Private Districts */}
            <Section icon={Lock} title="Private Districts (Merchant)" color="bg-amber-500/10 text-amber-500">
              <Rule>Merchant District founders can enable <strong>Private Mode</strong> during creation.</Rule>
              <Rule>Private districts require an <strong>invitation code</strong> to join — only the founder can share this code.</Rule>
              <Rule>The invitation code is generated after payment and displayed in your district management panel.</Rule>
              <Rule>Public visibility can be toggled at any time from your district settings.</Rule>
            </Section>

            {/* District Marketplace */}
            <Section icon={Store} title="District Marketplace" color="bg-blue-500/10 text-blue-500">
              <Rule>Every district can be listed for sale on the <strong>District Marketplace</strong>.</Rule>
              <Rule>Founders (or elected majority in Democratic Republics) set the asking price.</Rule>
              <Rule>The buyer pays the asking price via Stripe. <strong>Startup Factory Hub automatically retains 20% of every district sale</strong>, or an equal share to all beneficiaries if that results in a larger payout — whichever is greater.</Rule>
              <Rule>In Democratic Republics, sale proceeds (after platform cut) are <strong>distributed equally among all members</strong>.</Rule>
              <Rule>In Merchant Districts, the founder receives the remaining proceeds after the platform cut.</Rule>
            </Section>

            {/* Sale Voting (DR only) */}
            <Section icon={Scale} title="District Sale Voting (Democratic Republic)" color="bg-rose-500/10 text-rose-500">
              <Rule>Any member of a Democratic Republic can <strong>propose a district sale</strong> and set an asking price.</Rule>
              <Rule>All current members are notified and can <strong>vote Yes or No</strong> on the sale.</Rule>
              <Rule>If the <strong>majority votes Yes</strong>, the district is automatically listed on the marketplace.</Rule>
              <Rule>Upon sale completion, proceeds are divided: <strong>20% to Startup Factory Hub</strong> (or equal share if larger), and the remainder split equally between all members at the time of sale.</Rule>
            </Section>

            {/* Platform Rules */}
            <Section icon={ShieldCheck} title="Platform Rules" color="bg-slate-500/10 text-slate-500">
              <Rule>Startup Factory Hub <strong>always retains a minimum 20% of any district sale</strong>. If an equal share among all beneficiaries exceeds 20%, the platform automatically takes the larger amount.</Rule>
              <Rule>Districts must comply with platform community guidelines. Admin moderators have oversight across all districts.</Rule>
              <Rule>Admins can remove elected Hosts, dismiss staff, and cancel elections if community guidelines are violated.</Rule>
              <Rule>Permanent districts cannot be deleted by users — they can only be sold or transferred via the marketplace.</Rule>
            </Section>

          </div>
        </ScrollArea>

        <div className="px-6 pb-6 pt-3 border-t border-border/50">
          <Button
            className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0 text-white"
            onClick={() => onOpenChange(false)}
          >
            Got it!
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
