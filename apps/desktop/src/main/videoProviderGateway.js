"use strict";

const { safeError, safeMetadata } = require("../shared/videoProviderIpcContract");

function text(value, max) { return String(value == null ? "" : value).trim().slice(0, max || 160); }
function toCode(error) {
  const code = text(error && error.code || error && error.message, 48);
  if (code === "GATEWAY_DISPOSED") return "GATEWAY_DISPOSED";
  if (code === "TASK_NOT_FOUND" || code === "video_task_not_found") return "TASK_NOT_FOUND";
  if (code === "TASK_NOT_ACTIVE" || code === "video_task_already_terminal") return "TASK_NOT_ACTIVE";
  if (/LIMIT/.test(code)) return "LIMIT_EXCEEDED";
  if (/CAPABILITY/.test(code)) return "CAPABILITY_UNSUPPORTED";
  if (/DISABLED/.test(code)) return "RUNTIME_DISABLED";
  return "INTERNAL_ERROR";
}
function publicArtifact(artifact) { return { type:text(artifact && artifact.type, 32), name:text(artifact && (artifact.title || artifact.name), 160), mimeType:null, sizeBytes:null, availability:false, downloadMode:"unavailable", placeholderRef:null }; }
function publicTask(task) { return { taskId:text(task && task.taskId, 80), title:text(task && task.title, 160), status:text(task && task.status, 32), progress:task && Number.isFinite(task.progress) ? task.progress : null, resultTypes:Array.isArray(task && task.artifacts) ? task.artifacts.map((item) => text(item.type, 32)).filter(Boolean) : [], createdAt:text(task && task.createdAt, 80), updatedAt:text(task && task.updatedAt, 80) }; }
function createVideoProviderGateway(options) {
  const config = options && typeof options === "object" ? options : {};
  const enabled = config.enabled === true;
  let disposed = false;
  let bridge = null;
  let host = null;
  let platform = null;
  function active() { if (disposed) throw Object.assign(new Error("GATEWAY_DISPOSED"), { code:"GATEWAY_DISPOSED" }); }
  function initialize() {
    if (!enabled) throw Object.assign(new Error("RUNTIME_DISABLED"), { code:"RUNTIME_DISABLED" });
    if (bridge) return bridge;
    const runtime = config.runtime;
    const platformApi = config.platformApi;
    const hostApi = config.hostApi;
    const bridgeApi = config.bridgeApi;
    if (!runtime || !platformApi || !hostApi || !bridgeApi || config.localDevelopment !== true) throw Object.assign(new Error("PROVIDER_UNAVAILABLE"), { code:"PROVIDER_UNAVAILABLE" });
    platform = config.platform || platformApi.createProviderPlatform();
    const providerId = "local-development";
    if (!platform.exists(providerId)) platform.register({ providerId, displayName:"Local Development", vendor:"local", version:"1.0.0", status:"PREVIEW", enabled:true, priority:1, capabilities:{ textToVideo:true, imageToVideo:true, negativePrompt:true, seed:true, cameraControl:true, motionControl:true, styleControl:true, durationControl:true, resolutionControl:true, fpsControl:true }, limits:{ maxPromptLength:4000, maxImages:8, minDurationSeconds:1, maxDurationSeconds:120, maxBatchSize:1, maxConcurrentTasks:1 }, metadata:{} });
    host = config.host || hostApi.createVideoProviderHost({ platform });
    if (!host.hasAdapter(providerId)) host.registerAdapter(providerId, config.adapter || hostApi.createFakeVideoProviderAdapter({ providerId }));
    bridge = bridgeApi.createVideoRuntimeProviderBridge({ runtime, host, providerId });
    return bridge;
  }
  function validateRequest(input) { if (!enabled) return { valid:false, error:safeError({ code:"RUNTIME_DISABLED" }) }; return { valid:true, value:input }; }
  function createTask(input) { active(); const checked = validateRequest(input); if (!checked.valid) throw Object.assign(new Error(checked.error.code), { code:checked.error.code }); return publicTask(initialize().submitRuntimeTask(input)); }
  function queryTask(taskId) { active(); const target = initialize(); const existing = target.getRuntimeTask(taskId); if (!existing) throw Object.assign(new Error("TASK_NOT_FOUND"), { code:"TASK_NOT_FOUND" }); return publicTask(target.refreshRuntimeTask(taskId)); }
  function cancelTask(taskId) { active(); return publicTask(initialize().cancelRuntimeTask(taskId)); }
  function listTasks(input) { active(); const filter = input && input.status ? text(input.status, 32) : null; const limit = input && input.limit || 20; if (!enabled) return []; const rows = initialize().listRuntimeTasks().filter((task) => !filter || task.status === filter).reverse().slice(0, limit); return rows.map(publicTask); }
  function downloadArtifacts(taskId) { active(); if (!enabled) throw Object.assign(new Error("RUNTIME_DISABLED"), { code:"RUNTIME_DISABLED" }); const target = initialize(); if (!target.getRuntimeTask(taskId)) throw Object.assign(new Error("TASK_NOT_FOUND"), { code:"TASK_NOT_FOUND" }); return target.downloadRuntimeArtifacts(taskId).map(publicArtifact); }
  function getCapabilities() { active(); if (!enabled) return { available:false, providerCount:0, capabilities:{}, limits:{} }; initialize(); return { available:true, providerCount:1, capabilities:{ textToVideo:true, imageToVideo:true }, limits:{ maxPromptLength:4000, maxImages:8, maxDurationSeconds:120 } }; }
  function getStatus() { active(); return { available:enabled && !!bridge, mode:!enabled ? "disabled" : bridge ? "local-development" : "unavailable", runtimeReady:enabled && !!bridge, providerHostReady:enabled && !!host, activeTaskCount:enabled && bridge ? bridge.listRuntimeTasks().filter((task) => !["COMPLETED", "FAILED", "CANCELLED"].includes(task.status)).length : 0 }; }
  function dispose() { if (disposed) return; if (bridge) bridge.dispose(); if (host) host.dispose(); bridge = null; host = null; platform = null; disposed = true; }
  return { createTask, queryTask, cancelTask, listTasks, downloadArtifacts, getCapabilities, getStatus, dispose };
}

module.exports = { createVideoProviderGateway, publicTask, publicArtifact, toCode };
