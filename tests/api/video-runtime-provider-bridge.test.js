const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load() { const window = {}; window.window = window; const context = vm.createContext({ window, console }); ["videoRuntime.js", "videoProviderPlatform.js", "videoProviderHost.js", "videoRuntimeProviderBridge.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core", file), "utf8"), context, { filename:file })); return window; }
function setup() { const w = load(); const p = w.WeishanVideoProviderPlatform.createProviderPlatform(); p.register({ providerId:"local-development", displayName:"Local", vendor:"local", version:"1.0.0", status:"PREVIEW", enabled:true, priority:1, capabilities:{ textToVideo:true }, limits:{ maxPromptLength:100, maxImages:1, maxConcurrentTasks:1 }, metadata:{} }); const h = w.WeishanVideoProviderHost.createVideoProviderHost({ platform:p }); h.registerAdapter("local-development", w.WeishanVideoProviderHost.createFakeVideoProviderAdapter({ providerId:"local-development" })); return { w, bridge:w.WeishanVideoRuntimeProviderBridge.createVideoRuntimeProviderBridge({ runtime:w.WeishanVideoRuntime, host:h, providerId:"local-development" }) }; }
function main() {
  const { bridge } = setup();
  assert.deepEqual(Array.from(Object.keys(bridge)).sort(), ["cancelRuntimeTask", "dispose", "downloadRuntimeArtifacts", "getRuntimeTask", "listRuntimeTasks", "refreshRuntimeTask", "submitRuntimeTask"]);
  const input = { title:"Local", prompt:"create", metadata:{ token:"drop", safe:true } }; const copy = structuredClone(input);
  const created = bridge.submitRuntimeTask(input); assert.equal(created.taskId, "video-task-000001"); assert.equal(created.status, "QUEUED"); assert.deepEqual(input, copy); assert.equal("providerTaskId" in created, false);
  const running = bridge.refreshRuntimeTask(created.taskId); assert.equal(running.status, "GENERATING");
  const cancelled = bridge.cancelRuntimeTask(created.taskId); assert.equal(cancelled.status, "CANCELLED");
  assert.throws(() => bridge.cancelRuntimeTask(created.taskId), /TASK_NOT_ACTIVE/);
  assert.equal(bridge.getRuntimeTask(created.taskId).provider, "local-development");
  assert.equal(bridge.listRuntimeTasks().length, 1); assert.equal(bridge.downloadRuntimeArtifacts(created.taskId)[0].artifactId.includes("provider"), false);
  bridge.dispose(); assert.throws(() => bridge.listRuntimeTasks(), /GATEWAY_DISPOSED/);
  const source = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/videoRuntimeProviderBridge.js"), "utf8");
  assert.equal(/\b(fetch|XMLHttpRequest|WebSocket|EventSource|setTimeout|setInterval|Worker|localStorage|indexedDB|eval|Function|node:fs|https?:\/\/)\b/.test(source), false);
  console.log("VIDEO_RUNTIME_PROVIDER_BRIDGE PASS");
}
main();
