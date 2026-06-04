"use client";

import { create } from "zustand";
import {
  UI_THEMES,
  applyUiTheme,
  persistUiTheme,
  readDocumentUiTheme,
  readStoredUiTheme,
} from "@/features/ui/lib/uiTheme";

export const useUiThemeStore = create((set, get) => ({
  theme: UI_THEMES.LIGHT,
  ready: false,

  hydrateTheme() {
    if (get().ready) {
      return;
    }

    const nextTheme = readDocumentUiTheme() || readStoredUiTheme();
    applyUiTheme(nextTheme);
    set({
      theme: nextTheme,
      ready: true,
    });
  },

  toggleTheme() {
    const nextTheme =
      get().theme === UI_THEMES.DARK ? UI_THEMES.LIGHT : UI_THEMES.DARK;

    applyUiTheme(nextTheme);
    persistUiTheme(nextTheme);
    set({ theme: nextTheme });
  },
}));
