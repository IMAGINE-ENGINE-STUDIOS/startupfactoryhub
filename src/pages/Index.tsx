import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  GripVertical,
  Pencil,
  Save,
  X,
  Trash2,
  RotateCcw,
  ArrowUp,
  ArrowDown,
  Palette,
  Type,
  Check,
} from "lucide-react";
import { useHomeLayout, type SectionStyle } from "@/hooks/useHomeLayout";
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

const collectTextNodes = (root: HTMLElement) => {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) =>
      node.nodeValue && node.nodeValue.trim().length > 0
        ? NodeFilter.FILTER_ACCEPT
        : NodeFilter.FILTER_REJECT,
  });
  const nodes: Text[] = [];
  let current = walker.nextNode();
  while (current) {
    nodes.push(current as Text);
    current = walker.nextNode();
  }
  return nodes;
};

const Index = () => {
  const {
    order,
    setOrder,
    hidden,
    setHidden,
    styles,
    setStyles,
    texts,
    setTexts,
    isAdmin,
    saving,
    save,
  } = useHomeLayout(DEFAULT_ORDER);
  const [editMode, setEditMode] = useState(false);
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [textEditKey, setTextEditKey] = useState<string | null>(null);
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const byKey = useMemo(
    () => Object.fromEntries(SECTIONS.map((s) => [s.key, s])) as Record<string, (typeof SECTIONS)[number]>,
    []
  );

  const visibleKeys = editMode ? order : order.filter((k) => !hidden.includes(k));

  // Apply saved text overrides to rendered sections
  useEffect(() => {
    const timer = window.setTimeout(() => {
      Object.entries(texts).forEach(([key, map]) => {
        const el = contentRefs.current[key];
        if (!el) return;
        const nodes = collectTextNodes(el);
        Object.entries(map).forEach(([idx, value]) => {
          const node = nodes[Number(idx)];
          if (node && node.nodeValue !== value) node.nodeValue = value;
        });
      });
    }, 150);
    return () => window.clearTimeout(timer);
  }, [texts, visibleKeys, textEditKey]);

  const move = (key: string, direction: -1 | 1) => {
    const next = [...order];
    const from = next.indexOf(key);
    const to = from + direction;
    if (to < 0 || to >= next.length) return;
    [next[from], next[to]] = [next[to], next[from]];
    setOrder(next);
  };

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

  const setStyleValue = (key: string, field: keyof SectionStyle, value: string) => {
    setStyles({ ...styles, [key]: { ...(styles[key] ?? {}), [field]: value } });
  };

  const clearStyle = (key: string) => {
    const next = { ...styles };
    delete next[key];
    setStyles(next);
  };

  const captureText = useCallback(
    (key: string) => {
      const el = contentRefs.current[key];
      if (!el) return texts;
      const nodes = collectTextNodes(el);
      const map: Record<string, string> = {};
      nodes.forEach((node, index) => {
        const saved = texts[key]?.[String(index)];
        const value = node.nodeValue ?? "";
        if (saved !== undefined || value !== undefined) map[String(index)] = value;
      });
      const next = { ...texts, [key]: map };
      setTexts(next);
      return next;
    },
    [texts, setTexts]
  );

  const toggleTextEdit = (key: string) => {
    if (textEditKey === key) {
      captureText(key);
      setTextEditKey(null);
    } else {
      setTextEditKey(key);
    }
  };

  const handleSave = async () => {
    let latestTexts = texts;
    if (textEditKey) {
      latestTexts = captureText(textEditKey);
      setTextEditKey(null);
    }
    const ok = await save(order, hidden, styles, latestTexts);
    toast[ok ? "success" : "error"](ok ? "Home layout published" : "Could not save layout");
    if (ok) setEditMode(false);
  };

  const handleReset = () => {
    setOrder(DEFAULT_ORDER);
    setHidden([]);
    setStyles({});
    setTexts({});
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

      {visibleKeys.map((key, index) => {
        const section = byKey[key];
        if (!section) return null;
        const isHidden = hidden.includes(key);
        const style = styles[key] ?? {};
        const styleVars: React.CSSProperties = {
          ...(style.text ? { color: style.text } : {}),
          ...(style.background ? { background: style.background } : {}),
        };

        if (!editMode) {
          return (
            <div
              key={key}
              style={styleVars}
              ref={(el) => {
                contentRefs.current[key] = el;
              }}
            >
              {section.render()}
            </div>
          );
        }

        const isTextEditing = textEditKey === key;

        return (
          <div
            key={key}
            draggable={!isTextEditing}
            onDragStart={() => setDragKey(key)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(key)}
            className={`relative border-2 border-dashed transition-colors ${
              dragKey === key ? "border-primary" : "border-primary/30"
            } ${isHidden ? "opacity-40" : ""}`}
          >
            <div className="sticky top-20 z-40 flex flex-wrap items-center justify-between gap-2 px-4 py-2 tech-card border-0">
              <span className="flex items-center gap-2 text-sm font-medium">
                <GripVertical className="h-4 w-4 cursor-grab" />
                {section.label}
                {isHidden && <span className="text-xs text-muted-foreground">(hidden)</span>}
              </span>

              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={index === 0}
                  onClick={() => move(key, -1)}
                  aria-label={`Move ${section.label} up`}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="h-8 w-8"
                  disabled={index === visibleKeys.length - 1}
                  onClick={() => move(key, 1)}
                  aria-label={`Move ${section.label} down`}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" variant="outline">
                      <Palette className="h-4 w-4 mr-1" /> Colors
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 bg-background backdrop-blur-none space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm">Text color</label>
                      <input
                        type="color"
                        value={style.text ?? "#ffffff"}
                        onChange={(e) => setStyleValue(key, "text", e.target.value)}
                        className="h-8 w-12 rounded border bg-transparent"
                      />
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <label className="text-sm">Background</label>
                      <input
                        type="color"
                        value={style.background ?? "#000000"}
                        onChange={(e) => setStyleValue(key, "background", e.target.value)}
                        className="h-8 w-12 rounded border bg-transparent"
                      />
                    </div>
                    <Button size="sm" variant="ghost" className="w-full" onClick={() => clearStyle(key)}>
                      <RotateCcw className="h-4 w-4 mr-1" /> Clear colors
                    </Button>
                  </PopoverContent>
                </Popover>

                <Button
                  size="sm"
                  variant={isTextEditing ? "default" : "outline"}
                  onClick={() => toggleTextEdit(key)}
                >
                  {isTextEditing ? (
                    <>
                      <Check className="h-4 w-4 mr-1" /> Done
                    </>
                  ) : (
                    <>
                      <Type className="h-4 w-4 mr-1" /> Edit text
                    </>
                  )}
                </Button>

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
            </div>

            <div
              ref={(el) => {
                contentRefs.current[key] = el;
              }}
              style={styleVars}
              contentEditable={isTextEditing}
              suppressContentEditableWarning
              className={
                isTextEditing ? "outline-none ring-2 ring-primary/50" : "pointer-events-none"
              }
            >
              {section.render()}
            </div>
          </div>
        );
      })}

      <Footer />
    </div>
  );
};

export default Index;
