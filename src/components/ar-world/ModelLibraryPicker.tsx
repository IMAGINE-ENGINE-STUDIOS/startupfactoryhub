import { useMemo, useState } from "react";
import { Box, Search, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  AR_MODEL_LIBRARY,
  AR_MODEL_CATEGORIES,
  type ARModelLibraryEntry,
} from "@/lib/ar-model-library";
import "@google/model-viewer";

interface ModelLibraryPickerProps {
  selectedSrc: string | null;
  onSelect: (model: ARModelLibraryEntry) => void;
}

export const ModelLibraryPicker = ({
  selectedSrc,
  onSelect,
}: ModelLibraryPickerProps) => {
  const [query, setQuery] = useState("");
  const [activeCat, setActiveCat] = useState<string>("All");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return AR_MODEL_LIBRARY.filter((m) => {
      if (activeCat !== "All" && m.category !== activeCat) return false;
      if (!q) return true;
      return (
        m.name.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q)
      );
    });
  }, [query, activeCat]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-white/40" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search free 3D models..."
          className="pl-8 bg-white/10 border-white/15 text-white placeholder:text-white/40 h-8 text-xs"
        />
      </div>

      <div className="flex gap-1 overflow-x-auto pb-1 -mx-1 px-1 no-scrollbar">
        {(["All", ...AR_MODEL_CATEGORIES] as const).map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setActiveCat(cat)}
            className={`shrink-0 px-2.5 py-1 rounded-full text-[10px] font-medium border transition ${
              activeCat === cat
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-white/5 text-white/70 border-white/10 hover:bg-white/10"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-1.5 max-h-56 overflow-y-auto pr-1">
        {filtered.map((m) => {
          const selected = selectedSrc === m.src;
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => onSelect(m)}
              className={`group relative aspect-square rounded-lg overflow-hidden border transition ${
                selected
                  ? "border-primary ring-2 ring-primary"
                  : "border-white/10 hover:border-white/30"
              } bg-gradient-to-br from-white/5 to-white/0`}
              title={m.name}
            >
              <model-viewer
                src={m.src}
                alt={m.name}
                camera-controls={false as any}
                disable-zoom
                interaction-prompt="none"
                auto-rotate
                shadow-intensity="0"
                style={{
                  width: "100%",
                  height: "100%",
                  background: "transparent",
                  pointerEvents: "none",
                }}
              />
              <div className="absolute inset-x-0 bottom-0 bg-black/70 px-1 py-0.5">
                <div className="text-[9px] text-white truncate font-medium">
                  {m.name}
                </div>
                <div className="text-[8px] text-white/50 truncate">
                  {m.defaultSizeM}m
                </div>
              </div>
              {selected && (
                <div className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </div>
              )}
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="col-span-3 text-center text-[11px] text-white/50 py-6 flex flex-col items-center gap-1">
            <Box className="w-4 h-4" />
            No models match "{query}"
          </div>
        )}
      </div>
    </div>
  );
};
