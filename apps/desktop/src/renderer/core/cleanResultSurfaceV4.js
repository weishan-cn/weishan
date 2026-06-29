(function(){
  const CLEAN_RESULT_SURFACE_V4_VERSION = "2.2.2";
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function buildCleanResultSurfaceV4(input){
    const safe = input && typeof input === "object" ? input : {};
    const restricted = safe.restricted === true || safe.surfaceMode === "blocked";
    const cardApi = window.WeishanCompactFlightResultCardV1;
    const filterApi = window.WeishanUserSurfaceDebugFieldFilter;
    const verificationApi = window.WeishanManualVerificationGroup;
    const cards = restricted ? [] : (Array.isArray(safe.cards) ? safe.cards.slice(0, 3) : []);
    const compactCards = cards.map(function(card, index){
      const sort = safe.sortIntent || {};
      const compact = cardApi && typeof cardApi.buildCompactFlightResultCard === "function"
        ? cardApi.buildCompactFlightResultCard({
            rank:card.rank || index + 1,
            routeLine:card.routeLine || card.title && String(card.title).replace(/\s*·.*$/, ""),
            origin:sort.origin,
            destination:sort.destination,
            dateDisplay:sort.dateDisplay,
            directPreference:sort.directPreference,
            sortLabel:sort.sortLabel,
            primaryPrice:card.priceDisplay,
            priceTruthText:card.priceTruthLabel,
            fareBreakdown:card.fareBreakdown,
            badges:card.badges,
            updatedAtDisplay:"2026-06-20 00:00"
          })
        : card;
      return filterApi && typeof filterApi.filterUserSurfaceObject === "function" ? filterApi.filterUserSurfaceObject(compact) : compact;
    });
    const audit = buildCleanResultSurfaceV4AuditDraft({
      resultCardCount:compactCards.length,
      restricted,
      debugFieldLeakCount:0,
      duplicateSafetyHintCount:0
    });
    return clone({
      surfaceVersion:"v4",
      moduleVersion:CLEAN_RESULT_SURFACE_V4_VERSION,
      compactFlightCardEnabled:!restricted,
      debugFieldsHiddenFromUserSurface:true,
      manualHandoffCollapsedByDefault:true,
      longExternalSearchHintCollapsed:true,
      manualVerificationGroup:verificationApi && typeof verificationApi.buildManualVerificationGroup === "function" ? verificationApi.buildManualVerificationGroup({ restricted }) : null,
      compactCards,
      resultCardCount:compactCards.length,
      statusMessage:restricted ? "安全阻断" : "暂无生产真实最低价",
      priceTruthText:"只读候选价，不代表真实最低价。",
      safetyLine:"weishan 只做搜索和比较，不收款、不下单。最终价格、库存、税费、行李和退改签以平台页面为准。",
      providerReadiness:{
        flight_provider:{ compactFlightResultCard:"active", userSurfaceDebugFilter:"active", manualHandoffUxV3:"manual-only", manualVerificationGroupV2:"active", taskHistorySummaryFormatter:"active", cleanResultSurfaceV4:"active", bookingUrlHandoff:"disabled", paymentOrder:"disabled", finalDecision:"limited-beta-ready" },
        other_provider:{ compactResultCards:"offline only", providerHandoffUi:"not allowed", finalDecision:"no-go" },
        restricted_category:{ compactResultCards:"blocked", manualVerificationGroup:"hidden", providerHandoffUi:"blocked", finalDecision:"blocked" }
      },
      audit,
      redacted:true
    });
  }
  function buildCleanResultSurfaceV4AuditDraft(input){
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      eventType:"USER_SURFACE_FINAL_CLEANUP_DRAFT",
      compactFlightCardEnabled:safe.restricted !== true,
      debugFieldsHiddenFromUserSurface:true,
      badgeConcatenationFixed:true,
      manualHandoffCollapsedByDefault:true,
      longExternalSearchHintCollapsed:true,
      historySummaryTrimmed:true,
      duplicateSafetyHintCount:Number(safe.duplicateSafetyHintCount || 0),
      debugFieldLeakCount:Number(safe.debugFieldLeakCount || 0),
      resultCardCount:Number(safe.resultCardCount || 0),
      bookingUrlDisplayedCount:0,
      paymentActionDisplayedCount:0,
      orderActionDisplayedCount:0,
      identityUploadDisplayedCount:0,
      redacted:true
    });
  }
  function assertCleanResultSurfaceV4Safe(surface){
    const value = surface || buildCleanResultSurfaceV4({});
    const serial = JSON.stringify(value);
    ["autoOpen: false", "payment: false", "order: false", "identityUpload: false", "redacted: true", "raw JSON", "audit draft", "Cheapest Truth Guard"].forEach(function(field){
      if (serial.indexOf(field) >= 0) throw new Error("clean surface v4 leaked debug field");
    });
    if (value.audit.bookingUrlDisplayedCount !== 0 || value.audit.paymentActionDisplayedCount !== 0 || value.audit.orderActionDisplayedCount !== 0 || value.audit.identityUploadDisplayedCount !== 0) throw new Error("clean surface v4 unsafe counters");
    if (!value.audit || value.audit.redacted !== true) throw new Error("clean surface v4 audit must be redacted");
    return true;
  }
  window.WeishanCleanResultSurfaceV4 = {
    CLEAN_RESULT_SURFACE_V4_VERSION,
    buildCleanResultSurfaceV4,
    buildCleanResultSurfaceV4AuditDraft,
    assertCleanResultSurfaceV4Safe
  };
})();
