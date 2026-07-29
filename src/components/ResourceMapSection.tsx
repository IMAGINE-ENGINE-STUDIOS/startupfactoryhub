import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, PlusCircle, Search, Sparkles, Globe2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import memberBadge from "@/assets/member-badge.png.asset.json";

const GlobalResourcesMap = lazy(() =>
  import("@/components/GlobalResourcesMap").then((m) => ({ default: m.GlobalResourcesMap }))
);

const ResourceMapSection = () => {
  const navigate = useNavigate();

  return (
    <section id="resource-map" className="py-12 sm:py-20 relative overflow-hidden">
      {/* subtle ambient glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-[radial-gradient(circle_at_center,hsl(var(--primary)/0.12)_0%,transparent_60%)] opacity-60" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-8 sm:mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <Sparkles className="w-3.5 h-3.5" />
            Live Ecosystem Intelligence
          </div>

          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 tracking-tight">
            <span className="bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
              Global Resource Map
            </span>
          </h2>
          <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
            Explore every accelerator, investor, hub, and program in the ecosystem — plotted in real time.
          </p>
        </div>

        {/* Community bar — above the map */}
        <div className="mb-6 sm:mb-8">
          <div className="glass-morphism rounded-2xl p-5 sm:p-6 border border-border/50 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="flex flex-col lg:flex-row items-center gap-5 relative z-10">
              <div className="flex items-center gap-4 shrink-0">
                <img
                  src={memberBadge.url}
                  alt="Community member badge"
                  className="w-[72px] h-[72px] rounded-full object-cover shadow-lg shadow-primary/20 border-2 border-primary/20"
                />
                <div className="text-left">
                  <p className="text-base font-semibold text-foreground">Built by the community</p>
                  <p className="text-sm text-muted-foreground">
                    Help expand the map for founders everywhere
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto lg:ml-auto">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full sm:w-auto min-h-[52px] rounded-xl shadow-glow hover:shadow-lg transition-all duration-300 group"
                  onClick={() => navigate("/auth")}
                >
                  <PlusCircle className="w-5 h-5 transition-transform group-hover:rotate-90" />
                  Add your resource
                </Button>

                <Button
                  variant="glass"
                  size="lg"
                  className="w-full sm:w-auto min-h-[52px] rounded-xl hover:bg-ocean-surface/80 transition-all duration-300 group"
                  onClick={() => navigate("/resources")}
                >
                  <Search className="w-5 h-5 transition-transform group-hover:scale-110" />
                  Identify a resource
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Modern map frame */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-br from-primary/30 via-cyan-400/20 to-purple-400/30 rounded-[2rem] blur-lg opacity-40 group-hover:opacity-60 transition-opacity duration-500" />
          <div className="relative rounded-[1.5rem] overflow-hidden border border-border/60 bg-background/40 backdrop-blur-sm shadow-2xl h-[620px] sm:h-[760px] lg:h-[860px]">
            <Suspense
              fallback={
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-card/40">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
                    <MapPin className="w-8 h-8 text-primary relative" />
                  </div>
                  <span className="text-sm text-muted-foreground">Loading resource map...</span>
                </div>
              }
            >
              <GlobalResourcesMap hideEarthIntelligence />
            </Suspense>

            {/* Floating corner badge */}
            <div className="absolute top-4 left-4 z-10 hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl glass-morphism border border-border/40">
              <Globe2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-foreground">Interactive Globe</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResourceMapSection;
