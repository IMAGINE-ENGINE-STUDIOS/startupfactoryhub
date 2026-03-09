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
  pollInterval: number;
  enabled: boolean;
  fetchUrl?: string;
}

export const useExternalTracking = (initialProviders: TrackingProvider[] = []) => {
  const [providers, setProviders] = useState<TrackingProvider[]>(initialProviders);
  const [entities, setEntities] = useState<Map<string, TrackedEntity[]>>(new Map());
  const [isPolling, setIsPolling] = useState(false);

  useEffect(() => {
    const intervals: NodeJS.Timeout[] = [];
    const enabledProviders = providers.filter(p => p.enabled && p.fetchUrl);
    
    setIsPolling(enabledProviders.length > 0);

    enabledProviders.forEach(provider => {
      const fetchData = async () => {
        if (!provider.fetchUrl) return;
        try {
          const resp = await fetch(provider.fetchUrl);
          if (!resp.ok) return;
          const data = await resp.json();
          if (Array.isArray(data)) {
            setEntities(prev => new Map(prev).set(provider.id, data));
          }
        } catch {
          // Silently fail for individual provider fetches
        }
      };

      fetchData();
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
