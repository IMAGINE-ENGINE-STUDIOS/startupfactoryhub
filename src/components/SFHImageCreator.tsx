import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useMembershipStatus } from "@/hooks/useMembershipStatus";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Download, Sparkles, Image as ImageIcon, Wand2, Crown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

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

const PROMPT_SUGGESTIONS = [
  "A futuristic city skyline at golden hour with flying vehicles",
  "A serene Japanese garden with cherry blossoms and a koi pond",
  "An astronaut exploring a bioluminescent alien forest",
  "A cozy coffee shop interior with warm lighting and plants",
  "A majestic dragon perched on a mountain peak at sunset",
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

  const [prompt, setPrompt] = useState("");
  const [stylePreset, setStylePreset] = useState("none");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [history, setHistory] = useState<GeneratedImage[]>([]);
  const [usageCount, setUsageCount] = useState<number | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Fetch usage count on mount
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
      const { data, error } = await supabase.functions.invoke("generate-sfh-image", {
        body: { prompt: prompt.trim(), stylePreset },
      });

      if (error) {
        // Check for specific error codes in the response
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

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `sfh-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  const usageLabel = isSubscribed
    ? "Unlimited"
    : usageCount !== null
      ? `${usageCount}/${FREE_LIMIT} free`
      : "...";

  return (
    <div className="space-y-6">
      {/* Usage Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <span className="text-sm font-medium text-muted-foreground">Usage</span>
        </div>
        <Badge variant={isSubscribed ? "default" : "secondary"} className="text-xs">
          {isSubscribed && <Crown className="h-3 w-3 mr-1" />}
          {usageLabel}
        </Badge>
      </div>

      {/* Prompt Input */}
      <div className="space-y-3">
        <Textarea
          placeholder="Describe the image you want to create..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={3}
          className="resize-none tech-card border-0 text-sm"
          disabled={isGenerating}
        />

        {/* Suggestions */}
        <div className="flex flex-wrap gap-1.5">
          {PROMPT_SUGGESTIONS.slice(0, 3).map((s, i) => (
            <button
              key={i}
              onClick={() => setPrompt(s)}
              className="text-xs px-2.5 py-1 rounded-full bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              disabled={isGenerating}
            >
              {s.length > 40 ? s.substring(0, 40) + "…" : s}
            </button>
          ))}
        </div>
      </div>

      {/* Style Presets */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-muted-foreground">Style</label>
        <div className="flex flex-wrap gap-2">
          {STYLE_PRESETS.map((style) => (
            <button
              key={style.id}
              onClick={() => setStylePreset(style.id)}
              disabled={isGenerating}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
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

      {/* Generate Button */}
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

      {/* Generated Image */}
      {generatedImage && (
        <Card className="tech-card border-0 overflow-hidden">
          <CardContent className="p-0">
            <div className="relative group">
              <img
                src={generatedImage}
                alt="Generated"
                className="w-full h-auto rounded-lg"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleDownload(generatedImage)}
                >
                  <Download className="h-4 w-4 mr-1" />
                  Download
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 1 && (
        <div className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground">Recent</label>
          <div className="grid grid-cols-3 gap-2">
            {history.slice(1, 7).map((img, i) => (
              <div
                key={i}
                className="relative group cursor-pointer rounded-lg overflow-hidden aspect-square"
                onClick={() => setGeneratedImage(img.url)}
              >
                <img src={img.url} alt={img.prompt} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-end p-1">
                  <span className="text-[10px] text-white opacity-0 group-hover:opacity-100 truncate">
                    {img.prompt}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer */}
      <p className="text-[10px] text-muted-foreground text-center">
        Powered by SFH Intelligence • AI-generated content
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
