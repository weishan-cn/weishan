;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const DEFAULT_LIMITS = Object.freeze({ maxBytes:262144, maxRows:500, maxFields:80, maxFieldLength:20000, maxDepth:8, maxNodes:4000 });
  const BLOCKED_KEYS = Object.freeze(["__proto__", "prototype", "constructor"]);
  const SENSITIVE_KEYS = Object.freeze(["token", "accesstoken", "refreshtoken", "apikey", "secret", "password", "authorization", "cookie", "credentials", "clientsecret"]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }
  function safety() {
    return { executionGate:"CLOSED", authorizesExecution:false, executed:false, productionTraffic:false, productionAffected:false };
  }
  function failure(code) {
    return deepFreeze(Object.assign({ success:false, error:{ code:code, stage:"PRODUCT_FEED_SECURITY", recoverable:true, message:"Product feed input was rejected safely." } }, safety()));
  }
  function normalizedKey(value) { return String(value).replace(/[^a-z0-9]/gi, "").toLowerCase(); }
  function isSensitiveKey(value) { return SENSITIVE_KEYS.indexOf(normalizedKey(value)) >= 0; }
  function utf8Bytes(value) {
    let bytes = 0;
    for (let index = 0; index < value.length; index += 1) {
      const code = value.charCodeAt(index);
      if (code < 0x80) bytes += 1;
      else if (code < 0x800) bytes += 2;
      else if (code >= 0xd800 && code <= 0xdbff && index + 1 < value.length) { bytes += 4; index += 1; }
      else bytes += 3;
    }
    return bytes;
  }
  function boundedInteger(value, fallback, minimum, maximum) {
    return Number.isSafeInteger(value) && value >= minimum && value <= maximum ? value : fallback;
  }
  function limits(input) {
    const value = input && typeof input === "object" ? input : {};
    return {
      maxBytes:boundedInteger(value.maxBytes, DEFAULT_LIMITS.maxBytes, 1024, DEFAULT_LIMITS.maxBytes),
      maxRows:boundedInteger(value.maxRows, DEFAULT_LIMITS.maxRows, 1, DEFAULT_LIMITS.maxRows),
      maxFields:boundedInteger(value.maxFields, DEFAULT_LIMITS.maxFields, 1, DEFAULT_LIMITS.maxFields),
      maxFieldLength:boundedInteger(value.maxFieldLength, DEFAULT_LIMITS.maxFieldLength, 1, DEFAULT_LIMITS.maxFieldLength),
      maxDepth:DEFAULT_LIMITS.maxDepth,
      maxNodes:DEFAULT_LIMITS.maxNodes
    };
  }
  function clonePlain(value, options) {
    const policy = limits(options);
    const seen = new Set();
    let nodes = 0;
    function copy(item, depth, keyName) {
      if (depth > policy.maxDepth) throw new Error("INPUT_DEPTH_EXCEEDED");
      if (keyName && (BLOCKED_KEYS.indexOf(keyName) >= 0 || isSensitiveKey(keyName))) throw new Error("SENSITIVE_OR_BLOCKED_KEY");
      if (item === null || typeof item === "boolean") return item;
      if (typeof item === "number") {
        if (!Number.isFinite(item)) throw new Error("NON_FINITE_NUMBER");
        return item;
      }
      if (typeof item === "string") {
        if (item.length > policy.maxFieldLength) throw new Error("FIELD_TOO_LARGE");
        return item;
      }
      if (!item || typeof item !== "object" || seen.has(item) || Object.getOwnPropertySymbols(item).length) throw new Error("INPUT_NOT_PLAIN");
      const isArray = Array.isArray(item);
      const prototype = Object.getPrototypeOf(item);
      const constructor = prototype && Object.getOwnPropertyDescriptor(prototype, "constructor");
      if (!isArray && prototype !== null && (!constructor || typeof constructor.value !== "function" || constructor.value.name !== "Object")) throw new Error("INPUT_NOT_PLAIN");
      if (isArray && item.length > policy.maxRows) throw new Error("ROW_LIMIT_EXCEEDED");
      const names = Object.getOwnPropertyNames(item);
      if (!isArray && names.length > policy.maxFields) throw new Error("FIELD_LIMIT_EXCEEDED");
      seen.add(item);
      nodes += 1;
      if (nodes > policy.maxNodes) throw new Error("NODE_LIMIT_EXCEEDED");
      const output = isArray ? [] : {};
      names.forEach(function (name) {
        if (isArray && name === "length") return;
        const descriptor = Object.getOwnPropertyDescriptor(item, name);
        if (!descriptor || descriptor.get || descriptor.set) throw new Error("ACCESSOR_REJECTED");
        output[name] = copy(descriptor.value, depth + 1, isArray ? null : name);
      });
      seen.delete(item);
      return output;
    }
    try { return deepFreeze({ success:true, value:deepFreeze(copy(value, 0, null)) }); }
    catch (error) { return failure(String(error && error.message || "INPUT_REJECTED")); }
  }
  function validHost(value) {
    const host = String(value == null ? "" : value).trim().toLowerCase();
    if (!/^(?=.{1,253}$)(?!-)[a-z0-9-]+(?:\.[a-z0-9-]+)+$/.test(host)) return null;
    if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return null;
    if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local") || host.endsWith(".internal")) return null;
    return host;
  }
  function normalizeHosts(values) {
    if (!Array.isArray(values) || !values.length) return null;
    const hosts = values.map(validHost);
    return hosts.every(Boolean) ? Array.from(new Set(hosts)).sort() : null;
  }
  function validateHttpsUrl(value, allowedHosts) {
    const hosts = normalizeHosts(allowedHosts);
    if (!hosts) return failure("HOST_POLICY_REQUIRED");
    try {
      const parsed = new URL(String(value == null ? "" : value).trim());
      const host = parsed.hostname.toLowerCase();
      if (parsed.protocol !== "https:" || parsed.username || parsed.password || parsed.port || parsed.hash || hosts.indexOf(host) < 0) return failure("URL_NOT_ALLOWED");
      return deepFreeze({ success:true, url:parsed.toString(), host:host });
    } catch (_) { return failure("URL_INVALID"); }
  }
  function validateRedirectChain(initialUrl, redirectUrls, allowedHosts) {
    const chain = [initialUrl].concat(Array.isArray(redirectUrls) ? redirectUrls : []);
    if (chain.length > 6) return failure("REDIRECT_LIMIT_EXCEEDED");
    const checked = chain.map(function (url) { return validateHttpsUrl(url, allowedHosts); });
    if (checked.some(function (item) { return !item.success; })) return failure("REDIRECT_ESCAPE_REJECTED");
    return deepFreeze({ success:true, urls:checked.map(function (item) { return item.url; }) });
  }
  function parseCsv(text, policy) {
    const rows = [];
    let row = [], field = "", quoted = false;
    for (let index = 0; index <= text.length; index += 1) {
      const char = index === text.length ? "\n" : text[index];
      if (quoted) {
        if (char === '"' && text[index + 1] === '"') { field += '"'; index += 1; }
        else if (char === '"') quoted = false;
        else field += char;
      } else if (char === '"' && field === "") quoted = true;
      else if (char === ",") { row.push(field); field = ""; }
      else if (char === "\n") { row.push(field.replace(/\r$/, "")); rows.push(row); row = []; field = ""; }
      else field += char;
      if (field.length > policy.maxFieldLength) throw new Error("FIELD_TOO_LARGE");
    }
    if (quoted) throw new Error("MALFORMED_CSV");
    if (rows.length < 2 || rows.length - 1 > policy.maxRows || rows[0].length > policy.maxFields) throw new Error("CSV_LIMIT_OR_HEADER_INVALID");
    const header = rows.shift();
    if (new Set(header).size !== header.length || header.some(function (name) { return !name || BLOCKED_KEYS.indexOf(name) >= 0 || isSensitiveKey(name); })) throw new Error("CSV_HEADER_REJECTED");
    return rows.filter(function (values) { return values.some(Boolean); }).map(function (values) {
      if (values.length !== header.length) throw new Error("CSV_COLUMN_COUNT_INVALID");
      const output = {};
      header.forEach(function (name, index) { output[name] = values[index]; });
      return output;
    });
  }
  function xmlDecode(value) {
    if (/&(?!amp;|lt;|gt;|quot;|apos;)/.test(value)) throw new Error("XML_ENTITY_REJECTED");
    return value.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");
  }
  function parseXml(text, policy) {
    if (/<!DOCTYPE|<!ENTITY|<\?xml-stylesheet|<!\[CDATA\[/i.test(text)) throw new Error("XML_EXTERNAL_CONTENT_REJECTED");
    const root = text.trim().match(/^<feed>\s*([\s\S]*?)\s*<\/feed>$/);
    if (!root) throw new Error("MALFORMED_XML");
    const rows = [];
    const itemPattern = /<item>\s*([\s\S]*?)\s*<\/item>/g;
    let item;
    let consumed = "";
    while ((item = itemPattern.exec(root[1])) !== null) {
      consumed += item[0];
      const output = {};
      const fieldPattern = /<([A-Za-z][A-Za-z0-9_-]{0,63})>([^<]*)<\/\1>/g;
      let field;
      let fieldConsumed = "";
      while ((field = fieldPattern.exec(item[1])) !== null) {
        fieldConsumed += field[0];
        if (BLOCKED_KEYS.indexOf(field[1]) >= 0 || isSensitiveKey(field[1]) || Object.prototype.hasOwnProperty.call(output, field[1])) throw new Error("XML_FIELD_REJECTED");
        output[field[1]] = xmlDecode(field[2]);
      }
      if (fieldConsumed.replace(/\s/g, "") !== item[1].replace(/\s/g, "") || !Object.keys(output).length || Object.keys(output).length > policy.maxFields) throw new Error("MALFORMED_XML_ITEM");
      rows.push(output);
      if (rows.length > policy.maxRows) throw new Error("ROW_LIMIT_EXCEEDED");
    }
    if (!rows.length || consumed.replace(/\s/g, "") !== root[1].replace(/\s/g, "")) throw new Error("MALFORMED_XML");
    return rows;
  }
  function parseFeedPayload(input) {
    const safe = clonePlain(input);
    if (!safe.success) return safe;
    const source = safe.value;
    const policy = limits(source.limits);
    const format = String(source.format || "").toUpperCase();
    if (["JSON", "CSV", "XML"].indexOf(format) < 0 || typeof source.payload !== "string") return failure("FEED_FORMAT_INVALID");
    if (utf8Bytes(source.payload) > policy.maxBytes) return failure("PAYLOAD_TOO_LARGE");
    try {
      let rows;
      if (format === "JSON") {
        rows = JSON.parse(source.payload);
        if (!Array.isArray(rows)) throw new Error("JSON_ROWS_REQUIRED");
      } else if (format === "CSV") rows = parseCsv(source.payload, policy);
      else rows = parseXml(source.payload, policy);
      const cloned = clonePlain(rows, policy);
      if (!cloned.success) return cloned;
      if (cloned.value.length > policy.maxRows) return failure("ROW_LIMIT_EXCEEDED");
      return deepFreeze(Object.assign({ success:true, format:format, rows:cloned.value, rowCount:cloned.value.length }, safety()));
    } catch (error) {
      const known = [
        "JSON_ROWS_REQUIRED", "FIELD_TOO_LARGE", "MALFORMED_CSV", "CSV_LIMIT_OR_HEADER_INVALID", "CSV_HEADER_REJECTED",
        "CSV_COLUMN_COUNT_INVALID", "XML_EXTERNAL_CONTENT_REJECTED", "XML_ENTITY_REJECTED", "MALFORMED_XML",
        "XML_FIELD_REJECTED", "MALFORMED_XML_ITEM", "ROW_LIMIT_EXCEEDED"
      ];
      const code = String(error && error.message || "");
      return failure(known.indexOf(code) >= 0 ? code : "MALFORMED_" + format);
    }
  }

  window.WeishanGlobalCommerceFeedSecurity = Object.freeze({
    VERSION, DEFAULT_LIMITS, BLOCKED_KEYS, SENSITIVE_KEYS, clonePlain, validateHttpsUrl, validateRedirectChain, parseFeedPayload
  });
})();
