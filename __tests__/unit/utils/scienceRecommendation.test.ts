import { buildScienceRecommendation } from '../../../src/utils/scienceRecommendation';

describe('buildScienceRecommendation (PF-395 / PF-407)', () => {
    it('returns no_data when distribution is empty', () => {
        const rec = buildScienceRecommendation([]);
        expect(rec.kind).toBe('no_data');
        expect(rec.ctaLabel).toBe('Ajustar Volumen en Rutinas');
        expect(rec.titleKey).toBe('scienceRec.title');
        expect(rec.messageKey).toBe('scienceRec.noData');
        expect(rec.ctaLabelKey).toBe('scienceRec.ctaLabel');
    });

    it('suggests adding volume to the lowest muscle when some are optimal', () => {
        const rec = buildScienceRecommendation([
            { grupo_muscular: 'Pecho', series_efectivas: 16 },
            { grupo_muscular: 'Bíceps', series_efectivas: 2 },
        ]);
        expect(rec.kind).toBe('add_volume');
        expect(rec.targetMuscle).toBe('Bíceps');
        expect(rec.message).toMatch(/2 series/);
        expect(rec.messageKey).toBe('scienceRec.low');
        expect(rec.messageParams).toEqual({
            optimalRef: 'Pecho',
            muscle: 'Bíceps',
        });
    });

    it('suggests deload when a muscle exceeds MRV', () => {
        const rec = buildScienceRecommendation([
            { grupo_muscular: 'Pecho', series_efectivas: 30 },
        ]);
        expect(rec.kind).toBe('deload');
        expect(rec.targetMuscle).toBe('Pecho');
        expect(rec.messageKey).toBe('scienceRec.overtraining');
        expect(rec.messageParams).toEqual({
            muscle: 'Pecho',
            sets: 30,
        });
    });

    it('suggests caution when a muscle approaches warning zone (near MRV)', () => {
        const rec = buildScienceRecommendation([
            { grupo_muscular: 'Cuádriceps', series_efectivas: 20 },
        ]);
        expect(rec.kind).toBe('deload');
        expect(rec.targetMuscle).toBe('Cuádriceps');
        expect(rec.messageKey).toBe('scienceRec.warning');
        expect(rec.messageParams).toEqual({
            muscle: 'Cuádriceps',
        });
    });

    it('returns optimal_maintain when all muscles are optimal', () => {
        const rec = buildScienceRecommendation([
            { grupo_muscular: 'Pecho', series_efectivas: 16 },
            { grupo_muscular: 'Espalda', series_efectivas: 18 },
        ]);
        expect(rec.kind).toBe('optimal_maintain');
        expect(rec.messageKey).toBe('scienceRec.optimalMaintain');
        expect(rec.messageParams).toEqual({
            muscles: 'Pecho y Espalda',
        });
    });
});
