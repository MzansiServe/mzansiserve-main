import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { apiFetch } from "@/lib/api";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string, role: string) => Promise<{ success: boolean; error?: string }>;
  register: (data: FormData | Record<string, any>) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check connection on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const result = await apiFetch("/api/auth/profile");
          if (result.success && result.data) {
            setUser(result.data.user);
          } else {
            localStorage.removeItem("token");
          }
        } catch (error) {
          console.error("Auth check failed:", error);
          localStorage.removeItem("token");
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = useCallback(async (email: string, password: string, role: string) => {
    try {
      const result = await apiFetch("/api/auth/login", {
        data: { email, password, role }
      });

      if (result.success) {
        localStorage.setItem("token", result.data.token);
        setUser(result.data.user);
        return { success: true };
      }
      return { success: false, error: result.message || "Login failed" };
    } catch (error: any) {
      return { success: false, error: error.message || "An error occurred during login" };
    }
  }, []);

  const register = useCallback(async (data: FormData | Record<string, any>) => {
    try {
      // If it's FormData, pass as is to register-with-payment. Otherwise wrap as JSON.
      const isFormData = data instanceof FormData;
      const endpoint = isFormData ? "/api/auth/register-with-payment" : "/api/auth/register";

      const payload = isFormData ? data : { ...data, role: data.role || "client" };

      const result = await apiFetch(endpoint, { data: payload });

      if (result.success) {
        // Optional: register-with-payment may trigger a checkout URL rather than token immediately
        if (result.checkout_url) {
          // You might need to redirect to payment
          window.location.href = result.checkout_url;
          return { success: true };
        }

        if (result.data?.token) {
          localStorage.setItem("token", result.data.token);
          setUser(result.data.user);
        }
        return { success: true };
      }
      return { success: false, error: result.message || "Registration failed" };
    } catch (error: any) {
      return { success: false, error: error.message || "An error occurred during registration" };
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
