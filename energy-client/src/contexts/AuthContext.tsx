import React, { createContext, useContext, useState, useCallback, useMemo } from "react";
import Cookies from "js-cookie"; // <--- IMPORTANTE: Mancava questa riga!

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

    console.log("🔍 [AuthContext] Decoded Token Payload:", payload); // LOG

    // Il campo 'exp' nel JWT è in secondi, JS usa i millisecondi
    if (payload.exp) {
      const expDate = new Date(payload.exp * 1000);
      console.log("⏳ [AuthContext] Token Expiration Date:", expDate); // LOG
      return expDate;
    }
  } catch (e) {
    console.error("❌ [AuthContext] Parsing exp token error", e);
  }
  return undefined;
}

export function AuthProvider({ children }: { readonly children: React.ReactNode }) {

  // 1. INIZIALIZZAZIONE: Logghiamo cosa trova nel cookie all'avvio
  const [user, setUser] = useState<User | null>(() => {
    console.log("🔄 [AuthContext] App initializing..."); // LOG
    const savedCookie = Cookies.get(COOKIE_NAME);

    if (savedCookie) {
      try {
        console.log("🍪 [AuthContext] Cookie found on startup:", savedCookie); // LOG
        const parsedUser = JSON.parse(savedCookie);
        console.log("✅ [AuthContext] User restored from Cookie:", parsedUser.email); // LOG
        return parsedUser;
      } catch (error) {
        console.error("❌ [AuthContext] Failed to parse cookie:", error);
        return null;
      }
    }
    console.log("⚪ [AuthContext] No cookie found."); // LOG
    return null;
  });

  const login = useCallback(async (email: string, password: string): Promise<User> => {
    console.log("🚀 [AuthContext] Login attempt for:", email); // LOG

    const response = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("❌ [AuthContext] Login API Error:", errorData); // LOG
      throw new Error(errorData.message || "Invalid credentials");
    }

    const data = await response.json();
    console.log("📥 [AuthContext] Login API Response:", data); // LOG

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
      console.log(`🍪 [AuthContext] Cookie set! Expires at: ${tokenExpiration}`); // LOG
    } else {
      Cookies.set(COOKIE_NAME, JSON.stringify(userData), { expires: 1 });
      console.warn("⚠️ [AuthContext] Could not determine token expiration. Fallback to 1 day cookie."); // LOG
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
    console.log("✅ [AuthContext] Registration successful for:", email); // LOG
  }, []);

  const logout = useCallback(() => {
    console.log("👋 [AuthContext] Logging out..."); // LOG
    const token = user?.token;
    if (token) {
      fetch(`${API_BASE}/auth/logout`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      }).catch((err) => console.warn("Logout API call failed:", err));
    }
    setUser(null);
    Cookies.remove(COOKIE_NAME);
    console.log("🗑️ [AuthContext] Cookie removed."); // LOG
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