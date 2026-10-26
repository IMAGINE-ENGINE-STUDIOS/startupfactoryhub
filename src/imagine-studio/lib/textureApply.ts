// @ts-nocheck -- imported Imagine Studio v2
/**
 * Object-texture factory for the Texture Editor (ported from the
 * Wonderlands Studio 3D texture editor). Turns an `ObjectTexture`
 * (Wonderlands TextureConfig shape) into a cached THREE.Texture with
 * the authored UV transform baked in: RepeatWrapping, per-axis repeat
 * (falling back to the uniform `scale`), rotation in DEGREES around the
 * UV centre, and offset.
 *
 * Shared by the editor viewport (LevelScene3D) and the live renderer
 * (PublishedWorld) so both apply the exact same transform.
 */
import * as THREE from "three";
import type { ObjectTexture } from "./levelTypes";

const textureCache = new Map<string, THREE.Texture>();

function cacheKey(tex: ObjectTexture): string {
  const repeat = tex.repeat ?? [tex.scale ?? 1, tex.scale ?? 1];
  const offset = tex.offset ?? [0, 0];
  return [
    tex.url,
    repeat[0],
    repeat[1],
    tex.rotation ?? 0,
    offset[0],
    offset[1],
  ].join("|");
}

/**
 * Load (or fetch from cache) the THREE.Texture for an object texture.
 * Returns null when textures can't load (SSR / no document).
 */
export function getTextureMap(tex: ObjectTexture): THREE.Texture | null {
  if (!tex?.url) return null;
  if (typeof document === "undefined") return null;
  const key = cacheKey(tex);
  const hit = textureCache.get(key);
  if (hit) return hit;
  const repeat = tex.repeat ?? [tex.scale ?? 1, tex.scale ?? 1];
  const offset = tex.offset ?? [0, 0];
  const texture = new THREE.TextureLoader().load(tex.url);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(repeat[0], repeat[1]);
  texture.center.set(0.5, 0.5);
  texture.rotation = THREE.MathUtils.degToRad(tex.rotation ?? 0);
  texture.offset.set(offset[0], offset[1]);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  textureCache.set(key, texture);
  return texture;
}
