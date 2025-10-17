// src/contexts/AuthContext.js

// src/contexts/AuthContext.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/apiClient';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // On initial load, try to get user info from localStorage
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Decode the token to get user details (like name, role, etc.)
        const decodedUser = jwtDecode(token);
        setUser({ ...decodedUser, token });
      }
    } catch (err) {
      // If token is invalid or expired, clear it
      setUser(null);
      localStorage.removeItem('token');
      console.error("Error decoding token on initial load:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // --- Login Function ---
  const login = async (credentials) => {
    setError(null);
    try {
      // The role is now part of the URL, as required by the backend
      const response = await apiClient.post(
        `/auth/login/${credentials.role}`,
        { email: credentials.email, password: credentials.password }
      );
      
      const { user: userData, token } = response.data.user;
      
      // Store token in localStorage
      localStorage.setItem('token', token);

      // Set user state
      const decodedUser = jwtDecode(token);
      setUser({ ...decodedUser, token });
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Login failed. Please try again.";
      setError(errorMessage);
      console.error("Login error:", errorMessage);
      throw new Error(errorMessage);
    }
  };

  // --- Register Function ---
  const register = async (userData) => {
    setError(null);
    try {
      const response = await apiClient.post('/auth/register', userData);
      
      const { user: registeredUser, token } = response.data.user;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      
      // Set user state
      const decodedUser = jwtDecode(token);
      setUser({ ...decodedUser, token });

      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Registration failed. Please try again.";
      setError(errorMessage);
      console.error("Registration error:", errorMessage);
      throw new Error(errorMessage);
    }
  };

  // --- Logout Function ---
  const logout = () => {
    setUser(null);
    localStorage.removeItem('token');
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    setError, // Expose setError to allow components to clear errors
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
