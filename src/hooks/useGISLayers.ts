import { useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';

export interface GISLayer {
  id: string;
  name: string;
  type: 'geojson' | 'vector' | 'raster';
  source: string | GeoJSON.FeatureCollection;
  visible: boolean;
  style: {
    type: 'circle' | 'line' | 'fill' | 'symbol' | 'fill-extrusion' | 'heatmap';
    paint: Record<string, any>;
    layout?: Record<string, any>;
  };
}

export const useGISLayers = (map: mapboxgl.Map | null) => {
  const [layers, setLayers] = useState<GISLayer[]>([]);

  const addLayer = useCallback((layer: GISLayer) => {
    if (!map) return;

    try {
      // Add source if it doesn't exist
      if (!map.getSource(layer.id)) {
        if (layer.type === 'geojson') {
          map.addSource(layer.id, {
            type: 'geojson',
            data: layer.source as GeoJSON.FeatureCollection,
          });
        } else if (layer.type === 'vector') {
          map.addSource(layer.id, {
            type: 'vector',
            url: layer.source as string,
          });
        } else if (layer.type === 'raster') {
          map.addSource(layer.id, {
            type: 'raster',
            url: layer.source as string,
            tileSize: 256,
          });
        }
      }

      // Add layer with styling
      const layerId = `${layer.id}-layer`;
      if (!map.getLayer(layerId)) {
        map.addLayer({
          id: layerId,
          type: layer.style.type as any,
          source: layer.id,
          paint: layer.style.paint,
          layout: {
            visibility: layer.visible ? 'visible' : 'none',
            ...layer.style.layout,
          },
        });
      }

      setLayers(prev => [...prev.filter(l => l.id !== layer.id), layer]);
    } catch (error) {
      console.error('Error adding GIS layer:', error);
    }
  }, [map]);

  const removeLayer = useCallback((layerId: string) => {
    if (!map) return;

    try {
      const mapLayerId = `${layerId}-layer`;
      if (map.getLayer(mapLayerId)) {
        map.removeLayer(mapLayerId);
      }
      if (map.getSource(layerId)) {
        map.removeSource(layerId);
      }
      setLayers(prev => prev.filter(l => l.id !== layerId));
    } catch (error) {
      console.error('Error removing GIS layer:', error);
    }
  }, [map]);

  const toggleLayerVisibility = useCallback((layerId: string) => {
    if (!map) return;

    try {
      const mapLayerId = `${layerId}-layer`;
      const visibility = map.getLayoutProperty(mapLayerId, 'visibility');
      const newVisibility = visibility === 'visible' ? 'none' : 'visible';
      map.setLayoutProperty(mapLayerId, 'visibility', newVisibility);
      
      setLayers(prev => prev.map(l => 
        l.id === layerId ? { ...l, visible: newVisibility === 'visible' } : l
      ));
    } catch (error) {
      console.error('Error toggling layer visibility:', error);
    }
  }, [map]);

  const updateLayerData = useCallback((layerId: string, data: GeoJSON.FeatureCollection) => {
    if (!map) return;

    try {
      const source = map.getSource(layerId) as mapboxgl.GeoJSONSource;
      if (source) {
        source.setData(data);
      }
    } catch (error) {
      console.error('Error updating layer data:', error);
    }
  }, [map]);

  const setLayerOpacity = useCallback((layerId: string, opacity: number) => {
    if (!map) return;

    try {
      const mapLayerId = `${layerId}-layer`;
      const layer = map.getLayer(mapLayerId);
      if (layer) {
        const type = layer.type;
        const opacityProp = type === 'fill' ? 'fill-opacity' 
          : type === 'line' ? 'line-opacity'
          : type === 'circle' ? 'circle-opacity'
          : type === 'symbol' ? 'icon-opacity'
          : type === 'fill-extrusion' ? 'fill-extrusion-opacity'
          : type === 'heatmap' ? 'heatmap-opacity'
          : null;
        
        if (opacityProp) {
          map.setPaintProperty(mapLayerId, opacityProp, opacity);
        }
      }
    } catch (error) {
      console.error('Error setting layer opacity:', error);
    }
  }, [map]);

  return { 
    layers, 
    addLayer, 
    removeLayer, 
    toggleLayerVisibility, 
    updateLayerData,
    setLayerOpacity 
  };
};
