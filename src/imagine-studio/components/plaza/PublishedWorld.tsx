// @ts-nocheck -- Imagine Studio v2
// Renders a published 3D Studio scene exactly as authored: lights,
// primitives, models AND characters (NPCs and AI agent characters included —
// a character dropped in the studio must exist in the published world).
import { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { Html, useAnimations, useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { PLAZA_PUBLISHED_URL } from '@/imagine-studio/lib/plazaLevel';
import { applyPose } from '@/imagine-studio/lib/rigSaves';
import { buildSeatedLegsPose } from '@/imagine-studio/lib/actionPoses';

export function usePublishedPlaza() {
  const [scene, setScene] = useState<any>(null);
  useEffect(() => {
    let off = false;
    fetch(`${PLAZA_PUBLISHED_URL}?t=${Date.now()}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (!off && d?.scene?.objects) setScene(d.scene); }).catch(() => {});
    return () => { off = true; };
  }, []);
  return scene;
}

const col = (c) => (Array.isArray(c) ? `rgb(${Math.round(c[0] * 255)},${Math.round(c[1] * 255)},${Math.round(c[2] * 255)})` : '#cccccc');

function Geo({ shape }) {
  switch (shape) {
    case 'sphere': return <sphereGeometry args={[0.5, 32, 24]} />;
    case 'cylinder': return <cylinderGeometry args={[0.5, 0.5, 1, 32]} />;
    case 'cone': return <coneGeometry args={[0.5, 1, 32]} />;
    case 'plane': return <planeGeometry args={[1, 1]} />;
    case 'torus': return <torusGeometry args={[0.5, 0.15, 16, 64]} />;
    default: return <boxGeometry args={[1, 1, 1]} />;
  }
}

function Model({ o }) {
  const { scene } = useGLTF(o.url);
  const m = useMemo(() => scene.clone(true), [scene]);
  return <primitive object={m} position={o.position} rotation={o.rotation} scale={o.scale} />;
}

/** A scene character: NPC or AI agent. Plays its authored clip (or idle),
 *  applies a saved rig pose when present, and sits procedurally when the
 *  author marked it seated. Agent characters (agentId) are clickable. */
export function PublishedCharacter({ o, onAgentOpen }: { o: any; onAgentOpen?: (o: any) => void }) {
  const url = typeof o.url === 'string' && !o.url.startsWith('blob:') ? o.url : '/models/plaza/Xbot.glb';
  const { scene, animations } = useGLTF(url);
  const model = useMemo(() => {
    const m = skeletonClone(scene) as THREE.Object3D;
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m);
    const h = (box.max.y - box.min.y) || 1;
    const s = (1.8 / h) * (o.scale?.[1] ?? 1);
    m.scale.setScalar(s);
    m.position.y = -box.min.y * s;
    if (Array.isArray(o.color)) {
      const tint = new THREE.Color(col(o.color));
      m.traverse((n: any) => { if (n.isMesh) { n.frustumCulled = false; const mats = Array.isArray(n.material) ? n.material : [n.material]; const next = mats.map((mt: any) => { const c = mt.clone(); if (c.color && !c.map) c.color.copy(tint); return c; }); n.material = Array.isArray(n.material) ? next : next[0]; } });
    } else {
      m.traverse((n: any) => { if (n.isMesh) n.frustumCulled = false; });
    }
    return m;
  }, [scene, o]);
  const root = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, root);
  const posedRef = useRef(false);
  const sitStartedRef = useRef(false);
  const legsPoseRef = useRef<any[] | null>(null);
  const legsTriedRef = useRef(0);
  const sitClipName = useMemo(() => (o.startSeated ? names.find((n) => /sitting/i.test(n)) ?? null : null), [names, o.startSeated]);
  useEffect(() => {
    if (Array.isArray(o.pose) && o.pose.length) { try { applyPose(model as any, o.pose as any); posedRef.current = true; Object.values(actions).forEach((x) => x?.stop()); } catch { /* keep clips */ } }
  }, [model, o]);
  useFrame(() => {
    if (posedRef.current) return;
    if (o.startSeated && sitClipName) {
      // A Sitting clip is a sit-DOWN transition: play once, clamp on the
      // last frame — never loop it.
      const a = actions[sitClipName];
      if (a && !sitStartedRef.current) {
        sitStartedRef.current = true;
        a.setLoop(THREE.LoopOnce, 1);
        a.clampWhenFinished = true;
        Object.values(actions).forEach((x) => { if (x && x !== a) x.fadeOut(0.2); });
        a.reset().fadeIn(0.2).play();
      }
      return;
    }
    if (o.startSeated && !sitClipName) {
      // Legs-only seated pose stamped after the mixer each frame; the idle
      // clip keeps the upper body alive instead of a bind-pose T freeze.
      if (!legsPoseRef.current && legsTriedRef.current < 5) {
        legsTriedRef.current += 1;
        root.current?.updateMatrixWorld(true);
        try { legsPoseRef.current = buildSeatedLegsPose(model, { forward: new THREE.Vector3(Math.sin(o.rotation?.[1] || 0), 0, Math.cos(o.rotation?.[1] || 0)), seatHeight: o.seatHeight ?? 0.52 }); } catch { legsPoseRef.current = null; }
      }
      if (legsPoseRef.current) {
        const idleName = names.find((n) => /idle/i.test(n)) ?? names[0];
        const a = idleName ? actions[idleName] : null;
        if (a && !a.isRunning()) { Object.values(actions).forEach((x) => { if (x && x !== a) x.fadeOut(0.2); }); a.reset().fadeIn(0.2).play(); }
        applyPose(model as any, legsPoseRef.current as any);
      }
      return;
    }
    const want = (o.currentAnimation && names.includes(o.currentAnimation)) ? o.currentAnimation
      : (names.find((n) => /idle/i.test(n)) ?? names[0]);
    if (!want) return;
    const a = actions[want];
    if (a && !a.isRunning()) { Object.values(actions).forEach((x) => x?.fadeOut(0.2)); a.reset().fadeIn(0.2).play(); }
  });
  const clickable = !!(o.agentId && onAgentOpen);
  return (
    <group ref={root} position={o.position} rotation={o.rotation} onClick={clickable ? (e) => { e.stopPropagation(); onAgentOpen!(o); } : undefined}>
      <primitive object={model} />
      {o.name && (
        <Html position={[0, 2.05 * (o.scale?.[1] ?? 1), 0]} center zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{ pointerEvents: 'none', font: '600 11px system-ui', lineHeight: 1.25, color: '#fff', background: 'rgba(5,10,20,.62)', padding: '2px 8px', borderRadius: 999, whiteSpace: 'nowrap' }}>
            {o.name}{o.agentId ? ' · AI' : ''}
          </div>
        </Html>
      )}
    </group>
  );
}

export function PublishedWorld({ scene, renderCharacters = true, onAgentOpen }: { scene: any; renderCharacters?: boolean; onAgentOpen?: (o: any) => void }) {
  return (
    <group>
      {(scene.lights || []).filter((l) => l.kind === 'point').map((l) => <pointLight key={l.id} position={l.position} color={col(l.color)} intensity={l.intensity} distance={30} />)}
      {scene.objects.filter((o) => o.visible !== false && !o.theater && !/theater\s*screen/i.test(o.name || '')).map((o) => {
        if (o.kind === 'primitive') {
          const a = Array.isArray(o.color) ? o.color[3] ?? 1 : 1;
          return (
            <mesh key={o.id} position={o.position} rotation={o.rotation} scale={o.scale} castShadow receiveShadow>
              <Geo shape={o.shape} />
              <meshStandardMaterial color={col(o.color)} emissive={o.emissive ? col(o.emissive) : '#000000'} emissiveIntensity={o.emissiveIntensity ?? 1} metalness={o.metalness ?? 0} roughness={o.roughness ?? 0.8} transparent={a < 1} opacity={a} depthWrite={a >= 1} />
            </mesh>
          );
        }
        if (o.kind === 'model' && typeof o.url === 'string' && !o.url.startsWith('blob:')) return <Suspense key={o.id} fallback={null}><Model o={o} /></Suspense>;
        if (o.kind === 'character' && renderCharacters) return <Suspense key={o.id} fallback={null}><PublishedCharacter o={o} onAgentOpen={onAgentOpen} /></Suspense>;
        return null;
      })}
    </group>
  );
}
