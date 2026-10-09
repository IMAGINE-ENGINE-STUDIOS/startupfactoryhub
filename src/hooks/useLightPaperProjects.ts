import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { offloadHeavyContent, stableHash } from "@/lib/lightpaperStorage";


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

  // Listing must NEVER pull the `content` JSONB — 69 projects x ~300KB was
  // ~20MB per drawer open, which is why stored documents "failed to load again".
  const LIST_COLUMNS =
    "id,user_id,project_type,title,thumbnail_url,created_at,updated_at,last_accessed_at";

  const fetchProjects = async () => {
    if (!user) {
      setProjects([]);
      setLoading(false);
      return;
    }

    try {
      let query = supabase
        .from("lightpaper_projects")
        .select(LIST_COLUMNS)
        .in('project_type', ['document', 'spreadsheet', 'presentation'])
        .order("updated_at", { ascending: false })
        .limit(200);

      if (projectType) {
        query = query.eq("project_type", projectType);
      }

      const { data, error } = await query;

      if (error) throw error;
      setProjects((data || []).map((row: any) => ({ ...row, content: null })) as LightPaperProject[]);
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

  // Serialize saves so concurrent auto-saves never race or duplicate rows.
  const saveChainRef = useRef<Promise<any>>(Promise.resolve());
  // Last persisted payload hash per project (skips no-op saves).
  const lastHashRef = useRef<Record<string, string>>({});
  // Throttle failure toasts so a broken save never spams the user.
  const lastErrorToastRef = useRef(0);
  const creatingRef = useRef(false);
  // Maps a project id whose row no longer exists to the copy saved in its place.
  const replacedRef = useRef<Record<string, string>>({});

  const notifyFailure = (message: string) => {
    const now = Date.now();
    if (now - lastErrorToastRef.current < 30000) return;
    lastErrorToastRef.current = now;
    toast.error(message);
  };

  const saveProject = async (
    title: string,
    projectType: ProjectType,
    content: any,
    projectId?: string,
    options?: { silent?: boolean }
  ) => {
    if (!user) {
      if (!options?.silent) toast.error("Please sign in to save projects");
      return null;
    }

    // Prevent parallel creation of duplicate projects for the same document.
    if (!projectId && creatingRef.current) return null;
    if (!projectId) creatingRef.current = true;

    const run = async () => {
      try {
        // Offload base64 page images to Storage so the JSONB payload stays small.
        // If offloading fails for any reason, save the raw (lossless) content.
        // Renew an expired sign-in before saving so long editing sessions don't fail.
        try {
          const { data: sess } = await supabase.auth.getSession();
          const exp = sess.session?.expires_at ?? 0;
          if (!sess.session || exp * 1000 - Date.now() < 60_000) await supabase.auth.refreshSession();
        } catch (refreshError) {
          console.warn("Could not refresh session before save", refreshError);
        }
        let payload: any = content;
        try {
          payload = await offloadHeavyContent(content, user.id);
        } catch (offloadError) {
          console.warn("Saving LightPaper without image offloading", offloadError);
          payload = content;
        }

        const hashKey = projectId || `new:${title}`;
        const hash = stableHash({ title, payload });
        if (projectId && lastHashRef.current[hashKey] === hash) {
          // Nothing changed since the last successful save — skip the round-trip.
          return { id: projectId } as any;
        }

        const attempt = async () => {
          // If this project's row vanished earlier, keep writing to its replacement copy.
          const targetId = projectId ? replacedRef.current[projectId] || projectId : undefined;
          if (targetId) {
            const { data, error } = await supabase
              .from("lightpaper_projects")
              .update({
                title,
                content: payload,
                updated_at: new Date().toISOString(),
              })
              .eq("id", targetId)
              .select()
              .maybeSingle();
            if (error) throw error;
            if (data) return data;
            // 0 rows: the project was deleted or isn't owned by this user — save it as a new copy.
          }
          const { data, error } = await supabase
            .from("lightpaper_projects")
            .insert({
              user_id: user.id,
              project_type: projectType,
              title,
              content: payload,
            })
            .select()
            .single();
          if (error) throw error;
          if (projectId && data?.id) replacedRef.current[projectId] = data.id;
          return data;
        };

        let lastError: any = null;
        for (let i = 0; i < 3; i++) {
          try {
            const data = await attempt();
            lastHashRef.current[hashKey] = hash;
            if (data?.id) lastHashRef.current[data.id] = hash;
            if (!projectId && !options?.silent) toast.success("Project saved successfully!");
            return data;
          } catch (err) {
            lastError = err;
            await new Promise((r) => setTimeout(r, 400 * Math.pow(2, i)));
          }
        }
        throw lastError;
      } catch (error: any) {
        console.error("Error saving project:", error);
        const message = [error?.message, error?.details, error?.hint, error?.error]
          .filter((part) => typeof part === "string")
          .join(" ");
        notifyFailure(
          /payload|too large|exceeded the maximum allowed size|413/i.test(message)
            ? "Document too large to save — try removing large images"
            : /permission denied|not authorized|row-level|policy|jwt|401|403/i.test(message)
              ? "You don't have permission to save this document. Please sign in again and retry."
              : /storage|bucket|upload|mime/i.test(message)
                ? "Could not securely upload document pages. Your document is still open; please retry."
                // Surface the real database/network reason instead of a generic message.
                : `Failed to save project${message ? `: ${message}` : ""}. Your document is still open; please retry.`
        );
        return null;
      } finally {
        if (!projectId) creatingRef.current = false;
      }
    };

    const chained = saveChainRef.current.then(run, run);
    saveChainRef.current = chained.catch(() => undefined);
    return chained;
  };


  // Reads the full row (including `content`) for a single project.
  // Retries once: a cold/slow response used to leave the editor blank.
  const loadProject = async (projectId: string) => {
    if (!user) return null;

    for (let attempt = 0; attempt < 2; attempt++) {
      const { data, error } = await supabase
        .from("lightpaper_projects")
        .select("*")
        .eq("id", projectId)
        .maybeSingle();

      if (!error && data) {
        // Touch last_accessed_at without blocking the open.
        supabase
          .from("lightpaper_projects")
          .update({ last_accessed_at: new Date().toISOString() })
          .eq("id", projectId)
          .then(undefined, () => undefined);
        return data;
      }

      if (error) console.error("Error loading project:", error);
      if (attempt === 0) await new Promise((r) => setTimeout(r, 500));
    }

    toast.error("Failed to load project");
    return null;

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