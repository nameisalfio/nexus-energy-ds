import React, { createContext, useContext, useState, useCallback } from "react";

export type UserRole = "ADMIN" | "USER";

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  token: string;
}

interface RegisteredUser {
  id: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  registeredUsers: RegisteredUser[];
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  changeUserRole: (userId: string, newRole: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default admin user for testing
const defaultUsers: RegisteredUser[] = [
  {
    id: "admin-1",
    username: "admin",
    email: "admin@nexus.com",
    password: "admin123",
    role: "ADMIN",
  },
  {
    id: "user-1",
    username: "observer",
    email: "user@nexus.com",
    password: "user123",
    role: "USER",
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("nexus-user");
    return stored ? JSON.parse(stored) : null;
  });

  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>(() => {
    const stored = localStorage.getItem("nexus-registered-users");
    return stored ? JSON.parse(stored) : defaultUsers;
  });

  const login = useCallback(async (email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    const foundUser = registeredUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
    );
    
    if (!foundUser) {
      throw new Error("Invalid email or password");
    }
    
    const loggedInUser: User = {
      id: foundUser.id,
      username: foundUser.username,
      email: foundUser.email,
      role: foundUser.role,
      token: `mock-jwt-token-${Date.now()}`,
    };
    
    setUser(loggedInUser);
    localStorage.setItem("nexus-user", JSON.stringify(loggedInUser));
  }, [registeredUsers]);

  const register = useCallback(async (username: string, email: string, password: string) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 800));
    
    // Check if email already exists
    const existingUser = registeredUsers.find(
      (u) => u.email.toLowerCase() === email.toLowerCase()
    );
    
    if (existingUser) {
      throw new Error("Email already registered");
    }
    
    // Check if username already exists
    const existingUsername = registeredUsers.find(
      (u) => u.username.toLowerCase() === username.toLowerCase()
    );
    
    if (existingUsername) {
      throw new Error("Username already taken");
    }
    
    const newUser: RegisteredUser = {
      id: `user-${Date.now()}`,
      username,
      email,
      password,
      role: "USER", // Default role is USER
    };
    
    const updatedUsers = [...registeredUsers, newUser];
    setRegisteredUsers(updatedUsers);
    localStorage.setItem("nexus-registered-users", JSON.stringify(updatedUsers));
    
    // Auto-login after registration
    const loggedInUser: User = {
      id: newUser.id,
      username: newUser.username,
      email: newUser.email,
      role: newUser.role,
      token: `mock-jwt-token-${Date.now()}`,
    };
    
    setUser(loggedInUser);
    localStorage.setItem("nexus-user", JSON.stringify(loggedInUser));
  }, [registeredUsers]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("nexus-user");
  }, []);

  const changeUserRole = useCallback((userId: string, newRole: UserRole) => {
    setRegisteredUsers((prev) => {
      const updated = prev.map((u) =>
        u.id === userId ? { ...u, role: newRole } : u
      );
      localStorage.setItem("nexus-registered-users", JSON.stringify(updated));
      return updated;
    });
    
    // If the currently logged-in user's role was changed, update their session
    if (user && user.id === userId) {
      const updatedUser = { ...user, role: newRole };
      setUser(updatedUser);
      localStorage.setItem("nexus-user", JSON.stringify(updatedUser));
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        registeredUsers,
        login,
        register,
        logout,
        changeUserRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
