"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const policy = require(path.join(root, "apps/desktop/src/renderer/core/captureCenterPolicy.js"));
const crawlerSource = fs.readFileSync(path.join(root, "apps/desktop/src/renderer/routes/CrawlerPage.js"), "utf8");

const tests = [];
function test(name, fn){ tests.push([name, fn]); }
function job(id, target, status, summary){
  return { taskId:id, status:status || "done", title:"Example Domain", sourceUrl:target, outputSummary:summary || "" };
}

test("same target updates one stable visible result", () => {
  let items = [];
  items = policy.mergeResult(items, job("one", "https://EXAMPLE.com/#first"));
  items = policy.mergeResult(items, job("two", "https://example.com/"));
  items = policy.mergeResult(items, job("three", "https://example.com/#latest"));
  assert.strictEqual(items.length, 1);
  assert.strictEqual(items[0].taskId, "three");
});

test("legacy duplicate history compacts on read with newest result preserved", () => {
  const items = [
    job("newest", "https://example.com/"),
    job("middle", "https://example.com/#middle"),
    job("oldest", "https://example.com/#oldest")
  ];
  const compacted = policy.compactResults(items);
  assert.strictEqual(compacted.length, 1);
  assert.strictEqual(compacted[0].taskId, "newest");
});

test("distinct settled history is deterministically bounded", () => {
  let items = [];
  for (let index = 0; index < 50; index += 1) {
    items = policy.mergeResult(items, job("job-" + index, "https://example.com/item-" + index));
  }
  assert.strictEqual(items.length, policy.MAX_VISIBLE_RESULTS);
  assert.strictEqual(items[0].taskId, "job-49");
  assert.strictEqual(items.at(-1).taskId, "job-30");
});

test("active result is retained ahead of settled eviction", () => {
  let items = [job("active", "https://example.com/active", "running")];
  for (let index = 0; index < 30; index += 1) {
    items = policy.mergeResult(items, job("settled-" + index, "https://example.com/settled-" + index));
  }
  assert.strictEqual(items.some((item) => item.taskId === "active"), true);
  assert.strictEqual(items.length, policy.MAX_VISIBLE_RESULTS);
});

test("consumer copy strips internal execution flags", () => {
  const copy = policy.sanitizeUserCopy("本地模拟结果 · realExecution=false · executionGate=CLOSED · 未访问外部网站");
  assert.strictEqual(/realExecution|executionGate|authorizesExecution|productionTraffic|providerState/.test(copy), false);
  assert.match(copy, /本地模拟结果/);
  assert.match(copy, /未访问外部网站/);
});

test("status labels never expose raw internal done state", () => {
  assert.strictEqual(policy.statusLabel("done", "zh"), "本地模拟结果");
  assert.strictEqual(policy.statusLabel("done", "en"), "Local simulated result");
  assert.strictEqual(policy.statusLabel("unknown-internal", "zh"), "结果");
});

test("target identity is bounded and ignores fragments", () => {
  assert.strictEqual(policy.MAX_TARGET_LENGTH, 2048);
  assert.strictEqual(policy.normalizeTarget("https://Example.com/path#private-fragment"), "https://example.com/path");
  assert.ok(policy.normalizeTarget("x".repeat(3000)).length <= policy.MAX_TARGET_LENGTH);
});

test("hostile objects cannot pollute prototypes or create unsafe DOM rendering", () => {
  const hostile = Object.create(null);
  hostile.taskId = "hostile";
  hostile.status = "done";
  hostile.sourceUrl = "https://example.com/<script>alert(1)</script>";
  Object.defineProperty(hostile, "__proto__", { value:{ polluted:true }, enumerable:true });
  const merged = policy.mergeResult([], hostile);
  assert.strictEqual({}.polluted, undefined);
  assert.strictEqual(merged.length, 1);
  assert.match(crawlerSource, /title\.textContent\s*=/);
  assert.match(crawlerSource, /note\.textContent\s*=/);
  assert.doesNotMatch(crawlerSource, /crawlerJobs[^\n]*\.innerHTML\s*=/);
});

test("Capture runtime stays single-concurrency and network fail-closed", () => {
  assert.strictEqual(policy.MAX_CONCURRENT_TASKS, 1);
  assert.doesNotMatch(crawlerSource, /await\s+fetch\s*\(/);
  assert.match(crawlerSource, /captureTaskActive/);
  assert.match(crawlerSource, /maxlength=/);
});

test("Capture has no synchronous native dialog", () => {
  assert.doesNotMatch(crawlerSource, /\b(?:window\.)?(?:alert|confirm|prompt)\s*\(/);
});

for (const [name, fn] of tests) {
  try { fn(); }
  catch (error) { error.message = name + ": " + error.message; throw error; }
}

console.log("CAPTURE_CENTER_POLICY_EFFECTIVENESS PASS " + tests.length);
