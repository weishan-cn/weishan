const { execFileSync } = require("child_process");
const { readFileSync, writeFileSync, unlinkSync } = require("fs");
const { join } = require("path");

const root = join(__dirname, "..");
const files = [
  "apps/server/src/server.js",
  "apps/server/src/emailRisk.js",
  "apps/server/src/smoke-test.js",
  "apps/desktop/src/main.js",
  "apps/desktop/src/preload.js"
];

for (const file of files) {
  execFileSync(process.execPath, ["--check", join(root, file)], { stdio: "inherit" });
}

const html = readFileSync(join(root, "apps/desktop/src/index.html"), "utf8");
const scripts = Array.from(html.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi));
if (!scripts.length) throw new Error("apps/desktop/src/index.html inline script block not found");

const tmp = join(root, "scripts", "weishan-index-check.tmp.js");
for (let i = 0; i < scripts.length; i += 1) {
  writeFileSync(tmp, scripts[i][1]);
  try {
    execFileSync(process.execPath, ["--check", tmp], { stdio: "inherit" });
  } finally {
    try { unlinkSync(tmp); } catch {}
  }
}

console.log("weishan check passed");
