import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiRequest, getApiUrl } from "./query-client";
import { fetch } from "expo/fetch";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  signIn: (token: string, type: "id" | "access") => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  signIn: async () => {},
  signOut: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}

const AUTH_CACHE_KEY = "flashmind_auth_user";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  async function checkAuth() {
    try {
      const cached = await AsyncStorage.getItem(AUTH_CACHE_KEY);
      if (cached) {
        setUser(JSON.parse(cached));
      }

      const baseUrl = getApiUrl();
      const res = await fetch(new URL("/api/auth/me", baseUrl).toString(), {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        await AsyncStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(data.user));
      } else {
        setUser(null);
        await AsyncStorage.removeItem(AUTH_CACHE_KEY);
      }
    } catch {
      const cached = await AsyncStorage.getItem(AUTH_CACHE_KEY);
      if (cached) {
        setUser(JSON.parse(cached));
      }
    } finally {
      setIsLoading(false);
    }
  }

  async function signIn(token: string, type: "id" | "access") {
    const body = type === "id" ? { idToken: token } : { accessToken: token };
    const res = await apiRequest("POST", "/api/auth/google", body);
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.message || "Authentication failed");
    }
    const data = await res.json();
    setUser(data.user);
    await AsyncStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(data.user));
  }

  async function signOut() {
    try {
      await apiRequest("POST", "/api/auth/logout");
    } catch {}
    setUser(null);
    await AsyncStorage.removeItem(AUTH_CACHE_KEY);
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
