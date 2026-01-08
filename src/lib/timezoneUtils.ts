// Timezone utilities for GlobalClock component

export interface TimezoneInfo {
  id: string;
  city: string;
  region: string;
  country: string;
  offset: string;
  currentTime: string;
  flag?: string;
}

// Country to flag emoji mapping
const countryFlags: Record<string, string> = {
  'United States': '🇺🇸',
  'United Kingdom': '🇬🇧',
  'Japan': '🇯🇵',
  'Australia': '🇦🇺',
  'Germany': '🇩🇪',
  'France': '🇫🇷',
  'India': '🇮🇳',
  'China': '🇨🇳',
  'Brazil': '🇧🇷',
  'Canada': '🇨🇦',
  'Mexico': '🇲🇽',
  'Spain': '🇪🇸',
  'Italy': '🇮🇹',
  'Russia': '🇷🇺',
  'South Korea': '🇰🇷',
  'Netherlands': '🇳🇱',
  'Switzerland': '🇨🇭',
  'Sweden': '🇸🇪',
  'Norway': '🇳🇴',
  'Denmark': '🇩🇰',
  'Finland': '🇫🇮',
  'Poland': '🇵🇱',
  'Austria': '🇦🇹',
  'Belgium': '🇧🇪',
  'Portugal': '🇵🇹',
  'Greece': '🇬🇷',
  'Turkey': '🇹🇷',
  'Israel': '🇮🇱',
  'UAE': '🇦🇪',
  'Saudi Arabia': '🇸🇦',
  'Singapore': '🇸🇬',
  'Hong Kong': '🇭🇰',
  'Thailand': '🇹🇭',
  'Indonesia': '🇮🇩',
  'Malaysia': '🇲🇾',
  'Philippines': '🇵🇭',
  'Vietnam': '🇻🇳',
  'New Zealand': '🇳🇿',
  'Argentina': '🇦🇷',
  'Chile': '🇨🇱',
  'Colombia': '🇨🇴',
  'Peru': '🇵🇪',
  'Egypt': '🇪🇬',
  'South Africa': '🇿🇦',
  'Nigeria': '🇳🇬',
  'Kenya': '🇰🇪',
  'Morocco': '🇲🇦',
  'Ireland': '🇮🇪',
  'Czech Republic': '🇨🇿',
  'Romania': '🇷🇴',
  'Hungary': '🇭🇺',
  'Ukraine': '🇺🇦',
  'Pakistan': '🇵🇰',
  'Bangladesh': '🇧🇩',
  'Taiwan': '🇹🇼',
};

// Region to country mapping for common timezones
const regionToCountry: Record<string, string> = {
  'America/New_York': 'United States',
  'America/Los_Angeles': 'United States',
  'America/Chicago': 'United States',
  'America/Denver': 'United States',
  'America/Phoenix': 'United States',
  'America/Anchorage': 'United States',
  'America/Toronto': 'Canada',
  'America/Vancouver': 'Canada',
  'America/Mexico_City': 'Mexico',
  'America/Sao_Paulo': 'Brazil',
  'America/Buenos_Aires': 'Argentina',
  'America/Santiago': 'Chile',
  'America/Bogota': 'Colombia',
  'America/Lima': 'Peru',
  'Europe/London': 'United Kingdom',
  'Europe/Paris': 'France',
  'Europe/Berlin': 'Germany',
  'Europe/Rome': 'Italy',
  'Europe/Madrid': 'Spain',
  'Europe/Amsterdam': 'Netherlands',
  'Europe/Zurich': 'Switzerland',
  'Europe/Stockholm': 'Sweden',
  'Europe/Oslo': 'Norway',
  'Europe/Copenhagen': 'Denmark',
  'Europe/Helsinki': 'Finland',
  'Europe/Warsaw': 'Poland',
  'Europe/Vienna': 'Austria',
  'Europe/Brussels': 'Belgium',
  'Europe/Lisbon': 'Portugal',
  'Europe/Athens': 'Greece',
  'Europe/Istanbul': 'Turkey',
  'Europe/Moscow': 'Russia',
  'Europe/Dublin': 'Ireland',
  'Europe/Prague': 'Czech Republic',
  'Europe/Bucharest': 'Romania',
  'Europe/Budapest': 'Hungary',
  'Europe/Kiev': 'Ukraine',
  'Asia/Tokyo': 'Japan',
  'Asia/Seoul': 'South Korea',
  'Asia/Shanghai': 'China',
  'Asia/Hong_Kong': 'Hong Kong',
  'Asia/Singapore': 'Singapore',
  'Asia/Bangkok': 'Thailand',
  'Asia/Jakarta': 'Indonesia',
  'Asia/Kuala_Lumpur': 'Malaysia',
  'Asia/Manila': 'Philippines',
  'Asia/Ho_Chi_Minh': 'Vietnam',
  'Asia/Taipei': 'Taiwan',
  'Asia/Dubai': 'UAE',
  'Asia/Riyadh': 'Saudi Arabia',
  'Asia/Jerusalem': 'Israel',
  'Asia/Kolkata': 'India',
  'Asia/Karachi': 'Pakistan',
  'Asia/Dhaka': 'Bangladesh',
  'Australia/Sydney': 'Australia',
  'Australia/Melbourne': 'Australia',
  'Australia/Brisbane': 'Australia',
  'Australia/Perth': 'Australia',
  'Pacific/Auckland': 'New Zealand',
  'Africa/Cairo': 'Egypt',
  'Africa/Johannesburg': 'South Africa',
  'Africa/Lagos': 'Nigeria',
  'Africa/Nairobi': 'Kenya',
  'Africa/Casablanca': 'Morocco',
};

export function getAllTimezones(): string[] {
  try {
    // @ts-expect-error - supportedValuesOf is available in modern browsers
    return Intl.supportedValuesOf('timeZone');
  } catch {
    // Fallback for older browsers
    return Object.keys(regionToCountry);
  }
}

export function parseTimezone(tzId: string): { city: string; region: string } {
  const parts = tzId.split('/');
  const city = parts[parts.length - 1].replace(/_/g, ' ');
  const region = parts[0];
  return { city, region };
}

export function getTimezoneOffset(tzId: string): string {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tzId,
      timeZoneName: 'shortOffset',
    });
    const parts = formatter.formatToParts(now);
    const offsetPart = parts.find(p => p.type === 'timeZoneName');
    return offsetPart?.value || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function getTimeInTimezone(tzId: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      timeZone: tzId,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date());
  } catch {
    return '--:--:--';
  }
}

export function getTimezoneAbbreviation(tzId: string): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: tzId,
      timeZoneName: 'short',
    });
    const parts = formatter.formatToParts(new Date());
    const tzPart = parts.find(p => p.type === 'timeZoneName');
    return tzPart?.value || tzId.split('/').pop()?.replace(/_/g, ' ') || 'UTC';
  } catch {
    return 'UTC';
  }
}

export function getCountryForTimezone(tzId: string): string {
  return regionToCountry[tzId] || parseTimezone(tzId).region;
}

export function getFlagForTimezone(tzId: string): string {
  const country = getCountryForTimezone(tzId);
  return countryFlags[country] || '🌍';
}

export function searchTimezones(query: string): TimezoneInfo[] {
  if (!query.trim()) return [];
  
  const allTimezones = getAllTimezones();
  const normalizedQuery = query.toLowerCase().trim();
  
  const results: TimezoneInfo[] = [];
  
  for (const tzId of allTimezones) {
    const { city, region } = parseTimezone(tzId);
    const country = getCountryForTimezone(tzId);
    const searchString = `${city} ${region} ${country} ${tzId}`.toLowerCase();
    
    if (searchString.includes(normalizedQuery)) {
      results.push({
        id: tzId,
        city,
        region,
        country,
        offset: getTimezoneOffset(tzId),
        currentTime: getTimeInTimezone(tzId),
        flag: getFlagForTimezone(tzId),
      });
      
      if (results.length >= 10) break;
    }
  }
  
  return results;
}

export function getPopularTimezones(): TimezoneInfo[] {
  const popularIds = [
    'America/New_York',
    'America/Los_Angeles',
    'Europe/London',
    'Europe/Paris',
    'Asia/Tokyo',
    'Asia/Shanghai',
    'Asia/Dubai',
    'Australia/Sydney',
  ];
  
  return popularIds.map(tzId => {
    const { city, region } = parseTimezone(tzId);
    return {
      id: tzId,
      city,
      region,
      country: getCountryForTimezone(tzId),
      offset: getTimezoneOffset(tzId),
      currentTime: getTimeInTimezone(tzId),
      flag: getFlagForTimezone(tzId),
    };
  });
}

export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  city?: string;
  country?: string;
  timezone?: string;
}

export async function detectRealLocation(): Promise<GeoLocation | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Get timezone and location details from coordinates
        const locationData = await reverseGeocodeLocation(latitude, longitude);
        
        resolve({
          latitude,
          longitude,
          ...locationData,
        });
      },
      () => {
        // Geolocation denied or failed
        resolve(null);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // Cache for 5 minutes
      }
    );
  });
}

async function reverseGeocodeLocation(lat: number, lng: number): Promise<{ city?: string; country?: string; timezone?: string }> {
  try {
    // Use OpenStreetMap Nominatim for reverse geocoding (free, no API key needed)
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=10`,
      {
        headers: {
          'Accept-Language': 'en',
          'User-Agent': 'StartupFactoryHub/1.0',
        },
      }
    );
    
    if (!response.ok) {
      return getTimezoneFromCoordinates(lat, lng);
    }
    
    const data = await response.json();
    const address = data.address || {};
    
    const city = address.city || address.town || address.village || address.municipality || address.county;
    const country = address.country;
    
    // Find matching timezone from our known timezones
    const timezone = findTimezoneForLocation(city, country, lat, lng);
    
    return { city, country, timezone };
  } catch {
    return getTimezoneFromCoordinates(lat, lng);
  }
}

function getTimezoneFromCoordinates(lat: number, lng: number): { timezone?: string } {
  // Approximate timezone from longitude
  // Each 15° of longitude ≈ 1 hour offset from UTC
  const offsetHours = Math.round(lng / 15);
  
  // Find a timezone that matches this offset
  const allTimezones = getAllTimezones();
  const now = new Date();
  
  for (const tzId of allTimezones) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: tzId,
        timeZoneName: 'shortOffset',
      });
      const parts = formatter.formatToParts(now);
      const offsetPart = parts.find(p => p.type === 'timeZoneName');
      if (offsetPart) {
        const match = offsetPart.value.match(/GMT([+-]?\d+)?/);
        if (match) {
          const tzOffset = match[1] ? parseInt(match[1]) : 0;
          if (tzOffset === offsetHours) {
            return { timezone: tzId };
          }
        }
      }
    } catch {
      continue;
    }
  }
  
  return { timezone: getUserTimezone() };
}

function findTimezoneForLocation(city?: string, country?: string, lat?: number, lng?: number): string {
  // Try to find exact match in our regionToCountry mapping
  const allTimezones = getAllTimezones();
  
  if (city) {
    const normalizedCity = city.toLowerCase().replace(/\s+/g, '_');
    for (const tzId of allTimezones) {
      if (tzId.toLowerCase().includes(normalizedCity)) {
        return tzId;
      }
    }
  }
  
  // Try country match
  if (country) {
    for (const [tzId, tzCountry] of Object.entries(regionToCountry)) {
      if (tzCountry.toLowerCase() === country.toLowerCase()) {
        return tzId;
      }
    }
  }
  
  // Fallback to coordinate-based
  if (lat !== undefined && lng !== undefined) {
    return getTimezoneFromCoordinates(lat, lng).timezone || getUserTimezone();
  }
  
  return getUserTimezone();
}

export function getCachedLocation(): GeoLocation | null {
  try {
    const cached = localStorage.getItem('globalClock_location');
    if (cached) {
      const data = JSON.parse(cached);
      // Check if cache is less than 1 hour old
      if (Date.now() - data.timestamp < 3600000) {
        return data.location;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

export function setCachedLocation(location: GeoLocation): void {
  try {
    localStorage.setItem('globalClock_location', JSON.stringify({
      location,
      timestamp: Date.now(),
    }));
  } catch {
    // Ignore storage errors
  }
}
