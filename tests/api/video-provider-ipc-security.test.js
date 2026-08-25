const assert = require("node:assert/strict");
const fs = require("node:fs"); const path = require("node:path"); const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
const contract = require(path.join(ROOT, "apps/desktop/src/shared/videoProviderIpcContract.js"));
const { registerVideoProviderIpcHandlers } = require(path.join(ROOT, "apps/desktop/src/main/videoProviderIpc.js"));
async function main(){
  assert.deepEqual(Object.keys(contract.IPC_CHANNELS).sort(), ["cancelTask", "createTask", "downloadArtifacts", "getCapabilities", "getStatus", "listTasks", "queryTask"]);
  assert.equal(contract.validateRequest("createTask", { requestId:"r", prompt:"x", images:[{ imageId:"i", name:"n", mimeType:"image/png", sizeBytes:1, sourceType:"local-placeholder", sourceRef:"safe" }] }).valid, true);
  assert.equal(contract.validateRequest("createTask", { requestId:"r", prompt:"x", images:["data:image/png;base64,x"] }).valid, false);
  assert.equal(contract.validateRequest("createTask", { requestId:"r", prompt:"x", token:"leak" }).valid, false);
  assert.equal(contract.validateRequest("queryTask", { requestId:"r", taskId:"x".repeat(81) }).valid, false);
  const cyclic = { requestId:"r", prompt:"x" }; cyclic.metadata = cyclic; assert.equal(contract.validateRequest("createTask", cyclic).valid, true);
  const handlers = {}; const removed = []; const ipcMain = { handle:(channel, fn) => { handlers[channel] = fn; }, removeHandler:(channel) => { removed.push(channel); delete handlers[channel]; } };
  const calls = []; const gateway = { createTask:(v) => { calls.push(v); return { taskId:"video-task-000001" }; }, queryTask:() => ({}), cancelTask:() => ({}), listTasks:() => [], downloadArtifacts:() => [], getCapabilities:() => ({}), getStatus:() => ({ mode:"disabled" }), dispose(){} };
  const registration = registerVideoProviderIpcHandlers(ipcMain, { gateway, validateSender:(event) => event && event.sender === "trusted" });
  assert.deepEqual(Object.keys(handlers).sort(), Object.values(contract.IPC_CHANNELS).sort());
  const denied = await handlers[contract.IPC_CHANNELS.createTask]({ sender:"bad" }, { requestId:"r", prompt:"x" }); assert.equal(denied.ok, false); assert.equal(denied.error.code, "INVALID_CHANNEL");
  const accepted = await handlers[contract.IPC_CHANNELS.createTask]({ sender:"trusted" }, { requestId:"r", prompt:"x", metadata:{ token:"drop", safe:true } }); assert.equal(accepted.ok, true); assert.equal(calls[0].metadata.token, undefined); assert.equal(accepted.error, null);
  registration.dispose(); assert.equal(Object.keys(handlers).length, 0); assert.equal(removed.length >= 7, true);
  const exposed = {}; const invoked = []; const electron = { contextBridge:{ exposeInMainWorld:(name, value) => { exposed[name] = value; } }, ipcRenderer:{ invoke:(channel, payload) => { invoked.push({ channel, payload }); return Promise.resolve({ ok:true }); }, on(){}, removeListener(){} }, shell:{ openExternal(){} } };
  const preload = fs.readFileSync(path.join(ROOT, "apps/desktop/src/preload.js"), "utf8"); vm.runInContext(preload, vm.createContext({ require:(name) => name === "electron" ? electron : name === "./shared/videoProviderIpcContract" ? contract : name === "../package.json" ? { version:"0.0.0-test", productName:"Weishan" } : (() => { throw new Error(name); })(), process:{ env:{} }, console }));
  assert.deepEqual(Object.keys(exposed.weishan.videoRuntime).sort(), ["cancelTask", "createTask", "downloadArtifacts", "getCapabilities", "getStatus", "listTasks", "queryTask"]); assert.equal("ipcRenderer" in exposed.weishan.videoRuntime, false); assert.equal("send" in exposed.weishan.videoRuntime, false); exposed.weishan.videoRuntime.getStatus({ requestId:"r" }); assert.equal(invoked[0].channel, contract.IPC_CHANNELS.getStatus);
  console.log("VIDEO_PROVIDER_IPC_SECURITY PASS");
}
main().catch((error) => { console.error(error); process.exit(1); });
