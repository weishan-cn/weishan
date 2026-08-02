(function(){
  function createVideoProviderCertificationBadge(status,profile,contractVersion){const certified=status==="certified";return Object.freeze({status:certified?"certified":"rejected",label:certified?"通过认证":"未通过认证",profile:profile==="strict"?"strict":"standard",contractVersion:typeof contractVersion==="string"?contractVersion:""});}
  window.WeishanVideoProviderCertificationBadge={createVideoProviderCertificationBadge};
})();
