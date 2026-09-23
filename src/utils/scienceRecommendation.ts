import { assessMuscleHypertrophy } from './hypertrophyLandmarks';

export interface VolumeDistributionItem {
    grupo_muscular: string;
    series_efectivas: number;
}

export interface ScienceRecommendation {
    kind: 'add_volume' | 'deload' | 'optimal_maintain' | 'no_data';
    title: string;
    message: string;
    targetMuscle: string | null;
    ctaLabel: string;
    titleKey?: string;
    messageKey?: string;
    messageParams?: Record<string, string | number>;
    ctaLabelKey?: string;
}

/**
 * Builds a deterministic sports-science recommendation from weekly volume.
 * Pure function — no React, no I/O — to keep AnalyticsService untouched
 * (PF-395 scope excludes algorithm changes) while feeding the Coach Callout UI.
 */
export function buildScienceRecommendation(
    distribucion: VolumeDistributionItem[] | undefined | null
): ScienceRecommendation {
    const ctaLabel = 'Ajustar Volumen en Rutinas';

    if (!distribucion || distribucion.length === 0) {
        return {
            kind: 'no_data',
            title: 'Sobrecarga Progresiva & Deload',
            message:
                'Registra tus entrenamientos esta semana para recibir una recomendación personalizada de volumen.',
            targetMuscle: null,
            ctaLabel,
            titleKey: 'scienceRec.title',
            messageKey: 'scienceRec.noData',
            ctaLabelKey: 'scienceRec.ctaLabel',
        };
    }

    const assessed = distribucion.map((item) => ({
        ...item,
        assessment: assessMuscleHypertrophy(item.grupo_muscular, item.series_efectivas),
    }));

    const overtraining = assessed.filter((a) => a.assessment.status === 'overtraining');
    const warning = assessed.filter((a) => a.assessment.status === 'warning');
    const low = assessed
        .filter(
            (a) =>
                a.assessment.status === 'below_mv' || a.assessment.status === 'maintenance'
        )
        .sort((a, b) => a.series_efectivas - b.series_efectivas);
    const optimal = assessed.filter((a) => a.assessment.status === 'optimal');

    if (overtraining.length > 0) {
        const target = overtraining[0];
        return {
            kind: 'deload',
            title: 'Sobrecarga Progresiva & Deload',
            message: `Tu volumen en ${target.grupo_muscular} supera el MRV (${target.series_efectivas} series). Considera una semana de deload o reducir 3-4 series para recuperar adaptación.`,
            targetMuscle: target.grupo_muscular,
            ctaLabel,
            titleKey: 'scienceRec.title',
            messageKey: 'scienceRec.overtraining',
            messageParams: {
                muscle: target.grupo_muscular,
                sets: target.series_efectivas,
            },
            ctaLabelKey: 'scienceRec.ctaLabel',
        };
    }

    if (low.length > 0) {
        const target = low[0];
        const optimalRef = optimal.length > 0 ? optimal[0].grupo_muscular : 'Pecho y Espalda';
        return {
            kind: 'add_volume',
            title: 'Sobrecarga Progresiva & Deload',
            message: `Tu volumen en ${optimalRef} está en rango óptimo de adaptación (MAV). Considera añadir 2 series en ${target.grupo_muscular} la próxima semana.`,
            targetMuscle: target.grupo_muscular,
            ctaLabel,
            titleKey: 'scienceRec.title',
            messageKey: 'scienceRec.low',
            messageParams: {
                optimalRef,
                muscle: target.grupo_muscular,
            },
            ctaLabelKey: 'scienceRec.ctaLabel',
        };
    }

    if (warning.length > 0) {
        const target = warning[0];
        return {
            kind: 'deload',
            title: 'Sobrecarga Progresiva & Deload',
            message: `Tu volumen en ${target.grupo_muscular} está cerca del límite recuperable (MRV). Mantén la carga actual y evita añadir series extra esta semana.`,
            targetMuscle: target.grupo_muscular,
            ctaLabel,
            titleKey: 'scienceRec.title',
            messageKey: 'scienceRec.warning',
            messageParams: {
                muscle: target.grupo_muscular,
            },
            ctaLabelKey: 'scienceRec.ctaLabel',
        };
    }

    const musclesStr =
        optimal.map((o) => o.grupo_muscular).slice(0, 2).join(' y ') || 'los grupos principales';
    return {
        kind: 'optimal_maintain',
        title: 'Sobrecarga Progresiva & Deload',
        message: `Tu volumen en ${musclesStr} está en rango óptimo de adaptación (MAV). Mantén la sobrecarga progresiva actual.`,
        targetMuscle: null,
        ctaLabel,
        titleKey: 'scienceRec.title',
        messageKey: 'scienceRec.optimalMaintain',
        messageParams: {
            muscles: musclesStr,
        },
        ctaLabelKey: 'scienceRec.ctaLabel',
    };
}

export default buildScienceRecommendation;
