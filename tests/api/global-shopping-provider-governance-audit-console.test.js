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
    "apps/desktop/src/renderer/core/globalShoppingProviderGovernanceAuditConsole.js"
  ]);
  const api = windowRef.WeishanGlobalShoppingProviderGovernanceAuditConsole;
  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_AUDIT_CONSOLE_VERSION, "4.0.9");

  const ready = api.buildGlobalShoppingProviderGovernanceAuditConsole({
    providerPilotGovernanceViewModelSummary:{ status:"ready", title:"Provider Pilot 治理与合规证据", redacted:true },
    complianceEvidencePackSummary:{ status:"ready", userFacingSummary:{ resultLabel:"合规证据包已准备", redacted:true }, redacted:true },
    providerKillSwitchDrillSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Kill Switch 演练已准备", redacted:true }, redacted:true },
    productionBlockerMatrixSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Production 阻断矩阵已准备", redacted:true }, redacted:true },
    providerSandboxPilotControlRoomSummary:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox Pilot 控制室已准备", redacted:true }, redacted:true },
    safetySentinelSummary:{ status:"ready", redacted:true },
    operatorConsoleSummary:{ status:"ready", userFacingSummary:{ resultLabel:"运营控制台已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.userFacingSummary.resultLabel, "治理审计控制台已准备");
  assert.equal(ready.rows.some((item) => item.value.includes("治理审计不写文件、不下载、不上传、不发邮件、不打开外部文档。")), true);

  const needsReview = api.buildGlobalShoppingProviderGovernanceAuditConsole({
    providerPilotGovernanceViewModelSummary:{ status:"ready", title:"Provider Pilot 治理与合规证据", redacted:true }
  });
  assert.equal(needsReview.status, "needs_review");

  const blocked = api.buildGlobalShoppingProviderGovernanceAuditConsole({
    providerPilotGovernanceViewModelSummary:{ status:"ready", title:"Provider Pilot 治理与合规证据", redacted:true },
    startRealProvider:true
  });
  assert.equal(blocked.status, "blocked");

  const audit = api.buildGlobalShoppingProviderGovernanceAuditConsoleAuditDraft({ token:"abc", bookingUrl:"https://blocked.example" });
  const json = JSON.stringify(audit);
  assert.equal(json.includes("abc"), false);
  assert.equal(json.includes("https://blocked.example"), false);
  console.log("GLOBAL_SHOPPING_PROVIDER_GOVERNANCE_AUDIT_CONSOLE PASS");
}

main();
