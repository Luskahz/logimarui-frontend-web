export const UI_THEMES = {
  LIGHT: "light",
  DARK: "dark",
};

export const UI_THEME_STORAGE_KEY = "logimarui.ui.theme";

export function normalizeUiTheme(value) {
  return value === UI_THEMES.DARK ? UI_THEMES.DARK : UI_THEMES.LIGHT;
}

export function readStoredUiTheme() {
  if (typeof window === "undefined") {
    return UI_THEMES.LIGHT;
  }

  try {
    return normalizeUiTheme(window.localStorage.getItem(UI_THEME_STORAGE_KEY));
  } catch {
    return UI_THEMES.LIGHT;
  }
}

export function readDocumentUiTheme() {
  if (typeof document === "undefined") {
    return UI_THEMES.LIGHT;
  }

  return normalizeUiTheme(
    document.documentElement.getAttribute("data-ui-theme"),
  );
}

export function applyUiTheme(theme) {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute(
    "data-ui-theme",
    normalizeUiTheme(theme),
  );
}

export function persistUiTheme(theme) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(
      UI_THEME_STORAGE_KEY,
      normalizeUiTheme(theme),
    );
  } catch {}
}

export function buildUiThemeInitScript() {
  return `
    (function () {
      try {
        var theme = window.localStorage.getItem("${UI_THEME_STORAGE_KEY}") === "${UI_THEMES.DARK}"
          ? "${UI_THEMES.DARK}"
          : "${UI_THEMES.LIGHT}";
        document.documentElement.setAttribute("data-ui-theme", theme);
      } catch (error) {
        document.documentElement.setAttribute("data-ui-theme", "${UI_THEMES.LIGHT}");
      }
    })();
  `;
}
