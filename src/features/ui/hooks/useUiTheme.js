"use client";

import { useEffect } from "react";
import { UI_THEMES } from "@/features/ui/lib/uiTheme";
import { useUiThemeStore } from "@/features/ui/store/useUiThemeStore";

export function useUiTheme() {
  const hydrateTheme = useUiThemeStore((state) => state.hydrateTheme);
  const theme = useUiThemeStore((state) => state.theme);
  const toggleTheme = useUiThemeStore((state) => state.toggleTheme);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      hydrateTheme();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [hydrateTheme]);

  return {
    isDark: theme === UI_THEMES.DARK,
    theme,
    toggleTheme,
  };
}
