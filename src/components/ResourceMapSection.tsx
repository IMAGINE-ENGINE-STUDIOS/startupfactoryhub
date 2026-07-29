import { lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, PlusCircle, Search, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

const GlobalResourcesMap = lazy(() =>
  import("@/components/GlobalResourcesMap").then((m) => ({ default: m.GlobalResourcesMap }))
);

const ResourceMapSection = () => {
  const navigate = useNavigate();

  return (
    <section id="resource-map" className="py-10 sm:py-14 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6 sm:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-3 bg-gradient-to-r from-primary via-cyan-400 to-purple-400 bg-clip-text text-transparent">
            Global Resource Map
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Explore every accelerator, investor, hub, and program in the ecosystem
          </p>
        </div>

        <div className="relative rounded-2xl overflow-hidden border border-border/50 h-[520px] sm:h-[600px]">
          <Suspense
            fallback={
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-card/40">
                <MapPin className="w-7 h-7 text-primary animate-pulse" />
                <span className="text-sm text-muted-foreground">Loading resource map...</span>
              </div>
            }
          >
            <GlobalResourcesMap hideEarthIntelligence />
          </Suspense>
        </div>

        <div className="mt-6 sm:mt-8">
          <div className="glass-morphism rounded-2xl p-5 sm:p-6 border border-border/50">
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-3 shrink-0">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">Built by the community</p>
                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Help expand the map for founders everywhere
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto sm:ml-auto">
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full sm:w-auto min-h-[48px] rounded-xl shadow-glow hover:shadow-lg transition-all duration-300 group"
                  onClick={() => navigate("/auth")}
                >
                  <PlusCircle className="w-5 h-5 transition-transform group-hover:rotate-90" />
                  Add your resource
                </Button>

                <Button
                  variant="glass"
                  size="lg"
                  className="w-full sm:w-auto min-h-[48px] rounded-xl hover:bg-ocean-surface/80 transition-all duration-300 group"
                  onClick={() => navigate("/resources")}
                >
                  <Search className="w-5 h-5 transition-transform group-hover:scale-110" />
                  Identify a resource
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ResourceMapSection;
