import AuthView from "@/views/auth/ui/AuthView";

export const metadata = {
  title: "Criar conta",
};

export default function RegisterPage() {
  return <AuthView pageKey="register" />;
}