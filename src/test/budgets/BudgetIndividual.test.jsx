import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { vi } from 'vitest';

import BudgetIndividual from '../../components/budgets/BudgetIndividual.jsx';
import * as BudgetApiService from '../../serviceApiCalls/BudgetApiService';
import * as RecordApiService from '../../serviceApiCalls/RecordApiService';
import * as GroupApiService from '../../serviceApiCalls/GroupApiService';
import * as responsiveHooks from '../../hooks/responsiveHooks';

vi.mock('../../contexts/AuthContext.jsx', async () => {
    const React = await import('react');
    return {
        useAuth: () => ({ userName: 'Usuario Test' }),
    };
});

vi.mock('../../serviceApiCalls/BudgetApiService', () => ({
    getBudgetById: vi.fn(),
    updateBudget: vi.fn(),
    createBudget: vi.fn(),
    deleteBudget: vi.fn(),
}));

vi.mock('../../serviceApiCalls/RecordApiService', () => ({
    getRecordsByBudgetId: vi.fn(),
    deleteRecord: vi.fn(),
}));

vi.mock('../../serviceApiCalls/GroupApiService', () => ({
    getUsernameByGroup: vi.fn(),
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


vi.mock('@fortawesome/react-fontawesome', () => ({
    FontAwesomeIcon: () => <span data-testid="icon" />,
}));

vi.mock('../../hooks/responsiveHooks', () => ({
    useIsMenuMobile: vi.fn(),
    useIsTableMobile: vi.fn(),
    useIsButtonMobile: vi.fn(),
    useIsLineButtonsInTable: vi.fn(),
}));

describe('BudgetIndividual Component Test', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        responsiveHooks.useIsMenuMobile.mockReturnValue(false);
        responsiveHooks.useIsTableMobile.mockReturnValue(false);
        responsiveHooks.useIsButtonMobile.mockReturnValue(false);
        responsiveHooks.useIsLineButtonsInTable.mockReturnValue(true);
    });

    test('renders loading state test', () => {
        render(
            <MemoryRouter initialEntries={["/budget/1"]}>
                <Routes>
                    <Route path="/budget/:budgetId" element={<BudgetIndividual />} />
                </Routes>
            </MemoryRouter>
        );
        expect(screen.getByText(/Detalle de presupuesto/i)).toBeInTheDocument();
    });

    test('renders budget and records test', async () => {
        BudgetApiService.getBudgetById.mockResolvedValueOnce({ ok: true, respuesta: { id: '1', name: 'Test Budget', startDate: '2024-01-01', endDate: '2024-12-31', expensesLimit: 1000, favorite: true, groupId: 'g1', records: [] } });
        RecordApiService.getRecordsByBudgetId.mockResolvedValueOnce({ ok: true, respuesta: [ { id: 'r1', name: 'Compra', type: 'EXPENSE', date: '2024-05-01', money: 100, owner: 'Usuario Test', comment: 'Carne' } ] });
        GroupApiService.getUsernameByGroup.mockResolvedValueOnce({ ok: true, respuesta: ['Usuario Test'] });

        render(
            <MemoryRouter initialEntries={["/budget/1"]}>
                <Routes>
                    <Route path="/budget/:budgetId" element={<BudgetIndividual />} />
                </Routes>
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByDisplayValue('Test Budget')).toBeInTheDocument();
            expect(screen.getByText(/Compra/i)).toBeInTheDocument();
            expect(screen.getByText(/Carne/i)).toBeInTheDocument();
        });
    });

    test('error message when record API fails test', async () => {
        BudgetApiService.getBudgetById.mockResolvedValueOnce({ ok: true, respuesta: { id: '1', name: '', groupId: 'g1', records: [] } });
        RecordApiService.getRecordsByBudgetId.mockResolvedValueOnce({ ok: false });
        GroupApiService.getUsernameByGroup.mockResolvedValueOnce({ ok: true, respuesta: [] });

        render(
            <MemoryRouter initialEntries={["/budget/1"]}>
                <Routes>
                    <Route path="/budget/:budgetId" element={<BudgetIndividual />} />
                </Routes>
            </MemoryRouter>
        );

        expect(await screen.findByText(/No se han podido obtener los registros iniciales/i)).toBeInTheDocument();
    });
});
