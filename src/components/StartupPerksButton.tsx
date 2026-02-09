import { Gift, ExternalLink, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { useUserRole } from "@/hooks/useUserRole";
import tradingViewBanner from "@/assets/tradingview-banner.jpg";
const perksCategories = [{
  name: "Electronics",
  icon: "📱"
}, {
  name: "Appliances",
  icon: "🔌"
}, {
  name: "Hotels",
  icon: "🏨"
}, {
  name: "Movie Tickets",
  icon: "🎬"
}, {
  name: "Theme Parks",
  icon: "🎢"
}, {
  name: "Rental Cars",
  icon: "🚗"
}, {
  name: "Gift Cards",
  icon: "🎁"
}, {
  name: "Fitness",
  icon: "💪"
}, {
  name: "Groceries",
  icon: "🛒"
}, {
  name: "Travel",
  icon: "✈️"
}];
export function StartupPerksButton() {
  const {
    role,
    loading
  } = useUserRole();

  // Only show for mentors and advisors
  if (loading || role !== "mentor" && role !== "advisor") {
    return null;
  }
  return <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="neon-glow hover:scale-110 transition-transform duration-300 relative h-9 w-9 sm:h-10 sm:w-10 group" title="StartupPerks - Exclusive Benefits">
          <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-purple-500 group-hover:text-purple-400 animate-pulse" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-500 rounded-full flex items-center justify-center">
            <Sparkles className="h-2 w-2 text-white" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[calc(100vw-2rem)] sm:w-[420px] p-0" align="end">
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 p-4 border-b">
          <div className="flex items-center gap-2">
            <Gift className="h-6 w-6 text-amber-500" />
            <div>
              <h3 className="font-bold text-lg">Professional Perks</h3>
              <p className="text-xs text-muted-foreground">
                Exclusive Benefits for Mentors & Advisors
              </p>
            </div>
          </div>
          <p className="text-sm mt-2 text-muted-foreground italic">
            "More perks. More savings. More of what makes you happy."
          </p>
        </div>

        {/* Disclaimer Box */}
        <div className="mx-4 mt-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
          <p className="text-sm font-medium text-center">
            🔑 Use code: <span className="font-bold text-amber-600 dark:text-amber-400 text-lg">STARTUPPERKS</span>
          </p>
          <p className="text-xs text-muted-foreground text-center mt-1">
            Enter this code when signing up at Working Advantage
          </p>
        </div>

        {/* Featured Partner Perks */}
        <div className="px-4 pt-4">
          <p className="text-sm font-medium mb-3">🌟 Featured Partner Perks:</p>
          <a 
            href="https://www.tradingview.com/?aff_id=162505" 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-600/10 border border-blue-500/20 hover:border-blue-500/40 transition-all group"
          >
            <img 
              src="/partners/tradingview-logo.png" 
              alt="TradingView" 
              className="h-10 w-10 rounded-full object-cover"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm group-hover:text-blue-500 transition-colors">TradingView</p>
              <p className="text-xs text-muted-foreground">Track markets & analyze charts</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-blue-500" />
          </a>
          <a 
            href="mailto:safi.keshvargar@us.hsbc.com" 
            className="flex items-center gap-3 p-3 mt-2 rounded-lg bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 hover:border-red-500/40 transition-all group"
          >
            <img 
              src="/partners/hsbc-logo.png" 
              alt="HSBC Innovation Banking" 
              className="h-10 w-10 rounded-full object-contain bg-white p-1"
            />
            <div className="flex-1">
              <p className="font-semibold text-sm group-hover:text-red-500 transition-colors">HSBC Innovation Banking</p>
              <p className="text-xs text-muted-foreground">Free banking services for startups</p>
            </div>
            <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-red-500" />
          </a>
        </div>

        {/* Benefits Grid */}
        <div className="p-4">
          <p className="text-sm font-medium mb-3">Available Benefits:</p>
          <div className="grid grid-cols-2 gap-2">
            {perksCategories.map(perk => <div key={perk.name} className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm">
                <span>{perk.icon}</span>
                <span>{perk.name}</span>
              </div>)}
          </div>
        </div>

        {/* TradingView Partner Banner */}
        <div className="px-4 pb-3">
          <a 
            href="https://www.tradingview.com/?aff_id=162505" 
            target="_blank" 
            rel="noopener noreferrer"
            className="block rounded-lg overflow-hidden hover:opacity-90 transition-opacity border border-border"
          >
            <img 
              src={tradingViewBanner} 
              alt="TradingView - The fastest way to follow markets" 
              className="w-full h-auto"
            />
          </a>
          <p className="text-xs text-center text-muted-foreground mt-1">
            Official Partner
          </p>
        </div>

        {/* Coming Soon Badge */}
        <div className="px-4 pb-3">
          <Badge variant="secondary" className="w-full justify-center py-1">
            <Sparkles className="h-3 w-3 mr-1" />
            More benefits coming soon!
          </Badge>
        </div>

        {/* CTA Button */}
        <div className="p-4 pt-0">
          <Button className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white" onClick={() => window.open("https://www.workingadvantage.com/?tab=h", "_blank")}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Access Your Perks
          </Button>
        </div>

        {/* Help */}
        <div className="px-4 pb-4 text-center">
          <p className="text-xs text-muted-foreground">
            Need help? Contact{" "}
            <a href="mailto:customerservice@workingadvantage.com" className="text-primary hover:underline">
              customerservice@workingadvantage.com
            </a>
          </p>
        </div>
      </PopoverContent>
    </Popover>;
}