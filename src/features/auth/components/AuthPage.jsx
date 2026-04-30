import AuthCard from "@/features/auth/components/AuthCard";
import AuthForm from "@/features/auth/components/AuthForm";
import { AUTH_PAGE_CONTENT } from "@/features/auth/lib/constants";

export default function AuthPage({ pageKey }) {
  const content = AUTH_PAGE_CONTENT[pageKey];

  if (!content) {
    throw new Error(`Unknown auth page key: ${pageKey}`);
  }

  return (
    <AuthCard footer={content.footer}>
      <AuthForm content={content} />
    </AuthCard>
  );
}
