;(function () {
  "use strict";

  const CHECKLIST_VERSION = "4.2.8";
  const PHASE = "api_binding_permission_checklist";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function defaultCapabilities() {
    return {
      canShowPermissionChecklist: true,
      canShowReadOnlyChecklist: true,
      canShowForbiddenPermissionChecklist: true,
      canShowUserConfirmationPreview: true,
      canExplainBindingRisks: true,
      canInputApiKey: false,
      canSaveApiKey: false,
      canTestConnection: false,
      canConnectEndpoint: false,
      canUseNetwork: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canUploadIdentity: false,
      canStoreIdentity: false,
      canStorePassport: false,
      canStoreBankCard: false
    };
  }

  function normalizeApiBindingPermissionChecklistContract(contract) {
    const raw = contract && typeof contract === "object" ? contract : {};
    return clone({
      checklistVersion: String(raw.checklistVersion || CHECKLIST_VERSION),
      phase: String(raw.phase || PHASE),
      checklistStatus: String(raw.checklistStatus || "checklist_only"),
      realBindingMode: String(raw.realBindingMode || "disabled"),
      apiKeyInputMode: String(raw.apiKeyInputMode || "disabled"),
      apiKeyStorageMode: String(raw.apiKeyStorageMode || "disabled"),
      testConnectionMode: String(raw.testConnectionMode || "disabled"),
      endpointConnectionMode: String(raw.endpointConnectionMode || "disabled"),
      networkMode: String(raw.networkMode || "disabled"),
      priceMode: String(raw.priceMode || "disabled_without_binding"),
      bookingUrlMode: String(raw.bookingUrlMode || "disabled_without_binding"),
      orderMode: String(raw.orderMode || "disabled"),
      paymentMode: String(raw.paymentMode || "disabled"),
      identityUploadMode: String(raw.identityUploadMode || "disabled"),
      identityStorageMode: String(raw.identityStorageMode || "disabled"),
      bankCardStorageMode: String(raw.bankCardStorageMode || "disabled"),
      capabilities: Object.assign(defaultCapabilities(), raw.capabilities && typeof raw.capabilities === "object" ? raw.capabilities : {})
    });
  }

  function readonlyItem(itemId, label) {
    return {
      itemId,
      label,
      status: "allowed_future_readonly",
      enabledNow: false,
      requiresUserBinding: true,
      requiresHumanReview: true
    };
  }

  function forbiddenItem(itemId, label, reason) {
    return { itemId, label, status: "forbidden", enabledNow: false, reason };
  }

  function disabledItem(itemId, label, reason) {
    return { itemId, label, status: "disabled_current_version", enabledNow: false, reason };
  }

  function buildApiBindingPermissionChecklist() {
    return clone({
      allowedFutureReadonly: [
        readonlyItem("readonlySearch", "只读搜索"),
        readonlyItem("readPrice", "读取价格"),
        readonlyItem("readInventory", "读取库存"),
        readonlyItem("analyzeResults", "分析结果"),
        readonlyItem("showSourcePlatform", "显示来源平台"),
        readonlyItem("externalPlatformConfirm", "点击价格后跳转外部平台确认")
      ],
      forbidden: [
        forbiddenItem("writeApi", "写入 API", "weishan 不写入外部平台数据。"),
        forbiddenItem("orderApi", "下单 API", "weishan 不提交订单。"),
        forbiddenItem("paymentApi", "支付 API", "weishan 不处理付款。"),
        forbiddenItem("uploadIdCard", "上传身份证", "weishan 不上传或保存身份证。"),
        forbiddenItem("uploadPassport", "上传护照", "weishan 不上传或保存护照。"),
        forbiddenItem("saveBankCard", "保存银行卡", "weishan 不保存银行卡。"),
        forbiddenItem("autoPay", "自动付款", "用户必须在外部平台自行确认。"),
        forbiddenItem("autoOrder", "自动下单", "用户必须在外部平台自行确认。"),
        forbiddenItem("silentApiCall", "后台静默调用 API", "未通过安全审查前禁止后台调用。"),
        forbiddenItem("plaintextApiKey", "明文保存 API key", "真实 API key 不得明文保存。")
      ],
      disabledCurrentVersion: [
        disabledItem("apiKeyInput", "API key 输入", "当前版本只展示权限清单，不输入真实 API key。"),
        disabledItem("apiKeySave", "API key 保存", "当前版本不保存真实 API key。"),
        disabledItem("connectionTest", "API 连接测试", "当前版本不测试连接。"),
        disabledItem("endpointConnection", "endpoint 连接", "当前版本不连接 endpoint。"),
        disabledItem("realNetworkRequest", "真实网络请求", "当前版本不发起真实网络请求。"),
        disabledItem("realPriceReturn", "真实价格返回", "当前版本不返回真实价格。"),
        disabledItem("bookingUrlReturn", "bookingUrl 返回", "当前版本不返回 bookingUrl。")
      ]
    });
  }

  function buildApiBindingUserConfirmationPreview() {
    return clone([
      "我确认该 API 仅用于只读搜索和价格读取。",
      "我理解 weishan 不会替我付款。",
      "我理解 weishan 不会替我下单。",
      "我理解 weishan 不会上传身份证、护照或银行卡。",
      "我理解最终价格以外部平台页面为准。",
      "我理解当前版本不会保存真实 API key。",
      "我理解未通过安全审查前不会连接真实 endpoint。"
    ]);
  }

  function getApiBindingChecklistState() {
    return clone({
      status: "checklist_only",
      canConfirm: false,
      canSubmit: false,
      canInputApiKey: false,
      canSaveApiKey: false,
      canTestConnection: false,
      canUseNetwork: false,
      canReturnPrice: false,
      canReturnBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canUploadIdentity: false,
      canStoreBankCard: false
    });
  }

  function assertApiBindingPermissionChecklistSafe(options) {
    const raw = options && typeof options === "object" ? options : {};
    const checklist = raw.checklist && typeof raw.checklist === "object" ? raw.checklist : buildApiBindingPermissionChecklist();
    const confirmationPreview = Array.isArray(raw.confirmationPreview) ? raw.confirmationPreview : buildApiBindingUserConfirmationPreview();
    const state = raw.state && typeof raw.state === "object" ? raw.state : getApiBindingChecklistState();
    const violations = [];
    ["forbidden", "disabledCurrentVersion"].forEach((groupName) => {
      const group = Array.isArray(checklist[groupName]) ? checklist[groupName] : [];
      group.forEach((item) => {
        if (!item || item.enabledNow !== false) violations.push(groupName + ":" + (item && item.itemId || "unknown"));
      });
    });
    [
      "canConfirm",
      "canSubmit",
      "canInputApiKey",
      "canSaveApiKey",
      "canTestConnection",
      "canUseNetwork",
      "canReturnPrice",
      "canReturnBookingUrl",
      "canCreateOrder",
      "canPay",
      "canUploadIdentity",
      "canStoreBankCard"
    ].forEach((key) => {
      if (state[key] !== false) violations.push("state:" + key);
    });
    const joinedPreview = confirmationPreview.join("\n");
    if (/sk-[A-Za-z0-9]|api[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{8,}|https?:\/\/api\./i.test(joinedPreview)) {
      violations.push("preview_secret_or_endpoint");
    }
    if (state.status !== "checklist_only") violations.push("state:status");
    if (violations.length) throw new Error("api_binding_permission_checklist_violation:" + violations.join(","));
    return true;
  }

  function buildApiBindingPermissionChecklistDisplay() {
    const checklist = buildApiBindingPermissionChecklist();
    const confirmationPreview = buildApiBindingUserConfirmationPreview();
    const state = getApiBindingChecklistState();
    return clone({
      title: "API 绑定权限清单",
      currentStatusLine: "权限清单为只读预览，当前版本不能提交绑定确认。",
      secureStorageDesignGateLine: "未通过安全存储设计闸门前，不能提交绑定确认",
      localSecureStorageInterfaceDraftLine: "密钥脱敏与日志防泄露规则已建立",
      keyDeleteRotateExpiryLine: "key 删除 / 轮换 / 过期机制草案已建立，但真实删除 / 轮换 / 过期仍未开放，不能提交绑定确认",
      providerEndpointAllowlistGateLine: "provider endpoint allowlist 闸门已建立，只读 provider sandbox gate：已建立，等待只读 provider result schema gate；只读 provider result schema gate：已建立，provider result source label gate：未建立，不能提交绑定确认",
      allowedTitle: "允许的未来只读能力：",
      forbiddenTitle: "禁止能力：",
      disabledTitle: "当前版本禁用：",
      previewTitle: "未来绑定前确认预览：",
      confirmationButtonLabel: "提交绑定确认",
      confirmationButtonDisabled: true,
      checklist,
      confirmationPreview,
      state
    });
  }

  window.WeishanCommerceApiBindingPermissionChecklist = {
    CHECKLIST_VERSION,
    PHASE,
    commerceApiBindingPermissionChecklistContract: normalizeApiBindingPermissionChecklistContract(),
    normalizeApiBindingPermissionChecklistContract,
    buildApiBindingPermissionChecklist,
    buildApiBindingUserConfirmationPreview,
    getApiBindingChecklistState,
    assertApiBindingPermissionChecklistSafe,
    buildApiBindingPermissionChecklistDisplay
  };
})();
