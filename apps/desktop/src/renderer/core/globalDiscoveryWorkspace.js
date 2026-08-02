;(function () {
  "use strict";

  const Engine = window.WeishanGlobalDiscoveryEngine;
  const STATES = Object.freeze(["IDLE", "READY", "SEARCHING", "COMPLETED", "PARTIAL", "EMPTY", "FAILED"]);
  const TYPES = Object.freeze(["product", "hotel", "flight", "stock"]);
  const ERROR_COPY = Object.freeze({
    INVALID_QUERY:"请输入要查找的内容。",
    INVALID_DESTINATION:"请补充目标市场信息。",
    NO_PROVIDER:"当前目标市场没有可用的离线来源。",
    NO_RESULT:"当前离线演示没有匹配结果。",
    CURRENCY_NOT_COMPARABLE:"不同币种，暂不直接排序。",
    PARTIAL_PROVIDER_RESULT:"部分离线来源未返回结果，已展示可用候选。",
    NORMALIZATION_REJECTED:"候选信息不完整，无法安全比较。",
    REDIRECT_REJECTED:"该平台查看意图不符合安全规则。",
    UNSUPPORTED_BUSINESS_TYPE:"暂不支持此发现类型。"
  });

  function object(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
  function list(value) { return Array.isArray(value) ? value.slice() : []; }
  function text(value) { return String(value == null ? "" : value).trim(); }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function guardWorkspaceInput(value) { const guard=window.WeishanGlobalDiscoveryInputGuard; return value === undefined ? {valid:true,code:"SAFE",value:{}} : (guard&&typeof guard.guardAndCloneInput === "function" ? guard.guardAndCloneInput(value) : {valid:true,code:"SAFE",value:value}); }
  function esc(value) { return text(value).replace(/[&<>'"]/g, function (character) { return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" })[character]; }); }
  function safeFixtureUrl(value) { return /^fixture:\/\/provider\/[a-z0-9/_-]+$/i.test(text(value)) ? text(value) : null; }
  function state(value) { return STATES.indexOf(value) >= 0 ? value : "IDLE"; }
  function type(value) { return TYPES.indexOf(value) >= 0 ? value : "product"; }
  function number(value) { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : null; }
  function sum(values) { return values.reduce(function (total, value) { const item = number(value); return item === null ? total : total + item; }, 0); }

  const CATALOG = Object.freeze({
    product:Object.freeze({
      providers:Object.freeze([
        { providerId:"jp-local-demo", displayName:"JP Local Market Demo", domains:["product"], markets:["JP"], capabilities:{search:true,redirect:true,availability:true,price:true,shipping:true,tax:true,inventory:true}, trustTier:"regional", redirectPolicy:"fixture_only", fixtureVersion:"1" },
        { providerId:"jp-official-demo", displayName:"JP Official Store Demo", domains:["product"], markets:["JP"], capabilities:{search:true,redirect:true,availability:true,price:true,shipping:true,tax:true,inventory:true}, trustTier:"official", redirectPolicy:"fixture_only", fixtureVersion:"1" },
        { providerId:"global-market-demo", displayName:"Global Marketplace Demo", domains:["product"], markets:["JP","US","CN","GB","DE"], capabilities:{search:true,redirect:true,availability:true,price:true,shipping:true,tax:true,inventory:true}, trustTier:"global", redirectPolicy:"fixture_only", fixtureVersion:"1" }
      ]),
      candidates:Object.freeze([
        {candidateId:"product-jp-local",title:"Sony Headphones Demo",variant:"Standard",price:12000,shipping:700,tax:1270,currency:"JPY",seller:"JP Local Market Demo",sellerType:"marketplace",availability:"in_stock",deliveryDays:2,provider:"JP Local Market Demo",redirectUrl:"fixture://provider/product/jp-local"},
        {candidateId:"product-jp-official",title:"Sony Headphones Demo",variant:"Standard",price:12600,shipping:0,tax:1260,currency:"JPY",seller:"JP Official Store Demo",sellerType:"official",officialSeller:true,availability:"in_stock",deliveryDays:3,provider:"JP Official Store Demo",redirectUrl:"fixture://provider/product/jp-official"},
        {candidateId:"product-global",title:"Sony Headphones Demo",variant:"Standard",price:11000,shipping:1800,tax:1280,currency:"JPY",seller:"Global Marketplace Demo",sellerType:"marketplace",availability:"limited",deliveryDays:7,provider:"Global Marketplace Demo",redirectUrl:"fixture://provider/product/global"}
      ])
    }),
    hotel:Object.freeze({
      providers:Object.freeze([
        {providerId:"jp-ota-demo",displayName:"Japan Local OTA Demo",domains:["hotel"],markets:["JP"],capabilities:{search:true,redirect:true,availability:true,price:true,shipping:false,tax:true,inventory:true},trustTier:"regional",redirectPolicy:"fixture_only",fixtureVersion:"1"},
        {providerId:"hotel-official-demo",displayName:"Hotel Official Site Demo",domains:["hotel"],markets:["JP"],capabilities:{search:true,redirect:true,availability:true,price:true,shipping:false,tax:true,inventory:true},trustTier:"official",redirectPolicy:"fixture_only",fixtureVersion:"1"},
        {providerId:"global-ota-demo",displayName:"Global OTA Demo",domains:["hotel"],markets:["JP"],capabilities:{search:true,redirect:true,availability:true,price:true,shipping:false,tax:true,inventory:true},trustTier:"global",redirectPolicy:"fixture_only",fixtureVersion:"1"},
        {providerId:"cn-ota-demo",displayName:"China OTA Demo",domains:["hotel"],markets:["JP","CN"],capabilities:{search:true,redirect:true,availability:true,price:true,shipping:false,tax:true,inventory:true},trustTier:"regional",redirectPolicy:"fixture_only",fixtureVersion:"1"}
      ]),
      candidates:Object.freeze([
        {candidateId:"hotel-jp-local",hotelName:"Tokyo Harbor Hotel Demo",roomType:"Standard Queen",checkIn:"2026-09-10",checkOut:"2026-09-12",subtotal:21000,tax:2100,fees:900,cityTax:400,currency:"JPY",cancelPolicy:"Free cancellation",breakfast:true,paymentTiming:"pay at property",provider:"Japan Local OTA Demo",redirectUrl:"fixture://provider/hotel/jp-ota"},
        {candidateId:"hotel-official",hotelName:"Tokyo Harbor Hotel Demo",roomType:"Deluxe King",checkIn:"2026-09-10",checkOut:"2026-09-12",subtotal:22500,tax:2250,fees:0,cityTax:400,currency:"JPY",cancelPolicy:"Free cancellation",breakfast:true,paymentTiming:"pay at property",provider:"Hotel Official Site Demo",redirectUrl:"fixture://provider/hotel/official"},
        {candidateId:"hotel-global",hotelName:"Tokyo Harbor Hotel Demo",roomType:"Twin",checkIn:"2026-09-10",checkOut:"2026-09-12",subtotal:19800,tax:1980,fees:1400,cityTax:400,currency:"JPY",cancelPolicy:"non-refundable",breakfast:false,paymentTiming:"prepaid",provider:"Global OTA Demo",redirectUrl:"fixture://provider/hotel/global"},
        {candidateId:"hotel-cn",hotelName:"Tokyo Harbor Hotel Demo",roomType:"City View Twin",checkIn:"2026-09-10",checkOut:"2026-09-12",subtotal:20500,tax:2050,fees:1100,cityTax:400,currency:"JPY",cancelPolicy:"free cancellation",breakfast:false,paymentTiming:"prepaid",provider:"China OTA Demo",redirectUrl:"fixture://provider/hotel/cn"}
      ])
    }),
    flight:Object.freeze({ providers:Object.freeze([
      {providerId:"cn-flight-demo",displayName:"Regional Flight Platform Demo",domains:["flight"],markets:["CN","JP"],capabilities:{search:true,redirect:true,availability:true,price:true,shipping:false,tax:true,inventory:true},trustTier:"regional",redirectPolicy:"fixture_only",fixtureVersion:"1"},
      {providerId:"jp-flight-demo",displayName:"Japan Flight Platform Demo",domains:["flight"],markets:["JP"],capabilities:{search:true,redirect:true,availability:true,price:true,shipping:false,tax:true,inventory:true},trustTier:"regional",redirectPolicy:"fixture_only",fixtureVersion:"1"},
      {providerId:"global-flight-demo",displayName:"Global Flight Platform Demo",domains:["flight"],markets:["CN","JP"],capabilities:{search:true,redirect:true,availability:true,price:true,shipping:false,tax:true,inventory:true},trustTier:"global",redirectPolicy:"fixture_only",fixtureVersion:"1"},
      {providerId:"airline-official-demo",displayName:"Airline Official Demo",domains:["flight"],markets:["CN","JP"],capabilities:{search:true,redirect:true,availability:true,price:true,shipping:false,tax:true,inventory:true},trustTier:"official",redirectPolicy:"fixture_only",fixtureVersion:"1"}
    ]), candidates:Object.freeze([
      {candidateId:"flight-cn",airline:"Demo Air",flightNumberLabel:"DA101",departure:"Shanghai, China",arrival:"Tokyo, Japan",stops:0,baggage:"20kg",subtotal:1350,tax:160,fuel:80,baggageFee:0,fees:30,currency:"CNY",durationMinutes:175,provider:"Regional Flight Platform Demo",redirectUrl:"fixture://provider/flight/cn"},
      {candidateId:"flight-jp",airline:"Demo Air",flightNumberLabel:"DA101",departure:"Shanghai, China",arrival:"Tokyo, Japan",stops:0,baggage:"23kg",subtotal:1380,tax:150,fuel:60,baggageFee:0,fees:20,currency:"CNY",durationMinutes:170,provider:"Japan Flight Platform Demo",redirectUrl:"fixture://provider/flight/jp"},
      {candidateId:"flight-global",airline:"Demo Air",flightNumberLabel:"DA101",departure:"Shanghai, China",arrival:"Tokyo, Japan",stops:1,baggage:"20kg",subtotal:1200,tax:180,fuel:95,baggageFee:80,fees:40,currency:"CNY",durationMinutes:240,provider:"Global Flight Platform Demo",redirectUrl:"fixture://provider/flight/global"},
      {candidateId:"flight-official",airline:"Demo Air",flightNumberLabel:"DA101",departure:"Shanghai, China",arrival:"Tokyo, Japan",stops:0,baggage:"23kg",subtotal:1420,tax:150,fuel:50,baggageFee:0,fees:0,currency:"CNY",durationMinutes:170,provider:"Airline Official Demo",redirectUrl:"fixture://provider/flight/official"}
    ]) }),
    stock:Object.freeze({ providers:Object.freeze([
      {providerId:"nasdaq-feed-demo",displayName:"Exchange Feed Demo",domains:["stock"],markets:["US"],capabilities:{search:true,redirect:true,availability:true,price:true,shipping:false,tax:false,inventory:false},trustTier:"exchange",redirectPolicy:"fixture_only",fixtureVersion:"1"},
      {providerId:"global-market-demo",displayName:"Global Market Data Demo",domains:["stock"],markets:["US"],capabilities:{search:true,redirect:true,availability:true,price:true,shipping:false,tax:false,inventory:false},trustTier:"global",redirectPolicy:"fixture_only",fixtureVersion:"1"}
    ]), candidates:Object.freeze([
      {candidateId:"stock-nasdaq-primary",symbol:"DEMO",name:"Demo Technology",exchange:"NASDAQ",lastPrice:120.5,currency:"USD",quoteType:"delayed_fixture",provider:"Exchange Feed Demo",redirectUrl:"fixture://provider/stock/exchange"},
      {candidateId:"stock-nasdaq-alt",symbol:"DEMO",name:"Demo Technology",exchange:"NASDAQ",lastPrice:120.7,currency:"USD",quoteType:"delayed_fixture",provider:"Global Market Data Demo",redirectUrl:"fixture://provider/stock/global"}
    ]) })
  });

  function defaults(businessType) {
    const current = type(businessType);
    if (current === "hotel") return { query:"Tokyo Harbor Hotel Demo", destination:"Tokyo, Japan", paymentRegion:"CN", currencyPreference:"JPY" };
    if (current === "flight") return { query:"Shanghai to Tokyo", destination:"Tokyo, Japan", departure:"Shanghai, China", paymentRegion:"CN", currencyPreference:"CNY" };
    if (current === "stock") return { query:"DEMO", destination:"NASDAQ", exchange:"NASDAQ", currencyPreference:"USD" };
    return { query:"Sony Headphones Demo", destination:"Japan", paymentRegion:"JP", currencyPreference:"JPY" };
  }
  function createGlobalDiscoveryWorkspaceState(input) {
    const guarded=guardWorkspaceInput(input);
    if (!guarded.valid) return failureState({},"NORMALIZATION_REJECTED",{errorDetail:guarded.code});
    const safe = object(guarded.value), requestedType=text(safe.businessType), businessType = requestedType || "product", preset = defaults(type(businessType));
    return Object.freeze({ businessType:businessType, query:text(safe.query || preset.query), destination:text(safe.destination || preset.destination), departure:text(safe.departure || preset.departure), paymentRegion:text(safe.paymentRegion || preset.paymentRegion), exchange:text(safe.exchange || preset.exchange), currencyPreference:text(safe.currencyPreference || preset.currencyPreference), searchState:"IDLE", resolvedMarket:null, selectedProviders:Object.freeze([]), normalizedCandidates:Object.freeze([]), recommendations:Object.freeze({}), redirectIntent:null, error:null, notice:"当前为离线演示结果。" });
  }
  function transitionGlobalDiscoveryWorkspace(stateInput, action) {
    const current = object(stateInput), next = Object.assign({}, current), event = object(action);
    if (event.type === "EDIT") { ["query","destination","departure","paymentRegion","exchange","currencyPreference"].forEach(function (key) { if (Object.prototype.hasOwnProperty.call(event, key)) next[key] = text(event[key]); }); next.searchState = "READY"; next.error = null; }
    if (event.type === "TYPE") return createGlobalDiscoveryWorkspaceState({businessType:text(event.businessType)});
    if (event.type === "SEARCHING") { next.searchState = "SEARCHING"; next.error = null; }
    return Object.freeze(next);
  }
  function keyFor(typeName, candidate, destination) { const item = object(candidate); if (typeName === "product") return [item.title,item.variant,destination].join("|"); if (typeName === "hotel") return [item.hotelName,item.roomType,item.checkIn,item.checkOut].join("|"); if (typeName === "flight") return [item.departure,item.arrival,item.airline,item.flightNumberLabel,item.cabin || ""].join("|"); return [item.symbol,item.exchange,item.currency].join("|"); }
  function deduplicateGlobalDiscoveryCandidates(typeName, candidates, destination) { const guarded=guardWorkspaceInput({typeName:typeName === undefined ? "" : typeName,candidates:candidates === undefined ? [] : candidates,destination:destination === undefined ? "" : destination}); if (!guarded.valid) return Object.freeze([]); const safe=object(guarded.value), groups = {}; list(safe.candidates).forEach(function (candidate) { const key = keyFor(text(safe.typeName),candidate,text(safe.destination)); if (!groups[key]) groups[key] = {candidate:clone(candidate),offers:[]}; groups[key].offers.push(clone(candidate)); }); return Object.freeze(Object.keys(groups).map(function (key) { return Object.freeze(groups[key]); })); }
  function selectVisible(comparison) { const chosen=[], recommendations=object(comparison.recommendations), rows=Array.prototype.slice.call((comparison && comparison.candidates) || []); ["bestPrice","bestValue","bestFlexibility"].forEach(function (key) { const item=object(recommendations[key]); if (item.candidateId && chosen.indexOf(item.candidateId) < 0) chosen.push(item.candidateId); }); rows.forEach(function (candidate) { if (chosen.length < 3 && chosen.indexOf(candidate.candidateId) < 0) chosen.push(candidate.candidateId); }); return Object.freeze(chosen.slice(0,3)); }
  function redirectIntent(candidate, workspace) { const guarded=guardWorkspaceInput({candidate:candidate === undefined ? null : candidate,workspace:workspace === undefined ? null : workspace}); if (!guarded.valid) return Object.freeze({status:"REJECTED",code:"NORMALIZATION_REJECTED",allowed:false,requiresUserConfirmation:true}); const safe=object(guarded.value), safeCandidate=object(safe.candidate), safeWorkspace=object(safe.workspace), url=safeFixtureUrl(safeCandidate.redirectUrl); if (!url) return Object.freeze({status:"REJECTED",code:"REDIRECT_REJECTED",allowed:false,requiresUserConfirmation:true}); return Object.freeze({intentId:"intent-"+text(safeCandidate.candidateId),status:"CREATED",businessType:safeWorkspace.businessType,providerId:text(safeCandidate.provider).toLowerCase().replace(/\s+/g,"-"),providerDisplayName:text(safeCandidate.provider),targetMarket:safeWorkspace.resolvedMarket && safeWorkspace.resolvedMarket.primaryMarket || null,destination:text(safeWorkspace.destination),displayUrlLabel:text(safeCandidate.provider)+" destination",allowed:true,requiresUserConfirmation:true,reason:"将在第三方平台查看离线演示报价",payloadSummary:"仅包含查询与目标市场摘要"}); }
  function updateRedirectIntent(intent, action) { const current=object(intent); if (!current.allowed) return current; return Object.freeze(Object.assign({},current,{status:action === "CONFIRM" ? "CONFIRMED" : "CANCELLED"})); }
  function failureState(current, code, extras) { const contract=window.WeishanGlobalDiscoveryErrorContract; const failure=contract&&typeof contract.createGlobalDiscoveryError === "function"?contract.createGlobalDiscoveryError(code):{success:false,error:{code:code,stage:"INPUT",recoverable:true,userMessage:ERROR_COPY[code],detailsSummary:code}}; return Object.freeze(Object.assign({},current,extras||{},{searchState:code === "NO_PROVIDER" || code === "NO_RESULT" ? "EMPTY" : (code === "PARTIAL_PROVIDER_RESULT" || code === "CURRENCY_NOT_COMPARABLE" ? "PARTIAL" : "FAILED"),error:failure.error,notice:failure.error.userMessage})); }
  function runGlobalDiscoveryWorkspace(stateInput) {
    const guard=window.WeishanGlobalDiscoveryInputGuard;
    const guardedInput=guard&&typeof guard.guardAndCloneInput==="function"?guard.guardAndCloneInput(stateInput):{valid:true,code:"SAFE",value:stateInput};
    if (!guardedInput.valid) return failureState(transitionGlobalDiscoveryWorkspace({}, {type:"SEARCHING"}),"NORMALIZATION_REJECTED",{errorDetail:guardedInput.code});
    const safeInput=object(guardedInput.value), fixtures=object(safeInput.fixtures), executionInput={businessType:safeInput.businessType,query:safeInput.query,destination:safeInput.destination,departure:safeInput.departure,paymentRegion:safeInput.paymentRegion,exchange:safeInput.exchange,currencyPreference:safeInput.currencyPreference};
    let state=transitionGlobalDiscoveryWorkspace(executionInput,{type:"SEARCHING"}); const requestedType=text(state.businessType), businessType=type(requestedType), fixture=CATALOG[businessType];
    if (!text(state.query)) return failureState(state,"INVALID_QUERY");
    if (requestedType && TYPES.indexOf(requestedType) < 0) return failureState(state,"UNSUPPORTED_BUSINESS_TYPE");
    if (!fixture) return failureState(state,"UNSUPPORTED_BUSINESS_TYPE");
    if (!text(state.destination) || (businessType === "flight" && !text(state.departure))) return failureState(state,"INVALID_DESTINATION");
    const injectedProviders=Object.prototype.hasOwnProperty.call(fixtures,"providers"), injectedCandidates=Object.prototype.hasOwnProperty.call(fixtures,"candidates"), injectedRedirect=Object.prototype.hasOwnProperty.call(fixtures,"redirectIntent"), providers=injectedProviders?list(fixtures.providers):fixture.providers, candidates=injectedCandidates?list(fixtures.candidates):fixture.candidates;
    if (injectedProviders && providers.some(function (provider) { const check=Engine.validateProviderCapabilityContract(provider); return !check.valid; })) return failureState(state,"NORMALIZATION_REJECTED");
    const engineInput={domain:businessType,query:state.query,shippingDestination:businessType === "product" ? state.destination : "",hotelCountry:businessType === "hotel" ? "JP" : "",departure:businessType === "flight" ? "CN" : "",arrival:businessType === "flight" ? "JP" : "",paymentRegion:state.paymentRegion,exchange:state.exchange,region:businessType === "stock" ? "US" : "",providers:providers,candidates:candidates};
    const plan=Engine.createGlobalDiscoveryPlan(engineInput);
    if (!plan.providerSelection.length) return failureState(state,"NO_PROVIDER",{resolvedMarket:plan.region,selectedProviders:Object.freeze([]),normalizedCandidates:Object.freeze([]),recommendations:Object.freeze({})});
    const normalized=Engine.normalizeDiscoveryCandidates(engineInput), invalid=normalized.some(function (candidate) { return !candidate.currency || candidate.total === null || !candidate.redirectUrl; });
    if (invalid) return failureState(state,"NORMALIZATION_REJECTED",{resolvedMarket:plan.region});
    const grouped=deduplicateGlobalDiscoveryCandidates(businessType,normalized,state.destination), comparison=Engine.buildDiscoveryComparison(engineInput), visible=selectVisible(comparison), selected=normalized.filter(function (candidate) { return visible.indexOf(candidate.candidateId) >= 0; });
    let recommendations=comparison.recommendations;
    if (businessType === "stock") recommendations=Object.freeze({primarySource:selected[0] ? {candidateId:selected[0].candidateId,label:"PRIMARY_SOURCE"}:null,alternativeSource:selected[1] ? {candidateId:selected[1].candidateId,label:"ALTERNATIVE_SOURCE"}:null,marketContext:{label:"MARKET_CONTEXT"}});
    const partial=selected.length < 3 || plan.providerSelection.length < fixture.providers.length;
    if (!selected.length) return failureState(state,"NO_RESULT",{resolvedMarket:plan.region,selectedProviders:plan.providerSelection,normalizedCandidates:Object.freeze([]),recommendations:Object.freeze({}),deduplicatedCandidates:grouped});
    if (injectedRedirect && !redirectIntent(Object.assign({},selected[0],object(fixtures.redirectIntent)),state).allowed) return failureState(state,"REDIRECT_REJECTED",{resolvedMarket:plan.region,selectedProviders:plan.providerSelection,normalizedCandidates:Object.freeze(selected),recommendations:recommendations,deduplicatedCandidates:grouped});
    return Object.freeze(Object.assign({},state,{searchState:partial?"PARTIAL":"COMPLETED",resolvedMarket:plan.region,selectedProviders:plan.providerSelection,normalizedCandidates:Object.freeze(selected),recommendations:recommendations,deduplicatedCandidates:grouped,error:null,notice:partial?"当前离线演示仅展示部分可用候选。":"当前离线演示结果，实际价格以目标平台为准。",currencyComparable:comparison.currencyComparable}));
  }
  function presentGlobalDiscoveryWorkspace(stateInput) { const state=object(stateInput); return Object.freeze({title:"全球发现",subtitle:"根据商品送达地或服务目的地，比较当地及国际平台的可选方案。",thirdPartyNotice:"Weishan 不收款、不创建订单，也不参与发货和售后。最终交易由第三方平台完成。",state:state.searchState,notice:text(state.notice),targetMarket:object(state.resolvedMarket),providers:list(state.selectedProviders),results:list(state.normalizedCandidates).map(function (candidate) { return Object.freeze({candidateId:candidate.candidateId,provider:candidate.provider,total:candidate.total,currency:candidate.currency,redirect:redirectIntent(candidate,state),offline:"Offline Demo / Fixture"}); }),recommendations:object(state.recommendations)}); }
  function renderGlobalDiscoveryWorkspace(stateInput) { const state=object(stateInput), view=presentGlobalDiscoveryWorkspace(state), t=function(key){ return window.I18n && window.I18n.t ? window.I18n.t(key) : key; }, tabs=TYPES.map(function (item) { return '<button type="button" class="cmd-btn '+(item===state.businessType?'primary':'gray')+'" data-discovery-type="'+item+'">'+t({product:"discoveryProduct",hotel:"discoveryHotel",flight:"discoveryFlight",stock:"discoveryStock"}[item])+'</button>'; }).join(""), results=view.results.map(function (item) { return '<article class="commerce-result-card" data-discovery-result="'+esc(item.candidateId)+'"><strong>'+esc(item.provider)+'</strong><p>'+t("discoveryTotal")+'：'+esc(item.total)+' '+esc(item.currency)+'</p><p>'+esc(item.offline)+'</p><button type="button" class="cmd-btn gray" data-discovery-redirect="'+esc(item.candidateId)+'">'+t("discoveryOpenPlatform")+'</button></article>'; }).join("") || '<p class="commerce-muted">'+esc(view.notice)+'</p>';
    const market=view.targetMarket.primaryMarket || t("discoveryPending");
    return '<section class="commerce-global-discovery" data-global-discovery="true" aria-label="'+t("discoveryTitle")+'"><header><h2>'+t("discoveryTitle")+'</h2><p>'+esc(view.subtitle)+'</p></header><div class="cmd-actions" role="tablist" aria-label="'+t("discoveryType")+'">'+tabs+'</div><div class="commerce-toolbar"><label>'+t("discoveryQuery")+'<input class="cmd-input" data-discovery-query value="'+esc(state.query)+'"></label><label>'+t("discoveryDestination")+'<input class="cmd-input" data-discovery-destination value="'+esc(state.destination)+'"></label><button type="button" class="cmd-btn primary" data-discovery-search>'+t("discoverySearch")+'</button></div><div class="commerce-safety"><strong>'+t("discoveryMarket")+'：'+esc(market)+'</strong>。'+t("discoveryBasis")+'：'+esc(view.targetMarket.source || t("discoveryPending"))+'。'+t("discoveryIgnored")+'</div><p class="commerce-muted">'+window.I18n.format("discoveryProviders",{count:view.providers.length})+'；'+t("discoveryCurrencyNotice")+'</p><div class="commerce-candidates">'+results+'</div><p class="commerce-risk">'+esc(view.thirdPartyNotice)+'</p>'+ (state.redirectIntent ? '<section class="commerce-safety" data-discovery-confirmation><p>'+t("discoveryConfirmation")+'</p><p>'+t("discoveryIntentStatus")+'：'+esc(state.redirectIntent.status)+'</p><button type="button" class="cmd-btn primary" data-discovery-confirm>'+t("discoveryConfirm")+'</button><button type="button" class="cmd-btn gray" data-discovery-cancel>'+t("discoveryCancel")+'</button></section>' : '')+'</section>';
  }
  function mountGlobalDiscoveryWorkspace(host) { let current=createGlobalDiscoveryWorkspaceState(); function redraw() { const root=host.querySelector("[data-global-discovery-host]"); if (root) { root.innerHTML=renderGlobalDiscoveryWorkspace(current); bind(root); } } function bind(root) { root.onclick=function (event) { const target=event.target.closest("button"); if (!target) return; if (target.dataset.discoveryType) { current=transitionGlobalDiscoveryWorkspace(current,{type:"TYPE",businessType:target.dataset.discoveryType}); redraw(); } else if (target.hasAttribute("data-discovery-search")) { const query=root.querySelector("[data-discovery-query]"); const destination=root.querySelector("[data-discovery-destination]"); current=transitionGlobalDiscoveryWorkspace(current,{type:"EDIT",query:query&&query.value,destination:destination&&destination.value}); current=runGlobalDiscoveryWorkspace(current); redraw(); } else if (target.dataset.discoveryRedirect) { const candidate=list(current.normalizedCandidates).find(function (item) { return item.candidateId===target.dataset.discoveryRedirect; }); current=Object.freeze(Object.assign({},current,{redirectIntent:redirectIntent(candidate,current)})); redraw(); } else if (target.hasAttribute("data-discovery-confirm")) { current=Object.freeze(Object.assign({},current,{redirectIntent:updateRedirectIntent(current.redirectIntent,"CONFIRM")})); redraw(); } else if (target.hasAttribute("data-discovery-cancel")) { current=Object.freeze(Object.assign({},current,{redirectIntent:updateRedirectIntent(current.redirectIntent,"CANCEL")})); redraw(); } }; } redraw(); }
  window.WeishanGlobalDiscoveryWorkspace={STATES,TYPES,CATALOG,ERROR_COPY,createGlobalDiscoveryWorkspaceState,transitionGlobalDiscoveryWorkspace,runGlobalDiscoveryWorkspace,deduplicateGlobalDiscoveryCandidates,createRedirectIntent:redirectIntent,updateRedirectIntent,presentGlobalDiscoveryWorkspace,renderGlobalDiscoveryWorkspace,mountGlobalDiscoveryWorkspace};
})();
