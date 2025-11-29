import { useState } from "react";
import { User } from "@supabase/supabase-js";
import { Loader2, User as UserIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface BlogCreatePostProps {
  user: User | null;
  onSubmit: (title: string, content: string, guestName?: string) => void;
  isLoading: boolean;
  onCancel: () => void;
}

const BlogCreatePost = ({
  user,
  onSubmit,
  isLoading,
  onCancel,
}: BlogCreatePostProps) => {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [guestName, setGuestName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;
    if (!user && !guestName.trim()) return;

    onSubmit(title, content, guestName || undefined);
    setTitle("");
    setContent("");
    setGuestName("");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-card border border-border rounded-lg p-6 mb-6"
    >
      <h3 className="text-lg font-semibold text-foreground mb-4">
        Create a new post
      </h3>

      {/* Guest Name Input */}
      {!user && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-muted-foreground mb-2">
            Your Name (as a guest)
          </label>
          <div className="relative">
            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Enter your name..."
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="pl-10"
              required
            />
          </div>
        </div>
      )}

      {/* Title Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Title
        </label>
        <Input
          type="text"
          placeholder="Give your post a title..."
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {/* Content Textarea */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-muted-foreground mb-2">
          Content
        </label>
        <Textarea
          placeholder="What's on your mind?"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          required
        />
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Posting...
            </>
          ) : (
            "Post"
          )}
        </Button>
      </div>
    </form>
  );
};

export default BlogCreatePost;
