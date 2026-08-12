import Link from "next/link";
import AuthenticatedShell from "@/shared/app-shell/components/AuthenticatedShell";
import { APP_ROUTES } from "@/shared/navigation/lib/appRoutes";

export default function DpoManagementPage() {
  return (
    <AuthenticatedShell>
      <Link
        href={APP_ROUTES.DPO_DTO_MANAGER}
        className="flex min-h-40 w-full max-w-sm items-center justify-center rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-6 text-center transition hover:-translate-y-0.5 hover:border-[color:var(--shell-line-strong)] hover:bg-[var(--shell-surface-muted)] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--shell-accent)]"
      >
        <span className="font-serif text-2xl text-[var(--shell-text)]">
          Gerenciador de DTO&apos;s
        </span>
      </Link>
    </AuthenticatedShell>
  );
}
