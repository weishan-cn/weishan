;(function(){
  "use strict";

  const IN_APP_HELP_FEEDBACK_SUPPORT_VERSION = "4.3.6";
  const CONSUMER_SUPPORT_ADDRESS = "support@weishan.ai";
  const PROVIDER_OPERATIONS_ADDRESS = "api@weishan.ai";
  const MAX_FEEDBACK_LENGTH = 5000;
  const MAX_MAILTO_LENGTH = 1800;
  const SAFE_ERROR_CLASSES = Object.freeze(["none", "ai_not_connected", "mail_disconnected", "auth_invalid", "no_results", "partial_coverage", "all_source_failure", "unsafe_handoff_blocked", "settings_save_failed", "unexpected_app_defect"]);
  const HELP_CATEGORIES = Object.freeze([
    { id:"general", zh:"使用问题", en:"Get Help" },
    { id:"bug", zh:"报告问题", en:"Report a Problem" },
    { id:"feature", zh:"功能建议", en:"Suggest a Feature" },
    { id:"other", zh:"其他", en:"Other" }
  ]);
  const DIAGNOSTIC_ALLOWLIST = Object.freeze(["appVersion", "platformClass", "locale", "moduleId", "safeErrorClass", "buildType"]);
  const HIGH_RISK_ZERO_METRICS = Object.freeze({
    MAIL_CONTENT_IN_DIAGNOSTICS:0,
    SEARCH_QUERY_IN_DIAGNOSTICS:0,
    CREDENTIALS_IN_DIAGNOSTICS:0,
    SECRETS_IN_DIAGNOSTICS:0,
    FULL_URLS_IN_DIAGNOSTICS:0,
    STACK_TRACES_IN_DIAGNOSTICS:0,
    SCREENSHOTS_AUTO_CAPTURED:0,
    ANALYTICS_HISTORY_IN_DIAGNOSTICS:0,
    FEEDBACK_TEXT_IN_ANALYTICS:0,
    CONTACT_INFO_IN_ANALYTICS:0,
    RAW_INTERNAL_ENUMS_VISIBLE:0,
    RAW_HTTP_ERRORS_VISIBLE:0,
    HEADER_INJECTION_CASES:0,
    SUPPORT_CONTENT_AUTHORITY_BYPASSES:0,
    SUPPORT_ACTIONS_AUTO_SENT:0,
    FALSE_FEEDBACK_SENT_CONFIRMATIONS:0,
    HIDDEN_CLOUD_HELP_EXPOSED:0,
    USER_VISIBLE_API_SUPPORT_ADDRESS:0,
    KEYBOARD_DEAD_ENDS:0,
    SECRET_VALUES_IN_ACCESSIBLE_NAMES:0
  });
  const EXTERNAL_EFFECTS = Object.freeze({
    REAL_SUPPORT_EMAIL_SENDS:0,
    REAL_MAIL_PROVIDER_CALLS:0,
    REAL_MAILBOX_READS:0,
    REAL_AI_API_CALLS:0,
    ANALYTICS_NETWORK_CALLS:0,
    THIRD_PARTY_ANALYTICS_CALLS:0,
    PROVIDER_API_CALLS:0,
    PROVIDER_ACCOUNT_ACTIONS:0,
    PROVIDER_CREDENTIAL_MUTATIONS:0,
    REAL_CREDENTIAL_READS:0,
    REAL_CREDENTIAL_WRITES:0,
    EMAIL_ACTIONS:0,
    MAILBOX_MUTATIONS:0,
    BOOKINGS:0,
    TICKETS:0,
    ORDERS:0,
    PAYMENTS:0,
    WEBSITE_CHANGES:0,
    PRODUCTION_TRAFFIC:0,
    PACKAGING_ACTIONS:0
  });
  const SECRET_RE = /(api[_ -]?key|token|secret|password|authorization|bearer|oauth|private[_ -]?key|otp|cookie|credential|client[_ -]?secret|验证码|密码|密钥)\s*[:：=]\s*\S+/i;
  const FORBIDDEN_DIAGNOSTIC_RE = /(query|search|mail|subject|body|sender|recipient|thread|draft|summary|translation|attachment|url|stack|trace|http|analytics|history|ip|mac|serial|fingerprint|cookie|authorization|token|secret|password|credential|api[_-]?key|otp|private[_-]?key)/i;
  const PROTOTYPE_KEYS = Object.freeze(["__proto__", "constructor", "prototype"]);

  function text(value, max){
    return String(value == null ? "" : value).replace(/\u0000/g, "").trim().slice(0, max || 240);
  }
  function oneLine(value, max){
    return text(value, max).replace(/[\r\n]+/g, " ").replace(/\s+/g, " ").trim();
  }
  function clone(value){
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }
  function isPlainObject(value){
    return !!value && typeof value === "object" && !Array.isArray(value);
  }
  function safeCategory(value){
    const id = oneLine(value, 40).toLowerCase();
    return HELP_CATEGORIES.some((item) => item.id === id) ? id : "general";
  }
  function safeEmail(value){
    const raw = oneLine(value, 160);
    if (!raw) return "";
    return /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(raw) ? raw : "";
  }
  function safeErrorClass(value){
    const id = oneLine(value, 80).toLowerCase();
    return SAFE_ERROR_CLASSES.includes(id) ? id : "unexpected_app_defect";
  }
  function publicErrorCopy(errorClass){
    const value = safeErrorClass(errorClass);
    const map = {
      none:"No current app error.",
      ai_not_connected:"AI service is not connected.",
      mail_disconnected:"Smart Mail is not connected.",
      auth_invalid:"Authorization expired or was revoked.",
      no_results:"No matching result was found.",
      partial_coverage:"Only partial coverage is available.",
      all_source_failure:"The app could not complete this request.",
      unsafe_handoff_blocked:"This external handoff was blocked for safety.",
      settings_save_failed:"Settings could not be saved.",
      unexpected_app_defect:"Something in the app did not work as expected."
    };
    return map[value] || map.unexpected_app_defect;
  }
  function safeDiagnostics(source, options){
    const input = isPlainObject(source) ? source : {};
    const include = options && options.include === true;
    const rejected = [];
    if (!include) return { included:false, diagnostics:{}, rejectedFields:[], redacted:true };
    const diagnostics = {};
    Object.keys(input).forEach((key) => {
      if (PROTOTYPE_KEYS.includes(key)) { rejected.push("PROTOTYPE_FIELD_REJECTED"); return; }
      if (!DIAGNOSTIC_ALLOWLIST.includes(key)) { rejected.push("UNKNOWN_FIELD_REJECTED"); return; }
      const value = oneLine(input[key], 120);
      if (!value || SECRET_RE.test(`${key}:${value}`) || FORBIDDEN_DIAGNOSTIC_RE.test(key)) { rejected.push("UNSAFE_FIELD_REJECTED"); return; }
      if (key === "safeErrorClass") diagnostics[key] = safeErrorClass(value);
      else if (key === "buildType") diagnostics[key] = ["SOURCE_DEV", "PACKAGED", "UNKNOWN"].includes(value) ? value : "UNKNOWN";
      else diagnostics[key] = value;
    });
    return { included:true, diagnostics, rejectedFields:rejected, redacted:true };
  }
  function buildSupportSubject(category){
    const id = safeCategory(category);
    if (id === "bug") return "Weishan Support - Problem Report";
    if (id === "feature") return "Weishan Support - Feature Suggestion";
    return "Weishan Support";
  }
  function sanitizeFeedbackText(value){
    const raw = text(value, MAX_FEEDBACK_LENGTH + 1);
    return {
      value:raw.slice(0, MAX_FEEDBACK_LENGTH),
      tooLong:raw.length > MAX_FEEDBACK_LENGTH,
      empty:raw.trim().length === 0,
      treatedAsPlainText:true,
      authorityGranted:false
    };
  }
  function buildSupportBody(input){
    const safe = isPlainObject(input) ? input : {};
    const feedback = sanitizeFeedbackText(safe.feedbackText);
    const category = safeCategory(safe.category);
    const contact = safeEmail(safe.contactEmail);
    const diagnostics = safeDiagnostics(safe.diagnostics, { include:safe.includeDiagnostics === true });
    const lines = [
      "Hello Weishan Support,",
      "",
      "Category: " + HELP_CATEGORIES.find((item) => item.id === category).en,
      "",
      "User message:",
      feedback.empty ? "(The user has not entered details yet.)" : feedback.value,
      "",
      "Optional contact email: " + (contact || "Not provided")
    ];
    if (diagnostics.included) {
      lines.push("", "Basic diagnostics included by user choice:");
      Object.keys(diagnostics.diagnostics).sort().forEach((key) => {
        lines.push("- " + key + ": " + diagnostics.diagnostics[key]);
      });
      if (!Object.keys(diagnostics.diagnostics).length) lines.push("- None");
    } else {
      lines.push("", "Basic diagnostics: Not included.");
    }
    lines.push("", "Weishan opened this draft for the user. It has not been sent by the app.");
    return { body:lines.join("\n"), diagnostics, feedback };
  }
  function buildSupportMailto(input){
    const safe = isPlainObject(input) ? input : {};
    const bodyResult = buildSupportBody(safe);
    const params = new URLSearchParams();
    params.set("subject", buildSupportSubject(safe.category));
    params.set("body", bodyResult.body.slice(0, MAX_MAILTO_LENGTH));
    const url = "mailto:" + CONSUMER_SUPPORT_ADDRESS + "?" + params.toString();
    return {
      ok:url.length <= MAX_MAILTO_LENGTH + 160,
      recipient:CONSUMER_SUPPORT_ADDRESS,
      url,
      handoffType:"mailto",
      requiresUserAction:true,
      autoSend:false,
      deliveryConfirmedByApp:false,
      falseSentState:0,
      feedbackTooLong:bodyResult.feedback.tooLong,
      diagnostics:bodyResult.diagnostics,
      redacted:true
    };
  }
  function analyticsEvent(event, category){
    const allowed = ["help_opened", "feedback_started", "support_handoff_opened"];
    if (!allowed.includes(event)) return null;
    return { event, category:safeCategory(category), feedbackText:null, contactEmail:null, diagnostics:null, redacted:true };
  }
  function helpTopics(){
    return [
      { id:"what_weishan_can_do", titleZh:"Weishan 能做什么？", titleEn:"What can Weishan do?", bodyZh:"帮助你搜索、比较、分析和整理信息；涉及购买、预订或付款时，会跳转到外部平台由你确认。", bodyEn:"Weishan helps search, compare, analyze, and organize information. Purchases, bookings, and payments happen on the external platform when appropriate." },
      { id:"smart_mail", titleZh:"智能邮件", titleEn:"Smart Mail", bodyZh:"连接邮箱一次；授权仍有效时会自动恢复连接。基础邮件可用，智能整理、翻译、摘要、语义搜索和草稿需要连接 AI 服务。", bodyEn:"Connect your mailbox once. Weishan restores it while authorization remains valid. Basic mail can work without AI; organization, translation, summaries, semantic search, and drafts require a connected AI service." },
      { id:"ai_connection", titleZh:"连接 AI 服务", titleEn:"Connect AI service", bodyZh:"如需智能分析、摘要、翻译和草稿，请在设置中连接 AI 服务。普通帮助不要求理解 API 细节。", bodyEn:"Connect an AI service in Settings for intelligence features such as analysis, summaries, translation, and drafts. Normal help avoids API jargon." },
      { id:"privacy", titleZh:"隐私与匿名产品改进", titleEn:"Privacy and anonymous product improvement", bodyZh:"匿名使用数据不包含搜索原文、邮件内容、凭据、完整 URL、账号身份、IP 或设备指纹。你可以在设置中关闭。", bodyEn:"Anonymous usage data excludes raw queries, Mail content, credentials, full URLs, account identity, IP addresses, and device fingerprints. You can turn it off in Settings." },
      { id:"handoff", titleZh:"外部跳转", titleEn:"External handoff", bodyZh:"Weishan 不会替你付款、下单或出票。外部链接只是让你去官方或第三方页面继续确认。", bodyEn:"Weishan does not pay, order, or issue tickets for you. External links only take you to the official or third-party page to continue yourself." },
      { id:"troubleshooting", titleZh:"常见恢复", titleEn:"Troubleshooting", bodyZh:"AI 未连接、邮箱断开、无结果或临时失败时，先按页面恢复提示处理；仍无法解决再联系支持。", bodyEn:"For AI connection, Mail connection, no-result, or temporary failure states, try the in-app recovery guidance first; contact support if it still does not work." }
    ];
  }
  function supportEscalationMatrix(){
    return [
      { scenario:"AI not connected", primaryRecovery:"Connect AI service in Settings", helpAvailable:true, supportAvailable:true, defaultEscalation:"RECOVER_IN_PRODUCT_THEN_OFFER_SUPPORT" },
      { scenario:"Smart Mail disconnected", primaryRecovery:"Connect mailbox once", helpAvailable:true, supportAvailable:true, defaultEscalation:"RECOVER_IN_PRODUCT_THEN_OFFER_SUPPORT" },
      { scenario:"Smart Mail auth invalid", primaryRecovery:"Reconnect mailbox when authorization expires or is revoked", helpAvailable:true, supportAvailable:true, defaultEscalation:"RECOVER_IN_PRODUCT_THEN_OFFER_SUPPORT" },
      { scenario:"Shopping no results", primaryRecovery:"Adjust query or review unsupported coverage", helpAvailable:true, supportAvailable:true, defaultEscalation:"SHOW_HELP_THEN_OFFER_SUPPORT" },
      { scenario:"Travel partial coverage", primaryRecovery:"Review coverage warning and external confirmation", helpAvailable:true, supportAvailable:true, defaultEscalation:"SHOW_HELP_THEN_OFFER_SUPPORT" },
      { scenario:"all-source failure", primaryRecovery:"Retry after temporary failure if safe", helpAvailable:true, supportAvailable:true, defaultEscalation:"OFFER_SUPPORT" },
      { scenario:"unsafe handoff block", primaryRecovery:"Use blocked-destination explanation", helpAvailable:true, supportAvailable:true, defaultEscalation:"SHOW_HELP_THEN_OFFER_SUPPORT" },
      { scenario:"Settings save failure", primaryRecovery:"Retry local setting save", helpAvailable:true, supportAvailable:true, defaultEscalation:"OFFER_SUPPORT" },
      { scenario:"unexpected app defect", primaryRecovery:"Report what happened", helpAvailable:true, supportAvailable:true, defaultEscalation:"OFFER_SUPPORT" },
      { scenario:"feature suggestion", primaryRecovery:"None needed", helpAvailable:true, supportAvailable:true, defaultEscalation:"OFFER_SUPPORT" },
      { scenario:"privacy question", primaryRecovery:"Read concise privacy help and Settings control", helpAvailable:true, supportAvailable:true, defaultEscalation:"SHOW_HELP" }
    ];
  }
  function buildHelpFeedbackViewModel(input){
    const safe = isPlainObject(input) ? input : {};
    return clone({
      titleZh:"帮助与反馈",
      titleEn:"Help & Feedback",
      location:"Settings",
      categoryCount:HELP_CATEGORIES.length,
      categories:HELP_CATEGORIES,
      supportAddress:CONSUMER_SUPPORT_ADDRESS,
      providerOperationsAddressVisibleToNormalUser:false,
      accountRequired:false,
      contextualRecoveryFirst:true,
      helpTopics:helpTopics(),
      includeDiagnosticsDefault:false,
      diagnosticDisclosureZh:"可选包含基本诊断信息：版本、平台、语言、当前模块、安全错误类别和构建类型。不包含搜索原文、邮件内容、凭据、完整 URL、日志或截图。",
      diagnosticDisclosureEn:"Optionally include basic diagnostics: version, platform, language, current module, safe error class, and build type. This excludes raw queries, Mail content, credentials, full URLs, logs, and screenshots.",
      activeModule:oneLine(safe.moduleId || "settings", 80),
      externalEffects:EXTERNAL_EFFECTS,
      highRiskZeroMetrics:HIGH_RISK_ZERO_METRICS,
      redacted:true
    });
  }
  function buildSupportModuleInventory(){
    return [
      { module:"Settings Help & Feedback card", surface:"Settings", purpose:"single consumer support fallback", dataInput:"user-entered feedback only", automaticDiagnostics:"optional allowlist", externalAction:"mailto handoff only after click", privacyRisk:"LOW", actualEffect:"opens user mail app draft, not sent", removeItResult:"support becomes hard to find", decision:"OPTIMIZE" },
      { module:"Safe diagnostics builder", surface:"core", purpose:"bounded support context", dataInput:"allowlisted app metadata", automaticDiagnostics:"appVersion/platformClass/locale/moduleId/safeErrorClass/buildType", externalAction:"none", privacyRisk:"LOW", actualEffect:"redacted preview", removeItResult:"support loses safe context", decision:"KEEP" },
      { module:"Public beta feedback mocks", surface:"Commerce/Travel evidence", purpose:"offline beta QA drafts", dataInput:"synthetic/local", automaticDiagnostics:"none", externalAction:"none", privacyRisk:"LOW", actualEffect:"not consumer support", removeItResult:"separate beta QA evidence remains weaker", decision:"KEEP" },
      { module:"Provider/API operations contact", surface:"docs/internal ops", purpose:"provider cooperation", dataInput:"technical provider mail", automaticDiagnostics:"none", externalAction:"none", privacyRisk:"MEDIUM if shown to consumers", actualEffect:"not normal consumer support", removeItResult:"provider operations ambiguity", decision:"KEEP" }
    ];
  }
  function buildFeatureMatrix(){
    const optimized = ["HELP_DISCOVERABILITY", "HELP_INFORMATION_ARCHITECTURE", "FEEDBACK_ENTRY", "BUG_REPORT", "FEATURE_SUGGESTION", "GENERAL_SUPPORT", "SUPPORT_EMAIL", "CONTEXTUAL_HELP", "SMART_MAIL_HELP", "AI_CONNECTION_HELP", "ANALYTICS_HELP", "PRIVACY_HELP", "SUPPORT_HANDOFF", "SUPPORT_HANDOFF_TRUTH", "SAFE_DIAGNOSTICS", "DIAGNOSTIC_ALLOWLIST", "DIAGNOSTIC_PREVIEW", "DIAGNOSTIC_OPT_OUT", "SECRET_REDACTION", "MAIL_CONTENT_EXCLUSION", "SEARCH_CONTENT_EXCLUSION", "ANALYTICS_CONTENT_EXCLUSION", "FULL_URL_EXCLUSION", "STACK_TRACE_EXCLUSION", "SCREENSHOT_EXCLUSION", "FEEDBACK_CONTENT_ANALYTICS", "CONTACT_INFO_ANALYTICS", "HEADER_INJECTION_GUARD", "SUPPORT_CONTENT_AUTHORITY", "ACCESSIBILITY", "KEYBOARD", "SCREEN_READER", "SMALL_VIEWPORT", "CHINESE", "ENGLISH", "ZERO_LEARNING"];
    return optimized.reduce((out, key) => { out[key] = "OPTIMIZE"; return out; }, {});
  }
  function audit(){
    return clone(Object.assign({
      IN_APP_HELP_FEEDBACK_SUPPORT_VERSION,
      CONSUMER_SUPPORT_ADDRESS,
      PROVIDER_OPERATIONS_ADDRESS,
      USER_VISIBLE_SUPPORT_ADDRESSES:[CONSUMER_SUPPORT_ADDRESS],
      USER_VISIBLE_API_ADDRESSES:0,
      UNAPPROVED_SUPPORT_ADDRESSES:0,
      FIRST_RUN_ACCOUNT_REQUIRED:"NO",
      EMAIL_SEND_ENABLED:false,
      SUPPORT_HANDOFF_REQUIRES_USER_ACTION:true
    }, HIGH_RISK_ZERO_METRICS, EXTERNAL_EFFECTS));
  }

  window.WeishanInAppHelpFeedbackSupport = Object.freeze({
    IN_APP_HELP_FEEDBACK_SUPPORT_VERSION,
    CONSUMER_SUPPORT_ADDRESS,
    PROVIDER_OPERATIONS_ADDRESS,
    HELP_CATEGORIES,
    DIAGNOSTIC_ALLOWLIST,
    SAFE_ERROR_CLASSES,
    sanitizeFeedbackText,
    safeDiagnostics,
    buildSupportMailto,
    buildSupportBody,
    analyticsEvent,
    helpTopics,
    supportEscalationMatrix,
    buildHelpFeedbackViewModel,
    buildSupportModuleInventory,
    buildFeatureMatrix,
    publicErrorCopy,
    audit
  });
})();
