import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import Records from '../../components/records/Records.jsx';

import * as RecordApiService from '../../serviceApiCalls/RecordApiService';
import * as BudgetApiService from '../../serviceApiCalls/BudgetApiService';
import * as responsiveHooks from '../../hooks/responsiveHooks';

vi.mock('sweetalert2', () => ({
    __esModule: true,
    default: {
        fire: vi.fn(() => Promise.resolve({ isConfirmed: false }))
    },
    fire: vi.fn(() => Promise.resolve({ isConfirmed: false }))
}));

vi.mock('../../hooks/commonHooks/useTitle.jsx', () => ({
    useTitleWithAppName: () => {},
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: () => <span data-testid="icon" />,
}));

vi.mock('../../hooks/responsiveHooks', () => ({
    useIsMenuMobile: vi.fn(),
    useIsTableMobile: vi.fn(),
    useIsLineButtonsInTable: vi.fn(),
}));

vi.mock('../../serviceApiCalls/RecordApiService', () => ({
    getRecords: vi.fn(),
    deleteRecord: vi.fn(),
}));

vi.mock('../../serviceApiCalls/BudgetApiService', () => ({
    getBudgets: vi.fn(),
}));

vi.mock('../../utils/SwalUtils', () => ({
    errorSwal: vi.fn(),
    successSwal: vi.fn(),
}));

describe('Records Component', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        responsiveHooks.useIsMenuMobile.mockReturnValue(false);
        responsiveHooks.useIsTableMobile.mockReturnValue(false);
        responsiveHooks.useIsLineButtonsInTable.mockReturnValue(true);
    });

    test('renders loading state test', async () => {
        RecordApiService.getRecords.mockResolvedValueOnce({ ok: true, respuesta: [] });
        BudgetApiService.getBudgets.mockResolvedValueOnce({ ok: true, respuesta: [] });

        render(
            <MemoryRouter>
                <Records />
            </MemoryRouter>
        );

        expect(await screen.findByText(/Registros/i)).toBeInTheDocument();
    });

    test('shows error if record API fails test', async () => {
        RecordApiService.getRecords.mockResolvedValueOnce({ ok: false });
        BudgetApiService.getBudgets.mockResolvedValueOnce({ ok: true, respuesta: [] });

        render(
            <MemoryRouter>
                <Records />
            </MemoryRouter>
        );

        expect(await screen.findByText(/No se han podido obtener los registros del usuario/i)).toBeInTheDocument();
    });

    test('shows error if budget API fails test', async () => {
        RecordApiService.getRecords.mockResolvedValueOnce({ ok: true, respuesta: [] });
        BudgetApiService.getBudgets.mockResolvedValueOnce({ ok: false });

        render(
            <MemoryRouter>
                <Records />
            </MemoryRouter>
        );

        expect(await screen.findByText(/No se han podido obtener los presupuestos del usuario/i)).toBeInTheDocument();
    });

    test('displays record in table test', async () => {
        RecordApiService.getRecords.mockResolvedValueOnce({
            ok: true,
            respuesta: [
                {
                    id: 1,
                    name: 'Registro Test',
                    date: '2024-05-01',
                    type: 'EXPENSE',
                    money: 200,
                    comment: 'Comida',
                    budgets: [101]
                },
            ],
        });

        BudgetApiService.getBudgets.mockResolvedValueOnce({
            ok: true,
            respuesta: [
                { id: 101, name: 'Presupuesto A' },
            ],
        });

        render(
            <MemoryRouter>
                <Records />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Registro Test/i)).toBeInTheDocument();
            expect(screen.getByText(/Comida/i)).toBeInTheDocument();
            expect(screen.getByText(/Presupuesto A/i)).toBeInTheDocument();
        });
    });

    test('cancel delete confirmation test', async () => {
        RecordApiService.getRecords.mockResolvedValueOnce({
            ok: true,
            respuesta: [
                {
                    id: 1,
                    name: 'Registro Test',
                    date: '2024-05-01',
                    type: 'EXPENSE',
                    money: 200,
                    comment: 'Comida',
                    budgets: []
                },
            ],
        });

        BudgetApiService.getBudgets.mockResolvedValueOnce({
            ok: true,
            respuesta: [],
        });

        render(
            <MemoryRouter>
                <Records />
            </MemoryRouter>
        );

        const deleteButton = await screen.findByRole('button', { name: /Eliminar/i });
        fireEvent.click(deleteButton);

        await waitFor(() => {
            expect(RecordApiService.deleteRecord).not.toHaveBeenCalled();
        });
    });
});
