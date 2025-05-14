import {makeGetRequest, makePostRequest, makePutRequest, makeDeleteRequest} from "./BaseApiService.jsx";
import {API_BASE_URL} from "../config.jsx";

export async function getDetails(params = {}) {
    return await makeGetRequest(`${API_BASE_URL}/expenses/detail`, params);
}

export async function createDetail(name, pricePerUnit, units, recordId) {
    const detail = {
        name: name,
        pricePerUnit: pricePerUnit,
        units: units,
        record: recordId
    }

    return await makePostRequest(`${API_BASE_URL}/expenses/detail`, detail);
}

export async function updateDetail(id, name, pricePerUnit, units, recordId) {
    const detail = {
        id: id,
        name: name,
        pricePerUnit: pricePerUnit,
        units: units,
        record: recordId
    }

    return await makePutRequest(`${API_BASE_URL}/expenses/detail/${id}`, detail);

}

export async function deleteDetail(id) {
    return await makeDeleteRequest(`${API_BASE_URL}/expenses/detail/${id}`);
}