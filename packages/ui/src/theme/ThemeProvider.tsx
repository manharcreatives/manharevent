"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "dark",
  setTheme: () => undefined,
  toggle: () => undefined,
});

export function useTheme() {
  return useContext(ThemeContext);
}

function readCookie(): Theme | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/mg-theme=(dark|light)/);
  return m ? (m[1] as Theme) : null;
}

function writeCookie(theme: Theme) {
  document.cookie = `mg-theme=${theme};path=/;max-age=31536000;SameSite=Lax`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("dark");

  useEffect(() => {
    const stored = readCookie();
    const resolved: Theme =
      stored ??
      (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    setThemeState(resolved);
    document.documentElement.setAttribute("data-theme", resolved);
  }, []);

  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.setAttribute("data-theme", t);
    writeCookie(t);
  }, []);

  const toggle = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}
