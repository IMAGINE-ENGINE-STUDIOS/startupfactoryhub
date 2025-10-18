import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo, Redo, Link, Image as ImageIcon, Table, 
  Heading1, Heading2, Heading3, Highlighter, Strikethrough, Type, Palette
} from "lucide-react";
import { toast } from "sonner";
import { useLightPaperProjects } from "@/hooks/useLightPaperProjects";
import CollapsibleToolbar from "./CollapsibleToolbar";
import FloatingActionMenu from "./FloatingActionMenu";

const FONTS = ["Arial", "Times New Roman", "Georgia", "Verdana", "Courier New", "Roboto", "Open Sans", "Lato", "Montserrat"];
const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32", "36"];

export function LightPaperDocument() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedSize, setSelectedSize] = useState("16");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Document");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const { saveProject } = useLightPaperProjects("document");

  const execCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
      toast.success("Formatting applied");
    }
  };

  const handleSaveToAccount = async () => {
    const content = {
      html: editorRef.current?.innerHTML || "",
      font: selectedFont,
      size: selectedSize,
    };
    
    const result = await saveProject(projectTitle, "document", content, currentProjectId || undefined);
    if (result) {
      setCurrentProjectId(result.id);
      setShowSaveDialog(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      <CollapsibleToolbar title="Formatting Tools">
        <div className="flex flex-wrap items-center gap-2">
          {/* Font Controls */}
          <Select value={selectedFont} onValueChange={(font) => {
            setSelectedFont(font);
            if (editorRef.current) editorRef.current.style.fontFamily = font;
          }}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONTS.map((font) => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedSize} onValueChange={(size) => {
            setSelectedSize(size);
            if (editorRef.current) editorRef.current.style.fontSize = `${size}px`;
          }}>
            <SelectTrigger className="w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size} value={size}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Text Formatting */}
          <div className="flex gap-1 border-l pl-2">
            <Button variant="ghost" size="icon" onClick={() => execCommand("bold")} title="Bold (Ctrl+B)">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => execCommand("italic")} title="Italic (Ctrl+I)">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => execCommand("underline")} title="Underline (Ctrl+U)">
              <Underline className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => execCommand("strikeThrough")} title="Strikethrough">
              <Strikethrough className="h-4 w-4" />
            </Button>
          </div>

          {/* Headings Dropdown */}
          <div className="border-l pl-2">
            <Select value="" onValueChange={(value) => {
              if (editorRef.current) {
                editorRef.current.focus();
                document.execCommand("formatBlock", false, `<${value}>`);
                toast.success(`Applied ${value.toUpperCase()}`);
              }
            }}>
              <SelectTrigger className="w-32 h-9">
                <SelectValue placeholder="Heading" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="p">Normal</SelectItem>
                <SelectItem value="h1" className="text-3xl font-bold">Heading 1</SelectItem>
                <SelectItem value="h2" className="text-2xl font-bold">Heading 2</SelectItem>
                <SelectItem value="h3" className="text-xl font-bold">Heading 3</SelectItem>
                <SelectItem value="h4" className="text-lg font-bold">Heading 4</SelectItem>
                <SelectItem value="h5" className="text-base font-bold">Heading 5</SelectItem>
                <SelectItem value="h6" className="text-sm font-bold">Heading 6</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-l pl-2">
            <Button variant="ghost" size="icon" onClick={() => execCommand("justifyLeft")} title="Align Left">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => execCommand("justifyCenter")} title="Align Center">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => execCommand("justifyRight")} title="Align Right">
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => execCommand("justifyFull")} title="Justify">
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-l pl-2">
            <Button variant="ghost" size="icon" onClick={() => execCommand("insertUnorderedList")} title="Bullet List">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => execCommand("insertOrderedList")} title="Numbered List">
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          {/* Undo/Redo */}
          <div className="flex gap-1 border-l pl-2">
            <Button variant="ghost" size="icon" onClick={() => execCommand("undo")} title="Undo (Ctrl+Z)">
              <Undo className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => execCommand("redo")} title="Redo (Ctrl+Y)">
              <Redo className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CollapsibleToolbar>

      {/* Main Editor Area - Takes Full Height */}
      <div className="flex-1 overflow-auto p-8 bg-muted/30">
        <div className="max-w-4xl mx-auto bg-background shadow-lg rounded-lg p-12 min-h-full">
          <div
            ref={editorRef}
            contentEditable
            className="outline-none min-h-[600px] prose prose-lg max-w-none"
            style={{ fontFamily: selectedFont, fontSize: `${selectedSize}px` }}
            suppressContentEditableWarning
          >
            <p>Start typing your document here...</p>
          </div>
        </div>
      </div>

      {/* Floating Action Menu */}
      <FloatingActionMenu
        onSave={() => setShowSaveDialog(true)}
        onPrint={handlePrint}
      />

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input
                id="title"
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter document title"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveToAccount}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
