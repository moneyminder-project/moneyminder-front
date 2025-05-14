import {makeGetRequest, makePostRequest, makePutRequest, makeDeleteRequest} from "./BaseApiService.jsx";
import {API_BASE_URL} from "../config.jsx";

export async function getBudgets(params = {}) {
    return await makeGetRequest(`${API_BASE_URL}/expenses/budget`, params);
}

export async function getBudgetById(budgetId) {
    return await makeGetRequest(`${API_BASE_URL}/expenses/budget/${budgetId}`);
}

export async function createBudget(name, comment, startDate, endDate, expenseLimit, favourite) {
    const budget = {
        name: name,
        comment: comment,
        startDate: startDate,
        endDate: endDate,
        expensesLimit: expenseLimit,
        favorite: favourite
    }

    return await makePostRequest(`${API_BASE_URL}/expenses/budget`, budget);
}

export async function updateBudget(id, name, comment, startDate, endDate, expenseLimit, favourite) {
    const budget = {
        id: id,
        name: name,
        comment: comment,
        startDate: startDate,
        endDate: endDate,
        expensesLimit: expenseLimit,
        favorite: favourite
    }

    return await makePutRequest(`${API_BASE_URL}/expenses/budget/${id}`, budget);
}

export async function deleteBudget(id) {
    return await makeDeleteRequest(`${API_BASE_URL}/expenses/budget/${id}`);
}