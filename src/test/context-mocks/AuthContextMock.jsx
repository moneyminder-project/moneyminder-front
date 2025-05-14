import React from 'react';

const AuthContext = React.createContext();

export const useAuth = () => React.useContext(AuthContext);

export const AuthProvider = ({
                                 children,
                                 isAuthenticated = true,
                                 isLoading = false,
                                 userName = 'TestUser',
                                 setAuthToken = () => {},
                                 clearAuthToken = () => {},
                             }) => {
    return (
        <AuthContext.Provider value={{
            isAuthenticated,
            isLoading,
            userName,
            setAuthToken,
            clearAuthToken,
        }}>
            {children}
        </AuthContext.Provider>
    );
};
