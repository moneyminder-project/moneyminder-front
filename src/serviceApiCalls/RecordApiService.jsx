import {makeDeleteRequest, makeGetRequest, makePostRequest, makePutRequest} from "./BaseApiService.jsx";
import {API_BASE_URL} from "../config.jsx";

export async function getRecords(params) {
    return await makeGetRequest(`${API_BASE_URL}/expenses/record`, params);
}

export async function getRecordById(recordId) {
    return await makeGetRequest(`${API_BASE_URL}/expenses/record/${recordId}`);
}

export async function getRecordsByBudgetId(budgetId) {
    return await makeGetRequest(`${API_BASE_URL}/expenses/record/by-budget/${budgetId}`);
}

export async function createRecord(type, name, money, date, comment, owner, details, budgets) {
    const user = {
        type: type,
        name: name,
        money: money,
        date: date,
        comment: comment,
        owner: owner,
        details: details,
        budgets: budgets
    }

    return await makePostRequest(`${API_BASE_URL}/expenses/record`, user);
}

export async function updateRecord(recordId, type, name, money, date, comment, owner, details, budgets) {
    const user = {
        id: recordId,
        type: type,
        name: name,
        money: money,
        date: date,
        comment: comment,
        owner: owner,
        details: details,
        budgets: budgets
    }

    return await makePutRequest(`${API_BASE_URL}/expenses/record/${recordId}`, user);
}

export async function deleteRecord(recordId) {
    return await makeDeleteRequest(`${API_BASE_URL}/expenses/record/${recordId}`);
}