import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Crown, Vote, ShoppingBag, Loader2, DollarSign, Zap, X } from 'lucide-react';
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
  apiNote: string;
  color: string;
  bgColor: string;
}[] = [
  {
    id: 'democratic_republic',
    label: 'Democratic Republic',
    emoji: '🏛️',
    icon: Vote,
    description: 'Governance by election. Residents vote for a Host who leads the village. Features election system, staff appointments, and democratic oversight.',
    apiNote: 'Standard API billing rates (1×)',
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-500/10 border-indigo-500/30',
  },
  {
    id: 'merchant_village',
    label: 'Merchant Village',
    emoji: '🏪',
    icon: ShoppingBag,
    description: 'No elections or voting system. You are the permanent owner and operator of the village. Ideal for commerce-focused or creator-led communities.',
    apiNote: 'API usage billed at 2× standard rates',
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

  const reset = () => {
    setStep('configure');
    setName('');
    setDescription('');
    setSelectedType(null);
    setLoading(false);
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  const handleContinue = () => {
    if (!name.trim() || !selectedType) return;
    setStep('confirm');
  };

  const handlePayAndCreate = async () => {
    if (!user || !selectedType || !name.trim()) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-village-payment', {
        body: {
          villageName: name.trim(),
          villageDescription: description.trim() || undefined,
          villageType: selectedType,
        },
      });

      if (error) throw error;
      if (!data?.url) throw new Error('No checkout URL received');

      // Open Stripe checkout in new tab
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[520px] tech-card border-0 p-0 overflow-hidden">
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
                              {type.id === 'merchant_village' && (
                                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 border-0">2× API</Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">{type.description}</p>
                            <div className="flex items-center gap-1 mt-2">
                              <Zap className="h-3 w-3 text-muted-foreground" />
                              <span className="text-[11px] text-muted-foreground">{type.apiNote}</span>
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
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
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">API cost rate</span>
                  <span className={cn('font-medium', selectedType === 'merchant_village' ? 'text-amber-600' : 'text-emerald-600')}>
                    {selectedType === 'merchant_village' ? '2× standard' : '1× standard'}
                  </span>
                </div>
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
