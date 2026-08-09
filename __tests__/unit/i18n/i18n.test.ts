import i18n from '../../../src/i18n';

describe('i18n Configuration (PF-168)', () => {
  beforeEach(async () => {
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
});
