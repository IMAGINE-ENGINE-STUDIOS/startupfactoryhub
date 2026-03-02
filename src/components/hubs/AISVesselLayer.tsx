import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { AISVessel, getVesselColor, getVesselTypeLabel } from '@/hooks/useAISTracking';

interface AISVesselLayerProps {
  map: mapboxgl.Map | null;
  vessels: AISVessel[];
  mapReady: boolean;
  onVesselClick: (vessel: AISVessel) => void;
}

const CLUSTER_SOURCE_ID = 'ais-clusters-source';
const LAYER_UNCLUSTERED = 'ais-vessels-unclustered';
const LAYER_CLUSTERS = 'ais-vessels-clusters';
const LAYER_CLUSTER_COUNT = 'ais-vessels-cluster-count';
const SHIP_IMAGE_ID = 'ais-ship-icon';

// Vessel category colors
const VESSEL_COLORS: Record<string, string> = {
  cargo: '#3b82f6',
  tanker: '#ef4444',
  passenger: '#8b5cf6',
  fishing: '#10b981',
  tug: '#f59e0b',
  other: '#6b7280',
};

function createColoredShipImage(size: number, fillColor: string, strokeColor: string): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const cx = size / 2;
  const cy = size / 2;
  const s = size * 0.4;

  // Ship hull shape pointing UP (north = 0°)
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.lineTo(cx + s * 0.45, cy + s * 0.3);
  ctx.lineTo(cx + s * 0.3, cy + s * 0.85);
  ctx.lineTo(cx - s * 0.3, cy + s * 0.85);
  ctx.lineTo(cx - s * 0.45, cy + s * 0.3);
  ctx.closePath();

  ctx.fillStyle = fillColor;
  ctx.fill();
  ctx.strokeStyle = strokeColor;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Small bridge detail
  ctx.beginPath();
  ctx.arc(cx, cy + s * 0.15, s * 0.12, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fill();

  return ctx.getImageData(0, 0, size, size);
}

export const AISVesselLayer = ({ map, vessels, mapReady, onVesselClick }: AISVesselLayerProps) => {
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const addedRef = useRef(false);
  const imagesAddedRef = useRef(false);

  const buildGeoJSON = useCallback((): GeoJSON.FeatureCollection => ({
    type: 'FeatureCollection',
    features: vessels.map(v => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [v.longitude, v.latitude] },
      properties: {
        mmsi: v.mmsi,
        name: v.name || `MMSI: ${v.mmsi}`,
        type: v.type,
        typeLabel: getVesselTypeLabel(v.type),
        sog: v.sog / 10,
        cog: v.cog,
        heading: v.heading === 511 ? v.cog : v.heading,
        color: getVesselColor(v.type),
        navstat: v.navstat,
        iconImage: `ship-${getVesselColorKey(v.type)}`,
      },
    })),
  }), [vessels]);

  // Add ship images to map
  const addShipImages = useCallback(() => {
    if (!map || imagesAddedRef.current) return;

    const size = 32;
    Object.entries(VESSEL_COLORS).forEach(([key, color]) => {
      const imageId = `ship-${key}`;
      if (!map.hasImage(imageId)) {
        const imageData = createColoredShipImage(size, color, 'rgba(255,255,255,0.9)');
        map.addImage(imageId, { width: size, height: size, data: new Uint8Array(imageData.data.buffer) });
      }
    });

    imagesAddedRef.current = true;
  }, [map]);

  // Add source & layers
  useEffect(() => {
    if (!map || !mapReady) return;

    const setup = () => {
      if (addedRef.current) return;

      addShipImages();

      // Clustered source
      if (!map.getSource(CLUSTER_SOURCE_ID)) {
        map.addSource(CLUSTER_SOURCE_ID, {
          type: 'geojson',
          data: buildGeoJSON(),
          cluster: true,
          clusterMaxZoom: 10,
          clusterRadius: 50,
        });
      }

      // Cluster circles
      if (!map.getLayer(LAYER_CLUSTERS)) {
        map.addLayer({
          id: LAYER_CLUSTERS,
          type: 'circle',
          source: CLUSTER_SOURCE_ID,
          filter: ['has', 'point_count'],
          paint: {
            'circle-color': [
              'step', ['get', 'point_count'],
              '#3b82f6', 20,
              '#6366f1', 100,
              '#ef4444',
            ],
            'circle-radius': ['step', ['get', 'point_count'], 18, 20, 24, 100, 32],
            'circle-opacity': 0.85,
            'circle-stroke-width': 2,
            'circle-stroke-color': 'rgba(255,255,255,0.5)',
          },
        });
      }

      // Cluster counts
      if (!map.getLayer(LAYER_CLUSTER_COUNT)) {
        map.addLayer({
          id: LAYER_CLUSTER_COUNT,
          type: 'symbol',
          source: CLUSTER_SOURCE_ID,
          filter: ['has', 'point_count'],
          layout: {
            'text-field': '{point_count_abbreviated}',
            'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
            'text-size': 12,
          },
          paint: { 'text-color': '#ffffff' },
        });
      }

      // Unclustered vessel icons (ship shape, rotated by heading)
      if (!map.getLayer(LAYER_UNCLUSTERED)) {
        map.addLayer({
          id: LAYER_UNCLUSTERED,
          type: 'symbol',
          source: CLUSTER_SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          layout: {
            'icon-image': ['get', 'iconImage'],
            'icon-size': 1,
            'icon-rotate': ['get', 'heading'],
            'icon-rotation-alignment': 'map',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true,
          },
        });
      }

      addedRef.current = true;

      // Click handler for unclustered
      map.on('click', LAYER_UNCLUSTERED, (e) => {
        if (!e.features?.[0]) return;
        const props = e.features[0].properties;
        if (!props) return;
        const vessel = vessels.find(v => v.mmsi === props.mmsi);
        if (vessel) onVesselClick(vessel);
      });

      // Click handler for clusters (zoom in)
      map.on('click', LAYER_CLUSTERS, (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: [LAYER_CLUSTERS] });
        if (!features[0]) return;
        const clusterId = features[0].properties?.cluster_id;
        const src = map.getSource(CLUSTER_SOURCE_ID) as mapboxgl.GeoJSONSource;
        src.getClusterExpansionZoom(clusterId, (err, zoom) => {
          if (err) return;
          const coords = (features[0].geometry as GeoJSON.Point).coordinates;
          map.easeTo({ center: coords as [number, number], zoom: zoom! });
        });
      });

      // Cursor changes
      map.on('mouseenter', LAYER_UNCLUSTERED, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', LAYER_UNCLUSTERED, () => { map.getCanvas().style.cursor = ''; });
      map.on('mouseenter', LAYER_CLUSTERS, () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', LAYER_CLUSTERS, () => { map.getCanvas().style.cursor = ''; });

      // Hover popup for vessels
      map.on('mouseenter', LAYER_UNCLUSTERED, (e) => {
        if (!e.features?.[0]) return;
        const p = e.features[0].properties;
        const coords = (e.features[0].geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        
        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new mapboxgl.Popup({ closeButton: false, closeOnClick: false, offset: 12 })
          .setLngLat(coords)
          .setHTML(`<div style="font-size:12px;color:#fff;background:#1e293b;padding:6px 10px;border-radius:8px;">
            <strong>${p?.name || 'Unknown'}</strong><br/>
            ${p?.typeLabel} · ${p?.sog?.toFixed(1)} kn
          </div>`)
          .addTo(map);
      });
      map.on('mouseleave', LAYER_UNCLUSTERED, () => {
        if (popupRef.current) { popupRef.current.remove(); popupRef.current = null; }
      });
    };

    if (map.isStyleLoaded()) {
      setup();
    } else {
      map.once('style.load', setup);
    }

    return () => {
      // Cleanup on unmount
    };
  }, [map, mapReady]);

  // Update data when vessels change
  useEffect(() => {
    if (!map || !addedRef.current) return;
    try {
      const src = map.getSource(CLUSTER_SOURCE_ID) as mapboxgl.GeoJSONSource;
      if (src) src.setData(buildGeoJSON());
    } catch (e) {
      // source may not exist yet
    }
  }, [vessels, map, buildGeoJSON]);

  // Cleanup layers on unmount
  useEffect(() => {
    return () => {
      if (!map) return;
      try {
        [LAYER_CLUSTER_COUNT, LAYER_CLUSTERS, LAYER_UNCLUSTERED].forEach(id => {
          if (map.getLayer(id)) map.removeLayer(id);
        });
        [CLUSTER_SOURCE_ID].forEach(id => {
          if (map.getSource(id)) map.removeSource(id);
        });
        // Remove ship images
        Object.keys(VESSEL_COLORS).forEach(key => {
          const imageId = `ship-${key}`;
          if (map.hasImage(imageId)) map.removeImage(imageId);
        });
      } catch (e) { /* map may already be destroyed */ }
      addedRef.current = false;
      imagesAddedRef.current = false;
    };
  }, [map]);

  return null;
};

// Helper to get the color key for a vessel type
function getVesselColorKey(type: number): string {
  if ([70,71,72,73,74,75,76,77,78,79].includes(type)) return 'cargo';
  if ([80,81,82,83,84,85,86,87,88,89].includes(type)) return 'tanker';
  if ([60,61,62,63,64,65,66,67,68,69].includes(type)) return 'passenger';
  if (type === 30) return 'fishing';
  if ([31,32,52].includes(type)) return 'tug';
  return 'other';
}
