#!/usr/bin/env node

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function loadModule() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  const source = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/publicBetaReleaseHardeningGate.js"), "utf8");
  vm.runInContext(source, context, { filename:"publicBetaReleaseHardeningGate.js" });
  return window.WeishanPublicBetaReleaseHardeningGate;
}

function governance(overrides) {
  return Object.assign({
    executionGate:"CLOSED",
    authorizesExecution:false,
    productionTraffic:false,
    productionAffected:false,
    WEISHAN_PAYS_PROVIDER:false,
    PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false
  }, overrides || {});
}

const api = loadModule();
const desktopPackage = JSON.parse(fs.readFileSync(path.join(ROOT, "apps/desktop/package.json"), "utf8"));

assert.equal(api.VERSION, "4.2.8");
assert.equal(api.MODULE_NAME, "public_beta_release_hardening_gate_v1");

{
  const metadata = api.evaluateReleaseMetadata({ desktopPackage });
  assert.equal(metadata.status, "PASS");
  assert.equal(metadata.productName, "Weishan");
  assert.equal(metadata.buildProductName, "Weishan");
  assert.equal(metadata.appId, "ai.weishan.desktop");
  assert.equal(metadata.macTargets.includes("dmg"), true);
  assert.equal(metadata.winTargets.includes("nsis"), true);
}

{
  const result = api.evaluateRuntimeBoundaries({
    environment:"production",
    productionSwitches:{
      executionGateOpen:"true",
      productionTraffic:"false",
      booking:"false",
      order:"0",
      payment:"off",
      ticketing:"no"
    }
  });
  assert.equal(result.status, "PASS");
  assert.equal(result.productionTraffic, false);
  assert.equal(result.booking, false);
  assert.equal(result.payment, false);
}

{
  const result = api.evaluateRuntimeBoundaries({
    environment:"production",
    productionSwitches:{ executionGateOpen:true, productionTraffic:true }
  });
  assert.equal(result.status, "FAIL");
}

{
  const truth = api.evaluateProviderTruth({
    coverage:{
      shopping:"controlled_read_only",
      flight:"live_sources_limited",
      hotel:"provider_pending",
      cruise:"handoff_only"
    }
  });
  assert.equal(truth.status, "PASS");
  assert.equal(truth.publicBetaClaim, "truthful_limited_read_only_or_handoff");
}

{
  const safe = api.sanitizeObject({
    message:"Bearer abc123 at /Users/boge/private/path",
    client_secret:"super-secret",
    apiKey:"provider-key",
    nested:{ rawProviderResponse:{ value:"raw" }, visible:"ok" }
  });
  assert.equal(JSON.stringify(safe).includes("super-secret"), false);
  assert.equal(JSON.stringify(safe).includes("provider-key"), false);
  assert.equal(JSON.stringify(safe).includes("/Users/boge"), false);
  assert.equal(safe.nested.visible, "ok");
}

{
  const checklist = api.buildPublicBetaReleaseChecklist({ releaseCandidate:"local" });
  assert.equal(checklist.sections.length >= 12, true);
  assert.equal(checklist.sections.some((item) => item.sectionId === "startup"), true);
  assert.equal(checklist.sections.some((item) => item.sectionId === "feedback" && item.status === "PENDING_SEPARATE_APPROVAL"), true);
}

{
  const result = api.evaluatePublicBetaReleaseHardening({
    desktopPackage,
    governance:governance(),
    environment:"development",
    productionSwitches:{},
    coverage:{
      shopping:"controlled_read_only",
      flight:"live_sources_limited",
      hotel:"provider_pending",
      cruise:"handoff_only"
    },
    diagnostics:{
      userMessage:"startup ok",
      token:"must-not-leak"
    }
  });
  assert.equal(result.status, "PASS");
  assert.equal(result.feedbackMailboxImplemented, false);
  assert.equal(result.feedbackMissionRequired, true);
  assert.equal(result.externalEffects.providerApiCalls, 0);
  assert.equal(result.externalEffects.productionTraffic, 0);
  assert.equal(JSON.stringify(result).includes("must-not-leak"), false);
}

console.log("PUBLIC_BETA_RELEASE_HARDENING_GATE PASS");
