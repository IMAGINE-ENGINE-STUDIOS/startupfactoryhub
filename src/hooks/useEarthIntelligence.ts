import { useState, useCallback, useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { useAuth } from '@/contexts/AuthContext';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';

export type EarthLayerIconType = 'mountain' | 'sun-dim' | 'cloud-rain' | 'thermometer' | 'waves' | 'sun' | 'zap' | 'snowflake' | 'hurricane' | 'activity' | 'satellite' | 'leaf' | 'droplets' | 'wind' | 'flame' | 'building-2' | 'shield-alert' | 'sun-medium' | 'gauge';

export type EarthLayerCategory = 'land-surface' | 'precipitation' | 'temperature' | 'ocean' | 'weather' | 'seismic' | 'satellite-imagery' | 'energy' | 'risk';

export type EarthSubcategory =
  | 'climate-trends' | 'precipitation-intelligence' | 'extreme-events' | 'climate-projections'
  | 'soil-moisture' | 'hydrological-flow' | 'flood-risk' | 'drought-indicators'
  | 'vegetation-health' | 'land-use-dynamics' | 'crop-suitability' | 'productivity-mapping'
  | 'solar-exposure' | 'environmental-constraints' | 'resource-optimization' | 'renewable-feasibility'
  | 'urban-expansion' | 'infrastructure-risk' | 'climate-risk-index' | 'hazard-mapping'
  | null;

export type TemporalMode = 'daily' | 'monthly';
export type DayNightMode = 'day' | 'night';

export interface EarthLayer {
  id: string;
  name: string;
  description: string;
  tileUrl: string;
  enabled: boolean;
  opacity: number;
  icon: EarthLayerIconType;
  category: EarthLayerCategory;
  supportsTimeline?: boolean;
  supportsDateSelection?: boolean;
  supportsDayNight?: boolean;
  dayNightMode?: DayNightMode;
  temporalResolution?: TemporalMode;
  gibsLayerDay?: string;
  gibsLayerNight?: string;
  gibsFormat?: string;
  gibsTileMatrixSet?: string;
  gibsDefaultDate?: string;
  gibsUseDefaultTime?: boolean;
  gibsSubDaily?: boolean; // layer supports YYYY-MM-DDThh:mm:ssZ time path (e.g. GOES, Himawari)
  gibsSafeLagDays?: number; // force recent daily products back to the latest fully processed day
  maxZoom?: number;
  useWms?: boolean;
}

export interface EarthDataset {
  id: string;
  name: string;
  description: string;
  icon: EarthLayerIconType;
  category: EarthLayerCategory;
  subcategory?: EarthSubcategory;
  isTerraStream?: boolean;
  enabled: boolean;
  opacity: number;
  // Available modes
  hasDayNight: boolean;
  hasDaily: boolean;
  hasMonthly: boolean;
  hasTimeline: boolean; // real-time precipitation
  // Underlying layer IDs for each combination
  layerIds: {
    dayMonthly?: string;
    nightMonthly?: string;
    dayDaily?: string;
    nightDaily?: string;
    realtime?: string;
    static?: string; // for layers with no temporal config
  };
}

export interface PrecipitationFrame {
  time: number;
  path: string;
}

// GIBS tile URL builder (WMTS)
const buildGibsUrl = (layer: string, date: string | null, tileMatrixSet = 'GoogleMapsCompatible_Level6', format = 'png') => {
  if (!date || date === 'default') {
    return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/default/${tileMatrixSet}/{z}/{y}/{x}.${format}`;
  }

  return `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/${layer}/default/${date}/${tileMatrixSet}/{z}/{y}/{x}.${format}`;
};

// GIBS WMS tile URL builder (for layers that don't support GoogleMapsCompatible TileMatrixSets like CERES)
const buildGibsWmsUrl = (layer: string, date: string | null, format = 'image/png') => {
  const timeParam = date && date !== 'default' ? `&TIME=${date}` : '';
  return `https://gibs.earthdata.nasa.gov/wms/epsg3857/best/wms.cgi?SERVICE=WMS&VERSION=1.1.1&REQUEST=GetMap&LAYERS=${layer}&SRS=EPSG:3857&FORMAT=${encodeURIComponent(format)}&WIDTH=256&HEIGHT=256&TRANSPARENT=true${timeParam}&BBOX={bbox-epsg-3857}`;
};

const isMapStyleReady = (map: mapboxgl.Map | null) => {
  if (!map) return false;
  try {
    return Boolean(map.isStyleLoaded() && map.getStyle());
  } catch {
    return false;
  }
};

const safeGetMapLayer = (map: mapboxgl.Map | null, id: string) => {
  if (!isMapStyleReady(map)) return undefined;
  try {
    return map?.getLayer(id);
  } catch {
    return undefined;
  }
};

const safeGetMapSource = (map: mapboxgl.Map | null, id: string) => {
  if (!isMapStyleReady(map)) return undefined;
  try {
    return map?.getSource(id);
  } catch {
    return undefined;
  }
};

const safeRemoveMapLayer = (map: mapboxgl.Map | null, id: string) => {
  if (!safeGetMapLayer(map, id)) return;
  try {
    map?.removeLayer(id);
  } catch {}
};

const safeRemoveMapSource = (map: mapboxgl.Map | null, id: string) => {
  if (!safeGetMapSource(map, id)) return;
  // Remove any layers still referencing this source, otherwise removeSource throws.
  try {
    const style: any = map?.getStyle?.();
    const dependents = (style?.layers || []).filter((l: any) => l.source === id).map((l: any) => l.id);
    dependents.forEach((lid: string) => {
      try { map?.removeLayer(lid); } catch {}
    });
  } catch {}
  try {
    map?.removeSource(id);
  } catch {}
};

// Add or refresh a raster source: if it already exists, update tiles in place instead of throwing.
const upsertRasterSource = (
  map: mapboxgl.Map,
  id: string,
  spec: { tiles: string[]; tileSize?: number; maxzoom?: number }
) => {
  const existing: any = safeGetMapSource(map, id);
  if (existing) {
    try {
      if (typeof existing.setTiles === 'function') {
        existing.setTiles(spec.tiles);
        return;
      }
    } catch {}
    safeRemoveMapSource(map, id);
  }
  map.addSource(id, { type: 'raster', tiles: spec.tiles, tileSize: spec.tileSize ?? 256, maxzoom: spec.maxzoom ?? 18 });
};

const STATIC_EARTH_LAYERS: EarthLayer[] = [
  // ── Land Surface ──
  {
    id: 'jaxa-aw3d30',
    name: 'ALOS Elevation (AW3D30)',
    description: 'Global ~30m DSM from ALOS "Daichi" satellite series (PRISM sensor)',
    tileUrl: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
    enabled: false,
    opacity: 0.6,
    icon: 'mountain',
    category: 'land-surface',
  },
  {
    id: 'jaxa-hillshade',
    name: 'Land Surface Hillshade',
    description: 'Global terrain relief derived from ALOS/Mapzen ~30m elevation data',
    tileUrl: 'https://tiles.openstreetmap.us/raster/hillshade/{z}/{x}/{y}.jpg',
    enabled: false,
    opacity: 0.5,
    icon: 'sun-dim',
    category: 'land-surface',
  },

  // ── Precipitation ──
  {
    id: 'gsmap-precipitation',
    name: 'GSMaP Precipitation (Real-time)',
    description: 'Real-time global radar precipitation (~10min updates)',
    tileUrl: '',
    enabled: false,
    opacity: 0.65,
    icon: 'cloud-rain',
    category: 'precipitation',
    supportsTimeline: true,
  },
  {
    id: 'gsmap-precipitation-monthly',
    name: 'GSMaP Precipitation (Monthly)',
    description: 'Monthly accumulated precipitation from GPM/GSMaP. Data available since March 2000.',
    tileUrl: '',
    enabled: false,
    opacity: 0.65,
    icon: 'cloud-rain',
    category: 'precipitation',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    gibsLayerDay: 'IMERG_Precipitation_Rate',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level6',
    maxZoom: 6,
  },

  // ── Temperature (Land) ──
  {
    id: 'lst-day-monthly',
    name: 'Land Surface Temp (Day/Monthly)',
    description: 'MODIS Terra L3 monthly daytime Land Surface Temperature composite (~5km). Most-recent month auto-loaded.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'thermometer',
    category: 'temperature',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    supportsDayNight: true,
    dayNightMode: 'day',
    gibsLayerDay: 'MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day',
    gibsLayerNight: 'MODIS_Terra_L3_Land_Surface_Temp_Monthly_Night',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level6',
    maxZoom: 6,
  },
  {
    id: 'lst-day-daily',
    name: 'Land Surface Temp (Day/Daily)',
    description: 'MODIS Terra daily daytime Land Surface Temperature (~1km). Updates with 1-day latency.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'thermometer',
    category: 'temperature',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    supportsDayNight: true,
    dayNightMode: 'day',
    gibsLayerDay: 'MODIS_Terra_Land_Surface_Temp_Day',
    gibsLayerNight: 'MODIS_Terra_Land_Surface_Temp_Night',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },
  {
    id: 'lst-night-monthly',
    name: 'Land Surface Temp (Night/Monthly)',
    description: 'MODIS Terra L3 monthly nighttime Land Surface Temperature composite (~5km). Most-recent month auto-loaded.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'thermometer',
    category: 'temperature',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    supportsDayNight: true,
    dayNightMode: 'night',
    gibsLayerDay: 'MODIS_Terra_L3_Land_Surface_Temp_Monthly_Day',
    gibsLayerNight: 'MODIS_Terra_L3_Land_Surface_Temp_Monthly_Night',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level6',
    maxZoom: 6,
  },
  {
    id: 'lst-night-daily',
    name: 'Land Surface Temp (Night/Daily)',
    description: 'Daily nighttime LST observed by GCOM-C "SHIKISAI" (~5km). Nighttime ~10:30pm local time.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'thermometer',
    category: 'temperature',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    supportsDayNight: true,
    dayNightMode: 'night',
    gibsLayerDay: 'MODIS_Terra_Land_Surface_Temp_Day',
    gibsLayerNight: 'MODIS_Terra_Land_Surface_Temp_Night',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },

  // ── Ocean (SST) ──
  {
    id: 'sst-gcomc-day-monthly',
    name: 'SST GCOM-C (Day/Monthly)',
    description: 'Sea surface temperature by GCOM-C "SHIKISAI" (~250m coastal). Daytime ~10:30am.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'waves',
    category: 'ocean',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    supportsDayNight: true,
    dayNightMode: 'day',
    gibsLayerDay: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },
  {
    id: 'sst-gcomc-night-monthly',
    name: 'SST GCOM-C (Night/Monthly)',
    description: 'Sea surface temperature by GCOM-C "SHIKISAI" (~250m coastal). Nighttime ~10:30pm.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'waves',
    category: 'ocean',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    supportsDayNight: true,
    dayNightMode: 'night',
    gibsLayerDay: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },
  {
    id: 'sst-gcomc-day-daily',
    name: 'SST GCOM-C (Day/Daily)',
    description: 'Daily SST by GCOM-C "SHIKISAI" (~250m coastal). Daytime ~10:30am.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'waves',
    category: 'ocean',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    supportsDayNight: true,
    dayNightMode: 'day',
    gibsLayerDay: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },
  {
    id: 'sst-gcomc-night-daily',
    name: 'SST GCOM-C (Night/Daily)',
    description: 'Daily SST by GCOM-C "SHIKISAI" (~250m coastal). Nighttime ~10:30pm.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'waves',
    category: 'ocean',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    supportsDayNight: true,
    dayNightMode: 'night',
    gibsLayerDay: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },
  {
    id: 'sst-gcomw-day-daily',
    name: 'SST GCOM-W (Day/Daily)',
    description: 'SST by GCOM-W "SHIZUKU". Observes through clouds. 5-day moving average. Daytime ~1:30pm.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'waves',
    category: 'ocean',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    supportsDayNight: true,
    dayNightMode: 'day',
    gibsLayerDay: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },
  {
    id: 'sst-gcomw-night-daily',
    name: 'SST GCOM-W (Night/Daily)',
    description: 'SST by GCOM-W "SHIZUKU". Observes through clouds. 5-day moving average. Nighttime ~1:30am.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'waves',
    category: 'ocean',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    supportsDayNight: true,
    dayNightMode: 'night',
    gibsLayerDay: 'GHRSST_L4_MUR_Sea_Surface_Temperature',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    maxZoom: 7,
  },


  // ── Weather: Snow Radar ──
  {
    id: 'rainviewer-snow',
    name: 'Snow Radar (Live)',
    description: 'Real-time snow/mixed precipitation radar from RainViewer (~10min updates)',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'snowflake',
    category: 'weather',
    supportsTimeline: true,
    maxZoom: 8,
  },

  // ── Weather: Thunder / Lightning ──
  {
    id: 'blitzortung-lightning',
    name: 'Lightning Strikes (Live)',
    description: 'Real-time lightning detection from global sensor network. Updates every 5 minutes.',
    tileUrl: '',
    enabled: false,
    opacity: 0.8,
    icon: 'zap',
    category: 'weather',
  },

  // ── Weather: Hurricane / Tropical Cyclone ──
  {
    id: 'noaa-hurricane',
    name: 'Active Hurricanes (NOAA)',
    description: 'Active tropical cyclone tracks and forecast cones from NHC/NOAA.',
    tileUrl: '',
    enabled: false,
    opacity: 0.85,
    icon: 'hurricane',
    category: 'weather',
  },

  // ── Seismic: USGS Earthquakes ──
  {
    id: 'usgs-earthquakes',
    name: 'Earthquakes (Live)',
    description: 'Real-time seismic activity from USGS. Shows all M2.5+ events from the past 24 hours.',
    tileUrl: '',
    enabled: false,
    opacity: 0.9,
    icon: 'activity',
    category: 'seismic',
  },

  // ── Sentinel-2 Cloudless 2023 (EOX) — high-resolution basemap, ~10m, max zoom 14 ──
  {
    id: 'sentinel2-cloudless-2023',
    name: 'Sentinel-2 Cloudless 2023 (HD)',
    description: 'High-resolution cloudless mosaic from ESA Sentinel-2 (~10m). Best for ground-truth visual inspection (no daily updates).',
    tileUrl: 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2023_3857/default/g/{z}/{y}/{x}.jpg',
    enabled: false,
    opacity: 1,
    icon: 'satellite',
    category: 'satellite-imagery',
    maxZoom: 14,
  },

  // ── Satellite Imagery: NASA VIIRS True Color ──
  {
    id: 'viirs-truecolor',
    name: 'VIIRS True Color (Daily)',
    description: 'Daily true-color imagery from Suomi NPP satellite. ~375m resolution. 1-day latency.',
    tileUrl: '',
    enabled: false,
    opacity: 0.8,
    icon: 'satellite',
    category: 'satellite-imagery',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'VIIRS_SNPP_CorrectedReflectance_TrueColor',
    gibsFormat: 'jpg',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level9',
    gibsSafeLagDays: 2,
    maxZoom: 9,
  },

  // ── TerraStream: Soil Moisture (SMAP) ──
  {
    id: 'smap-soil-moisture',
    name: 'Soil Moisture (SMAP)',
    description: 'NASA SMAP L4 root zone soil moisture at ~9km. Updated daily.',
    tileUrl: '',
    enabled: false,
    opacity: 0.65,
    icon: 'droplets',
    category: 'ocean',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'SMAP_L4_Analyzed_Root_Zone_Soil_Moisture',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level6',
    gibsUseDefaultTime: true,
    maxZoom: 6,
  },

  // ── TerraStream: NDVI Vegetation ──
  {
    id: 'modis-ndvi',
    name: 'Vegetation Index (NDVI)',
    description: 'MODIS Terra NDVI at ~250m. 16-day composite.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'leaf',
    category: 'land-surface',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    gibsLayerDay: 'MODIS_Terra_NDVI_8Day',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level9',
    gibsUseDefaultTime: true,
    maxZoom: 9,
  },

  // ── TerraStream: Nighttime Lights (Black Marble) ──
  {
    id: 'viirs-nightlights',
    name: 'Nighttime Lights (Black Marble)',
    description: 'VIIRS/NPP nighttime lights composite showing urban extent and energy use patterns.',
    tileUrl: '',
    enabled: false,
    opacity: 0.75,
    icon: 'building-2',
    category: 'risk',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    gibsLayerDay: 'VIIRS_Black_Marble',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level8',
    gibsDefaultDate: '2016-01-01',
    maxZoom: 8,
  },

  // ── TerraStream: Active Fires (GOES FireTemp – near real-time raster) ──
  // NOTE: NASA's VIIRS Thermal Anomalies products are MVT vector tiles and cannot
  // be rendered as a Mapbox raster source. We use NOAA GOES ABI FireTemp instead,
  // which provides true raster thermal/fire imagery refreshed every ~10 minutes.
  {
    id: 'viirs-fires',
    name: 'Active Fires (GOES FireTemp)',
    description: 'Near real-time thermal anomaly / fire detection from NOAA GOES-East (Americas) and GOES-West (Pacific). Updates ~every 10 minutes.',
    tileUrl: '',
    enabled: false,
    opacity: 0.95,
    icon: 'flame',
    category: 'risk',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'GOES-East_ABI_FireTemp',
    gibsLayerNight: 'GOES-West_ABI_FireTemp',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    gibsUseDefaultTime: true,
    maxZoom: 7,
    supportsDayNight: true,
    dayNightMode: 'day',
  },

  // ── TerraStream: Aerosol Optical Depth ──
  {
    id: 'modis-aod',
    name: 'Aerosol Optical Depth',
    description: 'MODIS Terra aerosol optical depth at 550nm. Indicator of air quality and atmospheric particulates.',
    tileUrl: '',
    enabled: false,
    opacity: 0.65,
    icon: 'wind',
    category: 'energy',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'MODIS_Terra_Aerosol_Optical_Depth_3km',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level6',
    gibsUseDefaultTime: true,
    maxZoom: 6,
    useWms: true,
  },

  // ── TerraStream: CERES Shortwave Flux (Solar) ──
  {
    id: 'ceres-swr',
    name: 'Solar Radiation Flux',
    description: 'CERES top-of-atmosphere shortwave radiation flux. Indicator of solar energy potential.',
    tileUrl: '',
    enabled: false,
    opacity: 0.6,
    icon: 'sun-medium',
    category: 'energy',
    supportsDateSelection: true,
    temporalResolution: 'monthly',
    gibsLayerDay: 'CERES_Combined_TOA_Shortwave_Flux_All_Sky_Monthly',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level6',
    gibsUseDefaultTime: true,
    maxZoom: 6,
    useWms: true,
  },

  // ── TerraStream: Flood / Surface Water ──
  {
    id: 'modis-flood',
    name: 'Surface Water Extent',
    description: 'MODIS near real-time surface water / flood detection at ~250m resolution.',
    tileUrl: '',
    enabled: false,
    opacity: 0.7,
    icon: 'waves',
    category: 'ocean',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'MODIS_Combined_Flood_3-Day',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level9',
    gibsUseDefaultTime: true,
    maxZoom: 9,
  },

  // ── TerraStream: Snow Cover ──
  {
    id: 'modis-snow-cover',
    name: 'Snow Cover Extent',
    description: 'MODIS Terra daily snow cover at ~500m. Shows fractional snow extent globally.',
    tileUrl: '',
    enabled: false,
    opacity: 0.65,
    icon: 'snowflake',
    category: 'temperature',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'MODIS_Terra_NDSI_Snow_Cover',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level8',
    maxZoom: 8,
  },

  // ── GIBS: MODIS Aqua True Color (afternoon pass, complements VIIRS) ──
  {
    id: 'modis-aqua-truecolor',
    name: 'MODIS Aqua True Color (Daily)',
    description: 'Daily true-color imagery from Aqua/MODIS at ~250m. Afternoon overpass complements VIIRS morning pass.',
    tileUrl: '',
    enabled: false,
    opacity: 0.85,
    icon: 'satellite',
    category: 'satellite-imagery',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'MODIS_Aqua_CorrectedReflectance_TrueColor',
    gibsFormat: 'jpg',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level9',
    maxZoom: 9,
  },

  // ── GIBS: MODIS Terra Bands 7-2-1 (burn scar / fire / smoke discrimination) ──
  {
    id: 'modis-terra-721',
    name: 'MODIS Bands 7-2-1 (Burn Scars)',
    description: 'False-color SWIR-NIR-R composite. Highlights active fires, burn scars, vegetation moisture and floods.',
    tileUrl: '',
    enabled: false,
    opacity: 0.9,
    icon: 'flame',
    category: 'risk',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'MODIS_Terra_CorrectedReflectance_Bands721',
    gibsFormat: 'jpg',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level9',
    maxZoom: 9,
  },

  // ── GIBS: OMI Aerosol Index (smoke / dust / volcanic ash plumes) ──
  {
    id: 'omi-aerosol-index',
    name: 'OMI Aerosol Index (Smoke/Dust)',
    description: 'Aura/OMI UV aerosol index. Detects absorbing aerosols: smoke plumes, mineral dust, volcanic ash.',
    tileUrl: '',
    enabled: false,
    opacity: 0.65,
    icon: 'wind',
    category: 'risk',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'OMI_Aerosol_Index',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level6',
    maxZoom: 6,
  },

  // ── GIBS: AIRS Surface Air Temperature ──
  {
    id: 'airs-surface-air-temp',
    name: 'AIRS Surface Air Temperature',
    description: 'Aqua/AIRS Level-3 gridded daily surface air temperature. Critical for heatwave and cold-snap emergency response.',
    tileUrl: '',
    enabled: false,
    opacity: 0.65,
    icon: 'thermometer',
    category: 'temperature',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'AIRS_L3_Surface_Air_Temperature_Daily_Day',
    gibsLayerNight: 'AIRS_L3_Surface_Air_Temperature_Daily_Night',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level6',
    gibsSafeLagDays: 5,
    maxZoom: 6,
    supportsDayNight: true,
    dayNightMode: 'day',
  },

  // ── NOAA GOES-East GeoColor (Near Real-Time, ~10 min refresh) ──
  {
    id: 'goes-east-geocolor',
    name: 'NOAA GOES-East GeoColor (Live)',
    description: 'Near real-time full-disk GeoColor from NOAA GOES-16. Americas & Atlantic. Refreshes ~every 10 minutes.',
    tileUrl: '',
    enabled: false,
    opacity: 1,
    icon: 'satellite',
    category: 'satellite-imagery',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'GOES-East_ABI_GeoColor',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    gibsSubDaily: true,
    maxZoom: 7,
  },

  // ── NOAA GOES-East Clean IR Band 13 (24/7 day+night) ──
  {
    id: 'goes-east-band13',
    name: 'NOAA GOES-East Clean IR (Live 24/7)',
    description: 'Real-time thermal infrared (Band 13) from NOAA GOES-16. Works day and night for storms, hurricanes, wildfires.',
    tileUrl: '',
    enabled: false,
    opacity: 0.9,
    icon: 'satellite',
    category: 'satellite-imagery',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'GOES-East_ABI_Band13_Clean_Infrared',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level6',
    gibsSubDaily: true,
    maxZoom: 6,
  },

  // ── NOAA GOES-West GeoColor (Near Real-Time, ~10 min refresh) ──
  {
    id: 'goes-west-geocolor',
    name: 'NOAA GOES-West GeoColor (Live)',
    description: 'Near real-time full-disk GeoColor from NOAA GOES-18. Pacific & western Americas. Refreshes ~every 10 minutes.',
    tileUrl: '',
    enabled: false,
    opacity: 1,
    icon: 'satellite',
    category: 'satellite-imagery',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'GOES-West_ABI_GeoColor',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    gibsSubDaily: true,
    maxZoom: 7,
  },

  // ── NOAA GOES-West Clean IR Band 13 (24/7 day+night) ──
  {
    id: 'goes-west-band13',
    name: 'NOAA GOES-West Clean IR (Live 24/7)',
    description: 'Real-time thermal infrared (Band 13) from NOAA GOES-18. Works day and night for typhoons, atmospheric rivers, wildfires.',
    tileUrl: '',
    enabled: false,
    opacity: 0.9,
    icon: 'satellite',
    category: 'satellite-imagery',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'GOES-West_ABI_Band13_Clean_Infrared',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level6',
    gibsSubDaily: true,
    maxZoom: 6,
  },

  // ── Himawari GeoColor (Near Real-Time, Asia-Pacific) ──
  {
    id: 'himawari-geocolor',
    name: 'Himawari GeoColor (Live ~10 min)',
    description: 'Near real-time full-disk GeoColor imagery from Himawari-9. Asia-Pacific. Refreshes ~every 10 minutes.',
    tileUrl: '',
    enabled: false,
    opacity: 1,
    icon: 'satellite',
    category: 'satellite-imagery',
    supportsDateSelection: true,
    temporalResolution: 'daily',
    gibsLayerDay: 'Himawari_AHI_Band3_Red_Visible_1km',
    gibsFormat: 'png',
    gibsTileMatrixSet: 'GoogleMapsCompatible_Level7',
    gibsSubDaily: true,
    gibsUseDefaultTime: true, // Himawari archive is limited; always serve latest available frame
    maxZoom: 7,
  },
];


// Dataset groups that consolidate multiple layers into single cards
const EARTH_DATASETS: EarthDataset[] = [
  // Land Surface (static, no temporal)
  {
    id: 'ds-elevation',
    name: 'ALOS Elevation (AW3D30)',
    description: 'Global ~30m DSM from ALOS "Daichi" satellite series (PRISM sensor)',
    icon: 'mountain',
    category: 'land-surface',
    enabled: false,
    opacity: 0.6,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'jaxa-aw3d30' },
  },
  {
    id: 'ds-hillshade',
    name: 'Land Surface Hillshade',
    description: 'Global terrain relief derived from ALOS/Mapzen ~30m elevation data',
    icon: 'sun-dim',
    category: 'land-surface',
    enabled: false,
    opacity: 0.5,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'jaxa-hillshade' },
  },
  // Precipitation
  {
    id: 'ds-precipitation',
    name: 'GSMaP Precipitation',
    description: 'Global precipitation data. Real-time radar (~10min updates) or monthly accumulated data since March 2000.',
    icon: 'cloud-rain',
    category: 'precipitation',
    enabled: false,
    opacity: 0.65,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: true,
    hasTimeline: true,
    layerIds: {
      realtime: 'gsmap-precipitation',
      dayMonthly: 'gsmap-precipitation-monthly',
    },
  },
  // Temperature
  {
    id: 'ds-lst',
    name: 'Land Surface Temperature',
    description: 'LST observed by GCOM-C "SHIKISAI" (~5km). Clouds cause data gaps. Daytime ~10:30am, nighttime ~10:30pm local time.',
    icon: 'thermometer',
    category: 'temperature',
    enabled: false,
    opacity: 0.7,
    hasDayNight: true,
    hasDaily: true,
    hasMonthly: true,
    hasTimeline: false,
    layerIds: {
      dayMonthly: 'lst-day-monthly',
      nightMonthly: 'lst-night-monthly',
      dayDaily: 'lst-day-daily',
      nightDaily: 'lst-night-daily',
    },
  },
  // Ocean SST GCOM-C
  {
    id: 'ds-sst-gcomc',
    name: 'SST (GCOM-C)',
    description: 'Sea surface temperature by GCOM-C "SHIKISAI" (~250m coastal). Cloud gaps possible. Daytime ~10:30am, nighttime ~10:30pm.',
    icon: 'waves',
    category: 'ocean',
    enabled: false,
    opacity: 0.7,
    hasDayNight: true,
    hasDaily: true,
    hasMonthly: true,
    hasTimeline: false,
    layerIds: {
      dayMonthly: 'sst-gcomc-day-monthly',
      nightMonthly: 'sst-gcomc-night-monthly',
      dayDaily: 'sst-gcomc-day-daily',
      nightDaily: 'sst-gcomc-night-daily',
    },
  },
  // Ocean SST GCOM-W (daily only)
  {
    id: 'ds-sst-gcomw',
    name: 'SST (GCOM-W)',
    description: 'SST by GCOM-W "SHIZUKU". Observes through clouds. 5-day moving average. Missing near coast. Daytime ~1:30pm, nighttime ~1:30am.',
    icon: 'waves',
    category: 'ocean',
    enabled: false,
    opacity: 0.7,
    hasDayNight: true,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: {
      dayDaily: 'sst-gcomw-day-daily',
      nightDaily: 'sst-gcomw-night-daily',
    },
  },
  // Weather
  {
    id: 'ds-snow-radar',
    name: 'Snow Radar',
    description: 'Live snow and mixed precipitation radar overlay from global weather radar network. Updates every ~10 minutes.',
    icon: 'snowflake',
    category: 'weather',
    enabled: false,
    opacity: 0.7,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: false,
    hasTimeline: true,
    layerIds: { realtime: 'rainviewer-snow' },
  },
  {
    id: 'ds-lightning',
    name: 'Lightning Strikes',
    description: 'Real-time lightning detection from Blitzortung global sensor network. Displays strikes from the past 20 minutes.',
    icon: 'zap',
    category: 'weather',
    enabled: false,
    opacity: 0.8,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'blitzortung-lightning' },
  },
  {
    id: 'ds-hurricane',
    name: 'Active Hurricanes',
    description: 'NOAA National Hurricane Center active tropical cyclone tracks, forecast cones, and wind radii. Updated every 6 hours.',
    icon: 'hurricane',
    category: 'weather',
    enabled: false,
    opacity: 0.85,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'noaa-hurricane' },
  },
  // Seismic
  {
    id: 'ds-earthquakes',
    name: 'Earthquakes (USGS)',
    description: 'Real-time seismic activity worldwide. Shows all M2.5+ events from the past 24 hours with magnitude-scaled markers. Data from USGS.',
    icon: 'activity',
    category: 'seismic',
    enabled: false,
    opacity: 0.9,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'usgs-earthquakes' },
  },
  // Satellite Imagery
  {
    id: 'ds-sentinel2-hd',
    name: 'Sentinel-2 HD (Cloudless 2023)',
    description: 'High-resolution (~10m) cloudless mosaic from ESA Sentinel-2. Crisp ground imagery up to street level.',
    icon: 'satellite',
    category: 'satellite-imagery',
    enabled: false,
    opacity: 1,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'sentinel2-cloudless-2023' },
  },
  {
    id: 'ds-viirs',
    name: 'VIIRS True Color',
    description: 'Daily true-color satellite imagery from Suomi NPP at ~375m resolution. Free from NASA GIBS. 1-day latency.',
    icon: 'satellite',
    category: 'satellite-imagery',
    enabled: false,
    opacity: 0.8,
    hasDayNight: false,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { dayDaily: 'viirs-truecolor' },
  },

  // ═══════════════════════════════════════════
  // TerraStream Intelligence Datasets
  // ═══════════════════════════════════════════

  // ── Climate → Climate Trends ──
  {
    id: 'ts-climate-trends',
    name: 'Climate Trends (LST Evolution)',
    description: 'Long-term land surface temperature evolution patterns. Derived from MODIS monthly composites.',
    icon: 'thermometer',
    category: 'temperature',
    subcategory: 'climate-trends',
    isTerraStream: true,
    enabled: false,
    opacity: 0.7,
    hasDayNight: true,
    hasDaily: false,
    hasMonthly: true,
    hasTimeline: false,
    layerIds: { dayMonthly: 'lst-day-monthly', nightMonthly: 'lst-night-monthly' },
  },
  {
    id: 'ts-snow-cover',
    name: 'Snow Cover Dynamics',
    description: 'Daily MODIS snow cover extent tracking seasonal patterns and anomalies.',
    icon: 'snowflake',
    category: 'temperature',
    subcategory: 'climate-trends',
    isTerraStream: true,
    enabled: false,
    opacity: 0.65,
    hasDayNight: false,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { dayDaily: 'modis-snow-cover' },
  },

  // ── Climate → Precipitation Intelligence ──
  {
    id: 'ts-precip-patterns',
    name: 'Precipitation Patterns',
    description: 'Monthly rainfall accumulation patterns for identifying drought signals and wet anomalies.',
    icon: 'cloud-rain',
    category: 'precipitation',
    subcategory: 'precipitation-intelligence',
    isTerraStream: true,
    enabled: false,
    opacity: 0.65,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: true,
    hasTimeline: false,
    layerIds: { dayMonthly: 'gsmap-precipitation-monthly' },
  },

  // ── Climate → Extreme Events ──
  {
    id: 'ts-extreme-storms',
    name: 'Storm & Cyclone Tracking',
    description: 'Active tropical cyclone tracks, forecast cones, and severe storm analysis.',
    icon: 'hurricane',
    category: 'weather',
    subcategory: 'extreme-events',
    isTerraStream: true,
    enabled: false,
    opacity: 0.85,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'noaa-hurricane' },
  },

  // ── Water Systems → Soil Moisture ──
  {
    id: 'ts-soil-moisture',
    name: 'Soil Moisture Intelligence',
    description: 'NASA SMAP L4 root zone soil moisture at ~9km resolution. Critical for agriculture and drought monitoring.',
    icon: 'droplets',
    category: 'ocean',
    subcategory: 'soil-moisture',
    isTerraStream: true,
    enabled: false,
    opacity: 0.65,
    hasDayNight: false,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { dayDaily: 'smap-soil-moisture' },
  },

  // ── Water Systems → Flood Risk ──
  {
    id: 'ts-flood-risk',
    name: 'Flood Risk Zones',
    description: 'Near real-time surface water and flood detection from MODIS at ~250m resolution.',
    icon: 'waves',
    category: 'ocean',
    subcategory: 'flood-risk',
    isTerraStream: true,
    enabled: false,
    opacity: 0.7,
    hasDayNight: false,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { dayDaily: 'modis-flood' },
  },

  // ── Land & Agriculture → Vegetation Health ──
  {
    id: 'ts-vegetation-health',
    name: 'Vegetation Health Index',
    description: 'MODIS NDVI vegetation index at ~250m. Tracks plant health, crop vigor, and desertification risk.',
    icon: 'leaf',
    category: 'land-surface',
    subcategory: 'vegetation-health',
    isTerraStream: true,
    enabled: false,
    opacity: 0.7,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: true,
    hasTimeline: false,
    layerIds: { dayMonthly: 'modis-ndvi' },
  },

  // ── Energy & Resources → Solar Exposure ──
  {
    id: 'ts-solar-exposure',
    name: 'Solar Exposure Mapping',
    description: 'CERES shortwave radiation flux. Indicates solar energy potential across regions.',
    icon: 'sun-medium',
    category: 'energy',
    subcategory: 'solar-exposure',
    isTerraStream: true,
    enabled: false,
    opacity: 0.6,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: true,
    hasTimeline: false,
    layerIds: { dayMonthly: 'ceres-swr' },
  },

  // ── Energy & Resources → Environmental Constraints ──
  {
    id: 'ts-env-constraints',
    name: 'Environmental Constraints',
    description: 'Aerosol optical depth indicating air quality, particulates, and atmospheric constraints on renewable energy.',
    icon: 'wind',
    category: 'energy',
    subcategory: 'environmental-constraints',
    isTerraStream: true,
    enabled: false,
    opacity: 0.65,
    hasDayNight: false,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { dayDaily: 'modis-aod' },
  },

  // ── Built Environment & Risk → Urban Expansion ──
  {
    id: 'ts-urban-expansion',
    name: 'Urban Expansion Patterns',
    description: 'VIIRS Black Marble nighttime lights. Reveals urban growth, energy consumption, and infrastructure development.',
    icon: 'building-2',
    category: 'risk',
    subcategory: 'urban-expansion',
    isTerraStream: true,
    enabled: false,
    opacity: 0.75,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: true,
    hasTimeline: false,
    layerIds: { dayMonthly: 'viirs-nightlights' },
  },

  // ── Built Environment & Risk → Hazard Mapping ──
  {
    id: 'ts-hazard-mapping',
    name: 'Hazard Mapping (Fires)',
    description: 'Near real-time active fire and thermal anomaly detection for wildfire risk assessment.',
    icon: 'flame',
    category: 'risk',
    subcategory: 'hazard-mapping',
    isTerraStream: true,
    enabled: false,
    opacity: 0.85,
    hasDayNight: true,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { dayDaily: 'viirs-fires', nightDaily: 'viirs-fires' },
  },

  // ── Built Environment & Risk → Climate Risk Index ──
  {
    id: 'ts-climate-risk',
    name: 'Seismic Risk Index',
    description: 'Earthquake magnitude and frequency mapping for infrastructure risk assessment.',
    icon: 'shield-alert',
    category: 'risk',
    subcategory: 'climate-risk-index',
    isTerraStream: true,
    enabled: false,
    opacity: 0.9,
    hasDayNight: false,
    hasDaily: false,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'usgs-earthquakes' },
  },

  // ═══════════════════════════════════════════
  // NASA GIBS — Emergency Response Layers
  // https://nasa-gibs.github.io/gibs-api-docs/
  // ═══════════════════════════════════════════
  {
    id: 'ds-modis-aqua-truecolor',
    name: 'MODIS Aqua True Color',
    description: 'Daily NASA GIBS afternoon true-color imagery (~250m). Complements VIIRS for damage assessment.',
    icon: 'satellite',
    category: 'satellite-imagery',
    enabled: false,
    opacity: 0.85,
    hasDayNight: false,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { dayDaily: 'modis-aqua-truecolor' },
  },
  {
    id: 'ds-modis-721',
    name: 'Burn Scars & Fire (Bands 7-2-1)',
    description: 'NASA GIBS MODIS SWIR-NIR-R false color. Wildfires glow red-orange, burn scars are crimson, vegetation green.',
    icon: 'flame',
    category: 'risk',
    subcategory: 'hazard-mapping',
    isTerraStream: true,
    enabled: false,
    opacity: 0.9,
    hasDayNight: false,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { dayDaily: 'modis-terra-721' },
  },
  {
    id: 'ds-omi-aerosol',
    name: 'Smoke, Dust & Ash (OMI)',
    description: 'NASA GIBS Aura/OMI UV aerosol index. Tracks wildfire smoke plumes, Saharan dust transport, and volcanic ash.',
    icon: 'wind',
    category: 'risk',
    subcategory: 'hazard-mapping',
    isTerraStream: true,
    enabled: false,
    opacity: 0.7,
    hasDayNight: false,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { dayDaily: 'omi-aerosol-index' },
  },
  {
    id: 'ds-airs-air-temp',
    name: 'Surface Air Temperature (AIRS)',
    description: 'NASA GIBS Aqua/AIRS Level-3 gridded daily surface air temperature for heatwave & cold-snap response planning.',
    icon: 'thermometer',
    category: 'temperature',
    enabled: false,
    opacity: 0.65,
    hasDayNight: true,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { dayDaily: 'airs-surface-air-temp', nightDaily: 'airs-surface-air-temp' },
  },

  // ═══════════════════════════════════════════
  // NASA GIBS — Live Geostationary Satellites (~10 min refresh)
  // ═══════════════════════════════════════════
  {
    id: 'ds-goes-east-live',
    name: 'NOAA GOES-East Live (Americas)',
    description: 'Real-time GeoColor from NOAA GOES-16 (Americas & Atlantic). Refreshes every ~2 minutes via NASA GIBS.',
    icon: 'satellite',
    category: 'satellite-imagery',
    enabled: false,
    opacity: 1,
    hasDayNight: false,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'goes-east-geocolor' },
  },
  {
    id: 'ds-goes-east-band13',
    name: 'NOAA GOES-East Clean IR (24/7)',
    description: 'Real-time thermal infrared (Band 13) from NOAA GOES-16. Tracks storms, hurricanes & fires day and night.',
    icon: 'satellite',
    category: 'satellite-imagery',
    enabled: false,
    opacity: 0.9,
    hasDayNight: false,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'goes-east-band13' },
  },
  {
    id: 'ds-goes-west-live',
    name: 'NOAA GOES-West Live (Pacific)',
    description: 'Real-time GeoColor from NOAA GOES-18 (Pacific & western Americas). Refreshes every ~2 minutes via NASA GIBS.',
    icon: 'satellite',
    category: 'satellite-imagery',
    enabled: false,
    opacity: 1,
    hasDayNight: false,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'goes-west-geocolor' },
  },
  {
    id: 'ds-goes-west-band13',
    name: 'NOAA GOES-West Clean IR (24/7)',
    description: 'Real-time thermal infrared (Band 13) from NOAA GOES-18. Tracks typhoons, atmospheric rivers & fires day and night.',
    icon: 'satellite',
    category: 'satellite-imagery',
    enabled: false,
    opacity: 0.9,
    hasDayNight: false,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'goes-west-band13' },
  },
  {
    id: 'ds-himawari-live',
    name: 'Himawari Live (Asia-Pacific)',
    description: 'Near real-time imagery from Himawari-9 covering Asia, Australia and the western Pacific. Updates every ~10 minutes via NASA GIBS.',
    icon: 'satellite',
    category: 'satellite-imagery',
    enabled: false,
    opacity: 1,
    hasDayNight: false,
    hasDaily: true,
    hasMonthly: false,
    hasTimeline: false,
    layerIds: { static: 'himawari-geocolor' },
  },
];


const ALLOWED_EMAIL = 'ceo@imagineengine.space';
const EARTH_ACCESS_TIERS = ['self_paced_office', 'global_access', 'corporate'];

export interface GibsTime {
  hour: number;
  minute: number;
}

// Format date for GIBS URL
const formatGibsDate = (date: Date, time?: GibsTime): string => {
  const base = date.toISOString().split('T')[0];
  if (!time) return base;
  const hh = String(time.hour).padStart(2, '0');
  const mm = String(time.minute).padStart(2, '0');
  return `${base}T${hh}:${mm}:00Z`;
};

// Resolve which underlying layer ID to use given current temporal/daynight settings
const resolveLayerId = (
  dataset: EarthDataset,
  temporalMode: TemporalMode,
  dayNightMode: DayNightMode,
  precipMode: 'realtime' | 'monthly',
): string | null => {
  // Static layers (elevation, hillshade)
  if (dataset.layerIds.static) return dataset.layerIds.static;

  // Precipitation special case
  if (dataset.hasTimeline) {
    if (precipMode === 'realtime') return dataset.layerIds.realtime || null;
    return dataset.layerIds.dayMonthly || null;
  }

  // Temporal layers
  const mode = temporalMode;
  const dn = dayNightMode;
  if (mode === 'monthly' && dataset.hasMonthly) {
    return dn === 'night' && dataset.hasDayNight
      ? dataset.layerIds.nightMonthly || dataset.layerIds.dayMonthly || null
      : dataset.layerIds.dayMonthly || null;
  }
  if (mode === 'daily' && dataset.hasDaily) {
    return dn === 'night' && dataset.hasDayNight
      ? dataset.layerIds.nightDaily || dataset.layerIds.dayDaily || null
      : dataset.layerIds.dayDaily || null;
  }
  // Fallback: try daily then monthly
  if (dataset.hasDaily) {
    return dn === 'night' ? dataset.layerIds.nightDaily || dataset.layerIds.dayDaily || null : dataset.layerIds.dayDaily || null;
  }
  if (dataset.hasMonthly) {
    return dn === 'night' ? dataset.layerIds.nightMonthly || dataset.layerIds.dayMonthly || null : dataset.layerIds.dayMonthly || null;
  }
  return null;
};

export const useEarthIntelligence = (map: mapboxgl.Map | null, mapReady: boolean) => {
  const { user } = useAuth();
  const { tier } = useMembershipStatus();
  const [earthLayers, setEarthLayers] = useState<EarthLayer[]>(STATIC_EARTH_LAYERS);
  const [datasets, setDatasets] = useState<EarthDataset[]>(EARTH_DATASETS);
  const hasAccess = true; // All features unlocked

  // Global temporal controls
  const [temporalMode, setTemporalMode] = useState<TemporalMode>('daily');
  const [dayNightMode, setDayNightMode] = useState<DayNightMode>('day');
  const [precipMode, setPrecipMode] = useState<'realtime' | 'monthly'>('realtime');

  // Global date selection for date-sensitive layers
  // Default to today (UTC). Geostationary layers (NOAA GOES) update in near real-time;
  // GIBS layers will gracefully fall back via Jump to Latest if today is unavailable.
  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  });
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    const now = new Date();
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  });
  const [selectedTime, setSelectedTime] = useState<GibsTime>({ hour: 12, minute: 0 });

  // Precipitation timeline state
  const [precipFrames, setPrecipFrames] = useState<PrecipitationFrame[]>([]);
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const playIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rainviewerHost = useRef('https://tilecache.rainviewer.com');

  // RainViewer satellite frames
  const [satelliteFrames, setSatelliteFrames] = useState<PrecipitationFrame[]>([]);
  const [satFrameIndex, setSatFrameIndex] = useState(0);

  // Live refresh tick for near real-time geostationary layers (NOAA GOES/Himawari) — bumps every 2 minutes
  const [liveTick, setLiveTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setLiveTick((n) => n + 1), 2 * 60 * 1000);
    return () => clearInterval(t);
  }, []);


  // Fetch RainViewer frames on mount (radar + satellite)
  useEffect(() => {
    const fetchFrames = async () => {
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json');
        const data = await res.json();
        if (data.host) rainviewerHost.current = data.host;
        const frames: PrecipitationFrame[] = [
          ...(data.radar?.past || []),
          ...(data.radar?.nowcast || []),
        ];
        setPrecipFrames(frames);
        if (frames.length > 0) {
          const pastCount = data.radar?.past?.length || frames.length;
          setCurrentFrameIndex(Math.max(0, pastCount - 1));
        }
        // Satellite IR frames
        const satFrames: PrecipitationFrame[] = [
          ...(data.satellite?.infrared?.past || []),
        ];
        setSatelliteFrames(satFrames);
        if (satFrames.length > 0) {
          setSatFrameIndex(satFrames.length - 1);
        }
      } catch (err) {
        console.error('Failed to fetch precipitation frames:', err);
      }
    };
    fetchFrames();
    const interval = setInterval(fetchFrames, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Build the current tile URL for precipitation
  const getPrecipTileUrl = useCallback(() => {
    if (precipFrames.length === 0) return '';
    const frame = precipFrames[currentFrameIndex];
    if (!frame) return '';
    return `${rainviewerHost.current}${frame.path}/256/{z}/{x}/{y}/6/1_1.png`;
  }, [precipFrames, currentFrameIndex]);

  // Build tile URL for snow radar (same RainViewer frames, different color scheme #2=snow)
  const getSnowTileUrl = useCallback(() => {
    if (precipFrames.length === 0) return '';
    const frame = precipFrames[currentFrameIndex];
    if (!frame) return '';
    return `${rainviewerHost.current}${frame.path}/256/{z}/{x}/{y}/2/1_1.png`;
  }, [precipFrames, currentFrameIndex]);

  // Build tile URL for satellite IR
  const getSatelliteTileUrl = useCallback(() => {
    if (satelliteFrames.length === 0) return '';
    const frame = satelliteFrames[satFrameIndex];
    if (!frame) return '';
    return `${rainviewerHost.current}${frame.path}/256/{z}/{x}/{y}/0/0_0.png`;
  }, [satelliteFrames, satFrameIndex]);

  // Build tile URL for a date-sensitive GIBS layer
  const getGibsTileUrl = useCallback((layer: EarthLayer) => {
    if (!layer.gibsLayerDay) return '';
    // For sub-daily geostationary layers (GOES/Himawari), GIBS only publishes
    // every ~10 min and recent slots have gaps. When the user is on today (UTC),
    // request the 'default' time so we always get the freshest available frame.
    let date: string;
    if (layer.gibsDefaultDate) {
      date = layer.gibsDefaultDate;
    } else if (layer.gibsUseDefaultTime) {
      date = 'default';
    } else if (layer.temporalResolution === 'monthly') {
      // Monthly composites (e.g. MODIS L3 LST) are published with a 1-2 month lag and
      // the most recent month is often still being assembled — producing the characteristic
      // diagonal white swath stripes. To guarantee a fully assembled frame, always step back
      // to a safe month: if the user picked the current/future month, fall back to two months
      // prior; otherwise honor the selection but never request 'default'.
      const now = new Date();
      const isCurrentOrFutureMonth =
        selectedMonth.getUTCFullYear() > now.getUTCFullYear() ||
        (selectedMonth.getUTCFullYear() === now.getUTCFullYear() && selectedMonth.getUTCMonth() >= now.getUTCMonth());
      if (isCurrentOrFutureMonth) {
        const safe = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 2, 1));
        date = formatGibsDate(safe);
      } else {
        date = formatGibsDate(selectedMonth);
      }
    } else if (layer.gibsSubDaily) {
      const now = new Date();
      const todayUtc = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}-${String(now.getUTCDate()).padStart(2, '0')}`;
      const selUtc = formatGibsDate(selectedDate);
      date = selUtc === todayUtc ? 'default' : formatGibsDate(selectedDate, selectedTime);
    } else {
      // Daily polar-orbit layers have orbit-by-orbit swath gaps until processing completes.
      // Some products (AIRS L3) publish fully gridded composites several days behind real time,
      // so clamp recent selections to a layer-specific safe day instead of drawing broken swaths.
      const now = new Date();
      const safeLagDays = layer.gibsSafeLagDays ?? 1;
      const safeDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - safeLagDays));
      if (selectedDate.getTime() > safeDate.getTime()) {
        date = formatGibsDate(safeDate);
      } else {
        date = formatGibsDate(selectedDate);
      }
    }
    const gibsLayer = layer.dayNightMode === 'night' && layer.gibsLayerNight
      ? layer.gibsLayerNight
      : layer.gibsLayerDay;
    if (layer.useWms) {
      return buildGibsWmsUrl(gibsLayer, date);
    }
    return buildGibsUrl(gibsLayer, date, layer.gibsTileMatrixSet, layer.gibsFormat);
  }, [selectedDate, selectedMonth, selectedTime]);

  // Add USGS earthquakes as GeoJSON layer (via edge function proxy to avoid CORS)
  const addEarthquakeLayer = useCallback(async (opacity: number) => {
    if (!map || !mapReady || !isMapStyleReady(map)) return;
    try {
      const res = await fetch('https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/earthquake-data', { signal: AbortSignal.timeout(15000) });
      const data = await res.json();
      if (!isMapStyleReady(map)) return;
      const sourceId = 'usgs-earthquakes';
      const layerId = 'usgs-earthquakes-layer';
      const labelId = 'usgs-earthquakes-labels';
      safeRemoveMapLayer(map, labelId);
      safeRemoveMapLayer(map, layerId);
      safeRemoveMapSource(map, sourceId);
      map.addSource(sourceId, { type: 'geojson', data });
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['get', 'mag'], 2.5, 4, 5, 12, 7, 24, 9, 40],
          'circle-color': ['interpolate', ['linear'], ['get', 'mag'], 2.5, '#fde047', 4, '#fb923c', 5.5, '#ef4444', 7, '#dc2626', 8, '#7f1d1d'],
          'circle-opacity': opacity,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      });
      map.addLayer({
        id: labelId,
        type: 'symbol',
        source: sourceId,
        layout: {
          'text-field': ['concat', 'M', ['to-string', ['round', ['get', 'mag']]]],
          'text-size': 10,
          'text-offset': [0, -1.5],
        },
        paint: { 'text-color': '#ffffff', 'text-halo-color': '#000000', 'text-halo-width': 1 },
      });
    } catch (err) {
      console.error('Failed to load earthquake data:', err);
    }
  }, [map, mapReady]);

  // Add lightning strikes via edge function proxy
  const addLightningLayer = useCallback(async (opacity: number) => {
    if (!map || !mapReady || !isMapStyleReady(map)) return;
    try {
      const res = await fetch(
        `https://zqiihhmdsdgwdcwmryym.supabase.co/functions/v1/lightning-data`,
        { signal: AbortSignal.timeout(15000) }
      );
      const data = await res.json();
      if (!isMapStyleReady(map)) return;
      const sourceId = 'blitzortung-lightning';
      const layerId = 'blitzortung-lightning-layer';
      safeRemoveMapLayer(map, layerId);
      safeRemoveMapSource(map, sourceId);
      map.addSource(sourceId, { type: 'geojson', data });
      map.addLayer({
        id: layerId,
        type: 'circle',
        source: sourceId,
        paint: {
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 2, 2, 6, 4, 10, 6],
          'circle-color': ['interpolate', ['linear'], ['get', 'age'],
            0, '#ffff00',  // fresh = bright yellow
            5, '#ff8800',  // 5 min = orange
            10, '#ff4400', // 10 min = red-orange
            20, '#cc0000', // 20 min = dark red
          ],
          'circle-opacity': opacity,
          'circle-stroke-width': 0.5,
          'circle-stroke-color': '#ffffff',
          'circle-blur': 0.3,
        },
      });
    } catch (err) {
      console.error('Failed to load lightning data:', err);
    }
  }, [map, mapReady]);

  // Add NOAA hurricane tracks via ArcGIS Feature Service (CORS-friendly)
  const addHurricaneLayer = useCallback(async (opacity: number) => {
    if (!map || !mapReady || !isMapStyleReady(map)) return;
    try {
      const emptyGeoJson = { type: 'FeatureCollection' as const, features: [] as any[] };
      const layerIds = ['noaa-hurricane-labels', 'noaa-hurricane-cones-layer', 'noaa-hurricane-tracks-layer', 'noaa-hurricane-layer'];
      const sourceIds = ['noaa-hurricane-cones', 'noaa-hurricane-tracks', 'noaa-hurricane'];
      layerIds.forEach(id => safeRemoveMapLayer(map, id));
      sourceIds.forEach(id => safeRemoveMapSource(map, id));

      // Query ArcGIS Active Hurricanes feature service directly.
      // (Skip the nhc.noaa.gov pre-check — it has flaky CORS and would zero-out
      // the layer even when ArcGIS has active storms.)
      // Layer indices per the FeatureServer schema:
      //   0 = Forecast Position (points)
      //   2 = Forecast Track (polylines)
      //   4 = Forecast Error Cone (polygons)  ← was wrongly set to 3 (Observed Track lines)
      const baseUrl = 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Active_Hurricanes_v1/FeatureServer';

      const [pointsRes, tracksRes, conesRes] = await Promise.all([
        fetch(`${baseUrl}/0/query?where=1=1&f=geojson&outFields=*&outSR=4326`, { signal: AbortSignal.timeout(10000) }).catch(() => null),
        fetch(`${baseUrl}/2/query?where=1=1&f=geojson&outFields=*&outSR=4326`, { signal: AbortSignal.timeout(10000) }).catch(() => null),
        fetch(`${baseUrl}/4/query?where=1=1&f=geojson&outFields=*&outSR=4326`, { signal: AbortSignal.timeout(10000) }).catch(() => null),
      ]);

      let pointsData: any = emptyGeoJson;
      let tracksData: any = emptyGeoJson;
      let conesData: any = emptyGeoJson;

      if (conesRes?.ok) try { conesData = await conesRes.json(); } catch {}
      if (tracksRes?.ok) try { tracksData = await tracksRes.json(); } catch {}
      if (pointsRes?.ok) try { pointsData = await pointsRes.json(); } catch {}

      const featureCount =
        (pointsData?.features?.length || 0) +
        (tracksData?.features?.length || 0) +
        (conesData?.features?.length || 0);
      console.log(`[Hurricanes] Loaded ${featureCount} features (points/tracks/cones)`);

      if (!isMapStyleReady(map)) return;

      // Add forecast cones (semi-transparent fill)
      map.addSource('noaa-hurricane-cones', { type: 'geojson', data: conesData });
      map.addLayer({
        id: 'noaa-hurricane-cones-layer',
        type: 'fill',
        source: 'noaa-hurricane-cones',
        paint: {
          'fill-color': '#a855f7',
          'fill-opacity': opacity * 0.2,
          'fill-outline-color': '#a855f7',
        },
      });

      // Add forecast tracks (dashed lines)
      map.addSource('noaa-hurricane-tracks', { type: 'geojson', data: tracksData });
      map.addLayer({
        id: 'noaa-hurricane-tracks-layer',
        type: 'line',
        source: 'noaa-hurricane-tracks',
        paint: {
          'line-color': '#a855f7',
          'line-width': 2.5,
          'line-opacity': opacity,
          'line-dasharray': [3, 2],
        },
      });

      // Add storm points (circles sized by wind speed)
      map.addSource('noaa-hurricane', { type: 'geojson', data: pointsData });
      map.addLayer({
        id: 'noaa-hurricane-layer',
        type: 'circle',
        source: 'noaa-hurricane',
        paint: {
          'circle-radius': [
            'interpolate', ['linear'], ['coalesce', ['to-number', ['get', 'MAXWIND']], 30],
            30, 6, 64, 10, 95, 14, 130, 20,
          ],
          'circle-color': [
            'interpolate', ['linear'], ['coalesce', ['to-number', ['get', 'MAXWIND']], 30],
            30, '#60a5fa', 64, '#facc15', 95, '#fb923c', 115, '#ef4444', 140, '#7f1d1d',
          ],
          'circle-opacity': opacity,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });
      // Storm name labels
      map.addLayer({
        id: 'noaa-hurricane-labels',
        type: 'symbol',
        source: 'noaa-hurricane',
        layout: {
          'text-field': ['coalesce', ['get', 'STORMNAME'], ['get', 'stormname'], ['get', 'STORMTYPE'], ''],
          'text-size': 12,
          'text-offset': [0, 1.6],
          'text-anchor': 'top',
          'text-allow-overlap': false,
        },
        paint: { 'text-color': '#ffffff', 'text-halo-color': '#000000', 'text-halo-width': 1.5 },
      });
    } catch (err) {
      console.warn('Hurricane layer unavailable:', err);
    }
  }, [map, mapReady]);

  useEffect(() => {
    if (!map || !mapReady) return;

    const handleMapError = (event: any) => {
      const message = event?.error?.message || '';
      if (message.includes('gibs.earthdata.nasa.gov') || message.includes('tilecache.rainviewer.com')) {
        event?.preventDefault?.();
      }
    };

    map.on('error', handleMapError);
    return () => {
      map.off('error', handleMapError);
    };
  }, [map, mapReady]);

  const addEarthLayerToMap = useCallback((layer: EarthLayer) => {
    if (!map || !mapReady || !isMapStyleReady(map)) return;
    
    // Special handlers for non-raster layers
    if (layer.id === 'usgs-earthquakes') {
      addEarthquakeLayer(layer.opacity);
      return;
    }
    if (layer.id === 'noaa-hurricane') {
      addHurricaneLayer(layer.opacity);
      return;
    }
    if (layer.id === 'blitzortung-lightning') {
      addLightningLayer(layer.opacity);
      return;
    }
    
    let tileUrl: string;
    if (layer.id === 'gsmap-precipitation') {
      tileUrl = getPrecipTileUrl();
    } else if (layer.id === 'rainviewer-snow') {
      tileUrl = getSnowTileUrl();
    } else if (layer.id === 'rainviewer-satellite') {
      tileUrl = getSatelliteTileUrl();
    } else if (layer.supportsDateSelection && layer.gibsLayerDay) {
      tileUrl = getGibsTileUrl(layer);
    } else {
      tileUrl = layer.tileUrl;
    }
    if (!tileUrl) return;
    try {
      // Always upsert source to ensure fresh tile URLs (fixes stale MODIS/VIIRS/IR dates)
      const mapLayerIdCleanup = `${layer.id}-layer`;
      safeRemoveMapLayer(map, mapLayerIdCleanup);
      upsertRasterSource(map, layer.id, {
        tiles: [tileUrl],
        tileSize: 256,
        maxzoom: layer.maxZoom || 18,
      });
      const layerId = `${layer.id}-layer`;
      {
        // Insert raster imagery below symbol/circle/interactive layers
        const firstSymbolLayer = map.getStyle()?.layers?.find(
          (l: any) => l.type === 'symbol' || l.type === 'circle'
        );
        map.addLayer({
          id: layerId,
          type: 'raster',
          source: layer.id,
          paint: { 'raster-opacity': layer.opacity, 'raster-resampling': 'linear', 'raster-fade-duration': 200 },
          layout: { visibility: 'visible' },
        }, firstSymbolLayer?.id);
      }
    } catch (err) {
      console.error('Error adding earth layer:', err);
    }
  }, [map, mapReady, getPrecipTileUrl, getSnowTileUrl, getSatelliteTileUrl, getGibsTileUrl, addEarthquakeLayer, addHurricaneLayer, addLightningLayer]);

  // Update GIBS layers when date or time changes
  useEffect(() => {
    if (!map || !mapReady || !isMapStyleReady(map)) return;
    earthLayers.forEach(layer => {
      if (!layer.enabled || !layer.supportsDateSelection || !layer.gibsLayerDay) return;
      let tileUrl = getGibsTileUrl(layer);
      if (!tileUrl) return;
      // Cache-bust live "default/default" frames so Mapbox refetches every liveTick (2 min)
      if (tileUrl.includes('/default/default/')) {
        const bucket = Math.floor(Date.now() / (2 * 60 * 1000));
        tileUrl += (tileUrl.includes('?') ? '&' : '?') + `_v=${bucket}`;
      }
      const sourceId = layer.id;
      const layerId = `${layer.id}-layer`;
      try {
        safeRemoveMapLayer(map, layerId);
        upsertRasterSource(map, sourceId, {
          tiles: [tileUrl],
          tileSize: 256,
          maxzoom: layer.maxZoom || 18,
        });
        const firstSymbolLayer = map.getStyle()?.layers?.find(
          (l: any) => l.type === 'symbol' || l.type === 'circle'
        );
        map.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: { 'raster-opacity': layer.opacity, 'raster-resampling': 'linear', 'raster-fade-duration': 200 },
          layout: { visibility: 'visible' },
        }, firstSymbolLayer?.id);
      } catch (err) {
        console.error('Error updating GIBS layer:', err);
      }
    });
  }, [selectedDate, selectedMonth, selectedTime, liveTick, mapReady]);

  // Update precipitation/snow/satellite tiles when frame changes
  useEffect(() => {
    if (!map || !mapReady || !isMapStyleReady(map)) return;
    
    const updateRasterFrame = (layerConfigId: string, tileUrl: string) => {
      const layer = earthLayers.find(l => l.id === layerConfigId);
      if (!layer?.enabled || !tileUrl) return;
      const sourceId = layerConfigId;
      const layerId = `${layerConfigId}-layer`;
      try {
        safeRemoveMapLayer(map, layerId);
        upsertRasterSource(map, sourceId, { tiles: [tileUrl], tileSize: 256 });
        map.addLayer({
          id: layerId,
          type: 'raster',
          source: sourceId,
          paint: { 'raster-opacity': layer.opacity, 'raster-resampling': 'linear', 'raster-fade-duration': 200 },
          layout: { visibility: 'visible' },
        });
      } catch (err) {
        console.error(`Error updating ${layerConfigId} frame:`, err);
      }
    };

    updateRasterFrame('gsmap-precipitation', getPrecipTileUrl());
    updateRasterFrame('rainviewer-snow', getSnowTileUrl());
    updateRasterFrame('rainviewer-satellite', getSatelliteTileUrl());
  }, [currentFrameIndex, satFrameIndex, precipFrames, satelliteFrames, mapReady]);

  // Animation playback
  useEffect(() => {
    if (isPlaying && precipFrames.length > 0) {
      playIntervalRef.current = setInterval(() => {
        setCurrentFrameIndex(prev => (prev + 1) % precipFrames.length);
      }, 700);
    } else if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current);
      playIntervalRef.current = null;
    }
    return () => {
      if (playIntervalRef.current) clearInterval(playIntervalRef.current);
    };
  }, [isPlaying, precipFrames.length]);

  // Ref to avoid circular deps in callbacks
  const earthLayersRef = useRef(earthLayers);
  earthLayersRef.current = earthLayers;

  // Helper: disable a specific underlying layer on the map
  const disableLayerOnMap = useCallback((layerId: string) => {
    if (!map || !mapReady || !isMapStyleReady(map)) return;
    const mapLayerId = `${layerId}-layer`;
    try {
      // Handle extra layers (earthquake labels)
      if (layerId === 'usgs-earthquakes') {
        safeRemoveMapLayer(map, 'usgs-earthquakes-labels');
      }
      // Handle hurricane sub-layers (cones, tracks)
      if (layerId === 'noaa-hurricane') {
        ['noaa-hurricane-cones-layer', 'noaa-hurricane-tracks-layer'].forEach(id => {
          safeRemoveMapLayer(map, id);
        });
        ['noaa-hurricane-cones', 'noaa-hurricane-tracks'].forEach(id => {
          safeRemoveMapSource(map, id);
        });
      }
      // Try visibility toggle first, then fallback to full removal
      if (safeGetMapLayer(map, mapLayerId)) {
        try {
          map.setLayoutProperty(mapLayerId, 'visibility', 'none');
        } catch {
          // Fallback: fully remove the layer and source
          safeRemoveMapLayer(map, mapLayerId);
          safeRemoveMapSource(map, layerId);
        }
      }
    } catch {}
    setEarthLayers(prev => prev.map(l => l.id === layerId ? { ...l, enabled: false } : l));
  }, [map, mapReady]);

  // Helper: enable a specific underlying layer on the map
  const enableLayerOnMap = useCallback((layerId: string, opacity: number) => {
    if (!map || !mapReady || !isMapStyleReady(map)) return;
    const layer = earthLayersRef.current.find(l => l.id === layerId);
    if (!layer) return;
    const mapLayerId = `${layerId}-layer`;
    const updatedLayer = { ...layer, enabled: true, opacity };
    // For GeoJSON-based layers (earthquakes, hurricanes, lightning), always re-add fresh
    const isGeoJsonLayer = ['usgs-earthquakes', 'noaa-hurricane', 'blitzortung-lightning'].includes(layerId);
    if (isGeoJsonLayer || !safeGetMapSource(map, layerId)) {
      addEarthLayerToMap(updatedLayer);
    } else if (safeGetMapLayer(map, mapLayerId)) {
      map.setLayoutProperty(mapLayerId, 'visibility', 'visible');
      try { map.setPaintProperty(mapLayerId, 'raster-opacity', opacity); } catch {}
    }
    setEarthLayers(prev => prev.map(l => l.id === layerId ? { ...l, enabled: true, opacity } : l));
  }, [map, mapReady, addEarthLayerToMap]);

  // Get all underlying layer IDs for a dataset
  const getAllLayerIdsForDataset = useCallback((dataset: EarthDataset): string[] => {
    const ids: string[] = [];
    const li = dataset.layerIds;
    if (li.static) ids.push(li.static);
    if (li.realtime) ids.push(li.realtime);
    if (li.dayMonthly) ids.push(li.dayMonthly);
    if (li.nightMonthly) ids.push(li.nightMonthly);
    if (li.dayDaily) ids.push(li.dayDaily);
    if (li.nightDaily) ids.push(li.nightDaily);
    return ids;
  }, []);

  // Toggle a dataset on/off
  const toggleDataset = useCallback((datasetId: string) => {
    setDatasets(prev => {
      const ds = prev.find(d => d.id === datasetId);
      if (!ds) return prev;
      const newEnabled = !ds.enabled;

      if (newEnabled) {
        // Enable the correct underlying layer
        const layerId = resolveLayerId(ds, temporalMode, dayNightMode, precipMode);
        if (layerId) {
          enableLayerOnMap(layerId, ds.opacity);
        }
        // For precipitation realtime, start timeline
        if (ds.hasTimeline && precipMode === 'realtime') {
          // already handled via enableLayerOnMap
        }
      } else {
        // Disable all underlying layers for this dataset
        getAllLayerIdsForDataset(ds).forEach(id => disableLayerOnMap(id));
        if (ds.hasTimeline) setIsPlaying(false);
      }

      return prev.map(d => d.id === datasetId ? { ...d, enabled: newEnabled } : d);
    });
  }, [temporalMode, dayNightMode, precipMode, getAllLayerIdsForDataset, enableLayerOnMap, disableLayerOnMap]);

  // Set dataset opacity
  const setDatasetOpacity = useCallback((datasetId: string, opacity: number) => {
    setDatasets(prev => prev.map(d => {
      if (d.id !== datasetId) return d;
      // Update active layer opacity on map
      if (d.enabled) {
        const layerId = resolveLayerId(d, temporalMode, dayNightMode, precipMode);
        if (layerId && map) {
          const mapLayerId = `${layerId}-layer`;
          try {
            if (safeGetMapLayer(map, mapLayerId)) {
              map.setPaintProperty(mapLayerId, 'raster-opacity', opacity);
            }
          } catch {}
          setEarthLayers(prev2 => prev2.map(l => l.id === layerId ? { ...l, opacity } : l));
        }
      }
      return { ...d, opacity };
    }));
  }, [map, temporalMode, dayNightMode, precipMode]);

  // When temporal mode or day/night changes, swap active layers for enabled datasets
  useEffect(() => {
    if (!map || !mapReady || !isMapStyleReady(map)) return;
    datasets.forEach(ds => {
      if (!ds.enabled) return;
      // Disable all underlying layers first
      getAllLayerIdsForDataset(ds).forEach(id => disableLayerOnMap(id));
      // Enable the correct one
      const layerId = resolveLayerId(ds, temporalMode, dayNightMode, precipMode);
      if (layerId) {
        enableLayerOnMap(layerId, ds.opacity);
      }
    });
  }, [temporalMode, dayNightMode, precipMode, mapReady]);

  // Re-add layers after style change
  useEffect(() => {
    if (!map || !mapReady || !isMapStyleReady(map)) return;
    earthLayers.forEach(layer => {
      if (layer.enabled) {
        const mapLayerId = `${layer.id}-layer`;
        try {
          safeRemoveMapLayer(map, mapLayerId);
          safeRemoveMapSource(map, layer.id);
        } catch {}
        addEarthLayerToMap(layer);
      }
    });
  }, [mapReady]);

  // Timeline controls
  const stepFrame = useCallback((direction: 1 | -1) => {
    if (precipFrames.length === 0) return;
    setCurrentFrameIndex(prev => {
      const next = prev + direction;
      if (next < 0) return precipFrames.length - 1;
      if (next >= precipFrames.length) return 0;
      return next;
    });
  }, [precipFrames.length]);

  const togglePlayback = useCallback(() => {
    setIsPlaying(prev => !prev);
  }, []);

  const currentFrameTime = precipFrames[currentFrameIndex]?.time
    ? new Date(precipFrames[currentFrameIndex].time * 1000)
    : null;

  // Derived: which features the active datasets need
  const activeDatasets = datasets.filter(d => d.enabled);
  const hasActiveTimeline = activeDatasets.some(d => d.hasTimeline && precipMode === 'realtime');
  const hasActiveDateLayer = activeDatasets.some(d => d.hasMonthly || d.hasDaily);
  const activeHasDayNight = activeDatasets.some(d => d.hasDayNight);
  const activeHasDaily = activeDatasets.some(d => d.hasDaily);
  const activeHasMonthly = activeDatasets.some(d => d.hasMonthly);
  const activeHasTimelineOption = activeDatasets.some(d => d.hasTimeline);

  // ── NOAA / GIBS data availability probe ──────────────────────────────
  // Identify the first enabled NOAA-related dataset and resolve its underlying GIBS layer.
  const activeNoaaLayer: EarthLayer | null = (() => {
    const noaaDs = activeDatasets.find(d => {
      const n = d.name.toLowerCase();
      return n.includes('noaa') || n.includes('goes') || n.includes('himawari');
    });
    if (!noaaDs) return null;
    const layerId = noaaDs.layerIds.static
      || noaaDs.layerIds.dayDaily
      || noaaDs.layerIds.dayMonthly
      || noaaDs.layerIds.realtime;
    if (!layerId) return null;
    return earthLayers.find(l => l.id === layerId) || null;
  })();
  const activeNoaaDatasetName: string | null = (() => {
    const d = activeDatasets.find(d => {
      const n = d.name.toLowerCase();
      return n.includes('noaa') || n.includes('goes') || n.includes('himawari');
    });
    return d ? d.name : null;
  })();

  type NoaaDataStatus = 'idle' | 'checking' | 'available' | 'unavailable' | 'latest';
  const [noaaDataStatus, setNoaaDataStatus] = useState<NoaaDataStatus>('idle');
  const [noaaProbedAt, setNoaaProbedAt] = useState<Date | null>(null);

  // Build a small probe URL (z=2/y=1/x=1) reflecting current date / time / temporal mode.
  const noaaProbeUrl: string | null = (() => {
    if (!activeNoaaLayer) return null;
    const templated = getGibsTileUrl(activeNoaaLayer);
    if (!templated) return null;
    // Skip WMS-style URLs (BBOX based); probe only WMTS.
    if (templated.includes('SERVICE=WMS')) return null;
    return templated.replace('{z}', '2').replace('{y}', '1').replace('{x}', '1');
  })();
  const noaaIsLatestRequest = noaaProbeUrl ? noaaProbeUrl.includes('/default/default/') : false;

  useEffect(() => {
    if (!noaaProbeUrl) {
      setNoaaDataStatus('idle');
      setNoaaProbedAt(null);
      return;
    }
    if (noaaIsLatestRequest) {
      // GIBS 'default/default' always serves the freshest published frame.
      setNoaaDataStatus('latest');
      setNoaaProbedAt(new Date());
      return;
    }
    let cancelled = false;
    setNoaaDataStatus('checking');
    const ctrl = new AbortController();
    fetch(noaaProbeUrl, { method: 'GET', cache: 'no-store', signal: ctrl.signal })
      .then(res => {
        if (cancelled) return;
        setNoaaDataStatus(res.ok ? 'available' : 'unavailable');
        setNoaaProbedAt(new Date());
      })
      .catch(() => {
        if (cancelled) return;
        setNoaaDataStatus('unavailable');
        setNoaaProbedAt(new Date());
      });
    return () => { cancelled = true; ctrl.abort(); };
  }, [noaaProbeUrl, noaaIsLatestRequest, temporalMode, liveTick]);

  // Jump to the newest available imagery: today (UTC), current hour, minute rounded down to nearest 10
  const jumpToLatest = useCallback(() => {
    const now = new Date();
    const utc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    setSelectedDate(utc);
    setSelectedMonth(new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1)));
    setTemporalMode('daily');
    const minute = Math.floor(now.getUTCMinutes() / 10) * 10;
    setSelectedTime({ hour: now.getUTCHours(), minute: minute % 60 });
    // Force live geostationary layers to refetch immediately
    setLiveTick((n) => n + 1);
  }, []);

  // Force every enabled NOAA/NASA raster layer to re-fetch fresh tiles right now.
  const [isRefreshing, setIsRefreshing] = useState(false);
  const refreshNow = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const bust = Date.now();
      // 1. Re-pull RainViewer index (radar + IR satellite) for newest frame list
      try {
        const res = await fetch('https://api.rainviewer.com/public/weather-maps.json', { cache: 'no-store' });
        const data = await res.json();
        if (data.host) rainviewerHost.current = data.host;
        const frames: PrecipitationFrame[] = [
          ...(data.radar?.past || []),
          ...(data.radar?.nowcast || []),
        ];
        setPrecipFrames(frames);
        if (frames.length > 0) {
          const pastCount = data.radar?.past?.length || frames.length;
          setCurrentFrameIndex(Math.max(0, pastCount - 1));
        }
        const satFrames: PrecipitationFrame[] = [...(data.satellite?.infrared?.past || [])];
        setSatelliteFrames(satFrames);
        if (satFrames.length > 0) setSatFrameIndex(satFrames.length - 1);
      } catch {}

      // 2. Force-refetch every enabled GIBS raster by appending a cache-bust param via setTiles
      if (map && isMapStyleReady(map)) {
        earthLayersRef.current.forEach((layer) => {
          if (!layer.enabled || !layer.gibsLayerDay) return;
          const base = getGibsTileUrl(layer);
          if (!base) return;
          const busted = base + (base.includes('?') ? '&' : '?') + `_v=${bust}`;
          const src: any = safeGetMapSource(map, layer.id);
          try {
            if (src && typeof src.setTiles === 'function') {
              src.setTiles([busted]);
            }
          } catch {}
        });
      }

      // 3. Bump live tick so the GIBS update effect re-runs for any newly-enabled layers
      setLiveTick((n) => n + 1);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, [map, getGibsTileUrl]);


  return {
    jumpToLatest,
    refreshNow,
    isRefreshing,


    earthLayers,
    datasets,
    hasAccess,
    toggleDataset,
    setDatasetOpacity,
    // Temporal controls
    temporalMode,
    setTemporalMode,
    dayNightMode,
    setDayNightMode,
    precipMode,
    setPrecipMode,
    // Derived
    activeHasDayNight,
    activeHasDaily,
    activeHasMonthly,
    activeHasTimelineOption,
    // Precipitation timeline
    precipFrames,
    currentFrameIndex,
    setCurrentFrameIndex,
    currentFrameTime,
    isPlaying,
    togglePlayback,
    stepFrame,
    // Date selection
    selectedDate,
    setSelectedDate,
    selectedMonth,
    setSelectedMonth,
    selectedTime,
    setSelectedTime,
    hasActiveDateLayer,
    hasActiveTimeline,
    // NOAA / GIBS availability indicator
    noaaDataStatus,
    noaaProbedAt,
    activeNoaaDatasetName,
  };
};
