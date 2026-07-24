const assert = require("node:assert/strict");
const fs = require("node:fs"); const path = require("node:path"); const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
const { createVideoProviderGateway } = require(path.join(ROOT, "apps/desktop/src/main/videoProviderGateway.js"));
function apis(){ const window = {}; window.window = window; const context = vm.createContext({ window, console }); ["videoRuntime.js", "videoProviderPlatform.js", "videoProviderHost.js", "videoRuntimeProviderBridge.js"].forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core", file), "utf8"), context)); return { runtime:window.WeishanVideoRuntime, platformApi:window.WeishanVideoProviderPlatform, hostApi:window.WeishanVideoProviderHost, bridgeApi:window.WeishanVideoRuntimeProviderBridge }; }
function main(){
  const disabled = createVideoProviderGateway({ enabled:false }); assert.equal(disabled.getStatus().mode, "disabled"); assert.throws(() => disabled.createTask({ prompt:"x" }), /RUNTIME_DISABLED/);
  const gateway = createVideoProviderGateway(Object.assign({ enabled:true, localDevelopment:true }, apis())); assert.deepEqual(Object.keys(gateway).sort(), ["cancelTask", "createTask", "dispose", "downloadArtifacts", "getCapabilities", "getStatus", "listTasks", "queryTask"]);
  const input = { title:"Local", prompt:"create", metadata:{ secret:"drop", ok:true } }; const copy = structuredClone(input); const task = gateway.createTask(input); assert.equal(task.taskId, "video-task-000001"); assert.equal("providerId" in task, false); assert.deepEqual(input, copy);
  assert.equal(gateway.queryTask(task.taskId).status, "GENERATING"); assert.equal(gateway.listTasks({ status:"GENERATING", limit:1 }).length, 1); assert.equal(gateway.downloadArtifacts(task.taskId)[0].downloadMode, "unavailable"); assert.equal(gateway.getCapabilities().available, true); assert.equal(gateway.getStatus().mode, "local-development"); assert.equal(gateway.cancelTask(task.taskId).status, "CANCELLED"); assert.throws(() => gateway.cancelTask(task.taskId), /TASK_NOT_ACTIVE/); assert.throws(() => gateway.queryTask("missing"), /TASK_NOT_FOUND/);
  gateway.dispose(); gateway.dispose(); assert.throws(() => gateway.getStatus(), /GATEWAY_DISPOSED/);
  console.log("VIDEO_PROVIDER_GATEWAY PASS");
}
main();
