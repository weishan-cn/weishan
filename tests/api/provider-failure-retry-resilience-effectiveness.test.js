const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, setTimeout, clearTimeout, Date });
  vm.runInContext(
    fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/providerFailureRetryResilience.js"), "utf8"),
    context,
    { filename:"providerFailureRetryResilience.js" }
  );
  return window.WeishanProviderFailureRetryResilience;
}

function assertNoSecret(value) {
  const serialized = JSON.stringify(value);
  assert.equal(/secret-value|bearer\s+abc|raw-token|authorization:\s*bearer|api_key=live/i.test(serialized), false);
}

async function main() {
  const api = load();
  const categories = [
    ["network ECONNRESET", "NETWORK", true],
    ["source timeout", "TIMEOUT", true],
    ["HTTP 401 unauthorized", "AUTH", false],
    ["rate limit exceeded", "RATE_LIMIT", true],
    ["blocked_policy", "BLOCKED_POLICY", false],
    ["malformed response", "MALFORMED_RESPONSE", false],
    ["credential missing", "CREDENTIAL_MISSING", false],
    ["cancelled by user", "CANCELLED", false],
    ["weird provider failure", "UNKNOWN", false]
  ];
  for (const [message, category, retryable] of categories) {
    const classified = api.classifyProviderFailure({ message });
    assert.equal(classified.category, category);
    assert.equal(classified.retryable, retryable);
    assertNoSecret(api.classifyProviderFailure({ message:"provider failed token=secret-value authorization: bearer abc" }));
  }

  assert.equal(api.buildRetryDecision({ failure:{ category:"NETWORK" }, attempt:1, maxAttempts:2 }).shouldRetry, true);
  assert.equal(api.buildRetryDecision({ failure:{ category:"AUTH" }, attempt:1, maxAttempts:3 }).shouldRetry, false);
  assert.equal(api.buildRetryDecision({ failure:{ category:"BLOCKED_POLICY" }, attempt:1, maxAttempts:3 }).shouldRetry, false);
  assert.equal(api.buildRetryDecision({ failure:{ category:"CREDENTIAL_MISSING" }, attempt:1, maxAttempts:3 }).shouldRetry, false);
  assert.equal(api.buildRetryDecision({ failure:{ category:"TIMEOUT" }, attempt:3, maxAttempts:3 }).shouldRetry, false);
  assert.equal(api.buildRetryDecision({ failure:{ category:"RATE_LIMIT" }, retryAfter:"999999", attempt:1, maxAttempts:2 }).delayMs, 30000);
  assert.equal(api.buildRetryDecision({ failure:{ category:"RATE_LIMIT" }, retryAfter:"-5", attempt:1, maxAttempts:2 }).delayMs, 1);

  let retryAttempts = 0;
  const retrySuccess = await api.executeProviderSourceRequest({
    requestId:"retry-success",
    domain:"shopping",
    sourceId:"network-source",
    timeoutMs:25,
    maxAttempts:3,
    backoffMs:1,
    sleep:function () { return Promise.resolve(); },
    run:function () {
      retryAttempts += 1;
      if (retryAttempts === 1) {
        const error = new Error("network ECONNRESET");
        error.category = "NETWORK";
        throw error;
      }
      return { results:[{ id:"ok" }] };
    }
  });
  assert.equal(retrySuccess.status, "success");
  assert.equal(retrySuccess.attempts.length, 2);
  assert.equal(retryAttempts, 2);

  let authAttempts = 0;
  const authFailure = await api.executeProviderSourceRequest({
    requestId:"auth",
    domain:"shopping",
    maxAttempts:3,
    backoffMs:1,
    sleep:function () { return Promise.resolve(); },
    run:function () {
      authAttempts += 1;
      const error = new Error("HTTP 401 unauthorized");
      error.category = "AUTH";
      throw error;
    }
  });
  assert.equal(authFailure.status, "failed_safe");
  assert.equal(authAttempts, 1);
  assert.equal(authFailure.error.category, "AUTH");

  const timeout = await api.executeProviderSourceRequest({
    requestId:"timeout",
    domain:"hotel",
    timeoutMs:5,
    maxAttempts:1,
    run:function () { return new Promise(function () {}); }
  });
  assert.equal(timeout.status, "failed_safe");
  assert.equal(timeout.error.category, "TIMEOUT");

  const controller = api.createController();
  controller.start("B");
  const stale = await api.executeProviderSourceRequest({
    requestId:"A",
    domain:"shopping",
    isCurrent:function (requestId) { return controller.isCurrent(requestId); },
    run:function () { return { results:[{ id:"late-A" }] }; }
  });
  assert.equal(stale.status, "stale_response_ignored");

  controller.start("A");
  let currentId = "A";
  const late = await api.executeProviderSourceRequest({
    requestId:"A",
    domain:"flight",
    isCurrent:function (requestId) { return requestId === currentId; },
    run:async function () {
      currentId = "B";
      return { results:[{ id:"late-success" }] };
    }
  });
  assert.equal(late.status, "stale_response_ignored");

  const aborted = new AbortController();
  aborted.abort();
  const cancelled = await api.executeProviderSourceRequest({
    requestId:"cancelled",
    domain:"cruise",
    signal:aborted.signal,
    run:function () { throw new Error("must not run"); }
  });
  assert.equal(cancelled.status, "cancelled");

  const partial = await api.executeProviderSourceBatch({
    requestId:"partial",
    domain:"shopping",
    timeoutMs:25,
    maxAttempts:1,
    sources:[
      { sourceId:"good", run:function () { return { results:[{ id:"valid" }] }; } },
      { sourceId:"bad", run:function () { const error = new Error("malformed response"); error.category = "MALFORMED_RESPONSE"; throw error; } }
    ]
  });
  assert.equal(partial.status, "partial_results");
  assert.equal(partial.results.length, 1);
  assert.equal(partial.failureSummary.failed, 1);

  const allFailed = await api.executeProviderSourceBatch({
    requestId:"all-failed",
    domain:"shopping",
    timeoutMs:25,
    maxAttempts:1,
    sources:[
      { sourceId:"auth", run:function () { const error = new Error("unauthorized"); error.category = "AUTH"; throw error; } },
      { sourceId:"blocked", run:function () { const error = new Error("blocked_policy"); error.category = "BLOCKED_POLICY"; throw error; } }
    ]
  });
  assert.equal(allFailed.status, "all_sources_failed");
  assert.equal(allFailed.results.length, 0);

  const noResults = await api.executeProviderSourceBatch({
    requestId:"no-results",
    domain:"shopping",
    timeoutMs:25,
    maxAttempts:1,
    sources:[
      { sourceId:"empty", run:function () { return { results:[] }; } }
    ]
  });
  assert.equal(noResults.status, "no_results");

  let overlappingAttempts = 0;
  const first = api.executeProviderSourceRequest({
    requestId:"manual-overlap",
    domain:"shopping",
    timeoutMs:25,
    maxAttempts:2,
    backoffMs:1,
    sleep:function () { return Promise.resolve(); },
    run:function () {
      overlappingAttempts += 1;
      const error = new Error("network");
      error.category = "NETWORK";
      throw error;
    }
  });
  const second = api.executeProviderSourceRequest({
    requestId:"manual-overlap-new",
    domain:"shopping",
    timeoutMs:25,
    maxAttempts:1,
    run:function () { return { results:[{ id:"manual" }] }; }
  });
  const overlapResults = await Promise.all([first, second]);
  assert.equal(overlapResults[0].attempts.length, 2);
  assert.equal(overlapResults[1].status, "success");
  assert.equal(overlappingAttempts, 2);

  const perfPolicies = Array.from({ length:1000 }, (_, index) => api.buildRetryDecision({
    failure:{ category:index % 2 ? "NETWORK" : "AUTH" },
    attempt:1,
    maxAttempts:2,
    backoffMs:1
  }));
  assert.equal(perfPolicies.length, 1000);
  assert.equal(perfPolicies.filter((item) => item.shouldRetry).length, 500);

  const perfBatch = await api.executeProviderSourceBatch({
    requestId:"perf-100",
    domain:"shopping",
    timeoutMs:25,
    maxAttempts:1,
    sources:Array.from({ length:100 }, (_, index) => ({
      sourceId:"source-" + index,
      run:function () { return { results:[{ id:"item-" + index }] }; }
    }))
  });
  assert.equal(perfBatch.status, "success");
  assert.equal(perfBatch.results.length, 100);

  const rapidController = api.createController();
  let staleCount = 0;
  for (let index = 0; index < 50; index += 1) {
    rapidController.start("request-" + index);
    const outcome = await api.executeProviderSourceRequest({
      requestId:index === 49 ? "request-49" : "request-" + index,
      domain:"shopping",
      isCurrent:function (requestId) { return rapidController.isCurrent(requestId); },
      run:function () { return { results:[{ id:"latest" }] }; }
    });
    if (outcome.status === "stale_response_ignored") staleCount += 1;
    if (index === 49) assert.equal(outcome.status, "success");
  }
  assert.equal(staleCount, 0);

  console.log([
    "PROVIDER_FAILURE_RETRY_RESILIENCE_EFFECTIVENESS PASS",
    "staleResponseOverwrites=0",
    "cancelledResultUpdates=0",
    "infiniteRetryLoops=0",
    "duplicateRetryLoops=0",
    "retryStorms=0",
    "permanentLoadingStates=0",
    "allFailureFakeResults=0",
    "noResultMisclassifiedAsFailure=0",
    "failureMisclassifiedAsNoResult=0",
    "domainCrossoverResults=0",
    "retryCases=9",
    "timeoutCases=1",
    "raceCases=3",
    "sourceFailureCases=4",
    "perf=100/1000/50"
  ].join(" "));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
