import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Table, Presentation, Command, HelpCircle, Upload, Plus, Bot, Languages, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FolderOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import AISummaryCard from "@/components/AISummaryCard";
import AITranslator from "@/components/AITranslator";
import SentimentAnalyzer from "@/components/SentimentAnalyzer";
import DocumentAnalyzer from "@/components/DocumentAnalyzer";
import TaskAutomation from "@/components/TaskAutomation";

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
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadedContent, setUploadedContent] = useState<{content: string, title: string} | null>(null);
  const [showAIFeaturesMenu, setShowAIFeaturesMenu] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [showTranslate, setShowTranslate] = useState(false);
  const [showSentiment, setShowSentiment] = useState(false);
  const [showDocAnalyzer, setShowDocAnalyzer] = useState(false);
  const [showTaskAutomation, setShowTaskAutomation] = useState(false);

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
              <Button 
                variant="outline" 
                onClick={() => setShowUploadDialog(true)} 
                className="gap-2 h-8 sm:h-9 text-xs sm:text-sm"
                title="Upload Document"
              >
                <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Upload</span>
              </Button>
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
        onFileLoaded={(content, title) => {
          setUploadedContent({ content, title });
          setActiveTab('document');
        }}
      />

      {/* Floating AI Features Menu */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-2xl"
          onClick={() => setShowAIFeaturesMenu(!showAIFeaturesMenu)}
        >
          <Plus className="h-6 w-6" />
        </Button>
        
        {showAIFeaturesMenu && (
          <div className="absolute bottom-16 right-0 tech-card border-0 rounded-lg shadow-2xl p-3 space-y-2 min-w-[200px]">
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2" 
              onClick={() => {
                setShowAI(true);
                setShowAIFeaturesMenu(false);
              }}
            >
              <Bot className="h-4 w-4" />
              Ask AI
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2" 
              onClick={() => {
                setShowSummary(true);
                setShowAIFeaturesMenu(false);
              }}
            >
              <FileText className="h-4 w-4" />
              Summarize Text
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2" 
              onClick={() => {
                setShowTranslate(true);
                setShowAIFeaturesMenu(false);
              }}
            >
              <Languages className="h-4 w-4" />
              Translate Text
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2" 
              onClick={() => {
                setShowSentiment(true);
                setShowAIFeaturesMenu(false);
              }}
            >
              <TrendingUp className="h-4 w-4" />
              Analyze Sentiment
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2" 
              onClick={() => {
                setShowDocAnalyzer(true);
                setShowAIFeaturesMenu(false);
              }}
            >
              <FileText className="h-4 w-4" />
              Document Analysis
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-2" 
              onClick={() => {
                setShowTaskAutomation(true);
                setShowAIFeaturesMenu(false);
              }}
            >
              <Command className="h-4 w-4" />
              Task Automation
            </Button>
          </div>
        )}
      </div>

      {/* AI Feature Dialogs */}
      {showSummary && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="tech-card border-0 rounded-lg shadow-xl p-6 max-w-2xl w-full">
            <AISummaryCard 
              text="Enter your text to summarize" 
              sourceType="document"
            />
            <Button 
              variant="outline" 
              onClick={() => setShowSummary(false)}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {showTranslate && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="tech-card border-0 rounded-lg shadow-xl p-6 max-w-2xl w-full">
            <AITranslator 
              text="Enter text to translate"
            />
            <Button 
              variant="outline" 
              onClick={() => setShowTranslate(false)}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {showSentiment && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="tech-card border-0 rounded-lg shadow-xl p-6 max-w-2xl w-full">
            <SentimentAnalyzer />
            <Button 
              variant="outline" 
              onClick={() => setShowSentiment(false)}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {showDocAnalyzer && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="tech-card border-0 rounded-lg shadow-xl p-6 max-w-2xl w-full">
            <DocumentAnalyzer />
            <Button 
              variant="outline" 
              onClick={() => setShowDocAnalyzer(false)}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        </div>
      )}

      {showTaskAutomation && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="tech-card border-0 rounded-lg shadow-xl p-6 max-w-2xl w-full">
            <TaskAutomation />
            <Button 
              variant="outline" 
              onClick={() => setShowTaskAutomation(false)}
              className="mt-4"
            >
              Close
            </Button>
          </div>
        </div>
      )}
    </div>;
}