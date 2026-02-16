import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import Cookies from "js-cookie";

export type UserRole = "ADMIN" | "USER";

export interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  token: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const API_BASE = "http://localhost:8081/api";
const COOKIE_NAME = "nexus_session";

function getExpirationDateFromToken(token: string): Date | undefined {
  try {
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return undefined;

    const decodedJson = atob(payloadBase64);
    const payload = JSON.parse(decodedJson);

    if (payload.exp) {
      return new Date(payload.exp * 1000);
    }
  } catch {
    // Token malformed or expired - ignore
  }
  return undefined;
}

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {

  const [user, setUser] = useState<User | null>(() => {
    const savedCookie = Cookies.get(COOKIE_NAME);

    if (savedCookie) {
      try {
        return JSON.parse(savedCookie);
      } catch {
        return null;
      }
    }
    return null;
  });

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Invalid credentials");
    }

    const data = await response.json();

    const userRole = data.role ? data.role.toUpperCase() : "USER";

    const userData: User = {
      id: data.id || "temp-id",
      username: data.username || "User",
      email: email,
      role: userRole as UserRole,
      token: data.token
    };

    // Estrazione scadenza
    const tokenExpiration = getExpirationDateFromToken(data.token);

    // Aggiornamento stato React
    setUser(userData);

    // Salvataggio Cookie
    if (tokenExpiration) {
      Cookies.set(COOKIE_NAME, JSON.stringify(userData), {
        expires: tokenExpiration,
        secure: false, // 'true' in production with HTTPS
        sameSite: 'Strict'
      });
    } else {
      Cookies.set(COOKIE_NAME, JSON.stringify(userData), { expires: 1 });
    }

    return userData;
  }, []);

  const register = useCallback(async (username: string, email: string, password: string) => {
    const response = await fetch(`${API_BASE}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Registration failed");
    }
  }, []);

  const logout = useCallback(() => {
    const token = user?.token;
    if (token) {
      fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setUser(null);
    Cookies.remove(COOKIE_NAME);
  }, [user?.token]);

  const authValue = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    login,
    register,
    logout,
  }), [user, login, register, logout]);

  return (
    <AuthContext.Provider value={authValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}