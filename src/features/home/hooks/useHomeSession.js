"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/features/auth/lib/authApi";
import {
  clearAuthSession,
  readAuthSession,
  updateAuthSessionProfile,
} from "@/features/auth/lib/authSession";

const REFRESH_BUFFER_MS = 60_000;

function hasStoredSession(session) {
  return Boolean(session?.accessToken && session?.refreshToken);
}

function shouldRefreshSoon(session) {
  if (!session?.refreshToken || !session?.expiresAt) {
    return false;
  }

  const expiresAt = Date.parse(session.expiresAt);

  if (!Number.isFinite(expiresAt)) {
    return false;
  }

  return expiresAt - Date.now() <= REFRESH_BUFFER_MS;
}

export function useHomeSession() {
  const router = useRouter();
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const syncSession = useCallback(
    async ({ forceRefresh = false } = {}) => {
      const storedSession = readAuthSession();

      if (!hasStoredSession(storedSession)) {
        clearAuthSession();
        setStatus("unauthenticated");
        setSession(null);
        setProfile(null);
        router.replace("/login");
        return null;
      }

      setSession(storedSession);
      setProfile(storedSession.profile ?? null);

      try {
        if (forceRefresh || shouldRefreshSoon(storedSession)) {
          setIsRefreshing(true);
          await authApi.refresh();
        }

        const nextProfile = await authApi.me();
        const nextSession =
          updateAuthSessionProfile(nextProfile) || readAuthSession();

        setSession(nextSession);
        setProfile(nextProfile);
        setError("");
        setStatus("ready");

        return {
          session: nextSession,
          profile: nextProfile,
        };
      } catch (syncError) {
        clearAuthSession();
        setStatus("unauthenticated");
        setSession(null);
        setProfile(null);
        setError(syncError?.message || "Sua sessao expirou.");
        router.replace("/login");
        return null;
      } finally {
        setIsRefreshing(false);
      }
    },
    [router],
  );

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void syncSession();
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [syncSession]);

  const logout = useCallback(async () => {
    setIsLoggingOut(true);

    try {
      await authApi.logout();
    } catch {
      // Se o backend rejeitar a sessao atual, ainda limpamos o navegador.
    } finally {
      clearAuthSession();
      setStatus("unauthenticated");
      setSession(null);
      setProfile(null);
      router.replace("/login");
      setIsLoggingOut(false);
    }
  }, [router]);

  const roles = useMemo(() => {
    return Array.isArray(profile?.roles) ? profile.roles : [];
  }, [profile]);

  return {
    error,
    isLoggingOut,
    isRefreshing,
    logout,
    profile,
    refreshSession: () => syncSession({ forceRefresh: true }),
    roles,
    session,
    status,
  };
}
