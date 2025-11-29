import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

const WebGLBackground = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check initial theme
    const checkTheme = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkTheme();
    
    // Listen for theme changes
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
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 50;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Create particles
    const particlesGeometry = new THREE.BufferGeometry();
    const particlesCount = 1500;
    const posArray = new Float32Array(particlesCount * 3);

    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 100;
    }

    particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));

    // Particle material
    const particlesMaterial = new THREE.PointsMaterial({
      size: 0.3,
      color: isDark ? 0x4f46e5 : 0x10b981,
      transparent: true,
      opacity: isDark ? 0.8 : 0.6,
      blending: THREE.AdditiveBlending,
    });

    const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
    scene.add(particlesMesh);
    particlesRef.current = particlesMesh;

    // Create text sprites with Roman numerals and alphanumeric characters
    const characters = "ⅠⅡⅢⅣⅤⅥⅦⅧⅨⅩABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const textSprites: THREE.Sprite[] = [];
    const spriteCount = 50;

    for (let i = 0; i < spriteCount; i++) {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      canvas.width = 64;
      canvas.height = 64;
      
      if (context) {
        context.font = 'Bold 40px Arial';
        context.fillStyle = isDark ? 'rgba(79, 70, 229, 0.8)' : 'rgba(16, 185, 129, 0.7)';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        const char = characters.charAt(Math.floor(Math.random() * characters.length));
        context.fillText(char, 32, 32);
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      const spriteMaterial = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.6,
      });
      
      const sprite = new THREE.Sprite(spriteMaterial);
      sprite.position.set(
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100,
        (Math.random() - 0.5) * 100
      );
      sprite.scale.set(5, 5, 1);
      
      scene.add(sprite);
      textSprites.push(sprite);
    }

    // Create geometric shapes
    const geometries = [
      new THREE.TorusGeometry(10, 2, 16, 100),
      new THREE.OctahedronGeometry(8, 0),
      new THREE.IcosahedronGeometry(7, 0),
    ];

    const shapes: THREE.Mesh[] = [];
    geometries.forEach((geometry, index) => {
      const material = new THREE.MeshBasicMaterial({
        color: isDark ? 0x4f46e5 : 0x10b981,
        wireframe: true,
        transparent: true,
        opacity: isDark ? 0.1 : 0.15,
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.x = (index - 1) * 25;
      mesh.position.z = -20;
      scene.add(mesh);
      shapes.push(mesh);
    });

    // Mouse movement
    let mouseX = 0;
    let mouseY = 0;

    const handleMouseMove = (event: MouseEvent) => {
      mouseX = (event.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Animation loop
    const clock = new THREE.Clock();

    const animate = () => {
      const elapsedTime = clock.getElapsedTime();

      // Rotate particles
      if (particlesRef.current) {
        particlesRef.current.rotation.y = elapsedTime * 0.05;
        particlesRef.current.rotation.x = elapsedTime * 0.03;
      }

      // Rotate shapes
      shapes.forEach((shape, index) => {
        shape.rotation.x = elapsedTime * 0.1 * (index + 1);
        shape.rotation.y = elapsedTime * 0.15 * (index + 1);
        shape.position.y = Math.sin(elapsedTime + index) * 2;
      });

      // Animate text sprites
      textSprites.forEach((sprite, index) => {
        sprite.position.y += Math.sin(elapsedTime + index) * 0.02;
        sprite.rotation.z = elapsedTime * 0.1 * (index % 2 === 0 ? 1 : -1);
        
        // Fade in and out
        const opacity = 0.3 + Math.sin(elapsedTime * 0.5 + index) * 0.3;
        if (sprite.material instanceof THREE.SpriteMaterial) {
          sprite.material.opacity = opacity;
        }
      });

      // Camera follows mouse
      camera.position.x += (mouseX * 10 - camera.position.x) * 0.05;
      camera.position.y += (mouseY * 10 - camera.position.y) * 0.05;
      camera.lookAt(scene.position);

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
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
      particlesGeometry.dispose();
      particlesMaterial.dispose();
      geometries.forEach(g => g.dispose());
      shapes.forEach(s => {
        if (s.material instanceof THREE.Material) {
          s.material.dispose();
        }
      });
      textSprites.forEach(sprite => {
        if (sprite.material instanceof THREE.SpriteMaterial && sprite.material.map) {
          sprite.material.map.dispose();
          sprite.material.dispose();
        }
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
