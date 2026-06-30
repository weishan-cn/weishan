;(function () {
  "use strict";

  const FORM_VERSION = "2.3.9";
  const PHASE = "api_binding_mock_form_disabled_state";

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function defaultCapabilities() {
    return {
      canShowDisabledForm: true,
      canShowProviderSelector: true,
      canShowPermissionTierSelector: true,
      canShowApiKeyPlaceholder: true,
      canShowEndpointPlaceholder: true,
      canShowSafetyNotice: true,
      canInputApiKey: false,
      canSaveApiKey: false,
      canSubmitForm: false,
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

  function normalizeApiBindingMockFormContract(contract) {
    const raw = contract && typeof contract === "object" ? contract : {};
    return clone({
      formVersion: String(raw.formVersion || FORM_VERSION),
      phase: String(raw.phase || PHASE),
      formStatus: String(raw.formStatus || "disabled_mock_only"),
      inputMode: String(raw.inputMode || "disabled"),
      submitMode: String(raw.submitMode || "disabled"),
      saveMode: String(raw.saveMode || "disabled"),
      testConnectionMode: String(raw.testConnectionMode || "disabled"),
      realApiKeyMode: String(raw.realApiKeyMode || "disabled"),
      apiKeyPlaintextMode: String(raw.apiKeyPlaintextMode || "forbidden"),
      endpointMode: String(raw.endpointMode || "disabled"),
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

  function field(fieldId, label, placeholder, securityNotice) {
    return {
      fieldId,
      label,
      placeholder,
      disabled: true,
      required: false,
      value: "",
      securityNotice
    };
  }

  function buildApiBindingMockFormFields() {
    return clone([
      field("providerCategory", "平台类型", "请选择平台类型（当前禁用）", "仅展示未来字段，不连接真实 provider。"),
      field("providerName", "平台名称", "请选择平台名称（当前禁用）", "仅展示未来字段，不保存平台凭据。"),
      field("permissionTier", "权限类型", "请选择权限类型（当前禁用）", "写入、下单、支付、身份资料权限均禁用。"),
      field("apiKeyPlaceholder", "API key", "API key（当前不可输入）", "当前版本不保存真实 API key。"),
      field("apiSecretPlaceholder", "API secret", "API secret（当前不可输入）", "当前版本不保存真实 API secret。"),
      field("endpointPlaceholder", "endpoint", "endpoint（当前不可输入）", "当前版本不连接 endpoint，不测试连接。"),
      field("regionScope", "地区", "地区范围（当前禁用）", "仅用于未来只读搜索范围说明。"),
      field("currencyScope", "币种", "币种范围（当前禁用）", "当前不会返回真实价格。"),
      field("callbackUrl", "回调地址", "回调地址（当前禁用）", "当前不会生成回调，不连接外部服务。"),
      field("note", "备注", "备注（当前禁用）", "当前不会提交或保存任何 API 配置。")
    ]);
  }

  function action(actionId, label, reason) {
    return { actionId, label, disabled: true, reason };
  }

  function buildApiBindingMockActions() {
    return clone([
      action("saveApiConfig", "保存 API 配置", "当前版本不保存真实 API key。"),
      action("testConnection", "测试连接", "当前版本不连接 endpoint，不发起网络请求。"),
      action("deleteBinding", "删除绑定", "当前没有真实绑定可删除。"),
      action("enableReadonlySearch", "启用只读搜索", "当前尚未通过人工审批和安全检查。"),
      action("enablePriceResults", "启用价格结果", "当前无真实可信价格源。")
    ]);
  }

  function getApiBindingMockFormState() {
    return clone({
      status: "disabled_mock_only",
      canEdit: false,
      canSave: false,
      canTestConnection: false,
      canUseNetwork: false,
      canReadPrice: false,
      canReturnBookingUrl: false,
      canCreateOrder: false,
      canPay: false,
      canUploadIdentity: false,
      canStoreBankCard: false
    });
  }

  function assertApiBindingMockFormSafe(options) {
    const raw = options && typeof options === "object" ? options : {};
    const fields = Array.isArray(raw.fields) ? raw.fields : buildApiBindingMockFormFields();
    const actions = Array.isArray(raw.actions) ? raw.actions : buildApiBindingMockActions();
    const state = raw.state && typeof raw.state === "object" ? raw.state : getApiBindingMockFormState();
    const violations = [];
    fields.forEach((item) => {
      if (!item || item.disabled !== true) violations.push("field:" + (item && item.fieldId || "unknown"));
      if (item && item.value) violations.push("field_value:" + item.fieldId);
      if (item && /https?:\/\/|sk-|api[_-]?key|secret[_-]?/.test(String(item.value || ""))) violations.push("field_secret:" + item.fieldId);
    });
    actions.forEach((item) => {
      if (!item || item.disabled !== true) violations.push("action:" + (item && item.actionId || "unknown"));
    });
    [
      ["canEdit", false],
      ["canSave", false],
      ["canTestConnection", false],
      ["canUseNetwork", false],
      ["canReadPrice", false],
      ["canReturnBookingUrl", false],
      ["canCreateOrder", false],
      ["canPay", false],
      ["canUploadIdentity", false],
      ["canStoreBankCard", false]
    ].forEach(([key, expected]) => {
      if (state[key] !== expected) violations.push("state:" + key);
    });
    if (violations.length) throw new Error("api_binding_mock_form_violation:" + violations.join(","));
    return true;
  }

  function buildApiBindingMockFormDisplay() {
    const fields = buildApiBindingMockFormFields();
    const actions = buildApiBindingMockActions();
    const state = getApiBindingMockFormState();
    return clone({
      title: "API 绑定表单",
      currentStatusLine: "API 绑定表单为禁用预览，当前版本不保存真实 API key。",
      secureStorageDesignGateLine: "安全存储设计闸门关闭，表单不可用",
      localSecureStorageInterfaceDraftLine: "本机安全存储接口仍为草案，表单不可用",
      keyRedactionAndLogLeakRulesLine: "密钥脱敏与日志防泄露规则已建立，key 删除 / 轮换 / 过期机制草案已建立，但 provider endpoint allowlist 闸门已建立，只读 provider sandbox gate：已建立，等待只读 provider result schema gate；只读 provider result schema gate：已建立，provider result source label gate：未建立，表单仍不可用",
      fieldIntroLine: "表单字段，全部禁用：",
      actionIntroLine: "按钮，全部禁用：",
      safetyLines: [
        "当前版本不能输入真实 API key",
        "当前版本不能保存 API key",
        "当前版本不能测试连接",
        "当前版本不能连接 endpoint",
        "当前版本不能发起网络请求",
        "当前版本不能返回真实价格",
        "当前版本不能返回 bookingUrl",
        "当前版本不能付款",
        "当前版本不能下单",
        "当前版本不能上传身份证、护照或银行卡"
      ],
      fields,
      actions,
      state
    });
  }

  window.WeishanCommerceApiBindingMockForm = {
    FORM_VERSION,
    PHASE,
    commerceApiBindingMockFormContract: normalizeApiBindingMockFormContract(),
    normalizeApiBindingMockFormContract,
    buildApiBindingMockFormFields,
    buildApiBindingMockActions,
    getApiBindingMockFormState,
    assertApiBindingMockFormSafe,
    buildApiBindingMockFormDisplay
  };
})();
