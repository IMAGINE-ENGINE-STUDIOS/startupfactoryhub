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

function regionKey(b: Bounds): string {
  return `${Math.floor(b.south)}_${Math.floor(b.west)}_${Math.floor(b.north)}_${Math.floor(b.east)}`;
}

function inBounds(lat: number, lng: number, b: Bounds): boolean {
  return lat >= b.south && lat <= b.north && lng >= b.west && lng <= b.east && lat !== 0 && lng !== 0;
}

function boundsOverlap(b: Bounds, r: { south: number; north: number; west: number; east: number }): boolean {
  return !(b.south > r.north || b.north < r.south || b.west > r.east || b.east < r.west);
}

function validStreamUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (/\.(mjpg|mjpeg)(\?|$)/i.test(url) || /mjpeg|mjpg/i.test(url)) return url;
  return undefined;
}

// ====== GENERIC 511 v2 FETCHER ======
async function fetch511Cameras(
  stateCode: string,
  baseUrl: string,
  bounds: Bounds,
  region: { south: number; north: number; west: number; east: number },
  refreshRate = 10
): Promise<CameraResult[]> {
  if (!boundsOverlap(bounds, region)) return [];
  
  const urls = [
    `${baseUrl}/api/v2/get/cameras?key=public&format=json`,
    `${baseUrl}/api/getcameras?key=public&format=json`,
    `${baseUrl}/api/getcameras?format=json`,
  ];
  
  let data: any = null;
  for (const url of urls) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(5000) });
      if (!resp.ok) { await resp.text().catch(() => {}); continue; }
      const text = await resp.text();
      data = JSON.parse(text);
      if (Array.isArray(data) && data.length > 0) break;
      if (data?.CamerasList) { data = data.CamerasList; break; }
      data = null;
    } catch { continue; }
  }
  
  if (!data || !Array.isArray(data)) return [];
  
  return data
    .filter((c: any) => {
      const lat = parseFloat(c.Latitude || c.latitude || 0);
      const lng = parseFloat(c.Longitude || c.longitude || 0);
      return inBounds(lat, lng, bounds);
    })
    .map((c: any) => {
      const lat = parseFloat(c.Latitude || c.latitude);
      const lng = parseFloat(c.Longitude || c.longitude);
      const camId = c.Id || c.ID || c.id || Math.random().toString(36).slice(2);
      
      let imgUrl = '';
      let videoUrl = '';
      
      if (Array.isArray(c.Views) && c.Views.length > 0) {
        const view = c.Views.find((v: any) => v.Status === 'Enabled') || c.Views[0];
        imgUrl = view.Url || view.url || '';
        videoUrl = view.VideoUrl || view.videoUrl || '';
      }
      
      if (!imgUrl) imgUrl = c.Url || c.url || '';
      if (!videoUrl) videoUrl = c.VideoUrl || c.videoUrl || '';
      if (!imgUrl && videoUrl) imgUrl = videoUrl;
      
      return {
        id: `${stateCode.toLowerCase()}-${camId}`,
        name: c.Name || c.name || c.Location || c.location || c.RoadwayName || c.Description || `${stateCode} Camera`,
        lat, lng,
        imageUrl: imgUrl,
        source: `511${stateCode}`,
        refreshRate,
        streamUrl: validStreamUrl(videoUrl),
      };
    })
    .filter((c: CameraResult) => c.imageUrl);
}

// ====== GENERIC ArcGIS FeatureServer FETCHER ======
async function fetchArcGISCameras(
  stateCode: string,
  featureServerUrl: string,
  bounds: Bounds,
  region: { south: number; north: number; west: number; east: number },
  fieldMapping: {
    lat?: string; lng?: string; name?: string; imageUrl?: string; id?: string;
  },
  source: string,
  refreshRate = 10
): Promise<CameraResult[]> {
  if (!boundsOverlap(bounds, region)) return [];
  try {
    const url = `${featureServerUrl}/query?where=1%3D1&geometry=${bounds.west},${bounds.south},${bounds.east},${bounds.north}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&outFields=*&f=json&resultRecordCount=5000`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) { await resp.text().catch(() => {}); return []; }
    const data = await resp.json();
    const features = data?.features || [];
    if (!Array.isArray(features)) return [];
    
    return features
      .filter((f: any) => {
        const a = f.attributes || {};
        const lat = a[fieldMapping.lat || 'latitude'] || a.LATITUDE || a.Latitude || a.latitude || a.LAT || f.geometry?.y;
        const lng = a[fieldMapping.lng || 'longitude'] || a.LONGITUDE || a.Longitude || a.longitude || a.LON || a.LONG || f.geometry?.x;
        return lat && lng && inBounds(lat, lng, bounds);
      })
      .map((f: any) => {
        const a = f.attributes || {};
        const lat = a[fieldMapping.lat || 'latitude'] || a.LATITUDE || a.Latitude || a.latitude || a.LAT || f.geometry?.y;
        const lng = a[fieldMapping.lng || 'longitude'] || a.LONGITUDE || a.Longitude || a.longitude || a.LON || a.LONG || f.geometry?.x;
        const imgUrl = a[fieldMapping.imageUrl || 'imageUrl'] || a.ImageURL || a.imageUrl || a.IMAGE_URL || a.IMAGE || a.Image || a.Url || a.url || a.URL || a.currentImageURL || '';
        const camId = a[fieldMapping.id || 'OBJECTID'] || a.OBJECTID || a.Id || a.ID || a.id || Math.random().toString(36).slice(2);
        const name = a[fieldMapping.name || 'Name'] || a.Name || a.NAME || a.name || a.DESCRIPT || a.Description || a.locationName || a.Location || a.LOCATION || a.location || `${stateCode} Camera`;
        
        return { id: `${stateCode.toLowerCase()}-${camId}`, name, lat, lng, imageUrl: imgUrl, source, refreshRate };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ===========================
// STATE-SPECIFIC FETCHERS
// ===========================

// ====== CALIFORNIA (Caltrans ArcGIS) ======
async function fetchCaltransCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (!boundsOverlap(bounds, { south: 32, north: 42, west: -130, east: -114 })) return [];
  try {
    const url = `https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/CCTV/FeatureServer/0/query?where=1%3D1&geometry=${bounds.west},${bounds.south},${bounds.east},${bounds.north}&geometryType=esriGeometryEnvelope&spatialRel=esriSpatialRelIntersects&outFields=currentImageURL,streamingVideoURL,locationName,latitude,longitude,district,inService&f=json&resultRecordCount=5000`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) { await resp.text().catch(() => {}); return []; }
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
        return {
          id: `ca-${a.district || 'x'}-${(a.currentImageURL || '').split('/').pop() || Math.random().toString(36).slice(2)}`,
          name: a.locationName || `CA D${a.district} Camera`,
          lat: a.latitude || f.geometry?.y,
          lng: a.longitude || f.geometry?.x,
          imageUrl: a.currentImageURL || '',
          source: `Caltrans D${a.district || '?'}`,
          refreshRate: 5,
          streamUrl: validStreamUrl(a.streamingVideoURL),
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== FLORIDA (ArcGIS) ======
async function fetchFLDOT(bounds: Bounds): Promise<CameraResult[]> {
  return fetchArcGISCameras('FL', 
    'https://services.arcgis.com/3wFbqsFPLeKqOlIK/arcgis/rest/services/FL511_Traffic_Cameras/FeatureServer/0',
    bounds, { south: 24, north: 31.5, west: -88, east: -79.5 },
    { lat: 'LATITUDE', lng: 'LONGITUDE', name: 'DESCRIPT', imageUrl: 'IMAGE', id: 'OBJECTID_1' },
    'FL511', 10
  );
}

// ====== WASHINGTON STATE (WSDOT ArcGIS) ======
async function fetchWSDOT(bounds: Bounds): Promise<CameraResult[]> {
  return fetchArcGISCameras('WA',
    'https://data.wsdot.wa.gov/arcgis/rest/services/TravelInformation/TravelInfoCamerasWeather/FeatureServer/0',
    bounds, { south: 45, north: 49, west: -125, east: -116 },
    {},
    'WSDOT', 5
  );
}

// ====== TEXAS (TxDOT ArcGIS + Austin Socrata) ======
async function fetchTxDOTCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetchArcGISCameras('TX',
    'https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_CCTV_Cameras/FeatureServer/0',
    bounds, { south: 25.5, north: 36.5, west: -107, east: -93 },
    {},
    'TxDOT', 10
  );
}

async function fetchAustinCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (!boundsOverlap(bounds, { south: 29.5, north: 31, west: -98.5, east: -97 })) return [];
  try {
    const url = `https://data.austintexas.gov/resource/b4k4-adkb.json?$where=within_box(location,${bounds.south},${bounds.west},${bounds.north},${bounds.east})&$limit=50000&camera_status=TURNED_ON`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) { await resp.text().catch(() => {}); return []; }
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

// ====== MARYLAND (ArcGIS - verified endpoint) ======
async function fetchMDDOT(bounds: Bounds): Promise<CameraResult[]> {
  return fetchArcGISCameras('MD',
    'https://mdgeodata.md.gov/imap/rest/services/Transportation/MD_TrafficCameras/FeatureServer/0',
    bounds, { south: 37.5, north: 40, west: -79.5, east: -75 },
    { lat: 'lat', lng: 'long', name: 'location', imageUrl: 'url', id: 'OBJECTID' },
    'MDSHA', 10
  );
}

// ====== VIRGINIA (GeoJSON) ======
async function fetch511VA(bounds: Bounds): Promise<CameraResult[]> {
  if (!boundsOverlap(bounds, { south: 36, north: 40, west: -84, east: -75 })) return [];
  try {
    const resp = await fetch('https://www.511virginia.org/data/geojson/icons.cameras.geojson', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) { await resp.text().catch(() => {}); return []; }
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

// ====== GEORGIA (511 API) ======
async function fetch511GA(bounds: Bounds): Promise<CameraResult[]> {
  if (!boundsOverlap(bounds, { south: 30.5, north: 35.5, west: -86, east: -80.5 })) return [];
  try {
    const resp = await fetch('https://511ga.org/api/v2/get/cameras?key=public&format=json', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) { await resp.text().catch(() => {}); return []; }
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => inBounds(c.Latitude || c.latitude || 0, c.Longitude || c.longitude || 0, bounds))
      .map((c: any) => {
        const lat = c.Latitude || c.latitude;
        const lng = c.Longitude || c.longitude;
        let imgUrl = '';
        if (Array.isArray(c.Views) && c.Views.length > 0) {
          imgUrl = c.Views[0].Url || c.Views[0].url || '';
        }
        if (!imgUrl) imgUrl = c.Url || c.url || c.image_url || '';
        return {
          id: `ga-${c.Id || c.id || Math.random().toString(36).slice(2)}`,
          name: c.Name || c.name || c.Location || c.location || 'GA Camera',
          lat, lng, imageUrl: imgUrl,
          source: '511GA', refreshRate: 10,
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== TENNESSEE (SmartWay API) ======
async function fetchTNCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (!boundsOverlap(bounds, { south: 34.9, north: 36.7, west: -90.5, east: -81.5 })) return [];
  try {
    const resp = await fetch('https://smartway.tn.gov/traffic/api/Cameras', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) { await resp.text().catch(() => {}); return []; }
    const data = await resp.json();
    const cameras = Array.isArray(data) ? data : (data?.cameras || data?.features || []);
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => {
        const lat = c.latitude || c.lat || c.Latitude || 0;
        const lng = c.longitude || c.lng || c.Longitude || 0;
        return inBounds(lat, lng, bounds);
      })
      .map((c: any) => ({
        id: `tn-${c.id || c.cameraId || c.Id || Math.random().toString(36).slice(2)}`,
        name: c.description || c.name || c.title || c.Description || 'TN Camera',
        lat: c.latitude || c.lat || c.Latitude,
        lng: c.longitude || c.lng || c.Longitude,
        imageUrl: c.imageUrl || c.image || c.url || c.ImageUrl || '',
        source: 'TN SmartWay',
        refreshRate: 10,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== COLORADO (COTrip API) ======
async function fetchCDOT(bounds: Bounds): Promise<CameraResult[]> {
  if (!boundsOverlap(bounds, { south: 37, north: 41.5, west: -109.5, east: -102 })) return [];
  try {
    const resp = await fetch('https://www.cotrip.org/speed/getTrafficCameras.do', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) { await resp.text().catch(() => {}); return []; }
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

// ====== OREGON (TripCheck) ======
async function fetchODOT(bounds: Bounds): Promise<CameraResult[]> {
  if (!boundsOverlap(bounds, { south: 42, north: 46.5, west: -125, east: -116 })) return [];
  try {
    const resp = await fetch('https://tripcheck.com/Scripts/map/data/cameraData.js', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) { await resp.text().catch(() => {}); return []; }
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

// ====== ILLINOIS (IDOT ArcGIS) ======
async function fetchILDOT(bounds: Bounds): Promise<CameraResult[]> {
  return fetchArcGISCameras('IL',
    'https://gis-idot.opendata.arcgis.com/datasets/IDOT::illinois-gateway-traffic-cameras/FeatureServer/0',
    bounds, { south: 36.5, north: 43, west: -92, east: -87 },
    {},
    'IDOT', 10
  );
}

// ====== WASHINGTON DC (ArcGIS) ======
async function fetchDCCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetchArcGISCameras('DC',
    'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/98',
    bounds, { south: 38.7, north: 39.1, west: -77.2, east: -76.8 },
    {},
    'DC DDOT', 10
  );
}

// ====== NYC DOT / NYCTMC ======
async function fetchNYCDOTCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (!boundsOverlap(bounds, { south: 40.4, north: 41, west: -74.3, east: -73.6 })) return [];
  try {
    const resp = await fetch('https://webcams.nyctmc.org/api/cameras/', {
      signal: AbortSignal.timeout(8000),
      headers: { 'Accept': 'application/json' }
    });
    if (!resp.ok) { await resp.text().catch(() => {}); return []; }
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
        id: `nycdot-${c.id || c.cameraID || Math.random().toString(36).slice(2)}`,
        name: c.name || c.title || c.description || 'NYC Camera',
        lat: c.latitude || c.lat || c.location?.latitude,
        lng: c.longitude || c.lng || c.location?.longitude,
        imageUrl: c.imageUrl || c.image_url || c.url || c.stillImageUrl || '',
        source: 'NYCDOT',
        refreshRate: 2,
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== OHIO (OHGO public API) ======
async function fetchOHCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (!boundsOverlap(bounds, { south: 38.3, north: 42, west: -85, east: -80.4 })) return [];
  try {
    const resp = await fetch('https://publicapi.ohgo.com/api/v1/Cameras', {
      signal: AbortSignal.timeout(10000),
      headers: { 'Accept': 'application/json' }
    });
    if (!resp.ok) { await resp.text().catch(() => {}); return []; }
    const data = await resp.json();
    const cameras = data?.results || data;
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => {
        const lat = c.latitude || c.Latitude || 0;
        const lng = c.longitude || c.Longitude || 0;
        return inBounds(lat, lng, bounds);
      })
      .map((c: any) => {
        let imgUrl = c.smallImageUrl || c.largeImageUrl || c.imageUrl || '';
        if (!imgUrl && Array.isArray(c.links || c.Links)) {
          const imgLink = (c.links || c.Links).find((l: any) => l.rel === 'small' || l.rel === 'large' || l.rel === 'image');
          if (imgLink) imgUrl = imgLink.href || imgLink.Href || '';
        }
        return {
          id: `oh-${c.id || c.Id || Math.random().toString(36).slice(2)}`,
          name: c.description || c.Description || c.name || 'OH Camera',
          lat: c.latitude || c.Latitude,
          lng: c.longitude || c.Longitude,
          imageUrl: imgUrl,
          source: 'OHGO',
          refreshRate: 5,
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== NORTH CAROLINA (NCDOT TIMS ArcGIS) ======
async function fetchNCCameras(bounds: Bounds): Promise<CameraResult[]> {
  return fetchArcGISCameras('NC',
    'https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/NCDOT_TIMSCameras/FeatureServer/0',
    bounds, { south: 33.5, north: 36.6, west: -84.5, east: -75.3 },
    { name: 'LOCATION', imageUrl: 'URL' },
    'NCDOT', 10
  );
}

// ====== UK (Highways England) ======
async function fetchUKCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (!boundsOverlap(bounds, { south: 49, north: 61, west: -11, east: 2 })) return [];
  try {
    const resp = await fetch('https://data.highwaysengland.co.uk/ntis/NTIS/Camera/content.json', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) { await resp.text().catch(() => {}); return []; }
    const data = await resp.json();
    const cameras = data?.cameras || data?.features || (Array.isArray(data) ? data : []);
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
  if (!boundsOverlap(bounds, { south: 50.5, north: 54, west: 3, east: 7.5 })) return [];
  try {
    const resp = await fetch('https://opendata.ndw.nu/MSt_Camera.json', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) { await resp.text().catch(() => {}); return []; }
    const data = await resp.json();
    const features = data?.features || (Array.isArray(data) ? data : []);
    if (!Array.isArray(features)) return [];
    return features
      .filter((f: any) => {
        const coords = f.geometry?.coordinates || [];
        return coords.length >= 2 && inBounds(coords[1], coords[0], bounds);
      })
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

// ====== AUSTRALIA (NSW) ======
async function fetchAUCameras(bounds: Bounds): Promise<CameraResult[]> {
  if (!boundsOverlap(bounds, { south: -44, north: -10, west: 112, east: 155 })) return [];
  try {
    const resp = await fetch('https://www.livetraffic.com/traffic/cameras/geojson', { signal: AbortSignal.timeout(8000) });
    if (!resp.ok) { await resp.text().catch(() => {}); return []; }
    const data = await resp.json();
    const features = data?.features || [];
    return features
      .filter((f: any) => {
        const [lng, lat] = f.geometry?.coordinates || [0, 0];
        return inBounds(lat, lng, bounds);
      })
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

// ====== WINDY.COM WEBCAMS - WORLDWIDE ======
async function fetchWindyCameras(bounds: Bounds): Promise<CameraResult[]> {
  try {
    const centerLat = (bounds.north + bounds.south) / 2;
    const centerLng = (bounds.east + bounds.west) / 2;
    const radius = Math.min(250, Math.max(10, Math.round(
      Math.max(bounds.north - bounds.south, bounds.east - bounds.west) * 55
    )));
    const resp = await fetch(
      `https://api.windy.com/webcams/api/v3/webcams?lang=en&limit=500&offset=0&include=images,location&nearby=${centerLat},${centerLng},${radius}`,
      {
        headers: { 'x-windy-api-key': 'PGbLONaQtxGGGTZ0NXPEr4BbPtTOqo5f' },
        signal: AbortSignal.timeout(10000),
      }
    );
    if (!resp.ok) { await resp.text().catch(() => {}); return []; }
    const data = await resp.json();
    const webcams = data?.webcams || [];
    return webcams
      .filter((w: any) => {
        const lat = w.location?.latitude || w.position?.latitude || 0;
        const lng = w.location?.longitude || w.position?.longitude || 0;
        return inBounds(lat, lng, bounds);
      })
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
  } catch { return []; }
}

// ====== VERIFIED 511 PLATFORM STATES (confirmed working) ======
function fetchAKCameras(b: Bounds) { return fetch511Cameras('AK', 'https://511.alaska.gov', b, { south: 51, north: 72, west: -180, east: -129 }, 30); }
function fetchAZCameras(b: Bounds) { return fetch511Cameras('AZ', 'https://az511.gov', b, { south: 31.3, north: 37, west: -114.9, east: -109 }, 10); }
function fetchIACameras(b: Bounds) { return fetch511Cameras('IA', 'https://www.511ia.org', b, { south: 40.3, north: 43.6, west: -96.7, east: -90 }, 10); }
function fetchIDCameras(b: Bounds) { return fetch511Cameras('ID', 'https://511.idaho.gov', b, { south: 41.9, north: 49.1, west: -117.3, east: -111 }, 10); }
function fetchKYCameras(b: Bounds) { return fetch511Cameras('KY', 'https://511.ky.gov', b, { south: 36.4, north: 39.2, west: -89.6, east: -81.9 }, 10); }
function fetchLACameras(b: Bounds) { return fetch511Cameras('LA', 'https://www.511la.org', b, { south: 28.9, north: 33.1, west: -94.1, east: -88.7 }, 10); }
function fetchNECameras(b: Bounds) { return fetch511Cameras('NE', 'https://511.nebraska.gov', b, { south: 39.9, north: 43.1, west: -104.1, east: -95.3 }, 10); }
function fetchNJCameras(b: Bounds) { return fetch511Cameras('NJ', 'https://511nj.org', b, { south: 38.8, north: 41.5, west: -75.6, east: -73.8 }, 5); }
function fetchNVCameras(b: Bounds) { return fetch511Cameras('NV', 'https://www.nvroads.com', b, { south: 35, north: 42, west: -120, east: -114 }, 10); }
function fetchNYCameras(b: Bounds) { return fetch511Cameras('NY', 'https://511ny.org', b, { south: 40, north: 45.5, west: -80, east: -71 }, 3); }
function fetchPACameras(b: Bounds) { return fetch511Cameras('PA', 'https://511pa.com', b, { south: 39.5, north: 42.5, west: -80.6, east: -74.5 }, 5); }
function fetchSCCameras(b: Bounds) { return fetch511Cameras('SC', 'https://www.511sc.org', b, { south: 32, north: 35.3, west: -83.5, east: -78.4 }, 10); }
function fetchUTCameras(b: Bounds) { return fetch511Cameras('UT', 'https://www.udottraffic.utah.gov', b, { south: 36.9, north: 42.1, west: -114.1, east: -108.9 }, 10); }
function fetchWICameras(b: Bounds) { return fetch511Cameras('WI', 'https://511wi.gov', b, { south: 42.4, north: 47.1, west: -93, east: -86.7 }, 10); }
function fetchMACameras(b: Bounds) { return fetch511Cameras('MA', 'https://mass511.com', b, { south: 41, north: 42.9, west: -73.6, east: -69.8 }, 10); }
function fetchCTCameras(b: Bounds) { return fetch511Cameras('CT', 'https://www.511ct.org', b, { south: 40.9, north: 42.1, west: -73.8, east: -71.7 }, 10); }
function fetchMNCameras(b: Bounds) { return fetch511Cameras('MN', 'https://511mn.org', b, { south: 43.4, north: 49.4, west: -97.3, east: -89.4 }, 10); }
function fetchMTCameras(b: Bounds) { return fetch511Cameras('MT', 'https://www.511mt.net', b, { south: 44.3, north: 49.1, west: -116.1, east: -104 }, 15); }
function fetchWYCameras(b: Bounds) { return fetch511Cameras('WY', 'https://www.wyoroad.info', b, { south: 40.9, north: 45.1, west: -111.1, east: -104 }, 15); }
function fetchSDCameras(b: Bounds) { return fetch511Cameras('SD', 'https://sd511.org', b, { south: 42.4, north: 46, west: -104.1, east: -96.4 }, 15); }
function fetchNDCameras(b: Bounds) { return fetch511Cameras('ND', 'https://travel.dot.nd.gov', b, { south: 45.9, north: 49.1, west: -104.1, east: -96.5 }, 15); }
function fetchWVCameras(b: Bounds) { return fetch511Cameras('WV', 'https://wv511.org', b, { south: 37.1, north: 40.7, west: -82.7, east: -77.7 }, 10); }
function fetchNMCameras(b: Bounds) { return fetch511Cameras('NM', 'https://nmroads.com', b, { south: 31.3, north: 37.1, west: -109.1, east: -103 }, 10); }

// NOTE: Removed broken fetchers for MI, IN, AL, OK, KS, AR, MS, DE, RI, HI, MO, NH, VT, ME
// These used wrong URLs that silently fail. Windy webcams provides coverage for these states.

// ====== NAMED SOURCE TRACKING ======
interface NamedFetcher {
  name: string;
  fn: (b: Bounds) => Promise<CameraResult[]>;
}

const allFetchers: NamedFetcher[] = [
  // Northeast
  { name: 'NY-511', fn: fetchNYCameras },
  { name: 'NYC-DOT', fn: fetchNYCDOTCameras },
  { name: 'NJ-511', fn: fetchNJCameras },
  { name: 'PA-511', fn: fetchPACameras },
  { name: 'MA-511', fn: fetchMACameras },
  { name: 'CT-511', fn: fetchCTCameras },
  // Mid-Atlantic
  { name: 'MD-ArcGIS', fn: fetchMDDOT },
  { name: 'VA-GeoJSON', fn: fetch511VA },
  { name: 'DC-ArcGIS', fn: fetchDCCameras },
  { name: 'WV-511', fn: fetchWVCameras },
  // Southeast
  { name: 'NC-ArcGIS', fn: fetchNCCameras },
  { name: 'SC-511', fn: fetchSCCameras },
  { name: 'GA-511', fn: fetch511GA },
  { name: 'FL-ArcGIS', fn: fetchFLDOT },
  { name: 'TN-SmartWay', fn: fetchTNCameras },
  { name: 'KY-511', fn: fetchKYCameras },
  { name: 'LA-511', fn: fetchLACameras },
  // Texas
  { name: 'TX-ArcGIS', fn: fetchTxDOTCameras },
  { name: 'TX-Austin', fn: fetchAustinCameras },
  // West Coast
  { name: 'CA-Caltrans', fn: fetchCaltransCameras },
  { name: 'WA-ArcGIS', fn: fetchWSDOT },
  { name: 'OR-TripCheck', fn: fetchODOT },
  // Mountain/Southwest
  { name: 'CO-COTrip', fn: fetchCDOT },
  { name: 'AZ-511', fn: fetchAZCameras },
  { name: 'NV-511', fn: fetchNVCameras },
  { name: 'UT-511', fn: fetchUTCameras },
  { name: 'NM-511', fn: fetchNMCameras },
  { name: 'ID-511', fn: fetchIDCameras },
  { name: 'MT-511', fn: fetchMTCameras },
  { name: 'WY-511', fn: fetchWYCameras },
  // Midwest
  { name: 'IL-ArcGIS', fn: fetchILDOT },
  { name: 'OH-OHGO', fn: fetchOHCameras },
  { name: 'MN-511', fn: fetchMNCameras },
  { name: 'WI-511', fn: fetchWICameras },
  { name: 'IA-511', fn: fetchIACameras },
  { name: 'NE-511', fn: fetchNECameras },
  { name: 'ND-511', fn: fetchNDCameras },
  { name: 'SD-511', fn: fetchSDCameras },
  // Non-contiguous
  { name: 'AK-511', fn: fetchAKCameras },
  // International
  { name: 'UK-Highways', fn: fetchUKCameras },
  { name: 'NL-NDW', fn: fetchNLCameras },
  { name: 'AU-NSW', fn: fetchAUCameras },
  // Worldwide
  { name: 'Windy', fn: fetchWindyCameras },
];

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

    // Fetch from ALL sources concurrently with per-source logging
    const results = await Promise.allSettled(
      allFetchers.map(async (f) => {
        try {
          const cams = await f.fn(bounds);
          if (cams.length > 0) {
            console.log(`[${f.name}] ${cams.length} cameras`);
          }
          return { name: f.name, cameras: cams };
        } catch (err) {
          console.warn(`[${f.name}] ERROR: ${err}`);
          return { name: f.name, cameras: [] as CameraResult[] };
        }
      })
    );

    const allCameras: CameraResult[] = [];
    for (const r of results) {
      if (r.status === 'fulfilled') allCameras.push(...r.value.cameras);
    }

    // Deduplicate by proximity (0.0005 degrees ≈ 50m)
    const deduped: CameraResult[] = [];
    for (const cam of allCameras) {
      const isDupe = deduped.some(
        d => Math.abs(d.lat - cam.lat) < 0.0005 && Math.abs(d.lng - cam.lng) < 0.0005
      );
      if (!isDupe) deduped.push(cam);
    }

    cache.set(key, { data: deduped, time: Date.now() });

    console.log(`Total: ${deduped.length} cameras for bounds [${bounds.south.toFixed(1)},${bounds.west.toFixed(1)} → ${bounds.north.toFixed(1)},${bounds.east.toFixed(1)}]`);

    return new Response(
      JSON.stringify({ cameras: deduped }),
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
