import { AUTH_FORM_MODES } from "@/features/auth/types";
import { forgotPasswordService } from "@/features/auth/services/forgotPassword";
import { loginService } from "@/features/auth/services/login";
import { registerService } from "@/features/auth/services/register";

const AUTH_SERVICES = {
  [AUTH_FORM_MODES.LOGIN]: loginService,
  [AUTH_FORM_MODES.REGISTER]: registerService,
  [AUTH_FORM_MODES.FORGOT_PASSWORD]: forgotPasswordService,
};

export function getAuthService(mode) {
  const service = AUTH_SERVICES[mode];

  if (!service) {
    throw new Error(`No auth service configured for mode: ${mode}`);
  }

  return service;
}
