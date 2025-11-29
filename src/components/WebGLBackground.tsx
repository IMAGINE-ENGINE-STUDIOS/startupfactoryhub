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
    camera.position.z = 30;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);

    // Colors based on theme
    const primaryColor = isDark ? new THREE.Color(0x6366f1) : new THREE.Color(0x0ea5e9);
    const secondaryColor = isDark ? new THREE.Color(0x8b5cf6) : new THREE.Color(0x10b981);
    const accentColor = isDark ? new THREE.Color(0xec4899) : new THREE.Color(0xf59e0b);

    // Create flowing gradient blob
    const blobGeometry = new THREE.IcosahedronGeometry(12, 6);
    const blobMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uColorA: { value: primaryColor },
        uColorB: { value: secondaryColor },
        uColorC: { value: accentColor },
      },
      vertexShader: `
        uniform float uTime;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;
        
        // Simplex noise function
        vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
        vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
        vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
        
        float snoise(vec3 v) {
          const vec2 C = vec2(1.0/6.0, 1.0/3.0);
          const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
          vec3 i  = floor(v + dot(v, C.yyy));
          vec3 x0 = v - i + dot(i, C.xxx);
          vec3 g = step(x0.yzx, x0.xyz);
          vec3 l = 1.0 - g;
          vec3 i1 = min(g.xyz, l.zxy);
          vec3 i2 = max(g.xyz, l.zxy);
          vec3 x1 = x0 - i1 + C.xxx;
          vec3 x2 = x0 - i2 + C.yyy;
          vec3 x3 = x0 - D.yyy;
          i = mod289(i);
          vec4 p = permute(permute(permute(
            i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
          float n_ = 0.142857142857;
          vec3 ns = n_ * D.wyz - D.xzx;
          vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
          vec4 x_ = floor(j * ns.z);
          vec4 y_ = floor(j - 7.0 * x_);
          vec4 x = x_ *ns.x + ns.yyyy;
          vec4 y = y_ *ns.x + ns.yyyy;
          vec4 h = 1.0 - abs(x) - abs(y);
          vec4 b0 = vec4(x.xy, y.xy);
          vec4 b1 = vec4(x.zw, y.zw);
          vec4 s0 = floor(b0)*2.0 + 1.0;
          vec4 s1 = floor(b1)*2.0 + 1.0;
          vec4 sh = -step(h, vec4(0.0));
          vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy;
          vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww;
          vec3 p0 = vec3(a0.xy, h.x);
          vec3 p1 = vec3(a0.zw, h.y);
          vec3 p2 = vec3(a1.xy, h.z);
          vec3 p3 = vec3(a1.zw, h.w);
          vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
          p0 *= norm.x;
          p1 *= norm.y;
          p2 *= norm.z;
          p3 *= norm.w;
          vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
          m = m * m;
          return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
        }
        
        void main() {
          vNormal = normal;
          vPosition = position;
          
          float noise = snoise(position * 0.15 + uTime * 0.3);
          float noise2 = snoise(position * 0.3 + uTime * 0.2);
          vDisplacement = noise * 0.5 + noise2 * 0.3;
          
          vec3 newPosition = position + normal * vDisplacement * 2.5;
          
          gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
      `,
      fragmentShader: `
        uniform float uTime;
        uniform vec3 uColorA;
        uniform vec3 uColorB;
        uniform vec3 uColorC;
        varying vec3 vNormal;
        varying vec3 vPosition;
        varying float vDisplacement;
        
        void main() {
          float fresnel = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 2.0);
          
          vec3 color = mix(uColorA, uColorB, vDisplacement + 0.5);
          color = mix(color, uColorC, fresnel * 0.5);
          
          float alpha = 0.15 + fresnel * 0.25 + vDisplacement * 0.1;
          
          gl_FragColor = vec4(color, alpha);
        }
      `,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    const blob = new THREE.Mesh(blobGeometry, blobMaterial);
    blob.position.set(-15, 5, -10);
    scene.add(blob);

    // Create second smaller blob
    const blob2Geometry = new THREE.IcosahedronGeometry(8, 5);
    const blob2Material = blobMaterial.clone();
    blob2Material.uniforms.uColorA.value = secondaryColor;
    blob2Material.uniforms.uColorB.value = accentColor;
    blob2Material.uniforms.uColorC.value = primaryColor;
    
    const blob2 = new THREE.Mesh(blob2Geometry, blob2Material);
    blob2.position.set(18, -8, -15);
    scene.add(blob2);

    // Create floating rings
    const rings: THREE.Mesh[] = [];
    const ringCount = 3;
    
    for (let i = 0; i < ringCount; i++) {
      const ringGeometry = new THREE.TorusGeometry(6 + i * 3, 0.1, 16, 100);
      const ringMaterial = new THREE.MeshBasicMaterial({
        color: i === 0 ? primaryColor : i === 1 ? secondaryColor : accentColor,
        transparent: true,
        opacity: 0.2,
      });
      const ring = new THREE.Mesh(ringGeometry, ringMaterial);
      ring.position.set(0, 0, -20 - i * 5);
      ring.rotation.x = Math.PI * 0.3 * i;
      scene.add(ring);
      rings.push(ring);
    }

    // Create particle field
    const particleCount = 800;
    const particleGeometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const scales = new Float32Array(particleCount);
    const colors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() - 0.5) * 100;
      positions[i3 + 1] = (Math.random() - 0.5) * 100;
      positions[i3 + 2] = (Math.random() - 0.5) * 60 - 20;
      scales[i] = Math.random();
      
      const colorChoice = Math.random();
      const chosenColor = colorChoice < 0.33 ? primaryColor : colorChoice < 0.66 ? secondaryColor : accentColor;
      colors[i3] = chosenColor.r;
      colors[i3 + 1] = chosenColor.g;
      colors[i3 + 2] = chosenColor.b;
    }

    particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    particleGeometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1));
    particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTime: { value: 0 },
        uPixelRatio: { value: Math.min(window.devicePixelRatio, 2) },
      },
      vertexShader: `
        attribute float aScale;
        attribute vec3 color;
        uniform float uTime;
        uniform float uPixelRatio;
        varying vec3 vColor;
        
        void main() {
          vec3 pos = position;
          pos.y += sin(uTime * 0.5 + position.x * 0.1) * 2.0;
          pos.x += cos(uTime * 0.3 + position.z * 0.1) * 1.5;
          
          vec4 modelPosition = modelMatrix * vec4(pos, 1.0);
          vec4 viewPosition = viewMatrix * modelPosition;
          vec4 projectedPosition = projectionMatrix * viewPosition;
          
          gl_Position = projectedPosition;
          gl_PointSize = aScale * 20.0 * uPixelRatio;
          gl_PointSize *= (1.0 / -viewPosition.z);
          
          vColor = color;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          
          float alpha = 1.0 - smoothstep(0.0, 0.5, dist);
          alpha *= 0.6;
          
          gl_FragColor = vec4(vColor, alpha);
        }
      `,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Create glowing orbs
    const orbs: THREE.Mesh[] = [];
    const orbPositions = [
      { x: -25, y: 15, z: -30 },
      { x: 30, y: -12, z: -25 },
      { x: 5, y: 20, z: -35 },
    ];

    orbPositions.forEach((pos, i) => {
      const orbGeometry = new THREE.SphereGeometry(2, 32, 32);
      const orbMaterial = new THREE.ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uColor: { value: i === 0 ? primaryColor : i === 1 ? secondaryColor : accentColor },
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
            float pulse = 0.8 + sin(uTime * 2.0) * 0.2;
            gl_FragColor = vec4(uColor, intensity * pulse * 0.5);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      
      const orb = new THREE.Mesh(orbGeometry, orbMaterial);
      orb.position.set(pos.x, pos.y, pos.z);
      scene.add(orb);
      orbs.push(orb);
    });

    // Mouse interaction
    let mouseX = 0;
    let mouseY = 0;
    let targetX = 0;
    let targetY = 0;

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
      blobMaterial.uniforms.uTime.value = elapsedTime;
      blob2Material.uniforms.uTime.value = elapsedTime + 10;
      particleMaterial.uniforms.uTime.value = elapsedTime;
      
      orbs.forEach((orb, i) => {
        if (orb.material instanceof THREE.ShaderMaterial) {
          orb.material.uniforms.uTime.value = elapsedTime + i;
        }
        orb.position.y += Math.sin(elapsedTime * 0.5 + i) * 0.01;
      });

      // Animate blobs
      blob.rotation.x = elapsedTime * 0.1;
      blob.rotation.y = elapsedTime * 0.15;
      blob.position.y = 5 + Math.sin(elapsedTime * 0.5) * 2;
      
      blob2.rotation.x = elapsedTime * -0.12;
      blob2.rotation.y = elapsedTime * 0.1;
      blob2.position.y = -8 + Math.cos(elapsedTime * 0.4) * 3;

      // Animate rings
      rings.forEach((ring, i) => {
        ring.rotation.x += 0.002 * (i + 1);
        ring.rotation.z += 0.001 * (i + 1);
      });

      // Smooth camera follow
      targetX += (mouseX * 8 - targetX) * 0.02;
      targetY += (mouseY * 5 - targetY) * 0.02;
      
      camera.position.x = targetX;
      camera.position.y = targetY;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Resize handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
      particleMaterial.uniforms.uPixelRatio.value = Math.min(window.devicePixelRatio, 2);
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
      blobGeometry.dispose();
      blobMaterial.dispose();
      blob2Geometry.dispose();
      blob2Material.dispose();
      particleGeometry.dispose();
      particleMaterial.dispose();
      rings.forEach(ring => {
        ring.geometry.dispose();
        if (ring.material instanceof THREE.Material) ring.material.dispose();
      });
      orbs.forEach(orb => {
        orb.geometry.dispose();
        if (orb.material instanceof THREE.Material) orb.material.dispose();
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
