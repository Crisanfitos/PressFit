import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TodayRoutineHeroCard } from '../../src/components/calendar/TodayRoutineHeroCard';
import { WeeklyDayPillsCarousel, DayPillData } from '../../src/components/calendar/WeeklyDayPillsCarousel';
import { WeeklyRoutineDayCard } from '../../src/components/calendar/WeeklyRoutineDayCard';
import { WeeklyRoutinesScreen } from '../../src/screens/WeeklyRoutinesScreen';
import { AuthContext } from '../../src/context/AuthContext';
import { ThemeProvider } from '../../src/context/ThemeContext';
import { RoutineService } from '../../src/services/RoutineService';

const mockColors: any = {
    primary: '#00236f',
    primaryContainer: '#1e3a8a',
    onPrimary: '#ffffff',
    secondary: '#9d4300',
    secondaryContainer: '#fd761a',
    onSecondary: '#ffffff',
    secondaryFixed: '#ffdbca',
    onSecondaryFixed: '#341100',
    tertiaryContainer: '#720080',
    surface: '#faf8ff',
    onSurface: '#131b2e',
    surfaceContainerLowest: '#ffffff',
    surfaceContainerLow: '#f2f3ff',
    surfaceContainer: '#eaedff',
    surfaceContainerHigh: '#e2e7ff',
    onSurfaceVariant: '#444651',
    outline: '#757682',
    outlineVariant: '#c5c5d3',
    statusSuccess: '#00C851',
    statusWarning: '#FF9F1A',
    border: '#c5c5d3',
    text: '#131b2e',
    textSecondary: '#444651',
};

jest.mock('../../src/services/RoutineService', () => ({
    RoutineService: {
        getAllWeeklyRoutines: jest.fn().mockResolvedValue({
            data: [{ id: 'r1', nombre: 'Empuje Tirón Pierna', activa: true }],
            error: null,
        }),
        getWeeklyRoutineWithDays: jest.fn().mockResolvedValue({
            data: {
                id: 'r1',
                nombre: 'Empuje Tirón Pierna',
                rutinas_diarias: [
                    {
                        id: 'rd-1',
                        nombre_dia: 'Lunes',
                        orden_dia: 1,
                        duracion_estimada: 60,
                        ejercicios_programados: [
                            { id: 'ep1', series: [{ id: 's1' }, { id: 's2' }, { id: 's3' }] },
                        ],
                    },
                ],
            },
            error: null,
        }),
        getWorkoutsForDateRange: jest.fn().mockResolvedValue({ data: [], error: null }),
    },
}));

describe('Weekly Planning M3 Redesign (PF-391)', () => {
    describe('TodayRoutineHeroCard', () => {
        it('renders title, metrics strip, and triggers onStartPress', async () => {
            const onStartMock = jest.fn();
            const { getByText, getByTestId } = await render(
                <TodayRoutineHeroCard
                    dayName="HOY • MIÉRCOLES"
                    routineTitle="Empuje: Pecho, Hombro & Tríceps"
                    description="Enfoque de hipertrofia mecánica"
                    estimatedMinutes={65}
                    exerciseCount={5}
                    totalSets={16}
                    estimatedLoad="4,850 kg"
                    targetRpe="8.5 / 10"
                    targetMuscles={['Pectoral', 'Deltoides']}
                    status="scheduled"
                    onStartPress={onStartMock}
                    colors={mockColors}
                />
            );

            expect(getByText('Empuje: Pecho, Hombro & Tríceps')).toBeTruthy();
            expect(getByText('16 Sets')).toBeTruthy();
            expect(getByText('4,850 kg')).toBeTruthy();
            expect(getByText('8.5 / 10')).toBeTruthy();
            expect(getByText('Pectoral')).toBeTruthy();
            expect(getByText('Deltoides')).toBeTruthy();

            const ctaBtn = getByTestId('hero-start-workout-button');
            expect(ctaBtn).toBeTruthy();
            expect(getByText('Iniciar Entrenamiento')).toBeTruthy();

            fireEvent.press(ctaBtn);
            expect(onStartMock).toHaveBeenCalledTimes(1);
        });

        it('renders completed status label when workout is finished', async () => {
            const { getByText } = await render(
                <TodayRoutineHeroCard
                    dayName="HOY • MARTES"
                    routineTitle="Pierna Completa"
                    status="completed"
                    onStartPress={jest.fn()}
                    colors={mockColors}
                />
            );

            expect(getByText('Ver Entrenamiento')).toBeTruthy();
        });

        it('renders rest status layout correctly', async () => {
            const { getByText } = await render(
                <TodayRoutineHeroCard
                    dayName="HOY • JUEVES"
                    routineTitle="Descanso Activo / Recuperación"
                    status="rest"
                    onStartPress={jest.fn()}
                    colors={mockColors}
                />
            );

            expect(getByText('Descanso')).toBeTruthy();
            expect(getByText('Ver Detalles del Día')).toBeTruthy();
        });
    });

    describe('WeeklyDayPillsCarousel', () => {
        it('renders 7 days with their states and triggers onSelectDay', async () => {
            const onSelectMock = jest.fn();
            const mockDays: DayPillData[] = [
                { dayKey: '2026-09-18', dayLetter: 'L', dayNumber: 18, isToday: false, status: 'completed', date: new Date('2026-09-18') },
                { dayKey: '2026-09-19', dayLetter: 'M', dayNumber: 19, isToday: false, status: 'completed', date: new Date('2026-09-19') },
                { dayKey: '2026-09-20', dayLetter: 'X', dayNumber: 20, isToday: true, status: 'active', date: new Date('2026-09-20') },
                { dayKey: '2026-09-21', dayLetter: 'J', dayNumber: 21, isToday: false, status: 'rest', date: new Date('2026-09-21') },
                { dayKey: '2026-09-22', dayLetter: 'V', dayNumber: 22, isToday: false, status: 'scheduled', date: new Date('2026-09-22') },
                { dayKey: '2026-09-23', dayLetter: 'S', dayNumber: 23, isToday: false, status: 'scheduled', date: new Date('2026-09-23') },
                { dayKey: '2026-09-24', dayLetter: 'D', dayNumber: 24, isToday: false, status: 'rest', date: new Date('2026-09-24') },
            ];

            const { getByText, getByTestId } = await render(
                <WeeklyDayPillsCarousel
                    days={mockDays}
                    onSelectDay={onSelectMock}
                    colors={mockColors}
                />
            );

            expect(getByText('L')).toBeTruthy();
            expect(getByText('18')).toBeTruthy();
            expect(getByTestId('weekly-pill-icon-completed-2026-09-18')).toBeTruthy();
            expect(getByTestId('weekly-pill-dot-active-2026-09-20')).toBeTruthy();
            expect(getByTestId('weekly-pill-icon-rest-2026-09-21')).toBeTruthy();

            const pillX = getByTestId('weekly-pill-2026-09-20');
            fireEvent.press(pillX);
            expect(onSelectMock).toHaveBeenCalledWith(mockDays[2]);
        });
    });

    describe('WeeklyRoutineDayCard', () => {
        it('renders completed day card with checkmark and volume', async () => {
            const onPressMock = jest.fn();
            const { getByText, getByTestId } = await render(
                <WeeklyRoutineDayCard
                    dayName="Lunes"
                    dateDisplay="18/09"
                    routineTitle="Tirón: Espalda & Bíceps"
                    status="completed"
                    exerciseCount={5}
                    durationMinutes={50}
                    totalVolumeKg={4850}
                    onPress={onPressMock}
                    colors={mockColors}
                />
            );

            expect(getByText('LUNES • 18/09')).toBeTruthy();
            expect(getByTestId('weekly-card-badge-completed')).toBeTruthy();
            expect(getByText('Tirón: Espalda & Bíceps')).toBeTruthy();
            expect(getByText('5 ejercicios')).toBeTruthy();
            expect(getByText('50 min')).toBeTruthy();
            expect(getByText('4,850 kg')).toBeTruthy();

            fireEvent.press(getByTestId('weekly-routine-day-card'));
            expect(onPressMock).toHaveBeenCalledTimes(1);
        });

        it('renders scheduled day card', async () => {
            const { getByText, getByTestId } = await render(
                <WeeklyRoutineDayCard
                    dayName="Viernes"
                    dateDisplay="22/09"
                    routineTitle="Torso Fuerza"
                    status="scheduled"
                    exerciseCount={5}
                    durationMinutes={60}
                    onPress={jest.fn()}
                    colors={mockColors}
                />
            );

            expect(getByText('VIERNES • 22/09')).toBeTruthy();
            expect(getByTestId('weekly-card-badge-scheduled')).toBeTruthy();
            expect(getByText('Torso Fuerza')).toBeTruthy();
        });

        it('renders rest day card with relaxed style', async () => {
            const { getByText } = await render(
                <WeeklyRoutineDayCard
                    dayName="Jueves"
                    routineTitle="Descanso Activo / Movilidad"
                    status="rest"
                    description="Estiramientos y caminata ligera"
                    onPress={jest.fn()}
                    colors={mockColors}
                />
            );

            expect(getByText('JUEVES')).toBeTruthy();
            expect(getByText('Descanso Activo / Movilidad')).toBeTruthy();
            expect(getByText('Estiramientos y caminata ligera')).toBeTruthy();
        });
    });

    describe('WeeklyRoutinesScreen Component', () => {
        it('renders Mis Rutinas title and active week header', async () => {
            const mockNav = { navigate: jest.fn() };
            const { findByText } = await render(
                <AuthContext.Provider value={{ user: { id: 'u1' } } as any}>
                    <ThemeProvider>
                        <WeeklyRoutinesScreen navigation={mockNav} />
                    </ThemeProvider>
                </AuthContext.Provider>
            );

            expect(await findByText('Mis Rutinas')).toBeTruthy();
            expect(await findByText('Rutinas de la Semana')).toBeTruthy();
        });
    });
});
