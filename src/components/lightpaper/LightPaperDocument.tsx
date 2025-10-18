import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo, Redo, Download, Upload, Save, Type, Palette,
  Link, Image as ImageIcon, Table, Heading1, Heading2, Heading3, FileText, Highlighter, Strikethrough
} from "lucide-react";
import { toast } from "sonner";
import { useLightPaperProjects } from "@/hooks/useLightPaperProjects";

const FONTS = [
  "Arial", "Times New Roman", "Georgia", "Verdana", "Courier New", "Comic Sans MS",
  "Impact", "Trebuchet MS", "Palatino", "Garamond", "Bookman", "Avant Garde",
  "Helvetica", "Tahoma", "Monaco", "Lucida Console", "Brush Script MT", "Copperplate",
  "Papyrus", "Century Gothic", "Franklin Gothic", "Gill Sans", "Lucida Sans",
  "Optima", "Perpetua", "Rockwell", "Baskerville", "Didot", "Bodoni",
  "Futura", "Calibri", "Cambria", "Candara", "Consolas", "Constantia", "Corbel",
  // Google Fonts
  "Roboto", "Open Sans", "Lato", "Montserrat", "Oswald", "Source Sans Pro",
  "Raleway", "PT Sans", "Merriweather", "Nunito", "Poppins", "Ubuntu",
  "Playfair Display", "Mukta", "Libre Baskerville", "Crimson Text", "Arvo",
  "Josefin Sans", "Quicksand", "Bitter", "Pacifico", "Dancing Script",
  "Indie Flower", "Bebas Neue", "Anton", "Archivo", "Barlow", "DM Sans",
  "Inter", "Manrope", "Mulish", "Oxygen", "PT Serif", "Rubik", "Work Sans",
  "Alegreya", "EB Garamond", "Fira Sans", "Karla", "Noto Sans", "Zilla Slab"
];

const FONT_SIZES = ["8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "72"];

export function LightPaperDocument() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedSize, setSelectedSize] = useState("16");
  const [selectedColor, setSelectedColor] = useState("#000000");
  const [highlightColor, setHighlightColor] = useState("#ffff00");
  const [bgColor, setBgColor] = useState("#ffffff");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Document");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const { saveProject, projects } = useLightPaperProjects("document");

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.fontFamily = selectedFont;
      editorRef.current.style.backgroundColor = bgColor;
    }
  }, [selectedFont, bgColor]);

  const execCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand(command, false, value);
    }
  };

  const applyHeading = (tag: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        document.execCommand('formatBlock', false, tag);
      }
    }
  };

  const applyFontSize = (size: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      const selection = window.getSelection();
      if (selection && selection.toString().length > 0) {
        document.execCommand('fontSize', false, '7');
        const fontElements = editorRef.current.querySelectorAll('font[size="7"]');
        fontElements.forEach((element) => {
          (element as HTMLElement).removeAttribute('size');
          (element as HTMLElement).style.fontSize = `${size}px`;
        });
      } else {
        // Apply to entire editor if no selection
        editorRef.current.style.fontSize = `${size}px`;
      }
    }
  };

  const handleSaveToAccount = async () => {
    const content = {
      html: editorRef.current?.innerHTML || "",
      font: selectedFont,
      size: selectedSize,
      color: selectedColor,
      bgColor,
    };
    
    const result = await saveProject(projectTitle, "document", content, currentProjectId || undefined);
    if (result) {
      setCurrentProjectId(result.id);
      setShowSaveDialog(false);
    }
  };

  const handleLoadProject = async (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    if (project && editorRef.current) {
      editorRef.current.innerHTML = project.content.html || "";
      setSelectedFont(project.content.font || "Arial");
      setSelectedSize(project.content.size || "16");
      setSelectedColor(project.content.color || "#000000");
      setBgColor(project.content.bgColor || "#ffffff");
      setProjectTitle(project.title);
      setCurrentProjectId(project.id);
      toast.success("Project loaded!");
    }
  };

  const handleDownload = () => {
    const content = editorRef.current?.innerHTML || "";
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${projectTitle}.html`;
    a.click();
    toast.success("Document downloaded!");
  };

  const handleExport = () => {
    const content = editorRef.current?.innerText || "";
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.txt";
    a.click();
    toast.success("Document exported successfully!");
  };

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".txt,.html";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (editorRef.current) {
            editorRef.current.innerHTML = e.target?.result as string;
          }
          toast.success("Document imported successfully!");
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const insertTable = () => {
    if (editorRef.current) {
      editorRef.current.focus();
      const table = '<table border="1" style="border-collapse: collapse; width: 100%; margin: 10px 0;"><tr><td style="padding: 8px; border: 1px solid #ccc;">Cell 1</td><td style="padding: 8px; border: 1px solid #ccc;">Cell 2</td></tr><tr><td style="padding: 8px; border: 1px solid #ccc;">Cell 3</td><td style="padding: 8px; border: 1px solid #ccc;">Cell 4</td></tr></table><p><br></p>';
      document.execCommand('insertHTML', false, table);
      toast.success("Table inserted!");
    }
  };

  const insertLink = () => {
    const selection = window.getSelection();
    if (!selection || selection.toString().length === 0) {
      toast.error("Please select text first to create a link");
      return;
    }
    const url = prompt('Enter URL (include https://):');
    if (url) {
      execCommand('createLink', url);
      toast.success("Link created!");
    }
  };

  const insertImage = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          if (editorRef.current) {
            editorRef.current.focus();
            const img = `<img src="${e.target?.result}" style="max-width: 100%; height: auto; margin: 10px 0;" /><p><br></p>`;
            document.execCommand('insertHTML', false, img);
            toast.success("Image inserted!");
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  return (
    <>
      <Card className="p-6">
        {/* Toolbar */}
        <div className="space-y-4 mb-4">
          {/* Row 1: File operations and font selection */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={() => setShowSaveDialog(true)}>
              <Save className="h-4 w-4 mr-1" />
              Save to Account
            </Button>
            <Select value={currentProjectId || ""} onValueChange={handleLoadProject}>
              <SelectTrigger className="w-[180px]">
                <FileText className="h-4 w-4 mr-2" />
                <SelectValue placeholder="My Projects" />
              </SelectTrigger>
              <SelectContent>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm" onClick={handleImport}>
              <Upload className="h-4 w-4 mr-1" />
              Import
            </Button>
            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
          <Separator orientation="vertical" className="h-8" />
          <Select value={selectedFont} onValueChange={setSelectedFont}>
            <SelectTrigger className="w-[180px]">
              <Type className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="max-h-[300px]">
              {FONTS.map((font) => (
                <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                  {font}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedSize} onValueChange={(size) => { 
            setSelectedSize(size); 
            applyFontSize(size);
          }}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FONT_SIZES.map((size) => (
                <SelectItem key={size} value={size}>
                  {size}px
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Palette className="h-4 w-4" />
              <input
                type="color"
                value={selectedColor}
                onChange={(e) => {
                  setSelectedColor(e.target.value);
                  execCommand('foreColor', e.target.value);
                }}
                className="w-10 h-8 cursor-pointer"
                title="Text Color"
              />
            </div>
            <div className="flex items-center gap-1">
              <Highlighter className="h-4 w-4" />
              <input
                type="color"
                value={highlightColor}
                onChange={(e) => {
                  setHighlightColor(e.target.value);
                  execCommand('backColor', e.target.value);
                }}
                className="w-10 h-8 cursor-pointer"
                title="Highlight"
              />
            </div>
            <input
              type="color"
              value={bgColor}
              onChange={(e) => setBgColor(e.target.value)}
              className="w-10 h-8 cursor-pointer"
              title="Background Color"
            />
          </div>
        </div>

        {/* Row 2: Text formatting */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => execCommand('bold')} title="Bold">
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('italic')} title="Italic">
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('underline')} title="Underline">
            <Underline className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('strikeThrough')} title="Strikethrough">
            <Strikethrough className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="outline" size="sm" onClick={() => execCommand('justifyLeft')} title="Align Left">
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('justifyCenter')} title="Align Center">
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('justifyRight')} title="Align Right">
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('justifyFull')} title="Justify">
            <AlignJustify className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="outline" size="sm" onClick={() => execCommand('insertUnorderedList')} title="Bullet List">
            <List className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('insertOrderedList')} title="Numbered List">
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="outline" size="sm" onClick={() => applyHeading('h1')} title="Heading 1">
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyHeading('h2')} title="Heading 2">
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => applyHeading('h3')} title="Heading 3">
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        {/* Row 3: Insert and undo/redo */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={insertImage} title="Insert Image">
            <ImageIcon className="h-4 w-4 mr-1" />
            Image
          </Button>
          <Button variant="outline" size="sm" onClick={insertLink} title="Insert Link">
            <Link className="h-4 w-4 mr-1" />
            Link
          </Button>
          <Button variant="outline" size="sm" onClick={insertTable} title="Insert Table">
            <Table className="h-4 w-4 mr-1" />
            Table
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="outline" size="sm" onClick={() => execCommand('undo')} title="Undo">
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('redo')} title="Redo">
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        suppressContentEditableWarning
        className="min-h-[600px] p-8 border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        style={{
          fontFamily: selectedFont,
          fontSize: `${selectedSize}px`,
          lineHeight: "1.6",
          color: selectedColor,
          backgroundColor: bgColor
        }}
        data-placeholder="Start typing..."
      />
      </Card>

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Document Title</label>
              <Input
                value={projectTitle}
                onChange={(e) => setProjectTitle(e.target.value)}
                placeholder="Enter document title"
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveToAccount}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
