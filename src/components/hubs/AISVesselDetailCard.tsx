import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { X, Ship, Navigation, Gauge, Anchor, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AISVessel, AISTrackPoint, getVesselTypeLabel, getVesselColor, NAV_STATUS_LABELS } from '@/hooks/useAISTracking';
import { cn } from '@/lib/utils';

interface AISVesselDetailCardProps {
  vessel: AISVessel;
  trackHistory: AISTrackPoint[];
  map: mapboxgl.Map | null;
  onClose: () => void;
}

const TRACK_SOURCE = 'ais-track-source';
const TRACK_LAYER = 'ais-track-layer';

export const AISVesselDetailCard = ({ vessel, trackHistory, map, onClose }: AISVesselDetailCardProps) => {
  const trackAdded = useRef(false);

  // Draw track history polyline
  useEffect(() => {
    if (!map || trackHistory.length < 2) return;

    const geojson: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: trackHistory.map(p => [p.lng, p.lat]),
        },
        properties: {},
      }],
    };

    try {
      if (map.getSource(TRACK_SOURCE)) {
        (map.getSource(TRACK_SOURCE) as mapboxgl.GeoJSONSource).setData(geojson);
      } else {
        map.addSource(TRACK_SOURCE, { type: 'geojson', data: geojson });
        map.addLayer({
          id: TRACK_LAYER,
          type: 'line',
          source: TRACK_SOURCE,
          paint: {
            'line-color': getVesselColor(vessel.type),
            'line-width': 3,
            'line-dasharray': [2, 2],
            'line-opacity': 0.7,
          },
        });
        trackAdded.current = true;
      }
    } catch (e) {
      console.error('Track draw error:', e);
    }

    return () => {
      try {
        if (map.getLayer(TRACK_LAYER)) map.removeLayer(TRACK_LAYER);
        if (map.getSource(TRACK_SOURCE)) map.removeSource(TRACK_SOURCE);
      } catch (e) { /* ok */ }
      trackAdded.current = false;
    };
  }, [map, trackHistory, vessel.type]);

  // Fly to vessel
  useEffect(() => {
    if (map) {
      map.flyTo({ center: [vessel.longitude, vessel.latitude], zoom: 12, duration: 1500 });
    }
  }, [map, vessel.mmsi]);

  const speedKnots = vessel.sog / 10;
  const color = getVesselColor(vessel.type);
  const timeStr = vessel.time ? new Date(vessel.time).toLocaleString() : 'N/A';

  return (
    <div className="absolute bottom-20 left-4 z-40 w-80 backdrop-blur-3xl bg-white/10 dark:bg-black/30 border border-white/20 shadow-2xl rounded-2xl overflow-hidden animate-in slide-in-from-bottom-4">
      {/* Header */}
      <div className="p-4 flex items-start justify-between" style={{ borderBottom: `2px solid ${color}40` }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: `${color}30` }}>
            <Ship className="w-5 h-5" style={{ color }} />
          </div>
          <div>
            <h3 className="font-semibold text-sm">{vessel.name || `MMSI: ${vessel.mmsi}`}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <Badge variant="outline" className="text-[10px] px-1.5 py-0" style={{ borderColor: `${color}60`, color }}>
                {getVesselTypeLabel(vessel.type)}
              </Badge>
              {vessel.callsign && (
                <span className="text-[10px] text-muted-foreground">{vessel.callsign}</span>
              )}
            </div>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 rounded-full hover:bg-white/10">
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Details */}
      <div className="p-4 space-y-3 text-sm">
        <div className="grid grid-cols-2 gap-3">
          <DetailItem icon={<Gauge className="w-3.5 h-3.5" />} label="Speed" value={`${speedKnots.toFixed(1)} kn`} />
          <DetailItem icon={<Navigation className="w-3.5 h-3.5" />} label="Course" value={`${vessel.cog.toFixed(1)}°`} />
          <DetailItem icon={<Anchor className="w-3.5 h-3.5" />} label="Status" value={NAV_STATUS_LABELS[vessel.navstat] || 'Unknown'} />
          <DetailItem icon={<Ship className="w-3.5 h-3.5" />} label="MMSI" value={String(vessel.mmsi)} />
        </div>

        {vessel.dest && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <MapPin className="w-3 h-3" />
            <span>Destination: <span className="text-foreground font-medium">{vessel.dest}</span></span>
          </div>
        )}

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span>{vessel.latitude.toFixed(5)}, {vessel.longitude.toFixed(5)}</span>
        </div>

        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          <span>Last reported: {timeStr}</span>
        </div>

        {trackHistory.length > 1 && (
          <div className="pt-2 border-t border-white/10">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Track History</p>
            <p className="text-xs text-muted-foreground">
              {trackHistory.length} positions recorded · Dashed line shown on map
            </p>
          </div>
        )}

        {vessel.draught > 0 && (
          <div className="text-xs text-muted-foreground">
            Draught: {vessel.draught.toFixed(1)}m · IMO: {vessel.imo || 'N/A'}
          </div>
        )}
      </div>
    </div>
  );
};

function DetailItem({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="text-muted-foreground">{icon}</div>
      <div>
        <p className="text-[10px] text-muted-foreground">{label}</p>
        <p className="text-xs font-medium">{value}</p>
      </div>
    </div>
  );
}
