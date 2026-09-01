(function(){
  const STORE_KEY = "settings.advancedModeEnabled";

  function read(){
    return !!(window.WeishanStore && window.WeishanStore.read(STORE_KEY, false));
  }

  function setAdvanced(enabled){
    const next = enabled === true;
    if (window.WeishanStore) window.WeishanStore.write(STORE_KEY, next);
    try {
      window.dispatchEvent(new CustomEvent("weishan:experience-mode", { detail:{ advanced:next } }));
    } catch (_) {}
    return next;
  }

  function isAdvanced(){ return read(); }
  function allows(item){
    if (!item || item.routeEnabled === false) return false;
    return item.experience !== "advanced" || isAdvanced();
  }

  window.WeishanExperienceMode = Object.freeze({
    STORE_KEY,
    isAdvanced,
    setAdvanced,
    allows
  });
})();
