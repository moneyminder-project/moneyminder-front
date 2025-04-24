import React, { createContext, useContext, useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import {errorSwal} from "../utils/SwalUtils.jsx";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userName, setUserName] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        checkAuthStatus();
    }, []);

    const checkAuthStatus = async () => {
        const token = localStorage.getItem('authToken');
        const isValidToken = token && token.split('.').length === 3;

        if (isValidToken) {
            try {
                const decoded = jwtDecode(token);
                const currentTime = Math.floor(Date.now() / 1000);

                if (decoded.exp && decoded.exp > currentTime) {
                    setIsAuthenticated(true);
                    loadUserFromToken(token);
                } else {
                    console.warn('Token expirado');
                    errorSwal('Sesion expirada', 'Tu sesión ha expirado, vuelve a identificarte')
                    await clearAuthToken();
                }
            } catch (error) {
                console.error('Error al decodificar el token:', error);
                await clearAuthToken();
            }
        } else {
            await clearAuthToken();
        }

        setIsLoading(false);
    };

    const setAuthToken = async (token) => {
        localStorage.setItem('authToken', token);
        const isValidToken = token && token.split('.').length === 3;

        if (isValidToken) {
            setIsAuthenticated(true);
            loadUserFromToken(token);
        }
    };

    const clearAuthToken = async () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('menuCollapsed');
        setUserName(null);
        setIsAuthenticated(false);
    };

    const loadUserFromToken = (token) => {
        try {
            const decoded = jwtDecode(token);
            if (decoded && decoded.sub) {
                setUserName(decoded.sub);
            }
        } catch (error) {
            console.error('Error decoding token:', error);
            setUserName(null);
        }
    };

    return (
        <AuthContext.Provider value={{ isAuthenticated, setAuthToken, clearAuthToken, userName: userName, isLoading }}>
        {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};
