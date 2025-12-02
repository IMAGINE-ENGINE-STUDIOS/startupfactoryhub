import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const WebGLBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);
  const [webGLAvailable, setWebGLAvailable] = useState(true);

  useEffect(() => {
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!containerRef.current || !webGLAvailable) return;

    let renderer: THREE.WebGLRenderer | null = null;

    try {

    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 250;

      // Renderer setup
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
      });
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);

    // Colors based on theme - Turquoise palette
    const primaryColor = 0x40E0D0; // Turquoise
    const secondaryColor = isDark ? 0x06b6d4 : 0x22d3ee; // Cyan/Ocean blue
    const accentColor = isDark ? 0x40E0D0 : 0x40E0D0; // Turquoise
    const glowColor = 0x40E0D0; // Turquoise for glow

    // Create globe group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Globe radius
    const globeRadius = 100;

    // Create dotted sphere (globe)
    const dotGeometry = new THREE.BufferGeometry();
    const dotCount = 3000;
    const positions = new Float32Array(dotCount * 3);
    const colors = new Float32Array(dotCount * 3);
    const sizes = new Float32Array(dotCount);

    const color = new THREE.Color(primaryColor);

    for (let i = 0; i < dotCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / dotCount);
      const theta = Math.sqrt(dotCount * Math.PI) * phi;

      const x = globeRadius * Math.sin(phi) * Math.cos(theta);
      const y = globeRadius * Math.sin(phi) * Math.sin(theta);
      const z = globeRadius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;

      sizes[i] = Math.random() * 2 + 1;
    }

    dotGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    dotGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    dotGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

    const dotMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        varying vec3 vColor;
        uniform float uTime;
        uniform float uPixelRatio;
        
        void main() {
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (200.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - smoothstep(0.3, 0.5, dist);
          gl_FragColor = vec4(vColor, alpha * 0.8);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const dots = new THREE.Points(dotGeometry, dotMaterial);
    globeGroup.add(dots);

    // Create wireframe rings
    const ringCount = 8;
    for (let i = 0; i < ringCount; i++) {
      const ringGeometry = new THREE.RingGeometry(
        globeRadius - 2 + (i * 3),
        globeRadius - 1 + (i * 3),
        64
      );
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: primaryColor,
        transparent: true,
        opacity: 0.1 - i * 0.01,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.rotation.x = Math.PI / 2;
      ring.rotation.y = (i * Math.PI) / ringCount;
      globeGroup.add(ring);
    }

    // Create latitude/longitude lines
    const createLatLongLines = () => {
      const lineMaterial = new THREE.LineBasicMaterial({
        color: primaryColor,
        transparent: true,
        opacity: 0.15,
      });

      // Latitude lines
      for (let lat = -60; lat <= 60; lat += 30) {
        const latRad = (lat * Math.PI) / 180;
        const radius = globeRadius * Math.cos(latRad);
        const y = globeRadius * Math.sin(latRad);

        const points: THREE.Vector3[] = [];
        for (let lon = 0; lon <= 360; lon += 5) {
          const lonRad = (lon * Math.PI) / 180;
          points.push(new THREE.Vector3(
            radius * Math.cos(lonRad),
            y,
            radius * Math.sin(lonRad)
          ));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, lineMaterial);
        globeGroup.add(line);
      }

      // Longitude lines
      for (let lon = 0; lon < 180; lon += 30) {
        const lonRad = (lon * Math.PI) / 180;
        const points: THREE.Vector3[] = [];

        for (let lat = -90; lat <= 90; lat += 5) {
          const latRad = (lat * Math.PI) / 180;
          points.push(new THREE.Vector3(
            globeRadius * Math.cos(latRad) * Math.cos(lonRad),
            globeRadius * Math.sin(latRad),
            globeRadius * Math.cos(latRad) * Math.sin(lonRad)
          ));
        }

        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, lineMaterial);
        globeGroup.add(line);
      }
    };

    createLatLongLines();

    // Create connection points (cities/nodes)
    const nodePositions = [
      { lat: 40.7128, lon: -74.006 },
      { lat: 51.5074, lon: -0.1278 },
      { lat: 35.6762, lon: 139.6503 },
      { lat: -33.8688, lon: 151.2093 },
      { lat: 1.3521, lon: 103.8198 },
      { lat: 37.7749, lon: -122.4194 },
      { lat: 48.8566, lon: 2.3522 },
      { lat: 55.7558, lon: 37.6173 },
      { lat: 22.3193, lon: 114.1694 },
      { lat: -23.5505, lon: -46.6333 },
      { lat: 25.2048, lon: 55.2708 },
      { lat: 19.076, lon: 72.8777 },
    ];

    const latLonToVector3 = (lat: number, lon: number, radius: number) => {
      const phi = (90 - lat) * (Math.PI / 180);
      const theta = (lon + 180) * (Math.PI / 180);
      return new THREE.Vector3(
        -radius * Math.sin(phi) * Math.cos(theta),
        radius * Math.cos(phi),
        radius * Math.sin(phi) * Math.sin(theta)
      );
    };

    // Create glowing nodes
    const nodes: THREE.Mesh[] = [];
    nodePositions.forEach((pos, index) => {
      const nodeGeometry = new THREE.SphereGeometry(2.5, 16, 16);
      const nodeMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: new THREE.Color(index % 2 === 0 ? secondaryColor : accentColor) },
        },
        vertexShader: `
          varying vec3 vNormal;
          void main() {
            vNormal = normalize(normalMatrix * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          uniform float uTime;
          varying vec3 vNormal;
          
          void main() {
            float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.0);
            float pulse = 0.7 + sin(uTime * 3.0) * 0.3;
            gl_FragColor = vec4(uColor, intensity * pulse);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
      const position = latLonToVector3(pos.lat, pos.lon, globeRadius);
      node.position.copy(position);
      globeGroup.add(node);
      nodes.push(node);

      // Add glow ring around node
      const ringGeometry = new THREE.RingGeometry(3, 5, 32);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: index % 2 === 0 ? secondaryColor : accentColor,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.copy(position);
      ring.lookAt(new THREE.Vector3(0, 0, 0));
      globeGroup.add(ring);
    });

    // Create connection arcs between nodes
    const connections: { curve: THREE.CubicBezierCurve3; line: THREE.Line; particles: THREE.Points }[] = [];

    const createArc = (start: THREE.Vector3, end: THREE.Vector3, colorHex: number) => {
      const distance = start.distanceTo(end);

      const curve = new THREE.CubicBezierCurve3(
        start,
        new THREE.Vector3().copy(start).normalize().multiplyScalar(globeRadius + distance * 0.25),
        new THREE.Vector3().copy(end).normalize().multiplyScalar(globeRadius + distance * 0.25),
        end
      );

      const points = curve.getPoints(50);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({
        color: colorHex,
        transparent: true,
        opacity: 0.4,
      });

      const line = new THREE.Line(geometry, material);
      globeGroup.add(line);

      // Create particles that travel along the arc
      const particleCount = 15;
      const particleGeometry = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      const particleSizes = new Float32Array(particleCount);

      for (let i = 0; i < particleCount; i++) {
        particleSizes[i] = Math.random() * 3 + 1;
      }

      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

      const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(colorHex) },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        },
        vertexShader: `
          attribute float size;
          uniform float uPixelRatio;
          
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * uPixelRatio * (150.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `,
        fragmentShader: `
          uniform vec3 uColor;
          
          void main() {
            float dist = length(gl_PointCoord - vec2(0.5));
            if (dist > 0.5) discard;
            float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      const particles = new THREE.Points(particleGeometry, particleMaterial);
      globeGroup.add(particles);

      return { curve, line, particles };
    };

    // Create connections between random pairs of nodes
    const connectionPairs = [
      [0, 1], [0, 5], [1, 2], [1, 6], [2, 4], [2, 8],
      [3, 4], [4, 8], [5, 6], [6, 7], [7, 8], [9, 0],
      [10, 11], [10, 8], [11, 2], [3, 9], [5, 9], [6, 10]
    ];

    connectionPairs.forEach(([i, j], index) => {
      const start = latLonToVector3(nodePositions[i].lat, nodePositions[i].lon, globeRadius);
      const end = latLonToVector3(nodePositions[j].lat, nodePositions[j].lon, globeRadius);
      const colorHex = index % 3 === 0 ? primaryColor : index % 3 === 1 ? secondaryColor : accentColor;
      connections.push(createArc(start, end, colorHex));
    });

    // Create outer glow - more solid green/turquoise
    const glowGeometry = new THREE.SphereGeometry(globeRadius * 1.12, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(glowColor) },
        uTime: { value: 0 },
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        uniform float uTime;
        varying vec3 vNormal;
        
        void main() {
          float intensity = pow(0.7 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 2.5);
          float pulse = 0.85 + sin(uTime * 0.5) * 0.15;
          gl_FragColor = vec4(uColor, intensity * 0.7 * pulse);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    globeGroup.add(glow);

    // Add inner glow layer for more solid effect
    const innerGlowGeometry = new THREE.SphereGeometry(globeRadius * 1.05, 32, 32);
    const innerGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(0x40E0D0) }, // Turquoise
      },
      vertexShader: `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying vec3 vNormal;
        
        void main() {
          float intensity = pow(0.6 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(uColor, intensity * 0.5);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const innerGlow = new THREE.Mesh(innerGlowGeometry, innerGlowMaterial);
    globeGroup.add(innerGlow);

    // Create background particles
    const bgParticleCount = 500;
    const bgParticleGeometry = new THREE.BufferGeometry();
    const bgPositions = new Float32Array(bgParticleCount * 3);
    const bgSizes = new Float32Array(bgParticleCount);

    for (let i = 0; i < bgParticleCount; i++) {
      bgPositions[i * 3] = (Math.random() - 0.5) * 800;
      bgPositions[i * 3 + 1] = (Math.random() - 0.5) * 800;
      bgPositions[i * 3 + 2] = (Math.random() - 0.5) * 400 - 200;
      bgSizes[i] = Math.random() * 2 + 0.5;
    }

    bgParticleGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
    bgParticleGeometry.setAttribute('size', new THREE.BufferAttribute(bgSizes, 1));

    const bgParticleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: new THREE.Color(primaryColor) },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        uniform float uPixelRatio;
        
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * uPixelRatio * (100.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 0.3 * (1.0 - smoothstep(0.0, 0.5, dist));
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const bgParticles = new THREE.Points(bgParticleGeometry, bgParticleMaterial);
    scene.add(bgParticles);

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Update shader uniforms
      dotMaterial.uniforms.uTime.value = elapsedTime;
      glowMaterial.uniforms.uTime.value = elapsedTime;
      
      nodes.forEach((node) => {
        if (node.material instanceof THREE.ShaderMaterial) {
          node.material.uniforms.uTime.value = elapsedTime;
        }
      });

      // Animate particles along connection arcs
      connections.forEach((connection, connIndex) => {
        const positions = connection.particles.geometry.attributes.position.array as Float32Array;
        const particleCount = positions.length / 3;

        for (let i = 0; i < particleCount; i++) {
          const t = ((elapsedTime * 0.3 + i / particleCount + connIndex * 0.1) % 1);
          const point = connection.curve.getPoint(t);
          positions[i * 3] = point.x;
          positions[i * 3 + 1] = point.y;
          positions[i * 3 + 2] = point.z;
        }

        connection.particles.geometry.attributes.position.needsUpdate = true;
      });

      // Smooth rotation based on mouse
      targetRotationY += (mouseX * 0.5 - targetRotationY) * 0.02;
      targetRotationX += (mouseY * 0.3 - targetRotationX) * 0.02;

      // Auto rotation + mouse influence
      globeGroup.rotation.y = elapsedTime * 0.1 + targetRotationY;
      globeGroup.rotation.x = targetRotationX * 0.5;

      // Animate background particles
      bgParticles.rotation.y = elapsedTime * 0.02;

      renderer.render(scene, camera);
      if (renderer) {
        requestAnimationFrame(animate);
      }
    };

    animate();

    // Resize handler
    const handleResize = () => {
      if (!renderer) return;
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      dotMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
      bgParticleMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer) {
        if (containerRef.current && renderer.domElement) {
          containerRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      }
      dotGeometry.dispose();
      dotMaterial.dispose();
      bgParticleGeometry.dispose();
      bgParticleMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      innerGlowGeometry.dispose();
      innerGlowMaterial.dispose();
    };
    } catch (error) {
      console.warn('WebGL not available, skipping 3D background:', error);
      setWebGLAvailable(false);
      return () => {};
    }
  }, [isDark, webGLAvailable]);

  if (!webGLAvailable) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
};

export default WebGLBackground;
