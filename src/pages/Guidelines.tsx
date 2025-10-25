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

          {/* AI Tools Tab - Placeholder */}
          <TabsContent value="ai-tools" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Tools Guide</CardTitle>
                <CardDescription>Coming soon - comprehensive guide for AI features</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This section will include guides for AI-powered features like sentiment analysis, 
                  document summarization, translation, and more.
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Platform Features Tab - Placeholder */}
          <TabsContent value="platform" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Platform Features</CardTitle>
                <CardDescription>Coming soon - general platform documentation</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  This section will cover dashboard navigation, profile management, networking features, 
                  and other platform capabilities.
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
