import { authApi } from "@/features/auth/lib/authApi";
import { buildSessionResult } from "@/features/auth/lib/authResult";
import { normalizeCpf, persistSession } from "@/features/auth/services/shared";
import { APP_ROUTES } from "@/shared/navigation/lib/appRoutes";

function normalizeOptionalText(value) {
  const normalizedValue = String(value ?? "").trim();
  return normalizedValue || undefined;
}

export async function registerService(payload) {
  const tokens = await authApi.register({
    name: String(payload.name ?? "").trim(),
    password: String(payload.password ?? ""),
    cpf: normalizeCpf(payload.cpf),
    email: normalizeOptionalText(payload.email),
    phoneNumber: normalizeOptionalText(payload.phoneNumber),
  });
  const { profile, profileLoaded } = await persistSession(tokens);

  return {
    ok: true,
    redirectTo: APP_ROUTES.HOME,
    message: profileLoaded
      ? "Cadastro concluido e sessao iniciada com sucesso."
      : "Cadastro concluido com sucesso. Os tokens foram salvos, mas os detalhes da sessao nao carregaram agora.",
    result: buildSessionResult(tokens, profile),
  };
}
