import { authApi } from "@/features/auth/lib/authApi";
import {
  buildPasswordChangeChallengeResult,
  buildSessionResult,
} from "@/features/auth/lib/authResult";
import { saveAuthSession } from "@/features/auth/lib/authSession";
import {
  buildTestAuthProfile,
  buildTestAuthTokens,
  isTestCredentialPair,
  isTestCpfValue,
  isTestPasswordValue,
} from "@/features/auth/lib/testAuth";
import { normalizeCpf, persistSession } from "@/features/auth/services/shared";
import { APP_ROUTES } from "@/features/navigation/lib/appRoutes";

function buildRequiredPasswordChangeRoute(passwordChangeToken) {
  const query = new URLSearchParams({
    flow: "required-password-change",
    token: passwordChangeToken,
  });

  return `${APP_ROUTES.PASSWORD_RECOVERY_RESET}?${query.toString()}`;
}

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
      redirectTo: APP_ROUTES.HOME,
      message: "Sessao de teste iniciada com sucesso.",
      result: buildSessionResult(tokens, profile),
    };
  }

  const loginResponse = await authApi.login({
    cpf: normalizeCpf(rawCpf),
    senha: password,
  });

  if (loginResponse?.status === "PASSWORD_CHANGE_REQUIRED") {
    if (!loginResponse.passwordChangeToken) {
      throw new Error("O servico exigiu troca de senha, mas nao retornou o token da operacao.");
    }

    return {
      ok: true,
      redirectTo: buildRequiredPasswordChangeRoute(
        loginResponse.passwordChangeToken,
      ),
      message: "A senha atual precisa ser substituida antes da autenticacao final.",
      result: buildPasswordChangeChallengeResult(loginResponse),
    };
  }

  const { profile, profileLoaded } = await persistSession(loginResponse);

  return {
    ok: true,
    redirectTo: APP_ROUTES.HOME,
    message: profileLoaded
      ? "Sessao iniciada com sucesso."
      : "Sessao iniciada com sucesso. Os detalhes completos da sessao nao puderam ser carregados agora.",
    result: buildSessionResult(loginResponse, profile),
  };
}
