// Simplified - Fabric.js handles everything client-side
export interface FabricCanvasState {
  pageNumber: number;
  fabricJSON: string; // Serialized Fabric canvas
  lastModified: number;
}

export interface PDFEditingSession {
  id: string;
  user_id: string;
  pdf_url: string;
  current_version_url: string | null; // Keep for DB compatibility
  title: string;
  session_data: Record<number, string> | null; // Fabric JSON per page
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface PDFCollaborationCursor {
  id: string;
  session_id: string;
  user_id: string | null;
  user_name: string;
  user_color: string;
  position: { x: number; y: number };
  page_number: number;
  last_active: string;
}
