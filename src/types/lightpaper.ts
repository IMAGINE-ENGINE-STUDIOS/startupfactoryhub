// Type definitions for LightPaper projects

export type ProjectType = 'document' | 'spreadsheet' | 'presentation';

// Discriminated union for project content
export type ProjectContent = 
  | { type: 'document', html: string, text: string, font?: string, size?: string, darkMode?: boolean }
  | { type: 'spreadsheet', data: Record<string, any>, rows?: number, cols?: number }
  | { type: 'presentation', slides: Slide[] };

export interface Slide {
  id: string;
  title: string;
  content: string;
  backgroundColor: string;
  textColor: string;
  layout: "title" | "content" | "two-column" | "image";
  imageUrl?: string;
  imagePosition?: { x: number; y: number; width: number; height: number };
  animation?: "none" | "fade" | "slide" | "zoom";
  transition?: "none" | "fade" | "slide" | "zoom";
}

export interface LightPaperProject {
  id: string;
  user_id: string;
  project_type: ProjectType;
  title: string;
  content: ProjectContent;
  created_at: string;
  updated_at: string;
  last_accessed_at: string | null;
}

export interface CursorPosition {
  id: string;
  user_id: string;
  user_name: string;
  user_avatar: string | null;
  user_color: string;
  position: {
    x: number;
    y: number;
    selection?: { start: number; end: number };
  };
  last_active: string;
}

export interface Comment {
  id: string;
  project_id: string;
  user_id: string | null;
  user_name: string;
  user_avatar: string | null;
  content: string;
  position?: { x: number; y: number };
  thread_id?: string;
  created_at: string;
  updated_at: string;
}
