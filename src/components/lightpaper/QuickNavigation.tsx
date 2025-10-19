import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Search, FileText, Table, Presentation, FileSignature, 
  Clock, Star, Loader2 
} from "lucide-react";
import { useProjectSearch, SearchResult } from "@/hooks/useProjectSearch";
import { useLightPaperProjects, LightPaperProject } from "@/hooks/useLightPaperProjects";
import { useProjectFavorites } from "@/hooks/useProjectFavorites";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface QuickNavigationProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectProject: (project: LightPaperProject) => void;
}

const PROJECT_ICONS = {
  document: FileText,
  spreadsheet: Table,
  presentation: Presentation,
  pdf: FileSignature,
  sign: FileSignature,
};

export function QuickNavigation({ isOpen, onClose, onSelectProject }: QuickNavigationProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<"search" | "recent" | "favorites">("search");
  
  const { results, loading: searchLoading, search } = useProjectSearch();
  const { projects, loading: projectsLoading } = useLightPaperProjects();
  const { isFavorite, toggleFavorite } = useProjectFavorites();

  // Recent projects (sorted by last_accessed_at)
  const recentProjects = [...projects]
    .sort((a, b) => new Date(b.last_accessed_at).getTime() - new Date(a.last_accessed_at).getTime())
    .slice(0, 10);

  // Favorite projects
  const favoriteProjects = projects.filter(p => isFavorite(p.id));

  // Debounced search
  useEffect(() => {
    if (activeTab === "search" && searchQuery.trim()) {
      const timer = setTimeout(() => {
        search(searchQuery);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [searchQuery, activeTab, search]);

  const handleSelectProject = (project: LightPaperProject | SearchResult) => {
    onSelectProject(project as LightPaperProject);
    onClose();
  };

  const ProjectItem = ({ project, showRank = false }: { project: LightPaperProject | SearchResult; showRank?: boolean }) => {
    const Icon = PROJECT_ICONS[project.project_type as keyof typeof PROJECT_ICONS] || FileText;
    const rank = 'rank' in project ? project.rank : null;

    return (
      <button
        onClick={() => handleSelectProject(project)}
        className="w-full p-3 rounded-lg hover:bg-muted/50 transition-colors text-left group"
      >
        <div className="flex items-start gap-3">
          <div className="mt-1">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="font-medium truncate group-hover:text-primary transition-colors">
                {project.title}
              </h4>
              {showRank && rank && (
                <Badge variant="secondary" className="text-xs">
                  {Math.round(rank * 100)}% match
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline" className="text-xs capitalize">
                {project.project_type}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(project.updated_at), { addSuffix: true })}
              </span>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              toggleFavorite(project.id);
            }}
          >
            <Star className={cn(
              "h-4 w-4",
              isFavorite(project.id) ? "fill-yellow-400 text-yellow-400" : "text-muted-foreground"
            )} />
          </Button>
        </div>
      </button>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Quick Navigation</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 flex flex-col min-h-0">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setActiveTab("search");
              }}
              className="pl-9"
              autoFocus
            />
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-b">
            <Button
              variant={activeTab === "search" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("search")}
              className="gap-2"
            >
              <Search className="h-4 w-4" />
              Search
            </Button>
            <Button
              variant={activeTab === "recent" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("recent")}
              className="gap-2"
            >
              <Clock className="h-4 w-4" />
              Recent
            </Button>
            <Button
              variant={activeTab === "favorites" ? "default" : "ghost"}
              size="sm"
              onClick={() => setActiveTab("favorites")}
              className="gap-2"
            >
              <Star className="h-4 w-4" />
              Favorites ({favoriteProjects.length})
            </Button>
          </div>

          {/* Results */}
          <ScrollArea className="flex-1 -mx-6 px-6">
            {activeTab === "search" && (
              <div className="space-y-2">
                {searchLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : searchQuery.trim() === "" ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>Start typing to search your projects</p>
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No projects found</p>
                    <p className="text-sm">Try different keywords</p>
                  </div>
                ) : (
                  results.map(result => (
                    <ProjectItem key={result.id} project={result} showRank />
                  ))
                )}
              </div>
            )}

            {activeTab === "recent" && (
              <div className="space-y-2">
                {projectsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : recentProjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No recent projects</p>
                  </div>
                ) : (
                  recentProjects.map(project => (
                    <ProjectItem key={project.id} project={project} />
                  ))
                )}
              </div>
            )}

            {activeTab === "favorites" && (
              <div className="space-y-2">
                {projectsLoading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : favoriteProjects.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Star className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p>No favorite projects</p>
                    <p className="text-sm">Star projects to add them here</p>
                  </div>
                ) : (
                  favoriteProjects.map(project => (
                    <ProjectItem key={project.id} project={project} />
                  ))
                )}
              </div>
            )}
          </ScrollArea>
        </div>

        <div className="text-xs text-muted-foreground text-center pt-2 border-t">
          Press <kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl+K</kbd> to open quick navigation
        </div>
      </DialogContent>
    </Dialog>
  );
}
