import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { EarthGlobe } from "@/components/ar-world/EarthGlobe";
import { DropDialog } from "@/components/ar-world/DropDialog";
import { DropDetailDialog } from "@/components/ar-world/DropDetailDialog";
import { useARDrops, type ARDrop } from "@/hooks/useARDrops";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Sparkles,
  Loader2,
  Globe2,
  Box,
  Image as ImageIcon,
  Music,
  Video,
  Type,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const TYPE_ICONS = {
  model_3d: Box,
  image: ImageIcon,
  audio: Music,
  video: Video,
  text: Type,
} as const;

export default function ARWorld() {
  const { drops, loading, createDrop, deleteDrop } = useARDrops();
  const { user } = useAuth();

  const [placingMode, setPlacingMode] = useState(false);
  const [pickedLatLng, setPickedLatLng] = useState<{ lat: number; lng: number } | null>(null);
  const [dropDialogOpen, setDropDialogOpen] = useState(false);
  const [selectedDrop, setSelectedDrop] = useState<ARDrop | null>(null);

  const handlePickLocation = (lat: number, lng: number) => {
    setPickedLatLng({ lat, lng });
    setDropDialogOpen(true);
    setPlacingMode(false);
  };

  const counts = useMemo(() => {
    const c = { model_3d: 0, image: 0, audio: 0, video: 0, text: 0 };
    drops.forEach((d) => {
      c[d.content_type]++;
    });
    return c;
  }, [drops]);

  useEffect(() => {
    document.title = "AR World — Drop AR content anywhere on Earth";
    const meta = document.querySelector('meta[name="description"]');
    const desc = "A live AR world. Drop 3D models, images, audio, video and chat with others in real time, anywhere on Earth.";
    if (meta) meta.setAttribute("content", desc);
    else {
      const m = document.createElement("meta");
      m.name = "description";
      m.content = desc;
      document.head.appendChild(m);
    }
  }, []);

  return (
    <div className="fixed inset-0 bg-black text-foreground overflow-hidden">

      {/* 3D Earth */}
      <div className="absolute inset-0">
        {loading ? (
          <div className="w-full h-full flex items-center justify-center text-white/60">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            Loading the world...
          </div>
        ) : (
          <EarthGlobe
            drops={drops}
            placingMode={placingMode}
            onPickLocation={handlePickLocation}
            onSelectDrop={(d) => setSelectedDrop(d)}
          />
        )}
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 pointer-events-auto">
          <Link to="/">
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              AR World
            </h1>
            <p className="text-[11px] text-white/60">
              Drop AR content anywhere on Earth · view it in AR with your phone
            </p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-2 pointer-events-auto bg-black/50 backdrop-blur border border-white/10 rounded-lg px-3 py-1.5">
          <Globe2 className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-white/80">{drops.length} drops worldwide</span>
        </div>
      </div>

      {/* Bottom legend */}
      <div className="absolute bottom-4 left-4 pointer-events-auto bg-black/60 backdrop-blur border border-white/10 rounded-lg p-3 text-white text-xs space-y-1.5">
        <div className="font-semibold mb-1 flex items-center gap-1.5">
          <MapPin className="w-3 h-3" />
          Worldwide drops
        </div>
        {(Object.keys(counts) as Array<keyof typeof counts>).map((k) => {
          const Icon = TYPE_ICONS[k];
          return (
            <div key={k} className="flex items-center gap-2 opacity-80">
              <Icon className="w-3 h-3" />
              <span className="capitalize">{k.replace("_", " ")}</span>
              <Badge variant="secondary" className="ml-auto h-4 text-[10px] px-1.5">
                {counts[k]}
              </Badge>
            </div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="absolute bottom-6 right-6 flex flex-col gap-2 items-end pointer-events-auto">
        {placingMode && (
          <div className="bg-primary/90 text-primary-foreground text-xs px-3 py-1.5 rounded-md font-medium animate-pulse">
            Tap any spot on Earth to drop content
          </div>
        )}

        {user ? (
          <Button
            size="lg"
            onClick={() => setPlacingMode((p) => !p)}
            className={
              placingMode
                ? "bg-destructive hover:bg-destructive/90 text-white shadow-lg"
                : "bg-primary hover:bg-primary/90 shadow-lg"
            }
          >
            {placingMode ? (
              <>Cancel</>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-1" />
                Drop AR Content
              </>
            )}
          </Button>
        ) : (
          <Link to="/auth">
            <Button size="lg" className="shadow-lg">
              Sign in to drop content
            </Button>
          </Link>
        )}
      </div>

      <DropDialog
        open={dropDialogOpen}
        onOpenChange={(o) => {
          setDropDialogOpen(o);
          if (!o) setPickedLatLng(null);
        }}
        latitude={pickedLatLng?.lat ?? null}
        longitude={pickedLatLng?.lng ?? null}
        onCreate={createDrop}
      />

      <DropDetailDialog
        drop={selectedDrop}
        onClose={() => setSelectedDrop(null)}
        onDelete={deleteDrop}
      />
    </div>
  );
}
