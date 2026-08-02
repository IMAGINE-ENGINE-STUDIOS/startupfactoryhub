import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import bdvPinLogo from '@/assets/bdv-pin-logo.png.asset.json';

const MAPBOX_TOKEN =
  (import.meta.env.VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN as string | undefined) ||
  'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';

/** Avenida Universidad, esquina Sociedad — Sede Principal Banco de Venezuela, Caracas */
const BDV_HQ: [number, number] = [-66.9146, 10.5061];

interface BDVHeadquartersMapProps {
  accent?: string;
  zoom?: number;
}

/**
 * Mapbox map (same engine as the platform resource map) locked on the
 * Banco de Venezuela headquarters in Caracas. It never moves on its own —
 * only the user can rotate / zoom it.
 */
const BDVHeadquartersMap = ({ accent = '#10b981', zoom = 15.4 }: BDVHeadquartersMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    mapboxgl.accessToken = MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: BDV_HQ,
      zoom,
      pitch: 45,
      bearing: -18,
      attributionControl: false,
      antialias: true,
    });

    mapRef.current = map;

    const el = document.createElement('div');
    el.style.cssText = 'position:relative;width:46px;height:46px;';
    el.innerHTML = `
      <span style="position:absolute;inset:-10px;border-radius:9999px;background:${accent}2e;animation:bdv-hq-ping 2.2s cubic-bezier(0,0,0.2,1) infinite"></span>
      <span style="position:absolute;inset:0;border-radius:9999px;background:#ffffff;border:2px solid ${accent};box-shadow:0 0 14px ${accent},0 0 34px ${accent}80;display:flex;align-items:center;justify-content:center;overflow:hidden">
        <img src="${bdvPinLogo.url}" alt="Banco de Venezuela" style="width:32px;height:32px;object-fit:contain" />
      </span>
    `;
    new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(BDV_HQ).addTo(map);

    // The tile is laid out inside a flex/flip-book page, so the container often
    // has zero size when the map is created. Keep the canvas in sync with it.
    const ro = new ResizeObserver(() => map.resize());
    ro.observe(containerRef.current);
    const t1 = window.setTimeout(() => map.resize(), 250);
    const t2 = window.setTimeout(() => map.resize(), 1200);

    return () => {
      ro.disconnect();
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      map.remove();
      mapRef.current = null;
    };
  }, [accent, zoom]);


  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0" />
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ boxShadow: `inset 0 0 60px rgba(0,0,0,0.55), inset 0 0 0 1px ${accent}40` }}
      />
      <style>{`@keyframes bdv-hq-ping { 75%,100% { transform: scale(1.9); opacity: 0 } }`}</style>
    </div>
  );
};

export default BDVHeadquartersMap;
