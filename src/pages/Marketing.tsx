import { useRef, useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Printer, Image, ArrowLeft, Film } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import marketingBg from '@/assets/marketing-bg.jpg';
import spaceCapsuleBg from '@/assets/space-capsule-bg.jpg';
import sfhLogo from '@/assets/sfh-logo-sphere.png';
import sfhQrCode from '@/assets/sfh-qr-code.png';
import GIF from 'gif.js';

const Marketing = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const canvas2Ref = useRef<HTMLCanvasElement>(null);
  const navigate = useNavigate();
  const [isRendering, setIsRendering] = useState(true);
  const [isRendering2, setIsRendering2] = useState(true);
  const [isGeneratingGif, setIsGeneratingGif] = useState(false);
  const [bgImageRef, setBgImageRef] = useState<HTMLImageElement | null>(null);
  const [logoImageRef, setLogoImageRef] = useState<HTMLImageElement | null>(null);
  const [qrImageRef, setQrImageRef] = useState<HTMLImageElement | null>(null);
  const [spaceBgRef, setSpaceBgRef] = useState<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1920;
    canvas.height = 1080;

    const bgImage = new window.Image();
    const logoImage = new window.Image();
    const qrImage = new window.Image();
    
    let loadedCount = 0;

    const tryDraw = () => {
      loadedCount++;
      if (loadedCount === 3) {
        setBgImageRef(bgImage);
        setLogoImageRef(logoImage);
        setQrImageRef(qrImage);
        drawMarketingGraphic(ctx, canvas.width, canvas.height, bgImage, logoImage, qrImage);
        setIsRendering(false);
      }
    };

    bgImage.onload = tryDraw;
    logoImage.onload = tryDraw;
    qrImage.onload = tryDraw;

    bgImage.src = marketingBg;
    logoImage.src = sfhLogo;
    qrImage.src = sfhQrCode;
  }, []);

  // Second banner useEffect - Space Capsule theme
  useEffect(() => {
    const canvas = canvas2Ref.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 1200;
    canvas.height = 630;

    const spaceBgImage = new window.Image();
    const logoImage = new window.Image();
    const qrImage = new window.Image();
    
    let loadedCount = 0;

    const tryDraw = () => {
      loadedCount++;
      if (loadedCount === 3) {
        setSpaceBgRef(spaceBgImage);
        drawSpaceBanner(ctx, canvas.width, canvas.height, spaceBgImage, logoImage, qrImage);
        setIsRendering2(false);
      }
    };

    spaceBgImage.onload = tryDraw;
    logoImage.onload = tryDraw;
    qrImage.onload = tryDraw;

    spaceBgImage.src = spaceCapsuleBg;
    logoImage.src = sfhLogo;
    qrImage.src = sfhQrCode;
  }, []);

  const drawMarketingGraphic = (
    ctx: CanvasRenderingContext2D, 
    width: number, 
    height: number,
    bgImage: HTMLImageElement,
    logoImage: HTMLImageElement,
    qrImage: HTMLImageElement
  ) => {
    // Draw background
    const bgRatio = bgImage.width / bgImage.height;
    const canvasRatio = width / height;
    
    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (bgRatio > canvasRatio) {
      drawWidth = height * bgRatio;
      offsetX = -(drawWidth - width) / 2;
    } else {
      drawHeight = width / bgRatio;
      offsetY = -(drawHeight - height) / 2;
    }

    ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);

    // Dark cinematic overlay
    const overlayGradient = ctx.createLinearGradient(0, 0, width, height);
    overlayGradient.addColorStop(0, 'rgba(0, 15, 25, 0.85)');
    overlayGradient.addColorStop(0.5, 'rgba(0, 18, 30, 0.80)');
    overlayGradient.addColorStop(1, 'rgba(0, 12, 22, 0.88)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, width, height);

    // Draw tech grid pattern
    drawTechGrid(ctx, width, height);

    // Draw floating hexagons in background
    drawFloatingHexagons(ctx, width, height);

    // Draw energy lines and arcs
    drawEnergyLines(ctx, width, height);

    // Draw enhanced logo with orbits - moved down so orbits stay inside canvas
    drawEnhancedLogo(ctx, width / 2, 180, logoImage);

    // Draw brand name - centered, below orbit rings
    drawBrandName(ctx, width, 420);

    // Draw tagline - single horizontal line (after HUB at 420+95=515, so tagline at 580)
    drawTagline(ctx, width, 580);

    // Draw "Built for Everyone" section divider
    drawSectionDivider(ctx, width, 640);

    // Draw user type badges - centered row
    drawUserTypeBadges(ctx, width, height);

    // Draw CTA button with website - centered
    drawCTAButton(ctx, width, 970);

    // Draw corner accents
    drawCornerAccents(ctx, width, height);

    // Draw QR code in top right corner
    drawQRCode(ctx, width, qrImage);
  };

  // Draw Space Capsule Banner - Different structure with left-aligned content
  const drawSpaceBanner = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bgImage: HTMLImageElement,
    logoImage: HTMLImageElement,
    qrImage: HTMLImageElement
  ) => {
    // Draw space background - cover the canvas
    const bgRatio = bgImage.width / bgImage.height;
    const canvasRatio = width / height;
    
    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (bgRatio > canvasRatio) {
      drawWidth = height * bgRatio;
      offsetX = -(drawWidth - width) / 2;
    } else {
      drawHeight = width / bgRatio;
      offsetY = -(drawHeight - height) / 2;
    }

    ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);

    // Gradient overlay - left side darker for text
    const overlayGradient = ctx.createLinearGradient(0, 0, width, 0);
    overlayGradient.addColorStop(0, 'rgba(0, 12, 20, 0.95)');
    overlayGradient.addColorStop(0.5, 'rgba(0, 15, 25, 0.75)');
    overlayGradient.addColorStop(1, 'rgba(0, 18, 30, 0.4)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, width, height);

    // Add subtle scan lines
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.03)';
    ctx.lineWidth = 1;
    for (let y = 0; y < height; y += 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Left side content container background
    const contentWidth = 550;
    const contentGrad = ctx.createLinearGradient(0, 0, contentWidth + 100, 0);
    contentGrad.addColorStop(0, 'rgba(0, 20, 35, 0.9)');
    contentGrad.addColorStop(0.7, 'rgba(0, 20, 35, 0.6)');
    contentGrad.addColorStop(1, 'rgba(0, 20, 35, 0)');
    ctx.fillStyle = contentGrad;
    ctx.fillRect(0, 0, contentWidth + 100, height);

    // Vertical accent line
    ctx.strokeStyle = '#14b8a6';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(40, 60);
    ctx.lineTo(40, height - 60);
    ctx.stroke();

    // Glowing dots on the accent line
    const dotPositions = [80, 180, 350, 500];
    dotPositions.forEach(y => {
      const glow = ctx.createRadialGradient(40, y, 0, 40, y, 20);
      glow.addColorStop(0, 'rgba(20, 184, 166, 0.8)');
      glow.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(40, y, 20, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = '#14b8a6';
      ctx.beginPath();
      ctx.arc(40, y, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    // Logo - smaller, top left
    const logoSize = 80;
    const logoX = 80;
    const logoY = 60;
    
    // Logo glow
    const logoGlow = ctx.createRadialGradient(logoX + logoSize/2, logoY + logoSize/2, 0, logoX + logoSize/2, logoY + logoSize/2, logoSize);
    logoGlow.addColorStop(0, 'rgba(20, 184, 166, 0.3)');
    logoGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = logoGlow;
    ctx.beginPath();
    ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize, 0, Math.PI * 2);
    ctx.fill();

    // Draw logo
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImage, logoX, logoY, logoSize, logoSize);
    ctx.restore();

    // Logo ring
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2 + 5, 0, Math.PI * 2);
    ctx.stroke();

    // Main Title - "LAUNCH YOUR"
    ctx.textAlign = 'left';
    ctx.font = '300 48px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('LAUNCH YOUR', 80, 220);

    // "STARTUP" with gradient
    ctx.font = '900 72px "Segoe UI", system-ui, sans-serif';
    const startupGrad = ctx.createLinearGradient(80, 280, 400, 280);
    startupGrad.addColorStop(0, '#14b8a6');
    startupGrad.addColorStop(0.5, '#22d3ee');
    startupGrad.addColorStop(1, '#14b8a6');
    ctx.fillStyle = startupGrad;
    ctx.shadowColor = 'rgba(20, 184, 166, 0.5)';
    ctx.shadowBlur = 30;
    ctx.fillText('STARTUP', 80, 290);
    ctx.shadowBlur = 0;

    // "INTO ORBIT" 
    ctx.font = '300 48px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.fillText('INTO ORBIT', 80, 355);

    // Tagline with icon indicators
    ctx.font = '400 18px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    
    const features = [
      '🚀 Deep Tech Acceleration',
      '💡 Expert Mentorship',
      '💰 Investor Network'
    ];
    
    features.forEach((feature, i) => {
      ctx.fillText(feature, 80, 420 + i * 32);
    });

    // CTA Button
    const btnX = 80;
    const btnY = 530;
    const btnWidth = 220;
    const btnHeight = 50;

    // Button glow
    const btnGlow = ctx.createRadialGradient(btnX + btnWidth/2, btnY + btnHeight/2, 0, btnX + btnWidth/2, btnY + btnHeight/2, 150);
    btnGlow.addColorStop(0, 'rgba(20, 184, 166, 0.3)');
    btnGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = btnGlow;
    ctx.beginPath();
    ctx.arc(btnX + btnWidth/2, btnY + btnHeight/2, 150, 0, Math.PI * 2);
    ctx.fill();

    // Button background
    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnWidth, btnY);
    btnGrad.addColorStop(0, '#0d9488');
    btnGrad.addColorStop(0.5, '#14b8a6');
    btnGrad.addColorStop(1, '#0d9488');
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 25);
    ctx.fill();

    // Button border glow
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 25);
    ctx.stroke();

    // Button text
    ctx.font = 'bold 16px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('JOIN NOW →', btnX + btnWidth/2, btnY + btnHeight/2 + 6);

    // Website URL below button
    ctx.font = '400 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.textAlign = 'left';
    ctx.fillText('startupfactoryhub.com', 80, btnY + btnHeight + 30);

    // QR Code - bottom right
    const qrSize = 100;
    const qrX = width - qrSize - 40;
    const qrY = height - qrSize - 40;

    // Website URL above QR
    ctx.font = '400 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.textAlign = 'center';
    ctx.fillText('startupfactoryhub.lovable.app', qrX + qrSize/2, qrY - 35);

    // "SCAN ME" text above QR
    ctx.font = 'bold 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.9)';
    ctx.textAlign = 'center';
    ctx.fillText('SCAN ME', qrX + qrSize/2, qrY - 20);

    // QR background
    ctx.fillStyle = 'rgba(0, 20, 35, 0.8)';
    ctx.beginPath();
    ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 12);
    ctx.fill();

    // QR border
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(qrX - 10, qrY - 10, qrSize + 20, qrSize + 20, 12);
    ctx.stroke();

    // Draw QR
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrSize, qrSize, 8);
    ctx.clip();
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    ctx.restore();

    // Top right decorative elements - mission badge style
    ctx.textAlign = 'right';
    ctx.font = 'bold 14px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(20, 184, 166, 0.8)';
    ctx.fillText('STARTUP FACTORY HUB', width - 40, 40);
    
    ctx.font = '400 12px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
    ctx.fillText('MISSION // DEEP TECH', width - 40, 60);

    // Decorative corner brackets
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.4)';
    ctx.lineWidth = 2;
    
    // Top right corner
    ctx.beginPath();
    ctx.moveTo(width - 20, 20);
    ctx.lineTo(width - 20, 80);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(width - 80, 20);
    ctx.lineTo(width - 20, 20);
    ctx.stroke();

    // Bottom left corner
    ctx.beginPath();
    ctx.moveTo(20, height - 20);
    ctx.lineTo(20, height - 80);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(20, height - 20);
    ctx.lineTo(80, height - 20);
    ctx.stroke();
  };

  const drawTechGrid = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.04)';
    ctx.lineWidth = 1;

    // Horizontal lines
    for (let y = 0; y < height; y += 50) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical lines
    for (let x = 0; x < width; x += 50) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Grid intersection dots
    ctx.fillStyle = 'rgba(20, 184, 166, 0.08)';
    for (let x = 0; x < width; x += 100) {
      for (let y = 0; y < height; y += 100) {
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  };

  const drawFloatingHexagons = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const hexagons = [
      { x: 120, y: 150, size: 50, opacity: 0.12 },
      { x: 1800, y: 180, size: 55, opacity: 0.1 },
      { x: 80, y: 850, size: 40, opacity: 0.08 },
      { x: 1840, y: 900, size: 45, opacity: 0.1 },
      { x: 200, y: 500, size: 30, opacity: 0.06 },
      { x: 1720, y: 550, size: 35, opacity: 0.08 },
      { x: 60, y: 400, size: 60, opacity: 0.1 },
      { x: 1860, y: 450, size: 50, opacity: 0.08 },
      { x: 300, y: 900, size: 35, opacity: 0.07 },
      { x: 1620, y: 850, size: 40, opacity: 0.09 },
    ];

    hexagons.forEach(hex => {
      ctx.strokeStyle = `rgba(20, 184, 166, ${hex.opacity})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = hex.x + hex.size * Math.cos(angle);
        const py = hex.y + hex.size * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      ctx.stroke();
    });
  };

  const drawEnergyLines = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // Left sweeping arcs
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.12)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-100, height / 2, 450, -Math.PI / 3, Math.PI / 3);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(-100, height / 2, 550, -Math.PI / 4, Math.PI / 4);
    ctx.stroke();

    // Right sweeping arcs
    ctx.beginPath();
    ctx.arc(width + 100, height / 2, 450, Math.PI * 0.67, Math.PI * 1.33);
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(width + 100, height / 2, 550, Math.PI * 0.75, Math.PI * 1.25);
    ctx.stroke();

    // Glowing particles with connections
    const particles = [
      { x: 150, y: 250 },
      { x: 280, y: 180 },
      { x: 1640, y: 200 },
      { x: 1770, y: 300 },
      { x: 130, y: 750 },
      { x: 260, y: 850 },
      { x: 1660, y: 800 },
      { x: 1790, y: 700 },
    ];

    particles.forEach((p, i) => {
      // Outer glow
      const glow = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 20);
      glow.addColorStop(0, 'rgba(20, 184, 166, 0.6)');
      glow.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = 'rgba(20, 184, 166, 0.9)';
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();

      // Connect adjacent particles
      if (i % 2 === 0 && i < particles.length - 1) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(20, 184, 166, 0.08)';
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 8]);
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(particles[i + 1].x, particles[i + 1].y);
        ctx.stroke();
        ctx.setLineDash([]);
      }
    });
  };

  const drawEnhancedLogo = (ctx: CanvasRenderingContext2D, x: number, y: number, logoImage: HTMLImageElement) => {
    const logoSize = 200;

    // Multiple glow layers
    for (let i = 5; i >= 0; i--) {
      const radius = logoSize / 2 + 50 + i * 25;
      const glow = ctx.createRadialGradient(x, y, radius - 40, x, y, radius + 40);
      glow.addColorStop(0, `rgba(20, 184, 166, ${0.04 - i * 0.006})`);
      glow.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(x, y, radius + 40, 0, Math.PI * 2);
      ctx.fill();
    }

    // Triple orbit rings
    const orbits = [
      { radius: 140, dashArray: [10, 10], opacity: 0.4, width: 2 },
      { radius: 175, dashArray: [18, 12], opacity: 0.3, width: 2 },
      { radius: 210, dashArray: [6, 18], opacity: 0.2, width: 1.5 },
    ];

    orbits.forEach(orbit => {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(20, 184, 166, ${orbit.opacity})`;
      ctx.lineWidth = orbit.width;
      ctx.setLineDash(orbit.dashArray);
      ctx.arc(x, y, orbit.radius, 0, Math.PI * 2);
      ctx.stroke();
    });
    ctx.setLineDash([]);

    // Orbit dots on each ring
    const orbitDots = [
      { angle: 0, radius: 140 },
      { angle: Math.PI * 0.5, radius: 140 },
      { angle: Math.PI, radius: 140 },
      { angle: Math.PI * 1.5, radius: 140 },
      { angle: Math.PI * 0.25, radius: 175 },
      { angle: Math.PI * 0.75, radius: 175 },
      { angle: Math.PI * 1.25, radius: 175 },
      { angle: Math.PI * 1.75, radius: 175 },
      { angle: Math.PI * 0.125, radius: 210 },
      { angle: Math.PI * 0.625, radius: 210 },
      { angle: Math.PI * 1.125, radius: 210 },
      { angle: Math.PI * 1.625, radius: 210 },
    ];

    orbitDots.forEach(dot => {
      const dx = x + Math.cos(dot.angle) * dot.radius;
      const dy = y + Math.sin(dot.angle) * dot.radius;

      // Glow
      const glow = ctx.createRadialGradient(dx, dy, 0, dx, dy, 15);
      glow.addColorStop(0, 'rgba(20, 184, 166, 0.8)');
      glow.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(dx, dy, 15, 0, Math.PI * 2);
      ctx.fill();

      // Core
      ctx.fillStyle = '#14b8a6';
      ctx.beginPath();
      ctx.arc(dx, dy, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // Logo background glow
    const logoGlow = ctx.createRadialGradient(x, y, 0, x, y, logoSize / 2 + 40);
    logoGlow.addColorStop(0, 'rgba(20, 184, 166, 0.4)');
    logoGlow.addColorStop(0.6, 'rgba(20, 184, 166, 0.15)');
    logoGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.fillStyle = logoGlow;
    ctx.beginPath();
    ctx.arc(x, y, logoSize / 2 + 40, 0, Math.PI * 2);
    ctx.fill();

    // Logo ring
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.6)';
    ctx.lineWidth = 4;
    ctx.arc(x, y, logoSize / 2 + 12, 0, Math.PI * 2);
    ctx.stroke();

    // Draw logo image
    ctx.save();
    ctx.beginPath();
    ctx.arc(x, y, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImage, x - logoSize / 2, y - logoSize / 2, logoSize, logoSize);
    ctx.restore();
  };

  const drawBrandName = (ctx: CanvasRenderingContext2D, width: number, y: number) => {
    ctx.textAlign = 'center';

    // "STARTUP FACTORY" text with glow
    ctx.font = '900 80px "Segoe UI", system-ui, sans-serif';
    ctx.shadowColor = 'rgba(20, 184, 166, 0.5)';
    ctx.shadowBlur = 35;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('STARTUP FACTORY', width / 2, y);

    // "HUB" with gradient - massive
    ctx.font = '900 110px "Segoe UI", system-ui, sans-serif';
    const hubGradient = ctx.createLinearGradient(width / 2 - 150, y + 90, width / 2 + 150, y + 90);
    hubGradient.addColorStop(0, '#0d9488');
    hubGradient.addColorStop(0.3, '#14b8a6');
    hubGradient.addColorStop(0.7, '#22d3ee');
    hubGradient.addColorStop(1, '#14b8a6');
    ctx.fillStyle = hubGradient;
    ctx.fillText('HUB', width / 2, y + 95);

    ctx.shadowBlur = 0;
  };

  const drawTagline = (ctx: CanvasRenderingContext2D, width: number, y: number) => {
    ctx.textAlign = 'center';
    
    // Single horizontal line with mixed styling
    const text1 = 'The technology designed to help ';
    const text2 = 'deep tech startups succeed.';
    
    ctx.font = '400 34px "Segoe UI", system-ui, sans-serif';
    const text1Width = ctx.measureText(text1).width;
    ctx.font = '700 34px "Segoe UI", system-ui, sans-serif';
    const text2Width = ctx.measureText(text2).width;
    
    const totalWidth = text1Width + text2Width;
    const startX = (width - totalWidth) / 2;
    
    // First part - white
    ctx.font = '400 34px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.textAlign = 'left';
    ctx.fillText(text1, startX, y);
    
    // Second part - gradient teal
    ctx.font = '700 34px "Segoe UI", system-ui, sans-serif';
    const tagGradient = ctx.createLinearGradient(startX + text1Width, y, startX + text1Width + text2Width, y);
    tagGradient.addColorStop(0, '#14b8a6');
    tagGradient.addColorStop(0.5, '#22d3ee');
    tagGradient.addColorStop(1, '#14b8a6');
    ctx.fillStyle = tagGradient;
    ctx.fillText(text2, startX + text1Width, y);
    
    ctx.textAlign = 'center';
  };

  const drawSectionDivider = (ctx: CanvasRenderingContext2D, width: number, y: number) => {
    const centerX = width / 2;
    const lineLength = 280;
    const diamondOffset = 180; // Move diamonds further from text

    // Left decorative line
    const leftGrad = ctx.createLinearGradient(centerX - lineLength - diamondOffset, y, centerX - diamondOffset, y);
    leftGrad.addColorStop(0, 'rgba(20, 184, 166, 0)');
    leftGrad.addColorStop(1, 'rgba(20, 184, 166, 0.7)');
    ctx.strokeStyle = leftGrad;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - lineLength - diamondOffset, y);
    ctx.lineTo(centerX - diamondOffset, y);
    ctx.stroke();

    // Left diamond
    ctx.fillStyle = '#14b8a6';
    ctx.save();
    ctx.translate(centerX - diamondOffset + 10, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();

    // Text
    ctx.font = 'bold 36px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText('Built for Everyone', centerX, y + 12);

    // Right diamond
    ctx.save();
    ctx.translate(centerX + diamondOffset - 10, y);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-6, -6, 12, 12);
    ctx.restore();

    // Right decorative line
    const rightGrad = ctx.createLinearGradient(centerX + diamondOffset, y, centerX + lineLength + diamondOffset, y);
    rightGrad.addColorStop(0, 'rgba(20, 184, 166, 0.7)');
    rightGrad.addColorStop(1, 'rgba(20, 184, 166, 0)');
    ctx.strokeStyle = rightGrad;
    ctx.beginPath();
    ctx.moveTo(centerX + diamondOffset, y);
    ctx.lineTo(centerX + lineLength + diamondOffset, y);
    ctx.stroke();
  };

  const drawStyledIcon = (ctx: CanvasRenderingContext2D, iconType: string, x: number, y: number, size: number, color: string) => {
    ctx.save();
    ctx.strokeStyle = '#ffffff';
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    switch (iconType) {
      case 'rocket':
        // Rocket body
        ctx.beginPath();
        ctx.moveTo(x, y - size);
        ctx.lineTo(x + size * 0.5, y + size * 0.3);
        ctx.lineTo(x, y + size * 0.1);
        ctx.lineTo(x - size * 0.5, y + size * 0.3);
        ctx.closePath();
        ctx.stroke();
        // Fins
        ctx.beginPath();
        ctx.moveTo(x - size * 0.5, y + size * 0.3);
        ctx.lineTo(x - size * 0.7, y + size * 0.7);
        ctx.lineTo(x - size * 0.2, y + size * 0.3);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x + size * 0.5, y + size * 0.3);
        ctx.lineTo(x + size * 0.7, y + size * 0.7);
        ctx.lineTo(x + size * 0.2, y + size * 0.3);
        ctx.stroke();
        // Window
        ctx.beginPath();
        ctx.arc(x, y - size * 0.3, size * 0.2, 0, Math.PI * 2);
        ctx.stroke();
        break;

      case 'lightbulb':
        // Bulb
        ctx.beginPath();
        ctx.arc(x, y - size * 0.2, size * 0.5, Math.PI * 0.8, Math.PI * 2.2);
        ctx.stroke();
        // Base
        ctx.beginPath();
        ctx.moveTo(x - size * 0.3, y + size * 0.3);
        ctx.lineTo(x - size * 0.3, y + size * 0.6);
        ctx.lineTo(x + size * 0.3, y + size * 0.6);
        ctx.lineTo(x + size * 0.3, y + size * 0.3);
        ctx.stroke();
        // Lines on base
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y + size * 0.4);
        ctx.lineTo(x + size * 0.25, y + size * 0.4);
        ctx.moveTo(x - size * 0.25, y + size * 0.5);
        ctx.lineTo(x + size * 0.25, y + size * 0.5);
        ctx.stroke();
        break;

      case 'diamond':
        // Diamond shape
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.7);
        ctx.lineTo(x + size * 0.6, y);
        ctx.lineTo(x, y + size * 0.7);
        ctx.lineTo(x - size * 0.6, y);
        ctx.closePath();
        ctx.stroke();
        // Inner lines
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.7);
        ctx.lineTo(x, y + size * 0.7);
        ctx.moveTo(x - size * 0.6, y);
        ctx.lineTo(x + size * 0.6, y);
        ctx.stroke();
        break;

      case 'gradcap':
        // Cap top
        ctx.beginPath();
        ctx.moveTo(x, y - size * 0.5);
        ctx.lineTo(x + size * 0.8, y);
        ctx.lineTo(x, y + size * 0.3);
        ctx.lineTo(x - size * 0.8, y);
        ctx.closePath();
        ctx.stroke();
        // Tassel
        ctx.beginPath();
        ctx.moveTo(x + size * 0.5, y - size * 0.1);
        ctx.lineTo(x + size * 0.5, y + size * 0.6);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x + size * 0.5, y + size * 0.7, size * 0.12, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'building':
        // Building outline
        ctx.beginPath();
        ctx.moveTo(x - size * 0.5, y + size * 0.7);
        ctx.lineTo(x - size * 0.5, y - size * 0.5);
        ctx.lineTo(x, y - size * 0.8);
        ctx.lineTo(x + size * 0.5, y - size * 0.5);
        ctx.lineTo(x + size * 0.5, y + size * 0.7);
        ctx.stroke();
        // Columns
        ctx.beginPath();
        ctx.moveTo(x - size * 0.25, y + size * 0.7);
        ctx.lineTo(x - size * 0.25, y - size * 0.3);
        ctx.moveTo(x, y + size * 0.7);
        ctx.lineTo(x, y - size * 0.3);
        ctx.moveTo(x + size * 0.25, y + size * 0.7);
        ctx.lineTo(x + size * 0.25, y - size * 0.3);
        ctx.stroke();
        // Base line
        ctx.beginPath();
        ctx.moveTo(x - size * 0.6, y + size * 0.7);
        ctx.lineTo(x + size * 0.6, y + size * 0.7);
        ctx.stroke();
        break;
    }

    ctx.restore();
  };

  const drawUserTypeBadges = (ctx: CanvasRenderingContext2D, width: number, _height: number) => {
    const userTypes = [
      { 
        iconType: 'rocket', 
        title: 'Startups', 
        features: ['AI-Powered Roadmap', 'Investor Matching', 'Pitch Tools'],
        color: '#10b981',
        glowColor: 'rgba(16, 185, 129, 0.25)'
      },
      { 
        iconType: 'lightbulb', 
        title: 'Mentors', 
        features: ['Session Management', 'Endorsements', 'Calendar Sync'],
        color: '#06b6d4',
        glowColor: 'rgba(6, 182, 212, 0.25)'
      },
      { 
        iconType: 'diamond', 
        title: 'Investors', 
        features: ['Deal Pipeline', 'Portfolio Tracking', 'Due Diligence'],
        color: '#8b5cf6',
        glowColor: 'rgba(139, 92, 246, 0.25)'
      },
      { 
        iconType: 'gradcap', 
        title: 'Students', 
        features: ['Internship Board', 'Learning Paths', 'Mentorship'],
        color: '#ec4899',
        glowColor: 'rgba(236, 72, 153, 0.25)'
      },
      { 
        iconType: 'building', 
        title: 'Accelerators', 
        features: ['Cohort Management', 'Portfolio Analytics', 'Demo Days'],
        color: '#14b8a6',
        glowColor: 'rgba(20, 184, 166, 0.25)'
      },
    ];

    const cardWidth = 280;
    const cardHeight = 160;
    const gap = 25;
    const totalWidth = userTypes.length * cardWidth + (userTypes.length - 1) * gap;
    const startX = (width - totalWidth) / 2;
    const startY = 720;

    userTypes.forEach((type, index) => {
      const x = startX + index * (cardWidth + gap);
      const y = startY;
      const centerX = x + cardWidth / 2;

      // Card background glow
      const bgGlow = ctx.createRadialGradient(centerX, y + cardHeight / 2, 0, centerX, y + cardHeight / 2, cardWidth);
      bgGlow.addColorStop(0, type.glowColor);
      bgGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = bgGlow;
      ctx.beginPath();
      ctx.arc(centerX, y + cardHeight / 2, cardWidth / 1.5, 0, Math.PI * 2);
      ctx.fill();

      // Card background
      ctx.fillStyle = 'rgba(0, 20, 40, 0.75)';
      ctx.beginPath();
      ctx.roundRect(x, y, cardWidth, cardHeight, 20);
      ctx.fill();

      // Card border gradient
      const borderGrad = ctx.createLinearGradient(x, y, x + cardWidth, y + cardHeight);
      borderGrad.addColorStop(0, type.color);
      borderGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.15)');
      borderGrad.addColorStop(1, type.color);
      ctx.strokeStyle = borderGrad;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(x, y, cardWidth, cardHeight, 20);
      ctx.stroke();

      // Top glow line
      ctx.strokeStyle = `${type.color}aa`;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + 40, y);
      ctx.lineTo(x + cardWidth - 40, y);
      ctx.stroke();

      // Hexagon icon container - centered in card
      const hexY = y + cardHeight / 2 - 15;
      const hexSize = 38;

      // Hexagon glow
      const hexGlow = ctx.createRadialGradient(centerX, hexY, 0, centerX, hexY, hexSize + 20);
      hexGlow.addColorStop(0, type.glowColor);
      hexGlow.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = hexGlow;
      ctx.beginPath();
      ctx.arc(centerX, hexY, hexSize + 20, 0, Math.PI * 2);
      ctx.fill();

      // Hexagon background
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const px = centerX + hexSize * Math.cos(angle);
        const py = hexY + hexSize * Math.sin(angle);
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.closePath();
      const hexFill = ctx.createLinearGradient(centerX - hexSize, hexY - hexSize, centerX + hexSize, hexY + hexSize);
      hexFill.addColorStop(0, type.color);
      hexFill.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.fillStyle = hexFill;
      ctx.fill();
      ctx.strokeStyle = type.color;
      ctx.lineWidth = 2;
      ctx.stroke();

      // Orbit ring around hexagon
      ctx.beginPath();
      ctx.strokeStyle = `${type.color}50`;
      ctx.lineWidth = 1.5;
      ctx.setLineDash([5, 5]);
      ctx.arc(centerX, hexY, hexSize + 12, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Orbit dots
      [0, Math.PI / 2, Math.PI, Math.PI * 1.5].forEach(angle => {
        const dotX = centerX + Math.cos(angle) * (hexSize + 12);
        const dotY = hexY + Math.sin(angle) * (hexSize + 12);
        ctx.fillStyle = type.color;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // Draw styled icon instead of emoji
      drawStyledIcon(ctx, type.iconType, centerX, hexY, 16, type.color);

      // Title only - no features
      ctx.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
      ctx.fillStyle = '#ffffff';
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'center';
      ctx.fillText(type.title, centerX, y + cardHeight - 20);

      // Corner accents on card
      ctx.strokeStyle = type.color;
      ctx.lineWidth = 2;
      // Top left
      ctx.beginPath();
      ctx.moveTo(x + 20, y);
      ctx.lineTo(x, y);
      ctx.lineTo(x, y + 20);
      ctx.stroke();
      // Top right
      ctx.beginPath();
      ctx.moveTo(x + cardWidth - 20, y);
      ctx.lineTo(x + cardWidth, y);
      ctx.lineTo(x + cardWidth, y + 20);
      ctx.stroke();
      // Bottom left
      ctx.beginPath();
      ctx.moveTo(x, y + cardHeight - 20);
      ctx.lineTo(x, y + cardHeight);
      ctx.lineTo(x + 20, y + cardHeight);
      ctx.stroke();
      // Bottom right
      ctx.beginPath();
      ctx.moveTo(x + cardWidth, y + cardHeight - 20);
      ctx.lineTo(x + cardWidth, y + cardHeight);
      ctx.lineTo(x + cardWidth - 20, y + cardHeight);
      ctx.stroke();
    });
  };

  const drawCTAButton = (ctx: CanvasRenderingContext2D, width: number, y: number) => {
    const btnWidth = 380;
    const btnHeight = 65;
    const spacing = 40;
    
    // Measure website text width
    ctx.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
    const websiteText = 'startupfactoryhub.com';
    const websiteWidth = ctx.measureText(websiteText).width;
    
    // Calculate total width and center position
    const totalWidth = websiteWidth + spacing + btnWidth;
    const startX = (width - totalWidth) / 2;
    const btnX = startX + websiteWidth + spacing;

    // Draw website URL on the left
    ctx.font = 'bold 24px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText(websiteText, startX, y + btnHeight / 2);

    // Button background - no glow effect
    const btnGrad = ctx.createLinearGradient(btnX, y, btnX + btnWidth, y + btnHeight);
    btnGrad.addColorStop(0, '#0d9488');
    btnGrad.addColorStop(0.5, '#14b8a6');
    btnGrad.addColorStop(1, '#0d9488');
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(btnX, y, btnWidth, btnHeight, 32);
    ctx.fill();

    // Button text
    ctx.font = 'bold 26px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('START YOUR JOURNEY →', btnX + btnWidth / 2, y + btnHeight / 2);
  };

  const drawCornerAccents = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const size = 100;
    const offset = 40;

    ctx.strokeStyle = 'rgba(20, 184, 166, 0.5)';
    ctx.lineWidth = 4;

    // Top left
    ctx.beginPath();
    ctx.moveTo(offset, offset + size);
    ctx.lineTo(offset, offset);
    ctx.lineTo(offset + size, offset);
    ctx.stroke();
    
    // Dot with glow
    ctx.shadowColor = 'rgba(20, 184, 166, 0.9)';
    ctx.shadowBlur = 15;
    ctx.fillStyle = '#14b8a6';
    ctx.beginPath();
    ctx.arc(offset, offset, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Top right
    ctx.beginPath();
    ctx.moveTo(width - offset - size, offset);
    ctx.lineTo(width - offset, offset);
    ctx.lineTo(width - offset, offset + size);
    ctx.stroke();
    
    ctx.shadowColor = 'rgba(20, 184, 166, 0.9)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(width - offset, offset, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bottom left
    ctx.beginPath();
    ctx.moveTo(offset, height - offset - size);
    ctx.lineTo(offset, height - offset);
    ctx.lineTo(offset + size, height - offset);
    ctx.stroke();
    
    ctx.shadowColor = 'rgba(20, 184, 166, 0.9)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(offset, height - offset, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Bottom right
    ctx.beginPath();
    ctx.moveTo(width - offset - size, height - offset);
    ctx.lineTo(width - offset, height - offset);
    ctx.lineTo(width - offset, height - offset - size);
    ctx.stroke();
    
    ctx.shadowColor = 'rgba(20, 184, 166, 0.9)';
    ctx.shadowBlur = 15;
    ctx.beginPath();
    ctx.arc(width - offset, height - offset, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
  };

  const drawQRCode = (ctx: CanvasRenderingContext2D, width: number, qrImage: HTMLImageElement) => {
    const qrSize = 220;
    const offset = 50;
    const x = width - offset - qrSize;
    const y = offset;

    // Draw QR code with slight rounded corners effect using clip
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(x, y, qrSize, qrSize, 12);
    ctx.clip();
    ctx.drawImage(qrImage, x, y, qrSize, qrSize);
    ctx.restore();

    // Draw border around QR code
    ctx.strokeStyle = 'rgba(20, 184, 166, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(x, y, qrSize, qrSize, 12);
    ctx.stroke();
  };

  const downloadImage = (format: 'png' | 'jpg', canvasNum: 1 | 2 = 1) => {
    const canvas = canvasNum === 1 ? canvasRef.current : canvas2Ref.current;
    if (!canvas) return;

    const link = document.createElement('a');
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'jpg' ? 0.95 : undefined;
    const suffix = canvasNum === 1 ? 'marketing' : 'social-media';
    
    link.download = `startup-factory-hub-${suffix}.${format}`;
    link.href = canvas.toDataURL(mimeType, quality);
    link.click();
    
    toast.success(`Downloaded as ${format.toUpperCase()}`);
  };

  const handlePrint = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Please allow popups to print');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Startup Factory Hub - Marketing</title>
          <style>
            body { margin: 0; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #000; }
            img { max-width: 100%; height: auto; }
            @media print { body { background: white; } img { width: 100%; } }
          </style>
        </head>
        <body>
          <img src="${canvas.toDataURL('image/png')}" />
          <script>window.onload = () => { window.print(); window.close(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const generateGif = async () => {
    if (!bgImageRef || !logoImageRef || !qrImageRef) {
      toast.error('Images not loaded yet');
      return;
    }

    setIsGeneratingGif(true);
    toast.info('Generating GIF... This may take a moment.');

    try {
      const gif = new GIF({
        workers: 2,
        quality: 10,
        width: 960,
        height: 540,
        workerScript: '/gif.worker.js'
      });

      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = 960;
      tempCanvas.height = 540;
      const tempCtx = tempCanvas.getContext('2d')!;

      const totalFrames = 30;
      const frameDelay = 80;

      for (let frame = 0; frame < totalFrames; frame++) {
        const progress = frame / totalFrames;
        drawAnimatedFrame(tempCtx, 960, 540, bgImageRef, logoImageRef, qrImageRef, progress);
        gif.addFrame(tempCtx, { copy: true, delay: frameDelay });
      }

      gif.on('finished', (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.download = 'startup-factory-hub-animated.gif';
        link.href = url;
        link.click();
        URL.revokeObjectURL(url);
        setIsGeneratingGif(false);
        toast.success('GIF downloaded successfully!');
      });

      gif.render();
    } catch (error) {
      console.error('GIF generation error:', error);
      setIsGeneratingGif(false);
      toast.error('Failed to generate GIF');
    }
  };

  const drawAnimatedFrame = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    bgImage: HTMLImageElement,
    logoImage: HTMLImageElement,
    qrImage: HTMLImageElement,
    progress: number
  ) => {
    // Scale factor for smaller GIF
    const scale = width / 1920;

    // Draw background
    const bgRatio = bgImage.width / bgImage.height;
    const canvasRatio = width / height;
    
    let drawWidth = width;
    let drawHeight = height;
    let offsetX = 0;
    let offsetY = 0;

    if (bgRatio > canvasRatio) {
      drawWidth = height * bgRatio;
      offsetX = -(drawWidth - width) / 2;
    } else {
      drawHeight = width / bgRatio;
      offsetY = -(drawHeight - height) / 2;
    }

    ctx.drawImage(bgImage, offsetX, offsetY, drawWidth, drawHeight);

    // Dark overlay
    const overlayGradient = ctx.createLinearGradient(0, 0, width, height);
    overlayGradient.addColorStop(0, 'rgba(0, 15, 25, 0.85)');
    overlayGradient.addColorStop(0.5, 'rgba(0, 18, 30, 0.80)');
    overlayGradient.addColorStop(1, 'rgba(0, 12, 22, 0.88)');
    ctx.fillStyle = overlayGradient;
    ctx.fillRect(0, 0, width, height);

    // Animated logo with pulsing glow
    const logoX = width / 2;
    const logoY = 180 * scale;
    const logoSize = 200 * scale;
    const pulseAmount = Math.sin(progress * Math.PI * 2) * 0.15 + 1;

    // Pulsing glow
    for (let i = 3; i >= 0; i--) {
      const radius = (logoSize / 2 + 30 + i * 15) * pulseAmount;
      const glow = ctx.createRadialGradient(logoX, logoY, radius - 20, logoX, logoY, radius + 20);
      glow.addColorStop(0, `rgba(20, 184, 166, ${(0.15 - i * 0.03) * pulseAmount})`);
      glow.addColorStop(1, 'rgba(20, 184, 166, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(logoX, logoY, radius + 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Animated orbit rings
    const orbits = [
      { radius: 140 * scale, speed: 1 },
      { radius: 175 * scale, speed: -0.7 },
      { radius: 210 * scale, speed: 0.5 },
    ];

    orbits.forEach((orbit, idx) => {
      ctx.beginPath();
      ctx.strokeStyle = `rgba(20, 184, 166, ${0.4 - idx * 0.1})`;
      ctx.lineWidth = 2 * scale;
      ctx.setLineDash([10 * scale, 10 * scale]);
      ctx.arc(logoX, logoY, orbit.radius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Animated orbit dots
      const dotCount = 4;
      for (let d = 0; d < dotCount; d++) {
        const angle = (progress * Math.PI * 2 * orbit.speed) + (d * Math.PI * 2 / dotCount);
        const dotX = logoX + Math.cos(angle) * orbit.radius;
        const dotY = logoY + Math.sin(angle) * orbit.radius;

        // Dot glow
        const dotGlow = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 10 * scale);
        dotGlow.addColorStop(0, 'rgba(20, 184, 166, 0.8)');
        dotGlow.addColorStop(1, 'rgba(20, 184, 166, 0)');
        ctx.fillStyle = dotGlow;
        ctx.beginPath();
        ctx.arc(dotX, dotY, 10 * scale, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#14b8a6';
        ctx.beginPath();
        ctx.arc(dotX, dotY, 4 * scale, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Logo ring
    ctx.beginPath();
    ctx.strokeStyle = `rgba(20, 184, 166, ${0.5 + Math.sin(progress * Math.PI * 2) * 0.2})`;
    ctx.lineWidth = 3 * scale;
    ctx.arc(logoX, logoY, logoSize / 2 + 8 * scale, 0, Math.PI * 2);
    ctx.stroke();

    // Logo image
    ctx.save();
    ctx.beginPath();
    ctx.arc(logoX, logoY, logoSize / 2, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(logoImage, logoX - logoSize / 2, logoY - logoSize / 2, logoSize, logoSize);
    ctx.restore();

    // Brand name
    ctx.textAlign = 'center';
    ctx.font = `900 ${40 * scale}px "Segoe UI", system-ui, sans-serif`;
    ctx.shadowColor = 'rgba(20, 184, 166, 0.5)';
    ctx.shadowBlur = 20 * scale;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('STARTUP FACTORY', width / 2, 420 * scale);

    ctx.font = `900 ${55 * scale}px "Segoe UI", system-ui, sans-serif`;
    const hubGradient = ctx.createLinearGradient(width / 2 - 75 * scale, 0, width / 2 + 75 * scale, 0);
    hubGradient.addColorStop(0, '#0d9488');
    hubGradient.addColorStop(0.5, '#22d3ee');
    hubGradient.addColorStop(1, '#14b8a6');
    ctx.fillStyle = hubGradient;
    ctx.fillText('HUB', width / 2, 515 * scale);
    ctx.shadowBlur = 0;

    // Tagline
    ctx.font = `400 ${17 * scale}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
    ctx.fillText('The technology designed to help deep tech startups succeed.', width / 2, 580 * scale);

    // Built for Everyone
    ctx.font = `bold ${18 * scale}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('Built for Everyone', width / 2, 652 * scale);

    // Simple profile type indicators
    const types = ['Startups', 'Mentors', 'Investors', 'Students', 'Accelerators'];
    const colors = ['#10b981', '#06b6d4', '#8b5cf6', '#ec4899', '#14b8a6'];
    const cardWidth = 140 * scale;
    const gap = 12 * scale;
    const totalWidth = types.length * cardWidth + (types.length - 1) * gap;
    const startX = (width - totalWidth) / 2;
    const cardY = 720 * scale;

    types.forEach((type, i) => {
      const x = startX + i * (cardWidth + gap);
      const centerX = x + cardWidth / 2;

      // Card background
      ctx.fillStyle = 'rgba(0, 20, 40, 0.75)';
      ctx.beginPath();
      ctx.roundRect(x, cardY, cardWidth, 80 * scale, 10 * scale);
      ctx.fill();

      // Animated border
      const borderOpacity = 0.5 + Math.sin((progress * Math.PI * 2) + i * 0.5) * 0.3;
      ctx.strokeStyle = colors[i] + Math.floor(borderOpacity * 255).toString(16).padStart(2, '0');
      ctx.lineWidth = 2 * scale;
      ctx.beginPath();
      ctx.roundRect(x, cardY, cardWidth, 80 * scale, 10 * scale);
      ctx.stroke();

      // Type name
      ctx.font = `bold ${12 * scale}px "Segoe UI", system-ui, sans-serif`;
      ctx.fillStyle = '#ffffff';
      ctx.fillText(type, centerX, cardY + 50 * scale);
    });

    // CTA section
    ctx.font = `bold ${12 * scale}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
    ctx.fillText('startupfactoryhub.com', width / 2 - 100 * scale, 970 * scale + 32 * scale);

    // Button with subtle pulse
    const btnPulse = 1 + Math.sin(progress * Math.PI * 2) * 0.02;
    const btnWidth = 190 * scale * btnPulse;
    const btnHeight = 32 * scale * btnPulse;
    const btnX = width / 2 + 20 * scale - btnWidth / 2 + 50 * scale;
    const btnY = 970 * scale;

    const btnGrad = ctx.createLinearGradient(btnX, btnY, btnX + btnWidth, btnY + btnHeight);
    btnGrad.addColorStop(0, '#0d9488');
    btnGrad.addColorStop(0.5, '#14b8a6');
    btnGrad.addColorStop(1, '#0d9488');
    ctx.fillStyle = btnGrad;
    ctx.beginPath();
    ctx.roundRect(btnX, btnY, btnWidth, btnHeight, 16 * scale);
    ctx.fill();

    ctx.font = `bold ${13 * scale}px "Segoe UI", system-ui, sans-serif`;
    ctx.fillStyle = '#ffffff';
    ctx.fillText('START YOUR JOURNEY →', btnX + btnWidth / 2, btnY + btnHeight / 2 + 4 * scale);

    // Draw QR code in top right corner
    const qrSize = 220 * scale;
    const offset = 50 * scale;
    const qrX = width - offset - qrSize;
    const qrY = offset;

    ctx.save();
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrSize, qrSize, 12 * scale);
    ctx.clip();
    ctx.drawImage(qrImage, qrX, qrY, qrSize, qrSize);
    ctx.restore();

    ctx.strokeStyle = 'rgba(20, 184, 166, 0.6)';
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.roundRect(qrX, qrY, qrSize, qrSize, 12 * scale);
    ctx.stroke();
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button variant="ghost" onClick={() => navigate('/')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Home
          </Button>
          
          <h1 className="text-lg font-semibold text-foreground">Marketing Graphics</h1>
          
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadImage('png')} disabled={isRendering} className="gap-2">
              <Download className="h-4 w-4" />
              PNG
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadImage('jpg')} disabled={isRendering} className="gap-2">
              <Image className="h-4 w-4" />
              JPG
            </Button>
            <Button variant="outline" size="sm" onClick={generateGif} disabled={isRendering || isGeneratingGif} className="gap-2">
              <Film className="h-4 w-4" />
              {isGeneratingGif ? 'Generating...' : 'GIF'}
            </Button>
            <Button variant="default" size="sm" onClick={handlePrint} disabled={isRendering} className="gap-2">
              <Printer className="h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </div>

      <div className="pt-20 pb-8 px-4">
        <div className="container mx-auto space-y-10">
          {/* Banner 1 - Original 1920x1080 */}
          <div>
            <div className="tech-card border-0 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Marketing Banner (1920×1080)</h2>
                  <p className="text-muted-foreground text-sm">
                    High-resolution marketing graphic ready for print, social media, or presentations.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadImage('png', 1)} disabled={isRendering} className="gap-2">
                    <Download className="h-4 w-4" />
                    PNG
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadImage('jpg', 1)} disabled={isRendering} className="gap-2">
                    <Image className="h-4 w-4" />
                    JPG
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="tech-card border-0 p-4 overflow-hidden">
              <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
                <canvas ref={canvasRef} className="w-full h-full object-contain rounded-lg" style={{ maxWidth: '100%', height: 'auto' }} />
                {isRendering && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      <span className="text-muted-foreground">Rendering graphic...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Banner 2 - Social Media 1200x630 */}
          <div>
            <div className="tech-card border-0 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-2">Social Media Banner (1200×630)</h2>
                  <p className="text-muted-foreground text-sm">
                    Optimized for Facebook, LinkedIn, and Twitter social sharing. Space capsule theme.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" onClick={() => downloadImage('png', 2)} disabled={isRendering2} className="gap-2">
                    <Download className="h-4 w-4" />
                    PNG
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => downloadImage('jpg', 2)} disabled={isRendering2} className="gap-2">
                    <Image className="h-4 w-4" />
                    JPG
                  </Button>
                </div>
              </div>
            </div>
            
            <div className="tech-card border-0 p-4 overflow-hidden">
              <div className="relative w-full" style={{ aspectRatio: '1200/630' }}>
                <canvas ref={canvas2Ref} className="w-full h-full object-contain rounded-lg" style={{ maxWidth: '100%', height: 'auto' }} />
                {isRendering2 && (
                  <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg">
                    <div className="flex flex-col items-center gap-3">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
                      <span className="text-muted-foreground">Rendering graphic...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="tech-card border-0 p-4">
              <h3 className="font-medium text-foreground mb-1">Print Ready</h3>
              <p className="text-sm text-muted-foreground">1920×1080 resolution for banners and presentations.</p>
            </div>
            <div className="tech-card border-0 p-4">
              <h3 className="font-medium text-foreground mb-1">Social Media</h3>
              <p className="text-sm text-muted-foreground">1200×630 optimized for Facebook, LinkedIn, Twitter.</p>
            </div>
            <div className="tech-card border-0 p-4">
              <h3 className="font-medium text-foreground mb-1">Brand Consistent</h3>
              <p className="text-sm text-muted-foreground">Official Startup Factory Hub design language.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Marketing;
