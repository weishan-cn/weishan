const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const PLATFORM_PATH = path.join(ROOT, "apps/desktop/src/renderer/core/videoProviderPlatform.js");
const RUNTIME_PATH = path.join(ROOT, "apps/desktop/src/renderer/core/videoRuntime.js");

function loadPlatform() {
  const window = {};
  window.window = window;
  vm.runInContext(fs.readFileSync(PLATFORM_PATH, "utf8"), vm.createContext({ window, console }), { filename:PLATFORM_PATH });
  return window.WeishanVideoProviderPlatform;
}

function descriptor(overrides) {
  return Object.assign({
    providerId:"fake-video",
    displayName:"Fake Video",
    vendor:"local-test",
    version:"1.0.0",
    status:"PREVIEW",
    capabilities:{ textToVideo:true, durationControl:true },
    limits:{ maxDurationSeconds:30, maxPromptLength:500 },
    priority:20,
    enabled:true,
    metadata:{ localOnly:true }
  }, overrides || {});
}

function main() {
  const platformApi = loadPlatform();
  const item = platformApi.createProviderDescriptor(descriptor());
  assert.equal(item.providerId, "fake-video");
  assert.equal(item.capabilities.textToVideo, true);
  assert.equal(item.capabilities.imageToVideo, false);
  assert.equal(item.limits.maxDurationSeconds, 30);
  assert.equal(item.limits.dailyQuota, null);
  assert.equal(item.enabled, true);
  assert.throws(() => platformApi.createProviderDescriptor(descriptor({ displayName:"" })), /missing_provider_display_name/);
  assert.throws(() => platformApi.createProviderDescriptor(descriptor({ apiKey:"not-allowed" })), /unknown_provider_descriptor_field/);
  assert.throws(() => platformApi.createProviderDescriptor(descriptor({ metadata:{ token:"not-allowed" } })), /sensitive_provider_metadata/);

  const registry = platformApi.createVideoProviderRegistry();
  registry.register(item);
  assert.equal(registry.exists("fake-video"), true);
  assert.equal(registry.count(), 1);
  assert.throws(() => registry.register(item), /duplicate_provider_id/);
  registry.disable("fake-video");
  assert.equal(registry.get("fake-video").enabled, false);
  registry.enable("fake-video");
  registry.setPriority("fake-video", 5);
  assert.equal(registry.get("fake-video").priority, 5);
  assert.equal(registry.unregister("fake-video"), true);
  assert.equal(registry.count(), 0);

  const factory = platformApi.createProviderPlatform();
  factory.register(descriptor({ providerId:"fallback-video", priority:40 }));
  factory.register(descriptor({ providerId:"preferred-video", priority:10, capabilities:{ textToVideo:true, imageToVideo:true } }));
  factory.register(descriptor({ providerId:"disabled-video", priority:1, enabled:false }));
  assert.equal(factory.selectProvider({ capabilities:["textToVideo"] }).providerId, "preferred-video");
  assert.equal(factory.selectProvider({ capabilities:["imageToVideo"] }).providerId, "preferred-video");
  factory.disable("preferred-video");
  assert.equal(factory.selectProvider({ capabilities:["textToVideo"] }).providerId, "fallback-video");
  assert.equal(factory.selectProvider({ capabilities:["lipSync"] }), null);
  factory.clear();
  assert.equal(factory.count(), 0);

  const request = platformApi.createVideoGenerationRequest({ title:"本地请求", prompt:"生成测试方案", images:["image-a"], duration:8, resolution:"1080p", fps:24, seed:7, style:"cinematic", camera:"wide", motion:"slow", metadata:{ localOnly:true } });
  assert.deepEqual(JSON.parse(JSON.stringify(request)), { title:"本地请求", prompt:"生成测试方案", negativePrompt:null, images:["image-a"], duration:8, resolution:"1080p", fps:24, seed:7, style:"cinematic", camera:"wide", motion:"slow", metadata:{ localOnly:true } });
  assert.throws(() => platformApi.createVideoGenerationRequest({ duration:"not-a-number" }), /invalid_video_request_duration/);
  const result = platformApi.createVideoGenerationResult({ providerId:"fake-video", providerTaskId:"fake-task", status:"ready", artifacts:[{ type:"video", title:"placeholder" }], usage:{ units:1 }, metadata:{ localOnly:true } });
  assert.deepEqual(JSON.parse(JSON.stringify(result)), { providerId:"fake-video", providerTaskId:"fake-task", status:"ready", artifacts:[{ type:"video", title:"placeholder" }], usage:{ units:1 }, metadata:{ localOnly:true } });
  assert.throws(() => platformApi.createVideoGenerationResult({ providerId:"fake-video", usage:{ token:"not-allowed" } }), /sensitive_provider_metadata/);

  const fake = platformApi.createFakeProvider(descriptor());
  assert.equal(platformApi.validateProviderAdapter(fake.adapter).valid, true);
  assert.equal(fake.adapter.submit(request).providerTaskId, "fake-task");
  assert.equal(fake.adapter.query().status, "ready");
  assert.equal(fake.adapter.cancel().status, "cancelled");
  assert.deepEqual(Array.from(fake.adapter.download()), []);
  assert.equal(fake.adapter.normalizeError().message, "失败，请重试");

  const platformSource = fs.readFileSync(PLATFORM_PATH, "utf8");
  const runtimeSource = fs.readFileSync(RUNTIME_PATH, "utf8");
  assert.equal(/\b(fetch|XMLHttpRequest|WebSocket|EventSource|Worker)\b/.test(platformSource), false);
  assert.equal(/https?:\/\//.test(platformSource), false);
  assert.equal(/\b(setTimeout|setInterval|eval|Function|localStorage|indexedDB|process\.env)\b/.test(platformSource), false);
  assert.equal(/Fake Provider|fake-video|WeishanVideoProviderPlatform/.test(runtimeSource), false);
  console.log("VIDEO_PROVIDER_PLATFORM PASS");
}

main();
