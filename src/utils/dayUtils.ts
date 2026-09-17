export const DAYS_OF_WEEK = [
    'Lunes',
    'Martes',
    'Miércoles',
    'Jueves',
    'Viernes',
    'Sábado',
    'Domingo',
] as const;

export const DAYS_OF_WEEK_EN = [
    'Monday',
    'Tuesday',
    'Wednesday',
    'Thursday',
    'Friday',
    'Saturday',
    'Sunday',
] as const;

export const DAYS_OF_WEEK_KEYS = [
    'monday',
    'tuesday',
    'wednesday',
    'thursday',
    'friday',
    'saturday',
    'sunday',
] as const;

export type DayOfWeekKey = typeof DAYS_OF_WEEK_KEYS[number];

export const DAY_NAME_TO_KEY: Record<string, DayOfWeekKey> = {
    lunes: 'monday',
    martes: 'tuesday',
    miércoles: 'wednesday',
    miercoles: 'wednesday',
    jueves: 'thursday',
    viernes: 'friday',
    sábado: 'saturday',
    sabado: 'saturday',
    domingo: 'sunday',
    monday: 'monday',
    tuesday: 'tuesday',
    wednesday: 'wednesday',
    thursday: 'thursday',
    friday: 'friday',
    saturday: 'saturday',
    sunday: 'sunday',
};

export const ES_TO_EN_DAYS: Record<string, string> = {
    'Lunes': 'Monday',
    'Martes': 'Tuesday',
    'Miércoles': 'Wednesday',
    'Miercoles': 'Wednesday',
    'Jueves': 'Thursday',
    'Viernes': 'Friday',
    'Sábado': 'Saturday',
    'Sabado': 'Saturday',
    'Domingo': 'Sunday',
};

export const EN_TO_ES_DAYS: Record<string, string> = {
    'Monday': 'Lunes',
    'Tuesday': 'Martes',
    'Wednesday': 'Miércoles',
    'Thursday': 'Jueves',
    'Friday': 'Viernes',
    'Saturday': 'Sábado',
    'Sunday': 'Domingo',
};

export const getDaysOfWeek = (locale: string = 'es'): readonly string[] => {
    return locale?.toLowerCase().startsWith('en') ? DAYS_OF_WEEK_EN : DAYS_OF_WEEK;
};

export const getEquivalentDayName = (dayName: string): string => {
    if (!dayName) return dayName;
    const normalized = dayName.trim();
    if (ES_TO_EN_DAYS[normalized]) return ES_TO_EN_DAYS[normalized];
    if (EN_TO_ES_DAYS[normalized]) return EN_TO_ES_DAYS[normalized];
    const key = DAY_NAME_TO_KEY[normalized.toLowerCase()];
    if (key) {
        const index = DAYS_OF_WEEK_KEYS.indexOf(key);
        if (index >= 0) return DAYS_OF_WEEK[index];
    }
    return dayName;
};

export const isSameDayName = (dayA: string, dayB: string): boolean => {
    if (!dayA || !dayB) return false;
    const normA = dayA.trim().toLowerCase();
    const normB = dayB.trim().toLowerCase();
    if (normA === normB) return true;
    const keyA = DAY_NAME_TO_KEY[normA];
    const keyB = DAY_NAME_TO_KEY[normB];
    return !!keyA && keyA === keyB;
};

export const getTranslatedDayName = (
    dayName: string,
    t?: (key: string, options?: any) => string
): string => {
    if (!dayName) return dayName;
    const key = DAY_NAME_TO_KEY[dayName.trim().toLowerCase()];
    if (key && t) {
        return t(`days.${key}`, { defaultValue: dayName });
    }
    return dayName;
};
