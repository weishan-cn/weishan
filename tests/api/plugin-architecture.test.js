const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function enabledVideoPlugin() {
  return {
    pluginId:"local-video",
    name:"Local Video",
    description:"Static declaration only",
    icon:"▹",
    version:"1.0.0",
    enabled:true,
    status:"available",
    capabilities:["video.generate", "image.edit", "automation.run"],
    entryPoint:{ type:"route", routeId:"plugin.video" },
    permissions:{ network:true, filesystem:false, camera:false, microphone:false, clipboard:false, externalUrl:false }
  };
}

function assertDecision(actual, expected) {
  for (const [key, value] of Object.entries(expected)) assert.equal(actual[key], value);
}

function main() {
  const windowRef = load([
    "apps/desktop/src/renderer/core/moduleRegistry.js",
    "apps/desktop/src/renderer/core/pluginRegistry.js",
    "apps/desktop/src/renderer/core/pluginCapabilityGate.js",
    "apps/desktop/src/renderer/core/pluginPermissionGate.js"
  ]);
  const registry = windowRef.WeishanPluginRegistry;
  const capabilityGate = windowRef.WeishanPluginCapabilityGate;
  const permissionGate = windowRef.WeishanPluginPermissionGate;
  const declarations = registry.getDeclaredPlugins();
  const video = declarations.find((plugin) => plugin.pluginId === "video-generation");
  const imageTools = declarations.find((plugin) => plugin.pluginId === "image-tools");

  assert.ok(imageTools);
  assert.equal(imageTools.name, "Image Tools");
  assert.equal(imageTools.enabled, true);
  assert.equal(imageTools.connectionState, "READY");
  assert.equal(imageTools.authRequirement, "NONE");
  assert.equal(imageTools.costClass, "FREE");
  assert.equal(imageTools.permissions.network, false);
  assert.equal(imageTools.permissions.filesystem, true);
  assert.equal(imageTools.entryPoint.routeId, "plugin.image-tools");

  assert.equal(video.pluginId, "video-generation");
  assert.equal(video.capabilityType, "WORKFLOW_PLUGIN");
  assert.equal(video.trustClass, "WEISHAN_OFFICIAL");
  assert.equal(video.connectionState, "DISABLED");
  assert.equal(video.authRequirement, "UNKNOWN");
  assert.equal(video.costClass, "UNKNOWN");
  assert.equal(registry.DEFAULT_MARKET_POLICY.freeOnly, true);
  assert.equal(registry.DEFAULT_MARKET_POLICY.openSourceOnly, true);
  assert.equal(registry.DEFAULT_MARKET_POLICY.reviewedOnly, true);
  assert.equal(registry.DEFAULT_MARKET_POLICY.actuallyUsableOnly, true);
  assert.equal(registry.DEFAULT_MARKET_POLICY.maxRecommended, 2);
  assert.equal(registry.DEFAULT_MARKET_POLICY.publicRating, false);
  assert.equal(registry.licenseFor(video).spdx, "MIT");
  assert.equal(registry.licenseFor(video).openSource, true);
  assert.deepEqual(Array.from(video.operationClasses), ["READ"]);
  assert.equal(video.entryPoint.routeId, "plugin.video");
  assert.equal(video.enabled, false);
  assert.equal(registry.getPluginCenterEntries().length, 2);
  assert.equal(registry.getPluginCenterEntries().find((plugin) => plugin.pluginId === "video-generation").name, "视频制作");
  assert.equal(registry.getPluginCenterEntries().find((plugin) => plugin.pluginId === "video-generation").trustClass, "WEISHAN_OFFICIAL");
  assert.equal(registry.getPluginCenterEntries().find((plugin) => plugin.pluginId === "video-generation").ready, false);
  const presentation = registry.presentationFor(video);
  assert.equal(presentation.tagline, "用一句话生成和编辑视频");
  assert.equal(presentation.userStatus, "coming_soon");
  assert.equal(presentation.runtimeNotice, "视频生成服务尚未接入");
  assert.equal(presentation.simplePromptPlaceholder, "帮我做一个 15 秒的咖啡广告，电影感，适合抖音");
  assert.deepEqual(Array.from(presentation.supportedMaterialTypes), ["image", "video", "audio"]);
  assert.deepEqual(Array.from(presentation.categories), ["video", "image", "audio", "ai"]);
  assert.equal(presentation.tagline.includes("video.generate"), false);
  assert.deepEqual(Array.from(video.permissions.network === false ? [false] : []), [false]);
  assert.equal(registry.getEnabledSidebarEntries().length, 1);
  assert.equal(registry.getEnabledSidebarEntries()[0].pluginId, "image-tools");
  assert.equal(windowRef.WeishanModules.get("plugins").groupId, "execution");
  assert.equal(windowRef.WeishanModules.getGroup("plugins"), null);
  assert.equal(registry.validatePlugin(enabledVideoPlugin()).valid, true);
  assert.equal(registry.validatePlugin(enabledVideoPlugin()).plugin.trustClass, "LOCAL_PRIVATE");
  assert.equal(registry.validatePlugin(enabledVideoPlugin()).plugin.costClass, "UNKNOWN");
  assert.equal(registry.validatePlugin(Object.assign(enabledVideoPlugin(), { pluginId:"openai.codex", trustClass:"OPENAI_OFFICIAL" })).reason, "reserved_identity_requires_trusted_registration");
  assert.equal(registry.validatePlugin(Object.assign(enabledVideoPlugin(), { pluginId:"weishan.global-shopping" })).reason, "reserved_identity_requires_trusted_registration");
  assert.equal(registry.validatePlugin(Object.assign(enabledVideoPlugin(), { trustClass:"OPENAI_OFFICIAL" })).reason, "reserved_identity_requires_trusted_registration");
  assert.equal(registry.validatePlugin(Object.assign(enabledVideoPlugin(), { capabilityType:"DEVELOPER_AGENT", requestedPermissions:["network"], grantedPermissions:["network"] })).valid, false);
  assert.equal(registry.validatePlugin(Object.assign(enabledVideoPlugin(), { capabilityType:"DEVELOPER_AGENT", operationClasses:["READ", "PRODUCTION"] })).valid, true);
  assert.equal(registry.validatePlugin(Object.assign(enabledVideoPlugin(), { capabilityType:"UNKNOWN_AGENT" })).valid, false);
  assert.equal(registry.validatePlugin(Object.assign(enabledVideoPlugin(), { costClass:"FREEISH" })).valid, false);
  assert.equal(registry.validatePlugin(Object.assign(enabledVideoPlugin(), { authRequirement:"CONNECTED" })).valid, false);
  assert.equal(registry.validatePlugin(Object.assign(enabledVideoPlugin(), { connectionState:"READY" })).plugin.ready, true);
  assert.equal(registry.validatePlugin(Object.assign(enabledVideoPlugin(), { connectionState:"CONNECTED" })).plugin.ready, false);
  assert.equal(registry.validatePluginWithPolicy(Object.assign(enabledVideoPlugin(), { pluginId:"openai.codex", capabilities:["openai.codex"], capabilityType:"DEVELOPER_AGENT", trustClass:"OPENAI_OFFICIAL", connectionState:"NOT_CONNECTED", authRequirement:"USER_ACCOUNT", costClass:"USER_SUBSCRIPTION_REQUIRED", operationClasses:["READ", "WRITE_LOCAL"] }), undefined, { trustedRegistration:true }).valid, true);
  assert.equal(registry.validatePluginWithPolicy(Object.assign(enabledVideoPlugin(), { pluginId:"openai.codex", capabilities:["openai.codex"], capabilityType:"DEVELOPER_AGENT", trustClass:"OPENAI_OFFICIAL", connectionState:"NOT_CONNECTED", authRequirement:"USER_ACCOUNT", costClass:"USER_SUBSCRIPTION_REQUIRED", operationClasses:["READ", "WRITE_LOCAL"] }), undefined, { trustedRegistration:true }).plugin.ready, false);
  const accessorPlugin = enabledVideoPlugin();
  Object.defineProperty(accessorPlugin, "trustClass", { enumerable:true, get(){ return "OPENAI_OFFICIAL"; } });
  assert.equal(registry.validatePlugin(accessorPlugin).reason, "unsafe_plugin_metadata");
  assert.equal(registry.validatePlugin(Object.assign(enabledVideoPlugin(), { accessToken:"x" })).reason, "unsafe_plugin_metadata");
  assert.equal(registry.validatePlugin(Object.assign(enabledVideoPlugin(), { entryPoint:{ type:"route", routeId:"home" } })).valid, false);
  assert.equal(registry.validatePlugin(Object.assign(enabledVideoPlugin(), { entryPoint:{ type:"url", routeId:"https://example.invalid" } })).valid, false);
  assert.equal(registry.validatePlugin(Object.assign(enabledVideoPlugin(), { name:"<img src=x>" })).valid, false);
  assert.equal(registry.validateDeclarations([enabledVideoPlugin(), enabledVideoPlugin()])[1].reason, "duplicate_plugin_id_or_route");
  assert.equal(registry.getEnabledSidebarEntries([enabledVideoPlugin()]).length, 1);
  assert.equal(registry.workspaceForRoute("plugin.video"), "VideoPluginWorkspace");
  assert.equal(registry.workspaceForRoute("plugin.image-tools"), "ImageToolsWorkspace");
  assert.equal(registry.pageForRoute("plugin.video"), "");
  assert.equal(registry.pageForRoute("plugin.image-tools"), "ImageToolsWorkspace");
  assert.equal(registry.privateQualitySignal(video).eligible, false);
  assert.equal(registry.privateQualitySignal(video).defaultMarketEligible, false);
  assert.equal(registry.marketplaceModel().entries.length, 2);
  assert.equal(registry.marketplaceModel().entries.find((plugin) => plugin.pluginId === "video-generation").defaultMarketEligible, false);
  assert.equal(registry.marketplaceModel().defaultMarket.length, 1);
  assert.equal(registry.marketplaceModel().defaultMarket[0].pluginId, "image-tools");
  assert.deepEqual(Array.from(registry.marketplaceModel().categories), ["ai", "audio", "image", "video"]);
  assert.equal(registry.marketplaceModel().recommended.length, 1);
  assert.equal(registry.marketplaceModel().recommended[0].pluginId, "image-tools");

  assertDecision(capabilityGate.evaluate(video, "video.generate"), { allowed:false, reason:"plugin_disabled" });
  assertDecision(capabilityGate.evaluate(enabledVideoPlugin(), "image.generate"), { allowed:false, reason:"capability_not_declared" });
  assertDecision(capabilityGate.evaluate(enabledVideoPlugin(), "Unknown?capability"), { allowed:false, reason:"unknown_capability" });
  assertDecision(capabilityGate.evaluate(enabledVideoPlugin(), "video.generate"), { allowed:true, reason:"declared_capability_only", runtimeGranted:false });
  assertDecision(capabilityGate.evaluate(enabledVideoPlugin(), "image.edit"), { allowed:true, reason:"declared_capability_only", runtimeGranted:false });
  assertDecision(permissionGate.evaluate(video, "network"), { allowed:false, declared:false, reason:"plugin_disabled" });
  assertDecision(permissionGate.evaluate(enabledVideoPlugin(), "unknownPermission"), { allowed:false, declared:false, reason:"unknown_permission" });
  assertDecision(permissionGate.evaluate(enabledVideoPlugin(), "filesystem"), { allowed:false, declared:false, reason:"permission_not_declared" });
  assertDecision(permissionGate.evaluate(enabledVideoPlugin(), "externalUrl"), { allowed:false, declared:false, reason:"permission_not_declared" });
  assertDecision(permissionGate.evaluate(enabledVideoPlugin(), "network"), { allowed:false, declared:true, reason:"runtime_permission_not_granted" });
  console.log("PLUGIN_ARCHITECTURE PASS");
}

main();
