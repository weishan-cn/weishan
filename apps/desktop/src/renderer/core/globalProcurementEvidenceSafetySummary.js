(function(){
  const GLOBAL_PROCUREMENT_EVIDENCE_SAFETY_SUMMARY_VERSION = "2.1.62";

  function buildGlobalProcurementEvidenceSafetySummary(){
    return {
      summaryVersion:GLOBAL_PROCUREMENT_EVIDENCE_SAFETY_SUMMARY_VERSION,
      phase:"global_procurement_evidence_safety_summary",
      status:"offline planning only",
      realProvider:"disabled",
      realNetwork:"disabled",
      realApiKey:"disabled",
      realPrice:"disabled",
      availability:"disabled",
      bookingUrl:"disabled",
      payment:"disabled",
      order:"disabled",
      identityUpload:"disabled",
      establishedCapabilities:[
        "multi-category intent routing",
        "offline procurement plan composition",
        "restricted category guard",
        "trusted external search fallback",
        "local audit evidence summary"
      ],
      currentForbidden:[
        "real provider",
        "real network",
        "real API key",
        "real endpoint",
        "real price",
        "availability",
        "bookingUrl",
        "payment",
        "order",
        "identity upload"
      ],
      evidenceLines:[
        "security:no-secret-persistence PASS",
        "commerce:provider-fixtures:offline PASS",
        "providerActivationState: no-go",
        "networkAttemptCount: 0",
        "realProviderCallCount: 0",
        "realPriceDisplayedCount: 0",
        "bookingUrlDisplayedCount: 0"
      ],
      auditDraft:{
        eventType:"GLOBAL_PROCUREMENT_EVIDENCE_SAFETY_SUMMARY_DRAFT",
        networkAttemptCount:0,
        realProviderCallCount:0,
        realPriceDisplayedCount:0,
        bookingUrlDisplayedCount:0,
        redacted:true
      },
      redacted:true
    };
  }

  function assertGlobalProcurementEvidenceSafetySummarySafe(summary){
    if (!summary || summary.realProvider !== "disabled" || summary.realNetwork !== "disabled" || summary.realApiKey !== "disabled") {
      throw new Error("global procurement evidence summary must keep provider, network, and key disabled");
    }
    if (summary.realPrice !== "disabled" || summary.bookingUrl !== "disabled" || summary.payment !== "disabled" || summary.order !== "disabled" || summary.identityUpload !== "disabled") {
      throw new Error("global procurement evidence summary must keep transaction capabilities disabled");
    }
    return true;
  }

  window.WeishanGlobalProcurementEvidenceSafetySummary = {
    GLOBAL_PROCUREMENT_EVIDENCE_SAFETY_SUMMARY_VERSION,
    buildGlobalProcurementEvidenceSafetySummary,
    assertGlobalProcurementEvidenceSafetySummarySafe
  };
})();
