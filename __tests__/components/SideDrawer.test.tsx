import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { SideDrawer, MenuItem } from '../../src/components/SideDrawer';

describe('SideDrawer Component (RNTL)', () => {
    const mockOnClose = jest.fn();
    const mockItemPress1 = jest.fn();
    const mockItemPress2 = jest.fn();

    const mockMenuItems: MenuItem[] = [
        { icon: 'person', label: 'Mi Perfil', onPress: mockItemPress1 },
        { icon: 'settings', label: 'Configuración', onPress: mockItemPress2 },
    ];

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('renders drawer header and menu items when visible', async () => {
        const { getByText } = await render(
            <SideDrawer
                visible={true}
                onClose={mockOnClose}
                menuItems={mockMenuItems}
            />
        );

        expect(getByText('PressFit')).toBeTruthy();
        expect(getByText('Mi Perfil')).toBeTruthy();
        expect(getByText('Configuración')).toBeTruthy();
    });

    it('calls onClose and item.onPress when a menu item is pressed', async () => {
        const { getByText } = await render(
            <SideDrawer
                visible={true}
                onClose={mockOnClose}
                menuItems={mockMenuItems}
            />
        );

        fireEvent.press(getByText('Mi Perfil'));

        expect(mockOnClose).toHaveBeenCalledTimes(1);
        expect(mockItemPress1).toHaveBeenCalledTimes(1);
        expect(mockItemPress2).not.toHaveBeenCalled();
    });
});
