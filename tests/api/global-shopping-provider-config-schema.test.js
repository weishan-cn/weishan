const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load(file) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return window;
}

function main() {
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingProviderConfigurationSchema.js");
  const api = windowRef.WeishanGlobalShoppingProviderConfigurationSchema;
  const valid = api.buildGlobalShoppingProviderConfigurationSchema({
    providerId:"amazon_us",
    name:"Amazon",
    category:"product",
    regions:["US"],
    languages:["en-US"],
    capabilities:["search"],
    officialDomains:["amazon.com"],
    status:"sandbox",
    adapterVersion:"4.2.8-sandbox",
    contractVersion:"4.2.8"
  });
  const invalid = api.buildGlobalShoppingProviderConfigurationSchema({
    providerId:"booking",
    name:"Booking",
    apiKey:"should-not-exist"
  });

  assert.equal(api.GLOBAL_SHOPPING_PROVIDER_CONFIGURATION_SCHEMA_VERSION, "4.2.8");
  assert.equal(valid.valid, true);
  assert.equal(valid.status, "sandbox");
  assert.equal(valid.contractVersion, "4.2.8");
  assert.equal(invalid.valid, false);
  assert.equal(invalid.containsSensitiveFields, true);
  assert.equal(invalid.invalidReason, "sensitive_field_detected");
  console.log("GLOBAL_SHOPPING_PROVIDER_CONFIG_SCHEMA PASS");
}

main();
