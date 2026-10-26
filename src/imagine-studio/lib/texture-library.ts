// @ts-nocheck -- imported Imagine Studio v2
/**
 * Texture library for the Texture Editor inspector.
 *
 * Built-in textures are tiny procedural patterns rendered to 256² canvases
 * and exported as JPEG data URLs — instant, offline, no asset hosting.
 * Saved textures are user-uploaded data URLs persisted to localStorage
 * per-project so they're available across all objects in this project.
 */

export interface LibraryTexture {
  id: string;
  name: string;
  url: string; // data URL
  thumbnail: string; // smaller data URL for grid previews (or same as url)
}

/* ---- procedural built-ins (lazy, one-time) ---- */

let _builtins: LibraryTexture[] | null = null;

function renderTexture(
  name: string,
  draw: (ctx: CanvasRenderingContext2D, s: number) => void,
): LibraryTexture {
  const size = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = size;
  const ctx = cv.getContext("2d")!;
  draw(ctx, size);
  const url = cv.toDataURL("image/jpeg", 0.85);
  return { id: `builtin_${name.toLowerCase().replace(/\s+/g, "_")}`, name, url, thumbnail: url };
}

export function getBuiltinTextures(): LibraryTexture[] {
  if (_builtins) return _builtins;
  if (typeof document === "undefined") return [];
  _builtins = [
    renderTexture("Checker", (ctx, s) => {
      const n = 8, cell = s / n;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          ctx.fillStyle = (x + y) % 2 ? "#e5e7eb" : "#475569";
          ctx.fillRect(x * cell, y * cell, cell, cell);
        }
    }),
    renderTexture("Brick", (ctx, s) => {
      ctx.fillStyle = "#7f1d1d"; ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = "#1f2937";
      const rows = 8, cols = 4, h = s / rows, w = s / cols;
      for (let y = 0; y < rows; y++) {
        const off = (y % 2) * w / 2;
        for (let x = -1; x < cols + 1; x++) {
          ctx.fillRect(x * w + off, y * h, w - 2, 2);
          ctx.fillRect(x * w + off, y * h, 2, h - 2);
        }
      }
    }),
    renderTexture("Wood", (ctx, s) => {
      const grd = ctx.createLinearGradient(0, 0, s, 0);
      grd.addColorStop(0, "#8b5a2b"); grd.addColorStop(1, "#6b3f1a");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "rgba(60,30,10,0.45)"; ctx.lineWidth = 1;
      for (let y = 0; y < s; y += 4 + Math.random() * 3) {
        ctx.beginPath(); ctx.moveTo(0, y);
        for (let x = 0; x < s; x += 8) ctx.lineTo(x, y + Math.sin(x * 0.05 + y) * 1.5);
        ctx.stroke();
      }
    }),
    renderTexture("Concrete", (ctx, s) => {
      ctx.fillStyle = "#9ca3af"; ctx.fillRect(0, 0, s, s);
      const img = ctx.getImageData(0, 0, s, s);
      for (let i = 0; i < img.data.length; i += 4) {
        const n = (Math.random() - 0.5) * 50;
        img.data[i] += n; img.data[i + 1] += n; img.data[i + 2] += n;
      }
      ctx.putImageData(img, 0, 0);
    }),
    renderTexture("Metal", (ctx, s) => {
      const grd = ctx.createLinearGradient(0, 0, 0, s);
      grd.addColorStop(0, "#cbd5e1"); grd.addColorStop(1, "#64748b");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      for (let y = 0; y < s; y += 3) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(s, y); ctx.stroke();
      }
    }),
    renderTexture("Marble", (ctx, s) => {
      ctx.fillStyle = "#f8fafc"; ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "rgba(100,116,139,0.55)"; ctx.lineWidth = 1.5;
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        let x = Math.random() * s, y = Math.random() * s;
        ctx.moveTo(x, y);
        for (let j = 0; j < 18; j++) {
          x += (Math.random() - 0.5) * 30; y += (Math.random() - 0.5) * 30;
          ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
    }),
    renderTexture("Fabric", (ctx, s) => {
      ctx.fillStyle = "#1e40af"; ctx.fillRect(0, 0, s, s);
      ctx.fillStyle = "rgba(255,255,255,0.18)";
      for (let y = 0; y < s; y += 4)
        for (let x = (y / 4) % 2 ? 2 : 0; x < s; x += 4)
          ctx.fillRect(x, y, 2, 2);
    }),
    renderTexture("Grid", (ctx, s) => {
      ctx.fillStyle = "#0f172a"; ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "#22d3ee"; ctx.lineWidth = 1;
      const step = s / 8;
      for (let i = 0; i <= 8; i++) {
        ctx.beginPath(); ctx.moveTo(i * step, 0); ctx.lineTo(i * step, s); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, i * step); ctx.lineTo(s, i * step); ctx.stroke();
      }
    }),
    /* ---- WONDERLANDS set (founder directive 2026-10-26): the pool &
     * deck surfaces from Wonderlands World, as Studio tools — texture
     * any deck, pool floor or water plane in two clicks. ---- */
    renderTexture("Pool Water", (ctx, s) => {
      const grd = ctx.createLinearGradient(0, 0, s, s);
      grd.addColorStop(0, "#35b6c9"); grd.addColorStop(0.5, "#1f96ad"); grd.addColorStop(1, "#2aa7bd");
      ctx.fillStyle = grd; ctx.fillRect(0, 0, s, s);
      ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 2;
      for (let i = 0; i < 26; i++) {
        ctx.beginPath();
        let x = Math.random() * s, y = Math.random() * s;
        ctx.moveTo(x, y);
        for (let j = 0; j < 5; j++) { x += (Math.random() - 0.5) * 46; y += (Math.random() - 0.5) * 22; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(10,80,100,0.25)";
      for (let i = 0; i < 18; i++) {
        ctx.beginPath();
        let x = Math.random() * s, y = Math.random() * s;
        ctx.moveTo(x, y);
        for (let j = 0; j < 4; j++) { x += (Math.random() - 0.5) * 40; y += (Math.random() - 0.5) * 30; ctx.lineTo(x, y); }
        ctx.stroke();
      }
    }),
    renderTexture("Pool Tile", (ctx, s) => {
      ctx.fillStyle = "#0d6e83"; ctx.fillRect(0, 0, s, s);
      const n = 10, cell = s / n;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          const shades = ["#2fb3c9", "#25a2ba", "#39bcd2", "#1f96ad", "#2aa7bd"];
          ctx.fillStyle = shades[(x * 7 + y * 13) % shades.length];
          ctx.fillRect(x * cell + 1.5, y * cell + 1.5, cell - 3, cell - 3);
        }
    }),
    renderTexture("Deck Wood", (ctx, s) => {
      ctx.fillStyle = "#7d5a36"; ctx.fillRect(0, 0, s, s);
      const planks = 5, ph = s / planks;
      for (let p = 0; p < planks; p++) {
        const grd = ctx.createLinearGradient(0, p * ph, 0, (p + 1) * ph);
        grd.addColorStop(0, "#97744a"); grd.addColorStop(0.5, "#86633c"); grd.addColorStop(1, "#75552f");
        ctx.fillStyle = grd; ctx.fillRect(0, p * ph + 2, s, ph - 4);
        ctx.strokeStyle = "rgba(62,40,18,0.5)"; ctx.lineWidth = 1;
        for (let g = 0; g < 7; g++) {
          const gy = p * ph + 4 + Math.random() * (ph - 8);
          ctx.beginPath(); ctx.moveTo(0, gy);
          for (let x = 0; x < s; x += 16) ctx.lineTo(x, gy + Math.sin(x * 0.04 + gy) * 1.2);
          ctx.stroke();
        }
        ctx.fillStyle = "rgba(40,26,12,0.85)";
        ctx.beginPath(); ctx.arc(14, p * ph + ph / 2, 2.4, 0, 7); ctx.arc(s - 14, p * ph + ph / 2, 2.4, 0, 7); ctx.fill();
      }
    }),
    renderTexture("Travertine Deck", (ctx, s) => {
      ctx.fillStyle = "#ddd3ba"; ctx.fillRect(0, 0, s, s);
      const n = 2, cell = s / n;
      for (let y = 0; y < n; y++)
        for (let x = 0; x < n; x++) {
          ctx.fillStyle = ["#e2d9c4", "#d8cfbc", "#e6dfcd", "#d5cbb4"][(x + y * 2) % 4];
          ctx.fillRect(x * cell + 2, y * cell + 2, cell - 4, cell - 4);
        }
      ctx.fillStyle = "rgba(150,132,100,0.35)";
      for (let i = 0; i < 260; i++) ctx.fillRect(Math.random() * s, Math.random() * s, 2.5, 1.2);
    }),
    renderTexture("Pebble", (ctx, s) => {
      ctx.fillStyle = "#b8ab90"; ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 700; i++) {
        const r = 2.5 + Math.random() * 4.5;
        ctx.fillStyle = ["#cbbc9e", "#a99a7d", "#d8ccb2", "#96876a", "#bfb198"][i % 5];
        ctx.beginPath(); ctx.ellipse(Math.random() * s, Math.random() * s, r, r * 0.75, Math.random() * 3, 0, 7); ctx.fill();
      }
    }),
    renderTexture("Sand", (ctx, s) => {
      ctx.fillStyle = "#e8dcc0"; ctx.fillRect(0, 0, s, s);
      const img = ctx.getImageData(0, 0, s, s);
      for (let i = 0; i < img.data.length; i += 4) {
        const nz = (Math.random() - 0.5) * 26;
        img.data[i] += nz; img.data[i + 1] += nz; img.data[i + 2] += nz * 0.8;
      }
      ctx.putImageData(img, 0, 0);
    }),
  ];
  return _builtins;
}

/* ---- saved (user-uploaded) library, per-project ---- */

const storageKey = (projectId: string) => `level.textures.${projectId}`;

export function getSavedTextures(projectId: string): LibraryTexture[] {
  if (typeof localStorage === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(storageKey(projectId)) || "[]");
  } catch {
    return [];
  }
}

export function saveTexture(projectId: string, t: LibraryTexture) {
  const list = getSavedTextures(projectId);
  list.unshift(t);
  localStorage.setItem(storageKey(projectId), JSON.stringify(list.slice(0, 60)));
}

export function removeSavedTexture(projectId: string, id: string) {
  const list = getSavedTextures(projectId).filter((t) => t.id !== id);
  localStorage.setItem(storageKey(projectId), JSON.stringify(list));
}

/** Read a File as a data URL. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((res, rej) => {
    const r = new FileReader();
    r.onload = () => res(r.result as string);
    r.onerror = () => rej(r.error);
    r.readAsDataURL(file);
  });
}