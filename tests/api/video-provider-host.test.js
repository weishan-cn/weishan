const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const PLATFORM_PATH = path.join(ROOT, "apps/desktop/src/renderer/core/videoProviderPlatform.js");
const HOST_PATH = path.join(ROOT, "apps/desktop/src/renderer/core/videoProviderHost.js");
const RUNTIME_PATH = path.join(ROOT, "apps/desktop/src/renderer/core/videoRuntime.js");

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(PLATFORM_PATH, "utf8"), context, { filename:PLATFORM_PATH });
  vm.runInContext(fs.readFileSync(HOST_PATH, "utf8"), context, { filename:HOST_PATH });
  return window;
}

function descriptor(overrides) {
  return Object.assign({
    providerId:"fake-video",
    displayName:"Fake Video",
    vendor:"local-test",
    version:"1.0.0",
    status:"PREVIEW",
    enabled:true,
    priority:1,
    capabilities:{ textToVideo:true, imageToVideo:true, negativePrompt:true, seed:true, cameraControl:true, motionControl:true, styleControl:true, durationControl:true, resolutionControl:true, fpsControl:true },
    limits:{ maxPromptLength:20, maxImages:2, minDurationSeconds:2, maxDurationSeconds:10, maxBatchSize:2, maxConcurrentTasks:1 },
    metadata:{ safe:{ level:1 } }
  }, overrides || {});
}

function capture(fn) { try { fn(); return null; } catch (error) { return error; } }
function plain(value) { return JSON.parse(JSON.stringify(value)); }

function main() {
  const windowRef = load();
  const platformApi = windowRef.WeishanVideoProviderPlatform;
  const hostApi = windowRef.WeishanVideoProviderHost;
  const platform = platformApi.createProviderPlatform();
  platform.register(descriptor());
  const host = hostApi.createVideoProviderHost({ platform });
  assert.deepEqual(Object.keys(host).sort(), ["cancelTask", "dispose", "downloadArtifacts", "hasAdapter", "listAdapters", "queryTask", "registerAdapter", "submitTask", "unregisterAdapter", "validateRequest"]);
  assert.equal(host.hasAdapter("fake-video"), false);
  assert.deepEqual(plain(host.listAdapters()), []);

  const adapter = hostApi.createFakeVideoProviderAdapter({ providerId:"fake-video" });
  assert.equal(hostApi.validateAdapterContract(adapter).valid, true);
  assert.deepEqual(plain(host.registerAdapter("fake-video", adapter, { safe:{ nested:{ value:true } }, token:"drop" })), { providerId:"fake-video", createdAt:"local-binding", metadata:{ safe:{ nested:{ value:true } } } });
  assert.equal(host.hasAdapter("fake-video"), true);
  assert.equal(host.listAdapters()[0].adapter, undefined);
  assert.equal(capture(() => host.registerAdapter("unknown-video", adapter)).code, "PROVIDER_NOT_FOUND");
  assert.equal(capture(() => host.registerAdapter("fake-video", adapter)).code, "ADAPTER_INVALID");
  assert.equal(capture(() => host.registerAdapter("fake-video", { providerId:"fake-video" })).code, "ADAPTER_INVALID");
  const disabledPlatform = platformApi.createProviderPlatform();
  disabledPlatform.register(descriptor({ providerId:"disabled-video", enabled:false, status:"DISABLED" }));
  const disabledHost = hostApi.createVideoProviderHost({ platform:disabledPlatform });
  assert.equal(disabledHost.registerAdapter("disabled-video", hostApi.createFakeVideoProviderAdapter({ providerId:"disabled-video" })).providerId, "disabled-video");
  assert.equal(disabledHost.validateRequest("disabled-video", { prompt:"create" }).errors[0].code, "PROVIDER_DISABLED");

  const request = { title:"Test", prompt:"create", negativePrompt:"avoid", images:["a", "b"], duration:5, resolution:"720p", fps:24, seed:1, style:"clean", camera:"wide", motion:"slow", metadata:{ batchSize:1, safe:{ nested:{ one:{ two:{ three:{ four:{ five:{ six:"drop" } } } } } } } } };
  const originalRequest = JSON.parse(JSON.stringify(request));
  const validation = host.validateRequest("fake-video", request);
  assert.equal(validation.valid, true);
  assert.deepEqual(request, originalRequest);
  assert.deepEqual(Array.from(hostApi.resolveRequiredCapabilities(validation.normalizedRequest)), ["textToVideo", "imageToVideo", "negativePrompt", "seed", "cameraControl", "motionControl", "styleControl", "durationControl", "resolutionControl", "fpsControl"]);
  assert.equal(validation.normalizedRequest.metadata.safe.nested.one.two.three.four, undefined);
  assert.equal(host.validateRequest("fake-video", Object.assign({}, request, { prompt:"x".repeat(21) })).errors[0].code, "LIMIT_EXCEEDED");
  assert.equal(host.validateRequest("fake-video", Object.assign({}, request, { images:["a", "b", "c"] })).errors[0].code, "LIMIT_EXCEEDED");
  assert.equal(host.validateRequest("fake-video", Object.assign({}, request, { duration:1 })).errors[0].code, "LIMIT_EXCEEDED");
  assert.equal(host.validateRequest("fake-video", Object.assign({}, request, { duration:11 })).errors[0].code, "LIMIT_EXCEEDED");
  const unsupportedPlatform = platformApi.createProviderPlatform();
  unsupportedPlatform.register(descriptor({ providerId:"text-only", capabilities:{ textToVideo:true } }));
  const unsupportedHost = hostApi.createVideoProviderHost({ platform:unsupportedPlatform });
  unsupportedHost.registerAdapter("text-only", hostApi.createFakeVideoProviderAdapter({ providerId:"text-only" }));
  assert.equal(unsupportedHost.validateRequest("text-only", request).errors.some((entry) => entry.code === "CAPABILITY_UNSUPPORTED"), true);

  const submitted = host.submitTask("fake-video", request);
  assert.deepEqual(Object.keys(submitted), ["providerId", "providerTaskId", "status", "artifacts", "usage", "metadata"]);
  assert.equal(submitted.status, "QUEUED");
  assert.equal(submitted.ignored, undefined);
  assert.equal(submitted.artifacts[0].uri, "local-placeholder://video.mp4");
  assert.equal(host.queryTask("fake-video", submitted.providerTaskId).status, "RUNNING");
  assert.equal(host.cancelTask("fake-video", submitted.providerTaskId).status, "CANCELLED");
  assert.deepEqual(Array.from(host.downloadArtifacts("fake-video", submitted.providerTaskId).map((artifact) => artifact.type)), ["video"]);
  assert.equal(capture(() => host.submitTask("fake-video", Object.assign({}, request, { prompt:"x".repeat(21) }))).code, "REQUEST_INVALID");

  const failedValidate = hostApi.createFakeVideoProviderAdapter({ providerId:"fake-video", failureMode:"validate" });
  const failedHost = hostApi.createVideoProviderHost({ platform });
  failedHost.registerAdapter("fake-video", failedValidate);
  assert.equal(capture(() => failedHost.submitTask("fake-video", request)).code, "REQUEST_INVALID");
  ["submit", "query", "cancel", "download", "normalize"].forEach((failureMode) => {
    const localPlatform = platformApi.createProviderPlatform();
    localPlatform.register(descriptor({ providerId:"failure-" + failureMode }));
    const localHost = hostApi.createVideoProviderHost({ platform:localPlatform });
    localHost.registerAdapter("failure-" + failureMode, hostApi.createFakeVideoProviderAdapter({ providerId:"failure-" + failureMode, failureMode }));
    const operation = failureMode === "submit" ? () => localHost.submitTask("failure-" + failureMode, request) : failureMode === "query" ? () => localHost.queryTask("failure-" + failureMode, "task") : failureMode === "cancel" ? () => localHost.cancelTask("failure-" + failureMode, "task") : failureMode === "download" ? () => localHost.downloadArtifacts("failure-" + failureMode, "task") : () => localHost.submitTask("failure-" + failureMode, request);
    assert.equal(capture(operation).code, failureMode === "normalize" ? "NORMALIZATION_FAILED" : failureMode.toUpperCase() + "_FAILED");
  });

  let reentrantHost;
  const concurrentPlatform = platformApi.createProviderPlatform();
  concurrentPlatform.register(descriptor({ providerId:"concurrent", limits:{ maxConcurrentTasks:1 } }));
  const concurrentAdapter = hostApi.createFakeVideoProviderAdapter({ providerId:"concurrent" });
  concurrentAdapter.submit = function(input) { assert.equal(capture(() => reentrantHost.submitTask("concurrent", input)).code, "LIMIT_EXCEEDED"); return { providerTaskId:"fake-task", status:"QUEUED", artifacts:[], usage:{}, metadata:{} }; };
  reentrantHost = hostApi.createVideoProviderHost({ platform:concurrentPlatform });
  reentrantHost.registerAdapter("concurrent", concurrentAdapter);
  assert.equal(reentrantHost.submitTask("concurrent", request).status, "QUEUED");
  assert.equal(reentrantHost.submitTask("concurrent", request).status, "QUEUED");

  platform.disable("fake-video");
  assert.equal(host.validateRequest("fake-video", request).errors[0].code, "PROVIDER_DISABLED");
  platform.enable("fake-video");
  host.dispose();
  host.dispose();
  assert.equal(platform.exists("fake-video"), true);
  ["registerAdapter", "unregisterAdapter", "hasAdapter", "listAdapters", "validateRequest", "submitTask", "queryTask", "cancelTask", "downloadArtifacts"].forEach((method) => {
    const args = method === "registerAdapter" ? ["fake-video", adapter] : method === "validateRequest" || method === "submitTask" ? ["fake-video", request] : method === "queryTask" || method === "cancelTask" || method === "downloadArtifacts" ? ["fake-video", "task"] : method === "unregisterAdapter" || method === "hasAdapter" ? ["fake-video"] : [];
    assert.equal(capture(() => host[method](...args)).code, "HOST_DISPOSED");
  });

  const hostSource = fs.readFileSync(HOST_PATH, "utf8");
  const runtimeSource = fs.readFileSync(RUNTIME_PATH, "utf8");
  assert.equal(/\b(fetch|XMLHttpRequest|WebSocket|EventSource|Worker)\b/.test(hostSource), false);
  assert.equal(/https?:\/\//.test(hostSource), false);
  assert.equal(/\b(setTimeout|setInterval|requestAnimationFrame|queueMicrotask|eval|Function|localStorage|indexedDB|process\.env|Math\.random|crypto\.randomUUID)\b/.test(hostSource), false);
  assert.equal(/WeishanVideoProviderHost|createFakeVideoProviderAdapter/.test(runtimeSource), false);
  console.log("VIDEO_PROVIDER_HOST PASS");
}

main();
