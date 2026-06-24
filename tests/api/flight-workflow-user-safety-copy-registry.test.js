const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/flightWorkflowUserSafetyCopyRegistry.js"]);
  const api = windowRef.WeishanFlightWorkflowUserSafetyCopyRegistry;
  assert.equal(api.FLIGHT_WORKFLOW_USER_SAFETY_COPY_REGISTRY_VERSION, "2.1.83");
  const required = ["read_only_price_notice", "platform_final_notice", "no_payment_order_ticketing_notice", "no_identity_upload_notice", "provider_confirmation_notice", "platform_check_difference_notice", "evidence_only_notice", "restricted_category_blocked_notice", "sensitive_input_blocked_notice", "export_preview_notice", "scenario_simulation_notice", "safety_matrix_notice", "release_readiness_notice"];
  const registry = api.buildFlightWorkflowUserSafetyCopyRegistry({});
  assert.equal(registry.registryName, "flight_workflow_user_safety_copy_registry_v1");
  assert.equal(registry.copyValidationStatus, "pass");
  for (const copyId of required) {
    assert.ok(registry.requiredCopyIds.includes(copyId), copyId);
    const copy = api.getFlightWorkflowSafetyCopy(copyId);
    assert.equal(copy.copyId, copyId);
    assert.ok(copy.body);
  }
  assert.ok(api.getFlightWorkflowSafetyCopy("read_only_price_notice").body.includes("只读候选证据"));
  assert.ok(api.getFlightWorkflowSafetyCopy("platform_final_notice").body.includes("平台页面"));
  assert.ok(api.getFlightWorkflowSafetyCopy("no_payment_order_ticketing_notice").body.includes("不会付款"));
  assert.ok(api.getFlightWorkflowSafetyCopy("no_identity_upload_notice").body.includes("不会上传证件"));
  assert.ok(api.getFlightWorkflowSafetyCopy("restricted_category_blocked_notice").body.includes("受限"));
  assert.ok(api.getFlightWorkflowSafetyCopy("scenario_simulation_notice").body.includes("场景模拟"));
  assert.ok(api.getFlightWorkflowSafetyCopy("release_readiness_notice").body.includes("发布就绪"));
  for (const claim of ["全网最低", "最低价保证", "已锁价", "可出票", "真实最终价", "立即购买", "直接下单", "一键出票"]) {
    const validation = api.validateFlightWorkflowSafetyCopySet({ copies:[{ copyId:"bad", title:"bad", body:claim }] });
    assert.equal(validation.status, "blocked", claim);
    assert.equal(validation.forbiddenClaimFailures.length, 1, claim);
  }
  const copySet = api.buildFlightWorkflowSafetyCopySet({ bookingUrl:"https://blocked.example", token:"abc", secret:"def" });
  assert.equal(copySet.safety.bookingUrl, null);
  assert.equal(copySet.safety.payment, false);
  assert.equal(copySet.safety.order, false);
  const copyText = JSON.stringify(copySet.copies);
  assert.equal(copyText.includes("https://blocked.example"), false);
  assert.equal(copyText.includes("abc"), false);
  assert.equal(copyText.includes("def"), false);
  console.log("FLIGHT_WORKFLOW_USER_SAFETY_COPY_REGISTRY PASS");
}
main();
