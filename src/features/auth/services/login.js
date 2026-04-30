import { authApi } from "@/features/auth/lib/authApi";
import { buildSessionResult } from "@/features/auth/lib/authResult";
import { saveAuthSession } from "@/features/auth/lib/authSession";
import {
  buildTestAuthProfile,
  buildTestAuthTokens,
  isTestCredentialPair,
  isTestCpfValue,
  isTestPasswordValue,
} from "@/features/auth/lib/testAuth";
import { normalizeCpf, persistSession } from "@/features/auth/services/shared";

export async function loginService(payload) {
  const rawCpf = payload.cpf;
  const password = String(payload.password ?? "");

  if (isTestCpfValue(rawCpf) || isTestPasswordValue(password)) {
    if (!isTestCredentialPair({ cpf: rawCpf, password })) {
      throw new Error("Use CPF 123 e senha 123 para o acesso de teste.");
    }

    const tokens = buildTestAuthTokens();
    const profile = buildTestAuthProfile();

    saveAuthSession(tokens, profile);

    return {
      ok: true,
      redirectTo: "/home",
      message: "Sessao de teste iniciada com sucesso.",
      result: buildSessionResult(tokens, profile),
    };
  }

  const tokens = await authApi.login({
    cpf: normalizeCpf(rawCpf),
    password,
  });
  const { profile, profileLoaded } = await persistSession(tokens);

  return {
    ok: true,
    redirectTo: "/home",
    message: profileLoaded
      ? "Sessao iniciada com sucesso."
      : "Sessao iniciada com sucesso. Os detalhes completos da sessao nao puderam ser carregados agora.",
    result: buildSessionResult(tokens, profile),
  };
}
