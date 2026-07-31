/**
 * Map viewport persistence.
 *
 * Saves the last camera (center, zoom, pitch, bearing) of a map so returning
 * to it — after navigation, a reload, or a crash — restores the exact view.
 */

const PREFIX = "mapViewport:";
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export type MapView = {
  lng: number;
  lat: number;
  zoom: number;
  pitch: number;
  bearing: number;
  t: number;
};

const isFiniteNum = (n: unknown): n is number =>
  typeof n === "number" && Number.isFinite(n);

export function loadMapView(key = "resources"): MapView | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const v = JSON.parse(raw) as MapView;
    if (!isFiniteNum(v?.lng) || !isFiniteNum(v?.lat) || !isFiniteNum(v?.zoom)) {
      return null;
    }
    if (Date.now() - (v.t ?? 0) > MAX_AGE_MS) return null;
    return {
      lng: v.lng,
      lat: v.lat,
      zoom: v.zoom,
      pitch: isFiniteNum(v.pitch) ? v.pitch : 45,
      bearing: isFiniteNum(v.bearing) ? v.bearing : 0,
      t: v.t,
    };
  } catch {
    return null;
  }
}

export function saveMapView(
  view: Omit<MapView, "t">,
  key = "resources",
): void {
  if (typeof window === "undefined") return;
  if (!isFiniteNum(view.lng) || !isFiniteNum(view.lat) || !isFiniteNum(view.zoom)) return;
  try {
    localStorage.setItem(
      PREFIX + key,
      JSON.stringify({ ...view, t: Date.now() }),
    );
  } catch {
    /* quota / private mode — ignore */
  }
}

/** Attach save-on-move listeners to a Mapbox map. Returns a cleanup fn. */
export function attachMapViewPersistence(
  map: {
    getCenter: () => { lng: number; lat: number };
    getZoom: () => number;
    getPitch: () => number;
    getBearing: () => number;
    on: (ev: string, cb: () => void) => void;
    off: (ev: string, cb: () => void) => void;
  },
  key = "resources",
): () => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  const capture = () => {
    try {
      const c = map.getCenter();
      saveMapView(
        {
          lng: c.lng,
          lat: c.lat,
          zoom: map.getZoom(),
          pitch: map.getPitch(),
          bearing: map.getBearing(),
        },
        key,
      );
    } catch {
      /* map torn down mid-flight — ignore */
    }
  };

  const onMoveEnd = () => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(capture, 250);
  };

  const onHide = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
    capture();
  };

  map.on("moveend", onMoveEnd);
  map.on("zoomend", onMoveEnd);
  map.on("pitchend", onMoveEnd);
  map.on("rotateend", onMoveEnd);
  window.addEventListener("pagehide", onHide);
  window.addEventListener("beforeunload", onHide);

  return () => {
    if (timeout) clearTimeout(timeout);
    try {
      map.off("moveend", onMoveEnd);
      map.off("zoomend", onMoveEnd);
      map.off("pitchend", onMoveEnd);
      map.off("rotateend", onMoveEnd);
    } catch {
      /* ignore */
    }
    window.removeEventListener("pagehide", onHide);
    window.removeEventListener("beforeunload", onHide);
  };
}
