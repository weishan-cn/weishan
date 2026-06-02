#!/usr/bin/env node

const { spawnSync } = require("node:child_process");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const args = process.argv.slice(2);

function git(args) {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    shell: false
  });
  return {
    ok: result.status === 0,
    stdout: (result.stdout || "").trim(),
    stderr: (result.stderr || "").trim()
  };
}

function fail(message) {
  console.error(`RELEASE_NOTES FAIL: ${message}`);
  process.exitCode = 1;
}

function refExists(ref) {
  return git(["rev-parse", "--verify", `${ref}^{commit}`]).ok;
}

function v2Tags() {
  const result = git(["tag", "--list", "v2.0.*", "--sort=version:refname"]);
  if (!result.ok || !result.stdout) return [];
  return result.stdout.split(/\n/).map((line) => line.trim()).filter(Boolean);
}

function inferPreviousTag(target) {
  const tags = v2Tags();
  const index = tags.indexOf(target);
  if (index <= 0) return "";
  return tags[index - 1];
}

function commitList(fromRef, toRef) {
  const result = git(["log", "--format=%h %s", `${fromRef}..${toRef}`]);
  if (!result.ok) {
    return { ok: false, commits: [], error: result.stderr || "git log failed" };
  }
  const commits = result.stdout ? result.stdout.split(/\n/).filter(Boolean) : [];
  return { ok: true, commits, error: "" };
}

function tagContext(target) {
  const tags = v2Tags();
  if (tags.length === 0) return [];
  const index = tags.indexOf(target);
  if (index === -1) return tags.slice(-6);
  return tags.slice(Math.max(0, index - 3), Math.min(tags.length, index + 4));
}

function parseRange() {
  if (args.length === 2) {
    return { fromRef: args[0], toRef: args[1], inferred: false };
  }

  if (args.length === 1) {
    const toRef = args[0];
    const fromRef = inferPreviousTag(toRef);
    if (!fromRef) {
      return { error: `Could not infer previous v2.0.* tag for ${toRef}. Provide FROM and TO explicitly.` };
    }
    return { fromRef, toRef, inferred: true };
  }

  return { error: "Usage: npm run release:notes -- <FROM> <TO> OR npm run release:notes -- <TO>" };
}

function printNotes(fromRef, toRef, commits, inferred) {
  console.log(`# weishan ${toRef} Release Notes`);
  console.log("");
  console.log(`Compare range: \`${fromRef}..${toRef}\`${inferred ? " (previous tag inferred)" : ""}`);
  console.log("");
  console.log("## Commits");
  console.log("");
  if (commits.length === 0) {
    console.log("- No commits in this range.");
  } else {
    commits.forEach((line) => {
      const match = line.match(/^(\S+)\s+(.*)$/);
      if (!match) {
        console.log(`- ${line}`);
        return;
      }
      console.log(`- \`${match[1]}\` ${match[2]}`);
    });
  }
  console.log("");

  const context = tagContext(toRef);
  if (context.length > 0) {
    console.log("## Tag Context");
    console.log("");
    context.forEach((tag) => {
      console.log(`- ${tag}${tag === toRef ? " (target)" : ""}${tag === fromRef ? " (from)" : ""}`);
    });
    console.log("");
  }
}

function main() {
  const range = parseRange();
  if (range.error) {
    fail(range.error);
    return;
  }

  if (!refExists(range.fromRef)) {
    fail(`FROM ref/tag not found or not a commit: ${range.fromRef}`);
    return;
  }

  if (!refExists(range.toRef)) {
    fail(`TO ref/tag not found or not a commit: ${range.toRef}`);
    return;
  }

  const commits = commitList(range.fromRef, range.toRef);
  if (!commits.ok) {
    fail(`Invalid compare range ${range.fromRef}..${range.toRef}: ${commits.error}`);
    return;
  }

  printNotes(range.fromRef, range.toRef, commits.commits, range.inferred);
}

main();
