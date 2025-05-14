import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import Login from '../../components/no-registered/Login.jsx';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import * as UserApiService from '../../serviceApiCalls/UserApiService.jsx';

vi.mock('../../utils/AppTexts.jsx', () => ({
    AppTexts: { appName: 'MiAppTest' },
}));

vi.mock('../../hooks/commonHooks/useTitle.jsx', () => ({
    useTitleWithAppName: () => {},
}));

vi.mock('../../assets/AppLogo.png', () => ({
    default: 'mocked-logo.png',
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Login Component Test', () => {
    const mockSetAuthToken = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            setAuthToken: mockSetAuthToken,
        });
    });

    test('renders login form test', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/contraseña/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Acceder/i })).toBeInTheDocument();
        expect(screen.getByText(/¿No estás registrado/i)).toBeInTheDocument();
    });

    test('shows error if username or password is missing test', () => {
        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.click(screen.getByRole('button', { name: /Acceder/i }));

        expect(
            screen.getByText(/Falta el nombre de usuario o la contraseña/i)
        ).toBeInTheDocument();
    });

    test('shows error on invalid credentials test', async () => {
        vi.spyOn(UserApiService, 'loginUser').mockResolvedValueOnce({ ok: false });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/username/i), {
            target: { name: 'username', value: 'user1' },
        });
        fireEvent.change(screen.getByPlaceholderText(/contraseña/i), {
            target: { name: 'password', value: 'wrongpass' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Acceder/i }));

        await waitFor(() => {
            expect(
                screen.getByText(/Las credenciales introducidas no son válidas/i)
            ).toBeInTheDocument();
        });
    });

    test('calls setAuthToken and navigates on successful login test', async () => {
        vi.spyOn(UserApiService, 'loginUser').mockResolvedValueOnce({
            ok: true,
            respuesta: { accessToken: 'fake-token' },
        });

        render(
            <MemoryRouter>
                <Login />
            </MemoryRouter>
        );

        fireEvent.change(screen.getByPlaceholderText(/username/i), {
            target: { name: 'username', value: 'user1' },
        });
        fireEvent.change(screen.getByPlaceholderText(/contraseña/i), {
            target: { name: 'password', value: '1234' },
        });

        fireEvent.click(screen.getByRole('button', { name: /Acceder/i }));

        await waitFor(() => {
            expect(mockSetAuthToken).toHaveBeenCalledWith('fake-token');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });
});

