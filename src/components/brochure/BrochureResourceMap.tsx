import { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN =
  (import.meta.env.VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN as string | undefined) ||
  'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';

interface BrochureResourceMapProps {
  accent?: string;
  /** Image rendered if Mapbox fails to initialise */
  fallbackImage?: string;
  className?: string;
}

/**
 * Presentation-only world map. Non-interactive so it never competes
 * with the flipbook gesture. Renders a clean satellite globe with no
 * markers, legend or overlays.
 */
const BrochureResourceMap = ({ fallbackImage, className = '' }: BrochureResourceMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const [failed, setFailed] = useState(false);

  /* ---- init map ---- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: mapboxgl.Map;
    let frame = 0;

    try {
      mapboxgl.accessToken = MAPBOX_TOKEN;
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: 'mapbox://styles/mapbox/satellite-streets-v12',
        projection: { name: 'globe' } as never,
        center: [-40, 22],
        zoom: 1.35,
        pitch: 0,
        bearing: 0,
        attributionControl: false,
        antialias: true,
        interactive: false,
      });
    } catch {
      setFailed(true);
      return;
    }

    mapRef.current = map;
    map.on('error', () => setFailed(true));

    map.on('load', () => {
      try {
        map.setFog({
          color: 'rgb(8, 20, 32)',
          'high-color': 'rgb(18, 60, 88)',
          'horizon-blend': 0.12,
          'space-color': 'rgb(2, 8, 18)',
          'star-intensity': 0.35,
        } as never);
      } catch { /* style may not support fog */ }

      // slow ambient drift, wraps around the world
      const drift = () => {
        const c = map.getCenter();
        c.lng -= 0.02;
        map.setCenter(c);
        frame = requestAnimationFrame(drift);
      };
      frame = requestAnimationFrame(drift);
    });

    return () => {
      cancelAnimationFrame(frame);
      map.remove();
      mapRef.current = null;
    };
  }, []);

  if (failed && fallbackImage) {
    return (
      <div
        className={`absolute inset-0 ${className}`}
        style={{ backgroundImage: `url(${fallbackImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
      />
    );
  }

  return (
    <div className={`absolute inset-0 ${className}`} data-no-flip>
      <div ref={containerRef} className="absolute inset-0" />
    </div>
  );
};

export default BrochureResourceMap;
