import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme, View } from 'react-native';
import { darkColors, getTypography, lightColors, type Palette } from '@/constants/theme';
import i18n, { resolveLanguage } from '@/i18n';
import { defaults, loadAll, removeItem, setItem, type StoredValues } from '@/lib/storage';

type Theme = {
  colors: Palette;
  typography: ReturnType<typeof getTypography>;
  isDark: boolean;
};

type SettingsContextValue = {
  settings: StoredValues;
  theme: Theme;
  update: <K extends keyof StoredValues>(key: K, value: StoredValues[K]) => void;
  signOut: () => Promise<void>;
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [settings, setSettings] = useState<StoredValues>(defaults);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    loadAll().then(async (stored) => {
      await i18n.changeLanguage(resolveLanguage(stored.language));
      setSettings(stored);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    if (!ready) return;
    i18n.changeLanguage(resolveLanguage(settings.language));
  }, [ready, settings.language]);

  const update = useCallback(
    <K extends keyof StoredValues>(key: K, value: StoredValues[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      setItem(key, value);
    },
    [],
  );

  const signOut = useCallback(async () => {
    setSettings((prev) => ({ ...prev, classCode: null }));
    await removeItem('classCode');
  }, []);

  const isDark =
    settings.theme === 'system' ? systemScheme !== 'light' : settings.theme === 'dark';

  const theme = useMemo<Theme>(() => {
    const palette = isDark ? darkColors : lightColors;
    return { colors: palette, typography: getTypography(palette), isDark };
  }, [isDark]);

  const value = useMemo(
    () => ({ settings, theme, update, signOut }),
    [settings, theme, update, signOut],
  );

  if (!ready) {
    return <View style={{ flex: 1, backgroundColor: darkColors.background }} />;
  }

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

function useSettingsContext() {
  const context = useContext(SettingsContext);
  if (!context) throw new Error('Settings hooks must be used inside SettingsProvider');
  return context;
}

export function useSettings() {
  const { settings, update, signOut } = useSettingsContext();
  return { settings, update, signOut };
}

export function useTheme() {
  return useSettingsContext().theme;
}