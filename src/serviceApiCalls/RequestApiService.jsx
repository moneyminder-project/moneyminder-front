import {makeGetRequest, makePostRequest, makePutRequest} from "./BaseApiService.jsx";
import {API_BASE_URL} from "../config.jsx";

export async function getRequestsByUsername(username) {
    return await makeGetRequest(`${API_BASE_URL}/users/group-request/by-username/${username}`);
}

export async function createGroupRequest(group, requestingUser, requestedUser) {
    const request = {
        group: group,
        requestingUser: requestingUser,
        requestedUser: requestedUser
    }

    return await makePostRequest(`${API_BASE_URL}/users/group-request`, request);
}

export async function updateGroupRequest(id, requestingUser, requestedUser, accepted) {
    const request = {
        id: id,
        requestingUser: requestingUser,
        requestedUser: requestedUser,
        accepted: accepted
    }

    return await makePutRequest(`${API_BASE_URL}/users/group-request/${id}`, request);
}