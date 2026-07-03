const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingSafeNextActionPanel.js");
  const api = windowRef.WeishanGlobalShoppingSafeNextActionPanel;
  assert.equal(api.GLOBAL_SHOPPING_SAFE_NEXT_ACTION_PANEL_VERSION, "4.0.9");
  const ready = api.buildGlobalShoppingSafeNextActionPanel({});
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "安全下一步");
  assert.equal(ready.safeActionRows.some((row) => row.label === "到平台后人工核对实时价格"), true);
  assert.equal(ready.forbiddenActionRows.some((row) => row.label.includes("立即购买")), true);
  assert.equal(ready.userFacingSummary.caveat.includes("不打开平台"), true);
  assert.equal(api.buildGlobalShoppingSafeNextActionPanel({ openExternal:true }).status, "blocked");
}

main();
