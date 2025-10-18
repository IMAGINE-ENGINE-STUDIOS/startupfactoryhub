import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify,
  List, ListOrdered, Undo, Redo, Save, Strikethrough, Calculator, Image, Palette
} from "lucide-react";
import { toast } from "sonner";
import { useLightPaperProjects, LightPaperProject } from "@/hooks/useLightPaperProjects";
import CollapsibleToolbar from "./CollapsibleToolbar";
import FloatingActionMenu from "./FloatingActionMenu";
import { ScientificCalculator } from "@/components/ScientificCalculator";
import { supabase } from "@/integrations/supabase/client";

const FONTS = ["Arial", "Times New Roman", "Georgia", "Verdana", "Courier New", "Roboto", "Open Sans", "Lato", "Montserrat"];
const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32", "36"];

interface LightPaperDocumentProps {
  selectedProject?: LightPaperProject | null;
}

export function LightPaperDocument({ selectedProject }: LightPaperDocumentProps = {}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedSize, setSelectedSize] = useState("16");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Document");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [versionHistory, setVersionHistory] = useState<string[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
  const { saveProject } = useLightPaperProjects("document");

  // Load project when selectedProject changes
  useEffect(() => {
    if (selectedProject && selectedProject.project_type === "document") {
      setCurrentProjectId(selectedProject.id);
      setProjectTitle(selectedProject.title);
      
      const content = selectedProject.content as any;
      if (content) {
        if (content.html && editorRef.current) {
          editorRef.current.innerHTML = content.html;
          saveToHistory(content.html);
        }
        if (content.font) setSelectedFont(content.font);
        if (content.size) setSelectedSize(content.size);
      }
      toast.success("Document loaded");
    }
  }, [selectedProject]);

  // Save to version history
  const saveToHistory = (html: string) => {
    const newHistory = versionHistory.slice(0, currentVersionIndex + 1);
    newHistory.push(html);
    if (newHistory.length > 50) newHistory.shift(); // Keep last 50 versions
    setVersionHistory(newHistory);
    setCurrentVersionIndex(newHistory.length - 1);
  };

  // Handle content changes
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;

    const handleInput = () => {
      saveToHistory(editor.innerHTML);
    };

    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain') || '';
      document.execCommand('insertText', false, text);
    };

    editor.addEventListener('input', handleInput);
    editor.addEventListener('paste', handlePaste);

    return () => {
      editor.removeEventListener('input', handleInput);
      editor.removeEventListener('paste', handlePaste);
    };
  }, []);

  // Navigate version history
  const goToPreviousVersion = () => {
    if (currentVersionIndex > 0 && editorRef.current) {
      const newIndex = currentVersionIndex - 1;
      editorRef.current.innerHTML = versionHistory[newIndex];
      setCurrentVersionIndex(newIndex);
      toast.success("Restored previous version");
    }
  };

  const goToNextVersion = () => {
    if (currentVersionIndex < versionHistory.length - 1 && editorRef.current) {
      const newIndex = currentVersionIndex + 1;
      editorRef.current.innerHTML = versionHistory[newIndex];
      setCurrentVersionIndex(newIndex);
      toast.success("Restored next version");
    }
  };

  const execCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      
      // Ensure the editor maintains focus and execute command
      setTimeout(() => {
        document.execCommand(command, false, value);
      }, 0);
    }
  };

  const applyHeading = (tag: string) => {
    if (!editorRef.current) return;
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString();
    
    if (!selectedText) {
      toast.error("Please select text first");
      return;
    }

    // Create the heading element
    const heading = document.createElement(tag);
    heading.textContent = selectedText;
    
    // Replace the selection with the heading
    range.deleteContents();
    range.insertNode(heading);
    
    // Move cursor after the heading
    range.setStartAfter(heading);
    range.setEndAfter(heading);
    selection.removeAllRanges();
    selection.addRange(range);
    
    toast.success(`Applied ${tag.toUpperCase()}`);
  };

  const resetColors = () => {
    if (editorRef.current && containerRef.current && wrapperRef.current) {
      // Reset editor
      editorRef.current.style.backgroundColor = 'white';
      editorRef.current.style.color = 'black';
      
      // Reset container
      containerRef.current.style.backgroundColor = 'white';
      containerRef.current.style.color = 'black';
      
      // Reset wrapper
      wrapperRef.current.style.backgroundColor = 'white';
      
      toast.success("Colors reset to default");
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) {
        toast.error("Please sign in to upload images");
        return;
      }

      toast.info("Uploading image...");

      const fileName = `${Date.now()}_${file.name}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('feed-media')
        .upload(filePath, file);

      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(uploadError.message);
      }

      const { data } = supabase.storage
        .from('feed-media')
        .getPublicUrl(filePath);

      // Insert image at cursor
      const img = document.createElement('img');
      img.src = data.publicUrl;
      img.style.maxWidth = '100%';
      img.style.height = 'auto';
      
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        range.insertNode(img);
        range.setStartAfter(img);
        range.setEndAfter(img);
        selection.removeAllRanges();
        selection.addRange(range);
      }

      toast.success("Image uploaded successfully");
    } catch (error: any) {
      console.error("Upload error:", error);
      toast.error(error.message || "Failed to upload image");
    }
  };

  const insertCalculatorResult = (value: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand('insertText', false, value);
      setShowCalculator(false);
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
      <CollapsibleToolbar>
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Font Controls */}
          <Select value={selectedFont} onValueChange={(font) => {
            setSelectedFont(font);
            if (editorRef.current) editorRef.current.style.fontFamily = font;
          }}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
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
            <SelectTrigger className="w-16 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {FONT_SIZES.map((size) => (
                <SelectItem key={size} value={size}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Text Formatting */}
          <div className="flex gap-1 border-l pl-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("bold")} title="Bold (Ctrl+B)">
              <Bold className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("italic")} title="Italic (Ctrl+I)">
              <Italic className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("underline")} title="Underline (Ctrl+U)">
              <Underline className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("strikeThrough")} title="Strikethrough">
              <Strikethrough className="h-4 w-4" />
            </Button>
          </div>

          {/* Headings Dropdown */}
          <div className="border-l pl-2">
            <Select value="" onValueChange={applyHeading}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue placeholder="Style" />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                <SelectItem value="p">Normal</SelectItem>
                <SelectItem value="h1">Heading 1</SelectItem>
                <SelectItem value="h2">Heading 2</SelectItem>
                <SelectItem value="h3">Heading 3</SelectItem>
                <SelectItem value="h4">Heading 4</SelectItem>
                <SelectItem value="h5">Heading 5</SelectItem>
                <SelectItem value="h6">Heading 6</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Alignment */}
          <div className="flex gap-1 border-l pl-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("justifyLeft")} title="Align Left">
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("justifyCenter")} title="Align Center">
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("justifyRight")} title="Align Right">
              <AlignRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("justifyFull")} title="Justify">
              <AlignJustify className="h-4 w-4" />
            </Button>
          </div>

          {/* Lists */}
          <div className="flex gap-1 border-l pl-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => {
                editorRef.current?.focus();
                document.execCommand("insertUnorderedList", false);
              }} 
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => {
                editorRef.current?.focus();
                document.execCommand("insertOrderedList", false);
              }} 
              title="Numbered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          {/* Version History Navigation */}
          <div className="flex gap-1 border-l pl-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={goToPreviousVersion}
              disabled={currentVersionIndex <= 0}
              title="Previous Version"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={goToNextVersion}
              disabled={currentVersionIndex >= versionHistory.length - 1}
              title="Next Version"
            >
              <Redo className="h-4 w-4" />
            </Button>
          </div>

          {/* Image Upload */}
          <div className="flex gap-1 border-l pl-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => fileInputRef.current?.click()}
              title="Insert Image"
            >
              <Image className="h-4 w-4" />
            </Button>
          </div>

          {/* Calculator */}
          <div className="flex gap-1 border-l pl-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowCalculator(true)}
              title="Calculator"
            >
              <Calculator className="h-4 w-4" />
            </Button>
          </div>

          {/* Color Reset */}
          <div className="flex gap-1 border-l pl-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={resetColors}
              title="Reset Colors"
            >
              <Palette className="h-4 w-4" />
            </Button>
          </div>

          {/* Save Button */}
          <div className="flex gap-1 border-l pl-2">
            <Button 
              variant="ghost" 
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setShowSaveDialog(true)} 
              title="Save Document (Ctrl+S)"
            >
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CollapsibleToolbar>

      {/* Main Editor Area - Takes Full Height */}
      <div ref={wrapperRef} className="flex-1 overflow-auto p-8 bg-muted/30">
        <div ref={containerRef} className="max-w-4xl mx-auto bg-background shadow-lg rounded-lg p-12 min-h-full">
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

      {/* Calculator */}
      <ScientificCalculator
        isOpen={showCalculator}
        onClose={() => setShowCalculator(false)}
        onInsertResult={insertCalculatorResult}
      />
    </div>
  );
}
