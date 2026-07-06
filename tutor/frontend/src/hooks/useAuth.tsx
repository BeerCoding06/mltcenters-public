import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { api } from "../services/api";
import type { User } from "../types";

interface AuthCtx {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, full_name: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthCtx | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem("tutor_token"));

  useEffect(() => {
    if (!token) return;
    api.me().then(setUser).catch(() => {
      localStorage.removeItem("tutor_token");
      setToken(null);
    });
  }, [token]);

  const login = async (email: string, password: string) => {
    const res = await api.login(email, password);
    localStorage.setItem("tutor_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const register = async (email: string, full_name: string, password: string) => {
    const res = await api.register(email, full_name, password);
    localStorage.setItem("tutor_token", res.access_token);
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("tutor_token");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth outside provider");
  return ctx;
}
