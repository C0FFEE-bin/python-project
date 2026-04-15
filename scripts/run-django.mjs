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
const managePyDir = path.dirname(managePyPath);

if (!existsSync(managePyPath)) {
  console.error(`manage.py not found at ${managePyPath}.`);
  process.exit(1);
}

function withDefaultTestLabel(args) {
  if (args[0] !== "test") {
    return args;
  }

  const optionsWithValues = new Set([
    "-k",
    "-p",
    "-t",
    "-v",
    "--exclude-tag",
    "--parallel",
    "--pattern",
    "--settings",
    "--shuffle",
    "--tag",
    "--testrunner",
    "--top-level-directory",
    "--verbosity",
  ]);

  let hasExplicitLabel = false;

  for (let index = 1; index < args.length; index += 1) {
    const arg = args[index];

    if (!arg.startsWith("-")) {
      hasExplicitLabel = true;
      break;
    }

    if (optionsWithValues.has(arg)) {
      index += 1;
    }
  }

  if (hasExplicitLabel) {
    return args;
  }

  return [...args, "main"];
}

const djangoArgs = [managePyPath, ...withDefaultTestLabel(process.argv.slice(2))];

const child = spawn(pythonPath, djangoArgs, {
  cwd: managePyDir,
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
