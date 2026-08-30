(function(){
  const ROUTER_VERSION = "1.0.0";
  const SOURCE_IDS = Object.freeze({
    prijsprofeet:"prijsprofeet_public_api",
    tiendaCentro:"tienda_centro_public_api"
  });

  function text(value){
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 240);
  }

  function market(value){
    const raw = text(value).toLowerCase();
    if (/^(ar|arg|argentina|阿根廷)$/.test(raw)) return "AR";
    if (/^(nl|nld|netherlands|the netherlands|nederland|荷兰)$/.test(raw)) return "NL";
    if (/^(gb|gbr|uk|united kingdom|great britain|英国)$/.test(raw)) return "GB";
    return raw ? raw.toUpperCase() : "";
  }

  function productFamily(query){
    const value = text(query).toLowerCase();
    if (!value) return "unknown";
    if (/\b(?:iphone|smartphone|cellphone|mobile phone|celular|telefono)\b|手机|智能手机/.test(value)) return "consumer_electronics";
    if (/\b(?:coca[- ]?cola|cola|soda|soft drink|grocery|milk|coffee|tea|bread|snack)\b|可口可乐|食品|饮料|牛奶|咖啡|茶/.test(value)) return "grocery";
    return "general_product";
  }

  function routeEligibleMerchantNativeSources(input){
    const safe = input && typeof input === "object" ? input : {};
    const destinationMarket = market(safe.destinationMarket || safe.destinationCountry || safe.market);
    const family = productFamily(safe.query || safe.inputSummary);
    const eligibleSourceIds = [];
    if (destinationMarket === "AR" && family !== "unknown") eligibleSourceIds.push(SOURCE_IDS.tiendaCentro);
    if (destinationMarket === "NL" && family === "grocery") eligibleSourceIds.push(SOURCE_IDS.prijsprofeet);
    return Object.freeze({
      routerVersion:ROUTER_VERSION,
      destinationMarket,
      destinationMarketSource:text(safe.destinationMarketSource || "unknown") || "unknown",
      productFamily:family,
      eligibleSourceIds:Object.freeze(eligibleSourceIds),
      maxEligibleSourcesQueriedPerSearch:1,
      otherMarketReferenceAvailable:destinationMarket === "GB" && family === "consumer_electronics",
      localSourceAvailable:eligibleSourceIds.length > 0,
      silentDestinationOverride:false,
      userProviderSelectionRequired:false,
      userSearchAdapterConfigurationRequired:false
    });
  }

  window.WeishanMerchantNativeSourceEligibilityRouter = Object.freeze({
    ROUTER_VERSION,
    SOURCE_IDS,
    normalizeMarket:market,
    classifyProductFamily:productFamily,
    routeEligibleMerchantNativeSources
  });
})();
