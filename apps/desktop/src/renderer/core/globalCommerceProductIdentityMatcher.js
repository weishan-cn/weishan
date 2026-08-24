;(function () {
  "use strict";

  const VERSION = "4.2.9";
  const MATCHER_NAME = "global_commerce_product_identity_matcher_v1";
  const MATCH_STATES = Object.freeze({
    EXACT_MATCH:"EXACT_MATCH",
    HIGH_CONFIDENCE_MATCH:"HIGH_CONFIDENCE_MATCH",
    POSSIBLE_MATCH:"POSSIBLE_MATCH",
    MISMATCH:"MISMATCH",
    UNKNOWN:"UNKNOWN"
  });
  const HARD_VARIANT_FIELDS = Object.freeze([
    "platform", "edition", "generation", "storage", "capacity", "memory", "configuration",
    "condition", "bundleState", "subscriptionState", "region"
  ]);
  const REQUEST_MATERIAL_FIELDS = Object.freeze(["color", "size"]);
  const IDENTITY_FIELDS = Object.freeze([
    "canonicalProductId", "gtin", "upc", "ean", "isbn", "manufacturerPartNumber",
    "mpn", "brand", "manufacturer", "model", "family", "title"
  ]);
  const VARIANT_FIELDS = Object.freeze([
    "platform", "edition", "generation", "storage", "capacity", "memory", "configuration",
    "color", "size", "region", "condition", "bundleState", "subscriptionState"
  ]);

  function deepFreeze(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { deepFreeze(value[key]); });
    return Object.freeze(value);
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function compact(value) {
    return text(value).replace(/\s+/g, " ");
  }

  function simple(value) {
    return compact(value).toLowerCase();
  }

  function alnum(value) {
    return compact(value).toUpperCase().replace(/[^A-Z0-9]/g, "");
  }

  function modelCode(value) {
    return compact(value).toUpperCase().replace(/\s*([-/_.])\s*/g, "$1");
  }

  function capacity(value) {
    const normalized = simple(value).replace(/\s+/g, "");
    const match = /^(\d+(?:\.\d+)?)(tb|gb|mb)$/.exec(normalized);
    if (!match) return normalized;
    const amount = Number(match[1]);
    if (!Number.isFinite(amount)) return normalized;
    if (match[2] === "tb") return String(amount * 1024) + "gb";
    if (match[2] === "mb") return String(amount / 1024) + "gb";
    return String(amount) + "gb";
  }

  function condition(value) {
    const normalized = simple(value).replace(/[\s-]+/g, "_");
    if (!normalized) return "";
    if (["new", "brand_new"].indexOf(normalized) >= 0) return "new";
    if (["used", "preowned", "pre_owned"].indexOf(normalized) >= 0) return "used";
    if (["refurbished", "renewed", "certified_refurbished"].indexOf(normalized) >= 0) return "refurbished";
    if (["open_box", "openbox"].indexOf(normalized) >= 0) return "open_box";
    return normalized;
  }

  function bundleState(value) {
    const normalized = simple(value).replace(/[\s-]+/g, "_");
    if (!normalized) return "";
    if (["standalone", "single", "base"].indexOf(normalized) >= 0) return "standalone";
    if (["bundle", "bundled", "kit", "package"].indexOf(normalized) >= 0) return "bundle";
    return normalized;
  }

  function normalizeValue(key, value) {
    const raw = text(value);
    if (!raw) return "";
    if (["gtin", "upc", "ean", "isbn"].indexOf(key) >= 0) return alnum(raw);
    if (key === "manufacturerPartNumber" || key === "mpn" || key === "model") return modelCode(raw);
    if (key === "storage" || key === "capacity" || key === "memory") return capacity(raw);
    if (key === "condition") return condition(raw);
    if (key === "bundleState") return bundleState(raw);
    if (key === "canonicalProductId" || key === "providerProductId" || key === "sku") return compact(raw);
    return simple(raw);
  }

  function copyNormalized(source, keys) {
    const safe = obj(source);
    const output = {};
    keys.forEach(function (key) {
      const normalized = normalizeValue(key, safe[key]);
      if (normalized) output[key] = normalized;
    });
    if (!output.manufacturerPartNumber && output.mpn) output.manufacturerPartNumber = output.mpn;
    return output;
  }

  function normalizeProductIdentity(input) {
    return deepFreeze(copyNormalized(input, IDENTITY_FIELDS));
  }

  function normalizeProductVariant(input) {
    return deepFreeze(copyNormalized(input, VARIANT_FIELDS));
  }

  function mergeVariant(identity, variant) {
    const merged = {};
    Object.assign(merged, normalizeProductVariant(identity));
    Object.assign(merged, normalizeProductVariant(variant));
    return merged;
  }

  function sameFieldConflicts(field, requested, candidate, conflicts, evidence) {
    if (requested[field] && candidate[field]) {
      if (requested[field] !== candidate[field]) conflicts.push(field.toUpperCase() + "_CONFLICT");
      else evidence.push(field.toUpperCase() + "_MATCH");
    }
  }

  function materialVariantFields(requestedVariant, candidateVariant) {
    const fields = new Set(HARD_VARIANT_FIELDS);
    REQUEST_MATERIAL_FIELDS.forEach(function (field) {
      if (requestedVariant[field]) fields.add(field);
      else if (candidateVariant[field] && candidateVariant[field + "Material"] === true) fields.add(field);
    });
    return Array.from(fields);
  }

  function compareVariantFields(requestedVariant, candidateVariant, conflicts, evidence, missing) {
    materialVariantFields(requestedVariant, candidateVariant).forEach(function (field) {
      if (!requestedVariant[field]) return;
      if (!candidateVariant[field]) {
        missing.push(field.toUpperCase() + "_MISSING");
        return;
      }
      if (requestedVariant[field] !== candidateVariant[field]) {
        conflicts.push(field.toUpperCase() + "_CONFLICT");
      } else {
        evidence.push(field.toUpperCase() + "_MATCH");
      }
    });
  }

  function titleToken(value) {
    return simple(value).replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim();
  }

  function classifyIdentityMatch(input) {
    const safe = obj(input);
    const requestedIdentity = normalizeProductIdentity(obj(safe.requestedIdentity || safe.productIdentity));
    const candidateIdentity = normalizeProductIdentity(obj(safe.candidateIdentity || safe.offerIdentity));
    const requestedVariant = mergeVariant(requestedIdentity, safe.requestedVariant);
    const candidateVariant = mergeVariant(candidateIdentity, safe.candidateVariant || safe.variants);
    const conflicts = [];
    const evidence = [];
    const missing = [];

    ["canonicalProductId", "gtin", "upc", "ean", "isbn", "manufacturerPartNumber", "model"].forEach(function (field) {
      sameFieldConflicts(field, requestedIdentity, candidateIdentity, conflicts, evidence);
    });

    const requestedMaker = requestedIdentity.brand || requestedIdentity.manufacturer;
    const candidateMaker = candidateIdentity.brand || candidateIdentity.manufacturer;
    if (requestedMaker && candidateMaker) {
      if (requestedMaker !== candidateMaker) conflicts.push("BRAND_CONFLICT");
      else evidence.push("BRAND_MATCH");
    }

    compareVariantFields(requestedVariant, candidateVariant, conflicts, evidence, missing);

    const relatedFamily = requestedIdentity.family && candidateIdentity.family && requestedIdentity.family === candidateIdentity.family;
    const sameTitle = titleToken(requestedIdentity.title) && titleToken(requestedIdentity.title) === titleToken(candidateIdentity.title);
    const strongEvidence = evidence.some(function (item) {
      return /^(CANONICALPRODUCTID|GTIN|UPC|EAN|ISBN|MANUFACTURERPARTNUMBER|MODEL)_MATCH$/.test(item);
    });

    let state = MATCH_STATES.UNKNOWN;
    let relationship = "UNKNOWN";
    if (conflicts.length) {
      state = MATCH_STATES.MISMATCH;
      relationship = "MISMATCH";
    } else if (strongEvidence && missing.length === 0) {
      state = MATCH_STATES.EXACT_MATCH;
      relationship = "SAME_VARIANT";
    } else if (strongEvidence) {
      state = MATCH_STATES.HIGH_CONFIDENCE_MATCH;
      relationship = "SAME_PRODUCT_VARIANT_EVIDENCE_INCOMPLETE";
    } else if (relatedFamily) {
      state = MATCH_STATES.POSSIBLE_MATCH;
      relationship = "RELATED_PRODUCT";
      evidence.push("RELATED_FAMILY");
    } else if (sameTitle) {
      state = MATCH_STATES.POSSIBLE_MATCH;
      relationship = "POSSIBLE_MATCH";
      evidence.push("TITLE_MATCH_ONLY");
    }

    const explanation = conflicts[0] || missing[0] || evidence[0] || "INSUFFICIENT_IDENTITY_EVIDENCE";
    return deepFreeze({
      matcherName:MATCHER_NAME,
      appVersion:VERSION,
      matchState:state,
      relationship:relationship,
      exactIdentity:state === MATCH_STATES.EXACT_MATCH,
      eligibleForExactPriceComparison:state === MATCH_STATES.EXACT_MATCH || state === MATCH_STATES.HIGH_CONFIDENCE_MATCH,
      requestedIdentity:requestedIdentity,
      candidateIdentity:candidateIdentity,
      requestedVariant:deepFreeze(requestedVariant),
      candidateVariant:deepFreeze(candidateVariant),
      evidence:Array.from(new Set(evidence)).sort(),
      conflicts:Array.from(new Set(conflicts)).sort(),
      missingEvidence:Array.from(new Set(missing)).sort(),
      explanation:explanation,
      titleOnly:evidence.indexOf("TITLE_MATCH_ONLY") >= 0 && !strongEvidence,
      deterministic:true,
      externalAiUsed:false
    });
  }

  window.WeishanGlobalCommerceProductIdentityMatcher = Object.freeze({
    VERSION,
    MATCHER_NAME,
    MATCH_STATES,
    normalizeProductIdentity,
    normalizeProductVariant,
    classifyIdentityMatch
  });
})();
