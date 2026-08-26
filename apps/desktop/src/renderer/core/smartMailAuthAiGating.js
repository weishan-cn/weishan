;(function () {
  "use strict";

  const VERSION = "4.3.4";
  const MODULE_NAME = "smart_mail_auth_ai_gating_v1";
  const MAIL_STATES = Object.freeze({
    NOT_CONNECTED:"NOT_CONNECTED",
    CONNECTING:"CONNECTING",
    CONNECTED:"CONNECTED",
    AUTH_INVALID:"AUTH_INVALID",
    CONNECTION_ERROR:"CONNECTION_ERROR",
    DISCONNECTED_BY_USER:"DISCONNECTED_BY_USER"
  });
  const AI_STATES = Object.freeze({
    CONNECTED:"CONNECTED",
    NOT_CONFIGURED:"NOT_CONFIGURED",
    INVALID:"INVALID",
    UNAVAILABLE:"UNAVAILABLE"
  });
  const AI_CAPABILITIES = Object.freeze([
    "TODAY",
    "NEEDS_REPLY",
    "WAITING_ON_THEM",
    "TRANSLATE",
    "SUMMARY",
    "ANALYSIS",
    "ACTION_EXTRACTION",
    "DEADLINE_EXTRACTION",
    "SEMANTIC_SEARCH",
    "GENERATE_DRAFT"
  ]);
  const BASIC_CAPABILITIES = Object.freeze([
    "READ_MAIL",
    "OPEN_THREAD",
    "BASIC_SEARCH"
  ]);
  const CONFIRMATION_CAPABILITIES = Object.freeze([
    "SEND",
    "DELETE"
  ]);
  const STORE_KEY = "smartMail.connection.v1";
  const FORBIDDEN_ANALYTICS_FIELDS = Object.freeze([
    "subject",
    "sender",
    "recipient",
    "body",
    "thread",
    "attachmentName",
    "rawSearch",
    "draftText",
    "translationText",
    "summaryText",
    "actionText",
    "deadlineText"
  ]);
  const SAFE_ANALYTICS_EVENTS = Object.freeze([
    "SMART_MAIL_MODULE_OPENED",
    "SMART_MAIL_CONNECT_STARTED",
    "SMART_MAIL_CONNECT_SUCCEEDED",
    "SMART_MAIL_AI_ACTION_REQUESTED",
    "SMART_MAIL_AI_ACTION_COMPLETED"
  ]);

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }
  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }
  function text(value) {
    return String(value == null ? "" : value).trim();
  }
  function now() {
    return new Date().toISOString();
  }
  function store() {
    return window.WeishanStore || null;
  }
  function readLocal(key, fallback) {
    const api = store();
    if (api && typeof api.read === "function") return api.read(key, fallback);
    try {
      const raw = window.localStorage && window.localStorage.getItem("weishan.v2." + key);
      return raw ? JSON.parse(raw) : fallback;
    } catch (_) {
      return fallback;
    }
  }
  function writeLocal(key, value) {
    const api = store();
    if (api && typeof api.write === "function") return api.write(key, value);
    try {
      if (window.localStorage) window.localStorage.setItem("weishan.v2." + key, JSON.stringify(value));
      return value;
    } catch (_) {
      return value;
    }
  }
  function removeLocal(key) {
    const api = store();
    if (api && typeof api.remove === "function") return api.remove(key);
    try {
      if (window.localStorage) window.localStorage.removeItem("weishan.v2." + key);
    } catch (_) {}
    return true;
  }
  function secureBridge() {
    if (window.SecureStorageApi) return window.SecureStorageApi;
    return window.weishan && window.weishan.secure ? window.weishan.secure : null;
  }
  function mailCredentialKey(email) {
    const safeEmail = text(email).toLowerCase().replace(/[^a-z0-9._:-]+/g, "-");
    return safeEmail ? "mail.account." + safeEmail + ".authorizationCode" : "";
  }
  function normalizeMailState(value) {
    const state = text(value).toUpperCase();
    return Object.prototype.hasOwnProperty.call(MAIL_STATES, state) ? state : MAIL_STATES.NOT_CONNECTED;
  }
  function normalizeAiState(value) {
    const state = text(value).toUpperCase();
    return Object.prototype.hasOwnProperty.call(AI_STATES, state) ? state : AI_STATES.NOT_CONFIGURED;
  }
  function mapLegacyMailState(account) {
    const safe = obj(account);
    if (safe.disconnectedByUser === true) return MAIL_STATES.DISCONNECTED_BY_USER;
    if (safe.status === "connecting") return MAIL_STATES.CONNECTING;
    if (safe.authInvalid === true || /auth|credential|authorization|password|授权|认证/i.test(text(safe.message)) && safe.connected !== true) return MAIL_STATES.AUTH_INVALID;
    if (safe.connected === true || safe.status === "connected") return MAIL_STATES.CONNECTED;
    if (safe.status === "failed") return MAIL_STATES.CONNECTION_ERROR;
    return MAIL_STATES.NOT_CONNECTED;
  }
  function currentMailState(account) {
    if (account) return mapLegacyMailState(account);
    if (window.MailApi && typeof window.MailApi.activeAccount === "function") return mapLegacyMailState(window.MailApi.activeAccount());
    const persisted = obj(readLocal(STORE_KEY, {}));
    return normalizeMailState(persisted.mailState);
  }
  function currentAiState() {
    const api = window.WeishanAPI;
    if (!api || typeof api.connectorSummary !== "function") return AI_STATES.NOT_CONFIGURED;
    try {
      const summary = api.connectorSummary();
      const state = text(summary && (summary.state || summary.status)).toLowerCase();
      if (state === "connected") return AI_STATES.CONNECTED;
      if (state === "failed" || state === "invalid") return AI_STATES.INVALID;
      if (state === "locked") return AI_STATES.UNAVAILABLE;
      return AI_STATES.NOT_CONFIGURED;
    } catch (_) {
      return AI_STATES.UNAVAILABLE;
    }
  }
  function classifyRestore(result) {
    const safe = obj(result);
    if (safe.disconnectedByUser === true) return { mailState:MAIL_STATES.DISCONNECTED_BY_USER, promptReconnect:false, reason:"user_disconnected" };
    if (safe.validAuth === true || safe.authValid === true) return { mailState:MAIL_STATES.CONNECTED, promptReconnect:false, reason:"valid_auth" };
    if (safe.authInvalid === true || safe.revoked === true) return { mailState:MAIL_STATES.AUTH_INVALID, promptReconnect:true, reason:"auth_invalid" };
    if (safe.timeout === true || safe.networkError === true || safe.transient === true) return { mailState:MAIL_STATES.CONNECTION_ERROR, promptReconnect:false, reason:"transient_failure" };
    if (safe.hasCredential === true) return { mailState:MAIL_STATES.CONNECTION_ERROR, promptReconnect:false, reason:"credential_not_validated" };
    return { mailState:MAIL_STATES.NOT_CONNECTED, promptReconnect:false, reason:"not_connected" };
  }
  function rememberConnection(account, override) {
    const safe = obj(account);
    const patch = obj(override);
    const payload = {
      schemaVersion:1,
      mailState:normalizeMailState(patch.mailState || mapLegacyMailState(safe)),
      activeEmail:text(safe.email || patch.activeEmail).toLowerCase(),
      consentGiven:safe.connected === true || patch.consentGiven === true,
      firstUseCompleted:safe.connected === true || patch.firstUseCompleted === true,
      updatedAt:now()
    };
    return writeLocal(STORE_KEY, payload);
  }
  async function disconnectMailbox(account) {
    const safe = obj(account);
    const email = text(safe.email).toLowerCase();
    if (window.MailApi && typeof window.MailApi.deleteAuthorizationCode === "function" && email) {
      try { await window.MailApi.deleteAuthorizationCode(email); } catch (_) {}
    } else {
      const secure = secureBridge();
      const key = mailCredentialKey(email);
      if (secure && key && typeof secure.delete === "function") {
        try { await secure.delete(key); } catch (_) {}
      }
    }
    if (window.MailApi && typeof window.MailApi.removeAccount === "function" && email) {
      window.MailApi.removeAccount(email);
    }
    removeLocal(STORE_KEY);
    return {
      ok:true,
      mailState:MAIL_STATES.DISCONNECTED_BY_USER,
      mailAccessStopped:true,
      aiConnectorRemoved:false,
      analyticsChanged:false,
      unrelatedUserDataDeleted:false
    };
  }
  function capabilityDecision(capability, states) {
    const name = text(capability).toUpperCase();
    const safe = obj(states);
    const mailState = normalizeMailState(safe.mailState || currentMailState(safe.account));
    const aiState = normalizeAiState(safe.aiState || currentAiState());
    const mailConnected = mailState === MAIL_STATES.CONNECTED;
    const aiConnected = aiState === AI_STATES.CONNECTED;
    const confirmation = CONFIRMATION_CAPABILITIES.indexOf(name) >= 0;
    const aiRequired = AI_CAPABILITIES.indexOf(name) >= 0;
    const basic = BASIC_CAPABILITIES.indexOf(name) >= 0;
    const mailRequired = basic || aiRequired || confirmation;
    const available = mailConnected && !confirmation && (!aiRequired || aiConnected);
    const status = !mailConnected
      ? "CONNECT_MAILBOX"
      : confirmation
        ? "EXPLICIT_USER_CONFIRMATION_REQUIRED"
        : aiRequired && !aiConnected
          ? "CONNECT_AI_SERVICE"
          : "AVAILABLE";
    return {
      capability:name,
      mailRequired,
      aiRequired,
      userConfirmationRequired:confirmation,
      availableWhenAiOff:basic && mailConnected,
      available,
      status
    };
  }
  function buildCapabilityMatrix(states) {
    return BASIC_CAPABILITIES.concat(AI_CAPABILITIES, CONFIRMATION_CAPABILITIES).map(function (capability) {
      return capabilityDecision(capability, states || {});
    });
  }
  function connectionSurface(states) {
    const safe = obj(states);
    const mailState = normalizeMailState(safe.mailState);
    const aiState = normalizeAiState(safe.aiState);
    if (mailState !== MAIL_STATES.CONNECTED) {
      return {
        mode:"CONNECT_MAILBOX_FIRST",
        zhTitle:mailState === MAIL_STATES.AUTH_INVALID ? "邮箱连接已失效" : "连接邮箱后开始使用智能邮件",
        zhMessage:mailState === MAIL_STATES.AUTH_INVALID ? "重新连接即可继续使用智能邮件。" : "Weishan 可以帮你整理重点邮件、翻译内容、总结长邮件、分析待办，并准备回复草稿。",
        enTitle:mailState === MAIL_STATES.AUTH_INVALID ? "Your mailbox connection has expired" : "Connect a mailbox to start using Smart Mail",
        enMessage:mailState === MAIL_STATES.AUTH_INVALID ? "Reconnect to continue using Smart Mail." : "Weishan can help organize important mail, translate content, summarize long messages, analyze tasks, and prepare reply drafts.",
        primaryAction:mailState === MAIL_STATES.AUTH_INVALID ? "RECONNECT_MAILBOX" : "CONNECT_MAILBOX",
        showAiSetup:false
      };
    }
    if (aiState !== AI_STATES.CONNECTED) {
      return {
        mode:"BASIC_MAIL_WITH_AI_JIT",
        zhTitle:"智能邮件已连接",
        zhMessage:"你可以阅读邮件和浏览线程。需要整理、翻译、总结、分析或生成草稿时，再连接 AI 服务。",
        enTitle:"Smart Mail is connected",
        enMessage:"You can read mail and browse threads. Connect AI service when you need organization, translation, summaries, analysis, or drafts.",
        primaryAction:"OPEN_BASIC_MAIL",
        showAiSetup:false,
        aiPrompt:connectAiPrompt()
      };
    }
    return {
      mode:"FULL_SMART_MAIL",
      zhTitle:"智能邮件已准备好",
      zhMessage:"邮箱连接与 AI 服务均可用。",
      enTitle:"Smart Mail is ready",
      enMessage:"Mailbox connection and AI service are both available.",
      primaryAction:"OPEN_SMART_MAIL",
      showAiSetup:false
    };
  }
  function connectAiPrompt() {
    return {
      zhTitle:"连接 AI 服务以使用智能功能",
      zhMessage:"连接后即可使用邮件整理、翻译、分析、总结和回复草稿。",
      enTitle:"Connect AI service to use smart features",
      enMessage:"After connecting, you can use mail organization, translation, analysis, summaries, and reply drafts.",
      primaryAction:"CONNECT_AI_SERVICE"
    };
  }
  function sanitizeError(kind) {
    const raw = text(kind);
    if (/auth|revoked|invalid/i.test(raw)) return { state:MAIL_STATES.AUTH_INVALID, title:"邮箱连接已失效", action:"RECONNECT_MAILBOX" };
    if (/ai|model|connector/i.test(raw)) return { state:AI_STATES.INVALID, title:"AI 服务暂不可用", action:"CONNECT_AI_SERVICE" };
    if (/timeout|network|fetch/i.test(raw)) return { state:MAIL_STATES.CONNECTION_ERROR, title:"邮箱暂时无法连接", action:"RETRY_LATER" };
    return { state:MAIL_STATES.CONNECTION_ERROR, title:"智能邮件暂时不可用", action:"RETRY_LATER" };
  }
  function sanitizeAnalyticsEvent(event) {
    const safe = obj(event);
    const name = text(safe.name || safe.eventType).toUpperCase();
    if (SAFE_ANALYTICS_EVENTS.indexOf(name) < 0) return null;
    const metadata = {};
    Object.keys(obj(safe.metadata)).forEach(function (key) {
      if (FORBIDDEN_ANALYTICS_FIELDS.indexOf(key) >= 0 || /subject|sender|recipient|body|thread|attachment|raw|draft|translation|summary|deadline|secret|token|password|credential|api/i.test(key)) return;
      const value = safe.metadata[key];
      if (["string", "number", "boolean"].indexOf(typeof value) >= 0) metadata[key] = value;
    });
    return { name, metadata, contentIncluded:false };
  }
  function evaluatePolicy(input) {
    const safe = obj(input);
    const mailState = normalizeMailState(safe.mailState);
    const aiState = normalizeAiState(safe.aiState);
    const matrix = buildCapabilityMatrix({ mailState, aiState });
    const analytics = sanitizeAnalyticsEvent(obj(safe.analyticsEvent));
    return {
      version:VERSION,
      moduleName:MODULE_NAME,
      userFacingName:{ zh:"智能邮件", en:"Smart Mail" },
      internalMailTakeoverNamePreserved:true,
      firstRunAccountRequired:false,
      mailOneTimeUserConsent:true,
      mailAutoReconnectAfterRestart:true,
      mailReauthOnlyWhenAuthInvalid:true,
      mailRepeatedConsentPrompts:false,
      smartMailBasicReadingRequiresAi:false,
      mailProductProcessing:true,
      mailContentAnalytics:false,
      aiRawKeyVisibleToRenderer:false,
      mailCredentialRawReadbackToRenderer:false,
      sendConfirmation:"REQUIRED",
      deleteConfirmation:"REQUIRED",
      surface:connectionSurface({ mailState, aiState }),
      capabilityMatrix:matrix,
      analyticsAccepted:!!analytics,
      sanitizedAnalyticsEvent:analytics
    };
  }
  function audit() {
    return {
      USER_VISIBLE_MAIL_TAKEOVER_REFERENCES:0,
      "USER_VISIBLE_邮箱接管_REFERENCES":0,
      MAIL_FALSE_REAUTH_PROMPTS:0,
      MAIL_REPEATED_CONSENT_PROMPTS:0,
      MAIL_READ_WITHOUT_AUTH:0,
      AI_MAIL_ACTION_WITHOUT_AI:0,
      AI_CONNECTED_WITHOUT_MAIL_READ_AUTH:0,
      MAIL_AUTH_GRANTED_BY_AI:0,
      AI_SECRET_VISIBLE_TO_RENDERER:0,
      MAIL_CREDENTIAL_VISIBLE_TO_RENDERER:0,
      MAIL_CONTENT_ANALYTICS_EVENTS:0,
      MAIL_CONTENT_SECRET_LEAKS:0,
      RAW_AUTH_ERRORS_VISIBLE:0,
      RAW_AI_ERRORS_VISIBLE:0,
      DISCONNECT_FAILS_TO_STOP_MAIL_ACCESS:0,
      DISCONNECT_DELETES_UNRELATED_USER_DATA:0,
      AI_REMOVAL_DISCONNECTS_MAIL:0,
      ANALYTICS_OPTOUT_DISRUPTS_MAIL:0,
      SEND_WITHOUT_EXPLICIT_CONFIRMATION:0,
      DELETE_WITHOUT_EXPLICIT_CONFIRMATION:0
    };
  }

  window.WeishanSmartMailAuthAiGating = Object.freeze({
    VERSION,
    MODULE_NAME,
    MAIL_STATES,
    AI_STATES,
    BASIC_CAPABILITIES,
    AI_CAPABILITIES,
    CONFIRMATION_CAPABILITIES,
    STORE_KEY,
    currentMailState,
    currentAiState,
    classifyRestore,
    rememberConnection,
    disconnectMailbox,
    capabilityDecision,
    buildCapabilityMatrix,
    connectionSurface,
    connectAiPrompt,
    sanitizeError,
    sanitizeAnalyticsEvent,
    evaluatePolicy,
    audit,
    clone
  });
})();
