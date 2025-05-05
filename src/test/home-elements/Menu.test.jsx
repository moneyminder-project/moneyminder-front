import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import Menu from '../../components/home-elements/Menu.jsx';

vi.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: (props) => <span data-testid={`icon-${props.icon[1]}`} />,
}));

const localStorageMock = (() => {
    let store = {};
    return {
        getItem: (key) => store[key] || null,
        setItem: (key, value) => { store[key] = value.toString(); },
        clear: () => { store = {}; },
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('Menu Component Test', () => {
    beforeEach(() => {
        localStorage.clear();
    });

    test('renders all menu items and collapse button test', () => {
        render(
            <MemoryRouter>
                <Menu />
            </MemoryRouter>
        );

        expect(screen.getByTestId('icon-home')).toBeInTheDocument();
        expect(screen.getByTestId('icon-money-bill-wave')).toBeInTheDocument();
        expect(screen.getByTestId('icon-wallet')).toBeInTheDocument();
        expect(screen.getByTestId('icon-users')).toBeInTheDocument();
        expect(screen.getByRole('button')).toBeInTheDocument();
    });

    test('collapses and expands the menu test', () => {
        render(
            <MemoryRouter>
                <Menu />
            </MemoryRouter>
        );

        const collapseButton = screen.getByRole('button');
        expect(screen.getByText('Contraer')).toBeInTheDocument();

        fireEvent.click(collapseButton);

        expect(screen.queryByText('Contraer')).not.toBeInTheDocument();
        expect(localStorage.getItem('menuCollapsed')).toBe('true');

        fireEvent.click(collapseButton);

        expect(screen.getByText('Contraer')).toBeInTheDocument();
        expect(localStorage.getItem('menuCollapsed')).toBe('false');
    });

    test('restores collapsed state from localStorage init test', () => {
        localStorage.setItem('menuCollapsed', 'true');

        render(
            <MemoryRouter>
                <Menu />
            </MemoryRouter>
        );

        expect(screen.queryByText('Contraer')).not.toBeInTheDocument();
    });
});
