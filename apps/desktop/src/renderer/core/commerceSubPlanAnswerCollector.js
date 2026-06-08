(function(){
  const CONTRACT = {
    answerCollectorVersion:"2.0.54",
    phase:"subplan_answer_collector",
    defaultMode:"map_answers_to_subplan_fields",
    answerPolicy:{
      collectAnswersBySubPlan:true,
      mapAnswersToMissingFields:true,
      preserveSubPlanIsolation:true,
      temporarySessionOnly:true,
      noLongTermStorage:true,
      noProviderAccess:true,
      noPriceDuringAnswerCollection:true,
      noRedirectDuringAnswerCollection:true,
      noCheckoutDuringAnswerCollection:true
    },
    capabilities:{
      canCollectAnswers:true,
      canMapAnswersToFields:true,
      canUpdateSubPlanDraft:true,
      canComputeCompleteness:true,
      canShowRemainingQuestions:true,
      canAccessProvider:false,
      canUseApiKey:false,
      canUseNetwork:false,
      canReturnRealResults:false,
      canReturnRealPrice:false,
      canReturnMockPrice:false,
      canRedirect:false,
      canCheckout:false,
      canPay:false,
      canSubmitOrder:false,
      canStoreIdentity:false
    },
    safety:{
      noRealEndpoint:true,
      noRealApiKey:true,
      noNetworkSearch:true,
      noRealResults:true,
      noRealPrice:true,
      noFakeDemoMockPrice:true,
      noRedirect:true,
      noCheckout:true,
      noPayment:true,
      noOrderSubmit:true,
      noIdentityStorage:true,
      noRawGpsStorage:true,
      noBypassLocalLaw:true
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value || null)); }
  function compact(text){ return String(text || "").replace(/\s+/g, "").trim(); }
  function cleanValue(value){
    return String(value || "")
      .replace(/[，。,.；;：:、]+$/g, "")
      .replace(/^(最好|大概|大约|可以|就行|就是|是|为|在|到|从)/g, "")
      .trim();
  }
  function normalizeCompactValue(value){ return String(value || "").replace(/\s+/g, "").trim(); }
  function normalizeFieldName(field){
    const raw = String(field || "");
    if (/出发地/.test(raw)) return "出发地";
    if (/具体出行日期|出行日期/.test(raw)) return "出行日期";
    if (/入住/.test(raw)) return "入住日期";
    if (/离店/.test(raw)) return "离店日期";
    if (/儿童年龄|孩子/.test(raw)) return "儿童年龄";
    if (/品牌/.test(raw)) return "品牌偏好";
    if (/性能/.test(raw)) return "性能要求";
    if (/收货地|购买地区/.test(raw)) return "收货地";
    if (/二手|翻新/.test(raw)) return "是否接受二手";
    if (/城市/.test(raw)) return "城市";
    if (/日期|时间段/.test(raw)) return "日期 / 时间段";
    if (/张数/.test(raw)) return "张数";
    if (/座位/.test(raw)) return "座位偏好";
    if (/服务地点|地点/.test(raw)) return "服务地点";
    if (/预约时间|服务时间/.test(raw)) return "预约时间";
    if (/预算/.test(raw)) return "预算";
    if (/上门/.test(raw)) return "是否需要上门";
    return raw;
  }
  function questionField(question){ return normalizeFieldName(question && (question.missingField || question.field || question.questionText) || ""); }
  function matchFirst(text, patterns){
    for (const pattern of patterns) {
      const match = String(text || "").match(pattern);
      if (match && (match[1] || match[0])) return cleanValue(match[1] || match[0]);
    }
    return "";
  }
  function mapTravelAnswer(answerText, field){
    const raw = String(answerText || "");
    if (field === "出发地") return matchFirst(raw, [/从\s*([^，。,.、\s]+)\s*出发/]);
    if (field === "出行日期") return matchFirst(raw, [/(\d{1,2}\s*月\s*\d{1,2}\s*日|明天|后天|周[一二三四五六日天](?:上午|下午|晚上)?|下周[一二三四五六日天]?|下个月\d{0,2}日?)\s*出发/]);
    if (field === "入住日期") return matchFirst(raw, [/(\d{1,2}\s*月\s*\d{1,2}\s*日|明天|后天|周[一二三四五六日天](?:上午|下午|晚上)?|下周[一二三四五六日天]?|下个月\d{0,2}日?)\s*入住/]);
    if (field === "离店日期") return matchFirst(raw, [/(\d{1,2}\s*月\s*\d{1,2}\s*日|明天|后天|周[一二三四五六日天](?:上午|下午|晚上)?|下周[一二三四五六日天]?|下个月\d{0,2}日?)\s*离店/]);
    if (field === "儿童年龄") return matchFirst(raw, [/孩子\s*([0-9一二三四五六七八九十]+\s*岁)/]);
    return "";
  }
  function mapProductAnswer(answerText, field){
    const raw = String(answerText || "");
    const tight = compact(raw);
    if (field === "品牌偏好") {
      if (/品牌(?:都可以|不限|无所谓|没有偏好)/.test(tight)) return "都可以";
      return matchFirst(raw, [/品牌\s*([^，。,.、\s]+)/]);
    }
    if (field === "性能要求") {
      const parts = [];
      const memory = raw.match(/\d+\s*G\s*内存/i);
      const disk = raw.match(/\d+\s*T\s*硬盘/i);
      const gpu = raw.match(/[A-Za-z0-9]+\s*显卡/i);
      if (memory) parts.push(normalizeCompactValue(memory[0]));
      if (disk) parts.push(normalizeCompactValue(disk[0]));
      if (gpu) parts.push(cleanValue(gpu[0]));
      return parts.join(" / ");
    }
    if (field === "收货地") return matchFirst(raw, [/收货地\s*([^，。,.、\s]+)/, /送到\s*([^，。,.、\s]+)/]);
    if (field === "是否接受二手") {
      if (/不接受二手|不要二手|不接受翻新|不要翻新/.test(tight)) return "不接受";
      if (/接受二手|可以二手|接受翻新|可以翻新/.test(tight)) return "接受";
    }
    return "";
  }
  function mapTicketAnswer(answerText, field){
    const raw = String(answerText || "");
    if (field === "城市") return matchFirst(raw, [/看\s*([^，。,.、\s]+)\s*的票/, /([\u4e00-\u9fa5]{2,8})\s*[，,]\s*(?:周[一二三四五六日天]|明天|后天|\d{1,2}\s*月)/, /^\s*([^，。,.、\s]+)\s*[，,]/]);
    if (field === "日期 / 时间段") return matchFirst(raw, [/(周[一二三四五六日天](?:上午|下午|晚上)?|明天(?:上午|下午|晚上)?|后天(?:上午|下午|晚上)?|\d{1,2}\s*月\s*\d{1,2}\s*日(?:上午|下午|晚上)?)/]);
    if (field === "张数") return matchFirst(raw, [/([一二两三四五六七八九十0-9]+\s*张)/]);
    if (field === "座位偏好") return matchFirst(raw, [/((?:中区|靠前|视野优先|内场|看台|前排|后排)(?:座位)?)/]);
    if (field === "预算") return matchFirst(raw, [/(每张\s*\d+\s*以内)/, /预算\s*([^，。,.、]+)/]);
    return "";
  }
  function mapLocalServiceAnswer(answerText, field){
    const raw = String(answerText || "");
    const tight = compact(raw);
    if (field === "服务地点") return matchFirst(raw, [/在\s*([^，。,.、\s]+)\s*[，,]/, /服务地点\s*([^，。,.、\s]+)/]);
    if (field === "预约时间") return matchFirst(raw, [/(明天(?:上午|下午|晚上)?|后天(?:上午|下午|晚上)?|周[一二三四五六日天](?:上午|下午|晚上)?|\d{1,2}\s*月\s*\d{1,2}\s*日(?:上午|下午|晚上)?)/]);
    if (field === "预算") return normalizeCompactValue(matchFirst(raw, [/预算\s*(\d+\s*以内)/, /(\d+\s*以内)/]));
    if (field === "是否需要上门") {
      if (/不需要上门|无需上门|不要上门/.test(tight)) return "不需要";
      if (/需要上门|可以上门/.test(tight)) return "需要";
    }
    return "";
  }
  function groupKind(subPlan){
    const raw = [subPlan && subPlan.category, subPlan && subPlan.categoryLabel, subPlan && subPlan.title, subPlan && subPlan.subPlanType].join(" ");
    if (/travel|旅行|机票|酒店|复合旅行/.test(raw)) return "travel";
    if (/ticket|门票|票务/.test(raw)) return "ticket";
    if (/service|本地服务|服务/.test(raw)) return "service";
    if (/product|ecommerce|商品|采购/.test(raw)) return "product";
    return "general";
  }
  function answerCandidateFieldsForSubPlan(subPlan){
    const kind = groupKind(subPlan);
    const map = {
      travel:["出发地", "出行日期", "入住日期", "离店日期", "儿童年龄", "预算"],
      product:["品牌偏好", "性能要求", "收货地", "是否接受二手", "预算", "用途"],
      ticket:["城市", "日期 / 时间段", "张数", "座位偏好", "预算"],
      service:["服务地点", "预约时间", "预算", "是否需要上门"]
    };
    return map[kind] || [];
  }

  function answerQuestionsForSubPlan(subPlan){
    const base = Array.isArray(subPlan && subPlan.questions) ? subPlan.questions : [];
    const seen = new Set(base.map(questionField));
    const synthetic = answerCandidateFieldsForSubPlan(subPlan)
      .filter((field) => field && !seen.has(field))
      .map((field) => ({ missingField:field, questionText:field }));
    return base.concat(synthetic);
  }

  function mapAnswerToSubPlanField(answerText, question, subPlan){
    const field = questionField(question);
    const kind = groupKind(subPlan);
    let value = "";
    if (kind === "travel") value = mapTravelAnswer(answerText, field);
    if (kind === "product") value = mapProductAnswer(answerText, field);
    if (kind === "ticket") value = mapTicketAnswer(answerText, field);
    if (kind === "service") value = mapLocalServiceAnswer(answerText, field);
    if (!value) return null;
    return { subPlanId:String(subPlan && (subPlan.subPlanId || subPlan.id || subPlan.title) || "subplan"), subPlanTitle:String(subPlan && subPlan.title || subPlan && subPlan.categoryLabel || "子计划"), field, value, sourceQuestion:String(question && question.questionText || field), providerAccess:false, price:false, redirect:false };
  }
  function detectAnswerTargets(input, questionResult){
    const groups = Array.isArray(questionResult && questionResult.subPlanQuestionGroups) ? questionResult.subPlanQuestionGroups : [];
    return groups.map((group) => {
      const mapped = answerQuestionsForSubPlan(group).map((question) => mapAnswerToSubPlanField(input, question, group)).filter(Boolean);
      return { subPlanId:String(group.subPlanId || group.id || group.title || "subplan"), title:String(group.title || group.categoryLabel || "子计划"), category:String(group.category || ""), matchedFieldCount:mapped.length, matchedFields:mapped.map((item) => item.field) };
    }).filter((target) => target.matchedFieldCount > 0);
  }
  function previousFieldsForSubPlan(previousDraft, subPlanId){
    const groups = Array.isArray(previousDraft && previousDraft.subPlanDrafts) ? previousDraft.subPlanDrafts : [];
    const found = groups.find((item) => String(item.subPlanId || "") === String(subPlanId || ""));
    return found && found.fieldValues && typeof found.fieldValues === "object" ? Object.assign({}, found.fieldValues) : {};
  }
  function applyAnswersToSubPlanDraft(subPlan, mappedAnswers, previousDraft){
    const subPlanId = String(subPlan && (subPlan.subPlanId || subPlan.id || subPlan.title) || "subplan");
    const fieldValues = previousFieldsForSubPlan(previousDraft, subPlanId);
    (mappedAnswers || []).forEach((answer) => { if (answer && answer.field && answer.value) fieldValues[answer.field] = answer.value; });
    const completedFields = Object.keys(fieldValues).filter((key) => fieldValues[key]);
    return { subPlanId, title:String(subPlan && subPlan.title || subPlan && subPlan.categoryLabel || "子计划"), category:String(subPlan && (subPlan.category || subPlan.categoryLabel) || ""), fieldValues, completedFields, temporarySessionOnly:true, providerAccess:false, price:false, redirect:false };
  }
  function computeSubPlanCompleteness(subPlanDraft, questions){
    const list = Array.isArray(questions) ? questions : [];
    const requiredFields = list.map(questionField).filter(Boolean);
    const values = subPlanDraft && subPlanDraft.fieldValues || {};
    const completedFields = requiredFields.filter((field) => values[field]);
    const remainingFields = requiredFields.filter((field) => !values[field]);
    const completenessPercent = requiredFields.length ? Math.round(completedFields.length / requiredFields.length * 100) : 0;
    return { completedFields, remainingFields, completedCount:completedFields.length, remainingCount:remainingFields.length, totalCount:requiredFields.length, completenessPercent, canProceedToNextReview:remainingFields.length === 0, providerAccess:false, price:false, redirect:false, nextSteps:remainingFields.length ? ["继续补充剩余信息", "完成当地法律合规确认", "等待 provider 接入审批完成"] : ["完成当地法律合规确认", "等待 provider 接入审批完成", "通过 Connector Gate 前仍不可访问真实 provider"] };
  }
  function buildRemainingQuestions(questionResult, mappedAnswers){
    const groups = Array.isArray(questionResult && questionResult.subPlanQuestionGroups) ? questionResult.subPlanQuestionGroups : [];
    const bySubPlan = new Map();
    (mappedAnswers || []).forEach((item) => { const id = String(item.subPlanId || ""); if (!bySubPlan.has(id)) bySubPlan.set(id, new Set()); bySubPlan.get(id).add(String(item.field || "")); });
    return groups.map((group) => { const id = String(group.subPlanId || group.id || group.title || "subplan"); const done = bySubPlan.get(id) || new Set(); const remaining = (Array.isArray(group.questions) ? group.questions : []).filter((question) => !done.has(questionField(question))); return Object.assign({}, group, { questions:remaining, questionCount:remaining.length }); });
  }
  function collectSubPlanAnswers(input, questionResult, previousDraft){
    const groups = Array.isArray(questionResult && questionResult.subPlanQuestionGroups) ? questionResult.subPlanQuestionGroups : [];
    const mappedAnswers = [];
    const subPlanDrafts = groups.map((group) => {
      const answers = answerQuestionsForSubPlan(group).map((question) => mapAnswerToSubPlanField(input, question, group)).filter(Boolean);
      mappedAnswers.push.apply(mappedAnswers, answers);
      const draft = applyAnswersToSubPlanDraft(group, answers, previousDraft);
      const completeness = computeSubPlanCompleteness(draft, group.questions || []);
      return Object.assign({}, draft, { completeness, remainingQuestions:(group.questions || []).filter((question) => !draft.fieldValues[questionField(question)]) });
    });
    const completedFieldCount = subPlanDrafts.reduce((sum, draft) => sum + Number(Array.isArray(draft.completedFields) ? draft.completedFields.length : 0), 0);
    const remainingFieldCount = subPlanDrafts.reduce((sum, draft) => sum + Number(draft.completeness && draft.completeness.remainingCount || 0), 0);
    const status = completedFieldCount > 0 ? "partial_answers_collected" : "waiting_for_answers";
    return { answerCollectorVersion:CONTRACT.answerCollectorVersion, phase:CONTRACT.phase, defaultMode:CONTRACT.defaultMode, status, statusLabel:completedFieldCount > 0 ? "已收集部分回答" : "等待回答", inputSummary:String(input || "").replace(/\s+/g, " ").trim().slice(0, 240), answerTargets:detectAnswerTargets(input, questionResult), mappedAnswers, subPlanAnswerDraft:{ subPlanDrafts }, subPlanDrafts, remainingQuestionGroups:buildRemainingQuestions(questionResult, mappedAnswers), subPlanCount:groups.length, completedFieldCount, remainingFieldCount, canAccessProvider:false, canUseApiKey:false, canUseNetwork:false, canReturnRealResults:false, canReturnRealPrice:false, canReturnMockPrice:false, canRedirect:false, canCheckout:false, canPay:false, canSubmitOrder:false, canStoreIdentity:false, providerAccess:false, price:false, redirect:false, temporarySessionOnly:true, noLongTermStorage:true };
  }
  function labelCompletedFields(draft){ const values = draft && draft.fieldValues || {}; return Object.keys(values).filter((key) => values[key]).map((key) => key + "：" + values[key]); }
  function toSubPlanAnswerCollectorDisplayStatus(answerResult){
    const result = answerResult || collectSubPlanAnswers("", null, null);
    const drafts = Array.isArray(result.subPlanDrafts) ? result.subPlanDrafts : [];
    return { title:"子计划答案收集", subtitle:"根据用户回答补齐子计划信息。当前只更新计划草稿，不访问任何真实 provider。", overallStatusLabel:result.statusLabel || (Number(result.completedFieldCount || 0) > 0 ? "已收集部分回答" : "等待回答"), subPlanCountLabel:String(result.subPlanCount || drafts.length || 0), completedFieldCountLabel:String(result.completedFieldCount || 0), remainingFieldCountLabel:String(result.remainingFieldCount || 0), providerAccessLabel:"否", priceLabel:"否", redirectLabel:"否", groups:drafts.map((draft) => { const completeness = draft.completeness || {}; return { title:draft.title || "子计划", categoryLabel:draft.category || draft.title || "子计划", completedFields:labelCompletedFields(draft), remainingFields:completeness.remainingFields || [], completenessLabel:String(completeness.completenessPercent || 0) + "%", canProceedLabel:completeness.canProceedToNextReview ? "是" : "否", nextSteps:completeness.nextSteps || [], providerAccessLabel:"否", priceLabel:"否", redirectLabel:"否" }; }), note:"这些回答只用于补齐计划草稿，不访问真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不返回商品、价格或跳转链接。" };
  }
  window.WeishanCommerceSubPlanAnswerCollector = { getSubPlanAnswerCollectorContract:function(){ return clone(CONTRACT); }, collectSubPlanAnswers, detectAnswerTargets, mapAnswerToSubPlanField, applyAnswersToSubPlanDraft, computeSubPlanCompleteness, buildRemainingQuestions, toSubPlanAnswerCollectorDisplayStatus };
})();
