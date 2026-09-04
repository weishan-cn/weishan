const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load() {
  const values = new Map();
  const window = { WeishanStore:{ read:(key, fallback) => values.has(key) ? structuredClone(values.get(key)) : fallback, write:(key, value) => values.set(key, structuredClone(value)), remove:(key) => values.delete(key) } };
  window.window = window;
  const context = vm.createContext({ window, console, Date, Map, Set, Object, Array, String, Number, JSON, Promise, structuredClone });
  for (const file of [
    "apps/desktop/src/renderer/core/pluginRuntimeV2Contract.js",
    "apps/desktop/src/renderer/core/pluginRuntimeV2.js",
    "apps/desktop/src/renderer/core/pluginRuntimeV2Catalog.js",
    "apps/desktop/src/renderer/core/brainCapabilityDiscovery.js",
    "apps/desktop/src/renderer/core/videoStudioFoundation.js"
  ]) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const window = load();
  const catalogApi = window.WeishanPluginRuntimeV2Catalog;
  const runtime = catalogApi.runtime;
  const brain = window.WeishanBrainCapabilityDiscovery;
  const videoFoundation = window.WeishanVideoStudioFoundation;
  const ordered = catalogApi.catalog().slice().sort((a, b) => a.marketplacePriority - b.marketplacePriority);

  assert.deepEqual(Array.from(ordered.map((item) => item.marketplacePriority)), [1, 2, 3, 4, 5, 6]);
  assert.equal(ordered[0].pluginId, "weishan.studio.video");
  assert.equal(ordered[0].consumerOutcome.zh, "制作短视频");
  assert.equal(ordered[1].consumerOutcome.zh, "写代码和修项目");
  assert.equal(ordered[2].consumerOutcome.zh, "自动操作和整理网页");
  assert.equal(ordered[3].consumerOutcome.zh, "生成和编辑图片");
  assert.equal(ordered[4].consumerOutcome.zh, "处理 PDF、表格和演示文稿");
  assert.equal(ordered[5].consumerOutcome.zh, "完成复杂长任务");

  const video = ordered[0];
  assert.equal(video.availability, "FOUNDATION_PLANNED_NOT_READY_FOR_USER_EXECUTION");
  assert.equal(video.capabilities.length, 14);
  for (const capabilityId of ["video.script", "video.storyboard", "video.generate", "video.import", "video.trim", "video.edit", "video.subtitle", "video.caption_style", "video.voiceover", "video.audio_mix", "video.music", "video.cover", "video.resize", "video.export"]) {
    assert.equal(video.capabilities.some((item) => item.capabilityId === capabilityId), true, capabilityId);
  }
  assert.equal(video.directPublishing, false);
  assert.equal(video.optionalComponents.length, 4);
  assert.equal(runtime.install(video.pluginId).error, "PLUGIN_NOT_INSTALL_READY");

  const planned = videoFoundation.planFromBrief("把新品介绍做成一个 45 秒抖音短视频", { profile:"vertical", durationSeconds:45 });
  assert.equal(planned.status, "FOUNDATION_PLAN_ONLY");
  assert.equal(planned.exportPlan.aspectRatio, "9:16");
  assert.equal(planned.exportPlan.publishingIncluded, false);
  assert.equal(planned.renderedVideo, null);
  assert.equal(planned.fakeGeneration, false);
  assert.equal(planned.providerSelected, false);
  assert.equal(planned.externalEffects, 0);
  assert.equal(planned.artifacts.find((item) => item.type === "rendered_video").status, "NOT_RENDERED");

  const videoIntent = brain.discoverForIntent("帮我做一个抖音短视频", runtime);
  assert.deepEqual(Array.from(videoIntent.capabilities), ["video.script", "video.storyboard", "video.edit", "video.export"]);
  assert.equal(videoIntent.steps.every((step) => step.status === "INSTALL_RECOMMENDATION_NOT_READY"), true);
  assert.equal(videoIntent.steps.every((step) => step.candidates[0] === "weishan.studio.video"), true);
  const softwareIntent = brain.discoverForIntent("帮我修这个项目的 bug", runtime);
  assert.equal(softwareIntent.capabilities.includes("software.modify"), true);
  assert.equal(softwareIntent.steps.find((step) => step.capabilityId === "software.modify").candidates[0], "weishan.connector.codex");
  const webIntent = brain.discoverForIntent("把这个网站的商品整理出来", runtime);
  assert.deepEqual(Array.from(webIntent.capabilities), ["web.extract"]);
  assert.equal(webIntent.steps[0].candidates[0], "weishan.connector.openclaw");
  const officeIntent = brain.discoverForIntent("把这些数据整理成 Excel", runtime);
  assert.deepEqual(Array.from(officeIntent.capabilities), ["spreadsheet.write"]);
  assert.equal(officeIntent.steps[0].candidates[0], "weishan.tools.office");
  for (const result of [videoIntent, softwareIntent, webIntent, officeIntent]) {
    assert.equal(result.authority, "WEISHAN_BRAIN");
    assert.equal(result.commissionInfluence, false);
  }

  assert.equal(ordered[1].implementationProvider, "Codex");
  assert.equal(ordered[2].implementationProvider, "OpenClaw");
  assert.equal(ordered[5].implementationProvider, "Hermes");
  assert.equal(ordered.slice(0, 6).some((item) => item.downloadSize > 0), false);
  assert.equal(ordered.filter((item) => item.availability !== "READY").every((item) => item.signature.status === "NOT_VERIFIED"), true);
  assert.equal(ordered.filter((item) => item.availability !== "READY").every((item) => runtime.install(item.pluginId).ok === false), true);
  console.log("PLUGIN_MARKETPLACE_CONSUMER_FLAGSHIP_DIRECTION PASS");
}

main();
