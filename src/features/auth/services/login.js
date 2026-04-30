import { authApi } from "@/features/auth/lib/authApi";
import { buildSessionResult } from "@/features/auth/lib/authResult";
import { persistSession, toEmployeeId } from "@/features/auth/services/shared";

export async function loginService(payload) {
  const tokens = await authApi.login({
    employeeId: toEmployeeId(payload.employeeId),
    password: String(payload.password ?? ""),
  });
  const { profile, profileLoaded } = await persistSession(tokens);

  return {
    ok: true,
    message: profileLoaded
      ? "Sessao iniciada com sucesso."
      : "Sessao iniciada com sucesso. Os detalhes completos da sessao nao puderam ser carregados agora.",
    result: buildSessionResult(tokens, profile),
  };
}
