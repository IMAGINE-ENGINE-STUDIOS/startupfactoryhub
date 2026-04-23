import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

export type ProjectType = "document" | "spreadsheet" | "presentation";

export interface LightPaperProject {
  id: string;
  user_id: string;
  project_type: ProjectType;
  title: string;
  content: any;
  thumbnail_url?: string;
  created_at: string;
  updated_at: string;
  last_accessed_at: string;
}

export function useLightPaperProjects(projectType?: ProjectType) {
  const { user } = useAuth();
  const [projects, setProjects] = useState<LightPaperProject[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("lightpaper_projects")
        .select("*")
        .in('project_type', ['document', 'spreadsheet', 'presentation'])
        .order("updated_at", { ascending: false });

      if (projectType) {
        query = query.eq("project_type", projectType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProjects((data || []) as LightPaperProject[]);
    } catch (error: any) {
      // Silent failure: do NOT spam the user with toasts on every retry / re-mount.
      // The empty state in the UI already communicates "no projects" clearly.
      // Errors are still logged for debugging.
      console.error("Error fetching lightpaper projects:", error);
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [user, projectType]);

  const saveProject = async (
    title: string,
    projectType: ProjectType,
    content: any,
    projectId?: string
  ) => {
    if (!user) {
      toast.error("Please sign in to save projects");
      return null;
    }

    try {
      if (projectId) {
        // Update existing project
        const { data, error } = await supabase
          .from("lightpaper_projects")
          .update({
            title,
            content,
            updated_at: new Date().toISOString(),
          })
          .eq("id", projectId)
          .select()
          .single();

        if (error) throw error;
        return data;
      } else {
        // Create new project
        const { data, error } = await supabase
          .from("lightpaper_projects")
          .insert({
            user_id: user.id,
            project_type: projectType,
            title,
            content,
          })
          .select()
          .single();

        if (error) throw error;
        toast.success("Project saved successfully!");
        return data;
      }
    } catch (error: any) {
      console.error("Error saving project:", error);
      toast.error("Failed to save project");
      return null;
    }
  };

  const loadProject = async (projectId: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from("lightpaper_projects")
        .update({
          last_accessed_at: new Date().toISOString(),
        })
        .eq("id", projectId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error("Error loading project:", error);
      toast.error("Failed to load project");
      return null;
    }
  };

  const deleteProject = async (projectId: string) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from("lightpaper_projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;
      toast.success("Project deleted successfully!");
      await fetchProjects();
    } catch (error: any) {
      console.error("Error deleting project:", error);
      toast.error("Failed to delete project");
    }
  };

  return {
    projects,
    loading,
    saveProject,
    loadProject,
    deleteProject,
    refetchProjects: fetchProjects,
  };
}