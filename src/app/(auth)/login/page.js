import AuthPage from "@/views/auth/ui/AuthView";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return <AuthPage pageKey="login" />;
}
