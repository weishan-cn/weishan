(function(){
  const PROCUREMENT_CLARIFICATION_GATE_VERSION = "3.6.0";

  function text(value){ return String(value || "").trim(); }
  function clone(value){ return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }

  function categoryFromInput(raw, hint){
    const value = text(raw);
    if (hint) return hint;
    if (/枪|武器|身份证.*银行卡|银行卡.*身份证|贷款|护照.*代办/.test(value)) return "restricted_or_blocked";
    if (/机票|航班|飞|直达|中转/.test(value)) return "flight";
    if (/酒店|住宿|入住|离店/.test(value)) return "hotel";
    if (/搬家|维修|保洁|服务/.test(value)) return "local_service";
    if (/门票|活动|演唱会|迪士尼|ticket/i.test(value)) return "ticket_or_activity";
    if (/iPhone|电脑|手机|商品|购买|买/.test(value)) return "product";
    return "multi_category_plan";
  }

  function parseFlight(raw){
    const value = text(raw);
    const route = value.match(/([^\s，,。]+?)\s*到\s*([^\s，,。]+?)(?:最便宜|直达|机票|航班|$)/);
    const date = value.match(/\d{1,2}\s*月\s*\d{1,2}\s*日/);
    return { origin:route && route[1], destination:route && route[2], date:date && date[0] };
  }

  function parseProduct(raw){
    const value = text(raw);
    const productName = (value.match(/iPhone\s*\d+\s*Pro|iPhone\s*\d+|MacBook\s*(?:Air|Pro)?|电脑|相机|手机/i) || [""])[0];
    const region = /美国|日本|中国|香港|韩国|欧洲|英国/.test(value);
    const receiving = /收货|寄到|到中国|到成都|到上海/.test(value);
    return { productName, region, receiving };
  }

  function missingForCategory(category, raw){
    const value = text(raw);
    if (category === "flight") {
      const fields = parseFlight(value);
      return [!fields.origin && "出发地", !fields.destination && "目的地", !fields.date && "日期"].filter(Boolean);
    }
    if (category === "product") {
      const fields = parseProduct(value);
      return [!fields.productName && "型号", !fields.region && "购买地区", !fields.receiving && "收货地"].filter(Boolean);
    }
    if (category === "hotel") return [!/成都|上海|东京|北京|广州|深圳/.test(value) && "城市 / 地点", !/\d{1,2}\s*月\s*\d{1,2}\s*日|入住/.test(value) && "入住日期", !/离店|\d+\s*晚/.test(value) && "离店日期或入住晚数"].filter(Boolean);
    if (category === "local_service") return [!/成都|上海|附近|本地/.test(value) && "地点", !/搬家|维修|保洁|服务/.test(value) && "服务类型"].filter(Boolean);
    if (category === "ticket_or_activity") return [!/迪士尼|演唱会|活动|门票/.test(value) && "景点 / 活动名称", !/\d{1,2}\s*月\s*\d{1,2}\s*日|今天|明天|下周|下个月/.test(value) && "日期", !/\d+\s*人|成人|儿童|孩子/.test(value) && "人数或票种"].filter(Boolean);
    return [];
  }

  function questionFor(category, missing){
    const fields = missing.slice(0, 3);
    if (!fields.length) return "";
    if (category === "flight") return "请补充" + fields.join("、") + "。我拿到这些关键条件后再帮你比较。";
    if (category === "product") return "请补充" + fields.join("、") + "。例如：iPhone 16 Pro，美国和日本比较，收货到中国。";
    return "请补充" + fields.join("、") + "，我再整理可信采购方案。";
  }

  function quickRepliesFor(category, missing){
    const fields = missing.slice(0, 3);
    if (category === "flight") return fields.map((item) => item + "：");
    if (category === "product") return fields.map((item) => item + "：");
    return fields.map((item) => "补充" + item);
  }

  function evaluateProcurementClarificationGate(input){
    const safeInput = input && typeof input === "object" ? input : {};
    const raw = text(safeInput.rawUserInput || safeInput.text || safeInput.query);
    const category = categoryFromInput(raw, safeInput.procurementCategory || safeInput.currentCategoryHint);
    const missing = category === "restricted_or_blocked" ? [] : missingForCategory(category, raw).slice(0, 3);
    const ask = missing.length > 0;
    return clone({
      gateVersion:PROCUREMENT_CLARIFICATION_GATE_VERSION,
      procurementCategory:category,
      clarificationDecision:ask ? "ask_user" : "not_needed",
      missingFields:missing,
      questionText:ask ? questionFor(category, missing) : "",
      suggestedQuickReplies:ask ? quickRepliesFor(category, missing) : [],
      fakeResultPrevented:ask,
      redacted:true
    });
  }

  function buildProcurementClarificationGateAuditDraft(input){
    const decision = evaluateProcurementClarificationGate(input || {});
    return clone({
      eventType:"PROCUREMENT_CLARIFICATION_GATE_DRAFT",
      clarificationDecision:decision.clarificationDecision,
      missingFields:decision.missingFields,
      questionGenerated:decision.questionText ? true : false,
      quickReplyCount:decision.suggestedQuickReplies.length,
      fakeResultPrevented:true,
      redacted:true
    });
  }

  function assertProcurementClarificationGateSafe(decision){
    const value = decision || evaluateProcurementClarificationGate({ rawUserInput:"帮我买机票" });
    if (value.redacted !== true) throw new Error("clarification gate audit must be redacted");
    if (value.suggestedQuickReplies && value.suggestedQuickReplies.length > 3) throw new Error("clarification gate must ask at most 1-3 key questions");
    if (value.clarificationDecision === "ask_user" && value.fakeResultPrevented !== true) throw new Error("clarification gate must prevent fake results");
    return true;
  }

  window.WeishanProcurementClarificationGate = {
    PROCUREMENT_CLARIFICATION_GATE_VERSION,
    evaluateProcurementClarificationGate,
    buildProcurementClarificationGateAuditDraft,
    assertProcurementClarificationGateSafe
  };
})();
