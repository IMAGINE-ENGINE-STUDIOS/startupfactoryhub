import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Undo, Redo, Save, Strikethrough, Calculator, Image, Palette, Moon, Sun, Highlighter, PenLine } from "lucide-react";
import { toast } from "sonner";
import { useLightPaperProjects, LightPaperProject } from "@/hooks/useLightPaperProjects";
import CollapsibleToolbar from "./CollapsibleToolbar";
import FloatingActionMenu from "./FloatingActionMenu";
import { ScientificCalculator } from "@/components/ScientificCalculator";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const FONTS = ["Arial", "Times New Roman", "Georgia", "Verdana", "Courier New", "Roboto", "Open Sans", "Lato", "Montserrat"];
const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32", "36"];
const HIGHLIGHT_COLORS = ["#FFFF00", "#00FF00", "#00FFFF", "#FF00FF", "#FFA500", "transparent"];
interface LightPaperDocumentProps {
  selectedProject?: LightPaperProject | null;
}
export function LightPaperDocument({
  selectedProject
}: LightPaperDocumentProps = {}) {
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
  const [versions, setVersions] = useState<any[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [selectedHighlight, setSelectedHighlight] = useState("#FFFF00");
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signatures, setSignatures] = useState<Array<{type: "draw" | "text", data: string, id: string}>>([]);
  const [signatureMode, setSignatureMode] = useState<"draw" | "text">("draw");
  const [textSignature, setTextSignature] = useState("");
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const [lastSignPos, setLastSignPos] = useState({ x: 0, y: 0 });
  const signCanvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingSignature, setDraggingSignature] = useState<string | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const {
    saveProject
  } = useLightPaperProjects("document");

  // Apply dark mode on initial load
  useEffect(() => {
    setTimeout(() => {
      const pageElement = document.querySelector('.page') as HTMLElement;
      if (pageElement) {
        pageElement.style.backgroundColor = 'black';
        pageElement.style.color = 'white';
      }
      if (editorRef.current) {
        editorRef.current.style.color = 'white';
      }
    }, 100);
  }, []);

  // Initialize signature canvas with transparent background
  useEffect(() => {
    const canvas = signCanvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Clear canvas with transparency
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [showSignDialog]);

  // Load project and versions when selectedProject changes
  useEffect(() => {
    const loadProjectWithVersions = async () => {
      if (selectedProject && selectedProject.project_type === "document") {
        setCurrentProjectId(selectedProject.id);
        setProjectTitle(selectedProject.title);
        const content = selectedProject.content as any;
        if (content) {
          if (content.html && editorRef.current) {
            editorRef.current.innerHTML = content.html;
          }
          if (content.font) setSelectedFont(content.font);
          if (content.size) setSelectedSize(content.size);
        }

        // Load version history for this session
        await loadVersionHistory();
        toast.success("Document loaded");
      }
    };
    loadProjectWithVersions();
  }, [selectedProject]);

  // Cleanup temporary versions on logout or unmount
  useEffect(() => {
    const cleanupOnLogout = async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          await supabase.from('document_versions').delete().eq('user_id', user.id).eq('session_id', sessionId).eq('is_temporary', true);
        }
      } catch (error) {
        console.error('Error cleaning up versions:', error);
      }
    };

    // Listen for auth state changes
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange(event => {
      if (event === 'SIGNED_OUT') {
        cleanupOnLogout();
      }
    });

    // Cleanup on unmount
    return () => {
      subscription.unsubscribe();
      cleanupOnLogout();
    };
  }, [sessionId]);

  // Load version history from database
  const loadVersionHistory = async () => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      const {
        data,
        error
      } = await supabase.from('document_versions').select('*').eq('user_id', user.id).eq('session_id', sessionId).eq('is_temporary', true).order('version_number', {
        ascending: true
      });
      if (error) throw error;
      if (data && data.length > 0) {
        setVersions(data);
        setCurrentVersionIndex(data.length - 1);
      }
    } catch (error) {
      console.error('Error loading version history:', error);
    }
  };

  // Save version to database
  const saveVersionToDatabase = async (html: string) => {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;
      const versionNumber = versions.length;
      const {
        data,
        error
      } = await supabase.from('document_versions').insert({
        user_id: user.id,
        project_id: currentProjectId,
        session_id: sessionId,
        content: {
          html,
          font: selectedFont,
          size: selectedSize
        },
        version_number: versionNumber,
        is_temporary: true
      }).select().single();
      if (error) throw error;
      if (data) {
        setVersions([...versions, data]);
        setCurrentVersionIndex(versions.length);
      }
    } catch (error) {
      console.error('Error saving version:', error);
    }
  };

  // Auto-save version with debounce
  const autoSaveVersion = (html: string) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveVersionToDatabase(html);
    }, 2000); // Save after 2 seconds of inactivity
  };

  // Handle content changes and auto-save
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor) return;
    const handleInput = () => {
      autoSaveVersion(editor.innerHTML);
    };
    const handlePaste = (e: ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData?.getData('text/plain') || '';
      document.execCommand('insertText', false, text);
    };
    const handleMouseUp = () => {
      if (isHighlighterActive) {
        const selection = window.getSelection();
        if (selection && selection.toString().length > 0) {
          applyHighlight(selectedHighlight);
        }
      }
    };
    editor.addEventListener('input', handleInput);
    editor.addEventListener('paste', handlePaste);
    editor.addEventListener('mouseup', handleMouseUp);
    return () => {
      editor.removeEventListener('input', handleInput);
      editor.removeEventListener('paste', handlePaste);
      editor.removeEventListener('mouseup', handleMouseUp);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [versions, selectedFont, selectedSize, isHighlighterActive, selectedHighlight]);

  // Navigate version history from database
  const goToPreviousVersion = async () => {
    if (currentVersionIndex > 0 && editorRef.current && versions.length > 0) {
      const newIndex = currentVersionIndex - 1;
      const version = versions[newIndex];
      if (version && version.content) {
        editorRef.current.innerHTML = version.content.html;
        if (version.content.font) setSelectedFont(version.content.font);
        if (version.content.size) setSelectedSize(version.content.size);
        setCurrentVersionIndex(newIndex);
        toast.success(`Restored version ${newIndex + 1}`);
      }
    } else {
      toast.info("No previous versions available");
    }
  };
  const goToNextVersion = async () => {
    if (currentVersionIndex < versions.length - 1 && editorRef.current) {
      const newIndex = currentVersionIndex + 1;
      const version = versions[newIndex];
      if (version && version.content) {
        editorRef.current.innerHTML = version.content.html;
        if (version.content.font) setSelectedFont(version.content.font);
        if (version.content.size) setSelectedSize(version.content.size);
        setCurrentVersionIndex(newIndex);
        toast.success(`Restored version ${newIndex + 1}`);
      }
    } else {
      toast.info("No later versions available");
    }
  };
  const execCommand = (command: string, value?: string) => {
    if (editorRef.current) {
      editorRef.current.focus();

      // Ensure the editor maintains focus and execute command
      setTimeout(() => {
        document.execCommand(command, false, value);
        
        // Show toast for list commands
        if (command === "insertUnorderedList") {
          toast.success("Bullet list created");
        } else if (command === "insertOrderedList") {
          toast.success("Numbered list created");
        }
      }, 0);
    }
  };
  const applyHeading = (tag: string) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      toast.error("Please select text first");
      return;
    }

    // Use formatBlock for proper heading formatting
    try {
      document.execCommand('formatBlock', false, `<${tag}>`);
      toast.success(`Applied ${tag.toUpperCase()}`);
    } catch (error) {
      console.error('Error applying heading:', error);
      toast.error("Failed to apply heading");
    }
  };
  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    
    const pageElement = document.querySelector('.page') as HTMLElement;
    
    if (newDarkMode) {
      // Dark mode: black background, white text
      if (pageElement) {
        pageElement.style.backgroundColor = 'black';
        pageElement.style.color = 'white';
        
        // Update list styles for dark mode
        const lists = pageElement.querySelectorAll('ul, ol, li');
        lists.forEach((list) => {
          (list as HTMLElement).style.color = 'white';
        });
      }
      if (editorRef.current) {
        editorRef.current.style.color = 'white';
      }
      toast.success("Dark mode enabled");
    } else {
      // Light mode: white background, black text
      if (pageElement) {
        pageElement.style.backgroundColor = 'white';
        pageElement.style.color = 'black';
        
        // Update list styles for light mode
        const lists = pageElement.querySelectorAll('ul, ol, li');
        lists.forEach((list) => {
          (list as HTMLElement).style.color = 'black';
        });
      }
      if (editorRef.current) {
        editorRef.current.style.color = 'black';
      }
      toast.success("Light mode enabled");
    }
  };

  const applyHighlight = (color: string) => {
    if (editorRef.current) {
      editorRef.current.focus();
      execCommand("hiliteColor", color);
      if (color === "transparent") {
        toast.success("Highlight removed");
        setIsHighlighterActive(false);
      } else {
        toast.success("Text highlighted");
      }
    }
  };

  const activateHighlighter = (color: string) => {
    setSelectedHighlight(color);
    if (color === "transparent") {
      setIsHighlighterActive(false);
      toast.info("Highlighter deactivated");
    } else {
      setIsHighlighterActive(true);
      toast.success("Highlighter active - select text to highlight");
    }
  };

  // Signature functions
  const startDrawingSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (signatureMode !== "draw") return;
    setIsDrawingSignature(true);
    const canvas = signCanvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      setLastSignPos({ x, y });
    }
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingSignature || signatureMode !== "draw") return;
    const canvas = signCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      ctx.beginPath();
      ctx.moveTo(lastSignPos.x, lastSignPos.y);
      ctx.lineTo(x, y);
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 2;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.stroke();

      setLastSignPos({ x, y });
    }
  };

  const stopDrawingSignature = () => {
    if (isDrawingSignature && signCanvasRef.current) {
      // Save as PNG with transparent background
      const signatureData = signCanvasRef.current.toDataURL('image/png');
      setSignatures([
        ...signatures,
        {
          type: "draw",
          data: signatureData,
          id: Date.now().toString()
        }
      ]);
      clearSignCanvas();
      toast.success("Signature saved!");
    }
    setIsDrawingSignature(false);
  };

  const clearSignCanvas = () => {
    const canvas = signCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  };

  const addTextSignature = () => {
    if (!textSignature.trim()) {
      toast.error("Please enter text for signature");
      return;
    }
    setSignatures([
      ...signatures,
      {
        type: "text",
        data: textSignature,
        id: Date.now().toString()
      }
    ]);
    setTextSignature("");
    toast.success("Signature added!");
  };

  const insertSignature = (signature: {type: "draw" | "text", data: string, id: string}) => {
    if (!editorRef.current) return;
    
    const signatureElement = document.createElement('div');
    signatureElement.contentEditable = "false";
    signatureElement.draggable = true;
    signatureElement.id = `sig-${signature.id}`;
    signatureElement.dataset.signatureId = signature.id;
    signatureElement.style.cssText = `
      display: inline-block;
      cursor: move;
      padding: 8px;
      border: 2px dashed #ccc;
      margin: 4px;
      background: transparent;
      position: relative;
    `;

    if (signature.type === "draw") {
      const img = document.createElement('img');
      img.src = signature.data;
      img.style.cssText = "height: 60px; display: block; pointer-events: none;";
      signatureElement.appendChild(img);
    } else {
      signatureElement.style.fontFamily = "cursive";
      signatureElement.style.fontSize = "24px";
      signatureElement.textContent = signature.data;
      signatureElement.style.color = isDarkMode ? 'white' : 'black';
    }

    signatureElement.ondragstart = (e) => {
      e.dataTransfer!.effectAllowed = "move";
      e.dataTransfer!.setData("text/html", signatureElement.outerHTML);
      e.dataTransfer!.setData("signatureId", signature.id);
      setDraggingSignature(signature.id);
    };

    signatureElement.ondragend = () => {
      setDraggingSignature(null);
    };

    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      range.insertNode(signatureElement);
      range.setStartAfter(signatureElement);
      range.setEndAfter(signatureElement);
      selection.removeAllRanges();
      selection.addRange(range);
    }

    setShowSignDialog(false);
    toast.success("Signature inserted! Drag to reposition");
  };

  const deleteSignature = (id: string) => {
    setSignatures(signatures.filter(sig => sig.id !== id));
    toast.success("Signature removed!");
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
      const {
        error: uploadError
      } = await supabase.storage.from('feed-media').upload(filePath, file);
      if (uploadError) {
        console.error("Upload error:", uploadError);
        throw new Error(uploadError.message);
      }
      const {
        data
      } = supabase.storage.from('feed-media').getPublicUrl(filePath);

      // Insert image at cursor with strict container constraints
      const img = document.createElement('img');
      img.src = data.publicUrl;
      img.style.maxWidth = '100%';
      img.style.width = 'auto';
      img.style.height = 'auto';
      img.style.objectFit = 'contain';
      img.style.display = 'block';
      img.style.margin = '10px 0';
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
      size: selectedSize
    };
    const result = await saveProject(projectTitle, "document", content, currentProjectId || undefined);
    if (result) {
      setCurrentProjectId(result.id);
      setShowSaveDialog(false);

      // Clean up temporary versions on save
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (user) {
          await supabase.from('document_versions').delete().eq('user_id', user.id).eq('session_id', sessionId).eq('is_temporary', true);
          setVersions([]);
          setCurrentVersionIndex(-1);
          toast.success("Document saved and temporary versions cleared");
        }
      } catch (error) {
        console.error('Error cleaning up versions:', error);
      }
    }
  };
  const handlePrint = () => {
    window.print();
  };
  return <div className="flex flex-col h-[calc(100vh-12rem)]">
      <CollapsibleToolbar>
        <div className="flex items-center gap-2 overflow-x-auto">
          {/* Font Controls */}
          <Select value={selectedFont} onValueChange={font => {
          setSelectedFont(font);
          if (editorRef.current) editorRef.current.style.fontFamily = font;
        }}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {FONTS.map(font => <SelectItem key={font} value={font} style={{
              fontFamily: font
            }}>
                  {font}
                </SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={selectedSize} onValueChange={size => {
          setSelectedSize(size);
          if (editorRef.current) editorRef.current.style.fontSize = `${size}px`;
        }}>
            <SelectTrigger className="w-16 h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-background z-50">
              {FONT_SIZES.map(size => <SelectItem key={size} value={size}>{size}</SelectItem>)}
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
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("insertUnorderedList")} title="Bullet List">
              <List className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("insertOrderedList")} title="Numbered List">
              <ListOrdered className="h-4 w-4" />
            </Button>
          </div>

          {/* Version History Navigation */}
          

          {/* Image Upload */}
          <div className="flex gap-1 border-l pl-2">
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => fileInputRef.current?.click()} title="Insert Image">
              <Image className="h-4 w-4" />
            </Button>
          </div>

          {/* Calculator */}
          <div className="flex gap-1 border-l pl-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowCalculator(true)} title="Calculator">
              <Calculator className="h-4 w-4" />
            </Button>
          </div>

          {/* Highlight */}
          <div className="flex gap-1 border-l pl-2">
            <Select value={selectedHighlight} onValueChange={activateHighlighter}>
              <SelectTrigger className={`w-28 h-8 text-xs ${isHighlighterActive ? 'bg-primary/20 border-primary' : ''}`}>
                <Highlighter className="h-4 w-4 mr-1" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background z-50">
                {HIGHLIGHT_COLORS.map(color => (
                  <SelectItem key={color} value={color}>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border" style={{ backgroundColor: color }} />
                      {color === "transparent" ? "None" : color}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Signature */}
          <div className="flex gap-1 border-l pl-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSignDialog(true)} title="Add Signature">
              <PenLine className="h-4 w-4" />
            </Button>
          </div>

          {/* Dark/Light Mode Toggle */}
          <div className="flex gap-1 border-l pl-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={toggleDarkMode} title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
              {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
          </div>

          {/* Save Button */}
          <div className="flex gap-1 border-l pl-2">
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSaveDialog(true)} title="Save Document (Ctrl+S)">
              <Save className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CollapsibleToolbar>

      {/* Main Editor Area - Takes Full Height with Pages */}
      <div ref={wrapperRef} className="flex-1 overflow-auto p-8 bg-muted/30">
        <style>{`
          .page {
            width: 21cm;
            min-height: 29.7cm;
            padding: 2cm;
            margin: 1cm auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            page-break-after: always;
          }
          
          /* List Styles */
          .page ul {
            list-style-type: disc;
            padding-left: 40px;
            margin: 16px 0;
          }
          
          .page ol {
            list-style-type: decimal;
            padding-left: 40px;
            margin: 16px 0;
          }
          
          .page li {
            margin: 8px 0;
            padding-left: 8px;
            display: list-item;
          }
          
          /* Nested lists */
          .page ul ul {
            list-style-type: circle;
            margin: 4px 0;
          }
          
          .page ul ul ul {
            list-style-type: square;
          }
          
          .page ol ol {
            list-style-type: lower-alpha;
            margin: 4px 0;
          }
          
          .page ol ol ol {
            list-style-type: lower-roman;
          }
          
          @media print {
            .page {
              margin: 0;
              box-shadow: none;
              page-break-after: always;
            }
          }
        `}</style>
        <div ref={containerRef} className="max-w-[21cm] mx-auto">
          <div className="page">
            <div 
              ref={editorRef} 
              contentEditable 
              className="outline-none min-h-full prose prose-lg max-w-none" 
              style={{
                fontFamily: selectedFont,
                fontSize: `${selectedSize}px`,
                wordWrap: 'break-word',
                overflowWrap: 'break-word'
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const signatureHtml = e.dataTransfer.getData("text/html");
                const signatureId = e.dataTransfer.getData("signatureId");
                
                if (signatureHtml && editorRef.current) {
                  // Remove old signature element if it exists
                  const oldElement = document.querySelector(`[data-signature-id="${signatureId}"]`);
                  if (oldElement) {
                    oldElement.remove();
                  }

                  // Get the drop position
                  const range = document.caretRangeFromPoint(e.clientX, e.clientY);
                  if (range) {
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = signatureHtml;
                    const signatureElement = tempDiv.firstChild as HTMLElement;
                    
                    if (signatureElement) {
                      range.insertNode(signatureElement);
                      range.setStartAfter(signatureElement);
                      range.setEndAfter(signatureElement);
                      
                      const selection = window.getSelection();
                      if (selection) {
                        selection.removeAllRanges();
                        selection.addRange(range);
                      }
                    }
                  }
                }
                setDraggingSignature(null);
              }}
              suppressContentEditableWarning
            >
              <p>Start typing your document here...</p>
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Menu */}
      <FloatingActionMenu onSave={() => setShowSaveDialog(true)} onPrint={handlePrint} />

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Document</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Document Title</Label>
              <Input id="title" value={projectTitle} onChange={e => setProjectTitle(e.target.value)} placeholder="Enter document title" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)}>Cancel</Button>
              <Button onClick={handleSaveToAccount}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Calculator */}
      <ScientificCalculator isOpen={showCalculator} onClose={() => setShowCalculator(false)} onInsertResult={insertCalculatorResult} />

      {/* Signature Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Signature</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Tabs value={signatureMode} onValueChange={(v) => setSignatureMode(v as any)}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="draw">Draw</TabsTrigger>
                  <TabsTrigger value="text">Type</TabsTrigger>
                </TabsList>
                
                <TabsContent value="draw" className="space-y-3">
                  <div className="relative">
                    <canvas
                      ref={signCanvasRef}
                      width={400}
                      height={200}
                      className="border rounded cursor-crosshair w-full bg-transparent"
                      style={{ 
                        backgroundColor: 'transparent',
                        backgroundImage: 'repeating-conic-gradient(#d1d5db 0% 25%, transparent 0% 50%) 50% / 20px 20px'
                      }}
                      onMouseDown={startDrawingSignature}
                      onMouseMove={drawSignature}
                      onMouseUp={stopDrawingSignature}
                      onMouseLeave={stopDrawingSignature}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">Draw your signature above. It will be saved with a transparent background.</p>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={clearSignCanvas} variant="outline" className="flex-1">
                      Clear
                    </Button>
                    <Button size="sm" onClick={stopDrawingSignature} className="flex-1">
                      Save
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="text" className="space-y-3">
                  <Label>Signature Text</Label>
                  <Input
                    value={textSignature}
                    onChange={(e) => setTextSignature(e.target.value)}
                    placeholder="Your Name"
                    className="font-signature text-2xl"
                    style={{ fontFamily: "cursive" }}
                  />
                  <Button onClick={addTextSignature} className="w-full">
                    Add Signature
                  </Button>
                </TabsContent>
              </Tabs>
            </div>

            <div>
              <h3 className="font-medium mb-3">Saved Signatures ({signatures.length})</h3>
              <div className="space-y-2 max-h-[300px] overflow-auto">
                {signatures.map((sig) => (
                  <div key={sig.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex-1 cursor-pointer" onClick={() => insertSignature(sig)}>
                      {sig.type === "draw" ? (
                        <img src={sig.data} alt="Signature" className="h-12" />
                      ) : (
                        <span className="text-xl" style={{ fontFamily: "cursive" }}>
                          {sig.data}
                        </span>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => insertSignature(sig)}>
                        Insert
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => deleteSignature(sig.id)}>
                        Delete
                      </Button>
                    </div>
                  </div>
                ))}
                {signatures.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No signatures yet
                  </p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>;
}