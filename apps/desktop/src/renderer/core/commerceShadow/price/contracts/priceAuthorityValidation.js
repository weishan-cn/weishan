(function () {
  "use strict";

  const Shared = window.WeishanCommerceShadowContractValidation, Types = window.WeishanPriceAuthorityTypes;
  function fail(code) { Shared.fail(code); }
  function text(value) { return Shared.text(value); }
  function exact(value, keys) { return Shared.exact(value, keys); }
  function fieldStatus(value) { return Types.ENUMS.FIELD_STATUS.indexOf(value) >= 0; }
  function evidence(input) { const value=Shared.safeClone(input),keys=Types.INTERFACES.evidence.required;if(!exact(value,keys)||!text(value.source)||Types.ENUMS.EVIDENCE_STATUS.indexOf(value.traceability)<0||!keys.slice(2).every(function(key){return fieldStatus(value[key]);}))fail("invalid_price_evidence");return Shared.freeze(value); }
  function timestamp(input) { const value=Shared.safeClone(input),keys=Types.INTERFACES.timestamp.required;if(!exact(value,keys)||!text(value.capturedAt)||!fieldStatus(value.freshness))fail("invalid_price_timestamp");return Shared.freeze(value); }
  function expiration(input) { const value=Shared.safeClone(input),keys=Types.INTERFACES.expiration.required;if(!exact(value,keys)||!text(value.expiresAt)||!fieldStatus(value.status))fail("invalid_price_expiration");return Shared.freeze(value); }
  function dependencies(input) { if(!input||typeof input.clock!=="function"||typeof input.idGenerator!=="function")fail("invalid_price_authority_dependencies");return input; }
  function authority(input) { const value=Shared.safeClone(input),keys=Types.INTERFACES.priceAuthority.required;if(!exact(value,keys)||value.schemaVersion!==Types.CONTRACT_VERSION||!text(value.authorityId)||Types.ENUMS.PRICE_STATE.indexOf(value.priceState)<0||Types.ENUMS.CONFIDENCE.indexOf(value.confidence)<0||!text(value.currency)||!Array.isArray(value.limitations)||!Array.isArray(value.unknownFields)||!text(value.createdAt)||value.executionGate!=="CLOSED"||value.authorizesExecution!==false||value.executed!==false||value.productionAffected!==false)fail("invalid_price_authority");value.evidence=evidence(value.evidence);value.timestamp=timestamp(value.timestamp);value.expiration=expiration(value.expiration);return Shared.freeze(value); }
  function compatibility(version) { return Shared.compatibility(version,Types.CONTRACT_VERSION); }
  window.WeishanPriceAuthorityValidation=Object.freeze({fail,text,exact,evidence,timestamp,expiration,dependencies,authority,compatibility,freeze:Shared.freeze,safeClone:Shared.safeClone});
})();
