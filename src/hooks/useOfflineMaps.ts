import { useState, useEffect, useCallback, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { toast } from 'sonner';

// Country bounding boxes (approximate) for major regions
const COUNTRY_BOUNDS: Record<string, { name: string; bounds: [number, number, number, number] }> = {
  US: { name: 'United States', bounds: [-125, 24, -66, 50] },
  CA: { name: 'Canada', bounds: [-141, 41, -52, 84] },
  GB: { name: 'United Kingdom', bounds: [-8, 49, 2, 61] },
  DE: { name: 'Germany', bounds: [5.8, 47.2, 15.1, 55.1] },
  FR: { name: 'France', bounds: [-5.5, 41.3, 9.6, 51.1] },
  ES: { name: 'Spain', bounds: [-9.3, 36, 3.3, 43.8] },
  IT: { name: 'Italy', bounds: [6.6, 36.6, 18.5, 47.1] },
  BR: { name: 'Brazil', bounds: [-73.9, -33.7, -34.8, 5.3] },
  MX: { name: 'Mexico', bounds: [-118.4, 14.5, -86.7, 32.7] },
  AU: { name: 'Australia', bounds: [113.3, -43.6, 153.6, -10.7] },
  IN: { name: 'India', bounds: [68.1, 7.9, 97.4, 35.5] },
  JP: { name: 'Japan', bounds: [129.4, 31.0, 145.5, 45.5] },
  CO: { name: 'Colombia', bounds: [-79.0, -4.2, -66.9, 12.4] },
  AR: { name: 'Argentina', bounds: [-73.4, -55.1, -53.6, -21.8] },
  NG: { name: 'Nigeria', bounds: [2.7, 4.3, 14.7, 13.9] },
  ZA: { name: 'South Africa', bounds: [16.5, -34.8, 32.9, -22.1] },
  KE: { name: 'Kenya', bounds: [33.9, -4.7, 41.9, 5.5] },
  AE: { name: 'UAE', bounds: [51.6, 22.6, 56.4, 26.1] },
  SG: { name: 'Singapore', bounds: [103.6, 1.2, 104.0, 1.5] },
  KR: { name: 'South Korea', bounds: [125.8, 33.1, 129.6, 38.6] },
};

// IndexedDB for offline tile and route storage
const DB_NAME = 'sfh-offline-maps';
const DB_VERSION = 1;
const TILE_STORE = 'tiles';
const ROUTE_STORE = 'cached_routes';
const META_STORE = 'meta';

interface OfflineRegion {
  countryCode: string;
  countryName: string;
  downloadedAt: string;
  tileCount: number;
  sizeBytes: number;
  zoomLevels: number[];
}

interface OfflineMapsState {
  isEnabled: boolean;
  isDownloading: boolean;
  downloadProgress: number;
  downloadedRegion: OfflineRegion | null;
  detectedCountry: string | null;
  totalTiles: number;
  cachedTiles: number;
  cacheSizeMB: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(TILE_STORE)) {
        db.createObjectStore(TILE_STORE, { keyPath: 'url' });
      }
      if (!db.objectStoreNames.contains(ROUTE_STORE)) {
        db.createObjectStore(ROUTE_STORE, { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains(META_STORE)) {
        db.createObjectStore(META_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function getMetaValue<T>(key: string): Promise<T | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(META_STORE, 'readonly');
    const req = tx.objectStore(META_STORE).get(key);
    req.onsuccess = () => resolve(req.result?.value ?? null);
    req.onerror = () => resolve(null);
  });
}

async function setMetaValue(key: string, value: any) {
  const db = await openDB();
  const tx = db.transaction(META_STORE, 'readwrite');
  tx.objectStore(META_STORE).put({ key, value });
}

async function cacheTile(url: string, blob: Blob) {
  const db = await openDB();
  const tx = db.transaction(TILE_STORE, 'readwrite');
  tx.objectStore(TILE_STORE).put({ url, blob, cachedAt: Date.now() });
}

async function getCachedTile(url: string): Promise<Blob | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(TILE_STORE, 'readonly');
    const req = tx.objectStore(TILE_STORE).get(url);
    req.onsuccess = () => resolve(req.result?.blob ?? null);
    req.onerror = () => resolve(null);
  });
}

async function getTileCount(): Promise<number> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(TILE_STORE, 'readonly');
    const req = tx.objectStore(TILE_STORE).count();
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => resolve(0);
  });
}

async function clearTileCache() {
  const db = await openDB();
  const tx = db.transaction(TILE_STORE, 'readwrite');
  tx.objectStore(TILE_STORE).clear();
}

// Cache route data for offline navigation
export async function cacheRoute(key: string, data: any) {
  const db = await openDB();
  const tx = db.transaction(ROUTE_STORE, 'readwrite');
  tx.objectStore(ROUTE_STORE).put({ key, data, cachedAt: Date.now() });
}

export async function getCachedRoute(key: string): Promise<any | null> {
  const db = await openDB();
  return new Promise((resolve) => {
    const tx = db.transaction(ROUTE_STORE, 'readonly');
    const req = tx.objectStore(ROUTE_STORE).get(key);
    req.onsuccess = () => resolve(req.result?.data ?? null);
    req.onerror = () => resolve(null);
  });
}

// Detect country from coordinates using reverse geocoding
async function detectCountry(lat: number, lng: number): Promise<string | null> {
  // First try bounding box matching (offline-capable)
  for (const [code, { bounds }] of Object.entries(COUNTRY_BOUNDS)) {
    const [minLng, minLat, maxLng, maxLat] = bounds;
    if (lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat) {
      return code;
    }
  }
  // Fallback: Mapbox reverse geocode
  try {
    const res = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=country&access_token=pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ`
    );
    const data = await res.json();
    if (data.features?.[0]?.properties?.short_code) {
      return data.features[0].properties.short_code.toUpperCase();
    }
  } catch {
    // offline — can't geocode
  }
  return null;
}

// Generate tile URLs for a bounding box at given zoom levels
function generateTileUrls(
  bounds: [number, number, number, number],
  zoomLevels: number[],
  styleId: string = 'mapbox/streets-v12'
): string[] {
  const urls: string[] = [];
  const token = 'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';
  const [minLng, minLat, maxLng, maxLat] = bounds;

  for (const z of zoomLevels) {
    const minTileX = lng2tile(minLng, z);
    const maxTileX = lng2tile(maxLng, z);
    const minTileY = lat2tile(maxLat, z); // Note: y is inverted
    const maxTileY = lat2tile(minLat, z);

    for (let x = minTileX; x <= maxTileX; x++) {
      for (let y = minTileY; y <= maxTileY; y++) {
        urls.push(
          `https://api.mapbox.com/styles/v1/${styleId}/tiles/256/${z}/${x}/${y}?access_token=${token}`
        );
      }
    }
  }
  return urls;
}

function lng2tile(lng: number, zoom: number): number {
  return Math.floor(((lng + 180) / 360) * Math.pow(2, zoom));
}

function lat2tile(lat: number, zoom: number): number {
  return Math.floor(
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
      Math.pow(2, zoom)
  );
}

export const useOfflineMaps = () => {
  const { isOnline } = useNetworkStatus();
  const [state, setState] = useState<OfflineMapsState>({
    isEnabled: false,
    isDownloading: false,
    downloadProgress: 0,
    downloadedRegion: null,
    detectedCountry: null,
    totalTiles: 0,
    cachedTiles: 0,
    cacheSizeMB: 0,
  });
  const abortRef = useRef<AbortController | null>(null);
  const enabledRef = useRef(false);

  // Load persisted state
  useEffect(() => {
    (async () => {
      const enabled = await getMetaValue<boolean>('offlineEnabled');
      const region = await getMetaValue<OfflineRegion>('downloadedRegion');
      const count = await getTileCount();
      enabledRef.current = !!enabled;
      setState(prev => ({
        ...prev,
        isEnabled: !!enabled,
        downloadedRegion: region,
        cachedTiles: count,
      }));
    })();
  }, []);

  // Detect country on mount
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const code = await detectCountry(pos.coords.latitude, pos.coords.longitude);
        setState(prev => ({ ...prev, detectedCountry: code }));
      },
      () => {},
      { enableHighAccuracy: false, timeout: 10000 }
    );
  }, []);

  // Toggle offline maps
  const toggleOffline = useCallback(async (enabled: boolean) => {
    enabledRef.current = enabled;
    await setMetaValue('offlineEnabled', enabled);
    setState(prev => ({ ...prev, isEnabled: enabled }));

    if (enabled && !state.downloadedRegion && state.detectedCountry) {
      // Start background download
      downloadRegion(state.detectedCountry);
    } else if (!enabled) {
      // Cancel active download
      abortRef.current?.abort();
    }
  }, [state.detectedCountry, state.downloadedRegion]);

  // Download map tiles for a country
  const downloadRegion = useCallback(async (countryCode: string) => {
    const country = COUNTRY_BOUNDS[countryCode];
    if (!country) {
      toast.error(`Offline maps not available for ${countryCode}`);
      return;
    }

    setState(prev => ({ ...prev, isDownloading: true, downloadProgress: 0 }));
    const controller = new AbortController();
    abortRef.current = controller;

    // Download zoom levels 1-8 for country overview, 9-12 for navigation detail
    // This keeps download size reasonable (~50-200MB depending on country)
    const zoomLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
    const tileUrls = generateTileUrls(country.bounds, zoomLevels);
    const totalTiles = tileUrls.length;

    setState(prev => ({ ...prev, totalTiles }));

    toast.info(`Downloading ${country.name} offline maps...`, {
      description: `${totalTiles.toLocaleString()} tiles across zoom levels 1-10`,
      duration: 5000,
    });

    let downloaded = 0;
    let totalSize = 0;
    const BATCH_SIZE = 10; // concurrent downloads

    try {
      for (let i = 0; i < tileUrls.length; i += BATCH_SIZE) {
        if (controller.signal.aborted) break;

        const batch = tileUrls.slice(i, i + BATCH_SIZE);
        const results = await Promise.allSettled(
          batch.map(async (url) => {
            try {
              const res = await fetch(url, { signal: controller.signal });
              if (res.ok) {
                const blob = await res.blob();
                await cacheTile(url, blob);
                totalSize += blob.size;
                return true;
              }
            } catch {
              // skip failed tiles
            }
            return false;
          })
        );

        downloaded += results.filter(r => r.status === 'fulfilled' && r.value).length;
        const progress = Math.round((downloaded / totalTiles) * 100);

        setState(prev => ({
          ...prev,
          downloadProgress: progress,
          cachedTiles: downloaded,
          cacheSizeMB: Math.round(totalSize / (1024 * 1024)),
        }));
      }

      if (!controller.signal.aborted) {
        const region: OfflineRegion = {
          countryCode,
          countryName: country.name,
          downloadedAt: new Date().toISOString(),
          tileCount: downloaded,
          sizeBytes: totalSize,
          zoomLevels,
        };
        await setMetaValue('downloadedRegion', region);
        setState(prev => ({
          ...prev,
          isDownloading: false,
          downloadProgress: 100,
          downloadedRegion: region,
        }));
        toast.success(`${country.name} offline maps ready!`, {
          description: `${downloaded.toLocaleString()} tiles (${Math.round(totalSize / (1024 * 1024))}MB)`,
        });
      }
    } catch {
      setState(prev => ({ ...prev, isDownloading: false }));
    }
  }, []);

  // Download tiles along a specific route corridor for higher zoom navigation
  const cacheRouteTiles = useCallback(async (coordinates: [number, number][]) => {
    if (!enabledRef.current) return;

    // Cache tiles at zoom levels 12-16 along the route corridor
    const zoomLevels = [12, 13, 14, 15];
    const token = 'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';
    const tilesSet = new Set<string>();

    for (const [lng, lat] of coordinates) {
      for (const z of zoomLevels) {
        const x = lng2tile(lng, z);
        const y = lat2tile(lat, z);
        // Cache the tile and its neighbors (3x3 grid for buffer)
        for (let dx = -1; dx <= 1; dx++) {
          for (let dy = -1; dy <= 1; dy++) {
            const url = `https://api.mapbox.com/styles/v1/mapbox/streets-v12/tiles/256/${z}/${x + dx}/${y + dy}?access_token=${token}`;
            tilesSet.add(url);
          }
        }
      }
    }

    const urls = Array.from(tilesSet);
    const BATCH = 15;
    for (let i = 0; i < urls.length; i += BATCH) {
      const batch = urls.slice(i, i + BATCH);
      await Promise.allSettled(
        batch.map(async (url) => {
          try {
            const res = await fetch(url);
            if (res.ok) {
              const blob = await res.blob();
              await cacheTile(url, blob);
            }
          } catch { }
        })
      );
    }
  }, []);

  // Delete cached offline data
  const clearOfflineData = useCallback(async () => {
    abortRef.current?.abort();
    await clearTileCache();
    await setMetaValue('downloadedRegion', null);
    setState(prev => ({
      ...prev,
      downloadedRegion: null,
      downloadProgress: 0,
      cachedTiles: 0,
      cacheSizeMB: 0,
      isDownloading: false,
    }));
    toast.success('Offline maps cleared');
  }, []);

  return {
    ...state,
    isOnline,
    toggleOffline,
    downloadRegion,
    cacheRouteTiles,
    clearOfflineData,
    getCachedTile,
  };
};
