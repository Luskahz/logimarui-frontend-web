import { authApi } from "@/features/auth/lib/authApi";
import { saveAuthSession } from "@/features/auth/lib/authSession";

export function toEmployeeId(value) {
  const normalizedValue = String(value ?? "").trim();

  if (!/^[1-9]\d*$/.test(normalizedValue)) {
    throw new Error("Informe uma matricula numerica valida.");
  }

  return Number(normalizedValue);
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
