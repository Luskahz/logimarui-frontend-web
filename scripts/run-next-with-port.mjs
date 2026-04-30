import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import process from "node:process";

import nextEnv from "@next/env";

const { loadEnvConfig } = nextEnv;
const [, , command = "dev", ...forwardedArgs] = process.argv;

loadEnvConfig(process.cwd(), command === "dev");

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
