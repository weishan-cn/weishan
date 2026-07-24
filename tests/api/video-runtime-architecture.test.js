const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const SOURCE_PATH = path.join(ROOT, "apps/desktop/src/renderer/core/videoRuntime.js");

function loadRuntime() {
  const window = {};
  window.window = window;
  vm.runInContext(fs.readFileSync(SOURCE_PATH, "utf8"), vm.createContext({ window, console }), { filename:SOURCE_PATH });
  return window.WeishanVideoRuntime;
}

function providerStub() {
  return {
    providerId:"future-provider",
    createTask() {},
    queryTask() {},
    cancelTask() {},
    downloadArtifacts() {},
    normalizeResult() {},
    normalizeError() {}
  };
}

function main() {
  const runtime = loadRuntime();
  const repository = runtime.createInMemoryTaskRepository();
  const eventBus = runtime.createRuntimeEventBus();
  const receivedEvents = [];
  const unsubscribe = eventBus.subscribe((event) => receivedEvents.push(event.type));
  const selector = runtime.createProviderSelector();
  const retryPolicy = runtime.createRetryPolicy();
  const cancelPolicy = runtime.createCancelPolicy();
  const orchestrator = runtime.createTaskOrchestrator({ repository, eventBus, providerSelector:selector, retryPolicy, cancelPolicy });
  ["createTask", "startTask", "refreshTask", "cancelTask", "completeTask", "failTask", "finalizeArtifacts", "normalizeResult", "normalizeError"].forEach((name) => {
    assert.equal(typeof orchestrator[name], "function");
  });

  const created = orchestrator.createTask({
    taskId:"video-task-1",
    title:"豪华跑车广告",
    userPrompt:"制作一支 15 秒豪华跑车广告",
    createdAt:"2026-07-24T00:00:00.000Z"
  });

  assert.equal(created.status, runtime.VIDEO_TASK_STATUS.CREATED);
  assert.equal(created.progress, null);
  assert.equal(created.provider, null);
  assert.deepEqual(Array.from(created.artifacts), []);
  assert.equal(runtime.taskPresentation(created).status, "准备中……");
  assert.equal(runtime.taskPresentation(created).progress, null);
  assert.deepEqual(Object.fromEntries(Object.entries(runtime.VIDEO_TASK_STATUS).map(([name, value]) => [name, runtime.taskPresentation(Object.assign({}, created, { status:value })).status])), {
    CREATED:"准备中……",
    PREPARING:"准备中……",
    QUEUED:"准备中……",
    GENERATING:"正在生成……",
    POST_PROCESSING:"处理中……",
    COMPLETED:"已完成",
    FAILED:"失败，请重试",
    CANCELLED:"已取消"
  });

  const preparing = orchestrator.startTask(created.taskId);
  assert.equal(preparing.status, runtime.VIDEO_TASK_STATUS.PREPARING);
  assert.equal(preparing.provider, "stub");
  const queued = orchestrator.refreshTask(created.taskId, { status:runtime.VIDEO_TASK_STATUS.QUEUED });
  const generating = orchestrator.refreshTask(
    queued.taskId,
    { status:runtime.VIDEO_TASK_STATUS.GENERATING, progress:42, optimizedPrompt:"电影感豪华跑车广告" }
  );
  const processing = orchestrator.refreshTask(
    generating.taskId,
    { status:runtime.VIDEO_TASK_STATUS.POST_PROCESSING }
  );
  assert.equal(processing.status, runtime.VIDEO_TASK_STATUS.POST_PROCESSING);
  assert.equal(generating.progress, 42);
  assert.equal(runtime.taskPresentation(generating).status, "正在生成……");
  assert.equal(generating.optimizedPrompt, "电影感豪华跑车广告");

  const artifacts = runtime.VIDEO_ARTIFACT_TYPES.map((type) => ({ artifactId:type + "-1", taskId:created.taskId, type, title:type + " result" }));
  const completed = orchestrator.completeTask(processing.taskId, artifacts);
  assert.equal(completed.status, runtime.VIDEO_TASK_STATUS.COMPLETED);
  assert.equal(completed.progress, 42);
  assert.deepEqual(Array.from(completed.artifacts.map((artifact) => artifact.type)), Array.from(runtime.VIDEO_ARTIFACT_TYPES));
  assert.equal(runtime.taskPresentation(completed).status, "已完成");
  assert.deepEqual(Array.from(receivedEvents), [
    runtime.VIDEO_RUNTIME_EVENT.TASK_CREATED,
    runtime.VIDEO_RUNTIME_EVENT.TASK_STARTED,
    runtime.VIDEO_RUNTIME_EVENT.TASK_UPDATED,
    runtime.VIDEO_RUNTIME_EVENT.TASK_UPDATED,
    runtime.VIDEO_RUNTIME_EVENT.TASK_UPDATED,
    runtime.VIDEO_RUNTIME_EVENT.TASK_COMPLETED
  ]);
  assert.equal(eventBus.list().length, 6);
  assert.throws(() => orchestrator.refreshTask(completed.taskId, { status:runtime.VIDEO_TASK_STATUS.GENERATING }), /invalid_video_task_transition/);
  assert.equal(runtime.canTransition(runtime.VIDEO_TASK_STATUS.CREATED, runtime.VIDEO_TASK_STATUS.PREPARING), true);
  assert.equal(runtime.canTransition(runtime.VIDEO_TASK_STATUS.CREATED, runtime.VIDEO_TASK_STATUS.QUEUED), false);
  assert.equal(runtime.canTransition(runtime.VIDEO_TASK_STATUS.FAILED, runtime.VIDEO_TASK_STATUS.QUEUED), false);
  assert.equal(runtime.canTransition(runtime.VIDEO_TASK_STATUS.CANCELLED, runtime.VIDEO_TASK_STATUS.PREPARING), false);
  assert.equal(runtime.canTransition(runtime.VIDEO_TASK_STATUS.COMPLETED, runtime.VIDEO_TASK_STATUS.FAILED), false);

  const failedTask = orchestrator.createTask({ taskId:"video-task-failed", userPrompt:"失败路径" });
  const failed = orchestrator.failTask(failedTask.taskId, { code:"NETWORK", raw:"HTTP 500 provider_error" });
  assert.deepEqual(JSON.parse(JSON.stringify(failed.error)), { code:"NETWORK", userMessage:"网络连接失败" });
  assert.equal(JSON.stringify(failed.error).includes("HTTP 500"), false);
  assert.throws(() => orchestrator.failTask(failed.taskId, { code:"UNKNOWN" }), /invalid_video_task_transition/);

  const cancellable = orchestrator.createTask({ taskId:"video-task-cancelled", userPrompt:"取消路径" });
  const cancelled = orchestrator.cancelTask(cancellable.taskId);
  assert.equal(cancelled.status, runtime.VIDEO_TASK_STATUS.CANCELLED);
  assert.equal(cancelPolicy.canCancel(cancelled), false);
  assert.throws(() => orchestrator.cancelTask(cancelled.taskId), /video_task_already_terminal/);
  unsubscribe();
  eventBus.emit(runtime.VIDEO_RUNTIME_EVENT.TASK_UPDATED, created);
  assert.equal(receivedEvents.length, 10);

  assert.equal(repository.get(completed.taskId).status, runtime.VIDEO_TASK_STATUS.COMPLETED);
  assert.equal(repository.list().length, 3);
  const detached = repository.get(completed.taskId);
  detached.title = "changed only in memory copy";
  assert.equal(repository.get(completed.taskId).title, "豪华跑车广告");
  assert.equal(repository.remove(cancellable.taskId), true);
  assert.equal(repository.get(cancellable.taskId), null);
  const standaloneRepository = runtime.createInMemoryTaskRepository();
  standaloneRepository.save(created);
  standaloneRepository.update(created.taskId, Object.assign({}, created, { title:"已更新的方案" }));
  assert.equal(standaloneRepository.get(created.taskId).title, "已更新的方案");
  assert.equal(standaloneRepository.remove(created.taskId), true);

  assert.deepEqual(JSON.parse(JSON.stringify(selector.select())), { providerId:"stub", status:"unavailable", reason:"provider_not_configured" });
  assert.equal(retryPolicy.shouldRetry(), false);
  assert.equal(retryPolicy.nextDelayMs(), null);

  assert.throws(() => runtime.createVideoArtifact({ artifactId:"bad", type:"unknown" }), /invalid_video_artifact_type/);
  assert.throws(() => orchestrator.refreshTask(created.taskId, { status:runtime.VIDEO_TASK_STATUS.PREPARING, progress:101 }), /invalid_video_task_transition/);
  assert.equal(runtime.normalizeVideoError({ code:"untrusted_provider_code" }).code, "UNKNOWN");
  assert.equal(runtime.normalizeVideoError({ code:"untrusted_provider_code" }).userMessage, "失败，请重试");
  assert.deepEqual(Object.fromEntries(Object.values(runtime.VIDEO_ERROR_CODES).map((code) => [code, runtime.normalizeVideoError({ code }).userMessage])), {
    NETWORK:"网络连接失败",
    TIMEOUT:"请求超时",
    AUTH:"权限不足",
    RATE_LIMIT:"请稍后重试",
    UNSUPPORTED:"当前不支持此功能",
    INVALID_REQUEST:"请检查你的描述后重试",
    PROVIDER:"失败，请重试",
    UNKNOWN:"失败，请重试"
  });

  assert.deepEqual(JSON.parse(JSON.stringify(runtime.validateProviderInterface(providerStub()))), {
    valid:true,
    missingMethods:[],
    providerId:"future-provider"
  });
  assert.deepEqual(Array.from(runtime.validateProviderInterface({ providerId:"incomplete" }).missingMethods), Array.from(runtime.PROVIDER_METHODS));
  assert.equal(runtime.validateProviderInterface({ providerId:"incomplete" }).valid, false);

  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  assert.equal(/\b(fetch|XMLHttpRequest|WebSocket|EventSource)\b/.test(source), false);
  assert.equal(/https?:\/\//.test(source), false);
  assert.equal(/\b(localStorage|indexedDB|sessionStorage)\b/.test(source), false);
  assert.equal(/\b(setTimeout|setInterval|eval|Function)\b/.test(source), false);
  console.log("VIDEO_RUNTIME_ARCHITECTURE PASS");
}

main();
