import { useCallback, useEffect, useRef, useState } from 'react';
import { AppState, Linking } from 'react-native';
import * as Location from 'expo-location';

export type Coords = { latitude: number; longitude: number };
type Status = 'loading' | 'granted' | 'denied';

async function readPosition(): Promise<Coords | null> {
  try {
    const { coords } = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });
    return { latitude: coords.latitude, longitude: coords.longitude };
  } catch {
    return null;
  }
}

export function useUserLocation() {
  const [status, setStatus] = useState<Status>('loading');
  const [coords, setCoords] = useState<Coords | null>(null);
  const grantedRef = useRef(false);

  const apply = useCallback(async (granted: boolean) => {
    grantedRef.current = granted;
    setStatus(granted ? 'granted' : 'denied');
    if (granted) setCoords(await readPosition());
  }, []);

  const check = useCallback(async () => {
    let permission = await Location.getForegroundPermissionsAsync();
    if (!permission.granted && permission.canAskAgain) {
      permission = await Location.requestForegroundPermissionsAsync();
    }
    await apply(permission.granted);
  }, [apply]);

  const enable = useCallback(async () => {
    const permission = await Location.getForegroundPermissionsAsync();
    if (permission.canAskAgain) {
      await check();
    } else {
      await Linking.openSettings();
    }
  }, [check]);

  const refresh = useCallback(async () => {
    const next = await readPosition();
    if (next) setCoords(next);
  }, []);

  useEffect(() => {
    check();
  }, [check]);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (state) => {
      if (state !== 'active' || grantedRef.current) return;
      const permission = await Location.getForegroundPermissionsAsync();
      if (permission.granted) await apply(true);
    });
    return () => subscription.remove();
  }, [apply]);

  return { status, coords, enable, refresh };
}