// hooks/useAuth.js
import { useState, useEffect, useCallback } from "react";
import { authAPI } from "../services/api";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is logged in on mount
  useEffect(() => {
    const token = localStorage.getItem("authToken");
    if (token) {
      fetchProfile();
    }
  }, []);

  const fetchProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await authAPI.getProfile();
      setUser(response.data);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      localStorage.removeItem("authToken");
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (email, password, fullName) => {
    try {
      setIsLoading(true);
      await authAPI.register(email, password, fullName);
      setError(null);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email, password) => {
    try {
      setIsLoading(true);
      const response = await authAPI.login(email, password);
      const { token, ...userData } = response.data;
      localStorage.setItem("authToken", token);
      setUser(userData);
      setError(null);
      return true;
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("authToken");
    setUser(null);
    setError(null);
  }, []);

  return {
    user,
    isLoading,
    error,
    register,
    login,
    logout,
    isAuthenticated: !!user,
  };
};
