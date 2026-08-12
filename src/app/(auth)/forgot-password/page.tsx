import AuthView from "@/views/auth/ui/AuthView";

export const metadata = {
  title: "Recuperar senha",
};

export default function ForgotPasswordPage() {
  return <AuthView pageKey="forgotPassword" />;
}
