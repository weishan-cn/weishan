#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const tagName = process.argv[2];

function git(args) {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: false
  });
  return {
    ok: result.status === 0,
    status: result.status,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim()
  };
}

function addResult(results, name, pass, detail) {
  results.push({ name, pass, detail });
}

function printResults(results) {
  for (const item of results) {
    const prefix = item.pass ? "[PASS]" : "[FAIL]";
    console.log(`${prefix} ${item.name} - ${item.detail}`);
  }
}

function remoteTagCommit(tag) {
  const peeled = git(["ls-remote", "--tags", "origin", `refs/tags/${tag}^{}`]);
  if (peeled.ok && peeled.stdout) {
    return peeled.stdout.split(/\s+/)[0];
  }

  const direct = git(["ls-remote", "--tags", "origin", `refs/tags/${tag}`]);
  if (direct.ok && direct.stdout) {
    return direct.stdout.split(/\s+/)[0];
  }

  return "";
}

function runPostcheck() {
  const results = [];

  addResult(results, "tag argument", Boolean(tagName), tagName || "missing tag argument");
  if (!tagName) {
    printResults(results);
    console.log("RELEASE_POSTCHECK FAIL");
    return 1;
  }

  const fetch = git(["fetch", "origin"]);
  addResult(results, "fetch origin", fetch.ok, fetch.ok ? "origin fetched" : (fetch.stderr || "fetch failed"));

  const status = git(["status", "--short"]);
  addResult(results, "working tree clean", status.ok && status.stdout === "", status.stdout || "clean");

  const branch = git(["branch", "--show-current"]);
  addResult(results, "current branch main", branch.ok && branch.stdout === "main", branch.stdout || branch.stderr || "unknown branch");

  const head = git(["rev-parse", "HEAD"]);
  addResult(results, "local HEAD exists", head.ok && Boolean(head.stdout), head.stdout || head.stderr || "missing HEAD");

  const originMain = git(["rev-parse", "origin/main"]);
  addResult(
    results,
    "origin/main matches local HEAD",
    head.ok && originMain.ok && head.stdout === originMain.stdout,
    originMain.stdout ? `origin/main=${originMain.stdout}` : (originMain.stderr || "missing origin/main")
  );

  const localTag = git(["rev-parse", "--verify", `refs/tags/${tagName}`]);
  addResult(results, "local tag exists", localTag.ok && Boolean(localTag.stdout), localTag.stdout || localTag.stderr || "missing local tag");

  const remoteTagObject = git(["ls-remote", "--tags", "origin", `refs/tags/${tagName}`]);
  addResult(
    results,
    "remote tag exists on origin",
    remoteTagObject.ok && Boolean(remoteTagObject.stdout),
    remoteTagObject.stdout || remoteTagObject.stderr || "missing remote tag"
  );

  const localTagCommit = git(["rev-list", "-n", "1", tagName]);
  addResult(
    results,
    "local tag points to HEAD",
    localTagCommit.ok && head.ok && localTagCommit.stdout === head.stdout,
    localTagCommit.stdout ? `tag=${localTagCommit.stdout}` : (localTagCommit.stderr || "local tag commit unavailable")
  );

  const remoteCommit = remoteTagCommit(tagName);
  addResult(
    results,
    "remote tag points to same commit",
    Boolean(remoteCommit) && localTagCommit.ok && remoteCommit === localTagCommit.stdout,
    remoteCommit || "remote tag commit unavailable"
  );

  printResults(results);

  const failed = results.filter((item) => !item.pass);
  if (failed.length > 0) {
    console.log(`RELEASE_POSTCHECK FAIL (${failed.length} failed)`);
    return 1;
  }

  console.log("RELEASE_POSTCHECK PASS");
  return 0;
}

process.exitCode = runPostcheck();
