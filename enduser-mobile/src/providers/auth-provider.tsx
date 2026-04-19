import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import * as SecureStore from "expo-secure-store";
import { API_BASE } from "@/src/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

type UserProfile = {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  is_verified: boolean;
  [key: string]: unknown;
};

type AuthUser = {
  id: string;
  email: string;
  profile: UserProfile | null;
};

type SignupParams = {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  dob: string;
  address?: string;
  barangay?: string;
  municipality?: string;
  province?: string;
  id_document: {
    uri: string;
    name: string;
    type: string;
  };
};

type AuthContextValue = {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (params: SignupParams) => Promise<void>;
  logout: () => void;
};

// ── Storage keys ─────────────────────────────────────────────────────────────

const TOKEN_KEY = "bayanihub-token";
const USER_KEY = "bayanihub-user";

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  // Rehydrate session from secure storage on mount
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await SecureStore.getItemAsync(TOKEN_KEY);
        const storedUser = await SecureStore.getItemAsync(USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser) as AuthUser);
        }
      } catch {
        // Corrupted storage — silently clear
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
      } finally {
        setIsReady(true);
      }
    })();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isReady,

      // ── LOGIN: call the NestJS backend (same as Web End-User) ──
      login: async (email: string, password: string) => {
        const res = await fetch(`${API_BASE}/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Invalid credentials.");
        }

        const data = await res.json();

        const nextUser: AuthUser = {
          id: data.user.id,
          email: data.user.email,
          profile: data.user.profile,
        };

        setUser(nextUser);
        setToken(data.access_token);

        // Persist to secure storage
        await SecureStore.setItemAsync(TOKEN_KEY, data.access_token);
        await SecureStore.setItemAsync(USER_KEY, JSON.stringify(nextUser));
      },

      // ── SIGNUP: send multipart/form-data to the NestJS backend ──
      signup: async (params: SignupParams) => {
        const formData = new FormData();
        formData.append("email", params.email);
        formData.append("password", params.password);
        formData.append("first_name", params.first_name);
        formData.append("last_name", params.last_name);
        formData.append("phone", params.phone);
        formData.append("dob", params.dob);
        if (params.address) formData.append("address", params.address);
        if (params.barangay) formData.append("barangay", params.barangay);
        if (params.municipality) formData.append("municipality", params.municipality);
        if (params.province) formData.append("province", params.province);

        formData.append("id_document", {
          uri: params.id_document.uri,
          name: params.id_document.name,
          type: params.id_document.type,
        } as any);

        const res = await fetch(`${API_BASE}/auth/register`, {
          method: "POST",
          body: formData, // multipart — do NOT set Content-Type manually
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.message || "Registration failed.");

}

        // Registration returns a message + userId.
        // The user needs to verify their email, then log in.
      },

      logout: async () => {
        setUser(null);
        setToken(null);
        await SecureStore.deleteItemAsync(TOKEN_KEY);
        await SecureStore.deleteItemAsync(USER_KEY);
      },
    }),
    [isReady, user, token],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
}
