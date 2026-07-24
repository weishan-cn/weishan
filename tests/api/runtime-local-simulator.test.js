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
  const simulator = runtime.createLocalRuntimeSimulator();
  const provider = simulator.provider;
  assert.equal(runtime.validateProviderInterface(provider).valid, true);
  assert.deepEqual(JSON.parse(JSON.stringify(provider.createTask())), { providerTaskId:"local-simulator-task", status:"accepted" });
  assert.deepEqual(JSON.parse(JSON.stringify(provider.queryTask())), { providerTaskId:"local-simulator-task", status:"ready" });
  assert.deepEqual(JSON.parse(JSON.stringify(provider.cancelTask())), { providerTaskId:"local-simulator-task", cancelled:true });

  simulator.submit({ taskId:"local-complete", title:"本地模拟", userPrompt:"验证完整运行链路" });
  assert.equal(simulator.engine.state(), runtime.EXECUTION_STATE.WAITING);
  assert.equal(simulator.currentTask().status, runtime.VIDEO_TASK_STATUS.PREPARING);
  assert.equal(simulator.tick().status, runtime.VIDEO_TASK_STATUS.QUEUED);
  assert.equal(simulator.tick().status, runtime.VIDEO_TASK_STATUS.GENERATING);
  assert.equal(simulator.tick().status, runtime.VIDEO_TASK_STATUS.POST_PROCESSING);
  assert.equal(simulator.engine.state(), runtime.EXECUTION_STATE.RUNNING);
  const completed = simulator.tick();
  assert.equal(completed.status, runtime.VIDEO_TASK_STATUS.COMPLETED);
  assert.equal(simulator.engine.state(), runtime.EXECUTION_STATE.COMPLETED);
  assert.deepEqual(Array.from(completed.artifacts.map((artifact) => artifact.metadata.placeholderFile)), ["video.mp4", "cover.png", "storyboard.md", "prompt.txt", "log.txt"]);
  assert.equal(completed.artifacts.every((artifact) => artifact.metadata.simulated === true), true);
  assert.deepEqual(Array.from(simulator.eventBus.list().map((event) => event.type)), [
    "TASK_CREATED",
    "TASK_STARTED",
    "TASK_UPDATED",
    "TASK_UPDATED",
    "TASK_UPDATED",
    "TASK_COMPLETED"
  ]);
  assert.equal(simulator.repository.get("local-complete").status, runtime.VIDEO_TASK_STATUS.COMPLETED);
  assert.equal(simulator.repository.list().length, 1);
  assert.throws(() => simulator.tick(), /local_runtime_simulator_terminal/);
  assert.equal(simulator.repository.remove("local-complete"), true);
  assert.equal(simulator.repository.get("local-complete"), null);
  simulator.dispose();
  assert.equal(simulator.engine.state(), runtime.EXECUTION_STATE.IDLE);

  const failedSimulator = runtime.createLocalRuntimeSimulator();
  failedSimulator.submit({ taskId:"local-failed", userPrompt:"验证失败链路" });
  const failure = failedSimulator.fail({ code:"NETWORK", raw:"HTTP 500" });
  assert.deepEqual(JSON.parse(JSON.stringify(failure)), { code:"NETWORK", userMessage:"网络连接失败" });
  assert.equal(failedSimulator.engine.state(), runtime.EXECUTION_STATE.FAILED);
  assert.equal(failedSimulator.currentTask().status, runtime.VIDEO_TASK_STATUS.FAILED);
  assert.deepEqual(Array.from(failedSimulator.eventBus.list().map((event) => event.type)), ["TASK_CREATED", "TASK_STARTED", "TASK_FAILED"]);
  failedSimulator.dispose();

  const cancelledSimulator = runtime.createLocalRuntimeSimulator();
  cancelledSimulator.submit({ taskId:"local-cancelled", userPrompt:"验证取消链路" });
  cancelledSimulator.cancel("user_requested");
  assert.equal(cancelledSimulator.engine.state(), runtime.EXECUTION_STATE.CANCELLED);
  assert.equal(cancelledSimulator.currentTask().status, runtime.VIDEO_TASK_STATUS.CANCELLED);
  assert.deepEqual(Array.from(cancelledSimulator.eventBus.list().map((event) => event.type)), ["TASK_CREATED", "TASK_STARTED", "TASK_CANCELLED"]);
  assert.throws(() => cancelledSimulator.tick(), /local_runtime_simulator_terminal/);
  cancelledSimulator.dispose();

  const source = fs.readFileSync(SOURCE_PATH, "utf8");
  assert.equal(/\b(fetch|XMLHttpRequest|WebSocket|EventSource|Worker)\b/.test(source), false);
  assert.equal(/https?:\/\//.test(source), false);
  assert.equal(/\b(setTimeout|setInterval|eval|Function)\b/.test(source), false);
  console.log("RUNTIME_LOCAL_SIMULATOR PASS");
}

main();
