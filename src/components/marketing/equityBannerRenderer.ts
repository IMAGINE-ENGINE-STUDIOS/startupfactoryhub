/** Copyright Imagine Engine Studios Corp. All rights reserved. */
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import roverAsset from '@/assets/perseverance-rover.glb.asset.json';
import logoAsset from '@/assets/sfh-main-logo.png.asset.json';
import backgroundUrl from '@/assets/accelerated-fundraising-bg.jpg';

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
    overlay: token('--equity-banner-overlay'),
  };
  const fontFamily = '"Helvetica Neue", Arial, sans-serif';
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, preserveDrawingBuffer: true });
  const draco = new DRACOLoader();
  draco.setDecoderPath('/vendor/draco/');
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
  logo.src = logoAsset.url;
  const background = new Image();
  background.src = backgroundUrl;
  try {
    const [gltf] = await Promise.all([
      new GLTFLoader().setDRACOLoader(draco).loadAsync(roverAsset.url), logo.decode(), background.decode(), document.fonts.ready,
    ]);
    model = gltf.scene;
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const scale = 3.35 / Math.max(size.x, size.y, size.z);
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
      const imageScale = Math.max(1200 / background.naturalWidth, 630 / background.naturalHeight);
      const imageWidth = background.naturalWidth * imageScale;
      const imageHeight = background.naturalHeight * imageScale;
      ctx.drawImage(background, (1200 - imageWidth) / 2, (630 - imageHeight) / 2, imageWidth, imageHeight);
      const overlay = ctx.createLinearGradient(0, 0, 1200, 0);
      overlay.addColorStop(0, colors.background);
      overlay.addColorStop(0.5, colors.overlay);
      overlay.addColorStop(1, colors.overlay);
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, 1200, 630);
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = colors.rule;
      ctx.lineWidth = 1;
      for (let x = 0; x < 1200; x += 48) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, 630); ctx.stroke();
      }
      for (let y = 0; y < 630; y += 48) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(1200, y); ctx.stroke();
      }
      ctx.restore();
      const logoHeight = 120;
      const logoWidth = logoHeight * logo.naturalWidth / logo.naturalHeight;
      ctx.drawImage(logo, 40, 0, logoWidth, logoHeight);
      text('EQUITY PROGRAM', 50, 137, `500 15px ${fontFamily}`, colors.accent);
      text('From idea to', 47, 214, `900 56px ${fontFamily}`);
      text('investable company.', 47, 277, `900 56px ${fontFamily}`);
      ctx.fillStyle = colors.accent;
      ctx.fillRect(50, 310, 70, 3);
      text('1–10%', 47, 416, `900 88px ${fontFamily}`, colors.accent);
      text('EQUITY', 330, 408, `700 20px ${fontFamily}`);
      text('Build your venture with Startup Factory Hub.', 50, 460, `300 23px ${fontFamily}`, colors.muted);
      // A genuine 3D turntable, not a moving photograph: all rover views render from the existing model.
      pivot.rotation.y = 0.55 + time * Math.PI * 2 / 6;
      renderer.render(scene, camera);
      ctx.drawImage(renderer.domElement, 654, 38, 560, 510);
      ctx.strokeStyle = colors.rule;
      ctx.beginPath(); ctx.moveTo(50, 535); ctx.lineTo(1150, 535); ctx.stroke();
      text('Explore the equity program', 50, 577, `700 22px ${fontFamily}`);
      text('startupfactoryhub.com/equity-program', 650, 577, `500 21px ${fontFamily}`, colors.accent);
      text('© Imagine Engine Studios Corp.', 50, 610, `400 11px ${fontFamily}`, colors.muted);
    };
    return { draw, dispose };
  } catch (error) {
    dispose();
    throw error;
  }
}