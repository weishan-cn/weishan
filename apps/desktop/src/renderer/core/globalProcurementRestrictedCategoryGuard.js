(function(){
  const GLOBAL_PROCUREMENT_RESTRICTED_CATEGORY_GUARD_VERSION = "4.2.1";

  const restrictedCategories = [
    "weapons",
    "firearms",
    "ammunition",
    "explosives",
    "controlled drugs",
    "prescription medicine without doctor",
    "gambling",
    "counterfeit goods",
    "stolen goods",
    "identity upload",
    "bank card submission",
    "payment / checkout / order action"
  ];

  const blockingRules = [
    "high risk category -> blocked",
    "payment request -> blocked",
    "identity upload request -> blocked",
    "bank card submission -> blocked",
    "controlled medicine without doctor -> blocked",
    "gambling account opening -> blocked",
    "weapons / firearms / ammunition / explosives -> blocked",
    "counterfeit or stolen goods -> blocked"
  ];

  function buildGlobalProcurementRestrictedCategoryGuard(intent){
    const category = intent && intent.category || "unknown_procurement";
    const blocked = category === "restricted_or_blocked";
    return {
      guardVersion:GLOBAL_PROCUREMENT_RESTRICTED_CATEGORY_GUARD_VERSION,
      phase:"global_procurement_restricted_category_guard",
      status:"active",
      mode:"local policy only",
      decision:blocked ? "blocked" : "allowed_for_offline_planning_only",
      blockedReason:intent && intent.blockedReason || "",
      realProvider:"disabled",
      realNetwork:"disabled",
      payment:"disabled",
      order:"disabled",
      identityUpload:"disabled",
      restrictedCategories:restrictedCategories.slice(),
      blockingRules:blockingRules.slice(),
      auditDraft:{
        eventType:"GLOBAL_PROCUREMENT_RESTRICTED_CATEGORY_GUARD_DRAFT",
        category,
        decision:blocked ? "blocked" : "offline_planning_only",
        blockedReason:intent && intent.blockedReason || "",
        redacted:true
      },
      redacted:true
    };
  }

  function assertGlobalProcurementRestrictedCategoryGuardSafe(guard){
    if (!guard || guard.status !== "active") throw new Error("restricted category guard must stay active");
    if (guard.realProvider !== "disabled" || guard.realNetwork !== "disabled" || guard.payment !== "disabled" || guard.order !== "disabled" || guard.identityUpload !== "disabled") {
      throw new Error("restricted category guard must keep execution disabled");
    }
    return true;
  }

  window.WeishanGlobalProcurementRestrictedCategoryGuard = {
    GLOBAL_PROCUREMENT_RESTRICTED_CATEGORY_GUARD_VERSION,
    buildGlobalProcurementRestrictedCategoryGuard,
    assertGlobalProcurementRestrictedCategoryGuardSafe
  };
})();
