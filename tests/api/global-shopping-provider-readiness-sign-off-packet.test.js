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
    "apps/desktop/src/renderer/core/globalShoppingProviderReadinessSignOffPacket.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderReadinessSignOffPacket;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_READINESS_SIGN_OFF_PACKET_VERSION, "4.2.4");

  const ready = api.buildGlobalShoppingProviderReadinessSignOffPacket({
    manualDecisionRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工发布决策室已准备", redacted:true }, redacted:true },
    exceptionRegisterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"例外登记簿已准备", redacted:true }, redacted:true },
    governanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true }, redacted:true },
    complianceEvidencePackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true }, redacted:true },
    releaseFreezeGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Release Freeze Gate 已准备", redacted:true }, redacted:true },
    verifyE2eBuildSummary:{ status:"all_passed", summaryLabel:"验证链已通过", redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.title, "Provider 准备签核包");
  assert.equal(ready.signOffSummary.readyForManualSignOffReview, true);
  assert.equal(ready.rows.some((item) => item.value.includes("不写文件，不下载，不导出，不上传，不保存签核结果。")), true);

  const needsReview = api.buildGlobalShoppingProviderReadinessSignOffPacket({
    manualDecisionRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工发布决策室已准备", redacted:true }, redacted:true }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderReadinessSignOffPacket({
    manualDecisionRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"人工发布决策室已准备", redacted:true }, redacted:true },
    exceptionRegisterSummary:{ status:"ready", userFacingSummary:{ resultLabel:"例外登记簿已准备", redacted:true }, redacted:true },
    governanceAuditConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"治理审计控制台已准备", redacted:true }, redacted:true },
    complianceEvidencePackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true }, redacted:true },
    releaseFreezeGateSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Release Freeze Gate 已准备", redacted:true }, redacted:true },
    verifyE2eBuildSummary:{ status:"all_passed", summaryLabel:"验证链已通过", redacted:true },
    createRelease:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingProviderReadinessSignOffPacketAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_READINESS_SIGN_OFF_PACKET PASS");
}

main();
