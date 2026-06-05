/**
 * Theme Store - Manage light/dark theme preference
 */

export type Theme = "light" | "dark" | "system";

const THEME_KEY = "openmaintainer:theme";

/**
 * Read theme from localStorage
 */
export function readTheme(storage: Storage): Theme {
  try {
    const theme = storage.getItem(THEME_KEY);
    if (theme === "light" || theme === "dark" || theme === "system") {
      return theme;
    }
    return "system";
  } catch {
    return "system";
  }
}

/**
 * Write theme to localStorage
 */
export function writeTheme(storage: Storage, theme: Theme): void {
  try {
    storage.setItem(THEME_KEY, theme);
  } catch (e) {
    console.error("Failed to save theme:", e);
  }
}

/**
 * Get the actual theme based on system preference
 */
export function getEffectiveTheme(storage: Storage): "light" | "dark" {
  const theme = readTheme(storage);
  if (theme === "system") {
    if (typeof window !== "undefined") {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  }
  return theme;
}

/**
 * Apply theme to document
 */
export function applyTheme(theme: "light" | "dark"): void {
  if (typeof document === "undefined") return;
  
  const root = document.documentElement;
  if (theme === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
}

/**
 * Initialize theme on page load
 */
export function initializeTheme(storage: Storage): void {
  if (typeof window === "undefined") return;
  
  const effective = getEffectiveTheme(storage);
  applyTheme(effective);
  
  // Listen for system theme changes
  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
  mediaQuery.addEventListener("change", () => {
    if (readTheme(storage) === "system") {
      applyTheme(getEffectiveTheme(storage));
    }
  });
}
