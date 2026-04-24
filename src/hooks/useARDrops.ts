import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type ARContentType = "model_3d" | "image" | "audio" | "video" | "file" | "text";
export type PlacementMode = "static" | "free";

export interface ARDrop {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  content_type: ARContentType;
  content_url: string | null;
  thumbnail_url: string | null;
  latitude: number;
  longitude: number;
  altitude: number;
  rotation: number;
  scale: number;
  color: string;
  is_public: boolean;
  placement_mode: PlacementMode;
  /** Real-world height above ground in meters (eye level ≈ 1.6) */
  altitude_m: number;
  /** Compass bearing the object faces (0 = north) */
  yaw_deg: number;
  /** Tilt in degrees, positive = looking up */
  pitch_deg: number;
  /** True real-world size in meters (used for distance-correct scaling) */
  size_m: number;
  created_at: string;
  updated_at: string;
}

export interface DropTransform {
  altitude_m?: number;
  yaw_deg?: number;
  pitch_deg?: number;
  size_m?: number;
}

export interface ARDropComment {
  id: string;
  drop_id: string;
  user_id: string;
  message: string;
  created_at: string;
}

export const useARDrops = () => {
  const [drops, setDrops] = useState<ARDrop[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDrops = useCallback(async () => {
    const { data, error } = await supabase
      .from("ar_drops")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) {
      console.error(error);
      toast.error("Failed to load AR drops");
    } else {
      setDrops((data || []) as ARDrop[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchDrops();

    const channel = supabase
      .channel("ar-drops-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "ar_drops" },
        (payload) => {
          setDrops((prev) => {
            if (prev.find((d) => d.id === (payload.new as ARDrop).id)) return prev;
            return [payload.new as ARDrop, ...prev];
          });
        }
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "ar_drops" },
        (payload) => {
          setDrops((prev) =>
            prev.map((d) =>
              d.id === (payload.new as ARDrop).id ? (payload.new as ARDrop) : d
            )
          );
        }
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "ar_drops" },
        (payload) => {
          setDrops((prev) => prev.filter((d) => d.id !== (payload.old as ARDrop).id));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchDrops]);

  const createDrop = useCallback(
    async (drop: Omit<ARDrop, "id" | "created_at" | "updated_at" | "user_id">) => {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("You must be signed in to drop content");
        return null;
      }
      const { data, error } = await supabase
        .from("ar_drops")
        .insert({ ...drop, user_id: userData.user.id })
        .select()
        .single();
      if (error) {
        toast.error("Failed to drop content: " + error.message);
        return null;
      }
      toast.success("AR content dropped!");
      return data as ARDrop;
    },
    []
  );

  const moveDrop = useCallback(
    async (id: string, latitude: number, longitude: number, altitude?: number) => {
      setDrops((prev) =>
        prev.map((d) =>
          d.id === id
            ? { ...d, latitude, longitude, altitude: altitude ?? d.altitude }
            : d
        )
      );
      const { error } = await supabase
        .from("ar_drops")
        .update({
          latitude,
          longitude,
          ...(altitude !== undefined ? { altitude } : {}),
        })
        .eq("id", id);
      if (error) {
        toast.error("Couldn't move: " + error.message);
        return false;
      }
      return true;
    },
    []
  );

  const updateDropTransform = useCallback(
    async (id: string, transform: DropTransform) => {
      setDrops((prev) =>
        prev.map((d) => (d.id === id ? { ...d, ...transform } : d))
      );
      const { error } = await supabase
        .from("ar_drops")
        .update(transform)
        .eq("id", id);
      if (error) {
        toast.error("Couldn't update: " + error.message);
        return false;
      }
      return true;
    },
    []
  );

  const deleteDrop = useCallback(async (id: string) => {
    const { error } = await supabase.from("ar_drops").delete().eq("id", id);
    if (error) {
      toast.error("Failed to delete: " + error.message);
      return false;
    }
    toast.success("Drop removed");
    return true;
  }, []);

  return { drops, loading, createDrop, moveDrop, deleteDrop, updateDropTransform, refetch: fetchDrops };
};

export const useARDropComments = (dropId: string | null) => {
  const [comments, setComments] = useState<ARDropComment[]>([]);

  useEffect(() => {
    if (!dropId) {
      setComments([]);
      return;
    }
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from("ar_drop_comments")
        .select("*")
        .eq("drop_id", dropId)
        .order("created_at", { ascending: true });
      if (!cancelled) setComments((data || []) as ARDropComment[]);
    })();

    const channel = supabase
      .channel(`ar-drop-comments-${dropId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "ar_drop_comments",
          filter: `drop_id=eq.${dropId}`,
        },
        (payload) => {
          setComments((prev) => [...prev, payload.new as ARDropComment]);
        }
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [dropId]);

  const postComment = useCallback(
    async (message: string) => {
      if (!dropId || !message.trim()) return;
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        toast.error("Sign in to chat");
        return;
      }
      const { error } = await supabase.from("ar_drop_comments").insert({
        drop_id: dropId,
        user_id: userData.user.id,
        message: message.trim(),
      });
      if (error) toast.error("Failed to send: " + error.message);
    },
    [dropId]
  );

  return { comments, postComment };
};
