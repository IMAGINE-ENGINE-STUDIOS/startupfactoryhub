/**
 * Helper functions for generating circular marker icons for native Mapbox symbol layers.
 * Uses canvas to draw markers with logos or type icons that are rendered at exact coordinates.
 */

// Resource type icon SVG paths (stroke-based for canvas)
const RESOURCE_ICON_PATHS: Record<string, (ctx: CanvasRenderingContext2D, size: number) => void> = {
  office: (ctx, size) => {
    const s = size * 0.45;
    const x = (size - s) / 2;
    const y = (size - s) / 2;
    ctx.strokeRect(x, y, s, s);
    ctx.beginPath();
    ctx.moveTo(x + s * 0.3, y);
    ctx.lineTo(x + s * 0.3, y + s);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x + s * 0.3, y + s * 0.3);
    ctx.lineTo(x + s, y + s * 0.3);
    ctx.stroke();
  },
  lab: (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.12, cy - size * 0.2);
    ctx.lineTo(cx + size * 0.12, cy - size * 0.2);
    ctx.lineTo(cx + size * 0.12, cy - size * 0.05);
    ctx.lineTo(cx + size * 0.22, cy + size * 0.2);
    ctx.lineTo(cx - size * 0.22, cy + size * 0.2);
    ctx.lineTo(cx - size * 0.12, cy - size * 0.05);
    ctx.closePath();
    ctx.stroke();
  },
  venue: (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.05, size * 0.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.15, cy + size * 0.05);
    ctx.quadraticCurveTo(cx, cy + size * 0.25, cx + size * 0.15, cy + size * 0.05);
    ctx.stroke();
  },
  perk: (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    ctx.strokeRect(cx - size * 0.2, cy - size * 0.05, size * 0.4, size * 0.1);
    ctx.beginPath();
    ctx.moveTo(cx, cy - size * 0.15);
    ctx.lineTo(cx, cy - size * 0.05);
    ctx.stroke();
  },
  chamber_of_commerce: (ctx, size) => {
    const cx = size / 2;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.2, size * 0.65);
    ctx.lineTo(cx - size * 0.2, size * 0.4);
    ctx.lineTo(cx, size * 0.3);
    ctx.lineTo(cx + size * 0.2, size * 0.4);
    ctx.lineTo(cx + size * 0.2, size * 0.65);
    ctx.stroke();
  },
  technology_transfer: (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.15, Math.PI * 0.5, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.1, cy - size * 0.15);
    ctx.lineTo(cx + size * 0.2, cy - size * 0.15);
    ctx.lineTo(cx + size * 0.2, cy - size * 0.05);
    ctx.stroke();
  },
  community: (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    ctx.beginPath();
    ctx.arc(cx - size * 0.08, cy - size * 0.08, size * 0.08, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + size * 0.08, cy - size * 0.08, size * 0.08, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + size * 0.1, size * 0.12, Math.PI, 0, true);
    ctx.stroke();
  },
  government_grant: (ctx, size) => {
    const cx = size / 2;
    ctx.beginPath();
    ctx.moveTo(cx, size * 0.3);
    ctx.lineTo(cx, size * 0.7);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.1, size * 0.4);
    ctx.lineTo(cx + size * 0.1, size * 0.4);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.1, size * 0.6);
    ctx.lineTo(cx + size * 0.1, size * 0.6);
    ctx.stroke();
  },
  accelerator_incubator: (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.15, cy + size * 0.15);
    ctx.lineTo(cx, cy);
    ctx.lineTo(cx + size * 0.1, cy - size * 0.2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.05, cy - size * 0.15);
    ctx.lineTo(cx + size * 0.15, cy - size * 0.2);
    ctx.lineTo(cx + size * 0.1, cy - size * 0.1);
    ctx.stroke();
  },
  entrepreneur_center: (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.2, cy);
    ctx.lineTo(cx, cy - size * 0.15);
    ctx.lineTo(cx + size * 0.2, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + size * 0.08, size * 0.12, Math.PI, 0, true);
    ctx.stroke();
  },
  university: (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.2, cy);
    ctx.lineTo(cx, cy - size * 0.15);
    ctx.lineTo(cx + size * 0.2, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + size * 0.08, size * 0.12, Math.PI, 0, true);
    ctx.stroke();
  },
  coworking: (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    ctx.strokeRect(cx - size * 0.2, cy - size * 0.05, size * 0.4, size * 0.2);
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.15, cy - size * 0.05);
    ctx.lineTo(cx - size * 0.1, cy - size * 0.15);
    ctx.lineTo(cx + size * 0.1, cy - size * 0.15);
    ctx.lineTo(cx + size * 0.15, cy - size * 0.05);
    ctx.stroke();
  },
  investor_network: (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.15, cy + size * 0.1);
    ctx.lineTo(cx - size * 0.05, cy);
    ctx.lineTo(cx + size * 0.05, cy + size * 0.05);
    ctx.lineTo(cx + size * 0.15, cy - size * 0.15);
    ctx.stroke();
  },
  human_capital: (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    ctx.beginPath();
    ctx.arc(cx, cy - size * 0.1, size * 0.1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy + size * 0.15, size * 0.15, Math.PI, 0, true);
    ctx.stroke();
  },
  event: (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    ctx.strokeRect(cx - size * 0.18, cy - size * 0.12, size * 0.36, size * 0.3);
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.18, cy);
    ctx.lineTo(cx + size * 0.18, cy);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx - size * 0.08, cy - size * 0.12);
    ctx.lineTo(cx - size * 0.08, cy - size * 0.18);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(cx + size * 0.08, cy - size * 0.12);
    ctx.lineTo(cx + size * 0.08, cy - size * 0.18);
    ctx.stroke();
  },
  other: (ctx, size) => {
    const cx = size / 2;
    const cy = size / 2;
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.15, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.05, 0, Math.PI * 2);
    ctx.fill();
  },
};

export interface MarkerIconOptions {
  size: number;
  borderColor: string;
  backgroundColor: string;
  logoUrl?: string;
  resourceType?: string;
  isOfficialPartner?: boolean;
  isFlagshipHub?: boolean;
}

/**
 * Creates a circular marker icon with a logo or type icon.
 * Returns ImageData that can be added to Mapbox map style.
 */
export async function createCircleMarkerIcon(options: MarkerIconOptions): Promise<ImageData> {
  const { size, borderColor, backgroundColor, logoUrl, resourceType, isOfficialPartner, isFlagshipHub } = options;

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const radius = size / 2 - 4;
  const cx = size / 2;
  const cy = size / 2;

  // Draw glow/shadow for flagship or partner
  if (isFlagshipHub || isOfficialPartner) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cx, cy, radius + 6, 0, Math.PI * 2);
    ctx.fillStyle = isFlagshipHub ? 'rgba(16, 185, 129, 0.3)' : 'rgba(255, 215, 0, 0.2)';
    ctx.fill();
    ctx.restore();
  }

  // Draw circle background
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  
  if (logoUrl) {
    // Try to load and draw logo
    try {
      const img = await loadImage(logoUrl);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.drawImage(img, cx - radius, cy - radius, radius * 2, radius * 2);
    } catch {
      // Fallback to solid color if image fails
      ctx.fillStyle = backgroundColor;
      ctx.fill();
      drawTypeIcon(ctx, resourceType || 'other', size);
    }
  } else {
    // Solid color with icon
    ctx.fillStyle = backgroundColor;
    ctx.fill();
    drawTypeIcon(ctx, resourceType || 'other', size);
  }
  ctx.restore();

  // Draw border
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.strokeStyle = isFlagshipHub ? '#FFD700' : borderColor;
  ctx.lineWidth = isFlagshipHub ? 3 : 2;
  ctx.stroke();

  // Draw partner badge
  if (isOfficialPartner) {
    const badgeSize = size * 0.25;
    const badgeX = cx + radius * 0.5;
    const badgeY = cy - radius * 0.5;
    
    ctx.save();
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeSize / 2, 0, Math.PI * 2);
    ctx.fillStyle = '#FFD700';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1.5;
    ctx.stroke();
    
    // Draw star
    ctx.fillStyle = '#ffffff';
    ctx.font = `${badgeSize * 0.7}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(isFlagshipHub ? '👑' : '⭐', badgeX, badgeY);
    ctx.restore();
  }

  return ctx.getImageData(0, 0, size, size);
}

function drawTypeIcon(ctx: CanvasRenderingContext2D, type: string, size: number) {
  ctx.save();
  ctx.strokeStyle = '#ffffff';
  ctx.fillStyle = '#ffffff';
  ctx.lineWidth = size * 0.04;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const drawFn = RESOURCE_ICON_PATHS[type] || RESOURCE_ICON_PATHS.other;
  drawFn(ctx, size);
  
  ctx.restore();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    // Hint to the browser that decoding can happen off the main thread
    (img as any).decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

/**
 * Creates a type icon (no logo) for the symbol layer fallback.
 */
export function createTypeIcon(color: string, type: string, size: number = 48): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const radius = size / 2 - 3;
  const cx = size / 2;
  const cy = size / 2;

  // Draw circle background
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Draw icon
  drawTypeIcon(ctx, type, size);

  return ctx.getImageData(0, 0, size, size);
}
