import { themes, colors, palette } from '../../../src/theme/colors';
import { typography, spacing, borderRadius } from '../../../src/theme/typography';

describe('Design System Stitch Tokens (PF-388)', () => {
    describe('Dark Theme Tokens (Modo Gimnasio Principal)', () => {
        const darkColors = themes.dark.colors;

        it('has valid theme mode and isDark flag', () => {
            expect(themes.dark.mode).toBe('dark');
            expect(themes.dark.isDark).toBe(true);
        });

        it('defines official Stitch Dark Primary & Container tokens', () => {
            expect(darkColors.primary).toBe('#9fffac');
            expect(darkColors.primaryContainer).toBe('#13ec6d');
            expect(darkColors.onPrimary).toBe('#003914');
            expect(darkColors.onPrimaryContainer).toBe('#00652a');
        });

        it('defines official Stitch Dark Surface Hierarchy', () => {
            expect(darkColors.background).toBe('#131316');
            expect(darkColors.surface).toBe('#131316');
            expect(darkColors.surfaceContainerLowest).toBe('#0e0e11');
            expect(darkColors.surfaceContainerLow).toBe('#1b1b1e');
            expect(darkColors.surfaceContainer).toBe('#1f1f22');
            expect(darkColors.surfaceContainerHigh).toBe('#2a2a2d');
            expect(darkColors.surfaceContainerHighest).toBe('#353438');
            expect(darkColors.surfaceBright).toBe('#39393c');
        });

        it('defines official Stitch Dark Text, Borders and Error states', () => {
            expect(darkColors.onSurface).toBe('#e4e1e6');
            expect(darkColors.onSurfaceVariant).toBe('#bacbb8');
            expect(darkColors.outline).toBe('#859583');
            expect(darkColors.outlineVariant).toBe('#3b4b3c');
            expect(darkColors.error).toBe('#ffb4ab');
            expect(darkColors.errorContainer).toBe('#93000a');
            expect(darkColors.onError).toBe('#690005');
        });

        it('maintains backward compatibility properties', () => {
            expect(darkColors.text).toBe('#e4e1e6');
            expect(darkColors.textSecondary).toBe('#bacbb8');
            expect(darkColors.border).toBe('#3b4b3c');
            expect(darkColors.inputBackground).toBe('#1b1b1e');
            expect(darkColors.statusSuccess).toBeDefined();
            expect(darkColors.statusWarning).toBeDefined();
            expect(darkColors.statusError).toBeDefined();
        });

        it('provides kebab-case index access for Tailwind/NativeWind parity', () => {
            expect(darkColors['surface-container']).toBe('#1f1f22');
            expect(darkColors['on-surface']).toBe('#e4e1e6');
            expect(darkColors['primary-container']).toBe('#13ec6d');
        });
    });

    describe('Light Theme Tokens (Modo Día Limpio)', () => {
        const lightColors = themes.light.colors;

        it('has valid theme mode and isDark flag', () => {
            expect(themes.light.mode).toBe('light');
            expect(themes.light.isDark).toBe(false);
        });

        it('defines official Stitch Light Primary & Container tokens', () => {
            expect(lightColors.primary).toBe('#00236f');
            expect(lightColors.primaryContainer).toBe('#1e3a8a');
            expect(lightColors.onPrimary).toBe('#ffffff');
            expect(lightColors.onPrimaryContainer).toBe('#90a8ff');
        });

        it('defines official Stitch Light Surface Hierarchy', () => {
            expect(lightColors.background).toBe('#faf8ff');
            expect(lightColors.surface).toBe('#faf8ff');
            expect(lightColors.surfaceContainerLowest).toBe('#ffffff');
            expect(lightColors.surfaceContainerLow).toBe('#f2f3ff');
            expect(lightColors.surfaceContainer).toBe('#eaedff');
            expect(lightColors.surfaceContainerHigh).toBe('#e2e7ff');
            expect(lightColors.surfaceContainerHighest).toBe('#dae2fd');
        });

        it('defines official Stitch Light Text, Borders, Secondary and Error states', () => {
            expect(lightColors.onSurface).toBe('#131b2e');
            expect(lightColors.onSurfaceVariant).toBe('#444651');
            expect(lightColors.outline).toBe('#757682');
            expect(lightColors.outlineVariant).toBe('#c5c5d3');
            expect(lightColors.secondary).toBe('#9d4300');
            expect(lightColors.secondaryContainer).toBe('#fd761a');
            expect(lightColors.error).toBe('#ba1a1a');
            expect(lightColors.errorContainer).toBe('#ffdad6');
        });

        it('maintains backward compatibility properties in light mode', () => {
            expect(lightColors.text).toBe('#131b2e');
            expect(lightColors.textSecondary).toBe('#444651');
            expect(lightColors.border).toBe('#c5c5d3');
            expect(lightColors.inputBackground).toBe('#f2f3ff');
            expect(lightColors.statusSuccess).toBe('#16a34a');
        });
    });

    describe('Global colors alias export', () => {
        it('exports dark theme colors by default for legacy imports', () => {
            expect(colors.primary).toBe(themes.dark.colors.primary);
            expect(colors.background).toBe(themes.dark.colors.background);
            expect(colors.text).toBe(themes.dark.colors.text);
        });
    });

    describe('Typography Scale (Inter)', () => {
        it('defines all 11 Stitch typography definitions with numeric dimensions', () => {
            const styles = [
                'displayLg',
                'displayLgMobile',
                'headlineMd',
                'headlineMdMobile',
                'titleSm',
                'statNumeric',
                'numericInput',
                'timerPill',
                'bodyBase',
                'bodyBold',
                'caption',
            ];

            styles.forEach((styleName) => {
                const style = typography[styleName];
                expect(style).toBeDefined();
                expect(typeof style.fontSize).toBe('number');
                expect(typeof style.lineHeight).toBe('number');
                expect(style.fontWeight).toBeDefined();
            });
        });

        it('configures tabular-nums for numeric styles', () => {
            expect(typography.statNumeric.fontVariant).toContain('tabular-nums');
            expect(typography.numericInput.fontVariant).toContain('tabular-nums');
            expect(typography.timerPill.fontVariant).toContain('tabular-nums');
        });
    });

    describe('Spacing and Radius tokens', () => {
        it('provides standardized spacing values', () => {
            expect(spacing.spaceXs).toBe(4);
            expect(spacing.spaceSm).toBe(8);
            expect(spacing.spaceMd).toBe(12);
            expect(spacing.spaceLg).toBe(16);
            expect(spacing.spaceXl).toBe(24);
        });

        it('provides standardized borderRadius values', () => {
            expect(borderRadius.default).toBe(4);
            expect(borderRadius.md).toBe(8);
            expect(borderRadius.xl).toBe(12);
            expect(borderRadius.full).toBe(9999);
        });
    });
});
