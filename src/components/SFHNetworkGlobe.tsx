import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN =
  (import.meta.env.VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN as string | undefined) ||
  'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';

/** Global hub network — generic, no single-city framing */
const HUBS: { name: string; coords: [number, number] }[] = [
  { name: 'New York', coords: [-74.006, 40.7128] },
  { name: 'Orlando', coords: [-81.3792, 28.5383] },
  { name: 'Santiago', coords: [-70.6693, -33.4489] },
  { name: 'Seville', coords: [-5.9845, 37.3891] },
  { name: 'London', coords: [-0.1276, 51.5072] },
  { name: 'Tokyo', coords: [139.6917, 35.6895] },
  { name: 'Singapore', coords: [103.8198, 1.3521] },
  { name: 'Dubai', coords: [55.2708, 25.2048] },
];

interface SFHNetworkGlobeProps {
  accent?: string;
  /** Fallback image URL rendered if Mapbox fails to initialise */
  fallbackImage?: string;
  className?: string;
}

/**
 * Auto-rotating world globe for the brochure decks.
 * Non-interactive: never steals scroll / drag while flipping pages.
 */
const SFHNetworkGlobe = ({ accent = '#0ea5b7', fallbackImage, className = '' }: SFHNetworkGlobeProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: mapboxgl.Map;
    let frame = 0;
    let resizeFrame = 0;
    let visible = false;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/dark-v11',
        projection: { name: 'globe' } as never,
        center: [-30, 20],
        zoom: 1.35,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
        antialias: false,
        interactive: false,
        maxPixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
        fadeDuration: 0,
        trackResize: false,
      } as never);
    } catch {
      setFailed(true);
      return;
    }

    mapRef.current = map;
    map.on('error', () => setFailed(true));

    // Flipbook pages are transformed and initially hidden. Mapbox otherwise
    // reads the transformed bounds and creates a blank or undersized canvas.
    const container = containerRef.current;
    const internals = map as unknown as {
      _containerWidth: number;
      _containerHeight: number;
      _updateContainerDimensions: () => void;
    };
    internals._updateContainerDimensions = () => {
      internals._containerWidth = container.clientWidth || 1;
      internals._containerHeight = container.clientHeight || 1;
    };

    let lastW = 0;
    let lastH = 0;
    const sync = () => {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width < 2 || height < 2) return;
      if (width === lastW && height === lastH) return;
      lastW = width;
      lastH = height;
      map.resize();
    };
    const scheduleSync = () => {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        sync();
      });
    };
    const resizeObserver = new ResizeObserver(scheduleSync);
    resizeObserver.observe(container);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) {
        lastW = 0;
        lastH = 0;
        scheduleSync();
      }
    }, { threshold: 0.01 });
    intersectionObserver.observe(container);
    const timers = [120, 400, 900, 1800, 3000].map((delay) => window.setTimeout(() => {
      lastW = 0;
      lastH = 0;
      scheduleSync();
    }, delay));

    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(6, 20, 32)',
        'high-color': accent,
        'horizon-blend': 0.14,
        'space-color': 'rgb(2, 8, 14)',
        'star-intensity': 0.45,
      } as never);

      HUBS.forEach((hub) => {
        const el = document.createElement('div');
        el.style.cssText = 'position:relative;width:9px;height:9px;pointer-events:none;';
        el.innerHTML = `
          <span style="position:absolute;inset:-8px;border-radius:9999px;background:${accent}30;animation:sfh-globe-ping 2.4s cubic-bezier(0,0,0.2,1) infinite"></span>
          <span style="position:absolute;inset:0;border-radius:9999px;background:#fff;box-shadow:0 0 10px ${accent},0 0 22px ${accent};border:1.5px solid ${accent}"></span>
        `;
        new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(hub.coords).addTo(map);
      });

      const spin = () => {
        if (visible) {
          const c = map.getCenter();
          c.lng -= 0.08;
          map.jumpTo({ center: c });
        }
        frame = requestAnimationFrame(spin);
      };
      frame = requestAnimationFrame(spin);
    });

    return () => {
      cancelAnimationFrame(frame);
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      timers.forEach(window.clearTimeout);
      map.remove();
      mapRef.current = null;
    };
  }, [accent]);

  if (failed && fallbackImage) {
    return (
      <div
        className={`absolute inset-0 ${className}`}
        style={{ backgroundImage: `url(${fallbackImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
    );
  }

  return (
    <div className={`sfh-network-globe absolute inset-0 flex items-center justify-center ${className}`}>
      <div ref={containerRef} className="absolute inset-0" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(circle at 50% 50%, transparent 45%, rgba(3,12,22,0.72) 100%)` }}
      />
      <style>{`
        @keyframes sfh-globe-ping { 75%,100% { transform: scale(2); opacity: 0 } }
        .sfh-network-globe .mapboxgl-map,
        .sfh-network-globe .mapboxgl-canvas-container,
        .sfh-network-globe .mapboxgl-canvas { width: 100% !important; height: 100% !important; }
      `}</style>
    </div>
  );
};

export default SFHNetworkGlobe;
