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
