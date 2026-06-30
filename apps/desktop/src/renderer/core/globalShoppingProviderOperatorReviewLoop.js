;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_OPERATOR_REVIEW_LOOP_VERSION = "2.3.7";
  const REVIEW_LOOP_NAME = "global_shopping_provider_operator_review_loop_v1";

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function toArray(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) {
    return String(value == null ? "" : value)
      .replace(/https?:\/\/\S+|token|apiKey|key|secret|password|credential|bookingUrl|checkoutUrl|paymentUrl|orderUrl|endpoint|rawResponse|rawRequest|rawUserText|platformAccount|platformPassword|passport|cardNumber/ig, "redacted")
      .trim();
  }
  function resolveSummary(input) {
    const safe = obj(input);
    if (Object.keys(obj(safe.providerGovernanceConsoleSummary)).length) return obj(safe.providerGovernanceConsoleSummary);
    const api = window.WeishanGlobalShoppingProviderGovernanceConsole || {};
    return typeof api.buildGlobalShoppingProviderGovernanceConsole === "function"
      ? obj(api.buildGlobalShoppingProviderGovernanceConsole(safe))
      : {};
  }

  function buildGlobalShoppingProviderOperatorReviewLoop(input) {
    try {
      const safe = obj(input);
      const consoleSummary = resolveSummary(safe);
      const status = text(consoleSummary.consoleStatus || consoleSummary.status || "needs_review");
      const missingEvidence = toArray(consoleSummary.missingEvidence).map(text);
      const blockedActions = toArray(consoleSummary.blockedActions).map(text);
      const allowedNextActions = toArray(consoleSummary.allowedNextActions).map(text);
      const shouldTriggerKillSwitch = status === "blocked" && toArray(consoleSummary.riskReasons).some(function (reason) {
        return /real_provider|network|endpoint|external|booking|payment|order|checkout/.test(reason);
      });
      const mustPause = status === "blocked" || status === "needs_evidence";
      const canContinue = status === "sandbox_ready" || status === "ready_for_human_approval";
      const reviewStatus = /^(blocked|needs_evidence|needs_review|ready_for_human_approval|sandbox_ready)$/.test(status) ? status : "needs_review";

      return clone({
        reviewLoopName:REVIEW_LOOP_NAME,
        appVersion:GLOBAL_SHOPPING_PROVIDER_OPERATOR_REVIEW_LOOP_VERSION,
        status:reviewStatus,
        currentCanContinue:canContinue,
        missingEvidence:missingEvidence,
        blockedActions:blockedActions,
        allowedNextActions:allowedNextActions,
        shouldTriggerKillSwitch:shouldTriggerKillSwitch,
        allowContinueSandboxPilot:status === "sandbox_ready",
        mustPause:mustPause,
        userFacingSummary:{
          title:"Operator Review Loop",
          resultLabel:status === "blocked" ? "当前不能继续" :
            (status === "needs_evidence" ? "仍需补充证据" :
              (status === "ready_for_human_approval" ? "等待人工最终确认" :
                (status === "sandbox_ready" ? "可以继续 sandbox 复核" : "仍需人工复核"))),
          line:status === "blocked" ? "当前必须暂停，并复核已阻断动作。" :
            (status === "needs_evidence" ? "当前先补齐证据，再继续人工复核。" :
              (status === "ready_for_human_approval" ? "当前只差人工最终确认，不会自动继续。" :
                (status === "sandbox_ready" ? "当前只允许继续 sandbox / mock / human-controlled 复核。" : "当前请继续人工复核清单。"))),
          redacted:true
        },
        operatorSummary:{
          title:"运营复核摘要",
          missingEvidence:missingEvidence,
          blockedActions:blockedActions,
          nextReviewItems:allowedNextActions,
          shouldTriggerKillSwitch:shouldTriggerKillSwitch,
          mustPause:mustPause,
          redacted:true
        },
        technicalSummary:{
          title:"provider operator review technical summary",
          consoleStatus:status,
          currentCanContinue:canContinue,
          allowContinueSandboxPilot:status === "sandbox_ready",
          mustPause:mustPause,
          riskReasons:toArray(consoleSummary.riskReasons).map(text),
          auditTrailLine:text(obj(consoleSummary.auditTrailSummary).line || ""),
          redacted:true
        },
        redacted:true
      });
    } catch (_) {
      return {
        reviewLoopName:REVIEW_LOOP_NAME,
        appVersion:GLOBAL_SHOPPING_PROVIDER_OPERATOR_REVIEW_LOOP_VERSION,
        status:"failed_safe",
        currentCanContinue:false,
        missingEvidence:["review_loop_failed_safe"],
        blockedActions:["provider_pilot"],
        allowedNextActions:["pause_and_review_controls"],
        shouldTriggerKillSwitch:false,
        allowContinueSandboxPilot:false,
        mustPause:true,
        userFacingSummary:{ title:"Operator Review Loop", resultLabel:"仍需人工复核", line:"当前只展示只读复核状态。", redacted:true },
        operatorSummary:{ title:"运营复核摘要", missingEvidence:["review_loop_failed_safe"], blockedActions:["provider_pilot"], nextReviewItems:["pause_and_review_controls"], shouldTriggerKillSwitch:false, mustPause:true, redacted:true },
        technicalSummary:{ title:"provider operator review technical summary", consoleStatus:"failed_safe", currentCanContinue:false, allowContinueSandboxPilot:false, mustPause:true, riskReasons:["review_loop_failed_safe"], auditTrailLine:"", redacted:true },
        redacted:true
      };
    }
  }

  window.WeishanGlobalShoppingProviderOperatorReviewLoop = {
    GLOBAL_SHOPPING_PROVIDER_OPERATOR_REVIEW_LOOP_VERSION,
    REVIEW_LOOP_NAME,
    buildGlobalShoppingProviderOperatorReviewLoop
  };
})();
