import { createContext, useContext, useEffect, useMemo, useState } from "react";
import apiClient from "../api/apiClient";
import { compactError } from "../utils/formatters";

const AuthContext = createContext(null);

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadSession = async () => {
    setLoading(true);
    try {
      const response = await apiClient.post("/auth/refresh");
      setUser(response.data.user);
      try {
        const me = await apiClient.get("/auth/me");
        setRoles(me.data.roles || [response.data.user.role]);
        setUser(me.data.user || response.data.user);
      } catch {
        setRoles([response.data.user.role]);
      }
    } catch {
      setUser(null);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSession();
  }, []);

  const login = async ({ email, password, role }) => {
    setError(null);
    try {
      const response = await apiClient.post(`/auth/login/${role}`, { email, password });
      setUser(response.data.user);
      setRoles([response.data.user.role]);
      return response.data;
    } catch (err) {
      const message = compactError(err, "Login failed. Please check your credentials and role.");
      setError(message);
      throw new Error(message);
    }
  };

  const register = async (userData) => {
    setError(null);
    try {
      const response = await apiClient.post("/auth/register", userData);
      setUser(response.data.user);
      setRoles([response.data.user.role]);
      return response.data;
    } catch (err) {
      const message = compactError(err, "Registration failed.");
      setError(message);
      throw new Error(message);
    }
  };

  const updateProfile = async (profile) => {
    const response = await apiClient.patch("/auth/me", profile);
    setUser(response.data.user);
    return response.data;
  };

  const logout = async () => {
    try {
      await apiClient.post("/auth/logout");
    } finally {
      setUser(null);
      setRoles([]);
    }
  };

  const value = useMemo(
    () => ({ user, roles, loading, error, setError, login, register, logout, updateProfile, refreshSession: loadSession }),
    [user, roles, loading, error]
  );

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 text-sm font-medium text-slate-600">
        Restoring session...
      </div>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
