#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { execFileSync } = require("node:child_process");

const ROOT = path.resolve(__dirname, "..");
const DESKTOP_DIR = path.join(ROOT, "apps", "desktop");
const DESKTOP_PACKAGE = require(path.join(DESKTOP_DIR, "package.json"));
const DIST_DIR = path.join(DESKTOP_DIR, "dist");
const BUILDER = path.join(DESKTOP_DIR, "node_modules", ".bin", "electron-builder");

function run(command, args, options) {
  execFileSync(command, args, Object.assign({ stdio: "inherit" }, options || {}));
}

function read(command, args, options) {
  return execFileSync(command, args, Object.assign({ encoding: "utf8" }, options || {}));
}

function assertCleanPackagingInput() {
  if (!fs.existsSync(path.join(ROOT, ".git"))) return;

  const status = read("git", ["status", "--porcelain", "--untracked-files=all"], { cwd: ROOT })
    .split("\n")
    .map((line) => line.trimEnd())
    .filter(Boolean)
    .filter((line) => !line.slice(3).startsWith("apps/desktop/dist/"));

  if (status.length > 0) {
    throw new Error(
      "Refusing to package from a dirty source tree. Create a clean checkout/archive first. Dirty entries: " +
        status.join("; ")
    );
  }
}

function candidateApps() {
  return [
    path.join(DIST_DIR, "mac-arm64", "Weishan.app"),
    path.join(DIST_DIR, "mac-arm64", "weishan.app"),
    path.join(DIST_DIR, "mac", "Weishan.app"),
    path.join(DIST_DIR, "mac", "weishan.app"),
    path.join(DIST_DIR, "Weishan.app"),
    path.join(DIST_DIR, "weishan.app")
  ];
}

function findAppBundle() {
  const found = candidateApps().find((candidate) => fs.existsSync(candidate));
  if (!found) {
    throw new Error("Could not find packaged macOS app bundle. Looked in: " + candidateApps().map((candidate) => path.relative(ROOT, candidate)).join(", "));
  }
  return found;
}

function main() {
  if (process.platform !== "darwin") {
    console.log("[skip] mac local packaging is only available on macOS.");
    return;
  }

  assertCleanPackagingInput();

  console.log("[build] packaging local unsigned mac app directory");
  run(BUILDER, ["--mac", "dir", "--arm64", "--publish", "never"], {
    cwd: DESKTOP_DIR,
    env: Object.assign({}, process.env, {
      CSC_IDENTITY_AUTO_DISCOVERY: "false"
    })
  });

  const appPath = findAppBundle();
  console.log("[sign] ad-hoc signing " + path.relative(ROOT, appPath));
  run("codesign", ["--force", "--deep", "--sign", "-", appPath]);

  console.log("[xattr] clearing local quarantine/provenance flags");
  try {
    run("xattr", ["-dr", "com.apple.quarantine", appPath]);
  } catch (_) {}
  try {
    run("xattr", ["-dr", "com.apple.provenance", appPath]);
  } catch (_) {}

  console.log("[verify] verifying ad-hoc signed app bundle");
  run("codesign", ["--verify", "--deep", "--strict", "--verbose=2", appPath]);

  const version = String(DESKTOP_PACKAGE.version || "0.0.0");
  const zipPath = path.join(DIST_DIR, "Weishan-" + version + "-arm64-local.zip");
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  console.log("[zip] creating local signed zip " + path.relative(ROOT, zipPath));
  run("ditto", ["-c", "-k", "--sequesterRsrc", "--keepParent", appPath, zipPath]);

  console.log("[done] local mac package ready: " + path.relative(ROOT, zipPath));
}

main();
