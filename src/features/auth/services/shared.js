import { authApi } from "@/features/auth/lib/authApi";
import { saveAuthSession } from "@/features/auth/lib/authSession";
import { isValidCpf, onlyDigits } from "@/features/auth/lib/cpf";

export function normalizeCpf(value) {
  const normalizedValue = onlyDigits(value);

  if (!isValidCpf(normalizedValue)) {
    throw new Error("Informe um CPF valido.");
  }

  return normalizedValue;
}

export async function persistSession(tokens) {
  try {
    const profile = await authApi.me({
      accessToken: tokens.accessToken,
    });

    saveAuthSession(tokens, profile);

    return {
      profile,
      profileLoaded: true,
    };
  } catch {
    saveAuthSession(tokens, null);

    return {
      profile: null,
      profileLoaded: false,
    };
  }
}
