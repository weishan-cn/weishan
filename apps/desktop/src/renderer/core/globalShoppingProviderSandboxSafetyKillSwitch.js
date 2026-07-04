;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_SANDBOX_SAFETY_KILL_SWITCH_VERSION = "4.2.6";
  const KILL_SWITCH_NAME = "global_shopping_provider_sandbox_safety_kill_switch_v1";
  const FORBIDDEN_COPY_RE = /全网最低|最低价保证|已锁价|可出票|一键下单|一键出票|直接下单|立即购买|真实最终价/i;
  const SECRET_VALUE_RE = /(?:sk|pk|live|prod)_[A-Za-z0-9_-]+|api[_-]?key\s*[:=]\s*["'][^"']+["']|token\s*[:=]\s*["'][^"']+["']|secret\s*[:=]\s*["'][^"']+["']/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|身份证|护照|银行卡|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function row(rowId, label, value, status) {
    return {
      rowId:text(rowId || "row"),
      label:text(label || ""),
      value:text(value || ""),
      status:/^(pass|blocked)$/.test(status) ? status : "blocked",
      redacted:true
    };
  }
  function safety(overrides) {
    return Object.assign({
      fileWrite:false,
      download:false,
      realNameStored:false,
      phoneStored:false,
      emailStored:false,
      identityUpload:false,
      credentialInput:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      redacted:true
    }, obj(overrides));
  }
  function hasUrl(value) { return typeof value === "string" && /^https?:\/\//i.test(value.trim()); }
  function hasSecretValue(value) {
    if (typeof value !== "string") return false;
    return SECRET_VALUE_RE.test(value);
  }
  function scanForbiddenCopy(input) {
    const safe = obj(input);
    const stack = [safe];
    while (stack.length) {
      const current = stack.pop();
      Object.keys(current).forEach(function (key) {
        const value = current[key];
        if (typeof value === "string" && FORBIDDEN_COPY_RE.test(value)) {
          stack.length = 0;
          current.__forbiddenCopyDetected = true;
        } else if (value && typeof value === "object") stack.push(value);
      });
    }
    return safe.__forbiddenCopyDetected === true;
  }

  function evaluateGlobalShoppingProviderSandboxSafetyKillSwitch(input) {
    const safe = obj(input);
    const state = {
      productionProviderDetected:safe.productionProviderDetected === true || safe.productionProviderEnabled === true || safe.realProviderEnabled === true,
      realApiKeyDetected:safe.realApiKeyDetected === true || safe.realApiKeyPresent === true || safe.productionKeyRead === true || hasSecretValue(safe.realApiKeyValue),
      networkCallDetected:safe.networkCallDetected === true || safe.networkEnabled === true || safe.canCallNetwork === true || safe.sendRequestNow === true,
      rawRequestPersistenceDetected:safe.rawRequestPersistenceDetected === true || safe.persistRawRequest === true || safe.rawRequestStored === true,
      rawResponsePersistenceDetected:safe.rawResponsePersistenceDetected === true || safe.persistRawResponse === true || safe.rawResponseStored === true,
      rendererRawLeakDetected:safe.rendererRawLeakDetected === true || safe.canExposeRawResponseToRenderer === true || safe.rendererRawLeak === true,
      transactionUrlDetected:hasUrl(safe.bookingUrl) || hasUrl(safe.checkoutUrl) || hasUrl(safe.paymentUrl) || hasUrl(safe.orderUrl) || safe.transactionUrlDetected === true,
      checkoutDetected:safe.checkoutDetected === true || safe.checkout === true || safe.canCheckout === true,
      paymentDetected:safe.paymentDetected === true || safe.payment === true || safe.canPay === true,
      orderDetected:safe.orderDetected === true || safe.order === true || safe.canSubmitOrder === true,
      ticketingDetected:safe.ticketingDetected === true || safe.ticketing === true || safe.canTicket === true || safe.canIssueTicket === true,
      identityCarryDetected:safe.identityCarryDetected === true || safe.userIdentityDetected === true || safe.realNamePresent === true || safe.phonePresent === true || safe.emailPresent === true,
      platformCredentialCarryDetected:safe.platformCredentialCarryDetected === true || safe.platformCredentialDetected === true || safe.platformAccountPresent === true || safe.platformPasswordPresent === true,
      paymentCredentialCarryDetected:safe.paymentCredentialCarryDetected === true || safe.paymentDataDetected === true || safe.cardPresent === true,
      fileWriteDetected:safe.fileWriteDetected === true || safe.fileWrite === true,
      downloadDetected:safe.downloadDetected === true || safe.download === true,
      externalOpenDetected:safe.externalOpenDetected === true || safe.openExternal === true || safe.autoOpen === true,
      windowOpenDetected:safe.windowOpenDetected === true || safe.windowOpen === true,
      forbiddenCopyDetected:safe.forbiddenCopyDetected === true || scanForbiddenCopy(safe)
    };
    const blockedReasons = Object.keys(state).filter(function (key) { return state[key] === true; }).map(text);
    return clone({
      killSwitchState:state,
      blockedReasons:blockedReasons,
      status:blockedReasons.length ? "blocked" : "clear",
      redacted:true
    });
  }

  function buildGlobalShoppingProviderSandboxSafetyRows(input) {
    const evaluation = evaluateGlobalShoppingProviderSandboxSafetyKillSwitch(input || {});
    const state = evaluation.killSwitchState;
    return clone([
      row("production_provider", "真实 Provider", state.productionProviderDetected ? "已触发阻断" : "未触发", state.productionProviderDetected ? "blocked" : "pass"),
      row("api_key", "真实密钥", state.realApiKeyDetected ? "已触发阻断" : "未触发", state.realApiKeyDetected ? "blocked" : "pass"),
      row("network", "网络调用", state.networkCallDetected ? "已触发阻断" : "未触发", state.networkCallDetected ? "blocked" : "pass"),
      row("raw_storage", "Raw 请求/响应持久化", state.rawRequestPersistenceDetected || state.rawResponsePersistenceDetected ? "已触发阻断" : "未触发", state.rawRequestPersistenceDetected || state.rawResponsePersistenceDetected ? "blocked" : "pass"),
      row("renderer_leak", "Renderer 原始响应泄露", state.rendererRawLeakDetected ? "已触发阻断" : "未触发", state.rendererRawLeakDetected ? "blocked" : "pass"),
      row("transaction", "交易/跳转链接", state.transactionUrlDetected || state.checkoutDetected || state.paymentDetected || state.orderDetected || state.ticketingDetected ? "已触发阻断" : "未触发", state.transactionUrlDetected || state.checkoutDetected || state.paymentDetected || state.orderDetected || state.ticketingDetected ? "blocked" : "pass"),
      row("identity_credential", "身份/平台/支付凭据", state.identityCarryDetected || state.platformCredentialCarryDetected || state.paymentCredentialCarryDetected ? "已触发阻断" : "未触发", state.identityCarryDetected || state.platformCredentialCarryDetected || state.paymentCredentialCarryDetected ? "blocked" : "pass"),
      row("io_open", "写文件/下载/外部打开", state.fileWriteDetected || state.downloadDetected || state.externalOpenDetected || state.windowOpenDetected ? "已触发阻断" : "未触发", state.fileWriteDetected || state.downloadDetected || state.externalOpenDetected || state.windowOpenDetected ? "blocked" : "pass"),
      row("copy", "禁用承诺文案", state.forbiddenCopyDetected ? "已触发阻断" : "未触发", state.forbiddenCopyDetected ? "blocked" : "pass")
    ]);
  }

  function sanitizeGlobalShoppingProviderSandboxSafetyKillSwitch(killSwitch) {
    const safe = obj(killSwitch);
    const evaluation = evaluateGlobalShoppingProviderSandboxSafetyKillSwitch(safe);
    const status = /^(clear|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      killSwitchName:KILL_SWITCH_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_SAFETY_KILL_SWITCH_VERSION,
      status:status,
      killSwitchState:clone(evaluation.killSwitchState),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons).map(text) : evaluation.blockedReasons,
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingProviderSandboxSafetyRows(safe),
      userFacingSummary:{
        title:"Provider Sandbox 安全熔断器",
        resultLabel:status === "clear" ? "安全熔断器未触发" : "安全熔断器已阻断",
        caveat:"任何真实 provider、密钥、网络调用、raw response、交易链接、付款、下单、出票或外部打开迹象都会被阻断。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingProviderSandboxSafetyKillSwitch(input) {
    try {
      return sanitizeGlobalShoppingProviderSandboxSafetyKillSwitch(input || {});
    } catch (error) {
      return sanitizeGlobalShoppingProviderSandboxSafetyKillSwitch({ status:"failed_safe" });
    }
  }

  function buildGlobalShoppingProviderSandboxSafetyKillSwitchAuditDraft(input) {
    const killSwitch = buildGlobalShoppingProviderSandboxSafetyKillSwitch(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_PROVIDER_SANDBOX_SAFETY_KILL_SWITCH_AUDIT_DRAFT",
      killSwitchName:KILL_SWITCH_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_SANDBOX_SAFETY_KILL_SWITCH_VERSION,
      status:killSwitch.status,
      blockedReasons:killSwitch.blockedReasons,
      rowCount:killSwitch.rows.length,
      bookingUrl:null,
      checkoutUrl:null,
      paymentUrl:null,
      orderUrl:null,
      payment:false,
      order:false,
      ticketing:false,
      autoOpen:false,
      autoRefresh:false,
      fileWrite:false,
      download:false,
      rawUserTextStored:false,
      rawResponseStored:false,
      secretStored:false,
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderSandboxSafetyKillSwitch = {
    GLOBAL_SHOPPING_PROVIDER_SANDBOX_SAFETY_KILL_SWITCH_VERSION,
    KILL_SWITCH_NAME,
    buildGlobalShoppingProviderSandboxSafetyKillSwitch,
    evaluateGlobalShoppingProviderSandboxSafetyKillSwitch,
    buildGlobalShoppingProviderSandboxSafetyRows,
    buildGlobalShoppingProviderSandboxSafetyKillSwitchAuditDraft,
    sanitizeGlobalShoppingProviderSandboxSafetyKillSwitch
  };
})();
