"use client";

import AuthFeedback from "@/features/auth/components/AuthFeedback";
import AuthFields from "@/features/auth/components/AuthFields";
import AuthFormHeader from "@/features/auth/components/AuthFormHeader";
import AuthFormLinks from "@/features/auth/components/AuthFormLinks";
import AuthResultPanel from "@/features/auth/components/AuthResultPanel";
import { useAuthForm } from "@/features/auth/hooks/useAuthForm";

export default function AuthForm({
  content,
}) {
  const {
    mode,
    formTitle,
    formDescription,
    fields,
    submitLabel,
    helperText,
    successPrefix,
    secondaryLink,
    auxiliaryLinks = [],
  } = content;
  const {
    values,
    errors,
    feedback,
    result,
    isSubmitting,
    handleChange,
    handleSubmit,
  } = useAuthForm({
    mode,
    fields,
    successPrefix,
  });

  return (
    <div className="rounded-[30px] border border-black/10 bg-[var(--panel-strong)] px-5 py-6 shadow-[0_18px_50px_rgba(20,32,43,0.08)] sm:px-8 sm:py-8">
      <AuthFormHeader
        mode={mode}
        title={formTitle}
        description={formDescription}
      />

      <form className="space-y-5" onSubmit={handleSubmit}>
        <AuthFields
          fields={fields}
          values={values}
          errors={errors}
          onChange={handleChange}
        />

        <AuthFeedback feedback={feedback} />

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Enviando..." : submitLabel}
        </button>
      </form>

      <AuthResultPanel result={result} />

      <AuthFormLinks
        helperText={helperText}
        secondaryLink={secondaryLink}
        auxiliaryLinks={auxiliaryLinks}
      />
    </div>
  );
}
