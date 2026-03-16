import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const pythonCandidates = [
  path.join(repoRoot, ".venv", "Scripts", "python.exe"),
  path.join(repoRoot, ".venv", "bin", "python"),
];

const pythonPath = pythonCandidates.find((candidate) => existsSync(candidate));

if (!pythonPath) {
  console.error(
    "No virtual environment Python found. Expected .venv/Scripts/python.exe or .venv/bin/python.",
  );
  process.exit(1);
}

const managePyPath = path.join(repoRoot, "webapp", "manage.py");

if (!existsSync(managePyPath)) {
  console.error(`manage.py not found at ${managePyPath}.`);
  process.exit(1);
}

const djangoArgs = [managePyPath, ...process.argv.slice(2)];

const child = spawn(pythonPath, djangoArgs, {
  stdio: "inherit",
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
