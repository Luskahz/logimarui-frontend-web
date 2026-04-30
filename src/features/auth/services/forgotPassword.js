import { clearAuthSession } from "@/features/auth/lib/authSession";
import { authApi } from "@/features/auth/lib/authApi";
import { buildPasswordChangeResult } from "@/features/auth/lib/authResult";
import { toEmployeeId } from "@/features/auth/services/shared";

export async function forgotPasswordService(payload) {
  const result = await authApi.forgotPassword({
    employeeId: toEmployeeId(payload.employeeId),
  });
  clearAuthSession();

  return {
    ok: true,
    resetForm: true,
    message: "Solicitacao de troca registrada com sucesso.",
    result: buildPasswordChangeResult(result),
  };
}
