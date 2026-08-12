import AuthPage from "@/views/auth/ui/AuthView";

export const metadata = {
  title: "Recuperar senha",
};

export default function ForgotPasswordPage() {
  return <AuthPage pageKey="forgotPassword" />;
}
