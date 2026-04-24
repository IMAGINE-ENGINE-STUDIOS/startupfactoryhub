import { useEffect, useRef, useState } from "react";
import "@google/model-viewer";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Smartphone, Trash2, Box, Image as ImageIcon, Music, Video, Type } from "lucide-react";
import { useARDropComments, type ARDrop } from "@/hooks/useARDrops";
import { useAuth } from "@/contexts/AuthContext";

interface DropDetailDialogProps {
  drop: ARDrop | null;
  onClose: () => void;
  onDelete: (id: string) => void;
}

const TypeIcon = ({ type }: { type: ARDrop["content_type"] }) => {
  const map = {
    model_3d: Box,
    image: ImageIcon,
    audio: Music,
    video: Video,
    text: Type,
  } as const;
  const Icon = map[type];
  return <Icon className="w-4 h-4" />;
};

export const DropDetailDialog = ({ drop, onClose, onDelete }: DropDetailDialogProps) => {
  const { user } = useAuth();
  const { comments, postComment } = useARDropComments(drop?.id || null);
  const [message, setMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [comments]);

  if (!drop) return null;

  const isOwner = user?.id === drop.user_id;

  const renderContent = () => {
    if (drop.content_type === "text") {
      return (
        <div className="bg-muted rounded-lg p-4 text-sm">
          {drop.description || drop.title}
        </div>
      );
    }
    if (!drop.content_url) return null;

    if (drop.content_type === "model_3d") {
      return (
        <div className="bg-black rounded-lg overflow-hidden" style={{ height: 280 }}>
          <model-viewer
            src={drop.content_url}
            alt={drop.title}
            ar
            ar-modes="webxr scene-viewer quick-look"
            ar-scale="auto"
            camera-controls
            auto-rotate
            shadow-intensity="1"
            style={{ width: "100%", height: "100%", background: "#000" }}
          >
            <button
              slot="ar-button"
              className="absolute bottom-3 right-3 bg-primary text-primary-foreground px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1"
            >
              <Smartphone className="w-3 h-3" /> View in AR
            </button>
          </model-viewer>
        </div>
      );
    }
    if (drop.content_type === "image") {
      return (
        <img
          src={drop.content_url}
          alt={drop.title}
          className="w-full rounded-lg max-h-72 object-contain bg-black"
        />
      );
    }
    if (drop.content_type === "audio") {
      return <audio src={drop.content_url} controls className="w-full" />;
    }
    if (drop.content_type === "video") {
      return (
        <video
          src={drop.content_url}
          controls
          className="w-full rounded-lg max-h-72 bg-black"
        />
      );
    }
    return null;
  };

  const handleSend = async () => {
    if (!message.trim()) return;
    await postComment(message);
    setMessage("");
  };

  return (
    <Dialog open={!!drop} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TypeIcon type={drop.content_type} />
            {drop.title}
          </DialogTitle>
          <DialogDescription>
            {drop.latitude.toFixed(4)}°, {drop.longitude.toFixed(4)}°
          </DialogDescription>
        </DialogHeader>

        {renderContent()}

        {drop.description && drop.content_type !== "text" && (
          <p className="text-sm text-muted-foreground">{drop.description}</p>
        )}

        <div className="border-t pt-3">
          <div className="text-xs font-semibold mb-2 text-muted-foreground">
            Live chat ({comments.length})
          </div>
          <ScrollArea className="h-40 pr-2" ref={scrollRef as any}>
            <div className="space-y-1.5">
              {comments.length === 0 ? (
                <div className="text-xs text-muted-foreground text-center py-4">
                  Be the first to chat at this spot.
                </div>
              ) : (
                comments.map((c) => (
                  <div
                    key={c.id}
                    className={`text-xs px-2.5 py-1.5 rounded-md ${
                      c.user_id === user?.id
                        ? "bg-primary/15 ml-6"
                        : "bg-muted mr-6"
                    }`}
                  >
                    <div className="opacity-60 text-[10px] mb-0.5">
                      {new Date(c.created_at).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </div>
                    {c.message}
                  </div>
                ))
              )}
            </div>
          </ScrollArea>

          {user ? (
            <div className="flex gap-2 mt-2">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="Say something..."
              />
              <Button size="icon" onClick={handleSend}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <div className="text-xs text-muted-foreground text-center mt-2">
              Sign in to chat
            </div>
          )}
        </div>

        {isOwner && (
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              onDelete(drop.id);
              onClose();
            }}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete drop
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
};
