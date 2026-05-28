const { spawn } = require("child_process");
const path = require("path");

const root = path.resolve(__dirname, "..");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";

function run(label, args) {
  const child = spawn(npm, args, { cwd: root, stdio: "inherit", env: process.env });
  child.on("exit", code => {
    if (code && code !== 0) console.error(`[${label}] exited with code ${code}`);
  });
  return child;
}

console.log("Starting weishan local API and desktop client...");
const server = run("server", ["run", "dev:server"]);

let desktop;
const timer = setTimeout(() => {
  desktop = run("desktop", ["run", "dev:desktop"]);
}, 1200);

function shutdown() {
  clearTimeout(timer);
  if (desktop) desktop.kill("SIGTERM");
  if (server) server.kill("SIGTERM");
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
