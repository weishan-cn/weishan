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
  const windowRef = load("apps/desktop/src/renderer/core/userSurfaceDebugFieldFilter.js");
  const api = windowRef.WeishanUserSurfaceDebugFieldFilter;
  assert.equal(api.USER_SURFACE_DEBUG_FIELD_FILTER_VERSION, "4.0.1");
  const raw = "autoOpen: false\npayment: false\norder: false\nidentityUpload: false\nredacted: true\naudit draft\ninternal enum\n用户可见文本";
  const stripped = api.stripDebugText(raw);
  for (const forbidden of ["autoOpen: false", "payment: false", "order: false", "identityUpload: false", "redacted: true", "audit draft", "internal enum"]) {
    assert.equal(stripped.includes(forbidden), false);
  }
  assert.equal(stripped.includes("用户可见文本"), true);
  const filtered = api.filterUserSurfaceObject({ title:"用户可见", autoOpen:false, payment:false, nested:{ order:false, visible:"ok" } });
  assert.equal(filtered.title, "用户可见");
  assert.equal(filtered.autoOpen, undefined);
  assert.equal(filtered.payment, undefined);
  assert.equal(filtered.nested.order, undefined);
  assert.equal(filtered.nested.visible, "ok");
  const audit = api.buildDebugFieldFilterAuditDraft({ userSurfaceText:raw });
  assert.equal(audit.eventType, "USER_SURFACE_DEBUG_FIELD_FILTER_DRAFT");
  assert.equal(audit.debugFieldsHiddenFromUserSurface, true);
  assert.equal(audit.debugFieldsAvailableInDebugSurface, true);
  assert.equal(audit.redacted, true);
  assert.equal(api.assertUserSurfaceDebugFieldsHidden("普通用户面"), true);
  console.log("USER_SURFACE_DEBUG_FIELD_FILTER_CORE PASS");
}
main();
