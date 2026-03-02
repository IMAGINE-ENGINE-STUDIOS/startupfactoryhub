import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMembershipStatus } from "@/hooks/useMembershipStatus";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Wand2, Crown, Upload, Pencil, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import geniusAiLogo from "@/assets/genius-ai-logo.png";

const FREE_LIMIT = 10;

const STYLE_PRESETS = [
  { id: "none", label: "Auto", emoji: "✨" },
  { id: "photorealistic", label: "Photo", emoji: "📷" },
  { id: "digital_art", label: "Digital Art", emoji: "🎨" },
  { id: "watercolor", label: "Watercolor", emoji: "🖌️" },
  { id: "oil_painting", label: "Oil Paint", emoji: "🖼️" },
  { id: "anime", label: "Anime", emoji: "⛩️" },
  { id: "3d_render", label: "3D Render", emoji: "🧊" },
  { id: "sketch", label: "Sketch", emoji: "✏️" },
  { id: "pop_art", label: "Pop Art", emoji: "💥" },
];

const IMAGE_SIZES = [
  { id: "1024x1024", label: "Square (1024×1024)" },
  { id: "1920x1080", label: "Landscape (1920×1080)" },
  { id: "1080x1920", label: "Portrait (1080×1920)" },
  { id: "1280x720", label: "HD (1280×720)" },
  { id: "768x1024", label: "Tall (768×1024)" },
  { id: "512x512", label: "Small (512×512)" },
];

const PROMPT_SUGGESTIONS = [
  "A futuristic city skyline at golden hour with flying vehicles",
  "A serene Japanese garden with cherry blossoms and a koi pond",
  "An astronaut exploring a bioluminescent alien forest",
];

interface GeneratedImage {
  url: string;
  prompt: string;
  style: string;
  timestamp: number;
}

const SFHImageCreator = () => {
  const { user } = useAuth();
  const { isSubscribed } = useMembershipStatus();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prompt, setPrompt] = useState("");
  const [stylePreset, setStylePreset] = useState("none");
  const [imageSize, setImageSize] = useState("1024x1024");
  const [isGenerating, setIsGenerating] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [editPrompt, setEditPrompt] = useState("");
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchUsage = async () => {
      const { count } = await supabase
        .from("image_generation_usage" as any)
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      setUsageCount(count ?? 0);
    };
    fetchUsage();
  }, [user]);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({ title: "Enter a prompt", description: "Describe the image you want to create", variant: "destructive" });
      return;
    }

    setIsGenerating(true);
    try {
      const sizePromptSuffix = (() => {
        const [w, h] = imageSize.split("x").map(Number);
        if (w > h) return " in landscape format";
        if (h > w) return " in portrait format";
        return " in square format";
      })();

      const { data, error } = await supabase.functions.invoke("generate-sfh-image", {
        body: { prompt: prompt.trim() + sizePromptSuffix, stylePreset },
      });

      if (error) {
        const errorBody = typeof error === "object" && error.message ? error.message : String(error);
        if (errorBody.includes("402") || errorBody.includes("limit_reached")) {
          setShowUpgradeModal(true);
          return;
        }
        throw new Error(errorBody);
      }

      if (data?.error === "limit_reached") {
        setShowUpgradeModal(true);
        return;
      }

      if (data?.error) throw new Error(data.error);

      setGeneratedImage(data.imageUrl);
      setUsageCount(data.usageCount);
      setHistory((prev) => [
        { url: data.imageUrl, prompt: prompt.trim(), style: stylePreset, timestamp: Date.now() },
        ...prev,
      ]);
      setShowEditPanel(false);
      toast({ title: "Image generated!", description: "Your image is ready" });
    } catch (err: any) {
      console.error("Generation error:", err);
      toast({
        title: "Generation failed",
        description: err.message || "Something went wrong. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleEditImage = async () => {
    const imageToEdit = generatedImage || uploadedImage;
    if (!editPrompt.trim() || !imageToEdit) {
      toast({ title: "Enter an edit instruction", description: "Describe what changes you want", variant: "destructive" });
      return;
    }

    setIsEditing(true);
    try {
      const { data, error } = await supabase.functions.invoke("edit-sfh-image", {
        body: { editPrompt: editPrompt.trim(), imageUrl: imageToEdit },
      });

      if (error) throw new Error(typeof error === "object" && error.message ? error.message : String(error));
      if (data?.error) throw new Error(data.error);

      setGeneratedImage(data.imageUrl);
      setHistory((prev) => [
        { url: data.imageUrl, prompt: `Edit: ${editPrompt.trim()}`, style: "edited", timestamp: Date.now() },
        ...prev,
      ]);
      setEditPrompt("");
      setUploadedImage(null);
      toast({ title: "Image edited!", description: "Your modified image is ready" });
    } catch (err: any) {
      console.error("Edit error:", err);
      toast({
        title: "Edit failed",
        description: err.message || "Something went wrong. Try again.",
        variant: "destructive",
      });
    } finally {
      setIsEditing(false);
    }
  };

  const handleDownload = (url: string) => {
    const a = document.createElement("a");
    a.href = url;
    a.download = `imaginaly-${Date.now()}.png`;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = ["image/png", "image/jpeg", "image/jpg"];
    if (!validTypes.includes(file.type)) {
      toast({ title: "Invalid format", description: "Please upload a PNG or JPG image", variant: "destructive" });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max file size is 10MB", variant: "destructive" });
      return;
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setUploadedImage(dataUrl);
      setGeneratedImage(null);
      setShowEditPanel(true);
    };
    reader.readAsDataURL(file);
  };

  const usageLabel = isSubscribed
    ? "Unlimited"
    : usageCount !== null
      ? `${usageCount}/${FREE_LIMIT} free`
      : "...";

  const activeImage = generatedImage || uploadedImage;

  return (
    <div className="flex flex-col h-full gap-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          
          <span className="text-sm font-medium text-muted-foreground">Usage</span>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={isSubscribed ? "default" : "secondary"} className="text-xs">
            {isSubscribed && <Crown className="h-3 w-3 mr-1" />}
            {usageLabel}
          </Badge>
        </div>
      </div>

      <div className="flex flex-1 gap-4 min-h-0 overflow-hidden flex-col lg:flex-row">
        {/* Left Panel - Controls */}
        <div className="w-full lg:w-80 flex-shrink-0 space-y-4 overflow-y-auto">
          {/* Upload */}
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Upload Image</label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-2"
              onClick={() => fileInputRef.current?.click()}
              disabled={isGenerating || isEditing}
            >
              <Upload className="h-4 w-4" />
              Upload PNG / JPG
            </Button>
          </div>

          {/* Prompt */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Prompt</label>
            <Textarea
              placeholder="Describe the image you want to create..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              className="resize-none text-sm"
              disabled={isGenerating}
            />
            <div className="flex flex-wrap gap-1.5">
              {PROMPT_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => setPrompt(s)}
                  className="text-[11px] px-2 py-1 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  disabled={isGenerating}
                >
                  {s.length > 35 ? s.substring(0, 35) + "…" : s}
                </button>
              ))}
            </div>
          </div>

          {/* Style */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Style</label>
            <div className="flex flex-wrap gap-1.5">
              {STYLE_PRESETS.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setStylePreset(style.id)}
                  disabled={isGenerating}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${
                    stylePreset === style.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted/30 text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  <span>{style.emoji}</span>
                  <span>{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Size */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground">Image Size</label>
            <Select value={imageSize} onValueChange={setImageSize}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {IMAGE_SIZES.map((size) => (
                  <SelectItem key={size.id} value={size.id}>
                    {size.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Generate */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Wand2 className="mr-2 h-4 w-4" />
                Generate Image
              </>
            )}
          </Button>

          {/* Edit Panel */}
          {activeImage && (
            <div className="space-y-2 border-t border-border pt-4">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                  <Pencil className="h-3 w-3" />
                  Edit Image
                </label>
                {uploadedImage && !generatedImage && (
                  <button onClick={() => { setUploadedImage(null); setShowEditPanel(false); }} className="text-muted-foreground hover:text-foreground">
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <Textarea
                placeholder="Describe the edit: e.g. 'make it rainy', 'add a sunset sky'..."
                value={editPrompt}
                onChange={(e) => setEditPrompt(e.target.value)}
                rows={2}
                className="resize-none text-sm"
                disabled={isEditing}
              />
              <Button
                onClick={handleEditImage}
                disabled={isEditing || !editPrompt.trim()}
                variant="secondary"
                className="w-full"
              >
                {isEditing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Editing...
                  </>
                ) : (
                  <>
                    <Pencil className="mr-2 h-4 w-4" />
                    Apply Edit
                  </>
                )}
              </Button>
            </div>
          )}
        </div>

        {/* Right Panel - Image Display */}
        <div className="flex-1 min-h-0 flex flex-col gap-3 overflow-y-auto">
          {activeImage ? (
            <Card className="tech-card border-0 overflow-hidden flex-shrink-0">
              <CardContent className="p-0">
                <div className="relative group">
                  <img
                    src={activeImage}
                    alt="Generated"
                    className="w-full h-auto rounded-lg max-h-[60vh] object-contain bg-muted/20"
                  />
                  <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleDownload(activeImage)}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm border border-dashed border-border rounded-lg min-h-[200px]">
              Generate or upload an image to get started
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div className="space-y-2 flex-shrink-0">
              <label className="text-xs font-medium text-muted-foreground">Recent</label>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {history.slice(0, 12).map((img, i) => (
                  <div
                    key={i}
                    className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square"
                    onClick={() => { setGeneratedImage(img.url); setUploadedImage(null); }}
                  >
                    <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground text-center flex-shrink-0">
        Powered by Imaginaly • AI-generated content
      </p>

      {/* Upgrade Modal */}
      <Dialog open={showUpgradeModal} onOpenChange={setShowUpgradeModal}>
        <DialogContent className="tech-card border-0 max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-primary" />
              Free Limit Reached
            </DialogTitle>
            <DialogDescription>
              You've used all {FREE_LIMIT} free image generations. Subscribe to the Community plan ($350/mo) or higher for unlimited access.
            </DialogDescription>
          </DialogHeader>
          <Button
            onClick={() => {
              setShowUpgradeModal(false);
              window.location.href = "/membership";
            }}
            className="w-full mt-2"
          >
            View Plans
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SFHImageCreator;
