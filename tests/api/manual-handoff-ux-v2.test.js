const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files){ const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function main(){
  const windowRef = load(["apps/desktop/src/renderer/core/providerHandoffUi.js"]);
  const api = windowRef.WeishanProviderHandoffUi;
  assert.equal(api.PROVIDER_HANDOFF_UI_VERSION, "2.1.77");
  const handoff = api.buildProviderHandoffUi({ card:{ title:"上海 → 成都 · 7 月 15 日", providerName:"Flight Provider Sandbox", priceDisplay:"¥1010", priceTruthLabel:"Limited Beta 只读验证价，不代表真实最低价", actionLabel:"去平台确认", actionType:"provider_handoff_preview", fareBreakdown:{ displayRows:[{ label:"票面价", value:"¥860" }, { label:"税费", value:"¥110" }, { label:"其它附加费", value:"¥40" }, { label:"最终应付总价", value:"¥1010" }] } }, providerReadiness:"limited-beta-ready", bookingUrlSafety:"disabled", userPreference:{ searchText:"上海 成都 7 月 15 日" }, redacted:true });
  assert.equal(handoff.handoffDecision, "manual_handoff");
  assert.equal(handoff.showHandoffPanel, true);
  assert.equal(handoff.autoOpen, false);
  assert.equal(handoff.bookingUrl, null);
  assert.equal(handoff.payment, false);
  assert.equal(handoff.order, false);
  assert.equal(handoff.identityUpload, false);
  assert.deepEqual(Array.from(handoff.compactChecklist.slice(0, 3)), ["核对出发地 / 目的地 / 日期", "核对是否直达", "核对票面价、税费和附加费"]);
  assert.equal(handoff.longExplanationCollapsed, true);
  assert.equal(handoff.copySearchConditionsAvailable, true);
  assert.equal(handoff.copyFareBreakdownAvailable, true);
  assert.match(handoff.copyPayload, /复制价格拆分摘要/);
  assert.match(handoff.copyPayload, /最终应付总价：¥1010/);
  assert.equal(handoff.manualHandoffUxV2Audit.eventType, "MANUAL_HANDOFF_UX_V2_DRAFT");
  assert.equal(handoff.manualHandoffUxV2Audit.longExplanationCollapsed, true);
  assert.equal(handoff.manualHandoffUxV2Audit.bookingUrlDisplayedCount, 0);
  assert.equal(handoff.manualHandoffUxV2Audit.paymentAttemptCount, 0);
  assert.equal(api.assertProviderHandoffUiSafe(handoff), true);
  const blocked = api.buildProviderHandoffUi({ restricted:true, card:{ title:"blocked" } });
  assert.equal(blocked.handoffDecision, "blocked");
  assert.equal(blocked.showHandoffPanel, false);
  assert.equal(api.assertProviderHandoffUiSafe(blocked), true);
  console.log("MANUAL_HANDOFF_UX_V2_CORE PASS");
}
main();
