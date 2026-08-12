import { useAuthFormStore } from "@/features/auth/store/useAuthFormStore";
import { Alert } from "@/shared/ui/alert";
import { Card } from "@/shared/ui/card";

export default function AuthFeedback() {
  const feedback = useAuthFormStore((state) => state.feedback);

  if (!feedback?.message) {
    return null;
  }

  const isSuccess = feedback.type === "success";

  return (
    <Alert
      role={isSuccess ? "status" : "alert"}
      aria-live="polite"
      className={`${
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-900"
          : "border-rose-200 bg-rose-50 text-rose-900"
      }`}
    >
      {feedback.message}
    </Alert>
  );
}
