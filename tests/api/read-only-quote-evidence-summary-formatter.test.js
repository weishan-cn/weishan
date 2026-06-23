const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(files) { const window = {}; window.window = window; const context = vm.createContext({ window, console }); for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }); return window; }
function forbidden(value) { return /全网最低|最低价保证|已锁价|可以出票|可直接出票|真实最终价|立即购买|付款|下单|token|key|secret/i.test(JSON.stringify(value)); }
function main() {
  const windowRef = load(["apps/desktop/src/renderer/core/readOnlyQuoteEvidenceSummaryFormatter.js"]);
  const api = windowRef.WeishanReadOnlyQuoteEvidenceSummaryFormatter;
  assert.equal(api.READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER_VERSION, "2.1.59");
  const top = api.formatTopCandidateSummary([{ rank:1, providerName:"A", totalPrice:980, token:"abc" }, { rank:2, providerName:"B", totalPrice:1010 }]);
  assert.equal(top.lines.length, 2);
  assert.equal(top.lines[0].includes("当前导入样本"), false);
  assert.equal(JSON.stringify(top).includes("token"), false);
  const selected = api.formatSelectedCandidateSummary({ quoteId:"q1", providerName:"A", totalPrice:980, key:"abc" });
  assert.equal(selected.selected, true);
  assert.equal(JSON.stringify(selected).includes("key"), false);
  const delta = api.formatDeltaSummary({ status:"compared", summary:"已比较本地脱敏历史" });
  assert.equal(delta.status, "compared");
  const replay = api.formatReplaySummary({ status:"available", secret:"abc" });
  assert.equal(replay.networkAllowed, false);
  assert.equal(JSON.stringify(replay).includes("secret"), false);
  const warnings = api.formatReadOnlyQuoteEvidenceWarnings({});
  assert.ok(warnings.warnings.includes("平台最终为准"));
  assert.ok(warnings.warnings.includes("未锁价"));
  assert.ok(warnings.warnings.includes("不代表可出票"));
  assert.equal(forbidden(warnings), false);
  const decisionSummary = api.formatDecisionReasoning({ reasoning:{ primaryReason:"该候选在本次只读候选样本中合计金额较低。", supportingReasons:["价格拆分完整。"], riskWarnings:["平台最终为准", "未锁价，不代表可出票"] } });
  assert.equal(decisionSummary.title, "推荐理由");
  assert.equal(decisionSummary.canClaimLowestAcrossWeb, false);
  const comparisonSummary = api.formatCandidateComparisonSummary({ table:[{ rank:1, providerName:"A", totalPrice:930, handoffStatus:"ready" }], summary:{ lowestInLocalSampleRank:1 } });
  assert.equal(comparisonSummary.title, "候选对比");
  assert.equal(comparisonSummary.lines[0].includes("仍需前往平台确认"), true);
  const warning = api.formatProviderConfirmationWarning({ safeProviderHandoffReady:true });
  assert.equal(warning.providerConfirmationRequiresUserConfirm, true);
  assert.equal(warning.bookingUrl, null);
  const audit = api.buildReadOnlyQuoteEvidenceSummaryFormatterAuditDraft({});
  assert.equal(audit.payment, false);
  assert.equal(audit.order, false);
  console.log("READ_ONLY_QUOTE_EVIDENCE_SUMMARY_FORMATTER PASS");
}
main();
