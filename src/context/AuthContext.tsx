import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { authApi } from "../services/authApi";
import type { RiderProfile, RiderUser } from "../types/rider";

interface AuthContextValue {
  user: RiderUser | null;
  rider: RiderProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<RiderUser | null>(null);
  const [rider, setRider] = useState<RiderProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const token = sessionStorage.getItem("rider_token");

    if (!token) {
      setUser(null);
      setRider(null);
      return;
    }

    try {
      const result = await authApi.me();
      setUser(result.user);
      setRider(result.rider);
    } catch {
      sessionStorage.removeItem("rider_token");
      setUser(null);
      setRider(null);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password);

    sessionStorage.setItem("rider_token", result.access_token);
    setUser(result.user);
    setRider(result.rider);
  };

  const logout = async () => {
    try {
      await authApi.logout();
    } finally {
      sessionStorage.removeItem("rider_token");
      setUser(null);
      setRider(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, rider, loading, login, logout, refresh }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
