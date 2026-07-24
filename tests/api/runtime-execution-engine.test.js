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

function createOrchestratorStub(task) {
  const calls = [];
  return {
    calls,
    startTask(taskId) {
      calls.push(["startTask", taskId]);
      return Object.assign({}, task, { status:"PREPARING" });
    },
    completeTask(taskId, artifacts) {
      calls.push(["completeTask", taskId, artifacts.length]);
      return Object.assign({}, task, { status:"COMPLETED", artifacts });
    },
    failTask(taskId, error) {
      calls.push(["failTask", taskId, error.code]);
      return Object.assign({}, task, { status:"FAILED", error });
    },
    cancelTask(taskId) {
      calls.push(["cancelTask", taskId]);
      return Object.assign({}, task, { status:"CANCELLED" });
    }
  };
}

function main() {
  const runtime = loadRuntime();
  const task = { taskId:"runtime-task-1", status:"GENERATING" };
  const calls = [];
  const orchestrator = createOrchestratorStub(task);
  const engine = runtime.createRuntimeExecutionEngine({
    pipeline:{
      prepare(context) { calls.push("prepare"); return context; },
      execute(context) { calls.push("execute"); assert.equal(context.task.taskId, task.taskId); return { artifacts:[{ artifactId:"result-1" }] }; },
      finalize(context, result) { calls.push("finalize"); return result; }
    },
    hooks:{
      beforeExecute() { calls.push("beforeExecute"); },
      afterExecute() { calls.push("afterExecute"); },
      beforeComplete() { calls.push("beforeComplete"); },
      afterComplete() { calls.push("afterComplete"); },
      beforeFail() { calls.push("beforeFail"); },
      afterFail() { calls.push("afterFail"); }
    }
  });

  assert.equal(engine.state(), runtime.EXECUTION_STATE.IDLE);
  const context = engine.submit({ task, orchestrator, repository:{ kind:"memory" }, provider:{ kind:"interface" }, eventBus:{ kind:"local" }, runtimeMetadata:{ feature:"future-runtime" } });
  assert.equal(engine.state(), runtime.EXECUTION_STATE.WAITING);
  assert.equal(engine.scheduler.pendingCount(), 1);
  assert.equal(context.task.status, "PREPARING");
  assert.equal(context.runtimeMetadata.feature, "future-runtime");
  assert.equal(orchestrator.calls[0][0], "startTask");
  assert.deepEqual(calls, ["prepare"]);

  engine.tick();
  assert.equal(engine.state(), runtime.EXECUTION_STATE.RUNNING);
  assert.deepEqual(calls, ["prepare", "beforeExecute", "execute", "afterExecute"]);
  assert.notEqual(engine.state(), context.task.status);
  const result = engine.complete();
  assert.equal(engine.state(), runtime.EXECUTION_STATE.COMPLETED);
  assert.equal(result.artifacts.length, 1);
  assert.deepEqual(calls, ["prepare", "beforeExecute", "execute", "afterExecute", "beforeComplete", "finalize", "afterComplete"]);
  assert.deepEqual(orchestrator.calls.map((call) => call[0]), ["startTask", "completeTask"]);
  assert.throws(() => engine.tick(), /runtime_execution_not_waiting/);
  engine.dispose();
  assert.equal(engine.state(), runtime.EXECUTION_STATE.IDLE);

  const cancellationToken = runtime.createCancellationToken();
  assert.equal(cancellationToken.cancel("user_requested"), true);
  assert.equal(cancellationToken.cancel("again"), false);
  assert.equal(cancellationToken.reason, "user_requested");
  assert.throws(() => cancellationToken.throwIfCancelled(), /runtime_execution_cancelled/);

  const failedOrchestrator = createOrchestratorStub({ taskId:"runtime-task-failed" });
  const failedEngine = runtime.createRuntimeExecutionEngine();
  failedEngine.submit({ task:{ taskId:"runtime-task-failed", status:"CREATED" }, orchestrator:failedOrchestrator });
  const error = failedEngine.fail({ code:"TIMEOUT", raw:"HTTP 500" });
  assert.equal(failedEngine.state(), runtime.EXECUTION_STATE.FAILED);
  assert.deepEqual(JSON.parse(JSON.stringify(error)), { code:"TIMEOUT", userMessage:"请求超时" });
  assert.deepEqual(failedOrchestrator.calls.map((call) => call[0]), ["startTask", "failTask"]);

  const cancelledOrchestrator = createOrchestratorStub({ taskId:"runtime-task-cancelled" });
  const cancelledEngine = runtime.createRuntimeExecutionEngine();
  const cancelledContext = cancelledEngine.submit({ task:{ taskId:"runtime-task-cancelled", status:"CREATED" }, orchestrator:cancelledOrchestrator });
  cancelledEngine.cancel("user_requested");
  assert.equal(cancelledEngine.state(), runtime.EXECUTION_STATE.CANCELLED);
  assert.equal(cancelledContext.cancellationToken.cancelled, true);
  assert.deepEqual(cancelledOrchestrator.calls.map((call) => call[0]), ["startTask", "cancelTask"]);

  const scheduler = runtime.createSynchronousScheduler();
  const schedulerEvents = [];
  scheduler.schedule(() => schedulerEvents.push("first"));
  scheduler.schedule(() => schedulerEvents.push("second"));
  assert.deepEqual(schedulerEvents, []);
  scheduler.tick();
  assert.deepEqual(schedulerEvents, ["first"]);
  scheduler.clear();
  assert.equal(scheduler.pendingCount(), 0);

  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  assert.equal(/\b(fetch|XMLHttpRequest|WebSocket|EventSource|Worker)\b/.test(source), false);
  assert.equal(/https?:\/\//.test(source), false);
  assert.equal(/\b(setTimeout|setInterval|eval|Function)\b/.test(source), false);
  console.log("RUNTIME_EXECUTION_ENGINE PASS");
}

main();
