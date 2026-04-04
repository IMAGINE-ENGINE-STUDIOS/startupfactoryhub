import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DollarSign } from "lucide-react";

interface Props {
  startup: { id: string; company_name: string };
  onClose: () => void;
}

const AMOUNTS = [500, 1000, 2500, 5000, 10000];

const HotDealsSupportModal = ({ startup, onClose }: Props) => {
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState("");
  const [donorName, setDonorName] = useState(() => sessionStorage.getItem("hot_deals_voter") || "");
  const [donorEmail, setDonorEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const amountCents = selectedAmount || (customAmount ? Math.round(parseFloat(customAmount) * 100) : 0);

  const handleDonate = async () => {
    if (!donorName.trim()) {
      toast({ title: "Name required", description: "Please enter your name.", variant: "destructive" });
      return;
    }
    if (amountCents < 100) {
      toast({ title: "Minimum $1", description: "Please select or enter at least $1.00.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-hot-deals-donation", {
        body: {
          startup_id: startup.id,
          amount_cents: amountCents,
          donor_name: donorName.trim(),
          donor_email: donorEmail.trim() || undefined,
        },
      });

      if (error) throw error;
      if (data?.url) {
        window.open(data.url, "_blank");
        onClose();
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to create donation", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative tech-card rounded-2xl border border-orange-400/30 bg-background/95 backdrop-blur-xl p-5 sm:p-6 w-full max-w-md space-y-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-center space-y-1">
          <h3 className="text-lg font-bold text-orange-400 font-futuristic tracking-wider flex items-center justify-center gap-1.5">
            <DollarSign className="w-5 h-5" /> SUPPORT {startup.company_name.toUpperCase()}
          </h3>
          <p className="text-muted-foreground text-xs">
            10% platform fee · Funds go directly to the startup via Stripe
          </p>
        </div>

        {/* Amount selection */}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {AMOUNTS.map((amt) => (
            <button
              key={amt}
              onClick={() => { setSelectedAmount(amt); setCustomAmount(""); }}
              className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${
                selectedAmount === amt
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "bg-orange-500/10 text-orange-400 hover:bg-orange-500/20 border border-orange-400/20"
              }`}
            >
              ${amt / 100}
            </button>
          ))}
        </div>

        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">$</span>
          <Input
            type="number"
            placeholder="Custom amount"
            value={customAmount}
            onChange={(e) => { setCustomAmount(e.target.value); setSelectedAmount(null); }}
            className="pl-7 border-orange-400/30 focus-visible:ring-orange-400"
            min="1"
            step="0.01"
          />
        </div>

        <div className="space-y-2">
          <Input
            placeholder="Your name *"
            value={donorName}
            onChange={(e) => setDonorName(e.target.value)}
            className="border-orange-400/30 focus-visible:ring-orange-400"
          />
          <Input
            type="email"
            placeholder="Email (optional, for receipt)"
            value={donorEmail}
            onChange={(e) => setDonorEmail(e.target.value)}
            className="border-orange-400/30 focus-visible:ring-orange-400"
          />
        </div>

        <div className="flex gap-2">
          <Button onClick={onClose} variant="outline" className="flex-1 border-orange-400/30 text-orange-400">
            Cancel
          </Button>
          <Button
            onClick={handleDonate}
            disabled={loading || amountCents < 100}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold"
          >
            {loading ? "Processing..." : `Donate $${(amountCents / 100).toFixed(2)}`}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HotDealsSupportModal;
