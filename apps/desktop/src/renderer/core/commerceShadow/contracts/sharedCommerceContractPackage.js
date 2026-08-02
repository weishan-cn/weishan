(function () {
  "use strict";

  const T = window.WeishanCommerceShadowContractTypes, V = window.WeishanCommerceShadowContractValidation, C = window.WeishanCommerceShadowContracts;
  const PACKAGE = V.freeze({contractVersion:T.CONTRACT_VERSION,executionGate:"CLOSED",authorizesExecution:false,executed:false,productionAffected:false,runtimeImplemented:false,contracts:Object.freeze({request:T.INTERFACES.request,result:T.INTERFACES.result,failure:T.INTERFACES.failure,response:T.INTERFACES.response}),enums:T.ENUMS,compatibility:T.COMPATIBILITY});
  window.WeishanSharedCommerceContractPackage = Object.freeze({PACKAGE,createRequest:C.createRequest,createResult:C.createResult,createFailure:C.createFailure,createResponse:C.createResponse,assessCompatibility:function (version) { return V.compatibility(version, T.CONTRACT_VERSION); }});
})();
