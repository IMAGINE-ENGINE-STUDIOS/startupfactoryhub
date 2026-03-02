import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { useResources, Resource, ResourceType, JOURNEY_STEPS, JourneyStep } from '@/hooks/useResources';
import { useMapTracking } from '@/hooks/useMapTracking';
import { useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';
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
  Banknote,
  Search,
  ExternalLink,
  Navigation,
  Bookmark,
  Plus,
  X,
  Menu,
  ChevronRight,
  ChevronLeft,
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
  Users2,
  Globe2,
  Share2,
  Satellite,
  Map,
  Layers,
  Lock,
  Star,
  Earth
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AddResourceDialog } from './AddResourceDialog';
import { TrackingSessionDialog } from './TrackingSessionDialog';
import { UserTrackingMarkers } from './UserTrackingMarkers';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { useEventsForMap, MapEvent } from '@/hooks/useEventsForMap';
import { format } from 'date-fns';
import { useMembershipStatus } from '@/hooks/useMembershipStatus';
import { useRegusLocations, RegusFilters } from '@/hooks/useRegusLocations';
import { HubsWorkspaceCard } from '@/components/hubs/HubsWorkspaceCard';
import { HubsDetailPanel } from '@/components/hubs/HubsDetailPanel';
import { RegusBookingModal } from '@/components/hubs/RegusBookingModal';
import { Workspace, WorkspaceType } from '@/hooks/useHubsSearch';
import { useEarthIntelligence } from '@/hooks/useEarthIntelligence';
import { EarthViewportToolbar } from '@/components/earth/EarthViewportToolbar';
import { EarthLayerCard } from '@/components/earth/EarthLayerCard';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
mapboxgl.accessToken = 'pk.eyJ1IjoiaW1hZ2luZWVuZ2luZSIsImEiOiJjbWhlYWo5bTgwYzkyMmpxMno3ODdoZGt6In0.B66urpifKwsS7bltMqzaBQ';

type MapStyleType = 'default' | 'satellite' | 'satelliteStreets';

const MAP_STYLES: Record<MapStyleType, { url: string; label: string; icon: any }> = {
  default: { 
    url: 'mapbox://styles/imagineengine/cmhfkp1ie001d01qi2hyg82lp', 
    label: 'Globe', 
    icon: Globe2 
  },
  satellite: { 
    url: 'mapbox://styles/mapbox/satellite-v9', 
    label: 'Satellite', 
    icon: Satellite 
  },
  satelliteStreets: { 
    url: 'mapbox://styles/mapbox/satellite-streets-v12', 
    label: 'Satellite + Streets', 
    icon: Map 
  },
};

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
  banking: { icon: Banknote, color: '#dc2626', label: 'Banking' },
  national_archives: { icon: Landmark, color: '#7c3aed', label: 'National Archives' },
  workplace: { icon: Building2, color: '#0d9488', label: 'Workplace' },
  other: { icon: MapPin, color: '#64748b', label: 'Other' },
};

export const GlobalResourcesMap = () => {
  const { user } = useAuth();
  const { role } = useUserRole();
  const isMobile = useIsMobile();
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markers = useRef<mapboxgl.Marker[]>([]);
  const userMarker = useRef<mapboxgl.Marker | null>(null);
  const addressMarker = useRef<mapboxgl.Marker | null>(null);
  const acceleratorMarker = useRef<mapboxgl.Marker | null>(null);
  const [selectedType, setSelectedType] = useState<ResourceType | null>(null);
  const [selectedJourneyStep, setSelectedJourneyStep] = useState<JourneyStep | null>(null);
  const [search, setSearch] = useState('');
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<MapEvent | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isLeftPanelOpen, setIsLeftPanelOpen] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number; lng: number} | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [acceleratorLocation, setAcceleratorLocation] = useState<{lat: number; lng: number; name: string; logo?: string} | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const isRotatingRef = useRef(false);
  const [mapStyle, setMapStyle] = useState<MapStyleType>('satelliteStreets');
  const [mapReady, setMapReady] = useState(false);
  const [isPerksExpanded, setIsPerksExpanded] = useState(true);
  const [isOnlineResourcesExpanded, setIsOnlineResourcesExpanded] = useState(false);
  const [showEarthLayers, setShowEarthLayers] = useState(false);
  const eventMarkers = useRef<mapboxgl.Marker[]>([]);
  const regusMarkers = useRef<mapboxgl.Marker[]>([]);
  const [userEventStatus, setUserEventStatus] = useState<string | null>(null);
  const [isUpdatingRsvp, setIsUpdatingRsvp] = useState(false);
  
  // Workplace (Regus) state
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [bookingWorkspace, setBookingWorkspace] = useState<Workspace | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [regusSearch, setRegusSearch] = useState('');
  const [regusOfficeType, setRegusOfficeType] = useState<string | null>(null);
  
  // Membership status for subscription gating
  const { isSubscribed, tier, loading: membershipLoading } = useMembershipStatus();

  // Earth Intelligence layers (admin-only)
  const {
    earthLayers,
    hasAccess: hasEarthAccess,
    toggleEarthLayer,
    setEarthLayerOpacity,
    precipFrames,
    currentFrameIndex,
    setCurrentFrameIndex,
    currentFrameTime,
    isPlaying,
    togglePlayback,
    stepFrame,
  } = useEarthIntelligence(map.current, mapReady);
  
  // Regus locations (only fetch when workplace selected AND subscribed)
  const regusFilters: RegusFilters = {
    search: regusSearch || undefined,
    officeType: regusOfficeType || undefined,
  };
  const { data: regusLocations, isLoading: regusLoading } = useRegusLocations(
    regusFilters, 
    selectedType === 'workplace' && isSubscribed
  );
  
  // Ref to store current resources for click handler (avoids stale closure)
  const resourcesRef = useRef<Resource[] | undefined>(undefined);

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

const { data: resources, isLoading, refetch: refetchResources } = useResources({ 
    type: selectedType === 'event' ? undefined : selectedType || undefined,
    search: search || undefined,
    journeyStep: selectedJourneyStep || undefined
  });

  // Keep resourcesRef in sync with latest resources data
  useEffect(() => {
    resourcesRef.current = resources;
  }, [resources]);

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

  // Real-time subscription for resource changes (admin edits sync)
  useEffect(() => {
    const channel = supabase
      .channel('globe-resources-sync')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'resources' },
        (payload) => {
          // Refetch main resources query when admin makes changes
          refetchResources();
          
          // Immediately update selectedResource if it was the one edited
          if (selectedResource && payload.new && (payload.new as any).id === selectedResource.id) {
            setSelectedResource(payload.new as Resource);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetchResources, selectedResource?.id]);

  // Update selectedResource when resources refetch (for real-time card updates)
  useEffect(() => {
    if (selectedResource && resources) {
      const updated = resources.find(r => r.id === selectedResource.id);
      if (updated && (
        updated.logo_url !== selectedResource.logo_url || 
        updated.description !== selectedResource.description || 
        updated.title !== selectedResource.title
      )) {
        setSelectedResource(updated);
      }
    }
  }, [resources]);

  // Store for dynamically added image keys
  const addedImageKeys = useRef<Set<string>>(new Set());
  // Track icons currently being generated/loaded to prevent duplicate work
  const loadingImageKeys = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.satelliteStreets.url,
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
      
      // Add GeoJSON source for resource markers
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
          'icon-image': ['get', 'iconKey'],
          'icon-size': [
            'interpolate',
            ['linear'],
            ['zoom'],
            0, 0.5,
            5, 0.7,
            10, 0.9,
            15, 1.0
          ],
          'icon-anchor': 'center',
          'icon-allow-overlap': true,
          'icon-ignore-placement': true
        }
      });

      // Click handler for native markers
      map.current.on('click', 'resource-markers', (e) => {
        if (!e.features || e.features.length === 0) return;
        const feature = e.features[0];
        const resourceId = feature.properties?.id;
        // Use resourcesRef to access current resources (avoids stale closure)
        const resource = resourcesRef.current?.find(r => r.id === resourceId);
        if (resource) {
          setSelectedResource(resource);
          if (resource.latitude && resource.longitude) {
            map.current?.flyTo({
              center: [resource.longitude, resource.latitude],
              zoom: 12,
              duration: 2000,
            });
          }
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
      setMapReady(true);
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

  // Handle map style change
  const handleStyleChange = useCallback((style: MapStyleType) => {
    if (!map.current) return;
    setMapStyle(style);
    setMapReady(false);
    map.current.setStyle(MAP_STYLES[style].url);
    
    // Re-apply fog and sources after style loads
    map.current.once('style.load', () => {
      if (!map.current) return;
      
      map.current.setFog({
        color: '#0f172a',
        'high-color': '#1e293b',
        'horizon-blend': 0.02,
        'space-color': '#020617',
        'star-intensity': 0.15
      });
      
      // Re-add GeoJSON source for resource markers
      if (!map.current.getSource('resources')) {
        map.current.addSource('resources', {
          type: 'geojson',
          data: {
            type: 'FeatureCollection',
            features: []
          }
        });
        
        map.current.addLayer({
          id: 'resource-markers',
          type: 'symbol',
          source: 'resources',
          layout: {
            'icon-image': ['get', 'iconKey'],
            'icon-size': [
              'interpolate',
              ['linear'],
              ['zoom'],
              0, 0.5,
              5, 0.7,
              10, 0.9,
              15, 1.0
            ],
            'icon-anchor': 'center',
            'icon-allow-overlap': true,
            'icon-ignore-placement': true
          }
        });
      }
      
      // Clear added image keys so they get re-added
      addedImageKeys.current.clear();
      loadingImageKeys.current.clear();
      setMapReady(true);
    });
    
    toast({
      title: "Map Style Changed",
      description: `Switched to ${MAP_STYLES[style].label}`,
    });
  }, []);

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

    // Clear old HTML markers (no longer used, but clean up any legacy ones)
    markers.current.forEach(marker => marker.remove());
    markers.current = [];

    // Wait for style to be loaded
    if (!map.current.isStyleLoaded()) {
      map.current.once('style.load', () => updateResourceMarkers());
    } else {
      updateResourceMarkers();
    }

    async function updateResourceMarkers() {
      if (!map.current) return;

      const physicalResources = resources!.filter(r => r.latitude && r.longitude);

      const source = map.current!.getSource('resources') as mapboxgl.GeoJSONSource;
      if (!source) return;

      // Local helpers
      const getTypeIconKey = (resourceType: ResourceType) => `type-${resourceType}`;
      const getLogoIconKey = (id: string) => `res-${id}`;

      const buildFeatures = (): GeoJSON.Feature[] =>
        physicalResources.map((resource) => {
          const typeKey = getTypeIconKey(resource.resource_type);
          const logoKey = getLogoIconKey(resource.id);

          // IMPORTANT: default to type icons so markers show immediately.
          // Switch to logo icon only after the image exists in the style.
          const iconKey = resource.logo_url && (addedImageKeys.current.has(logoKey) || map.current?.hasImage(logoKey))
            ? logoKey
            : typeKey;

          return {
            type: 'Feature' as const,
            geometry: {
              type: 'Point' as const,
              coordinates: [resource.longitude!, resource.latitude!],
            },
            properties: {
              id: resource.id,
              iconKey,
              resourceType: resource.resource_type,
            },
          };
        });

      const applySourceData = () => {
        if (!map.current) return;
        source.setData({
          type: 'FeatureCollection',
          features: buildFeatures(),
        });
      };

      // Load marker icon helpers once
      const { createCircleMarkerIcon, createTypeIcon } = await import('@/lib/mapMarkerIcons');

      // Ensure type icons exist for ALL types present (needed as placeholders)
      const seenTypeKeys = new Set<string>();
      for (const resource of physicalResources) {
        const config = RESOURCE_CONFIG[resource.resource_type];
        const typeKey = getTypeIconKey(resource.resource_type);

        if (
          !seenTypeKeys.has(typeKey) &&
          !addedImageKeys.current.has(typeKey) &&
          !map.current.hasImage(typeKey)
        ) {
          seenTypeKeys.add(typeKey);
          const imageData = createTypeIcon(config.color, resource.resource_type, 48);
          map.current.addImage(typeKey, imageData);
          addedImageKeys.current.add(typeKey);
        }
      }

      // Show markers immediately using type icons
      applySourceData();

      // Collect logo icons to load (in background)
      const logoIconsToLoad: {
        key: string;
        resource: Resource;
        config: typeof RESOURCE_CONFIG[ResourceType];
        isOfficialPartner: boolean;
        isFlagshipHub: boolean;
      }[] = [];

      for (const resource of physicalResources) {
        if (!resource.logo_url) continue;

        const key = getLogoIconKey(resource.id);
        const config = RESOURCE_CONFIG[resource.resource_type];
        const isOfficialPartner = resource.is_official_partner === true;
        const isFlagshipHub = resource.title?.includes('Startup Factory Hub') && isOfficialPartner;

        if (
          !addedImageKeys.current.has(key) &&
          !loadingImageKeys.current.has(key) &&
          !map.current.hasImage(key)
        ) {
          logoIconsToLoad.push({ key, resource, config, isOfficialPartner, isFlagshipHub });
        }
      }

      if (logoIconsToLoad.length === 0) return;

      // Debounced refresh to swap type icons -> logos as they become available
      let refreshTimer: number | null = null;
      const scheduleRefresh = () => {
        if (refreshTimer) return;
        refreshTimer = window.setTimeout(() => {
          refreshTimer = null;
          applySourceData();
        }, 250);
      };

      const CONCURRENCY = 6;
      let index = 0;

      const loadNext = async () => {
        while (map.current && index < logoIconsToLoad.length) {
          const item = logoIconsToLoad[index++];
          const { key, resource, config, isOfficialPartner, isFlagshipHub } = item;

          // Mark as loading immediately so we don't start it again if updateResourceMarkers reruns
          loadingImageKeys.current.add(key);

          const size = isFlagshipHub ? 64 : 48;

          try {
            let imageData: ImageData;

            try {
              imageData = await createCircleMarkerIcon({
                size,
                borderColor: config.color,
                backgroundColor: config.color,
                logoUrl: resource.logo_url!,
                resourceType: resource.resource_type,
                isOfficialPartner,
                isFlagshipHub,
              });
            } catch {
              // If logo fails, still add a stable fallback under the same key
              imageData = createTypeIcon(config.color, resource.resource_type, size);
            }

            if (map.current && !map.current.hasImage(key)) {
              map.current.addImage(key, imageData);
            }

            // Mark as available regardless of addImage outcome (prevents infinite retries)
            addedImageKeys.current.add(key);
            scheduleRefresh();
          } finally {
            loadingImageKeys.current.delete(key);
          }
        }
      };

      // Run workers in parallel (capped)
      Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, logoIconsToLoad.length) }, () => loadNext())
      ).finally(() => {
        scheduleRefresh();
      });
    }
  }, [resources]);

  // Add Regus workspace markers to map
  useEffect(() => {
    if (!map.current) return;
    
    // Clear existing Regus markers
    regusMarkers.current.forEach(marker => marker.remove());
    regusMarkers.current = [];
    
    // Only show when workplace is selected and subscribed
    if (selectedType !== 'workplace' || !isSubscribed || !regusLocations) return;
    
    regusLocations.forEach(ws => {
      const markerSize = 36;
      const el = document.createElement('div');
      el.className = 'regus-marker';
      el.style.cssText = `
        width: ${markerSize}px;
        height: ${markerSize}px;
        min-width: ${markerSize}px;
        min-height: ${markerSize}px;
        max-width: ${markerSize}px;
        max-height: ${markerSize}px;
        cursor: pointer;
      `;
      
      const markerEl = document.createElement('div');
      markerEl.style.cssText = `
        width: ${markerSize}px;
        height: ${markerSize}px;
        min-width: ${markerSize}px;
        min-height: ${markerSize}px;
        max-width: ${markerSize}px;
        max-height: ${markerSize}px;
        background: ${ws.image_url ? `url(${ws.image_url}) center/cover,` : ''} linear-gradient(135deg, #0d9488, #14b8a6);
        border: 3px solid white;
        border-radius: 50%;
        box-shadow: 0 4px 12px rgba(13, 148, 136, 0.5);
      `;
      el.appendChild(markerEl);
      
      el.addEventListener('click', () => {
        setSelectedWorkspace(ws);
        setSelectedResource(null);
        setSelectedEvent(null);
        if (map.current) {
          map.current.flyTo({ center: [ws.longitude, ws.latitude], zoom: 14, duration: 2000 });
        }
      });
      
      const marker = new mapboxgl.Marker({ element: el, anchor: 'center', offset: [0, 0] })
        .setLngLat([ws.longitude, ws.latitude])
        .addTo(map.current!);
      
      regusMarkers.current.push(marker);
    });
    
    return () => {
      regusMarkers.current.forEach(marker => marker.remove());
      regusMarkers.current = [];
    };
  }, [regusLocations, selectedType, isSubscribed]);


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
    <div className="relative w-full h-full bg-background overflow-hidden rounded-2xl">
      {/* Full Viewport Map */}
      <div ref={mapContainer} className="absolute inset-0 w-full h-full rounded-2xl" />
      
      {/* Control Buttons - Top Center on Desktop, Bottom Right on Mobile */}
      {/* Hide on mobile when menu is open to prevent overlap */}
      {!(isMobile && isLeftPanelOpen) && (
        <div className={cn(
          "absolute z-20 flex gap-2",
          isMobile 
            ? "bottom-52 right-4 flex-col" 
            : "top-4 left-1/2 -translate-x-1/2"
        )}>
        {/* Rotation Toggle Button */}
        <Button
          size="icon"
          onClick={() => setIsRotating(!isRotating)}
          className="backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/30 rounded-2xl hover:bg-white/20 dark:hover:bg-black/30 transition-all"
          title={isRotating ? "Pause rotation" : "Resume rotation"}
        >
          {isRotating ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        </Button>

        {/* Map Style Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              size="icon"
              className="backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/30 rounded-2xl hover:bg-white/20 dark:hover:bg-black/30 transition-all"
              title="Change map style"
            >
              <Layers className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="center" className="backdrop-blur-2xl bg-black/80 border border-white/20">
            {(Object.keys(MAP_STYLES) as MapStyleType[]).map((styleKey) => {
              const style = MAP_STYLES[styleKey];
              const IconComponent = style.icon;
              return (
                <DropdownMenuItem
                  key={styleKey}
                  onClick={() => handleStyleChange(styleKey)}
                  className={cn(
                    "flex items-center gap-2 cursor-pointer",
                    mapStyle === styleKey && "bg-white/10"
                  )}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{style.label}</span>
                  {mapStyle === styleKey && (
                    <Badge variant="secondary" className="ml-auto text-xs">Active</Badge>
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>

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
      )}
      
      {/* User Tracking Markers */}
      <UserTrackingMarkers map={map.current} trackedUsers={trackedUsers} />
      
      {/* Single Toggle Button - works for both open and closed states */}
      {/* On mobile, hide when menu is open (use close button inside menu instead) */}
      {!(isMobile && isLeftPanelOpen) && (
        <Button
          size="icon"
          onClick={() => setIsLeftPanelOpen(!isLeftPanelOpen)}
          className={cn(
            "absolute top-4 z-20 backdrop-blur-2xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] hover:bg-white/20 dark:hover:bg-black/30 rounded-2xl",
            // On mobile: always stay at left-4, don't move with panel
            isMobile ? "left-4" : (isLeftPanelOpen ? "left-[348px]" : "left-4")
          )}
          variant="ghost"
        >
          {isLeftPanelOpen && !isMobile ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      )}

      {/* Left Side Sliding Panel */}
      <div 
        className={cn(
          "absolute top-2 bottom-2 z-10 transition-all duration-300",
          isMobile ? "w-[calc(100%-16px)] left-2 right-2" : "w-80",
          isMobile 
            ? (isLeftPanelOpen ? "translate-x-0 opacity-100" : "-translate-x-full opacity-0 pointer-events-none")
            : (isLeftPanelOpen ? "left-2" : "-left-[330px]")
        )}
      >
        <div className="h-full backdrop-blur-3xl bg-white/10 dark:bg-black/20 border border-white/30 dark:border-white/20 shadow-[0_8px_32px_0_rgba(0,0,0,0.37)] flex flex-col rounded-3xl">
          {/* Header */}
          <div className="p-4 border-b border-white/30 dark:border-white/20 backdrop-blur flex items-center justify-between">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Resources Map
            </h2>
            {/* Close button - inside menu on mobile */}
            {isMobile && (
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsLeftPanelOpen(false)}
                className="h-8 w-8 rounded-lg hover:bg-white/20"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
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
          <div className="flex-1 flex flex-col overflow-hidden p-4 backdrop-blur">
            <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide flex-shrink-0">Categories</h3>
            <ScrollArea className="flex-1 overflow-hidden">
              <div className="space-y-1 pr-2">
                <Button
                  variant={selectedType === null ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => { setSelectedType(null); setSelectedWorkspace(null); }}
                  className={cn(
                    "w-full justify-start gap-2 rounded-xl backdrop-blur-xl",
                    selectedType === null ? "bg-primary/90" : "bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20"
                  )}
                >
                  <div className="w-2 h-2 rounded-full bg-current" />
                  All Resources
                </Button>
                {(Object.keys(RESOURCE_CONFIG) as ResourceType[]).filter(type => type !== 'perk').map((type) => {
                  const config = RESOURCE_CONFIG[type];
                  const Icon = config.icon;
                  const isSelected = selectedType === type;
                  const isWorkplace = type === 'workplace';
                  return (
                    <Button
                      key={type}
                      variant="ghost"
                      size="sm"
                      onClick={() => { setSelectedType(type); setSelectedResource(null); setSelectedEvent(null); setSelectedWorkspace(null); }}
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
                      {isWorkplace && !isSubscribed && (
                        <Lock className="w-3 h-3 ml-auto text-muted-foreground" />
                      )}
                    </Button>
                  );
                })}

                {/* Earth Intelligence Category */}
                {hasEarthAccess && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => { setShowEarthLayers(!showEarthLayers); }}
                    className={cn(
                      "w-full justify-start gap-2 rounded-xl backdrop-blur-xl mt-2",
                      showEarthLayers
                        ? "bg-emerald-500/20 border-l-4 border-emerald-500"
                        : "bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20"
                    )}
                  >
                    <Earth className="w-4 h-4 text-emerald-400" />
                    Earth Intelligence
                    <Badge variant="outline" className="ml-auto text-[10px] border-emerald-500/50 text-emerald-400 px-1.5 py-0">
                      Premium
                    </Badge>
                  </Button>
                )}
              </div>

              {/* Earth Intelligence Panel */}
              {showEarthLayers && hasEarthAccess ? (
                <div className="mt-4 pt-4 border-t border-white/20 space-y-5">
                  {/* Land Surface category */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      <Earth className="w-3.5 h-3.5 text-emerald-400" />
                      Land Surface
                    </h3>
                    <div className="space-y-3">
                      {earthLayers.filter(l => l.category === 'land-surface').map((layer) => (
                        <EarthLayerCard
                          key={layer.id}
                          layer={layer}
                          onToggle={toggleEarthLayer}
                          onOpacity={setEarthLayerOpacity}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Precipitation category */}
                  <div>
                    <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                      🌧️ <span className="text-xs">Precipitation</span>
                    </h3>
                    <div className="space-y-3">
                      {earthLayers.filter(l => l.category === 'precipitation').map((layer) => (
                        <EarthLayerCard
                          key={layer.id}
                          layer={layer}
                          onToggle={toggleEarthLayer}
                          onOpacity={setEarthLayerOpacity}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              ) : selectedType === 'workplace' ? (
                <div className="mt-4 pt-4 border-t border-white/20">
                  {!isSubscribed ? (
                    /* Lock overlay for non-subscribers */
                    <div className="text-center py-6 space-y-3">
                      <div className="w-16 h-16 mx-auto rounded-2xl bg-muted/20 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <h4 className="font-semibold">Subscription Required</h4>
                      <p className="text-xs text-muted-foreground px-2">
                        Subscribe to any SFH plan to unlock access to Startup Factory Hub workspaces across 130+ countries and 5,600+ locations.
                      </p>
                      <Button
                        size="sm"
                        className="w-full gap-2 rounded-xl"
                        onClick={() => {
                          // Navigate to subscription page
                          window.location.href = '/dashboard';
                        }}
                      >
                        <Star className="w-4 h-4" />
                        View Plans
                      </Button>
                    </div>
                  ) : (
                    /* Subscribed: show workspace filters and cards */
                    <div className="space-y-3">
                      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Office Type</h3>
                      <div className="flex flex-wrap gap-1">
                        {[
                          { value: null, label: 'All' },
                          { value: 'hot_desk', label: 'Hot Desk' },
                          { value: 'private_office', label: 'Private' },
                          { value: 'meeting_room', label: 'Meeting' },
                          { value: 'coworking', label: 'Coworking' },
                        ].map((opt) => (
                          <Button
                            key={opt.value || 'all'}
                            size="sm"
                            variant={regusOfficeType === opt.value ? 'default' : 'ghost'}
                            onClick={() => setRegusOfficeType(opt.value)}
                            className={cn(
                              "text-xs rounded-lg px-2 py-1 h-7",
                              regusOfficeType === opt.value 
                                ? "bg-primary/90" 
                                : "bg-white/5 hover:bg-white/10"
                            )}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                      
                      {/* Search within workspaces */}
                      <div className="relative">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                        <Input
                          placeholder="Search city or name..."
                          value={regusSearch}
                          onChange={(e) => setRegusSearch(e.target.value)}
                          className="pl-8 h-8 text-xs bg-white/10 dark:bg-black/20 border-white/30 rounded-xl"
                        />
                      </div>

                      {/* Results count */}
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs bg-teal-500/20 border-teal-500/50 text-teal-400">
                          {regusLoading ? '...' : `${regusLocations?.length || 0} locations`}
                        </Badge>
                      </div>

                      {/* Workspace cards */}
                      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                        {regusLoading ? (
                          <div className="flex items-center justify-center py-6">
                            <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                          </div>
                        ) : regusLocations?.length === 0 ? (
                          <p className="text-xs text-muted-foreground text-center py-4">No workspaces found</p>
                        ) : (
                          regusLocations?.map((ws) => (
                            <HubsWorkspaceCard
                              key={ws.id}
                              workspace={ws}
                              isSelected={selectedWorkspace?.id === ws.id}
                              onSelect={() => {
                                setSelectedWorkspace(ws);
                                if (map.current && ws.latitude && ws.longitude) {
                                  map.current.flyTo({
                                    center: [ws.longitude, ws.latitude],
                                    zoom: 14,
                                    duration: 2000,
                                  });
                                }
                              }}
                              onBook={() => {
                                setBookingWorkspace(ws);
                                setShowBookingModal(true);
                              }}
                              compact
                            />
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* Journey Step Filter - normal categories */
                <div className="mt-4 pt-4 border-t border-white/20">
                  <h3 className="text-sm font-medium mb-3 text-muted-foreground uppercase tracking-wide">Journey Stage</h3>
                  <div className="space-y-1">
                    <Button
                      variant={selectedJourneyStep === null ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setSelectedJourneyStep(null)}
                      className={cn(
                        "w-full justify-start gap-2 rounded-xl backdrop-blur-xl",
                        selectedJourneyStep === null ? "bg-primary/90" : "bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20"
                      )}
                    >
                      All Stages
                    </Button>
                    {JOURNEY_STEPS.filter(s => s.value !== 'all').map((step) => (
                      <Button
                        key={step.value}
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedJourneyStep(step.value)}
                        className={cn(
                          "w-full justify-start gap-2 rounded-xl backdrop-blur-xl text-left",
                          selectedJourneyStep === step.value
                            ? "bg-white/20 dark:bg-black/30 border-l-4 border-primary" 
                            : "bg-white/5 dark:bg-black/10 hover:bg-white/10 dark:hover:bg-black/20"
                        )}
                      >
                        {step.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}
            </ScrollArea>
            
            {/* Add Resource Button - directly after categories */}
            {selectedType !== 'workplace' && (
            <Button 
              onClick={() => setShowAddDialog(true)} 
              className="w-full gap-2 backdrop-blur-xl bg-primary/90 hover:bg-primary border border-white/20 rounded-2xl mt-4 flex-shrink-0"
            >
              <Plus className="w-4 h-4" />
              Add Resource
            </Button>
            )}
          </div>
        </div>
      </div>

      {/* Online Resources Section - Collapsible */}
      {resources && (() => {
        const onlineResources = resources.filter(r => r.location_type === 'online' && r.resource_type !== 'perk');
        if (onlineResources.length === 0) return null;
        
        // Group by resource type
        const groupedByType = onlineResources.reduce((acc, resource) => {
          const type = resource.resource_type;
          if (!acc[type]) acc[type] = [];
          acc[type].push(resource);
          return acc;
        }, {} as Record<ResourceType, Resource[]>);
        
        // Collapsed state - pill on the right
        if (!isOnlineResourcesExpanded) {
          return (
            <div className="absolute bottom-36 right-4 z-10 pointer-events-auto">
              <Button
                onClick={() => setIsOnlineResourcesExpanded(true)}
                className="tech-card border-0 backdrop-blur-3xl bg-white/10 dark:bg-black/20 rounded-2xl px-3 py-6 flex flex-col items-center gap-2 hover:ring-1 hover:ring-blue-500/50"
                variant="ghost"
              >
                <ChevronLeft className="w-4 h-4 text-blue-400" />
                <Globe2 className="w-5 h-5 text-blue-400" />
                <span className="text-xs font-semibold text-blue-400 [writing-mode:vertical-rl]">{onlineResources.length}</span>
              </Button>
            </div>
          );
        }
        
        // Expanded state
        return (
          <div className={cn(
            "absolute bottom-36 right-4 z-10 pointer-events-auto transition-all duration-300 max-w-[600px]",
            isLeftPanelOpen ? "left-[348px]" : "left-4"
          )}>
            <div className="tech-card border-0 backdrop-blur-3xl bg-white/10 dark:bg-black/20 rounded-2xl p-4 overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Globe2 className="w-4 h-4 text-blue-400" />
                  <h3 className="text-sm font-semibold">Online Resources</h3>
                  <Badge variant="outline" className="text-xs bg-blue-500/20 border-blue-500/50 text-blue-400">
                    {onlineResources.length} available
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOnlineResourcesExpanded(false)}
                  className="h-6 w-6 rounded-lg backdrop-blur-xl bg-white/10 dark:bg-black/20 hover:bg-white/20"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              <ScrollArea className="max-h-48">
                <div className="space-y-3">
                  {Object.entries(groupedByType).map(([type, typeResources]) => {
                    const config = RESOURCE_CONFIG[type as ResourceType];
                    const Icon = config.icon;
                    return (
                      <div key={type}>
                        <div className="flex items-center gap-2 mb-2">
                          <Icon className="w-3 h-3" style={{ color: config.color }} />
                          <span className="text-xs text-muted-foreground font-medium">{config.label} ({typeResources.length})</span>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          {typeResources.slice(0, 5).map((resource) => (
                            <Card
                              key={resource.id}
                              className="tech-card border-0 min-w-[180px] max-w-[180px] cursor-pointer hover:ring-1 flex-shrink-0"
                              style={{ '--tw-ring-color': config.color } as any}
                              onClick={() => setSelectedResource(resource)}
                            >
                              <CardContent className="p-2">
                                <div className="flex items-center gap-2">
                                  {resource.logo_url ? (
                                    <img src={resource.logo_url} alt="" className="w-6 h-6 rounded-md object-cover" />
                                  ) : (
                                    <div 
                                      className="w-6 h-6 rounded-md flex items-center justify-center"
                                      style={{ backgroundColor: config.color }}
                                    >
                                      <Icon className="w-3 h-3 text-white" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-xs truncate">{resource.title}</h4>
                                    {resource.is_official_partner && (
                                      <span className="text-[10px] text-amber-400">⭐ Partner</span>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                          {typeResources.length > 5 && (
                            <div className="text-xs text-muted-foreground flex items-center">
                              +{typeResources.length - 5} more
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </div>
          </div>
        );
      })()}

      {/* Bottom Perks Section - Collapsible */}
      {resources && resources.filter(r => r.resource_type === 'perk').length > 0 && (() => {
        const perks = resources.filter(r => r.resource_type === 'perk');
        
        // Collapsed state - pill on the right
        if (!isPerksExpanded) {
          return (
            <div className="absolute bottom-20 right-4 z-10 pointer-events-auto">
              <Button
                onClick={() => setIsPerksExpanded(true)}
                className="tech-card border-0 backdrop-blur-3xl bg-white/10 dark:bg-black/20 rounded-2xl px-3 py-6 flex flex-col items-center gap-2 hover:ring-1 hover:ring-green-500/50"
                variant="ghost"
              >
                <ChevronLeft className="w-4 h-4 text-green-400" />
                <Gift className="w-5 h-5 text-green-400" />
                <span className="text-xs font-semibold text-green-400 [writing-mode:vertical-rl]">{perks.length}</span>
              </Button>
            </div>
          );
        }
        
        // Expanded state
        return (
          <div className={cn(
            "absolute bottom-4 right-4 z-10 pointer-events-auto transition-all duration-300",
            isLeftPanelOpen ? "left-[348px]" : "left-4"
          )}>
            <div className="tech-card border-0 backdrop-blur-3xl bg-white/10 dark:bg-black/20 rounded-2xl p-4 overflow-hidden">
              <div className="flex items-center justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <Gift className="w-4 h-4 text-green-400" />
                  <h3 className="text-sm font-semibold">Network Perks</h3>
                  <Badge variant="outline" className="text-xs bg-green-500/20 border-green-500/50 text-green-400">
                    {perks.length} available
                  </Badge>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsPerksExpanded(false)}
                  className="h-6 w-6 rounded-lg backdrop-blur-xl bg-white/10 dark:bg-black/20 hover:bg-white/20"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
              
              {/* Manual Infinite Scroll Container */}
              <div 
                className="overflow-x-auto scrollbar-thin pb-2"
                onScroll={(e) => {
                  const container = e.currentTarget;
                  const scrollWidth = container.scrollWidth;
                  const scrollLeft = container.scrollLeft;
                  const sectionWidth = scrollWidth / 3;
                  
                  // If scrolled to near the end, jump back to middle section
                  if (scrollLeft >= sectionWidth * 2 - 10) {
                    container.scrollLeft = sectionWidth;
                  }
                  // If scrolled to near the beginning, jump to middle section
                  else if (scrollLeft <= 10) {
                    container.scrollLeft = sectionWidth;
                  }
                }}
                ref={(el) => {
                  // Initialize scroll position to middle section on mount
                  if (el && el.scrollLeft === 0) {
                    const sectionWidth = el.scrollWidth / 3;
                    el.scrollLeft = sectionWidth;
                  }
                }}
              >
                <div className="flex gap-3" style={{ width: 'max-content' }}>
                  {/* Triple the perks for seamless circular scroll */}
                  {[...perks, ...perks, ...perks].map((perk, index) => (
                    <Card
                      key={`perk-${index}-${perk.id}`}
                      className="tech-card border-0 min-w-[220px] max-w-[220px] cursor-pointer hover:ring-1 hover:ring-green-500/50 flex-shrink-0"
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
                        <div className="flex items-center gap-2">
                          {perk.logo_url ? (
                            <img src={perk.logo_url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <Gift className="w-6 h-6 text-green-400" />
                          )}
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm truncate">{perk.title}</h4>
                            {perk.is_official_partner && (
                              <span className="text-xs text-amber-400">⭐ Partner</span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Right Side Panel - Resource Details (Slide In) */}
      <div 
        className={cn(
          "absolute right-2 top-2 bottom-2 w-96 z-20 transition-all duration-300",
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
                {selectedResource.logo_url ? (
                  <img 
                    src={selectedResource.logo_url} 
                    alt="" 
                    className="w-full h-32 rounded-2xl object-cover mb-3" 
                  />
                ) : (
                  <div 
                    className="w-full h-32 rounded-2xl mb-3 flex items-center justify-center"
                    style={{ 
                      background: `linear-gradient(135deg, ${RESOURCE_CONFIG[selectedResource.resource_type].color}, ${RESOURCE_CONFIG[selectedResource.resource_type].color}99)` 
                    }}
                  >
                    {(() => {
                      const Icon = RESOURCE_CONFIG[selectedResource.resource_type].icon;
                      return <Icon className="w-12 h-12 text-white/80" />;
                    })()}
                  </div>
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
                    <Button 
                      size="sm" 
                      variant="outline" 
                      className="gap-2 backdrop-blur-2xl bg-white/10 dark:bg-black/20 border-white/30 dark:border-white/20 hover:bg-white/20 dark:hover:bg-black/30 w-full justify-start rounded-xl"
                      onClick={() => {
                        const url = `${window.location.origin}/resources?id=${selectedResource.id}`;
                        navigator.clipboard.writeText(url);
                        toast({ title: "Link copied!", description: "Share this link to highlight this resource" });
                      }}
                    >
                      <Share2 className="w-4 h-4" />
                      Share Resource
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

      {/* Regus Workspace Detail Panel */}
      {selectedType === 'workplace' && (
        <HubsDetailPanel
          workspace={selectedWorkspace}
          onClose={() => setSelectedWorkspace(null)}
          onBook={(ws) => {
            setBookingWorkspace(ws);
            setShowBookingModal(true);
          }}
        />
      )}

      {/* Regus Booking Modal (no payment) */}
      <RegusBookingModal
        workspace={bookingWorkspace}
        open={showBookingModal}
        onOpenChange={setShowBookingModal}
      />

      {/* Earth Intelligence Viewport Toolbar */}
      <EarthViewportToolbar
        isVisible={hasEarthAccess && earthLayers.some(l => l.id === 'gsmap-precipitation' && l.enabled)}
        isPlaying={isPlaying}
        onTogglePlayback={togglePlayback}
        onStepFrame={stepFrame}
        currentFrameTime={currentFrameTime}
        frameCount={precipFrames.length}
        currentFrameIndex={currentFrameIndex}
        onFrameChange={setCurrentFrameIndex}
        onToggleLayers={() => setShowEarthLayers(prev => !prev)}
      />
    </div>
  );
};