import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Bounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

interface CameraResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  imageUrl: string;
  source: string;
  streamUrl?: string;
  refreshRate?: number;
}

const cache = new Map<string, { data: CameraResult[]; time: number }>();
const CACHE_TTL = 120_000;

function regionKey(bounds: Bounds): string {
  return `${Math.floor(bounds.south)}_${Math.floor(bounds.west)}_${Math.floor(bounds.north)}_${Math.floor(bounds.east)}`;
}

function inBounds(lat: number, lng: number, bounds: Bounds): boolean {
  return lat >= bounds.south && lat <= bounds.north && lng >= bounds.west && lng <= bounds.east && lat !== 0 && lng !== 0;
}

// ====== NYC / NEW YORK ======

async function fetchNYCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 45.5 || bounds.north < 40 || bounds.west > -71 || bounds.east < -80) return [];
  try {
    const resp = await fetch('https://511ny.org/api/getcameras?format=json&key=public', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => {
        const lat = parseFloat(c.Latitude || c.latitude || 0);
        const lng = parseFloat(c.Longitude || c.longitude || 0);
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 200)
      .map((c: any) => {
        // 511ny URLs like /map/Cctv/N return HTML pages, not images
        // The actual image URL is in the VideoUrl or we construct it
        let imgUrl = '';
        const rawUrl = c.Url || c.url || c.VideoUrl || '';
        // Check if it's a direct image URL
        if (rawUrl.match(/\.(jpg|jpeg|png|gif|bmp)(\?|$)/i)) {
          imgUrl = rawUrl;
        } else if (c.ID || c.id) {
          // Use 511ny snapshot endpoint
          imgUrl = `https://511ny.org/map/Cctv/${c.ID || c.id}`;
        }
        const videoUrl = c.VideoUrl || c.videoUrl || '';
        return {
          id: `ny-${c.ID || c.id}`,
          name: c.Name || c.name || c.RoadwayName || 'NY Camera',
          lat: parseFloat(c.Latitude || c.latitude),
          lng: parseFloat(c.Longitude || c.longitude),
          imageUrl: imgUrl,
          source: '511NY',
          refreshRate: 3,
          streamUrl: videoUrl && /\.(mjpg|mjpeg|mp4|m3u8)(\?|$)|mjpeg|mjpg|stream|video/i.test(videoUrl) ? videoUrl : undefined,
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// NYC DOT / NYCTMC cameras (Manhattan, Brooklyn, Queens, Bronx, Staten Island)
async function fetchNYCDOTCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 41 || bounds.north < 40.4 || bounds.west > -73.6 || bounds.east < -74.3) return [];
  try {
    // NYC DOT real-time camera API
    const resp = await fetch('https://webcams.nyctmc.org/api/cameras/', { 
      signal: AbortSignal.timeout(8000),
      headers: { 'Accept': 'application/json' }
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = Array.isArray(data) ? data : (data?.cameras || data?.features || []);
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => {
        const lat = c.latitude || c.lat || c.location?.latitude || 0;
        const lng = c.longitude || c.lng || c.location?.longitude || 0;
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 200)
      .map((c: any) => {
        const streamCandidate = c.streamUrl || c.videoUrl || c.mjpegUrl || c.liveStreamUrl || '';
        return {
          id: `nycdot-${c.id || c.cameraID || c.camera_id || Math.random().toString(36).slice(2)}`,
          name: c.name || c.title || c.description || 'NYC Camera',
          lat: c.latitude || c.lat || c.location?.latitude,
          lng: c.longitude || c.lng || c.location?.longitude,
          imageUrl: c.imageUrl || c.image_url || c.url || c.stillImageUrl || c.snapshotUrl || '',
          source: 'NYCDOT',
          refreshRate: 2,
          streamUrl: streamCandidate && /\.(mjpg|mjpeg|mp4|m3u8)(\?|$)|mjpeg|mjpg|stream|video/i.test(streamCandidate) ? streamCandidate : undefined,
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== CALIFORNIA ======

async function fetchCaltransDistrict(dist: string, bounds: Bounds): Promise<CameraResult[]> {
  try {
    const label = dist.charAt(0).toUpperCase() + dist.slice(1);
    const resp = await fetch(`https://cwwp2.dot.ca.gov/data/${dist}/cctv/cctvStatus${label}.json`, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = data?.data || data;
    if (!Array.isArray(cameras)) return [];
    const results: CameraResult[] = [];
    for (const cam of cameras) {
      const loc = cam.location || cam.cctv || cam;
      const lat = parseFloat(loc.latitude || loc.lat || 0);
      const lng = parseFloat(loc.longitude || loc.lng || loc.lon || 0);
      if (inBounds(lat, lng, bounds)) {
        const imgUrl = loc.imageUrl || loc.image?.url || loc.currentImageURL || '';
        if (imgUrl) {
          results.push({
            id: `ca-${dist}-${loc.id || results.length}`,
            name: loc.name || loc.description || `CA ${dist.toUpperCase()} Camera`,
            lat, lng, imageUrl: imgUrl,
            source: `Caltrans ${dist.toUpperCase()}`,
            refreshRate: 5,
          });
        }
      }
      if (results.length >= 50) break;
    }
    return results;
  } catch { return []; }
}

async function fetchAllCaltrans(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.east < -130 || bounds.west > -114 || bounds.south > 42 || bounds.north < 32) return [];
  const districts = ['d1','d2','d3','d4','d5','d6','d7','d8','d9','d10','d11','d12'];
  const results: CameraResult[] = [];
  const settled = await Promise.allSettled(districts.map(d => fetchCaltransDistrict(d, bounds)));
  for (const r of settled) {
    if (r.status === 'fulfilled') results.push(...r.value);
  }
  return results.slice(0, 300);
}

// ====== WASHINGTON ======

async function fetchWSDOT(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 49 || bounds.north < 45 || bounds.west > -116 || bounds.east < -125) return [];
  try {
    const resp = await fetch('https://data.wsdot.wa.gov/log/Public/cameras.json', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => inBounds(c.CameraLocation?.Latitude || 0, c.CameraLocation?.Longitude || 0, bounds))
      .slice(0, 100)
      .map((c: any) => ({
        id: `wa-${c.CameraID}`,
        name: c.Title || c.Description || 'WA Camera',
        lat: c.CameraLocation.Latitude,
        lng: c.CameraLocation.Longitude,
        imageUrl: c.ImageURL || c.ImageUrl || '',
        source: 'WSDOT',
        refreshRate: 3,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== OREGON ======

async function fetchODOT(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 46.5 || bounds.north < 42 || bounds.west > -116 || bounds.east < -125) return [];
  try {
    const resp = await fetch('https://tripcheck.com/Scripts/map/data/cameraData.js', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const text = await resp.text();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const data = JSON.parse(match[0]);
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => inBounds(c.lat || c.latitude || 0, c.lon || c.lng || c.longitude || 0, bounds))
      .slice(0, 60)
      .map((c: any, i: number) => ({
        id: `or-${c.id || i}`,
        name: c.title || c.name || 'OR Camera',
        lat: c.lat || c.latitude,
        lng: c.lon || c.lng || c.longitude,
        imageUrl: c.imageUrl || c.url || '',
        source: 'ODOT',
        refreshRate: 10,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== COLORADO ======

async function fetchCDOT(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 41.5 || bounds.north < 37 || bounds.west > -102 || bounds.east < -109.5) return [];
  try {
    const resp = await fetch('https://www.cotrip.org/speed/getTrafficCameras.do', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = data?.features || data;
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => {
        const coords = c.geometry?.coordinates || [];
        return coords.length >= 2 && inBounds(coords[1], coords[0], bounds);
      })
      .slice(0, 60)
      .map((c: any) => ({
        id: `co-${c.properties?.id || c.id || Math.random().toString(36).slice(2)}`,
        name: c.properties?.camera_label || c.properties?.name || 'CO Camera',
        lat: c.geometry.coordinates[1],
        lng: c.geometry.coordinates[0],
        imageUrl: c.properties?.https_url || c.properties?.camera_url || '',
        source: 'CDOT',
        refreshRate: 10,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== VIRGINIA ======

async function fetch511VA(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 40 || bounds.north < 36 || bounds.west > -75 || bounds.east < -84) return [];
  try {
    const resp = await fetch('https://www.511virginia.org/data/geojson/icons.cameras.geojson', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const features = data?.features || [];
    return features
      .filter((f: any) => {
        const [lng, lat] = f.geometry?.coordinates || [0, 0];
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 80)
      .map((f: any) => ({
        id: `va-${f.properties?.id || Math.random().toString(36).slice(2)}`,
        name: f.properties?.name || f.properties?.description || 'VA Camera',
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        imageUrl: f.properties?.image_url || f.properties?.url || '',
        source: '511VA',
        refreshRate: 10,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== FLORIDA ======

async function fetchFLDOT(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 31.5 || bounds.north < 24.3 || bounds.west > -79.5 || bounds.east < -88) return [];
  try {
    // FL511 ArcGIS - use multiple fields for image URL
    const url = `https://services.arcgis.com/3wFbqsFPLeKqOlIK/arcgis/rest/services/FL511_Traffic_Cameras/FeatureServer/0/query?where=1%3D1&geometry=${bounds.west},${bounds.south},${bounds.east},${bounds.north}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&outFields=*&f=json&resultRecordCount=500`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const features = data?.features || [];
    if (!Array.isArray(features)) return [];
    
    return features
      .filter((f: any) => {
        const a = f.attributes || {};
        const lat = a.LATITUDE || a.latitude || (f.geometry?.y);
        const lng = a.LONGITUDE || a.longitude || (f.geometry?.x);
        return lat && lng && inBounds(lat, lng, bounds);
      })
      .map((f: any) => {
        const a = f.attributes;
        const cameraId = a.ID || a.OBJECTID;
        
        // ALWAYS use fl511.com/map/Cctv/ID - the divas.cloud URLs are broken/404
        const imgUrl = cameraId ? `https://fl511.com/map/Cctv/${cameraId}` : '';
        
        const lat = a.LATITUDE || a.latitude || f.geometry?.y;
        const lng = a.LONGITUDE || a.longitude || f.geometry?.x;
        
        return {
          id: `fl-${cameraId || Math.random().toString(36).slice(2)}`,
          name: a.DESCRIPT || a.Description || (a.COUNTY && a.HIGHWAY ? `${a.COUNTY} - ${a.HIGHWAY}` : 'FL Camera'),
          lat,
          lng,
          imageUrl: imgUrl,
          source: 'FL511',
          refreshRate: 10,
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch (e) {
    console.error('FL DOT cameras error:', e);
    return [];
  }
}

// ====== GEORGIA ======

async function fetch511GA(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 35.5 || bounds.north < 30.5 || bounds.west > -80.5 || bounds.east < -86) return [];
  try {
    const resp = await fetch('https://511ga.org/api/v2/get/cameras', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => inBounds(c.latitude || 0, c.longitude || 0, bounds))
      .slice(0, 80)
      .map((c: any) => ({
        id: `ga-${c.id}`,
        name: c.name || c.location || 'GA Camera',
        lat: c.latitude,
        lng: c.longitude,
        imageUrl: c.image_url || c.url || '',
        source: '511GA',
        refreshRate: 10,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== TEXAS ======

async function fetchTXDOT(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 36.5 || bounds.north < 25.5 || bounds.west > -93 || bounds.east < -107) return [];
  try {
    const resp = await fetch('https://its.txdot.gov/data/cctv_images.json', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = data?.cctv_images || data?.cameras || data;
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => {
        const lat = parseFloat(c.latitude || c.lat || 0);
        const lng = parseFloat(c.longitude || c.lng || 0);
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 100)
      .map((c: any) => ({
        id: `tx-${c.id || c.cctv_id || Math.random().toString(36).slice(2)}`,
        name: c.name || c.location || c.description || 'TX Camera',
        lat: parseFloat(c.latitude || c.lat),
        lng: parseFloat(c.longitude || c.lng),
        imageUrl: c.url || c.image_url || c.imageUrl || '',
        source: 'TxDOT',
        refreshRate: 10,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== ILLINOIS ======

async function fetchILDOT(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 43 || bounds.north < 36.5 || bounds.west > -87 || bounds.east < -92) return [];
  try {
    const resp = await fetch('https://www.travelmidwest.com/lmiga/cameras.json', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = Array.isArray(data) ? data : (data?.cameras || data?.features || []);
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => {
        const lat = c.latitude || c.lat || c.geometry?.coordinates?.[1] || 0;
        const lng = c.longitude || c.lng || c.geometry?.coordinates?.[0] || 0;
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 80)
      .map((c: any, i: number) => ({
        id: `il-${c.id || i}`,
        name: c.name || c.description || c.title || 'IL Camera',
        lat: c.latitude || c.lat || c.geometry?.coordinates?.[1],
        lng: c.longitude || c.lng || c.geometry?.coordinates?.[0],
        imageUrl: c.imageUrl || c.image_url || c.url || '',
        source: 'ILDOT',
        refreshRate: 10,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== NEW JERSEY ======

async function fetchNJDOT(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 41.5 || bounds.north < 38.8 || bounds.west > -73.8 || bounds.east < -75.6) return [];
  try {
    const resp = await fetch('https://511nj.org/api/getcameras?format=json&key=public', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => {
        const lat = parseFloat(c.Latitude || c.latitude || 0);
        const lng = parseFloat(c.Longitude || c.longitude || 0);
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 100)
      .map((c: any) => ({
        id: `nj-${c.ID || c.id}`,
        name: c.Name || c.name || c.RoadwayName || 'NJ Camera',
        lat: parseFloat(c.Latitude || c.latitude),
        lng: parseFloat(c.Longitude || c.longitude),
        imageUrl: c.Url || c.url || c.VideoUrl || '',
        source: '511NJ',
        refreshRate: 10,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== PENNSYLVANIA ======

async function fetchPADOT(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 42.5 || bounds.north < 39.5 || bounds.west > -74.5 || bounds.east < -80.6) return [];
  try {
    const resp = await fetch('https://511pa.com/api/getcameras?format=json&key=public', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => {
        const lat = parseFloat(c.Latitude || c.latitude || 0);
        const lng = parseFloat(c.Longitude || c.longitude || 0);
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 100)
      .map((c: any) => ({
        id: `pa-${c.ID || c.id}`,
        name: c.Name || c.name || c.RoadwayName || 'PA Camera',
        lat: parseFloat(c.Latitude || c.latitude),
        lng: parseFloat(c.Longitude || c.longitude),
        imageUrl: c.Url || c.url || c.VideoUrl || '',
        source: '511PA',
        refreshRate: 10,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== MARYLAND ======

async function fetchMDDOT(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 40 || bounds.north < 37.5 || bounds.west > -75 || bounds.east < -79.5) return [];
  try {
    const resp = await fetch('https://chart.maryland.gov/DataFeeds/GetCamerasJson', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = Array.isArray(data) ? data : (data?.cameras || []);
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => {
        const lat = parseFloat(c.lat || c.latitude || 0);
        const lng = parseFloat(c.lon || c.lng || c.longitude || 0);
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 80)
      .map((c: any) => ({
        id: `md-${c.id || c.cameraId || Math.random().toString(36).slice(2)}`,
        name: c.description || c.name || c.title || 'MD Camera',
        lat: parseFloat(c.lat || c.latitude),
        lng: parseFloat(c.lon || c.lng || c.longitude),
        imageUrl: c.imageUrl || c.url || c.image || '',
        source: 'MDSHA',
        refreshRate: 15,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== UK ======

async function fetchUKCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 61 || bounds.north < 49 || bounds.west > 2 || bounds.east < -11) return [];
  try {
    const resp = await fetch('https://data.highwaysengland.co.uk/ntis/NTIS/Camera/content.json', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = data?.cameras || data?.features || data;
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => {
        const lat = c.latitude || c.lat || c.geometry?.coordinates?.[1] || 0;
        const lng = c.longitude || c.lng || c.geometry?.coordinates?.[0] || 0;
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 60)
      .map((c: any, i: number) => ({
        id: `uk-${c.id || i}`,
        name: c.description || c.name || c.title || 'UK Highway Camera',
        lat: c.latitude || c.lat || c.geometry?.coordinates?.[1],
        lng: c.longitude || c.lng || c.geometry?.coordinates?.[0],
        imageUrl: c.image || c.imageUrl || c.url || '',
        source: 'Highways England',
        refreshRate: 20,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== NETHERLANDS ======

async function fetchNLCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 54 || bounds.north < 50.5 || bounds.west > 7.5 || bounds.east < 3) return [];
  try {
    const resp = await fetch('https://opendata.ndw.nu/MSt_Camera.json', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const features = data?.features || data;
    if (!Array.isArray(features)) return [];
    return features
      .filter((f: any) => {
        const coords = f.geometry?.coordinates || [];
        return coords.length >= 2 && inBounds(coords[1], coords[0], bounds);
      })
      .slice(0, 40)
      .map((f: any) => ({
        id: `nl-${f.properties?.id || Math.random().toString(36).slice(2)}`,
        name: f.properties?.name || f.properties?.description || 'NL Camera',
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        imageUrl: f.properties?.imageUrl || f.properties?.url || '',
        source: 'NDW Netherlands',
        refreshRate: 20,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== AUSTRALIA ======

async function fetchAUCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > -10 || bounds.north < -44 || bounds.west > 155 || bounds.east < 112) return [];
  try {
    const resp = await fetch('https://www.livetraffic.com/traffic/cameras/geojson', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const features = data?.features || [];
    return features
      .filter((f: any) => {
        const [lng, lat] = f.geometry?.coordinates || [0, 0];
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 60)
      .map((f: any) => ({
        id: `au-${f.properties?.id || Math.random().toString(36).slice(2)}`,
        name: f.properties?.title || f.properties?.name || 'AU Camera',
        lat: f.geometry.coordinates[1],
        lng: f.geometry.coordinates[0],
        imageUrl: f.properties?.href || f.properties?.imageUrl || '',
        source: 'NSW LiveTraffic',
        refreshRate: 20,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== WINDY.COM WEBCAMS - WORLDWIDE FALLBACK ======

async function fetchWindyCameras(bounds: Bounds): Promise<CameraResult[]> {
  try {
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;
    const radius = Math.min(250, Math.max(10, Math.round(
      Math.max(bounds.north - bounds.south, bounds.east - bounds.west) * 55
    )));
    
    const resp = await fetch(
      `https://api.windy.com/webcams/api/v3/webcams?lang=en&limit=200&offset=0&include=images,location&nearby=${centerLat},${centerLng},${radius}`,
      {
        headers: {
          'x-windy-api-key': 'PGbLONaQtxGGGTZ0NXPEr4BbPtTOqo5f',
        },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!resp.ok) return [];
    const data = await resp.json();
    const webcams = data?.webcams || [];
    
    return webcams
      .filter((w: any) => {
        const lat = w.location?.latitude || w.position?.latitude || 0;
        const lng = w.location?.longitude || w.position?.longitude || 0;
        return inBounds(lat, lng, bounds);
      })
      .slice(0, 200)
      .map((w: any) => ({
        id: `windy-${w.webcamId || w.id}`,
        name: w.title || 'Webcam',
        lat: w.location?.latitude || w.position?.latitude,
        lng: w.location?.longitude || w.position?.longitude,
        imageUrl: w.images?.current?.preview || w.image?.current?.preview || w.images?.daylight?.preview || `https://images-webcams.windy.com/webcams/${w.webcamId || w.id}/current/preview/${w.webcamId || w.id}.jpg`,
        source: `Windy`,
        refreshRate: 30,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch (e) {
    console.error('Windy cameras error:', e);
    return [];
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { bounds } = await req.json() as { bounds: Bounds };

    if (!bounds || bounds.north == null || bounds.south == null || bounds.east == null || bounds.west == null) {
      return new Response(
        JSON.stringify({ cameras: [], error: 'Invalid bounds' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check region cache
    const key = regionKey(bounds);
    const cached = cache.get(key);
    if (cached && Date.now() - cached.time < CACHE_TTL) {
      return new Response(
        JSON.stringify({ cameras: cached.data }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Fetch from ALL sources concurrently
    const results = await Promise.allSettled([
      fetchNYCameras(bounds),
      fetchNYCDOTCameras(bounds),
      fetchAllCaltrans(bounds),
      fetchWSDOT(bounds),
      fetchODOT(bounds),
      fetchCDOT(bounds),
      fetch511VA(bounds),
      fetch511GA(bounds),
      fetchFLDOT(bounds),
      fetchTXDOT(bounds),
      fetchILDOT(bounds),
      fetchNJDOT(bounds),
      fetchPADOT(bounds),
      fetchMDDOT(bounds),
      fetchUKCameras(bounds),
      fetchNLCameras(bounds),
      fetchAUCameras(bounds),
      fetchWindyCameras(bounds),
    ]);

    const allCameras: CameraResult[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') allCameras.push(...r.value);
    }

    // Deduplicate by proximity (0.0005 degrees ≈ 50m)
    const deduped: CameraResult[] = [];
    for (const cam of allCameras) {
      const isDupe = deduped.some(
        d => Math.abs(d.lat - cam.lat) < 0.0005 && Math.abs(d.lng - cam.lng) < 0.0005
      );
      if (!isDupe) deduped.push(cam);
    }

    const final = deduped.slice(0, 800);
    cache.set(key, { data: final, time: Date.now() });

    console.log(`Returning ${final.length} cameras for bounds: ${JSON.stringify(bounds)}`);

    return new Response(
      JSON.stringify({ cameras: final }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Traffic cameras error:', err);
    return new Response(
      JSON.stringify({ cameras: [], error: String(err) }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});