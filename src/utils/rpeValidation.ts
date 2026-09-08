/**
 * RPE (Rating of Perceived Exertion) Validation Utility
 *
 * Requirements (PF-309):
 * 1. Optional field: empty, null, undefined or blank inputs are valid and resolve to null.
 * 2. Range: numeric values must be between 1 (minimum) and 10 (maximum).
 * 3. Decimal precision: supports single-decimal precision (e.g., 7.5, 8.5) or integer values.
 * 4. Clamping: inputs exceeding bounds (< 1 or > 10) are clamped to 1 or 10 respectively,
 *    flagged with `clamped: true` so the UI can provide warning feedback.
 */

export interface RpeValidationResult {
    isValid: boolean;
    value: number | null;
    clamped: boolean;
    error?: string;
}

export function validateRpe(value: any): RpeValidationResult {
    if (value === '' || value === null || value === undefined) {
        return { isValid: true, value: null, clamped: false };
    }

    const str = String(value).trim().replace(',', '.');
    if (str === '') {
        return { isValid: true, value: null, clamped: false };
    }

    const num = parseFloat(str);
    if (isNaN(num)) {
        return {
            isValid: false,
            value: null,
            clamped: false,
            error: 'El RPE debe ser un valor numérico.',
        };
    }

    if (num < 1) {
        return {
            isValid: false,
            value: 1,
            clamped: true,
            error: 'El RPE mínimo permitido es 1.',
        };
    }

    if (num > 10) {
        return {
            isValid: false,
            value: 10,
            clamped: true,
            error: 'El RPE máximo permitido es 10.',
        };
    }

    const rounded = Math.round(num * 10) / 10;
    return {
        isValid: true,
        value: rounded,
        clamped: false,
    };
}
