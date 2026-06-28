;(function () {
  "use strict";

  const FLIGHT_WORKFLOW_USER_SAFETY_COPY_REGISTRY_VERSION = "2.1.90";
  const REGISTRY_NAME = "flight_workflow_user_safety_copy_registry_v1";
  const REQUIRED_COPY_IDS = [
    "read_only_price_notice",
    "platform_final_notice",
    "no_payment_order_ticketing_notice",
    "no_identity_upload_notice",
    "provider_confirmation_notice",
    "platform_check_difference_notice",
    "evidence_only_notice",
    "restricted_category_blocked_notice",
    "sensitive_input_blocked_notice",
    "export_preview_notice",
    "scenario_simulation_notice",
    "safety_matrix_notice",
    "release_readiness_notice"
  ];
  const FORBIDDEN_CLAIMS = ["全网最低", "最低价保证", "已锁价", "可出票", "真实最终价", "立即购买", "直接下单", "一键出票"];
  const SENSITIVE_TEXT_RE = /https?:\/\/\S+|token|apiKey|secret|password|身份证号|护照号|银行卡号|credential|passport|cardNumber/ig;
  const SENSITIVE_NAME_RE = /(bookingUrl|checkoutUrl|paymentUrl|orderUrl|token|apiKey|key|secret|password|credential|rawProviderResponse|rawResponse|rawUserText)/i;

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function safeText(value) { return text(value).replace(SENSITIVE_TEXT_RE, "redacted"); }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function safety() { return { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, autoOpen:false, autoRefresh:false, payment:false, order:false, ticketing:false, identityUpload:false, credentialInput:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true }; }
  function safeObject(value) {
    if (Array.isArray(value)) return value.map(safeObject);
    if (!value || typeof value !== "object") return typeof value === "string" ? safeText(value) : value;
    const result = {};
    Object.keys(value).forEach(function (name) {
      if (SENSITIVE_NAME_RE.test(name)) return;
      result[name] = safeObject(value[name]);
    });
    return result;
  }
  function copyDefinitions() {
    return {
      read_only_price_notice: { copyId:"read_only_price_notice", title:"只读候选价", body:"当前仍是只读候选证据流程。价格、库存、税费和规则以平台页面为准。", severity:"info" },
      platform_final_notice: { copyId:"platform_final_notice", title:"平台页面为准", body:"平台页面是最终确认来源；本地摘要仅帮助人工核对。", severity:"info" },
      no_payment_order_ticketing_notice: { copyId:"no_payment_order_ticketing_notice", title:"交易能力关闭", body:"唯珊不会付款、不会下单、不会出票。", severity:"blocked" },
      no_identity_upload_notice: { copyId:"no_identity_upload_notice", title:"身份资料不上传", body:"唯珊不会上传证件、银行卡或登录凭据。", severity:"blocked" },
      provider_confirmation_notice: { copyId:"provider_confirmation_notice", title:"平台确认需人工完成", body:"如需继续，请由用户在平台页面手动核对，不会自动打开交易页。", severity:"warning" },
      platform_check_difference_notice: { copyId:"platform_check_difference_notice", title:"平台核对差异", body:"若平台页面与候选证据不同，以平台页面为准，并重新复核。", severity:"warning" },
      evidence_only_notice: { copyId:"evidence_only_notice", title:"仅为候选证据", body:"本结果不代表真实票价、库存或可出票。", severity:"info" },
      restricted_category_blocked_notice: { copyId:"restricted_category_blocked_notice", title:"受限请求已阻断", body:"该请求涉及受限能力，当前仅显示安全阻断说明。", severity:"blocked" },
      sensitive_input_blocked_notice: { copyId:"sensitive_input_blocked_notice", title:"敏感输入已阻断", body:"请勿输入证件、银行卡、登录凭据或密钥；相关内容不会显示或保存。", severity:"blocked" },
      export_preview_notice: { copyId:"export_preview_notice", title:"脱敏预览", body:"预览仅展示脱敏摘要，不写文件、不下载、不包含原始响应。", severity:"info" },
      scenario_simulation_notice: { copyId:"scenario_simulation_notice", title:"场景模拟", body:"场景模拟仅用于安全回归，不代表真实票价、库存或可出票。", severity:"info" },
      safety_matrix_notice: { copyId:"safety_matrix_notice", title:"安全矩阵", body:"安全矩阵只检查本地只读流程，不请求真实 provider。", severity:"info" },
      release_readiness_notice: { copyId:"release_readiness_notice", title:"发布就绪", body:"机票工作流发布就绪总览用于只读 Beta 验收；核心安全红线仍保持关闭。", severity:"info" }
    };
  }
  function positiveForbiddenClaims(value) {
    const source = text(value);
    return FORBIDDEN_CLAIMS.filter(function (claim) {
      const idx = source.indexOf(claim);
      if (idx < 0) return false;
      const prefix = source.slice(Math.max(0, idx - 24), idx);
      if (/不代表|不会|不得|不能|不可|未|不声称|不保证/.test(prefix)) return false;
      return true;
    });
  }
  function scanCopySet(copySet) {
    const failures = [];
    const list = toArray(copySet && copySet.copies || copySet);
    list.forEach(function (copy) {
      const item = copy && typeof copy === "object" ? copy : { body:copy };
      const content = [item.title, item.body, item.helper, item.caveat].map(text).join(" ");
      positiveForbiddenClaims(content).forEach(function (claim) { failures.push({ copyId:safeText(item.copyId || "unknown"), claim:claim, reason:"forbidden_positive_claim", redacted:true }); });
      if (SENSITIVE_TEXT_RE.test(content)) failures.push({ copyId:safeText(item.copyId || "unknown"), claim:"sensitive_text", reason:"sensitive_text", redacted:true });
    });
    return failures;
  }
  function getFlightWorkflowSafetyCopy(copyId, context) {
    const safeContext = context && typeof context === "object" ? context : {};
    const defs = copyDefinitions();
    const id = text(copyId || "evidence_only_notice");
    const copy = clone(defs[id] || defs.evidence_only_notice);
    copy.appVersion = FLIGHT_WORKFLOW_USER_SAFETY_COPY_REGISTRY_VERSION;
    copy.contextLabel = safeText(safeContext.contextLabel || safeContext.status || "");
    copy.safety = safety();
    copy.redacted = true;
    return clone(copy);
  }
  function buildFlightWorkflowSafetyCopySet(context) {
    const safeContext = context && typeof context === "object" ? safeObject(context) : {};
    const copies = REQUIRED_COPY_IDS.map(function (copyId) { return getFlightWorkflowSafetyCopy(copyId, safeContext); });
    const validation = validateFlightWorkflowSafetyCopySet({ copies:copies });
    return clone({ copySetName:"flight_workflow_safety_copy_set_v1", appVersion:FLIGHT_WORKFLOW_USER_SAFETY_COPY_REGISTRY_VERSION, status:validation.status, copyIds:REQUIRED_COPY_IDS.slice(), copies:copies, copyValidationStatus:validation.status, forbiddenClaimFailures:validation.forbiddenClaimFailures, safety:safety(), redacted:true });
  }
  function validateFlightWorkflowSafetyCopySet(copySet) {
    const safe = copySet && typeof copySet === "object" ? copySet : {};
    const list = toArray(safe.copies || safe.copySet || safe);
    const ids = list.map(function (item) { return text(item && item.copyId || ""); }).filter(Boolean);
    const missingCopyIds = REQUIRED_COPY_IDS.filter(function (copyId) { return ids.indexOf(copyId) < 0; });
    const forbiddenClaimFailures = scanCopySet({ copies:list });
    const status = missingCopyIds.length || forbiddenClaimFailures.length ? "blocked" : "pass";
    return clone({ registryName:REGISTRY_NAME, appVersion:FLIGHT_WORKFLOW_USER_SAFETY_COPY_REGISTRY_VERSION, status:status, valid:status === "pass", missingCopyIds:missingCopyIds, requiredCopyIds:REQUIRED_COPY_IDS.slice(), forbiddenClaimFailures:forbiddenClaimFailures, copyCount:list.length, safety:safety(), redacted:true });
  }
  function buildFlightWorkflowUserSafetyCopyRegistry(input) {
    const safe = input && typeof input === "object" ? safeObject(input) : {};
    const copySet = buildFlightWorkflowSafetyCopySet(safe);
    return clone({ registryName:REGISTRY_NAME, appVersion:FLIGHT_WORKFLOW_USER_SAFETY_COPY_REGISTRY_VERSION, status:copySet.status, requiredCopyIds:REQUIRED_COPY_IDS.slice(), forbiddenClaims:FORBIDDEN_CLAIMS.slice(), copySet:copySet, userSafetyCopySummary:{ title:"安全文案已统一", status:copySet.status, copyCount:copySet.copies.length, redacted:true }, forbiddenCapabilitySummary:{ title:"仍被禁止的能力", forbiddenCapabilities:["付款", "下单", "出票", "证件银行卡上传", "自动打开交易页", "真实 provider 请求", "写文件或下载"], redacted:true }, copyValidationStatus:copySet.copyValidationStatus, safety:safety(), redacted:true });
  }
  function buildFlightWorkflowUserSafetyCopyRegistryAuditDraft(input) {
    const registry = buildFlightWorkflowUserSafetyCopyRegistry(input || {});
    return clone({ eventType:"FLIGHT_WORKFLOW_USER_SAFETY_COPY_REGISTRY_AUDIT_DRAFT", registryName:REGISTRY_NAME, appVersion:FLIGHT_WORKFLOW_USER_SAFETY_COPY_REGISTRY_VERSION, status:registry.status, copyCount:registry.copySet.copies.length, missingCopyIds:registry.copySet.missingCopyIds || [], forbiddenFailureCount:registry.copySet.forbiddenClaimFailures.length, bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, ticketing:false, identityUpload:false, rawResponseStored:false, rawUserTextStored:false, secretStored:false, fileWrite:false, download:false, redacted:true });
  }

  window.WeishanFlightWorkflowUserSafetyCopyRegistry = { FLIGHT_WORKFLOW_USER_SAFETY_COPY_REGISTRY_VERSION, REGISTRY_NAME, REQUIRED_COPY_IDS, FORBIDDEN_CLAIMS, buildFlightWorkflowUserSafetyCopyRegistry, getFlightWorkflowSafetyCopy, buildFlightWorkflowSafetyCopySet, validateFlightWorkflowSafetyCopySet, buildFlightWorkflowUserSafetyCopyRegistryAuditDraft };
})();
