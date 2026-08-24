"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const FILE = "apps/desktop/src/renderer/core/globalCommerceProductIdentityMatcher.js";

function load() {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console });
  vm.runInContext(fs.readFileSync(path.join(ROOT, FILE), "utf8"), context, { filename:FILE });
  return window.WeishanGlobalCommerceProductIdentityMatcher;
}

function classify(input) {
  return load().classifyIdentityMatch(input);
}

function exact(input) {
  const result = classify(input);
  assert.equal(result.matchState, "EXACT_MATCH", result.explanation);
  assert.equal(result.eligibleForExactPriceComparison, true);
  return result;
}

function mismatch(input, reason) {
  const result = classify(input);
  assert.equal(result.matchState, "MISMATCH", result.explanation);
  if (reason) assert.equal(result.conflicts.indexOf(reason) >= 0, true, result.conflicts.join(","));
  assert.equal(result.eligibleForExactPriceComparison, false);
  return result;
}

function possible(input) {
  const result = classify(input);
  assert.equal(result.matchState, "POSSIBLE_MATCH", result.explanation);
  assert.equal(result.eligibleForExactPriceComparison, false);
  return result;
}

function main() {
  const api = load();
  assert.equal(api.MATCH_STATES.EXACT_MATCH, "EXACT_MATCH");

  exact({
    requestedIdentity:{ brand:"Acme", model:"AX-100" },
    requestedVariant:{ storage:"1TB", condition:"new" },
    candidateIdentity:{ brand:"acme", model:"ax-100" },
    candidateVariant:{ storage:"1024GB", condition:"Brand New" }
  });

  mismatch({
    requestedIdentity:{ brand:"Acme", model:"AX-100" },
    requestedVariant:{ storage:"128GB" },
    candidateIdentity:{ brand:"Acme", model:"AX-100" },
    candidateVariant:{ storage:"256GB" }
  }, "STORAGE_CONFLICT");

  mismatch({
    requestedIdentity:{ brand:"Acme", model:"AX-100", family:"AX" },
    requestedVariant:{ generation:"2" },
    candidateIdentity:{ brand:"Acme", model:"AX-200", family:"AX" },
    candidateVariant:{ generation:"3" }
  }, "MODEL_CONFLICT");

  mismatch({
    requestedIdentity:{ brand:"Acme", model:"AX-100" },
    requestedVariant:{ condition:"new" },
    candidateIdentity:{ brand:"Acme", model:"AX-100" },
    candidateVariant:{ condition:"refurbished" }
  }, "CONDITION_CONFLICT");

  mismatch({
    requestedIdentity:{ brand:"Acme", model:"AX-100" },
    requestedVariant:{ bundleState:"standalone" },
    candidateIdentity:{ brand:"Acme", model:"AX-100" },
    candidateVariant:{ bundleState:"bundle" }
  }, "BUNDLESTATE_CONFLICT");

  exact({
    requestedIdentity:{ brand:"Acme", model:"AX-100" },
    requestedVariant:{ color:"black" },
    candidateIdentity:{ brand:"Acme", model:"AX-100" },
    candidateVariant:{ color:"black" }
  });

  mismatch({
    requestedIdentity:{ brand:"Acme", model:"AX-100" },
    requestedVariant:{ region:"US" },
    candidateIdentity:{ brand:"Acme", model:"AX-100" },
    candidateVariant:{ region:"EU" }
  }, "REGION_CONFLICT");

  exact({
    requestedIdentity:{ title:"Space Game", canonicalProductId:"steam:123" },
    requestedVariant:{ platform:"steam", edition:"standard" },
    candidateIdentity:{ title:"Space Game", canonicalProductId:"steam:123" },
    candidateVariant:{ platform:"steam", edition:"standard" }
  });

  mismatch({
    requestedIdentity:{ title:"Space Game", canonicalProductId:"game:space" },
    requestedVariant:{ platform:"pc" },
    candidateIdentity:{ title:"Space Game", canonicalProductId:"game:space" },
    candidateVariant:{ platform:"playstation" }
  }, "PLATFORM_CONFLICT");

  mismatch({
    requestedIdentity:{ title:"Space Game", canonicalProductId:"game:space" },
    requestedVariant:{ edition:"standard" },
    candidateIdentity:{ title:"Space Game", canonicalProductId:"game:space" },
    candidateVariant:{ edition:"deluxe" }
  }, "EDITION_CONFLICT");

  exact({
    requestedIdentity:{ title:"Example Book", isbn:"978-0-306-40615-7" },
    requestedVariant:{},
    candidateIdentity:{ title:"Totally Different Retail Title", isbn:"9780306406157" },
    candidateVariant:{}
  });

  mismatch({
    requestedIdentity:{ title:"Example Book", isbn:"9780306406157" },
    requestedVariant:{ edition:"2nd" },
    candidateIdentity:{ title:"Example Book", isbn:"9780306406164" },
    candidateVariant:{ edition:"1st" }
  }, "ISBN_CONFLICT");

  mismatch({
    requestedIdentity:{ title:"Example Book", isbn:"9780306406157" },
    requestedVariant:{ configuration:"hardcover" },
    candidateIdentity:{ title:"Example Book", isbn:"9780306406157" },
    candidateVariant:{ configuration:"paperback" }
  }, "CONFIGURATION_CONFLICT");

  possible({
    requestedIdentity:{ title:"Example Book", family:"Example Series" },
    requestedVariant:{},
    candidateIdentity:{ title:"Example Book", family:"Example Series" },
    candidateVariant:{}
  });

  possible({
    requestedIdentity:{ title:"Concert A", family:"artist-a-tour" },
    requestedVariant:{},
    candidateIdentity:{ title:"Concert A", family:"artist-a-tour" },
    candidateVariant:{}
  });

  mismatch({
    requestedIdentity:{ title:"Near Identical Phone", brand:"Acme", model:"AX-100" },
    requestedVariant:{},
    candidateIdentity:{ title:"Near Identical Phone", brand:"Acme", model:"AX-101" },
    candidateVariant:{}
  }, "MODEL_CONFLICT");

  mismatch({
    requestedIdentity:{ brand:"Acme", model:"AX-100" },
    requestedVariant:{ storage:"128GB" },
    candidateIdentity:{ brand:"Acme", model:"AX-200" },
    candidateVariant:{ storage:"256GB", nested:{ exactMatch:true, model:"AX-100", storage:"128GB" } }
  }, "MODEL_CONFLICT");

  const prototypeAttack = classify({
    requestedIdentity:{ brand:"Acme", model:"AX-100" },
    requestedVariant:{ platform:"pc" },
    candidateIdentity:JSON.parse("{\"brand\":\"Acme\",\"model\":\"AX-100\",\"__proto__\":{\"platform\":\"pc\"}}"),
    candidateVariant:{ platform:"xbox" }
  });
  assert.equal(prototypeAttack.matchState, "MISMATCH");
  assert.equal(prototypeAttack.conflicts.indexOf("PLATFORM_CONFLICT") >= 0, true);

  const orderA = classify({
    requestedIdentity:{ brand:"Acme", model:"AX-100" },
    requestedVariant:{ storage:"1TB", platform:"pc" },
    candidateIdentity:{ model:"AX-100", brand:"Acme" },
    candidateVariant:{ platform:"pc", storage:"1024GB" }
  });
  const orderB = classify({
    candidateVariant:{ storage:"1024GB", platform:"pc" },
    candidateIdentity:{ brand:"Acme", model:"AX-100" },
    requestedVariant:{ platform:"pc", storage:"1TB" },
    requestedIdentity:{ model:"AX-100", brand:"Acme" }
  });
  assert.equal(JSON.stringify(orderA), JSON.stringify(orderB));
  assert.equal(orderA.deterministic, true);
  assert.equal(orderA.externalAiUsed, false);

  const json = JSON.stringify(orderA);
  assert.equal(/secret|token|password|authorization/i.test(json), false);
  assert.equal(Object.isFrozen(orderA), true);

  console.log("global-commerce-product-identity PASS");
}

main();
