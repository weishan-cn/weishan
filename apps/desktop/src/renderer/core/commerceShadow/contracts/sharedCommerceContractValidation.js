(function () {
  "use strict";

  const BLOCKED_KEYS = Object.freeze(["__proto__", "prototype", "constructor", "apiKey", "api_key", "token", "secret", "password", "credential"]);
  function fail(code) { const error = new Error(code); error.code = code; throw error; }
  function safeClone(value, seen) {
    if (value === null || typeof value === "string" || typeof value === "boolean" || typeof value === "number") { if (typeof value === "number" && !Number.isFinite(value)) fail("invalid_number"); return value; }
    if (typeof value === "undefined" || typeof value === "function" || typeof value === "symbol" || typeof value === "bigint") fail("unsupported_value");
    const visited = seen || new Set(); if (visited.has(value)) fail("circular_reference"); visited.add(value);
    if (Array.isArray(value)) { const array = value.map(function (item) { return safeClone(item, visited); }); visited.delete(value); return array; }
    const prototype = Object.getPrototypeOf(value); if (prototype !== null && Object.getPrototypeOf(prototype) !== null) fail("unsafe_prototype");
    const descriptors = Object.getOwnPropertyDescriptors(value), output = {};
    Object.keys(descriptors).forEach(function (key) { const descriptor = descriptors[key]; if (BLOCKED_KEYS.indexOf(key) >= 0 || /key|token|secret|password|credential/i.test(key)) fail("sensitive_or_blocked_field"); if (!Object.prototype.hasOwnProperty.call(descriptor, "value")) fail("accessor_not_allowed"); output[key] = safeClone(descriptor.value, visited); });
    visited.delete(value); return output;
  }
  function freeze(value) { if (value && typeof value === "object" && !Object.isFrozen(value)) { Object.keys(value).forEach(function (key) { freeze(value[key]); }); Object.freeze(value); } return value; }
  function exact(value, keys) { return value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length === keys.length && keys.every(function (key) { return Object.prototype.hasOwnProperty.call(value, key); }); }
  function text(value) { return typeof value === "string" && value.trim().length > 0; }
  function compatibility(version, currentVersion) { return Object.freeze({contractVersion:String(version == null ? "" : version),currentVersion:currentVersion,backwardCompatible:version === currentVersion,forwardCompatible:false,status:version === currentVersion ? "BACKWARD_COMPATIBLE" : "FORWARD_REVIEW_REQUIRED"}); }

  window.WeishanCommerceShadowContractValidation = Object.freeze({safeClone, freeze, fail, exact, text, compatibility, BLOCKED_KEYS});
})();
