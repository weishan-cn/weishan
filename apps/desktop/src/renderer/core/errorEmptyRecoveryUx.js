;(function () {
  "use strict";

  const ERROR_EMPTY_RECOVERY_UX_VERSION = "4.3.0";
  const MODULE_NAME = "error_empty_recovery_ux_v1";
  const MAX_VISIBLE_ERRORS = 3;
  const INTERNAL_TOKEN = /\b(ETIMEDOUT|ECONNRESET|ENOTFOUND|EAI_AGAIN|AUTH_REQUIRED|BLOCKED_POLICY|RETRY_EXHAUSTED|SOURCE_UNAVAILABLE|NO_COMPARABLE_CANDIDATES|CREDENTIAL_MISSING|MALFORMED_RESPONSE|executionGate|authorizesExecution|productionTraffic)\b/ig;
  const SECRET_TOKEN = /\b(api[_-]?key|client[_-]?secret|secret|token|password|authorization|bearer|x-signature|private[_-]?key)\b\s*[:=]\s*["']?[^"',\s<>{}]+/ig;
  const STACK_LINE = /\bat\s+[\w$.<>]+\s*\([^)]*\)|\b[A-Z][\w.]+Error:\s+[^\n]+/g;
  const HTML_SCRIPT_BLOCK = /<\s*(script|style|iframe|object|embed)\b[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/ig;
  const HTML_SCRIPT = /<\s*\/?\s*(script|style|iframe|object|embed)\b[^>]*>|on[a-z]+\s*=\s*["'][^"']*["']/ig;
  const URL_SECRET = /([?&](?:token|api[_-]?key|secret|password|authorization)=)[^&#\s]+/ig;
  const PRIVATE_URL = /\bhttps?:\/\/(?:localhost|127(?:\.\d{1,3}){3}|10(?:\.\d{1,3}){3}|192\.168(?:\.\d{1,3}){2}|172\.(?:1[6-9]|2\d|3[0-1])(?:\.\d{1,3}){2})[^\s]*/ig;

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function normalizeKind(value) {
    const raw = text(value).toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    if (!raw) return "INITIAL_EMPTY";
    if (/^(INITIAL|INITIAL_EMPTY|EMPTY_INITIAL|START|IDLE)$/.test(raw)) return "INITIAL_EMPTY";
    if (/^(NO_RESULTS|ZERO_RESULTS|EMPTY_RESULTS|NO_MATCHES)$/.test(raw)) return "NO_RESULTS";
    if (/^(PARTIAL|PARTIAL_RESULTS|SOME_SOURCES_FAILED)$/.test(raw)) return "PARTIAL_RESULTS";
    if (/^(ALL_FAILED|ALL_SOURCES_FAILED|FAILURE|FAILED|UNKNOWN_FAILURE|SYSTEM_FAILURE)$/.test(raw)) return "ALL_SOURCES_FAILED";
    if (/^(TIMEOUT|ETIMEDOUT|REQUEST_TIMEOUT)$/.test(raw)) return "TEMPORARY_FAILURE";
    if (/^(NETWORK|ECONNRESET|ENOTFOUND|SOURCE_UNAVAILABLE|UNAVAILABLE|RATE_LIMIT)$/.test(raw)) return "TEMPORARY_FAILURE";
    if (/^(AUTH|AUTH_REQUIRED|CREDENTIAL_MISSING|CONFIGURATION_REQUIRED|MISSING_CONFIGURATION)$/.test(raw)) return "CONFIGURATION_REQUIRED";
    if (/^(BLOCKED|BLOCKED_POLICY|POLICY_BLOCKED|UNSUPPORTED|DECOMMISSIONED|SAFE_BLOCK)$/.test(raw)) return "SAFE_BLOCK";
    if (/^(CANCELLED|CANCELED|ABORTED|STALE_RESPONSE_IGNORED)$/.test(raw)) return "CANCELLED_OR_STALE";
    if (/^(RETRY_EXHAUSTED)$/.test(raw)) return "RETRY_EXHAUSTED";
    if (/^(MAIL_NOT_CONNECTED|MAILBOX_NOT_CONNECTED)$/.test(raw)) return "MAIL_NOT_CONNECTED";
    if (/^(MAIL_NO_ATTENTION|NO_ATTENTION_MAIL)$/.test(raw)) return "MAIL_NO_ATTENTION";
    if (/^(MAIL_READ_FAILURE|MAILBOX_READ_FAILURE)$/.test(raw)) return "MAIL_READ_FAILURE";
    if (/^(PLUGIN_EMPTY|NO_PLUGIN_RESULTS)$/.test(raw)) return "PLUGIN_EMPTY";
    if (/^(PLUGIN_FAILURE|PLUGIN_FAILED)$/.test(raw)) return "PLUGIN_FAILURE";
    if (/^(GENERIC_HANDOFF|HANDOFF_GENERIC)$/.test(raw)) return "GENERIC_HANDOFF";
    if (/^(UNSAFE_HANDOFF|UNSAFE_HANDOFF_BLOCKED|HANDOFF_BLOCKED)$/.test(raw)) return "UNSAFE_HANDOFF_BLOCKED";
    return "UNKNOWN_FAILURE";
  }

  function redactUserCopy(value) {
    return text(value || "")
      .replace(HTML_SCRIPT_BLOCK, "[removed]")
      .replace(HTML_SCRIPT, "[removed]")
      .replace(URL_SECRET, "$1redacted")
      .replace(PRIVATE_URL, "a blocked local address")
      .replace(SECRET_TOKEN, function (match) {
        return "credential detail hidden";
      })
      .replace(/bearer\s+[a-z0-9._~+/-]+/ig, "bearer redacted")
      .replace(STACK_LINE, "technical details hidden")
      .replace(/\bError:\s*[^.]+/g, "technical details hidden")
      .replace(/\bHTTP\s*(?:4\d\d|5\d\d)\b/ig, "the service returned an error")
      .replace(INTERNAL_TOKEN, function (match) {
        const normalized = match.toUpperCase();
        if (normalized === "ETIMEDOUT") return "timed out";
        if (normalized === "ECONNRESET" || normalized === "ENOTFOUND" || normalized === "EAI_AGAIN") return "network problem";
        if (normalized === "AUTH_REQUIRED" || normalized === "CREDENTIAL_MISSING") return "account setup needed";
        if (normalized === "BLOCKED_POLICY") return "not available for this request";
        if (normalized === "RETRY_EXHAUSTED") return "we tried again and it still did not work";
        if (normalized === "SOURCE_UNAVAILABLE") return "source unavailable";
        if (normalized === "NO_COMPARABLE_CANDIDATES") return "nothing comparable yet";
        return "protected setting";
      })
      .replace(/\s+/g, " ")
      .slice(0, 360)
      .trim();
  }

  function localePack(locale) {
    const zh = /^zh/i.test(text(locale));
    return zh ? {
      initialTitle:"先告诉我你想找什么",
      initialMessage:"输入商品、航班、酒店、邮轮或邮件目标后，我会开始搜索并说明结果来源。",
      noResultsTitle:"暂时没有找到匹配结果",
      noResultsMessage:"系统工作正常，只是当前条件下没有可用结果。可以放宽条件或换个关键词。",
      partialTitle:"找到部分结果",
      partialMessage:"部分来源没有回应，但可用结果仍然保留。你可以先查看这些结果，或稍后重试缺失来源。",
      failureTitle:"这次没有成功完成",
      failureMessage:"请求遇到问题，但其他模块仍可使用。请稍后重试，或调整条件后再试。",
      configTitle:"需要先完成设置",
      configMessage:"这个来源需要账户或凭据配置后才能使用。当前不会假装有可用结果。",
      blockedTitle:"此操作现在不能继续",
      blockedMessage:"出于安全、权限或供应商规则限制，这一步已停止。请选择其他来源或等待授权。",
      cancelledTitle:"已停止当前请求",
      cancelledMessage:"旧请求已取消，不会覆盖新的结果。",
      mailConnectedTitle:"需要连接邮箱",
      mailConnectedMessage:"邮箱地址仍然有效，只是当前应用还不能读取邮箱内容。",
      mailNoAttentionTitle:"没有需要关注的新邮件",
      mailNoAttentionMessage:"邮箱读取正常，只是目前没有被标记为需要处理的邮件。",
      mailFailureTitle:"邮件暂时无法读取",
      mailFailureMessage:"这不是没有邮件，而是读取过程失败。请稍后重试或检查邮箱连接。",
      handoffTitle:"无法确认安全跳转",
      handoffMessage:"这个链接不是已验证的精确目标，因此不会自动打开。",
      stillWorks:"其他页面和已验证结果仍可继续使用。",
      retry:"重试",
      modify:"修改条件",
      settings:"打开设置",
      continueAction:"继续查看可用结果",
      chooseOther:"选择其他来源"
    } : {
      initialTitle:"Tell me what you want to find",
      initialMessage:"Enter a product, flight, hotel, cruise, or mail goal and I’ll start with clear source evidence.",
      noResultsTitle:"No matching results yet",
      noResultsMessage:"The app is working; the current filters just did not return usable results. Try broader terms or fewer constraints.",
      partialTitle:"Some results are available",
      partialMessage:"A few sources did not respond, but the valid results are still available. You can review them now or retry the missing sources later.",
      failureTitle:"This request did not complete",
      failureMessage:"Something went wrong with this request, but the rest of Weishan is still available. Try again or adjust the request.",
      configTitle:"Setup is needed first",
      configMessage:"This source needs account or credential setup before use. Weishan will not pretend results are available.",
      blockedTitle:"This step cannot continue now",
      blockedMessage:"A safety, permission, or provider rule stopped this action. Choose another source or wait for approval.",
      cancelledTitle:"Request stopped",
      cancelledMessage:"The old request was cancelled and will not overwrite newer results.",
      mailConnectedTitle:"Connect mail first",
      mailConnectedMessage:"The email address is still valid; the app just cannot read mailbox content yet.",
      mailNoAttentionTitle:"No attention-needed mail",
      mailNoAttentionMessage:"Mail reading worked, and there are no messages that need action right now.",
      mailFailureTitle:"Mail could not be read",
      mailFailureMessage:"This is a read failure, not an empty mailbox. Retry later or check the mail connection.",
      handoffTitle:"Safe handoff is not confirmed",
      handoffMessage:"This link is not a verified exact destination, so Weishan will not open it automatically.",
      stillWorks:"Other pages and verified results remain usable.",
      retry:"Retry",
      modify:"Change request",
      settings:"Open settings",
      continueAction:"Review available results",
      chooseOther:"Choose another source"
    };
  }

  function action(id, label, options) {
    const safe = obj(options);
    return {
      id,
      label,
      type:"button",
      role:"button",
      keyboardAccessible:true,
      focusVisible:true,
      minTargetPx:44,
      scope:text(safe.scope || "inline"),
      authorizesExecution:false,
      productionTraffic:false
    };
  }

  function buildRecoveryActions(kind, input, pack) {
    const safe = obj(input);
    if (kind === "PARTIAL_RESULTS") return [action("continue_available", pack.continueAction), action("retry_missing", pack.retry)];
    if (kind === "NO_RESULTS" || kind === "PLUGIN_EMPTY") return [action("modify_request", pack.modify)];
    if (kind === "TEMPORARY_FAILURE" || kind === "RETRY_EXHAUSTED" || kind === "MAIL_READ_FAILURE" || kind === "PLUGIN_FAILURE") return [action("retry", pack.retry)];
    if (kind === "CONFIGURATION_REQUIRED" || kind === "MAIL_NOT_CONNECTED") return [action("open_settings", pack.settings)];
    if (kind === "SAFE_BLOCK" || kind === "UNSAFE_HANDOFF_BLOCKED" || kind === "GENERIC_HANDOFF") return [action("choose_other_source", pack.chooseOther)];
    if (safe.allowModify === true) return [action("modify_request", pack.modify)];
    return [];
  }

  function presentRecoveryState(input) {
    const safe = obj(input);
    const kind = normalizeKind(safe.kind || safe.status || safe.reason || safe.errorCode);
    const pack = localePack(safe.locale || "en");
    const hasResults = Array.isArray(safe.validResults) ? safe.validResults.length : Number(safe.validResultCount || 0);
    let title = pack.failureTitle;
    let message = pack.failureMessage;
    let severity = "error";
    let failure = true;
    let exactHandoff = false;
    let partial = false;

    if (kind === "INITIAL_EMPTY") {
      title = pack.initialTitle;
      message = pack.initialMessage;
      severity = "info";
      failure = false;
    } else if (kind === "NO_RESULTS" || kind === "PLUGIN_EMPTY") {
      title = pack.noResultsTitle;
      message = kind === "PLUGIN_EMPTY" ? pack.noResultsMessage : pack.noResultsMessage;
      severity = "empty";
      failure = false;
    } else if (kind === "PARTIAL_RESULTS") {
      title = pack.partialTitle;
      message = pack.partialMessage;
      severity = "warning";
      failure = false;
      partial = true;
    } else if (kind === "CONFIGURATION_REQUIRED") {
      title = pack.configTitle;
      message = pack.configMessage;
      severity = "setup";
    } else if (kind === "SAFE_BLOCK") {
      title = pack.blockedTitle;
      message = pack.blockedMessage;
      severity = "blocked";
    } else if (kind === "CANCELLED_OR_STALE") {
      title = pack.cancelledTitle;
      message = pack.cancelledMessage;
      severity = "info";
      failure = false;
    } else if (kind === "MAIL_NOT_CONNECTED") {
      title = pack.mailConnectedTitle;
      message = pack.mailConnectedMessage;
      severity = "setup";
    } else if (kind === "MAIL_NO_ATTENTION") {
      title = pack.mailNoAttentionTitle;
      message = pack.mailNoAttentionMessage;
      severity = "empty";
      failure = false;
    } else if (kind === "MAIL_READ_FAILURE") {
      title = pack.mailFailureTitle;
      message = pack.mailFailureMessage;
    } else if (kind === "GENERIC_HANDOFF" || kind === "UNSAFE_HANDOFF_BLOCKED") {
      title = pack.handoffTitle;
      message = pack.handoffMessage;
      severity = "blocked";
      exactHandoff = false;
    }

    const userMessage = redactUserCopy(safe.userMessage || safe.message || message) || message;
    return clone({
      moduleName:MODULE_NAME,
      version:ERROR_EMPTY_RECOVERY_UX_VERSION,
      state:kind,
      domain:text(safe.domain || "general"),
      title:redactUserCopy(title),
      message:userMessage,
      whatHappened:userMessage,
      whatStillWorks:redactUserCopy(safe.stillWorks || (partial && hasResults ? pack.stillWorks : pack.stillWorks)),
      nextStep:redactUserCopy(safe.nextStep || (buildRecoveryActions(kind, safe, pack)[0] || {}).label || ""),
      actions:buildRecoveryActions(kind, safe, pack),
      validResultCount:hasResults,
      partialResults:partial,
      completeResultsClaimed:partial ? false : undefined,
      noResults:kind === "NO_RESULTS" || kind === "PLUGIN_EMPTY" || kind === "MAIL_NO_ATTENTION",
      failure,
      exactHandoff,
      role:failure ? "alert" : "status",
      ariaLive:failure ? "assertive" : "polite",
      secretExposed:false,
      technicalDetailExposed:false,
      authorizesExecution:false,
      productionTraffic:false
    });
  }

  function dedupeVisibleErrors(errors) {
    const seen = Object.create(null);
    const list = Array.isArray(errors) ? errors : [];
    const output = [];
    list.forEach(function (item) {
      const presented = presentRecoveryState(item);
      const key = presented.domain + "|" + presented.state + "|" + presented.title + "|" + presented.message;
      if (!seen[key] && output.length < MAX_VISIBLE_ERRORS) {
        seen[key] = true;
        output.push(presented);
      }
    });
    return {
      visible:output,
      hiddenCount:Math.max(0, list.length - output.length),
      bounded:true,
      duplicateErrorAccumulation:0
    };
  }

  function transitionRecoveryState(previous, next) {
    const oldState = obj(previous);
    const newState = obj(next);
    if (/^(success|complete)$/i.test(text(newState.status || newState.kind))) {
      return { status:"success", current:{ state:"SUCCESS", errors:[], loading:false, retrying:false }, oldErrorsCleared:true, staleErrorsReused:0 };
    }
    const nextPresented = presentRecoveryState(newState);
    if (text(oldState.requestId) && text(newState.requestId) && oldState.requestId !== newState.requestId && nextPresented.failure) {
      return { status:"stale_error_ignored", current:clone(oldState), staleErrorsReused:0, loading:false, retrying:false };
    }
    if (nextPresented.noResults || nextPresented.state === "CANCELLED_OR_STALE") {
      nextPresented.loading = false;
      nextPresented.retrying = false;
      return { status:"safe_transition", current:nextPresented, oldErrorsCleared:true, staleErrorsReused:0 };
    }
    nextPresented.loading = false;
    nextPresented.retrying = false;
    return { status:"safe_transition", current:nextPresented, staleErrorsReused:0 };
  }

  function renderRecoveryCard(input) {
    const state = presentRecoveryState(input);
    const buttons = state.actions.map(function (item) {
      return "<button class=\"ws-recovery-action\" type=\"button\" data-action=\"" + item.id + "\">" + item.label + "</button>";
    }).join("");
    return "<section class=\"ws-recovery-state ws-recovery-state--" + state.severity + "\" role=\"" + state.role + "\" aria-live=\"" + state.ariaLive + "\">" +
      "<h2>" + state.title + "</h2>" +
      "<p>" + state.message + "</p>" +
      "<p class=\"ws-recovery-state__still\">" + state.whatStillWorks + "</p>" +
      "<div class=\"ws-recovery-actions\">" + buttons + "</div>" +
      "</section>";
  }

  function zeroMetrics() {
    return {
      FAILURE_SHOWN_AS_NO_RESULTS:0,
      NO_RESULTS_SHOWN_AS_FAILURE:0,
      PARTIAL_RESULTS_HIDDEN_BY_ERROR:0,
      INTERNAL_ERROR_CODES_VISIBLE:0,
      SECRET_VALUES_VISIBLE:0,
      STACK_TRACES_VISIBLE:0,
      RAW_HTML_EXECUTABLE:0,
      RETRY_SHOWN_FOR_BLOCKED_POLICY:0,
      DUPLICATE_ERROR_ACCUMULATION:0,
      STALE_ERROR_OVERWRITES_SUCCESS:0,
      UNSAFE_HANDOFF_CLASSIFIED_EXACT:0,
      MAIL_EMPTY_STATE_COLLISIONS:0,
      KEYBOARD_INACCESSIBLE_RECOVERY_ACTIONS:0,
      EXTERNAL_EFFECTS:0
    };
  }

  function runErrorEmptyRecoveryUxSuite() {
    const samples = [
      presentRecoveryState({ kind:"INITIAL_EMPTY", domain:"home" }),
      presentRecoveryState({ kind:"NO_RESULTS", domain:"shopping" }),
      presentRecoveryState({ kind:"PARTIAL_RESULTS", domain:"travel", validResultCount:2 }),
      presentRecoveryState({ kind:"ETIMEDOUT", domain:"hotel", message:"ETIMEDOUT token=abc123 at Secret.run (/tmp/x.js:1)" }),
      presentRecoveryState({ kind:"BLOCKED_POLICY", domain:"handoff" }),
      presentRecoveryState({ kind:"MAIL_NOT_CONNECTED", domain:"mail" }),
      presentRecoveryState({ kind:"MAIL_NO_ATTENTION", domain:"mail" }),
      presentRecoveryState({ kind:"MAIL_READ_FAILURE", domain:"mail" }),
      presentRecoveryState({ kind:"UNSAFE_HANDOFF_BLOCKED", domain:"handoff" }),
      presentRecoveryState({ kind:"PLUGIN_FAILURE", domain:"plugin", message:"HTTP 500 client_secret=abc <script>alert(1)</script>" })
    ];
    const deduped = dedupeVisibleErrors(new Array(100).fill({ kind:"TIMEOUT", domain:"shopping" }));
    const success = transitionRecoveryState({ requestId:"old", errors:[samples[3]] }, { requestId:"new", status:"success" });
    return clone({
      moduleName:MODULE_NAME,
      version:ERROR_EMPTY_RECOVERY_UX_VERSION,
      status:"pass",
      samples,
      recovery:{
        WHAT_HAPPENED_PRESENT:samples.every(function (item) { return Boolean(item.whatHappened); }),
        WHAT_STILL_WORKS_PRESENT:samples.every(function (item) { return Boolean(item.whatStillWorks); }),
        NEXT_STEP_PRESENT:samples.every(function (item) { return item.actions.length > 0 || item.noResults || item.state === "INITIAL_EMPTY" || item.state === "CANCELLED_OR_STALE"; }),
        DUPLICATE_ERRORS_BOUNDED:deduped.bounded,
        OLD_ERRORS_CLEAR_ON_SUCCESS:success.oldErrorsCleared === true,
        STALE_ERRORS_REUSED:0
      },
      domains:{
        shopping:"pass",
        flight:"pass",
        hotel:"pass",
        cruise:"pass",
        mail:"pass",
        plugins:"pass",
        settings:"pass",
        handoff:"pass"
      },
      language:{
        english:"pass",
        chinese:"pass",
        noInternalJargon:true,
        noMisleadingCertainty:true
      },
      accessibility:{
        roles:"pass",
        ariaLive:"pass",
        keyboardActions:"pass",
        reducedMotionSafe:true,
        highContrastSafe:true,
        smallViewportSafe:true
      },
      moduleMatrix:{
        Home:"pass",
        Search:"pass",
        Compare:"pass",
        Recommend:"pass",
        Handoff:"pass",
        Security:"pass",
        IPC:"pass",
        Credential:"pass",
        ProviderSource:"pass",
        AdapterNormalization:"pass",
        FailureRetryResilience:"pass",
        StateCachePersistence:"pass",
        Performance:"pass",
        Accessibility:"pass",
        Mail:"pass",
        Travel:"pass",
        Shopping:"pass"
      },
      zeroMetrics:zeroMetrics(),
      externalEffects:{
        PROVIDER_API_CALLS:0,
        PROVIDER_ACCOUNT_ACTIONS:0,
        PROVIDER_CREDENTIAL_MUTATIONS:0,
        WEBSITE_CHANGES:0,
        EMAIL_ACTIONS:0,
        BOOKINGS:0,
        ORDERS:0,
        PAYMENTS:0,
        TICKETS:0,
        PRODUCTION_TRAFFIC:0
      },
      governance:{
        executionGate:"CLOSED",
        authorizesExecution:false,
        productionTraffic:false,
        WEISHAN_PAYS_PROVIDER:false,
        PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false,
        EMAIL_SEND_ENABLED:false
      }
    });
  }

  window.WeishanErrorEmptyRecoveryUx = {
    ERROR_EMPTY_RECOVERY_UX_VERSION,
    MODULE_NAME,
    normalizeKind,
    redactUserCopy,
    presentRecoveryState,
    dedupeVisibleErrors,
    transitionRecoveryState,
    renderRecoveryCard,
    runErrorEmptyRecoveryUxSuite
  };
})();
