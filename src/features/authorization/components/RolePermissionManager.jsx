"use client";

import { useEffect, useMemo, useState } from "react";
import { authorizationApi } from "@/features/authorization/lib/authorizationApi";

function getRoleId(role) {
  return Number(role?.id ?? role?.roleId ?? 0);
}

function getRoleName(role) {
  return String(role?.name ?? role?.code ?? "Role sem nome");
}

function getPermissionId(permission) {
  return Number(permission?.id ?? permission?.permissionId ?? 0);
}

function getPermissionCode(permission) {
  return String(permission?.code ?? permission?.permissionCode ?? "PERMISSION_SEM_CODIGO");
}

function getPermissionDescription(permission) {
  return String(permission?.description ?? permission?.descricao ?? "Sem descricao cadastrada.");
}

function getPermissionModule(permission) {
  return String(permission?.module ?? permission?.moduleCode ?? permission?.modulo ?? "OUTROS").toUpperCase();
}

function normalizeArray(value, fallbackKey) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value && Array.isArray(value[fallbackKey])) {
    return value[fallbackKey];
  }

  return [];
}

function groupPermissionsByModule(permissions) {
  return permissions.reduce((groups, permission) => {
    const module = getPermissionModule(permission);

    if (!groups[module]) {
      groups[module] = [];
    }

    groups[module].push(permission);
    return groups;
  }, {});
}

function sortPermissions(permissions) {
  return [...permissions].sort((first, second) => {
    const moduleComparison = getPermissionModule(first).localeCompare(getPermissionModule(second), "pt-BR");

    if (moduleComparison !== 0) {
      return moduleComparison;
    }

    return getPermissionCode(first).localeCompare(getPermissionCode(second), "pt-BR");
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
    <div className={`mt-4 flex items-start justify-between gap-3 rounded-[22px] border px-4 py-3 text-sm ${toneClass}`}>
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

export default function RolePermissionManager({ role }) {
  const roleId = getRoleId(role);
  const [permissions, setPermissions] = useState([]);
  const [rolePermissionIds, setRolePermissionIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [permissionInProgress, setPermissionInProgress] = useState(null);

  const groupedPermissions = useMemo(() => {
    const sorted = sortPermissions(permissions);
    return groupPermissionsByModule(sorted);
  }, [permissions]);

  async function loadRolePermissions(targetRoleId = roleId) {
    if (!targetRoleId) {
      setRolePermissionIds([]);
      return;
    }

    const result = await authorizationApi.findPermissionsByRole(targetRoleId);
    const normalizedPermissions = normalizeArray(result, "permissions");
    setRolePermissionIds(normalizedPermissions.map(getPermissionId).filter(Boolean));
  }

  async function loadPermissions() {
    if (!roleId) {
      return;
    }

    setIsLoading(true);
    setFeedback(null);

    try {
      const [allPermissionsResult] = await Promise.all([
        authorizationApi.findAllPermissions(),
        loadRolePermissions(roleId),
      ]);

      setPermissions(normalizeArray(allPermissionsResult, "permissions"));
    } catch (error) {
      setFeedback({ type: "error", message: error?.message || "Nao foi possivel carregar as permissoes da role." });
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadPermissions();
  }, [roleId]);

  async function togglePermission(permission) {
    const permissionId = getPermissionId(permission);

    if (!roleId || !permissionId) {
      setFeedback({ type: "error", message: "Role ou permissao sem ID valido." });
      return;
    }

    const alreadyAssigned = rolePermissionIds.includes(permissionId);
    setPermissionInProgress(permissionId);
    setFeedback(null);

    try {
      if (alreadyAssigned) {
        await authorizationApi.removePermissionFromRole(roleId, permissionId);
      } else {
        await authorizationApi.assignPermissionToRole(roleId, permissionId);
      }

      await loadRolePermissions(roleId);
      setFeedback({
        type: "success",
        message: alreadyAssigned ? "Permissao removida da role." : "Permissao adicionada a role.",
      });
    } catch (error) {
      setFeedback({ type: "error", message: error?.message || "Nao foi possivel atualizar a permissao da role." });
    } finally {
      setPermissionInProgress(null);
    }
  }

  if (!roleId) {
    return (
      <section className="rounded-[26px] border border-dashed border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)] p-6 text-center text-sm text-[var(--shell-muted)]">
        Selecione uma role para gerenciar as permissoes vinculadas.
      </section>
    );
  }

  return (
    <section className="rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
            Permissoes da role
          </p>
          <h2 className="mt-2 font-serif text-2xl text-[var(--shell-text)]">
            {getRoleName(role)}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--shell-muted)]">
            Marque ou desmarque permissoes para controlar o acesso desse grupo.
          </p>
        </div>

        <button
          type="button"
          onClick={loadPermissions}
          disabled={isLoading}
          className="inline-flex items-center justify-center rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface)] px-3.5 py-2.5 text-sm font-semibold text-[var(--shell-text)] transition hover:border-[color:var(--shell-line-strong)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoading ? "Atualizando..." : "Atualizar permissoes"}
        </button>
      </div>

      <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      {isLoading ? (
        <div className="mt-5 rounded-[22px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-5 text-sm text-[var(--shell-muted)]">
          Carregando permissoes...
        </div>
      ) : permissions.length === 0 ? (
        <div className="mt-5 rounded-[22px] border border-dashed border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] p-5 text-center text-sm text-[var(--shell-muted)]">
          Nenhuma permissao retornada pelo core-api.
        </div>
      ) : (
        <div className="mt-5 space-y-4">
          {Object.entries(groupedPermissions).map(([module, modulePermissions]) => (
            <div key={module} className="rounded-[22px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-[var(--shell-text)]">
                  {module}
                </h3>
                <span className="rounded-full border border-[color:var(--shell-line)] px-2.5 py-1 text-[11px] font-semibold text-[var(--shell-muted)]">
                  {modulePermissions.length} permissoes
                </span>
              </div>

              <div className="grid gap-2">
                {modulePermissions.map((permission) => {
                  const permissionId = getPermissionId(permission);
                  const checked = rolePermissionIds.includes(permissionId);
                  const disabled = permissionInProgress === permissionId;

                  return (
                    <label
                      key={permissionId || getPermissionCode(permission)}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                        checked
                          ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)]"
                          : "border-[color:var(--shell-line)] bg-[var(--shell-surface)] hover:border-[color:var(--shell-line-strong)]"
                      } ${disabled ? "opacity-60" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => togglePermission(permission)}
                        className="mt-1 h-4 w-4 accent-[var(--shell-accent)]"
                      />
                      <span className="min-w-0">
                        <span className="block break-words text-sm font-semibold text-[var(--shell-text)]">
                          {getPermissionCode(permission)}
                        </span>
                        <span className="mt-1 block text-xs leading-5 text-[var(--shell-muted)]">
                          {getPermissionDescription(permission)}
                        </span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
