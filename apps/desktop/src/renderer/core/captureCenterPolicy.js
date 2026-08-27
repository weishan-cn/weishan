(function(root, factory){
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.WeishanCaptureCenterPolicy = api;
})(typeof window !== "undefined" ? window : null, function(){
  "use strict";

  const MAX_VISIBLE_RESULTS = 20;
  const MAX_TARGET_LENGTH = 2048;
  const MAX_CONCURRENT_TASKS = 1;
  const INTERNAL_COPY = /\b(?:realExecution|executionGate|authorizesExecution|productionTraffic|providerState)\b(?:\s*[=:]\s*[^\s·,;]+)?/gi;

  function text(value, maxLength){
    const normalized = String(value == null ? "" : value).replace(/\s+/g, " ").trim();
    const limit = Math.max(0, Number(maxLength) || 0);
    return limit && normalized.length > limit ? normalized.slice(0, limit).trim() : normalized;
  }

  function normalizeTarget(value){
    const raw = text(value, MAX_TARGET_LENGTH);
    if (!raw) return "";
    try {
      const url = new URL(raw);
      if (url.protocol !== "http:" && url.protocol !== "https:") return raw.toLowerCase();
      url.protocol = url.protocol.toLowerCase();
      url.hostname = url.hostname.toLowerCase();
      url.hash = "";
      if ((url.protocol === "https:" && url.port === "443") || (url.protocol === "http:" && url.port === "80")) url.port = "";
      return url.href;
    } catch (_) {
      return raw.toLowerCase();
    }
  }

  function resultTarget(job){
    const item = job && typeof job === "object" ? job : {};
    const meta = item.meta && typeof item.meta === "object" ? item.meta : {};
    return normalizeTarget(meta.sourceUrl || item.sourceUrl || item.url || item.inputSummary || "");
  }

  function isActive(job){
    const status = String(job && job.status || "").toLowerCase();
    return status === "queued" || status === "running" || status === "pending";
  }

  function mergeResult(items, job){
    const incoming = job && typeof job === "object" ? job : {};
    const target = resultTarget(incoming);
    const current = Array.isArray(items) ? items.filter((item) => item && typeof item === "object") : [];
    const withoutSame = current.filter((item) => {
      if (item.taskId && incoming.taskId && item.taskId === incoming.taskId) return false;
      return !target || resultTarget(item) !== target;
    });
    const merged = [incoming].concat(withoutSame);
    const active = merged.filter(isActive);
    const settled = merged.filter((item) => !isActive(item));
    return active.concat(settled.slice(0, Math.max(0, MAX_VISIBLE_RESULTS - active.length)));
  }

  function compactResults(items){
    const source = Array.isArray(items) ? items : [];
    let compacted = [];
    for (let index = source.length - 1; index >= 0; index -= 1) compacted = mergeResult(compacted, source[index]);
    return compacted;
  }

  function sanitizeUserCopy(value){
    return text(value, 480)
      .replace(INTERNAL_COPY, "")
      .replace(/\s*([·,;])\s*([·,;])/g, "$1")
      .replace(/\s+([。.!?,;])/g, "$1")
      .replace(/(?:[·,;]\s*)+$/g, "")
      .trim();
  }

  function statusLabel(status, language){
    const en = String(language || "").toLowerCase().startsWith("en");
    const value = String(status || "").toLowerCase();
    const labels = en
      ? { queued:"Queued", pending:"Pending", running:"In progress", done:"Local simulated result", executed:"Local simulated result", failed:"Failed", cancelled:"Cancelled" }
      : { queued:"等待处理", pending:"等待处理", running:"处理中", done:"本地模拟结果", executed:"本地模拟结果", failed:"处理失败", cancelled:"已取消" };
    return labels[value] || (en ? "Result" : "结果");
  }

  return Object.freeze({
    MAX_VISIBLE_RESULTS,
    MAX_TARGET_LENGTH,
    MAX_CONCURRENT_TASKS,
    normalizeTarget,
    resultTarget,
    isActive,
    mergeResult,
    compactResults,
    sanitizeUserCopy,
    statusLabel
  });
});
