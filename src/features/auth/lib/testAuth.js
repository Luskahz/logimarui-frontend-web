import { onlyDigits } from "@/features/auth/lib/cpf";

const TEST_CPF = "123";
const TEST_PASSWORD = "123";
const TEST_ACCESS_TOKEN = "logimarui-test-access-token";
const TEST_REFRESH_TOKEN = "logimarui-test-refresh-token";
const TEST_EXPIRES_IN_SECONDS = 12 * 60 * 60;

export function isTestCpfValue(value) {
  return onlyDigits(value) === TEST_CPF;
}

export function isTestPasswordValue(value) {
  return String(value ?? "") === TEST_PASSWORD;
}

export function isTestCredentialPair({ cpf, password }) {
  return isTestCpfValue(cpf) && isTestPasswordValue(password);
}

export function buildTestAuthTokens() {
  return {
    accessToken: TEST_ACCESS_TOKEN,
    refreshToken: TEST_REFRESH_TOKEN,
    expiresInSeconds: TEST_EXPIRES_IN_SECONDS,
  };
}

export function buildTestAuthProfile() {
  return {
    userId: "teste-local",
    sessionId: "sessao-teste-123",
    username: "Usuario Teste",
    cpf: TEST_CPF,
    roles: ["ROLE_TESTE"],
    sessionActive: true,
    testLogin: true,
  };
}

export function isTestAccessToken(value) {
  return String(value ?? "") === TEST_ACCESS_TOKEN;
}

export function isTestRefreshToken(value) {
  return String(value ?? "") === TEST_REFRESH_TOKEN;
}

export function isTestAuthSession(session) {
  return (
    isTestAccessToken(session?.accessToken) &&
    isTestRefreshToken(session?.refreshToken)
  );
}
