import { useState, useEffect, useCallback } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Clock,
  History,
  RotateCcw,
  Eye,
  ChevronRight,
  FileText,
  Zap,
  Save,
  Edit3,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatDistanceToNow, format } from "date-fns";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export interface DocumentVersion {
  id: string;
  user_id: string;
  project_id: string | null;
  session_id: string;
  content: any;
  version_number: number;
  is_temporary: boolean;
  created_at: string;
  // Extended fields stored in content.meta
  change_description?: string;
  change_type?: "autosave" | "manual" | "upload" | "restore" | "initial";
  word_count?: number;
}

interface VersionHistoryPanelProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string | null;
  sessionId: string;
  currentContent: string;
  onRestoreVersion: (version: DocumentVersion) => void;
  onPreviewVersion?: (version: DocumentVersion) => void;
}

const changeTypeConfig = {
  autosave: {
    icon: Zap,
    label: "Auto-saved",
    color: "text-blue-500",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
  manual: {
    icon: Save,
    label: "Saved",
    color: "text-green-500",
    bg: "bg-green-500/10 border-green-500/20",
  },
  upload: {
    icon: Upload,
    label: "Uploaded",
    color: "text-purple-500",
    bg: "bg-purple-500/10 border-purple-500/20",
  },
  restore: {
    icon: RotateCcw,
    label: "Restored",
    color: "text-orange-500",
    bg: "bg-orange-500/10 border-orange-500/20",
  },
  initial: {
    icon: FileText,
    label: "Created",
    color: "text-primary",
    bg: "bg-primary/10 border-primary/20",
  },
};

function groupVersionsByDay(versions: DocumentVersion[]) {
  const groups: Record<string, DocumentVersion[]> = {};
  versions.forEach((v) => {
    const day = format(new Date(v.created_at), "yyyy-MM-dd");
    if (!groups[day]) groups[day] = [];
    groups[day].push(v);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([day, items]) => ({ day, items: items.sort((a, b) => b.version_number - a.version_number) }));
}

export function VersionHistoryPanel({
  isOpen,
  onClose,
  projectId,
  sessionId,
  currentContent,
  onRestoreVersion,
  onPreviewVersion,
}: VersionHistoryPanelProps) {
  const { user } = useAuth();
  const [versions, setVersions] = useState<DocumentVersion[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null);
  const [previewingId, setPreviewingId] = useState<string | null>(null);

  const loadVersions = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      let query = supabase
        .from("document_versions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(150);

      if (projectId) {
        query = query.eq("project_id", projectId);
      } else {
        query = query.eq("session_id", sessionId);
      }

      const { data, error } = await query;
      if (error) throw error;
      setVersions((data || []) as DocumentVersion[]);
    } catch (err) {
      console.error("Error loading versions:", err);
    } finally {
      setLoading(false);
    }
  }, [user, projectId, sessionId]);

  useEffect(() => {
    if (isOpen) {
      loadVersions();
    }
  }, [isOpen, loadVersions]);

  const handleRestore = (version: DocumentVersion) => {
    setSelectedVersionId(version.id);
    onRestoreVersion(version);
    toast.success(`Restored to version ${version.version_number + 1} — ${formatDistanceToNow(new Date(version.created_at), { addSuffix: true })}`);
    onClose();
  };

  const handlePreview = (version: DocumentVersion) => {
    setPreviewingId(previewingId === version.id ? null : version.id);
    onPreviewVersion?.(version);
  };

  const grouped = groupVersionsByDay(versions);
  const totalVersions = versions.length;

  const formatDayLabel = (day: string) => {
    const date = new Date(day);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (format(date, "yyyy-MM-dd") === format(today, "yyyy-MM-dd")) return "Today";
    if (format(date, "yyyy-MM-dd") === format(yesterday, "yyyy-MM-dd")) return "Yesterday";
    return format(date, "EEEE, MMMM d");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[420px] sm:w-[480px] flex flex-col p-0">
        {/* Header */}
        <div className="p-6 pb-4 border-b bg-gradient-to-br from-primary/5 to-background">
          <SheetHeader className="text-left mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <History className="h-4 w-4 text-primary" />
              </div>
              <SheetTitle className="text-lg">Version History</SheetTitle>
            </div>
          </SheetHeader>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{totalVersions} versions saved</span>
            </div>
            <div className="h-3 w-px bg-border" />
            <div className="flex items-center gap-1">
              <Zap className="h-3 w-3 text-blue-500" />
              <span>Auto-saves every 2s</span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-2 mt-3">
            {Object.entries(changeTypeConfig).map(([type, cfg]) => {
              const Icon = cfg.icon;
              return (
                <div key={type} className={cn("flex items-center gap-1 px-2 py-0.5 rounded-full border text-xs", cfg.bg, cfg.color)}>
                  <Icon className="h-2.5 w-2.5" />
                  <span>{cfg.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Timeline */}
        <ScrollArea className="flex-1">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <div className="text-center space-y-2">
                <Clock className="h-8 w-8 mx-auto animate-spin opacity-50" />
                <p className="text-sm">Loading version history...</p>
              </div>
            </div>
          ) : versions.length === 0 ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground">
              <div className="text-center space-y-2">
                <History className="h-10 w-10 mx-auto opacity-30" />
                <p className="text-sm font-medium">No versions yet</p>
                <p className="text-xs opacity-70">Start typing — versions are saved automatically</p>
              </div>
            </div>
          ) : (
            <div className="p-4 space-y-6">
              {grouped.map(({ day, items }, groupIdx) => (
                <div key={day}>
                  {/* Day header */}
                  <div className="flex items-center gap-2 mb-3 sticky top-0 bg-background/95 backdrop-blur-sm py-1 z-10">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-semibold text-muted-foreground px-2">
                      {formatDayLabel(day)}
                    </span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  {/* Version items */}
                  <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />

                    <div className="space-y-1">
                      {items.map((version, idx) => {
                        const meta = version.content?.meta || {};
                        const changeType = (meta.change_type || "autosave") as keyof typeof changeTypeConfig;
                        const cfg = changeTypeConfig[changeType] || changeTypeConfig.autosave;
                        const Icon = cfg.icon;
                        const description = meta.change_description || `Version ${version.version_number + 1}`;
                        const wordCount = meta.word_count;
                        const isSelected = selectedVersionId === version.id;
                        const isPreviewing = previewingId === version.id;
                        const isLatest = groupIdx === 0 && idx === 0;

                        return (
                          <div key={version.id} className="relative pl-9">
                            {/* Timeline dot */}
                            <div className={cn(
                              "absolute left-[10px] top-4 w-[12px] h-[12px] rounded-full border-2 border-background z-10 flex items-center justify-center",
                              isLatest ? "bg-primary" : "bg-muted-foreground/40"
                            )}>
                              {isLatest && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
                            </div>

                            {/* Version card */}
                            <div className={cn(
                              "group rounded-lg border p-3 cursor-pointer transition-all duration-150",
                              isSelected ? "border-primary bg-primary/5" : "border-border bg-card hover:border-primary/40 hover:bg-accent/30"
                            )}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <div className={cn("flex items-center gap-1 text-xs font-medium", cfg.color)}>
                                      <Icon className="h-3 w-3" />
                                      <span>{cfg.label}</span>
                                    </div>
                                    {isLatest && (
                                      <Badge variant="secondary" className="text-[10px] h-4 px-1.5 bg-primary/10 text-primary border-0">
                                        Latest
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-xs font-medium truncate text-foreground">{description}</p>
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-muted-foreground">
                                      {format(new Date(version.created_at), "h:mm a")}
                                    </span>
                                    {wordCount !== undefined && (
                                      <>
                                        <span className="text-[10px] text-muted-foreground">·</span>
                                        <span className="text-[10px] text-muted-foreground">{wordCount} words</span>
                                      </>
                                    )}
                                    <span className="text-[10px] text-muted-foreground">·</span>
                                    <span className="text-[10px] text-muted-foreground">v{version.version_number + 1}</span>
                                  </div>
                                </div>

                                {/* Actions */}
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  {onPreviewVersion && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-6 w-6"
                                      title="Preview this version"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handlePreview(version);
                                      }}
                                    >
                                      <Eye className="h-3 w-3" />
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-primary"
                                    title="Restore this version"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleRestore(version);
                                    }}
                                  >
                                    <RotateCcw className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>

                              {/* Preview snippet */}
                              {isPreviewing && version.content?.html && (
                                <div className="mt-2 pt-2 border-t border-border">
                                  <div
                                    className="text-[10px] text-muted-foreground line-clamp-3 leading-relaxed"
                                    dangerouslySetInnerHTML={{
                                      __html: version.content.html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 200) + "..."
                                    }}
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="p-4 border-t bg-muted/30">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <AlertCircle className="h-3 w-3 flex-shrink-0" />
            <span>Restoring a version replaces current content. Unsaved changes may be lost.</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
