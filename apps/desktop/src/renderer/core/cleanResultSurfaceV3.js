(function(){
  const CLEAN_RESULT_SURFACE_V3_VERSION = "4.2.7";
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value){ return String(value == null ? "" : value).trim(); }
  function list(value){ return Array.isArray(value) ? value.filter(Boolean) : []; }
  function buildCleanResultSurfaceV3(input){
    const safe = input && typeof input === "object" ? input : {};
    const cards = list(safe.cards).slice(0, 3);
    const visualCards = cards.map((card) => window.WeishanResultCardVisualFormatter && window.WeishanResultCardVisualFormatter.buildResultCardVisualModel ? window.WeishanResultCardVisualFormatter.buildResultCardVisualModel({ card, fareBreakdown:card.fareBreakdown, sortIntent:safe.sortIntent, procurementCategory:safe.procurementCategory || "flight" }) : card);
    const restricted = safe.restricted === true || safe.surfaceMode === "blocked";
    const audit = buildCleanResultSurfaceV3AuditDraft({ resultCardCount:restricted ? 0 : visualCards.length, manualVerificationGroupEnabled:!restricted, duplicateSafetyHintCount:0, internalDebugLabelVisibleCount:0 });
    return clone({
      surfaceVersion:"v3",
      moduleVersion:CLEAN_RESULT_SURFACE_V3_VERSION,
      compactCardsEnabled:true,
      longExternalSearchHintCollapsed:true,
      manualVerificationGroupEnabled:!restricted,
      debugPanelsHiddenByDefault:true,
      visualCards:restricted ? [] : visualCards,
      resultCardCount:restricted ? 0 : visualCards.length,
      maxResultCardCount:3,
      statusMessage:restricted ? "安全阻断" : text(safe.statusMessage || "暂无生产真实最低价"),
      safetyLine:"weishan 只做搜索和比较，不收款、不下单。最终价格、库存、税费、行李和退改签以平台页面为准。",
      audit,
      redacted:true
    });
  }
  function buildCleanResultSurfaceV3AuditDraft(input){
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      eventType:"CLEAN_RESULT_SURFACE_V3_DRAFT",
      surfaceVersion:"v3",
      compactCardsEnabled:true,
      manualVerificationGroupEnabled:safe.manualVerificationGroupEnabled !== false,
      longExternalSearchHintCollapsed:true,
      duplicateSafetyHintCount:Number(safe.duplicateSafetyHintCount || 0),
      internalDebugLabelVisibleCount:Number(safe.internalDebugLabelVisibleCount || 0),
      resultCardCount:Number(safe.resultCardCount || 0),
      maxResultCardCount:3,
      bookingUrlDisplayedCount:0,
      paymentActionDisplayedCount:0,
      orderActionDisplayedCount:0,
      identityUploadDisplayedCount:0,
      redacted:true
    });
  }
  function assertCleanResultSurfaceV3Safe(surface){
    const value = surface || buildCleanResultSurfaceV3({});
    if (value.resultCardCount > 3) throw new Error("clean result surface v3 must show at most 3 cards");
    if (value.debugPanelsHiddenByDefault !== true) throw new Error("debug panels must remain hidden by default");
    if (!value.audit || value.audit.redacted !== true) throw new Error("clean surface v3 audit must be redacted");
    if (value.audit.bookingUrlDisplayedCount !== 0 || value.audit.paymentActionDisplayedCount !== 0 || value.audit.orderActionDisplayedCount !== 0 || value.audit.identityUploadDisplayedCount !== 0) throw new Error("clean surface v3 unsafe counters");
    return true;
  }
  window.WeishanCleanResultSurfaceV3 = { CLEAN_RESULT_SURFACE_V3_VERSION, buildCleanResultSurfaceV3, buildCleanResultSurfaceV3AuditDraft, assertCleanResultSurfaceV3Safe };
})();
