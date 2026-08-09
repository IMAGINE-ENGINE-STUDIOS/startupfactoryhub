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
 * Presentation-only world map with zoom + drag controls.
 * Auto-drifts until the user interacts, then stays where they leave it.
 */
const BrochureResourceMap = ({ fallbackImage, className = '' }: BrochureResourceMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const interactedRef = useRef(false);
  const [failed, setFailed] = useState(false);

  /* ---- init map ---- */
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let map: mapboxgl.Map;
    let frame = 0;
    let visible = true;

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
        // perf: MSAA is expensive on a decorative globe and causes frame drops
        antialias: false,
        interactive: true,
        // perf: cap the render resolution — retina/scaled flipbook pages otherwise
        // rasterise 3-4x the pixels needed for a presentation surface
        maxPixelRatio: Math.min(window.devicePixelRatio || 1, 1.5),
        // perf: no cross-fading between tile zooms -> no flicker while zooming
        fadeDuration: 0,
        refreshExpiredTiles: false,
        preserveDrawingBuffer: false,
        trackResize: false,
} as never);
    } catch {
      setFailed(true);
      return;
    }

    mapRef.current = map;
    map.on('error', () => setFailed(true));

    // The brochure page is CSS-scaled/animated, so Mapbox mis-measures its own
    // container (canvas ends up the wrong size and the map looks blank).
    const internals = map as unknown as {
      _containerWidth: number;
      _containerHeight: number;
      _updateContainerDimensions: () => void;
    };
    internals._updateContainerDimensions = () => {
      internals._containerWidth = containerRef.current?.clientWidth || 1;
      internals._containerHeight = containerRef.current?.clientHeight || 1;
    };

    const container = containerRef.current;
    let lastW = 0;
    let lastH = 0;
    let resizeFrame = 0;
    const sync = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w < 2 || h < 2) return;
      if (w === lastW && h === lastH) return;
      lastW = w;
      lastH = h;
      map.resize();
    };
    // coalesce bursts of resize callbacks fired during the flip animation
    const scheduleSync = () => {
      if (resizeFrame) return;
      resizeFrame = requestAnimationFrame(() => {
        resizeFrame = 0;
        sync();
      });
    };
    const ro = new ResizeObserver(scheduleSync);
    ro.observe(container);
    const timers = [120, 400, 900, 1800, 3000].map((ms) => window.setTimeout(sync, ms));

    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'bottom-right');
    map.scrollZoom.enable();
    // perf: smaller wheel steps + no easing tail -> no jumpy zoom on trackpads
    map.scrollZoom.setZoomRate(1 / 250);
    map.scrollZoom.setWheelZoomRate(1 / 250);
    map.dragPan.enable();
    map.doubleClickZoom.enable();
    map.touchZoomRotate.enable();
    // decorative globe: rotation/pitch gestures only add jitter here
    map.touchZoomRotate.disableRotation();
    map.dragRotate.disable();

    const stopDrift = () => { interactedRef.current = true; };
    map.on('mousedown', stopDrift);
    map.on('touchstart', stopDrift);
    map.on('wheel', stopDrift);
    map.on('dragstart', stopDrift);
    map.on('zoomstart', stopDrift);

    // only animate while the slide is actually on screen and the tab is active
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (visible) scheduleSync();
      },
      { threshold: 0.01 },
    );
    io.observe(container);
    const onVisibility = () => { visible = document.visibilityState === 'visible'; };
    document.addEventListener('visibilitychange', onVisibility);

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

      // slow ambient drift until the user takes control — time-based so the
      // speed is identical on 60Hz and 120Hz displays and never stutters
      const DEG_PER_MS = 0.0012;
      let last = performance.now();
      const drift = (now: number) => {
        const dt = Math.min(now - last, 64);
        last = now;
        if (!interactedRef.current && visible && !map.isMoving()) {
          const c = map.getCenter();
          c.lng -= DEG_PER_MS * dt;
          map.jumpTo({ center: c });
        }
        frame = requestAnimationFrame(drift);
      };
      frame = requestAnimationFrame(drift);
    });

    return () => {
      cancelAnimationFrame(frame);
      if (resizeFrame) cancelAnimationFrame(resizeFrame);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVisibility);
      timers.forEach(window.clearTimeout);
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
    <div
      className={`absolute inset-0 overflow-hidden brochure-res-map ${className}`}
      data-no-flip
      style={{ touchAction: 'none' }}
      onPointerDown={(e) => e.stopPropagation()}
      onPointerMove={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      onWheel={(e) => e.stopPropagation()}
    >
      <div ref={containerRef} className="absolute inset-0" />
      <style>{`
        .brochure-res-map .mapboxgl-map,
        .brochure-res-map .mapboxgl-canvas-container,
        .brochure-res-map .mapboxgl-canvas { width: 100% !important; height: 100% !important; }
        .brochure-res-map .mapboxgl-canvas { display: block; outline: none; }
        /* keep zoom controls fully inside the page, never clipped by the card edge */
        .brochure-res-map .mapboxgl-ctrl-bottom-right { right: 10px; bottom: 34px; z-index: 5; }
        .brochure-res-map .mapboxgl-ctrl-group {
          background: rgba(6, 20, 26, 0.72);
          border: 1px solid rgba(94, 234, 212, 0.28);
          border-radius: 10px;
          box-shadow: 0 4px 18px rgba(0,0,0,0.45);
          overflow: hidden;
        }
        .brochure-res-map .mapboxgl-ctrl-group button { width: 32px; height: 32px; background: transparent; }
        .brochure-res-map .mapboxgl-ctrl-group button + button { border-top: 1px solid rgba(94,234,212,0.2); }
        .brochure-res-map .mapboxgl-ctrl-group button .mapboxgl-ctrl-icon { filter: invert(1) brightness(1.6); }
      `}</style>
    </div>
  );

};



export default BrochureResourceMap;
