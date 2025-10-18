import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo, Redo, Download, Upload, Save, Type, Palette,
  Link, Image as ImageIcon, Table, Heading1, Heading2, Heading3
} from "lucide-react";
import { toast } from "sonner";

const FONTS = [
  "Arial", "Times New Roman", "Georgia", "Verdana", "Courier New", "Comic Sans MS",
  "Impact", "Trebuchet MS", "Palatino", "Garamond", "Bookman", "Avant Garde",
  "Helvetica", "Tahoma", "Monaco", "Lucida Console", "Brush Script MT", "Copperplate",
  "Papyrus", "Century Gothic", "Franklin Gothic", "Gill Sans", "Lucida Sans",
  "Optima", "Perpetua", "Rockwell", "Baskerville", "Didot", "Bodoni",
  "Futura", "Calibri", "Cambria", "Candara", "Consolas", "Constantia", "Corbel"
];

const FONT_SIZES = ["8", "9", "10", "11", "12", "14", "16", "18", "20", "24", "28", "32", "36", "48", "72"];

export function LightPaperDocument() {
  const editorRef = useRef<HTMLDivElement>(null);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedSize, setSelectedSize] = useState("16");
  const [selectedColor, setSelectedColor] = useState("#000000");

  useEffect(() => {
    if (editorRef.current) {
      editorRef.current.style.fontFamily = selectedFont;
    }
  }, [selectedFont]);

  const execCommand = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const handleSave = () => {
    const content = editorRef.current?.innerHTML || "";
    const blob = new Blob([content], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "document.html";
    a.click();
    toast.success("Document saved successfully!");
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
    const table = '<table border="1" style="border-collapse: collapse; width: 100%;"><tr><td style="padding: 8px;">Cell 1</td><td style="padding: 8px;">Cell 2</td></tr><tr><td style="padding: 8px;">Cell 3</td><td style="padding: 8px;">Cell 4</td></tr></table>';
    document.execCommand('insertHTML', false, table);
  };

  const insertLink = () => {
    const url = prompt('Enter URL:');
    if (url) {
      execCommand('createLink', url);
    }
  };

  return (
    <Card className="p-6">
      {/* Toolbar */}
      <div className="space-y-4 mb-4">
        {/* Row 1: File operations and font selection */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={handleSave}>
            <Save className="h-4 w-4 mr-1" />
            Save
          </Button>
          <Button variant="outline" size="sm" onClick={handleImport}>
            <Upload className="h-4 w-4 mr-1" />
            Import
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Download className="h-4 w-4 mr-1" />
            Export
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
          <Select value={selectedSize} onValueChange={(size) => { setSelectedSize(size); execCommand('fontSize', '7'); document.execCommand('fontSize', false, size); }}>
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
            />
          </div>
        </div>

        {/* Row 2: Text formatting */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => execCommand('bold')}>
            <Bold className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('italic')}>
            <Italic className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('underline')}>
            <Underline className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="outline" size="sm" onClick={() => execCommand('justifyLeft')}>
            <AlignLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('justifyCenter')}>
            <AlignCenter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('justifyRight')}>
            <AlignRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('justifyFull')}>
            <AlignJustify className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="outline" size="sm" onClick={() => execCommand('insertUnorderedList')}>
            <List className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('insertOrderedList')}>
            <ListOrdered className="h-4 w-4" />
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="outline" size="sm" onClick={() => execCommand('formatBlock', '<h1>')}>
            <Heading1 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('formatBlock', '<h2>')}>
            <Heading2 className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('formatBlock', '<h3>')}>
            <Heading3 className="h-4 w-4" />
          </Button>
        </div>

        {/* Row 3: Insert and undo/redo */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={insertLink}>
            <Link className="h-4 w-4 mr-1" />
            Link
          </Button>
          <Button variant="outline" size="sm" onClick={insertTable}>
            <Table className="h-4 w-4 mr-1" />
            Table
          </Button>
          <Separator orientation="vertical" className="h-8" />
          <Button variant="outline" size="sm" onClick={() => execCommand('undo')}>
            <Undo className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => execCommand('redo')}>
            <Redo className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Separator className="my-4" />

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        className="min-h-[600px] p-8 bg-white text-foreground border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
        style={{
          fontFamily: selectedFont,
          fontSize: `${selectedSize}px`,
          lineHeight: "1.6"
        }}
        data-placeholder="Start typing..."
      />
    </Card>
  );
}
