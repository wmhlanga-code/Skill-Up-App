import { useEffect, useState, useCallback } from 'react';
import { useStore } from '../store/useStore';
import { requestAndGetLocation, reverseGeocode } from '../lib/location';

export function useLocation() {
  const { coordinates, locationName, setCoordinates, setLocationName } =
    useStore();
  const [loading, setLoading] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);

  const refresh = useCallback(async () => {
    setLoading(true);
    setLocationName('Getting location…');
    const coords = await requestAndGetLocation();
    if (coords) {
      setCoordinates(coords);
      setPermissionDenied(false);
      const name = await reverseGeocode(coords);
      setLocationName(name);
    } else {
      setPermissionDenied(true);
      setLocationName('Location unavailable');
    }
    setLoading(false);
  }, []);

  // Fetch location on first mount if not already set
  useEffect(() => {
    if (!coordinates) {
      refresh();
    }
  }, []);

  return { coordinates, locationName, loading, permissionDenied, refresh };
}
