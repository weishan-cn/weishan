(function(){
  const STATES=["initialize","ready","busy","dispose"];
  function certifyVideoProviderLifecycle(adapter){const lifecycle=window.WeishanVideoProviderLifecycle.createVideoProviderLifecycle();const valid=!!adapter&&typeof adapter.dispose==="function"&&lifecycle.getState()==="initialize"&&lifecycle.busy()===false&&lifecycle.ready()===true&&lifecycle.busy()===true&&lifecycle.ready()===true&&lifecycle.dispose()===true&&lifecycle.ready()===false&&lifecycle.dispose()===true;return Object.freeze({status:valid?"passed":"failed",code:valid?"LIFECYCLE_OK":"LIFECYCLE_INVALID",message:valid?"生命周期验证通过":"生命周期验证未通过"});}
  window.WeishanVideoProviderLifecycleCertification={STATES,certifyVideoProviderLifecycle};
})();
