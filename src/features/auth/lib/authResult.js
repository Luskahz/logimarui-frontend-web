import {
  formatDuration,
  formatRoles,
} from "@/features/auth/lib/authFormatters";

function resolveProfileRoles(profile) {
  if (Array.isArray(profile?.roles) && profile.roles.length > 0) {
    return profile.roles;
  }

  if (Array.isArray(profile?.authorities) && profile.authorities.length > 0) {
    return profile.authorities;
  }

  return [];
}

function formatDateTime(value) {
  if (!value) {
    return "Nao informado";
  }

  const parsedDate = new Date(value);

  if (Number.isNaN(parsedDate.getTime())) {
    return String(value);
  }

  return parsedDate.toLocaleString("pt-BR");
}

function formatRecoveryMethod(method) {
  switch (String(method ?? "")) {
    case "EMAIL_TOKEN":
      return "Link enviado por e-mail";
    case "ADMIN_RESET_LINK":
      return "Link administrativo";
    case "ADMIN_TEMPORARY_PASSWORD":
      return "Senha temporaria";
    case "UNDEFINED":
      return "Pendente de definicao";
    default:
      return "Nao informado";
  }
}

export function buildSessionResult(tokens, profile) {
  const items = [
    {
      label: "Expira em",
      value: formatDuration(tokens?.expiresInSeconds),
    },
  ];

  if (profile) {
    items.unshift(
      {
        label: "Usuario",
        value: String(profile.userId),
      },
      {
        label: "Sessao",
        value: String(profile.sessionId),
      },
      {
        label: "Perfis",
        value: formatRoles(resolveProfileRoles(profile)),
      },
      {
        label: "Status",
        value: profile.sessionActive ? "Ativa" : "Inativa",
      },
    );
  } else {
    items.unshift(
      {
        label: "Sessao",
        value: "Tokens salvos neste navegador",
      },
      {
        label: "Status",
        value: "Detalhes pendentes",
      },
    );
  }

  return {
    title: "Retorno do auth",
    items,
  };
}

export function buildPasswordRecoveryResult(result) {
  const items = [
    {
      label: "Status",
      value: String(result?.status ?? "Nao informado"),
    },
    {
      label: "Metodo",
      value: formatRecoveryMethod(result?.method),
    },
    {
      label: "Expira em",
      value: formatDateTime(result?.expiresAt),
    },
  ];

  if (result?.resolvedAt) {
    items.push({
      label: "Resolvido em",
      value: formatDateTime(result.resolvedAt),
    });
  }

  if (result?.cancelledAt) {
    items.push({
      label: "Cancelado em",
      value: formatDateTime(result.cancelledAt),
    });
  }

  return {
    title: "Solicitacao registrada",
    items,
  };
}

export function buildPasswordChangeChallengeResult(result) {
  return {
    title: "Troca obrigatoria",
    items: [
      {
        label: "Status",
        value: "Senha provisoria detectada",
      },
      {
        label: "Expira em",
        value: formatDateTime(result?.passwordChangeTokenExpiresAt),
      },
    ],
  };
}

export function buildPasswordResetResult() {
  return {
    title: "Senha redefinida",
    items: [
      {
        label: "Status",
        value: "Pronta para novo login",
      },
    ],
  };
}
