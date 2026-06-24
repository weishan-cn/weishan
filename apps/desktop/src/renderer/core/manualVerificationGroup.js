(function(){
  const MANUAL_VERIFICATION_GROUP_VERSION = "2.1.81";
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function buildManualVerificationGroup(input){
    const safe = input && typeof input === "object" ? input : {};
    const restricted = safe.restricted === true;
    return clone({
      groupVersion:"manual_verification_group_v2",
      moduleVersion:MANUAL_VERIFICATION_GROUP_VERSION,
      visible:!restricted,
      title:"手动核对入口",
      intro:"这些是人工搜索入口，不是预订链接。weishan 不自动打开付款页，不提交订单。",
      actions:restricted ? [] : ["复制机票搜索条件", "打开全网搜索", "打开 Google Flights", "打开 Trip.com / 携程"],
      longExternalSearchHintCollapsed:true,
      safetyNotes:[
        "外部搜索由用户手动点击。",
        "weishan 不自动打开付款页。",
        "weishan 不提交订单。",
        "请优先选择官方平台、知名旅行平台和航空公司官网。",
        "最终价格、库存、出票规则和付款均以外部平台为准。"
      ],
      autoOpen:false,
      bookingUrl:null,
      audit:buildManualVerificationGroupV2AuditDraft({ visible:!restricted }),
      redacted:true
    });
  }
  function buildManualVerificationGroupV2AuditDraft(input){
    const safe = input && typeof input === "object" ? input : {};
    return clone({
      eventType:"MANUAL_VERIFICATION_GROUP_V2_DRAFT",
      visible:safe.visible !== false,
      compactButtonList:true,
      longExternalSearchHintCollapsed:true,
      restrictedHidden:safe.visible === false,
      autoOpen:false,
      bookingUrlDisplayedCount:0,
      paymentActionDisplayedCount:0,
      orderActionDisplayedCount:0,
      redacted:true
    });
  }
  function assertManualVerificationGroupSafe(group){
    const value = group || buildManualVerificationGroup({});
    if (value.autoOpen !== false) throw new Error("manual verification must not auto open");
    if (value.bookingUrl !== null) throw new Error("manual verification must not expose bookingUrl");
    if (!value.audit || value.audit.redacted !== true) throw new Error("manual verification audit must be redacted");
    return true;
  }
  window.WeishanManualVerificationGroup = {
    MANUAL_VERIFICATION_GROUP_VERSION,
    buildManualVerificationGroup,
    buildManualVerificationGroupV2AuditDraft,
    assertManualVerificationGroupSafe
  };
})();
