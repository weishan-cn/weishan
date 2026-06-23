(function(){
  const GLOBAL_PROCUREMENT_QUICK_SUMMARY_VERSION = "2.1.73";

  function text(value){
    return String(value || "").trim();
  }

  function normalizeDate(value){
    const raw = text(value);
    const match = raw.match(/^(\d{1,2})\s*月\s*(\d{1,2})\s*日$/);
    return match ? (Number(match[1]) + " 月 " + Number(match[2]) + " 日") : raw;
  }

  function join(list){
    return (Array.isArray(list) ? list : []).filter(Boolean).join("，");
  }

  function buildGlobalProcurementQuickSummary(input){
    const safe = input && typeof input === "object" ? input : {};
    const category = safe.category || "unknown_procurement";
    const origin = text(safe.origin);
    const destination = text(safe.destination);
    const date = normalizeDate(safe.date || safe.dateRange);
    const location = text(safe.location || safe.destination);
    const productName = text(safe.productName);
    const serviceName = text(safe.serviceName);
    const activityName = text(safe.activityName);
    const sortPreference = text(safe.sortPreference || safe.budgetPreference);
    const categoryList = Array.isArray(safe.categoryList) ? safe.categoryList : [];
    const categoryMap = {
      flight:"机票",
      hotel:"酒店",
      product:"商品",
      local_service:"本地服务",
      ticket_or_activity:"门票",
      multi_category_plan:"多品类采购"
    };

    if (category === "flight") {
      return "我已整理好这次机票搜索条件：" + join([
        origin && destination ? origin + "到" + destination : "",
        date,
        sortPreference || "按低价优先筛选"
      ]) + "。当前不返回真实价格。";
    }
    if (category === "hotel") {
      return "我已整理好住宿筛选条件：" + join([
        location || "目标区域待补充",
        date ? (date + "入住") : "",
        /一晚|1 晚/.test(String(safe.searchQueryDraft || "")) ? "住一晚" : "",
        /两晚|2 晚/.test(String(safe.searchQueryDraft || "")) ? "住两晚" : "",
        /三晚|3 晚/.test(String(safe.searchQueryDraft || "")) ? "住三晚" : ""
      ]) + "。当前不返回真实房价。";
    }
    if (category === "product") {
      return "我已整理好商品比较维度：" + join([
        productName || "目标商品待补充",
        Array.isArray(safe.regions) && safe.regions.length ? safe.regions.join("和") + "两地对比" : ""
      ]) || "我已整理好商品比较维度。" + "当前不返回真实价格。";
    }
    if (category === "local_service") {
      return "我已整理好本地服务筛选条件：" + join([
        location || "目标地点待补充",
        serviceName || "服务类型待补充",
        "重点看资质、口碑、合同和报价"
      ]) + "。当前不连接真实服务商。";
    }
    if (category === "ticket_or_activity") {
      return "我已整理好门票/活动筛选条件：" + join([
        activityName || "目标活动待补充",
        "优先官方渠道和正规票务平台"
      ]) + "。当前不返回真实票价。";
    }
    if (category === "multi_category_plan") {
      const labels = categoryList.map((item) => categoryMap[item] || item).filter(Boolean);
      return "我已整理好多品类采购计划：" + (labels.length ? labels.join("、") : "机票、酒店、当地交通和门票") + "。当前只整理条件，不访问真实平台。";
    }
    if (category === "restricted_or_blocked") {
      return "该请求涉及受限或高风险品类，已停止处理。当前不提供搜索、购买、上传或付款路径。";
    }
    return "我已整理好这次采购需求的搜索条件。当前只整理条件，不访问真实平台。";
  }

  function assertGlobalProcurementQuickSummarySafe(summary){
    const textValue = String(summary || "");
    if (/bookingUrl|paymentUrl|orderUrl|checkoutUrl|API key|endpoint/i.test(textValue)) {
      throw new Error("global procurement quick summary must stay user-facing and secret-free");
    }
    return true;
  }

  window.WeishanGlobalProcurementQuickSummary = {
    GLOBAL_PROCUREMENT_QUICK_SUMMARY_VERSION,
    buildGlobalProcurementQuickSummary,
    assertGlobalProcurementQuickSummarySafe
  };
})();
