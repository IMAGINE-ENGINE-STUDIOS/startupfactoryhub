import { useEffect, useMemo, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useResources } from '@/hooks/useResources';

const MAPBOX_TOKEN =
  (import.meta.env.VITE_LOVABLE_CONNECTOR_MAPBOX_PUBLIC_TOKEN as string | undefined) ||
  'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';

const MAX_MARKERS = 120;

/** Brochure palette per resource family */
const TYPE_COLOR: Record<string, string> = {
  office: '#0ea5b7',
  coworking: '#0ea5b7',
  workplace: '#0ea5b7',
  lab: '#a3e635',
  technology_transfer: '#a3e635',
  university: '#a3e635',
  accelerator_incubator: '#f472b6',
  investor_network: '#f472b6',
  banking: '#f472b6',
  government_grant: '#fbbf24',
  chamber_of_commerce: '#fbbf24',
  national_archives: '#fbbf24',
  perk: '#38bdf8',
  community: '#38bdf8',
  event: '#38bdf8',
  venue: '#38bdf8',
  human_capital: '#38bdf8',
  other: '#94a3b8',
};

const LEGEND: { label: string; color: string }[] = [
  { label: 'Spaces', color: '#0ea5b7' },
  { label: 'Labs & Universities', color: '#a3e635' },
  { label: 'Capital', color: '#f472b6' },
  { label: 'Public Programs', color: '#fbbf24' },
];

interface BrochureResourceMapProps {
  accent?: string;
  /** Image rendered if Mapbox fails to initialise */
  fallbackImage?: string;
  className?: string;
}

/**
 * Presentation-only flat world map of the real SFH resource network.
 * Non-interactive so it never competes with the flipbook gesture.
 */
const BrochureResourceMap = ({ accent = '#0ea5b7', fallbackImage, className = '' }: BrochureResourceMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  const { data: resources } = useResources();

  const points = useMemo(
    () =>
      (resources ?? [])
        .filter((r) => typeof r.latitude === 'number' && typeof r.longitude === 'number')
        .slice(0, MAX_MARKERS)
        .map((r) => ({
          id: r.id,
          coords: [r.longitude as number, r.latitude as number] as [number, number],
          color: TYPE_COLOR[r.resource_type] ?? TYPE_COLOR.other,
        })),
    [resources],
  );

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
      setReady(true);

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
      markersRef.current.forEach((m) => m.remove());
      markersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, []);

  /* ---- markers ---- */
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !ready) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = points.map((p) => {
      const el = document.createElement('div');
      el.style.cssText = 'position:relative;width:7px;height:7px;pointer-events:none;';
      el.innerHTML = `
        <span style="position:absolute;inset:-6px;border-radius:9999px;background:${p.color}33;animation:sfh-globe-ping 2.6s cubic-bezier(0,0,0.2,1) infinite"></span>
        <span style="position:absolute;inset:0;border-radius:9999px;background:#fff;box-shadow:0 0 8px ${p.color},0 0 18px ${p.color};border:1.5px solid ${p.color}"></span>
      `;
      return new mapboxgl.Marker({ element: el, anchor: 'center' }).setLngLat(p.coords).addTo(map);
    });
  }, [points, ready]);

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

      {/* subtle vignette so overlays stay legible */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: `radial-gradient(75% 65% at 50% 45%, transparent 30%, rgba(2,8,18,0.55) 100%)` }}
      />

      {/* corner label */}
      <div
        className="absolute top-3 left-3 font-mono text-[9px] tracking-[0.3em] uppercase pointer-events-none"
        style={{ color: accent, textShadow: '0 1px 6px rgba(0,0,0,0.9)' }}
      >
        Global Resource Network
      </div>

      {/* live count */}
      <div
        className="absolute top-3 right-3 font-mono text-[8.5px] px-2 py-0.5 rounded-full border pointer-events-none"
        style={{ color: accent, borderColor: `${accent}60`, background: 'rgba(3,16,26,0.75)' }}
      >
        {points.length ? `${points.length}+ NODES` : 'SYNCING'}
      </div>

      {/* legend */}
      <div className="absolute left-3 top-9 flex flex-col gap-1 pointer-events-none">
        {LEGEND.map((l) => (
          <div key={l.label} className="flex items-center gap-1.5">
            <span
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{ background: l.color, boxShadow: `0 0 6px ${l.color}` }}
            />
            <span
              className="font-mono text-[8px] tracking-[0.18em] uppercase"
              style={{ color: '#dbeafe', textShadow: '0 1px 6px rgba(0,0,0,0.95)' }}
            >
              {l.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BrochureResourceMap;
