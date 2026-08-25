;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const MODULE_NAME = "email_ops_normalizer_v1";
  const HIGH_RISK_ATTACHMENT_EXTENSIONS = Object.freeze(["app", "bat", "cmd", "com", "dmg", "exe", "js", "jse", "msi", "pkg", "ps1", "scr", "sh", "vbs", "wsf", "zip", "rar", "7z", "docm", "xlsm", "pptm"]);
  const SECRET_PATTERNS = [
    /\b(?:otp|one[- ]time(?: password| code)?|verification code|验证码|安全码|code)\b\s*(?:is|为|是|[:：=])?\s*[0-9]{4,8}\b/gi,
    /\b(?:password|passwd|pwd)\s*[:=：]\s*\S+/gi,
    /\b(?:api[_ -]?key|token|secret|client[_ -]?secret|authorization|bearer)\s*[:=：]\s*\S+/gi,
    /-----BEGIN [A-Z ]*PRIVATE KEY-----[\s\S]*?-----END [A-Z ]*PRIVATE KEY-----/g
  ];

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function array(value) { return Array.isArray(value) ? value.slice() : []; }

  function sanitizeText(value, options) {
    const boundary = window.WeishanSecurityCoreTrustBoundary;
    if (boundary && typeof boundary.sanitizeHtmlToText === "function") {
      return boundary.sanitizeHtmlToText(value, { maxLength:4000, mode:obj(options).mode || "default" });
    }
    const mode = obj(options).mode || "default";
    let output = text(value)
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    SECRET_PATTERNS.forEach(function (pattern) {
      output = output.replace(pattern, mode === "otp_ephemeral" ? "[otp-redacted]" : "[redacted]");
    });
    if (output.length > 4000) output = output.slice(0, 4000) + "…";
    return output;
  }

  function parseAddress(value) {
    const raw = text(value);
    const match = raw.match(/<?([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})>?/i);
    const address = match ? match[1].toLowerCase() : raw.toLowerCase();
    const domain = address.includes("@") ? address.split("@").pop() : "";
    const displayName = raw.replace(/<?[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}>?/ig, "").replace(/["<>]/g, "").trim();
    return clone({ raw, address, domain, displayName });
  }

  function normalizeAddresses(value) {
    return array(value).map(parseAddress).filter(function (item) { return Boolean(item.address); });
  }

  function extension(filename) {
    const name = text(filename).toLowerCase();
    const parts = name.split(".");
    return parts.length > 1 ? parts.pop() : "";
  }

  function normalizeAttachment(attachment) {
    const safe = obj(attachment);
    const filename = text(safe.filename || safe.name || "unnamed");
    const ext = extension(filename);
    const pathTraversal = /(?:^|[\\/])\.\.(?:[\\/]|$)|^~[\\/]|^[A-Za-z]:[\\/]|^\//.test(filename) || /%2e%2e|%2f|%5c/i.test(filename);
    const doubleExtension = filename.toLowerCase().split(".").length > 2 && HIGH_RISK_ATTACHMENT_EXTENSIONS.includes(ext);
    return clone({
      attachmentId:text(safe.attachmentId || safe.id || filename),
      filename,
      contentType:text(safe.contentType || safe.mimeType || "application/octet-stream"),
      sizeBytes:Number.isFinite(Number(safe.sizeBytes || safe.size)) ? Number(safe.sizeBytes || safe.size) : null,
      extension:ext,
      highRisk:HIGH_RISK_ATTACHMENT_EXTENSIONS.includes(ext) || pathTraversal || doubleExtension,
      pathTraversal,
      doubleExtension,
      bodyLoaded:false,
      executableOpened:false
    });
  }

  function isPrivateHost(host) {
    return /^(localhost|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/i.test(host);
  }

  function extractLinks(value) {
    const htmlHrefMatches = [];
    text(value).replace(/\bhref\s*=\s*["']?([^"'\s>]+)/gi, function (_, href) {
      htmlHrefMatches.push(href);
      return "";
    });
    const inlineMatches = text(value).match(/(?:https?:\/\/|javascript:|data:)[^\s<>"')]+/gi) || [];
    const matches = htmlHrefMatches.concat(inlineMatches);
    const seen = {};
    return matches.filter(function (url) {
      const key = text(url);
      if (!key || seen[key]) return false;
      seen[key] = true;
      return true;
    }).slice(0, 20).map(function (url) {
      let host = "";
      let protocol = "";
      let hasUserInfo = false;
      let encodedRedirect = false;
      try {
        const parsed = new URL(url);
        host = parsed.hostname.toLowerCase();
        protocol = parsed.protocol.replace(":", "").toLowerCase();
        hasUserInfo = Boolean(parsed.username || parsed.password);
        encodedRedirect = /(^|[?&])(url|u|redirect|redirect_uri|target|next)=https?%3a%2f%2f/i.test(parsed.search);
      } catch (_) {
        protocol = lowerScheme(url);
      }
      const unsafe = protocol === "javascript" || protocol === "data" || hasUserInfo || encodedRedirect || isPrivateHost(host);
      return {
        url,
        host,
        scheme:protocol || "",
        opened:false,
        requiresPolicyReview:true,
        unsafe,
        privateHost:isPrivateHost(host),
        hasUserInfo,
        encodedRedirect,
        risk:unsafe ? "HIGH" : "REVIEW"
      };
    });
  }

  function lowerScheme(value) {
    const match = text(value).match(/^([a-z0-9+.-]+):/i);
    return match ? match[1].toLowerCase() : "";
  }

  function normalizeMailMessage(input) {
    const safe = obj(input);
    const body = text(safe.bodyText || safe.text || safe.body || safe.html || "");
    const subject = text(safe.subject || "");
    const sanitizedBody = sanitizeText(body);
    return clone({
      messageId:text(safe.messageId || safe.id || ""),
      threadId:text(safe.threadId || safe.conversationId || safe.messageId || safe.id || ""),
      providerMessageId:text(safe.providerMessageId || safe.messageId || safe.id || ""),
      from:parseAddress(safe.from || ""),
      to:normalizeAddresses(safe.to || []),
      cc:normalizeAddresses(safe.cc || []),
      subject:sanitizeText(subject),
      receivedAt:text(safe.receivedAt || safe.date || ""),
      sanitizedBody,
      bodyText:sanitizedBody,
      bodyRetained:false,
      rawHtmlRetained:false,
      attachments:array(safe.attachments).map(normalizeAttachment),
      links:extractLinks(`${subject} ${body}`),
      mailbox:text(safe.mailbox || safe.category || "operational"),
      read:safe.read === true,
      unread:safe.unread === true || safe.read === false,
      replyTo:parseAddress(safe.replyTo || ""),
      authResults:obj(safe.authResults),
      providerHints:array(safe.providerHints).map(text).filter(Boolean),
      source:text(safe.source || "EMAIL"),
      processingState:"UNPROCESSED",
      redacted:true
    });
  }

  function normalizeMailboxBatch(messages, options) {
    const expectedAccount = text(obj(options).expectedAccount).toLowerCase();
    const actualAccount = text(obj(options).actualAccount).toLowerCase();
    const accountStatus = expectedAccount && actualAccount && expectedAccount !== actualAccount ? "WRONG_ACCOUNT" : (actualAccount ? "CONNECTED" : "UNAVAILABLE");
    return clone({
      accountStatus,
      expectedAccount:expectedAccount || null,
      actualAccount:actualAccount || null,
      messages:accountStatus === "WRONG_ACCOUNT" ? [] : array(messages).map(normalizeMailMessage),
      fullRescan:false,
      rawMailboxDump:false,
      redacted:true
    });
  }

  window.WeishanEmailOpsNormalizer = {
    VERSION,
    MODULE_NAME,
    HIGH_RISK_ATTACHMENT_EXTENSIONS,
    sanitizeText,
    parseAddress,
    normalizeAttachment,
    extractLinks,
    normalizeMailMessage,
    normalizeMailboxBatch
  };
})();
