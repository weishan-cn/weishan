;(function () {
  "use strict";

  const PROVIDER_HANDOFF_RECEIPT_STORE_VERSION = "2.1.59";
  const STORAGE_KEY = "weishan.providerHandoffReceipt.v1";
  const RECEIPT_NAME = "provider_handoff_receipt_v1";
  const RECEIPT_ID = "deterministic-provider-handoff-receipt-v2.1.59";
  const FORBIDDEN_RE = /(token|key|secret|password|auth|credential|passport|idCard|bank|card|rawUrl|rawResponse|rawHtml|screenshot|orderId|paymentId|bookingReference)/i;
  function clone(value) { return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function hostOnly(value) { const raw = text(value); if (!raw) return ""; try { return new URL(raw).hostname; } catch (_) { return raw.split(/[/?#]/)[0]; } }
  function storage(storageLike) { return storageLike || (typeof window !== "undefined" ? window.localStorage : null); }
  function sanitizeProviderHandoffReceipt(receipt) {
    const safe = receipt && typeof receipt === "object" ? receipt : {};
    return clone({
      receiptName: RECEIPT_NAME,
      appVersion: PROVIDER_HANDOFF_RECEIPT_STORE_VERSION,
      receiptId: RECEIPT_ID,
      status: ["created", "confirmed", "cancelled", "blocked", "failed_safe"].includes(text(safe.status)) ? text(safe.status) : "created",
      providerName: text(safe.providerName || "可信平台"),
      displayHost: hostOnly(safe.displayHost || safe.safeProviderHandoffUrl || safe.url || ""),
      selectedQuoteId: text(safe.selectedQuoteId || (safe.selectedCandidate && safe.selectedCandidate.quoteId) || ""),
      selectedRank: number(safe.selectedRank || (safe.selectedCandidate && safe.selectedCandidate.rank)),
      selectedTotalPrice: number(safe.selectedTotalPrice || (safe.selectedCandidate && safe.selectedCandidate.totalPrice)),
      selectedCurrency: text(safe.selectedCurrency || (safe.selectedCandidate && safe.selectedCandidate.currency) || "CNY"),
      handoffType: text(safe.handoffType || "provider_confirmation") === "provider_search" ? "provider_search" : "provider_confirmation",
      userConfirmed: safe.userConfirmed === true,
      createdFrom: "read_only_quote_decision",
      caveat: "平台页面可能显示不同价格、库存、税费或规则。",
      safety: { bookingUrl:null, checkoutUrl:null, paymentUrl:null, orderUrl:null, payment:false, order:false, identityUpload:false, rawUrlStored:false, secretStored:false, redacted:true },
      redacted: true
    });
  }
  function valid(model) { return model && model.receiptName === RECEIPT_NAME && model.appVersion === PROVIDER_HANDOFF_RECEIPT_STORE_VERSION && model.redacted === true && model.safety && model.safety.rawUrlStored === false && model.safety.secretStored === false; }
  function saveProviderHandoffReceipt(receipt, storageLike) {
    const model = sanitizeProviderHandoffReceipt(receipt);
    const target = storage(storageLike);
    if (!target || typeof target.setItem !== "function") return clone(model);
    target.setItem(STORAGE_KEY, JSON.stringify(model));
    return clone(model);
  }
  function loadProviderHandoffReceipt(storageLike) {
    try {
      const target = storage(storageLike);
      if (!target || typeof target.getItem !== "function") return null;
      const raw = target.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      const model = sanitizeProviderHandoffReceipt(parsed);
      return valid(model) && parsed.receiptName === RECEIPT_NAME ? clone(model) : null;
    } catch (_) { return null; }
  }
  function clearProviderHandoffReceipt(storageLike) { const target = storage(storageLike); if (target && typeof target.removeItem === "function") target.removeItem(STORAGE_KEY); return { cleared:true, storageKey:STORAGE_KEY, redacted:true }; }
  function createProviderHandoffReceiptStore(storageLike) { return { storageKey:STORAGE_KEY, save:function (receipt) { return saveProviderHandoffReceipt(receipt, storageLike); }, load:function () { return loadProviderHandoffReceipt(storageLike); }, clear:function () { return clearProviderHandoffReceipt(storageLike); } }; }
  function buildProviderHandoffReceiptSummary(receipt) { const model = sanitizeProviderHandoffReceipt(receipt); return clone({ title:"Handoff Receipt", line:"生成本地 handoff receipt · " + (model.displayHost || "可信平台") + " · 平台最终为准", receiptName:model.receiptName, appVersion:model.appVersion, status:model.status, displayHost:model.displayHost, selectedQuoteId:model.selectedQuoteId, rawUrlStored:false, secretStored:false, bookingUrl:null, payment:false, order:false, identityUpload:false, redacted:true }); }
  window.WeishanProviderHandoffReceiptStore = { PROVIDER_HANDOFF_RECEIPT_STORE_VERSION, STORAGE_KEY, createProviderHandoffReceiptStore, saveProviderHandoffReceipt, loadProviderHandoffReceipt, clearProviderHandoffReceipt, sanitizeProviderHandoffReceipt, buildProviderHandoffReceiptSummary };
})();
