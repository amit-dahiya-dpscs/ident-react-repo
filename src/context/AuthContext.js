import React, { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { apiClient } from '../services/api';
import { jwtDecode } from 'jwt-decode'; // Ensure this matches your package import

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const logout = useCallback(() => {
    setAuthToken(null);
    setUser(null);
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
    delete apiClient.defaults.headers.common['Authorization'];
  }, []);

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = sessionStorage.getItem('authToken');
        const storedUser = sessionStorage.getItem('user');

        if (storedToken && storedUser) {
          // Check Token Expiration on Reload
          const decodedToken = jwtDecode(storedToken);
          const currentTime = Date.now() / 1000; // Convert milliseconds to seconds

          // If token expiration time is in the past
          if (decodedToken.exp < currentTime) {
            console.warn("Session expired during reload. Clearing auth.");
            alert("Your session has expired. Please login again.");
            logout(); 
            return; 
          }
          // --- FIX END ---

          // Token is valid, restore session
          setAuthToken(storedToken);
          setUser(JSON.parse(storedUser));
          apiClient.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        }
      } catch (error) {
        console.error("Failed to initialize auth state:", error);
        logout();
      } finally {
        setIsInitializing(false);
      }
    };

    initializeAuth();
  }, [logout]); 

  const login = async (credentials) => {
    try {
      const { data } = await apiClient.post('/auth/login', credentials);
      const decodedToken = jwtDecode(data.token);

      const userPayload = {
        username: data.username,
        roles: (decodedToken.roles || '')
          .split(',')
          .map(role => role.trim())
          .filter(role => role)
      };

      setAuthToken(data.token);
      setUser(userPayload);
      sessionStorage.setItem('authToken', data.token);
      sessionStorage.setItem('user', JSON.stringify(userPayload));
      apiClient.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    } catch (error) {
      console.error("AuthContext login failed:", error);
      logout();
      throw error;
    }
  };

  const value = { isAuthenticated: !!authToken, user, isInitializing, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};