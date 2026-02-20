import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Store, Crown, ShoppingBag, DollarSign, Loader2, Tag, ShieldCheck } from 'lucide-react';

interface MarketplaceListing {
  id: string;
  room_id: string;
  seller_id: string;
  asking_price_cents: number;
  description: string | null;
  status: string;
  platform_cut_percent: number;
  created_at: string;
  room?: {
    name: string;
    description: string | null;
    village_type: string | null;
  };
}

interface VillageMarketplaceProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function VillageMarketplace({ open, onOpenChange }: VillageMarketplaceProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [listings, setListings] = useState<MarketplaceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [listingView, setListingView] = useState<'browse' | 'sell'>('browse');
  const [myVillages, setMyVillages] = useState<Array<{ id: string; name: string; village_type: string | null }>>([]);
  const [selectedVillageId, setSelectedVillageId] = useState('');
  const [askingPrice, setAskingPrice] = useState('');
  const [listingDesc, setListingDesc] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('village_marketplace')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (!data) { setListings([]); return; }

      const roomIds = [...new Set(data.map(d => d.room_id))];
      const { data: rooms } = await supabase
        .from('live_rooms')
        .select('id, name, description, village_type')
        .in('id', roomIds);

      const roomMap = new Map(rooms?.map(r => [r.id, r]) || []);
      setListings(data.map(l => ({ ...l, room: roomMap.get(l.room_id) as any })));
    } finally {
      setLoading(false);
    }
  };

  const fetchMyVillages = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('live_rooms')
      .select('id, name, village_type')
      .eq('room_category', 'village')
      .eq('creator_id', user.id)
      .eq('is_active', true);
    setMyVillages(data || []);
  };

  useEffect(() => {
    if (open) { fetchListings(); fetchMyVillages(); }
  }, [open]);

  const handleListVillage = async () => {
    if (!user || !selectedVillageId || !askingPrice) return;
    const priceCents = Math.round(parseFloat(askingPrice) * 100);
    if (priceCents < 100) {
      toast({ title: 'Minimum price is $1.00', variant: 'destructive' });
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('village_marketplace').insert({
        room_id: selectedVillageId,
        seller_id: user.id,
        asking_price_cents: priceCents,
        description: listingDesc.trim() || null,
        platform_cut_percent: 20.0,
      });

      if (error) throw error;

      // Mark village as for sale
      await supabase.from('live_rooms').update({ for_sale: true, sale_price_cents: priceCents }).eq('id', selectedVillageId);

      toast({ title: '🏪 Village Listed!', description: 'Your village is now on the marketplace.' });
      setListingView('browse');
      setSelectedVillageId('');
      setAskingPrice('');
      setListingDesc('');
      await fetchListings();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const platformCut = (price: number) => price * 0.2;
  const sellerProceeds = (price: number) => price * 0.8;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[580px] tech-card border-0 p-0 overflow-hidden max-h-[90vh]">
        <div className="h-1 bg-gradient-to-r from-indigo-500 via-violet-500 to-amber-500" />

        <div className="p-6 pb-3">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-violet-500/10 flex items-center justify-center">
                  <Store className="h-5 w-5 text-violet-500" />
                </div>
                <div>
                  <DialogTitle className="text-lg">Village Marketplace</DialogTitle>
                  <p className="text-xs text-muted-foreground">Buy or sell community villages</p>
                </div>
              </div>
              {user && (
                <div className="flex gap-2">
                  <Button
                    variant={listingView === 'browse' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setListingView('browse')}
                  >
                    Browse
                  </Button>
                  <Button
                    variant={listingView === 'sell' ? 'default' : 'ghost'}
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => setListingView('sell')}
                  >
                    Sell Village
                  </Button>
                </div>
              )}
            </div>
          </DialogHeader>
        </div>

        {/* Platform fee notice */}
        <div className="mx-6 mb-3 rounded-lg bg-muted/40 border border-border/50 px-3 py-2 flex items-center gap-2">
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <p className="text-xs text-muted-foreground">
            Startup Factory Hub retains <strong>20%</strong> of every village sale (or equal share among beneficiaries if larger).
          </p>
        </div>

        <ScrollArea className="max-h-[55vh] px-6 pb-6">
          {listingView === 'browse' ? (
            loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : listings.length === 0 ? (
              <div className="text-center py-12">
                <Store className="h-10 w-10 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">No villages for sale right now.</p>
                <p className="text-xs text-muted-foreground mt-1">Check back soon or list your own.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {listings.map(listing => {
                  const priceUsd = listing.asking_price_cents / 100;
                  const isMerchant = listing.room?.village_type === 'merchant_village';
                  return (
                    <div key={listing.id} className="rounded-xl border border-border/50 bg-muted/20 p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{isMerchant ? '🏪' : '🏛️'}</span>
                          <div>
                            <p className="font-semibold text-sm">{listing.room?.name || 'Unknown Village'}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                              {isMerchant ? (
                                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-amber-500/10 text-amber-600 border-0 flex items-center gap-0.5">
                                  <ShoppingBag className="h-2.5 w-2.5" /> Merchant
                                </Badge>
                              ) : (
                                <Badge className="text-[10px] px-1.5 py-0 h-4 bg-indigo-500/10 text-indigo-600 border-0 flex items-center gap-0.5">
                                  <Crown className="h-2.5 w-2.5" /> Democratic
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-bold text-lg">${priceUsd.toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
                          <p className="text-[10px] text-muted-foreground">asking price</p>
                        </div>
                      </div>
                      {listing.room?.description && (
                        <p className="text-xs text-muted-foreground">{listing.room.description}</p>
                      )}
                      {listing.description && (
                        <p className="text-xs text-muted-foreground italic">"{listing.description}"</p>
                      )}
                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <div className="text-xs text-muted-foreground">
                          <span className="text-foreground font-medium">${(priceUsd * 0.2).toFixed(2)}</span> platform fee · 
                          <span className="text-foreground font-medium ml-1">${(priceUsd * 0.8).toFixed(2)}</span> to seller
                        </div>
                        <Button
                          size="sm"
                          className="h-7 text-xs px-3 bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0"
                          onClick={() => toast({ title: 'Coming Soon', description: 'Village purchase flow launching soon!' })}
                        >
                          <DollarSign className="h-3 w-3 mr-1" />
                          Buy Village
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <div className="space-y-4">
              {myVillages.length === 0 ? (
                <div className="text-center py-8">
                  <Crown className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
                  <p className="text-sm text-muted-foreground">You don't own any villages yet.</p>
                  <p className="text-xs text-muted-foreground mt-1">Found a village first to list it here.</p>
                </div>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Select Your Village</Label>
                    <div className="grid gap-2">
                      {myVillages.map(v => (
                        <button
                          key={v.id}
                          onClick={() => setSelectedVillageId(v.id)}
                          className={`text-left p-3 rounded-xl border transition-all text-sm ${
                            selectedVillageId === v.id
                              ? 'border-indigo-500/50 bg-indigo-500/10'
                              : 'border-border/50 bg-muted/30 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span>{v.village_type === 'merchant_village' ? '🏪' : '🏛️'}</span>
                            <span className="font-medium">{v.name}</span>
                            <Badge className={`text-[10px] px-1.5 py-0 h-4 border-0 ${v.village_type === 'merchant_village' ? 'bg-amber-500/10 text-amber-600' : 'bg-indigo-500/10 text-indigo-600'}`}>
                              {v.village_type === 'merchant_village' ? 'Merchant' : 'Democratic'}
                            </Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Asking Price</Label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input
                        type="number"
                        min="1"
                        step="10"
                        placeholder="0.00"
                        value={askingPrice}
                        onChange={e => setAskingPrice(e.target.value)}
                        className="pl-7 tech-card border-0"
                      />
                    </div>
                    {askingPrice && parseFloat(askingPrice) > 0 && (
                      <div className="rounded-lg bg-muted/40 p-3 space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Platform fee (20%)</span>
                          <span className="font-medium text-rose-500">-${(parseFloat(askingPrice) * 0.2).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">You receive</span>
                          <span className="font-semibold text-emerald-600">${(parseFloat(askingPrice) * 0.8).toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-sm font-medium">Listing Description <span className="text-muted-foreground font-normal">(optional)</span></Label>
                    <Textarea
                      placeholder="Why are you selling? Any notes for the buyer?"
                      value={listingDesc}
                      onChange={e => setListingDesc(e.target.value)}
                      className="tech-card border-0 resize-none"
                      rows={2}
                    />
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-indigo-500 to-violet-500 hover:from-indigo-600 hover:to-violet-600 border-0 text-white gap-2"
                    onClick={handleListVillage}
                    disabled={submitting || !selectedVillageId || !askingPrice}
                  >
                    {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Tag className="h-4 w-4" />}
                    List Village for Sale
                  </Button>
                </>
              )}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
