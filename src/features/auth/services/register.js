import { authApi } from "@/features/auth/lib/authApi";
import { buildSessionResult } from "@/features/auth/lib/authResult";
import { persistSession, toEmployeeId } from "@/features/auth/services/shared";

export async function registerService(payload) {
  const tokens = await authApi.register({
    username: String(payload.username ?? "").trim(),
    employeeId: toEmployeeId(payload.employeeId),
    password: String(payload.password ?? ""),
  });
  const { profile, profileLoaded } = await persistSession(tokens);

  return {
    ok: true,
    message: profileLoaded
      ? "Cadastro concluido e sessao iniciada com sucesso."
      : "Cadastro concluido com sucesso. Os tokens foram salvos, mas os detalhes da sessao nao carregaram agora.",
    result: buildSessionResult(tokens, profile),
  };
}
