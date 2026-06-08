import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

function existingPath(candidate) {
  return candidate && fs.existsSync(candidate) ? candidate : null;
}

function pythonCandidates() {
  const candidates = [];
  const add = (command, args = []) => {
    if (command) {
      candidates.push({ command, args });
    }
  };

  add(process.env.PYTHON);

  if (process.platform === "win32") {
    add(existingPath(path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "python.exe")));
    add("py", ["-3"]);
    add("python");
    add("python3");
  } else {
    add(existingPath(path.join(os.homedir(), ".cache", "codex-runtimes", "codex-primary-runtime", "dependencies", "python", "bin", "python3")));
    add("python3");
    add("python");
  }

  return candidates;
}

export function resolvePython() {
  for (const candidate of pythonCandidates()) {
    const result = spawnSync(candidate.command, [...candidate.args, "--version"], {
      encoding: "utf8",
      windowsHide: true
    });

    if (result.error || result.status !== 0) {
      continue;
    }

    const version = `${result.stdout || ""}${result.stderr || ""}`.trim();
    if (/^Python\s+3\./.test(version)) {
      return { ...candidate, version };
    }
  }

  throw new Error("Python 3 nao encontrado. Instale Python 3 ou defina PYTHON com o caminho do executavel.");
}

export function pythonCommandLabel(python) {
  return [python.command, ...python.args].join(" ");
}
