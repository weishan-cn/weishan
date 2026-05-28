(function(){
  const PERF_STORAGE_KEY = "weishan:perf";
  const ALLOWED_EXTRA = {
    durationMs:true,
    status:true,
    inputChars:true,
    outputChars:true,
    messageCount:true,
    hasImages:true,
    chunkCount:true,
    hasKey:true,
    errorName:true,
    errorMessage:true
  };

  function now(){
    return window.performance && typeof window.performance.now === "function" ? window.performance.now() : Date.now();
  }

  function isPerfEnabled(){
    try {
      return window.localStorage && window.localStorage.getItem(PERF_STORAGE_KEY) === "1";
    } catch (_) {
      return false;
    }
  }

  function createTraceId(prefix){
    const p = String(prefix || "trace").replace(/[^a-z0-9._-]+/gi, "").slice(0, 24) || "trace";
    return p + "-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);
  }

  function createPerfMeta(featureAction, traceId){
    return {
      traceId: traceId || createTraceId(String(featureAction || "trace").split(".")[0] || "trace"),
      featureAction: String(featureAction || "unknown").slice(0, 80),
      enabled: isPerfEnabled()
    };
  }

  function redact(value){
    return String(value || "")
      .replace(/(bearer|authorization|api[-_ ]?key|token|password|secret|authorizationCode|appPassword)\s*[:=]\s*[^,\s;]+/gi, "$1=[redacted]")
      .replace(/sk-[A-Za-z0-9._-]+/g, "sk-[redacted]")
      .slice(0, 160);
  }

  function safeError(error){
    const name = String(error && error.name || "Error").slice(0, 80);
    const message = redact(error && error.message ? error.message : String(error || ""));
    return { errorName:name, errorMessage:message };
  }

  function safeExtra(extra){
    const out = {};
    Object.keys(extra || {}).forEach((key) => {
      if (!ALLOWED_EXTRA[key]) return;
      const value = extra[key];
      if (value == null) return;
      if (key === "errorMessage") out[key] = redact(value);
      else if (typeof value === "string") out[key] = value.slice(0, 160);
      else if (typeof value === "number" || typeof value === "boolean") out[key] = value;
    });
    return out;
  }

  function formatExtra(extra){
    return Object.keys(extra || {}).map((key) => key + "=" + String(extra[key]).replace(/\s+/g, " ")).join(" ");
  }

  function log(traceId, featureAction, stage, extra){
    if (!isPerfEnabled()) return;
    const trace = String(traceId || "none").slice(0, 80);
    const feature = String(featureAction || "unknown").slice(0, 80);
    const body = formatExtra(safeExtra(extra || {}));
    try {
      console.debug("[perf][trace=" + trace + "][" + feature + "] " + String(stage || "mark") + (body ? " " + body : ""));
    } catch (_) {}
  }

  function perfStart(traceId, featureAction, stage, extra){
    log(traceId, featureAction, stage, extra);
    return now();
  }

  function perfEnd(traceId, featureAction, stage, startedAt, extra){
    const durationMs = Math.round((now() - Number(startedAt || now())) * 10) / 10;
    log(traceId, featureAction, stage, Object.assign({ durationMs }, extra || {}));
    return durationMs;
  }

  function perfMark(traceId, featureAction, stage, extra){
    log(traceId, featureAction, stage, extra || {});
  }

  function countMessageChars(messages){
    if (!Array.isArray(messages)) return 0;
    return messages.reduce((sum, message) => sum + String(message && message.content || "").length, 0);
  }

  window.WeishanPerf = {
    PERF_STORAGE_KEY,
    isPerfEnabled,
    createTraceId,
    createPerfMeta,
    perfStart,
    perfEnd,
    perfMark,
    safeError,
    countMessageChars
  };
})();
