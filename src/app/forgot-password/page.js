import AuthPage from "@/features/auth/components/AuthPage";

export const metadata = {
  title: "Recuperar senha",
};

export default function ForgotPasswordPage() {
  return <AuthPage pageKey="forgotPassword" />;
}
