import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

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

// Default local user since we are removing Google login
const LOCAL_USER: AuthUser = {
  id: "local-user",
  name: "Local User",
  email: "local@example.com",
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(LOCAL_USER);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // We just keep the local user as the default
    setIsLoading(false);
  }, []);

  async function signIn(token: string, type: "id" | "access") {
    // No-op as we are always "signed in" locally
    setUser(LOCAL_USER);
  }

  async function signOut() {
    // In a local-only app, sign out might not be needed, but we can clear if desired
    // For now, let's just keep it as is or reset to null if the user really wants to "log out"
    // However, the requirement says "all data stay local and offline", so a permanent local session is better.
    // setUser(null); 
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
