import { useMemo, useState } from "react";
import Navigation from "@/components/Navigation";
import HeroSection from "@/components/HeroSection";
import NasdaqFeature from "@/components/NasdaqFeature";
import FeaturesSection from "@/components/FeaturesSection";
import CommunitySection from "@/components/CommunitySection";
import ResourceMapSection from "@/components/ResourceMapSection";
import PricingPlansSection from "@/components/PricingPlansSection";
import AboutHero from "@/components/AboutHero";
import PartnersCarousel from "@/components/PartnersCarousel";
import Footer from "@/components/Footer";
import PWAInstallBanner from "@/components/PWAInstallBanner";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Save, X, Trash2, RotateCcw } from "lucide-react";
import { useHomeLayout } from "@/hooks/useHomeLayout";
import { toast } from "sonner";

const SECTIONS: { key: string; label: string; render: () => JSX.Element }[] = [
  { key: "hero", label: "Hero", render: () => <HeroSection /> },
  { key: "partners", label: "Partners Carousel", render: () => <PartnersCarousel /> },
  { key: "nasdaq", label: "Nasdaq Feature", render: () => <NasdaqFeature /> },
  { key: "about", label: "About Startup Factory Hub", render: () => <AboutHero /> },
  { key: "resourceMap", label: "Resource Map", render: () => <ResourceMapSection /> },
  { key: "pricing", label: "Pricing Plans", render: () => <PricingPlansSection /> },
  { key: "features", label: "Features", render: () => <FeaturesSection /> },
  { key: "community", label: "Community", render: () => <CommunitySection /> },
];

const DEFAULT_ORDER = SECTIONS.map((s) => s.key);

const Index = () => {
  const { order, setOrder, hidden, setHidden, isAdmin, saving, save } = useHomeLayout(DEFAULT_ORDER);
  const [editMode, setEditMode] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);

  const byKey = useMemo(
    () => Object.fromEntries(SECTIONS.map((s) => [s.key, s])) as Record<string, (typeof SECTIONS)[number]>,
    []
  );

  const visibleKeys = editMode ? order : order.filter((k) => !hidden.includes(k));

  const handleDrop = (targetKey: string) => {
    if (!dragKey || dragKey === targetKey) return;
    const next = [...order];
    const from = next.indexOf(dragKey);
    const to = next.indexOf(targetKey);
    next.splice(from, 1);
    next.splice(to, 0, dragKey);
    setOrder(next);
    setDragKey(null);
  };

  const handleSave = async () => {
    const ok = await save(order, hidden);
    toast[ok ? "success" : "error"](ok ? "Home layout published" : "Could not save layout");
    if (ok) setEditMode(false);
  };

  const handleReset = () => {
    setOrder(DEFAULT_ORDER);
    setHidden([]);
  };

  return (
    <div className="min-h-screen">
      <PWAInstallBanner />
      <Navigation />

      {isAdmin && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2">
          {editMode ? (
            <div className="tech-card border-0 flex items-center gap-2 rounded-full p-2">
              <Button size="sm" variant="ghost" onClick={handleReset}>
                <RotateCcw className="h-4 w-4 mr-1" /> Reset
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setEditMode(false)}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-1" /> {saving ? "Saving..." : "Save & Publish"}
              </Button>
            </div>
          ) : (
            <Button size="sm" className="rounded-full shadow-lg" onClick={() => setEditMode(true)}>
              <Pencil className="h-4 w-4 mr-1" /> Edit layout
            </Button>
          )}
        </div>
      )}

      {visibleKeys.map((key) => {
        const section = byKey[key];
        if (!section) return null;
        const isHidden = hidden.includes(key);

        if (!editMode) return <div key={key}>{section.render()}</div>;

        return (
          <div
            key={key}
            draggable
            onDragStart={() => setDragKey(key)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(key)}
            className={`relative border-2 border-dashed transition-colors ${
              dragKey === key ? "border-primary" : "border-primary/30"
            } ${isHidden ? "opacity-40" : ""}`}
          >
            <div className="sticky top-20 z-40 flex items-center justify-between gap-2 px-4 py-2 tech-card border-0">
              <span className="flex items-center gap-2 text-sm font-medium">
                <GripVertical className="h-4 w-4 cursor-grab" />
                {section.label}
                {isHidden && <span className="text-xs text-muted-foreground">(hidden)</span>}
              </span>
              <Button
                size="sm"
                variant={isHidden ? "outline" : "destructive"}
                onClick={() =>
                  setHidden(isHidden ? hidden.filter((k) => k !== key) : [...hidden, key])
                }
              >
                {isHidden ? (
                  <>
                    <RotateCcw className="h-4 w-4 mr-1" /> Restore
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </>
                )}
              </Button>
            </div>
            <div className="pointer-events-none">{section.render()}</div>
          </div>
        );
      })}

      <Footer />
    </div>
  );
};

export default Index;
