import AuthPage from "@/views/auth/ui/AuthView";

export const metadata = {
  title: "Definir nova senha",
};

export default function PasswordRecoveryResetPage() {
  return <AuthPage pageKey="passwordRecoveryReset" />;
}
