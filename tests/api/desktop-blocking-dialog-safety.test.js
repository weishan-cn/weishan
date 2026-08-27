"use strict";

const assert = require("assert");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "../..");
const renderer = path.join(root, "apps/desktop/src/renderer");
const routeDir = path.join(renderer, "routes");
const routeFiles = fs.readdirSync(routeDir).filter((name) => name.endsWith(".js"));
const routeSource = routeFiles.map((name) => fs.readFileSync(path.join(routeDir, name), "utf8")).join("\n");
const captureSource = fs.readFileSync(path.join(routeDir, "CrawlerPage.js"), "utf8");
const noticeSource = fs.readFileSync(path.join(renderer, "core/userNotice.js"), "utf8");
const enterpriseSource = fs.readFileSync(path.join(renderer, "core/enterpriseSecurity.js"), "utf8");

const call = (name) => new RegExp("\\b(?:window\\.)?" + name + "\\s*\\(", "g");
const count = (source, regex) => (source.match(regex) || []).length;

assert.strictEqual(count(routeSource, call("alert")), 0, "ordinary route flows must not use synchronous informational alert");
assert.strictEqual(count(routeSource, call("prompt")), 0, "route flows must not use synchronous prompt");
assert.strictEqual(count(captureSource, call("confirm")), 0, "Capture Center must not open a native confirmation");
assert.strictEqual(count(routeSource, call("confirm")), 3, "only reviewed History, Audit, and Mail confirmations remain");
assert.strictEqual(count(enterpriseSource, call("confirm")), 1, "enterprise export confirmation remains explicit");
assert.match(noticeSource, /role.*status/);
assert.match(noticeSource, /aria-live/);
assert.match(noticeSource, /textContent\s*=/);
assert.doesNotMatch(noticeSource, /innerHTML\s*=/);

console.log("DESKTOP_BLOCKING_DIALOG_SAFETY PASS " + JSON.stringify({
  informationalAlerts:0,
  prompts:0,
  reviewedConfirmations:4,
  captureDialogs:0
}));
