const DEVICE_ID_KEY = "logimarui.auth.device-id";
const SESSION_KEY = "logimarui.auth.session";

function isBrowser() {
  return typeof window !== "undefined";
}

function readStorageValue(key) {
  if (!isBrowser()) {
    return null;
  }

  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorageValue(key, value) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(key, value);
}

function removeStorageValue(key) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(key);
}

function parseJson(value) {
  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
}

function buildDeviceId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `device-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function getOrCreateDeviceId() {
  const existingId = readStorageValue(DEVICE_ID_KEY);

  if (existingId) {
    return existingId;
  }

  const nextDeviceId = buildDeviceId();
  writeStorageValue(DEVICE_ID_KEY, nextDeviceId);
  return nextDeviceId;
}

export function readAuthSession() {
  return parseJson(readStorageValue(SESSION_KEY));
}

export function saveAuthSession(tokens, profile = null) {
  const expiresInSeconds = Number(tokens?.expiresInSeconds ?? 0);
  const expiresAt =
    Number.isFinite(expiresInSeconds) && expiresInSeconds > 0
      ? new Date(Date.now() + expiresInSeconds * 1000).toISOString()
      : null;
  const snapshot = {
    accessToken: tokens?.accessToken || "",
    refreshToken: tokens?.refreshToken || "",
    expiresInSeconds,
    expiresAt,
    profile,
    savedAt: new Date().toISOString(),
  };

  writeStorageValue(SESSION_KEY, JSON.stringify(snapshot));
  return snapshot;
}

export function replaceAuthSession(snapshot) {
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const nextSnapshot = {
    ...snapshot,
    savedAt: new Date().toISOString(),
  };

  writeStorageValue(SESSION_KEY, JSON.stringify(nextSnapshot));
  return nextSnapshot;
}

export function updateAuthSessionProfile(profile) {
  const currentSession = readAuthSession();

  if (!currentSession) {
    return null;
  }

  return replaceAuthSession({
    ...currentSession,
    profile,
  });
}

export function clearAuthSession() {
  removeStorageValue(SESSION_KEY);
}
