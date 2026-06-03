import { clearAuthSession } from "@/features/auth/lib/authSession";
import { authApi } from "@/features/auth/lib/authApi";
import { buildPasswordRecoveryResult } from "@/features/auth/lib/authResult";
import { normalizeCpf } from "@/features/auth/services/shared";

export async function forgotPasswordService(payload) {
  const cpf = normalizeCpf(payload.cpf);
  const sendEmailToken = Boolean(payload.sendEmailToken);
  const result = sendEmailToken
    ? await authApi.sendPasswordRecoveryEmailToken({ cpf })
    : await authApi.createPasswordRecoveryRequest({ cpf });

  clearAuthSession();

  return {
    ok: true,
    resetForm: true,
    message: sendEmailToken
      ? "Solicitacao registrada e link de redefinicao enviado para o e-mail cadastrado."
      : "Solicitacao de recovery registrada com sucesso.",
    result: buildPasswordRecoveryResult(result),
  };
}
