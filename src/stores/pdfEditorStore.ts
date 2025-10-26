import { create } from 'zustand';

export type ToolType = 'select' | 'text' | 'rectangle' | 'circle' | 'draw' | 'erase';

interface PDFOperation {
  type: 'add_text' | 'add_rectangle' | 'add_circle' | 'add_path' | 'delete';
  page: number;
  data: any;
}

interface PDFEditorState {
  // Session
  sessionId: string | null;
  pdfUrl: string | null;
  
  // Canvas state
  operations: PDFOperation[];
  currentPage: number;
  totalPages: number;
  zoom: number;
  activeTool: ToolType;
  
  // Actions
  setSessionId: (id: string | null) => void;
  setPdfUrl: (url: string | null) => void;
  setOperations: (operations: PDFOperation[]) => void;
  addOperation: (operation: PDFOperation) => void;
  setCurrentPage: (page: number) => void;
  setTotalPages: (total: number) => void;
  setZoom: (zoom: number) => void;
  setActiveTool: (tool: ToolType) => void;
  reset: () => void;
}

export const usePDFEditorStore = create<PDFEditorState>((set) => ({
  // Initial state
  sessionId: null,
  pdfUrl: null,
  operations: [],
  currentPage: 1,
  totalPages: 0,
  zoom: 1,
  activeTool: 'select',
  
  // Actions
  setSessionId: (id) => set({ sessionId: id }),
  setPdfUrl: (url) => set({ pdfUrl: url }),
  setOperations: (operations) => set({ operations }),
  addOperation: (operation) => set((state) => ({ 
    operations: [...state.operations, operation] 
  })),
  setCurrentPage: (page) => set({ currentPage: page }),
  setTotalPages: (total) => set({ totalPages: total }),
  setZoom: (zoom) => set({ zoom }),
  setActiveTool: (tool) => set({ activeTool: tool }),
  reset: () => set({
    sessionId: null,
    pdfUrl: null,
    operations: [],
    currentPage: 1,
    totalPages: 0,
    zoom: 1,
    activeTool: 'select',
  }),
}));
