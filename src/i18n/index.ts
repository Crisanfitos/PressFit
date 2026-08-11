import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { NativeModules, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import es from './locales/es.json';
import en from './locales/en.json';

export const LANGUAGE_STORAGE_KEY = '@pressfit_language';

const resources = {
  es: { translation: es },
  en: { translation: en },
};

/**
 * Pure JS detection of device language without native binary modules (Expo Go compatible)
 */
export function getDeviceLanguage(): string {
  try {
    let locale: string | undefined;

    if (Platform.OS === 'ios') {
      const settings = NativeModules.SettingsManager?.settings;
      locale = settings?.AppleLocale || settings?.AppleLanguages?.[0];
    } else {
      locale = NativeModules.I18nManager?.localeIdentifier;
    }

    if (!locale && typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
      locale = Intl.DateTimeFormat().resolvedOptions().locale;
    }

    if (locale && typeof locale === 'string') {
      const code = locale.toLowerCase().split('-')[0].split('_')[0];
      if (code === 'en') return 'en';
    }
  } catch {
    // Fallback on device localization read error
  }
  return 'es';
}

export async function loadStoredLanguage(): Promise<string> {
  try {
    const storedLang = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (storedLang === 'es' || storedLang === 'en') {
      await i18n.changeLanguage(storedLang);
      return storedLang;
    }
  } catch {
    // Fallback on storage read error
  }
  const defaultLang = 'es';
  await i18n.changeLanguage(defaultLang);
  return defaultLang;
}

export async function saveLanguagePreference(lang: 'es' | 'en'): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    await i18n.changeLanguage(lang);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'es',
    fallbackLng: 'es',
    interpolation: {
      escapeValue: false,
    },
    compatibilityJSON: 'v4',
  });

loadStoredLanguage();

export default i18n;
