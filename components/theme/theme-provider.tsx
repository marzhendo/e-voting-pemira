"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";

export type ThemeMode = "light" | "dark";

export const THEME_STORAGE_KEY = "hmif-theme";

/**
 * Script sinkron di <head> agar preferensi tema langsung diterapkan sebelum first paint (mencegah FOUC).
 * Default selalu mode terang ('light') sesuai arah desain Civic Editorial Clean.
 */
export const THEME_INIT_SCRIPT = `(function(){try{var t=localStorage.getItem('${THEME_STORAGE_KEY}');if(t==='dark'){document.documentElement.classList.add('dark');document.documentElement.setAttribute('data-theme','dark');}else{document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light');}}catch(e){document.documentElement.classList.remove('dark');document.documentElement.setAttribute('data-theme','light');}})();`;

interface ThemeContextValue {
  theme: ThemeMode;
  mounted: boolean;
  setTheme: (next: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  mounted: false,
  setTheme: () => {},
  toggleTheme: () => {},
});

function applyThemeToDom(mode: ThemeMode) {
  const root = document.documentElement;
  if (mode === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  root.setAttribute("data-theme", mode);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(THEME_STORAGE_KEY);
      const initial: ThemeMode = stored === "dark" ? "dark" : "light";
      setThemeState(initial);
      applyThemeToDom(initial);
    } catch {
      setThemeState("light");
      applyThemeToDom("light");
    } finally {
      setMounted(true);
    }
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    applyThemeToDom(next);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Abaikan jika storage diblokir browser
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => {
      const next: ThemeMode = prev === "dark" ? "light" : "dark";
      applyThemeToDom(next);
      try {
        localStorage.setItem(THEME_STORAGE_KEY, next);
      } catch {
        // Abaikan jika storage diblokir browser
      }
      return next;
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, mounted, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
