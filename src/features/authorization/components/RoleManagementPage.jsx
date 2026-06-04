"use client";

import { useEffect, useMemo, useState } from "react";
import AuthenticatedShell from "@/features/app-shell/components/AuthenticatedShell";
import { authorizationApi } from "@/features/authorization/lib/authorizationApi";
import RolePermissionManager from "@/features/authorization/components/RolePermissionManager";
import { useAuthorizationStore } from "@/features/authorization/store/useAuthorizationStore";

const EMPTY_ROLE_FORM = {
  name: "",
  description: "",
};

function resolveRoleStatus(role) {
  return String(role?.status ?? "").toUpperCase();
}

function isRoleActive(role) {
  return resolveRoleStatus(role) === "ACTIVE";
}

function formatRoleStatus(role) {
  const status = resolveRoleStatus(role);

  if (status === "ACTIVE") {
    return "Ativa";
  }

  if (status === "INACTIVE") {
    return "Inativa";
  }

  if (status === "DELETED") {
    return "Excluida";
  }

  return status || "Nao informado";
}

function normalizeRoleForm(values) {
  return {
    name: String(values.name ?? "").trim(),
    description: String(values.description ?? "").trim(),
  };
}

function getRoleId(role) {
  return Number(role?.id ?? role?.roleId ?? 0);
}

function getRoleName(role) {
  return String(role?.name ?? role?.code ?? "Role sem nome");
}

function getRoleDescription(role) {
  return String(role?.description ?? "Sem descricao cadastrada.");
}

function sortRoles(roles) {
  return [...roles].sort((first, second) => {
    const statusA = resolveRoleStatus(first);
    const statusB = resolveRoleStatus(second);

    if (statusA !== statusB) {
      return statusA === "ACTIVE" ? -1 : 1;
    }

    return getRoleName(first).localeCompare(getRoleName(second), "pt-BR");
  });
}

function FeedbackBanner({ feedback, onDismiss }) {
  if (!feedback?.message) {
    return null;
  }

  const toneClass = feedback.type === "error"
    ? "border-[color:var(--shell-danger)] bg-[var(--shell-danger-bg)] text-[var(--shell-danger)]"
    : "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)] text-[var(--shell-text)]";

  return (
    <div className={`flex items-start justify-between gap-3 rounded-[22px] border px-4 py-3 text-sm ${toneClass}`}>
      <p className="leading-6">{feedback.message}</p>
      <button
        type="button"
        onClick={onDismiss}
        className="shrink-0 rounded-full border border-current px-2 py-0.5 text-xs font-semibold uppercase tracking-[0.18em] opacity-80 transition hover:opacity-100"
      >
        OK
      </button>
    </div>
  );
}

function normalizeRoles(result) {
  return Array.isArray(result) ? result : [];
}

function TextField({ label, name, onChange, placeholder, value }) {
  return (
    <label className="block">
      <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--shell-muted)]">
        {label}
      </span>
      <input
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="mt-2 w-full rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-4 py-3 text-sm text-[var(--shell-text)] outline-none transition placeholder:text-[var(--shell-muted)] focus:border-[color:var(--shell-accent)]"
      />
    </label>
  );
}

function RoleStatusBadge({ role }) {
  const active = isRoleActive(role);

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] ${
      active
        ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)] text-[var(--shell-accent)]"
        : "border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] text-[var(--shell-muted)]"
    }`}>
      {formatRoleStatus(role)}
    </span>
  );
}

function ActionButton({ children, disabled = false, onClick, tone = "default", type = "button" }) {
  const toneClass = tone === "danger"
    ? "border-[color:var(--shell-danger)] text-[var(--shell-danger)] hover:bg-[var(--shell-danger-bg)]"
    : tone === "primary"
      ? "border-[color:var(--shell-contrast)] bg-[var(--shell-contrast)] text-[var(--shell-contrast-ink)] hover:opacity-90"
      : "border-[color:var(--shell-line)] bg-[var(--shell-surface)] text-[var(--shell-text)] hover:border-[color:var(--shell-line-strong)]";

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center justify-center rounded-2xl border px-3.5 py-2.5 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClass}`}
    >
      {children}
    </button>
  );
}

function RoleForm({ editingRole, form, isSubmitting, onCancel, onChange, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
            {editingRole ? "Editar role" : "Nova role"}
          </p>
          <h2 className="mt-2 font-serif text-2xl text-[var(--shell-text)]">
            {editingRole ? getRoleName(editingRole) : "Cadastrar role"}
          </h2>
        </div>

        {editingRole ? (
          <ActionButton onClick={onCancel} disabled={isSubmitting}>
            Cancelar edicao
          </ActionButton>
        ) : null}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <TextField
          label="Nome"
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="Ex: OPERACAO_ADMIN"
        />
        <TextField
          label="Descricao"
          name="description"
          value={form.description}
          onChange={onChange}
          placeholder="Descreva o objetivo da role"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <ActionButton type="submit" tone="primary" disabled={isSubmitting}>
          {isSubmitting ? "Salvando..." : editingRole ? "Salvar alteracoes" : "Criar role"}
        </ActionButton>
      </div>
    </form>
  );
}

function RoleList({
  actionInProgress,
  editingRoleId,
  onActivate,
  onDeactivate,
  onDelete,
  onEdit,
  onSelect,
  roles,
  selectedRoleId,
}) {
  if (roles.length === 0) {
    return (
      <div className="rounded-[26px] border border-dashed border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)] p-6 text-center text-sm text-[var(--shell-muted)]">
        Nenhuma role retornada pelo core-api.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {roles.map((role) => {
        const roleId = getRoleId(role);
        const active = isRoleActive(role);
        const disabled = actionInProgress === roleId;
        const selected = selectedRoleId === roleId;
        const editing = editingRoleId === roleId;

        return (
          <article
            key={roleId || getRoleName(role)}
            className={`rounded-[24px] border p-4 transition ${
              selected
                ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)]"
                : editing
                  ? "border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)]"
                  : "border-[color:var(--shell-line)] bg-[var(--shell-surface)]"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="break-words text-base font-semibold text-[var(--shell-text)]">
                    {getRoleName(role)}
                  </h3>
                  <RoleStatusBadge role={role} />
                  {selected ? (
                    <span className="rounded-full border border-[color:var(--shell-accent)] bg-[var(--shell-surface)] px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--shell-accent)]">
                      Selecionada
                    </span>
                  ) : null}
                </div>

                <p className="mt-2 text-sm leading-6 text-[var(--shell-muted)]">
                  {getRoleDescription(role)}
                </p>

                <p className="mt-2 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shell-muted)]">
                  ID #{roleId || "-"}
                </p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <ActionButton onClick={() => onSelect(role)} disabled={disabled}>
                Permissoes
              </ActionButton>

              <ActionButton onClick={() => onEdit(role)} disabled={disabled}>
                Editar
              </ActionButton>

              {active ? (
                <ActionButton onClick={() => onDeactivate(role)} disabled={disabled}>
                  Desativar
                </ActionButton>
              ) : (
                <ActionButton onClick={() => onActivate(role)} disabled={disabled}>
                  Ativar
                </ActionButton>
              )}

              <ActionButton tone="danger" onClick={() => onDelete(role)} disabled={disabled}>
                Excluir
              </ActionButton>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function UserRolesManager() {
  const roles = useAuthorizationStore((state) => state.roles);
  const [userId, setUserId] = useState("");
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [loadedUserId, setLoadedUserId] = useState("");
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeRoles = useMemo(
    () => roles.filter((role) => resolveRoleStatus(role) !== "DELETED"),
    [roles],
  );

  function toggleRole(roleId) {
    setSelectedRoleIds((current) => (
      current.includes(roleId)
        ? current.filter((candidate) => candidate !== roleId)
        : [...current, roleId]
    ));
  }

  async function handleLoadUserRoles(event) {
    event.preventDefault();
    const normalizedUserId = String(userId ?? "").trim();

    if (!normalizedUserId) {
      setFeedback({ type: "error", message: "Informe o ID do usuario." });
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const userRoles = await authorizationApi.findRolesByUser(normalizedUserId);
      setSelectedRoleIds((Array.isArray(userRoles) ? userRoles : []).map(getRoleId).filter(Boolean));
      setLoadedUserId(normalizedUserId);
      setFeedback({ type: "success", message: "Roles do usuario carregadas." });
    } catch (error) {
      setFeedback({ type: "error", message: error?.message || "Nao foi possivel carregar as roles do usuario." });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSaveUserRoles() {
    const targetUserId = loadedUserId || String(userId ?? "").trim();

    if (!targetUserId) {
      setFeedback({ type: "error", message: "Carregue um usuario antes de salvar." });
      return;
    }

    setIsSaving(true);
    setFeedback(null);

    try {
      await authorizationApi.replaceUserRoles(targetUserId, selectedRoleIds);
      setLoadedUserId(targetUserId);
      setFeedback({ type: "success", message: "Roles do usuario atualizadas." });
    } catch (error) {
      setFeedback({ type: "error", message: error?.message || "Nao foi possivel salvar as roles do usuario." });
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4 sm:p-5">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
          Usuarios
        </p>
        <h2 className="mt-2 font-serif text-2xl text-[var(--shell-text)]">
          Atribuir roles a usuario
        </h2>
        <p className="mt-2 text-sm leading-6 text-[var(--shell-muted)]">
          Informe o ID do usuario, carregue os vinculos atuais e salve a lista final de roles.
        </p>
      </div>

      <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      <form onSubmit={handleLoadUserRoles} className="mt-5 flex flex-col gap-3 sm:flex-row">
        <input
          value={userId}
          onChange={(event) => setUserId(event.target.value)}
          placeholder="ID do usuario"
          inputMode="numeric"
          className="min-w-0 flex-1 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3 text-sm text-[var(--shell-text)] outline-none transition placeholder:text-[var(--shell-muted)] focus:border-[color:var(--shell-accent)]"
        />
        <ActionButton type="submit" tone="primary" disabled={isLoading}>
          {isLoading ? "Carregando..." : "Carregar roles"}
        </ActionButton>
      </form>

      {loadedUserId ? (
        <p className="mt-4 rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3 text-sm text-[var(--shell-muted)]">
          Editando usuario <strong className="text-[var(--shell-text)]">#{loadedUserId}</strong>
        </p>
      ) : null}

      <div className="mt-5 grid gap-2">
        {activeRoles.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-[color:var(--shell-line-strong)] px-4 py-5 text-center text-sm text-[var(--shell-muted)]">
            Nenhuma role disponivel para atribuicao.
          </p>
        ) : activeRoles.map((role) => {
          const roleId = getRoleId(role);
          const checked = selectedRoleIds.includes(roleId);

          return (
            <label
              key={roleId || getRoleName(role)}
              className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                checked
                  ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)]"
                  : "border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] hover:border-[color:var(--shell-line-strong)]"
              }`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleRole(roleId)}
                className="mt-1 h-4 w-4 accent-[var(--shell-accent)]"
              />
              <span>
                <span className="block text-sm font-semibold text-[var(--shell-text)]">
                  {getRoleName(role)}
                </span>
                <span className="mt-1 block text-xs leading-5 text-[var(--shell-muted)]">
                  {getRoleDescription(role)}
                </span>
              </span>
            </label>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        <ActionButton tone="primary" onClick={handleSaveUserRoles} disabled={isSaving || !loadedUserId}>
          {isSaving ? "Salvando..." : "Salvar roles do usuario"}
        </ActionButton>
      </div>
    </section>
  );
}

function RoleManagementContent() {
  const actionInProgress = useAuthorizationStore((state) => state.actionInProgress);
  const clearRoleForm = useAuthorizationStore((state) => state.clearRoleForm);
  const dismissFeedback = useAuthorizationStore((state) => state.dismissFeedback);
  const editingRole = useAuthorizationStore((state) => state.editingRole);
  const feedback = useAuthorizationStore((state) => state.feedback);
  const handleRoleFormChange = useAuthorizationStore((state) => state.handleRoleFormChange);
  const editRole = useAuthorizationStore((state) => state.editRole);
  const isLoading = useAuthorizationStore((state) => state.isLoading);
  const isSubmitting = useAuthorizationStore((state) => state.isSubmitting);
  const loadRoles = useAuthorizationStore((state) => state.loadRoles);
  const roleForm = useAuthorizationStore((state) => state.roleForm);
  const roles = useAuthorizationStore((state) => state.roles);
  const runRoleAction = useAuthorizationStore((state) => state.runRoleAction);
  const selectedRole = useAuthorizationStore((state) => state.selectedRole);
  const selectRole = useAuthorizationStore((state) => state.selectRole);
  const submitRole = useAuthorizationStore((state) => state.submitRole);
  const deleteRole = useAuthorizationStore((state) => state.deleteRole);

  const sortedRoles = useMemo(() => sortRoles(roles), [roles]);
  const activeRolesCount = useMemo(() => roles.filter(isRoleActive).length, [roles]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void loadRoles();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [loadRoles]);

  async function handleRoleSubmit(event) {
    event.preventDefault();
    await submitRole();
  }

  function handleDeleteRole(role) {
    const confirmed = window.confirm(`Excluir logicamente a role ${getRoleName(role)}?`);

    if (!confirmed) {
      return;
    }

    void deleteRole(role);
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
        <div className="rounded-[30px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5 sm:p-6">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[var(--shell-accent)]">
            Authorization
          </p>
          <h1 className="mt-3 font-serif text-3xl text-[var(--shell-text)] sm:text-4xl">
            Gerenciamento de roles
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[var(--shell-muted)]">
            Controle os perfis de autorizacao, permissoes vinculadas e roles dos usuarios pelo core-api.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
          <div className="rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--shell-muted)]">
              Roles totais
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--shell-text)]">
              {roles.length}
            </p>
          </div>
          <div className="rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--shell-muted)]">
              Roles ativas
            </p>
            <p className="mt-2 text-3xl font-semibold text-[var(--shell-text)]">
              {activeRolesCount}
            </p>
          </div>
        </div>
      </section>

      <FeedbackBanner feedback={feedback} onDismiss={dismissFeedback} />

      <RoleForm
        editingRole={editingRole}
        form={roleForm}
        isSubmitting={isSubmitting}
        onCancel={clearRoleForm}
        onChange={handleRoleFormChange}
        onSubmit={handleRoleSubmit}
      />

      <section className="grid gap-6 2xl:grid-cols-[1fr_1fr]">
        <div className="rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
                Catalogo
              </p>
              <h2 className="mt-2 font-serif text-2xl text-[var(--shell-text)]">
                Roles cadastradas
              </h2>
            </div>
            <ActionButton onClick={loadRoles} disabled={isLoading}>
              {isLoading ? "Atualizando..." : "Atualizar"}
            </ActionButton>
          </div>

          {isLoading ? (
            <div className="rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-6 text-sm text-[var(--shell-muted)]">
              Carregando roles...
            </div>
          ) : (
            <RoleList
              roles={sortedRoles}
              selectedRoleId={selectedRole ? getRoleId(selectedRole) : null}
              editingRoleId={editingRole ? getRoleId(editingRole) : null}
              actionInProgress={actionInProgress}
              onSelect={selectRole}
              onEdit={editRole}
              onActivate={(role) => runRoleAction(role, authorizationApi.activateRole, "Role ativada com sucesso.")}
              onDeactivate={(role) => runRoleAction(role, authorizationApi.deactivateRole, "Role desativada com sucesso.")}
              onDelete={handleDeleteRole}
            />
          )}
        </div>

        <RolePermissionManager />
      </section>

      <UserRolesManager />
    </div>
  );
}

export default function RoleManagementPage() {
  return (
    <AuthenticatedShell>
      <RoleManagementContent />
    </AuthenticatedShell>
  );
}
