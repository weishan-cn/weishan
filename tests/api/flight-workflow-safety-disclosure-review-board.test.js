const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowSafetyDisclosureReviewBoard.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowSafetyDisclosureReviewBoard;
  assert.equal(api.FLIGHT_WORKFLOW_SAFETY_DISCLOSURE_REVIEW_BOARD_VERSION, "4.0.0");
  const summary = api.buildFlightWorkflowSafetyDisclosureReviewBoard({
    disclosureText:[
      "当前为只读候选证据流程，不提供付款、下单或出票能力。",
      "真实平台与供应商接口当前未启用，页面仅展示候选证据和复核状态。",
      "价格仅为候选展示，不代表真实最终价、锁价或最低价保证。",
      "请勿输入身份证、护照、银行卡、支付凭证或平台登录凭据。",
      "不保存真实身份、不发送真实邀请、不提供交易能力"
    ]
  });
  assert.equal(summary.status, "approved");
  assert.equal(summary.userFacingSummary.title, "安全披露复核板");
  assert.equal(summary.safety.bookingUrl, null);
  assert.equal(api.buildFlightWorkflowSafetyDisclosureReviewBoard({ disclosureText:["立即购买"] }).status, "blocked");
  assert.equal(api.buildFlightWorkflowSafetyDisclosureReviewBoard({ disclosureText:["请输入身份证"] }).status, "blocked");
  assert.equal(api.buildFlightWorkflowSafetyDisclosureReviewBoard({ disclosureText:["可以出票"] }).status, "blocked");
  assert.equal(api.buildFlightWorkflowSafetyDisclosureReviewBoard({ disclosureText:["当前为只读候选证据流程"] }).status, "needs_review");
  console.log("FLIGHT_WORKFLOW_SAFETY_DISCLOSURE_REVIEW_BOARD PASS");
}
main();
