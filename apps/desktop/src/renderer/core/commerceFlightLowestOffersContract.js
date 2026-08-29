;(function () {
  "use strict";

  const CONTRACT_VERSION = "4.2.8";
  const PHASE = "flight_lowest_two_offers_contract";
  const DEFAULT_PROVIDER_STATUS = "not_configured";
  const DEFAULT_OFFERS_STATUS = "unavailable";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function defaultCapabilities() {
    return {
      canReturnOffers: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canOpenExternalBooking: false,
      canCreateOrder: false,
      canPay: false,
      canStoreIdentity: false,
      canStorePassport: false,
      canStoreBankCard: false
    };
  }

  function defaultSafety() {
    return {
      noRealEndpoint: true,
      noRealApiKey: true,
      noNetworkSearch: true,
      noRealResults: true,
      noRealPrice: true,
      noFakeDemoMockPrice: true,
      noBookingUrl: true,
      noRedirect: true,
      noCheckout: true,
      noPayment: true,
      noOrderSubmit: true,
      noIdentityStorage: true,
      noPassportStorage: true,
      noBankCardStorage: true
    };
  }

  function defaultDisplay() {
    return {
      summaryTitle: "搜索条件已准备 · 机票搜索结果待验证",
      currentStatusLine: "暂未获取到可验证的实时报价（暂无真实价格结果）",
      priceStateLine: "当前没有已授权的实时只读价格源，因此不显示价格。",
      futureLine: "你可以前往平台确认；接入获批来源后，这里只显示有来源、时间和完整性标记的可验证报价。"
    };
  }

  function normalizeFlightLowestOffersContract(contract) {
    const raw = contract && typeof contract === "object" ? contract : {};
    return clone({
      contractVersion: String(raw.contractVersion || CONTRACT_VERSION),
      phase: String(raw.phase || PHASE),
      providerStatus: String(raw.providerStatus || DEFAULT_PROVIDER_STATUS),
      offersStatus: String(raw.offersStatus || DEFAULT_OFFERS_STATUS),
      offers: Array.isArray(raw.offers) ? raw.offers.map((offer) => clone(offer)) : [],
      maxDisplayedOffers: Number.isFinite(Number(raw.maxDisplayedOffers)) ? Number(raw.maxDisplayedOffers) : 2,
      selectionPolicy: String(raw.selectionPolicy || "lowest_total_price_first"),
      trustedSearchRoutes: Array.isArray(raw.trustedSearchRoutes) ? raw.trustedSearchRoutes.slice() : ["google_search", "google_flights", "trip_com"],
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      safety: Object.assign(defaultSafety(), raw.safety && typeof raw.safety === "object" ? raw.safety : {}),
      display: Object.assign(defaultDisplay(), raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function getFlightLowestOffersContract(contract) {
    return normalizeFlightLowestOffersContract(contract);
  }

  function isApprovedReadonlyFlightLowestOffersContract(contract) {
    return normalizeFlightLowestOffersContract(contract).providerStatus === "approved_readonly";
  }

  function describeFlightLowestOffersContract(contract) {
    const safe = normalizeFlightLowestOffersContract(contract);
    if (safe.providerStatus === "approved_readonly") {
      return {
        summaryTitle: safe.display.summaryTitle || "机票最低价结果",
        currentStatusLine: safe.display.currentStatusLine || "当前状态：已接入真实只读价格源，当前可展示通过安全检查的最低价前 2 家可信平台结果。",
        priceStateLine: "价格状态：已接入真实只读价格源，当前可展示通过安全检查的最低价前 2 家可信平台结果。",
        futureLine: safe.display.futureLine || "最终价格、库存、出票规则和付款以外部平台为准。"
      };
    }
    return {
      summaryTitle:"搜索条件已准备 · 机票搜索结果待验证",
      currentStatusLine:"暂未获取到可验证的实时报价（暂无真实价格结果）",
      priceStateLine:"当前没有已授权的实时只读价格源，因此不显示价格。",
      futureLine:"你可以前往平台确认；接入获批来源后，这里只显示有来源、时间和完整性标记的可验证报价。"
    };
  }

  window.WeishanCommerceFlightLowestOffersContract = {
    CONTRACT_VERSION,
    PHASE,
    DEFAULT_PROVIDER_STATUS,
    DEFAULT_OFFERS_STATUS,
    getFlightLowestOffersContract,
    normalizeFlightLowestOffersContract,
    describeFlightLowestOffersContract,
    isApprovedReadonlyFlightLowestOffersContract
  };
})();
