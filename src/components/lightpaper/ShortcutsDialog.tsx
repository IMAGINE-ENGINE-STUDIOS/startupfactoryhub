import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Keyboard } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface ShortcutsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "document" | "spreadsheet" | "presentation" | "pdf";
}

const shortcuts = {
  document: [
    { keys: ["Ctrl", "B"], action: "Bold" },
    { keys: ["Ctrl", "I"], action: "Italic" },
    { keys: ["Ctrl", "U"], action: "Underline" },
    { keys: ["Ctrl", "S"], action: "Save" },
    { keys: ["Ctrl", "Z"], action: "Undo" },
    { keys: ["Ctrl", "Y"], action: "Redo" },
    { keys: ["Ctrl", "F"], action: "Find" },
    { keys: ["Ctrl", "H"], action: "Find and Replace" },
  ],
  spreadsheet: [
    { keys: ["Arrow Keys"], action: "Navigate cells" },
    { keys: ["Tab"], action: "Move to next cell" },
    { keys: ["Enter"], action: "Move down" },
    { keys: ["Escape"], action: "Cancel edit" },
    { keys: ["Delete"], action: "Clear cell" },
    { keys: ["Ctrl", "C"], action: "Copy" },
    { keys: ["Ctrl", "V"], action: "Paste" },
    { keys: ["Ctrl", "Z"], action: "Undo" },
    { keys: ["Ctrl", "Y"], action: "Redo" },
    { keys: ["Ctrl", "S"], action: "Save" },
  ],
  presentation: [
    { keys: ["Ctrl", "D"], action: "Duplicate slide" },
    { keys: ["Delete"], action: "Delete slide" },
    { keys: ["F5"], action: "Start presentation" },
    { keys: ["Escape"], action: "Exit presentation" },
    { keys: ["Arrow Keys"], action: "Navigate slides" },
    { keys: ["Ctrl", "Z"], action: "Undo" },
    { keys: ["Ctrl", "Y"], action: "Redo" },
    { keys: ["Ctrl", "S"], action: "Save" },
  ],
  pdf: [
    { keys: ["Ctrl", "Z"], action: "Undo last operation" },
    { keys: ["Ctrl", "Y"], action: "Redo operation" },
    { keys: ["Ctrl", "S"], action: "Save changes" },
    { keys: ["Ctrl", "F"], action: "Search in PDF" },
    { keys: ["Ctrl", "/"], action: "Show keyboard shortcuts" },
    { keys: ["Ctrl", "+"], action: "Zoom in" },
    { keys: ["Ctrl", "-"], action: "Zoom out" },
    { keys: ["T"], action: "Text tool" },
    { keys: ["R"], action: "Rectangle tool" },
    { keys: ["E"], action: "Eraser tool" },
    { keys: ["Escape"], action: "Deselect tool" },
    { keys: ["→"], action: "Next page" },
    { keys: ["←"], action: "Previous page" },
  ],
};

export function ShortcutsDialog({ open, onOpenChange, type }: ShortcutsDialogProps) {
  const editorShortcuts = shortcuts[type] || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="text-sm font-semibold mb-3 capitalize">{type} Editor</h3>
            <div className="space-y-2">
              {editorShortcuts.map((shortcut, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="text-sm text-muted-foreground">{shortcut.action}</span>
                  <div className="flex gap-1">
                    {shortcut.keys.map((key, keyIndex) => (
                      <span key={keyIndex} className="inline-flex items-center gap-1">
                        <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded">
                          {key}
                        </kbd>
                        {keyIndex < shortcut.keys.length - 1 && (
                          <span className="text-muted-foreground">+</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-semibold mb-3">Universal Shortcuts</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Open keyboard shortcuts</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded">
                  Ctrl + /
                </kbd>
              </div>
              <div className="flex items-center justify-between py-2">
                <span className="text-sm text-muted-foreground">Close dialog</span>
                <kbd className="px-2 py-1 text-xs font-semibold bg-muted border border-border rounded">
                  Escape
                </kbd>
              </div>
            </div>
          </div>

          <div className="text-xs text-muted-foreground bg-muted p-3 rounded-lg">
            <p><strong>Note:</strong> On Mac, use <kbd className="px-1 py-0.5 text-xs bg-background border border-border rounded">Cmd</kbd> instead of <kbd className="px-1 py-0.5 text-xs bg-background border border-border rounded">Ctrl</kbd></p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
