/**
 * PressFit - Plate Calculator Engine (PF-319)
 *
 * Módulo de funciones puras para calcular la distribución óptima y simétrica
 * de discos en una barra de levantamiento utilizando un algoritmo voraz (greedy).
 */

export type WeightUnit = 'kg' | 'lb';

export interface PlateItem {
  weight: number;
  count: number; // Cantidad de discos por lado
  color: string;
}

export interface PlateInventoryItem {
  weight: number;
  availablePairs?: number; // Pares disponibles (1 par = 1 disco a cada lado). Indefinido = ilimitado.
  color?: string;
}

export interface PlateCalculationOptions {
  targetWeight: number;
  barWeight?: number;
  unit?: WeightUnit;
  availablePlates?: (number | PlateInventoryItem)[];
}

export type PlateCalculationWarning =
  | 'TARGET_BELOW_BAR'
  | 'INSUFFICIENT_PLATES'
  | 'FRACTIONAL_REMAINDER';

export interface PlateCalculationResult {
  targetWeight: number;
  barWeight: number;
  unit: WeightUnit;
  platesPerSide: PlateItem[]; // Discos ordenados de mayor a menor peso
  flatPlatesPerSide: number[]; // Array plano por lado ej: [20, 10, 2.5]
  weightPerSide: number; // Peso total cargado en un solo lado
  totalPlateWeight: number; // Peso total de todos los discos (2 * weightPerSide)
  totalWeight: number; // barWeight + totalPlateWeight
  remainder: number; // targetWeight - totalWeight (0 si es exacto)
  isExact: boolean;
  summary: string; // Resumen textual legible ej: "Por lado: 1x20kg, 1x10kg"
  warning: PlateCalculationWarning | null;
}

/**
 * Paleta de colores estándar (IPF / Competición / Gimnasios comerciales)
 */
export const PLATE_COLORS_KG: Record<number, string> = {
  25: '#EF4444', // Rojo
  20: '#3B82F6', // Azul
  15: '#EAB308', // Amarillo
  10: '#22C55E', // Verde
  5: '#F3F4F6', // Blanco
  2.5: '#1F2937', // Negro
  1.25: '#9CA3AF', // Gris / Plata
  0.5: '#10B981', // Verde fraccional
  0.25: '#60A5FA', // Azul fraccional
};

export const PLATE_COLORS_LB: Record<number, string> = {
  55: '#EF4444', // Rojo
  45: '#3B82F6', // Azul
  35: '#EAB308', // Amarillo
  25: '#22C55E', // Verde
  10: '#1F2937', // Negro
  5: '#F3F4F6', // Blanco
  2.5: '#9CA3AF', // Gris / Plata
  1.25: '#10B981', // Verde fraccional
};

/**
 * Denominaciones por defecto para inventario estándar
 */
export const DEFAULT_PLATES_KG: PlateInventoryItem[] = [
  { weight: 25, color: PLATE_COLORS_KG[25] },
  { weight: 20, color: PLATE_COLORS_KG[20] },
  { weight: 15, color: PLATE_COLORS_KG[15] },
  { weight: 10, color: PLATE_COLORS_KG[10] },
  { weight: 5, color: PLATE_COLORS_KG[5] },
  { weight: 2.5, color: PLATE_COLORS_KG[2.5] },
  { weight: 1.25, color: PLATE_COLORS_KG[1.25] },
];

export const DEFAULT_PLATES_LB: PlateInventoryItem[] = [
  { weight: 45, color: PLATE_COLORS_LB[45] },
  { weight: 35, color: PLATE_COLORS_LB[35] },
  { weight: 25, color: PLATE_COLORS_LB[25] },
  { weight: 10, color: PLATE_COLORS_LB[10] },
  { weight: 5, color: PLATE_COLORS_LB[5] },
  { weight: 2.5, color: PLATE_COLORS_LB[2.5] },
  { weight: 1.25, color: PLATE_COLORS_LB[1.25] },
];

export const DEFAULT_BAR_WEIGHT_KG = 20;
export const DEFAULT_BAR_WEIGHT_LB = 45;

const EPSILON = 1e-4;

/**
 * Retorna el color oficial o representativo para un disco dado su peso y unidad.
 */
export function getPlateColor(weight: number, unit: WeightUnit = 'kg'): string {
  const table = unit === 'kg' ? PLATE_COLORS_KG : PLATE_COLORS_LB;
  if (table[weight]) {
    return table[weight];
  }
  // Color neutro de reserva para denominaciones no reglamentarias o personalizadas
  return '#6B7280';
}

/**
 * Obtiene el inventario de discos por defecto según la unidad especificada.
 */
export function getDefaultPlates(unit: WeightUnit = 'kg'): PlateInventoryItem[] {
  return unit === 'kg' ? [...DEFAULT_PLATES_KG] : [...DEFAULT_PLATES_LB];
}

/**
 * Genera una cadena legible con el resumen de discos por lado.
 */
export function formatPlateSummary(
  platesPerSide: PlateItem[],
  unit: WeightUnit = 'kg',
  barWeight?: number
): string {
  if (!platesPerSide || platesPerSide.length === 0) {
    return barWeight !== undefined
      ? `Solo barra (${barWeight} ${unit})`
      : 'Sin discos';
  }

  const parts = platesPerSide.map(
    (item) => `${item.count}x${item.weight}${unit}`
  );
  return `Por lado: ${parts.join(', ')}`;
}

/**
 * Redondeo defensivo a 2 decimales para evitar imprecisiones de punto flotante IEEE 754.
 */
function roundTwoDecimals(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

/**
 * Algoritmo voraz (greedy) para calcular la distribución óptima y simétrica de discos.
 */
export function calculatePlates(
  options: PlateCalculationOptions
): PlateCalculationResult {
  const {
    targetWeight,
    unit = 'kg',
    availablePlates,
  } = options;

  const defaultBar = unit === 'kg' ? DEFAULT_BAR_WEIGHT_KG : DEFAULT_BAR_WEIGHT_LB;
  const barWeight = typeof options.barWeight === 'number' && !isNaN(options.barWeight)
    ? options.barWeight
    : defaultBar;

  // Caso: Peso objetivo nulo o negativo
  if (typeof targetWeight !== 'number' || isNaN(targetWeight) || targetWeight <= 0) {
    return {
      targetWeight: targetWeight || 0,
      barWeight,
      unit,
      platesPerSide: [],
      flatPlatesPerSide: [],
      weightPerSide: 0,
      totalPlateWeight: 0,
      totalWeight: 0,
      remainder: 0,
      isExact: true,
      summary: `0 ${unit}`,
      warning: null,
    };
  }

  // Caso: Peso objetivo menor que la barra
  if (targetWeight < barWeight - EPSILON) {
    const diff = roundTwoDecimals(targetWeight - barWeight);
    return {
      targetWeight,
      barWeight,
      unit,
      platesPerSide: [],
      flatPlatesPerSide: [],
      weightPerSide: 0,
      totalPlateWeight: 0,
      totalWeight: barWeight,
      remainder: diff,
      isExact: false,
      summary: `Solo barra (${barWeight} ${unit})`,
      warning: 'TARGET_BELOW_BAR',
    };
  }

  // Caso: Peso objetivo igual al peso de la barra
  if (Math.abs(targetWeight - barWeight) <= EPSILON) {
    return {
      targetWeight,
      barWeight,
      unit,
      platesPerSide: [],
      flatPlatesPerSide: [],
      weightPerSide: 0,
      totalPlateWeight: 0,
      totalWeight: barWeight,
      remainder: 0,
      isExact: true,
      summary: `Solo barra (${barWeight} ${unit})`,
      warning: null,
    };
  }

  // Normalizar y preparar inventario de discos disponibles
  const rawPlates = availablePlates && availablePlates.length > 0
    ? availablePlates
    : getDefaultPlates(unit);

  const inventory: PlateInventoryItem[] = rawPlates
    .map((item) => {
      if (typeof item === 'number') {
        return {
          weight: item,
          availablePairs: undefined,
          color: getPlateColor(item, unit),
        };
      }
      return {
        weight: item.weight,
        availablePairs: item.availablePairs,
        color: item.color || getPlateColor(item.weight, unit),
      };
    })
    .filter((item) => item.weight > 0)
    // Ordenar de mayor a menor denominación
    .sort((a, b) => b.weight - a.weight);

  // El peso a cargar en cada extremo de la barra es la mitad del excedente
  let remainingPerSide = (targetWeight - barWeight) / 2;

  const platesPerSide: PlateItem[] = [];
  const flatPlatesPerSide: number[] = [];
  let hadConstrainedInventoryExhaustion = false;

  for (const plate of inventory) {
    if (remainingPerSide < EPSILON) {
      break;
    }

    if (plate.weight <= remainingPerSide + EPSILON) {
      const maxPossible = Math.floor((remainingPerSide + EPSILON) / plate.weight);
      const limit = typeof plate.availablePairs === 'number'
        ? plate.availablePairs
        : Infinity;

      const pairsToUse = Math.min(maxPossible, limit);

      if (pairsToUse > 0) {
        platesPerSide.push({
          weight: plate.weight,
          count: pairsToUse,
          color: plate.color || getPlateColor(plate.weight, unit),
        });

        for (let i = 0; i < pairsToUse; i++) {
          flatPlatesPerSide.push(plate.weight);
        }

        remainingPerSide = roundTwoDecimals(remainingPerSide - pairsToUse * plate.weight);

        if (maxPossible > pairsToUse) {
          hadConstrainedInventoryExhaustion = true;
        }
      } else if (limit === 0 && maxPossible > 0) {
        hadConstrainedInventoryExhaustion = true;
      }
    }
  }

  const weightPerSide = roundTwoDecimals(
    flatPlatesPerSide.reduce((acc, curr) => acc + curr, 0)
  );
  const totalPlateWeight = roundTwoDecimals(weightPerSide * 2);
  const totalWeight = roundTwoDecimals(barWeight + totalPlateWeight);
  const remainder = roundTwoDecimals(targetWeight - totalWeight);
  const isExact = Math.abs(remainder) <= EPSILON;

  let warning: PlateCalculationWarning | null = null;
  if (!isExact) {
    warning = hadConstrainedInventoryExhaustion
      ? 'INSUFFICIENT_PLATES'
      : 'FRACTIONAL_REMAINDER';
  }

  return {
    targetWeight,
    barWeight,
    unit,
    platesPerSide,
    flatPlatesPerSide,
    weightPerSide,
    totalPlateWeight,
    totalWeight,
    remainder,
    isExact,
    summary: formatPlateSummary(platesPerSide, unit, barWeight),
    warning,
  };
}
