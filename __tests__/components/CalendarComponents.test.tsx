import React from 'react';
import { Animated } from 'react-native';
import { render, fireEvent } from '@testing-library/react-native';
import {
    MonthNavigator,
    WeekHeader,
    DayCell,
    CalendarGrid,
    CalendarLegend,
    RoutineSelectorDropdown,
    CalendarFab,
    getMonthNames,
    getWeekDays,
    getCalendarDays,
    isInCurrentWeek,
    calculateDayStyle,
    WeeklyRoutine,
    CalendarDay,
} from '../../src/components/calendar';


const mockColors: any = {
    primary: '#22c55e',
    primaryDark: '#16a34a',
    background: '#0a0f0d',
    surface: '#121a16',
    border: '#1f2e26',
    text: '#ffffff',
    textSecondary: '#9ca3af',
    textOnPrimary: '#000000',
    statusSuccess: '#22c55e',
    statusWarning: '#eab308',
    statusError: '#ef4444',
    timelineCompleted: '#22c55e',
    timelineInProgress: '#eab308',
};

describe('Calendar Sub-components (PF-269)', () => {
    afterEach(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50));
    });

    describe('calendarUtils', () => {
        it('returns 12 months for spanish and english', () => {
            const esMonths = getMonthNames('es');
            const enMonths = getMonthNames('en');
            expect(esMonths).toHaveLength(12);
            expect(enMonths).toHaveLength(12);
            expect(esMonths[0]).toBe('Enero');
            expect(enMonths[0]).toBe('January');
        });

        it('returns 7 days of week for spanish and english', () => {
            const esDays = getWeekDays('es');
            const enDays = getWeekDays('en');
            expect(esDays).toHaveLength(7);
            expect(enDays).toHaveLength(7);
            expect(esDays[0]).toBe('L');
            expect(enDays[0]).toBe('M');
        });

        it('calculates calendar days correctly for February (non-leap)', () => {
            const days = getCalendarDays(2023, 1); // Feb 2023
            const validDays = days.filter((d) => d.dayNumber !== null);
            expect(validDays).toHaveLength(28);
        });

        it('identifies if date is in current week', () => {
            const today = new Date();
            expect(isInCurrentWeek(today)).toBe(true);
        });

        it('calculates day style with correct priorities', () => {
            const today = new Date();
            const dateStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
            const completed = new Set([dateStr]);
            const inProgress = new Set<string>();

            const style = calculateDayStyle(today, completed, inProgress);
            expect(style).not.toBeNull();
            expect(style?.isToday).toBe(true);
            expect(style?.isCompleted).toBe(true);
        });
    });

    describe('MonthNavigator', () => {
        it('renders month title and triggers navigation callbacks', async () => {
            const mockPrev = jest.fn();
            const mockNext = jest.fn();

            const { findByTestId, findByText } = await render(
                <MonthNavigator
                    monthTitle="Septiembre 2026"
                    colors={mockColors}
                    onPrevMonth={mockPrev}
                    onNextMonth={mockNext}
                />
            );

            expect(await findByText('Septiembre 2026')).toBeTruthy();
            const prevBtn = await findByTestId('prev-month-button');
            fireEvent.press(prevBtn);
            expect(mockPrev).toHaveBeenCalledTimes(1);

            const nextBtn = await findByTestId('next-month-button');
            fireEvent.press(nextBtn);
            expect(mockNext).toHaveBeenCalledTimes(1);
        });
    });

    describe('WeekHeader', () => {
        it('renders all day headers', async () => {
            const weekDays = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
            const { findByTestId, findByText } = await render(
                <WeekHeader weekDays={weekDays} daySize={40} textColor="#ffffff" />
            );

            expect(await findByTestId('week-header-row')).toBeTruthy();
            for (let index = 0; index < weekDays.length; index++) {
                expect(await findByTestId(`weekday-header-${index}`)).toBeTruthy();
                expect(await findByText(weekDays[index])).toBeTruthy();
            }
        });
    });

    describe('DayCell', () => {
        const dummyDay: CalendarDay = { date: new Date(2026, 8, 4), dayNumber: 4 };

        it('renders day number and responds to press', async () => {
            const mockPress = jest.fn();
            const { findByText, findByTestId } = await render(
                <DayCell
                    day={dummyDay}
                    index={3}
                    dayStyle={{
                        isToday: true,
                        isPast: false,
                        isFuture: false,
                        inCurrentWeek: true,
                        isCompleted: false,
                        isInProgress: false,
                    }}
                    isCurrentMonth={true}
                    daySize={40}
                    colors={mockColors}
                    onPress={mockPress}
                />
            );

            expect(await findByText('4')).toBeTruthy();
            const cell = await findByTestId('calendar-day-today');
            fireEvent.press(cell);
            expect(mockPress).toHaveBeenCalledWith(dummyDay.date);
        });

        it('disables press on future days', async () => {
            const mockPress = jest.fn();
            const futureDay: CalendarDay = { date: new Date(2026, 11, 25), dayNumber: 25 };
            const { findByTestId } = await render(
                <DayCell
                    day={futureDay}
                    index={24}
                    dayStyle={{
                        isToday: false,
                        isPast: false,
                        isFuture: true,
                        inCurrentWeek: false,
                        isCompleted: false,
                        isInProgress: false,
                    }}
                    isCurrentMonth={false}
                    daySize={40}
                    colors={mockColors}
                    onPress={mockPress}
                />
            );

            const cell = await findByTestId('calendar-day-future');
            fireEvent.press(cell);
            expect(mockPress).not.toHaveBeenCalled();
        });
    });

    describe('CalendarGrid', () => {
        it('renders grid with days and handles click', async () => {
            const mockDayPress = jest.fn();
            const days: CalendarDay[] = [
                { date: null, dayNumber: null },
                { date: new Date(2026, 8, 1), dayNumber: 1 },
                { date: new Date(2026, 8, 2), dayNumber: 2 },
            ];

            const { findByTestId, findByText } = await render(
                <CalendarGrid
                    calendarDays={days}
                    weekDays={['L', 'M', 'X', 'J', 'V', 'S', 'D']}
                    completedDays={new Set()}
                    inProgressDays={new Set()}
                    isCurrentMonth={true}
                    daySize={40}
                    colors={mockColors}
                    onDayPress={mockDayPress}
                />
            );

            expect(await findByTestId('calendar-grid-container')).toBeTruthy();
            expect(await findByText('1')).toBeTruthy();
            const day2 = await findByText('2');
            expect(day2).toBeTruthy();

            fireEvent.press(day2);
            expect(mockDayPress).toHaveBeenCalled();
        });
    });

    describe('CalendarLegend', () => {
        it('renders all legend items with localized labels', async () => {
            const { findByTestId, findByText } = await render(
                <CalendarLegend
                    colors={mockColors}
                    labels={{
                        today: 'Hoy',
                        completed: 'Completado',
                        inProgress: 'En Progreso',
                        missed: 'Sin Hacer',
                    }}
                />
            );

            expect(await findByTestId('status-legend')).toBeTruthy();
            expect(await findByTestId('legend-today')).toBeTruthy();
            expect(await findByTestId('legend-completed')).toBeTruthy();
            expect(await findByTestId('legend-in-progress')).toBeTruthy();
            expect(await findByTestId('legend-missed')).toBeTruthy();
            expect(await findByText('Hoy')).toBeTruthy();
            expect(await findByText('Completado')).toBeTruthy();
        });
    });

    describe('CalendarFab', () => {
        it('renders fab button and triggers onPress', async () => {
            const mockPress = jest.fn();
            const screen = await render(
                <CalendarFab colors={mockColors} onPress={mockPress} />
            );

            const fab = await screen.findByTestId('edit-routine-fab');
            expect(fab).toBeTruthy();
            fireEvent.press(fab);
            expect(mockPress).toHaveBeenCalledTimes(1);
        });
    });

    describe('RoutineSelectorDropdown', () => {
        const mockRoutines: WeeklyRoutine[] = [
            { id: 'r-1', nombre: 'Torso Pierna', activa: true },
            { id: 'r-2', nombre: 'Push Pull Legs', activa: false },
        ];

        it('renders selector button and triggers onToggle', async () => {
            const mockToggle = jest.fn();
            const { findByTestId } = await render(
                <RoutineSelectorDropdown
                    selectedRoutine={mockRoutines[0]}
                    routines={mockRoutines}
                    showRoutineSelector={false}
                    dropdownHeight={new Animated.Value(0)}
                    colors={mockColors}
                    onToggle={mockToggle}
                    onSelectRoutine={jest.fn()}
                    onActivateRoutine={jest.fn()}
                />
            );

            const toggleBtn = await findByTestId('routine-selector-button');
            expect(toggleBtn).toBeTruthy();
            fireEvent.press(toggleBtn);
            expect(mockToggle).toHaveBeenCalledTimes(1);
        });

        it('displays active routine icon and handles selection & activation', async () => {
            const mockSelect = jest.fn();
            const mockActivate = jest.fn();

            const { findByTestId, findByText } = await render(
                <RoutineSelectorDropdown
                    selectedRoutine={mockRoutines[0]}
                    routines={mockRoutines}
                    showRoutineSelector={true}
                    dropdownHeight={new Animated.Value(112)}
                    colors={mockColors}
                    onToggle={jest.fn()}
                    onSelectRoutine={mockSelect}
                    onActivateRoutine={mockActivate}
                />
            );

            expect(await findByTestId('routine-active-check-r-1')).toBeTruthy();
            const activateBtn = await findByTestId('routine-activate-button-r-2');
            expect(activateBtn).toBeTruthy();

            const routineItem = await findByText('Push Pull Legs');
            fireEvent.press(routineItem);
            expect(mockSelect).toHaveBeenCalledWith(mockRoutines[1]);

            fireEvent.press(activateBtn);
            expect(mockActivate).toHaveBeenCalledWith('r-2');
        });
    });
});
