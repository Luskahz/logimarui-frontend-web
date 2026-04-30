import { authApi } from "@/features/auth/lib/authApi";
import { buildSessionResult } from "@/features/auth/lib/authResult";
import { normalizeCpf, persistSession } from "@/features/auth/services/shared";

export async function registerService(payload) {
  const tokens = await authApi.register({
    username: String(payload.username ?? "").trim(),
    password: String(payload.password ?? ""),
    cpf: normalizeCpf(payload.cpf),
  });
  const { profile, profileLoaded } = await persistSession(tokens);

  return {
    ok: true,
    redirectTo: "/home",
    message: profileLoaded
      ? "Cadastro concluido e sessao iniciada com sucesso."
      : "Cadastro concluido com sucesso. Os tokens foram salvos, mas os detalhes da sessao nao carregaram agora.",
    result: buildSessionResult(tokens, profile),
  };
}
