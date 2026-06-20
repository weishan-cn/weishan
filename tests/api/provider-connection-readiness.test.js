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

const windowRef = loadRendererCore([
  "apps/desktop/src/renderer/core/providerConnectionReadinessDecisionEngine.js",
  "apps/desktop/src/renderer/core/providerConnectionReadinessConsole.js"
]);

const decisionApi = windowRef.WeishanProviderConnectionReadinessDecisionEngine;
const consoleApi = windowRef.WeishanProviderConnectionReadinessConsole;

function assertNoDangerousSurface(value) {
  const serialized = JSON.stringify(value);
  assert.equal(/https?:\/\/[^"]*(booking|checkout|payment|order)/i.test(serialized), false);
  assert.equal(/fake price|mock price|demo price|AI 估价/i.test(serialized), false);
  assert.equal(/(sk-[A-Za-z0-9_-]{12,}|rawApiKey"\s*:\s*"[^"]+|rawToken"\s*:\s*"[^"]+)/i.test(serialized), false);
}

function main() {
  assert.equal(typeof decisionApi.evaluateProviderConnectionReadiness, "function");
  assert.equal(typeof consoleApi.buildProviderConnectionReadinessConsole, "function");

  const normalDecision = decisionApi.evaluateProviderConnectionReadiness({ providerCategory:"flight_provider" });
  assert.equal(normalDecision.finalDecision, "no-go");
  assert.equal(normalDecision.realProvider, "disabled");
  assert.equal(normalDecision.realNetwork, "disabled");
  assert.equal(normalDecision.realApiKey, "disabled");
  assert.equal(normalDecision.realEndpoint, "disabled");
  assert.equal(normalDecision.realPrice, "disabled");
  assert.equal(normalDecision.availability, "disabled");
  assert.equal(normalDecision.bookingUrl, "disabled");
  assert.equal(normalDecision.payment, "disabled");
  assert.equal(normalDecision.order, "disabled");
  assert.equal(normalDecision.identityUpload, "disabled");
  assert.equal(normalDecision.auditDraft.eventType, "PROVIDER_CONNECTION_READINESS_CONSOLE_DRAFT");
  assert.equal(normalDecision.auditDraft.networkAttemptCount, 0);
  assert.equal(normalDecision.auditDraft.realApiKeyReadCount, 0);
  assert.equal(normalDecision.auditDraft.realEndpointConnectCount, 0);
  assert.equal(normalDecision.auditDraft.realPriceReturnCount, 0);
  assert.equal(normalDecision.auditDraft.bookingUrlReturnCount, 0);
  assert.equal(normalDecision.auditDraft.paymentAttemptCount, 0);
  assert.equal(normalDecision.auditDraft.orderAttemptCount, 0);
  assert.equal(normalDecision.auditDraft.identityUploadAttemptCount, 0);
  assert.equal(normalDecision.auditDraft.redacted, true);
  assert.equal(decisionApi.assertProviderConnectionReadinessDecisionSafe(normalDecision), true);

  const restrictedDecision = decisionApi.evaluateProviderConnectionReadiness({ providerCategory:"restricted_provider" });
  assert.equal(restrictedDecision.finalDecision, "blocked");
  assert.equal(restrictedDecision.decisionReason, "restricted category blocked");
  assert.equal(decisionApi.assertProviderConnectionReadinessDecisionSafe(restrictedDecision), true);

  const paymentDecision = decisionApi.evaluateProviderConnectionReadiness({
    providerCategory:"hotel_provider",
    requestsPayment:true
  });
  assert.equal(paymentDecision.finalDecision, "blocked");
  assert.equal(paymentDecision.decisionReason, "forbidden capability requested");

  const consoleState = consoleApi.buildProviderConnectionReadinessConsole();
  assert.equal(consoleState.consoleVersion, "2.1.24");
  assert.equal(consoleState.status, "readiness console only");
  assert.equal(consoleState.mode, "offline planning only");
  assert.equal(consoleState.realProvider, "disabled");
  assert.equal(consoleState.realNetwork, "disabled");
  assert.equal(consoleState.realApiKey, "disabled");
  assert.equal(consoleState.realEndpoint, "disabled");
  assert.equal(consoleState.realPrice, "disabled");
  assert.equal(consoleState.availability, "disabled");
  assert.equal(consoleState.bookingUrl, "disabled");
  assert.equal(consoleState.payment, "disabled");
  assert.equal(consoleState.order, "disabled");
  assert.equal(consoleState.identityUpload, "disabled");
  assert.equal(consoleState.redacted, true);

  const categories = consoleState.categoryRows.map((row) => row.providerCategory);
  assert.equal(JSON.stringify(categories), JSON.stringify([
    "flight_provider",
    "hotel_provider",
    "product_provider",
    "local_service_provider",
    "ticket_activity_provider",
    "restricted_provider"
  ]));

  for (const row of consoleState.categoryRows) {
    assert.equal(row.realProvider, "disabled");
    assert.equal(row.realNetwork, "disabled");
    assert.equal(row.realApiKey, "disabled");
    assert.equal(row.realEndpoint, "disabled");
    assert.equal(row.realPrice, "disabled");
    assert.equal(row.availability, "disabled");
    assert.equal(row.bookingUrl, "disabled");
    assert.equal(row.payment, "disabled");
    assert.equal(row.order, "disabled");
    assert.equal(row.identityUpload, "disabled");
    assert.equal(["no-go", "blocked"].includes(row.finalDecision), true);
  }

  assert.equal(consoleState.categoryRows.filter((row) => row.finalDecision === "blocked").length, 1);
  assert.equal(consoleState.categoryRows.find((row) => row.providerCategory === "restricted_provider").finalDecision, "blocked");
  assert.equal(consoleState.readinessMatrix.rows.length, 6);
  assert.equal(consoleState.readinessMatrix.rows.some((row) => row.includes("flight_provider") && row.includes("no-go")), true);
  assert.equal(consoleState.readinessMatrix.rows.some((row) => row.includes("restricted_provider") && row.includes("blocked")), true);
  assert.equal(consoleState.auditDraft.approvedProviderCount, 0);
  assert.equal(consoleState.auditDraft.connectedProviderCount, 0);
  assert.equal(consoleState.auditDraft.networkAttemptCount, 0);
  assert.equal(consoleState.auditDraft.realApiKeyReadCount, 0);
  assert.equal(consoleState.auditDraft.realEndpointConnectCount, 0);
  assert.equal(consoleState.auditDraft.realPriceReturnCount, 0);
  assert.equal(consoleState.auditDraft.bookingUrlReturnCount, 0);
  assert.equal(consoleState.auditDraft.paymentAttemptCount, 0);
  assert.equal(consoleState.auditDraft.orderAttemptCount, 0);
  assert.equal(consoleState.auditDraft.identityUploadAttemptCount, 0);
  assert.equal(consoleState.auditDraft.redacted, true);
  assert.equal(consoleApi.assertProviderConnectionReadinessConsoleSafe(consoleState), true);

  assertNoDangerousSurface(normalDecision);
  assertNoDangerousSurface(restrictedDecision);
  assertNoDangerousSurface(consoleState);

  console.log("PROVIDER_CONNECTION_READINESS_CORE PASS");
}

main();
