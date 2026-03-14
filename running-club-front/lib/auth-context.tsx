"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from "react";
import { getMe, logout as apiLogout } from "./api";
import type { AuthUser } from "./types";

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  /** 일반 로그인 직후 true → 대시보드에서 WelcomeOverlay 표시 */
  showWelcome: boolean;
  setUser: (user: AuthUser | null) => void;
  /** 로그인 성공 시 true, WelcomeOverlay 종료 시 false */
  setShowWelcome: (show: boolean) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  showWelcome: false,
  setUser: () => {},
  setShowWelcome: () => {},
  logout: async () => {},
});

function setRoleCookie(role: string | null) {
  if (role) {
    document.cookie = `user-role=${role};path=/;SameSite=Lax`;
  } else {
    document.cookie = "user-role=;path=/;max-age=0;SameSite=Lax";
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    getMe().then((me) => {
      setUserState(me);
      setRoleCookie(me?.role ?? null);
    }).finally(() => setLoading(false));
  }, []);

  const setUser = useCallback((u: AuthUser | null) => {
    setUserState(u);
    setRoleCookie(u?.role ?? null);
    if (u) {
      localStorage.setItem("loggedIn", "true");
    } else {
      localStorage.removeItem("loggedIn");
    }
  }, []);

  const logout = useCallback(async () => {
    try { await apiLogout(); } catch { /* 세션 만료 등 무시 */ }
    setUserState(null);
    setShowWelcome(false);
    setRoleCookie(null);
    localStorage.removeItem("loggedIn");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, showWelcome, setUser, setShowWelcome, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
