import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { pythonCommandLabel, resolvePython } from "./python-runtime.mjs";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const pycacheDir = path.join(projectRoot, "storage", ".pycache");
const defaultPort = 4173;
const python = resolvePython();
const serverScript = path.join(projectRoot, "scripts", "no-cache-server.py");

fs.mkdirSync(pycacheDir, { recursive: true });

function parsePort(value, label) {
  if (!/^\d+$/.test(String(value))) {
    throw new Error(`${label} deve ser uma porta numerica.`);
  }

  const port = Number.parseInt(value, 10);
  if (port < 1 || port > 65535) {
    throw new Error(`${label} deve estar entre 1 e 65535.`);
  }

  return port;
}

function canListen(port) {
  return new Promise((resolve, reject) => {
    const server = net.createServer();

    server.once("error", (error) => {
      if (error.code === "EADDRINUSE" || error.code === "EACCES") {
        resolve(false);
        return;
      }

      reject(error);
    });

    server.once("listening", () => {
      server.close(() => resolve(true));
    });

    server.listen(port, "127.0.0.1");
  });
}

async function resolvePort() {
  const hasExplicitPort = Boolean(process.env.PORT);
  const preferredPort = parsePort(process.env.PORT || defaultPort, hasExplicitPort ? "PORT" : "Porta padrao");

  if (hasExplicitPort) {
    if (await canListen(preferredPort)) {
      return preferredPort;
    }

    throw new Error(`A porta PORT=${preferredPort} ja esta em uso. Escolha outra porta ou encerre o processo atual.`);
  }

  for (let candidate = preferredPort; candidate <= preferredPort + 100; candidate += 1) {
    if (await canListen(candidate)) {
      return candidate;
    }
  }

  throw new Error(`Nenhuma porta livre encontrada entre ${preferredPort} e ${preferredPort + 100}.`);
}

let port;
try {
  port = await resolvePort();
} catch (error) {
  console.error(`Falha ao escolher a porta local: ${error.message}`);
  process.exit(1);
}

if (port !== defaultPort && !process.env.PORT) {
  console.log(`Porta ${defaultPort} em uso; usando ${port}.`);
}

console.log(`Python: ${pythonCommandLabel(python)} (${python.version})`);
console.log(`FinanceControll em http://127.0.0.1:${port}`);

const child = spawn(python.command, [...python.args, serverScript, String(port)], {
  cwd: projectRoot,
  env: { ...process.env, PYTHONPYCACHEPREFIX: pycacheDir },
  stdio: "inherit",
  windowsHide: true
});

child.on("error", (error) => {
  console.error(`Falha ao iniciar o servidor local: ${error.message}`);
  process.exit(1);
});

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    child.kill(signal);
  });
}
