import { formatLocalDateKey } from '../../utils/dateUtils';
import { CalendarDay, DayStyleInfo } from './calendarTypes';

export const getMonthNames = (lang: string = 'es'): string[] => {
    const isEn = lang.startsWith('en');
    return isEn
        ? [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
          ]
        : [
              'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
              'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
          ];
};

export const getWeekDays = (lang: string = 'es'): string[] => {
    const isEn = lang.startsWith('en');
    return isEn ? ['M', 'T', 'W', 'T', 'F', 'S', 'S'] : ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
};

export const getCalendarDays = (year: number, month: number): CalendarDay[] => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startingDayOfWeek = (firstDayOfMonth.getDay() + 6) % 7; // Monday = 0
    const daysInMonth = lastDayOfMonth.getDate();

    const days: CalendarDay[] = [];

    // Add empty slots for days before the first of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
        days.push({ date: null, dayNumber: null });
    }

    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
        days.push({ date: new Date(year, month, day), dayNumber: day });
    }

    return days;
};

export const isInCurrentWeek = (date: Date): boolean => {
    const now = new Date();
    const startOfWeek = new Date(now);
    const day = startOfWeek.getDay();
    const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
    startOfWeek.setDate(diff);
    startOfWeek.setHours(0, 0, 0, 0);

    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    endOfWeek.setHours(23, 59, 59, 999);

    return date >= startOfWeek && date <= endOfWeek;
};

export const calculateDayStyle = (
    date: Date | null,
    completedDays: Set<string>,
    inProgressDays: Set<string>,
    checkInCurrentWeek: (d: Date) => boolean = isInCurrentWeek
): DayStyleInfo | null => {
    if (!date) return null;

    const dateStr = formatLocalDateKey(date);
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const dateNorm = new Date(date);
    dateNorm.setHours(0, 0, 0, 0);

    const isToday = dateNorm.getTime() === now.getTime();
    const isPast = dateNorm < now;
    const isFuture = dateNorm > now;
    const inCurrentWeek = checkInCurrentWeek(date);
    const isCompleted = completedDays.has(dateStr);
    const isInProgress = inProgressDays.has(dateStr);

    return {
        isToday,
        isPast,
        isFuture,
        inCurrentWeek,
        isCompleted,
        isInProgress,
    };
};
