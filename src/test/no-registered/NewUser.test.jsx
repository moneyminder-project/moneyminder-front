import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import NewUser from '../../components/no-registered/NewUser.jsx';
import * as AuthContext from '../../contexts/AuthContext.jsx';
import * as UserApiService from '../../serviceApiCalls/UserApiService.jsx';

vi.mock('../../hooks/commonHooks/useTitle.jsx', () => ({
    useTitleWithAppName: () => {},
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: () => <span data-testid="eye-icon" />,
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('NewUser Component Test', () => {
    const mockSetAuthToken = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();

        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            setAuthToken: mockSetAuthToken,
        });
    });

    const fillForm = ({
                          username = 'usuario1',
                          email = 'user@example.com',
                          password = '12345',
                          passwordConfirmation = '12345',
                      } = {}) => {
        fireEvent.change(screen.getByPlaceholderText(/username/i), {
            target: { name: 'username', value: username },
        });
        fireEvent.change(screen.getByPlaceholderText(/email/i), {
            target: { name: 'email', value: email },
        });
        fireEvent.change(screen.getByPlaceholderText(/^contraseña$/i), {
            target: { name: 'password', value: password },
        });
        fireEvent.change(screen.getByPlaceholderText(/confirmar contraseña/i), {
            target: { name: 'passwordConfirmation', value: passwordConfirmation },
        });
    };

    test('renders form test', () => {
        render(<MemoryRouter><NewUser /></MemoryRouter>);

        expect(screen.getByText(/¡Regístrate!/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/username/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/email/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/^contraseña$/i)).toBeInTheDocument();
        expect(screen.getByPlaceholderText(/confirmar contraseña/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Registrarme/i })).toBeInTheDocument();
    });

    test('shows error when fields are missing test', () => {
        render(<MemoryRouter><NewUser /></MemoryRouter>);
        fireEvent.click(screen.getByRole('button', { name: /Registrarme/i }));
        expect(screen.getByText(/Falta alguno de los datos de registro/i)).toBeInTheDocument();
    });

    test('shows error for short username test', () => {
        render(<MemoryRouter><NewUser /></MemoryRouter>);
        fillForm({ username: 'abc' });
        fireEvent.click(screen.getByRole('button', { name: /Registrarme/i }));
        expect(screen.getByText(/al menos, 5 caracteres/i)).toBeInTheDocument();
    });

    test('shows error for invalid username characters test', () => {
        render(<MemoryRouter><NewUser /></MemoryRouter>);
        fillForm({ username: 'abc!!' });
        fireEvent.click(screen.getByRole('button', { name: /Registrarme/i }));
        expect(screen.getByText(/solo puede contener letras, números y guiones bajos/i)).toBeInTheDocument();
    });

    test('shows error for invalid email test', () => {
        render(<MemoryRouter><NewUser /></MemoryRouter>);
        fillForm({ email: 'noemail.com' });
        fireEvent.click(screen.getByRole('button', { name: /Registrarme/i }));
        expect(screen.getByText(/no tiene un formato válido/i)).toBeInTheDocument();
    });

    test('shows error for short password test', () => {
        render(<MemoryRouter><NewUser /></MemoryRouter>);
        fillForm({ password: '123', passwordConfirmation: '123' });
        fireEvent.click(screen.getByRole('button', { name: /Registrarme/i }));
        expect(screen.getByText(/contraseña debe tener, como mínimo, 5 caracteres/i)).toBeInTheDocument();
    });

    test('shows error for password with spaces test', () => {
        render(<MemoryRouter><NewUser /></MemoryRouter>);
        fillForm({ password: 'abc def', passwordConfirmation: 'abc def' });
        fireEvent.click(screen.getByRole('button', { name: /Registrarme/i }));
        expect(screen.getByText(/no debe contener espacios en blanco/i)).toBeInTheDocument();
    });

    test('shows error for password confirmation dismiss test', () => {
        render(<MemoryRouter><NewUser /></MemoryRouter>);
        fillForm({ password: 'abcdef', passwordConfirmation: 'abc123' });
        fireEvent.click(screen.getByRole('button', { name: /Registrarme/i }));
        expect(screen.getByText(/no coinciden/i)).toBeInTheDocument();
    });

    test('shows error if API returns failure test', async () => {
        vi.spyOn(UserApiService, 'registerUser').mockResolvedValueOnce({ ok: false });

        render(<MemoryRouter><NewUser /></MemoryRouter>);
        fillForm();
        fireEvent.click(screen.getByRole('button', { name: /Registrarme/i }));

        await waitFor(() => {
            expect(screen.getByText(/ya existen/i)).toBeInTheDocument();
        });
    });

    test('shows error if token returned is invalid test', async () => {
        vi.spyOn(UserApiService, 'registerUser').mockResolvedValueOnce({
            ok: true,
            respuesta: { accessToken: 'notajwt' },
        });

        render(<MemoryRouter><NewUser /></MemoryRouter>);
        fillForm();
        fireEvent.click(screen.getByRole('button', { name: /Registrarme/i }));

        await waitFor(() => {
            expect(screen.getByText(/ha fallado el registro/i)).toBeInTheDocument();
        });
    });

    test('setAuthToken and navigates on successful registration test', async () => {
        vi.spyOn(UserApiService, 'registerUser').mockResolvedValueOnce({
            ok: true,
            respuesta: { accessToken: 'valid.token.jwt' },
        });

        render(<MemoryRouter><NewUser /></MemoryRouter>);
        fillForm();
        fireEvent.click(screen.getByRole('button', { name: /Registrarme/i }));

        await waitFor(() => {
            expect(mockSetAuthToken).toHaveBeenCalledWith('valid.token.jwt');
            expect(mockNavigate).toHaveBeenCalledWith('/');
        });
    });
});
