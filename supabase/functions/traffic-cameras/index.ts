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

// Helper: only mark as streamUrl if it's a confirmed MJPEG endpoint (plays natively in <img>)
function validStreamUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (/\.(mjpg|mjpeg)(\?|$)/i.test(url) || /mjpeg|mjpg/i.test(url)) return url;
  // HLS (.m3u8) and MP4 won't play in <img> tags without extra libraries - skip
  return undefined;
}

// ====== GENERIC 511 FETCHER ======
// Many US states use the same 511 platform with /api/getcameras?format=json&key=public

async function fetch511Cameras(
  stateCode: string,
  baseUrl: string,
  bounds: Bounds,
  boundsCheck: { south: number; north: number; west: number; east: number },
  refreshRate = 5
): Promise<CameraResult[]> {
  if (bounds.south > boundsCheck.north || bounds.north < boundsCheck.south ||
      bounds.west > boundsCheck.east || bounds.east < boundsCheck.west) return [];
  try {
    const resp = await fetch(`${baseUrl}/api/getcameras?format=json&key=public`, { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => {
        const lat = parseFloat(c.Latitude || c.latitude || 0);
        const lng = parseFloat(c.Longitude || c.longitude || 0);
        return inBounds(lat, lng, bounds);
      })
      .map((c: any) => {
        const rawUrl = c.Url || c.url || '';
        const videoUrl = c.VideoUrl || c.videoUrl || '';
        // Only use URL if it looks like a direct image, otherwise use VideoUrl snapshot
        let imgUrl = '';
        if (rawUrl.match(/\.(jpg|jpeg|png|gif|bmp)(\?|$)/i)) {
          imgUrl = rawUrl;
        } else if (videoUrl.match(/\.(jpg|jpeg|png|gif|bmp)(\?|$)/i)) {
          imgUrl = videoUrl;
        } else {
          // Many 511 systems serve the image at the Url endpoint even without extension
          imgUrl = rawUrl || videoUrl;
        }
        return {
          id: `${stateCode.toLowerCase()}-${c.ID || c.id || Math.random().toString(36).slice(2)}`,
          name: c.Name || c.name || c.RoadwayName || c.Description || `${stateCode} Camera`,
          lat: parseFloat(c.Latitude || c.latitude),
          lng: parseFloat(c.Longitude || c.longitude),
          imageUrl: imgUrl,
          source: `511${stateCode}`,
          refreshRate,
          streamUrl: validStreamUrl(videoUrl),
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== NYC / NEW YORK ======

async function fetchNYCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('NY', 'https://511ny.org', bounds, { south: 40, north: 45.5, west: -80, east: -71 }, 3);
}

// NYC DOT / NYCTMC cameras
async function fetchNYCDOTCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 41 || bounds.north < 40.4 || bounds.west > -73.6 || bounds.east < -74.3) return [];
  try {
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
      .map((c: any) => ({
        id: `nycdot-${c.id || c.cameraID || c.camera_id || Math.random().toString(36).slice(2)}`,
        name: c.name || c.title || c.description || 'NYC Camera',
        lat: c.latitude || c.lat || c.location?.latitude,
        lng: c.longitude || c.lng || c.location?.longitude,
        imageUrl: c.imageUrl || c.image_url || c.url || c.stillImageUrl || c.snapshotUrl || '',
        source: 'NYCDOT',
        refreshRate: 2,
        // Don't set streamUrl - NYCDOT API structure unconfirmed
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== CALIFORNIA (Caltrans ArcGIS FeatureServer) ======

async function fetchCaltransCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.east < -130 || bounds.west > -114 || bounds.south > 42 || bounds.north < 32) return [];
  try {
    const url = `https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/CCTV/FeatureServer/0/query?where=1%3D1&geometry=${bounds.west},${bounds.south},${bounds.east},${bounds.north}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&outFields=currentImageURL,streamingVideoURL,locationName,latitude,longitude,district,inService&f=json&resultRecordCount=5000`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const features = data?.features || [];
    if (!Array.isArray(features)) return [];
    return features
      .filter((f: any) => {
        const a = f.attributes || {};
        const lat = a.latitude || f.geometry?.y;
        const lng = a.longitude || f.geometry?.x;
        return lat && lng && inBounds(lat, lng, bounds) && a.inService !== 'FALSE';
      })
      .map((f: any) => {
        const a = f.attributes;
        const imgUrl = a.currentImageURL || '';
        const streamRaw = a.streamingVideoURL || '';
        return {
          id: `ca-${a.district || 'x'}-${imgUrl.split('/').pop() || Math.random().toString(36).slice(2)}`,
          name: a.locationName || `CA D${a.district} Camera`,
          lat: a.latitude || f.geometry?.y,
          lng: a.longitude || f.geometry?.x,
          imageUrl: imgUrl,
          source: `Caltrans D${a.district || '?'}`,
          refreshRate: 5,
          // Only MJPEG streams work natively; HLS .m3u8 needs hls.js
          streamUrl: validStreamUrl(streamRaw),
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch (e) {
    console.error('Caltrans cameras error:', e);
    return [];
  }
}

// ====== WASHINGTON STATE ======

async function fetchWSDOT(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 49 || bounds.north < 45 || bounds.west > -116 || bounds.east < -125) return [];
  try {
    const resp = await fetch('https://data.wsdot.wa.gov/log/Public/cameras.json', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => inBounds(c.CameraLocation?.Latitude || 0, c.CameraLocation?.Longitude || 0, bounds))
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
    const url = `https://services.arcgis.com/3wFbqsFPLeKqOlIK/arcgis/rest/services/FL511_Traffic_Cameras/FeatureServer/0/query?where=1%3D1&geometry=${bounds.west},${bounds.south},${bounds.east},${bounds.north}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&outFields=*&f=json&resultRecordCount=5000`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const features = data?.features || [];
    if (!Array.isArray(features)) return [];
    return features
      .filter((f: any) => {
        const a = f.attributes || {};
        const lat = a.LATITUDE || a.latitude || f.geometry?.y;
        const lng = a.LONGITUDE || a.longitude || f.geometry?.x;
        return lat && lng && inBounds(lat, lng, bounds);
      })
      .map((f: any) => {
        const a = f.attributes;
        const cameraId = a.ID || a.OBJECTID;
        const imgUrl = cameraId ? `https://fl511.com/map/Cctv/${cameraId}` : '';
        return {
          id: `fl-${cameraId || Math.random().toString(36).slice(2)}`,
          name: a.DESCRIPT || a.Description || (a.COUNTY && a.HIGHWAY ? `${a.COUNTY} - ${a.HIGHWAY}` : 'FL Camera'),
          lat: a.LATITUDE || a.latitude || f.geometry?.y,
          lng: a.LONGITUDE || a.longitude || f.geometry?.x,
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

async function fetchAustinCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 31 || bounds.north < 29.5 || bounds.west > -97 || bounds.east < -98.5) return [];
  try {
    const url = `https://data.austintexas.gov/resource/b4k4-adkb.json?$where=within_box(location,${bounds.south},${bounds.west},${bounds.north},${bounds.east})&$limit=50000&camera_status=TURNED_ON`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => {
        const lat = parseFloat(c.location?.latitude || c.location_latitude || 0);
        const lng = parseFloat(c.location?.longitude || c.location_longitude || 0);
        return lat && lng && inBounds(lat, lng, bounds);
      })
      .map((c: any) => {
        const camId = c.camera_id || c.atd_device_id || '';
        return {
          id: `tx-atx-${camId || Math.random().toString(36).slice(2)}`,
          name: c.location_name || c.camera_name || 'Austin Camera',
          lat: parseFloat(c.location?.latitude || c.location_latitude),
          lng: parseFloat(c.location?.longitude || c.location_longitude),
          imageUrl: camId ? `https://cctv.austinmobility.io/image/${camId}.jpg` : '',
          source: 'Austin TX',
          refreshRate: 5,
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

async function fetchHoustonCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 30.5 || bounds.north < 29 || bounds.west > -94.5 || bounds.east < -96.5) return [];
  try {
    const resp = await fetch('https://traffic.houstontranstar.org/layers/layers_cctv.json', { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = data?.features || data?.cctv || data;
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => {
        const lat = c.geometry?.coordinates?.[1] || c.latitude || c.lat || 0;
        const lng = c.geometry?.coordinates?.[0] || c.longitude || c.lng || 0;
        return inBounds(lat, lng, bounds);
      })
      .map((c: any) => {
        const props = c.properties || c;
        const lat = c.geometry?.coordinates?.[1] || c.latitude || c.lat;
        const lng = c.geometry?.coordinates?.[0] || c.longitude || c.lng;
        const camId = props.id || props.cctv_id || props.OBJECTID || Math.random().toString(36).slice(2);
        const imgUrl = props.imageUrl || props.image_url || props.url ||
          (props.filename ? `https://traffic.houstontranstar.org/cctv/images/${props.filename}` : '');
        return {
          id: `tx-hou-${camId}`,
          name: props.name || props.title || props.description || 'Houston Camera',
          lat, lng, imageUrl: imgUrl,
          source: 'Houston TranStar',
          refreshRate: 10,
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

async function fetchTxDOTCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 36.5 || bounds.north < 25.5 || bounds.west > -93 || bounds.east < -107) return [];
  try {
    const url = `https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_CCTV_Cameras/FeatureServer/0/query?where=1%3D1&geometry=${bounds.west},${bounds.south},${bounds.east},${bounds.north}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&outFields=*&f=json&resultRecordCount=5000`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(12000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const features = data?.features || [];
    if (!Array.isArray(features)) return [];
    return features
      .filter((f: any) => {
        const lat = f.attributes?.Latitude || f.attributes?.latitude || f.geometry?.y || 0;
        const lng = f.attributes?.Longitude || f.attributes?.longitude || f.geometry?.x || 0;
        return inBounds(lat, lng, bounds);
      })
      .map((f: any) => {
        const a = f.attributes || {};
        return {
          id: `tx-dot-${a.OBJECTID || a.Id || Math.random().toString(36).slice(2)}`,
          name: a.Name || a.name || a.Description || a.Location || 'TX Camera',
          lat: a.Latitude || a.latitude || f.geometry?.y,
          lng: a.Longitude || a.longitude || f.geometry?.x,
          imageUrl: a.ImageURL || a.imageUrl || a.image_url || a.Url || a.url || '',
          source: 'TxDOT',
          refreshRate: 10,
        };
      })
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

// ====== 511 STATES (using generic fetcher) ======

async function fetchNJCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('NJ', 'https://511nj.org', bounds, { south: 38.8, north: 41.5, west: -75.6, east: -73.8 }, 5);
}

async function fetchPACameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('PA', 'https://511pa.com', bounds, { south: 39.5, north: 42.5, west: -80.6, east: -74.5 }, 5);
}

async function fetchNCCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('NC', 'https://www.ncdot.gov/travel-maps', bounds, { south: 33.5, north: 36.6, west: -84.5, east: -75.3 }, 10);
}

async function fetchSCCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('SC', 'https://www.511sc.org', bounds, { south: 32, north: 35.3, west: -83.5, east: -78.4 }, 10);
}

async function fetchLACameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('LA', 'https://www.511la.org', bounds, { south: 28.9, north: 33.1, west: -94.1, east: -88.7 }, 10);
}

async function fetchOHCameras(bounds: Bounds): Promise<CameraResult[]> {
  // Ohio uses OHGO API
  if (bounds.south > 42 || bounds.north < 38.3 || bounds.west > -80.4 || bounds.east < -85) return [];
  try {
    const resp = await fetch('https://publicapi.ohgo.com/api/v1/Cameras', {
      signal: AbortSignal.timeout(10000),
      headers: { 'Accept': 'application/json' }
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = data?.results || data;
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => {
        const lat = c.latitude || c.cameraLocation?.latitude || 0;
        const lng = c.longitude || c.cameraLocation?.longitude || 0;
        return inBounds(lat, lng, bounds);
      })
      .map((c: any) => ({
        id: `oh-${c.id || c.cameraId || Math.random().toString(36).slice(2)}`,
        name: c.description || c.name || c.location || 'OH Camera',
        lat: c.latitude || c.cameraLocation?.latitude,
        lng: c.longitude || c.cameraLocation?.longitude,
        imageUrl: c.smallImageUrl || c.largeImageUrl || c.imageUrl || '',
        source: 'OHGO',
        refreshRate: 5,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

async function fetchMNCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('MN', 'https://511mn.org', bounds, { south: 43.4, north: 49.4, west: -97.3, east: -89.4 }, 10);
}

async function fetchWICameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('WI', 'https://511wi.gov', bounds, { south: 42.4, north: 47.1, west: -93, east: -86.7 }, 10);
}

async function fetchKYCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('KY', 'https://511.ky.gov', bounds, { south: 36.4, north: 39.2, west: -89.6, east: -81.9 }, 10);
}

async function fetchAZCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('AZ', 'https://az511.gov', bounds, { south: 31.3, north: 37, west: -114.9, east: -109 }, 10);
}

async function fetchNVCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('NV', 'https://nvroads.com', bounds, { south: 35, north: 42, west: -120, east: -114 }, 10);
}

async function fetchIACameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('IA', 'https://www.511ia.org', bounds, { south: 40.3, north: 43.6, west: -96.7, east: -90 }, 10);
}

async function fetchNECameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('NE', 'https://511.nebraska.gov', bounds, { south: 39.9, north: 43.1, west: -104.1, east: -95.3 }, 10);
}

async function fetchMOCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('MO', 'https://www.modot.org', bounds, { south: 35.9, north: 40.7, west: -95.8, east: -89 }, 10);
}

async function fetchINDOTCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('IN', 'https://indot.carsprogram.org', bounds, { south: 37.7, north: 41.8, west: -88.1, east: -84.7 }, 10);
}

async function fetchTNCameras(bounds: Bounds): Promise<CameraResult[]> {
  // Tennessee SmartWay
  if (bounds.south > 36.7 || bounds.north < 34.9 || bounds.west > -81.5 || bounds.east < -90.5) return [];
  try {
    const resp = await fetch('https://smartway.tn.gov/traffic/api/Cameras', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = Array.isArray(data) ? data : (data?.cameras || data?.features || []);
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => {
        const lat = c.latitude || c.lat || 0;
        const lng = c.longitude || c.lng || 0;
        return inBounds(lat, lng, bounds);
      })
      .map((c: any) => ({
        id: `tn-${c.id || c.cameraId || Math.random().toString(36).slice(2)}`,
        name: c.description || c.name || c.title || 'TN Camera',
        lat: c.latitude || c.lat,
        lng: c.longitude || c.lng,
        imageUrl: c.imageUrl || c.image || c.url || '',
        source: 'TN SmartWay',
        refreshRate: 10,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== WASHINGTON DC ======

async function fetchDCCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 39.1 || bounds.north < 38.7 || bounds.west > -76.8 || bounds.east < -77.2) return [];
  try {
    const url = `https://opendata.dc.gov/api/3/action/datastore_search?resource_id=traffic-cameras&limit=50000`;
    const resp = await fetch('https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/98/query?where=1%3D1&outFields=*&f=json&resultRecordCount=5000', { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const features = data?.features || [];
    if (!Array.isArray(features)) return [];
    return features
      .filter((f: any) => {
        const lat = f.attributes?.LATITUDE || f.geometry?.y || 0;
        const lng = f.attributes?.LONGITUDE || f.geometry?.x || 0;
        return inBounds(lat, lng, bounds);
      })
      .map((f: any) => {
        const a = f.attributes || {};
        return {
          id: `dc-${a.OBJECTID || Math.random().toString(36).slice(2)}`,
          name: a.DESCRIPTION || a.NAME || a.LOCATION || 'DC Camera',
          lat: a.LATITUDE || f.geometry?.y,
          lng: a.LONGITUDE || f.geometry?.x,
          imageUrl: a.IMAGEURL || a.IMAGE_URL || a.URL || '',
          source: 'DC DDOT',
          refreshRate: 10,
        };
      })
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
      .map((c: any) => ({
        id: `md-${c.id || c.cameraId || Math.random().toString(36).slice(2)}`,
        name: c.description || c.name || c.title || 'MD Camera',
        lat: parseFloat(c.lat || c.latitude),
        lng: parseFloat(c.lon || c.lng || c.longitude),
        imageUrl: c.imageUrl || c.url || c.image || '',
        source: 'MDSHA',
        refreshRate: 10,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== ALABAMA ======

async function fetchALCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('AL', 'https://www.algotraffic.com', bounds, { south: 30, north: 35.1, west: -88.5, east: -84.8 }, 10);
}

// ====== MASSACHUSETTS ======

async function fetchMACameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('MA', 'https://mass511.com', bounds, { south: 41, north: 42.9, west: -73.6, east: -69.8 }, 10);
}

// ====== CONNECTICUT ======

async function fetchCTCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('CT', 'https://www.ct.gov/dot/511', bounds, { south: 40.9, north: 42.1, west: -73.8, east: -71.7 }, 10);
}

// ====== UTAH ======

async function fetchUTCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (bounds.south > 42.1 || bounds.north < 36.9 || bounds.west > -108.9 || bounds.east < -114.1) return [];
  try {
    const resp = await fetch('https://udottraffic.utah.gov/api/v2/get/cameras', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => inBounds(c.latitude || 0, c.longitude || 0, bounds))
      .map((c: any) => ({
        id: `ut-${c.id || Math.random().toString(36).slice(2)}`,
        name: c.name || c.description || 'UT Camera',
        lat: c.latitude,
        lng: c.longitude,
        imageUrl: c.imageUrl || c.image_url || c.url || '',
        source: 'UDOT',
        refreshRate: 10,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== MICHIGAN ======

async function fetchMICameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetch511Cameras('MI', 'https://mdotjboss.state.mi.us', bounds, { south: 41.6, north: 48.3, west: -90.5, east: -82.1 }, 10);
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

// ====== WINDY.COM WEBCAMS - WORLDWIDE FALLBACK (street + city cameras) ======

async function fetchWindyCameras(bounds: Bounds): Promise<CameraResult[]> {
  try {
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;
    const radius = Math.min(250, Math.max(10, Math.round(
      Math.max(bounds.north - bounds.south, bounds.east - bounds.west) * 55
    )));

    const resp = await fetch(
      `https://api.windy.com/webcams/api/v3/webcams?lang=en&limit=300&offset=0&include=images,location&nearby=${centerLat},${centerLng},${radius}`,
      {
        headers: { 'x-windy-api-key': 'PGbLONaQtxGGGTZ0NXPEr4BbPtTOqo5f' },
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
      .slice(0, 300)
      .map((w: any) => ({
        id: `windy-${w.webcamId || w.id}`,
        name: w.title || 'Webcam',
        lat: w.location?.latitude || w.position?.latitude,
        lng: w.location?.longitude || w.position?.longitude,
        imageUrl: w.images?.current?.preview || w.image?.current?.preview || w.images?.daylight?.preview || `https://images-webcams.windy.com/webcams/${w.webcamId || w.id}/current/preview/${w.webcamId || w.id}.jpg`,
        source: 'Windy',
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
      // Northeast
      fetchNYCameras(bounds),
      fetchNYCDOTCameras(bounds),
      fetchNJCameras(bounds),
      fetchPACameras(bounds),
      fetchMACameras(bounds),
      fetchCTCameras(bounds),
      // Mid-Atlantic
      fetchMDDOT(bounds),
      fetch511VA(bounds),
      fetchDCCameras(bounds),
      // Southeast
      fetchNCCameras(bounds),
      fetchSCCameras(bounds),
      fetch511GA(bounds),
      fetchFLDOT(bounds),
      fetchALCameras(bounds),
      fetchTNCameras(bounds),
      fetchKYCameras(bounds),
      fetchLACameras(bounds),
      // Texas
      fetchAustinCameras(bounds),
      fetchHoustonCameras(bounds),
      fetchTxDOTCameras(bounds),
      // West Coast
      fetchCaltransCameras(bounds),
      fetchWSDOT(bounds),
      fetchODOT(bounds),
      // Mountain/Southwest
      fetchCDOT(bounds),
      fetchAZCameras(bounds),
      fetchNVCameras(bounds),
      fetchUTCameras(bounds),
      // Midwest
      fetchILDOT(bounds),
      fetchOHCameras(bounds),
      fetchMICameras(bounds),
      fetchINDOTCameras(bounds),
      fetchMNCameras(bounds),
      fetchWICameras(bounds),
      fetchIACameras(bounds),
      fetchNECameras(bounds),
      fetchMOCameras(bounds),
      // International
      fetchUKCameras(bounds),
      fetchNLCameras(bounds),
      fetchAUCameras(bounds),
      // Worldwide fallback (street + city cameras)
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

    const final = deduped.slice(0, 1500);
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
