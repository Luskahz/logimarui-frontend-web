"use client";

import { useEffect, useMemo, useState } from "react";
import { authorizationApi } from "@/features/authorization/lib/authorizationApi";
import { useAuthorizationStore } from "@/features/authorization/store/useAuthorizationStore";

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
  return String(permission?.code ?? "PERMISSION_CODE");
}

function getPermissionDescription(permission) {
  return String(permission?.description ?? "Sem descricao cadastrada.");
}

function getPermissionModule(permission) {
  return String(permission?.module ?? "GERAL");
}

function sortPermissions(permissions) {
  return [...permissions].sort((first, second) => {
    const moduleCompare = getPermissionModule(first).localeCompare(getPermissionModule(second), "pt-BR");

    if (moduleCompare !== 0) {
      return moduleCompare;
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

function ActionButton({ children, disabled = false, onClick, tone = "default", type = "button" }) {
  const toneClass = tone === "primary"
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

function EmptyState() {
  return (
    <section className="rounded-[26px] border border-dashed border-[color:var(--shell-line-strong)] bg-[var(--shell-surface)] p-6 text-sm text-[var(--shell-muted)]">
      Selecione uma role para carregar e editar as permissoes vinculadas.
    </section>
  );
}

export default function RolePermissionManager() {
  const role = useAuthorizationStore((state) => state.selectedRole);
  const roleId = getRoleId(role);
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState([]);
  const [feedback, setFeedback] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionPermissionId, setActionPermissionId] = useState(null);

  const groupedPermissions = useMemo(() => {
    const groups = new Map();

    for (const permission of sortPermissions(allPermissions)) {
      const moduleName = getPermissionModule(permission);

      if (!groups.has(moduleName)) {
        groups.set(moduleName, []);
      }

      groups.get(moduleName).push(permission);
    }

    return Array.from(groups.entries());
  }, [allPermissions]);

  const selectedCount = selectedPermissionIds.length;

  async function fetchPermissionState(targetRoleId) {
    const [permissions, rolePermissions] = await Promise.all([
      authorizationApi.findAllPermissions(),
      authorizationApi.findPermissionsByRole(targetRoleId),
    ]);

    return {
      permissions: Array.isArray(permissions) ? permissions : [],
      selectedIds: (Array.isArray(rolePermissions) ? rolePermissions : [])
        .map(getPermissionId)
        .filter(Boolean),
    };
  }

  function syncPermissionState(permissionState) {
    setAllPermissions(permissionState.permissions);
    setSelectedPermissionIds(permissionState.selectedIds);
  }

  async function loadPermissions({ silent = false } = {}) {
    if (!roleId) {
      setAllPermissions([]);
      setSelectedPermissionIds([]);
      return;
    }

    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }

    setFeedback(null);

    try {
      const permissionState = await fetchPermissionState(roleId);
      syncPermissionState(permissionState);
    } catch (error) {
      setFeedback({ type: "error", message: error?.message || "Nao foi possivel carregar as permissoes da role." });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      void (async () => {
        if (!roleId) {
          setAllPermissions([]);
          setSelectedPermissionIds([]);
          return;
        }

        setIsLoading(true);
        setFeedback(null);

        try {
          const permissionState = await fetchPermissionState(roleId);
          syncPermissionState(permissionState);
        } catch (error) {
          setFeedback({ type: "error", message: error?.message || "Nao foi possivel carregar as permissoes da role." });
        } finally {
          setIsLoading(false);
        }
      })();
    }, 0);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [roleId]);

  async function handleTogglePermission(permission) {
    const permissionId = getPermissionId(permission);

    if (!roleId || !permissionId) {
      setFeedback({ type: "error", message: "Role ou permissao invalida." });
      return;
    }

    const isSelected = selectedPermissionIds.includes(permissionId);
    setActionPermissionId(permissionId);
    setFeedback(null);

    try {
      if (isSelected) {
        await authorizationApi.removePermissionFromRole(roleId, permissionId);
        setSelectedPermissionIds((current) => current.filter((candidate) => candidate !== permissionId));
        setFeedback({ type: "success", message: `Permissao ${getPermissionCode(permission)} removida da role.` });
      } else {
        await authorizationApi.assignPermissionToRole(roleId, permissionId);
        setSelectedPermissionIds((current) => [...current, permissionId]);
        setFeedback({ type: "success", message: `Permissao ${getPermissionCode(permission)} vinculada a role.` });
      }
    } catch (error) {
      setFeedback({ type: "error", message: error?.message || "Nao foi possivel atualizar a permissao da role." });
    } finally {
      setActionPermissionId(null);
    }
  }

  if (!roleId) {
    return <EmptyState />;
  }

  return (
    <section className="rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface)] p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--shell-accent)]">
            Permissoes
          </p>
          <h2 className="mt-2 font-serif text-2xl text-[var(--shell-text)]">
            {getRoleName(role)}
          </h2>
          <p className="mt-2 text-sm leading-6 text-[var(--shell-muted)]">
            Selecione quais permissoes devem ficar vinculadas a role atual.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <ActionButton onClick={() => loadPermissions({ silent: true })} disabled={isLoading || isRefreshing}>
            {isRefreshing ? "Atualizando..." : "Atualizar"}
          </ActionButton>
          <div className="rounded-2xl border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] px-4 py-3 text-right">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--shell-muted)]">
              Vinculadas
            </p>
            <p className="mt-1 text-lg font-semibold text-[var(--shell-text)]">
              {selectedCount}
            </p>
          </div>
        </div>
      </div>

      <FeedbackBanner feedback={feedback} onDismiss={() => setFeedback(null)} />

      {isLoading ? (
        <div className="mt-5 rounded-[26px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-6 text-sm text-[var(--shell-muted)]">
          Carregando permissoes...
        </div>
      ) : groupedPermissions.length === 0 ? (
        <div className="mt-5 rounded-[26px] border border-dashed border-[color:var(--shell-line-strong)] bg-[var(--shell-surface-muted)] p-6 text-sm text-[var(--shell-muted)]">
          Nenhuma permissao retornada pelo core-api.
        </div>
      ) : (
        <div className="mt-5 grid gap-4">
          {groupedPermissions.map(([module, permissions]) => (
            <section
              key={module}
              className="rounded-[24px] border border-[color:var(--shell-line)] bg-[var(--shell-surface-muted)] p-4"
            >
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--shell-accent)]">
                    Modulo
                  </p>
                  <h3 className="mt-1 text-lg font-semibold text-[var(--shell-text)]">
                    {module}
                  </h3>
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--shell-muted)]">
                  {permissions.length} permissoes
                </p>
              </div>

              <div className="grid gap-2">
                {permissions.map((permission) => {
                  const permissionId = getPermissionId(permission);
                  const checked = selectedPermissionIds.includes(permissionId);
                  const disabled = actionPermissionId === permissionId;

                  return (
                    <label
                      key={permissionId || getPermissionCode(permission)}
                      className={`flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3 transition ${
                        checked
                          ? "border-[color:var(--shell-accent)] bg-[var(--shell-accent-soft)]"
                          : "border-[color:var(--shell-line)] bg-[var(--shell-surface)] hover:border-[color:var(--shell-line-strong)]"
                      } ${disabled ? "opacity-70" : ""}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => handleTogglePermission(permission)}
                        className="mt-1 h-4 w-4 accent-[var(--shell-accent)]"
                      />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-[var(--shell-text)]">
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
            </section>
          ))}
        </div>
      )}
    </section>
  );
}
