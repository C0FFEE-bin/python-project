import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const viteBinPath = path.join(repoRoot, "node_modules", "vite", "bin", "vite.js");
const djangoRunnerPath = path.join(repoRoot, "scripts", "run-django.mjs");
const viteDevServerUrl =
  process.env.VITE_DEV_SERVER_URL ?? "http://127.0.0.1:5173";
let viteUrl;

if (!existsSync(viteBinPath)) {
  console.error(`Vite CLI not found at ${viteBinPath}. Run "npm install" first.`);
  process.exit(1);
}

if (!existsSync(djangoRunnerPath)) {
  console.error(`Django runner not found at ${djangoRunnerPath}.`);
  process.exit(1);
}

try {
  viteUrl = new URL(viteDevServerUrl);
} catch {
  console.error(`Invalid VITE_DEV_SERVER_URL: ${viteDevServerUrl}`);
  process.exit(1);
}

if (!viteUrl.hostname || !viteUrl.port) {
  console.error(
    "VITE_DEV_SERVER_URL must include an explicit host and port, for example http://127.0.0.1:5173.",
  );
  process.exit(1);
}

const viteArgs = [viteBinPath, "--host", viteUrl.hostname, "--port", viteUrl.port];

if (viteUrl.protocol === "https:") {
  viteArgs.push("--https");
}

const children = new Map();
let shuttingDown = false;
let finalExitCode = 0;

function stopRemainingProcesses(signal = "SIGTERM") {
  for (const child of children.values()) {
    if (child.exitCode !== null || child.killed) {
      continue;
    }

    try {
      child.kill(signal);
    } catch {
      // Ignore follow-up termination errors during shutdown.
    }
  }
}

function finishWhenDone() {
  if (children.size === 0) {
    process.exit(finalExitCode);
  }
}

function spawnProcess(name, command, args, env = process.env) {
  const child = spawn(command, args, {
    cwd: repoRoot,
    env,
    stdio: "inherit",
  });

  children.set(name, child);

  child.on("error", (error) => {
    console.error(`${name} failed to start: ${error.message}`);

    if (!shuttingDown) {
      shuttingDown = true;
      finalExitCode = 1;
      stopRemainingProcesses();
    }

    children.delete(name);
    finishWhenDone();
  });

  child.on("exit", (code, signal) => {
    children.delete(name);

    if (!shuttingDown) {
      shuttingDown = true;
      finalExitCode = code ?? (signal ? 1 : 0);
      stopRemainingProcesses(signal === "SIGINT" ? "SIGINT" : "SIGTERM");
    }

    finishWhenDone();
  });
}

function handleParentSignal(signal) {
  if (!shuttingDown) {
    shuttingDown = true;
    finalExitCode = signal === "SIGINT" ? 130 : 143;
  }

  stopRemainingProcesses(signal);
  finishWhenDone();
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => handleParentSignal(signal));
}

console.log(`[dev] Starting Vite and Django`);
console.log(`[dev] Backend VITE_DEV_SERVER_URL=${viteDevServerUrl}`);

spawnProcess("vite", process.execPath, viteArgs);
spawnProcess("django", process.execPath, [djangoRunnerPath, "runserver"], {
  ...process.env,
  VITE_DEV_SERVER_URL: viteDevServerUrl,
});
