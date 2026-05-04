import { useState, useEffect } from "react";

type Theme = "light" | "dark";

const getStoredTheme = (): Theme => {
  try {
    const stored = localStorage.getItem("theme");
    if (stored === "dark" || stored === "light") return stored;
  } catch {}
  if (typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches) {
    return "dark";
  }
  return "light";
};

const setStoredTheme = (theme: Theme) => {
  try {
    localStorage.setItem("theme", theme);
  } catch {}
};

export const useTheme = () => {
  const [theme, setTheme] = useState<Theme>(getStoredTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    setStoredTheme(theme);
  }, [theme]);

  const toggleTheme = () => setTheme((prev) => (prev === "light" ? "dark" : "light"));
  const setDarkMode = (enabled: boolean) => setTheme(enabled ? "dark" : "light");

  return { theme, isDark: theme === "dark", toggleTheme, setDarkMode };
};
