import { spawn } from "node:child_process";
import nextEnv from "@next/env";

const projectDir = process.cwd();
const { loadEnvConfig } = nextEnv;
loadEnvConfig(projectDir);

const [command = "dev", ...args] = process.argv.slice(2);
const port = process.env.CRITICA_FRONTEND_PORT || process.env.FRONTEND_PORT || "8192";
const nextArgs = [command, ...args];

if ((command === "dev" || command === "start") && !args.includes("-p") && !args.includes("--port")) {
  nextArgs.push("-p", port);
}

const child = spawn("next", nextArgs, {
  stdio: "inherit",
  shell: process.platform === "win32",
  env: {
    ...process.env,
    PORT: port,
  },
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
