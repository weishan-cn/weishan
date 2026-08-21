"use strict";

const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const {
  PROVIDER_OAUTH_CALLBACK_CLASSIFICATION,
  DAISYCON_OAUTH_POLICY,
  createProviderOAuthCallbackFoundation
} = require(path.join(ROOT, "apps/desktop/src/main/providerOAuthCallbackFoundation.js"));
const {
  createSecureApiKeyStorageService
} = require(path.join(ROOT, "apps/desktop/src/main/secureApiKeyStorage.js"));

const CLIENT_ID = "WEISHAN_DAISYCON_TEST_CLIENT_ID";
const CLIENT_SECRET = "WEISHAN_DAISYCON_TEST_CLIENT_SECRET";
const ACCESS_TOKEN = "WEISHAN_DAISYCON_TEST_ACCESS_TOKEN";
const REFRESH_TOKEN = "WEISHAN_DAISYCON_TEST_REFRESH_TOKEN";

function fakeSafeStorage() {
  return {
    isEncryptionAvailable:() => true,
    encryptString:(value) => Buffer.from("enc:" + Buffer.from(String(value), "utf8").toString("base64")),
    decryptString:(buffer) => Buffer.from(Buffer.from(buffer).toString("utf8").slice(4), "base64").toString("utf8")
  };
}

function response(status, payload) {
  return {
    ok:status >= 200 && status < 300,
    status,
    text:async () => JSON.stringify(payload)
  };
}

function stateFrom(url) {
  return new URL(url).searchParams.get("state");
}

function challengeFrom(url) {
  return new URL(url).searchParams.get("code_challenge");
}

function callbackUrl(state, code = "AUTH_CODE_12345678") {
  return "https://login.daisycon.com/oauth/cli?code=" + encodeURIComponent(code) + "&state=" + encodeURIComponent(state);
}

async function main() {
  let nowMs = 100000;
  const foundation = createProviderOAuthCallbackFoundation({ now:() => nowMs, ttlMs:60000 });
  const policies = foundation.listPolicies();
  assert.equal(policies.length, 1);
  assert.equal(policies[0].provider, "daisycon");
  assert.equal(policies[0].redirectUri, "https://login.daisycon.com/oauth/cli");
  assert.equal(policies[0].pkceRequired, true);
  assert.equal(policies[0].stateRequired, true);
  assert.equal(policies[0].executionGate, "CLOSED");
  assert.equal(policies[0].providerOAuthExecution, false);
  assert.equal(policies[0].productionTraffic, false);

  const begin = foundation.beginAuthorization({ provider:"daisycon", clientId:CLIENT_ID });
  assert.equal(begin.ok, true);
  assert.equal(begin.classification, PROVIDER_OAUTH_CALLBACK_CLASSIFICATION);
  assert.equal(begin.redirectUri, "https://login.daisycon.com/oauth/cli");
  const authUrl = new URL(begin.authorizationUrl);
  assert.equal(authUrl.origin + authUrl.pathname, "https://login.daisycon.com/oauth/authorize");
  assert.equal(authUrl.searchParams.get("response_type"), "code");
  assert.equal(authUrl.searchParams.get("client_id"), CLIENT_ID);
  assert.equal(authUrl.searchParams.get("redirect_uri"), DAISYCON_OAUTH_POLICY.redirectUri);
  assert.equal(authUrl.searchParams.get("code_challenge_method"), "S256");
  assert.equal(challengeFrom(begin.authorizationUrl).length >= 43, true);
  assert.equal(begin.authorizationUrl.includes("client_secret"), false);
  assert.equal(begin.executionGate, "CLOSED");
  assert.equal(begin.authorizesExecution, false);

  const state = stateFrom(begin.authorizationUrl);
  const received = foundation.receiveCallback({ provider:"daisycon", callbackUrl:callbackUrl(state) });
  assert.equal(received.ok, true);
  assert.equal(received.stateValidated, true);
  assert.equal(received.redirectValidated, true);
  assert.equal(received.codeConsumed, true);
  assert.equal(JSON.stringify(received).includes("AUTH_CODE_12345678"), false);

  const replay = foundation.receiveCallback({ provider:"daisycon", callbackUrl:callbackUrl(state) });
  assert.equal(replay.ok, false);
  assert.equal(replay.error.code, "AUTHORIZATION_CODE_ALREADY_CONSUMED");

  const service = createSecureApiKeyStorageService({
    storageDir:require("node:fs").mkdtempSync(path.join(require("node:os").tmpdir(), "weishan-oauth-store-")),
    safeStorage:fakeSafeStorage()
  });
  assert.equal(service.mainProcess.putCredentialBundle(
    DAISYCON_OAUTH_POLICY.credentialDescriptor,
    { client_secret:CLIENT_SECRET },
    "secure_entry_zone"
  ).ok, true);

  const tokenRequests = [];
  const exchanged = await foundation.exchangeToken({
    transactionId:begin.transactionId,
    credentialStore:service,
    persistRefreshToken:true,
    tokenTransport:async (url, init) => {
      tokenRequests.push({ url, init });
      assert.equal(url, "https://login.daisycon.com/oauth/access-token");
      assert.equal(init.method, "POST");
      assert.equal(init.headers.Authorization, undefined);
      assert.equal(init.headers["Content-Type"], "application/x-www-form-urlencoded");
      assert.match(init.body, /grant_type=authorization_code/);
      assert.match(init.body, /client_id=WEISHAN_DAISYCON_TEST_CLIENT_ID/);
      assert.match(init.body, /client_secret=WEISHAN_DAISYCON_TEST_CLIENT_SECRET/);
      assert.match(init.body, /code_verifier=/);
      assert.match(init.body, /redirect_uri=https%3A%2F%2Flogin\.daisycon\.com%2Foauth%2Fcli/);
      return response(200, {
        access_token:ACCESS_TOKEN,
        refresh_token:REFRESH_TOKEN,
        token_type:"Bearer",
        expires_in:1800
      });
    }
  });
  assert.equal(exchanged.ok, true);
  assert.equal(exchanged.oauth, "PASS");
  assert.equal(exchanged.accessTokenReceived, true);
  assert.equal(exchanged.refreshTokenReceived, true);
  assert.equal(exchanged.accessTokenPersisted, false);
  assert.equal(exchanged.refreshTokenPersisted, true);
  assert.equal(exchanged.tokenPersisted, true);
  assert.equal(exchanged.rawResponsePersisted, false);
  assert.equal(exchanged.providerOAuthExecution, false);
  assert.equal(exchanged.productionTraffic, false);
  assert.equal(tokenRequests.length, 1);
  const serializedExchange = JSON.stringify(exchanged);
  for (const forbidden of [CLIENT_SECRET, ACCESS_TOKEN, REFRESH_TOKEN, "AUTH_CODE_12345678", "Authorization"]) {
    assert.equal(serializedExchange.includes(forbidden), false, forbidden + " leaked");
  }
  const refreshMetadata = service.listProviderCredentialMetadata({
    provider:"daisycon",
    environment:"production",
    application:"Weishan Global Commerce",
    credentialType:"refresh_token"
  });
  assert.equal(refreshMetadata.records.length, 1);
  assert.equal(refreshMetadata.records[0].secretAvailable, true);
  assert.equal(JSON.stringify(refreshMetadata).includes(REFRESH_TOKEN), false);

  const secondExchange = await foundation.exchangeToken({
    transactionId:begin.transactionId,
    credentialStore:service,
    tokenTransport:async () => response(200, {})
  });
  assert.equal(secondExchange.ok, false);
  assert.equal(secondExchange.error.code, "AUTHORIZATION_CODE_REQUIRED");

  const wrongState = foundation.receiveCallback({ provider:"daisycon", callbackUrl:callbackUrl("wrong_state") });
  assert.equal(wrongState.ok, false);
  assert.equal(wrongState.error.code, "STATE_MISMATCH");
  const missingState = foundation.receiveCallback({ provider:"daisycon", callbackUrl:"https://login.daisycon.com/oauth/cli?code=AUTH_CODE_87654321" });
  assert.equal(missingState.ok, false);
  assert.equal(missingState.error.code, "MISSING_STATE");
  const malformedCode = foundation.receiveCallback({ provider:"daisycon", callbackUrl:"https://login.daisycon.com/oauth/cli?code=x&state=" + encodeURIComponent(state) });
  assert.equal(malformedCode.ok, false);
  assert.equal(malformedCode.error.code, "MALFORMED_CODE");
  const arbitraryRedirect = foundation.receiveCallback({ provider:"daisycon", callbackUrl:"https://evil.example/oauth/cli?code=AUTH_CODE_87654321&state=" + encodeURIComponent(state) });
  assert.equal(arbitraryRedirect.ok, false);
  assert.equal(arbitraryRedirect.error.code, "REDIRECT_URI_MISMATCH");
  const unapproved = foundation.beginAuthorization({ provider:"unknown", clientId:CLIENT_ID });
  assert.equal(unapproved.ok, false);
  assert.equal(unapproved.error.code, "UNAPPROVED_PROVIDER");
  const blockedRedirectOverride = foundation.beginAuthorization({
    provider:"daisycon",
    clientId:CLIENT_ID,
    redirectUri:"https://evil.example/callback"
  });
  assert.equal(blockedRedirectOverride.ok, false);
  assert.equal(blockedRedirectOverride.error.code, "UNAPPROVED_REDIRECT_URI");

  const expiring = createProviderOAuthCallbackFoundation({ now:() => nowMs, ttlMs:30000 });
  const expiresBegin = expiring.beginAuthorization({ provider:"daisycon", clientId:CLIENT_ID });
  nowMs += 31000;
  const expired = expiring.receiveCallback({ provider:"daisycon", callbackUrl:callbackUrl(stateFrom(expiresBegin.authorizationUrl), "AUTH_CODE_EXPIRED_123") });
  assert.equal(expired.ok, false);
  assert.equal(expired.error.code, "OAUTH_TRANSACTION_EXPIRED");

  nowMs = 200000;
  const concurrent = createProviderOAuthCallbackFoundation({ now:() => nowMs, ttlMs:60000 });
  const first = concurrent.beginAuthorization({ provider:"daisycon", clientId:CLIENT_ID });
  const second = concurrent.beginAuthorization({ provider:"daisycon", clientId:"WEISHAN_DAISYCON_TEST_CLIENT_ID_2" });
  assert.notEqual(stateFrom(first.authorizationUrl), stateFrom(second.authorizationUrl));
  assert.notEqual(first.transactionId, second.transactionId);
  assert.equal(concurrent.receiveCallback({ provider:"daisycon", callbackUrl:callbackUrl(stateFrom(second.authorizationUrl), "AUTH_CODE_SECOND_123") }).transactionId, second.transactionId);

  const cancelled = concurrent.beginAuthorization({ provider:"daisycon", clientId:"WEISHAN_DAISYCON_TEST_CLIENT_ID_3" });
  assert.equal(concurrent.cancelTransaction(cancelled.transactionId).ok, true);
  const cancelledExchange = await concurrent.exchangeToken({
    transactionId:cancelled.transactionId,
    credentialStore:service,
    tokenTransport:async () => response(200, {})
  });
  assert.equal(cancelledExchange.ok, false);
  assert.equal(cancelledExchange.error.code, "OAUTH_TRANSACTION_CANCELLED");

  const tokenFailureFlow = createProviderOAuthCallbackFoundation({ now:() => nowMs, ttlMs:60000 });
  const tokenFailureBegin = tokenFailureFlow.beginAuthorization({ provider:"daisycon", clientId:CLIENT_ID });
  tokenFailureFlow.receiveCallback({ provider:"daisycon", callbackUrl:callbackUrl(stateFrom(tokenFailureBegin.authorizationUrl), "AUTH_CODE_FAILURE_123") });
  const tokenFailure = await tokenFailureFlow.exchangeToken({
    transactionId:tokenFailureBegin.transactionId,
    credentialStore:service,
    tokenTransport:async () => response(400, { error:"invalid_grant", error_description:CLIENT_SECRET + ACCESS_TOKEN })
  });
  assert.equal(tokenFailure.ok, false);
  assert.equal(tokenFailure.error.code, "TOKEN_HTTP_ERROR");
  assert.equal(JSON.stringify(tokenFailure).includes(CLIENT_SECRET), false);
  assert.equal(JSON.stringify(tokenFailure).includes(ACCESS_TOKEN), false);

  const missingStoreFlow = createProviderOAuthCallbackFoundation({ now:() => nowMs, ttlMs:60000 });
  const missingStoreBegin = missingStoreFlow.beginAuthorization({ provider:"daisycon", clientId:CLIENT_ID });
  missingStoreFlow.receiveCallback({ provider:"daisycon", callbackUrl:callbackUrl(stateFrom(missingStoreBegin.authorizationUrl), "AUTH_CODE_NOSTORE_123") });
  const missingStore = await missingStoreFlow.exchangeToken({
    transactionId:missingStoreBegin.transactionId,
    tokenTransport:async () => response(200, {})
  });
  assert.equal(missingStore.ok, false);
  assert.equal(missingStore.error.code, "CREDENTIAL_STORE_UNAVAILABLE");

  const moduleSource = require("node:fs").readFileSync(path.join(ROOT, "apps/desktop/src/main/providerOAuthCallbackFoundation.js"), "utf8");
  const mainSource = require("node:fs").readFileSync(path.join(ROOT, "apps/desktop/src/main.js"), "utf8");
  const preloadSource = require("node:fs").readFileSync(path.join(ROOT, "apps/desktop/src/preload.js"), "utf8");
  assert.equal(moduleSource.includes("ipcMain"), false);
  assert.equal(moduleSource.includes("localStorage"), false);
  assert.equal(moduleSource.includes("sessionStorage"), false);
  assert.equal(mainSource.includes("provider-oauth"), false);
  assert.equal(preloadSource.includes("provider-oauth"), false);

  console.log("PROVIDER_OAUTH_CALLBACK_FOUNDATION PASS scenarios=17 assertions=118 callback=https://login.daisycon.com/oauth/cli");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
