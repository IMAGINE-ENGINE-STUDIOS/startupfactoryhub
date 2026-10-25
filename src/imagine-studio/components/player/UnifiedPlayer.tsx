// @ts-nocheck -- Imagine Studio v2
/**
 * UnifiedPlayer — THE player controller for every published world (office,
 * plaza, studio play test). One movement feel, one camera system, one touch
 * UI (MobileTouchControls writes the shared locomotionState singletons this
 * reads), driven entirely by a ControllerDef from lib/controllers:
 *   - third person (default): smoothed orbit-follow camera
 *   - first person: camera at the eyes, body hidden
 *   - custom controllers (form / code / Genius) change speeds, jump and
 *     camera, and may carry a per-frame script hook.
 * Pages supply only world facts: spawn, bounds, colliders, an optional
 * camera clamp, and an onMove sink for presence.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { mobileAxes, mobileLook } from '@/imagine-studio/components/level/locomotion/locomotionState';
import { runControllerScript, type ControllerDef } from '@/imagine-studio/lib/controllers';

export interface PlayerWorld {
  spawn?: [number, number, number];
  bounds?: { x: number; z: number };                 // clamp |x|,|z|
  colliders?: { x: number; z: number; r: number }[]; // circle blockers
  camClamp?: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number } | null;
}

export function UnifiedPlayer({ def, model = '/models/plaza/Xbot.glb', tint, ring = '#f59e0b', world, lookRef, onMove }: {
  def: ControllerDef;
  model?: string;
  tint?: string;
  ring?: string | null;
  world: PlayerWorld;
  lookRef: React.MutableRefObject<{ yaw: number; pitch: number }>;
  onMove?: (x: number, z: number, yaw: number, moving: boolean) => void;
}) {
  const { scene, animations } = useGLTF(model);
  const modelObj = useMemo(() => {
    const m = skeletonClone(scene) as THREE.Object3D;
    m.traverse((o: any) => {
      if (o.isMesh) {
        o.frustumCulled = false;
        if (tint) { o.material = o.material?.clone?.() ?? o.material; if (o.material) o.material.color = new THREE.Color(tint); }
      }
    });
    return m;
  }, [scene, tint]);
  const root = useRef<THREE.Group>(null);
  const { actions, names } = useAnimations(animations, root);
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const dn = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);
  const vel = useRef({ x: 0, z: 0 });
  const vy = useRef(0);
  const grounded = useRef(true);
  const jumpBuf = useRef(0);
  const coyote = useRef(0);
  const speedMult = useRef(1);
  const smCam = useRef<{ yaw: number; pitch: number } | null>(null);
  const spawn = world.spawn ?? [0, 0, 0];

  useFrame(({ camera }, dtRaw) => {
    const g = root.current; if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    const k = keys.current;
    // Touch look deltas (MobileTouchControls) feed the same look state the
    // page's mouse-drag writes.
    if (mobileLook.dx || mobileLook.dy) {
      lookRef.current.yaw -= mobileLook.dx * 0.0042;
      lookRef.current.pitch = THREE.MathUtils.clamp(lookRef.current.pitch + mobileLook.dy * 0.0032, -0.1, 0.9);
      mobileLook.dx = 0; mobileLook.dy = 0;
    }
    // Axes: keyboard + the shared touch axes (their convention: left = +x,
    // down = +z — converted here to right/forward).
    let ix = (k['a'] || k['arrowleft'] ? -1 : 0) + (k['d'] || k['arrowright'] ? 1 : 0) - (mobileAxes.x || 0);
    let iz = (k['w'] || k['arrowup'] ? 1 : 0) + (k['s'] || k['arrowdown'] ? -1 : 0) - (mobileAxes.z || 0);
    const len = Math.hypot(ix, iz); if (len > 1) { ix /= len; iz /= len; }
    const sprint = !!k['shift'] || !!mobileAxes.run;
    // Camera smoothing (touch drags arrive sparse and jittery).
    if (!smCam.current) smCam.current = { yaw: lookRef.current.yaw, pitch: lookRef.current.pitch };
    const kc = 1 - Math.exp(-dt * 9);
    let dyaw = lookRef.current.yaw - smCam.current.yaw; while (dyaw > Math.PI) dyaw -= Math.PI * 2; while (dyaw < -Math.PI) dyaw += Math.PI * 2;
    smCam.current.yaw += dyaw * kc;
    smCam.current.pitch += (lookRef.current.pitch - smCam.current.pitch) * kc;
    const yaw = smCam.current.yaw;
    const sin = Math.sin(yaw), cos = Math.cos(yaw);
    const wx = iz * sin - ix * cos, wz = iz * cos + ix * sin;
    const speed = def.walkSpeed * (sprint ? def.sprintMultiplier : 1) * speedMult.current;
    speedMult.current = 1;
    const hasInput = Math.abs(wx) + Math.abs(wz) > 0.05;
    const kv = 1 - Math.exp(-dt * 8);
    vel.current.x += ((hasInput ? wx * speed : 0) - vel.current.x) * kv;
    vel.current.z += ((hasInput ? wz * speed : 0) - vel.current.z) * kv;
    const vMag = Math.abs(vel.current.x) + Math.abs(vel.current.z);
    const isMoving = vMag > 0.3;
    // Jump: buffered + coyote time, height from the controller definition.
    if (grounded.current) coyote.current = 0.12; else coyote.current = Math.max(0, coyote.current - dt);
    if (k[' '] || mobileAxes.jump) jumpBuf.current = 0.15; else jumpBuf.current = Math.max(0, jumpBuf.current - dt);
    if (def.canJump && jumpBuf.current > 0 && coyote.current > 0) {
      vy.current = Math.sqrt(2 * 22 * Math.max(0.1, def.jumpHeight));
      grounded.current = false; coyote.current = 0; jumpBuf.current = 0;
    }
    if (!grounded.current || vy.current > 0) {
      vy.current -= 22 * dt;
      g.position.y += vy.current * dt;
      if (g.position.y <= 0) { g.position.y = 0; vy.current = 0; grounded.current = true; }
    }
    if (vMag > 0.02) {
      let nx = g.position.x + vel.current.x * dt;
      let nz = g.position.z + vel.current.z * dt;
      if (world.bounds) { nx = THREE.MathUtils.clamp(nx, -world.bounds.x, world.bounds.x); nz = THREE.MathUtils.clamp(nz, -world.bounds.z, world.bounds.z); }
      let blocked = false;
      if (world.colliders) for (const d of world.colliders) { if (Math.hypot(nx - d.x, nz - d.z) < d.r) { blocked = true; break; } }
      if (!blocked) { g.position.x = nx; g.position.z = nz; } else { vel.current.x *= 0.3; vel.current.z *= 0.3; }
      if (isMoving && def.mode !== 'first') {
        const targetYaw = Math.atan2(vel.current.x, vel.current.z);
        let cur = g.rotation.y; let diff = targetYaw - cur; while (diff > Math.PI) diff -= Math.PI * 2; while (diff < -Math.PI) diff += Math.PI * 2;
        g.rotation.y = cur + diff * Math.min(1, dt * 10);
      }
    }
    if (def.mode === 'first') g.rotation.y = yaw + Math.PI;
    // Controller script hook (custom controllers by code / Genius).
    if (def.script) {
      runControllerScript(def, {
        dt, input: { x: ix, z: iz, sprint, jump: !!k[' '] || !!mobileAxes.jump },
        position: g.position, yaw: g.rotation.y,
        get speed() { return Math.hypot(vel.current.x, vel.current.z); },
        setSpeed: (m: number) => { speedMult.current = THREE.MathUtils.clamp(Number(m) || 1, 0, 4); },
      });
      if (world.bounds) { g.position.x = THREE.MathUtils.clamp(g.position.x, -world.bounds.x, world.bounds.x); g.position.z = THREE.MathUtils.clamp(g.position.z, -world.bounds.z, world.bounds.z); }
    }
    onMove?.(g.position.x, g.position.z, g.rotation.y, isMoving);
    // Camera.
    const pitch = smCam.current.pitch;
    if (def.mode === 'first') {
      camera.position.set(g.position.x, g.position.y + def.cameraHeight, g.position.z);
      const look = new THREE.Vector3(
        g.position.x - Math.sin(yaw) * Math.cos(pitch),
        g.position.y + def.cameraHeight + Math.sin(pitch - 0.25) * 2,
        g.position.z - Math.cos(yaw) * Math.cos(pitch),
      );
      camera.lookAt(look);
    } else {
      const back = def.cameraDistance, height = def.cameraHeight + pitch * 4;
      camera.position.set(g.position.x - Math.sin(yaw) * back * Math.cos(pitch), height + g.position.y, g.position.z - Math.cos(yaw) * back * Math.cos(pitch));
      if (world.camClamp) {
        camera.position.x = THREE.MathUtils.clamp(camera.position.x, world.camClamp.minX, world.camClamp.maxX);
        camera.position.y = THREE.MathUtils.clamp(camera.position.y, world.camClamp.minY, world.camClamp.maxY);
        camera.position.z = THREE.MathUtils.clamp(camera.position.z, world.camClamp.minZ, world.camClamp.maxZ);
      }
      camera.lookAt(g.position.x, 1.5 + g.position.y, g.position.z);
    }
    // Animation: idle / walk / run by speed.
    const idleName = names.find((x) => /idle/i.test(x)) ?? names[0];
    const runName = names.find((x) => /run/i.test(x));
    const walkName = names.find((x) => /walk/i.test(x)) ?? idleName;
    const want = !isMoving ? idleName : (sprint && runName ? runName : walkName);
    const a = want ? actions[want] : undefined;
    if (a && !a.isRunning()) { Object.values(actions).forEach((x) => x?.fadeOut(0.2)); a.reset().fadeIn(0.2).play(); }
  });

  return (
    <group ref={root} position={spawn} visible={def.mode !== 'first'}>
      <primitive object={modelObj} />
      {ring && <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.45, 0.55, 32]} /><meshBasicMaterial color={ring} /></mesh>}
    </group>
  );
}
