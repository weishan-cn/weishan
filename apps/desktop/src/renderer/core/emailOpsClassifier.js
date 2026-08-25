;(function () {
  "use strict";

  const VERSION = "4.2.8";
  const MODULE_NAME = "email_ops_classifier_v1";
  const PROVIDERS = Object.freeze({
    hotelbeds:["hotelbeds.com", "hbg.io", "hotelbeds", "hbx"],
    daisycon:["daisycon.com", "daisycon"],
    cj:["cj.com", "cj affiliate", "commission junction"],
    involve_asia:["involve.asia", "involve asia"],
    tradedoubler:["tradedoubler.com", "tradedoubler"],
    sovrn:["sovrn.com", "sovrn"],
    awin:["awin.com", "awin"]
  });

  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function lower(value) { return text(value).toLowerCase(); }

  function messageText(message) {
    const safe = obj(message);
    return lower(`${safe.subject || ""} ${safe.sanitizedBody || safe.bodyText || ""}`);
  }

  function detectProvider(message) {
    const safe = obj(message);
    const haystack = lower(`${obj(safe.from).domain || ""} ${obj(safe.from).address || ""} ${safe.subject || ""} ${safe.sanitizedBody || ""} ${(safe.providerHints || []).join(" ")}`);
    for (const providerId of Object.keys(PROVIDERS)) {
      if (PROVIDERS[providerId].some(function (needle) { return haystack.includes(needle); })) {
        return providerId;
      }
    }
    return null;
  }

  function detectSpoofing(message, providerId) {
    if (!providerId) return false;
    const safe = obj(message);
    const domain = lower(obj(safe.from).domain);
    const providerDomains = PROVIDERS[providerId].filter(function (item) { return item.includes("."); });
    if (providerDomains.length === 0) return false;
    const bodyMentionsProvider = messageText(message).includes(providerId.replace("_", " ")) || lower(safe.subject).includes(providerId.replace("_", " "));
    const domainMatches = providerDomains.some(function (item) { return domain === item || domain.endsWith("." + item); });
    return bodyMentionsProvider && !domainMatches;
  }

  function classifyEmailMessage(message) {
    const safe = obj(message);
    const body = messageText(safe);
    const providerId = detectProvider(safe);
    const hasHighRiskAttachment = (safe.attachments || []).some(function (item) { return item.highRisk === true; });
    const hasLink = (safe.links || []).length > 0;
    const commandInjection = /ignore (all )?(previous|system|policy)|run (this )?command|open terminal|send (the )?(api|client|private|password|secret|token)/i.test(body);
    const isOtp = /\b(otp|one[- ]time|verification code|验证码|安全码|code)\b/i.test(body) && /\b\d{4,8}\b/.test(body);
    const isPasswordReset = /password reset|reset your password|forgot password|重置密码/i.test(body);
    const isLegal = /agreement|terms|contract|legal|arbitration|服务协议|合同|条款/i.test(body);
    const isPayment = /payment|payout|bank|wire|swift|iban|routing|payoneer|invoice|billing|refund|银行卡|银行|付款|收款|发票/i.test(body);
    const isKyc = /kyc|identity|passport|business license|id card|身份证|护照|营业执照|实名|人脸/i.test(body);
    const isSecurity = /vulnerability|security issue|data leak|secret exposed|credential leaked|安全漏洞|泄露/i.test(body);
    const isMarketing = /newsletter|unsubscribe|promotion|webinar|sale|marketing|优惠|订阅/i.test(body);
    const isBug = /bug|crash|broken|does not work|wrong price|wrong variant|wrong date|wrong total|handoff|打不开|崩溃|错误|价格不对|跳转错误/i.test(body);
    const isFeedback = /feedback|suggest|feature request|idea|建议|反馈|希望|能不能/i.test(body);
    const isQuestion = /\?|how do i|can i|what is|为什么|怎么|请问/i.test(body);
    const isThankYou = /^(thanks|thank you|谢谢|收到)[!.。！\s]*$/i.test(text(safe.sanitizedBody || safe.subject));
    const spoofing = detectSpoofing(safe, providerId);

    let category = "UNKNOWN";
    if (isOtp) category = "SECURITY_OTP";
    else if (isPasswordReset) category = "SECURITY_NOTIFICATION";
    else if (isLegal) category = "LEGAL_CONTRACT";
    else if (isPayment) category = "BILLING_FINANCIAL";
    else if (isKyc) category = "KYC_IDENTITY";
    else if (isSecurity) category = "SECURITY_REPORT";
    else if (providerId) category = "PROVIDER_REPLY";
    else if (isMarketing) category = "MARKETING";
    else if (isThankYou) category = "SPAM_NOISE";
    else if (isBug) category = "USER_BUG_REPORT";
    else if (isFeedback) category = "USER_FEEDBACK";
    else if (isQuestion) category = "USER_QUESTION";

    const riskFlags = [];
    if (commandInjection) riskFlags.push("PROMPT_INJECTION_ATTEMPT");
    if (hasLink) riskFlags.push("LINKS_NOT_AUTO_OPENED");
    if (hasHighRiskAttachment) riskFlags.push("HIGH_RISK_ATTACHMENT_NOT_OPENED");
    if (spoofing) riskFlags.push("SENDER_SPOOFING_REVIEW");
    if (category === "SECURITY_OTP") riskFlags.push("OTP_EPHEMERAL_DO_NOT_PERSIST");

    const confidence = category === "UNKNOWN" || spoofing ? "LOW" : (providerId || isOtp || isLegal || isPayment || isKyc ? "HIGH" : "MEDIUM");

    return clone({
      messageId:safe.messageId || "",
      threadId:safe.threadId || "",
      category,
      providerId,
      confidence,
      riskFlags,
      promptInjectionDetected:commandInjection,
      linkCount:(safe.links || []).length,
      highRiskAttachmentCount:(safe.attachments || []).filter(function (item) { return item.highRisk === true; }).length,
      senderSpoofingSuspected:spoofing,
      reason:`${category}:${confidence}`,
      redacted:true
    });
  }

  window.WeishanEmailOpsClassifier = {
    VERSION,
    MODULE_NAME,
    PROVIDERS,
    detectProvider,
    detectSpoofing,
    classifyEmailMessage
  };
})();
