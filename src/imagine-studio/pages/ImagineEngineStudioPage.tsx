import "@/lib/webgpuCompute";
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
import { addLevelToProject, createProject, getActiveLevel, levelsOfProject, listProjects, projectOfLevel, setActiveLevel } from "@/imagine-studio/lib/localProjects";
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
    const qs = new URLSearchParams(location.search);
    const active = projectOfLevel(getActiveLevel());
    const prompt = qs.get("genius") || "";
    const wantsLevelInProject = /\b(new|another|next|add)\b.{0,20}\blevel\b/i.test(prompt) && !/\bnew (game|project)\b/i.test(prompt);
    let target: any;
    if (qs.has("new")) {
      // "+ New level" joins the open project
      target = active ? addLevelToProject(active.id) : createProject().level;
    } else if (qs.has("newProject") || (prompt && !(active && wantsLevelInProject))) {
      // Genius AI "build a 3D game/world" starts its own project with a playable starter level
      const title = prompt ? prompt.replace(/\s+/g, " ").slice(0, 40) : "Untitled Project";
      target = createProject(title).level;
    } else if (prompt && active) {
      target = addLevelToProject(active.id);
    } else {
      const last = getActiveLevel();
      const proj = listProjects()[0];
      target = (last && listLocalLevels().find((l) => l.id === last)) || (proj && (levelsOfProject(proj.id).find((l) => l.id === proj.defaultLevelId) || levelsOfProject(proj.id)[0])) || createProject().level;
    }
    qs.delete("new"); qs.delete("newProject");
    navigate(`/imagine-studio/${target.id}${qs.toString() ? "?" + qs.toString() : ""}`, { replace: true });
  }, [id, isRigRoom, navigate]);

  // Remember the open level and tell the Imagine Engine bar which project/levels exist.
  useEffect(() => {
    if (!id || isRigRoom) return;
    setActiveLevel(id);
    const p = projectOfLevel(id);
    if (window.parent !== window) {
      window.parent.postMessage({ __IEStudio: "project", project: p ? { id: p.id, name: p.name } : null, levels: p ? levelsOfProject(p.id).map((l) => ({ id: l.id, name: l.name })) : [], current: id }, "*");
    }
  }, [id, isRigRoom]);

  if (!id && !isRigRoom) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>
    );
  }
  return <LevelEditorPage key={isRigRoom ? "rig" : id} />;
}
