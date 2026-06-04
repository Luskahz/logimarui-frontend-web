"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { resolveSessionRoles } from "@/features/auth/lib/sessionView";
import { useSessionStore } from "@/features/auth/store/useSessionStore";

export function useHomeSession() {
  const router = useRouter();
  const error = useSessionStore((state) => state.error);
  const isLoggingOut = useSessionStore((state) => state.isLoggingOut);
  const logoutAction = useSessionStore((state) => state.logout);
  const profile = useSessionStore((state) => state.profile);
  const session = useSessionStore((state) => state.session);
  const status = useSessionStore((state) => state.status);
  const syncSession = useSessionStore((state) => state.syncSession);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void syncSession(router);
    }, 0);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [router, syncSession]);

  useEffect(() => {
    function syncHiddenSession() {
      if (document.visibilityState === "visible") {
        void syncSession(router);
      }
    }

    function handleWindowFocus() {
      void syncSession(router);
    }

    document.addEventListener("visibilitychange", syncHiddenSession);
    window.addEventListener("focus", handleWindowFocus);

    return () => {
      document.removeEventListener("visibilitychange", syncHiddenSession);
      window.removeEventListener("focus", handleWindowFocus);
    };
  }, [router, syncSession]);

  const roles = useMemo(() => {
    return resolveSessionRoles(profile);
  }, [profile]);

  return {
    error,
    isLoggingOut,
    logout: () => logoutAction(router),
    profile,
    roles,
    session,
    status,
  };
}
