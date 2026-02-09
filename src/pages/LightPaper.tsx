import { useState, useEffect, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Table, Presentation, Command, HelpCircle, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MessageCenterButton } from "@/components/lightpaper/MessageCenter";
import { useNavigate } from "react-router-dom";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LightPaperDocument } from "@/components/lightpaper/LightPaperDocument";
import { LightPaperSpreadsheet } from "@/components/lightpaper/LightPaperSpreadsheet";
import { LightPaperPresentation } from "@/components/lightpaper/LightPaperPresentation";
import AIAssistant from "@/components/AIAssistant";
import { ScientificCalculator } from "@/components/ScientificCalculator";
import MyFilesDrawer from "@/components/lightpaper/MyFilesDrawer";
import ShareDialog from "@/components/lightpaper/ShareDialog";
import { QuickNavigation } from "@/components/lightpaper/QuickNavigation";
import { FileUploadDialog } from "@/components/lightpaper/FileUploadDialog";
import { LightPaperProject, ProjectType } from "@/hooks/useLightPaperProjects";
import { DocumentLoadingSkeleton, SpreadsheetLoadingSkeleton, PresentationLoadingSkeleton } from "@/components/lightpaper/LoadingSkeleton";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export default function LightPaper() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<ProjectType>('document');
  const [showAI, setShowAI] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [selectedProject, setSelectedProject] = useState<LightPaperProject | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareData, setShareData] = useState<{shareUrl: string, shareToken: string, documentTitle: string} | null>(null);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const [isTabLoading, setIsTabLoading] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadedContent, setUploadedContent] = useState<{content: string, title: string, metadata?: { detectedFormat?: string; fileType?: string }} | null>(null);
  const hasRestoredRef = useRef(false);

  // Auto-load last accessed project ONCE on mount for logged-in users
  useEffect(() => {
    if (hasRestoredRef.current || !user || selectedProject || uploadedContent) return;
    hasRestoredRef.current = true;

    const restoreLastProject = async () => {
      try {
        const { data } = await supabase
          .from("lightpaper_projects")
          .select("*")
          .in('project_type', ['document', 'spreadsheet', 'presentation'])
          .order("updated_at", { ascending: false })
          .limit(1)
          .single();

        if (data) {
          setSelectedProject(data as LightPaperProject);
          setActiveTab((data as LightPaperProject).project_type);
        }
      } catch {
        // No projects or not logged in — that's fine
      }
    };
    restoreLastProject();
  }, [user]);

  // Keyboard shortcut for quick navigation (Ctrl+K or Cmd+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setShowQuickNav(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  return <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="border-b tech-card border-0 flex-shrink-0">
        <div className="container mx-auto px-3 sm:px-4 py-1.5 sm:py-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                <h1 className="text-base sm:text-xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  LightPaper Workspace
                </h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <MessageCenterButton />
              <Button
                variant="outline" 
                onClick={() => navigate("/guidelines")} 
                className="gap-2 h-8 sm:h-9 text-xs sm:text-sm"
                title="User Guidelines & Help"
              >
                <HelpCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Help</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowQuickNav(true)} 
                className="gap-2 h-8 sm:h-9 text-xs sm:text-sm"
                title="Quick Navigation (Ctrl+K)"
              >
                <Command className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Quick Nav</span>
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowFiles(true)} 
                className="gap-2 h-8 sm:h-9 text-xs sm:text-sm"
              >
                <FolderOpen className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">My Files</span>
              </Button>
              
              <div className="flex border rounded-lg p-0.5 sm:p-1 bg-muted/30">
                <Button 
                  variant={activeTab === "document" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  onClick={() => setActiveTab("document")}
                  title="Document"
                >
                  <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button 
                  variant={activeTab === "spreadsheet" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  onClick={() => setActiveTab("spreadsheet")}
                  title="Spreadsheet"
                >
                  <Table className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
                <Button 
                  variant={activeTab === "presentation" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  onClick={() => setActiveTab("presentation")}
                  title="Presentation"
                >
                  <Presentation className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex">
        <div className="flex-1 overflow-auto transition-all duration-300">
          <Tabs 
            value={activeTab} 
            onValueChange={(value) => {
              setIsTabLoading(true);
              setActiveTab(value as ProjectType);
              setTimeout(() => setIsTabLoading(false), 300);
            }} 
            className="h-full flex flex-col"
          >
            <TabsContent value="document" className="flex-1 mt-0 overflow-hidden">
              {isTabLoading && activeTab === "document" ? (
                <DocumentLoadingSkeleton />
              ) : (
                <LightPaperDocument 
                  selectedProject={selectedProject} 
                  uploadedContent={uploadedContent}
                  onContentLoaded={() => setUploadedContent(null)}
                />
              )}
            </TabsContent>

            <TabsContent value="spreadsheet" className="flex-1 mt-0 overflow-hidden">
              {isTabLoading && activeTab === "spreadsheet" ? (
                <SpreadsheetLoadingSkeleton />
              ) : (
                <LightPaperSpreadsheet />
              )}
            </TabsContent>

            <TabsContent value="presentation" className="flex-1 mt-0 overflow-auto">
              {isTabLoading && activeTab === "presentation" ? (
                <PresentationLoadingSkeleton />
              ) : (
                <LightPaperPresentation />
              )}
            </TabsContent>
          </Tabs>
        </div>

      </div>

      <AIAssistant isOpen={showAI} onClose={() => setShowAI(false)} />
      <ScientificCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />

      <MyFilesDrawer isOpen={showFiles} onClose={() => setShowFiles(false)} onOpenProject={project => {
      setSelectedProject(project);
      setActiveTab(project.project_type);
    }} onShareProject={async (project) => {
      // Sharing functionality
    }} />

      <ShareDialog 
        isOpen={showShareDialog} 
        onClose={() => {
          setShowShareDialog(false);
          setShareData(null);
        }}
        shareData={shareData}
        onSendEmail={async (email, message, accessLevel) => {
          // Email functionality
        }}
      />

      <QuickNavigation
        isOpen={showQuickNav}
        onClose={() => setShowQuickNav(false)}
        onSelectProject={(project) => {
          setSelectedProject(project);
          setActiveTab(project.project_type);
        }}
      />

      <FileUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onFileLoaded={(content, title, metadata) => {
          setUploadedContent({ content, title, metadata });
          setActiveTab('document');
        }}
      />

    </div>;
}