import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { TrackedEntity } from '@/hooks/useExternalTracking';

interface ExternalTrackingMarkersProps {
  map: mapboxgl.Map | null;
  entities: TrackedEntity[];
  onEntityClick?: (entity: TrackedEntity) => void;
}

// Color scheme for each entity type
const ENTITY_COLORS: Record<TrackedEntity['type'], string> = {
  vehicle: '#3B82F6',
  delivery: '#F59E0B',
  drone: '#10B981',
  plane: '#6366F1',
  helicopter: '#8B5CF6',
  ship: '#0EA5E9',
  rocket: '#EF4444',
  satellite: '#A855F7',
  buoy: '#F97316',
};

// SVG icons for each entity type
const ENTITY_ICONS: Record<TrackedEntity['type'], string> = {
  vehicle: `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M18.92 6.01C18.72 5.42 18.16 5 17.5 5h-11c-.66 0-1.21.42-1.42 1.01L3 12v8c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-1h12v1c0 .55.45 1 1 1h1c.55 0 1-.45 1-1v-8l-2.08-5.99zM6.5 16c-.83 0-1.5-.67-1.5-1.5S5.67 13 6.5 13s1.5.67 1.5 1.5S7.33 16 6.5 16zm11 0c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zM5 11l1.5-4.5h11L19 11H5z"/></svg>`,
  delivery: `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M19.15 8a2 2 0 0 0-1.72-1H15V5a1 1 0 0 0-1-1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 1 1.73 3.49 3.49 0 0 0 7 .27h3.1a3.48 3.48 0 0 0 6.9 0 2 2 0 0 0 2-2v-3a1.07 1.07 0 0 0 0-.14zM15 9h2.43l1.8 3H15zM6.5 19A1.5 1.5 0 1 1 8 17.5 1.5 1.5 0 0 1 6.5 19zm10 0a1.5 1.5 0 1 1 1.5-1.5 1.5 1.5 0 0 1-1.5 1.5z"/></svg>`,
  drone: `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>`,
  plane: `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`,
  helicopter: `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M21 9h-6v1h-6V9H3v2h6v1H7v1h2v1H8v4h2v-1h4v1h2v-4h-1v-1h2v-1h-6v-1h10V9z"/><path d="M12 6c-1.1 0-2 .9-2 2h4c0-1.1-.9-2-2-2z"/></svg>`,
  ship: `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M20 21c-1.39 0-2.78-.47-4-1.32-2.44 1.71-5.56 1.71-8 0C6.78 20.53 5.39 21 4 21H2v2h2c1.38 0 2.74-.35 4-.99 2.52 1.29 5.48 1.29 8 0 1.26.65 2.62.99 4 .99h2v-2h-2zM3.95 19H4c1.6 0 3.02-.88 4-2 .98 1.12 2.4 2 4 2s3.02-.88 4-2c.98 1.12 2.4 2 4 2h.05l1.89-6.68c.08-.26.06-.54-.06-.78s-.34-.42-.6-.5L20 10.62V6c0-1.1-.9-2-2-2h-3V1H9v3H6c-1.1 0-2 .9-2 2v4.62l-1.29.42c-.26.08-.48.26-.6.5s-.15.52-.06.78L3.95 19zM6 6h12v3.97L12 8 6 9.97V6z"/></svg>`,
  rocket: `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M12 2.5c0 0-7 7.5-7 14c0 3.5 3.5 5.5 7 5.5s7-2 7-5.5C19 10 12 2.5 12 2.5zM12 19c-1.66 0-3-1.34-3-3 0-2.5 3-5.5 3-5.5s3 3 3 5.5c0 1.66-1.34 3-3 3z"/></svg>`,
  satellite: `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M7.7 14.3l2-2-1.4-1.4-2 2 1.4 1.4zm6-4l2-2-1.4-1.4-2 2 1.4 1.4zM22 8.5c0-3-2.5-5.5-5.5-5.5-1.4 0-2.7.5-3.7 1.4L9.5 7.7 7.3 5.5 5.9 6.9l2.2 2.2L2.8 14.4c-.4.4-.6 1-.6 1.5 0 1.1.9 2 2 2h.1l1.1 2.8c.2.5.7.8 1.2.8.2 0 .4 0 .6-.1l2.1-.8c.2.1.3.1.5.1h6.2c.6 0 1.1-.2 1.5-.6l3.8-3.8c.9-1 1.4-2.3 1.4-3.7 0-.5-.1-1-.2-1.5L22 8.5z"/></svg>`,
  buoy: `<svg width="16" height="16" viewBox="0 0 24 24" fill="white"><circle cx="12" cy="12" r="6" stroke="white" stroke-width="2" fill="none"/><circle cx="12" cy="12" r="2" fill="white"/><path d="M12 4v3M12 17v3M4 12h3M17 12h3" stroke="white" stroke-width="2"/></svg>`,
};

// Marker sizes for different entity types
const ENTITY_SIZES: Record<TrackedEntity['type'], number> = {
  vehicle: 32,
  delivery: 34,
  drone: 28,
  plane: 40,
  helicopter: 34,
  ship: 42,
  rocket: 44,
  satellite: 36,
  buoy: 28,
};

export const ExternalTrackingMarkers = ({ 
  map, 
  entities, 
  onEntityClick 
}: ExternalTrackingMarkersProps) => {
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());
  const popupsRef = useRef<Map<string, mapboxgl.Popup>>(new Map());

  useEffect(() => {
    if (!map) return;

    const currentIds = new Set(entities.map(e => e.id));
    
    // Remove stale markers
    markersRef.current.forEach((marker, id) => {
      if (!currentIds.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
        popupsRef.current.get(id)?.remove();
        popupsRef.current.delete(id);
      }
    });

    // Update or create markers
    entities.forEach(entity => {
      const existing = markersRef.current.get(entity.id);
      const color = ENTITY_COLORS[entity.type];
      const size = ENTITY_SIZES[entity.type];
      
      if (existing) {
        // Smooth animation to new position
        existing.setLngLat([entity.longitude, entity.latitude]);
        
        // Update rotation if heading provided
        if (entity.heading !== undefined) {
          const el = existing.getElement();
          const iconEl = el.querySelector('.entity-icon') as HTMLElement;
          if (iconEl) {
            iconEl.style.transform = `rotate(${entity.heading}deg)`;
          }
        }

        // Update popup content
        const popup = popupsRef.current.get(entity.id);
        if (popup) {
          popup.setHTML(createPopupHTML(entity));
        }
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'tracking-marker';
        el.style.cssText = `
          width: ${size}px;
          height: ${size}px;
          cursor: pointer;
          position: absolute;
          transform: translate(-50%, -50%);
          transition: transform 0.3s ease-out;
          filter: drop-shadow(0 2px 6px rgba(0,0,0,0.4));
        `;

        // Determine if entity should rotate (vehicles, planes, etc.)
        const shouldRotate = ['vehicle', 'delivery', 'plane', 'helicopter', 'ship', 'rocket', 'drone'].includes(entity.type);
        const rotation = shouldRotate && entity.heading ? entity.heading : 0;

        // Marker container with pulsing effect
        el.innerHTML = `
          <style>
            @keyframes tracking-pulse-${entity.type} {
              0%, 100% { opacity: 0.5; transform: scale(1); }
              50% { opacity: 0.15; transform: scale(1.6); }
            }
          </style>
          <div style="position: relative; width: ${size}px; height: ${size}px;">
            <div style="
              position: absolute;
              top: 0;
              left: 0;
              width: ${size}px;
              height: ${size}px;
              background: ${color}50;
              border-radius: 50%;
              animation: tracking-pulse-${entity.type} 2s infinite;
            "></div>
            <div class="entity-icon" style="
              position: absolute;
              top: ${size * 0.1}px;
              left: ${size * 0.1}px;
              width: ${size * 0.8}px;
              height: ${size * 0.8}px;
              background: linear-gradient(135deg, ${color}, ${color}cc);
              border: 2px solid white;
              border-radius: 50%;
              box-shadow: 0 2px 8px ${color}80;
              display: flex;
              align-items: center;
              justify-content: center;
              transition: transform 0.1s linear;
              transform: rotate(${rotation}deg);
            ">
              ${ENTITY_ICONS[entity.type]}
            </div>
          </div>
        `;

        // Create popup
        const popup = new mapboxgl.Popup({
          offset: size / 2 + 5,
          closeButton: false,
          closeOnClick: false,
          className: 'tracking-entity-popup',
        }).setHTML(createPopupHTML(entity));

        // Click handler
        el.addEventListener('click', (e) => {
          e.stopPropagation();
          onEntityClick?.(entity);
        });

        // Hover effects
        el.addEventListener('mouseenter', () => {
          el.style.transform = 'translate(-50%, -50%) scale(1.2)';
          popup.setLngLat([entity.longitude, entity.latitude]).addTo(map);
        });
        el.addEventListener('mouseleave', () => {
          el.style.transform = 'translate(-50%, -50%) scale(1)';
          popup.remove();
        });

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'center',
          offset: [0, 0],
        })
          .setLngLat([entity.longitude, entity.latitude])
          .addTo(map);

        markersRef.current.set(entity.id, marker);
        popupsRef.current.set(entity.id, popup);
      }
    });
  }, [map, entities, onEntityClick]);

  // Full cleanup on unmount
  useEffect(() => {
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
      popupsRef.current.forEach(popup => popup.remove());
      popupsRef.current.clear();
    };
  }, []);

  return null;
};

// Helper to create popup HTML
const createPopupHTML = (entity: TrackedEntity): string => {
  const speedUnit = entity.type === 'satellite' || entity.type === 'rocket' ? 'km/h' : 
                    entity.type === 'ship' ? 'knots' : 
                    entity.type === 'plane' ? 'km/h' : 'mph';
  
  const altitudeStr = entity.altitude 
    ? entity.altitude > 1000 
      ? `${(entity.altitude / 1000).toFixed(1)}km`
      : `${entity.altitude.toFixed(0)}m`
    : null;

  const typeLabel = entity.type.charAt(0).toUpperCase() + entity.type.slice(1);
  const color = ENTITY_COLORS[entity.type];

  return `
    <div style="
      padding: 10px 14px;
      background: rgba(0,0,0,0.9);
      border-radius: 10px;
      color: white;
      font-size: 12px;
      min-width: 160px;
      backdrop-filter: blur(12px);
      border: 1px solid ${color}40;
    ">
      <div style="
        font-weight: 600; 
        margin-bottom: 6px; 
        font-size: 14px;
        display: flex;
        align-items: center;
        gap: 6px;
      ">
        <span style="
          width: 8px;
          height: 8px;
          background: ${color};
          border-radius: 50%;
          display: inline-block;
        "></span>
        ${entity.name}
      </div>
      <div style="color: rgba(255,255,255,0.75); display: flex; flex-direction: column; gap: 3px; font-size: 11px;">
        <span><strong>Type:</strong> ${typeLabel}</span>
        ${entity.speed ? `<span><strong>Speed:</strong> ${entity.speed.toFixed(0)} ${speedUnit}</span>` : ''}
        ${altitudeStr ? `<span><strong>Altitude:</strong> ${altitudeStr}</span>` : ''}
        ${entity.heading ? `<span><strong>Heading:</strong> ${entity.heading.toFixed(0)}°</span>` : ''}
        ${entity.metadata ? Object.entries(entity.metadata)
          .slice(0, 3)
          .map(([k, v]) => `<span><strong>${k}:</strong> ${v}</span>`)
          .join('') : ''}
      </div>
    </div>
  `;
};
