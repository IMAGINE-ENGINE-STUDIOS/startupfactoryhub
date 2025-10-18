import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Table, Presentation, FileSignature } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import { LightPaperDocument } from "@/components/lightpaper/LightPaperDocument";
import { LightPaperSpreadsheet } from "@/components/lightpaper/LightPaperSpreadsheet";
import { LightPaperPresentation } from "@/components/lightpaper/LightPaperPresentation";
import { LightPaperPDFEditor } from "@/components/lightpaper/LightPaperPDFEditor";
import AIAssistant from "@/components/AIAssistant";
import { ScientificCalculator } from "@/components/ScientificCalculator";
import MyFilesDrawer from "@/components/lightpaper/MyFilesDrawer";
import ShareDialog from "@/components/lightpaper/ShareDialog";
import { LightPaperProject } from "@/hooks/useLightPaperProjects";
export default function LightPaper() {
  const [activeTab, setActiveTab] = useState("document");
  const [showAI, setShowAI] = useState(false);
  const [showCalculator, setShowCalculator] = useState(false);
  const [showFiles, setShowFiles] = useState(false);
  const [selectedProject, setSelectedProject] = useState<LightPaperProject | null>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [shareData, setShareData] = useState<{shareUrl: string, shareToken: string, documentTitle: string} | null>(null);
  return <div className="h-screen flex flex-col bg-background overflow-hidden">
      <div className="border-b bg-card flex-shrink-0">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-8 w-8 text-primary" />
                <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                  LightPaper
                </h1>
              </div>
              <span className="text-sm text-muted-foreground">
                Complete Productivity Suite
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => setShowFiles(true)} className="gap-2">
                <FolderOpen className="h-4 w-4" />
                My Files
              </Button>
              
              <div className="flex border rounded-lg p-1 bg-muted/30">
                <Button 
                  variant={activeTab === "document" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => setActiveTab("document")}
                  title="Document"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button 
                  variant={activeTab === "spreadsheet" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => setActiveTab("spreadsheet")}
                  title="Spreadsheet"
                >
                  <Table className="h-4 w-4" />
                </Button>
                <Button 
                  variant={activeTab === "presentation" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => setActiveTab("presentation")}
                  title="Presentation"
                >
                  <Presentation className="h-4 w-4" />
                </Button>
                <Button 
                  variant={activeTab === "pdf-editor" ? "secondary" : "ghost"} 
                  size="sm" 
                  className="h-8 w-8 p-0"
                  onClick={() => setActiveTab("pdf-editor")}
                  title="PDF Editor & Sign"
                >
                  <FileSignature className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsContent value="document" className="flex-1 mt-0 overflow-hidden">
            <LightPaperDocument selectedProject={selectedProject} />
          </TabsContent>

          <TabsContent value="spreadsheet" className="flex-1 mt-0 overflow-hidden">
            <LightPaperSpreadsheet />
          </TabsContent>

          <TabsContent value="presentation" className="flex-1 mt-0 overflow-auto">
            <LightPaperPresentation />
          </TabsContent>

          <TabsContent value="pdf-editor" className="flex-1 mt-0 overflow-auto">
            <LightPaperPDFEditor selectedProject={selectedProject} />
          </TabsContent>
        </Tabs>
      </div>

      <AIAssistant isOpen={showAI} onClose={() => setShowAI(false)} />
      <ScientificCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />

      <MyFilesDrawer isOpen={showFiles} onClose={() => setShowFiles(false)} onOpenProject={project => {
      setSelectedProject(project);
      setActiveTab(project.project_type);
    }} onShareProject={async (project) => {
      setSelectedProject(project);
      
      // For PDF projects, create shareable link
      if (project.project_type === 'pdf' && project.content) {
        try {
          const content = project.content as any;
          if (content.pdfUrl) {
            // Generate shareable link
            const { supabase } = await import("@/integrations/supabase/client");
            const { data } = await supabase.storage
              .from('feed-media')
              .download(content.pdfUrl);
            
            if (data) {
              const file = new File([data], project.title, { type: 'application/pdf' });
              const { useSharedPDF } = await import("@/hooks/useSharedPDF");
              const hook = useSharedPDF();
              const result = await hook.createSharedDocument(project.id, project.title, file, 'sign');
              
              if (result) {
                setShareData({
                  shareUrl: result.shareUrl,
                  shareToken: result.shareToken,
                  documentTitle: project.title,
                });
                setShowShareDialog(true);
              }
            }
          }
        } catch (error) {
          console.error('Error creating shareable link:', error);
        }
      }
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
    </div>;
}