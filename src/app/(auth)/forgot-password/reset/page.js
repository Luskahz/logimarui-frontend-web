import AuthPage from "@/features/auth/components/AuthPage";

export const metadata = {
  title: "Definir nova senha",
};

export default function PasswordRecoveryResetPage() {
  return <AuthPage pageKey="passwordRecoveryReset" />;
}
