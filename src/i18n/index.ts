import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { de } from './de';
import { en } from './en';

export const LANGUAGES = [
  { label: 'English', value: 'en' },
  { label: 'Deutsch', value: 'de' },
] as const;

export type Language = (typeof LANGUAGES)[number]['value'];
export type LanguagePref = Language | 'system';

export function detectLanguage(): Language {
  const code = getLocales()[0]?.languageCode;
  return code === 'de' ? 'de' : 'en';
}

export function resolveLanguage(pref: LanguagePref): Language {
  return pref === 'system' ? detectLanguage() : pref;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    de: { translation: de },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
  compatibilityJSON: 'v4',
});

export default i18n;