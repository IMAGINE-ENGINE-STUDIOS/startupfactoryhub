import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const WebGLBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDark, setIsDark] = useState(false);

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
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 280;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Colors - Turquoise palette
    const primaryColor = new THREE.Color(0x40E0D0);
    const secondaryColor = new THREE.Color(isDark ? 0x06b6d4 : 0x22d3ee);
    const accentColor = new THREE.Color(0x40E0D0);

    // Create globe group
    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // Globe radius
    const globeRadius = 100;

    // ========== POINT CLOUD GLOBE (GitHub Style) ==========
    
    // Generate points on sphere surface using golden ratio spiral
    const pointCount = 2000;
    const pointPositions = new Float32Array(pointCount * 3);
    const pointColors = new Float32Array(pointCount * 3);
    const pointSizes = new Float32Array(pointCount);
    const pointAlphas = new Float32Array(pointCount);

    const goldenRatio = (1 + Math.sqrt(5)) / 2;

    for (let i = 0; i < pointCount; i++) {
      // Golden ratio spiral distribution for even coverage
      const y = 1 - (i / (pointCount - 1)) * 2;
      const radiusAtY = Math.sqrt(1 - y * y);
      const theta = 2 * Math.PI * i / goldenRatio;

      const x = Math.cos(theta) * radiusAtY;
      const z = Math.sin(theta) * radiusAtY;

      pointPositions[i * 3] = x * globeRadius;
      pointPositions[i * 3 + 1] = y * globeRadius;
      pointPositions[i * 3 + 2] = z * globeRadius;

      // Vary colors slightly
      const colorMix = Math.random();
      const color = colorMix > 0.7 ? secondaryColor : primaryColor;
      pointColors[i * 3] = color.r;
      pointColors[i * 3 + 1] = color.g;
      pointColors[i * 3 + 2] = color.b;

      // Random sizes for variety
      pointSizes[i] = Math.random() * 2.5 + 0.8;
      pointAlphas[i] = Math.random() * 0.5 + 0.5;
    }

    const pointGeometry = new THREE.BufferGeometry();
    pointGeometry.setAttribute('position', new THREE.BufferAttribute(pointPositions, 3));
    pointGeometry.setAttribute('color', new THREE.BufferAttribute(pointColors, 3));
    pointGeometry.setAttribute('size', new THREE.BufferAttribute(pointSizes, 1));
    pointGeometry.setAttribute('alpha', new THREE.BufferAttribute(pointAlphas, 1));

    const pointMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        attribute vec3 color;
        attribute float alpha;
        varying vec3 vColor;
        varying float vAlpha;
        uniform float uTime;
        uniform float uPixelRatio;
        
        void main() {
          vColor = color;
          vAlpha = alpha;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          
          // Subtle size pulsing
          float pulse = 1.0 + sin(uTime * 2.0 + position.x * 0.1) * 0.1;
          gl_PointSize = size * uPixelRatio * pulse * (180.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        varying float vAlpha;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Soft circular point with glow
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= vAlpha;
          
          gl_FragColor = vec4(vColor, alpha * 0.85);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const pointCloud = new THREE.Points(pointGeometry, pointMaterial);
    globeGroup.add(pointCloud);

    // ========== CONNECTION NODES (Cities) ==========
    const nodePositions = [
      { lat: 40.7128, lon: -74.006 },   // New York
      { lat: 51.5074, lon: -0.1278 },   // London
      { lat: 35.6762, lon: 139.6503 },  // Tokyo
      { lat: -33.8688, lon: 151.2093 }, // Sydney
      { lat: 1.3521, lon: 103.8198 },   // Singapore
      { lat: 37.7749, lon: -122.4194 }, // San Francisco
      { lat: 48.8566, lon: 2.3522 },    // Paris
      { lat: 55.7558, lon: 37.6173 },   // Moscow
      { lat: 22.3193, lon: 114.1694 },  // Hong Kong
      { lat: -23.5505, lon: -46.6333 }, // São Paulo
      { lat: 25.2048, lon: 55.2708 },   // Dubai
      { lat: 19.076, lon: 72.8777 },    // Mumbai
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

    // Create glowing node points
    const nodeVectors: THREE.Vector3[] = [];
    const nodePointPositions = new Float32Array(nodePositions.length * 3);
    const nodePointSizes = new Float32Array(nodePositions.length);

    nodePositions.forEach((pos, i) => {
      const vec = latLonToVector3(pos.lat, pos.lon, globeRadius);
      nodeVectors.push(vec);
      nodePointPositions[i * 3] = vec.x;
      nodePointPositions[i * 3 + 1] = vec.y;
      nodePointPositions[i * 3 + 2] = vec.z;
      nodePointSizes[i] = 6;
    });

    const nodeGeometry = new THREE.BufferGeometry();
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(nodePointPositions, 3));
    nodeGeometry.setAttribute('size', new THREE.BufferAttribute(nodePointSizes, 1));

    const nodeMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColor: { value: accentColor },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        uniform float uTime;
        uniform float uPixelRatio;
        varying float vPulse;
        
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vPulse = 0.7 + sin(uTime * 3.0 + position.y * 0.1) * 0.3;
          gl_PointSize = size * uPixelRatio * vPulse * (180.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vPulse;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          // Glowing point with soft edges
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          float glow = exp(-dist * 4.0);
          
          gl_FragColor = vec4(uColor, (alpha + glow * 0.5) * vPulse);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const nodePoints = new THREE.Points(nodeGeometry, nodeMaterial);
    globeGroup.add(nodePoints);

    // ========== CONNECTIONS BETWEEN NODES ==========
    const connections: { line: THREE.Line; particles: THREE.Points; curve: THREE.QuadraticBezierCurve3 }[] = [];

    const connectionPairs = [
      [0, 1], [0, 5], [1, 2], [1, 6], [2, 4], [2, 8],
      [3, 4], [4, 8], [5, 6], [6, 7], [7, 8], [9, 0],
      [10, 11], [10, 8], [11, 2], [3, 9], [5, 9], [6, 10]
    ];

    connectionPairs.forEach(([i, j]) => {
      const start = nodeVectors[i];
      const end = nodeVectors[j];
      
      // Create curved arc
      const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
      const distance = start.distanceTo(end);
      midPoint.normalize().multiplyScalar(globeRadius + distance * 0.2);

      const curve = new THREE.QuadraticBezierCurve3(start, midPoint, end);
      const curvePoints = curve.getPoints(40);

      // Draw the arc line with dots (dotted line effect)
      const lineGeometry = new THREE.BufferGeometry();
      const linePositions = new Float32Array(curvePoints.length * 3);
      const lineSizes = new Float32Array(curvePoints.length);

      curvePoints.forEach((point, idx) => {
        linePositions[idx * 3] = point.x;
        linePositions[idx * 3 + 1] = point.y;
        linePositions[idx * 3 + 2] = point.z;
        lineSizes[idx] = 1.2;
      });

      lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
      lineGeometry.setAttribute('size', new THREE.BufferAttribute(lineSizes, 1));

      const lineMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: primaryColor },
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
            float alpha = 0.4 * (1.0 - smoothstep(0.0, 0.5, dist));
            gl_FragColor = vec4(uColor, alpha);
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const line = new THREE.Points(lineGeometry, lineMaterial) as unknown as THREE.Line;
      globeGroup.add(line);

      // Traveling particles along the arc
      const particleCount = 8;
      const particleGeometry = new THREE.BufferGeometry();
      const particlePositions = new Float32Array(particleCount * 3);
      const particleSizes = new Float32Array(particleCount);

      for (let p = 0; p < particleCount; p++) {
        particleSizes[p] = Math.random() * 2.5 + 1.5;
      }

      particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
      particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));

      const particleMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: accentColor },
          uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
        },
        vertexShader: `
          attribute float size;
          uniform float uPixelRatio;
          
          void main() {
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * uPixelRatio * (180.0 / -mvPosition.z);
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
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      });

      const particles = new THREE.Points(particleGeometry, particleMaterial);
      globeGroup.add(particles);

      connections.push({ line, particles, curve });
    });

    // ========== SUBTLE GLOW EFFECT ==========
    const glowGeometry = new THREE.SphereGeometry(globeRadius * 1.08, 32, 32);
    const glowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: primaryColor },
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
          float intensity = pow(0.65 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          float pulse = 0.9 + sin(uTime * 0.5) * 0.1;
          gl_FragColor = vec4(uColor, intensity * 0.4 * pulse);
        }
      `,
      transparent: true,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    globeGroup.add(glow);

    // ========== BACKGROUND STARS ==========
    const starCount = 600;
    const starGeometry = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starSizes = new Float32Array(starCount);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 1000;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
      starPositions[i * 3 + 2] = (Math.random() - 0.5) * 500 - 250;
      starSizes[i] = Math.random() * 1.5 + 0.3;
    }

    starGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeometry.setAttribute('size', new THREE.BufferAttribute(starSizes, 1));

    const starMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uColor: { value: primaryColor },
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float size;
        uniform float uPixelRatio;
        uniform float uTime;
        varying float vTwinkle;
        
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vTwinkle = 0.5 + sin(uTime * 2.0 + position.x * 0.05) * 0.5;
          gl_PointSize = size * uPixelRatio * (80.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 uColor;
        varying float vTwinkle;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 0.3 * vTwinkle * (1.0 - smoothstep(0.0, 0.5, dist));
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);

    // ========== MOUSE INTERACTION ==========
    let mouseX = 0;
    let mouseY = 0;
    let targetRotationX = 0;
    let targetRotationY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // ========== ANIMATION LOOP ==========
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Update shader uniforms
      pointMaterial.uniforms.uTime.value = elapsedTime;
      nodeMaterial.uniforms.uTime.value = elapsedTime;
      glowMaterial.uniforms.uTime.value = elapsedTime;
      starMaterial.uniforms.uTime.value = elapsedTime;

      // Animate particles along connection arcs
      connections.forEach((connection, connIndex) => {
        const positions = connection.particles.geometry.attributes.position.array as Float32Array;
        const particleCount = positions.length / 3;

        for (let i = 0; i < particleCount; i++) {
          const t = ((elapsedTime * 0.25 + i / particleCount + connIndex * 0.15) % 1);
          const point = connection.curve.getPoint(t);
          positions[i * 3] = point.x;
          positions[i * 3 + 1] = point.y;
          positions[i * 3 + 2] = point.z;
        }

        connection.particles.geometry.attributes.position.needsUpdate = true;
      });

      // Smooth rotation based on mouse
      targetRotationY += (mouseX * 0.4 - targetRotationY) * 0.02;
      targetRotationX += (mouseY * 0.25 - targetRotationX) * 0.02;

      // Auto rotation + mouse influence
      globeGroup.rotation.y = elapsedTime * 0.08 + targetRotationY;
      globeGroup.rotation.x = targetRotationX * 0.4;

      // Gentle star rotation
      stars.rotation.y = elapsedTime * 0.01;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      const pixelRatio = Math.min(window.devicePixelRatio, 2);
      pointMaterial.uniforms.uPixelRatio.value = pixelRatio;
      nodeMaterial.uniforms.uPixelRatio.value = pixelRatio;
      starMaterial.uniforms.uPixelRatio.value = pixelRatio;
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
      pointGeometry.dispose();
      pointMaterial.dispose();
      nodeGeometry.dispose();
      nodeMaterial.dispose();
      glowGeometry.dispose();
      glowMaterial.dispose();
      starGeometry.dispose();
      starMaterial.dispose();
      connections.forEach(conn => {
        conn.particles.geometry.dispose();
        (conn.particles.material as THREE.Material).dispose();
      });
    };
  }, [isDark]);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
};

export default WebGLBackground;
