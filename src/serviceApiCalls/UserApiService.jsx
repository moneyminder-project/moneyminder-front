import {makeGetRequest, makePostRequest, makePutRequest} from "./BaseApiService.jsx";
import {API_BASE_URL} from "../config.jsx";

export async function getUser(username) {
    return await makeGetRequest(`${API_BASE_URL}/users/user/${username}`);
}


export async function loginUser(username, password) {
    const loginRequestData = {
        username: username,
        password: password
    }

    return await makePostRequest(`${API_BASE_URL}/users/auth/login`, loginRequestData);
}

export async function registerUser(username, email, password) {
    const user = {
        username: username,
        email: email,
        password: password
    }

    return await makePostRequest(`${API_BASE_URL}/users/user/new-user`, user);
}

export async function updateUserData(username, email, oldPassword, newPassword) {
    const userData = {
        username: username,
        email: email,
        oldPassword: oldPassword,
        newPassword: newPassword
    }

    return await makePutRequest(`${API_BASE_URL}/users/user/update-user-data`, userData);
}