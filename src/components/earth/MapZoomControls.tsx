import { Plus, Minus, Compass } from 'lucide-react';

interface MapZoomControlsProps {
  map: mapboxgl.Map | null;
}

/**
 * Custom zoom controls (replaces the default white Mapbox NavigationControl).
 * Black glass surface, green icons — inverted on hover (green surface, black icon).
 */
export const MapZoomControls = ({ map }: MapZoomControlsProps) => {
  if (!map) return null;

  const btn =
    "w-9 h-9 flex items-center justify-center text-emerald-400 hover:bg-emerald-400 hover:text-black active:bg-emerald-300 transition-colors";

  return (
    <div className="absolute top-4 right-4 z-10 pointer-events-auto">
      <div className="flex flex-col rounded-xl overflow-hidden backdrop-blur-2xl bg-black/70 border border-emerald-400/25 shadow-[0_0_20px_rgba(16,185,129,0.15)] divide-y divide-emerald-400/15">
        <button className={btn} title="Zoom in" onClick={() => map.zoomIn({ duration: 300 })}>
          <Plus className="w-4 h-4" />
        </button>
        <button className={btn} title="Zoom out" onClick={() => map.zoomOut({ duration: 300 })}>
          <Minus className="w-4 h-4" />
        </button>
        <button
          className={btn}
          title="Reset bearing"
          onClick={() => map.easeTo({ bearing: 0, pitch: 45, duration: 400 })}
        >
          <Compass className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
