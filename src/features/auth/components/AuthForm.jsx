"use client";

import AuthFeedback from "@/features/auth/components/AuthFeedback";
import AuthFields from "@/features/auth/components/AuthFields";
import AuthFormHeader from "@/features/auth/components/AuthFormHeader";
import AuthFormLinks from "@/features/auth/components/AuthFormLinks";
import AuthResultPanel from "@/features/auth/components/AuthResultPanel";
import { useAuthFormStore } from "@/features/auth/store/useAuthFormStore";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

export default function AuthForm() {
  const isSubmitting = useAuthFormStore((state) => state.isSubmitting);
  const submit = useAuthFormStore((state) => state.submit);
  const submitLabel = useAuthFormStore(
    (state) => state.content?.submitLabel || "Enviar",
  );

  function handleSubmit(event) {
    event.preventDefault();
    void submit();
  }

  return (
    <Card className="px-5 py-6 shadow-[0_18px_50px_rgba(20,32,43,0.08)] sm:px-8 sm:py-8">
      <AuthFormHeader />

      <form className="space-y-3" onSubmit={handleSubmit}>
        <AuthFields />  

        <AuthFeedback />
        <Button
          type="submit"
          variant="default"
          disabled={isSubmitting}
          className="mt-3 w-full bg-slate-950  transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Enviando..." : submitLabel}
        </Button>
      </form>

      <AuthResultPanel />

      <AuthFormLinks />
    </Card>
  );
}
