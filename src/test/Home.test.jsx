import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';

import Home from '../components/Home';
import * as RecordApiService from '../serviceApiCalls/RecordApiService';
import * as BudgetApiService from '../serviceApiCalls/BudgetApiService';
import * as responsiveHooks from '../hooks/responsiveHooks';

vi.mock('../contexts/AuthContext.jsx', async () => {
    const React = await import('react');
    return {
        useAuth: () => ({ userName: 'Usuario Test' }),
    };
});

vi.mock('../serviceApiCalls/RecordApiService', () => ({
    getRecords: vi.fn(),
}));

vi.mock('../serviceApiCalls/BudgetApiService', () => ({
    getBudgets: vi.fn(),
}));

vi.mock('../hooks/commonHooks/useTitle', () => ({
    useTitle: () => {},
}));

vi.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: () => <span data-testid="icon" />,
}));

vi.mock('../hooks/responsiveHooks', () => ({
    useIsMenuMobile: vi.fn(),
    useIsTableMobile: vi.fn(),
    useIsButtonMobile: vi.fn(),
    useIsLineButtonsInTable: vi.fn(),
}));

describe('Home Component Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        responsiveHooks.useIsMenuMobile.mockReturnValue(false);
        responsiveHooks.useIsTableMobile.mockReturnValue(false);
    });

    test('Render header and add new record button test', async () => {
        RecordApiService.getRecords.mockResolvedValueOnce({ ok: true, respuesta: [] });
        BudgetApiService.getBudgets.mockResolvedValueOnce({ ok: true, respuesta: [] });

        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        expect(await screen.findByText(/Bienvenido Usuario Test/i)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /Añadir registro/i })).toBeInTheDocument();
    });

    test('No favourite budgets test', async () => {
        RecordApiService.getRecords.mockResolvedValueOnce({ ok: true, respuesta: [] });
        BudgetApiService.getBudgets.mockResolvedValueOnce({ ok: true, respuesta: [] });

        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        expect(await screen.findByText(/No tienes presupuestos favoritos/i)).toBeInTheDocument();
    });

    test('Show favourite budgets test', async () => {
        RecordApiService.getRecords.mockResolvedValueOnce({ ok: true, respuesta: [] });
        BudgetApiService.getBudgets.mockResolvedValueOnce({
            ok: true,
            respuesta: [{
                id: 1,
                name: 'Presupuesto Test',
                startDate: '2023-01-01',
                endDate: '2023-12-31',
                expensesLimit: 5000,
                totalExpenses: 2500,
                totalIncomes: 3000
            }]
        });

        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByRole('table')).toBeInTheDocument();
            expect(screen.getByText(/Presupuesto Test/)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /Detalle/i })).toBeInTheDocument();
        });
    });

    test('Get records error test', async () => {
        RecordApiService.getRecords.mockResolvedValueOnce({ ok: false, respuesta: 'Error' });
        BudgetApiService.getBudgets.mockResolvedValueOnce({ ok: true, respuesta: [] });

        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        expect(await screen.findByText(/No se han podido obtener los registros del usuario/i)).toBeInTheDocument();
    });

    test('Get budgets error test', async () => {
        RecordApiService.getRecords.mockImplementationOnce(() => {
            throw new Error('Error inesperado');
        });

        BudgetApiService.getBudgets.mockResolvedValueOnce({ ok: true, respuesta: [] });

        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        expect(await screen.findByText(/No se han podido obtener los presupuestos del usuario/i)).toBeInTheDocument();
    });

    test('Total expenses in month test', async () => {
        RecordApiService.getRecords.mockResolvedValueOnce({
            ok: true,
            respuesta: [
                { money: 1000.5 },
                { money: 249.45 }
            ]
        });

        BudgetApiService.getBudgets.mockResolvedValueOnce({ ok: true, respuesta: [] });

        render(
            <MemoryRouter>
                <Home />
            </MemoryRouter>
        );

        expect(await screen.findByText(/1\.249,95 €/)).toBeInTheDocument();
    });
});
