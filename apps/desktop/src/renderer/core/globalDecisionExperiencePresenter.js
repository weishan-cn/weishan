;(function () { "use strict";
  function present(input) { const guard=window.WeishanGlobalCommerceInputGuard, checked=guard&&guard.guardAndCloneCommerceInput(input); if(!checked||!checked.success||!checked.value)return Object.freeze({status:"PRESENTER_REJECTED"}); const state=checked.value; if(!state.canExit||!state.primaryQuestion)return Object.freeze({status:"PRESENTER_REJECTED"}); return Object.freeze({status:"PRESENTER_READY",primaryQuestion:state.primaryQuestion,primaryAction:"Continue",secondaryActions:Object.freeze(["Exit"]),buttons:Object.freeze(["Continue","Exit"]),menus:Object.freeze([]),disclosure:Object.freeze(["ESSENTIAL","IMPORTANT","DETAILED"]),userDecisionRequired:true}); }
  window.WeishanGlobalDecisionExperiencePresenter=Object.freeze({present});
})();
