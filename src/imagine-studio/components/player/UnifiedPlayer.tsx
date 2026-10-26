// @ts-nocheck -- Imagine Studio v2
/**
 * THE player controller for every published world (office, plaza, studio
 * play test) — one movement feel, one camera system, one touch UI
 * (MobileTouchControls writes the shared locomotionState singletons this
 * reads), driven entirely by a ControllerDef from lib/controllers:
 *   - third person (default): smoothed orbit-follow camera
 *   - first person: camera at the eyes, body hidden
 *   - custom controllers (form / code / Genius) change speeds, jump and
 *     camera, and may carry a per-frame script hook.
 *
 * useUnifiedMovement is the reusable core: pages with their own character
 * rendering (the plaza's pickable avatars) drive their own model inside the
 * moving group; UnifiedPlayer is the ready-made composition (GLB + clips)
 * the office and the play test use.
 */
import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useAnimations, Html } from '@react-three/drei';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { mobileAxes, mobileLook } from '@/imagine-studio/components/level/locomotion/locomotionState';
import { runControllerScript, type ControllerDef } from '@/imagine-studio/lib/controllers';
import { makeGroundSampler } from '@/imagine-studio/lib/grounding';

export interface PlayerWorld {
  spawn?: [number, number, number];
  bounds?: { x: number; z: number; cx?: number; cz?: number }; // clamp around an optional center (the Lobby & Plaza grounds are not centered on the room)
  radialBound?: number;                              // clamp distance from origin (plaza)
  colliders?: { x: number; z: number; r: number }[]; // hard-stop circles
  pushOut?: { x: number; z: number; r: number }[];   // keep-out circles, resolved by pushing out
  camClamp?: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number } | null;
}

export function useUnifiedMovement(def: ControllerDef, world: PlayerWorld, lookRef: React.MutableRefObject<{ yaw: number; pitch: number }>, opts?: {
  onMove?: (x: number, z: number, yaw: number, moving: boolean) => void;
  onMovingChange?: (moving: boolean) => void;
  /** When set, the player is SEATED: pinned to the seat (position +
   * facing eased), movement input and jumping are suspended, and the
   * camera keeps orbiting the seated user. */
  seatRef?: React.MutableRefObject<{ x: number; z: number; ry: number; y: number } | null>;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const stateRef = useRef({ moving: false, sprint: false, speed: 0 });
  const keys = useRef<Record<string, boolean>>({});
  useEffect(() => {
    const dn = (e: KeyboardEvent) => { if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return; keys.current[e.key.toLowerCase()] = true; };
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false; };
    const blur = () => { keys.current = {}; };
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up); window.addEventListener('blur', blur);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); window.removeEventListener('blur', blur); };
  }, []);
  const vel = useRef({ x: 0, z: 0 });
  const vy = useRef(0);
  const grounded = useRef(true);
  const jumpBuf = useRef(0);
  const coyote = useRef(0);
  const speedMult = useRef(1);
  const wasSeated = useRef(false);
  const smCam = useRef<{ yaw: number; pitch: number } | null>(null);

  useFrame(({ camera }, dtRaw) => {
    const g = groupRef.current; if (!g) return;
    const dt = Math.min(dtRaw, 0.05);
    const k = keys.current;
    // Q / E turn the camera (the plaza's turn keys, now everywhere).
    if (k['q']) lookRef.current.yaw += dt * 2;
    if (k['e']) lookRef.current.yaw -= dt * 2;
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
    // SEATED: ease onto the chair and hold — no walking, no jumping,
    // the orbit camera keeps working around the seated user.
    const seat = opts?.seatRef?.current;
    /* Standing up: the seat held the player at seat height with
     * `grounded` still true, so gravity never resumed and the player
     * hovered at chair height. On release, fall back to the floor. */
    if (seat) wasSeated.current = true;
    else if (wasSeated.current) { wasSeated.current = false; grounded.current = false; }
    if (seat) {
      const kp = Math.min(1, dt * 7);
      g.position.x += (seat.x - g.position.x) * kp;
      g.position.z += (seat.z - g.position.z) * kp;
      g.position.y += (seat.y - g.position.y) * kp;
      let dy = seat.ry - g.rotation.y; while (dy > Math.PI) dy -= Math.PI * 2; while (dy < -Math.PI) dy += Math.PI * 2;
      g.rotation.y += dy * kp;
      vel.current.x = 0; vel.current.z = 0;
    }
    const hasInput = !seat && Math.abs(wx) + Math.abs(wz) > 0.05;
    const kv = 1 - Math.exp(-dt * 8);
    vel.current.x += ((hasInput ? wx * speed : 0) - vel.current.x) * kv;
    vel.current.z += ((hasInput ? wz * speed : 0) - vel.current.z) * kv;
    const vMag = Math.hypot(vel.current.x, vel.current.z);
    const isMoving = vMag > 0.3;
    // Jump: buffered + coyote time, height from the controller definition.
    if (grounded.current) coyote.current = 0.12; else coyote.current = Math.max(0, coyote.current - dt);
    if (k[' '] || mobileAxes.jump) jumpBuf.current = 0.15; else jumpBuf.current = Math.max(0, jumpBuf.current - dt);
    if (!seat && def.canJump && jumpBuf.current > 0 && coyote.current > 0) {
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
      if (world.bounds) { const bcx = world.bounds.cx ?? 0, bcz = world.bounds.cz ?? 0; nx = THREE.MathUtils.clamp(nx, bcx - world.bounds.x, bcx + world.bounds.x); nz = THREE.MathUtils.clamp(nz, bcz - world.bounds.z, bcz + world.bounds.z); }
      if (world.radialBound) { const r = Math.hypot(nx, nz); if (r > world.radialBound) { nx *= world.radialBound / r; nz *= world.radialBound / r; } }
      let blocked = false;
      /* A collider only blocks ENTRY. If the player is already inside
       * its radius — the office seat spot sits 0.85 from the desk
       * center, inside the desk's 1.0 collider — movement must stay
       * free, or standing up from a chair traps the player forever:
       * every first step's target is still inside the radius. */
      if (world.colliders) for (const d of world.colliders) { if (Math.hypot(g.position.x - d.x, g.position.z - d.z) >= d.r && Math.hypot(nx - d.x, nz - d.z) < d.r) { blocked = true; break; } }
      if (!blocked) {
        if (world.pushOut) for (const b of world.pushOut) {
          const ddx = nx - b.x, ddz = nz - b.z, dd = Math.hypot(ddx, ddz);
          if (dd < b.r && dd > 0.0001) { nx = b.x + (ddx / dd) * b.r; nz = b.z + (ddz / dd) * b.r; }
        }
        g.position.x = nx; g.position.z = nz;
      } else { vel.current.x *= 0.3; vel.current.z *= 0.3; }
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
      if (world.bounds) { const bcx = world.bounds.cx ?? 0, bcz = world.bounds.cz ?? 0; g.position.x = THREE.MathUtils.clamp(g.position.x, bcx - world.bounds.x, bcx + world.bounds.x); g.position.z = THREE.MathUtils.clamp(g.position.z, bcz - world.bounds.z, bcz + world.bounds.z); }
    }
    if (isMoving !== stateRef.current.moving) opts?.onMovingChange?.(isMoving);
    stateRef.current = { moving: isMoving, sprint, speed: vMag };
    opts?.onMove?.(g.position.x, g.position.z, g.rotation.y, isMoving);
    // Camera.
    const pitch = smCam.current.pitch;
    if (def.mode === 'first') {
      camera.position.set(g.position.x, g.position.y + def.cameraHeight, g.position.z);
      camera.lookAt(
        g.position.x - Math.sin(yaw) * Math.cos(pitch),
        g.position.y + def.cameraHeight + Math.sin(pitch - 0.25) * 2,
        g.position.z - Math.cos(yaw) * Math.cos(pitch),
      );
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
  });

  return { groupRef, stateRef };
}

export function UnifiedPlayer({ def, model = '/models/plaza/Xbot.glb', tint, ring = '#f59e0b', name, world, lookRef, onMove, seatRef }: {
  def: ControllerDef;
  model?: string;
  tint?: string;
  ring?: string | null;
  name?: string;
  world: PlayerWorld;
  lookRef: React.MutableRefObject<{ yaw: number; pitch: number }>;
  onMove?: (x: number, z: number, yaw: number, moving: boolean) => void;
  seatRef?: React.MutableRefObject<{ x: number; z: number; ry: number; y: number } | null>;
}) {
  const { scene, animations } = useGLTF(model);
  const modelObj = useMemo(() => {
    const m = skeletonClone(scene) as THREE.Object3D;
    // Ground + normalize ANY model: authors ship feet-origin, center-origin
    // and every scale; measure the box, stand the model on y=0 at 1.8 units
    // tall. (The founder's character is authored center-origin — without
    // this it renders half-buried, "underground".)
    m.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(m);
    const h = box.max.y - box.min.y || 1;
    const s = 1.8 / h;
    m.scale.setScalar(s);
    m.position.y = -box.min.y * s;
    const cullCenter = box.getCenter(new THREE.Vector3());
    const cullRadius = (box.getSize(new THREE.Vector3()).length() / 2) * 1.6;
    m.traverse((o: any) => {
      if (o.isMesh) {
        o.frustumCulled = true;
        if (o.geometry && !o.geometry.boundingSphere) o.geometry.boundingSphere = new THREE.Sphere(cullCenter, cullRadius);
        if (tint) { o.material = o.material?.clone?.() ?? o.material; if (o.material) o.material.color = new THREE.Color(tint); }
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        mats.forEach((c: any) => { if (c?.isMeshStandardMaterial) { if (c.metalness > 0.6) c.metalness = 0.5; c.roughness = Math.max(c.roughness ?? 0.5, 0.35); c.envMapIntensity = 1.35; } });
      }
    });
    return m;
  }, [scene, tint]);
  const animRoot = useRef<THREE.Group>(null);
  const sitHeld = useRef(false);
  const { actions, names } = useAnimations(animations, animRoot);
  const { groupRef, stateRef } = useUnifiedMovement(def, world, lookRef, { onMove, seatRef });
  // Animated grounding (founder report 2026-10-26: the PLAYER's feet
  // stood under the floor — the static pose measure misses how low
  // the clips plant). Sample the playing pose, lift once.
  const groundSampler = useRef(makeGroundSampler());
  useFrame((_, dt) => {
    if (!seatRef?.current) {
      const lift = groundSampler.current(modelObj, Math.min(dt, 0.05));
      if (lift !== null && lift > 0) modelObj.position.y += lift;
    }
    const { moving, sprint } = stateRef.current;
    const idleName = names.find((x) => /idle/i.test(x)) ?? names[0];
    const runName = names.find((x) => /run/i.test(x));
    const walkName = names.find((x) => /walk/i.test(x)) ?? idleName;
    const sitName = seatRef?.current ? (names.find((x) => /sitting/i.test(x)) ?? null) : null;
    const want = sitName ?? (!moving ? idleName : (sprint && runName ? runName : walkName));
    const a = want ? actions[want] : undefined;
    if (a && sitName) {
      // The Sitting clip is a sit-DOWN transition: play once and clamp
      // on its final frame — never loop it (same law as the bots).
      if (!sitHeld.current) {
        sitHeld.current = true;
        Object.values(actions).forEach((x) => { if (x && x !== a) x.fadeOut(0.2); });
        a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true;
        a.reset().fadeIn(0.2).play();
      }
      return;
    }
    sitHeld.current = false;
    if (a && !a.isRunning()) { Object.values(actions).forEach((x) => x?.fadeOut(0.2)); a.reset().fadeIn(0.2).play(); }
  });
  const spawn = world.spawn ?? [0, 0, 0];
  return (
    <group ref={groupRef} position={spawn} visible={def.mode !== 'first'}>
      <group ref={animRoot}>
        <primitive object={modelObj} />
      </group>
      {ring && <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}><ringGeometry args={[0.45, 0.55, 32]} /><meshBasicMaterial color={ring} /></mesh>}
      {name && (
        <Html position={[0, 2.05, 0]} center distanceFactor={10} zIndexRange={[10, 0]}>
          <div className="whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur bg-primary/90 text-primary-foreground">{name}</div>
        </Html>
      )}
    </group>
  );
}
