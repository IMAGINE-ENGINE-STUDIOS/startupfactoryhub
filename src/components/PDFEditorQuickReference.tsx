import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { HelpCircle, Keyboard, FileSignature, Share2, BookOpen } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function PDFEditorQuickReference() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const shortcuts = [
    { key: "T", action: "Text Tool" },
    { key: "R", action: "Rectangle Tool" },
    { key: "V", action: "Selection Tool" },
    { key: "E", action: "Eraser Tool" },
    { key: "I", action: "Image Tool" },
    { key: "S", action: "Signature Tool" },
    { key: "Ctrl + +", action: "Zoom In" },
    { key: "Ctrl + -", action: "Zoom Out" },
    { key: "Ctrl + F", action: "Search" },
    { key: "Ctrl + Z", action: "Undo" },
  ];

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg z-50 hover:scale-110 transition-transform"
          title="Quick Help"
        >
          <HelpCircle className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <HelpCircle className="h-5 w-5" />
            Quick Reference
          </SheetTitle>
          <SheetDescription>
            Essential shortcuts and tips for PDF editing
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Keyboard Shortcuts */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Keyboard className="h-4 w-4" />
              Keyboard Shortcuts
            </h3>
            <div className="space-y-2">
              {shortcuts.map((shortcut, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded hover:bg-muted/50">
                  <span className="text-sm">{shortcut.action}</span>
                  <Badge variant="secondary" className="font-mono text-xs">
                    {shortcut.key}
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Tips */}
          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <FileSignature className="h-4 w-4" />
              Digital Signatures
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Press <strong>S</strong> to activate signature mode</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Choose from draw, type, or library options</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Signatures auto-save to your library</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-3 flex items-center gap-2">
              <Share2 className="h-4 w-4" />
              Sharing PDFs
            </h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Click "Share" to generate secure links</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Set access levels: View, Sign, or Edit</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-primary">•</span>
                <span>Add expiration dates for security</span>
              </li>
            </ul>
          </div>

          {/* Full Guide Link */}
          <div className="pt-4 border-t">
            <Button
              variant="default"
              className="w-full gap-2"
              onClick={() => {
                setOpen(false);
                navigate("/guidelines");
              }}
            >
              <BookOpen className="h-4 w-4" />
              View Full User Guide
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
