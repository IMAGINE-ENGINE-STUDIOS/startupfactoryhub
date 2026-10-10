// @ts-nocheck -- Imagine Studio v2
// Handles "ie-load-level" events from portals: opens the linked level and
// starts Play mode there automatically (?play=1).
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { listLocalLevels } from "@/imagine-studio/lib/localLevels";

export function resolveLevelId(ref: { levelId?: string; levelName?: string }): string | null {
  const all = listLocalLevels();
  if (ref.levelId && all.some((l) => l.id === ref.levelId)) return ref.levelId;
  const n = (ref.levelName || ref.levelId || "").trim().toLowerCase();
  const hit = n ? all.find((l) => l.name.trim().toLowerCase() === n) : null;
  return hit?.id ?? ref.levelId ?? null;
}

export default function LevelLinkHandler({ inStudio, levelId, onAutoPlay }: { inStudio: boolean; levelId?: string; onAutoPlay: () => void }) {
  const navigate = useNavigate();
  useEffect(() => {
    const on = (e: any) => {
      const id = resolveLevelId(e.detail || {});
      if (!id) { toast.error("Linked level not found"); return; }
      if (id === levelId) return;
      toast.message(`Loading ${e.detail?.levelName || "level"}…`);
      navigate(`${inStudio ? "/imagine-studio" : "/level"}/${id}?play=1`);
    };
    window.addEventListener("ie-load-level", on);
    return () => window.removeEventListener("ie-load-level", on);
  }, [inStudio, levelId]);

  useEffect(() => {
    const sp = new URLSearchParams(window.location.search);
    if (sp.get("play") !== "1") return;
    const t = setTimeout(() => {
      onAutoPlay();
      const url = new URL(window.location.href); url.searchParams.delete("play"); window.history.replaceState(null, "", url.toString());
    }, 1500);
    return () => clearTimeout(t);
  }, [levelId]);
  return null;
}
