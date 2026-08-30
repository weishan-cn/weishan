(function(){
  const ROUTER_VERSION = "1.2.0";
  const SOURCE_IDS = Object.freeze({
    prijsprofeet:"prijsprofeet_public_api",
    tiendaCentro:"tienda_centro_public_api",
    meblostan:"meblostan_public_api",
    ccAsianMarket:"cc_asian_market_public_api",
    dutchshopper:"dutchshopper_public_api"
  });
  const SOURCE_CATALOGS = Object.freeze([
    Object.freeze({ sourceId:SOURCE_IDS.prijsprofeet, markets:Object.freeze(["NL"]), families:Object.freeze(["grocery"]) }),
    Object.freeze({ sourceId:SOURCE_IDS.ccAsianMarket, markets:Object.freeze(["NL"]), families:Object.freeze(["grocery"]) }),
    Object.freeze({ sourceId:SOURCE_IDS.dutchshopper, markets:Object.freeze(["NL"]), families:Object.freeze(["*"]) }),
    Object.freeze({ sourceId:SOURCE_IDS.tiendaCentro, markets:Object.freeze(["AR"]), families:Object.freeze(["*"]) }),
    Object.freeze({ sourceId:SOURCE_IDS.meblostan, markets:Object.freeze(["PL"]), families:Object.freeze(["furniture"]) })
  ]);

  function text(value){
    return String(value || "").replace(/\s+/g, " ").trim().slice(0, 240);
  }

  function market(value){
    const raw = text(value).toLowerCase();
    if (/^(ar|arg|argentina|阿根廷)$/.test(raw)) return "AR";
    if (/^(nl|nld|netherlands|the netherlands|nederland|荷兰)$/.test(raw)) return "NL";
    if (/^(gb|gbr|uk|united kingdom|great britain|英国)$/.test(raw)) return "GB";
    if (/^(pl|pol|poland|polska|波兰)$/.test(raw)) return "PL";
    return raw ? raw.toUpperCase() : "";
  }

  function productFamily(query){
    const value = text(query).toLowerCase();
    if (!value) return "unknown";
    if (/\b(?:iphone|smartphone|cellphone|mobile phone|celular|telefono)\b|手机|智能手机/.test(value)) return "consumer_electronics";
    if (/\b(?:armchair|chair|coffee table|table|commode|furniture|stolik|fotel|krzeslo|krzesło|komoda)\b|扶手椅|椅子|咖啡桌|茶几|家具|斗柜/.test(value)) return "furniture";
    if (/\b(?:cola|soda|soft drink|grocery|milk|coffee|tea|bread|snack|egg|eggs|ham|rice|noodle|sauce|soap|shampoo|toothpaste)\b|食品|饮料|汽水|可乐|牛奶|咖啡|茶|鸡蛋|火腿|大米|米饭|面条|酱油|肥皂|洗发水|牙膏/.test(value)) return "grocery";
    return "general_product";
  }

  function isRegisteredSourceId(sourceId){
    const candidate = text(sourceId);
    return Boolean(candidate) && SOURCE_CATALOGS.some(function(source){
      return source.sourceId === candidate;
    });
  }

  function routeEligibleMerchantNativeSources(input){
    const safe = input && typeof input === "object" ? input : {};
    const destinationMarket = market(safe.destinationMarket || safe.destinationCountry || safe.market);
    const family = productFamily(safe.query || safe.inputSummary);
    const eligibleSourceIds = family === "unknown" ? [] : SOURCE_CATALOGS.filter(function(source){
      return source.markets.includes(destinationMarket) && (source.families.includes("*") || source.families.includes(family));
    }).map(function(source){ return source.sourceId; });
    return Object.freeze({
      routerVersion:ROUTER_VERSION,
      destinationMarket,
      destinationMarketSource:text(safe.destinationMarketSource || "unknown") || "unknown",
      productFamily:family,
      eligibleSourceIds:Object.freeze(eligibleSourceIds),
      maxEligibleSourcesQueriedPerSearch:4,
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
    SOURCE_CATALOGS,
    normalizeMarket:market,
    classifyProductFamily:productFamily,
    isRegisteredSourceId,
    routeEligibleMerchantNativeSources
  });
})();
