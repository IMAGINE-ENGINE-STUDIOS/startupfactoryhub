// @ts-nocheck -- imported Imagine Studio v2
/**
 * Imagine Engine Studio — standalone entry to the full 3D level creation suite
 * (menus, tools, inspectors, play mode, Rig Controller Room). Reuses the level
 * editor so both pages always share the same features.
 */
import { useEffect } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import LevelEditorPage from "@/imagine-studio/pages/LevelEditorPage";
import { createLocalLevel, listLocalLevels, updateLocalLevel } from "@/imagine-studio/lib/localLevels";
import { PLAZA_ENVIRONMENT, PLAZA_LEVEL_NAME } from "@/imagine-studio/lib/plazaLevel";

/* One-time fix: older Plaza District copies had a dark contact-shadow "gloom" the live game never shows. */
try {
  for (const l of listLocalLevels()) {
    if (l.name === PLAZA_LEVEL_NAME && (l.scene as any)?.environment?.gi?.contactShadows) {
      updateLocalLevel(l.id, { scene: { ...l.scene, environment: { ...l.scene.environment, ...PLAZA_ENVIRONMENT, hdri: l.scene.environment?.hdri } } as any });
    }
  }
} catch { /* storage unavailable */ }

export default function ImagineEngineStudioPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const isRigRoom = location.pathname.endsWith("/rig-room") || location.pathname === "/locomotion";

  useEffect(() => {
    if (id || isRigRoom) return;
    const levels = listLocalLevels();
    const latest = [...levels].sort((a: any, b: any) =>
      String(b.updated_at ?? "").localeCompare(String(a.updated_at ?? "")),
    )[0];
    // Genius AI "build in 3D" requests start a fresh level and keep the prompt.
    const qs = new URLSearchParams(location.search);
    const fresh = qs.has("genius") || qs.has("new");
    qs.delete("new");
    const target = fresh ? createLocalLevel() : latest ?? createLocalLevel();
    navigate(`/imagine-studio/${target.id}${qs.toString() ? "?" + qs.toString() : ""}`, { replace: true });
  }, [id, isRigRoom, navigate]);

  if (!id && !isRigRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  return <LevelEditorPage key={isRigRoom ? "rig" : id} />;
}
