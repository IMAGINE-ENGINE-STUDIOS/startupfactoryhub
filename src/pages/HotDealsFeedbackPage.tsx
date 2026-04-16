import { useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, Star, Share2, Check, ArrowLeft } from "lucide-react";
import HotDealsEventFeedback from "@/components/HotDealsEventFeedback";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const FEEDBACK_URL = "https://startupfactoryhub.com/hot-deals/feedback";

const HotDealsFeedbackPage = () => {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(FEEDBACK_URL);
      setCopied(true);
      toast.success("Feedback link copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Could not copy link");
    }
  };

  return (
    <div
      className="min-h-screen w-full"
      style={{
        background:
          "radial-gradient(ellipse at top, hsl(25 95% 53% / 0.08), transparent 60%), hsl(0 0% 4%)",
      }}
    >
      <div className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl">
        {/* Top nav */}
        <div className="flex items-center justify-between mb-8">
          <Link
            to="/hot-deals-space"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-orange-400 transition-colors font-futuristic tracking-wider uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Hot Deals
          </Link>
          <Button
            onClick={handleShare}
            variant="outline"
            size="sm"
            className="border-orange-500/40 text-orange-400 hover:bg-orange-500/10 hover:text-orange-400"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 mr-1.5" />
                Copied
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 mr-1.5" />
                Share feedback link
              </>
            )}
          </Button>
        </div>

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl border-2 border-orange-400/40 mb-5"
            style={{
              background: "linear-gradient(135deg, hsl(25 95% 53% / 0.2), hsl(0 72% 51% / 0.1))",
            }}
          >
            <Sparkles className="w-8 h-8 text-orange-400" />
          </div>
          <h1
            className="text-4xl sm:text-5xl md:text-6xl font-black font-futuristic tracking-wider uppercase text-transparent bg-clip-text mb-4"
            style={{
              backgroundImage:
                "linear-gradient(90deg, hsl(0 72% 51%), hsl(25 95% 53%), hsl(48 96% 53%))",
            }}
          >
            Rate the Hot Deals Event
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-futuristic tracking-wide">
            Tell us how the Hot Deals event went — anonymous, takes 30 seconds.
          </p>
          <div className="flex items-center justify-center gap-1.5 mt-4">
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} className="w-4 h-4 text-orange-400/60" />
            ))}
          </div>
        </div>

        {/* Feedback widget */}
        <HotDealsEventFeedback />

        {/* Footer note */}
        <div className="mt-10 text-center">
          <p className="text-xs text-muted-foreground font-futuristic tracking-wider uppercase">
            Your feedback shapes the next Hot Deals · No personal data is collected
          </p>
        </div>
      </div>
    </div>
  );
};

export default HotDealsFeedbackPage;
