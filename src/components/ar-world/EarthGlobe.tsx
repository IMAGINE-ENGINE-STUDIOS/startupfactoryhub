import { useEffect, useRef } from "react";
import * as THREE from "three";
import type { ARDrop } from "@/hooks/useARDrops";

interface EarthGlobeProps {
  drops: ARDrop[];
  onPickLocation: (lat: number, lng: number) => void;
  onSelectDrop: (drop: ARDrop) => void;
  placingMode: boolean;
}

// Convert lat/lng to 3D vector on a sphere of radius r
const latLngToVec3 = (lat: number, lng: number, r: number) => {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const z = r * Math.sin(phi) * Math.sin(theta);
  const y = r * Math.cos(phi);
  return new THREE.Vector3(x, y, z);
};

// Convert 3D vector on the sphere back to lat/lng
const vec3ToLatLng = (v: THREE.Vector3) => {
  const r = v.length();
  const lat = 90 - (Math.acos(v.y / r) * 180) / Math.PI;
  const lng = ((Math.atan2(v.z, -v.x) * 180) / Math.PI) - 180;
  // Normalize lng into [-180, 180]
  const normalizedLng = ((lng + 540) % 360) - 180;
  return { lat, lng: normalizedLng };
};

export const EarthGlobe = ({
  drops,
  onPickLocation,
  onSelectDrop,
  placingMode,
}: EarthGlobeProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dropsRef = useRef<ARDrop[]>(drops);
  const placingModeRef = useRef(placingMode);
  const onPickRef = useRef(onPickLocation);
  const onSelectRef = useRef(onSelectDrop);

  useEffect(() => {
    dropsRef.current = drops;
    placingModeRef.current = placingMode;
    onPickRef.current = onPickLocation;
    onSelectRef.current = onSelectDrop;
  }, [drops, placingMode, onPickLocation, onSelectDrop]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000010);

    // Stars
    const starsGeo = new THREE.BufferGeometry();
    const starCount = 3000;
    const positions = new Float32Array(starCount * 3);
    for (let i = 0; i < starCount; i++) {
      const r = 200 + Math.random() * 600;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(Math.random() * 2 - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);
    }
    starsGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const stars = new THREE.Points(
      starsGeo,
      new THREE.PointsMaterial({ color: 0xffffff, size: 0.7, sizeAttenuation: true })
    );
    scene.add(stars);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 2000);
    camera.position.set(0, 0, 18);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    // Earth
    const EARTH_RADIUS = 5;
    const earthGeo = new THREE.SphereGeometry(EARTH_RADIUS, 64, 64);
    const textureLoader = new THREE.TextureLoader();
    textureLoader.setCrossOrigin("anonymous");

    const earthMat = new THREE.MeshPhongMaterial({
      color: 0x224466,
      emissive: 0x112233,
      shininess: 25,
    });
    const earth = new THREE.Mesh(earthGeo, earthMat);
    scene.add(earth);

    // Try to load a public Earth texture; fallback already set
    textureLoader.load(
      "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg",
      (tex) => {
        earthMat.map = tex;
        earthMat.color = new THREE.Color(0xffffff);
        earthMat.emissive = new THREE.Color(0x000000);
        earthMat.needsUpdate = true;
      },
      undefined,
      () => {
        // Keep fallback color
      }
    );

    // Atmosphere glow
    const atmosphereGeo = new THREE.SphereGeometry(EARTH_RADIUS * 1.04, 64, 64);
    const atmosphereMat = new THREE.MeshBasicMaterial({
      color: 0x4488ff,
      transparent: true,
      opacity: 0.08,
      side: THREE.BackSide,
    });
    scene.add(new THREE.Mesh(atmosphereGeo, atmosphereMat));

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const dir = new THREE.DirectionalLight(0xffffff, 1.1);
    dir.position.set(10, 5, 10);
    scene.add(dir);

    // Group to hold drop pins (rotates with the earth)
    const pinGroup = new THREE.Group();
    earth.add(pinGroup);

    const pinMeshes: { mesh: THREE.Mesh; drop: ARDrop }[] = [];

    const rebuildPins = () => {
      // Clear
      while (pinGroup.children.length) {
        const child = pinGroup.children[0];
        pinGroup.remove(child);
        if ((child as THREE.Mesh).geometry) (child as THREE.Mesh).geometry.dispose();
      }
      pinMeshes.length = 0;

      dropsRef.current.forEach((d) => {
        const pos = latLngToVec3(d.latitude, d.longitude, EARTH_RADIUS + 0.02);
        const geo = new THREE.ConeGeometry(0.06, 0.25, 8);
        const mat = new THREE.MeshStandardMaterial({
          color: new THREE.Color(d.color || "#00ffaa"),
          emissive: new THREE.Color(d.color || "#00ffaa"),
          emissiveIntensity: 0.6,
        });
        const pin = new THREE.Mesh(geo, mat);
        pin.position.copy(pos);
        pin.lookAt(0, 0, 0);
        pin.rotateX(Math.PI / 2);
        pin.userData.dropId = d.id;
        pinGroup.add(pin);
        pinMeshes.push({ mesh: pin, drop: d });
      });
    };
    rebuildPins();

    // Re-build pins when drops change (poll via small interval is unnecessary;
    // we rebuild on every animation frame check using length+ids hash)
    let lastDropsKey = "";
    const computeKey = () =>
      dropsRef.current.map((d) => d.id + d.color).join("|") + ":" + dropsRef.current.length;

    // Manual orbit controls
    let isDragging = false;
    let lastX = 0;
    let lastY = 0;
    let dragMoved = false;
    let rotationY = 0;
    let rotationX = 0;
    let targetRotY = 0;
    let targetRotX = 0;
    let zoom = 18;
    let targetZoom = 18;

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      isDragging = true;
      dragMoved = false;
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragMoved = true;
      targetRotY += dx * 0.005;
      targetRotX += dy * 0.005;
      targetRotX = Math.max(-Math.PI / 2 + 0.1, Math.min(Math.PI / 2 - 0.1, targetRotX));
      lastX = e.clientX;
      lastY = e.clientY;
    };
    const onPointerUp = (e: PointerEvent) => {
      if (!isDragging) return;
      isDragging = false;
      if (dragMoved) return;

      // Treat as click — raycast
      const rect = renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      // Check pins first
      const pinHits = raycaster.intersectObjects(pinMeshes.map((p) => p.mesh));
      if (pinHits.length > 0) {
        const hit = pinHits[0].object as THREE.Mesh;
        const found = pinMeshes.find((p) => p.mesh === hit);
        if (found) {
          onSelectRef.current(found.drop);
          return;
        }
      }

      // Otherwise, if placing mode -> intersect earth
      if (placingModeRef.current) {
        const earthHits = raycaster.intersectObject(earth);
        if (earthHits.length > 0) {
          // Convert from world space into earth-local, undoing earth rotation
          const localPoint = earth.worldToLocal(earthHits[0].point.clone());
          const { lat, lng } = vec3ToLatLng(localPoint);
          onPickRef.current(lat, lng);
        }
      }
    };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      targetZoom += e.deltaY * 0.01;
      targetZoom = Math.max(8, Math.min(40, targetZoom));
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("wheel", onWheel, { passive: false });

    const onResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener("resize", onResize);

    let raf = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);

      // Rebuild pins if drops list changed
      const key = computeKey();
      if (key !== lastDropsKey) {
        lastDropsKey = key;
        rebuildPins();
      }

      // Smooth interpolation
      rotationY += (targetRotY - rotationY) * 0.1;
      rotationX += (targetRotX - rotationX) * 0.1;
      zoom += (targetZoom - zoom) * 0.1;

      earth.rotation.y = rotationY;
      earth.rotation.x = rotationX;
      camera.position.z = zoom;

      // Pulse pins
      const t = performance.now() * 0.003;
      pinMeshes.forEach((p, i) => {
        const s = 1 + Math.sin(t + i) * 0.15;
        p.mesh.scale.set(s, 1, s);
      });

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("wheel", onWheel);
      window.removeEventListener("resize", onResize);
      renderer.dispose();
      earthGeo.dispose();
      earthMat.dispose();
      atmosphereGeo.dispose();
      atmosphereMat.dispose();
      starsGeo.dispose();
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ cursor: placingMode ? "crosshair" : "grab" }}
    />
  );
};
