import { useState, useEffect, useCallback } from 'react';

export interface TrackedEntity {
  id: string;
  type: 'vehicle' | 'delivery' | 'drone' | 'asset';
  name: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  icon?: string;
  metadata?: Record<string, any>;
  lastUpdated: string;
}

export interface TrackingProvider {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  pollInterval: number; // milliseconds
  enabled: boolean;
}

// Demo tracking providers for testing
export const DEMO_PROVIDERS: TrackingProvider[] = [
  {
    id: 'demo-vehicles',
    name: 'Demo Vehicles',
    description: 'Simulated vehicle tracking',
    pollInterval: 3000,
    enabled: false,
  },
  {
    id: 'demo-deliveries',
    name: 'Demo Deliveries',
    description: 'Simulated delivery tracking',
    pollInterval: 5000,
    enabled: false,
  },
  {
    id: 'demo-drones',
    name: 'Demo Drones',
    description: 'Simulated drone tracking',
    pollInterval: 2000,
    enabled: false,
  },
];

// Generate demo entities for testing
const generateDemoEntities = (providerId: string): TrackedEntity[] => {
  const now = new Date().toISOString();
  
  if (providerId === 'demo-vehicles') {
    return [
      { id: 'v1', type: 'vehicle', name: 'Vehicle Alpha', latitude: 28.5383 + (Math.random() - 0.5) * 0.01, longitude: -81.3792 + (Math.random() - 0.5) * 0.01, heading: Math.random() * 360, speed: 35, lastUpdated: now },
      { id: 'v2', type: 'vehicle', name: 'Vehicle Beta', latitude: 40.7128 + (Math.random() - 0.5) * 0.01, longitude: -74.0060 + (Math.random() - 0.5) * 0.01, heading: Math.random() * 360, speed: 45, lastUpdated: now },
      { id: 'v3', type: 'vehicle', name: 'Vehicle Gamma', latitude: 35.6762 + (Math.random() - 0.5) * 0.01, longitude: 139.6503 + (Math.random() - 0.5) * 0.01, heading: Math.random() * 360, speed: 28, lastUpdated: now },
    ];
  }
  
  if (providerId === 'demo-deliveries') {
    return [
      { id: 'd1', type: 'delivery', name: 'Package #1234', latitude: 37.7749 + (Math.random() - 0.5) * 0.02, longitude: -122.4194 + (Math.random() - 0.5) * 0.02, lastUpdated: now, metadata: { status: 'in_transit' } },
      { id: 'd2', type: 'delivery', name: 'Package #5678', latitude: 51.5074 + (Math.random() - 0.5) * 0.02, longitude: -0.1278 + (Math.random() - 0.5) * 0.02, lastUpdated: now, metadata: { status: 'delivering' } },
    ];
  }
  
  if (providerId === 'demo-drones') {
    return [
      { id: 'dr1', type: 'drone', name: 'Drone Alpha-1', latitude: -33.8688 + (Math.random() - 0.5) * 0.005, longitude: 151.2093 + (Math.random() - 0.5) * 0.005, heading: Math.random() * 360, speed: 60, lastUpdated: now },
      { id: 'dr2', type: 'drone', name: 'Drone Beta-2', latitude: 48.8566 + (Math.random() - 0.5) * 0.005, longitude: 2.3522 + (Math.random() - 0.5) * 0.005, heading: Math.random() * 360, speed: 55, lastUpdated: now },
    ];
  }
  
  return [];
};

export const useExternalTracking = (initialProviders: TrackingProvider[] = DEMO_PROVIDERS) => {
  const [providers, setProviders] = useState<TrackingProvider[]>(initialProviders);
  const [entities, setEntities] = useState<Map<string, TrackedEntity[]>>(new Map());
  const [isPolling, setIsPolling] = useState(false);

  // Poll enabled providers
  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    const enabledProviders = providers.filter(p => p.enabled);
    
    setIsPolling(enabledProviders.length > 0);

    enabledProviders.forEach(provider => {
      const fetchData = () => {
        // For demo, generate random entities
        // In production, this would call an Edge Function
        const newEntities = generateDemoEntities(provider.id);
        setEntities(prev => new Map(prev).set(provider.id, newEntities));
      };

      fetchData(); // Initial fetch
      const interval = setInterval(fetchData, provider.pollInterval);
      intervals.push(interval);
    });

    return () => {
      intervals.forEach(clearInterval);
    };
  }, [providers]);

  const enableProvider = useCallback((providerId: string) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, enabled: true } : p
    ));
  }, []);

  const disableProvider = useCallback((providerId: string) => {
    setProviders(prev => prev.map(p => 
      p.id === providerId ? { ...p, enabled: false } : p
    ));
    setEntities(prev => {
      const next = new Map(prev);
      next.delete(providerId);
      return next;
    });
  }, []);

  const toggleProvider = useCallback((providerId: string) => {
    const provider = providers.find(p => p.id === providerId);
    if (provider?.enabled) {
      disableProvider(providerId);
    } else {
      enableProvider(providerId);
    }
  }, [providers, enableProvider, disableProvider]);

  // Get all entities as a flat array
  const allEntities = Array.from(entities.values()).flat();

  return { 
    providers, 
    entities, 
    allEntities,
    isPolling,
    enableProvider, 
    disableProvider,
    toggleProvider,
  };
};
