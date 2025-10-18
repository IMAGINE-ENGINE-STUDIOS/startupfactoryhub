import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Table, Presentation, FileSignature, FileCheck, Sparkles, Calculator, FolderOpen } from "lucide-react";
import { LightPaperDocument } from "@/components/lightpaper/LightPaperDocument";
import { LightPaperSpreadsheet } from "@/components/lightpaper/LightPaperSpreadsheet";
import { LightPaperPresentation } from "@/components/lightpaper/LightPaperPresentation";
import { LightPaperPDFEditor } from "@/components/lightpaper/LightPaperPDFEditor";
import AIAssistant from "@/components/AIAssistant";
import { ScientificCalculator } from "@/components/ScientificCalculator";
import { Button } from "@/components/ui/button";
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

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
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
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowFiles(true)}
                className="gap-2"
              >
                <FolderOpen className="h-4 w-4" />
                My Files
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowCalculator(true)}
                className="gap-2"
              >
                <Calculator className="h-4 w-4" />
                Calculator
              </Button>
              <Button
                onClick={() => setShowAI(true)}
                className="gap-2"
              >
                <Sparkles className="h-4 w-4" />
                AI Assistant
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="document" className="gap-2">
              <FileText className="h-4 w-4" />
              Document
            </TabsTrigger>
            <TabsTrigger value="spreadsheet" className="gap-2">
              <Table className="h-4 w-4" />
              Spreadsheet
            </TabsTrigger>
            <TabsTrigger value="presentation" className="gap-2">
              <Presentation className="h-4 w-4" />
              Presentation
            </TabsTrigger>
            <TabsTrigger value="pdf-editor" className="gap-2">
              <FileSignature className="h-4 w-4" />
              PDF Editor & Sign
            </TabsTrigger>
          </TabsList>

          <TabsContent value="document" className="mt-0">
            <LightPaperDocument selectedProject={selectedProject} />
          </TabsContent>

          <TabsContent value="spreadsheet" className="mt-0">
            <LightPaperSpreadsheet />
          </TabsContent>

          <TabsContent value="presentation" className="mt-0">
            <LightPaperPresentation />
          </TabsContent>

          <TabsContent value="pdf-editor" className="mt-0">
            <LightPaperPDFEditor selectedProject={selectedProject} />
          </TabsContent>
        </Tabs>
      </div>

      <AIAssistant isOpen={showAI} onClose={() => setShowAI(false)} />
      <ScientificCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} />

      <MyFilesDrawer
        isOpen={showFiles}
        onClose={() => setShowFiles(false)}
        onOpenProject={(project) => {
          setSelectedProject(project);
          setActiveTab(project.project_type);
        }}
        onShareProject={(project) => {
          setSelectedProject(project);
          setShowShareDialog(true);
        }}
      />

      <ShareDialog
        isOpen={showShareDialog}
        onClose={() => setShowShareDialog(false)}
        project={selectedProject}
      />
    </div>
  );
}
