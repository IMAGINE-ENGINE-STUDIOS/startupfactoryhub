import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { BookOpen, FileText, Table, Presentation, Lightbulb, Search, Keyboard, Sparkles, BarChart3, Languages, FileSearch, Workflow, Users, Calendar, Briefcase, GraduationCap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Guidelines() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const KeyboardShortcut = ({ keys }: { keys: string[] }) => (
    <div className="inline-flex gap-1 flex-wrap">
      {keys.map((key, i) => (
        <Badge key={i} variant="secondary" className="font-mono text-[10px] sm:text-xs px-1.5 sm:px-2 py-0.5">
          {key}
        </Badge>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <BookOpen className="h-6 w-6 sm:h-8 sm:w-8 text-primary flex-shrink-0" />
              <div>
                <h1 className="font-futuristic text-lg sm:text-xl font-bold tracking-wide">USER GUIDELINES</h1>
                <p className="text-xs sm:text-sm text-muted-foreground">Complete platform documentation</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)} className="self-end sm:self-auto text-sm">
              Back to Dashboard
            </Button>
          </div>
          
          {/* Search */}
          <div className="mt-3 sm:mt-4 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guidelines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <Tabs defaultValue="lightpaper" className="w-full">
          <TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1">
            <TabsTrigger value="lightpaper" className="gap-2 text-xs sm:text-sm">
              <FileText className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">LightPaper Workspace</span>
              <span className="xs:hidden">LightPaper</span>
            </TabsTrigger>
            <TabsTrigger value="ai-tools" className="gap-2 text-xs sm:text-sm">
              <Sparkles className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">AI Tools Guide</span>
              <span className="xs:hidden">AI Tools</span>
            </TabsTrigger>
            <TabsTrigger value="platform" className="gap-2 text-xs sm:text-sm">
              <Users className="h-3 w-3 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Platform Features</span>
              <span className="xs:hidden">Platform</span>
            </TabsTrigger>
          </TabsList>

          {/* LightPaper Workspace Tab */}
          <TabsContent value="lightpaper" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Getting Started */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  Getting Started with LightPaper
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Access the professional workspace for documents, spreadsheets, and presentations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">How to Access</h4>
                  <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li>Navigate to your dashboard</li>
                    <li>Look for the <strong>LightPaper</strong> section</li>
                    <li>Choose between Document, Spreadsheet, or Presentation tabs</li>
                    <li>Start creating or load an existing project</li>
                  </ol>
                </div>
                <Alert>
                  <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <AlertDescription className="text-xs sm:text-sm">
                    All your work is auto-saved! Projects are stored securely and can be accessed anytime from "My Files".
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Document Editor */}
            <Card className="border-primary/50">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
                  <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  Document Editor
                  <Badge variant="default" className="text-xs">Featured</Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Professional document creation and editing with rich formatting</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                {/* Text Formatting */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">Text Formatting</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                      <span className="font-medium">Bold</span>
                      <KeyboardShortcut keys={["Ctrl", "B"]} />
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                      <span className="font-medium">Italic</span>
                      <KeyboardShortcut keys={["Ctrl", "I"]} />
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                      <span className="font-medium">Underline</span>
                      <KeyboardShortcut keys={["Ctrl", "U"]} />
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                      <span className="font-medium">Strikethrough</span>
                      <span className="text-xs text-muted-foreground">Toolbar button</span>
                    </div>
                  </div>
                </div>

                {/* Font & Styling */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">Font & Styling Options</h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>9 Professional Fonts:</strong> Arial, Times New Roman, Courier New, Georgia, Verdana, Comic Sans MS, Impact, Lucida Console, Palatino Linotype</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Font Sizes:</strong> 8pt to 72pt for all text elements</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Dark/Light Mode:</strong> Toggle between themes for comfortable editing</span>
                    </li>
                  </ul>
                </div>

                {/* Page Formats */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">Page Format Options</h4>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-1 sm:gap-2 text-xs">
                    <div className="p-1.5 sm:p-2 border rounded text-center">A4</div>
                    <div className="p-1.5 sm:p-2 border rounded text-center">Letter</div>
                    <div className="p-1.5 sm:p-2 border rounded text-center">Legal</div>
                    <div className="p-1.5 sm:p-2 border rounded text-center">A3</div>
                    <div className="p-1.5 sm:p-2 border rounded text-center">A5</div>
                    <div className="p-1.5 sm:p-2 border rounded text-center">B4</div>
                    <div className="p-1.5 sm:p-2 border rounded text-center">B5</div>
                    <div className="p-1.5 sm:p-2 border rounded text-center">Executive</div>
                    <div className="p-1.5 sm:p-2 border rounded text-center">Folio</div>
                    <div className="p-1.5 sm:p-2 border rounded text-center">Tabloid</div>
                  </div>
                </div>

                {/* Digital Signatures */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">Digital Signatures</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 border rounded-lg space-y-2">
                      <div className="font-medium text-primary text-sm">Draw Signature</div>
                      <p className="text-xs text-muted-foreground">
                        Use your mouse or touch screen to draw your signature naturally
                      </p>
                    </div>
                    <div className="p-3 sm:p-4 border rounded-lg space-y-2">
                      <div className="font-medium text-primary text-sm">Type Signature</div>
                      <p className="text-xs text-muted-foreground">
                        Type your name and choose from elegant font styles
                      </p>
                    </div>
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm sm:text-base">
                    <Keyboard className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                    Essential Shortcuts
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Save Document</span>
                      <KeyboardShortcut keys={["Ctrl", "S"]} />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Undo</span>
                      <KeyboardShortcut keys={["Ctrl", "Z"]} />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Redo</span>
                      <KeyboardShortcut keys={["Ctrl", "Y"]} />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>View Shortcuts</span>
                      <KeyboardShortcut keys={["Ctrl", "/"]} />
                    </div>
                  </div>
                </div>

                {/* Save & Export */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">Save & Export</h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Auto-Save:</strong> Your work is saved automatically as you type</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Save Project:</strong> Press Ctrl+S or click Save to store your document</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Load Projects:</strong> Access saved documents from "My Files" drawer</span>
                    </li>
                  </ul>
                </div>

                <Alert>
                  <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <AlertDescription className="text-xs sm:text-sm">
                    <strong>Pro Tip:</strong> Use Ctrl+/ to view all available keyboard shortcuts while working!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Spreadsheet */}
            <Card className="border-primary/50">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
                  <Table className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  Spreadsheet
                  <Badge variant="default" className="text-xs">Featured</Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Powerful Excel-like spreadsheet with formulas and data analysis</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                {/* Basic Operations */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">Getting Started</h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Navigation:</strong> Click any cell to select it, use arrow keys to move</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Editing:</strong> Double-click a cell or press Enter to start editing</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Infinite Scrolling:</strong> Add more rows and columns as needed</span>
                    </li>
                  </ul>
                </div>

                {/* Cell Formatting */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">Cell Formatting</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                    <div className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                      <span className="font-medium">Bold Text</span>
                      <KeyboardShortcut keys={["Ctrl", "B"]} />
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                      <span className="font-medium">Italic Text</span>
                      <KeyboardShortcut keys={["Ctrl", "I"]} />
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                      <span className="font-medium">Underline</span>
                      <KeyboardShortcut keys={["Ctrl", "U"]} />
                    </div>
                    <div className="flex items-center justify-between p-2 sm:p-3 border rounded-lg">
                      <span className="font-medium">Alignment</span>
                      <span className="text-xs text-muted-foreground">Left/Center/Right</span>
                    </div>
                  </div>
                </div>

                {/* Formulas */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">Available Formulas</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    <div className="p-2 sm:p-3 border rounded-lg space-y-1">
                      <div className="font-mono text-xs sm:text-sm font-medium text-primary break-all">=SUM(A1:A10)</div>
                      <p className="text-xs text-muted-foreground">Calculate the sum of a range</p>
                    </div>
                    <div className="p-2 sm:p-3 border rounded-lg space-y-1">
                      <div className="font-mono text-xs sm:text-sm font-medium text-primary break-all">=AVG(B1:B5)</div>
                      <p className="text-xs text-muted-foreground">Calculate the average value</p>
                    </div>
                    <div className="p-2 sm:p-3 border rounded-lg space-y-1">
                      <div className="font-mono text-xs sm:text-sm font-medium text-primary break-all">=COUNT(C1:C20)</div>
                      <p className="text-xs text-muted-foreground">Count non-empty cells</p>
                    </div>
                    <div className="p-2 sm:p-3 border rounded-lg space-y-1">
                      <div className="font-mono text-xs sm:text-sm font-medium text-primary break-all">=MAX(D1:D10)</div>
                      <p className="text-xs text-muted-foreground">Find the maximum value</p>
                    </div>
                    <div className="p-2 sm:p-3 border rounded-lg space-y-1">
                      <div className="font-mono text-xs sm:text-sm font-medium text-primary break-all">=MIN(E1:E10)</div>
                      <p className="text-xs text-muted-foreground">Find the minimum value</p>
                    </div>
                    <div className="p-2 sm:p-3 border rounded-lg space-y-1">
                      <div className="font-mono text-xs sm:text-sm font-medium text-primary break-all">=A1*B1</div>
                      <p className="text-xs text-muted-foreground">Basic arithmetic operations</p>
                    </div>
                  </div>
                </div>

                {/* Formula Builder */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">Formula Builder Tool</h4>
                  <p className="text-xs sm:text-sm text-muted-foreground mb-3">
                    Use the built-in Formula Builder to create complex formulas without memorizing syntax:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li>Select a cell where you want the formula result</li>
                    <li>Click the "Formula" button in the toolbar</li>
                    <li>Choose your function (SUM, AVG, COUNT, etc.)</li>
                    <li>Select the cell range using the interactive picker</li>
                    <li>Click "Insert" to apply the formula</li>
                  </ol>
                </div>

                {/* Import/Export */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">Import & Export</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div className="p-3 sm:p-4 border rounded-lg space-y-2">
                      <div className="font-medium text-primary text-sm">Import Excel Files</div>
                      <p className="text-xs text-muted-foreground">
                        Upload .xlsx files to continue working on existing spreadsheets
                      </p>
                    </div>
                    <div className="p-3 sm:p-4 border rounded-lg space-y-2">
                      <div className="font-medium text-primary text-sm">Export to Excel</div>
                      <p className="text-xs text-muted-foreground">
                        Download your work as .xlsx files compatible with Excel and Google Sheets
                      </p>
                    </div>
                  </div>
                </div>

                {/* Advanced Features */}
                <div>
                  <h4 className="font-semibold mb-3 text-sm sm:text-base">Advanced Features</h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Scientific Calculator:</strong> Built-in calculator for complex calculations</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Auto-Save:</strong> Your spreadsheet is saved automatically</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Undo/Redo:</strong> Full history of changes with unlimited undo</span>
                    </li>
                  </ul>
                </div>

                <Alert>
                  <Lightbulb className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                  <AlertDescription className="text-xs sm:text-sm">
                    <strong>Pro Tip:</strong> Start formulas with "=" and use the Formula Builder for help with syntax!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Presentation */}
            <Card className="border-primary/50">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg flex-wrap">
                  <Presentation className="h-4 w-4 sm:h-5 sm:w-5 text-primary flex-shrink-0" />
                  Presentation
                  <Badge variant="default" className="text-xs">Featured</Badge>
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Create stunning presentations with professional layouts and animations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 p-4 sm:p-6">
                {/* Getting Started */}
                <div>
                  <h4 className="font-semibold mb-3">Creating Slides</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Add Slide:</strong> Click the "+" button to create a new slide</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Delete Slide:</strong> Select a slide and click the trash icon</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Duplicate:</strong> Press Ctrl+D to duplicate the current slide</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Navigation:</strong> Use arrow keys or thumbnail strip to move between slides</span>
                    </li>
                  </ul>
                </div>

                {/* Slide Layouts */}
                <div>
                  <h4 className="font-semibold mb-3">Slide Layout Options</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg space-y-1">
                      <div className="font-medium text-primary">Title Layout</div>
                      <p className="text-xs text-muted-foreground">Large centered title for section covers</p>
                    </div>
                    <div className="p-3 border rounded-lg space-y-1">
                      <div className="font-medium text-primary">Content Layout</div>
                      <p className="text-xs text-muted-foreground">Title with content area for text and bullet points</p>
                    </div>
                    <div className="p-3 border rounded-lg space-y-1">
                      <div className="font-medium text-primary">Two-Column Layout</div>
                      <p className="text-xs text-muted-foreground">Split content into two columns for comparisons</p>
                    </div>
                    <div className="p-3 border rounded-lg space-y-1">
                      <div className="font-medium text-primary">Image Layout</div>
                      <p className="text-xs text-muted-foreground">Full-screen image with title overlay</p>
                    </div>
                  </div>
                </div>

                {/* Styling */}
                <div>
                  <h4 className="font-semibold mb-3">Slide Styling</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Background Colors:</strong> Choose from a palette of professional colors</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Text Colors:</strong> Customize text color for readability and branding</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Images:</strong> Upload images (max 5MB, PNG/JPG/WEBP)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Image Positioning:</strong> Drag and resize images to fit your design</span>
                    </li>
                  </ul>
                </div>

                {/* Animations & Transitions */}
                <div>
                  <h4 className="font-semibold mb-3">Animations & Transitions</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Slide Transitions</div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">None</Badge>
                        <Badge variant="outline">Fade</Badge>
                        <Badge variant="outline">Slide</Badge>
                        <Badge variant="outline">Zoom</Badge>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium text-sm">Content Animations</div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <Badge variant="outline">None</Badge>
                        <Badge variant="outline">Fade In</Badge>
                        <Badge variant="outline">Slide In</Badge>
                        <Badge variant="outline">Zoom In</Badge>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Presentation Mode */}
                <div>
                  <h4 className="font-semibold mb-3">Presentation Mode</h4>
                  <div className="space-y-3">
                    <div className="p-4 border rounded-lg bg-muted/30">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">Start Presenting</span>
                        <KeyboardShortcut keys={["F5"]} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Enter full-screen presentation mode to present your slides
                      </p>
                    </div>
                    <div className="grid md:grid-cols-3 gap-2 text-sm">
                      <div className="p-2 border rounded">
                        <div className="font-medium mb-1">Next Slide</div>
                        <KeyboardShortcut keys={["→"]} />
                      </div>
                      <div className="p-2 border rounded">
                        <div className="font-medium mb-1">Previous Slide</div>
                        <KeyboardShortcut keys={["←"]} />
                      </div>
                      <div className="p-2 border rounded">
                        <div className="font-medium mb-1">Exit</div>
                        <KeyboardShortcut keys={["Esc"]} />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Keyboard Shortcuts */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Keyboard className="h-4 w-4" />
                    Essential Shortcuts
                  </h4>
                  <div className="grid md:grid-cols-2 gap-2 text-sm">
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Save Presentation</span>
                      <KeyboardShortcut keys={["Ctrl", "S"]} />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Duplicate Slide</span>
                      <KeyboardShortcut keys={["Ctrl", "D"]} />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>Delete Slide</span>
                      <KeyboardShortcut keys={["Delete"]} />
                    </div>
                    <div className="flex items-center justify-between p-2 border rounded">
                      <span>View Shortcuts</span>
                      <KeyboardShortcut keys={["?"]} />
                    </div>
                  </div>
                </div>

                {/* Export */}
                <div>
                  <h4 className="font-semibold mb-3">Export Options</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    Export your presentations in various formats:
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Save Project:</strong> Store your presentation in the platform</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Export:</strong> Download as a shareable file</span>
                    </li>
                  </ul>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro Tip:</strong> Press F5 to start presenting, use arrow keys to navigate, and Esc to exit!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="ai-tools" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Introduction */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  AI-Powered Tools
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Leverage artificial intelligence to enhance your productivity</CardDescription>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Our platform includes powerful AI tools to help you summarize content, analyze sentiment, 
                  translate text, understand documents, and automate tasks. All tools are accessible from the 
                  AI Features Hub in your dashboard.
                </p>
              </CardContent>
            </Card>

            {/* Smart Summaries */}
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Smart Summaries
                  <Badge variant="default">Featured</Badge>
                </CardTitle>
                <CardDescription>Generate concise summaries of long texts instantly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How to Use</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Navigate to AI Features Hub from your dashboard</li>
                    <li>Click on "Smart Summaries" tool</li>
                    <li>Paste or type the text you want to summarize</li>
                    <li>Click "Generate AI Summary"</li>
                    <li>Review the summary and key takeaways</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Best For</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Summarizing long articles, reports, or research papers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Extracting key points from meeting notes</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Creating executive summaries for business documents</span>
                    </li>
                  </ul>
                </div>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    The AI automatically identifies and highlights the most important points from your text.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Sentiment Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Sentiment Analysis
                </CardTitle>
                <CardDescription>Understand the emotional tone of any text</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How It Works</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Our AI analyzes text to determine whether the sentiment is positive, negative, or neutral, 
                    along with a confidence score.
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Open the Sentiment Analysis tool from AI Features Hub</li>
                    <li>Enter the text you want to analyze</li>
                    <li>Click "Analyze Sentiment"</li>
                    <li>Review the sentiment label and confidence score</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Use Cases</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Analyzing customer feedback and reviews</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Understanding social media sentiment</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Monitoring brand perception</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Evaluating employee feedback</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* AI Translator */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Languages className="h-5 w-5" />
                  AI Translator
                </CardTitle>
                <CardDescription>Translate text into multiple languages instantly</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Supported Languages</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                    <Badge variant="outline">Spanish</Badge>
                    <Badge variant="outline">French</Badge>
                    <Badge variant="outline">German</Badge>
                    <Badge variant="outline">Italian</Badge>
                    <Badge variant="outline">Portuguese</Badge>
                    <Badge variant="outline">Russian</Badge>
                    <Badge variant="outline">Chinese</Badge>
                    <Badge variant="outline">Japanese</Badge>
                    <Badge variant="outline">Korean</Badge>
                    <Badge variant="outline">Arabic</Badge>
                    <Badge variant="outline">Hindi</Badge>
                    <Badge variant="outline">Dutch</Badge>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">How to Translate</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Access the AI Translator from AI Features Hub</li>
                    <li>Paste or type the text to translate</li>
                    <li>Select the target language from the dropdown</li>
                    <li>Click "Translate"</li>
                    <li>Copy or use the translated text</li>
                  </ol>
                </div>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    Translations are cached for faster access when you need them again!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Document Analysis */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSearch className="h-5 w-5" />
                  Document Analysis
                </CardTitle>
                <CardDescription>Extract insights from images and documents using AI vision</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">What It Can Do</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Extract text from images (OCR)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Analyze document structure and content</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Identify objects and elements in images</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Generate descriptions of visual content</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">How to Use</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Open Document Analysis from AI Features Hub</li>
                    <li>Enter the URL of an image or document</li>
                    <li>Click "Analyze Document"</li>
                    <li>Review the AI-generated insights and analysis</li>
                  </ol>
                </div>
              </CardContent>
            </Card>

            {/* Task Automation */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Workflow className="h-5 w-5" />
                  Task Automation
                </CardTitle>
                <CardDescription>Automate repetitive tasks and workflows with AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Automation Capabilities</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Create automated workflows based on triggers and actions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Schedule recurring tasks and reminders</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Set up conditional logic for complex workflows</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Monitor and manage active automations</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Getting Started</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Navigate to Task Automation in AI Features Hub</li>
                    <li>Create a new automation</li>
                    <li>Define the trigger condition</li>
                    <li>Specify the action to perform</li>
                    <li>Activate and test your automation</li>
                  </ol>
                </div>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    Start simple with basic automations, then build more complex workflows as needed!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Features Tab */}
          <TabsContent value="platform" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {/* Dashboard Navigation */}
            <Card>
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                  <Users className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                  Dashboard Navigation
                </CardTitle>
                <CardDescription className="text-xs sm:text-sm">Understanding your personalized dashboard</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6">
                <div>
                  <h4 className="font-semibold mb-2 text-sm sm:text-base">Dashboard Sections</h4>
                  <ul className="space-y-2 text-xs sm:text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Quick Actions:</strong> Access frequently used features instantly</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Recent Activity:</strong> See your latest projects and interactions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Notifications:</strong> Stay updated with important alerts</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary flex-shrink-0">•</span>
                      <span><strong>Analytics:</strong> Track your progress and engagement</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Profile Management */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Management</CardTitle>
                <CardDescription>Customize your profile and settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Profile Features</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Avatar & Bio:</strong> Personalize your profile with photos and description</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Role Selection:</strong> Choose your role (Startup, Mentor, Advisor, Investor, Student)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Professional Background:</strong> Add your experience, education, and skills</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Settings:</strong> Manage notifications, privacy, and account preferences</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Networking */}
            <Card>
              <CardHeader>
                <CardTitle>Networking Features</CardTitle>
                <CardDescription>Connect with other users and build your network</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Networking Tools</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Network Browser:</strong> Discover users based on role and interests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Connection Requests:</strong> Send and manage connection requests</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Messaging:</strong> Direct messaging with your connections</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Follow System:</strong> Follow users to stay updated on their activity</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Events Calendar */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Events Calendar
                </CardTitle>
                <CardDescription>Discover and manage events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Event Features</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Browse Events:</strong> Discover workshops, webinars, and networking events</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>RSVP:</strong> Register for events you want to attend</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Create Events:</strong> Host your own events and invite connections</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Calendar Integration:</strong> Sync with your personal calendar</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* CRM Board */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  CRM Board
                </CardTitle>
                <CardDescription>Manage your relationships and deals</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">CRM Features</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Pipeline Management:</strong> Track deals through different stages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Contact Cards:</strong> Store contact information and interaction history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Task Management:</strong> Create and track follow-up tasks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Notes & Tags:</strong> Organize contacts with notes and tags</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Educational Resources */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Educational Resources
                </CardTitle>
                <CardDescription>Learn and grow with courses and materials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Learning Features</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Course Library:</strong> Access courses on entrepreneurship, technology, and business</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Progress Tracking:</strong> Monitor your learning progress and completion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Certificates:</strong> Earn certificates upon course completion</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Study Groups:</strong> Join or create study groups with other learners</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
