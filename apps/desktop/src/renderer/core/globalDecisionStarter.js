;(function () {
  "use strict";
  const STARTERS = Object.freeze(["Help me compare Tokyo hotels.", "Help me choose a computer.", "Help me analyze a travel plan."]);
  function listDecisionStarters() { return Object.freeze({ examples:Object.freeze(STARTERS.slice()), purchaseInducementEnabled:false, userDecisionRequired:true }); }
  window.WeishanGlobalDecisionStarter = Object.freeze({ listDecisionStarters });
})();
