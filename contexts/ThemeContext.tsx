/* eslint-disable react-hooks/set-state-in-effect */
"use client";


import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  theme: "dark",
  toggleTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");

  useEffect(() => {
    // Only run if not already set, or just use the initial state logic correctly
    const saved = localStorage.getItem("ra-theme") as Theme;
    if (saved && saved !== theme) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTheme(saved);
      document.documentElement.classList.toggle("dark", saved === "dark");
    } else if (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches && theme !== "dark") {
      setTheme("dark");
      document.documentElement.classList.toggle("dark", true);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.classList.toggle("dark", next === "dark");
    localStorage.setItem("ra-theme", next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
