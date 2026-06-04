import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import process from "node:process";

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const [, , command = "dev", ...forwardedArgs] = process.argv;

loadWorkspaceEnv();
loadEnvConfig(process.cwd(), command === "dev");
resolveProfileEnv();

const require = createRequire(import.meta.url);
const nextBinPath = require.resolve("next/dist/bin/next");
const shouldAttachPort = command === "dev" || command === "start";
const hasExplicitPort = forwardedArgs.some((arg, index) => {
  const previousArg = forwardedArgs[index - 1];

  return (
    arg === "-p" ||
    arg === "--port" ||
    arg.startsWith("--port=") ||
    previousArg === "-p" ||
    previousArg === "--port"
  );
});

const resolvedPort = String(
  process.env.FRONTEND_PORT || process.env.PORT || "",
).trim();

if (resolvedPort) {
  const parsedPort = Number.parseInt(resolvedPort, 10);

  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    console.error(
      `FRONTEND_PORT invalida: "${resolvedPort}". Use um inteiro positivo.`,
    );
    process.exit(1);
  }
}

const childArgs = [nextBinPath, command, ...forwardedArgs];
const childEnv = { ...process.env };

if (shouldAttachPort && resolvedPort && !hasExplicitPort) {
  childEnv.PORT = resolvedPort;
  childArgs.push("--port", resolvedPort);
}

const childProcess = spawn(process.execPath, childArgs, {
  cwd: process.cwd(),
  env: childEnv,
  stdio: "inherit",
});

childProcess.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

childProcess.on("error", (error) => {
  console.error("Nao foi possivel iniciar o Next.js.", error);
  process.exit(1);
});

function loadWorkspaceEnv() {
  const workspaceEnvPath = join(dirname(process.cwd()), ".env");

  if (!existsSync(workspaceEnvPath)) {
    return;
  }

  for (const rawLine of readFileSync(workspaceEnvPath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();

    if (!line || line.startsWith("#")) {
      continue;
    }

    const separatorIndex = line.indexOf("=");

    if (separatorIndex <= 0) {
      continue;
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1).trim();

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

function resolveProfileEnv() {
  const profile =
    process.env.LOGIMARUI_PROFILE?.trim().toLowerCase() ||
    (isTruthy(process.env.LOGIMARUI_DEV_MODE) ? "dev" : "prod");
  const isDev = profile === "dev" || profile === "development";
  const corePort = isDev
    ? process.env.LOGIMARUI_DEV_CORE_API_PORT || "81"
    : process.env.LOGIMARUI_PROD_CORE_API_PORT || "80";
  const frontendPort = isDev
    ? process.env.LOGIMARUI_DEV_FRONTEND_PORT || "8191"
    : process.env.LOGIMARUI_PROD_FRONTEND_PORT || "8091";

  process.env.LOGIMARUI_PROFILE ||= profile;
  process.env.CORE_API_PORT ||= corePort;
  process.env.FRONTEND_PORT ||= frontendPort;
  process.env.NEXT_PUBLIC_CORE_API_URL ||= `http://127.0.0.1:${corePort}`;
  process.env.LOGIMARUI_ROOT ||= resolve(dirname(process.cwd()));
}

function isTruthy(value) {
  return ["1", "true", "yes", "sim", "dev"].includes(
    String(value || "").trim().toLowerCase(),
  );
}
