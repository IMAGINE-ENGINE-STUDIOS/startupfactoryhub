import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, Box, Image as ImageIcon, Music, Video, Type, Upload, Pin, Hand } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ARContentType, ARDrop, PlacementMode } from "@/hooks/useARDrops";

interface DropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  latitude: number | null;
  longitude: number | null;
  onCreate: (
    drop: Omit<ARDrop, "id" | "created_at" | "updated_at" | "user_id">
  ) => Promise<ARDrop | null>;
}

const ACCEPT: Record<ARContentType, string> = {
  model_3d: ".glb,.gltf,model/gltf-binary,model/gltf+json",
  image: "image/*",
  audio: "audio/*",
  video: "video/*",
  text: "",
};

export const DropDialog = ({
  open,
  onOpenChange,
  latitude,
  longitude,
  onCreate,
}: DropDialogProps) => {
  const [contentType, setContentType] = useState<ARContentType>("text");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [color, setColor] = useState("#00ffaa");
  const [scale, setScale] = useState(1);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [placementMode, setPlacementMode] = useState<PlacementMode>("static");

  const reset = () => {
    setTitle("");
    setDescription("");
    setColor("#00ffaa");
    setScale(1);
    setFile(null);
    setContentType("text");
    setPlacementMode("static");
  };

  const handleSubmit = async () => {
    if (latitude === null || longitude === null) return;
    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }
    if (contentType !== "text" && !file) {
      toast.error("Please choose a file to upload");
      return;
    }

    setUploading(true);
    let content_url: string | null = null;

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
        const { error: upErr } = await supabase.storage
          .from("ar-content")
          .upload(path, file, { contentType: file.type, upsert: false });
        if (upErr) {
          toast.error("Upload failed: " + upErr.message);
          setUploading(false);
          return;
        }
        const { data: pub } = supabase.storage.from("ar-content").getPublicUrl(path);
        content_url = pub.publicUrl;
      }

      const created = await onCreate({
        title: title.trim(),
        description: description.trim() || null,
        content_type: contentType,
        content_url,
        thumbnail_url: null,
        latitude,
        longitude,
        altitude: 0,
        rotation: 0,
        scale,
        color,
        is_public: true,
        placement_mode: placementMode,
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
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Drop AR Content</DialogTitle>
          <DialogDescription>
            {latitude !== null && longitude !== null
              ? `at ${latitude.toFixed(4)}°, ${longitude.toFixed(4)}°`
              : "Pick a spot on the globe"}
          </DialogDescription>
        </DialogHeader>

        <Tabs value={contentType} onValueChange={(v) => setContentType(v as ARContentType)}>
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="text" className="px-1">
              <Type className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="model_3d" className="px-1">
              <Box className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="image" className="px-1">
              <ImageIcon className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="audio" className="px-1">
              <Music className="w-4 h-4" />
            </TabsTrigger>
            <TabsTrigger value="video" className="px-1">
              <Video className="w-4 h-4" />
            </TabsTrigger>
          </TabsList>

          {(["model_3d", "image", "audio", "video"] as ARContentType[]).map((t) => (
            <TabsContent key={t} value={t} className="space-y-2 pt-2">
              <Label className="text-xs">
                {t === "model_3d"
                  ? "3D model (.glb / .gltf)"
                  : t === "image"
                  ? "Image"
                  : t === "audio"
                  ? "Audio"
                  : "Video"}
              </Label>
              <Input
                type="file"
                accept={ACCEPT[t]}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </TabsContent>
          ))}

          <TabsContent value="text" className="pt-2 text-xs text-muted-foreground">
            Drop a floating message that anyone can find at this spot.
          </TabsContent>
        </Tabs>

        <div className="space-y-3">
          <div>
            <Label className="text-xs">Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Name your drop"
            />
          </div>
          <div>
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Tell others what this is..."
            />
          </div>

          {/* Placement mode */}
          <div>
            <Label className="text-xs">Placement</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              <button
                type="button"
                onClick={() => setPlacementMode("static")}
                className={`flex items-start gap-2 p-2.5 rounded-md border text-left transition ${
                  placementMode === "static"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Pin className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">Static</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">
                    Locked to this spot. Only you & admins can move it.
                  </div>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setPlacementMode("free")}
                className={`flex items-start gap-2 p-2.5 rounded-md border text-left transition ${
                  placementMode === "free"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted"
                }`}
              >
                <Hand className="w-4 h-4 mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs font-semibold">Free move</div>
                  <div className="text-[10px] text-muted-foreground leading-tight">
                    Anyone nearby can grab it with the camera and move it.
                  </div>
                </div>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Pin color</Label>
              <Input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-10 p-1"
              />
            </div>
            <div>
              <Label className="text-xs">Scale</Label>
              <Input
                type="number"
                step="0.1"
                min="0.1"
                max="10"
                value={scale}
                onChange={(e) => setScale(parseFloat(e.target.value) || 1)}
              />
            </div>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={uploading} className="w-full">
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Uploading...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Drop here
            </>
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
};
