(function(){
  const GLOBAL_PROCUREMENT_MISSING_INFO_CHECKLIST_VERSION = "4.1.6";

  function unique(list){
    return Array.from(new Set((Array.isArray(list) ? list : []).filter(Boolean)));
  }

  function itemsForCategory(category){
    const map = {
      flight:[
        "乘机人数",
        "舱位偏好",
        "是否接受中转 / 直飞偏好",
        "行李要求",
        "时间窗口",
        "退改签偏好"
      ],
      hotel:[
        "入住人数",
        "房型偏好",
        "预算范围",
        "早餐偏好",
        "停车需求",
        "取消政策偏好"
      ],
      product:[
        "预算范围",
        "颜色 / 容量 / 版本",
        "新旧机偏好",
        "保修要求",
        "发票要求",
        "收货地"
      ],
      local_service:[
        "服务时间",
        "服务地址",
        "服务规模",
        "预算范围",
        "资质要求",
        "发票要求"
      ],
      ticket_or_activity:[
        "出行日期",
        "人数",
        "票种",
        "官方渠道偏好",
        "退改规则偏好",
        "儿童 / 老人票需求"
      ],
      multi_category_plan:[
        "关键日期",
        "人数",
        "预算范围",
        "优先级顺序",
        "必选项 / 可选项",
        "风险限制"
      ],
      restricted_or_blocked:[]
    };
    return unique(map[category] || []);
  }

  function buildGlobalProcurementMissingInfoChecklist(intent){
    const safeIntent = intent && typeof intent === "object" ? intent : {};
    const category = safeIntent.category || "unknown_procurement";
    return {
      checklistVersion:GLOBAL_PROCUREMENT_MISSING_INFO_CHECKLIST_VERSION,
      phase:"global_procurement_missing_info_checklist",
      category,
      title:"全球采购待补充信息清单",
      status:"draft only",
      mode:"local planning only",
      realProvider:"disabled",
      realNetwork:"disabled",
      redacted:true,
      items:itemsForCategory(category)
    };
  }

  function assertGlobalProcurementMissingInfoChecklistSafe(checklist){
    if (!checklist || checklist.status !== "draft only" || checklist.mode !== "local planning only") {
      throw new Error("global procurement missing info checklist must stay draft-only local planning");
    }
    if (checklist.realProvider !== "disabled" || checklist.realNetwork !== "disabled" || checklist.redacted !== true) {
      throw new Error("global procurement missing info checklist must keep provider and network disabled");
    }
    return true;
  }

  window.WeishanGlobalProcurementMissingInfoChecklist = {
    GLOBAL_PROCUREMENT_MISSING_INFO_CHECKLIST_VERSION,
    buildGlobalProcurementMissingInfoChecklist,
    assertGlobalProcurementMissingInfoChecklistSafe
  };
})();
