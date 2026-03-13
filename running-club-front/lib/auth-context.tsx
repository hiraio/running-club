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
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  setUser: () => {},
  logout: async () => {},
});

/** user-role 쿠키를 JS에서 설정 (미들웨어가 읽는 용도) */
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
    await apiLogout();
    setUserState(null);
    setRoleCookie(null);
    localStorage.removeItem("loggedIn");
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
