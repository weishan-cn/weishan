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
  return window.WeishanGlobalShoppingPublicBetaUserBoundaryPanel;
}

function main() {
  const api = load("apps/desktop/src/renderer/core/globalShoppingPublicBetaUserBoundaryPanel.js");
  assert.equal(api.GLOBAL_SHOPPING_PUBLIC_BETA_USER_BOUNDARY_PANEL_VERSION, "4.2.5");
  const ready = api.buildGlobalShoppingPublicBetaUserBoundaryPanel({ appVersion:"4.2.5", panelMode:"user_boundary_only" });
  assert.equal(ready.status, "ready");
  assert.equal(ready.rows.some((item) => item.value === "不保存账号、证件或支付信息"), true);
  assert.equal(ready.rows.some((item) => item.value === "用户需在对应平台自行完成下单"), true);
  assert.equal(api.buildGlobalShoppingPublicBetaUserBoundaryPanel({ appVersion:"4.2.5", panelMode:"user_boundary_only", openExternal:true }).status, "blocked");
  console.log("GLOBAL_SHOPPING_PUBLIC_BETA_USER_BOUNDARY_PANEL PASS");
}

main();
