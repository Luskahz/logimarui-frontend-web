"use client";

import { create } from "zustand";
import { authorizationApi } from "@/features/authorization/lib/authorizationApi";

const EMPTY_ROLE_FORM = {
  name: "",
  description: "",
};

function normalizeRoles(result) {
  return Array.isArray(result) ? result : [];
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

function syncLoadedRoles(currentState, normalizedRoles) {
  const nextSelectedRole = (() => {
    const currentSelectedRoleId = getRoleId(currentState.selectedRole);

    if (!currentSelectedRoleId) {
      return currentState.selectedRole;
    }

    return normalizedRoles.find((role) => getRoleId(role) === currentSelectedRoleId) ?? null;
  })();

  const nextEditingRole = (() => {
    const currentEditingRoleId = getRoleId(currentState.editingRole);

    if (!currentEditingRoleId) {
      return currentState.editingRole;
    }

    return normalizedRoles.find((role) => getRoleId(role) === currentEditingRoleId) ?? null;
  })();

  return {
    roles: normalizedRoles,
    selectedRole: nextSelectedRole,
    editingRole: nextEditingRole,
  };
}

export const useAuthorizationStore = create((set, get) => ({
  roles: [],
  roleForm: EMPTY_ROLE_FORM,
  editingRole: null,
  selectedRole: null,
  feedback: null,
  isLoading: true,
  isSubmitting: false,
  actionInProgress: null,

  dismissFeedback() {
    set({ feedback: null });
  },

  async loadRoles({ silent = false } = {}) {
    if (!silent) {
      set({
        isLoading: true,
        feedback: null,
      });
    }

    try {
      const normalizedRoles = normalizeRoles(await authorizationApi.findAllRoles());

      set((current) => ({
        ...syncLoadedRoles(current, normalizedRoles),
        isLoading: false,
      }));
    } catch (error) {
      set({
        isLoading: false,
        feedback: {
          type: "error",
          message: error?.message || "Nao foi possivel carregar as roles.",
        },
      });
    }
  },

  handleRoleFormChange(event) {
    const { name, value } = event.target;

    set((current) => ({
      roleForm: {
        ...current.roleForm,
        [name]: value,
      },
    }));
  },

  editRole(role) {
    set({
      selectedRole: role,
      editingRole: role,
      roleForm: {
        name: getRoleName(role),
        description: String(role?.description ?? ""),
      },
      feedback: null,
    });
  },

  selectRole(role) {
    set({ selectedRole: role });
  },

  clearRoleForm() {
    set({
      editingRole: null,
      roleForm: EMPTY_ROLE_FORM,
    });
  },

  async submitRole() {
    const { editingRole, roleForm } = get();
    const payload = normalizeRoleForm(roleForm);

    if (!payload.name) {
      set({
        feedback: {
          type: "error",
          message: "Informe o nome da role.",
        },
      });
      return;
    }

    set({
      isSubmitting: true,
      feedback: null,
    });

    try {
      let savedRole = null;

      if (editingRole) {
        savedRole = await authorizationApi.updateRole(getRoleId(editingRole), payload);
        set({
          feedback: {
            type: "success",
            message: "Role atualizada com sucesso.",
          },
        });
      } else {
        savedRole = await authorizationApi.createRole(payload);
        set({
          feedback: {
            type: "success",
            message: "Role criada com sucesso.",
          },
        });
      }

      get().clearRoleForm();

      if (savedRole) {
        set({ selectedRole: savedRole });
      }

      await get().loadRoles({ silent: true });
    } catch (error) {
      set({
        feedback: {
          type: "error",
          message: error?.message || "Nao foi possivel salvar a role.",
        },
      });
    } finally {
      set({ isSubmitting: false });
    }
  },

  async runRoleAction(role, action, successMessage) {
    const roleId = getRoleId(role);

    if (!roleId) {
      set({
        feedback: {
          type: "error",
          message: "Role sem ID valido.",
        },
      });
      return;
    }

    set({
      actionInProgress: roleId,
      feedback: null,
    });

    try {
      await action(roleId);

      set({
        feedback: {
          type: "success",
          message: successMessage,
        },
      });

      await get().loadRoles({ silent: true });
    } catch (error) {
      set({
        feedback: {
          type: "error",
          message: error?.message || "Nao foi possivel concluir a acao.",
        },
      });
    } finally {
      set({ actionInProgress: null });
    }
  },

  async deleteRole(role) {
    if (get().selectedRole && getRoleId(get().selectedRole) === getRoleId(role)) {
      set({ selectedRole: null });
    }

    await get().runRoleAction(
      role,
      authorizationApi.deleteRole,
      "Role excluida com sucesso.",
    );
  },
}));
