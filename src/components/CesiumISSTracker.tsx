import { useEffect, useRef, useState } from 'react';

const CESIUM_CDN = 'https://cesium.com/downloads/cesiumjs/releases/1.119/Build/Cesium';

interface ISSPosition {
  latitude: number;
  longitude: number;
  altitude: number;
  velocity: number;
  timestamp: number;
}

export const CesiumISSTracker = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const entityRef = useRef<any>(null);
  const [issData, setIssData] = useState<ISSPosition | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch ISS position
  const fetchISSPosition = async (): Promise<ISSPosition | null> => {
    try {
      const res = await fetch('https://api.wheretheiss.at/v1/satellites/25544');
      if (!res.ok) throw new Error('Failed to fetch ISS data');
      const data = await res.json();
      return {
        latitude: data.latitude,
        longitude: data.longitude,
        altitude: data.altitude,
        velocity: data.velocity,
        timestamp: data.timestamp,
      };
    } catch {
      return null;
    }
  };

  // Load Cesium from CDN
  useEffect(() => {
    if ((window as any).Cesium) {
      setLoaded(true);
      return;
    }

    // Add CSS
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = `${CESIUM_CDN}/Widgets/widgets.css`;
    document.head.appendChild(link);

    // Add JS
    const script = document.createElement('script');
    script.src = `${CESIUM_CDN}/Cesium.js`;
    script.async = true;
    script.onload = () => setLoaded(true);
    script.onerror = () => setError('Failed to load globe engine');
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(link);
      document.head.removeChild(script);
    };
  }, []);

  // Initialize viewer
  useEffect(() => {
    if (!loaded || !containerRef.current || viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    // Use default Cesium Ion token
    Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiI0OGZlNjBhMS01MjdkLTQ1NWYtOGRiNy1mOGEzNzA1NmMzNjYiLCJpZCI6MjU5LCJpYXQiOjE3MjcyNjA2OTd9.Dp1nJWisWaCVIhBbSeEMKVYguByBDvxfJKxqUyF_GmE';

    try {
      const viewer = new Cesium.Viewer(containerRef.current, {
        terrain: Cesium.Terrain.fromWorldTerrain(),
        baseLayerPicker: false,
        geocoder: false,
        homeButton: false,
        infoBox: false,
        navigationHelpButton: false,
        selectionIndicator: false,
        timeline: false,
        animation: false,
        fullscreenButton: false,
        sceneModePicker: false,
        creditContainer: document.createElement('div'), // Hide credits
        skyBox: new Cesium.SkyBox({
          sources: {
            positiveX: `${CESIUM_CDN}/Assets/Textures/SkyBox/tycho2t3_80_px.jpg`,
            negativeX: `${CESIUM_CDN}/Assets/Textures/SkyBox/tycho2t3_80_mx.jpg`,
            positiveY: `${CESIUM_CDN}/Assets/Textures/SkyBox/tycho2t3_80_py.jpg`,
            negativeY: `${CESIUM_CDN}/Assets/Textures/SkyBox/tycho2t3_80_my.jpg`,
            positiveZ: `${CESIUM_CDN}/Assets/Textures/SkyBox/tycho2t3_80_pz.jpg`,
            negativeZ: `${CESIUM_CDN}/Assets/Textures/SkyBox/tycho2t3_80_mz.jpg`,
          },
        }),
      });

      // Dark space atmosphere
      viewer.scene.globe.enableLighting = true;
      viewer.scene.skyAtmosphere.brightnessShift = -0.3;
      viewer.scene.backgroundColor = Cesium.Color.fromCssColorString('#020617');

      // Add ISS entity
      const issEntity = viewer.entities.add({
        name: 'International Space Station',
        position: Cesium.Cartesian3.fromDegrees(0, 0, 408000),
        point: {
          pixelSize: 14,
          color: Cesium.Color.fromCssColorString('#22d3ee'),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1.5, 1.5e8, 0.5),
        },
        label: {
          text: '🛰 ISS',
          font: '13px monospace',
          fillColor: Cesium.Color.CYAN,
          outlineColor: Cesium.Color.BLACK,
          outlineWidth: 2,
          style: Cesium.LabelStyle.FILL_AND_OUTLINE,
          verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
          pixelOffset: new Cesium.Cartesian2(0, -20),
          scaleByDistance: new Cesium.NearFarScalar(1.5e6, 1, 1.5e8, 0.4),
        },
        path: {
          leadTime: 3600,
          trailTime: 3600,
          width: 2,
          material: new Cesium.ColorMaterialProperty(
            Cesium.Color.CYAN.withAlpha(0.4)
          ),
        },
      });

      entityRef.current = issEntity;
      viewerRef.current = viewer;

      // Initial camera view
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(0, 20, 20000000),
        duration: 0,
      });
    } catch (e) {
      setError('Failed to initialize globe');
    }

    return () => {
      if (viewerRef.current && !viewerRef.current.isDestroyed()) {
        viewerRef.current.destroy();
        viewerRef.current = null;
      }
    };
  }, [loaded]);

  // Poll ISS position
  useEffect(() => {
    if (!loaded) return;
    
    let cancelled = false;
    const update = async () => {
      const pos = await fetchISSPosition();
      if (pos && !cancelled) {
        setIssData(pos);
        const Cesium = (window as any).Cesium;
        if (Cesium && entityRef.current) {
          entityRef.current.position = Cesium.Cartesian3.fromDegrees(
            pos.longitude, pos.latitude, pos.altitude * 1000
          );
        }
      }
    };

    update();
    const interval = setInterval(update, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [loaded]);

  // Fly to ISS on first data
  useEffect(() => {
    if (!issData || !viewerRef.current) return;
    const Cesium = (window as any).Cesium;
    if (!Cesium) return;

    viewerRef.current.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        issData.longitude, issData.latitude, 8000000
      ),
      orientation: {
        heading: 0,
        pitch: Cesium.Math.toRadians(-45),
        roll: 0,
      },
      duration: 3,
    });
  // Only fly once on first data
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!issData]);

  if (error) {
    return (
      <div className="w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-xl bg-card/80 flex items-center justify-center">
        <p className="text-muted-foreground text-sm">{error}</p>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      <div
        ref={containerRef}
        className="w-full h-[400px] sm:h-[500px] lg:h-[600px] rounded-xl overflow-hidden"
        style={{ background: '#020617', overflow: 'hidden' }}
      />
      
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-card/80 rounded-xl">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground font-mono">LOADING CESIUM GLOBE...</span>
          </div>
        </div>
      )}

      {/* ISS Telemetry overlay */}
      {issData && (
        <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm border border-cyan-500/30 rounded-lg p-3 text-[10px] font-mono text-cyan-300 space-y-1">
          <div className="text-cyan-400 font-bold text-xs mb-1">🛰 ISS TELEMETRY</div>
          <div>LAT: {issData.latitude.toFixed(4)}°</div>
          <div>LNG: {issData.longitude.toFixed(4)}°</div>
          <div>ALT: {issData.altitude.toFixed(1)} km</div>
          <div>VEL: {issData.velocity.toFixed(1)} km/h</div>
        </div>
      )}
    </div>
  );
};
