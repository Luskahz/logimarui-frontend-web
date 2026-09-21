export default function ShellLoadingState() {
  return (
    <div className="home-shell">
      <div className="fixed inset-x-0 top-0 z-50 px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="h-[72px] animate-pulse rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] shadow-[0_18px_60px_rgba(20,32,43,0.08)]" />
        </div>
      </div>

      <main className="min-h-screen px-4 pb-6 pt-28 sm:px-6 sm:pb-8 sm:pt-32">
        <div className="mx-auto max-w-7xl rounded-[30px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-strong)] p-5 shadow-[0_18px_60px_rgba(20,32,43,0.08)] sm:p-6">
          <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
            <div className="h-72 animate-pulse rounded-[28px] bg-[var(--shell-surface-muted)]" />
            <div className="space-y-4">
              <div className="h-32 animate-pulse rounded-[28px] bg-[var(--shell-surface-muted)]" />
              <div className="h-32 animate-pulse rounded-[28px] bg-[var(--shell-surface-muted)]" />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
