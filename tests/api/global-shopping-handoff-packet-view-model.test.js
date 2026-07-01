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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingHandoffPacketViewModel.js");
  const api = windowRef.WeishanGlobalShoppingHandoffPacketViewModel;
  assert.equal(api.GLOBAL_SHOPPING_HANDOFF_PACKET_VIEW_MODEL_VERSION, "3.8.0");
  const ready = api.buildGlobalShoppingHandoffPacketViewModel({
    readOnlyHandoffPacketPreviewSummary:{ status:"ready", userFacingSummary:{ resultLabel:"交接包预览已准备", redacted:true }, rows:[{ rowId:"a", label:"A", value:"B", status:"pass", redacted:true }], redacted:true },
    platformPreflightSafetyGateSummary:{ status:"clear", userFacingSummary:{ resultLabel:"安全预检未触发阻断", redacted:true }, rows:[{ rowId:"b", label:"B", value:"C", status:"pass", redacted:true }], redacted:true },
    userActionBoundaryReceiptSummary:{ status:"ready", userFacingSummary:{ resultLabel:"边界回执已准备", redacted:true }, rows:[{ rowId:"c", label:"C", value:"D", status:"pass", redacted:true }], redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.title, "只读交接包与安全预检");
  assert.equal(ready.disclosureRows.length, 4);
  assert.equal(api.buildGlobalShoppingHandoffPacketViewModel({ openExternal:true }).status, "blocked");
}

main();
