#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const modulePaths = [
  "apps/desktop/src/renderer/core/commerceProviderComplianceDecisionEngine.js",
  "apps/desktop/src/renderer/core/commerceOfflineProviderFixtureRunner.js",
  "apps/desktop/src/renderer/core/commerceNoNetworkSentinelAudit.js",
  "apps/desktop/src/renderer/core/commerceProviderComplianceEvidenceReport.js"
];

function loadBrowserModule(relativePath, context){
  const fullPath = path.join(repoRoot, relativePath);
  const source = fs.readFileSync(fullPath, "utf8");
  vm.runInContext(source, context, { filename:relativePath });
}

function assertNoForbiddenOutput(text){
  const forbidden = [
    /https?:\/\/[^\s]+/i,
    /api[_-]?key\s*[:=]\s*[A-Za-z0-9_-]{8,}/i,
    /secret\s*[:=]\s*[A-Za-z0-9_-]{8,}/i,
    /token\s*[:=]\s*[A-Za-z0-9_-]{8,}/i,
    /bookingUrl\s*[:=]\s*https?:\/\//i,
    /真实价格\s*[:：]\s*[¥$]/,
    /最低价\s*[¥$]/,
    /约\s*[¥$]/,
    /CNY\s*\d+/i
  ];
  const hit = forbidden.find((pattern) => pattern.test(text));
  if (hit) {
    throw new Error("OFFLINE_FIXTURE_OUTPUT_FORBIDDEN_PATTERN " + hit);
  }
}

function main(){
  const sandbox = { window:{} };
  sandbox.globalThis = sandbox;
  const context = vm.createContext(sandbox);
  modulePaths.forEach((relativePath) => loadBrowserModule(relativePath, context));

  const runner = sandbox.window.WeishanCommerceOfflineProviderFixtureRunner;
  const decision = sandbox.window.WeishanCommerceProviderComplianceDecisionEngine;
  const sentinel = sandbox.window.WeishanCommerceNoNetworkSentinelAudit;
  const evidence = sandbox.window.WeishanCommerceProviderComplianceEvidenceReport;
  if (!runner || !decision || !sentinel || !evidence) {
    throw new Error("OFFLINE_PROVIDER_FIXTURE_RUNNER_MODULE_LOAD_FAILED");
  }

  const summary = runner.runOfflineProviderFixtures();
  const decisionReport = decision.buildProviderComplianceDecisionReport();
  const sentinelDisplay = sentinel.buildNoNetworkSentinelAuditDisplay();
  const evidenceReport = evidence.buildProviderComplianceEvidenceReport({ fixtureRunnerState:"offline only / PASS" });

  runner.assertOfflineProviderFixtureRunnerSafe(summary);
  decision.assertProviderComplianceDecisionEngineSafe(decisionReport);
  sentinel.assertNoNetworkSentinelAuditSafe(sentinelDisplay);
  evidence.assertProviderComplianceEvidenceReportSafe(evidenceReport);

  const lines = [
    "COMMERCE_PROVIDER_OFFLINE_FIXTURE_RUNNER PASS",
    "mode=offline_only",
    "network=disabled",
    "fixtureCount=" + summary.fixtureCount,
    "passedFixtureCount=" + summary.passedFixtureCount,
    "failedFixtureCount=" + summary.failedFixtureCount,
    "blockedFixtureCount=" + summary.blockedFixtureCount,
    "withheldFixtureCount=" + summary.withheldFixtureCount,
    "redactedFixtureCount=" + summary.redactedFixtureCount,
    "networkAttemptCount=" + summary.networkAttemptCount,
    "realProviderCallCount=" + summary.realProviderCallCount,
    "realPriceDisplayedCount=" + summary.realPriceDisplayedCount,
    "bookingUrlDisplayedCount=" + summary.bookingUrlDisplayedCount,
    "decisionEngineState=" + decisionReport.defaultDecision.providerActivationDecision,
    "noNetworkSentinelState=" + sentinelDisplay.contract.sentinelStatus,
    "evidenceReportState=" + evidenceReport.contract.providerActivationState,
    "redacted=true"
  ];
  const output = lines.join("\n");
  assertNoForbiddenOutput(output);
  console.log(output);

  if (summary.failedFixtureCount !== 0 || summary.fixtureCount <= 0) {
    process.exitCode = 1;
  }
}

try {
  main();
} catch (error) {
  console.error("COMMERCE_PROVIDER_OFFLINE_FIXTURE_RUNNER FAIL");
  console.error(error && error.message ? error.message : error);
  process.exit(1);
}
