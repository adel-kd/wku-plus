import * as Location from 'expo-location';
import { useEffect, useRef, useState } from 'react';
import { CAMPUS_CENTER, LatLng } from './geo';

interface State {
  coords: LatLng | null;
  granted: boolean | null; // null = not asked yet
  error: string | null;
}

/** Live GPS position, falling back to the campus center when permission is denied. */
export function useLocation(watch = true) {
  const [state, setState] = useState<State>({ coords: null, granted: null, error: null });
  const sub = useRef<Location.LocationSubscription | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;
      if (status !== 'granted') {
        setState({ coords: CAMPUS_CENTER, granted: false, error: null });
        return;
      }
      try {
        const last = await Location.getLastKnownPositionAsync();
        if (last && !cancelled) {
          setState({ coords: { lat: last.coords.latitude, lng: last.coords.longitude }, granted: true, error: null });
        }
        const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (!cancelled) {
          setState({ coords: { lat: pos.coords.latitude, lng: pos.coords.longitude }, granted: true, error: null });
        }
        if (watch) {
          sub.current = await Location.watchPositionAsync(
            { accuracy: Location.Accuracy.Balanced, timeInterval: 4000, distanceInterval: 8 },
            (p) => {
              if (!cancelled) setState({ coords: { lat: p.coords.latitude, lng: p.coords.longitude }, granted: true, error: null });
            },
          );
        }
      } catch (e: any) {
        if (!cancelled) setState({ coords: CAMPUS_CENTER, granted: true, error: e?.message ?? 'Could not get location' });
      }
    })();
    return () => {
      cancelled = true;
      sub.current?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  return state;
}
