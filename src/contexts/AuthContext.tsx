"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

/* ─── Types ─── */
export interface TuckUser {
  name: string;
  email: string;
  avatar: string | null;
  provider?: "google" | "local" | "admin";
  role?: "admin" | "user";
}

interface AuthContextValue {
  user: TuckUser | null;
  isAuthenticated: boolean;
  hydrated: boolean;
  login: (name: string, email?: string) => void;
  loginWithGoogle: (userData: { name: string; email: string; avatar?: string | null }) => void;
  loginAsAdmin: (adminName?: string) => void;
  updateName: (newName: string) => void;
  logout: () => void;
}

const STORAGE_KEY = "tuck_user";

/* ─── Context ─── */
const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/* ─── Provider ─── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<TuckUser | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        setUser(JSON.parse(raw) as TuckUser);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY);
    }
    setHydrated(true);
  }, []);

  const login = useCallback((name: string, email?: string) => {
    const newUser: TuckUser = {
      name: name.trim(),
      email:
        email?.trim() ||
        `${name.trim().toLowerCase().replace(/\s+/g, ".")}@tuck.local`,
      avatar: null,
      provider: "local",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const loginWithGoogle = useCallback((userData: { name: string; email: string; avatar?: string | null }) => {
    const newUser: TuckUser = {
      name: userData.name.trim(),
      email: userData.email.trim(),
      avatar: userData.avatar || null,
      provider: "google",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const loginAsAdmin = useCallback((adminName = 'Administrator') => {
    const adminUser: TuckUser = {
      name: adminName.trim(),
      email: 'admin@tuck.app',
      avatar: null,
      provider: 'admin',
      role: 'admin',
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(adminUser));
    setUser(adminUser);
  }, []);

  const updateName = useCallback((newName: string) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, name: newName.trim() };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setUser(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: user !== null,
      hydrated,
      login,
      loginWithGoogle,
      loginAsAdmin,
      updateName,
      logout,
    }),
    [user, hydrated, login, loginWithGoogle, loginAsAdmin, updateName, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ─── Hook ─── */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (ctx === undefined) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return ctx;
}
