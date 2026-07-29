import { useNavigate } from "react-router-dom";
import { Bookmark, MapPin, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useResources, useUserBookmarks, useRemoveBookmark } from "@/hooks/useResources";

interface SavedResourcesListProps {
  /** Called after navigating away (e.g. to close the parent dialog). */
  onNavigate?: () => void;
}

export function SavedResourcesList({ onNavigate }: SavedResourcesListProps) {
  const navigate = useNavigate();
  const { data: bookmarkedIds = [], isLoading } = useUserBookmarks();
  const { data: resources = [] } = useResources();
  const removeBookmark = useRemoveBookmark();

  const saved = resources.filter((r) => bookmarkedIds.includes(r.id));

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading saved resources…</p>;
  }

  if (saved.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No saved resources yet. Bookmark resources on the map to find them here.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {saved.map((resource) => (
        <div
          key={resource.id}
          className="flex items-start justify-between gap-3 rounded-xl border border-border/50 bg-background/40 p-3"
        >
          <button
            type="button"
            className="flex-1 text-left"
            onClick={() => {
              navigate(`/resources?id=${resource.id}`);
              onNavigate?.();
            }}
          >
            <p className="text-sm font-medium leading-tight">{resource.title}</p>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {resource.type}
              </Badge>
              {(resource.city || resource.country) && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {[resource.city, resource.country].filter(Boolean).join(", ")}
                </span>
              )}
            </div>
          </button>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7 shrink-0"
            aria-label={`Remove ${resource.title} from saved resources`}
            onClick={() => removeBookmark.mutate(resource.id)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  );
}

export const SavedResourcesIcon = Bookmark;
