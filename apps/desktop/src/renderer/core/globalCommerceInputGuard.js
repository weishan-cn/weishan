;(function () {
  "use strict";

  const BLOCKED_KEYS = Object.freeze(["__proto__", "prototype", "constructor"]);
  const SENSITIVE_KEYS = Object.freeze([
    "token", "accesstoken", "refreshtoken", "apikey", "secret", "password",
    "authorization", "cookie", "endpoint", "providerresponse", "stack",
    "internalerror", "rawerror", "credentials"
  ]);
  const LIMITS = Object.freeze({ maxDepth:8, maxNodes:400, maxArrayLength:100, maxStringLength:10000 });

  function rejected() {
    return Object.freeze({
      success:false,
      error:Object.freeze({
        code:"COMMERCE_INPUT_REJECTED",
        stage:"INPUT_GUARD",
        recoverable:true,
        userMessage:"Commerce input could not be processed safely.",
        detailsSummary:"The commerce input did not satisfy the public boundary contract."
      })
    });
  }

  function isSensitiveKey(key) {
    return SENSITIVE_KEYS.indexOf(String(key).replace(/[^a-z0-9]/gi, "").toLowerCase()) >= 0;
  }

  function validateGlobalCommerceInput(input) {
    const seen = new Set();
    let nodes = 0;

    function walk(value, depth) {
      if (depth > LIMITS.maxDepth) return false;
      if (value === null || typeof value === "string" || typeof value === "boolean") return typeof value !== "string" || value.length <= LIMITS.maxStringLength;
      if (typeof value === "number") return Number.isFinite(value);
      if (typeof value !== "object" || seen.has(value)) return false;

      const isArray = Array.isArray(value);
      const prototype = Object.getPrototypeOf(value);
      const constructor = prototype && Object.getOwnPropertyDescriptor(prototype, "constructor");
      if (prototype !== null && !isArray && (!constructor || typeof constructor.value !== "function" || constructor.value.name !== "Object")) return false;

      seen.add(value);
      nodes += 1;
      if (nodes > LIMITS.maxNodes || (isArray && value.length > LIMITS.maxArrayLength) || Object.getOwnPropertySymbols(value).length) return false;

      const keys = Object.getOwnPropertyNames(value);
      for (const key of keys) {
        if ((!isArray || !/^\d+$/.test(key)) && key !== "length") {
          if (BLOCKED_KEYS.indexOf(key) >= 0 || isSensitiveKey(key)) return false;
        }
        const descriptor = Object.getOwnPropertyDescriptor(value, key);
        if (!descriptor || descriptor.get || descriptor.set || !walk(descriptor.value, depth + 1)) return false;
      }
      seen.delete(value);
      return true;
    }

    return walk(input, 0);
  }

  function cloneValidatedCommerceInput(input) {
    function copy(value) {
      if (value === null || typeof value !== "object") return value;
      if (Array.isArray(value)) return Object.freeze(value.map(copy));
      const output = {};
      Object.getOwnPropertyNames(value).forEach(function (key) {
        output[key] = copy(Object.getOwnPropertyDescriptor(value, key).value);
      });
      return Object.freeze(output);
    }
    return copy(input);
  }

  function guardAndCloneCommerceInput(input) {
    return validateGlobalCommerceInput(input)
      ? Object.freeze({ success:true, value:cloneValidatedCommerceInput(input) })
      : rejected();
  }

  window.WeishanGlobalCommerceInputGuard = Object.freeze({
    BLOCKED_KEYS,
    SENSITIVE_KEYS,
    LIMITS,
    validateGlobalCommerceInput,
    guardAndCloneCommerceInput
  });
})();
