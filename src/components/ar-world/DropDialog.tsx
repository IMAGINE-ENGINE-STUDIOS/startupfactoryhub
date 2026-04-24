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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Box,
  File,
  Hand,
  Image as ImageIcon,
  Loader2,
  Music,
  Pin,
  Type,
  Upload,
  Video,
} from "lucide-react";
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
  file:
    ".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.zip,.txt,.json,.md,.rtf,.pages,.numbers,.key,*/*",
  text: "",
};

const TYPE_META: Array<{
  value: ARContentType;
  label: string;
  icon: typeof Type;
  needsFile: boolean;
}> = [
  { value: "text", label: "Text", icon: Type, needsFile: false },
  { value: "model_3d", label: "3D", icon: Box, needsFile: true },
  { value: "image", label: "Image", icon: ImageIcon, needsFile: true },
  { value: "video", label: "Video", icon: Video, needsFile: true },
  { value: "file", label: "File", icon: File, needsFile: true },
  { value: "audio", label: "Audio", icon: Music, needsFile: true },
];

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
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const currentType = useMemo(
    () => TYPE_META.find((type) => type.value === contentType) ?? TYPE_META[0],
    [contentType]
  );

  const reset = () => {
    setTitle("");
    setDescription("");
    setColor("#00ffaa");
    setScale(1);
    setFile(null);
    setContentType("text");
    setPlacementMode("static");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    if (!open) reset();
  }, [open]);

  useEffect(() => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }, [contentType]);

  const handleSubmit = async () => {
    if (latitude === null || longitude === null) return;
    if (!title.trim()) {
      toast.error("Please add a title");
      return;
    }
    if (currentType.needsFile && !file) {
      toast.error(`Please choose a ${currentType.label.toLowerCase()} file`);
      return;
    }

    setUploading(true);
    let contentUrl: string | null = null;

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

      const created = await onCreate({
        title: title.trim(),
        description:
          description.trim() ||
          (file && currentType.value === "file" ? `Shared file: ${file.name}` : null),
        content_type: contentType,
        content_url: contentUrl,
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

        <Tabs value={contentType} onValueChange={(value) => setContentType(value as ARContentType)}>
          <TabsList className="grid grid-cols-6 w-full">
            {TYPE_META.map(({ value, icon: Icon, label }) => (
              <TabsTrigger key={value} value={value} className="px-1" aria-label={label}>
                <Icon className="w-4 h-4" />
              </TabsTrigger>
            ))}
          </TabsList>

          {TYPE_META.filter((type) => type.needsFile).map(({ value, label }) => (
            <TabsContent key={value} value={value} className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label className="text-xs">{label} file</Label>
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT[value]}
                  onChange={(event) => setFile(event.target.files?.[0] || null)}
                />
              </div>
              {file && (
                <p className="text-xs text-muted-foreground break-all">
                  Ready to place: {file.name}
                </p>
              )}
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
              onChange={(event) => setTitle(event.target.value)}
              placeholder={currentType.value === "file" && file ? file.name : "Name your drop"}
            />
          </div>
          <div>
            <Label className="text-xs">Description (optional)</Label>
            <Textarea
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              rows={2}
              placeholder={
                currentType.value === "file"
                  ? "Add a note about this file..."
                  : "Tell others what this is..."
              }
            />
          </div>

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
                onChange={(event) => setColor(event.target.value)}
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
                onChange={(event) => setScale(parseFloat(event.target.value) || 1)}
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
