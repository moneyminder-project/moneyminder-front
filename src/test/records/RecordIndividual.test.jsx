import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';
import RecordIndividual from '../../components/records/RecordIndividual.jsx';

import * as AuthContext from '../../contexts/AuthContext.jsx';
import * as BudgetApiService from '../../serviceApiCalls/BudgetApiService.jsx';
import * as RecordApiService from '../../serviceApiCalls/RecordApiService.jsx';
import * as DetailApiService from '../../serviceApiCalls/DetailApiService.jsx';

vi.mock('../../hooks/commonHooks/useTitle.jsx', () => ({
    useTitleWithAppName: () => {},
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: () => <span data-testid="icon" />,
}));

vi.mock('../../utils/SwalUtils.jsx', () => ({
    errorSwal: vi.fn(),
    successSwal: vi.fn(),
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
        useParams: () => ({ recordId: undefined }),
    };
});

describe('RecordIndividual Component Test', () => {
    const userName = 'testuser';

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ userName });
        vi.spyOn(BudgetApiService, 'getBudgets').mockResolvedValue({ ok: true, respuesta: [] });
        vi.spyOn(RecordApiService, 'getRecordById').mockResolvedValue({ ok: true, respuesta: {} });
        vi.spyOn(DetailApiService, 'getDetails').mockResolvedValue({ ok: true, respuesta: [] });
    });

    test('renders form for new record test', async () => {
        render(
            <MemoryRouter>
                <RecordIndividual />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Datos:/i)).toBeInTheDocument();
        });
        expect(screen.getAllByRole('textbox')[0]).toBeInTheDocument();
        expect(screen.getAllByRole('spinbutton')[0]).toBeInTheDocument();
    });

    test('shows error if required fields are missing test', async () => {
        render(
            <MemoryRouter>
                <RecordIndividual />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText(/Datos:/i));

        fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

        expect(await screen.findByText(/El registro debe tener nombre, importe y fecha de registro/i)).toBeInTheDocument();
    });

    test('navigate back test', async () => {
        render(
            <MemoryRouter>
                <RecordIndividual />
            </MemoryRouter>
        );

        await waitFor(() => screen.getByText(/Detalle de registro|Nuevo registro/i));
        fireEvent.click(screen.getByRole('button', { name: /Ir atrás/i }));

        expect(mockNavigate).toHaveBeenCalledWith(-1);
    });

});

