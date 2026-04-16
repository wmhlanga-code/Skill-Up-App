import * as Location from 'expo-location';
import type { Coordinates } from '../types';

/**
 * Request foreground location permission and return current coordinates.
 * Returns null if permission denied.
 */
export async function requestAndGetLocation(): Promise<Coordinates | null> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') return null;

  try {
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch {
    return null;
  }
}

/**
 * Reverse-geocode coordinates to a human-readable suburb/city name.
 * Uses Nominatim (OpenStreetMap) — no API key required.
 */
export async function reverseGeocode(coords: Coordinates): Promise<string> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${coords.latitude}&lon=${coords.longitude}` +
      `&format=json&addressdetails=1`;

    const res = await fetch(url, {
      headers: { 'User-Agent': 'SkillUpApp/1.0' },
    });

    if (!res.ok) throw new Error('Geocoding failed');

    const data = await res.json();
    const addr = data.address ?? {};

    // Prefer suburb → neighbourhood → city → town → state
    return (
      addr.suburb ??
      addr.neighbourhood ??
      addr.village ??
      addr.city ??
      addr.town ??
      addr.state ??
      'Your location'
    );
  } catch {
    return 'Your location';
  }
}

/** Format distance nicely: < 1 km → metres, else km */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)}m away`;
  return `${km.toFixed(1)}km away`;
}
