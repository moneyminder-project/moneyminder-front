import {makeGetRequest} from "./BaseApiService.jsx";
import {API_BASE_URL} from "../config.jsx";

export async function getUsernameByGroup(groupId) {
    return await makeGetRequest(`${API_BASE_URL}/users/group/usernames-of/${groupId}`);
}