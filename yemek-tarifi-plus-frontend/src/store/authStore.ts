import { create } from "zustand";
import { jwtDecode } from "jwt-decode";

interface AuthState {
  token: string | null;
  email: string | null;
  isLoggedIn: boolean;
  setToken: (token: string) => void;
  logout: () => void;
}

interface DecodedToken {
  email: string;
  exp: number;
}

export const useAuthStore = create<AuthState>((set) => {
  const storedToken = localStorage.getItem("accessToken");

  let email: string | null = null;

  if (storedToken && typeof storedToken === "string" && storedToken.trim()) {
    try {
      const decoded = jwtDecode<DecodedToken>(storedToken);
      email = decoded.email;
    } catch (error) {
      console.error("Token decoding failed:", error);
      localStorage.removeItem("accessToken");
    }
  }

  return {
    token: storedToken,
    isLoggedIn: !!storedToken,
    email,
    setToken: (token) => {
      if (typeof token !== "string" || !token.trim()) {
        console.error("Geçersiz token:", token);
        return;
      }

      localStorage.setItem("accessToken", token);
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        set({ token, isLoggedIn: true, email: decoded.email });
      } catch (error) {
        console.error("Token decode hatası:", error);
      }
    },
    logout: () => {
      localStorage.removeItem("accessToken");
      set({ token: null, isLoggedIn: false, email: null });
    },
  };
});