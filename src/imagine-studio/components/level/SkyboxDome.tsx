// @ts-nocheck -- Imagine Studio v2
/**
 * The photo skybox: one big inverted sphere textured with a real city
 * photo (scene.skybox.url, see lib/skyboxes). Rendered identically by
 * the published player (PublishedWorld) and the editor
 * (LevelSceneContents) so edit mode is WYSIWYG. The sphere is rotated
 * so the photo's center faces the theater (north) wall and the wrap
 * seam sits behind the entrance (south). Loads via an Image element
 * (never suspends the canvas; the scene's background color shows
 * through until it arrives) and downscales oversized photos before
 * GPU upload so phones don't die on 8K textures.
 */
import { useEffect, useState } from "react";
import * as THREE from "three";

export default function SkyboxDome({ url }: { url?: string | null }) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) { setTex(null); return; }
    let live = true;
    /* Load via an Image element and DOWNSCALE before the texture ever
     * reaches the GPU: the hi-res city photos are 8192x4096 — uploading
     * one raw is a ~134 MB texture plus mipmaps, which crash-looped
     * iOS Safari on the office floors ("A problem repeatedly occurred",
     * founder report 2026-10-25). Screens under 1400px wide get a
     * 4096px cap (a quarter of the GPU memory, indistinguishable on a
     * phone); large desktop screens keep the full resolution. */
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      if (!live) return;
      let source: HTMLImageElement | HTMLCanvasElement = img;
      const cap = typeof window !== "undefined" && window.innerWidth < 1400 ? 4096 : 8192;
      if (img.naturalWidth > cap) {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = cap;
          canvas.height = Math.max(1, Math.round((img.naturalHeight * cap) / img.naturalWidth));
          const ctx = canvas.getContext("2d");
          if (ctx) { ctx.drawImage(img, 0, 0, canvas.width, canvas.height); source = canvas; }
        } catch { /* fall back to the full-size image */ }
      }
      const t = new THREE.Texture(source);
      t.needsUpdate = true;
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 4;
      setTex(t);
    };
    img.onerror = () => { if (live) setTex(null); };
    img.src = url;
    return () => { live = false; };
  }, [url]);
  useEffect(() => () => { tex?.dispose(); }, [tex]);
  if (!tex) return null;
  return (
    <mesh rotation={[0, Math.PI / 2, 0]} renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[420, 40, 24]} />
      <meshBasicMaterial map={tex} side={THREE.BackSide} depthWrite={false} fog={false} toneMapped={false} />
    </mesh>
  );
}
