import { validateRpe } from '../../../src/utils/rpeValidation';

describe('validateRpe (PF-309)', () => {
    describe('Optional / Empty values', () => {
        it('returns valid and null when given an empty string', () => {
            const res = validateRpe('');
            expect(res).toEqual({ isValid: true, value: null, clamped: false });
        });

        it('returns valid and null when given null', () => {
            const res = validateRpe(null);
            expect(res).toEqual({ isValid: true, value: null, clamped: false });
        });

        it('returns valid and null when given undefined', () => {
            const res = validateRpe(undefined);
            expect(res).toEqual({ isValid: true, value: null, clamped: false });
        });

        it('returns valid and null when given whitespace string', () => {
            const res = validateRpe('   ');
            expect(res).toEqual({ isValid: true, value: null, clamped: false });
        });
    });

    describe('Valid RPE range [1, 10]', () => {
        it('accepts minimum boundary 1', () => {
            const res = validateRpe('1');
            expect(res).toEqual({ isValid: true, value: 1, clamped: false });
        });

        it('accepts maximum boundary 10', () => {
            const res = validateRpe('10');
            expect(res).toEqual({ isValid: true, value: 10, clamped: false });
        });

        it('accepts intermediate integer values', () => {
            const res = validateRpe('7');
            expect(res).toEqual({ isValid: true, value: 7, clamped: false });
        });

        it('accepts decimal values with dot notation (e.g. 8.5)', () => {
            const res = validateRpe('8.5');
            expect(res).toEqual({ isValid: true, value: 8.5, clamped: false });
        });

        it('accepts decimal values with comma notation (e.g. 7,5)', () => {
            const res = validateRpe('7,5');
            expect(res).toEqual({ isValid: true, value: 7.5, clamped: false });
        });

        it('accepts direct numeric inputs', () => {
            const res = validateRpe(9);
            expect(res).toEqual({ isValid: true, value: 9, clamped: false });
        });
    });

    describe('Out-of-bounds values (Clamping)', () => {
        it('clamps values below 1 (e.g. 0) to 1 with error and clamped flag', () => {
            const res = validateRpe('0');
            expect(res).toEqual({
                isValid: false,
                value: 1,
                clamped: true,
                error: 'El RPE mínimo permitido es 1.',
            });
        });

        it('clamps negative values (e.g. -2) to 1', () => {
            const res = validateRpe('-2');
            expect(res).toEqual({
                isValid: false,
                value: 1,
                clamped: true,
                error: 'El RPE mínimo permitido es 1.',
            });
        });

        it('clamps values above 10 (e.g. 11) to 10 with error and clamped flag', () => {
            const res = validateRpe('11');
            expect(res).toEqual({
                isValid: false,
                value: 10,
                clamped: true,
                error: 'El RPE máximo permitido es 10.',
            });
        });

        it('clamps values far above 10 (e.g. 99) to 10', () => {
            const res = validateRpe('99');
            expect(res).toEqual({
                isValid: false,
                value: 10,
                clamped: true,
                error: 'El RPE máximo permitido es 10.',
            });
        });
    });

    describe('Invalid non-numeric inputs', () => {
        it('returns invalid and null when given non-numeric text', () => {
            const res = validateRpe('abc');
            expect(res).toEqual({
                isValid: false,
                value: null,
                clamped: false,
                error: 'El RPE debe ser un valor numérico.',
            });
        });

        it('returns invalid and null when given special characters', () => {
            const res = validateRpe('@#$');
            expect(res).toEqual({
                isValid: false,
                value: null,
                clamped: false,
                error: 'El RPE debe ser un valor numérico.',
            });
        });
    });
});
