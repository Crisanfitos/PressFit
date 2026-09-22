import { buildScienceRecommendation } from '../../../src/utils/scienceRecommendation';

describe('buildScienceRecommendation (PF-395)', () => {
    it('returns no_data when distribution is empty', () => {
        const rec = buildScienceRecommendation([]);
        expect(rec.kind).toBe('no_data');
        expect(rec.ctaLabel).toBe('Ajustar Volumen en Rutinas');
    });

    it('suggests adding volume to the lowest muscle when some are optimal', () => {
        const rec = buildScienceRecommendation([
            { grupo_muscular: 'Pecho', series_efectivas: 16 },
            { grupo_muscular: 'Bíceps', series_efectivas: 2 },
        ]);
        expect(rec.kind).toBe('add_volume');
        expect(rec.targetMuscle).toBe('Bíceps');
        expect(rec.message).toMatch(/2 series/);
    });

    it('suggests deload when a muscle exceeds MRV', () => {
        const rec = buildScienceRecommendation([
            { grupo_muscular: 'Pecho', series_efectivas: 30 },
        ]);
        expect(rec.kind).toBe('deload');
        expect(rec.targetMuscle).toBe('Pecho');
    });

    it('returns optimal_maintain when all muscles are optimal', () => {
        const rec = buildScienceRecommendation([
            { grupo_muscular: 'Pecho', series_efectivas: 16 },
            { grupo_muscular: 'Espalda', series_efectivas: 18 },
        ]);
        expect(rec.kind).toBe('optimal_maintain');
    });
});
