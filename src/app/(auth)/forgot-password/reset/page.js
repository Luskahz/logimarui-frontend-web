import AuthPage from "@/views/auth/ui/AuthPage";

export const metadata = {
  title: "Definir nova senha",
};

export default function PasswordRecoveryResetPage() {
  return <AuthPage pageKey="passwordRecoveryReset" />;
}
