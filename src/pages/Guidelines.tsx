import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { BookOpen, FileSignature, Share2, Edit, Eye, Mail, Clock, Keyboard, Lightbulb, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export default function Guidelines() {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const KeyboardShortcut = ({ keys }: { keys: string[] }) => (
    <div className="inline-flex gap-1">
      {keys.map((key, i) => (
        <Badge key={i} variant="secondary" className="font-mono text-xs px-2 py-0.5">
          {key}
        </Badge>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold">User Guidelines</h1>
                <p className="text-sm text-muted-foreground">Complete platform documentation</p>
              </div>
            </div>
            <Button variant="outline" onClick={() => navigate(-1)}>
              Back to Dashboard
            </Button>
          </div>
          
          {/* Search */}
          <div className="mt-4 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search guidelines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="pdf-editor" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 lg:w-auto">
            <TabsTrigger value="pdf-editor" className="gap-2">
              <FileSignature className="h-4 w-4" />
              PDF Editor & Signatures
            </TabsTrigger>
            <TabsTrigger value="ai-tools" className="gap-2">
              AI Tools Guide
            </TabsTrigger>
            <TabsTrigger value="platform" className="gap-2">
              Platform Features
            </TabsTrigger>
          </TabsList>

          {/* PDF Editor Tab */}
          <TabsContent value="pdf-editor" className="space-y-6 mt-6">
            {/* Getting Started */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Getting Started
                </CardTitle>
                <CardDescription>Learn how to access and use the PDF Editor</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How to Access</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Navigate to <strong>LightPaper</strong> from your dashboard</li>
                    <li>Click the <strong>PDF Editor</strong> icon (pen icon) in the toolbar</li>
                    <li>Upload a PDF or create a new editing session</li>
                  </ol>
                </div>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    All your edits are auto-saved in real-time. You never lose your work!
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Basic Editing Tools */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Edit className="h-5 w-5" />
                  Basic Editing Tools
                </CardTitle>
                <CardDescription>Master the essential editing features</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Text Tool</h4>
                      <KeyboardShortcut keys={["T"]} />
                    </div>
                    <p className="text-sm text-muted-foreground">Click anywhere to add text to your PDF</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Rectangle Tool</h4>
                      <KeyboardShortcut keys={["R"]} />
                    </div>
                    <p className="text-sm text-muted-foreground">Draw shapes and boxes on your document</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Eraser Tool</h4>
                      <KeyboardShortcut keys={["E"]} />
                    </div>
                    <p className="text-sm text-muted-foreground">Remove unwanted elements</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Selection Mode</h4>
                      <KeyboardShortcut keys={["V"]} />
                    </div>
                    <p className="text-sm text-muted-foreground">Select and move objects</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Image Upload</h4>
                      <KeyboardShortcut keys={["I"]} />
                    </div>
                    <p className="text-sm text-muted-foreground">Insert images via drag & drop or click</p>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold">Zoom</h4>
                      <KeyboardShortcut keys={["Ctrl", "+/-"]} />
                    </div>
                    <p className="text-sm text-muted-foreground">Zoom in/out for precise editing</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Digital Signatures - HIGHLIGHTED */}
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileSignature className="h-5 w-5 text-primary" />
                  Digital Signatures
                  <Badge variant="default">Featured</Badge>
                </CardTitle>
                <CardDescription>Create, place, and manage signatures on your PDFs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Creating Signatures */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    Creating Signatures
                    <KeyboardShortcut keys={["S"]} />
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="font-medium text-primary">1. Draw</div>
                      <p className="text-sm text-muted-foreground">
                        Use your mouse or touch screen to draw your signature naturally on the canvas
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="font-medium text-primary">2. Type</div>
                      <p className="text-sm text-muted-foreground">
                        Enter your name and select from elegant font styles for a professional signature
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="font-medium text-primary">3. Library</div>
                      <p className="text-sm text-muted-foreground">
                        Access and reuse your previously saved signatures instantly
                      </p>
                    </div>
                  </div>
                </div>

                {/* Placing Signatures */}
                <div>
                  <h4 className="font-semibold mb-3">Placing Signatures on PDF</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Press <strong>S</strong> key or click the <strong>"Sign"</strong> button in the toolbar</li>
                    <li>Create or select a signature from your library</li>
                    <li>Click anywhere on the PDF to place your signature</li>
                    <li>Your signature is automatically saved to your library for future use</li>
                  </ol>
                </div>

                {/* Managing Library */}
                <div>
                  <h4 className="font-semibold mb-3">Managing Your Signature Library</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>All signatures are <strong>automatically saved</strong> after creation</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Access your library anytime from the signature panel</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Delete unwanted signatures to keep your library organized</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Reuse signatures across multiple documents instantly</span>
                    </li>
                  </ul>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro Tip:</strong> Create once, sign forever! Your signatures are securely stored and ready to use anytime.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Sharing & Permissions - HIGHLIGHTED */}
            <Card className="border-primary/50">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Share2 className="h-5 w-5 text-primary" />
                  Sharing & Permissions
                  <Badge variant="default">Featured</Badge>
                </CardTitle>
                <CardDescription>Share PDFs securely with granular access control</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Share Links */}
                <div>
                  <h4 className="font-semibold mb-3">Generate Shareable Links</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4">
                    <li>Click the <strong>"Share"</strong> button in the PDF Editor toolbar</li>
                    <li>Select your desired <strong>access level</strong> (see below)</li>
                    <li>Optionally set an <strong>expiration date</strong> for time-sensitive documents</li>
                    <li>Click <strong>"Generate Link"</strong> and copy the shareable URL</li>
                  </ol>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Eye className="h-4 w-4 text-blue-500" />
                        <span className="font-medium">View-Only</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recipients can view the PDF but cannot make any changes or add signatures
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <FileSignature className="h-4 w-4 text-amber-500" />
                        <span className="font-medium">Sign</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recipients can view and add their signatures to the document
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg space-y-2">
                      <div className="flex items-center gap-2">
                        <Edit className="h-4 w-4 text-green-500" />
                        <span className="font-medium">Full Edit</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Recipients have complete editing access to modify the PDF
                      </p>
                    </div>
                  </div>
                </div>

                {/* Email Invitations */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Email Signature Requests
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Send professional email invitations directly from the platform
                  </p>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>In the Share dialog, switch to the <strong>"Email"</strong> tab</li>
                    <li>Enter the recipient's email address and name</li>
                    <li>Add a custom message to personalize your request</li>
                    <li>Select the access level and click <strong>"Send Invitation"</strong></li>
                  </ol>
                </div>

                {/* Expiration Dates */}
                <div>
                  <h4 className="font-semibold mb-3 flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Expiration Dates
                  </h4>
                  <p className="text-sm text-muted-foreground">
                    Set expiration dates for time-sensitive documents like contracts, NDAs, or temporary agreements. 
                    Links automatically become invalid after the specified date, enhancing document security.
                  </p>
                </div>

                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Security Best Practice:</strong> Always use the most restrictive access level needed. 
                    Use "Sign" access for signature requests instead of "Full Edit" to prevent unwanted changes.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Collaboration Features */}
            <Card>
              <CardHeader>
                <CardTitle>Real-Time Collaboration</CardTitle>
                <CardDescription>Work together seamlessly with live updates</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                    </div>
                    <div>
                      <strong className="text-foreground">Live Cursors:</strong> See where other users are working in real-time with color-coded cursors
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                    </div>
                    <div>
                      <strong className="text-foreground">Auto-Save:</strong> All changes are automatically saved as you work
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                    </div>
                    <div>
                      <strong className="text-foreground">Version History:</strong> Every operation is tracked for audit trails and rollback
                    </div>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <div className="h-3 w-3 rounded-full bg-primary" />
                    </div>
                    <div>
                      <strong className="text-foreground">Instant Updates:</strong> See changes from other collaborators immediately
                    </div>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Keyboard Shortcuts */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Keyboard className="h-5 w-5" />
                  Keyboard Shortcuts
                </CardTitle>
                <CardDescription>Speed up your workflow with these shortcuts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-3">
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <span className="text-sm">Text Tool</span>
                    <KeyboardShortcut keys={["T"]} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <span className="text-sm">Rectangle Tool</span>
                    <KeyboardShortcut keys={["R"]} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <span className="text-sm">Selection Tool</span>
                    <KeyboardShortcut keys={["V"]} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <span className="text-sm">Eraser Tool</span>
                    <KeyboardShortcut keys={["E"]} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <span className="text-sm">Image Tool</span>
                    <KeyboardShortcut keys={["I"]} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <span className="text-sm">Signature Tool</span>
                    <KeyboardShortcut keys={["S"]} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <span className="text-sm">Zoom In</span>
                    <KeyboardShortcut keys={["Ctrl", "+"]} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <span className="text-sm">Zoom Out</span>
                    <KeyboardShortcut keys={["Ctrl", "-"]} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <span className="text-sm">Search</span>
                    <KeyboardShortcut keys={["Ctrl", "F"]} />
                  </div>
                  <div className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                    <span className="text-sm">Undo</span>
                    <KeyboardShortcut keys={["Ctrl", "Z"]} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips & Best Practices */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Tips & Best Practices
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Alert>
                    <AlertDescription>
                      <strong>📝 Signature Management:</strong> Create multiple signature styles for different purposes - formal, casual, initials, etc.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertDescription>
                      <strong>🔒 Security:</strong> Always set expiration dates on shared links for sensitive documents like contracts or legal agreements.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertDescription>
                      <strong>⚡ Performance:</strong> Use keyboard shortcuts to work faster - press "S" for signatures, "T" for text, etc.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertDescription>
                      <strong>👥 Collaboration:</strong> Check live cursors before editing to avoid conflicts with other team members.
                    </AlertDescription>
                  </Alert>
                  <Alert>
                    <AlertDescription>
                      <strong>📧 Professional Requests:</strong> Use email invitations instead of just sharing links for formal signature requests.
                    </AlertDescription>
                  </Alert>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Tools Tab */}
          <TabsContent value="ai-tools" className="space-y-6 mt-6">
            {/* AI Assistant */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  AI Assistant
                  <Badge variant="default">Popular</Badge>
                </CardTitle>
                <CardDescription>Your intelligent document companion powered by advanced AI</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How to Access</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Navigate to any <strong>LightPaper</strong> document</li>
                    <li>Click the <strong>AI Assistant</strong> button (robot icon) in the toolbar</li>
                    <li>Start chatting with the AI about your document</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Key Features</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Document Q&A</div>
                      <p className="text-xs text-muted-foreground">Ask questions about your document content and get instant, accurate answers</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Content Generation</div>
                      <p className="text-xs text-muted-foreground">Generate text, paragraphs, or entire sections based on your prompts</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Writing Assistance</div>
                      <p className="text-xs text-muted-foreground">Get suggestions for improvement, grammar corrections, and style enhancements</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Smart Summaries</div>
                      <p className="text-xs text-muted-foreground">Quickly summarize long documents into key points</p>
                    </div>
                  </div>
                </div>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro Tip:</strong> The AI Assistant can understand context from your entire document, making it perfect for complex research or analysis tasks.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* AI Summarization */}
            <Card>
              <CardHeader>
                <CardTitle>AI Text Summarizer</CardTitle>
                <CardDescription>Instantly condense long documents into digestible summaries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How to Use</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Select the text you want to summarize in your document</li>
                    <li>Click the <strong>AI Summarize</strong> button or use the context menu</li>
                    <li>Choose your preferred summary length (Short, Medium, Long)</li>
                    <li>Review and insert the summary into your document</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Summary Options</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Short:</strong> Quick overview in 1-2 sentences</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Medium:</strong> Balanced summary with key points (3-5 sentences)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Long:</strong> Detailed summary preserving important details</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Best Use Cases</h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="p-3 border rounded-lg text-sm">
                      <div className="font-medium mb-1">Research Papers</div>
                      <p className="text-xs text-muted-foreground">Extract key findings quickly</p>
                    </div>
                    <div className="p-3 border rounded-lg text-sm">
                      <div className="font-medium mb-1">Meeting Notes</div>
                      <p className="text-xs text-muted-foreground">Get action items at a glance</p>
                    </div>
                    <div className="p-3 border rounded-lg text-sm">
                      <div className="font-medium mb-1">Long Articles</div>
                      <p className="text-xs text-muted-foreground">Save time on reading</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Translation */}
            <Card>
              <CardHeader>
                <CardTitle>AI Translator</CardTitle>
                <CardDescription>Translate content into 100+ languages with context awareness</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How to Translate</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Select the text you want to translate</li>
                    <li>Click the <strong>Translate</strong> button in the AI toolbar</li>
                    <li>Choose your target language from the dropdown</li>
                    <li>Review the translation and insert it into your document</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Supported Languages (100+)</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-muted-foreground">
                    <div>Spanish • French</div>
                    <div>German • Italian</div>
                    <div>Chinese • Japanese</div>
                    <div>Korean • Arabic</div>
                    <div>Portuguese • Russian</div>
                    <div>Hindi • Bengali</div>
                    <div>Turkish • Polish</div>
                    <div>Dutch • Swedish</div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">...and 80+ more languages</p>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Translation Features</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Context-Aware:</strong> Maintains meaning and tone across languages</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Format Preservation:</strong> Keeps original formatting and structure</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Bulk Translation:</strong> Translate entire documents at once</span>
                    </li>
                  </ul>
                </div>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Best Practice:</strong> For technical or legal documents, always review translations for accuracy and context.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Sentiment Analysis */}
            <Card>
              <CardHeader>
                <CardTitle>Sentiment Analyzer</CardTitle>
                <CardDescription>Understand emotional tone and sentiment in text</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How It Works</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Select any text passage in your document</li>
                    <li>Click the <strong>Analyze Sentiment</strong> button</li>
                    <li>View the sentiment score and breakdown</li>
                    <li>Use insights to refine your content</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Sentiment Scores</h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="p-3 border border-green-500/20 rounded-lg">
                      <div className="font-medium text-green-600 mb-1">Positive (0.3 to 1.0)</div>
                      <p className="text-xs text-muted-foreground">Optimistic, enthusiastic, or favorable tone</p>
                    </div>
                    <div className="p-3 border border-gray-500/20 rounded-lg">
                      <div className="font-medium mb-1">Neutral (-0.3 to 0.3)</div>
                      <p className="text-xs text-muted-foreground">Objective, factual, or balanced tone</p>
                    </div>
                    <div className="p-3 border border-red-500/20 rounded-lg">
                      <div className="font-medium text-red-600 mb-1">Negative (-1.0 to -0.3)</div>
                      <p className="text-xs text-muted-foreground">Critical, pessimistic, or unfavorable tone</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Use Cases</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Customer Feedback:</strong> Analyze reviews and feedback for insights</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Market Research:</strong> Understand public perception and trends</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Content Optimization:</strong> Ensure your messaging matches intent</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Brand Monitoring:</strong> Track sentiment in communications</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Document Analyzer */}
            <Card>
              <CardHeader>
                <CardTitle>Document Analyzer</CardTitle>
                <CardDescription>Extract insights, patterns, and key information from documents</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">How to Analyze</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Upload a document (PDF, DOCX, TXT) to LightPaper</li>
                    <li>Click the <strong>Analyze Document</strong> button in the toolbar</li>
                    <li>Select analysis type (Overview, Key Points, Entities, etc.)</li>
                    <li>Review the AI-generated analysis and insights</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Analysis Features</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Key Points Extraction</div>
                      <p className="text-xs text-muted-foreground">Automatically identify main ideas and important takeaways</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Entity Recognition</div>
                      <p className="text-xs text-muted-foreground">Detect names, dates, locations, organizations, and more</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Topic Modeling</div>
                      <p className="text-xs text-muted-foreground">Understand main themes and subject areas</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Readability Metrics</div>
                      <p className="text-xs text-muted-foreground">Assess complexity and reading level</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Export Options</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Export analysis results as PDF or JSON</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Share insights with team members</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Integrate with other platform features</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Task Automation */}
            <Card>
              <CardHeader>
                <CardTitle>Task Automation</CardTitle>
                <CardDescription>Automate repetitive workflows with AI-powered triggers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Getting Started</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Navigate to <strong>Dashboard → Task Automation</strong></li>
                    <li>Click <strong>Create New Automation</strong></li>
                    <li>Select a trigger event (e.g., "New document uploaded")</li>
                    <li>Choose actions to automate (e.g., "Summarize and email")</li>
                    <li>Save and activate your automation</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Available Triggers</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Document Events</div>
                      <p className="text-xs text-muted-foreground">New upload, edit, signature added, etc.</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Time-Based</div>
                      <p className="text-xs text-muted-foreground">Daily, weekly, or monthly schedules</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Collaboration Events</div>
                      <p className="text-xs text-muted-foreground">New comment, share link created, etc.</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Custom Conditions</div>
                      <p className="text-xs text-muted-foreground">Define your own triggers based on rules</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Automation Actions</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Auto-Summarize:</strong> Generate summaries for new documents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Send Notifications:</strong> Email alerts for important events</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Organize Files:</strong> Auto-categorize and tag documents</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Export Reports:</strong> Schedule automatic report generation</span>
                    </li>
                  </ul>
                </div>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro Tip:</strong> Chain multiple actions together for complex workflows. Example: "New document → Summarize → Translate → Email team"
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Features Tab */}
          <TabsContent value="platform" className="space-y-6 mt-6">
            {/* Dashboard Navigation */}
            <Card>
              <CardHeader>
                <CardTitle>Dashboard Navigation</CardTitle>
                <CardDescription>Master your personalized dashboard experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Dashboard Layouts by Role</h4>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-primary mb-1">Startup Dashboard</div>
                      <p className="text-xs text-muted-foreground">Pitch deck, investor network, CRM, analytics, and funding opportunities</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-primary mb-1">Mentor Dashboard</div>
                      <p className="text-xs text-muted-foreground">Sessions calendar, mentorship requests, endorsements, and roadmaps</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-primary mb-1">Investor Dashboard</div>
                      <p className="text-xs text-muted-foreground">Startup browser, deal flow, portfolio tracking, and pitch bookings</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-primary mb-1">Student Dashboard</div>
                      <p className="text-xs text-muted-foreground">Jobs board, internships, courses, study groups, and achievements</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium text-primary mb-1">Advisor Dashboard</div>
                      <p className="text-xs text-muted-foreground">Advisory roles, expertise areas, availability, and client management</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Quick Actions Menu</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Access frequently-used features instantly from the Quick Actions button (⚡ icon) in the top navigation bar.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Create new documents, posts, or events</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Start video calls or messaging</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Access your calendar or notifications</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Search across the entire platform</span>
                    </li>
                  </ul>
                </div>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Navigation Tip:</strong> Use the Global Search (Ctrl+K) to quickly jump to any page, person, or document.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Profile Management */}
            <Card>
              <CardHeader>
                <CardTitle>Profile Management</CardTitle>
                <CardDescription>Build a compelling professional presence</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Setting Up Your Profile</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Click your avatar in the top-right corner</li>
                    <li>Select <strong>Edit Profile</strong> from the dropdown</li>
                    <li>Fill in your personal and professional information</li>
                    <li>Upload a professional photo and company logo (if applicable)</li>
                    <li>Add your background, expertise, and interests</li>
                    <li>Set your availability and contact preferences</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Role-Specific Profile Fields</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Startup Profiles</div>
                      <p className="text-xs text-muted-foreground">Company description, team size, funding stage, pitch deck, traction metrics, industry, and target market</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Mentor/Advisor Profiles</div>
                      <p className="text-xs text-muted-foreground">Expertise areas, years of experience, mentorship style, availability calendar, rates (if applicable), and endorsements</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Investor Profiles</div>
                      <p className="text-xs text-muted-foreground">Investment thesis, ticket size, preferred industries, portfolio companies, investment stage focus, and contact preferences</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Student Profiles</div>
                      <p className="text-xs text-muted-foreground">University, major, graduation year, skills, courses completed, achievements, and career interests</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Privacy Settings</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Profile Visibility:</strong> Control who can view your profile (Public, Network Only, Private)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Contact Info:</strong> Choose what contact details are visible to others</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Activity Status:</strong> Show or hide your online status and last active time</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Networking Features */}
            <Card>
              <CardHeader>
                <CardTitle>Networking Features</CardTitle>
                <CardDescription>Build meaningful connections in the startup ecosystem</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Connecting with Others</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Follow</div>
                      <p className="text-xs text-muted-foreground">Stay updated on someone's posts and activities without requesting a connection</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Connect</div>
                      <p className="text-xs text-muted-foreground">Send connection requests to build your network and enable direct messaging</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Advanced Matching</div>
                      <p className="text-xs text-muted-foreground">Use AI-powered matching to find the most relevant startups, mentors, or investors</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Network Browser</div>
                      <p className="text-xs text-muted-foreground">Explore users by role, industry, location, and expertise</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Messaging & Communication</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Direct Messaging:</strong> Send private messages to your connections</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Video Conferencing:</strong> Start instant video calls with integrated Jitsi Meet</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Real-Time Status:</strong> See who's online and available for immediate communication</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Notification Center:</strong> Never miss important messages or connection requests</span>
                    </li>
                  </ul>
                </div>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Networking Tip:</strong> Personalize connection requests with a brief message explaining why you'd like to connect. This significantly increases acceptance rates.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>

            {/* Opportunities */}
            <Card>
              <CardHeader>
                <CardTitle>Opportunities Board</CardTitle>
                <CardDescription>Discover jobs, internships, and mentorship opportunities</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Jobs & Internships</h4>
                  <div className="space-y-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-2">For Job Seekers & Students</div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Browse opportunities by role, industry, and location</li>
                        <li>• Apply with one click using your platform profile</li>
                        <li>• Track application status in real-time</li>
                        <li>• Receive task assignments from employers</li>
                      </ul>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-2">For Employers & Startups</div>
                      <ul className="space-y-1 text-xs text-muted-foreground">
                        <li>• Post job and internship opportunities</li>
                        <li>• Review applications and candidate profiles</li>
                        <li>• Send tasks to applicants for skill assessment</li>
                        <li>• Communicate directly with candidates</li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Mentorship Offers</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Mentors can post available mentorship slots, and students/startups can browse and request sessions.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Filter by expertise area, industry, and availability</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>View mentor profiles, endorsements, and session ratings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Book sessions directly through the platform calendar</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">CRM & Pipeline Management</h4>
                  <p className="text-sm text-muted-foreground">
                    Startups can manage their sales pipeline, track leads, and organize opportunities using the built-in CRM board with drag-and-drop Kanban interface.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Educational Resources */}
            <Card>
              <CardHeader>
                <CardTitle>Educational Resources</CardTitle>
                <CardDescription>Learn, grow, and develop new skills</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Courses & Learning Paths</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Video Courses:</strong> Access curated educational content on entrepreneurship, product development, marketing, and more</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Progress Tracking:</strong> Monitor your course completion and earn certificates</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Shorts:</strong> Quick educational videos (60-90 seconds) for on-the-go learning</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Study Groups</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Join or create study groups to collaborate with peers on courses, projects, or specific topics.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Group Features</div>
                      <p className="text-xs text-muted-foreground">Chat, file sharing, video calls, and collaborative documents</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Public & Private Groups</div>
                      <p className="text-xs text-muted-foreground">Create open groups for networking or private ones for focused collaboration</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Resources Library</h4>
                  <p className="text-sm text-muted-foreground">
                    Access templates, guides, case studies, and industry reports curated for startup founders, mentors, investors, and students.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Events & Sessions */}
            <Card>
              <CardHeader>
                <CardTitle>Events & Sessions</CardTitle>
                <CardDescription>Participate in and host virtual events</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Creating Events</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground">
                    <li>Navigate to your dashboard and click <strong>Create Event</strong></li>
                    <li>Add event details: title, description, date, time, and duration</li>
                    <li>Set event type: Public, Network Only, or Private</li>
                    <li>Enable registration if needed and set capacity limits</li>
                    <li>Publish your event and share it with your network</li>
                  </ol>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Types of Sessions</h4>
                  <div className="grid md:grid-cols-3 gap-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Pitch Sessions</div>
                      <p className="text-xs text-muted-foreground">Startups can book time to pitch to investors</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Mentorship Sessions</div>
                      <p className="text-xs text-muted-foreground">One-on-one or group mentoring with feedback and ratings</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Community Events</div>
                      <p className="text-xs text-muted-foreground">Webinars, workshops, networking events, and more</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Unified Calendar</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    All your events, sessions, and bookings appear in your personal calendar with reminders and notifications.
                  </p>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Sync with external calendars (Google, Outlook)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Set availability windows for bookings</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span>Receive notifications before scheduled events</span>
                    </li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Analytics */}
            <Card>
              <CardHeader>
                <CardTitle>Analytics & Insights</CardTitle>
                <CardDescription>Track performance and gain actionable insights</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3">Profile Metrics</h4>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Profile Views:</strong> See who viewed your profile and when</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Network Growth:</strong> Track follower and connection trends over time</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-primary">•</span>
                      <span><strong>Engagement Rate:</strong> Monitor interactions on your posts and content</span>
                    </li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Startup Analytics Dashboard</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Exclusive to startup profiles, offering comprehensive business metrics and insights.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Traction Metrics</div>
                      <p className="text-xs text-muted-foreground">Revenue, users, growth rate, and key milestones</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Investor Interest</div>
                      <p className="text-xs text-muted-foreground">Profile views from investors, pitch requests, and follow-ups</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">Roadmap Progress</div>
                      <p className="text-xs text-muted-foreground">Track milestone completion and goal achievement</p>
                    </div>
                    <div className="p-3 border rounded-lg">
                      <div className="font-medium mb-1">AI Recommendations</div>
                      <p className="text-xs text-muted-foreground">Get personalized suggestions for growth and fundraising</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-2">Market Intelligence</h4>
                  <p className="text-sm text-muted-foreground">
                    Access market trends, industry analysis, and AI-powered predictions to inform strategic decisions (available for Pro users).
                  </p>
                </div>
                <Alert>
                  <Lightbulb className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Pro Tip:</strong> Review your analytics weekly to identify trends, optimize your profile, and adjust your networking strategy.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
