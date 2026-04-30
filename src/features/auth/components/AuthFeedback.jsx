export default function AuthFeedback({ feedback }) {
  if (!feedback?.message) {
    return null;
  }

  const isSuccess = feedback.type === "success";

  return (
    <div
      role={isSuccess ? "status" : "alert"}
      aria-live="polite"
      className={`rounded-2xl border px-4 py-3 text-sm leading-6 ${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      {feedback.message}
    </div>
  );
}
