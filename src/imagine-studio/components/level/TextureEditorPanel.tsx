// @ts-nocheck -- imported Imagine Studio v2
import { useEffect, useRef, useState } from "react";
import { Paintbrush, Trash2, Upload, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import type { SceneObject, ObjectTexture } from "@/imagine-studio/lib/levelTypes";
import {
  getBuiltinTextures,
  getSavedTextures,
  saveTexture,
  removeSavedTexture,
  type LibraryTexture,
} from "@/imagine-studio/lib/texture-library";

/** Built-in textures that came from Wonderlands World (texture-library). */
const WONDERLANDS_NAMES = ["Pool Water", "Pool Tile", "Deck Wood", "Travertine Deck", "Pebble", "Sand"];

/**
 * Optimize an uploaded image for web use — resize + compress.
 * Copied from the Wonderlands Studio TextureBuilder (max 2048px,
 * JPEG 0.85 data URL).
 */
function optimizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        reject(new Error("Could not get canvas context"));
        return;
      }

      // Limit max dimension to 2048px for performance
      const maxDim = 2048;
      let width = img.width;
      let height = img.height;

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with quality 0.85 for smaller file size
      const optimizedUrl = canvas.toDataURL("image/jpeg", 0.85);
      resolve(optimizedUrl);
    };

    img.onerror = () => reject(new Error("Failed to load image"));
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

export interface TextureEditorPanelProps {
  obj: SceneObject;
  projectId: string;
  onPatch: (patch: any) => void;
  disabled?: boolean;
}

/**
 * Whole-object Texture Editor — a faithful port of the Wonderlands
 * Studio 3D mode texture editor (ComponentControlPanel "Texture
 * Selection" + TextureBuilder uploads): current-texture card, grouped
 * swatch picker, and the scale / rotation / offset / repeat transform
 * tool set. Every edit writes `obj.texture` through the inspector's
 * standard onPatch → patchObject path.
 */
export function TextureEditorPanel({ obj, projectId, onPatch, disabled }: TextureEditorPanelProps) {
  const current: ObjectTexture | undefined = obj.texture?.url ? obj.texture : undefined;
  const [builtins] = useState<LibraryTexture[]>(() => getBuiltinTextures());
  const [saved, setSaved] = useState<LibraryTexture[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setSaved(getSavedTextures(projectId)); }, [projectId]);

  const scale = current?.scale ?? 1;
  const rotation = current?.rotation ?? 0;
  const offsetX = current?.offset?.[0] ?? 0;
  const offsetY = current?.offset?.[1] ?? 0;
  const repeatX = current?.repeat?.[0] ?? scale;
  const repeatY = current?.repeat?.[1] ?? scale;

  /** Patch the transform of the currently applied texture. */
  const patchTexture = (patch: Partial<ObjectTexture>) => {
    if (!current) return;
    onPatch({ texture: { ...current, ...patch } });
  };

  /** Apply a library/uploaded texture, keeping the current transform. */
  const applyTexture = (t: { url: string; name: string }) => {
    onPatch({
      texture: {
        url: t.url,
        name: t.name,
        scale,
        rotation,
        offset: [offsetX, offsetY] as [number, number],
        ...(current?.repeat ? { repeat: current.repeat } : {}),
      },
    });
  };

  const handleUpload = async (file: File) => {
    setUploadError(null);
    if (!file.type.startsWith("image/")) {
      setUploadError("Please upload an image file (JPG, PNG, etc.)");
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await optimizeImage(file);
      const t: LibraryTexture = {
        id: `custom_${Date.now()}`,
        name: file.name,
        url: dataUrl,
        thumbnail: dataUrl,
      };
      saveTexture(projectId, t);
      setSaved(getSavedTextures(projectId));
      applyTexture(t);
    } catch {
      setUploadError("Failed to process texture");
    } finally {
      setUploading(false);
    }
  };

  const groups: Array<{ label: string; items: LibraryTexture[]; saved?: boolean }> = [
    { label: "Wonderlands World", items: builtins.filter((t) => WONDERLANDS_NAMES.includes(t.name)) },
    { label: "Studio Gallery", items: builtins.filter((t) => !WONDERLANDS_NAMES.includes(t.name)) },
    ...(saved.length ? [{ label: "Your Textures", items: saved, saved: true }] : []),
  ];

  return (
    <div className="space-y-2.5 rounded-xl border border-white/[0.08] bg-gradient-to-br from-black/60 to-black/30 backdrop-blur-md p-2.5 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.6)]">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-semibold flex items-center gap-1.5 uppercase tracking-wider text-white/80">
          <Paintbrush className="w-3 h-3 text-primary" /> Texture Editor
        </Label>
        {current && (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onPatch({ texture: undefined })}
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-white/70 hover:bg-red-500/20 hover:text-red-200 disabled:opacity-30"
            title="Remove texture from this object"
          >
            <Trash2 className="w-2.5 h-2.5" /> Remove
          </button>
        )}
      </div>

      {/* Current texture card (Wonderlands ComponentControlPanel) */}
      {current && (
        <div className="rounded-lg border border-white/[0.06] bg-black/40 p-2 space-y-1.5">
          <div className="text-[10px] font-medium text-white/60">Current: {current.name}</div>
          <img
            loading="lazy"
            decoding="async"
            src={current.url}
            alt={current.name}
            className="w-full h-24 object-cover rounded border border-white/[0.08]"
          />
        </div>
      )}

      {/* Grouped texture picker */}
      {groups.map(({ label, items, saved: isSavedGroup }) => (
        <div key={label} className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-white/50">
              {label}
            </span>
            <span className="h-px flex-1 bg-white/[0.08]" />
            <span className="text-[10px] text-white/40">{items.length}</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {items.map((t) => {
              const selected = current?.url === t.url;
              return (
                <div key={t.id} className="relative">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() => applyTexture(t)}
                    className={`relative group w-full rounded-lg overflow-hidden border-2 transition-all disabled:opacity-40 ${
                      selected
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-white/[0.10] hover:border-primary/50"
                    }`}
                    title={t.name}
                  >
                    <img
                      loading="lazy"
                      decoding="async"
                      src={t.thumbnail}
                      alt={t.name}
                      className="w-full h-16 object-cover group-hover:scale-110 transition-transform"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-1.5">
                      <span className="text-white text-[10px] font-medium truncate">{t.name}</span>
                    </div>
                    {selected && (
                      <div className="absolute top-1 right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                        <svg className="w-3 h-3 text-primary-foreground" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    )}
                  </button>
                  {isSavedGroup && (
                    <button
                      type="button"
                      disabled={disabled}
                      onClick={() => {
                        removeSavedTexture(projectId, t.id);
                        setSaved(getSavedTextures(projectId));
                      }}
                      className="absolute top-0.5 left-0.5 bg-black/60 text-white rounded p-0.5 hover:bg-red-500/40 disabled:opacity-30"
                      title="Remove from your textures"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Custom texture upload (Wonderlands TextureBuilder) */}
      <div>
        <button
          type="button"
          disabled={disabled || uploading}
          onClick={() => fileRef.current?.click()}
          className="flex w-full items-center justify-center gap-1 px-2 py-1.5 rounded bg-black/60 border border-white/[0.08] text-white/80 text-[10px] cursor-pointer hover:bg-white/[0.08] disabled:opacity-40"
        >
          <Upload className="w-3 h-3" /> {uploading ? "Optimizing…" : "Upload custom texture"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          disabled={disabled}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleUpload(f);
            e.target.value = "";
          }}
        />
        {uploadError && <p className="text-[10px] text-red-400 mt-1">{uploadError}</p>}
      </div>

      {/* Texture adjustments (Wonderlands transform tool set) */}
      {current && (
        <div className="space-y-2.5 rounded-lg border border-white/[0.06] bg-black/40 p-2">
          {/* Texture Scale */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-white/75">
              <span>Texture Scale</span>
              <span className="font-mono text-white/60">{scale.toFixed(1)}x</span>
            </div>
            <Slider
              value={[scale]}
              min={0.5}
              max={5}
              step={0.1}
              disabled={disabled}
              onValueChange={([v]) => patchTexture({ scale: v })}
            />
          </div>

          {/* Texture Rotation */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-white/75">
              <span>Texture Rotation</span>
              <span className="font-mono text-white/60">{Math.round(rotation)}°</span>
            </div>
            <Slider
              value={[rotation]}
              min={0}
              max={360}
              step={1}
              disabled={disabled}
              onValueChange={([v]) => patchTexture({ rotation: v })}
            />
            <div className="flex gap-1 mt-1">
              {[0, 45, 90, 135].map((deg) => (
                <button
                  key={deg}
                  type="button"
                  disabled={disabled}
                  aria-pressed={Math.round(rotation) === deg}
                  onClick={() => patchTexture({ rotation: deg })}
                  className={`h-6 px-2 text-[10px] flex-1 rounded-md border transition-colors disabled:opacity-40 ${
                    Math.round(rotation) === deg
                      ? "bg-white/[0.12] text-white border-white/30"
                      : "bg-black/60 border-white/[0.10] text-white/70 hover:bg-white/[0.08]"
                  }`}
                >
                  {deg}°
                </button>
              ))}
            </div>
          </div>

          {/* Texture Offset */}
          <div>
            <div className="flex items-center justify-between text-[10px] text-white/75">
              <span>Offset X</span>
              <span className="font-mono text-white/60">{offsetX.toFixed(2)}</span>
            </div>
            <Slider
              value={[offsetX]}
              min={-1}
              max={1}
              step={0.01}
              disabled={disabled}
              onValueChange={([v]) => patchTexture({ offset: [v, offsetY] })}
            />
          </div>
          <div>
            <div className="flex items-center justify-between text-[10px] text-white/75">
              <span>Offset Y</span>
              <span className="font-mono text-white/60">{offsetY.toFixed(2)}</span>
            </div>
            <Slider
              value={[offsetY]}
              min={-1}
              max={1}
              step={0.01}
              disabled={disabled}
              onValueChange={([v]) => patchTexture({ offset: [offsetX, v] })}
            />
          </div>

          {/* Repeat (Wonderlands TextureBuilder) */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="flex items-center justify-between text-[10px] text-white/75">
                <span>Repeat X</span>
                <span className="font-mono text-white/60">{repeatX.toFixed(1)}</span>
              </div>
              <Slider
                value={[repeatX]}
                min={0.1}
                max={10}
                step={0.1}
                disabled={disabled}
                onValueChange={([v]) => patchTexture({ repeat: [v, repeatY] })}
              />
            </div>
            <div>
              <div className="flex items-center justify-between text-[10px] text-white/75">
                <span>Repeat Y</span>
                <span className="font-mono text-white/60">{repeatY.toFixed(1)}</span>
              </div>
              <Slider
                value={[repeatY]}
                min={0.1}
                max={10}
                step={0.1}
                disabled={disabled}
                onValueChange={([v]) => patchTexture({ repeat: [repeatX, v] })}
              />
            </div>
          </div>

          <button
            type="button"
            disabled={disabled}
            onClick={() =>
              onPatch({ texture: { ...current, scale: 1, rotation: 0, offset: [0, 0], repeat: undefined } })
            }
            className="w-full h-7 rounded-md bg-black/60 border border-white/[0.10] text-white/80 text-[10px] hover:bg-white/[0.08] disabled:opacity-40"
          >
            Reset texture transform
          </button>
        </div>
      )}
    </div>
  );
}
