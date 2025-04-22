export async function makeGetRequest(url, requestParams = {}) {
    try {
        const token = localStorage.getItem('authToken');

        const normalizedParams = Object.entries(requestParams)
            .filter(([, value]) => value !== null && value !== undefined)
            .flatMap(([key, value]) =>
                Array.isArray(value)
                    ? value.map(v => [key, v])
                    : [[key, value]]
            );

        const queryString = new URLSearchParams(normalizedParams).toString();

        const fullUrl = queryString ? `${url}?${queryString}` : url;

        const response = await fetch(fullUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
        });

        const contentType = response.headers.get('Content-Type') || '';
        let data;

        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            return { ok: false, respuesta: data };
        }
        return { ok: true, respuesta: data };
    } catch (error) {
        console.error('Error in GET request:', error);
        return { ok: false, respuesta: error.message };
    }
}

export async function makePostRequest(url, data) {
    try {
        const token = localStorage.getItem('authToken');

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(data),
        });
        const contentType = response.headers.get('Content-Type') || '';
        let responseData;

        if (contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        if (!response.ok) {
            return { ok: false, respuesta: responseData };
        }

        return { ok: true, respuesta: responseData };

    } catch (error) {
        console.error('Error in POST request:', error);
        return { ok: false, respuesta: error.message };
    }
}

export async function makePutRequest(url, data) {
    try {
        const token = localStorage.getItem('authToken');

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(data),
        });

        const contentType = response.headers.get('Content-Type') || '';
        let responseData;

        if (contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        if (!response.ok) {
            return { ok: false, respuesta: responseData };
        }
        return { ok: true, respuesta: responseData };
    } catch (error) {
        console.error('Error in PUT request:', error);
        return { ok: false, respuesta: error.message };
    }
}

export async function makeDeleteRequest(url) {
    try {
        const token = localStorage.getItem('authToken');

        const response = await fetch(url, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
        });

        const contentType = response.headers.get('Content-Type') || '';
        let data;

        if (contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = await response.text();
        }

        if (!response.ok) {
            return { ok: false, respuesta: data };
        }
        return { ok: true, respuesta: data };
    } catch (error) {
        console.error('Error in DELETE request:', error);
        return { ok: false, respuesta: error.message };
    }
}

export async function makePatchRequest(url, data) {
    try {
        const token = localStorage.getItem('authToken');

        const response = await fetch(url, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            },
            body: JSON.stringify(data),
        });
        const contentType = response.headers.get('Content-Type') || '';
        let responseData;

        if (contentType.includes('application/json')) {
            responseData = await response.json();
        } else {
            responseData = await response.text();
        }

        if (!response.ok) {
            return { ok: false, respuesta: responseData };
        }
        return { ok: true, respuesta: responseData };
    } catch (error) {
        console.error('Error in PATCH request:', error);
        return { ok: false, respuesta: error.message };
    }
}