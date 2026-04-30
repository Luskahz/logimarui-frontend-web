"use client";

import { formatDuration } from "@/features/auth/lib/authFormatters";

function formatExpiry(session) {
  if (!session?.expiresAt) {
    return "Sem expiracao informada";
  }

  const remainingMs = Date.parse(session.expiresAt) - Date.now();

  if (!Number.isFinite(remainingMs)) {
    return "Sem expiracao informada";
  }

  if (remainingMs <= 0) {
    return "Expirada";
  }

  return formatDuration(Math.floor(remainingMs / 1000));
}

export default function HomeDashboard({
  error,
  isRefreshing,
  profile,
  profileHeading,
  refreshSession,
  roleSummary,
  roles,
  session,
}) {
  return (
    <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
      <section className="rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
              Home
            </p>
            <h1 className="mt-3 font-serif text-3xl text-[var(--shell-text)] sm:text-4xl">
              Base inicial da area logada
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--shell-muted)]">
              O conteudo principal ainda esta em definicao. Nesta etapa, a home
              serve para consolidar sessao, descobrir perfis via <code>/me</code>,
              renovar tokens com <code>/refresh</code> e encerrar o acesso com
              <code>/logout</code>.
            </p>
          </div>

          <button
            type="button"
            onClick={refreshSession}
            disabled={isRefreshing}
            className="inline-flex items-center gap-2 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3 text-sm font-semibold text-[var(--shell-text)] transition hover:border-[color:var(--shell-text)] disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isRefreshing ? "Atualizando..." : "Atualizar sessao"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <article className="rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
              Usuario
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--shell-text)]">
              {profileHeading}
            </p>
            <p className="mt-2 text-sm text-[var(--shell-muted)]">
              Status da sessao: {profile?.sessionActive ? "ativa" : "em validacao"}
            </p>
          </article>

          <article className="rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
              Perfis
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--shell-text)]">
              {roles.length || 0}
            </p>
            <p className="mt-2 text-sm text-[var(--shell-muted)]">{roleSummary}</p>
          </article>

          <article className="rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
              Expiracao
            </p>
            <p className="mt-3 text-lg font-semibold text-[var(--shell-text)]">
              {formatExpiry(session)}
            </p>
            <p className="mt-2 text-sm text-[var(--shell-muted)]">
              Refresh token {session?.refreshToken ? "disponivel" : "ausente"}.
            </p>
          </article>
        </div>

        <div className="mt-6 rounded-[28px] border border-dashed border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] p-5">
          <p className="text-sm font-semibold text-[var(--shell-text)]">
            Conteudo da home em definicao
          </p>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-[var(--shell-muted)]">
            Este bloco existe apenas para reservar o espaco principal da
            aplicacao. Quando a navegacao e os modulos forem definidos, o
            conteudo operacional pode entrar aqui sem trocar a estrutura de
            sessao e header.
          </p>
        </div>
      </section>

      <aside className="space-y-4">
        <section className="rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]">
            Sessao local
          </p>

          <dl className="mt-4 space-y-3 text-sm">
            <div className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
              <dt className="text-[var(--shell-muted)]">Session ID</dt>
              <dd className="mt-1 font-semibold text-[var(--shell-text)]">
                {profile?.sessionId ?? "Nao informado"}
              </dd>
            </div>

            <div className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
              <dt className="text-[var(--shell-muted)]">Expires in</dt>
              <dd className="mt-1 font-semibold text-[var(--shell-text)]">
                {formatExpiry(session)}
              </dd>
            </div>

            <div className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
              <dt className="text-[var(--shell-muted)]">Ultimo snapshot</dt>
              <dd className="mt-1 font-semibold text-[var(--shell-text)]">
                {session?.savedAt
                  ? new Date(session.savedAt).toLocaleString("pt-BR")
                  : "Nao salvo"}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-[28px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]">
            Estado do token
          </p>

          <ul className="mt-4 space-y-3 text-sm text-[var(--shell-muted)]">
            <li className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
              Access token salvo no `localStorage`.
            </li>
            <li className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
              A home tenta renovar a sessao quando a expiracao esta proxima.
            </li>
            <li className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3">
              O endpoint <code>/me</code> atualiza perfis e confirma se a sessao segue ativa.
            </li>
          </ul>

          {error ? (
            <p className="mt-4 rounded-2xl border border-[color:var(--shell-danger)] bg-[var(--shell-danger-bg)] px-4 py-3 text-sm text-[var(--shell-danger)]">
              {error}
            </p>
          ) : null}
        </section>
      </aside>
    </div>
  );
}
