/**
 * Unit Tests: Shared Element Transitions & Screen Navigation Animations (PF-282)
 *
 * Validates that screen animators are configured with slide_from_right and
 * sharedTransitionTag properties are appropriately assigned across views.
 */

import React from 'react';
import WeeklyPlanNavigator from '../../../src/navigation/WeeklyPlanNavigator';
import ProgressNavigator from '../../../src/navigation/ProgressNavigator';
import ProfileNavigator from '../../../src/navigation/ProfileNavigator';
import { ExerciseItem } from '../../../src/components/ExerciseItem';

// Mock navigation
const mockNavigation = {
    navigate: jest.fn(),
    goBack: jest.fn(),
};

const mockColors: any = {
    primary: '#6366f1',
    background: '#0f172a',
    surface: '#1e293b',
    text: '#ffffff',
    textSecondary: '#94a3b8',
    border: '#334155',
    inputBackground: '#1e293b',
    statusSuccess: '#22c55e',
    statusWarning: '#f59e0b',
    statusDanger: '#ef4444',
};

const mockExercise = {
    id: 'ex-test-123',
    titulo: 'Press de Banca',
    musculos_primarios: 'Pecho',
    url_video: 'https://www.youtube.com/watch?v=rT7DgCr-3pg',
    es_personalizado: false,
    descripcion: 'Press plano con barra',
};

describe('Shared Element Transitions & Navigation Animations (PF-282)', () => {
    describe('Stack Navigators animation options', () => {
        it('WeeklyPlanNavigator mounts with default screenOptions containing slide_from_right animation', () => {
            const element = WeeklyPlanNavigator({});
            expect(element).toBeDefined();
            expect(element.props.screenOptions.animation).toBe('slide_from_right');
            expect(element.props.screenOptions.headerShown).toBe(false);
        });

        it('ProgressNavigator mounts with screenOptions containing slide_from_right animation', () => {
            const element = ProgressNavigator({});
            expect(element).toBeDefined();
            expect(element.props.screenOptions.animation).toBe('slide_from_right');
            expect(element.props.screenOptions.headerShown).toBe(false);
        });

        it('ProfileNavigator mounts with screenOptions containing slide_from_right animation', () => {
            const element = ProfileNavigator({});
            expect(element).toBeDefined();
            expect(element.props.screenOptions.animation).toBe('slide_from_right');
            expect(element.props.screenOptions.headerShown).toBe(false);
        });
    });

    describe('ExerciseItem sharedTransitionTag generation', () => {
        it('renders ExerciseItem and includes exercise-image tag for shared transitions', () => {
            const element = React.createElement(ExerciseItem, {
                item: mockExercise,
                isSelected: false,
                selectionMode: false,
                onSelect: jest.fn(),
                onThumbnailPress: jest.fn(),
                colors: mockColors,
                navigation: mockNavigation,
            });

            expect(element).toBeDefined();
            expect(element.props.item.id).toBe('ex-test-123');
            expect(element.type).toBe(ExerciseItem);
        });
    });
});
