/** Copyright Imagine Engine Studios Corp. All rights reserved. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import dracoDecoderUrl from 'three/examples/jsm/libs/draco/gltf/draco_decoder.js?url';
import roverAsset from '@/assets/perseverance-rover.glb.asset.json';
import logoUrl from '@/assets/sfh-logo-sphere.png';

export const EQUITY_BANNER_WIDTH = 1200;
export const EQUITY_BANNER_HEIGHT = 630;

export async function createEquityBannerRenderer(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Banner drawing is unavailable in this browser.');
  canvas.width = EQUITY_BANNER_WIDTH;
  canvas.height = EQUITY_BANNER_HEIGHT;
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string) => `hsl(${styles.getPropertyValue(name).trim()})`;
  const colors = {
    background: token('--equity-banner-background'),
    ink: token('--equity-banner-ink'),
    muted: token('--equity-banner-muted'),
    accent: token('--equity-banner-accent'),
    rule: token('--equity-banner-rule'),
  };
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  const draco = new DRACOLoader();
  draco.setDecoderPath(dracoDecoderUrl.slice(0, dracoDecoderUrl.lastIndexOf('/') + 1));
  draco.setDecoderConfig({ type: 'js' });
  renderer.setSize(560, 510);
  renderer.setPixelRatio(1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, 560 / 510, 0.1, 100);
  camera.position.set(0, 1.4, 6.5);
  camera.lookAt(0, 0.15, 0);
  scene.add(new THREE.HemisphereLight(colors.ink, colors.accent, 2.2));
  const light = new THREE.DirectionalLight(colors.ink, 3.2);
  light.position.set(3, 5, 4);
  scene.add(light);
  const rim = new THREE.DirectionalLight(colors.accent, 2);
  rim.position.set(-3, 2, -2);
  scene.add(rim);
  let model: THREE.Object3D | undefined;
  const dispose = () => {
    model?.traverse((object) => {
      if (object instanceof THREE.Mesh) {
        object.geometry.dispose();
        const materials = Array.isArray(object.material) ? object.material : [object.material];
        materials.forEach((material) => {
          Object.values(material).forEach((value) => { if (value instanceof THREE.Texture) value.dispose(); });
          material.dispose();
        });
      }
    });
    renderer.dispose();
    renderer.forceContextLoss();
    draco.dispose();
  };
  const logo = new Image();
  logo.src = logoUrl;
  try {
    const [gltf] = await Promise.all([
      new GLTFLoader().setDRACOLoader(draco).loadAsync(roverAsset.url), logo.decode(), document.fonts.ready,
    ]);
    model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 3.9 / Math.max(size.x, size.y, size.z);
    model.position.copy(center).multiplyScalar(-scale);
    model.scale.setScalar(scale);
    const pivot = new THREE.Group();
    pivot.add(model);
    scene.add(pivot);
    const text = (value: string, x: number, y: number, font: string, color = colors.ink) => {
      ctx.font = font;
      ctx.fillStyle = color;
      ctx.fillText(value, x, y);
    };
    const draw = (time: number) => {
      ctx.fillStyle = colors.background;
      ctx.fillRect(0, 0, 1200, 630);
      ctx.strokeStyle = colors.rule;
      ctx.lineWidth = 1;
      for (let x = 690; x < 1200; x += 42) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 540); ctx.stroke();
      }
      for (let y = 36; y < 540; y += 42) {
        ctx.beginPath(); ctx.moveTo(690, y); ctx.lineTo(1200, y); ctx.stroke();
      }
      ctx.drawImage(logo, 48, 37, 54, 54);
      text('STARTUP FACTORY HUB', 117, 70, '700 19px "Space Grotesk", sans-serif');
      text('EQUITY PROGRAM', 50, 137, '600 15px "Space Grotesk", sans-serif', colors.accent);
      text('From idea to', 47, 214, '600 53px "Space Grotesk", sans-serif');
      text('investable company.', 47, 277, '600 53px "Space Grotesk", sans-serif');
      ctx.fillStyle = colors.accent;
      ctx.fillRect(50, 310, 70, 3);
      text('1–10%', 47, 416, '700 88px "Space Grotesk", sans-serif', colors.accent);
      text('EQUITY', 330, 408, '600 20px "Space Grotesk", sans-serif');
      text('Build your venture with Startup Factory Hub.', 50, 460, '400 23px "Space Grotesk", sans-serif', colors.muted);
      // A genuine 3D turntable, not a moving photograph: all rover views render from the existing model.
      pivot.rotation.y = 0.55 + time * Math.PI * 2 / 6;
      renderer.render(scene, camera);
      ctx.drawImage(renderer.domElement, 654, 38, 560, 510);
      ctx.strokeStyle = colors.rule;
      ctx.beginPath(); ctx.moveTo(50, 535); ctx.lineTo(1150, 535); ctx.stroke();
      text('Explore the equity program', 50, 577, '600 22px "Space Grotesk", sans-serif');
      text('startupfactoryhub.com/equity-program', 650, 577, '500 21px "Space Grotesk", sans-serif', colors.accent);
      text('© Imagine Engine Studios Corp.', 50, 610, '400 11px "Space Grotesk", sans-serif', colors.muted);
    };
    return { draw, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}