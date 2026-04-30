import AuthPage from "@/features/auth/components/AuthPage";

export const metadata = {
  title: "Criar conta",
};

export default function RegisterPage() {
  return <AuthPage pageKey="register" />;
}
