import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Table, Presentation, Command, FilePenLine, HelpCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { LightPaperDocument } from "@/components/lightpaper/LightPaperDocument";
import { LightPaperSpreadsheet } from "@/components/lightpaper/LightPaperSpreadsheet";
import { LightPaperPresentation } from "@/components/lightpaper/LightPaperPresentation";
import { FabricPDFEditor } from "@/components/pdf-editor/FabricPDFEditor";

import AIAssistant from "@/components/AIAssistant";
import { ScientificCalculator } from "@/components/ScientificCalculator";
import MyFilesDrawer from "@/components/lightpaper/MyFilesDrawer";
import ShareDialog from "@/components/lightpaper/ShareDialog";
import { QuickNavigation } from "@/components/lightpaper/QuickNavigation";
import { LightPaperProject, ProjectType } from "@/hooks/useLightPaperProjects";
import { DocumentLoadingSkeleton, SpreadsheetLoadingSkeleton, PresentationLoadingSkeleton } from "@/components/lightpaper/LoadingSkeleton";

export default function LightPaper() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<ProjectType>('document');
  const [showAI, setShowAI] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [selectedProject, setSelectedProject] = useState<LightPaperProject | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareData, setShareData] = useState<{shareUrl: string, shareToken: string, documentTitle: string} | null>(null);
  const [showQuickNav, setShowQuickNav] = useState(false);
  const [isTabLoading, setIsTabLoading] = useState(false);

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
      <div className="border-b bg-card flex-shrink-0">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center justify-between sm:justify-start gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <h1 className="text-lg sm:text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  LightPaper
                </h1>
              </div>
              <span className="hidden lg:inline-block text-sm text-muted-foreground">
                Complete Productivity Suite
              </span>
            </div>
            <div className="flex items-center gap-2">
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
                <Button 
                  variant={activeTab === "pdf" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-7 w-7 sm:h-8 sm:w-8 p-0"
                  onClick={() => setActiveTab("pdf")}
                  title="PDF Editor"
                >
                  <FilePenLine className="h-3 w-3 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs 
          value={activeTab} 
          onValueChange={(value) => {
            setIsTabLoading(true);
            setActiveTab(value as ProjectType);
            // Simulate loading delay for smooth transition
            setTimeout(() => setIsTabLoading(false), 300);
          }} 
          className="h-full flex flex-col"
        >
          <TabsContent value="document" className="flex-1 mt-0 overflow-hidden">
            {isTabLoading && activeTab === "document" ? (
              <DocumentLoadingSkeleton />
            ) : (
              <LightPaperDocument selectedProject={selectedProject} />
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

          <TabsContent value="pdf" className="flex-1 mt-0 overflow-hidden">
            {activeTab === "pdf" && (
              <FabricPDFEditor />
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AIAssistant isOpen={showAI} onClose={() => setShowAI(false)} />
      <ScientificCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />

      <MyFilesDrawer isOpen={showFiles} onClose={() => setShowFiles(false)} onOpenProject={project => {
      if (project.project_type === 'pdf') return; // Skip PDF projects
      setSelectedProject(project);
      setActiveTab(project.project_type);
    }} onShareProject={async (project) => {
      // PDF sharing functionality removed
    }} />

      <ShareDialog 
        isOpen={showShareDialog} 
        onClose={() => {
          setShowShareDialog(false);
          setShareData(null);
        }}
        shareData={shareData}
        onSendEmail={async (email, message, accessLevel) => {
          if (shareData) {
            const { useSharedPDF } = await import("@/hooks/useSharedPDF");
            const hook = useSharedPDF();
            await hook.sendEmailInvitation(
              shareData.shareToken,
              shareData.documentTitle,
              email,
              'User',
              message,
              accessLevel
            );
          }
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
    </div>;
}