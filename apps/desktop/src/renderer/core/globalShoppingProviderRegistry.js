;(function () {
  "use strict";

  const GLOBAL_SHOPPING_PROVIDER_REGISTRY_VERSION = "4.2.8";
  const REGISTRY_NAME = "global_shopping_provider_registry_v1";

  const PROVIDERS = [
    {
      providerId:"apple_official",
      name:"Apple 官方",
      countries:["US", "CN", "JP", "GB", "DE", "FR"],
      languages:["en-US", "zh-CN", "ja-JP"],
      currencies:["USD", "CNY", "JPY", "EUR", "GBP"],
      categories:["product"],
      capabilities:["search", "detail_page", "official_store"],
      officialDomains:["apple.com"],
      searchTemplates:{ product:"https://www.apple.com/search/{query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"high"
    },
    {
      providerId:"amazon_us",
      name:"Amazon",
      countries:["US", "GB", "DE", "FR", "JP"],
      languages:["en-US", "en-GB", "de-DE", "fr-FR", "ja-JP"],
      currencies:["USD", "GBP", "EUR", "JPY"],
      categories:["product"],
      capabilities:["search", "detail_page", "cross_border_reference"],
      officialDomains:["amazon.com", "amazon.co.jp", "amazon.co.uk", "amazon.de", "amazon.fr"],
      searchTemplates:{ product:"https://www.amazon.com/s?k={query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"high"
    },
    {
      providerId:"bestbuy",
      name:"Best Buy",
      countries:["US"],
      languages:["en-US"],
      currencies:["USD"],
      categories:["product"],
      capabilities:["search", "detail_page"],
      officialDomains:["bestbuy.com"],
      searchTemplates:{ product:"https://www.bestbuy.com/site/searchpage.jsp?st={query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"medium"
    },
    {
      providerId:"jd",
      name:"京东",
      countries:["CN"],
      languages:["zh-CN"],
      currencies:["CNY"],
      categories:["product"],
      capabilities:["search", "detail_page", "marketplace"],
      officialDomains:["jd.com", "search.jd.com"],
      searchTemplates:{ product:"https://search.jd.com/Search?keyword={query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"high"
    },
    {
      providerId:"tmall",
      name:"天猫",
      countries:["CN"],
      languages:["zh-CN"],
      currencies:["CNY"],
      categories:["product"],
      capabilities:["search", "detail_page", "marketplace"],
      officialDomains:["tmall.com", "list.tmall.com"],
      searchTemplates:{ product:"https://list.tmall.com/search_product.htm?q={query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"high"
    },
    {
      providerId:"taobao",
      name:"淘宝",
      countries:["CN"],
      languages:["zh-CN"],
      currencies:["CNY"],
      categories:["product"],
      capabilities:["search", "detail_page", "marketplace"],
      officialDomains:["taobao.com", "s.taobao.com"],
      searchTemplates:{ product:"https://s.taobao.com/search?q={query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"medium"
    },
    {
      providerId:"google_shopping",
      name:"Google Shopping",
      countries:["US", "JP", "GB", "DE", "FR", "EU"],
      languages:["en-US", "ja-JP", "en-GB"],
      currencies:["USD", "JPY", "EUR", "GBP"],
      categories:["product"],
      capabilities:["search", "aggregated_compare"],
      officialDomains:["google.com"],
      searchTemplates:{ product:"https://www.google.com/search?tbm=shop&q={query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"review"
    },
    {
      providerId:"amazon_japan",
      name:"Amazon Japan",
      countries:["JP"],
      languages:["ja-JP", "en-US"],
      currencies:["JPY"],
      categories:["product"],
      capabilities:["search", "detail_page", "cross_border_reference"],
      officialDomains:["amazon.co.jp"],
      searchTemplates:{ product:"https://www.amazon.co.jp/s?k={query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"high"
    },
    {
      providerId:"rakuten_japan",
      name:"Rakuten",
      countries:["JP"],
      languages:["ja-JP"],
      currencies:["JPY"],
      categories:["product", "hotel"],
      capabilities:["search", "detail_page", "marketplace"],
      officialDomains:["rakuten.co.jp", "travel.rakuten.com"],
      searchTemplates:{
        product:"https://search.rakuten.co.jp/search/mall/{query}/",
        hotel:"https://travel.rakuten.com/?f_query={query}"
      },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"medium"
    },
    {
      providerId:"google_flights",
      name:"Google Flights",
      countries:["US", "JP", "GB", "DE", "FR", "CN", "EU"],
      languages:["en-US", "ja-JP", "zh-CN", "en-GB"],
      currencies:["USD", "JPY", "EUR", "GBP", "CNY"],
      categories:["flight"],
      capabilities:["search", "price_compare", "official_referral"],
      officialDomains:["google.com"],
      searchTemplates:{ flight:"https://www.google.com/travel/flights?q={query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"high"
    },
    {
      providerId:"trip_com",
      name:"Trip.com",
      countries:["US", "JP", "CN", "SG", "GB", "DE", "FR", "EU"],
      languages:["en-US", "zh-CN", "ja-JP"],
      currencies:["USD", "JPY", "CNY", "EUR", "GBP", "SGD"],
      categories:["flight", "hotel"],
      capabilities:["search", "price_compare", "inventory_reference"],
      officialDomains:["trip.com"],
      searchTemplates:{
        flight:"https://www.trip.com/flights/?keyword={query}",
        hotel:"https://www.trip.com/hotels/list?keyword={query}"
      },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"high"
    },
    {
      providerId:"skyscanner",
      name:"Skyscanner",
      countries:["US", "JP", "GB", "DE", "FR", "EU"],
      languages:["en-US", "ja-JP", "en-GB"],
      currencies:["USD", "JPY", "EUR", "GBP"],
      categories:["flight"],
      capabilities:["search", "price_compare"],
      officialDomains:["skyscanner.com"],
      searchTemplates:{ flight:"https://www.skyscanner.com/transport/flights/?q={query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"medium"
    },
    {
      providerId:"kayak",
      name:"Kayak",
      countries:["US", "GB", "DE", "FR", "EU"],
      languages:["en-US", "en-GB", "de-DE", "fr-FR"],
      currencies:["USD", "EUR", "GBP"],
      categories:["flight"],
      capabilities:["search", "price_compare"],
      officialDomains:["kayak.com"],
      searchTemplates:{ flight:"https://www.kayak.com/flights/{query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"medium"
    },
    {
      providerId:"expedia_flights",
      name:"Expedia",
      countries:["US", "GB", "DE", "FR", "EU"],
      languages:["en-US", "en-GB"],
      currencies:["USD", "EUR", "GBP"],
      categories:["flight", "hotel"],
      capabilities:["search", "price_compare"],
      officialDomains:["expedia.com"],
      searchTemplates:{
        flight:"https://www.expedia.com/Flights-Search?trip=oneway&keyword={query}",
        hotel:"https://www.expedia.com/Hotel-Search?destination={query}"
      },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"medium"
    },
    {
      providerId:"air_china",
      name:"中国国航",
      countries:["CN"],
      languages:["zh-CN", "en-US"],
      currencies:["CNY", "USD"],
      categories:["flight"],
      capabilities:["search", "official_referral"],
      officialDomains:["airchina.com.cn"],
      searchTemplates:{ flight:"https://www.airchina.com.cn/" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"high"
    },
    {
      providerId:"china_eastern",
      name:"东方航空",
      countries:["CN"],
      languages:["zh-CN", "en-US"],
      currencies:["CNY", "USD"],
      categories:["flight"],
      capabilities:["search", "official_referral"],
      officialDomains:["ceair.com"],
      searchTemplates:{ flight:"https://www.ceair.com/" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"high"
    },
    {
      providerId:"ctrip",
      name:"携程",
      countries:["CN"],
      languages:["zh-CN"],
      currencies:["CNY"],
      categories:["flight", "hotel"],
      capabilities:["search", "price_compare", "inventory_reference"],
      officialDomains:["ctrip.com", "flights.ctrip.com", "hotels.ctrip.com"],
      searchTemplates:{
        flight:"https://flights.ctrip.com/online/list/oneway-{query}",
        hotel:"https://hotels.ctrip.com/hotels/list?keyword={query}"
      },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"high"
    },
    {
      providerId:"booking",
      name:"Booking.com",
      countries:["US", "JP", "GB", "DE", "FR", "IT", "ES", "EU", "SG"],
      languages:["en-US", "ja-JP", "zh-CN", "en-GB"],
      currencies:["USD", "JPY", "EUR", "GBP", "SGD"],
      categories:["hotel"],
      capabilities:["search", "price_compare", "official_referral"],
      officialDomains:["booking.com"],
      searchTemplates:{ hotel:"https://www.booking.com/searchresults.zh-cn.html?ss={query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"high"
    },
    {
      providerId:"agoda",
      name:"Agoda",
      countries:["JP", "SG", "US", "EU"],
      languages:["en-US", "ja-JP", "zh-CN"],
      currencies:["USD", "JPY", "EUR", "SGD"],
      categories:["hotel"],
      capabilities:["search", "price_compare"],
      officialDomains:["agoda.com"],
      searchTemplates:{ hotel:"https://www.agoda.com/zh-cn/search?textToSearch={query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"high"
    },
    {
      providerId:"hotels",
      name:"Hotels.com",
      countries:["US", "JP", "GB", "DE", "FR", "EU"],
      languages:["en-US", "ja-JP", "en-GB"],
      currencies:["USD", "JPY", "EUR", "GBP"],
      categories:["hotel"],
      capabilities:["search", "price_compare"],
      officialDomains:["hotels.com"],
      searchTemplates:{ hotel:"https://www.hotels.com/Hotel-Search?destination={query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"medium"
    },
    {
      providerId:"marriott",
      name:"Marriott 官方",
      countries:["US", "JP", "GB", "DE", "FR", "EU", "CN"],
      languages:["en-US", "ja-JP", "zh-CN", "en-GB"],
      currencies:["USD", "JPY", "EUR", "GBP", "CNY"],
      categories:["hotel"],
      capabilities:["search", "official_referral"],
      officialDomains:["marriott.com"],
      searchTemplates:{ hotel:"https://www.marriott.com/search/findHotels.mi?destinationAddress.country={query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"high"
    },
    {
      providerId:"hilton",
      name:"Hilton 官方",
      countries:["US", "JP", "GB", "DE", "FR", "EU", "CN"],
      languages:["en-US", "ja-JP", "zh-CN", "en-GB"],
      currencies:["USD", "JPY", "EUR", "GBP", "CNY"],
      categories:["hotel"],
      capabilities:["search", "official_referral"],
      officialDomains:["hilton.com"],
      searchTemplates:{ hotel:"https://www.hilton.com/en/search/?query={query}" },
      apiAvailable:false,
      status:"registry_only",
      trustLevel:"high"
    }
  ];

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function capabilityApi() {
    return window.WeishanGlobalShoppingProviderCapabilityModel || {};
  }

  function priceTransparencyScoreFor(provider) {
    if (provider.capabilities.indexOf("price_compare") >= 0) return 0.82;
    if (provider.capabilities.indexOf("marketplace") >= 0 || provider.capabilities.indexOf("cross_border_reference") >= 0) return 0.74;
    if (provider.trustLevel === "high" && provider.capabilities.indexOf("official_store") >= 0) return 0.62;
    if (provider.trustLevel === "high" && provider.capabilities.indexOf("official_referral") >= 0) return 0.68;
    return 0.58;
  }

  function enrichProvider(provider) {
    const next = Object.assign({}, provider, {
      priceTransparencyScore:priceTransparencyScoreFor(provider),
      marketCoverage:Array.isArray(provider.countries) ? provider.countries.slice() : [],
      supportedLanguages:Array.isArray(provider.languages) ? provider.languages.slice() : [],
      onboardingStatus:"sandbox"
    });
    if (typeof capabilityApi().buildGlobalShoppingProviderCapabilityModel === "function") {
      next.capabilityModel = capabilityApi().buildGlobalShoppingProviderCapabilityModel(provider);
    }
    return next;
  }

  function listGlobalShoppingProviders() {
    return clone(PROVIDERS.map(enrichProvider));
  }

  function getGlobalShoppingProviderRegistry(input) {
    const safe = input && typeof input === "object" ? input : {};
    const category = text(safe.category);
    const country = text(safe.country);
    const language = text(safe.language);
    const currency = text(safe.currency);
    const providers = PROVIDERS.filter(function (provider) {
      if (category && provider.categories.indexOf(category) === -1) return false;
      if (country && provider.countries.indexOf(country) === -1) return false;
      if (language && provider.languages.indexOf(language) === -1) return false;
      if (currency && provider.currencies.indexOf(currency) === -1) return false;
      return true;
    }).map(enrichProvider);
    return clone({
      registryName:REGISTRY_NAME,
      appVersion:GLOBAL_SHOPPING_PROVIDER_REGISTRY_VERSION,
      providerCount:providers.length,
      providers:providers,
      supportsFutureExpansion:true,
      futureTarget:"100+ countries / 100+ providers",
      registryMode:"architecture_only",
      redacted:true
    });
  }

  window.WeishanGlobalShoppingProviderRegistry = {
    GLOBAL_SHOPPING_PROVIDER_REGISTRY_VERSION,
    REGISTRY_NAME,
    listGlobalShoppingProviders,
    getGlobalShoppingProviderRegistry
  };
})();
