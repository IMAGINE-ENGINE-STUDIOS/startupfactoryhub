// @ts-nocheck -- Imagine Studio v2
/**
 * The photo skybox: one big inverted sphere textured with a real city
 * photo (scene.skybox.url, see lib/skyboxes). Rendered identically by
 * the published player (PublishedWorld) and the editor
 * (LevelSceneContents) so edit mode is WYSIWYG. The sphere is rotated
 * so the photo's center faces the theater (north) wall and the wrap
 * seam sits behind the entrance (south). Loads with a plain
 * TextureLoader — a missing or slow photo never suspends the canvas,
 * and the scene's background color shows through until it arrives.
 */
import { useEffect, useState } from "react";
import * as THREE from "three";

export default function SkyboxDome({ url }: { url?: string | null }) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!url) { setTex(null); return; }
    let live = true;
    const loader = new THREE.TextureLoader();
    loader.setCrossOrigin("anonymous");
    loader.load(
      url,
      (t) => {
        if (!live) { t.dispose(); return; }
        t.colorSpace = THREE.SRGBColorSpace;
        t.anisotropy = 4;
        setTex(t);
      },
      undefined,
      () => { if (live) setTex(null); },
    );
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
