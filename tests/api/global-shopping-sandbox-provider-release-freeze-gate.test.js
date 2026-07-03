const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingSandboxProviderReleaseFreezeGate.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingSandboxProviderReleaseFreezeGate;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_PROVIDER_RELEASE_FREEZE_GATE_VERSION, "4.1.6");

  const ready = api.buildGlobalShoppingSandboxProviderReleaseFreezeGate({
    governanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true }, redacted:true },
    humanPilotReadinessLedgerSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Human Pilot 准备台账已准备", redacted:true }, redacted:true },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Production 阻断矩阵已准备", redacted:true }, redacted:true },
    providerKillSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true }, redacted:true },
    complianceEvidencePackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true }, redacted:true },
    verifyE2eBuildSummary:{ status:"pass", summaryLabel:"验证链已准备", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "Release Freeze Gate 已准备");
  assert.equal(ready.rows.some((item) => item.value.includes("Release Freeze Gate 不改 git、不创建 tag、不 push。")), true);

  const needsReview = api.buildGlobalShoppingSandboxProviderReleaseFreezeGate({
    governanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true }, redacted:true }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingSandboxProviderReleaseFreezeGate({
    governanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true }, redacted:true },
    push:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingSandboxProviderReleaseFreezeGateAuditDraft({ token:"abc", paymentUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_SANDBOX_PROVIDER_RELEASE_FREEZE_GATE PASS");
}

main();
