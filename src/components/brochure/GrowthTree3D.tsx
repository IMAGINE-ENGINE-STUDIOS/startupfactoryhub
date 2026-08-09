import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { generateTree } from '@/lib/proctree';

export type GrowthBenefit = {
  id: string;
  label: string;
  line: string;
  stage: number;
};

export const GROWTH_STAGES = [
  { label: 'Month 1', note: 'Onboard' },
  { label: 'Month 2', note: 'Build' },
  { label: 'Month 3', note: 'Traction' },
  { label: 'Month 4', note: 'Demo Day' },
];

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener?.('change', on);
    return () => mq.removeEventListener?.('change', on);
  }, []);
  return reduced;
};

/* ---------- leaf sprite texture (soft radial dot) ---------- */
const makeLeafTexture = () => {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.85)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.needsUpdate = true;
  return t;
};

export const GrowthTree3D = ({
  accent = '#059669',
  accent2 = '#0ea5b7',
  stage,
  className = '',
}: {
  accent?: string;
  accent2?: string;
  /** 0..3 — which month of the batch is showing */
  stage: number;
  className?: string;
}) => {
  const reduced = useReducedMotion();
  const mountRef = useRef<HTMLDivElement | null>(null);
  const stageRef = useRef(stage);
  const [failed, setFailed] = useState(false);
  stageRef.current = stage;

  const tree = useMemo(
    () =>
      generateTree({
        seed: 24,
        levels: 5,
        trunkLength: 2.7,
        trunkRadius: 0.36,
        lengthFalloff: 0.78,
        radiusFalloff: 0.66,
        branches: 3,
        spread: 0.72,
        climb: 0.55,
      }),
    [],
  );

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
    } catch {
      setFailed(true);
      return;
    }
    if (!renderer.getContext()) {
      setFailed(true);
      return;
    }

    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(mount.clientWidth || 400, mount.clientHeight || 400);
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
    camera.position.set(0, 3.1, 10.4);
    camera.lookAt(0, 2.6, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0xbfe9dd, 1.25));
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(4, 8, 6);
    scene.add(key);
    const rim = new THREE.DirectionalLight(new THREE.Color(accent2), 0.85);
    rim.position.set(-5, 3, -4);
    scene.add(rim);

    const root = new THREE.Group();
    root.position.y = 0;
    scene.add(root);

    /* ---- branch geometry, merged per recursion level ---- */
    const cAccent = new THREE.Color(accent);
    const cAccent2 = new THREE.Color(accent2);
    const levelGroups: THREE.Mesh[] = [];
    const maxLevel = tree.maxLevel;

    const buildLevel = (level: number) => {
      const geos: THREE.BufferGeometry[] = [];
      const segs = tree.segments.filter((s) => s.level === level);
      if (level === 0) segs.push(...tree.roots);
      segs.forEach((s) => {
        const a = new THREE.Vector3(...s.a);
        const b = new THREE.Vector3(...s.b);
        const h = a.distanceTo(b);
        if (h < 0.001) return;
        const g = new THREE.CylinderGeometry(Math.max(s.r1, 0.03), Math.max(s.r0, 0.032), h, level < 2 ? 12 : 6, 1, true);
        g.translate(0, h / 2, 0);
        const q = new THREE.Quaternion().setFromUnitVectors(
          new THREE.Vector3(0, 1, 0),
          b.clone().sub(a).normalize(),
        );
        g.applyQuaternion(q);
        g.translate(a.x, a.y, a.z);
        geos.push(g);
      });
      if (!geos.length) return null;
      const merged = mergeGeometries(geos, false);
      geos.forEach((g) => g.dispose());
      if (!merged) return null;
      const mix = level / Math.max(1, maxLevel);
      const mat = new THREE.MeshStandardMaterial({
        color: cAccent2.clone().lerp(cAccent, 0.25 + mix * 0.7),
        roughness: 0.42,
        metalness: 0.22,
        emissive: cAccent.clone().multiplyScalar(0.12 + mix * 0.2),
        transparent: true,
        opacity: 0,
      });
      const mesh = new THREE.Mesh(merged, mat);
      mesh.userData.level = level;
      root.add(mesh);
      return mesh;
    };

    for (let l = 0; l <= maxLevel; l++) {
      const m = buildLevel(l);
      if (m) levelGroups.push(m);
    }

    /* ---- leaves: twig anchors + tips of the outer two branch levels ---- */
    const leafTex = makeLeafTexture();
    const anchors: [number, number, number][] = tree.twigs.map((t) => t.p);
    tree.segments
      .filter((s) => s.level >= maxLevel - 1)
      .forEach((s, i) => {
        if (i % 2 !== 0) return;
        for (let k = 0; k < 3; k++) {
          anchors.push([
            s.b[0] + (Math.random() - 0.5) * 0.55,
            s.b[1] + (Math.random() - 0.5) * 0.45,
            s.b[2] + (Math.random() - 0.5) * 0.55,
          ]);
        }
      });
    const leafPositions = new Float32Array(anchors.length * 3);
    const leafColors = new Float32Array(anchors.length * 3);
    anchors.forEach((p, i) => {
      leafPositions[i * 3] = p[0];
      leafPositions[i * 3 + 1] = p[1];
      leafPositions[i * 3 + 2] = p[2];
      const c = cAccent.clone().lerp(cAccent2, Math.random() * 0.7);
      leafColors[i * 3] = c.r;
      leafColors[i * 3 + 1] = c.g;
      leafColors[i * 3 + 2] = c.b;
    });
    const leafGeo = new THREE.BufferGeometry();
    leafGeo.setAttribute('position', new THREE.BufferAttribute(leafPositions, 3));
    leafGeo.setAttribute('color', new THREE.BufferAttribute(leafColors, 3));
    const leafMat = new THREE.PointsMaterial({
      size: 0.42,
      map: leafTex,
      vertexColors: true,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: true,
    });
    const leaves = new THREE.Points(leafGeo, leafMat);
    root.add(leaves);

    /* ---- ground ring ---- */
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(1.5, 2.9, 64),
      new THREE.MeshBasicMaterial({ color: cAccent, transparent: true, opacity: 0.1, side: THREE.DoubleSide }),
    );
    ring.rotation.x = -Math.PI / 2;
    ring.position.y = -0.02;
    root.add(ring);

    /* ---- fit camera to the full tree ---- */
    const box = new THREE.Box3();
    levelGroups.forEach((m) => {
      m.geometry.computeBoundingBox();
      const b = m.geometry.boundingBox!.clone();
      box.union(b);
    });
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    root.position.set(-center.x, -center.y, -center.z);
    const baseY = root.position.y;
    const halfW = Math.max(size.x, size.z) * 0.5 + 0.5; // + leaf spread
    const halfH = size.y * 0.5 + 0.5;

    /* ---- resize ---- */
    const resize = () => {
      const w = mount.clientWidth || 400;
      const h = mount.clientHeight || 400;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(1, h);
      const vHalf = (camera.fov * Math.PI) / 360;
      const hHalf = Math.atan(Math.tan(vHalf) * camera.aspect);
      const dist = Math.max(halfH / Math.tan(vHalf), halfW / Math.tan(hHalf)) * 1.06;
      camera.position.set(0, halfH * 0.1, dist);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(mount);

    /* ---- pause only when the page is hidden or the mount collapsed ---- */
    const isVisible = () =>
      document.visibilityState !== 'hidden' && mount.clientWidth > 0 && mount.clientHeight > 0;

    /* ---- animation ---- */
    let raf = 0;
    const clock = new THREE.Clock();
    const progress = new Array(maxLevel + 1).fill(0);

    const tick = () => {
      raf = requestAnimationFrame(tick);
      if (!isVisible()) return;
      const dt = Math.min(clock.getDelta(), 0.05);
      const t = clock.getElapsedTime();

      // levels reveal progressively with the month stage
      const s = stageRef.current;
      for (let l = 0; l <= maxLevel; l++) {
        // month 1 shows trunk+first branches, each month unlocks another tier
        const unlocked = ((s + 1) * (maxLevel + 1)) / 4;
        const target = l < unlocked ? 1 : 0;
        progress[l] += (target - progress[l]) * Math.min(1, dt * 2.4);
      }
      levelGroups.forEach((m) => {
        const l = m.userData.level as number;
        const p = progress[l];
        (m.material as THREE.MeshStandardMaterial).opacity = p;
        m.visible = p > 0.01;
      });

      const leafTarget = Math.max(progress[maxLevel], progress[Math.max(0, maxLevel - 1)] * 0.55);
      leafMat.opacity = leafTarget * 0.95;
      leafMat.size = 0.26 + leafTarget * 0.2 + (reduced ? 0 : Math.sin(t * 1.6) * 0.012);
      leaves.visible = leafTarget > 0.01;

      if (!reduced) {
        root.rotation.y += dt * 0.16;
        root.position.y = baseY + Math.sin(t * 0.8) * 0.04;
      }
      (ring.material as THREE.MeshBasicMaterial).opacity = 0.08 + Math.abs(Math.sin(t * 0.7)) * 0.05;

      renderer.render(scene, camera);
    };
    tick();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();

      leafGeo.dispose();
      leafTex.dispose();
      leafMat.dispose();
      levelGroups.forEach((m) => {
        m.geometry.dispose();
        (m.material as THREE.Material).dispose();
      });
      ring.geometry.dispose();
      (ring.material as THREE.Material).dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [tree, accent, accent2, reduced]);

  if (failed) {
    return (
      <div className={`relative w-full h-full flex items-center justify-center ${className}`}>
        <div
          className="rounded-2xl px-6 py-8 text-center"
          style={{ border: `1px solid ${accent}33`, background: 'rgba(255,255,255,0.6)' }}
        >
          <div className="font-mono text-[11px] uppercase tracking-[0.28em]" style={{ color: accent }}>
            Growth model
          </div>
          <div className="text-[13px] text-slate-500 mt-2 max-w-[240px] leading-relaxed">
            Interactive 3D view unavailable on this device.
          </div>
        </div>
      </div>
    );
  }

  return <div ref={mountRef} data-no-flip className={`relative w-full h-full ${className}`} />;
};

export default GrowthTree3D;
