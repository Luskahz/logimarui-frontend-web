"use client";

import { useCallback, useEffect, useState } from "react";
import {
  UI_THEMES,
  applyUiTheme,
  persistUiTheme,
  readDocumentUiTheme,
  readStoredUiTheme,
} from "@/features/ui/lib/uiTheme";

export function useUiTheme() {
  const [theme, setTheme] = useState(UI_THEMES.LIGHT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      const nextTheme = readDocumentUiTheme() || readStoredUiTheme();
      setTheme(nextTheme);
      applyUiTheme(nextTheme);
      setReady(true);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, []);

  useEffect(() => {
    if (!ready) {
      return;
    }

    applyUiTheme(theme);
    persistUiTheme(theme);
  }, [ready, theme]);

  const toggleTheme = useCallback(() => {
    setTheme((currentTheme) =>
      currentTheme === UI_THEMES.DARK ? UI_THEMES.LIGHT : UI_THEMES.DARK,
    );
  }, []);

  return {
    isDark: theme === UI_THEMES.DARK,
    theme,
    toggleTheme,
  };
}
