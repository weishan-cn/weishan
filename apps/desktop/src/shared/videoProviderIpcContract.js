"use strict";

const IPC_CHANNELS = Object.freeze({
  createTask:"video-provider:create-task", queryTask:"video-provider:query-task", cancelTask:"video-provider:cancel-task",
  listTasks:"video-provider:list-tasks", downloadArtifacts:"video-provider:download-artifacts",
  getCapabilities:"video-provider:get-capabilities", getStatus:"video-provider:get-status"
});
const MAX = Object.freeze({ requestId:80, taskId:80, title:160, prompt:4000, negativePrompt:2000, images:8, imageFields:8, metadataDepth:4, metadataKeys:32, string:512, artifactTypes:8, listLimit:50 });
const SENSITIVE = /token|accessToken|refreshToken|apiKey|secret|password|authorization|cookie|endpoint|baseUrl|oauth|credential|privateKey|clientSecret|session|bearer|header|headers/i;
const AUTHORITY = /^(authorizesExecution|executionGate|productionTraffic|productionAffected|trusted|validated|safe|exact|current|recommended|canOpenExternalNow|providerAccess|networkAccess|payment|order|booking|ticketing)$/i;
const BLOCKED_KEYS = new Set(["__proto__", "prototype", "constructor"]);
const ARTIFACT_TYPES = new Set(["video", "cover", "subtitle", "project", "storyboard", "prompt", "log"]);
const IMAGE_SOURCE_TYPES = new Set(["local-placeholder", "uploaded-reference", "project-asset"]);
const STATUS_FILTERS = new Set(["CREATED", "PREPARING", "QUEUED", "GENERATING", "POST_PROCESSING", "COMPLETED", "FAILED", "CANCELLED"]);
const CREATE_TASK_KEYS = new Set(["requestId", "title", "prompt", "negativePrompt", "images", "duration", "resolution", "fps", "seed", "style", "camera", "motion", "metadata"]);

function text(value, max){ return typeof value === "string" ? value.trim().slice(0, max || MAX.string) : ""; }
function plain(value){ return !!value && Object.getPrototypeOf(value) === Object.prototype; }
function safeClone(value, depth, seen){
  if (value == null || typeof value === "boolean" || typeof value === "number" || typeof value === "string") return value;
  if (!plain(value) && !Array.isArray(value)) return undefined;
  if (depth > MAX.metadataDepth || seen.has(value)) return undefined;
  seen.add(value);
  if (Array.isArray(value)) return value.slice(0, MAX.images).map((item) => safeClone(item, depth + 1, seen)).filter((item) => item !== undefined);
  const output = {};
  Object.keys(value).slice(0, MAX.metadataKeys).forEach((key) => {
    if (BLOCKED_KEYS.has(key) || SENSITIVE.test(key) || AUTHORITY.test(key)) return;
    const item = safeClone(value[key], depth + 1, seen);
    if (item !== undefined) output[key] = item;
  });
  return output;
}
function safeMetadata(value){ return plain(value) ? safeClone(value, 0, new Set()) || {} : {}; }
function invalid(code, field){ return { valid:false, error:safeError({ code:code || "INVALID_REQUEST", field:field || null }) }; }
function safeError(input){
  const data = plain(input) ? input : {};
  const allowed = new Set(["INVALID_REQUEST", "INVALID_CHANNEL", "RUNTIME_DISABLED", "PROVIDER_UNAVAILABLE", "TASK_NOT_FOUND", "TASK_NOT_ACTIVE", "CAPABILITY_UNSUPPORTED", "LIMIT_EXCEEDED", "ARTIFACT_UNAVAILABLE", "GATEWAY_DISPOSED", "INTERNAL_ERROR"]);
  const code = allowed.has(text(data.code, 48)) ? text(data.code, 48) : "INTERNAL_ERROR";
  return { code, message:text(data.message, 160) || "处理失败，请重试", retryable:data.retryable === true, field:text(data.field, 64) || null, details:safeMetadata(data.details) };
}
function envelope(requestId, data, error){ return error ? { ok:false, requestId:text(requestId, MAX.requestId), data:null, error:safeError(error) } : { ok:true, requestId:text(requestId, MAX.requestId), data:safeClone(data, 0, new Set()), error:null }; }
function requestId(value){ return typeof value === "string" && value.trim().length > 0 && value.trim().length <= MAX.requestId ? value.trim() : ""; }
function imageDescriptor(value){
  if (!plain(value) || Object.keys(value).length > MAX.imageFields) return null;
  const sourceRef = text(value.sourceRef, MAX.string);
  if (/^(data:|blob:|file:|https?:|\/)/i.test(sourceRef)) return null;
  const sourceType = text(value.sourceType, 32);
  if (!IMAGE_SOURCE_TYPES.has(sourceType)) return null;
  return { imageId:text(value.imageId, 80), name:text(value.name, 160), mimeType:text(value.mimeType, 80), sizeBytes:Number.isFinite(value.sizeBytes) && value.sizeBytes >= 0 ? value.sizeBytes : 0, width:Number.isFinite(value.width) && value.width >= 0 ? value.width : null, height:Number.isFinite(value.height) && value.height >= 0 ? value.height : null, sourceType, sourceRef, metadata:safeMetadata(value.metadata) };
}
function base(input){ if (!plain(input) || !requestId(input.requestId)) return null; return { requestId:requestId(input.requestId) }; }
function createTaskRequest(input){
  const result = base(input); if (!result) return invalid("INVALID_REQUEST", "requestId");
  if (Object.keys(input).some((key) => BLOCKED_KEYS.has(key) || SENSITIVE.test(key) || AUTHORITY.test(key) || !CREATE_TASK_KEYS.has(key))) return invalid("INVALID_REQUEST", "payload");
  const images = Array.isArray(input.images) ? input.images : [];
  if (images.length > MAX.images) return invalid("LIMIT_EXCEEDED", "images");
  const safeImages = images.map(imageDescriptor); if (safeImages.some((image) => !image)) return invalid("INVALID_REQUEST", "images");
  if (typeof input.prompt !== "string" || input.prompt.trim().length === 0 || input.prompt.trim().length > MAX.prompt) return invalid("LIMIT_EXCEEDED", "prompt");
  const prompt = input.prompt.trim();
  return { valid:true, value:Object.assign(result, { title:text(input.title, MAX.title), prompt, negativePrompt:text(input.negativePrompt, MAX.negativePrompt) || null, images:safeImages, duration:Number.isFinite(input.duration) ? input.duration : null, resolution:text(input.resolution, 32) || null, fps:Number.isFinite(input.fps) ? input.fps : null, seed:Number.isFinite(input.seed) ? input.seed : null, style:text(input.style, 160) || null, camera:text(input.camera, 160) || null, motion:text(input.motion, 160) || null, metadata:safeMetadata(input.metadata) }) };
}
function taskRequest(input, allowTypes){ const result = base(input); const rawTaskId = input && input.taskId; const taskId = typeof rawTaskId === "string" && rawTaskId.trim().length <= MAX.taskId ? rawTaskId.trim() : ""; if (!result || !taskId) return invalid("INVALID_REQUEST", !result ? "requestId" : "taskId"); const value = Object.assign(result, { taskId }); if (allowTypes) { const types = Array.isArray(input.artifactTypes) ? input.artifactTypes : []; if (types.length > MAX.artifactTypes || types.some((type) => !ARTIFACT_TYPES.has(text(type, 32)))) return invalid("INVALID_REQUEST", "artifactTypes"); value.artifactTypes = types.map((type) => text(type, 32)); } return { valid:true, value }; }
function listTasksRequest(input){ const result = base(input); if (!result) return invalid("INVALID_REQUEST", "requestId"); const status = text(input.status, 32); if (status && !STATUS_FILTERS.has(status)) return invalid("INVALID_REQUEST", "status"); const limit = input.limit == null ? 20 : Number(input.limit); if (!Number.isInteger(limit) || limit < 1 || limit > MAX.listLimit) return invalid("LIMIT_EXCEEDED", "limit"); return { valid:true, value:Object.assign(result, { status:status || null, limit }) }; }
function idOnlyRequest(input){ const result = base(input); return result ? { valid:true, value:result } : invalid("INVALID_REQUEST", "requestId"); }
function validateRequest(operation, input){ const fn = ({ createTask:createTaskRequest, queryTask:taskRequest, cancelTask:taskRequest, listTasks:listTasksRequest, downloadArtifacts:(value) => taskRequest(value, true), getCapabilities:idOnlyRequest, getStatus:idOnlyRequest })[operation]; return fn ? fn(input || {}) : invalid("INVALID_CHANNEL", "operation"); }

module.exports = { IPC_CHANNELS, MAX, safeError, safeMetadata, envelope, validateRequest, createTrustedSenderGuard:(validator) => (event) => typeof validator === "function" && validator(event) === true };
