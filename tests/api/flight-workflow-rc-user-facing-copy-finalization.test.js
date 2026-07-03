const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/flightWorkflowRcUserFacingCopyFinalization.js"
  ]);
  const api = windowRef.WeishanFlightWorkflowRcUserFacingCopyFinalization;
  assert.equal(api.FLIGHT_WORKFLOW_RC_USER_FACING_COPY_FINALIZATION_VERSION, "4.1.3");
  const summary = api.buildFlightWorkflowRcUserFacingCopyFinalization({
    copyText:[
      "当前为只读候选证据流程，不提供付款、下单或出票能力。",
      "真实平台与供应商接口当前未启用，页面仅展示候选证据和复核状态。",
      "价格仅为候选展示，不代表真实最终价、锁价或最低价保证。",
      "请勿输入身份证、护照、银行卡、支付凭证或平台登录凭据。",
      "该页面只用于只读 RC 文案定稿与安全披露复核",
      "不保存真实身份、不发送真实邀请、不提供交易能力"
    ]
  });
  assert.equal(summary.status, "finalized");
  assert.equal(summary.userFacingSummary.title, "只读 RC 用户可见文案定稿");
  assert.equal(summary.recommendedCopy.primaryDisclaimer, "当前为只读候选证据流程，不提供付款、下单或出票能力。");
  assert.equal(summary.safety.bookingUrl, null);
  assert.equal(api.buildFlightWorkflowRcUserFacingCopyFinalization({ copyText:["请输入身份证"] }).status, "blocked");
  assert.equal(api.buildFlightWorkflowRcUserFacingCopyFinalization({ copyText:["立即购买"] }).status, "blocked");
  assert.equal(api.buildFlightWorkflowRcUserFacingCopyFinalization({ copyText:["可以出票"] }).status, "blocked");
  assert.equal(api.buildFlightWorkflowRcUserFacingCopyFinalization({ copyText:["最低价保证"] }).status, "blocked");
  assert.equal(api.buildFlightWorkflowRcUserFacingCopyFinalization({ copyText:["当前为只读候选证据流程"] }).status, "needs_review");
  const json = JSON.stringify(api.buildFlightWorkflowRcUserFacingCopyFinalization({ copyText:["token secret bookingUrl"] }));
  assert.equal(/https?:\/\//.test(json), false);
  assert.equal(/"bookingUrl":"https?:/.test(json), false);
  console.log("FLIGHT_WORKFLOW_RC_USER_FACING_COPY_FINALIZATION PASS");
}
main();
