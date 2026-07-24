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

function main() {
  const runtime = loadRuntime();
  let factoryCalls = 0;
  const disabledFacade = runtime.createVideoRuntimeFacade({
    simulatorFactory() {
      factoryCalls += 1;
      return runtime.createLocalRuntimeSimulator();
    }
  });
  assert.deepEqual(Object.keys(disabledFacade).sort(), ["cancelVideoTask", "createVideoTask", "listVideoTasks", "queryVideoTask"]);
  assert.equal("isEnabled" in disabledFacade, false);
  assert.equal(disabledFacade.createVideoTask({ taskId:"disabled", userPrompt:"不应创建" }), null);
  assert.equal(disabledFacade.queryVideoTask("disabled"), null);
  assert.deepEqual(Array.from(disabledFacade.listVideoTasks()), []);
  assert.equal(factoryCalls, 0);

  const simulator = runtime.createLocalRuntimeSimulator();
  const integration = runtime.createVideoRuntimeIntegration({ featureEnabled:true, simulator });
  const facade = integration.facade;
  assert.deepEqual(Object.keys(facade).sort(), ["cancelVideoTask", "createVideoTask", "listVideoTasks", "queryVideoTask"]);
  const created = facade.createVideoTask({
    taskId:"integration-task",
    title:"产品接入测试",
    userPrompt:"验证 Runtime 与产品边界",
    createdAt:"2026-07-24T00:00:00.000Z"
  });
  assert.deepEqual(Object.keys(created), ["title", "status", "progress", "resultTypes", "createdAt", "updatedAt"]);
  assert.equal(created.title, "产品接入测试");
  assert.equal(created.status, "准备中……");
  assert.equal(created.progress, null);
  assert.deepEqual(Array.from(created.resultTypes), []);
  assert.equal(created.createdAt, "2026-07-24T00:00:00.000Z");
  assert.equal(typeof created.updatedAt, "string");
  assert.equal(/provider|runtime|execution|artifact|taskId/i.test(JSON.stringify(created)), false);

  simulator.tick();
  simulator.tick();
  const generating = facade.queryVideoTask("integration-task");
  assert.equal(generating.status, "正在生成……");
  assert.equal(generating.progress, null);
  simulator.tick();
  simulator.tick();
  const completed = facade.queryVideoTask("integration-task");
  assert.equal(completed.status, "已完成");
  assert.deepEqual(Array.from(completed.resultTypes), ["video", "cover", "storyboard", "prompt", "log"]);
  assert.equal(facade.listVideoTasks().length, 1);
  assert.equal(facade.cancelVideoTask("integration-task"), null);

  const cancellationSimulator = runtime.createLocalRuntimeSimulator();
  const cancellationFacade = runtime.createVideoRuntimeFacade({ featureEnabled:true, simulator:cancellationSimulator });
  cancellationFacade.createVideoTask({ taskId:"integration-cancel", userPrompt:"验证取消" });
  const cancelled = cancellationFacade.cancelVideoTask("integration-cancel", "user_requested");
  assert.equal(cancelled.status, "已取消");
  assert.equal(cancellationSimulator.engine.state(), runtime.EXECUTION_STATE.CANCELLED);

  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  assert.equal(/\b(fetch|XMLHttpRequest|WebSocket|EventSource|Worker)\b/.test(source), false);
  assert.equal(/https?:\/\//.test(source), false);
  assert.equal(/\b(setTimeout|setInterval|eval|Function)\b/.test(source), false);
  console.log("VIDEO_RUNTIME_INTEGRATION PASS");
}

main();
