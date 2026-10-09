// @ts-nocheck -- Imagine Studio v2
// Renders the Plaza District as published from the 3D Studio (primitives, models, lights).
import { Suspense, useEffect, useMemo, useState } from 'react';
import { useGLTF } from '@react-three/drei';
import { PLAZA_PUBLISHED_URL } from '@/imagine-studio/lib/plazaLevel';

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

export function PublishedWorld({ scene }: { scene: any }) {
  return (
    <group>
      {(scene.lights || []).filter((l) => l.kind === 'point').map((l) => <pointLight key={l.id} position={l.position} color={col(l.color)} intensity={l.intensity} distance={30} />)}
      {scene.objects.filter((o) => o.visible !== false).map((o) => {
        if (o.kind === 'primitive') {
          const a = Array.isArray(o.color) ? o.color[3] ?? 1 : 1;
          return (
            <mesh key={o.id} position={o.position} rotation={o.rotation} scale={o.scale} castShadow receiveShadow>
              <Geo shape={o.shape} />
              <meshStandardMaterial color={col(o.color)} metalness={o.metalness ?? 0} roughness={o.roughness ?? 0.8} transparent={a < 1} opacity={a} depthWrite={a >= 1} />
            </mesh>
          );
        }
        if (o.kind === 'model' && typeof o.url === 'string' && !o.url.startsWith('blob:')) return <Suspense key={o.id} fallback={null}><Model o={o} /></Suspense>;
        return null;
      })}
    </group>
  );
}
