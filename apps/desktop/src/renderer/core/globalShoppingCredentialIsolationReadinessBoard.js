;(function () {
  "use strict";

  const GLOBAL_SHOPPING_CREDENTIAL_ISOLATION_READINESS_BOARD_VERSION = "2.3.0";
  const BOARD_NAME = "global_shopping_credential_isolation_readiness_board_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|rawResponse|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function requirement(requirementId, label, status, summary, caveat) {
    return {
      requirementId:text(requirementId),
      label:text(label),
      status:/^(pass|warning|blocked|needs_review)$/.test(status) ? status : "needs_review",
      requiredBeforeRealSandbox:true,
      summary:text(summary),
      caveat:text(caveat),
      redacted:true
    };
  }
  function row(rowId, label, value, status) {
    return { rowId:text(rowId), label:text(label), value:text(value), status:/^(pass|warning|blocked)$/.test(status) ? status : "warning", redacted:true };
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

  function buildGlobalShoppingCredentialIsolationRequirements(input) {
    const safe = obj(input);
    return clone([
      requirement("no_renderer_exposure", "provider key 不进入 renderer", safe.exposeCredentialToRenderer === true ? "blocked" : "pass", "未来密钥读取必须留在安全后端或系统安全存储层。", "当前 UI 不应出现真实凭证内容。"),
      requirement("no_browser_storage", "provider key 不进入浏览器存储", safe.persistCredentialInBrowserStorage === true ? "blocked" : "pass", "localStorage / sessionStorage 中不得保留 provider 凭证。", "当前阶段不创建任何凭证存储逻辑。"),
      requirement("no_logging", "provider key 不进入日志", safe.logCredential === true ? "blocked" : "pass", "日志与审计输出必须保持脱敏。", "不得输出 token / key / secret。"),
      requirement("no_export", "provider key 不进入导出包", safe.exportCredential === true ? "blocked" : "pass", "导出、下载、交接包都不得包含 provider 凭证。", "当前阶段不生成导出文件。"),
      requirement("no_fixture", "provider key 不进入测试 fixture", safe.credentialInFixture === true ? "blocked" : "pass", "fixture 与测试样本必须保持无真实凭证。", "只允许使用占位或 redacted 文本。"),
      requirement("no_git_commit", "provider key 不进入 git", safe.commitCredential === true ? "blocked" : "pass", "真实凭证不得进入仓库与版本记录。", "当前阶段不引入任何凭证文件。"),
      requirement("secure_storage_future_only", "未来只允许安全后端 / 系统安全存储读取", safe.readRealApiKey === true ? "blocked" : "pass", "本轮只检查隔离前置条件，不读取真实密钥。", "任何未来读取都需在额外审批后进行。"),
      requirement("no_input_ui", "当前 UI 不暴露 key 输入框", safe.showCredentialInput === true ? "blocked" : "pass", "当前只读规划阶段不展示任何密钥输入入口。", "不新增 key 输入框。"),
      requirement("production_disabled", "当前不启用 production provider", safe.enableProductionProvider === true ? "blocked" : "pass", "production provider 默认 disabled。", "只读规划不代表可启用 provider。")
    ]);
  }

  function evaluateGlobalShoppingCredentialIsolationReadiness(input) {
    const safe = obj(input);
    const requirements = safe.omitCredentialRequirements === true ? [] : buildGlobalShoppingCredentialIsolationRequirements(safe);
    const credentialHealth = {
      noApiKeyRead:safe.readRealApiKey !== true,
      noCredentialStorage:safe.storeCredential !== true,
      noRendererExposure:safe.exposeCredentialToRenderer !== true,
      noBrowserStorage:safe.persistCredentialInBrowserStorage !== true,
      noCredentialLogging:safe.logCredential !== true,
      noCredentialExport:safe.exportCredential !== true,
      noCredentialCommit:safe.commitCredential !== true,
      noCredentialInputUi:safe.showCredentialInput !== true,
      noProductionProviderEnablement:safe.enableProductionProvider !== true,
      secretPersistenceGuardPass:safe.secretPersistenceGuardPass !== false
    };
    const blocked =
      safe.readRealApiKey === true ||
      safe.storeCredential === true ||
      safe.exposeCredentialToRenderer === true ||
      safe.persistCredentialInBrowserStorage === true ||
      safe.logCredential === true ||
      safe.exportCredential === true ||
      safe.commitCredential === true ||
      safe.showCredentialInput === true ||
      safe.enableProductionProvider === true ||
      safe.secretPersistenceGuardPass === false;
    const needsReview = requirements.length === 0;
    return clone({
      status:blocked ? "blocked" : (needsReview ? "needs_review" : "ready"),
      credentialRequirements:requirements,
      credentialHealth:credentialHealth,
      blockedReasons:blocked ? [
        safe.readRealApiKey === true ? "api_key_read_detected" : "",
        safe.storeCredential === true ? "credential_storage_detected" : "",
        safe.exposeCredentialToRenderer === true ? "renderer_exposure_detected" : "",
        safe.persistCredentialInBrowserStorage === true ? "browser_storage_detected" : "",
        safe.logCredential === true ? "credential_logging_detected" : "",
        safe.exportCredential === true ? "credential_export_detected" : "",
        safe.commitCredential === true ? "credential_commit_detected" : "",
        safe.showCredentialInput === true ? "credential_input_ui_detected" : "",
        safe.enableProductionProvider === true ? "production_provider_enablement_detected" : "",
        safe.secretPersistenceGuardPass === false ? "secret_persistence_guard_failed" : ""
      ].filter(Boolean) : [],
      redacted:true
    });
  }

  function buildGlobalShoppingCredentialIsolationRows(input) {
    const evaluation = evaluateGlobalShoppingCredentialIsolationReadiness(input);
    return evaluation.credentialRequirements.map(function (item) {
      return row(item.requirementId, item.label, item.summary, item.status === "blocked" ? "blocked" : (item.status === "pass" ? "pass" : "warning"));
    });
  }

  function buildGlobalShoppingCredentialIsolationReadinessBoardAuditDraft(input) {
    const board = buildGlobalShoppingCredentialIsolationReadinessBoard(input || {});
    return clone({
      eventType:"GLOBAL_SHOPPING_CREDENTIAL_ISOLATION_READINESS_BOARD_AUDIT_DRAFT",
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_CREDENTIAL_ISOLATION_READINESS_BOARD_VERSION,
      status:board.status,
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

  function sanitizeGlobalShoppingCredentialIsolationReadinessBoard(board) {
    const safe = obj(board);
    const evaluation = evaluateGlobalShoppingCredentialIsolationReadiness(safe);
    const status = /^(ready|needs_review|blocked|failed_safe)$/.test(text(safe.status)) ? text(safe.status) : evaluation.status;
    return clone({
      boardName:BOARD_NAME,
      appVersion:GLOBAL_SHOPPING_CREDENTIAL_ISOLATION_READINESS_BOARD_VERSION,
      status:status,
      credentialBoundary:{
        boardId:text(safe.boardId || "global-shopping-credential-isolation-readiness-board"),
        boardMode:/^(disabled|readiness_only|planning_only|sandbox_ready)$/.test(text(safe.boardMode)) ? text(safe.boardMode) : "readiness_only",
        readinessOnly:true,
        planningOnly:true,
        readOnly:true,
        sandboxOnly:true,
        productionDisabled:true,
        canReadRealApiKey:false,
        canStoreCredential:false,
        canExposeCredentialToRenderer:false,
        canPersistCredentialInBrowserStorage:false,
        canLogCredential:false,
        canExportCredential:false,
        canCommitCredential:false,
        canShowCredentialInput:false,
        canEnableProductionProvider:false
      },
      credentialRequirements:toArray(safe.credentialRequirements).length ? toArray(safe.credentialRequirements) : evaluation.credentialRequirements,
      credentialHealth:clone(evaluation.credentialHealth),
      rows:toArray(safe.rows).length ? toArray(safe.rows) : buildGlobalShoppingCredentialIsolationRows(safe),
      blockedReasons:toArray(safe.blockedReasons).length ? toArray(safe.blockedReasons) : evaluation.blockedReasons,
      userFacingSummary:{
        title:"凭证隔离准备度",
        resultLabel:status === "ready" ? "凭证隔离准备度已通过" : (status === "blocked" ? "凭证隔离已阻断" : "凭证隔离仍需复核"),
        caveat:"当前只检查凭证隔离前置要求，不读取、不输入、不保存、不显示任何真实 provider 密钥。",
        redacted:true
      },
      safety:safety(safe.safety),
      redacted:true
    });
  }

  function buildGlobalShoppingCredentialIsolationReadinessBoard(input) {
    try {
      return sanitizeGlobalShoppingCredentialIsolationReadinessBoard(input || {});
    } catch (_) {
      return sanitizeGlobalShoppingCredentialIsolationReadinessBoard({ status:"failed_safe" });
    }
  }

  window.WeishanGlobalShoppingCredentialIsolationReadinessBoard = {
    GLOBAL_SHOPPING_CREDENTIAL_ISOLATION_READINESS_BOARD_VERSION,
    BOARD_NAME,
    buildGlobalShoppingCredentialIsolationReadinessBoard,
    evaluateGlobalShoppingCredentialIsolationReadiness,
    buildGlobalShoppingCredentialIsolationRows,
    buildGlobalShoppingCredentialIsolationRequirements,
    buildGlobalShoppingCredentialIsolationReadinessBoardAuditDraft,
    sanitizeGlobalShoppingCredentialIsolationReadinessBoard
  };
})();
