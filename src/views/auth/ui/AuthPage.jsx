"use client";

import { useEffect } from "react";
import AuthCard from "@/features/auth/components/AuthCard";
import AuthForm from "@/features/auth/components/AuthForm";
import { useAuthFormStore } from "@/features/auth/store/useAuthFormStore";

export default function AuthPage({ pageKey }) {
  const currentPageKey = useAuthFormStore((state) => state.pageKey);
  const setPage = useAuthFormStore((state) => state.setPage);

  useEffect(() => {
    setPage(pageKey);
  }, [pageKey, setPage]);

  return (
    <AuthCard>
      {currentPageKey === pageKey ? <AuthForm /> : null}
    </AuthCard>
  );
}
