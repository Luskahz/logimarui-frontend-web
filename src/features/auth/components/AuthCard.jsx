export default function AuthCard({
  footer,
  children,
}) {
  return (
    <main className="min-h-screen px-4 py-6 sm:px-6 sm:py-8">
      <div className="mx-auto flex min-h-screen max-w-3xl items-center justify-center">
        <div className="w-full max-w-[540px]">
          {children}
          <p className="mt-7 text-center text-[11px] uppercase tracking-[0.3em] text-slate-500 sm:text-xs">
            {footer}
          </p>
        </div>
      </div>
    </main>
  );
}
