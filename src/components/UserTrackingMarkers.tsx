import { useEffect, useRef } from 'react';
import mapboxgl from 'mapbox-gl';
import { TrackedUser } from '@/hooks/useMapTracking';

interface UserTrackingMarkersProps {
  map: mapboxgl.Map | null;
  trackedUsers: TrackedUser[];
}

export const UserTrackingMarkers = ({ map, trackedUsers }: UserTrackingMarkersProps) => {
  const markersRef = useRef<Map<string, mapboxgl.Marker>>(new Map());

  useEffect(() => {
    if (!map) return;

    // Get existing user IDs
    const existingUserIds = new Set(markersRef.current.keys());
    const currentUserIds = new Set(trackedUsers.map(u => u.userId));

    // Remove markers for users who left
    existingUserIds.forEach(userId => {
      if (!currentUserIds.has(userId)) {
        const marker = markersRef.current.get(userId);
        if (marker) {
          marker.remove();
          markersRef.current.delete(userId);
        }
      }
    });

    // Add or update markers for current users
    trackedUsers.forEach(user => {
      if (!user.latitude || !user.longitude) return;

      const existingMarker = markersRef.current.get(user.userId);

      if (existingMarker) {
        // Update existing marker position with animation
        existingMarker.setLngLat([user.longitude, user.latitude]);
      } else {
        // Create new marker
        const el = document.createElement('div');
        el.className = 'tracking-marker';
        el.innerHTML = `
          <style>
            @keyframes tracking-pulse {
              0%, 100% { transform: scale(1); opacity: 1; }
              50% { transform: scale(1.3); opacity: 0.5; }
            }
          </style>
          <div style="position: relative; display: flex; flex-direction: column; align-items: center;">
            <div style="
              position: relative;
              width: 32px;
              height: 32px;
            ">
              <div style="
                position: absolute;
                inset: 0;
                background: ${user.color}40;
                border-radius: 50%;
                animation: tracking-pulse 2s ease-in-out infinite;
              "></div>
              <div style="
                position: absolute;
                inset: 4px;
                background: ${user.color};
                border: 3px solid white;
                border-radius: 50%;
                box-shadow: 0 2px 8px rgba(0,0,0,0.3);
              "></div>
            </div>
            <div style="
              margin-top: 4px;
              padding: 2px 8px;
              background: ${user.color};
              color: white;
              font-size: 10px;
              font-weight: 600;
              border-radius: 10px;
              white-space: nowrap;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              max-width: 100px;
              overflow: hidden;
              text-overflow: ellipsis;
            ">${user.userName}</div>
          </div>
        `;

        const marker = new mapboxgl.Marker({
          element: el,
          anchor: 'bottom',
        })
          .setLngLat([user.longitude, user.latitude])
          .addTo(map);

        markersRef.current.set(user.userId, marker);
      }
    });

    // Cleanup on unmount
    return () => {
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current.clear();
    };
  }, [map, trackedUsers]);

  return null;
};
