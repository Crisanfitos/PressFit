const pad2 = (n: number) => String(n).padStart(2, '0');

export const formatLocalDateKey = (date: Date): string =>
  `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;

export const parseDateKeyAsLocalDate = (dateKey: string): Date => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getStartOfWeek = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getEndOfWeek = (date: Date): Date => {
  const d = getStartOfWeek(date);
  d.setDate(d.getDate() + 6);
  d.setHours(23, 59, 59, 999);
  return d;
};

export const formatTime = (totalSeconds: number): string => {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds || 0));
  const mins = Math.floor(safeSeconds / 60);
  const secs = safeSeconds % 60;
  return `${pad2(mins)}:${pad2(secs)}`;
};

export const formatDuration = (minutes: number | null | undefined): string => {
  if (minutes === null || minutes === undefined || isNaN(minutes) || minutes < 0) {
    return '00:00';
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.floor(minutes % 60);
  return `${pad2(hours)}:${pad2(mins)}`;
};

export const isDateOlderThanDays = (date: Date | string, daysThreshold: number, referenceDate: Date = new Date()): boolean => {
  const targetDate = typeof date === 'string' ? parseDateKeyAsLocalDate(date) : new Date(date);
  if (isNaN(targetDate.getTime())) return false;
  const diffMs = referenceDate.getTime() - targetDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > daysThreshold;
};