import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const THEME_STORAGE_KEY = "enterprise-dashboard-theme";

const ThemeContext = createContext({
  themeMode: "auto",
  resolvedTheme: "light",
  theme: "light",
  isDark: false,
  setThemeMode: () => {},
  setTheme: () => {},
  toggleTheme: () => {},
});

const getInitialThemeMode = () => {
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
  if (["light", "dark", "auto"].includes(stored)) {
    return stored;
  }
  return "auto";
};

const getSystemPrefersDark = () => window.matchMedia("(prefers-color-scheme: dark)").matches;

const resolveTheme = (mode, systemPrefersDark) => {
  if (mode === "dark") return "dark";
  if (mode === "light") return "light";
  return systemPrefersDark ? "dark" : "light";
};

export function ThemeProvider({ children }) {
  const [themeMode, setThemeModeState] = useState(getInitialThemeMode);
  const [systemPrefersDark, setSystemPrefersDark] = useState(getSystemPrefersDark);

  const resolvedTheme = useMemo(
    () => resolveTheme(themeMode, systemPrefersDark),
    [themeMode, systemPrefersDark]
  );

  const setThemeMode = useCallback((nextMode) => {
    if (["light", "dark", "auto"].includes(nextMode)) {
      setThemeModeState(nextMode);
      return;
    }
    setThemeModeState("auto");
  }, []);

  const setTheme = setThemeMode;

  const toggleTheme = useCallback(() => {
    setThemeModeState((previousMode) => {
      if (previousMode === "light") return "dark";
      if (previousMode === "dark") return "auto";
      return "light";
    });
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const listener = (event) => {
      setSystemPrefersDark(event.matches);
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", listener);
    } else {
      mediaQuery.addListener(listener);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", listener);
      } else {
        mediaQuery.removeListener(listener);
      }
    };
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = resolvedTheme === "dark";
    root.classList.toggle("dark", isDark);
    root.setAttribute("data-theme", resolvedTheme);
    root.setAttribute("data-theme-mode", themeMode);
    window.localStorage.setItem(THEME_STORAGE_KEY, themeMode);
  }, [resolvedTheme, themeMode]);

  const value = useMemo(
    () => ({
      themeMode,
      resolvedTheme,
      theme: resolvedTheme,
      isDark: resolvedTheme === "dark",
      setThemeMode,
      setTheme,
      toggleTheme,
    }),
    [resolvedTheme, setTheme, setThemeMode, themeMode, toggleTheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
