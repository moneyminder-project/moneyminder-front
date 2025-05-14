import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import Budgets from '../../components/budgets/Budgets.jsx';
import * as BudgetApiService from '../../serviceApiCalls/BudgetApiService';
import * as responsiveHooks from '../../hooks/responsiveHooks';

vi.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: () => <span data-testid="icon" />,
}));

vi.mock('../../hooks/responsiveHooks', () => ({
    useIsMenuMobile: vi.fn(),
    useIsTableMobile: vi.fn(),
    useIsButtonMobile: vi.fn(),
    useIsLineButtonsInTable: vi.fn(),
}));

vi.mock('../../serviceApiCalls/BudgetApiService', () => ({
    getBudgets: vi.fn(),
    deleteBudget: vi.fn(),
}));

vi.mock('sweetalert2', () => ({
    __esModule: true,
    default: {
        fire: vi.fn(() => Promise.resolve({ isConfirmed: false }))
    },
    fire: vi.fn(() => Promise.resolve({ isConfirmed: false }))
}));


vi.mock('../../utils/SwalUtils.jsx', () => ({
    errorSwal: vi.fn(),
    successSwal: vi.fn(),
}));

describe('Budgets Component Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        responsiveHooks.useIsMenuMobile.mockReturnValue(false);
        responsiveHooks.useIsTableMobile.mockReturnValue(false);
        responsiveHooks.useIsLineButtonsInTable.mockReturnValue(true);
    });

    test('render header and create budget button test', async () => {
        BudgetApiService.getBudgets.mockResolvedValueOnce({ ok: true, respuesta: [] });

        render(
            <MemoryRouter>
                <Budgets />
            </MemoryRouter>
        );

        expect(await screen.findByText(/Presupuestos/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Crear presupuesto/i })).toBeInTheDocument();
    });

    test('no budgets returned test', async () => {
        BudgetApiService.getBudgets.mockResolvedValueOnce({ ok: true, respuesta: [] });

        render(
            <MemoryRouter>
                <Budgets />
            </MemoryRouter>
        );

        expect(await screen.findByText(/No tienes presupuestos para los criterios/i)).toBeInTheDocument();
    });

    test('shows budgets in table test', async () => {
        BudgetApiService.getBudgets.mockResolvedValueOnce({
            ok: true,
            respuesta: [
                {
                    id: 1,
                    name: 'Presupuesto Test',
                    startDate: '2023-01-01',
                    endDate: '2023-12-31',
                    expensesLimit: 5000,
                    totalExpenses: 2000,
                    totalIncomes: 3000,
                    favorite: true,
                },
            ],
        });

        render(
            <MemoryRouter>
                <Budgets />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Presupuesto Test/)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Detalle/i })).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Eliminar/i })).toBeInTheDocument();
        });
    });

    test('shows error message when API call fails test', async () => {
        BudgetApiService.getBudgets.mockResolvedValueOnce({ ok: false });

        render(
            <MemoryRouter>
                <Budgets />
            </MemoryRouter>
        );

        expect(await screen.findByText(/No se han podido obtener los presupuestos del usuario/i)).toBeInTheDocument();
    });

    test('delete budget cancels on Swal cancel test', async () => {
        BudgetApiService.getBudgets.mockResolvedValueOnce({
            ok: true,
            respuesta: [
                {
                    id: 1,
                    name: 'Presupuesto Test',
                    startDate: '2023-01-01',
                    endDate: '2023-12-31',
                    expensesLimit: 5000,
                    totalExpenses: 2000,
                    totalIncomes: 3000,
                    favorite: true,
                },
            ],
        });

        render(
            <MemoryRouter>
                <Budgets />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/Presupuesto Test/)).toBeInTheDocument();
        });

        const deleteBtn = screen.getByRole('button', { name: /Eliminar/i });
        deleteBtn.click();

        await waitFor(() => {
            expect(BudgetApiService.deleteBudget).not.toHaveBeenCalled();
        });
    });
});
