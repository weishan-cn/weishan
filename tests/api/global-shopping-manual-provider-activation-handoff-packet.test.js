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

function readySummary(resultLabel) {
  return { status:"ready", userFacingSummary:{ resultLabel, redacted:true }, redacted:true };
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/globalShoppingManualProviderActivationHandoffPacket.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingManualProviderActivationHandoffPacket;
  assert.equal(api.GLOBAL_SHOPPING_MANUAL_PROVIDER_ACTIVATION_HANDOFF_PACKET_VERSION, "4.1.7");

  const ready = api.buildGlobalShoppingManualProviderActivationHandoffPacket({
    readOnlySandboxActivationReadinessCenterSummary:readySummary("Sandbox 激活准备中心已准备"),
    offlineMockSandboxSessionRunnerSummary:readySummary("离线 Mock 会话已准备"),
    manualGovernanceReleaseDecisionRoomSummary:readySummary("人工发布决策室已准备"),
    providerReadinessSignOffPacketSummary:readySummary("准备签核包已准备"),
    releaseFreezeGateSummary:readySummary("Release Freeze Gate 已准备"),
    complianceEvidencePackSummary:readySummary("合规证据包已准备")
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.handoffSummary.manualActivationRequired, true);

  const needsReview = api.buildGlobalShoppingManualProviderActivationHandoffPacket({
    readOnlySandboxActivationReadinessCenterSummary:readySummary("Sandbox 激活准备中心已准备")
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingManualProviderActivationHandoffPacket({
    readOnlySandboxActivationReadinessCenterSummary:readySummary("Sandbox 激活准备中心已准备"),
    offlineMockSandboxSessionRunnerSummary:readySummary("离线 Mock 会话已准备"),
    manualGovernanceReleaseDecisionRoomSummary:readySummary("人工发布决策室已准备"),
    providerReadinessSignOffPacketSummary:readySummary("准备签核包已准备"),
    releaseFreezeGateSummary:readySummary("Release Freeze Gate 已准备"),
    complianceEvidencePackSummary:readySummary("合规证据包已准备"),
    sendEmail:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingManualProviderActivationHandoffPacketAuditDraft({ secret:"abc", paymentUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_MANUAL_PROVIDER_ACTIVATION_HANDOFF_PACKET PASS");
}

main();
