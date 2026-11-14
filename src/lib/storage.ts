import AsyncStorage from '@react-native-async-storage/async-storage';
import type { LanguagePref } from '@/i18n';

export type ThemeMode = 'dark' | 'light' | 'system';

export type StoredValues = {
  theme: ThemeMode;
  language: LanguagePref;
  classCode: string | null;
  notifications: boolean;
  metric: boolean;
  haptics: boolean;
};

export const defaults: StoredValues = {
  theme: 'dark',
  language: 'system',
  classCode: null,
  notifications: true,
  metric: true,
  haptics: true,
};

const PREFIX = 'wego:';
const keys = Object.keys(defaults) as (keyof StoredValues)[];

export async function loadAll(): Promise<StoredValues> {
  const result: Record<string, unknown> = { ...defaults };
  try {
    const pairs = await AsyncStorage.multiGet(keys.map((key) => PREFIX + key));
    pairs.forEach(([, raw], index) => {
      if (raw === null) return;
      try {
        result[keys[index]] = JSON.parse(raw);
      } catch {}
    });
  } catch {}
  return result as StoredValues;
}

export async function setItem<K extends keyof StoredValues>(
  key: K,
  value: StoredValues[K],
): Promise<void> {
  try {
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {}
}

export async function removeItem(key: keyof StoredValues): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {}
}