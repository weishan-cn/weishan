"use strict";

const path = require("path");
const { Worker } = require("worker_threads");
const { IMAGE_TOOLS_LIMITS, validateRequest, publicPolicy } = require("../shared/imageToolsContract");

function createImageToolsProcessingRuntime(options) {
  const config = options && typeof options === "object" ? options : {};
  const workerPath = config.workerPath || path.join(__dirname, "imageToolsWorker.js");
  const WorkerClass = config.WorkerClass || Worker;
  const active = new Map();

  function cancel(requestId) {
    const id = String(requestId || "");
    const task = active.get(id);
    if (!task) return { ok:true, cancelled:false };
    active.delete(id);
    clearTimeout(task.timer);
    try { task.worker.terminate(); } catch (_) {}
    task.resolve({ ok:false, requestId:id, error:"CANCELLED" });
    return { ok:true, cancelled:true };
  }

  function process(payload) {
    const parsed = validateRequest(payload);
    if (!parsed.ok) return Promise.resolve({ ok:false, requestId:String(payload && payload.requestId || ""), error:parsed.error });
    const request = parsed.value;
    Array.from(active.keys()).forEach(cancel);
    return new Promise((resolve) => {
      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        const task = active.get(request.requestId);
        if (task) clearTimeout(task.timer);
        active.delete(request.requestId);
        resolve(result && typeof result === "object" ? result : { ok:false, requestId:request.requestId, error:"PROCESSING_FAILED" });
      };
      let worker;
      try {
        worker = new WorkerClass(workerPath, { workerData:request });
      } catch (error) {
        finish({ ok:false, requestId:request.requestId, error:"PROCESSING_UNAVAILABLE", stage:"WORKER_START", reason:String(error && (error.code || error.name) || "UNKNOWN").slice(0, 80) });
        return;
      }
      const timer = setTimeout(() => {
        try { worker.terminate(); } catch (_) {}
        finish({ ok:false, requestId:request.requestId, error:"PROCESSING_TIMEOUT" });
      }, IMAGE_TOOLS_LIMITS.timeoutMs);
      active.set(request.requestId, { worker, timer, resolve:finish });
      worker.once("message", (result) => {
        try { worker.terminate(); } catch (_) {}
        finish(result);
      });
      worker.once("error", () => {
        try { worker.terminate(); } catch (_) {}
        finish({ ok:false, requestId:request.requestId, error:"PROCESSING_FAILED" });
      });
      worker.once("exit", (code) => {
        if (!settled && code !== 0) finish({ ok:false, requestId:request.requestId, error:"PROCESSING_FAILED" });
      });
    });
  }

  function dispose() {
    Array.from(active.keys()).forEach(cancel);
  }

  return { process, cancel, dispose, policy:publicPolicy };
}

module.exports = { createImageToolsProcessingRuntime };
