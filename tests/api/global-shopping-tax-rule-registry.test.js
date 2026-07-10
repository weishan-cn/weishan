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
  const windowRef = load("apps/desktop/src/renderer/core/globalShoppingTaxRuleRegistry.js");
  const api = windowRef.WeishanGlobalShoppingTaxRuleRegistry;
  const us = api.buildGlobalShoppingTaxRuleSnapshot({ destinationCountry:"US", sourceCountry:"JP" });
  const eu = api.buildGlobalShoppingTaxRuleSnapshot({ destinationCountry:"DE", sourceCountry:"US" });
  const unknown = api.buildGlobalShoppingTaxRuleSnapshot({ destinationCountry:"BR" });

  assert.equal(api.GLOBAL_SHOPPING_TAX_RULE_REGISTRY_VERSION, "4.2.8");
  assert.equal(us.rules.some((rule) => rule.label === "importDuty"), true);
  assert.equal(eu.rules.some((rule) => rule.label === "VAT"), true);
  assert.equal(unknown.rules[0].confidence, "unknown");
  console.log("GLOBAL_SHOPPING_TAX_RULE_REGISTRY PASS");
}

main();
