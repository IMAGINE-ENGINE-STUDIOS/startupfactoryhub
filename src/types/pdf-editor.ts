export interface PDFOperation {
  id: string;
  type: 'add_text' | 'edit_text' | 'add_rectangle' | 'delete_content' | 'add_image' | 'fill_form';
  page: number;
  x: number;
  y: number;
  data?: {
    text?: string;
    fontSize?: number;
    color?: { r: number; g: number; b: number };
    width?: number;
    height?: number;
    borderColor?: { r: number; g: number; b: number };
    borderWidth?: number;
    imageUrl?: string;
    fieldName?: string;
    fieldValue?: string;
    oldText?: string;
  };
  timestamp: number;
  userId?: string;
  savedToBackend?: boolean;
}

export interface PDFEditingSession {
  id: string;
  user_id: string;
  pdf_url: string;
  current_version_url: string | null;
  title: string;
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

export interface PDFOperationHistory {
  id: string;
  session_id: string;
  user_id: string;
  operation_type: string;
  operation_data: PDFOperation;
  applied_at: string;
  version_number: number;
}
