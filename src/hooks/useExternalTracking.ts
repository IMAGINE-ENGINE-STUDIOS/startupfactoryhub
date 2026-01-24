import { useState, useEffect, useCallback, useRef } from 'react';

export interface TrackedEntity {
  id: string;
  type: 'vehicle' | 'delivery' | 'drone' | 'plane' | 'ship' | 'rocket' | 'satellite' | 'buoy' | 'helicopter';
  name: string;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  altitude?: number;
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
}

// Demo tracking providers
export const DEMO_PROVIDERS: TrackingProvider[] = [
  {
    id: 'ground-vehicles',
    name: 'Ground Vehicles',
    description: 'Cars, trucks, delivery vehicles',
    pollInterval: 1000,
    enabled: false,
  },
  {
    id: 'air-traffic',
    name: 'Air Traffic',
    description: 'Planes, helicopters, drones',
    pollInterval: 800,
    enabled: false,
  },
  {
    id: 'maritime',
    name: 'Maritime',
    description: 'Ships, boats, ocean buoys',
    pollInterval: 2000,
    enabled: false,
  },
  {
    id: 'space',
    name: 'Space Assets',
    description: 'Satellites, rockets',
    pollInterval: 500,
    enabled: false,
  },
];

// Entity configurations with realistic movement patterns
interface EntityConfig {
  id: string;
  type: TrackedEntity['type'];
  name: string;
  baseLat: number;
  baseLng: number;
  speedKmh: number;
  altitude?: number;
  pathType: 'street' | 'orbit' | 'ocean' | 'air' | 'launch';
  pathPoints?: [number, number][];
}

// Street paths for ground vehicles (realistic road coordinates)
const STREET_PATHS: { [key: string]: [number, number][] } = {
  nyc: [
    [-74.006, 40.7128], [-74.009, 40.7145], [-74.012, 40.7160], [-74.015, 40.7175],
    [-74.018, 40.7190], [-74.020, 40.7205], [-74.018, 40.7220], [-74.015, 40.7235],
    [-74.012, 40.7250], [-74.009, 40.7235], [-74.006, 40.7220], [-74.006, 40.7128],
  ],
  london: [
    [-0.1278, 51.5074], [-0.1300, 51.5090], [-0.1320, 51.5105], [-0.1340, 51.5120],
    [-0.1360, 51.5135], [-0.1340, 51.5150], [-0.1320, 51.5135], [-0.1300, 51.5120],
    [-0.1278, 51.5105], [-0.1278, 51.5074],
  ],
  tokyo: [
    [139.6917, 35.6895], [139.6940, 35.6910], [139.6960, 35.6925], [139.6980, 35.6940],
    [139.7000, 35.6955], [139.6980, 35.6970], [139.6960, 35.6955], [139.6940, 35.6940],
    [139.6917, 35.6925], [139.6917, 35.6895],
  ],
  orlando: [
    [-81.3792, 28.5383], [-81.3810, 28.5400], [-81.3830, 28.5415], [-81.3850, 28.5430],
    [-81.3870, 28.5445], [-81.3850, 28.5460], [-81.3830, 28.5445], [-81.3810, 28.5430],
    [-81.3792, 28.5415], [-81.3792, 28.5383],
  ],
  miami: [
    [-80.1918, 25.7617], [-80.1940, 25.7635], [-80.1960, 25.7650], [-80.1980, 25.7665],
    [-80.2000, 25.7680], [-80.1980, 25.7695], [-80.1960, 25.7680], [-80.1940, 25.7665],
    [-80.1918, 25.7650], [-80.1918, 25.7617],
  ],
};

// Ocean routes for ships
const OCEAN_ROUTES: [number, number][] = [
  [-74.0, 40.5], [-70.0, 41.0], [-65.0, 42.0], [-60.0, 43.0],
  [-50.0, 45.0], [-40.0, 48.0], [-30.0, 50.0], [-20.0, 51.0],
  [-10.0, 51.5], [0.0, 51.5], [-10.0, 51.5], [-20.0, 51.0],
];

// Air corridors
const AIR_CORRIDORS: { [key: string]: [number, number][] } = {
  transatlantic: [
    [-74.0, 40.7], [-60.0, 45.0], [-45.0, 50.0], [-30.0, 52.0],
    [-15.0, 52.0], [0.0, 51.5], [-15.0, 52.0], [-30.0, 52.0],
  ],
  pacific: [
    [-122.4, 37.8], [-140.0, 35.0], [-160.0, 30.0], [-180.0, 25.0],
    [160.0, 22.0], [140.0, 35.0], [139.7, 35.7],
  ],
};

// Entity state management
interface EntityState {
  pathIndex: number;
  progress: number;
  direction: 1 | -1;
  orbitAngle?: number;
}

const entityStates = new Map<string, EntityState>();

const getOrCreateState = (id: string): EntityState => {
  if (!entityStates.has(id)) {
    entityStates.set(id, { 
      pathIndex: 0, 
      progress: Math.random(), 
      direction: 1,
      orbitAngle: Math.random() * 360
    });
  }
  return entityStates.get(id)!;
};

// Calculate heading between two points
const calculateHeading = (from: [number, number], to: [number, number]): number => {
  const dLng = to[0] - from[0];
  const dLat = to[1] - from[1];
  return (Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360;
};

// Interpolate position along path
const interpolatePosition = (
  path: [number, number][], 
  state: EntityState,
  speedFactor: number
): { lat: number; lng: number; heading: number } => {
  state.progress += speedFactor;
  
  if (state.progress >= 1) {
    state.progress = 0;
    state.pathIndex = (state.pathIndex + state.direction + path.length) % path.length;
    
    // Reverse direction at endpoints for some paths
    if (state.pathIndex === 0 || state.pathIndex === path.length - 1) {
      state.direction *= -1;
    }
  }
  
  const currentPoint = path[state.pathIndex];
  const nextIndex = (state.pathIndex + 1) % path.length;
  const nextPoint = path[nextIndex];
  
  const lat = currentPoint[1] + (nextPoint[1] - currentPoint[1]) * state.progress;
  const lng = currentPoint[0] + (nextPoint[0] - currentPoint[0]) * state.progress;
  const heading = calculateHeading(currentPoint, nextPoint);
  
  return { lat, lng, heading };
};

// Generate ground vehicles (cars, trucks, delivery vans)
const generateGroundVehicles = (): TrackedEntity[] => {
  const now = new Date().toISOString();
  const vehicles: TrackedEntity[] = [];
  
  const vehicleTypes = [
    { prefix: 'DEL', type: 'delivery' as const, name: 'Delivery Van', speed: 35 },
    { prefix: 'CAR', type: 'vehicle' as const, name: 'Sedan', speed: 45 },
    { prefix: 'TRK', type: 'vehicle' as const, name: 'Truck', speed: 30 },
    { prefix: 'TAX', type: 'vehicle' as const, name: 'Taxi', speed: 40 },
    { prefix: 'AMB', type: 'vehicle' as const, name: 'Ambulance', speed: 60 },
  ];
  
  const cities = Object.entries(STREET_PATHS);
  
  cities.forEach(([city, path], cityIdx) => {
    vehicleTypes.forEach((vt, vtIdx) => {
      const id = `${vt.prefix}-${city}-${vtIdx}`;
      const state = getOrCreateState(id);
      const pos = interpolatePosition(path, state, 0.02 + Math.random() * 0.01);
      
      vehicles.push({
        id,
        type: vt.type,
        name: `${vt.name} #${cityIdx * 10 + vtIdx + 1}`,
        latitude: pos.lat,
        longitude: pos.lng,
        heading: pos.heading,
        speed: vt.speed + Math.random() * 10,
        metadata: { city, status: 'in_transit' },
        lastUpdated: now,
      });
    });
  });
  
  return vehicles;
};

// Generate air traffic (planes, helicopters, drones)
const generateAirTraffic = (): TrackedEntity[] => {
  const now = new Date().toISOString();
  const aircraft: TrackedEntity[] = [];
  
  // Commercial planes on corridors
  Object.entries(AIR_CORRIDORS).forEach(([corridor, path], idx) => {
    const id = `PLANE-${corridor}-${idx}`;
    const state = getOrCreateState(id);
    const pos = interpolatePosition(path, state, 0.005);
    
    aircraft.push({
      id,
      type: 'plane',
      name: `Flight ${['AA', 'UA', 'DL', 'BA'][idx % 4]}${1000 + idx}`,
      latitude: pos.lat,
      longitude: pos.lng,
      heading: pos.heading,
      speed: 850 + Math.random() * 100,
      altitude: 35000 + Math.random() * 5000,
      metadata: { corridor, airline: ['American', 'United', 'Delta', 'British Airways'][idx % 4] },
      lastUpdated: now,
    });
  });
  
  // Helicopters near cities
  const heliPads = [
    { city: 'NYC', lat: 40.7580, lng: -73.9855 },
    { city: 'LA', lat: 34.0522, lng: -118.2437 },
    { city: 'London', lat: 51.5074, lng: -0.1278 },
  ];
  
  heliPads.forEach((pad, idx) => {
    const id = `HELI-${pad.city}`;
    const state = getOrCreateState(id);
    state.orbitAngle = (state.orbitAngle || 0) + 3;
    const radius = 0.02;
    
    aircraft.push({
      id,
      type: 'helicopter',
      name: `Heli ${pad.city}-${idx + 1}`,
      latitude: pad.lat + Math.sin(state.orbitAngle! * Math.PI / 180) * radius,
      longitude: pad.lng + Math.cos(state.orbitAngle! * Math.PI / 180) * radius,
      heading: state.orbitAngle! + 90,
      speed: 120,
      altitude: 1500 + Math.random() * 500,
      metadata: { base: pad.city },
      lastUpdated: now,
    });
  });
  
  // Delivery drones
  const droneZones = [
    { zone: 'SF', lat: 37.7749, lng: -122.4194 },
    { zone: 'Seattle', lat: 47.6062, lng: -122.3321 },
    { zone: 'Austin', lat: 30.2672, lng: -97.7431 },
    { zone: 'Dubai', lat: 25.2048, lng: 55.2708 },
  ];
  
  droneZones.forEach((zone, idx) => {
    for (let d = 0; d < 3; d++) {
      const id = `DRONE-${zone.zone}-${d}`;
      const state = getOrCreateState(id);
      state.orbitAngle = (state.orbitAngle || 0) + 5 + d * 2;
      const radius = 0.01 + d * 0.005;
      
      aircraft.push({
        id,
        type: 'drone',
        name: `Drone ${zone.zone}-${d + 1}`,
        latitude: zone.lat + Math.sin((state.orbitAngle! + d * 120) * Math.PI / 180) * radius,
        longitude: zone.lng + Math.cos((state.orbitAngle! + d * 120) * Math.PI / 180) * radius,
        heading: (state.orbitAngle! + d * 120 + 90) % 360,
        speed: 45 + Math.random() * 15,
        altitude: 100 + Math.random() * 200,
        metadata: { zone: zone.zone, payload: 'Package' },
        lastUpdated: now,
      });
    }
  });
  
  return aircraft;
};

// Generate maritime traffic (ships, boats, buoys)
const generateMaritime = (): TrackedEntity[] => {
  const now = new Date().toISOString();
  const vessels: TrackedEntity[] = [];
  
  // Cargo ships on ocean routes
  for (let i = 0; i < 4; i++) {
    const id = `SHIP-CARGO-${i}`;
    const state = getOrCreateState(id);
    state.progress += i * 0.25; // Offset ships along route
    const pos = interpolatePosition(OCEAN_ROUTES, state, 0.002);
    
    vessels.push({
      id,
      type: 'ship',
      name: `MV ${['Atlantic', 'Pacific', 'Global', 'Maersk'][i]} ${['Star', 'Express', 'Trader', 'Pioneer'][i]}`,
      latitude: pos.lat + (Math.random() - 0.5) * 0.5,
      longitude: pos.lng,
      heading: pos.heading,
      speed: 20 + Math.random() * 5,
      metadata: { cargo: 'Containers', tonnage: 50000 + i * 10000 },
      lastUpdated: now,
    });
  }
  
  // Cruise ships
  const cruiseRoutes = [
    { start: [-80.1, 25.8], end: [-77.0, 25.0], name: 'Caribbean Princess' },
    { start: [12.3, 45.4], end: [14.5, 40.8], name: 'Mediterranean Star' },
  ];
  
  cruiseRoutes.forEach((route, idx) => {
    const id = `CRUISE-${idx}`;
    const state = getOrCreateState(id);
    state.progress += 0.003;
    if (state.progress > 1) { state.progress = 0; state.direction *= -1; }
    
    const lat = route.start[1] + (route.end[1] - route.start[1]) * state.progress;
    const lng = route.start[0] + (route.end[0] - route.start[0]) * state.progress;
    
    vessels.push({
      id,
      type: 'ship',
      name: route.name,
      latitude: lat,
      longitude: lng,
      heading: calculateHeading([route.start[0], route.start[1]], [route.end[0], route.end[1]]),
      speed: 18,
      metadata: { type: 'Cruise', passengers: 3000 + idx * 500 },
      lastUpdated: now,
    });
  });
  
  // Ocean buoys (stationary with slight drift)
  const buoyLocations = [
    { id: 'NOAA-1', lat: 38.5, lng: -70.5, name: 'NOAA Buoy #44017' },
    { id: 'NOAA-2', lat: 32.3, lng: -75.2, name: 'NOAA Buoy #41002' },
    { id: 'NOAA-3', lat: 40.8, lng: -68.5, name: 'NOAA Buoy #44011' },
    { id: 'PACIFIC-1', lat: 35.0, lng: -140.0, name: 'Pacific Buoy #P1' },
    { id: 'ATLANTIC-1', lat: 48.0, lng: -30.0, name: 'Atlantic Buoy #A1' },
  ];
  
  buoyLocations.forEach(buoy => {
    const drift = (Math.sin(Date.now() / 10000) + Math.cos(Date.now() / 15000)) * 0.001;
    
    vessels.push({
      id: `BUOY-${buoy.id}`,
      type: 'buoy',
      name: buoy.name,
      latitude: buoy.lat + drift,
      longitude: buoy.lng + drift * 0.5,
      heading: 0,
      speed: 0,
      metadata: { 
        waveHeight: (2 + Math.sin(Date.now() / 5000) * 1.5).toFixed(1) + 'm',
        waterTemp: (15 + Math.cos(Date.now() / 8000) * 3).toFixed(1) + '°C'
      },
      lastUpdated: now,
    });
  });
  
  return vessels;
};

// Generate space assets (satellites, rockets)
const generateSpaceAssets = (): TrackedEntity[] => {
  const now = new Date().toISOString();
  const spaceAssets: TrackedEntity[] = [];
  
  // Satellites in different orbits
  const satellites = [
    { name: 'Starlink-1234', inclination: 53, altitude: 550 },
    { name: 'Starlink-5678', inclination: 53, altitude: 550 },
    { name: 'ISS', inclination: 51.6, altitude: 420 },
    { name: 'Hubble', inclination: 28.5, altitude: 540 },
    { name: 'GPS-IIF-12', inclination: 55, altitude: 20200 },
    { name: 'Sentinel-2A', inclination: 98.5, altitude: 786 },
  ];
  
  satellites.forEach((sat, idx) => {
    const id = `SAT-${sat.name}`;
    const state = getOrCreateState(id);
    state.orbitAngle = (state.orbitAngle || 0) + (1 + idx * 0.3);
    
    // Simple orbital calculation
    const t = state.orbitAngle! * Math.PI / 180;
    const inclRad = sat.inclination * Math.PI / 180;
    
    const lat = Math.sin(t) * sat.inclination;
    const lng = ((state.orbitAngle! * 2 + idx * 60) % 360) - 180;
    
    spaceAssets.push({
      id,
      type: 'satellite',
      name: sat.name,
      latitude: lat,
      longitude: lng,
      heading: (state.orbitAngle! + 90) % 360,
      speed: 27000 / (1 + sat.altitude / 6371), // Orbital velocity approximation
      altitude: sat.altitude * 1000,
      metadata: { orbit: `${sat.altitude}km`, inclination: `${sat.inclination}°` },
      lastUpdated: now,
    });
  });
  
  // SpaceX Rockets (simulated launches)
  const launchSites = [
    { name: 'Falcon 9', site: 'Kennedy', lat: 28.5721, lng: -80.6480 },
    { name: 'Starship', site: 'Starbase', lat: 25.9971, lng: -97.1566 },
  ];
  
  launchSites.forEach((rocket, idx) => {
    const id = `ROCKET-${rocket.name.replace(' ', '-')}`;
    const state = getOrCreateState(id);
    
    // Simulate launch trajectory
    state.progress += 0.005;
    if (state.progress > 1) state.progress = 0;
    
    // Parabolic trajectory
    const launchPhase = state.progress;
    const altitude = launchPhase < 0.1 
      ? launchPhase * 1000000 // Rapid ascent
      : 100000 + Math.sin(launchPhase * Math.PI) * 200000;
    
    const downrange = launchPhase * 15; // Degrees downrange
    
    spaceAssets.push({
      id,
      type: 'rocket',
      name: `SpaceX ${rocket.name}`,
      latitude: rocket.lat + downrange * Math.cos(45 * Math.PI / 180),
      longitude: rocket.lng + downrange * Math.sin(45 * Math.PI / 180),
      heading: 45 + launchPhase * 45,
      speed: 1000 + launchPhase * 27000,
      altitude: altitude,
      metadata: { 
        mission: `Starlink Mission ${idx + 1}`,
        phase: launchPhase < 0.1 ? 'Launch' : launchPhase < 0.3 ? 'Ascent' : 'Orbit Insertion'
      },
      lastUpdated: now,
    });
  });
  
  return spaceAssets;
};

// Provider to generator mapping
const GENERATORS: { [key: string]: () => TrackedEntity[] } = {
  'ground-vehicles': generateGroundVehicles,
  'air-traffic': generateAirTraffic,
  'maritime': generateMaritime,
  'space': generateSpaceAssets,
};

export const useExternalTracking = (initialProviders: TrackingProvider[] = DEMO_PROVIDERS) => {
  const [providers, setProviders] = useState<TrackingProvider[]>(initialProviders);
  const [entities, setEntities] = useState<Map<string, TrackedEntity[]>>(new Map());
  const [isPolling, setIsPolling] = useState(false);
  const intervalsRef = useRef<NodeJS.Timeout[]>([]);

  useEffect(() => {
    // Clear existing intervals
    intervalsRef.current.forEach(clearInterval);
    intervalsRef.current = [];
    
    const enabledProviders = providers.filter(p => p.enabled);
    setIsPolling(enabledProviders.length > 0);

    enabledProviders.forEach(provider => {
      const generator = GENERATORS[provider.id];
      if (!generator) return;

      const fetchData = () => {
        const newEntities = generator();
        setEntities(prev => new Map(prev).set(provider.id, newEntities));
      };

      fetchData();
      const interval = setInterval(fetchData, provider.pollInterval);
      intervalsRef.current.push(interval);
    });

    return () => {
      intervalsRef.current.forEach(clearInterval);
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
