import AuthView from "@/views/auth/ui/AuthView";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return <AuthView pageKey="login" />;
}
