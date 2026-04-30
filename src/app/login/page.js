import AuthPage from "@/features/auth/components/AuthPage";

export const metadata = {
  title: "Login",
};

export default function LoginPage() {
  return <AuthPage pageKey="login" />;
}
