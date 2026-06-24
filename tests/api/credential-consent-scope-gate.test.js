const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function loadRendererCore(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  for (const file of files) {
    const source = fs.readFileSync(path.join(ROOT, file), "utf8");
    vm.runInContext(source, context, { filename:file });
  }
  return window;
}

function assertNoDangerousSurface(value) {
  const serialized = JSON.stringify(value);
  assert.equal(/https?:\/\/[^"]*(booking|checkout|payment|order)/i.test(serialized), false);
  assert.equal(/fake price|mock price|demo price|AI 估价/i.test(serialized), false);
  assert.equal(/(sk-[A-Za-z0-9_-]{12,}|rawApiKey"\s*:\s*"[^"]+|rawToken"\s*:\s*"[^"]+)/i.test(serialized), false);
}

const windowRef = loadRendererCore([
  "apps/desktop/src/renderer/core/credentialConsentScopeGate.js",
  "apps/desktop/src/renderer/core/commerceCredentialConsentScopeGate.js"
]);

const api = windowRef.WeishanCredentialConsentScopeGate;
const bridge = windowRef.WeishanCommerceCredentialConsentScopeGate;

function main() {
  assert.equal(api.CREDENTIAL_CONSENT_SCOPE_GATE_VERSION, "2.1.79");
  assert.equal(typeof api.buildCredentialConsentScopeGate, "function");
  assert.equal(typeof api.assertCredentialConsentScopeGateSafe, "function");

  const gate = api.buildCredentialConsentScopeGate();
  assert.equal(gate.gateVersion, "2.1.79");
  assert.equal(gate.phase, "credential_consent_scope_gate");
  assert.equal(gate.status, "credential consent gate only");
  assert.equal(gate.mode, "no provider connection");
  assert.equal(gate.consentState, "draft_ready");
  assert.equal(gate.finalDecision, "no-go");
  assert.equal(gate.realCredentialInput, "disabled");
  assert.equal(gate.realCredentialSave, "disabled");
  assert.equal(gate.realCredentialRead, "disabled");
  assert.equal(gate.realProviderConnection, "disabled");
  assert.equal(gate.realEndpointConnection, "disabled");
  assert.equal(gate.realNetwork, "disabled");
  assert.equal(gate.realPrice, "disabled");
  assert.equal(gate.availability, "disabled");
  assert.equal(gate.bookingUrl, "disabled");
  assert.equal(gate.payment, "disabled");
  assert.equal(gate.order, "disabled");
  assert.equal(gate.identityUpload, "disabled");
  assert.equal(gate.keychainMode, "disabled");
  assert.equal(gate.safeStorageMode, "disabled");
  assert.equal(gate.envMode, "disabled");
  assert.equal(gate.browserStorageMode, "disabled");
  assert.equal(gate.redacted, true);

  assert.equal(JSON.stringify(gate.allowedScopes), JSON.stringify([
    "readonly_search",
    "readonly_price",
    "readonly_availability_metadata",
    "readonly_inventory",
    "result_analysis",
    "source_label_display"
  ]));

  for (const scope of [
    "write_api",
    "create_order",
    "payment",
    "checkout",
    "booking",
    "identity_upload",
    "passport_upload",
    "bank_card_save",
    "background_silent_call",
    "plaintext_key_export",
    "provider_endpoint_test",
    "real_network_call"
  ]) {
    assert.equal(gate.forbiddenScopes.includes(scope), true);
  }

  for (const phrase of [
    "我确认该 API 仅用于只读搜索和价格读取",
    "我理解 weishan 不会替我付款",
    "我理解 weishan 不会替我下单",
    "我理解 weishan 不会上传身份证、护照或银行卡",
    "我理解最终价格以外部平台页面为准",
    "我理解当前版本不会连接真实 endpoint",
    "我理解当前版本不会返回真实价格",
    "我理解当前版本不会保存或使用真实 API key"
  ]) {
    assert.equal(gate.requiredConfirmations.includes(phrase), true);
  }

  const checked = api.toggleAllTestConfirmations(gate);
  assert.equal(checked.checkedConfirmationCount, checked.requiredConfirmations.length);
  assert.equal(checked.allTestConfirmationsChecked, true);
  for (const phrase of checked.requiredConfirmations) {
    assert.equal(checked.checkedConfirmations.includes(phrase), true);
  }
  const cleared = api.clearTestConfirmations(checked);
  assert.equal(cleared.checkedConfirmationCount, 0);
  assert.equal(cleared.allTestConfirmationsChecked, false);

  const auditDraft = api.buildCredentialConsentScopeAuditDraft(gate);
  assert.equal(auditDraft.eventType, "CREDENTIAL_CONSENT_SCOPE_GATE_DRAFT");
  assert.equal(auditDraft.networkAttemptCount, 0);
  assert.equal(auditDraft.realApiKeyInputCount, 0);
  assert.equal(auditDraft.realApiKeySaveCount, 0);
  assert.equal(auditDraft.realApiKeyReadCount, 0);
  assert.equal(auditDraft.realEndpointConnectCount, 0);
  assert.equal(auditDraft.realPriceReturnCount, 0);
  assert.equal(auditDraft.bookingUrlReturnCount, 0);
  assert.equal(auditDraft.paymentAttemptCount, 0);
  assert.equal(auditDraft.orderAttemptCount, 0);
  assert.equal(auditDraft.identityUploadAttemptCount, 0);
  assert.equal(auditDraft.redacted, true);
  assert.equal(api.assertCredentialConsentScopeGateSafe(gate), true);

  const bridgeGate = bridge.buildCredentialConsentScopeGateDisplay();
  assert.equal(bridgeGate.gateVersion, "2.1.79");
  assert.equal(bridgeGate.status, "credential consent gate only");
  assert.equal(bridgeGate.finalDecision, "no-go");
  assert.equal(bridge.assertCredentialConsentScopeGateSafe(bridgeGate), true);

  assertNoDangerousSurface(gate);
  assertNoDangerousSurface(bridgeGate);
  assertNoDangerousSurface(auditDraft);

  console.log("CREDENTIAL_CONSENT_SCOPE_GATE_CORE PASS");
}

main();
