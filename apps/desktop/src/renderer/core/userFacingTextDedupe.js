(function(){
  const USER_FACING_TEXT_DEDUPE_VERSION = "2.1.57";
  const INTERNAL_DEBUG_LABEL_RE = /Cheapest Truth Guard|not_ranked_as_real_cheapest|canClaimCheapest|canParticipateInCheapestRanking|guardName|internal enum|rollbackDecision JSON|audit draft|raw schema|raw provider payload/;
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function count(textValue, pattern){ const match = text(textValue).match(pattern); return match ? match.length : 0; }
  function auditUserFacingText(input){
    const value = text(input);
    return clone({
      textDedupeVersion:USER_FACING_TEXT_DEDUPE_VERSION,
      safetyHintCount:count(value, /weishan 只做搜索和比较，不收款、不下单/g),
      noProductionPriceCount:count(value, /暂无生产真实最低价/g),
      notRealCheapestCount:count(value, /不代表真实最低价/g),
      finalPageCount:count(value, /最终以平台页面为准/g),
      longExternalSearchHintCollapsed:!/外部搜索提示：点击后会打开外部搜索/.test(value),
      internalDebugLabelVisibleCount:INTERNAL_DEBUG_LABEL_RE.test(value) ? 1 : 0,
      redacted:true
    });
  }
  function assertUserFacingTextDedupeSafe(input){
    const audit = auditUserFacingText(input);
    if (audit.safetyHintCount > 1) throw new Error("safety hint repeated");
    if (audit.noProductionPriceCount > 1) throw new Error("no production price repeated");
    if (audit.notRealCheapestCount > 2) throw new Error("not real cheapest repeated");
    if (audit.finalPageCount > 2) throw new Error("final page disclaimer repeated");
    if (audit.internalDebugLabelVisibleCount !== 0) throw new Error("internal debug label visible");
    return true;
  }
  window.WeishanUserFacingTextDedupe = { USER_FACING_TEXT_DEDUPE_VERSION, auditUserFacingText, assertUserFacingTextDedupeSafe };
})();
