import { lazy, Suspense } from "react";
import { MapPin } from "lucide-react";

const GlobalResourcesMap = lazy(() =>
  import("@/components/GlobalResourcesMap").then((m) => ({ default: m.GlobalResourcesMap }))
);

const ResourceMapSection = () => {
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
      </div>
    </section>
  );
};

export default ResourceMapSection;
