import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN =
  (import.meta.env.VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN as string | undefined) ||
  'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';

const CARACAS: [number, number] = [-66.9036, 10.4806];

interface BDVCaracasGlobeProps {
  /** Diameter in px of the circular globe */
  size?: number;
  accent?: string;
  zoom?: number;
}

/**
 * Static Mapbox globe (same engine as the platform resource map)
 * locked on Caracas with a single glowing pin at the center.
 * Users can still rotate / zoom it interactively.
 */
const BDVCaracasGlobe = ({ size = 430, accent = '#10b981', zoom = 2.6 }: BDVCaracasGlobeProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      projection: { name: 'globe' } as never,
      center: CARACAS,
      zoom,
      pitch: 0,
      bearing: 0,
      attributionControl: false,
      antialias: true,
    });

    mapRef.current = map;

    map.on('style.load', () => {
      map.setFog({
        color: 'rgb(8, 24, 38)',
        'high-color': accent,
        'horizon-blend': 0.12,
        'space-color': 'rgb(2, 8, 14)',
        'star-intensity': 0.35,
      } as never);
    });

    // Caracas pin
    const el = document.createElement('div');
    el.style.cssText = 'position:relative;width:16px;height:16px;';
    el.innerHTML = `
      <span style="position:absolute;inset:-12px;border-radius:9999px;background:${accent}33;animation:bdv-pin-ping 2s cubic-bezier(0,0,0.2,1) infinite"></span>
      <span style="position:absolute;inset:0;border-radius:9999px;background:#fff;box-shadow:0 0 12px ${accent},0 0 28px ${accent};border:2px solid ${accent}"></span>
    `;
    new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(CARACAS).addTo(map);

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, [accent, zoom]);

  return (
    <div
      className="relative rounded-full overflow-hidden"
      style={{
        width: size,
        height: size,
        boxShadow: `0 0 70px ${accent}55, inset 0 0 0 1px ${accent}55`,
      }}
    >
      <div ref={containerRef} className="absolute inset-0" />
      <div
        className="absolute inset-0 pointer-events-none rounded-full"
        style={{ boxShadow: `inset -28px -18px 60px rgba(0,0,0,0.6)` }}
      />
      <style>{`@keyframes bdv-pin-ping { 75%,100% { transform: scale(1.8); opacity: 0 } }`}</style>
    </div>
  );
};

export default BDVCaracasGlobe;
