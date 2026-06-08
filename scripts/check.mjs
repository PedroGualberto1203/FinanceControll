import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pythonCommandLabel, resolvePython } from "./python-runtime.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pycacheDir = path.join(projectRoot, "storage", ".pycache");
const python = resolvePython();

const jsFiles = [
  "js/app.js",
  "js/data/api-repository.js",
  "js/data/csv-repository.js",
  "js/data/csv-schema.js",
  "js/data/csv-utils.js",
  "js/screens/controle-mensal.js",
  "js/screens/dashboard.js",
  "js/screens/gastos.js",
  "js/services/category-service.js",
  "js/services/finance-service.js",
  "js/services/monthly-control-service.js",
  "js/services/projection-service.js",
  "js/services/recurring-service.js",
  "js/services/validation-service.js",
  "js/state.js",
  "js/ui/field-controls.js"
];

const pythonFiles = [
  "scripts/no-cache-server.py",
  "scripts/sqlite_schema.py",
  "scripts/sqlite_store.py",
  "scripts/csv_io.py"
];

function run(command, args, options = {}) {
  console.log(`> ${[command, ...args].join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env: { ...process.env, ...options.env },
    stdio: "inherit",
    windowsHide: true
  });

  if (result.error) {
    console.error(`Falha ao executar ${command}: ${result.error.message}`);
    process.exit(1);
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

fs.mkdirSync(pycacheDir, { recursive: true });

console.log(`Python: ${pythonCommandLabel(python)} (${python.version})`);

for (const file of jsFiles) {
  run(process.execPath, ["--check", file]);
}

run(python.command, [...python.args, "-m", "py_compile", ...pythonFiles], {
  env: { PYTHONPYCACHEPREFIX: pycacheDir }
});

run(process.execPath, ["--test", "tests/finance_services.test.mjs"]);

run(python.command, [...python.args, "-m", "unittest", "discover", "-s", "tests"], {
  env: { PYTHONPYCACHEPREFIX: pycacheDir }
});
