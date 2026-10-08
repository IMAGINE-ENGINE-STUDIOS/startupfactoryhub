/**
 * Imagine Engine Studio — standalone entry to the full 3D level creation suite.
 * Without an id it opens the most recent local project (or creates one), since
 * the editor needs a project id to load.
 */
import { Navigate, useParams } from "react-router-dom";
import LevelEditorPage from "@/pages/LevelEditorPage";
import { createLocalLevel, listLocalLevels } from "@/lib/localLevels";

export default function ImagineEngineStudioPage() {
  const { id } = useParams<{ id: string }>();
  if (!id) {
    const latest = [...listLocalLevels()].sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
    const target = latest ?? createLocalLevel();
    return <Navigate to={`/level/${target.id}`} replace />;
  }
  return <LevelEditorPage />;
}
