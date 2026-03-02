import { useEffect, useRef, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import { AISVessel, getVesselColor, getVesselTypeLabel } from '@/hooks/useAISTracking';

interface AISVesselLayerProps {
  map: mapboxgl.Map | null;
  vessels: AISVessel[];
  mapReady: boolean;
  onVesselClick: (vessel: AISVessel) => void;
}

const SOURCE_ID = 'ais-vessels-source';
const CLUSTER_SOURCE_ID = 'ais-clusters-source';
const LAYER_UNCLUSTERED = 'ais-vessels-unclustered';
const LAYER_CLUSTERS = 'ais-vessels-clusters';
const LAYER_CLUSTER_COUNT = 'ais-vessels-cluster-count';
const LAYER_HEADING = 'ais-vessels-heading';

export const AISVesselLayer = ({ map, vessels, mapReady, onVesselClick }: AISVesselLayerProps) => {
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  const addedRef = useRef(false);

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
        heading: v.heading === 511 ? v.cog : v.heading, // 511 = not available
        color: getVesselColor(v.type),
        navstat: v.navstat,
      },
    })),
  }), [vessels]);

  // Add source & layers
  useEffect(() => {
    if (!map || !mapReady) return;

    const setup = () => {
      if (addedRef.current) return;

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

      // Unclustered vessel points
      if (!map.getLayer(LAYER_UNCLUSTERED)) {
        map.addLayer({
          id: LAYER_UNCLUSTERED,
          type: 'circle',
          source: CLUSTER_SOURCE_ID,
          filter: ['!', ['has', 'point_count']],
          paint: {
            'circle-color': ['get', 'color'],
            'circle-radius': 6,
            'circle-stroke-width': 2,
            'circle-stroke-color': 'rgba(255,255,255,0.8)',
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
        [LAYER_HEADING, LAYER_CLUSTER_COUNT, LAYER_CLUSTERS, LAYER_UNCLUSTERED].forEach(id => {
          if (map.getLayer(id)) map.removeLayer(id);
        });
        [CLUSTER_SOURCE_ID, SOURCE_ID].forEach(id => {
          if (map.getSource(id)) map.removeSource(id);
        });
      } catch (e) { /* map may already be destroyed */ }
      addedRef.current = false;
    };
  }, [map]);

  return null;
};
