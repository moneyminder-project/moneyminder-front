import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import UpdateUserInfo from '../../components/user-options/UpdateUserInfo.jsx';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import * as UserApiService from '../../serviceApiCalls/UserApiService.jsx';

vi.mock('../../hooks/commonHooks/useTitle.jsx', () => ({
    useTitleWithAppName: () => {},
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: () => <span data-testid="icon" />,
}));

vi.mock('sweetalert2', () => {
    return {
        default: {
            fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
        }
    };
});


describe('UpdateUserInfo Component', () => {
    const userName = 'usuario1';

    beforeEach(() => {
        vi.clearAllMocks();

        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ userName });
        vi.spyOn(UserApiService, 'getUser').mockResolvedValue({ respuesta: { email: 'test@example.com' } });
        vi.spyOn(UserApiService, 'updateUserData').mockResolvedValue({ ok: true });
    });

    test('renders form with user email test', async () => {
        render(<MemoryRouter><UpdateUserInfo /></MemoryRouter>);

        expect(await screen.findByDisplayValue('test@example.com')).toBeInTheDocument();
    });

    test('shows error if email is empty test', async () => {
        render(<MemoryRouter><UpdateUserInfo /></MemoryRouter>);

        await screen.findByDisplayValue('test@example.com');
        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: '' } });
        fireEvent.click(screen.getByRole('button', { name: /Modificar datos/i }));

        expect(await screen.findByText(/Falta el correo electrónico/i)).toBeInTheDocument();
    });

    test('shows error for invalid email test', async () => {
        render(<MemoryRouter><UpdateUserInfo /></MemoryRouter>);

        await screen.findByDisplayValue('test@example.com');
        fireEvent.change(screen.getByPlaceholderText(/email/i), { target: { value: 'invalid-email' } });
        fireEvent.click(screen.getByRole('button', { name: /Modificar datos/i }));

        expect(await screen.findByText(/formato válido/i)).toBeInTheDocument();
    });

    test('shows error for missing password fields test', async () => {
        render(<MemoryRouter><UpdateUserInfo /></MemoryRouter>);

        await screen.findByDisplayValue('test@example.com');
        fireEvent.click(screen.getByRole('button', { name: /Modificar contraseña/i }));
        fireEvent.click(screen.getByRole('button', { name: /Modificar datos/i }));

        expect(await screen.findByText(/Falta algún campo de contraseñas/i)).toBeInTheDocument();
    });

    test('submits successfully with valid data test', async () => {
        render(<MemoryRouter><UpdateUserInfo /></MemoryRouter>);

        await screen.findByDisplayValue('test@example.com');
        fireEvent.click(screen.getByRole('button', { name: /Modificar datos/i }));

        await waitFor(() => {
            expect(UserApiService.updateUserData).toHaveBeenCalled();
        });
    });
});
