import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, AlignJustify, List, ListOrdered, Undo, Redo, Save, Strikethrough, Calculator, Image, Palette, Moon, Sun, Highlighter, PenLine, Download, FileText, Search, Keyboard, MessageSquare, Users, WifiOff, Wifi, Upload, ZoomIn, ZoomOut, Maximize2, Eye, Edit3, Plus, Pipette, FlipHorizontal, FileType } from "lucide-react";
import { toast } from "sonner";
import { useLightPaperProjects, LightPaperProject } from "@/hooks/useLightPaperProjects";
import CollapsibleToolbar from "./CollapsibleToolbar";
import FloatingActionMenu from "./FloatingActionMenu";
import { ScientificCalculator } from "@/components/ScientificCalculator";
import { SearchDialog } from "./SearchDialog";
import { ShortcutsDialog } from "./ShortcutsDialog";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommandHistory, Command } from "@/lib/commandHistory";
import { useKeyboardShortcuts } from "@/hooks/useKeyboardShortcuts";
import { useDocumentCollaboration } from "@/hooks/useDocumentCollaboration";
import { LiveCursors } from "./LiveCursors";
import { CommentsSidebar } from "./CommentsSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { useNetworkStatus } from "@/hooks/useNetworkStatus";
import { sanitizeHTML } from "@/utils/sanitize";
import { MobileToolbar } from "./MobileToolbar";
import { FileUploadDialog } from "./FileUploadDialog";
import { OverlayTextBox } from "./OverlayTextBox";
import { AIToolbar } from "./AIToolbar";

const FONTS = ["Arial", "Times New Roman", "Georgia", "Verdana", "Courier New", "Roboto", "Open Sans", "Lato", "Montserrat"];
const FONT_SIZES = ["12", "14", "16", "18", "20", "24", "28", "32", "36"];
const HIGHLIGHT_COLORS = ["#FFFF00", "#00FF00", "#00FFFF", "#FF00FF", "#FFA500", "transparent"];
const TEXT_COLORS = ["#000000", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#FFFFFF"];

// Page format configurations (dimensions in cm) - EXPANDED
const PAGE_FORMATS = {
  letter: { width: 21.59, height: 27.94, name: "Letter (8.5\" × 11\")" },
  legal: { width: 21.59, height: 35.56, name: "Legal (8.5\" × 14\")" },
  tabloid: { width: 27.94, height: 43.18, name: "Tabloid (11\" × 17\")" },
  a3: { width: 29.7, height: 42.0, name: "A3" },
  a4: { width: 21.0, height: 29.7, name: "A4" },
  a5: { width: 14.8, height: 21.0, name: "A5" },
  b4: { width: 25.0, height: 35.3, name: "B4" },
  b5: { width: 17.6, height: 25.0, name: "B5" },
  executive: { width: 18.4, height: 26.7, name: "Executive (7.25\" × 10.5\")" },
  folio: { width: 21.0, height: 33.0, name: "Folio (8.27\" × 13\")" }
};

const MARGIN_CM = 2.54; // 1 inch standard margin
const CM_TO_PX = 37.795275591; // Conversion factor for cm to pixels at 96dpi

type PageFormat = keyof typeof PAGE_FORMATS;
type Orientation = "portrait" | "landscape";

interface OverlayTextBoxData {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  backgroundColor: string;
  borderVisible: boolean;
}

interface LightPaperDocumentProps {
  selectedProject?: LightPaperProject | null;
  uploadedContent?: { content: string; title: string } | null;
  onContentLoaded?: () => void;
}

export function LightPaperDocument({
  selectedProject,
  uploadedContent,
  onContentLoaded
}: LightPaperDocumentProps = {}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFont, setSelectedFont] = useState("Arial");
  const [selectedSize, setSelectedSize] = useState("14");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [projectTitle, setProjectTitle] = useState("Untitled Document");
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [currentVersionIndex, setCurrentVersionIndex] = useState(-1);
  const [sessionId] = useState(() => `session_${Date.now()}_${Math.random()}`);
  const [isDarkMode, setIsDarkMode] = useState(false); // Default to light mode
  const [selectedHighlight, setSelectedHighlight] = useState("#FFFF00");
  const [isHighlighterActive, setIsHighlighterActive] = useState(false);
  const [selectedTextColor, setSelectedTextColor] = useState("#000000");
  
  // Get today's date for default content
  const today = new Date();
  const dateStr = today.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
  
  const [documentContent, setDocumentContent] = useState(`
    <h1 style="font-size: 14pt; font-weight: bold; margin-bottom: 0.5em; color: inherit;">Document Title</h1>
    <p style="font-size: 14pt; margin-bottom: 1.5em; color: inherit; opacity: 0.7;">${dateStr}</p>
    <p style="font-size: 14pt; color: inherit;">Start writing your document...</p>
  `);
  const [showSignDialog, setShowSignDialog] = useState(false);
  const [signatures, setSignatures] = useState<Array<{type: "draw" | "text", data: string, id: string}>>([]);
  const [signatureMode, setSignatureMode] = useState<"draw" | "text">("draw");
  const [textSignature, setTextSignature] = useState("");
  const [isDrawingSignature, setIsDrawingSignature] = useState(false);
  const lastSignPosRef = useRef({ x: 0, y: 0 });
  const signCanvasRef = useRef<HTMLCanvasElement>(null);
  const [draggingSignature, setDraggingSignature] = useState<{type: "draw" | "text", data: string, id: string} | null>(null);
  const [signaturePreviewPosition, setSignaturePreviewPosition] = useState<{x: number, y: number} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [showSearchDialog, setShowSearchDialog] = useState(false);
  const [showShortcutsDialog, setShowShortcutsDialog] = useState(false);
  const [searchMatches, setSearchMatches] = useState<number[]>([]);
  const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
  const [showComments, setShowComments] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(0.75);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const commandHistory = useRef(new CommandHistory());
  const { user } = useAuth();
  const { isOnline } = useNetworkStatus();
  
  // Page format and view mode states
  const [pageFormat, setPageFormat] = useState<PageFormat>("a4");
  const [orientation, setOrientation] = useState<Orientation>("portrait");
  const [viewMode, setViewMode] = useState(false);
  const [viewModeImages, setViewModeImages] = useState<string[]>([]);
  const [overlayTextBoxes, setOverlayTextBoxes] = useState<OverlayTextBoxData[]>([]);
  const [isColorPickerActive, setIsColorPickerActive] = useState(false);
  const [selectedTextBoxId, setSelectedTextBoxId] = useState<string | null>(null);
  const [isEditingText, setIsEditingText] = useState(false);
  const {
    saveProject
  } = useLightPaperProjects("document");

  // Real-time collaboration
  const {
    cursors,
    comments,
    myColor,
    addComment,
    updateComment,
    deleteComment,
    updateCursor,
  } = useDocumentCollaboration({
    projectId: currentProjectId,
    enabled: !!currentProjectId,
  });

  // Throttled cursor position tracking
  useEffect(() => {
    const editor = editorRef.current;
    if (!editor || !currentProjectId) return;

    let lastUpdate = 0;
    const THROTTLE_MS = 100; // Update max 10 times per second

    const handleMouseMove = (e: MouseEvent) => {
      const now = Date.now();
      if (now - lastUpdate < THROTTLE_MS) return;

      const rect = editor.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;

      updateCursor(x, y);
      lastUpdate = now;
    };

    editor.addEventListener('mousemove', handleMouseMove);
    return () => editor.removeEventListener('mousemove', handleMouseMove);
  }, [currentProjectId, updateCursor]);

  // Remove hard-coded dark mode styles - use theme-aware classes instead
  // This effect now does nothing intentionally - theme is handled by CSS
  useEffect(() => {
    // Removed hard-coded backgroundColor and color styles
    // Theme is now properly handled by CSS variables
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

  // Initialize signature canvas when dialog opens
  useEffect(() => {
    if (showSignDialog && signCanvasRef.current) {
      const canvas = signCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        // Clear canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        // Set drawing properties
        ctx.strokeStyle = "#000000";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
      }
    }
  }, [showSignDialog]);

  // Load uploaded content - ENHANCED for View Mode
  useEffect(() => {
    if (!uploadedContent || !editorRef.current) return;
    
    console.log('Loading uploaded content');
    
    try {
      // TRY TO PARSE AS JSON (View Mode)
      const parsed = JSON.parse(uploadedContent.content);
      
      if (parsed.mode === 'view' && parsed.images) {
        // VIEW MODE: Render as images
        console.log(`View Mode: ${parsed.images.length} pages`);
        setViewMode(true);
        setViewModeImages(parsed.images);
        setTotalPages(parsed.images.length);
        setCurrentPage(1);
        
        // Set format if detected
        if (parsed.detectedFormat) {
          setPageFormat(parsed.detectedFormat);
          toast.info(`Format detected: ${parsed.detectedFormat.toUpperCase()}`);
        }
        
        // Clear editor content in view mode
        editorRef.current.innerHTML = '';
        setDocumentContent('');
        
        toast.success(`Document loaded in View Mode: ${parsed.images.length} pages`);
      }
    } catch (e) {
      // NOT JSON: Regular HTML content (Edit Mode)
      console.log('Edit Mode: Loading HTML content');
      setViewMode(false);
      setViewModeImages([]);
      
      const parser = new DOMParser();
      const doc = parser.parseFromString(uploadedContent.content, 'text/html');
      const pages = doc.querySelectorAll('.pdf-page-reconstructed, .docx-page-wrapper');
      const pageCount = pages.length > 0 ? pages.length : 1;
      
      setDocumentContent(uploadedContent.content);
      setTotalPages(pageCount);
      setCurrentPage(1);
      
      if (pages.length > 0) {
        editorRef.current.innerHTML = pages[0].outerHTML;
      } else {
        editorRef.current.innerHTML = uploadedContent.content;
      }
      
      toast.success(`Document loaded: ${pageCount} pages`);
    }
    
    setProjectTitle(uploadedContent.title);
    setCurrentProjectId(null);
    onContentLoaded?.();
  }, [uploadedContent, onContentLoaded]);

  // Sync documentContent to editor when it changes (but not during user input)
  const isUserTyping = useRef(false);
  useEffect(() => {
    if (editorRef.current && documentContent && !isUserTyping.current) {
      // Parse content to extract the current page
      const parser = new DOMParser();
      const doc = parser.parseFromString(documentContent, 'text/html');
      const pages = doc.querySelectorAll('.pdf-page-reconstructed, .docx-page-wrapper');
      
      if (pages.length > 0) {
        // Display only the current page
        const currentPageElement = pages[currentPage - 1];
        if (currentPageElement) {
          editorRef.current.innerHTML = currentPageElement.outerHTML;
        }
      } else {
        // No structured pages, display all content
        editorRef.current.innerHTML = documentContent;
      }
    }
  }, [documentContent, currentPage]);

  // Load project and versions when selectedProject changes
  useEffect(() => {
    if (!selectedProject || selectedProject.project_type !== "document") return;
    const loadProjectWithVersions = async () => {
      setCurrentProjectId(selectedProject.id);
      setProjectTitle(selectedProject.title);
      const content = selectedProject.content as any;
      
      if (content) {
        if (content.html) {
          setDocumentContent(content.html);
          
          // Count pages
          const parser = new DOMParser();
          const doc = parser.parseFromString(content.html, 'text/html');
          const pages = doc.querySelectorAll('.pdf-page-reconstructed, .docx-page-wrapper');
          const pageCount = pages.length > 0 ? pages.length : 1;
          
          setTotalPages(content.totalPages || pageCount);
          setCurrentPage(content.currentPage || 1);
          
          // Load the appropriate page
          if (pages.length > 0 && editorRef.current) {
            const pageIndex = (content.currentPage || 1) - 1;
            editorRef.current.innerHTML = pages[pageIndex]?.outerHTML || pages[0].outerHTML;
          } else if (editorRef.current) {
            editorRef.current.innerHTML = content.html;
          }
        }
        if (content.font) setSelectedFont(content.font);
        if (content.size) setSelectedSize(content.size);
        
        // Restore dark mode state
        if (content.darkMode !== undefined) {
          setIsDarkMode(content.darkMode);
          const pageElement = document.querySelector('.page') as HTMLElement;
          if (pageElement) {
            pageElement.style.backgroundColor = content.darkMode ? 'black' : 'white';
            pageElement.style.color = content.darkMode ? 'white' : 'black';
          }
          if (editorRef.current) {
            editorRef.current.style.color = content.darkMode ? 'white' : 'black';
          }
        }
        
        // Restore page format and view mode states
        if (content.pageFormat) setPageFormat(content.pageFormat);
        if (content.orientation) setOrientation(content.orientation);
        if (content.viewMode !== undefined) setViewMode(content.viewMode);
        if (content.overlayTextBoxes) setOverlayTextBoxes(content.overlayTextBoxes);
      }

      // Load version history for this session
      await loadVersionHistory();
      
      // Clean up old versions on load
      if (user?.id) {
        const { cleanupOldVersions } = await import('@/utils/versionCleanup');
        const result = await cleanupOldVersions(user.id);
        if (result.success && result.deletedCount > 0) {
          console.log(`Cleaned up ${result.deletedCount} old versions`);
        }
      }
      
      toast.success("Document loaded");
    };
    
    loadProjectWithVersions();
  }, [selectedProject?.id]);

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
          size: selectedSize,
          darkMode: isDarkMode
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
      isUserTyping.current = true;
      const html = editor.innerHTML;
      setDocumentContent(html); // Update state
      autoSaveVersion(html);
      setTimeout(() => {
        isUserTyping.current = false;
      }, 100);
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
  }, [isHighlighterActive, selectedHighlight]);

  // Navigate version history from database
  const goToPreviousVersion = async () => {
    if (currentVersionIndex > 0 && editorRef.current && versions.length > 0) {
      const newIndex = currentVersionIndex - 1;
      const version = versions[newIndex];
      if (version && version.content) {
        editorRef.current.innerHTML = version.content.html;
        if (version.content.font) setSelectedFont(version.content.font);
        if (version.content.size) setSelectedSize(version.content.size);
        if (version.content.darkMode !== undefined) {
          setIsDarkMode(version.content.darkMode);
          const pageElement = document.querySelector('.page') as HTMLElement;
          if (pageElement) {
            pageElement.style.backgroundColor = version.content.darkMode ? 'black' : 'white';
            pageElement.style.color = version.content.darkMode ? 'white' : 'black';
          }
          if (editorRef.current) {
            editorRef.current.style.color = version.content.darkMode ? 'white' : 'black';
          }
        }
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
        if (version.content.darkMode !== undefined) {
          setIsDarkMode(version.content.darkMode);
          const pageElement = document.querySelector('.page') as HTMLElement;
          if (pageElement) {
            pageElement.style.backgroundColor = version.content.darkMode ? 'black' : 'white';
            pageElement.style.color = version.content.darkMode ? 'white' : 'black';
          }
          if (editorRef.current) {
            editorRef.current.style.color = version.content.darkMode ? 'white' : 'black';
          }
        }
        setCurrentVersionIndex(newIndex);
        toast.success(`Restored version ${newIndex + 1}`);
      }
    } else {
      toast.info("No later versions available");
    }
  };

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'b', ctrl: true, handler: () => execCommand('bold'), description: 'Bold' },
    { key: 'i', ctrl: true, handler: () => execCommand('italic'), description: 'Italic' },
    { key: 'u', ctrl: true, handler: () => execCommand('underline'), description: 'Underline' },
    { key: 's', ctrl: true, handler: (e) => { e.preventDefault(); setShowSaveDialog(true); }, description: 'Save' },
    { key: 'z', ctrl: true, handler: () => goToPreviousVersion(), description: 'Undo' },
    { key: 'y', ctrl: true, handler: () => goToNextVersion(), description: 'Redo' },
    { key: 'f', ctrl: true, handler: (e) => { e.preventDefault(); setShowSearchDialog(true); }, description: 'Find' },
    { key: '/', ctrl: true, handler: (e) => { e.preventDefault(); setShowShortcutsDialog(true); }, description: 'Shortcuts' },
  ], true);

  // Search functionality
  const handleSearch = (query: string, options: { caseSensitive: boolean; wholeWord: boolean }) => {
    if (!editorRef.current) return;
    
    const content = editorRef.current.textContent || '';
    const searchContent = options.caseSensitive ? content : content.toLowerCase();
    const searchQuery = options.caseSensitive ? query : query.toLowerCase();
    
    const matches: number[] = [];
    let index = 0;
    
    while (true) {
      index = searchContent.indexOf(searchQuery, index);
      if (index === -1) break;
      matches.push(index);
      index += searchQuery.length;
    }
    
    setSearchMatches(matches);
    setCurrentSearchIndex(0);
    
    if (matches.length > 0) {
      highlightSearchMatch(matches[0], query.length);
      toast.success(`Found ${matches.length} matches`);
    } else {
      toast.info("No matches found");
    }
  };

  const highlightSearchMatch = (index: number, length: number) => {
    if (!editorRef.current) return;
    
    const text = editorRef.current.textContent || '';
    const beforeMatch = text.substring(0, index);
    const match = text.substring(index, index + length);
    const afterMatch = text.substring(index + length);
    
    const highlightedHTML = `${beforeMatch}<mark style="background-color: yellow;">${match}</mark>${afterMatch}`;
    const selection = window.getSelection();
    const range = document.createRange();
    
    // Scroll to the match
    editorRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const goToNextMatch = () => {
    if (searchMatches.length === 0) return;
    const nextIndex = (currentSearchIndex + 1) % searchMatches.length;
    setCurrentSearchIndex(nextIndex);
    const query = editorRef.current?.textContent?.substring(searchMatches[nextIndex], searchMatches[nextIndex] + 10) || '';
    highlightSearchMatch(searchMatches[nextIndex], query.length);
  };

  const goToPreviousMatch = () => {
    if (searchMatches.length === 0) return;
    const prevIndex = (currentSearchIndex - 1 + searchMatches.length) % searchMatches.length;
    setCurrentSearchIndex(prevIndex);
    const query = editorRef.current?.textContent?.substring(searchMatches[prevIndex], searchMatches[prevIndex] + 10) || '';
    highlightSearchMatch(searchMatches[prevIndex], query.length);
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
  const startDrawingSignature = (e: React.MouseEvent<HTMLCanvasElement> | React.Touch) => {
    if (signatureMode !== "draw") return;
    if ('preventDefault' in e) e.preventDefault();
    setIsDrawingSignature(true);
    const canvas = signCanvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;
      lastSignPosRef.current = { x, y };
    }
  };

  const drawSignature = (e: React.MouseEvent<HTMLCanvasElement> | React.Touch) => {
    if (!isDrawingSignature || signatureMode !== "draw") return;
    if ('preventDefault' in e) e.preventDefault();
    
    const canvas = signCanvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (ctx && canvas) {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      const x = (e.clientX - rect.left) * scaleX;
      const y = (e.clientY - rect.top) * scaleY;

      ctx.beginPath();
      ctx.moveTo(lastSignPosRef.current.x, lastSignPosRef.current.y);
      ctx.lineTo(x, y);
      ctx.stroke();

      lastSignPosRef.current = { x, y };
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
      // Reinitialize drawing properties
      ctx.strokeStyle = "#000000";
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      toast.success("Canvas cleared");
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
    setDraggingSignature(signature);
    setShowSignDialog(false);
    toast.info("Move your cursor to position the signature, then click to place it");
  };

  // Handle signature dragging
  useEffect(() => {
    if (!draggingSignature || !containerRef.current) return;

    const pageElement = containerRef.current.querySelector('.page') as HTMLElement;
    if (!pageElement) return;

    const handleMouseMove = (e: MouseEvent) => {
      const pageRect = pageElement.getBoundingClientRect();
      const x = e.clientX - pageRect.left;
      const y = e.clientY - pageRect.top;
      setSignaturePreviewPosition({ x, y });
    };

    const handleClick = (e: MouseEvent) => {
      if (!draggingSignature) return;
      
      const pageRect = pageElement.getBoundingClientRect();
      const x = e.clientX - pageRect.left;
      const y = e.clientY - pageRect.top;

      // Create and place the signature element
      const signatureElement = document.createElement('div');
      signatureElement.contentEditable = "false";
      signatureElement.id = `sig-${draggingSignature.id}`;
      signatureElement.dataset.signatureId = draggingSignature.id;
      signatureElement.style.cssText = `
        position: absolute;
        cursor: move;
        padding: 8px;
        border: 2px dashed transparent;
        background: transparent;
        transition: border-color 0.2s ease;
        left: ${x}px;
        top: ${y}px;
        transform: translate(-50%, -50%);
        z-index: 100;
      `;
      signatureElement.classList.add('signature-element');

      if (draggingSignature.type === "draw") {
        const img = document.createElement('img');
        img.src = draggingSignature.data;
        img.style.cssText = "height: 60px; display: block; pointer-events: none;";
        signatureElement.appendChild(img);
      } else {
        signatureElement.style.fontFamily = "cursive";
        signatureElement.style.fontSize = "24px";
        signatureElement.textContent = draggingSignature.data;
        signatureElement.style.color = 'var(--foreground)'; // Use theme variable
      }

      // Add drag functionality to placed signature
      let isDragging = false;
      let offsetX = 0;
      let offsetY = 0;

      signatureElement.onmousedown = (e) => {
        e.preventDefault();
        e.stopPropagation();
        isDragging = true;
        const rect = signatureElement.getBoundingClientRect();
        offsetX = e.clientX - rect.left;
        offsetY = e.clientY - rect.top;
        signatureElement.style.cursor = 'grabbing';
      };

      const onMouseMove = (e: MouseEvent) => {
        if (!isDragging) return;
        e.preventDefault();
        
        const pageRect = pageElement.getBoundingClientRect();
        let newX = e.clientX - pageRect.left - offsetX;
        let newY = e.clientY - pageRect.top - offsetY;
        
        const sigRect = signatureElement.getBoundingClientRect();
        newX = Math.max(0, Math.min(newX, pageRect.width - sigRect.width));
        newY = Math.max(0, Math.min(newY, pageRect.height - sigRect.height));
        
        signatureElement.style.left = `${newX}px`;
        signatureElement.style.top = `${newY}px`;
        signatureElement.style.transform = 'none';
      };

      const onMouseUp = () => {
        isDragging = false;
        signatureElement.style.cursor = 'move';
      };

      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', onMouseUp);

      signatureElement.addEventListener('dblclick', () => {
        pageElement.removeChild(signatureElement);
        toast.success("Signature removed");
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', onMouseUp);
      });

      pageElement.appendChild(signatureElement);
      toast.success("Signature placed! Double-click to remove");
      
      // Reset dragging state
      setDraggingSignature(null);
      setSignaturePreviewPosition(null);
    };

    pageElement.addEventListener('mousemove', handleMouseMove);
    pageElement.addEventListener('click', handleClick);
    pageElement.style.cursor = 'none';

    return () => {
      pageElement.removeEventListener('mousemove', handleMouseMove);
      pageElement.removeEventListener('click', handleClick);
      pageElement.style.cursor = 'text';
    };
  }, [draggingSignature, isDarkMode]);

  const deleteSignature = (id: string) => {
    setSignatures(signatures.filter(sig => sig.id !== id));
    toast.success("Signature removed!");
  };
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please select an image file");
      return;
    }

    // Validate file size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      toast.error("Image file size must be less than 20MB");
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
    if (!projectTitle.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    try {
      setIsSaving(true);
      // Save full document content including all pages
      const content = {
        html: documentContent || editorRef.current?.innerHTML || "",
        font: selectedFont,
        size: selectedSize,
        darkMode: isDarkMode,
        currentPage,
        totalPages,
        pageFormat,
        orientation,
        viewMode,
        overlayTextBoxes
      };
      const result = await saveProject(projectTitle, "document", content, currentProjectId || undefined);
      if (result) {
        setCurrentProjectId(result.id);
        setLastSaved(new Date());
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
    } catch (error) {
      toast.error("Failed to save document");
    } finally {
      setIsSaving(false);
    }
  };
  const handlePrint = () => {
    window.print();
  };

  const handleExportPDF = () => {
    window.print(); // Uses browser's print to PDF functionality
    toast.success("Print dialog opened - select 'Save as PDF'");
  };

  // Helper function to get current page dimensions based on format and orientation
  const getPageDimensions = () => {
    const format = PAGE_FORMATS[pageFormat];
    const width = orientation === "portrait" ? format.width : format.height;
    const height = orientation === "portrait" ? format.height : format.width;
    return { width, height };
  };

  // Text box management functions
  const addTextBox = () => {
    const newBox: OverlayTextBoxData = {
      id: `textbox_${Date.now()}`,
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      text: "New text box",
      fontSize: 14,
      fontFamily: "Arial",
      color: "#000000",
      backgroundColor: "transparent",
      borderVisible: true
    };
    setOverlayTextBoxes([...overlayTextBoxes, newBox]);
    toast.success("Text box added");
  };

  const updateTextBox = (id: string, updates: Partial<Omit<OverlayTextBoxData, 'id'>>) => {
    setOverlayTextBoxes(boxes =>
      boxes.map(box => box.id === id ? { ...box, ...updates } : box)
    );
  };

  const deleteTextBox = (id: string) => {
    setOverlayTextBoxes(boxes => boxes.filter(box => box.id !== id));
    toast.success("Text box deleted");
  };

  // Color picker function
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isColorPickerActive || !editorRef.current || !selectedTextBoxId) return;

    // Create a temporary canvas to capture the color
    const target = e.target as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Use html2canvas or similar approach - for now, we'll use a simple approach
    // In a real implementation, you'd want to use html2canvas to capture the exact pixel
    const tempCanvas = document.createElement('canvas');
    const ctx = tempCanvas.getContext('2d');
    
    if (ctx) {
      // Get computed background color of clicked element
      const computedStyle = window.getComputedStyle(target);
      const bgColor = computedStyle.backgroundColor;
      
      updateTextBox(selectedTextBoxId, { backgroundColor: bgColor });
      toast.success(`Color picked: ${bgColor}`);
      setIsColorPickerActive(false);
      setSelectedTextBoxId(null);
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Desktop Toolbar */}
      <div className="hidden md:block border-b bg-background">
        <CollapsibleToolbar>
          <div className="flex items-center gap-0.5 overflow-x-auto scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
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
            <div className="flex gap-0.5 border-l pl-1">
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
              
              {/* Text Color Picker */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Text Color">
                    <div className="relative">
                      <Palette className="h-4 w-4" />
                      <div 
                        className="absolute bottom-0 left-0 right-0 h-1 rounded-full"
                        style={{ backgroundColor: selectedTextColor }}
                      />
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-40">
                  <div className="grid grid-cols-5 gap-2 p-2">
                    {TEXT_COLORS.map(color => (
                      <button
                        key={color}
                        className="w-7 h-7 rounded border-2 border-border hover:scale-110 transition-transform"
                        style={{ backgroundColor: color }}
                        onClick={() => {
                          setSelectedTextColor(color);
                          execCommand("foreColor", color);
                        }}
                        title={color}
                      />
                    ))}
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Alignment */}
            <div className="flex gap-0.5 border-l pl-1">
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
            <div className="flex gap-0.5 border-l pl-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("insertUnorderedList")} title="Bullet List">
                <List className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => execCommand("insertOrderedList")} title="Numbered List">
                <ListOrdered className="h-4 w-4" />
              </Button>
            </div>

            {/* Version History Navigation */}
            {versions.length > 0 && (
              <div className="flex gap-0.5 border-l pl-1 items-center">
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
                <span className="text-xs text-muted-foreground px-1 whitespace-nowrap">
                  {currentVersionIndex + 1}/{versions.length}
                </span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0" 
                  onClick={goToNextVersion}
                  disabled={currentVersionIndex >= versions.length - 1}
                  title="Next Version"
                >
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
            )}
            
            
            {/* Image Upload */}
            <div className="flex gap-0.5 border-l pl-1">
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => fileInputRef.current?.click()} title="Insert Image">
                <Image className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowUploadDialog(true)} title="Upload Document (PDF, Word, Google Docs)">
                <Upload className="h-4 w-4" />
              </Button>
            </div>

            {/* Calculator */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowCalculator(true)} title="Calculator">
                <Calculator className="h-4 w-4" />
              </Button>
              <Button 
                variant={editMode ? "default" : "ghost"}
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={() => setEditMode(!editMode)}
                title={editMode ? "Switch to View Mode (full visibility)" : "Switch to Edit Mode (text editing)"}
              >
                {editMode ? 'View' : 'Edit'}
              </Button>
            </div>

            {/* Highlight */}
            <div className="flex gap-0.5 border-l pl-1">
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
            <div className="flex gap-0.5 border-l pl-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSignDialog(true)} title="Add Signature">
                <PenLine className="h-4 w-4" />
              </Button>
            </div>

            {/* Page Format */}
            <div className="flex gap-0.5 border-l pl-1">
              <Select value={pageFormat} onValueChange={(val) => setPageFormat(val as PageFormat)}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {Object.entries(PAGE_FORMATS).map(([key, format]) => (
                    <SelectItem key={key} value={key}>{format.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setOrientation(orientation === "portrait" ? "landscape" : "portrait")}
                title={`Orientation: ${orientation}`}
              >
                <FlipHorizontal className="h-4 w-4" />
              </Button>
            </div>

            {/* View Mode */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button 
                variant={viewMode ? "secondary" : "ghost"}
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setViewMode(!viewMode)}
                title={viewMode ? "Switch to Edit Mode" : "Switch to View Mode"}
              >
                {viewMode ? <Edit3 className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
              {viewMode && (
                <>
                  <Button 
                    variant="ghost"
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={addTextBox}
                    title="Add Text Box"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant={isColorPickerActive ? "secondary" : "ghost"}
                    size="sm" 
                    className="h-8 w-8 p-0" 
                    onClick={() => setIsColorPickerActive(!isColorPickerActive)}
                    title="Color Picker (click element to pick color)"
                  >
                    <Pipette className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>

            {/* Dark/Light Mode Toggle */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={toggleDarkMode} title={isDarkMode ? "Switch to Light Mode" : "Switch to Dark Mode"}>
                {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
            </div>

            {/* Search */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowSearchDialog(true)} title="Find (Ctrl+F)">
                <Search className="h-4 w-4" />
              </Button>
            </div>

            {/* Keyboard Shortcuts */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setShowShortcutsDialog(true)} title="Keyboard Shortcuts (Ctrl+/)">
                <Keyboard className="h-4 w-4" />
              </Button>
            </div>

            {/* Collaboration - Comments */}
            <div className="flex gap-0.5 border-l pl-1">
              <Button 
                variant={showComments ? "secondary" : "ghost"} 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setShowComments(!showComments)} 
                title="Toggle Comments"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>

            {/* Export Options */}
            <div className="flex gap-0.5 border-l pl-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Export">
                    <Download className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="bg-background z-50">
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <FileText className="h-4 w-4 mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handlePrint}>
                    <FileText className="h-4 w-4 mr-2" />
                    Print Document
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Save Button */}
            <div className="flex gap-2 items-center border-l pl-1 ml-auto shrink-0">
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0" 
                onClick={() => setShowSaveDialog(true)} 
                disabled={isSaving}
                title="Save Document (Ctrl+S)"
              >
                <Save className="h-4 w-4" />
              </Button>
              {isSaving && (
                <span className="text-xs text-muted-foreground">
                  Saving...
                </span>
              )}
              {lastSaved && !isSaving && (
                <span className="text-xs text-muted-foreground">
                  Saved {lastSaved.toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </CollapsibleToolbar>
      </div>

      {/* Mobile Toolbar */}
      <div className="md:hidden p-1 border-b bg-background shrink-0">
        <MobileToolbar
          groups={[
            {
              label: "Format",
              actions: [
                { icon: Bold, label: "Bold", onClick: () => execCommand("bold"), priority: "high" },
                { icon: Italic, label: "Italic", onClick: () => execCommand("italic"), priority: "high" },
                { icon: Underline, label: "Underline", onClick: () => execCommand("underline"), priority: "medium" },
                { icon: Strikethrough, label: "Strikethrough", onClick: () => execCommand("strikeThrough"), priority: "low" },
                { icon: Palette, label: "Text Color", onClick: () => {
                  // Cycle through common colors
                  const currentIndex = TEXT_COLORS.indexOf(selectedTextColor);
                  const nextColor = TEXT_COLORS[(currentIndex + 1) % TEXT_COLORS.length];
                  setSelectedTextColor(nextColor);
                  execCommand("foreColor", nextColor);
                }, priority: "medium" },
              ]
            },
            {
              label: "Align",
              actions: [
                { icon: AlignLeft, label: "Left", onClick: () => execCommand("justifyLeft"), priority: "medium" },
                { icon: AlignCenter, label: "Center", onClick: () => execCommand("justifyCenter"), priority: "medium" },
                { icon: AlignRight, label: "Right", onClick: () => execCommand("justifyRight"), priority: "medium" },
              ]
            },
            {
              label: "Page",
              actions: [
                { icon: FileType, label: "Format", onClick: () => {
                  const formats: PageFormat[] = ["letter", "legal", "a4", "a5"];
                  const currentIndex = formats.indexOf(pageFormat);
                  setPageFormat(formats[(currentIndex + 1) % formats.length]);
                }, priority: "low" },
                { icon: FlipHorizontal, label: "Rotate", onClick: () => setOrientation(orientation === "portrait" ? "landscape" : "portrait"), priority: "low" },
                { icon: viewMode ? Edit3 : Eye, label: viewMode ? "Edit" : "View", onClick: () => setViewMode(!viewMode), priority: "medium" },
              ]
            },
            {
              label: "Insert",
              actions: [
                { icon: Upload, label: "Upload Doc", onClick: () => setShowUploadDialog(true), priority: "high" },
                { icon: Image, label: "Image", onClick: () => fileInputRef.current?.click(), priority: "medium" },
                { icon: PenLine, label: "Signature", onClick: () => setShowSignDialog(true), priority: "low" },
                { icon: List, label: "Bullet List", onClick: () => execCommand("insertUnorderedList"), priority: "low" },
                { icon: ListOrdered, label: "Numbered List", onClick: () => execCommand("insertOrderedList"), priority: "low" },
              ]
            },
            {
              label: "Tools",
              actions: [
                { icon: Calculator, label: "Calculator", onClick: () => setShowCalculator(true), priority: "low" },
                { icon: Search, label: "Find", onClick: () => setShowSearchDialog(true), priority: "medium" },
                { icon: Highlighter, label: "Highlight", onClick: () => activateHighlighter(selectedHighlight), priority: "low" },
                { icon: Keyboard, label: "Shortcuts", onClick: () => setShowShortcutsDialog(true), priority: "low" },
              ]
            },
          ]}
          rightActions={[
            { icon: Save, label: "Save", onClick: () => setShowSaveDialog(true), priority: "high" as const, variant: "default" as const, disabled: isSaving },
            { icon: MessageSquare, label: "Comments", onClick: () => setShowComments(!showComments), priority: "high" as const, variant: showComments ? ("default" as const) : ("outline" as const) },
            ...(viewMode ? [
              { icon: Plus, label: "Add Box", onClick: addTextBox, priority: "high" as const },
              { icon: Pipette, label: "Pick Color", onClick: () => setIsColorPickerActive(!isColorPickerActive), priority: "medium" as const, variant: isColorPickerActive ? ("default" as const) : ("outline" as const) },
            ] : []),
            { icon: Download, label: "Export", onClick: handleExportPDF, priority: "medium" as const },
          ]}
        />
      </div>

      {/* Zoom and Page Navigation Controls */}
      <div className="flex items-center justify-between gap-4 px-4 py-1 border-b bg-background shrink-0">
        {/* Status Info */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <FileType className="h-3 w-3" />
            {PAGE_FORMATS[pageFormat].name} - {orientation === "portrait" ? "Portrait" : "Landscape"}
          </span>
          {viewMode && (
            <span className="flex items-center gap-1 text-primary font-medium">
              <Eye className="h-3 w-3" />
              View Mode
            </span>
          )}
          {isColorPickerActive && (
            <span className="flex items-center gap-1 text-accent font-medium animate-pulse">
              <Pipette className="h-3 w-3" />
              Click element to pick color
            </span>
          )}
        </div>
        
        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(Math.max(0.25, zoomLevel - 0.25))}
            disabled={zoomLevel <= 0.25}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(zoomLevel * 100)}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(Math.min(3.0, zoomLevel + 0.25))}
            disabled={zoomLevel >= 3.0}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setZoomLevel(1.0)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </div>

        {/* Page Navigation Controls */}
        {(totalPages > 1 || (viewMode && viewModeImages.length > 1)) && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage <= 1}
            >
              Previous
            </Button>
            <span className="text-sm font-medium px-3 py-1 bg-muted rounded-md min-w-[100px] text-center">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage >= totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </div>

      {/* Main Editor Area - Takes Full Height with Single Page View */}
      <div ref={wrapperRef} className="flex-1 overflow-auto scroll-smooth bg-muted/30 flex gap-0 items-start justify-center py-4" style={{
        scrollBehavior: 'smooth'
      }}>
        {/* Live Cursors */}
        {currentProjectId && (
          <LiveCursors cursors={cursors} containerRef={containerRef} />
        )}
        <style>{`
          .page {
            width: ${getPageDimensions().width}cm;
            height: ${getPageDimensions().height}cm;
            max-width: ${getPageDimensions().width}cm;
            padding: 0;
            background: ${isDarkMode ? 'black' : 'white'};
            box-shadow: 0 0 20px rgba(0,0,0,0.2);
            overflow: hidden;
            position: relative;
            box-sizing: border-box;
            transform: scale(${zoomLevel});
            transform-origin: top center;
            transition: transform 0.2s ease;
            margin: 0 auto;
            flex-shrink: 0;
          }
          
          .page-content {
            width: 100%;
            height: 100%;
            padding: ${MARGIN_CM}cm;
            box-sizing: border-box;
            overflow: auto;
            position: relative;
          }
          
          /* Custom scrollbar for page content */
          .page-content::-webkit-scrollbar {
            width: 8px;
            height: 8px;
          }
          
          .page-content::-webkit-scrollbar-track {
            background: rgba(0, 0, 0, 0.05);
          }
          
          .page-content::-webkit-scrollbar-thumb {
            background: rgba(0, 0, 0, 0.2);
            border-radius: 4px;
          }
          
          .page-content::-webkit-scrollbar-thumb:hover {
            background: rgba(0, 0, 0, 0.3);
          }
          
          /* View mode visual indicator */
          .page.view-mode {
            border: 3px solid hsl(var(--primary) / 0.3);
          }
          
          /* Disable text selection cursor in view mode */
          .page.view-mode .page-content > div {
            cursor: default;
          }
          
          .page .uploaded-content,
          .page > div {
            width: 100%;
            height: 100%;
            max-width: 100%;
            max-height: 100%;
            overflow: hidden;
            box-sizing: border-box;
          }
          
          .page .pdf-page-wrapper,
          .page .docx-page-wrapper {
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            overflow: hidden;
          }
          
          .page .pdf-page,
          .page .docx-page {
            max-width: 100% !important;
            max-height: 100% !important;
            pointer-events: auto;
          }
          
          .page img {
            max-width: 100%;
            height: auto;
            object-fit: contain;
            cursor: move;
            pointer-events: auto;
          }

          /* PDF Reconstructed Page - Constrained to page dimensions */
          .pdf-page-reconstructed {
            position: relative;
            background: white;
            margin: 0;
            width: 100% !important;
            height: 100% !important;
            max-width: 100% !important;
            max-height: 100% !important;
            overflow: hidden;
            padding: 0;
            box-sizing: border-box;
          }
          
          .pdf-page-reconstructed > * {
            max-width: 100%;
            overflow: visible;
          }

          /* PDF Logo images - higher z-index */
          .pdf-logo {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          /* PDF Text Spans - Clean and minimal */
          .pdf-text-span {
            pointer-events: auto;
            cursor: text;
            transition: background-color 0.15s;
          }

          .page.edit-mode .pdf-text-span:hover {
            background: rgba(66, 153, 225, 0.1) !important;
          }

          .page.edit-mode .pdf-text-span:focus {
            background: rgba(66, 153, 225, 0.15) !important;
            outline: 1px solid rgba(66, 153, 225, 0.5);
          }

          /* PDF Reconstructed Tables */
          .pdf-reconstructed-table {
            position: absolute;
            border-collapse: collapse;
            background: white;
            pointer-events: auto;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
          }

          .pdf-reconstructed-table td,
          .pdf-reconstructed-table th {
            border: 1px solid #999;
            padding: 6px;
            min-width: 40px;
            vertical-align: top;
          }
            transition: background-color 0.15s;
          }

          .pdf-reconstructed-table th {
            background: #f5f5f5;
            font-weight: 600;
          }

          .page.edit-mode .pdf-reconstructed-table th:hover,
          .page.edit-mode .pdf-reconstructed-table td:hover {
            background-color: rgba(66, 153, 225, 0.08) !important;
          }

          .page.edit-mode .pdf-reconstructed-table th:focus,
          .page.edit-mode .pdf-reconstructed-table td:focus {
            background-color: rgba(66, 153, 225, 0.12) !important;
            outline: 2px solid rgba(66, 153, 225, 0.5);
            outline-offset: -2px;
          }

          /* PDF Image Wrappers */
          .pdf-image-wrapper {
            position: absolute;
            cursor: move;
            border: 2px solid transparent;
            transition: border-color 0.2s;
          }

          .page.edit-mode .pdf-image-wrapper:hover {
            border-color: rgba(66, 153, 225, 0.5);
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
          
          /* Signature hover styles */
          .signature-element:hover {
            border-color: #ccc !important;
          }
          
          @media print {
            .page {
              margin: 0;
              box-shadow: none;
              page-break-after: always;
            }
          }
        `}</style>
        <div ref={containerRef} className="mx-auto" style={{ 
          width: 'fit-content',
          minHeight: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}>
          <div 
            className={`page ${editMode ? 'edit-mode' : 'view-mode'} ${viewMode ? 'view-mode' : ''}`} 
            style={{ position: 'relative' }}
            onClick={handleCanvasClick}
          >
            <div className="page-content">
              {viewMode && viewModeImages.length > 0 ? (
                // VIEW MODE: Display image
                <img 
                  key={currentPage}
                  src={viewModeImages[currentPage - 1]} 
                  alt={`Page ${currentPage}`}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                    userSelect: 'none'
                  }}
                />
              ) : (
                // EDIT MODE: Editable content
                <div
                  ref={editorRef} 
                  contentEditable={!viewMode}
                  className="outline-none min-h-full prose prose-lg max-w-none" 
                  style={{
                    fontFamily: selectedFont,
                    fontSize: `${selectedSize}px`,
                    wordWrap: 'break-word',
                    overflowWrap: 'break-word',
                    backgroundColor: isDarkMode ? "#1a1a1a" : "#ffffff",
                    color: isDarkMode ? "#ffffff" : "#000000",
                    pointerEvents: viewMode ? 'none' : 'auto',
                    userSelect: viewMode ? 'none' : 'auto'
                  }}
                  suppressContentEditableWarning
                  onFocus={() => setIsEditingText(true)}
                  onBlur={() => setIsEditingText(false)}
                  onClick={(e) => {
                    if (currentProjectId && !viewMode) {
                      updateCursor(e.clientX, e.clientY);
                    }
                  }}
                />
              )}
            </div>
            
            {/* AI Toolbar Integration */}
            <AIToolbar 
              onInsertText={(text) => {
                if (!editorRef.current || viewMode) return;
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                  const range = selection.getRangeAt(0);
                  range.deleteContents();
                  const textNode = document.createTextNode(text);
                  range.insertNode(textNode);
                } else {
                  editorRef.current.innerHTML += `<p>${text}</p>`;
                }
              }}
              isDarkMode={isDarkMode}
              isEditMode={isEditingText && !viewMode}
            />
            
            {/* Overlay Text Boxes in View Mode */}
            {viewMode && overlayTextBoxes.map(box => (
              <OverlayTextBox
                key={box.id}
                {...box}
                onUpdate={updateTextBox}
                onDelete={deleteTextBox}
                zoomLevel={zoomLevel}
              />
            ))}
            
            {/* Signature preview while dragging */}
            {draggingSignature && signaturePreviewPosition && (
              <div
                style={{
                  position: 'absolute',
                  left: signaturePreviewPosition.x,
                  top: signaturePreviewPosition.y,
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                  opacity: 0.7,
                  zIndex: 1000,
                  padding: '8px',
                  background: 'rgba(255, 255, 255, 0.9)',
                  border: '2px dashed #666',
                  borderRadius: '4px',
                }}
              >
                {draggingSignature.type === "draw" ? (
                  <img src={draggingSignature.data} alt="Signature preview" style={{ height: '60px', display: 'block' }} />
                ) : (
                  <span style={{ fontFamily: 'cursive', fontSize: '24px', color: isDarkMode ? 'black' : 'black' }}>
                    {draggingSignature.data}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Comments Sidebar */}
        {showComments && currentProjectId && (
          <CommentsSidebar
            comments={comments}
            onAddComment={async (content) => {
              await addComment(content);
            }}
            onUpdateComment={updateComment}
            onDeleteComment={deleteComment}
            currentUserId={user?.id}
          />
        )}
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

      {/* Search Dialog */}
      <SearchDialog
        open={showSearchDialog}
        onOpenChange={setShowSearchDialog}
        onSearch={handleSearch}
        matchCount={searchMatches.length}
        currentMatch={currentSearchIndex}
        onNext={goToNextMatch}
        onPrevious={goToPreviousMatch}
        showReplace={false}
      />

      {/* Keyboard Shortcuts Dialog */}
      <ShortcutsDialog
        open={showShortcutsDialog}
        onOpenChange={setShowShortcutsDialog}
        type="document"
      />

      {/* Signature Dialog */}
      <Dialog open={showSignDialog} onOpenChange={setShowSignDialog}>
        <DialogContent className="max-w-2xl bg-background">
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
                  <div className="relative bg-white rounded p-2">
                    <canvas
                      ref={signCanvasRef}
                      width={600}
                      height={300}
                      className="border border-gray-300 rounded cursor-crosshair w-full"
                      style={{ 
                        backgroundColor: '#ffffff',
                        backgroundImage: 'repeating-conic-gradient(#f3f4f6 0% 25%, #ffffff 0% 50%) 50% / 20px 20px'
                      }}
                      onMouseDown={startDrawingSignature}
                      onMouseMove={drawSignature}
                      onMouseUp={stopDrawingSignature}
                      onMouseLeave={stopDrawingSignature}
                      onTouchStart={(e) => { e.preventDefault(); startDrawingSignature(e.touches[0]); }}
                      onTouchMove={(e) => { e.preventDefault(); drawSignature(e.touches[0]); }}
                      onTouchEnd={stopDrawingSignature}
                    />
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Draw your signature above on the white canvas. It will be saved with a white background.</p>
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
                  <div key={sig.id} className="flex items-center justify-between p-2 border rounded bg-white">
                    <div className="flex-1 cursor-pointer" onClick={() => insertSignature(sig)}>
                      {sig.type === "draw" ? (
                        <img src={sig.data} alt="Signature" className="h-12 bg-white" />
                      ) : (
                        <span className="text-xl text-black" style={{ fontFamily: "cursive" }}>
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

      {/* File Upload Dialog */}
      <FileUploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
                  onFileLoaded={(content, title) => {
                    if (editorRef.current) {
                      // Wrap uploaded content properly
                      const wrapper = document.createElement('div');
                      wrapper.className = 'uploaded-content';
                      wrapper.innerHTML = content;
                      
                      // Make images draggable
                      const images = wrapper.querySelectorAll('img');
                      images.forEach(img => {
                        (img as HTMLImageElement).draggable = true;
                        img.addEventListener('dragstart', (e) => {
                          e.dataTransfer?.setData('text/plain', '');
                        });
                      });
                      
                      editorRef.current.innerHTML = '';
                      editorRef.current.appendChild(wrapper);
                      setProjectTitle(title);
                      toast.success("Document loaded from file");
                    }
                    setShowUploadDialog(false);
                  }}
      />
    </div>
  );
}