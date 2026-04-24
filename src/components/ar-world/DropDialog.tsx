import { useEffect, useMemo, useRef, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Box,
  ChevronDown,
  File as FileIcon,
  Image as ImageIcon,
  Loader2,
  Music,
  Type,
  Upload,
  Video,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ARContentType, ARDrop } from "@/hooks/useARDrops";
import { ModelLibraryPicker } from "./ModelLibraryPicker";
import type { ARModelLibraryEntry } from "@/lib/ar-model-library";

interface DropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number | null;
  longitude: number | null;
  onCreate: (
    drop: Omit<ARDrop, "id" | "created_at" | "updated_at" | "user_id">
  ) => Promise<ARDrop | null>;
}

const detectType = (file: File): ARContentType => {
  const name = file.name.toLowerCase();
  const mime = file.type.toLowerCase();
  if (name.endsWith(".glb") || name.endsWith(".gltf") || mime.includes("gltf")) return "model_3d";
  if (mime.startsWith("image/")) return "image";
  if (mime.startsWith("video/")) return "video";
  if (mime.startsWith("audio/")) return "audio";
  return "file";
};

const TYPE_ICON: Record<ARContentType, typeof Type> = {
  text: Type,
  model_3d: Box,
  image: ImageIcon,
  video: Video,
  audio: Music,
  file: FileIcon,
};

const TYPE_LABEL: Record<ARContentType, string> = {
  text: "Text",
  model_3d: "3D model",
  image: "Image",
  video: "Video",
  audio: "Audio",
  file: "File",
};

export const DropDialog = ({
  open,
  onOpenChange,
  latitude,
  longitude,
  onCreate,
}: DropDialogProps) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showPosition, setShowPosition] = useState(true);

  // 3D placement
  const [altitudeM, setAltitudeM] = useState(1.6); // eye level
  const [yawDeg, setYawDeg] = useState(0); // facing north
  const [pitchDeg, setPitchDeg] = useState(0);
  const [sizeM, setSizeM] = useState(1.5);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const detectedType: ARContentType = useMemo(
    () => (file ? detectType(file) : "text"),
    [file]
  );
  const Icon = TYPE_ICON[detectedType];

  const previewUrl = useMemo(() => {
    if (!file) return null;
    if (detectedType === "image" || detectedType === "video") {
      return URL.createObjectURL(file);
    }
    return null;
  }, [file, detectedType]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const reset = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setAltitudeM(1.6);
    setYawDeg(0);
    setPitchDeg(0);
    setSizeM(1.5);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  const handleSubmit = async () => {
    if (latitude === null || longitude === null) return;
    if (!file && !title.trim() && !description.trim()) {
      toast.error("Add a file or write something");
      return;
    }

    setUploading(true);
    let contentUrl: string | null = null;
    const contentType: ARContentType = file ? detectedType : "text";

    try {
      if (file) {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) {
          toast.error("Sign in required");
          setUploading(false);
          return;
        }
        const ext = file.name.split(".").pop() || "bin";
        const path = `${userData.user.id}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from("ar-content")
          .upload(path, file, { contentType: file.type || undefined, upsert: false });
        if (uploadError) {
          toast.error("Upload failed: " + uploadError.message);
          setUploading(false);
          return;
        }
        const { data: publicUrl } = supabase.storage.from("ar-content").getPublicUrl(path);
        contentUrl = publicUrl.publicUrl;
      }

      const finalTitle =
        title.trim() ||
        (file ? file.name.replace(/\.[^.]+$/, "") : "Note");

      const created = await onCreate({
        title: finalTitle,
        description: description.trim() || null,
        content_type: contentType,
        content_url: contentUrl,
        thumbnail_url: null,
        latitude,
        longitude,
        altitude: altitudeM,
        rotation: yawDeg,
        scale: sizeM,
        color: "#00ffaa",
        is_public: true,
        placement_mode: "static",
        altitude_m: altitudeM,
        yaw_deg: yawDeg,
        pitch_deg: pitchDeg,
        size_m: sizeM,
      });

      if (created) {
        reset();
        onOpenChange(false);
      }
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-black/60 backdrop-blur-2xl border-white/10 text-white">
        <DialogHeader>
          <DialogTitle className="text-white">Drop content here</DialogTitle>
          <DialogDescription className="text-white/60">
            {latitude !== null && longitude !== null
              ? `Pinned at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`
              : "Pick a spot first"}
          </DialogDescription>
        </DialogHeader>

        {/* File picker / preview */}
        <div className="space-y-2">
          {!file ? (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition py-8 flex flex-col items-center justify-center gap-2 text-white/70"
            >
              <Upload className="w-6 h-6" />
              <div className="text-sm font-medium text-white">Tap to upload</div>
              <div className="text-[11px] text-white/50">
                Image, video, 3D (.glb), audio or any file — or skip for a text note
              </div>
            </button>
          ) : (
            <div className="rounded-xl border border-white/15 bg-white/5 overflow-hidden">
              {detectedType === "image" && previewUrl && (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="w-full max-h-56 object-contain bg-black"
                />
              )}
              {detectedType === "video" && previewUrl && (
                <video
                  src={previewUrl}
                  className="w-full max-h-56 bg-black"
                  controls
                  playsInline
                  muted
                />
              )}
              <div className="flex items-center gap-2 p-2.5">
                <Icon className="w-4 h-4 text-white/70 shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-medium text-white truncate">{file.name}</div>
                  <div className="text-[10px] text-white/50">
                    {TYPE_LABEL[detectedType]} · {(file.size / 1024).toFixed(0)} KB
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-white/70 hover:text-white hover:bg-white/10 h-7 px-2"
                  onClick={() => {
                    setFile(null);
                    if (fileInputRef.current) fileInputRef.current.value = "";
                  }}
                >
                  Change
                </Button>
              </div>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        <div className="space-y-2">
          <div>
            <Label className="text-xs text-white/70">Title</Label>
            <Input
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={file ? file.name.replace(/\.[^.]+$/, "") : "Name this drop"}
              className="bg-white/10 border-white/15 text-white placeholder:text-white/40"
            />
          </div>
          <div>
            <Label className="text-xs text-white/70">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              placeholder="Add a short note..."
              className="bg-white/10 border-white/15 text-white placeholder:text-white/40"
            />
          </div>
        </div>

        {/* 3D placement controls */}
        <div className="rounded-xl border border-white/10 bg-white/5">
          <button
            type="button"
            onClick={() => setShowPosition((s) => !s)}
            className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold text-white/80 hover:text-white"
          >
            <span>Position &amp; size in 3D</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showPosition ? "rotate-180" : ""}`}
            />
          </button>
          {showPosition && (
            <div className="px-3 pb-3 space-y-3">
              <div>
                <div className="flex justify-between text-[10px] text-white/60 mb-1">
                  <span>Altitude (height)</span>
                  <span className="font-mono text-white">{altitudeM.toFixed(1)} m</span>
                </div>
                <Slider
                  value={[altitudeM]}
                  min={-5}
                  max={20}
                  step={0.1}
                  onValueChange={(v) => setAltitudeM(v[0])}
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-white/60 mb-1">
                  <span>Yaw (facing)</span>
                  <span className="font-mono text-white">{Math.round(yawDeg)}°</span>
                </div>
                <Slider
                  value={[yawDeg]}
                  min={0}
                  max={360}
                  step={1}
                  onValueChange={(v) => setYawDeg(v[0])}
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-white/60 mb-1">
                  <span>Pitch (tilt)</span>
                  <span className="font-mono text-white">{Math.round(pitchDeg)}°</span>
                </div>
                <Slider
                  value={[pitchDeg]}
                  min={-45}
                  max={45}
                  step={1}
                  onValueChange={(v) => setPitchDeg(v[0])}
                />
              </div>
              <div>
                <div className="flex justify-between text-[10px] text-white/60 mb-1">
                  <span>Real size</span>
                  <span className="font-mono text-white">{sizeM.toFixed(2)} m</span>
                </div>
                <Slider
                  value={[sizeM]}
                  min={0.2}
                  max={10}
                  step={0.1}
                  onValueChange={(v) => setSizeM(v[0])}
                />
              </div>
              <p className="text-[10px] text-white/40 leading-tight">
                Objects render at true size — they look smaller from far away and bigger up close, just like in real life.
              </p>
            </div>
          )}
        </div>

        <Button onClick={handleSubmit} disabled={uploading} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Pinning...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Pin here
            </>
          )}
        </Button>
        <p className="text-[10px] text-white/40 text-center -mt-1">
          Locked to these coordinates · only you can move or remove it
        </p>
      </DialogContent>
    </Dialog>
  );
};
