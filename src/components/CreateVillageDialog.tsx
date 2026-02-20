import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Crown, Vote, ShoppingBag, Loader2, DollarSign, Lock, Key, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CreateVillageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type VillageType = 'democratic_republic' | 'merchant_village';

const VILLAGE_TYPES: {
  id: VillageType;
  label: string;
  emoji: string;
  icon: typeof Vote;
  description: string;
  color: string;
  bgColor: string;
}[] = [
  {
    id: 'democratic_republic',
    label: 'Democratic Republic',
    emoji: '🏛️',
    icon: Vote,
    description: 'Governed by members. Residents vote for a Host who leads the village. Members each pay an equal share of operating costs. Founding fee set by you — minimum $2/member.',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10 border-indigo-500/30',
  },
  {
    id: 'merchant_village',
    label: 'Merchant Village',
    emoji: '🏪',
    icon: ShoppingBag,
    description: 'You are the permanent owner and operator. No elections or voting system. Can be set as private (invitation only). Ideal for commerce-focused or creator-led communities.',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500/10 border-amber-500/30',
  },
];

export default function CreateVillageDialog({ open, onOpenChange }: CreateVillageDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState<'configure' | 'confirm'>('configure');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState<VillageType | null>(null);
  const [loading, setLoading] = useState(false);

  // Democratic Republic pricing
  const [joinFeeDollars, setJoinFeeDollars] = useState('1');
  const [govFundDollars, setGovFundDollars] = useState('1');

  // Merchant Village options
  const [isPrivate, setIsPrivate] = useState(false);

  const reset = () => {
    setStep('configure');
    setName('');
    setDescription('');
    setSelectedType(null);
    setLoading(false);
    setJoinFeeDollars('1');
    setGovFundDollars('1');
    setIsPrivate(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const handleContinue = () => {
    if (!name.trim() || !selectedType) return;
    if (selectedType === 'democratic_republic') {
      const join = parseFloat(joinFeeDollars) || 0;
      const gov = parseFloat(govFundDollars) || 0;
      if (join < 1 || gov < 1) {
        toast({ title: 'Minimum fees required', description: 'Join fee and government fund must each be at least $1.00', variant: 'destructive' });
        return;
      }
    }
    setStep('confirm');
  };

  const handlePayAndCreate = async () => {
    if (!user || !selectedType || !name.trim()) return;
    setLoading(true);

    const joinFeeCents = Math.round((parseFloat(joinFeeDollars) || 1) * 100);
    const govFundCents = Math.round((parseFloat(govFundDollars) || 1) * 100);

    try {
      const { data, error } = await supabase.functions.invoke('create-village-payment', {
        body: {
          villageName: name.trim(),
          villageDescription: description.trim() || undefined,
          villageType: selectedType,
          isPrivate: selectedType === 'merchant_village' ? isPrivate : false,
          joinFeeCents: selectedType === 'democratic_republic' ? joinFeeCents : undefined,
          govFundCents: selectedType === 'democratic_republic' ? govFundCents : undefined,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL received');

      window.open(data.url, '_blank');
      toast({
        title: '🏘️ Complete your payment',
        description: 'Finish the $200 checkout to activate your village. Once paid, your village will appear automatically.',
      });
      handleClose(false);
    } catch (err: any) {
      console.error('Village payment error:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to initiate village creation',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const selectedTypeData = VILLAGE_TYPES.find(t => t.id === selectedType);
  const totalMemberFee = (parseFloat(joinFeeDollars) || 1) + (parseFloat(govFundDollars) || 1);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[540px] tech-card border-0 p-0 overflow-hidden">
        {/* Gradient header bar */}
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500" />

        <div className="p-6">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-indigo-500" />
              </div>
              <div>
                <DialogTitle className="text-lg">Found a Village</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {step === 'configure' ? 'Configure your new community space' : 'Review & confirm your purchase'}
                </p>
              </div>
            </div>
          </DialogHeader>

          {step === 'configure' ? (
            <div className="space-y-5">
              {/* Name */}
              <div className="space-y-1.5">
                <Label htmlFor="village-name" className="text-sm font-medium">Village Name</Label>
                <Input
                  id="village-name"
                  placeholder="e.g. The Northern Quarter"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="tech-card border-0"
                />
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="village-desc" className="text-sm font-medium">Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                <Textarea
                  id="village-desc"
                  placeholder="What is this village about?"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="tech-card border-0 resize-none"
                  rows={2}
                />
              </div>

              {/* Type selection */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Village Type</Label>
                <div className="grid grid-cols-1 gap-3">
                  {VILLAGE_TYPES.map(type => {
                    const Icon = type.icon;
                    const isSelected = selectedType === type.id;
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setSelectedType(type.id)}
                        className={cn(
                          'text-left p-4 rounded-xl border transition-all',
                          isSelected
                            ? `${type.bgColor} ring-2 ring-offset-1 ring-offset-background`
                            : 'border-border/50 hover:border-border bg-muted/30 hover:bg-muted/50'
                        )}
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{type.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={cn('text-sm font-semibold', isSelected ? type.color : 'text-foreground')}>{type.label}</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{type.description}</p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Democratic Republic: membership pricing */}
              {selectedType === 'democratic_republic' && (
                <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-indigo-500" />
                    <p className="text-sm font-medium text-indigo-700 dark:text-indigo-300">Member Pricing</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Each member pays equally. Set the per-member costs (minimum $1.00 each).
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Join Fee (per member)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          min="1"
                          step="0.50"
                          value={joinFeeDollars}
                          onChange={e => setJoinFeeDollars(e.target.value)}
                          className="pl-6 h-8 text-sm tech-card border-0"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Gov. Fund (per member)</Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
                        <Input
                          type="number"
                          min="1"
                          step="0.50"
                          value={govFundDollars}
                          onChange={e => setGovFundDollars(e.target.value)}
                          className="pl-6 h-8 text-sm tech-card border-0"
                        />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-xs pt-1 border-t border-indigo-500/20">
                    <span className="text-muted-foreground">Total per member</span>
                    <span className="font-semibold text-indigo-600">${totalMemberFee.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Merchant Village: private toggle */}
              {selectedType === 'merchant_village' && (
                <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-amber-700 dark:text-amber-300">Private Village</p>
                        <p className="text-xs text-muted-foreground">Invitation code required to join</p>
                      </div>
                    </div>
                    <Switch
                      checked={isPrivate}
                      onCheckedChange={setIsPrivate}
                    />
                  </div>
                  {isPrivate && (
                    <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2">
                      <Key className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      <p className="text-xs text-amber-700 dark:text-amber-300">
                        An invitation code will be generated and shared with you after creation.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Confirm step */
            <div className="space-y-4">
              <div className={cn('rounded-xl p-4 border', selectedTypeData?.bgColor)}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-2xl">{selectedTypeData?.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm">{name}</p>
                    <p className={cn('text-xs', selectedTypeData?.color)}>{selectedTypeData?.label}</p>
                  </div>
                </div>
                {description && (
                  <p className="text-xs text-muted-foreground">{description}</p>
                )}
              </div>

              {/* Pricing breakdown */}
              <div className="rounded-xl bg-muted/40 border border-border/50 p-4 space-y-2.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Village founding fee</span>
                  <span className="font-semibold">$200.00</span>
                </div>
                {selectedType === 'democratic_republic' && (
                  <>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Per-member join fee</span>
                      <span className="font-medium text-indigo-600">${parseFloat(joinFeeDollars || '1').toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Per-member gov. fund</span>
                      <span className="font-medium text-indigo-600">${parseFloat(govFundDollars || '1').toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>Total per member</span>
                      <span>${totalMemberFee.toFixed(2)}</span>
                    </div>
                  </>
                )}
                {selectedType === 'merchant_village' && isPrivate && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Visibility</span>
                    <span className="font-medium text-amber-600 flex items-center gap-1">
                      <Lock className="h-3 w-3" /> Private (invitation only)
                    </span>
                  </div>
                )}
                <div className="border-t border-border/50 pt-2 flex items-center justify-between">
                  <span className="font-semibold text-sm">Due today</span>
                  <span className="font-bold text-lg">$200.00</span>
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                You'll be redirected to Stripe to complete payment. Your village will be created automatically once the payment is confirmed.
              </p>
            </div>
          )}

          <DialogFooter className="mt-6 gap-2">
            {step === 'configure' ? (
              <>
                <Button variant="ghost" onClick={() => handleClose(false)}>Cancel</Button>
                <Button
                  onClick={handleContinue}
                  disabled={!name.trim() || !selectedType}
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0 text-white"
                >
                  Continue
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={() => setStep('configure')}>Back</Button>
                <Button
                  onClick={handlePayAndCreate}
                  disabled={loading}
                  className="bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0 text-white gap-2"
                >
                  {loading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <DollarSign className="h-4 w-4" />
                  )}
                  Pay $200 & Found Village
                </Button>
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
