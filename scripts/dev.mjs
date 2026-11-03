// Starts the backend and frontend dev servers together, with prefixed output.
// Stopping one (or pressing Ctrl+C) stops both.
import { spawn } from "node:child_process";

// pnpm runs inside frontend/ so corepack picks the version pinned in frontend/package.json
const services = [
  { name: "backend ", color: "\x1b[36m", command: "npm run dev", cwd: "backend" },
  { name: "frontend", color: "\x1b[35m", command: "corepack pnpm dev", cwd: "frontend" },
];

let stopping = false;

const children = services.map(({ name, color, command, cwd }) => {
  const prefix = `${color}[${name}]\x1b[0m `;
  const child = spawn(command, {
    cwd,
    shell: true,
    stdio: ["inherit", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "1", COREPACK_ENABLE_DOWNLOAD_PROMPT: "0" },
  });

  for (const stream of [child.stdout, child.stderr]) {
    stream.on("data", (chunk) => {
      for (const line of chunk.toString().split(/\r?\n/)) {
        if (line) {
          process.stdout.write(`${prefix}${line}\n`);
        }
      }
    });
  }

  child.on("exit", (code) => {
    if (!stopping) {
      console.log(`${prefix}stopped (exit code ${code}), stopping the other server`);
    }
    stopAll(code ?? 0);
  });

  return child;
});

// On Windows, killing the shell leaves the dev server it started running, so stop the whole process tree
function stopProcessTree(child) {
  if (process.platform === "win32") {
    spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
  } else {
    child.kill("SIGTERM");
  }
}

function stopAll(exitCode) {
  if (stopping) {
    return;
  }
  stopping = true;
  process.exitCode = exitCode;

  for (const child of children) {
    if (child.exitCode === null) {
      stopProcessTree(child);
    }
  }
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
