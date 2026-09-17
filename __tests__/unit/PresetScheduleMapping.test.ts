import {
    mapPresetDaysToWeeklySchedule,
    DAYS_OF_WEEK,
    DAYS_OF_WEEK_EN,
    DAYS_OF_WEEK_KEYS,
    getDaysOfWeek,
    getEquivalentDayName,
    isSameDayName,
    getTranslatedDayName,
    RoutineService,
} from '../../src/services/RoutineService';

describe('Preset Schedule Mapping and Decomposition (PF-303 / PF-371)', () => {
    describe('DAYS_OF_WEEK and i18n day constants', () => {
        it('has 7 days ordered from Lunes to Domingo', () => {
            expect(DAYS_OF_WEEK).toEqual([
                'Lunes',
                'Martes',
                'Miércoles',
                'Jueves',
                'Viernes',
                'Sábado',
                'Domingo',
            ]);
            expect(DAYS_OF_WEEK.length).toBe(7);
        });

        it('has 7 English days ordered from Monday to Sunday', () => {
            expect(DAYS_OF_WEEK_EN).toEqual([
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Sunday',
            ]);
            expect(DAYS_OF_WEEK_EN.length).toBe(7);
        });

        it('returns correct days array based on locale via getDaysOfWeek', () => {
            expect(getDaysOfWeek('es')).toBe(DAYS_OF_WEEK);
            expect(getDaysOfWeek('es-ES')).toBe(DAYS_OF_WEEK);
            expect(getDaysOfWeek('en')).toBe(DAYS_OF_WEEK_EN);
            expect(getDaysOfWeek('en-US')).toBe(DAYS_OF_WEEK_EN);
        });

        it('translates day name or returns fallback via getTranslatedDayName', () => {
            const mockT = jest.fn((key: string) => {
                const map: Record<string, string> = {
                    'days.monday': 'Monday',
                    'days.tuesday': 'Tuesday',
                    'days.wednesday': 'Wednesday',
                };
                return map[key] || key;
            });

            expect(getTranslatedDayName('Lunes', mockT)).toBe('Monday');
            expect(getTranslatedDayName('lunes', mockT)).toBe('Monday');
            expect(getTranslatedDayName('Martes', mockT)).toBe('Tuesday');
            expect(getTranslatedDayName('CustomDay', mockT)).toBe('CustomDay');
            expect(getTranslatedDayName('Lunes')).toBe('Lunes');
        });

        it('resolves equivalent day names between Spanish and English', () => {
            expect(getEquivalentDayName('Lunes')).toBe('Monday');
            expect(getEquivalentDayName('Monday')).toBe('Lunes');
            expect(getEquivalentDayName('Miércoles')).toBe('Wednesday');
            expect(getEquivalentDayName('Wednesday')).toBe('Miércoles');
            expect(getEquivalentDayName('Domingo')).toBe('Sunday');
            expect(getEquivalentDayName('Sunday')).toBe('Domingo');
        });

        it('correctly compares day names across languages and casing via isSameDayName', () => {
            expect(isSameDayName('Lunes', 'Monday')).toBe(true);
            expect(isSameDayName('lunes', 'monday')).toBe(true);
            expect(isSameDayName('Miércoles', 'Wednesday')).toBe(true);
            expect(isSameDayName('Miercoles', 'Wednesday')).toBe(true);
            expect(isSameDayName('Lunes', 'Martes')).toBe(false);
            expect(isSameDayName('Lunes', 'Tuesday')).toBe(false);
            expect(isSameDayName('', 'Lunes')).toBe(false);
        });
    });

    describe('mapPresetDaysToWeeklySchedule', () => {
        it('maps 3-day preset to Lun, Mie, Vie with rest on other days', () => {
            const presetDays = [
                { nombre_dia: 'Push' },
                { nombre_dia: 'Pull' },
                { nombre_dia: 'Legs' },
            ];

            const schedule = mapPresetDaysToWeeklySchedule(presetDays);

            expect(schedule.length).toBe(7);
            expect(schedule[0]).toEqual({ nombre_dia: 'Push' }); // Lunes
            expect(schedule[1]).toBeNull();                     // Martes
            expect(schedule[2]).toEqual({ nombre_dia: 'Pull' }); // Miércoles
            expect(schedule[3]).toBeNull();                     // Jueves
            expect(schedule[4]).toEqual({ nombre_dia: 'Legs' }); // Viernes
            expect(schedule[5]).toBeNull();                     // Sábado
            expect(schedule[6]).toBeNull();                     // Domingo
        });

        it('maps 4-day preset to Lun, Mar, Jue, Vie with rest on Mie and weekend', () => {
            const presetDays = [
                { nombre_dia: 'Upper A' },
                { nombre_dia: 'Lower A' },
                { nombre_dia: 'Upper B' },
                { nombre_dia: 'Lower B' },
            ];

            const schedule = mapPresetDaysToWeeklySchedule(presetDays);

            expect(schedule.length).toBe(7);
            expect(schedule[0]).toEqual({ nombre_dia: 'Upper A' }); // Lunes
            expect(schedule[1]).toEqual({ nombre_dia: 'Lower A' }); // Martes
            expect(schedule[2]).toBeNull();                         // Miércoles
            expect(schedule[3]).toEqual({ nombre_dia: 'Upper B' }); // Jueves
            expect(schedule[4]).toEqual({ nombre_dia: 'Lower B' }); // Viernes
            expect(schedule[5]).toBeNull();                         // Sábado
            expect(schedule[6]).toBeNull();                         // Domingo
        });

        it('maps 5-day preset to Lun through Vie with rest on weekend', () => {
            const presetDays = [
                { nombre_dia: 'Chest' },
                { nombre_dia: 'Back' },
                { nombre_dia: 'Legs' },
                { nombre_dia: 'Shoulders' },
                { nombre_dia: 'Arms' },
            ];

            const schedule = mapPresetDaysToWeeklySchedule(presetDays);

            expect(schedule.length).toBe(7);
            expect(schedule[0]).toEqual({ nombre_dia: 'Chest' });
            expect(schedule[1]).toEqual({ nombre_dia: 'Back' });
            expect(schedule[2]).toEqual({ nombre_dia: 'Legs' });
            expect(schedule[3]).toEqual({ nombre_dia: 'Shoulders' });
            expect(schedule[4]).toEqual({ nombre_dia: 'Arms' });
            expect(schedule[5]).toBeNull();
            expect(schedule[6]).toBeNull();
        });

        it('maps 6-day preset to Lun through Sab with rest on Domingo', () => {
            const presetDays = [
                { nombre_dia: 'Push 1' },
                { nombre_dia: 'Pull 1' },
                { nombre_dia: 'Legs 1' },
                { nombre_dia: 'Push 2' },
                { nombre_dia: 'Pull 2' },
                { nombre_dia: 'Legs 2' },
            ];

            const schedule = mapPresetDaysToWeeklySchedule(presetDays);

            expect(schedule.length).toBe(7);
            expect(schedule[0]).toEqual({ nombre_dia: 'Push 1' });
            expect(schedule[1]).toEqual({ nombre_dia: 'Pull 1' });
            expect(schedule[2]).toEqual({ nombre_dia: 'Legs 1' });
            expect(schedule[3]).toEqual({ nombre_dia: 'Push 2' });
            expect(schedule[4]).toEqual({ nombre_dia: 'Pull 2' });
            expect(schedule[5]).toEqual({ nombre_dia: 'Legs 2' });
            expect(schedule[6]).toBeNull();
        });

        it('handles empty or undefined presetDays gracefully', () => {
            const scheduleEmpty = mapPresetDaysToWeeklySchedule([]);
            expect(scheduleEmpty).toHaveLength(7);
            expect(scheduleEmpty.every((d) => d === null)).toBe(true);

            const scheduleUndefined = mapPresetDaysToWeeklySchedule(undefined);
            expect(scheduleUndefined).toHaveLength(7);
            expect(scheduleUndefined.every((d) => d === null)).toBe(true);
        });

        it('handles arbitrary count (e.g. 2 days)', () => {
            const presetDays = [{ nombre_dia: 'A' }, { nombre_dia: 'B' }];
            const schedule = mapPresetDaysToWeeklySchedule(presetDays);
            expect(schedule).toHaveLength(7);
            expect(schedule[0]).toEqual({ nombre_dia: 'A' });
            expect(schedule[1]).toEqual({ nombre_dia: 'B' });
            expect(schedule[2]).toBeNull();
            expect(schedule[6]).toBeNull();
        });
    });

    describe('RoutineService.createWeeklyRoutineFromPreset alias', () => {
        it('delegates to importPresetRoutine', async () => {
            const spy = jest.spyOn(RoutineService, 'importPresetRoutine').mockResolvedValue({
                data: { id: 'routine-alias-test' } as any,
                error: null,
            });

            const res = await RoutineService.createWeeklyRoutineFromPreset('user-1', 'preset-ppl-3d', true);

            expect(spy).toHaveBeenCalledWith('user-1', 'preset-ppl-3d', true);
            expect(res.data?.id).toBe('routine-alias-test');
            spy.mockRestore();
        });
    });
});
