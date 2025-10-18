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
} from "lucide-react";
import { useLightPaperProjects, LightPaperProject, ProjectType } from "@/hooks/useLightPaperProjects";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

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
  pdf: FileType,
  sign: PenTool,
};

export default function MyFilesDrawer({
  isOpen,
  onClose,
  onOpenProject,
  onShareProject,
}: MyFilesDrawerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<ProjectType | "recent">("recent");
  const { projects, loading, deleteProject } = useLightPaperProjects(
    selectedType === "recent" ? undefined : selectedType
  );

  const filteredProjects = projects.filter((project) =>
    project.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>My Files</SheetTitle>
        </SheetHeader>

        <div className="mt-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search files..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Tabs value={selectedType} onValueChange={(v) => setSelectedType(v as any)}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="recent">
                <Clock className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="document">
                <FileText className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="spreadsheet">
                <SheetIcon className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="presentation">
                <Presentation className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="pdf">
                <FileType className="h-4 w-4" />
              </TabsTrigger>
              <TabsTrigger value="sign">
                <PenTool className="h-4 w-4" />
              </TabsTrigger>
            </TabsList>

            <TabsContent value={selectedType} className="mt-4 space-y-2">
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading files...
                </div>
              ) : filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No files found
                </div>
              ) : (
                filteredProjects.map((project) => {
                  const Icon = typeIcons[project.project_type];
                  return (
                    <div
                      key={project.id}
                      className="group flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => {
                        onOpenProject(project);
                        onClose();
                      }}
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

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="opacity-0 group-hover:opacity-100"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onOpenProject(project);
                            onClose();
                          }}>
                            Open
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onShareProject?.(project);
                          }}>
                            Share
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(project);
                          }}>
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            window.print();
                          }}>
                            Print
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(project.id);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  );
                })
              )}
            </TabsContent>
          </Tabs>
        </div>
      </SheetContent>
    </Sheet>
  );
}
