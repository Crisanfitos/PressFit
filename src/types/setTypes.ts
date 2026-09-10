/**
 * Shared types for weight and set type configurations.
 */

// --- Weight Types ---

export type TipoPeso = 'total' | 'por_lado' | 'corporal';

export const TIPO_PESO_LABELS: Record<TipoPeso, string> = {
  total: 'Peso Total',
  por_lado: 'Por Lado',
  corporal: 'Peso Corporal',
};

export const TIPO_PESO_SHORT_LABELS: Record<TipoPeso, string> = {
  total: 'KG',
  por_lado: 'KG/lado',
  corporal: 'BW',
};

export const TIPO_PESO_ICONS: Record<TipoPeso, string> = {
  total: 'fitness-center',
  por_lado: 'sync-alt',
  corporal: 'accessibility-new',
};

// --- Set Types (PF-313) ---

export type SetType = 'normal' | 'warmup' | 'feeder' | 'failure' | 'drop';

export const SET_TYPES: readonly SetType[] = [
  'normal',
  'warmup',
  'feeder',
  'failure',
  'drop',
] as const;

export const SET_TYPE_LABELS: Record<SetType, string> = {
  normal: 'Normal',
  warmup: 'Calentamiento',
  feeder: 'Aproximación',
  failure: 'Fallo',
  drop: 'Drop Set',
};

export const SET_TYPE_SHORT_LABELS: Record<SetType, string> = {
  normal: 'N',
  warmup: 'W',
  feeder: 'A',
  failure: 'F',
  drop: 'D',
};

export const SET_TYPE_CODES: Record<SetType, string> = SET_TYPE_SHORT_LABELS;

export interface SetTypeVisualConfig {
  badgeBg: string;
  badgeText: string;
  border: string;
  accent: string;
  label: string;
  shortLabel: string;
}

export const SET_TYPE_COLORS: Record<SetType, SetTypeVisualConfig> = {
  normal: {
    badgeBg: 'rgba(113, 113, 122, 0.25)',
    badgeText: '#e4e4e7',
    border: '#52525b',
    accent: '#71717a',
    label: 'Normal',
    shortLabel: 'N',
  },
  warmup: {
    badgeBg: 'rgba(245, 158, 11, 0.25)',
    badgeText: '#fbbf24',
    border: '#f59e0b',
    accent: '#d97706',
    label: 'Calentamiento',
    shortLabel: 'W',
  },
  feeder: {
    badgeBg: 'rgba(59, 130, 246, 0.25)',
    badgeText: '#60a5fa',
    border: '#3b82f6',
    accent: '#2563eb',
    label: 'Aproximación',
    shortLabel: 'A',
  },
  failure: {
    badgeBg: 'rgba(239, 68, 68, 0.25)',
    badgeText: '#f87171',
    border: '#ef4444',
    accent: '#dc2626',
    label: 'Fallo',
    shortLabel: 'F',
  },
  drop: {
    badgeBg: 'rgba(168, 85, 247, 0.25)',
    badgeText: '#c084fc',
    border: '#a855f7',
    accent: '#9333ea',
    label: 'Drop Set',
    shortLabel: 'D',
  },
};

export const SET_TYPE_DESCRIPTIONS: Record<SetType, string> = {
  normal: 'Serie estándar de trabajo efectivo',
  warmup: 'Serie preparatoria sin fatiga acumulada',
  feeder: 'Serie de aproximación al peso de trabajo',
  failure: 'Serie llevada al fallo muscular técnico (RIR 0)',
  drop: 'Descarga de peso inmediata tras el fallo',
};

/**
 * Determina de forma tipada si un valor corresponde a un SetType válido.
 */
export function isSetType(value: unknown): value is SetType {
  return typeof value === 'string' && SET_TYPES.includes(value as SetType);
}
