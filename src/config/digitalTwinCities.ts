/**
 * Digital Twin City Registry
 * 
 * Each entry defines a city whose 3D buildings can be replaced with
 * high-detail city-specific tilesets / open-data sources, replacing
 * the generic Mapbox composite building extrusions.
 */

export interface DigitalTwinCity {
  id: string;
  name: string;
  /** [west, south, east, north] */
  bbox: [number, number, number, number];
  center: [number, number]; // [lng, lat]
  defaultZoom: number;
  pitch: number;
  bearing: number;
  /** 
   * City-specific building tileset source.
   * Can be a Mapbox tileset ID, a vector tile URL template, or an open-data GeoJSON endpoint.
   * When null/undefined, falls back to Mapbox composite buildings.
   */
  buildingSource?: string;
  buildingSourceType?: 'vector' | 'geojson';
  buildingSourceLayer?: string;
  /** Optional overlay priorities */
  overlays?: {
    cameraPriority?: 'high' | 'normal';
    transitPriority?: 'high' | 'normal';
    sensorPriority?: 'high' | 'normal';
  };
}

export const digitalTwinCities: DigitalTwinCity[] = [
  {
    id: 'nyc',
    name: 'New York City',
    bbox: [-74.26, 40.49, -73.70, 40.92],
    center: [-73.985, 40.748],
    defaultZoom: 14,
    pitch: 60,
    bearing: -17,
    // NYC Open Data 3D building footprints
    buildingSource: 'https://data.cityofnewyork.us/api/geospatial/nqwf-w8eh?method=export&type=GeoJSON',
    buildingSourceType: 'geojson',
    overlays: { cameraPriority: 'high', transitPriority: 'high' },
  },
  {
    id: 'washington-dc',
    name: 'Washington, DC',
    bbox: [-77.12, 38.79, -76.91, 38.99],
    center: [-77.036, 38.895],
    defaultZoom: 14,
    pitch: 55,
    bearing: 0,
    overlays: { cameraPriority: 'high' },
  },
  {
    id: 'los-angeles',
    name: 'Los Angeles',
    bbox: [-118.67, 33.70, -118.15, 34.34],
    center: [-118.243, 34.052],
    defaultZoom: 13,
    pitch: 55,
    bearing: 0,
    // LA GeoHub building footprints
    buildingSource: 'https://opendata.arcgis.com/datasets/813fcefbe1d f445e998d899b2b8ca1e7_0.geojson',
    buildingSourceType: 'geojson',
    overlays: { cameraPriority: 'high' },
  },
  {
    id: 'san-francisco',
    name: 'San Francisco',
    bbox: [-122.52, 37.70, -122.35, 37.83],
    center: [-122.419, 37.775],
    defaultZoom: 14,
    pitch: 60,
    bearing: -10,
    // SF Open Data building footprints
    buildingSource: 'https://data.sfgov.org/api/geospatial/ynuv-fyni?method=export&type=GeoJSON',
    buildingSourceType: 'geojson',
    overlays: { cameraPriority: 'high', transitPriority: 'high' },
  },
  {
    id: 'tokyo',
    name: 'Tokyo',
    bbox: [139.56, 35.52, 139.92, 35.82],
    center: [139.692, 35.689],
    defaultZoom: 14,
    pitch: 60,
    bearing: 0,
    // PLATEAU 3D city model (Japan MLIT open data)
    overlays: { cameraPriority: 'normal' },
  },
  {
    id: 'orlando',
    name: 'Orlando',
    bbox: [-81.51, 28.37, -81.22, 28.62],
    center: [-81.379, 28.538],
    defaultZoom: 13,
    pitch: 55,
    bearing: 0,
    overlays: { cameraPriority: 'high' },
  },
  {
    id: 'miami',
    name: 'Miami',
    bbox: [-80.32, 25.70, -80.13, 25.86],
    center: [-80.191, 25.761],
    defaultZoom: 14,
    pitch: 55,
    bearing: 0,
    // Miami-Dade Open Data
    overlays: { cameraPriority: 'high' },
  },
  {
    id: 'houston',
    name: 'Houston',
    bbox: [-95.78, 29.52, -95.01, 30.11],
    center: [-95.369, 29.760],
    defaultZoom: 13,
    pitch: 55,
    bearing: 0,
    overlays: { cameraPriority: 'high' },
  },
  {
    id: 'denver',
    name: 'Denver',
    bbox: [-105.11, 39.61, -104.60, 39.91],
    center: [-104.990, 39.739],
    defaultZoom: 14,
    pitch: 55,
    bearing: 0,
    // Denver Open Data building footprints
    overlays: { cameraPriority: 'high' },
  },
  {
    id: 'seattle',
    name: 'Seattle',
    bbox: [-122.44, 47.49, -122.24, 47.73],
    center: [-122.332, 47.606],
    defaultZoom: 14,
    pitch: 55,
    bearing: 0,
    // Seattle Open Data
    overlays: { cameraPriority: 'high', transitPriority: 'high' },
  },
  {
    id: 'boston',
    name: 'Boston',
    bbox: [-71.19, 42.23, -70.92, 42.40],
    center: [-71.058, 42.360],
    defaultZoom: 14,
    pitch: 55,
    bearing: 0,
    overlays: { cameraPriority: 'high', transitPriority: 'high' },
  },
];

/**
 * Check if a given map center falls within any digital twin city bbox.
 */
export function findDigitalTwinCity(lng: number, lat: number): DigitalTwinCity | null {
  for (const city of digitalTwinCities) {
    const [west, south, east, north] = city.bbox;
    if (lng >= west && lng <= east && lat >= south && lat <= north) {
      return city;
    }
  }
  return null;
}

/**
 * Get all digital twin cities as a simple list for UI display.
 */
export function getDigitalTwinCityList(): { id: string; name: string; center: [number, number] }[] {
  return digitalTwinCities.map(c => ({ id: c.id, name: c.name, center: c.center }));
}
