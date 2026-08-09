import i18n, { saveLanguagePreference, loadStoredLanguage, LANGUAGE_STORAGE_KEY } from '../../../src/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

describe('i18n Configuration & Persistence (PF-168 & PF-170)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    await i18n.changeLanguage('es');
  });

  it('should translate Spanish keys correctly by default', () => {
    expect(i18n.t('common.appName')).toBe('PressFit');
    expect(i18n.t('common.save')).toBe('Guardar');
    expect(i18n.t('auth.login')).toBe('Iniciar Sesión');
    expect(i18n.t('navigation.calendar')).toBe('Calendario');
    expect(i18n.t('workout.startWorkout')).toBe('Iniciar Entrenamiento');
  });

  it('should switch to English and translate keys correctly', async () => {
    await i18n.changeLanguage('en');
    expect(i18n.t('common.appName')).toBe('PressFit');
    expect(i18n.t('common.save')).toBe('Save');
    expect(i18n.t('auth.login')).toBe('Log In');
    expect(i18n.t('navigation.calendar')).toBe('Calendar');
    expect(i18n.t('workout.startWorkout')).toBe('Start Workout');
  });

  it('should fallback to Spanish for missing keys or unsupported language', async () => {
    await i18n.changeLanguage('fr');
    expect(i18n.t('common.save')).toBe('Guardar');
  });

  it('should save language preference to AsyncStorage and change language', async () => {
    await saveLanguagePreference('en');
    expect(i18n.language).toBe('en');
    const stored = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    expect(stored).toBe('en');
  });

  it('should load stored language from AsyncStorage on startup', async () => {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, 'en');
    const lang = await loadStoredLanguage();
    expect(lang).toBe('en');
    expect(i18n.language).toBe('en');
  });
});
