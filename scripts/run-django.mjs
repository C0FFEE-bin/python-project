import { existsSync } from "node:fs";
import { spawn } from "node:child_process";
import path from "node:path";
import process from "node:process";

const repoRoot = process.cwd();
const djangoRoot = path.join(repoRoot, "webapp");
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

const managePyPath = path.join(djangoRoot, "manage.py");

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

const djangoArgs = ["manage.py", ...withDefaultTestLabel(process.argv.slice(2))];

const child = spawn(pythonPath, djangoArgs, {
  cwd: djangoRoot,
  stdio: "inherit",
});

let forwardedSignal = null;

function forwardSignal(signal) {
  forwardedSignal = signal;

  if (child.exitCode !== null || child.killed) {
    return;
  }

  try {
    child.kill(signal);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => forwardSignal(signal));
}

child.on("exit", (code, signal) => {
  if (forwardedSignal) {
    process.exit(forwardedSignal === "SIGINT" ? 130 : 143);
  }

  if (signal) {
    process.exit(signal === "SIGINT" ? 130 : 1);
  }

  process.exit(code ?? 1);
});

child.on("error", (error) => {
  console.error(error.message);
  process.exit(1);
});
