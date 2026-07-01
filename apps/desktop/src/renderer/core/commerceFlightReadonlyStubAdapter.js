;(function () {
  "use strict";

  const ADAPTER_VERSION = "3.7.0";
  const PHASE = "flight_readonly_stub_adapter";
  const DEFAULT_OVERALL_STATUS = "shell_ready";
  const DEFAULT_CURRENT_STAGE = "shell_ready";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function defaultCapabilities() {
    return {
      canValidateInputShape: true,
      canBuildRequestShape: true,
      canNormalizeResponseShape: true,
      canUseRealApiKey: false,
      canConnectRealEndpoint: false,
      canUseNetwork: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canOpenBookingUrl: false,
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

  function defaultRequestShapeLines() {
    return [
      "origin：出发地",
      "destination：目的地",
      "departureDate：出发日期",
      "returnDateIfAny：返回日期（如有）",
      "adultsChildrenIfAny：成人 / 儿童（如有）",
      "cabinIfAny：舱位（如有）",
      "currencyIfFuture：币种（未来）",
      "regionIfFuture：区域（未来）"
    ];
  }

  function defaultResponseShapeLines() {
    return [
      "providerName：提供方名称",
      "airlineName：航司名称",
      "departureTime：起飞时间",
      "arrivalTime：到达时间",
      "duration：时长",
      "stops：中转次数",
      "baggageInfo：行李信息",
      "taxFeeInfo：税费 / 手续费信息",
      "finalPrice：禁用",
      "bookingUrl：禁用"
    ];
  }

  function defaultDisplay() {
    return {
      summaryTitle: "只读适配器空壳",
      shellStatusLine: "只读适配器空壳：已建立",
      currentStatusLine: "只读适配器空壳已建立",
      connectionStatusLine: "尚未允许连接真实 provider",
      sandboxDryRunLine: "Sandbox Dry Run：外壳已建立",
      summaryNote: "只读适配器空壳只允许开发请求 / 响应结构，不允许连接真实 endpoint，不允许读取真实 API key，不允许返回真实价格，不允许生成预订链接。",
      capabilityTitle: "当前能力",
      requestShapeTitle: "请求形状",
      responseShapeTitle: "响应形状",
      capabilityLines: [
        "可以校验输入形状",
        "可以构建请求形状",
        "可以规范化响应形状",
        "不能读取 API key",
        "不能连接 endpoint",
        "不能发起网络请求",
        "不能返回价格",
        "不能返回 bookingUrl",
        "不能打开预订页",
        "不能付款",
        "不能下单",
        "不能保存证件 / 银行卡"
      ],
      requestShapeLines: defaultRequestShapeLines(),
      responseShapeLines: defaultResponseShapeLines(),
      readonlyStubAdapterLine: "只读适配器空壳：已建立",
      readonlyStubAdapterAvailabilityLine: "只读适配器空壳：可用",
      realNetworkConnectionLine: "真实网络连接：未启用",
      realPriceReturnLine: "真实价格返回：未启用",
      bookingUrlReturnLine: "bookingUrl 返回：未启用"
    };
  }

  function normalizeFlightReadonlyStubAdapter(adapter) {
    const raw = adapter && typeof adapter === "object" ? adapter : {};
    return clone({
      adapterVersion: String(raw.adapterVersion || ADAPTER_VERSION),
      phase: String(raw.phase || PHASE),
      overallStatus: String(raw.overallStatus || DEFAULT_OVERALL_STATUS),
      currentStage: String(raw.currentStage || DEFAULT_CURRENT_STAGE),
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {}),
      safety: Object.assign(defaultSafety(), raw.safety && typeof raw.safety === "object" ? raw.safety : {}),
      requestShapeLines: Array.isArray(raw.requestShapeLines) ? raw.requestShapeLines.slice() : defaultRequestShapeLines(),
      responseShapeLines: Array.isArray(raw.responseShapeLines) ? raw.responseShapeLines.slice() : defaultResponseShapeLines(),
      display: Object.assign(defaultDisplay(), raw.display && typeof raw.display === "object" ? raw.display : {})
    });
  }

  function createFlightReadonlyStubRequest(input) {
    const raw = input && typeof input === "object" ? input : {};
    return {
      origin: String(raw.origin || ""),
      destination: String(raw.destination || ""),
      departureDate: String(raw.departureDate || raw.date || ""),
      returnDateIfAny: String(raw.returnDateIfAny || raw.returnDate || ""),
      adultsChildrenIfAny: String(raw.adultsChildrenIfAny || raw.travelerCount || ""),
      cabinIfAny: String(raw.cabinIfAny || raw.cabin || ""),
      currencyIfFuture: String(raw.currencyIfFuture || raw.currency || ""),
      regionIfFuture: String(raw.regionIfFuture || raw.region || "")
    };
  }

  function normalizeFlightReadonlyStubResponse(response) {
    const raw = response && typeof response === "object" ? response : {};
    return {
      providerName: String(raw.providerName || ""),
      airlineName: String(raw.airlineName || ""),
      departureTime: String(raw.departureTime || ""),
      arrivalTime: String(raw.arrivalTime || ""),
      duration: String(raw.duration || ""),
      stops: String(raw.stops || ""),
      baggageInfo: String(raw.baggageInfo || ""),
      taxFeeInfo: String(raw.taxFeeInfo || ""),
      finalPriceEnabled: false,
      bookingUrlEnabled: false,
      finalPrice: null,
      bookingUrl: "",
      safety: defaultSafety()
    };
  }

  function getFlightReadonlyStubAdapter(adapter) {
    return normalizeFlightReadonlyStubAdapter(adapter);
  }

  function describeFlightReadonlyStubAdapter(adapter) {
    const safe = normalizeFlightReadonlyStubAdapter(adapter);
    return {
      summaryTitle: safe.display.summaryTitle || "只读适配器空壳",
      shellStatusLine: safe.display.shellStatusLine || "只读适配器空壳：已建立",
      currentStatusLine: safe.display.currentStatusLine || "只读适配器空壳已建立",
      connectionStatusLine: safe.display.connectionStatusLine || "尚未允许连接真实 provider",
      sandboxDryRunLine: safe.display.sandboxDryRunLine || "Sandbox Dry Run：外壳已建立",
      summaryNote: safe.display.summaryNote || "只读适配器空壳只允许开发请求 / 响应结构，不允许连接真实 endpoint，不允许读取真实 API key，不允许返回真实价格，不允许生成预订链接。",
      capabilityTitle: safe.display.capabilityTitle || "当前能力",
      requestShapeTitle: safe.display.requestShapeTitle || "请求形状",
      responseShapeTitle: safe.display.responseShapeTitle || "响应形状",
      capabilityLines: Array.isArray(safe.display.capabilityLines) ? safe.display.capabilityLines.slice() : defaultDisplay().capabilityLines.slice(),
      requestShapeLines: Array.isArray(safe.requestShapeLines) ? safe.requestShapeLines.slice() : defaultRequestShapeLines(),
      responseShapeLines: Array.isArray(safe.responseShapeLines) ? safe.responseShapeLines.slice() : defaultResponseShapeLines(),
      readonlyStubAdapterLine: safe.display.readonlyStubAdapterLine || "只读适配器空壳：已建立",
      readonlyStubAdapterAvailabilityLine: safe.display.readonlyStubAdapterAvailabilityLine || "只读适配器空壳：可用",
      realNetworkConnectionLine: safe.display.realNetworkConnectionLine || "真实网络连接：未启用",
      realPriceReturnLine: safe.display.realPriceReturnLine || "真实价格返回：未启用",
      bookingUrlReturnLine: safe.display.bookingUrlReturnLine || "bookingUrl 返回：未启用"
    };
  }

  function createFlightReadonlyStubAdapter(adapter) {
    const safe = normalizeFlightReadonlyStubAdapter(adapter);
    return Object.assign({}, safe, {
      request: createFlightReadonlyStubRequest(adapter && adapter.request ? adapter.request : adapter),
      response: normalizeFlightReadonlyStubResponse(adapter && adapter.response ? adapter.response : null)
    });
  }

  window.WeishanCommerceFlightReadonlyStubAdapter = {
    ADAPTER_VERSION,
    PHASE,
    DEFAULT_OVERALL_STATUS,
    DEFAULT_CURRENT_STAGE,
    defaultCapabilities,
    defaultSafety,
    defaultRequestShapeLines,
    defaultResponseShapeLines,
    defaultDisplay,
    createFlightReadonlyStubAdapter,
    createFlightReadonlyStubRequest,
    normalizeFlightReadonlyStubAdapter,
    normalizeFlightReadonlyStubResponse,
    getFlightReadonlyStubAdapter,
    describeFlightReadonlyStubAdapter
  };
})();
