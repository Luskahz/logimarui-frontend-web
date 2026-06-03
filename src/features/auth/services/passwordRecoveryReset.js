import { authApi } from "@/features/auth/lib/authApi";
import {
  buildPasswordResetResult,
  buildSessionResult,
} from "@/features/auth/lib/authResult";
import { clearAuthSession } from "@/features/auth/lib/authSession";
import { persistSession } from "@/features/auth/services/shared";
import { APP_ROUTES } from "@/features/navigation/lib/appRoutes";

function readPasswordRecoveryContext() {
  if (typeof window === "undefined") {
    return {
      flow: "recovery-token",
      token: "",
    };
  }

  const searchParams = new URLSearchParams(window.location.search);

  return {
    flow: String(searchParams.get("flow") ?? "recovery-token").trim(),
    token: String(searchParams.get("token") ?? "").trim(),
  };
}

export async function passwordRecoveryResetService(payload) {
  const { flow, token } = readPasswordRecoveryContext();
  const newPassword = String(payload.password ?? "");

  if (!token) {
    throw new Error("Token de redefinicao nao encontrado na URL atual.");
  }

  if (flow === "required-password-change") {
    const tokens = await authApi.completeRequiredPasswordChange({
      passwordChangeToken: token,
      newPassword,
    });
    const { profile, profileLoaded } = await persistSession(tokens);

    return {
      ok: true,
      redirectTo: APP_ROUTES.HOME,
      message: profileLoaded
        ? "Senha atualizada e sessao iniciada com sucesso."
        : "Senha atualizada com sucesso. Os tokens foram salvos, mas os detalhes da sessao nao carregaram agora.",
      result: buildSessionResult(tokens, profile),
    };
  }

  await authApi.resetPasswordByToken({
    token,
    newPassword,
  });
  clearAuthSession();

  return {
    ok: true,
    redirectTo: APP_ROUTES.LOGIN,
    message: "Senha redefinida com sucesso. Entre novamente com a nova senha.",
    result: buildPasswordResetResult(),
  };
}
