const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(file){
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}
function main(){
  const windowRef = load("apps/desktop/src/renderer/core/manualVerificationGroup.js");
  const api = windowRef.WeishanManualVerificationGroup;
  assert.equal(api.MANUAL_VERIFICATION_GROUP_VERSION, "4.2.4");
  const group = api.buildManualVerificationGroup({});
  assert.equal(group.visible, true);
  assert.deepEqual(Array.from(group.actions), ["复制机票搜索条件", "打开全网搜索", "打开 Google Flights", "打开 Trip.com / 携程"]);
  assert.equal(group.longExternalSearchHintCollapsed, true);
  assert.equal(group.bookingUrl, null);
  assert.equal(group.autoOpen, false);
  assert.equal(group.audit.eventType, "MANUAL_VERIFICATION_GROUP_V2_DRAFT");
  assert.equal(group.audit.redacted, true);
  assert.equal(api.assertManualVerificationGroupSafe(group), true);
  const restricted = api.buildManualVerificationGroup({ restricted:true });
  assert.equal(restricted.visible, false);
  assert.equal(restricted.actions.length, 0);
  assert.equal(api.assertManualVerificationGroupSafe(restricted), true);
  console.log("MANUAL_VERIFICATION_GROUP_V2_CORE PASS");
}
main();
