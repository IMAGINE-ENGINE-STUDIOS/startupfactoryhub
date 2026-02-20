import { useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  FileText,
  Sheet as SheetIcon,
  Presentation,
  FileType,
  PenTool,
  MoreVertical,
  Search,
  Clock,
  Star,
  History,
} from "lucide-react";
import { useLightPaperProjects, LightPaperProject, ProjectType } from "@/hooks/useLightPaperProjects";
import { useProjectFavorites } from "@/hooks/useProjectFavorites";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { VersionHistoryPanel, DocumentVersion } from "./VersionHistoryPanel";
import { useAuth } from "@/contexts/AuthContext";

interface MyFilesDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenProject: (project: LightPaperProject) => void;
  onShareProject?: (project: LightPaperProject) => void;
}

const typeIcons: Record<ProjectType, any> = {
  document: FileText,
  spreadsheet: SheetIcon,
  presentation: Presentation,
};

export default function MyFilesDrawer({
  isOpen,
  onClose,
  onOpenProject,
  onShareProject,
}: MyFilesDrawerProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ProjectType | "recent" | "favorites" | "history">("recent");
  const [historyProject, setHistoryProject] = useState<LightPaperProject | null>(null);
  const [showVersionPanel, setShowVersionPanel] = useState(false);
  const { projects, loading, deleteProject } = useLightPaperProjects(
    selectedType === "recent" || selectedType === "favorites" || selectedType === "history" ? undefined : selectedType as ProjectType
  );
  const { isFavorite, toggleFavorite } = useProjectFavorites();

  let filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter by favorites if that tab is selected
  if (selectedType === "favorites") {
    filteredProjects = filteredProjects.filter(p => isFavorite(p.id));
  }

  // Sort by last_accessed_at for recent tab
  if (selectedType === "recent") {
    filteredProjects = [...filteredProjects].sort((a, b) => 
      new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime()
    );
  }

  const handleDelete = async (projectId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      await deleteProject(projectId);
    }
  };

  const handleDownload = (project: LightPaperProject) => {
    const dataStr = JSON.stringify(project.content, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${project.title}.json`;
    link.click();
    URL.revokeObjectURL(url);
    toast.success("File downloaded");
  };

  return (
    <>
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col">
        <SheetHeader>
          <SheetTitle>My Files</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-8">
              <TabsTrigger value="recent" title="Recent">
                <Clock className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="favorites" title="Favorites">
                <Star className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="document" title="Documents">
                <FileText className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="spreadsheet" title="Spreadsheets">
                <SheetIcon className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="presentation" title="Presentations">
                <Presentation className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="pdf" title="PDFs">
                <FileType className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="sign" title="Signatures">
                <PenTool className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="history" title="Version History">
                <History className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            {selectedType === "history" ? (
              <div className="mt-4 space-y-2 overflow-auto flex-1">
                <p className="text-xs text-muted-foreground px-1 pb-1">Select a file to view its version history</p>
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading files...</div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No files found</div>
                ) : (
                  projects.map((project) => {
                    const Icon = typeIcons[project.project_type];
                    const isSelected = historyProject?.id === project.id;
                    return (
                      <div
                        key={project.id}
                        className={cn(
                          "group flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer",
                          isSelected ? "border-primary bg-primary/5" : "bg-card hover:bg-accent/50"
                        )}
                        onClick={() => {
                          setHistoryProject(project);
                          setShowVersionPanel(true);
                        }}
                      >
                        <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Icon className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm truncate">{project.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            Modified {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 flex-shrink-0">
                          <History className="h-3 w-3" />
                          History
                        </Button>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <TabsContent value={selectedType} className="mt-4 space-y-2 overflow-auto flex-1">
                {loading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading files...</div>
                ) : filteredProjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No files found</div>
                ) : (
                  filteredProjects.map((project) => {
                    const Icon = typeIcons[project.project_type];
                    return (
                      <div
                        key={project.id}
                        className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                        onClick={() => { onOpenProject(project); onClose(); }}
                      >
                        <div className="flex-shrink-0">
                          <div className="w-12 h-12 rounded bg-primary/10 flex items-center justify-center">
                            <Icon className="h-6 w-6 text-primary" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium truncate">{project.title}</h4>
                          <p className="text-xs text-muted-foreground">
                            Modified {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
                          </p>
                        </div>
                        <Button variant="ghost" size="icon" className="flex-shrink-0"
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(project.id); }}>
                          <Star className={cn("h-4 w-4", isFavorite(project.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground")} />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onOpenProject(project); onClose(); }}>
                              Open
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setHistoryProject(project); setShowVersionPanel(true); }}>
                              Version History
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onShareProject?.(project); }}>
                              Share
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleDownload(project); }}>
                              Download
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.print(); }}>
                              Print
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive" onClick={(e) => { e.stopPropagation(); handleDelete(project.id); }}>
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    );
                  })
                )}
              </TabsContent>
            )}
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>

    {historyProject && (
      <VersionHistoryPanel
        isOpen={showVersionPanel}
        onClose={() => setShowVersionPanel(false)}
        projectId={historyProject.id}
        sessionId=""
        currentContent=""
        onRestoreVersion={(version: DocumentVersion) => {
          onOpenProject({ ...historyProject, content: version.content });
          setShowVersionPanel(false);
          onClose();
        }}
      />
    )}
    </>
  );
}

