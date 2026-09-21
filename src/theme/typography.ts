import { TextStyle } from 'react-native';

/**
 * Stitch Design System Typography Scale (Inter)
 * Defined in Documentacion/redesign.html
 */
export const typography: Record<string, TextStyle> = {
    displayLg: {
        fontSize: 36,
        lineHeight: 44,
        letterSpacing: -0.03 * 36,
        fontWeight: '700',
    },
    displayLgMobile: {
        fontSize: 28,
        lineHeight: 34,
        letterSpacing: -0.02 * 28,
        fontWeight: '700',
    },
    headlineMd: {
        fontSize: 24,
        lineHeight: 32,
        letterSpacing: -0.02 * 24,
        fontWeight: '700',
    },
    headlineMdMobile: {
        fontSize: 20,
        lineHeight: 26,
        letterSpacing: -0.01 * 20,
        fontWeight: '700',
    },
    titleSm: {
        fontSize: 16,
        lineHeight: 22,
        letterSpacing: -0.01 * 16,
        fontWeight: '600',
    },
    statNumeric: {
        fontSize: 28,
        lineHeight: 34,
        letterSpacing: -0.02 * 28,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    numericInput: {
        fontSize: 16,
        lineHeight: 22,
        letterSpacing: 0.02 * 16,
        fontWeight: '600',
        fontVariant: ['tabular-nums'],
    },
    timerPill: {
        fontSize: 14,
        lineHeight: 18,
        letterSpacing: 0.03 * 14,
        fontWeight: '700',
        fontVariant: ['tabular-nums'],
    },
    bodyBase: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0,
        fontWeight: '400',
    },
    bodyBold: {
        fontSize: 14,
        lineHeight: 20,
        letterSpacing: 0,
        fontWeight: '600',
    },
    caption: {
        fontSize: 11,
        lineHeight: 16,
        letterSpacing: 0.04 * 11,
        fontWeight: '600',
    },
};

export const spacing = {
    spaceXs: 4,
    spaceSm: 8,
    spaceMd: 12,
    spaceLg: 16,
    spaceXl: 24,
    margin: 16,
    gutter: 16,
};

export const borderRadius = {
    default: 4,
    sm: 4,
    md: 8,
    lg: 8,
    xl: 12,
    full: 9999,
};
