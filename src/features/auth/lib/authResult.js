import {
  formatDuration,
  formatRoles,
} from "@/features/auth/lib/authFormatters";

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
        value: formatRoles(profile.roles),
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

export function buildPasswordChangeResult(result) {
  return {
    title: "Solicitacao registrada",
    items: [
      {
        label: "Pedido",
        value: `#${result.passwordChangeRequestId}`,
      },
      {
        label: "Status",
        value: result.passwordChangeStatus,
      },
    ],
  };
}
