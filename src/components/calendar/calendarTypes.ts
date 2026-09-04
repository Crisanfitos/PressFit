export interface WeeklyRoutine {
    id: string;
    nombre: string;
    activa: boolean;
    [key: string]: any;
}

export interface CalendarDay {
    date: Date | null;
    dayNumber: number | null;
}

export interface DayStyleInfo {
    isToday: boolean;
    isPast: boolean;
    isFuture: boolean;
    inCurrentWeek: boolean;
    isCompleted: boolean;
    isInProgress: boolean;
}
