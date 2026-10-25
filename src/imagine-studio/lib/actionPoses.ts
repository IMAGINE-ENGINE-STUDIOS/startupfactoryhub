// @ts-nocheck -- Imagine Studio v2
/**
 * Procedural action poses (sit / kneel low / jump) for humanoid rigs.
 *
 * Works on any rig whose bones can be auto-mapped to the 17 standard
 * controllers (same patterns as the Rig Controller Room). Rotations are
 * CALIBRATED against the rig itself: for each leg bone we test which local
 * rotation direction swings the child joint toward the character's facing
 * direction, so the same code sits a Mixamo rig, a custom rig, or a robot
 * without hand-tuned signs per model.
 *
 * Used by: the Rig Controller Room (one-click action pose presets she can
 * refine and save as rig saves), PlayableCharacter (sit/kneel fallback when
 * a model has no suitable clip), and the Office world (bots seated at desks).
 */
import * as THREE from "three";
import { capturePose, applyPose, type BonePose } from "./rigSaves";

export type ActionKind = "sit" | "kneel" | "jump";

type ControllerKey =
  | "hips" | "spine" | "chest" | "neck" | "head"
  | "leftShoulder" | "rightShoulder" | "leftElbow" | "rightElbow" | "leftHand" | "rightHand"
  | "leftHip" | "rightHip" | "leftKnee" | "rightKnee" | "leftFoot" | "rightFoot";

const PATTERNS: Record<ControllerKey, string[]> = {
  hips: ["hips", "pelvis", "root"],
  spine: ["spine1", "spine_01", "spine"],
  chest: ["spine2", "chest", "upperchest", "spine_02"],
  neck: ["neck"],
  head: ["head"],
  leftShoulder: ["leftshoulder", "shoulder_l", "l_shoulder", "leftarm", "arm_l"],
  rightShoulder: ["rightshoulder", "shoulder_r", "r_shoulder", "rightarm", "arm_r"],
  leftElbow: ["leftforearm", "forearm_l", "l_forearm", "leftlowerarm"],
  rightElbow: ["rightforearm", "forearm_r", "r_forearm", "rightlowerarm"],
  leftHand: ["lefthand", "hand_l", "l_hand"],
  rightHand: ["righthand", "hand_r", "r_hand"],
  leftHip: ["leftupleg", "leftthigh", "upleg_l", "l_upleg", "thigh_l", "hip_l"],
  rightHip: ["rightupleg", "rightthigh", "upleg_r", "r_upleg", "thigh_r", "hip_r"],
  leftKnee: ["leftleg", "leg_l", "l_leg", "leftshin", "leftcalf", "shin_l", "calf_l"],
  rightKnee: ["rightleg", "leg_r", "r_leg", "rightshin", "rightcalf", "shin_r", "calf_r"],
  leftFoot: ["leftfoot", "foot_l", "l_foot", "ankle_l"],
  rightFoot: ["rightfoot", "foot_r", "r_foot", "ankle_r"],
};

export function collectBones(root: THREE.Object3D): THREE.Bone[] {
  const out: THREE.Bone[] = [];
  root.traverse((o) => { if ((o as any).isBone) out.push(o as THREE.Bone); });
  return out;
}

export function autoMapControllers(root: THREE.Object3D): Record<ControllerKey, string | null> {
  const bones = collectBones(root);
  const lower = bones.map((b) => b.name.toLowerCase());
  const out = {} as Record<ControllerKey, string | null>;
  for (const key of Object.keys(PATTERNS) as ControllerKey[]) {
    let found: string | null = null;
    for (const pat of PATTERNS[key]) {
      const i = lower.findIndex((n) => n.includes(pat));
      if (i !== -1) { found = bones[i].name; break; }
    }
    out[key] = found;
  }
  return out;
}

function boneByName(root: THREE.Object3D, name: string | null): THREE.Bone | null {
  if (!name) return null;
  let found: THREE.Bone | null = null;
  root.traverse((o) => { if (!found && o.name === name && (o as any).isBone) found = o as THREE.Bone; });
  return found;
}

const _v1 = new THREE.Vector3();
const _v2 = new THREE.Vector3();
const _q = new THREE.Quaternion();

/**
 * Finds the local rotation (axis + sign) on `bone` that swings `child`'s
 * world position most toward `dirWorld`. Returns { axis, sign } or null.
 * The bone's local transform is restored before returning.
 */
function calibrateSwing(
  root: THREE.Object3D,
  bone: THREE.Bone,
  child: THREE.Object3D,
  dirWorld: THREE.Vector3,
): { axis: "x" | "y" | "z"; sign: 1 | -1 } | null {
  root.updateMatrixWorld(true);
  const before = child.getWorldPosition(new THREE.Vector3());
  const saved = bone.quaternion.clone();
  let best: { axis: "x" | "y" | "z"; sign: 1 | -1; score: number } | null = null;
  for (const axis of ["x", "y", "z"] as const) {
    for (const sign of [1, -1] as const) {
      bone.quaternion.copy(saved);
      _q.setFromAxisAngle(axis === "x" ? _v1.set(1, 0, 0) : axis === "y" ? _v1.set(0, 1, 0) : _v1.set(0, 0, 1), sign * 0.35);
      bone.quaternion.multiply(_q);
      root.updateMatrixWorld(true);
      const after = child.getWorldPosition(_v2);
      const score = after.sub(before).dot(dirWorld);
      if (!best || score > best.score) best = { axis, sign, score };
    }
  }
  bone.quaternion.copy(saved);
  root.updateMatrixWorld(true);
  return best && best.score > 1e-5 ? best : null;
}

function rotateBone(bone: THREE.Bone, axis: "x" | "y" | "z", angle: number) {
  _q.setFromAxisAngle(axis === "x" ? _v1.set(1, 0, 0) : axis === "y" ? _v1.set(0, 1, 0) : _v1.set(0, 0, 1), angle);
  bone.quaternion.multiply(_q);
}

/**
 * Applies an action pose directly to a live rig (bones + hips drop).
 * `forwardWorld` is the direction the character faces, in the same space the
 * rig's world matrix uses. `seatHeight` (world units) is where the hips
 * should end up for "sit" — defaults to a standard chair seat.
 * Returns true when at least the legs could be posed.
 */
export function applyActionPose(
  root: THREE.Object3D,
  action: ActionKind,
  opts: { forward?: THREE.Vector3; seatHeight?: number; map?: Record<ControllerKey, string | null> } = {},
): boolean {
  const map = opts.map ?? autoMapControllers(root);
  const forward = (opts.forward ?? new THREE.Vector3(0, 0, 1)).clone().setY(0).normalize();
  const backward = forward.clone().negate();
  root.updateMatrixWorld(true);

  const hips = boneByName(root, map.hips);
  const spine = boneByName(root, map.spine);
  let posed = false;

  const legs: Array<[ControllerKey, ControllerKey, ControllerKey]> = [
    ["leftHip", "leftKnee", "leftFoot"],
    ["rightHip", "rightKnee", "rightFoot"],
  ];
  for (const [hipKey, kneeKey, footKey] of legs) {
    const thigh = boneByName(root, map[hipKey]);
    const shin = boneByName(root, map[kneeKey]);
    const foot = boneByName(root, map[footKey]);
    if (!thigh || !shin) continue;
    // Thigh: swing the knee forward (sit / jump) or keep it near vertical (kneel).
    const thighTarget = action === "sit" ? 1.62 : action === "kneel" ? 0.3 : 0.85;
    const thighCal = calibrateSwing(root, thigh, shin, forward);
    if (thighCal) { rotateBone(thigh, thighCal.axis, thighCal.sign * thighTarget); posed = true; }
    // Shin: fold the foot backward (knee flexion).
    if (foot) {
      const shinTarget = action === "sit" ? 1.5 : action === "kneel" ? 2.15 : 1.1;
      const shinCal = calibrateSwing(root, shin, foot, backward);
      if (shinCal) { rotateBone(shin, shinCal.axis, shinCal.sign * shinTarget); posed = true; }
    }
    root.updateMatrixWorld(true);
  }

  // Spine leans a touch forward for sit/kneel, arches slightly for jump.
  if (spine && hips) {
    const head = boneByName(root, map.head) ?? spine;
    const spineTarget = action === "jump" ? -0.1 : 0.16;
    const cal = calibrateSwing(root, spine, head, spineTarget >= 0 ? forward : backward);
    if (cal) rotateBone(spine, cal.axis, cal.sign * Math.abs(spineTarget));
  }

  // Drop the hips so the pose meets the ground / seat instead of floating.
  if (hips && posed) {
    root.updateMatrixWorld(true);
    const hipWorld = hips.getWorldPosition(new THREE.Vector3());
    let targetHipY: number;
    if (action === "sit") targetHipY = (opts.seatHeight ?? 0.5) + 0.07;
    else if (action === "kneel") targetHipY = hipWorld.y * 0.38;
    else targetHipY = hipWorld.y * 0.82; // jump crouch
    const drop = hipWorld.y - targetHipY;
    if (drop > 0.01 && hips.parent) {
      const parent = hips.parent;
      const a = parent.worldToLocal(hipWorld.clone());
      const b = parent.worldToLocal(hipWorld.clone().add(new THREE.Vector3(0, -drop, 0)));
      hips.position.add(b.sub(a));
    }
  }
  root.updateMatrixWorld(true);
  return posed;
}

/** Builds a BonePose for an action (for the Rig Room presets / rig saves). */
export function buildActionPose(
  root: THREE.Object3D,
  action: ActionKind,
  opts: { forward?: THREE.Vector3; seatHeight?: number; map?: Record<ControllerKey, string | null> } = {},
): BonePose[] | null {
  const bind = capturePose(root);
  const ok = applyActionPose(root, action, opts);
  if (!ok) { applyPose(root, bind); return null; }
  const pose = capturePose(root);
  applyPose(root, bind);
  return pose;
}

/** World-space height of the hips bone (bind pose), or null. */
export function hipHeight(root: THREE.Object3D): number | null {
  const map = autoMapControllers(root);
  const hips = boneByName(root, map.hips);
  if (!hips) return null;
  root.updateMatrixWorld(true);
  return hips.getWorldPosition(new THREE.Vector3()).y;
}

export { capturePose, applyPose, type BonePose };
