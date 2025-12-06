import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useResources, Resource, ResourceType } from '@/hooks/useResources';
import { useMapTracking } from '@/hooks/useMapTracking';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { 
  Building2, 
  Beaker, 
  MapPin, 
  Gift, 
  Landmark, 
  RefreshCw, 
  Users, 
  DollarSign, 
  Rocket, 
  GraduationCap, 
  School, 
  Briefcase, 
  TrendingUp,
  Search,
  ExternalLink,
  Navigation,
  Bookmark,
  Plus,
  X,
  Menu,
  ChevronRight,
  Pause,
  Play,
  Locate,
  Loader2,
  Mail,
  Radio,
  MapPinned,
  Home,
  CalendarDays,
  Clock,
  Users2
} from 'lucide-react';
import { AddResourceDialog } from './AddResourceDialog';
import { TrackingSessionDialog } from './TrackingSessionDialog';
import { UserTrackingMarkers } from './UserTrackingMarkers';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useEventsForMap, MapEvent } from '@/hooks/useEventsForMap';
import { format } from 'date-fns';

mapboxgl.accessToken = 'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';

const RESOURCE_CONFIG: Record<ResourceType, { icon: any; color: string; label: string }> = {
  office: { icon: Building2, color: '#ef4444', label: 'Office' },
  lab: { icon: Beaker, color: '#f97316', label: 'Laboratory' },
  venue: { icon: MapPin, color: '#eab308', label: 'Venue' },
  perk: { icon: Gift, color: '#22c55e', label: 'Perk' },
  chamber_of_commerce: { icon: Landmark, color: '#06b6d4', label: 'Chamber' },
  technology_transfer: { icon: RefreshCw, color: '#8b5cf6', label: 'Tech Transfer' },
  community: { icon: Users, color: '#ec4899', label: 'Community' },
  government_grant: { icon: DollarSign, color: '#3b82f6', label: 'Gov Grant' },
  accelerator_incubator: { icon: Rocket, color: '#6366f1', label: 'Accelerator' },
  entrepreneur_center: { icon: GraduationCap, color: '#a855f7', label: 'Entrepreneur' },
  university: { icon: School, color: '#dc2626', label: 'University' },
  coworking: { icon: Briefcase, color: '#14b8a6', label: 'Coworking' },
  investor_network: { icon: TrendingUp, color: '#facc15', label: 'Investor Net' },
  human_capital: { icon: Users, color: '#0ea5e9', label: 'Human Capital' },
  event: { icon: CalendarDays, color: '#f43f5e', label: 'Events' },
  other: { icon: MapPin, color: '#64748b', label: 'Other' },
};

export const GlobalResourcesMap = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const addressMarker = useRef<mapboxgl.Marker | null>(null);
  const acceleratorMarker = useRef<mapboxgl.Marker | null>(null);
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null);
  const [search, setSearch] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [acceleratorLocation, setAcceleratorLocation] = useState<{lat: number; lng: number; name: string; logo?: string} | null>(null);
  const [isRotating, setIsRotating] = useState(true);
  const isRotatingRef = useRef(true);
  const eventMarkers = useRef<mapboxgl.Marker[]>([]);
  const [userEventStatus, setUserEventStatus] = useState<string | null>(null);
  const [isUpdatingRsvp, setIsUpdatingRsvp] = useState(false);

  // Address search state
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Tracking session state
  const [searchParams, setSearchParams] = useSearchParams();
  const [trackingSessionId, setTrackingSessionId] = useState<string | null>(
    searchParams.get('tracking')
  );
  const [showTrackingDialog, setShowTrackingDialog] = useState(false);

  const {
    trackedUsers,
    currentUser,
    userColor,
    isTracking,
    startTracking,
    stopTracking,
    generateSessionId,
  } = useMapTracking(trackingSessionId);

  // Add pulsing glow animation for flagship hubs and events
  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      @keyframes pulse-glow {
        0%, 100% {
          box-shadow: 0 4px 16px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(0,0,0,0.3);
        }
        50% {
          box-shadow: 0 6px 24px rgba(16, 185, 129, 0.7), 0 0 30px rgba(16, 185, 129, 0.5), 0 4px 12px rgba(0,0,0,0.4);
        }
      }
      @keyframes pulse-event {
        0%, 100% {
          box-shadow: 0 4px 12px rgba(244, 63, 94, 0.5), 0 0 20px rgba(244, 63, 94, 0.3);
          transform: scale(1);
        }
        50% {
          box-shadow: 0 6px 20px rgba(244, 63, 94, 0.7), 0 0 30px rgba(244, 63, 94, 0.5);
          transform: scale(1.05);
        }
      }
    `;
    document.head.appendChild(style);
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Fetch accelerator profile location if user is accelerator
  useEffect(() => {
    if (!user || role !== 'accelerator') return;
    
    const fetchAcceleratorLocation = async () => {
      const { data, error } = await supabase
        .from('accelerator_profiles')
        .select('latitude, longitude, organization_name, logo_url')
        .eq('user_id', user.id)
        .single();
      
      if (!error && data && data.latitude && data.longitude) {
        setAcceleratorLocation({
          lat: data.latitude,
          lng: data.longitude,
          name: data.organization_name,
          logo: data.logo_url || undefined
        });
      }
    };

    fetchAcceleratorLocation();
  }, [user, role]);

  const { data: resources, isLoading } = useResources({ 
    type: selectedType === 'event' ? undefined : selectedType || undefined,
    search: search || undefined
  });

  // Fetch events for map
  const { data: mapEvents, isLoading: isLoadingEvents, refetch: refetchEvents } = useEventsForMap();

  // Geocode address using Mapbox
  const geocodeAddress = useCallback(async (query: string) => {
    if (!query || query.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${mapboxgl.accessToken}&types=address,place,poi&limit=5`
      );
      const data = await response.json();
      
      if (data.features) {
        setAddressSuggestions(data.features);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
  }, []);

  // Handle address selection from suggestions
  const handleAddressSelect = useCallback((feature: any) => {
    const [lng, lat] = feature.center;
    
    // Remove existing address marker
    if (addressMarker.current) {
      addressMarker.current.remove();
    }

    // Create a temporary address marker
    const el = document.createElement('div');
    el.innerHTML = `
      <div style="position: relative;">
        <div style="
          width: 40px;
          height: 40px;
          background: linear-gradient(135deg, #3b82f6, #8b5cf6);
          border: 3px solid white;
          border-radius: 50% 50% 50% 0;
          transform: rotate(-45deg);
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.5);
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(45deg);
            color: white;
            font-size: 16px;
          ">📍</div>
        </div>
      </div>
    `;

    addressMarker.current = new mapboxgl.Marker({
      element: el,
      anchor: 'bottom',
    })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup().setHTML(`
        <div style="padding: 8px;">
          <strong>${feature.text}</strong>
          <p style="color: #666; font-size: 12px; margin-top: 4px;">${feature.place_name}</p>
        </div>
      `))
      .addTo(map.current!);

    // Open the popup
    addressMarker.current.togglePopup();

    // Fly to the address
    map.current?.flyTo({
      center: [lng, lat],
      zoom: 15,
      duration: 2000,
    });

    setSearch(feature.place_name);
    setShowSuggestions(false);
    setAddressSuggestions([]);

    toast({
      title: "Address found",
      description: feature.place_name,
    });
  }, []);

  // Debounced search for addresses
  useEffect(() => {
    const timer = setTimeout(() => {
      // Check if it looks like an address (has numbers or common address keywords)
      const isAddressLike = /\d/.test(search) || 
        /\b(st|street|ave|avenue|blvd|road|rd|drive|dr|way|lane|ln|court|ct|place|pl)\b/i.test(search);
      
      if (isAddressLike && search.length >= 5) {
        geocodeAddress(search);
      } else {
        setAddressSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, geocodeAddress]);

  // Tracking session handlers
  const handleCreateSession = useCallback(() => {
    const newSessionId = generateSessionId();
    setTrackingSessionId(newSessionId);
    setSearchParams({ tracking: newSessionId });
    toast({
      title: "Tracking session created",
      description: "Share the link with others to track locations together",
    });
  }, [generateSessionId, setSearchParams]);

  const handleJoinSession = useCallback((sessionId: string) => {
    setTrackingSessionId(sessionId);
    setSearchParams({ tracking: sessionId });
    toast({
      title: "Joined tracking session",
      description: "You've joined the location tracking session",
    });
  }, [setSearchParams]);

  const handleLeaveSession = useCallback(() => {
    stopTracking();
    setTrackingSessionId(null);
    setSearchParams({});
    toast({
      title: "Left tracking session",
      description: "You've left the location tracking session",
    });
  }, [stopTracking, setSearchParams]);

  const requestUserLocation = () => {
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const coords = { lat: position.coords.latitude, lng: position.coords.longitude };
        setUserLocation(coords);
        map.current?.flyTo({ center: [coords.lng, coords.lat], zoom: 10, duration: 2000 });
        setIsLocating(false);
        toast({ title: "Location found", description: "Showing your current location" });
      },
      (error) => {
        toast({ title: "Location unavailable", description: "Unable to get your location", variant: "destructive" });
        setIsLocating(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 0
      }
    );
  };

  // Fetch user's RSVP status when event is selected
  useEffect(() => {
    const fetchUserEventStatus = async () => {
      if (!user || !selectedEvent) {
        setUserEventStatus(null);
        return;
      }

      const { data } = await supabase
        .from('event_attendees')
        .select('status')
        .eq('event_id', selectedEvent.id)
        .eq('user_id', user.id)
        .maybeSingle();

      setUserEventStatus(data?.status || null);
    };

    fetchUserEventStatus();
  }, [user, selectedEvent?.id]);

  // Handle RSVP attendance
  const handleEventAttendance = async (status: 'going' | 'maybe' | 'declined') => {
    if (!user || !selectedEvent) return;

    setIsUpdatingRsvp(true);
    try {
      const { error } = await supabase
        .from('event_attendees')
        .upsert({
          event_id: selectedEvent.id,
          user_id: user.id,
          status
        }, { onConflict: 'event_id,user_id' });

      if (error) throw error;

      setUserEventStatus(status);
      refetchEvents();
      toast({
        title: status === 'going' ? "You're going!" : status === 'maybe' ? "Marked as maybe" : "RSVP declined",
        description: status === 'going' ? `You'll attend ${selectedEvent.title}` : undefined,
      });
    } catch (error) {
      console.error('RSVP error:', error);
      toast({
        title: "Failed to update RSVP",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUpdatingRsvp(false);
    }
  };

  // Real-time subscription for event attendees
  useEffect(() => {
    const channel = supabase
      .channel('map-event-attendees')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'event_attendees' },
        () => refetchEvents()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchEvents]);

  // Helper: Create marker icon for native markers
  const createMarkerIcon = (color: string, type: ResourceType) => {
    const size = 48;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return { width: size, height: size, data: new Uint8Array(size * size * 4) };
    }

    // Draw teardrop pin shape
    ctx.save();
    ctx.translate(size / 2, size / 2);
    ctx.beginPath();
    ctx.arc(0, -6, 12, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw pin tip
    ctx.beginPath();
    ctx.moveTo(-6, 2);
    ctx.lineTo(0, 12);
    ctx.lineTo(6, 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    
    // Add white center dot
    ctx.beginPath();
    ctx.arc(0, -6, 4, 0, Math.PI * 2);
    ctx.fillStyle = 'white';
    ctx.fill();
    
    ctx.restore();
    
    // Convert to ImageData
    return ctx.getImageData(0, 0, size, size);
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/imagineengine/cmhfkp1ie001d01qi2hyg82lp',
      projection: { name: 'globe' },
      zoom: 2.5,
      center: [-122.4, 37.8],
      pitch: 45,
      antialias: true,
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ visualizePitch: true }),
      'top-right'
    );

    map.current.on('style.load', () => {
      if (!map.current) return;
      
      map.current.setFog({
        color: '#0f172a',
        'high-color': '#1e293b',
        'horizon-blend': 0.02,
        'space-color': '#020617',
        'star-intensity': 0.15
      });
      
      // Add marker icons for each resource type
      Object.entries(RESOURCE_CONFIG).forEach(([type, config]) => {
        const canvas = createMarkerIcon(config.color, type as ResourceType);
        map.current!.addImage(`marker-${type}`, canvas);
      });

      // Add GeoJSON source for markers
      map.current.addSource('resources', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: []
        }
      });

      // Add symbol layer for native markers
      map.current.addLayer({
        id: 'resource-markers',
        type: 'symbol',
        source: 'resources',
        layout: {
          'icon-image': ['concat', 'marker-', ['get', 'resourceType']],
          'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.4,
            5, 0.6,
            10, 0.8,
            15, 1.0
          ],
          'icon-anchor': 'bottom',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        }
      });

      // Click handler for native markers
      map.current.on('click', 'resource-markers', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const resourceId = feature.properties?.id;
        const resource = resources?.find(r => r.id === resourceId);
        if (resource) {
          setSelectedResource(resource);
          map.current?.flyTo({
            center: [resource.longitude!, resource.latitude!],
            zoom: 12,
            duration: 2000,
          });
        }
      });

      // Cursor pointer on hover
      map.current.on('mouseenter', 'resource-markers', () => {
        if (map.current) map.current.getCanvas().style.cursor = 'pointer';
      });
      map.current.on('mouseleave', 'resource-markers', () => {
        if (map.current) map.current.getCanvas().style.cursor = '';
      });
      
      // Ensure the map is visible
      map.current.resize();
    });

    // Auto-rotate globe
    let userInteracting = false;
    const spinGlobe = () => {
      if (!map.current || userInteracting || !isRotatingRef.current) return;
      const center = map.current.getCenter();
      center.lng -= 0.15;
      map.current.easeTo({ center, duration: 1000, easing: (n) => n });
    };

    map.current.on('mousedown', () => { userInteracting = true; });
    map.current.on('mouseup', () => { 
      userInteracting = false; 
      setTimeout(spinGlobe, 100);
    });
    map.current.on('moveend', spinGlobe);
    
    // Initial spin
    setTimeout(spinGlobe, 500);

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Sync isRotating state with ref for spinGlobe closure
  useEffect(() => {
    isRotatingRef.current = isRotating;
  }, [isRotating]);

  // User location marker
  useEffect(() => {
    if (!map.current || !userLocation) return;
    
    // Remove existing user marker
    if (userMarker.current) {
      userMarker.current.remove();
    }
    
    // Create pulsing blue dot marker for user
    const el = document.createElement('div');
    el.innerHTML = `
      <style>
        @keyframes pulse-location {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.5); }
        }
      </style>
      <div style="position: relative;">
        <div style="width: 16px; height: 16px; background: #3b82f6; border: 3px solid white; border-radius: 50%; box-shadow: 0 0 10px rgba(59,130,246,0.5);"></div>
        <div style="position: absolute; top: -4px; left: -4px; width: 24px; height: 24px; background: rgba(59,130,246,0.3); border-radius: 50%; animation: pulse-location 2s infinite;"></div>
      </div>
    `;
    
    userMarker.current = new mapboxgl.Marker(el)
      .setLngLat([userLocation.lng, userLocation.lat])
      .addTo(map.current);
    
    return () => {
      userMarker.current?.remove();
    };
  }, [userLocation]);

  useEffect(() => {
    if (!map.current || !resources) return;

    // Clear existing HTML markers
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Separate resources: with logos (HTML markers) vs without (native markers)
    const resourcesWithLogos = resources.filter(r => r.logo_url && r.latitude && r.longitude);
    const resourcesWithoutLogos = resources.filter(r => !r.logo_url && r.latitude && r.longitude);

    // Update GeoJSON source with resources WITHOUT logos (native markers)
    const geojsonData = {
      type: 'FeatureCollection' as const,
      features: resourcesWithoutLogos.map(resource => ({
        type: 'Feature' as const,
        geometry: {
          type: 'Point' as const,
          coordinates: [resource.longitude!, resource.latitude!]
        },
        properties: {
          id: resource.id,
          title: resource.title,
          resourceType: resource.resource_type
        }
      }))
    };

    const source = map.current.getSource('resources') as mapboxgl.GeoJSONSource;
    if (source) {
      source.setData(geojsonData);
    }

    // Add HTML markers for resources WITH logos
    resourcesWithLogos.forEach(resource => {
      const config = RESOURCE_CONFIG[resource.resource_type];
      const isOfficialPartner = resource.is_official_partner === true;
      const isFlagshipHub = resource.title?.includes('Startup Factory Hub') && isOfficialPartner;
      
      const markerSize = isFlagshipHub ? 44 : 28;
      const badgeEmoji = isFlagshipHub ? '👑' : '⭐';
      
      // Create marker element
      const el = document.createElement('div');
      el.className = 'resource-marker';
      el.style.cssText = `
        width: ${markerSize}px;
        height: ${markerSize}px;
        cursor: pointer;
      `;
      
      // Logo container - perfectly centered
      const logoEl = document.createElement('div');
      logoEl.style.cssText = `
        width: 100%;
        height: 100%;
        background: url(${resource.logo_url}) center/cover, white;
        border: ${isFlagshipHub ? '3px solid #FFD700' : `2px solid ${config.color}`};
        border-radius: 50%;
        box-shadow: ${isFlagshipHub 
          ? '0 4px 16px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(0,0,0,0.3)' 
          : `0 2px 8px rgba(0,0,0,0.3), 0 0 0 2px ${config.color}30`};
        transition: all 0.2s;
        ${isFlagshipHub ? 'animation: pulse-glow 2s ease-in-out infinite;' : ''}
      `;
      
      el.appendChild(logoEl);
      
      // Badge for official partners
      if (isOfficialPartner) {
        const starEl = document.createElement('div');
        starEl.innerHTML = badgeEmoji;
        starEl.style.cssText = `
          position: absolute;
          top: -6px;
          right: -6px;
          font-size: ${isFlagshipHub ? '16px' : '12px'};
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
          pointer-events: none;
          z-index: 10;
        `;
        el.appendChild(starEl);
      }

      // Hover effect
      el.addEventListener('mouseenter', () => {
        logoEl.style.transform = 'scale(1.15)';
        logoEl.style.boxShadow = isFlagshipHub
          ? '0 6px 24px rgba(16, 185, 129, 0.7), 0 0 30px rgba(16, 185, 129, 0.5), 0 4px 12px rgba(0,0,0,0.4)'
          : `0 4px 12px rgba(0,0,0,0.4), 0 0 0 3px ${config.color}50`;
      });
      el.addEventListener('mouseleave', () => {
        logoEl.style.transform = 'scale(1)';
        logoEl.style.boxShadow = isFlagshipHub
          ? '0 4px 16px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.3), 0 2px 8px rgba(0,0,0,0.3)'
          : `0 2px 8px rgba(0,0,0,0.3), 0 0 0 2px ${config.color}30`;
      });

      // Click handler
      el.addEventListener('click', () => {
        setSelectedResource(resource);
        if (map.current && resource.latitude && resource.longitude) {
          map.current.flyTo({
            center: [resource.longitude, resource.latitude],
            zoom: 12,
            duration: 2000,
          });
        }
      });

      // Create marker with center anchor and no offset
      const marker = new mapboxgl.Marker({ 
        element: el, 
        anchor: 'center',
        offset: [0, 0]
      })
        .setLngLat([resource.longitude!, resource.latitude!])
        .addTo(map.current!);

      markers.current.push(marker);
    });
  }, [resources]);

  // Add event markers to map
  useEffect(() => {
    // Show events when "All Resources" (null) or "Events" is selected
    if (!map.current || (selectedType !== null && selectedType !== 'event')) {
      // Clear event markers if not showing events
      eventMarkers.current.forEach(marker => marker.remove());
      eventMarkers.current = [];
      return;
    }

    // Clear existing event markers
    eventMarkers.current.forEach(marker => marker.remove());
    eventMarkers.current = [];

    if (!mapEvents) return;

    // Add event markers
    mapEvents.forEach(event => {
      const now = new Date();
      const startDate = new Date(event.start_date);
      const endDate = new Date(event.end_date);
      const isLive = now >= startDate && now <= endDate;
      const isUpcoming = now < startDate;
      
      const markerSize = 36;
      const eventColor = '#f43f5e'; // Rose color for events
      
      const el = document.createElement('div');
      el.className = 'event-marker';
      el.style.cssText = `
        width: ${markerSize}px;
        height: ${markerSize}px;
        cursor: pointer;
        position: relative;
      `;
      
      // Main marker element
      const markerEl = document.createElement('div');
      markerEl.style.cssText = `
        width: 100%;
        height: 100%;
        background: ${event.banner_url ? `url(${event.banner_url}) center/cover,` : ''} linear-gradient(135deg, ${eventColor}, #e11d48);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(244, 63, 94, 0.5), 0 0 20px rgba(244, 63, 94, 0.3);
        transition: all 0.2s;
        ${isLive ? 'animation: pulse-event 2s ease-in-out infinite;' : ''}
      `;
      el.appendChild(markerEl);
      
      // Live badge for active events
      if (isLive) {
        const liveEl = document.createElement('div');
        liveEl.innerHTML = '🔴';
        liveEl.style.cssText = `
          position: absolute;
          top: -6px;
          right: -6px;
          font-size: 12px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
          animation: pulse 1s ease-in-out infinite;
        `;
        el.appendChild(liveEl);
      } else if (isUpcoming) {
        const upcomingEl = document.createElement('div');
        upcomingEl.innerHTML = '📅';
        upcomingEl.style.cssText = `
          position: absolute;
          top: -6px;
          right: -6px;
          font-size: 12px;
          filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
        `;
        el.appendChild(upcomingEl);
      }

      // Hover effect
      el.addEventListener('mouseenter', () => {
        markerEl.style.transform = 'scale(1.15)';
        markerEl.style.boxShadow = '0 6px 20px rgba(244, 63, 94, 0.7), 0 0 30px rgba(244, 63, 94, 0.5)';
      });
      el.addEventListener('mouseleave', () => {
        markerEl.style.transform = 'scale(1)';
        markerEl.style.boxShadow = '0 4px 12px rgba(244, 63, 94, 0.5), 0 0 20px rgba(244, 63, 94, 0.3)';
      });

      // Click handler
      el.addEventListener('click', () => {
        setSelectedEvent(event);
        setSelectedResource(null); // Clear resource selection
        if (map.current) {
          map.current.flyTo({
            center: [event.longitude, event.latitude],
            zoom: 14,
            duration: 2000,
          });
        }
      });

      const marker = new mapboxgl.Marker({ 
        element: el, 
        anchor: 'center',
      })
        .setLngLat([event.longitude, event.latitude])
        .addTo(map.current!);

      eventMarkers.current.push(marker);
    });
  }, [mapEvents, selectedType]);

  const getDirections = (resource: Resource) => {
    if (resource.latitude && resource.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${resource.latitude},${resource.longitude}`, '_blank');
    }
  };

  const getEventDirections = (event: MapEvent) => {
    window.open(`https://www.google.com/maps/dir/?api=1&destination=${event.latitude},${event.longitude}`, '_blank');
  };

  return (
    <div className="relative w-full min-h-screen bg-background rounded-2xl">
      {/* Map Container */}
      <div className="relative h-screen">
        {/* Full Viewport Map */}
        <div ref={mapContainer} className="absolute inset-0 w-full h-full rounded-t-2xl" />
      
      {/* Control Buttons - Top Center */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {/* Rotation Toggle Button */}
        <Button
          size="icon"
          onClick={() => setIsRotating(!isRotating)}
          className="backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/30 rounded-2xl hover:bg-white/20 dark:hover:bg-black/30 transition-all"
          title={isRotating ? "Pause rotation" : "Resume rotation"}
        >
          {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        {/* My Location Button */}
        <Button
          size="icon"
          onClick={requestUserLocation}
          disabled={isLocating}
          className="backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/30 rounded-2xl hover:bg-white/20 dark:hover:bg-black/30 transition-all disabled:opacity-50"
          title="Show my location"
        >
          {isLocating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Locate className="w-4 h-4" />}
        </Button>

        {/* Tracking Session Button */}
        <Button
          size="icon"
          onClick={() => setShowTrackingDialog(true)}
          className={cn(
            "backdrop-blur-2xl border border-white/30 rounded-2xl hover:bg-white/20 dark:hover:bg-black/30 transition-all",
            trackingSessionId 
              ? "bg-green-500/20 border-green-500/50 text-green-400" 
              : "bg-white/10 dark:bg-black/20"
          )}
          title={trackingSessionId ? "Tracking session active" : "Start tracking session"}
        >
          <Radio className={cn("w-4 h-4", trackingSessionId && "animate-pulse")} />
        </Button>

        {/* Accelerator Location Button - Only show for accelerators with location */}
        {acceleratorLocation && (
          <Button
            size="icon"
            onClick={() => {
              if (map.current && acceleratorLocation) {
                // Remove existing accelerator marker
                if (acceleratorMarker.current) {
                  acceleratorMarker.current.remove();
                }
                
                // Create a special marker for accelerator HQ
                const el = document.createElement('div');
                el.innerHTML = `
                  <div style="position: relative;">
                    <div style="
                      width: 44px;
                      height: 44px;
                      background: ${acceleratorLocation.logo ? `url(${acceleratorLocation.logo}) center/cover,` : ''} linear-gradient(135deg, #10b981, #059669);
                      border: 3px solid #FFD700;
                      border-radius: 50%;
                      box-shadow: 0 4px 16px rgba(16, 185, 129, 0.5), 0 0 20px rgba(16, 185, 129, 0.3);
                      animation: pulse-glow 2s ease-in-out infinite;
                    "></div>
                    <div style="
                      position: absolute;
                      top: -6px;
                      right: -6px;
                      font-size: 16px;
                      filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));
                    ">🏢</div>
                  </div>
                `;
                
                acceleratorMarker.current = new mapboxgl.Marker({
                  element: el,
                  anchor: 'center',
                })
                  .setLngLat([acceleratorLocation.lng, acceleratorLocation.lat])
                  .setPopup(new mapboxgl.Popup().setHTML(`
                    <div style="padding: 8px;">
                      <strong>${acceleratorLocation.name}</strong>
                      <p style="color: #666; font-size: 12px; margin-top: 4px;">Your Accelerator HQ</p>
                    </div>
                  `))
                  .addTo(map.current);
                
                acceleratorMarker.current.togglePopup();
                
                map.current.flyTo({
                  center: [acceleratorLocation.lng, acceleratorLocation.lat],
                  zoom: 14,
                  duration: 2000,
                });
                
                toast({
                  title: "Accelerator Location",
                  description: `Flying to ${acceleratorLocation.name}`,
                });
              }
            }}
            className="backdrop-blur-2xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-400 rounded-2xl hover:bg-emerald-500/30 transition-all"
            title={`Go to ${acceleratorLocation.name}`}
          >
            <Home className="w-4 h-4" />
          </Button>
        )}
        
        {/* Active trackers badge */}
        {trackingSessionId && trackedUsers.length > 0 && (
          <Badge className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
            {trackedUsers.length + 1}
          </Badge>
        )}
      </div>
      
      {/* User Tracking Markers */}
      <UserTrackingMarkers map={map.current} trackedUsers={trackedUsers} />
      
      {/* Single Toggle Button - works for both open and closed states */}
      <Button
        size="icon"
        onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
        className={cn(
          "absolute top-4 z-20 backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:bg-white/20 dark:hover:bg-black/30 rounded-2xl",
          isLeftPanelOpen ? "left-[348px]" : "left-4"
        )}
        variant="ghost"
      >
        {isLeftPanelOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </Button>

      {/* Left Side Sliding Panel */}
      <div 
        className={cn(
          "absolute top-2 bottom-2 w-80 z-10 transition-all duration-300",
          isLeftPanelOpen ? "left-2" : "-left-[330px]"
        )}
      >
        <div className="h-full backdrop-blur-3xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col rounded-3xl">
          {/* Header */}
          <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Resources Map
            </h2>
          </div>

          {/* Search */}
          <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search resources or addresses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onFocus={() => addressSuggestions.length > 0 && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className="pl-10 bg-white/10 dark:bg-black/20 backdrop-blur-xl border-white/30 dark:border-white/20 focus:bg-white/20 dark:focus:bg-black/30 rounded-2xl"
              />
              
              {/* Address Suggestions Dropdown */}
              {showSuggestions && addressSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 backdrop-blur-2xl bg-white/20 dark:bg-black/40 border border-white/30 dark:border-white/20 rounded-xl shadow-lg overflow-hidden z-50">
                  <div className="p-2 text-xs text-muted-foreground uppercase tracking-wide border-b border-white/20">
                    <MapPinned className="w-3 h-3 inline mr-1" />
                    Address Results
                  </div>
                  {addressSuggestions.map((feature: any) => (
                    <button
                      key={feature.id}
                      onClick={() => handleAddressSelect(feature)}
                      className="w-full px-3 py-2 text-left hover:bg-white/20 dark:hover:bg-white/10 transition-colors border-b border-white/10 last:border-0"
                    >
                      <div className="font-medium text-sm">{feature.text}</div>
                      <div className="text-xs text-muted-foreground truncate">{feature.place_name}</div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Tip: Search addresses like "505 Howard St, San Francisco"
            </p>
          </div>

          {/* Categories */}
          <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">Categories</h3>
            <ScrollArea className="h-64">
              <div className="space-y-1">
                <Button
                  variant={selectedType === null ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setSelectedType(null)}
                  className={cn(
                    "w-full justify-start gap-2 rounded-xl backdrop-blur-xl",
                    selectedType === null ? "bg-primary/90" : "bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20"
                  )}
                >
                  <div className="w-2 h-2 rounded-full bg-current" />
                  All Resources
                </Button>
                {(Object.keys(RESOURCE_CONFIG) as ResourceType[]).map((type) => {
                  const config = RESOURCE_CONFIG[type];
                  const Icon = config.icon;
                  const isSelected = selectedType === type;
                  return (
                    <Button
                      key={type}
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedType(type)}
                      className={cn(
                        "w-full justify-start gap-2 rounded-xl backdrop-blur-xl",
                        isSelected 
                          ? "bg-white/20 dark:bg-black/30 border-l-4" 
                          : "bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20"
                      )}
                      style={isSelected ? { 
                        borderLeftColor: config.color
                      } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          {/* Add Resource Button */}
          <div className="p-4 border-t border-white/30 dark:border-white/20 backdrop-blur">
            <Button 
              onClick={() => setShowAddDialog(true)} 
              className="w-full gap-2 backdrop-blur-xl bg-primary/90 hover:bg-primary border border-white/20 rounded-2xl"
            >
              <Plus className="w-4 h-4" />
              Add Resource
            </Button>
          </div>
        </div>
      </div>

      {/* Right Side Panel - Resource Details (Slide In) */}
      <div 
        className={cn(
          "absolute right-2 top-2 bottom-2 w-96 z-10 transition-all duration-300",
          selectedResource ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        )}
      >
        <div className="h-full backdrop-blur-3xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden flex flex-col rounded-3xl">
          {selectedResource && (
            <>
              <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      <Badge 
                        className="backdrop-blur-xl rounded-xl" 
                        style={{ 
                          backgroundColor: RESOURCE_CONFIG[selectedResource.resource_type].color,
                          color: 'white'
                        }}
                      >
                        {RESOURCE_CONFIG[selectedResource.resource_type].label}
                      </Badge>
                      {selectedResource.is_official_partner && (
                        <Badge className="bg-gradient-to-r from-amber-500 to-yellow-400 text-black font-semibold rounded-xl flex items-center gap-1">
                          <span>⭐</span> Official Partner
                        </Badge>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold">{selectedResource.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedResource(null)}
                    className="shrink-0 backdrop-blur-xl bg-white/10 dark:bg-black/20 hover:bg-white/20 dark:hover:bg-black/30 rounded-xl"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {selectedResource.logo_url && (
                  <img 
                    src={selectedResource.logo_url} 
                    alt="" 
                    className="w-full h-32 rounded-2xl object-cover mb-3" 
                  />
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  <p className="text-sm text-muted-foreground">
                    {selectedResource.description}
                  </p>

                  {selectedResource.location_type === 'physical' && selectedResource.address && (
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div>
                        <p>{selectedResource.address}</p>
                        <p className="text-muted-foreground">
                          {selectedResource.city}, {selectedResource.country}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {selectedResource.location_type !== 'physical' && (
                    <Badge variant="outline" className="backdrop-blur-xl rounded-xl">Online Resource</Badge>
                  )}

                  <div className="flex flex-col gap-2 pt-2">
                    {selectedResource.latitude && selectedResource.longitude && (
                       <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2 backdrop-blur-2xl bg-white/10 dark:bg-black/20 border-white/30 dark:border-white/20 hover:bg-white/20 dark:hover:bg-black/30 w-full justify-start rounded-xl" 
                        onClick={() => getDirections(selectedResource)}
                      >
                        <Navigation className="w-4 h-4" />
                        Get Directions
                      </Button>
                    )}
                    {selectedResource.website_url && (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="gap-2 backdrop-blur-2xl bg-white/10 dark:bg-black/20 border-white/30 dark:border-white/20 hover:bg-white/20 dark:hover:bg-black/30 w-full justify-start rounded-xl" 
                        asChild
                      >
                        <a href={selectedResource.website_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4" />
                          Visit Website
                        </a>
                      </Button>
                    )}
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2 backdrop-blur-2xl bg-white/10 dark:bg-black/20 border-white/30 dark:border-white/20 hover:bg-white/20 dark:hover:bg-black/30 w-full justify-start rounded-xl"
                    >
                      <Bookmark className="w-4 h-4" />
                      Bookmark
                    </Button>

                    {/* Contact Information */}
                    {selectedResource.contact_email && (
                      <div className="mt-4 p-4 rounded-2xl backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20">
                        <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Mail className="w-4 h-4" />
                          Contact Information
                        </h4>
                        <div className="space-y-2 text-sm">
                          {selectedResource.title === 'Nasdaq Interns Match' && (
                            <>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Media Inquiries:</p>
                                <a 
                                  href="mailto:media@theCenter.nasdaq.org" 
                                  className="text-primary hover:underline"
                                >
                                  media@theCenter.nasdaq.org
                                </a>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Partnership Opportunities:</p>
                                <a 
                                  href="mailto:partners@theCenter.nasdaq.org" 
                                  className="text-primary hover:underline"
                                >
                                  partners@theCenter.nasdaq.org
                                </a>
                              </div>
                              <div>
                                <p className="text-muted-foreground text-xs mb-1">Event Inquiries:</p>
                                <a 
                                  href="mailto:events@theCenter.nasdaq.org" 
                                  className="text-primary hover:underline"
                                >
                                  events@theCenter.nasdaq.org
                                </a>
                              </div>
                            </>
                          )}
                          {selectedResource.title !== 'Nasdaq Interns Match' && (
                            <a 
                              href={`mailto:${selectedResource.contact_email}`} 
                              className="text-primary hover:underline"
                            >
                              {selectedResource.contact_email}
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </div>

      {/* Right Side Panel - Event Details (Slide In) */}
      <div 
        className={cn(
          "absolute right-2 top-2 bottom-2 w-96 z-10 transition-all duration-300",
          selectedEvent && !selectedResource ? "translate-x-0 opacity-100" : "translate-x-full opacity-0 pointer-events-none"
        )}
      >
        <div className="h-full backdrop-blur-3xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] overflow-hidden flex flex-col rounded-3xl">
          {selectedEvent && (
            <>
              <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                      {(() => {
                        const now = new Date();
                        const startDate = new Date(selectedEvent.start_date);
                        const isLive = now >= startDate && now <= new Date(selectedEvent.end_date);
                        return isLive ? (
                          <Badge className="bg-rose-500 text-white rounded-xl flex items-center gap-1">
                            <span className="animate-pulse">🔴</span> LIVE EVENT
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-500/20 text-rose-400 border-rose-500/30 rounded-xl">
                            📅 Upcoming Event
                          </Badge>
                        );
                      })()}
                    </div>
                    <h3 className="text-lg font-semibold">{selectedEvent.title}</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedEvent(null)}
                    className="shrink-0 backdrop-blur-xl bg-white/10 dark:bg-black/20 hover:bg-white/20 dark:hover:bg-black/30 rounded-xl"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                {selectedEvent.banner_url && (
                  <img 
                    src={selectedEvent.banner_url} 
                    alt="" 
                    className="w-full h-32 rounded-2xl object-cover mb-3" 
                  />
                )}
              </div>

              <ScrollArea className="flex-1">
                <div className="p-4 space-y-4">
                  {selectedEvent.description && (
                    <p className="text-sm text-muted-foreground">
                      {selectedEvent.description}
                    </p>
                  )}

                  {/* Date & Time */}
                  <div className="flex items-start gap-2 text-sm">
                    <Clock className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="font-medium">{format(new Date(selectedEvent.start_date), 'PPP')}</p>
                      <p className="text-muted-foreground">
                        {format(new Date(selectedEvent.start_date), 'p')} - {format(new Date(selectedEvent.end_date), 'p')}
                      </p>
                    </div>
                  </div>

                  {/* Location */}
                  <div className="flex items-start gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-rose-400 mt-0.5 shrink-0" />
                    <div>
                      <p>{selectedEvent.location}</p>
                      {selectedEvent.city && selectedEvent.country && (
                        <p className="text-muted-foreground">
                          {selectedEvent.city}, {selectedEvent.country}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Attendees */}
                  <div className="flex items-center gap-2 text-sm">
                    <Users2 className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>
                      {selectedEvent.attendee_count || 0}
                      {selectedEvent.max_attendees && ` / ${selectedEvent.max_attendees}`} Attendees
                    </span>
                  </div>

                  {/* Organizer */}
                  {selectedEvent.organizer && (
                    <div className="p-3 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
                      <p className="text-xs text-muted-foreground mb-1">Organized by</p>
                      <p className="font-medium">{selectedEvent.organizer.full_name}</p>
                    </div>
                  )}

                  <div className="flex flex-col gap-3 pt-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2 backdrop-blur-2xl bg-white/10 dark:bg-black/20 border-white/30 dark:border-white/20 hover:bg-white/20 dark:hover:bg-black/30 w-full justify-start rounded-xl" 
                      onClick={() => getEventDirections(selectedEvent)}
                    >
                      <Navigation className="w-4 h-4" />
                      Get Directions
                    </Button>

                    {/* RSVP Buttons */}
                    {user ? (
                      <div className="space-y-2">
                        <p className="text-xs text-muted-foreground">RSVP to this event</p>
                        <div className="grid grid-cols-3 gap-2">
                          <Button
                            size="sm"
                            variant={userEventStatus === 'going' ? 'default' : 'outline'}
                            className={cn(
                              "gap-1 rounded-xl text-xs",
                              userEventStatus === 'going' && "bg-green-500 hover:bg-green-600 text-white"
                            )}
                            onClick={() => handleEventAttendance('going')}
                            disabled={isUpdatingRsvp || (selectedEvent.max_attendees && (selectedEvent.attendee_count || 0) >= selectedEvent.max_attendees && userEventStatus !== 'going')}
                          >
                            <Users2 className="w-3 h-3" />
                            Going
                          </Button>
                          <Button
                            size="sm"
                            variant={userEventStatus === 'maybe' ? 'default' : 'outline'}
                            className={cn(
                              "gap-1 rounded-xl text-xs",
                              userEventStatus === 'maybe' && "bg-amber-500 hover:bg-amber-600 text-white"
                            )}
                            onClick={() => handleEventAttendance('maybe')}
                            disabled={isUpdatingRsvp}
                          >
                            Maybe
                          </Button>
                          <Button
                            size="sm"
                            variant={userEventStatus === 'declined' ? 'default' : 'outline'}
                            className={cn(
                              "gap-1 rounded-xl text-xs",
                              userEventStatus === 'declined' && "bg-red-500 hover:bg-red-600 text-white"
                            )}
                            onClick={() => handleEventAttendance('declined')}
                            disabled={isUpdatingRsvp}
                          >
                            <X className="w-3 h-3" />
                            Can't
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground text-center p-3 rounded-xl backdrop-blur-xl bg-white/5 border border-white/10">
                        Sign in to RSVP for this event
                      </p>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </>
          )}
        </div>
      </div>

        {/* Loading Overlay */}
        {(isLoading || isLoadingEvents) && (
          <div className="absolute inset-0 bg-background/30 backdrop-blur-sm flex items-center justify-center z-30 pointer-events-none">
            <div className="animate-spin w-12 h-12 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        )}

        <AddResourceDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
        
        <TrackingSessionDialog
          open={showTrackingDialog}
          onOpenChange={setShowTrackingDialog}
          sessionId={trackingSessionId}
          onCreateSession={handleCreateSession}
          onJoinSession={handleJoinSession}
          onLeaveSession={handleLeaveSession}
          trackedUsers={trackedUsers}
          isTracking={isTracking}
          onStartTracking={startTracking}
          onStopTracking={stopTracking}
          userColor={userColor}
        />
      </div>

      {/* Network Perks Section - Below the map, outside h-screen */}
      <div className="relative z-10 tech-card border-0 border-t border-white/20 rounded-none rounded-b-2xl p-4 bg-background">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold flex items-center gap-2">
            <Gift className="w-4 h-4 text-green-400" />
            Network Perks
          </h3>
          <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/30 text-green-400">
            {resources?.filter(r => r.resource_type === 'perk').length || 0} Available
          </Badge>
        </div>
        <ScrollArea className="w-full">
          <div className="flex gap-3 pb-2">
            {resources?.filter(r => r.resource_type === 'perk').map((perk) => (
              <Card
                key={perk.id}
                className="tech-card border-0 min-w-[220px] cursor-pointer hover:bg-white/10 dark:hover:bg-black/30"
                onClick={() => {
                  setSelectedResource(perk);
                  if (map.current && perk.latitude && perk.longitude) {
                    map.current.flyTo({
                      center: [perk.longitude, perk.latitude],
                      zoom: 12,
                      duration: 2000,
                    });
                  }
                }}
              >
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {perk.logo_url ? (
                      <img src={perk.logo_url} className="w-10 h-10 rounded-xl object-cover" alt={perk.title} />
                    ) : (
                      <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                        <Gift className="w-5 h-5 text-green-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h4 className="font-medium text-sm truncate">{perk.title}</h4>
                        {perk.is_official_partner && (
                          <span className="text-xs">⭐</span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {perk.description?.slice(0, 40)}...
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(!resources || resources.filter(r => r.resource_type === 'perk').length === 0) && (
              <div className="flex items-center justify-center w-full py-4 text-muted-foreground text-sm">
                No perks available yet
              </div>
            )}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
};