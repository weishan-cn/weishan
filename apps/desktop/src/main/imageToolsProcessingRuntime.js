"use strict";

const path = require("path");
const { Worker } = require("worker_threads");
const { IMAGE_TOOLS_LIMITS, validateRequest, validateExportRequest, publicPolicy } = require("../shared/imageToolsContract");

function createImageToolsProcessingRuntime(options) {
  const config = options && typeof options === "object" ? options : {};
  const workerPath = config.workerPath || path.join(__dirname, "imageToolsWorker.js");
  const WorkerClass = config.WorkerClass || Worker;
  const setTimer = typeof config.setTimeoutFn === "function" ? config.setTimeoutFn : setTimeout;
  const clearTimer = typeof config.clearTimeoutFn === "function" ? config.clearTimeoutFn : clearTimeout;
  const active = new Map();
  let terminationBarrier = Promise.resolve();
  let latestGeneration = 0;
  let pendingRequestId = "";

  function terminateWorker(worker) {
    let termination;
    try { termination = worker.terminate(); } catch (_) { termination = null; }
    terminationBarrier = Promise.allSettled([terminationBarrier, Promise.resolve(termination)]).then(() => undefined);
  }

  function stopActive(requestId) {
    const id = String(requestId || "");
    const task = active.get(id);
    if (!task) return false;
    active.delete(id);
    clearTimer(task.timer);
    terminateWorker(task.worker);
    task.resolve({ ok:false, requestId:id, error:"CANCELLED" });
    return true;
  }

  function cancel(requestId) {
    const id = String(requestId || "");
    let cancelled = false;
    if (pendingRequestId === id) {
      latestGeneration += 1;
      pendingRequestId = "";
      cancelled = true;
    }
    return { ok:true, cancelled:stopActive(id) || cancelled };
  }

  function runWorker(requestId, workerData) {
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        const task = active.get(requestId);
        if (task) clearTimer(task.timer);
        active.delete(requestId);
        resolve(result && typeof result === "object" ? result : { ok:false, requestId, error:"PROCESSING_FAILED" });
      };
      let worker;
      try {
        worker = new WorkerClass(workerPath, { workerData });
      } catch (error) {
        finish({ ok:false, requestId, error:"PROCESSING_UNAVAILABLE", stage:"WORKER_START", reason:String(error && (error.code || error.name) || "UNKNOWN").slice(0, 80) });
        return;
      }
      const timer = setTimer(() => {
        terminateWorker(worker);
        finish({ ok:false, requestId, error:"PROCESSING_TIMEOUT" });
      }, IMAGE_TOOLS_LIMITS.timeoutMs);
      active.set(requestId, { worker, timer, resolve:finish });
      worker.once("message", (result) => {
        terminateWorker(worker);
        finish(result);
      });
      worker.once("error", () => {
        terminateWorker(worker);
        finish({ ok:false, requestId, error:"PROCESSING_FAILED" });
      });
      worker.once("exit", (code) => {
        if (!settled && code !== 0) finish({ ok:false, requestId, error:"PROCESSING_FAILED" });
      });
    });
  }

  function scheduleWorker(requestId, workerData) {
    const generation = ++latestGeneration;
    pendingRequestId = requestId;
    Array.from(active.keys()).forEach(stopActive);
    return terminationBarrier.then(() => {
      if (generation !== latestGeneration || pendingRequestId !== requestId) {
        return { ok:false, requestId, error:"CANCELLED" };
      }
      pendingRequestId = "";
      return runWorker(requestId, workerData);
    });
  }

  function process(payload) {
    const parsed = validateRequest(payload);
    if (!parsed.ok) return Promise.resolve({ ok:false, requestId:typeof (payload && payload.requestId) === "string" ? payload.requestId : "", error:parsed.error });
    const request = parsed.value;
    return scheduleWorker(request.requestId, {
      mode:"process",
      payload:{ requestId:request.requestId, bytes:request.bytes, transform:request.transform }
    });
  }

  function validateExport(payload) {
    const parsed = validateExportRequest(payload);
    if (!parsed.ok) return Promise.resolve({ ok:false, requestId:typeof (payload && payload.requestId) === "string" ? payload.requestId : "", error:parsed.error });
    const request = parsed.value;
    return scheduleWorker(request.requestId, {
      mode:"validate-export",
      payload:{ requestId:request.requestId, bytes:request.bytes, mime:request.mime, suggestedName:request.suggestedName }
    });
  }

  function dispose() {
    latestGeneration += 1;
    pendingRequestId = "";
    Array.from(active.keys()).forEach(stopActive);
  }

  return { process, validateExport, cancel, dispose, policy:publicPolicy };
}

module.exports = { createImageToolsProcessingRuntime };
