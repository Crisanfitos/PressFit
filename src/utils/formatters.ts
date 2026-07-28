/**
 * Central Formatting and Calculation Utilities for PressFit
 */

/**
 * Formats a weight value with unit label.
 * Example: formatWeight(75.5) => '75.5 kg', formatWeight(null) => '-'
 */
export const formatWeight = (
  weight: number | null | undefined,
  unit: string = 'kg'
): string => {
  if (weight === null || weight === undefined || isNaN(weight)) {
    return '-';
  }
  return `${weight} ${unit}`;
};

/**
 * Formats training volume with thousands separators and unit label.
 * Example: formatVolume(1250) => '1,250 kg'
 */
export const formatVolume = (
  volume: number | null | undefined,
  unit: string = 'kg'
): string => {
  if (volume === null || volume === undefined || isNaN(volume) || volume < 0) {
    return `0 ${unit}`;
  }
  const formatted = Math.round(volume).toLocaleString('es-ES');
  return `${formatted} ${unit}`;
};

/**
 * Calculates Body Mass Index (BMI / IMC).
 * Formula: weight (kg) / (height (m) ^ 2)
 * Returns rounded to 1 decimal place or null if invalid inputs.
 */
export const calculateBMI = (
  weightKg: number | null | undefined,
  heightCm: number | null | undefined
): number | null => {
  if (!weightKg || !heightCm || weightKg <= 0 || heightCm <= 0) {
    return null;
  }
  const heightM = heightCm / 100;
  const bmi = weightKg / (heightM * heightM);
  return Number(bmi.toFixed(1));
};

/**
 * Formats BMI value as display string.
 * Example: formatBMI(24.5) => '24.5'
 */
export const formatBMI = (bmi: number | null | undefined): string => {
  if (bmi === null || bmi === undefined || isNaN(bmi) || bmi <= 0) {
    return 'N/A';
  }
  return bmi.toFixed(1);
};

/**
 * Returns WHO classification for a BMI score in Spanish.
 */
export const getBMICategory = (bmi: number | null | undefined): string => {
  if (bmi === null || bmi === undefined || isNaN(bmi) || bmi <= 0) {
    return 'Desconocido';
  }
  if (bmi < 18.5) return 'Bajo peso';
  if (bmi < 25.0) return 'Normal';
  if (bmi < 30.0) return 'Sobrepeso';
  return 'Obesidad';
};

/**
 * Estimates or returns body fat percentage based on BMI formula or recorded value.
 */
export const calculateBodyFat = (
  weightKg: number | null | undefined,
  heightCm: number | null | undefined,
  recordedBodyFat?: number | null
): string | null => {
  if (recordedBodyFat !== undefined && recordedBodyFat !== null) {
    return recordedBodyFat.toString();
  }
  const bmi = calculateBMI(weightKg, heightCm);
  if (bmi === null) return null;
  return (1.2 * bmi - 10.45).toFixed(1);
};
