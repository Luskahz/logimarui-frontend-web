import AuthPage from "@/views/auth/ui/AuthView";

export const metadata = {
  title: "Criar conta",
};

export default function RegisterPage() {
  return <AuthPage pageKey="register" />;
}
