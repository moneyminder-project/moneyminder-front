import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import Requests from '../../components/requests/Requests.jsx';

import * as AuthContext from '../../contexts/AuthContext.jsx';
import * as BudgetApiService from '../../serviceApiCalls/BudgetApiService.jsx';
import * as RequestApiService from '../../serviceApiCalls/RequestApiService.jsx';
import * as UserApiService from '../../serviceApiCalls/UserApiService.jsx';

vi.mock('../../hooks/commonHooks/useTitle.jsx', () => ({
    useTitleWithAppName: () => {},
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: () => <span data-testid="icon" />,
}));

vi.mock('../../utils/SwalUtils.jsx', () => ({
    errorSwal: vi.fn(),
    successSwal: vi.fn()
}));

vi.mock('sweetalert2', () => {
    return {
        default: {
            fire: vi.fn().mockResolvedValue({ isConfirmed: true }),
        }
    };
});

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

describe('Requests Component', () => {
    const userName = 'usuario1';

    beforeEach(() => {
        vi.clearAllMocks();

        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ userName });
        vi.spyOn(BudgetApiService, 'getBudgets').mockResolvedValue({ ok: true, respuesta: [] });
        vi.spyOn(RequestApiService, 'getRequestsByUsername').mockResolvedValue({ ok: true, respuesta: [] });
    });

    test('renders correctly with no budgets and requests', async () => {
        render(
            <MemoryRouter>
                <Requests />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Solicitudes de presupuestos/i)).toBeInTheDocument();
        });

        expect(screen.getByDisplayValue('No tienes presupuestos')).toBeInTheDocument();
        expect(screen.getByText(/No tienes solicitudes pendientes de resolver/i)).toBeInTheDocument();
        expect(screen.getByText(/No tienes solicitudes resueltas/i)).toBeInTheDocument();
    });

    test('shows error if budgets API fails test', async () => {
        vi.spyOn(BudgetApiService, 'getBudgets').mockResolvedValueOnce({ ok: false });

        render(<MemoryRouter><Requests /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText(/No se han podido obtener los presupuestos del usuario/i)).toBeInTheDocument();
        });
    });

    test('shows error if requests API fails test test', async () => {
        vi.spyOn(RequestApiService, 'getRequestsByUsername').mockResolvedValueOnce({ ok: false });

        render(<MemoryRouter><Requests /></MemoryRouter>);

        await waitFor(() => {
            expect(screen.getByText(/No se han podido obtener las solicitudes del usuario/i)).toBeInTheDocument();
        });
    });

    test('navigates to budget creation page test', async () => {
        render(<MemoryRouter><Requests /></MemoryRouter>);

        await waitFor(() => screen.getByRole('button', { name: /Crear presupuesto/i }));

        fireEvent.click(screen.getByRole('button', { name: /Crear presupuesto/i }));

        expect(mockNavigate).toHaveBeenCalledWith('/budget');
    });
});