"use strict";

const IPC_TRUST_BOUNDARY_VERSION = "4.2.8";

const MAX_EXTERNAL_URL_LENGTH = 2048;
const MAX_ERROR_MESSAGE_LENGTH = 180;

const SECRET_QUERY_RE = /(api[_-]?key|apikey|token|access[_-]?token|refresh[_-]?token|secret|client[_-]?secret|authorization|password|session|signature)/i;
const TRANSACTION_PATH_RE = /\/(?:checkout|payment|pay|order|purchase|book|booking|reserve|reservation|ticket)(?:\/|$)/i;
const PRIVATE_HOST_RE = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/i;
const IPV6_LOCAL_RE = /^(\[?::1\]?|\[?fc[0-9a-f]{2}:|\[?fd[0-9a-f]{2}:|\[?fe80:)/i;

function text(value, max) {
  return String(value === undefined || value === null ? "" : value).trim().slice(0, max || 240);
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && Object.getPrototypeOf(value) === Object.prototype;
}

function validateExternalOpenUrl(value) {
  const raw = text(value, MAX_EXTERNAL_URL_LENGTH + 1);
  if (!raw || raw.length > MAX_EXTERNAL_URL_LENGTH) return { ok:false, code:"EXTERNAL_URL_INVALID" };
  let parsed;
  try {
    parsed = new URL(raw);
  } catch (_) {
    return { ok:false, code:"EXTERNAL_URL_INVALID" };
  }
  const protocol = String(parsed.protocol || "").toLowerCase();
  const host = String(parsed.hostname || "").toLowerCase();
  if (protocol !== "https:") return { ok:false, code:"EXTERNAL_URL_PROTOCOL_BLOCKED" };
  if (parsed.username || parsed.password) return { ok:false, code:"EXTERNAL_URL_USERINFO_BLOCKED" };
  if (!host || PRIVATE_HOST_RE.test(host) || IPV6_LOCAL_RE.test(host)) return { ok:false, code:"EXTERNAL_URL_PRIVATE_HOST_BLOCKED" };
  if (TRANSACTION_PATH_RE.test(parsed.pathname)) return { ok:false, code:"EXTERNAL_URL_TRANSACTION_PATH_BLOCKED" };
  for (const key of parsed.searchParams.keys()) {
    if (SECRET_QUERY_RE.test(key)) return { ok:false, code:"EXTERNAL_URL_SECRET_QUERY_BLOCKED" };
  }
  return { ok:true, url:parsed.toString() };
}

function safeIpcError(code, message) {
  return {
    ok:false,
    error:text(code, 80) || "IPC_BLOCKED",
    message:text(message, MAX_ERROR_MESSAGE_LENGTH) || "Request blocked by IPC trust boundary.",
    redacted:true
  };
}

function externalOpenBlocked(code) {
  return safeIpcError(code || "UNSAFE_EXTERNAL_URL_BLOCKED", "External navigation was blocked.");
}

function safeErrorFromThrown(error) {
  const code = error && error.code ? text(error.code, 80) : "IPC_HANDLER_FAILED";
  return safeIpcError(code, "The request could not be completed safely.");
}

async function openValidatedExternal(shellRef, value) {
  const validated = validateExternalOpenUrl(value);
  if (!validated.ok) return externalOpenBlocked(validated.code);
  if (!shellRef || typeof shellRef.openExternal !== "function") return safeIpcError("EXTERNAL_OPEN_UNAVAILABLE", "External navigation is unavailable.");
  try {
    await shellRef.openExternal(validated.url);
    return { ok:true, redacted:true };
  } catch (error) {
    return safeErrorFromThrown(error);
  }
}

function validateNoGenericPreloadSurface(api) {
  if (!api || typeof api !== "object" || Array.isArray(api)) return { ok:false, code:"INVALID_PRELOAD_SURFACE" };
  const forbidden = ["ipcRenderer", "invoke", "send", "sendSync", "callMain", "openChannel"];
  const exposed = Object.keys(api);
  const blocked = exposed.filter((key) => forbidden.includes(key));
  return blocked.length ? { ok:false, code:"GENERIC_IPC_SURFACE_EXPOSED", blocked } : { ok:true, exposed };
}

module.exports = {
  IPC_TRUST_BOUNDARY_VERSION,
  MAX_EXTERNAL_URL_LENGTH,
  validateExternalOpenUrl,
  safeIpcError,
  safeErrorFromThrown,
  externalOpenBlocked,
  openValidatedExternal,
  validateNoGenericPreloadSurface,
  _testOnly:{
    SECRET_QUERY_RE,
    TRANSACTION_PATH_RE,
    PRIVATE_HOST_RE,
    IPV6_LOCAL_RE
  }
};
