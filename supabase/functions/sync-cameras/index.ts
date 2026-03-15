import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface CameraResult {
  id: string;
  name: string;
  lat: number;
  lng: number;
  imageUrl: string;
  source: string;
  streamUrl?: string;
  refreshRate?: number;
  region?: string;
  country?: string;
}

function validStreamUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (/\.(mjpg|mjpeg|m3u8|mp4)(\?|$)/i.test(url)) return url;
  if (/mjpeg|mjpg|stream|video|hls|playlist/i.test(url)) return url;
  return undefined;
}

// ====== GENERIC 511 v2 FETCHER ======
async function fetch511Cameras(stateCode: string, baseUrl: string, refreshRate = 10): Promise<CameraResult[]> {
  const urls = [
    `${baseUrl}/api/v2/get/cameras?key=public&format=json`,
    `${baseUrl}/api/getcameras?key=public&format=json`,
    `${baseUrl}/api/getcameras?format=json`,
  ];
  let data: any = null;
  for (const url of urls) {
    try {
      const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
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
      return lat !== 0 && lng !== 0;
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
        videoUrl = view.VideoUrl || view.videoUrl || view.StreamUrl || view.streamUrl || '';
      }
      if (!imgUrl) imgUrl = c.Url || c.url || '';
      if (!videoUrl) videoUrl = c.VideoUrl || c.videoUrl || c.StreamUrl || c.streamUrl || c.HlsUrl || c.hlsUrl || '';
      if (!imgUrl && videoUrl) imgUrl = videoUrl;
      const streamEndpoint = videoUrl || c.liveStreamUrl || c.LiveStreamUrl || '';
      return {
        id: `${stateCode.toLowerCase()}-${camId}`,
        name: c.Name || c.name || c.Location || c.location || c.RoadwayName || c.Description || `${stateCode} Camera`,
        lat, lng, imageUrl: imgUrl,
        source: `511${stateCode}`, refreshRate,
        streamUrl: validStreamUrl(streamEndpoint) || validStreamUrl(videoUrl),
        region: stateCode, country: 'US',
      };
    })
    .filter((c: CameraResult) => c.imageUrl);
}

// ====== GENERIC ArcGIS FeatureServer FETCHER ======
async function fetchArcGISCameras(
  stateCode: string, featureServerUrl: string,
  fieldMapping: { lat?: string; lng?: string; name?: string; imageUrl?: string; id?: string; streamUrl?: string },
  source: string, refreshRate = 10, country = 'US'
): Promise<CameraResult[]> {
  try {
    const allFeatures: any[] = [];
    let offset = 0;
    const PAGE_SIZE = 2000;
    let hasMore = true;
    while (hasMore) {
      const url = `${featureServerUrl}/query?where=1%3D1&outFields=*&f=json&resultRecordCount=${PAGE_SIZE}&resultOffset=${offset}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!resp.ok) break;
      const data = await resp.json();
      const features = data?.features || [];
      if (!Array.isArray(features) || features.length === 0) break;
      allFeatures.push(...features);
      hasMore = data.exceededTransferLimit === true;
      offset += PAGE_SIZE;
      if (offset > 50000) break;
    }
    return allFeatures
      .filter((f: any) => {
        const a = f.attributes || {};
        const lat = a[fieldMapping.lat || 'latitude'] || a.LATITUDE || a.Latitude || a.latitude || a.LAT || f.geometry?.y;
        const lng = a[fieldMapping.lng || 'longitude'] || a.LONGITUDE || a.Longitude || a.longitude || a.LON || a.LONG || f.geometry?.x;
        return lat && lng && lat !== 0 && lng !== 0;
      })
      .map((f: any) => {
        const a = f.attributes || {};
        const lat = a[fieldMapping.lat || 'latitude'] || a.LATITUDE || a.Latitude || a.latitude || a.LAT || f.geometry?.y;
        const lng = a[fieldMapping.lng || 'longitude'] || a.LONGITUDE || a.Longitude || a.longitude || a.LON || a.LONG || f.geometry?.x;
        const imgUrl = a[fieldMapping.imageUrl || 'imageUrl'] || a.ImageURL || a.imageUrl || a.IMAGE_URL || a.IMAGE || a.Image || a.Url || a.url || a.URL || a.currentImageURL || '';
        const camId = a[fieldMapping.id || 'OBJECTID'] || a.OBJECTID || a.Id || a.ID || a.id || Math.random().toString(36).slice(2);
        const name = a[fieldMapping.name || 'Name'] || a.Name || a.NAME || a.name || a.DESCRIPT || a.Description || a.locationName || a.Location || a.LOCATION || `${stateCode} Camera`;
        const streamField = fieldMapping.streamUrl ? a[fieldMapping.streamUrl] : (a.streamingVideoURL || a.StreamingVideoURL || a.VideoUrl || a.videoUrl || a.HlsUrl || '');
        return {
          id: `${stateCode.toLowerCase()}-${camId}`, name, lat, lng, imageUrl: imgUrl, source, refreshRate,
          streamUrl: validStreamUrl(streamField), region: stateCode, country,
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== CALIFORNIA ======
async function fetchCaltransCameras(): Promise<CameraResult[]> {
  try {
    const allFeatures: any[] = [];
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const url = `https://caltrans-gis.dot.ca.gov/arcgis/rest/services/CHhighway/CCTV/FeatureServer/0/query?where=1%3D1&outFields=currentImageURL,streamingVideoURL,locationName,latitude,longitude,district,inService&f=json&resultRecordCount=2000&resultOffset=${offset}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!resp.ok) break;
      const data = await resp.json();
      const features = data?.features || [];
      if (features.length === 0) break;
      allFeatures.push(...features);
      hasMore = data.exceededTransferLimit === true;
      offset += 2000;
      if (offset > 20000) break;
    }
    return allFeatures
      .filter((f: any) => {
        const a = f.attributes || {};
        return (a.latitude || f.geometry?.y) && (a.longitude || f.geometry?.x) && a.inService !== 'FALSE';
      })
      .map((f: any) => {
        const a = f.attributes;
        return {
          id: `ca-${a.district || 'x'}-${a.OBJECTID || Math.random().toString(36).slice(2)}`,
          name: a.locationName || `CA D${a.district} Camera`,
          lat: a.latitude || f.geometry?.y,
          lng: a.longitude || f.geometry?.x,
          imageUrl: a.currentImageURL || '',
          source: `Caltrans D${a.district || '?'}`,
          refreshRate: 5,
          streamUrl: validStreamUrl(a.streamingVideoURL || ''),
          region: 'CA', country: 'US',
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== FLORIDA ======
async function fetchFLDOT(): Promise<CameraResult[]> {
  try {
    const allFeatures: any[] = [];
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const url = `https://services.arcgis.com/3wFbqsFPLeKqOlIK/arcgis/rest/services/FL511_Traffic_Cameras/FeatureServer/0/query?where=1%3D1&outFields=*&f=json&resultRecordCount=2000&resultOffset=${offset}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!resp.ok) break;
      const data = await resp.json();
      const features = data?.features || [];
      if (features.length === 0) break;
      allFeatures.push(...features);
      hasMore = data.exceededTransferLimit === true;
      offset += 2000;
      if (offset > 20000) break;
    }
    return allFeatures
      .filter((f: any) => {
        const a = f.attributes || {};
        const lat = a.LATITUDE || a.Latitude || f.geometry?.y;
        const lng = a.LONGITUDE || a.Longitude || f.geometry?.x;
        return lat && lng;
      })
      .map((f: any) => {
        const a = f.attributes || {};
        const lat = a.LATITUDE || a.Latitude || f.geometry?.y;
        const lng = a.LONGITUDE || a.Longitude || f.geometry?.x;
        const fl511Id = a.ID || a.Id || a.id || '';
        const camId = a.OBJECTID_1 || a.OBJECTID || fl511Id;
        let imgUrl = fl511Id ? `https://fl511.com/map/Cctv/${fl511Id}` : (a.IMAGE || a.ImageURL || '');
        return {
          id: `fl-${fl511Id || camId}`,
          name: a.DESCRIPT || a.Name || a.LOCATION || 'FL Camera',
          lat, lng, imageUrl: imgUrl, source: 'FL511', refreshRate: 15,
          region: 'FL', country: 'US',
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== NYC DOT ======
async function fetchNYCDOTCameras(): Promise<CameraResult[]> {
  try {
    const resp = await fetch('https://webcams.nyctmc.org/api/cameras/', {
      signal: AbortSignal.timeout(15000), headers: { 'Accept': 'application/json' }
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = Array.isArray(data) ? data : (data?.cameras || []);
    return cameras
      .filter((c: any) => (c.latitude || c.lat) && (c.longitude || c.lng))
      .map((c: any) => ({
        id: `nycdot-${c.id || c.cameraID || Math.random().toString(36).slice(2)}`,
        name: c.name || c.title || 'NYC Camera',
        lat: c.latitude || c.lat,
        lng: c.longitude || c.lng,
        imageUrl: c.imageUrl || c.image_url || c.url || c.stillImageUrl || '',
        source: 'NYCDOT', refreshRate: 2,
        region: 'NY', country: 'US',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== VIRGINIA GeoJSON ======
async function fetch511VA(): Promise<CameraResult[]> {
  try {
    const resp = await fetch('https://www.511virginia.org/data/geojson/icons.cameras.geojson', { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data?.features || [])
      .filter((f: any) => f.geometry?.coordinates?.length >= 2)
      .map((f: any) => ({
        id: `va-${f.properties?.id || Math.random().toString(36).slice(2)}`,
        name: f.properties?.name || f.properties?.description || 'VA Camera',
        lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0],
        imageUrl: f.properties?.image_url || f.properties?.url || '',
        source: '511VA', refreshRate: 10, region: 'VA', country: 'US',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== OHIO (OHGO) ======
async function fetchOHCameras(): Promise<CameraResult[]> {
  try {
    const resp = await fetch('https://publicapi.ohgo.com/api/v1/Cameras', {
      signal: AbortSignal.timeout(15000), headers: { 'Accept': 'application/json' }
    });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = data?.results || (Array.isArray(data) ? data : []);
    return cameras
      .filter((c: any) => (c.latitude || c.Latitude) && (c.longitude || c.Longitude))
      .map((c: any) => {
        let imgUrl = c.smallImageUrl || c.largeImageUrl || c.imageUrl || '';
        if (!imgUrl && Array.isArray(c.links)) {
          const imgLink = c.links.find((l: any) => l.rel === 'small' || l.rel === 'large');
          if (imgLink) imgUrl = imgLink.href || '';
        }
        return {
          id: `oh-${c.id || c.Id || Math.random().toString(36).slice(2)}`,
          name: c.description || c.Description || 'OH Camera',
          lat: c.latitude || c.Latitude, lng: c.longitude || c.Longitude,
          imageUrl: imgUrl, source: 'OHGO', refreshRate: 5,
          region: 'OH', country: 'US',
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== TENNESSEE ======
async function fetchTNCameras(): Promise<CameraResult[]> {
  try {
    // Try multiple TN endpoints
    const urls = [
      'https://smartway.tn.gov/traffic/api/Cameras',
      'https://smartway.tn.gov/traffic/api/cameras',
      'https://tdot.tn.gov/TDOT/cctv/cameras.json',
    ];
    for (const url of urls) {
      try {
        const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!resp.ok) continue;
        const data = await resp.json();
        const cameras = Array.isArray(data) ? data : (data?.cameras || data?.features || []);
        if (!Array.isArray(cameras) || cameras.length === 0) continue;
        return cameras
          .filter((c: any) => (c.latitude || c.lat || c.Latitude) && (c.longitude || c.lng || c.Longitude))
          .map((c: any) => ({
            id: `tn-${c.id || c.cameraId || c.Id || Math.random().toString(36).slice(2)}`,
            name: c.description || c.name || c.title || 'TN Camera',
            lat: c.latitude || c.lat || c.Latitude,
            lng: c.longitude || c.lng || c.Longitude,
            imageUrl: c.imageUrl || c.image || c.url || c.ImageUrl || '',
            source: 'TN SmartWay', refreshRate: 10, region: 'TN', country: 'US',
          }))
          .filter((c: CameraResult) => c.imageUrl);
      } catch { continue; }
    }
    return [];
  } catch { return []; }
}

// ====== COLORADO ======
async function fetchCDOT(): Promise<CameraResult[]> {
  try {
    const urls = [
      'https://www.cotrip.org/speed/getTrafficCameras.do',
      'https://data.cotrip.org/api/v1/cameras',
      'https://www.codot.gov/travel/cameras/cameras.json',
    ];
    for (const url of urls) {
      try {
        const resp = await fetch(url, { signal: AbortSignal.timeout(10000) });
        if (!resp.ok) continue;
        const data = await resp.json();
        const cameras = data?.features || (Array.isArray(data) ? data : (data?.cameras || []));
        if (!Array.isArray(cameras) || cameras.length === 0) continue;
        return cameras
          .filter((c: any) => {
            const coords = c.geometry?.coordinates;
            if (coords) return coords.length >= 2;
            return (c.latitude || c.lat) && (c.longitude || c.lng);
          })
          .map((c: any) => ({
            id: `co-${c.properties?.id || c.id || Math.random().toString(36).slice(2)}`,
            name: c.properties?.camera_label || c.properties?.name || c.name || 'CO Camera',
            lat: c.geometry?.coordinates?.[1] || c.latitude || c.lat,
            lng: c.geometry?.coordinates?.[0] || c.longitude || c.lng,
            imageUrl: c.properties?.https_url || c.properties?.camera_url || c.imageUrl || c.url || '',
            source: 'CDOT', refreshRate: 10, region: 'CO', country: 'US',
          }))
          .filter((c: CameraResult) => c.imageUrl);
      } catch { continue; }
    }
    return [];
  } catch { return []; }
}

// ====== AUSTIN TX ======
async function fetchAustinCameras(): Promise<CameraResult[]> {
  try {
    const url = `https://data.austintexas.gov/resource/b4k4-adkb.json?$limit=50000&camera_status=TURNED_ON`;
    const resp = await fetch(url, { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => {
        const lat = parseFloat(c.location?.latitude || c.location_latitude || 0);
        const lng = parseFloat(c.location?.longitude || c.location_longitude || 0);
        return lat && lng;
      })
      .map((c: any) => {
        const camId = c.camera_id || c.atd_device_id || '';
        return {
          id: `tx-atx-${camId || Math.random().toString(36).slice(2)}`,
          name: c.location_name || c.camera_name || 'Austin Camera',
          lat: parseFloat(c.location?.latitude || c.location_latitude),
          lng: parseFloat(c.location?.longitude || c.location_longitude),
          imageUrl: camId ? `https://cctv.austinmobility.io/image/${camId}.jpg` : '',
          source: 'Austin TX', refreshRate: 5, region: 'TX', country: 'US',
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== MISSOURI ======
async function fetchMOCameras(): Promise<CameraResult[]> {
  try {
    const resp = await fetch('https://traveler.modot.org/timconfig/feed/dtd/TravelConditionCamera.json', { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = data?.features || data?.cameras || (Array.isArray(data) ? data : []);
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => {
        const lat = c.latitude || c.lat || c.geometry?.coordinates?.[1] || 0;
        const lng = c.longitude || c.lng || c.geometry?.coordinates?.[0] || 0;
        return lat && lng;
      })
      .map((c: any) => ({
        id: `mo-${c.id || c.Id || Math.random().toString(36).slice(2)}`,
        name: c.description || c.name || 'MO Camera',
        lat: c.latitude || c.lat || c.geometry?.coordinates?.[1],
        lng: c.longitude || c.lng || c.geometry?.coordinates?.[0],
        imageUrl: c.imageUrl || c.url || c.image || '',
        source: 'MoDOT', refreshRate: 10, region: 'MO', country: 'US',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== WINDY.COM - Worldwide fallback ======
async function fetchWindyRegion(lat: number, lng: number, radius: number, regionName: string, country: string): Promise<CameraResult[]> {
  try {
    // Try v3 first, then v2
    const urls = [
      { url: `https://api.windy.com/webcams/api/v3/webcams?lang=en&limit=500&offset=0&include=images,location&nearby=${lat},${lng},${radius}`, header: 'x-windy-api-key' },
      { url: `https://api.windy.com/api/webcams/v2/list/nearby=${lat},${lng},${radius}?show=webcams:image,location&limit=500`, header: 'x-windy-key' },
    ];
    for (const { url, header } of urls) {
      try {
        const resp = await fetch(url, {
          headers: { [header]: 'PGbLONaQtxGGGTZ0NXPEr4BbPtTOqo5f' },
          signal: AbortSignal.timeout(15000),
        });
        console.log(`[Windy ${regionName}] ${url.substring(0, 80)}... status=${resp.status}`);
        if (!resp.ok) {
          const errText = await resp.text().catch(() => '');
          console.log(`[Windy ${regionName}] Error body: ${errText.substring(0, 200)}`);
          continue;
        }
        const data = await resp.json();
        const webcams = data?.webcams || data?.result?.webcams || [];
        if (!Array.isArray(webcams) || webcams.length === 0) {
          console.log(`[Windy ${regionName}] No webcams in response, keys: ${Object.keys(data || {}).join(',')}`);
          continue;
        }
        return webcams
          .filter((w: any) => (w.location?.latitude || w.position?.latitude))
          .map((w: any) => ({
            id: `windy-${w.webcamId || w.id}`,
            name: w.title || 'Webcam',
            lat: w.location?.latitude || w.position?.latitude,
            lng: w.location?.longitude || w.position?.longitude,
            imageUrl: w.images?.current?.preview || w.image?.current?.preview || w.images?.daylight?.preview || `https://images-webcams.windy.com/webcams/${w.webcamId || w.id}/current/preview/${w.webcamId || w.id}.jpg`,
            source: 'Windy', refreshRate: 30,
            region: regionName, country,
          }))
          .filter((c: CameraResult) => c.imageUrl);
      } catch (e: any) {
        console.log(`[Windy ${regionName}] attempt failed: ${e.message}`);
        continue;
      }
    }
    return [];
  } catch { return []; }
}

// ====== ILLINOIS - IDOT Gateway (verified ArcGIS FeatureServer) ======
async function fetchIDOTCameras(): Promise<CameraResult[]> {
  try {
    const allFeatures: any[] = [];
    let offset = 0;
    let hasMore = true;
    while (hasMore) {
      const url = `https://services2.arcgis.com/aIrBD8yn1TDTEXoz/arcgis/rest/services/TrafficCamerasTM_Public/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=json&resultRecordCount=2000&resultOffset=${offset}`;
      const resp = await fetch(url, { signal: AbortSignal.timeout(20000) });
      if (!resp.ok) break;
      const data = await resp.json();
      const features = data?.features || [];
      if (features.length === 0) break;
      allFeatures.push(...features);
      hasMore = data.exceededTransferLimit === true;
      offset += 2000;
      if (offset > 20000) break;
    }
    console.log(`[IDOT] Fetched ${allFeatures.length} raw features`);
    return allFeatures
      .filter((f: any) => {
        const a = f.attributes || {};
        const lat = a.y || f.geometry?.y;
        const lng = a.x || f.geometry?.x;
        return lat && lng && a.TooOld !== 'true';
      })
      .map((f: any) => {
        const a = f.attributes || {};
        const lat = a.y || f.geometry?.y;
        const lng = a.x || f.geometry?.x;
        const camId = a.OBJECTID || Math.random().toString(36).slice(2);
        const imgUrl = a.SnapShot || '';
        return {
          id: `il-idot-${camId}`,
          name: a.CameraLocation || 'IL Camera',
          lat, lng, imageUrl: imgUrl,
          source: 'IDOT Gateway', refreshRate: 5,
          region: 'IL', country: 'US',
        };
      })
      .filter((c: CameraResult) => c.imageUrl);
  } catch (e: any) {
    console.error('[IDOT] Error:', e.message);
    return [];
  }
}

// ====== UK Highways ======
async function fetchUKCameras(): Promise<CameraResult[]> {
  try {
    const resp = await fetch('https://data.highwaysengland.co.uk/ntis/NTIS/Camera/content.json', { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const cameras = data?.cameras || data?.features || (Array.isArray(data) ? data : []);
    if (!Array.isArray(cameras)) return [];
    return cameras
      .filter((c: any) => (c.latitude || c.lat || c.geometry?.coordinates?.[1]) && (c.longitude || c.lng || c.geometry?.coordinates?.[0]))
      .map((c: any, i: number) => ({
        id: `uk-${c.id || i}`,
        name: c.description || c.name || 'UK Highway Camera',
        lat: c.latitude || c.lat || c.geometry?.coordinates?.[1],
        lng: c.longitude || c.lng || c.geometry?.coordinates?.[0],
        imageUrl: c.image || c.imageUrl || c.url || '',
        source: 'Highways England', refreshRate: 20, region: 'UK', country: 'GB',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== Netherlands ======
async function fetchNLCameras(): Promise<CameraResult[]> {
  try {
    const resp = await fetch('https://opendata.ndw.nu/MSt_Camera.json', { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    const features = data?.features || (Array.isArray(data) ? data : []);
    return features
      .filter((f: any) => f.geometry?.coordinates?.length >= 2)
      .map((f: any) => ({
        id: `nl-${f.properties?.id || Math.random().toString(36).slice(2)}`,
        name: f.properties?.name || f.properties?.description || 'NL Camera',
        lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0],
        imageUrl: f.properties?.imageUrl || f.properties?.url || '',
        source: 'NDW Netherlands', refreshRate: 20, region: 'NL', country: 'NL',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== Australia NSW ======
async function fetchAUCameras(): Promise<CameraResult[]> {
  try {
    const resp = await fetch('https://www.livetraffic.com/traffic/cameras/geojson', { signal: AbortSignal.timeout(15000) });
    if (!resp.ok) return [];
    const data = await resp.json();
    return (data?.features || [])
      .filter((f: any) => f.geometry?.coordinates?.length >= 2)
      .map((f: any) => ({
        id: `au-${f.properties?.id || Math.random().toString(36).slice(2)}`,
        name: f.properties?.title || f.properties?.name || 'AU Camera',
        lat: f.geometry.coordinates[1], lng: f.geometry.coordinates[0],
        imageUrl: f.properties?.href || f.properties?.imageUrl || '',
        source: 'NSW LiveTraffic', refreshRate: 20, region: 'NSW', country: 'AU',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== Oregon ======
async function fetchODOT(): Promise<CameraResult[]> {
  try {
    const resp = await fetch('https://tripcheck.com/Scripts/map/data/cameraData.js', { signal: AbortSignal.timeout(10000) });
    if (!resp.ok) return [];
    const text = await resp.text();
    const match = text.match(/\[[\s\S]*\]/);
    if (!match) return [];
    const data = JSON.parse(match[0]);
    if (!Array.isArray(data)) return [];
    return data
      .filter((c: any) => (c.lat || c.latitude) && (c.lon || c.lng || c.longitude))
      .map((c: any, i: number) => ({
        id: `or-${c.id || i}`,
        name: c.title || c.name || 'OR Camera',
        lat: c.lat || c.latitude,
        lng: c.lon || c.lng || c.longitude,
        imageUrl: c.imageUrl || c.url || '',
        source: 'ODOT', refreshRate: 10, region: 'OR', country: 'US',
      }))
      .filter((c: CameraResult) => c.imageUrl);
  } catch { return []; }
}

// ====== ALL SOURCES ======
interface SourceDef {
  name: string;
  fn: () => Promise<CameraResult[]>;
}

const allSources: SourceDef[] = [
  // California
  { name: 'CA-Caltrans', fn: fetchCaltransCameras },
  // Florida
  { name: 'FL-ArcGIS', fn: fetchFLDOT },
  // NYC DOT
  { name: 'NYC-DOT', fn: fetchNYCDOTCameras },
  // Virginia
  { name: 'VA-GeoJSON', fn: fetch511VA },
  // Ohio
  { name: 'OH-OHGO', fn: fetchOHCameras },
  // Tennessee
  { name: 'TN-SmartWay', fn: fetchTNCameras },
  // Colorado
  { name: 'CO-CDOT', fn: fetchCDOT },
  // Austin TX
  { name: 'TX-Austin', fn: fetchAustinCameras },
  // Missouri
  { name: 'MO-MoDOT', fn: fetchMOCameras },
  // Oregon
  { name: 'OR-TripCheck', fn: fetchODOT },
  // ArcGIS states
  { name: 'TX-ArcGIS', fn: () => fetchArcGISCameras('TX', 'https://services.arcgis.com/KTcxiTD9dsQw4r7Z/arcgis/rest/services/TxDOT_CCTV_Cameras/FeatureServer/0', {}, 'TxDOT', 10) },
  { name: 'WA-ArcGIS', fn: () => fetchArcGISCameras('WA', 'https://data.wsdot.wa.gov/arcgis/rest/services/TravelInformation/TravelInfoCamerasWeather/FeatureServer/0', {}, 'WSDOT', 5) },
  { name: 'MD-ArcGIS', fn: () => fetchArcGISCameras('MD', 'https://mdgeodata.md.gov/imap/rest/services/Transportation/MD_TrafficCameras/FeatureServer/0', { lat: 'lat', lng: 'long', name: 'location', imageUrl: 'url', id: 'OBJECTID' }, 'MDSHA', 10) },
  { name: 'DC-ArcGIS', fn: () => fetchArcGISCameras('DC', 'https://maps2.dcgis.dc.gov/dcgis/rest/services/DCGIS_DATA/Transportation_WebMercator/MapServer/98', {}, 'DC DDOT', 10) },
  { name: 'NC-ArcGIS', fn: () => fetchArcGISCameras('NC', 'https://services.arcgis.com/ZOyb2t4B0UYuYNYH/arcgis/rest/services/NCDOT_TIMSCameras/FeatureServer/0', { name: 'LOCATION', imageUrl: 'URL' }, 'NCDOT', 10) },
  { name: 'MI-ArcGIS', fn: () => fetchArcGISCameras('MI', 'https://services1.arcgis.com/j5X0zJJcFB1gGkx8/arcgis/rest/services/MDOT_CCTV/FeatureServer/0', {}, 'MDOT MI', 10) },
  { name: 'IN-ArcGIS', fn: () => fetchArcGISCameras('IN', 'https://services7.arcgis.com/JaJjFmVzJmUJ6KzX/arcgis/rest/services/INDOT_CCTV_Cameras/FeatureServer/0', {}, 'INDOT', 10) },
  { name: 'IL-IDOT', fn: fetchIDOTCameras },
  // 511 states
  { name: 'NY-511', fn: () => fetch511Cameras('NY', 'https://511ny.org', 3) },
  { name: 'NJ-511', fn: () => fetch511Cameras('NJ', 'https://511nj.org', 5) },
  { name: 'PA-511', fn: () => fetch511Cameras('PA', 'https://511pa.com', 5) },
  { name: 'MA-511', fn: () => fetch511Cameras('MA', 'https://mass511.com', 10) },
  { name: 'CT-511', fn: () => fetch511Cameras('CT', 'https://www.511ct.org', 10) },
  { name: 'RI-511', fn: () => fetch511Cameras('RI', 'https://www.dot.ri.gov/511', 10) },
  { name: 'VT-511', fn: () => fetch511Cameras('VT', 'https://511vt.com', 15) },
  { name: 'NH-511', fn: () => fetch511Cameras('NH', 'https://www.nh.gov/dot/511', 15) },
  { name: 'ME-511', fn: () => fetch511Cameras('ME', 'https://511.maine.gov', 15) },
  { name: 'DE-511', fn: () => fetch511Cameras('DE', 'https://www.deldot.gov', 10) },
  { name: 'GA-511', fn: () => fetch511Cameras('GA', 'https://511ga.org', 10) },
  { name: 'SC-511', fn: () => fetch511Cameras('SC', 'https://www.511sc.org', 10) },
  { name: 'KY-511', fn: () => fetch511Cameras('KY', 'https://511.ky.gov', 10) },
  { name: 'LA-511', fn: () => fetch511Cameras('LA', 'https://www.511la.org', 10) },
  { name: 'AR-511', fn: () => fetch511Cameras('AR', 'https://www.idrivearkansas.com', 10) },
  { name: 'AZ-511', fn: () => fetch511Cameras('AZ', 'https://az511.gov', 10) },
  { name: 'NV-511', fn: () => fetch511Cameras('NV', 'https://www.nvroads.com', 10) },
  { name: 'UT-511', fn: () => fetch511Cameras('UT', 'https://www.udottraffic.utah.gov', 10) },
  { name: 'NM-511', fn: () => fetch511Cameras('NM', 'https://nmroads.com', 10) },
  { name: 'ID-511', fn: () => fetch511Cameras('ID', 'https://511.idaho.gov', 10) },
  { name: 'MT-511', fn: () => fetch511Cameras('MT', 'https://www.511mt.net', 15) },
  { name: 'WY-511', fn: () => fetch511Cameras('WY', 'https://www.wyoroad.info', 15) },
  { name: 'HI-511', fn: () => fetch511Cameras('HI', 'https://goakamai.org', 15) },
  { name: 'IA-511', fn: () => fetch511Cameras('IA', 'https://www.511ia.org', 10) },
  { name: 'MN-511', fn: () => fetch511Cameras('MN', 'https://511mn.org', 10) },
  { name: 'WI-511', fn: () => fetch511Cameras('WI', 'https://511wi.gov', 10) },
  { name: 'NE-511', fn: () => fetch511Cameras('NE', 'https://511.nebraska.gov', 10) },
  { name: 'ND-511', fn: () => fetch511Cameras('ND', 'https://travel.dot.nd.gov', 15) },
  { name: 'SD-511', fn: () => fetch511Cameras('SD', 'https://sd511.org', 15) },
  { name: 'AK-511', fn: () => fetch511Cameras('AK', 'https://511.alaska.gov', 30) },
  { name: 'WV-511', fn: () => fetch511Cameras('WV', 'https://wv511.org', 10) },
  // Chicago
  // IL-Chicago is now covered by IL-IDOT source above
  // International
  { name: 'UK-Highways', fn: fetchUKCameras },
  { name: 'NL-NDW', fn: fetchNLCameras },
  { name: 'AU-NSW', fn: fetchAUCameras },
  // Windy worldwide regions
  { name: 'Windy-Hawaii', fn: () => fetchWindyRegion(20.8, -156.3, 200, 'HI', 'US') },
  { name: 'Windy-Tokyo', fn: () => fetchWindyRegion(35.68, 139.69, 100, 'Tokyo', 'JP') },
  { name: 'Windy-Japan', fn: () => fetchWindyRegion(36.2, 138.2, 500, 'Japan', 'JP') },
  { name: 'Windy-London', fn: () => fetchWindyRegion(51.5, -0.12, 100, 'London', 'GB') },
  { name: 'Windy-Paris', fn: () => fetchWindyRegion(48.86, 2.35, 100, 'Paris', 'FR') },
  { name: 'Windy-Berlin', fn: () => fetchWindyRegion(52.52, 13.4, 100, 'Berlin', 'DE') },
  { name: 'Windy-Amsterdam', fn: () => fetchWindyRegion(52.37, 4.9, 80, 'Amsterdam', 'NL') },
  { name: 'Windy-Rome', fn: () => fetchWindyRegion(41.9, 12.5, 100, 'Rome', 'IT') },
  { name: 'Windy-Madrid', fn: () => fetchWindyRegion(40.42, -3.7, 100, 'Madrid', 'ES') },
  { name: 'Windy-LasVegas', fn: () => fetchWindyRegion(36.17, -115.14, 50, 'NV', 'US') },
  { name: 'Windy-Chicago', fn: () => fetchWindyRegion(41.88, -87.63, 80, 'IL', 'US') },
  { name: 'Windy-Houston', fn: () => fetchWindyRegion(29.76, -95.37, 80, 'TX', 'US') },
  { name: 'Windy-Dallas', fn: () => fetchWindyRegion(32.78, -96.8, 80, 'TX', 'US') },
  { name: 'Windy-Denver', fn: () => fetchWindyRegion(39.74, -104.99, 80, 'CO', 'US') },
  { name: 'Windy-Nashville', fn: () => fetchWindyRegion(36.16, -86.78, 60, 'TN', 'US') },
  { name: 'Windy-Louisville', fn: () => fetchWindyRegion(38.25, -85.76, 60, 'KY', 'US') },
  // More US cities for coverage
  { name: 'Windy-SanFrancisco', fn: () => fetchWindyRegion(37.77, -122.42, 60, 'CA', 'US') },
  { name: 'Windy-LA', fn: () => fetchWindyRegion(34.05, -118.24, 100, 'CA', 'US') },
  { name: 'Windy-Miami', fn: () => fetchWindyRegion(25.76, -80.19, 60, 'FL', 'US') },
  { name: 'Windy-Seattle', fn: () => fetchWindyRegion(47.61, -122.33, 60, 'WA', 'US') },
  { name: 'Windy-Phoenix', fn: () => fetchWindyRegion(33.45, -112.07, 80, 'AZ', 'US') },
  { name: 'Windy-Atlanta', fn: () => fetchWindyRegion(33.75, -84.39, 60, 'GA', 'US') },
];

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const sourceName = body?.source; // optional: sync only one source

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const sourcesToSync = sourceName
      ? allSources.filter(s => s.name === sourceName)
      : allSources;

    const BATCH_SIZE = 8;
    const results: { name: string; count: number; error?: string; durationMs: number }[] = [];

    for (let i = 0; i < sourcesToSync.length; i += BATCH_SIZE) {
      const batch = sourcesToSync.slice(i, i + BATCH_SIZE);
      const batchResults = await Promise.allSettled(
        batch.map(async (src) => {
          const start = Date.now();
          try {
            const cameras = await src.fn();
            const durationMs = Date.now() - start;
            console.log(`[${src.name}] ${cameras.length} cameras in ${durationMs}ms`);

            if (cameras.length > 0) {
              // Upsert in chunks of 500
              for (let j = 0; j < cameras.length; j += 500) {
                const chunk = cameras.slice(j, j + 500).map(c => ({
                  id: c.id,
                  name: c.name,
                  lat: c.lat,
                  lng: c.lng,
                  image_url: c.imageUrl,
                  source: c.source,
                  stream_url: c.streamUrl || null,
                  refresh_rate: c.refreshRate || 10,
                  region: c.region || null,
                  country: c.country || 'US',
                  last_seen_at: new Date().toISOString(),
                  feed_status: 'unknown',
                }));
                await supabase.from('camera_catalog').upsert(chunk, { onConflict: 'id' });
              }
            }

            // Update sync status
            await supabase.from('camera_sync_status').upsert({
              source_name: src.name,
              last_sync_at: new Date().toISOString(),
              last_success_at: cameras.length > 0 ? new Date().toISOString() : undefined,
              last_error: cameras.length === 0 ? 'No cameras returned' : null,
              camera_count: cameras.length,
              sync_duration_ms: durationMs,
            }, { onConflict: 'source_name' });

            return { name: src.name, count: cameras.length, durationMs };
          } catch (err: any) {
            const durationMs = Date.now() - start;
            console.error(`[${src.name}] ERROR: ${err.message}`);
            await supabase.from('camera_sync_status').upsert({
              source_name: src.name,
              last_sync_at: new Date().toISOString(),
              last_error: err.message,
              camera_count: 0,
              sync_duration_ms: durationMs,
            }, { onConflict: 'source_name' });
            return { name: src.name, count: 0, error: err.message, durationMs };
          }
        })
      );

      for (const r of batchResults) {
        if (r.status === 'fulfilled') results.push(r.value);
        else results.push({ name: 'unknown', count: 0, error: String(r.reason), durationMs: 0 });
      }
    }

    const totalCameras = results.reduce((s, r) => s + r.count, 0);
    console.log(`Sync complete: ${totalCameras} cameras from ${results.length} sources`);

    return new Response(
      JSON.stringify({ success: true, totalCameras, sources: results }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('Sync error:', err);
    return new Response(
      JSON.stringify({ success: false, error: err.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
