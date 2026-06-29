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
  const windowRef = load(["apps/desktop/src/renderer/core/globalShoppingSandboxSessionReplayCenter.js"]);
  const api = windowRef.WeishanGlobalShoppingSandboxSessionReplayCenter;
  assert.equal(api.GLOBAL_SHOPPING_SANDBOX_SESSION_REPLAY_CENTER_VERSION, "2.2.7");
  const ready = api.buildGlobalShoppingSandboxSessionReplayCenter({
    sandboxPriceCandidateSession:{ status:"ready", userFacingSummary:{ resultLabel:"Sandbox 价格候选会话已准备", redacted:true }, redacted:true },
    sandboxPriceCandidateResultBoard:{ status:"ready", title:"Sandbox 价格候选结果", caveat:"当前仅展示只读 sandbox 候选结果。", redacted:true },
    firstSandboxProviderConnector:{ status:"ready", userFacingSummary:{ resultLabel:"第一个 Sandbox Connector 已准备", redacted:true }, redacted:true },
    providerCoverageDashboard:{ status:"ready", userFacingSummary:{ resultLabel:"Provider 覆盖结构已准备", redacted:true }, redacted:true },
    readOnlySourceTrustScore:{ status:"ready", userFacingSummary:{ resultLabel:"来源可信度评分已准备", redacted:true }, redacted:true },
    pricePipelineOrchestrator:{ status:"ready", userFacingSummary:{ resultLabel:"只读价格流水线已准备", redacted:true }, redacted:true },
    coveredLowestCandidateBoard:{ status:"ready", userFacingSummary:{ resultLabel:"已覆盖来源较低候选价已准备", redacted:true }, redacted:true },
    sandboxHandoffPreview:{ status:"ready", userFacingSummary:{ resultLabel:"跳转预览已准备", redacted:true }, redacted:true }
  });
  assert.equal(ready.status, "ready");
  assert.equal(ready.replayTimeline.length, 8);
  assert.equal(ready.userFacingSummary.title, "Sandbox 会话回放中心");
  assert.equal(api.buildGlobalShoppingSandboxSessionReplayCenter({}).status, "needs_review");
  assert.equal(api.buildGlobalShoppingSandboxSessionReplayCenter({ sandboxPriceCandidateSession:{ status:"ready" }, rawRequestReplay:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSandboxSessionReplayCenter({ sandboxPriceCandidateSession:{ status:"ready" }, rawResponseReplay:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSandboxSessionReplayCenter({ sandboxPriceCandidateSession:{ status:"ready" }, persistReplay:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSandboxSessionReplayCenter({ sandboxPriceCandidateSession:{ status:"ready" }, networkEnabled:true }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSandboxSessionReplayCenter({ sandboxPriceCandidateSession:{ status:"ready" }, bookingUrl:"https://x" }).status, "blocked");
  assert.equal(api.buildGlobalShoppingSandboxSessionReplayCenter({ sandboxPriceCandidateSession:{ status:"ready" }, payment:true }).status, "blocked");
  assert.equal(/token|secret|apiKey/i.test(JSON.stringify(ready)), false);
  console.log("GLOBAL_SHOPPING_SANDBOX_SESSION_REPLAY_CENTER PASS");
}

main();