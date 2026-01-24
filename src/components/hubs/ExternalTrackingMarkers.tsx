import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { TrackedEntity } from '@/hooks/useExternalTracking';

interface ExternalTrackingMarkersProps {
  map: mapboxgl.Map | null;
  entities: TrackedEntity[];
  onEntityClick?: (entity: TrackedEntity) => void;
}

const ENTITY_COLORS: Record<TrackedEntity['type'], string> = {
  vehicle: '#3b82f6',
  delivery: '#f59e0b',
  drone: '#8b5cf6',
  asset: '#10b981',
};

const ENTITY_ICONS: Record<TrackedEntity['type'], string> = {
  vehicle: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2"/>
    <circle cx="7" cy="17" r="2"/>
    <circle cx="17" cy="17" r="2"/>
  </svg>`,
  delivery: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="m7.5 4.27 9 5.15"/>
    <path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/>
    <path d="m3.3 7 8.7 5 8.7-5"/>
    <path d="M12 22V12"/>
  </svg>`,
  drone: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M12 2v4"/>
    <path d="M12 18v4"/>
    <path d="M4.93 4.93l2.83 2.83"/>
    <path d="M16.24 16.24l2.83 2.83"/>
    <path d="M2 12h4"/>
    <path d="M18 12h4"/>
    <path d="M4.93 19.07l2.83-2.83"/>
    <path d="M16.24 7.76l2.83-2.83"/>
    <circle cx="12" cy="12" r="4"/>
  </svg>`,
  asset: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
    <circle cx="12" cy="10" r="3"/>
  </svg>`,
};

export const ExternalTrackingMarkers = ({ 
  map, 
  entities, 
  onEntityClick 
}: ExternalTrackingMarkersProps) => {
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    if (!map) return;

    const currentIds = new Set(entities.map(e => e.id));
    
    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    });

    // Update or create markers
    entities.forEach(entity => {
      const existing = markersRef.current.get(entity.id);
      const color = ENTITY_COLORS[entity.type];
      
      if (existing) {
        // Smooth animation to new position
        existing.setLngLat([entity.longitude, entity.latitude]);
        
        // Update rotation if heading provided
        if (entity.heading !== undefined) {
          existing.setRotation(entity.heading);
        }
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'tracking-marker';
        el.style.cssText = `
          width: 36px;
          height: 36px;
          cursor: pointer;
          position: absolute;
          transform: translate(-50%, -50%);
          transition: transform 0.5s ease-out;
        `;

        // Marker container with pulsing effect
        el.innerHTML = `
          <style>
            @keyframes tracking-pulse {
              0%, 100% { opacity: 0.6; transform: scale(1); }
              50% { opacity: 0.2; transform: scale(1.5); }
            }
          </style>
          <div style="position: relative; width: 36px; height: 36px;">
            <div style="
              position: absolute;
              top: 0;
              left: 0;
              width: 36px;
              height: 36px;
              background: ${color}40;
              border-radius: 50%;
              animation: tracking-pulse 2s infinite;
            "></div>
            <div style="
              position: absolute;
              top: 4px;
              left: 4px;
              width: 28px;
              height: 28px;
              background: linear-gradient(135deg, ${color}, ${color}dd);
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px ${color}80;
              display: flex;
              align-items: center;
              justify-content: center;
            ">
              ${ENTITY_ICONS[entity.type]}
            </div>
          </div>
        `;

        // Click handler
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onEntityClick?.(entity);
        });

        // Hover effect
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'translate(-50%, -50%) scale(1.2)';
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'translate(-50%, -50%) scale(1)';
        });

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
          offset: [0, 0],
          rotationAlignment: 'map',
        })
          .setLngLat([entity.longitude, entity.latitude])
          .addTo(map);

        if (entity.heading !== undefined) {
          marker.setRotation(entity.heading);
        }

        markersRef.current.set(entity.id, marker);
      }
    });

    // Cleanup function
    return () => {
      // Only clean up if map is being destroyed
    };
  }, [map, entities, onEntityClick]);

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
    };
  }, []);

  return null;
};
