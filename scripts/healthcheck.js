const { existsSync, readFileSync, readdirSync, statSync } = require("fs");
const { join, relative } = require("path");
const { runSecretScan } = require("./secret-scan");

const root = join(__dirname, "..");

function readText(file) {
  try {
    return readFileSync(join(root, file), "utf8");
  } catch (_) {
    return "";
  }
}

function result(name, status, detail, suggestion) {
  return { name, status, detail, suggestion: suggestion || "" };
}

function hasFile(file) {
  return existsSync(join(root, file));
}

function statusRank(status) {
  if (status === "fail") return 3;
  if (status === "warn") return 2;
  return 1;
}

function overall(results) {
  if (results.some((item) => item.status === "fail")) return "FAIL";
  if (results.some((item) => item.status === "warn")) return "WARN";
  return "PASS";
}

function checkFiles() {
  const files = [
    "apps/desktop/src/main.js",
    "apps/desktop/src/preload.js",
    "apps/desktop/src/renderer/main.js",
    "apps/desktop/src/renderer/routes/HomePage.js",
    "apps/desktop/src/renderer/routes/CommerceAgentPage.js",
    "apps/desktop/src/renderer/routes/MailPage.js",
    "apps/desktop/src/renderer/routes/CrawlerPage.js",
    "apps/desktop/src/renderer/routes/BuilderPage.js",
    "apps/desktop/src/renderer/routes/ProjectsPage.js",
    "apps/desktop/src/renderer/routes/MemoryPage.js",
    "apps/desktop/src/renderer/routes/HistoryPage.js",
    "apps/desktop/src/renderer/routes/AuditPage.js",
    "apps/desktop/src/renderer/routes/SecurityPage.js",
    "apps/desktop/src/renderer/core/enterpriseSecurity.js",
    "apps/desktop/src/renderer/core/dispatchRouter.js",
    "apps/desktop/src/renderer/core/commerceAgent.js",
    "apps/desktop/src/renderer/core/commerceProviderAdapter.js",
    "apps/desktop/src/renderer/core/commerceProviderOnboardingChecklist.js",
    "apps/desktop/src/renderer/core/commerceProviderConnector.js",
    "apps/desktop/src/renderer/core/commerceProviderConfig.js",
    "apps/desktop/src/renderer/core/commerceProviderSandbox.js",
    "apps/desktop/src/renderer/core/commerceLocationPolicy.js",
    "apps/desktop/src/renderer/core/commerceLocalLawCompliance.js",
    "apps/desktop/src/renderer/core/commerceGlobalProviderPool.js",
    "apps/desktop/src/renderer/core/commerceProductProviderCandidate.js",
    "apps/desktop/src/renderer/core/commerceProductProviderSelection.js",
    "apps/desktop/src/renderer/core/commerceProviders.js",
    "apps/desktop/src/renderer/core/commerceSearch.js",
    "apps/desktop/src/renderer/core/desktopAssistant.js",
    "apps/desktop/src/renderer/core/repairCenter.js",
    "apps/desktop/src/renderer/core/taskProtocol.js",
    "apps/server/src/cloud/storageAdapter.js",
    "apps/server/src/cloud/providers/localMockStorageAdapter.js",
    "apps/server/src/cloud/providers/s3CompatibleStorageAdapter.js",
    "apps/server/src/cloud/metadataAdapter.js",
    "apps/server/src/cloud/cloudService.js",
    "apps/server/src/cloud/cloudHealthcheck.js"
  ];
  return files.map((file) => result("file:" + file, hasFile(file) ? "pass" : "fail", hasFile(file) ? "exists" : "missing", "Restore the expected project file."));
}

function checkPackageScripts() {
  const pkg = JSON.parse(readText("package.json") || "{}");
  const scripts = pkg.scripts || {};
  return ["check", "dev:desktop", "healthcheck", "release:check", "release:notes", "release:postcheck", "secrets:scan", "standard:commerce", "version:check", "test:api", "test:e2e", "test:e2e:smoke", "test:e2e:repair", "test:e2e:dispatch", "test:e2e:commerce-agent", "test:e2e:desktop-assistant", "test:e2e:cloud"].map((script) => {
    const ok = Boolean(scripts[script]);
    const status = ok ? "pass" : (script === "healthcheck" ? "warn" : "fail");
    return result("script:" + script, status, ok ? scripts[script] : "missing", "Add the missing package script.");
  });
}

function marker(file, pattern, name, required) {
  const text = readText(file);
  const ok = pattern.test(text);
  return result(name, ok ? "pass" : (required ? "fail" : "warn"), ok ? "found" : "not found", "Check module integration markers.");
}

function checkMarkers() {
  return [
    marker("apps/desktop/src/renderer/core/taskProtocol.js", /createTaskRecord|addTaskArtifact|TASK_PROTOCOL_VERSION/, "marker:task protocol helper", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /WeishanDispatchRouter|classifyCommand|createDispatchPlan/, "marker:dispatch router exists", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /mail|crawler|softwareFactory|document|ppt|codex|chat|coordination/, "marker:dispatch router module coverage", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /commerceAgent|commerceAgent\.plan/, "marker:commerce agent route", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /全球采购|搜索、比价、推荐、执行前确认/, "marker:commerce agent page", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /createCommercePlan|classifyCommerceIntent|commerceAgent\.plan/, "marker:commerce agent plan", true),
    marker("apps/desktop/src/renderer/core/commerceProviderAdapter.js", /createReadOnlyProviderAdapter|search:typeof next\.search|normalizeResult|validateResult/, "marker:commerce provider adapter contract", true),
    marker("apps/desktop/src/renderer/core/commerceProviderAdapter.js", /mode:"read_only"|READ_ONLY_CAPABILITIES/, "marker:commerce adapter read only mode", true),
    marker("apps/desktop/src/renderer/core/commerceProviderAdapter.js", /canCreateOrder:false/, "marker:commerce adapter no create order", true),
    marker("apps/desktop/src/renderer/core/commerceProviderAdapter.js", /canPay:false/, "marker:commerce adapter no payment", true),
    marker("apps/desktop/src/renderer/core/commerceProviderAdapter.js", /canSaveIdentity:false/, "marker:commerce adapter no identity storage", true),
    marker("apps/desktop/src/renderer/core/commerceProviderOnboardingChecklist.js", /provider_onboarding_checklist|getProviderOnboardingChecklist/, "marker:provider onboarding checklist", true),
    marker("apps/desktop/src/renderer/core/commerceProviderOnboardingChecklist.js", /approvalRequiredBeforeEndpoint:true|canConnectEndpoint:false/, "marker:provider onboarding required before endpoint", true),
    marker("apps/desktop/src/renderer/core/commerceProviderOnboardingChecklist.js", /approvalRequiredBeforeApiKey:true|canConfigureApiKey:false/, "marker:provider onboarding required before api key", true),
    marker("apps/desktop/src/renderer/core/commerceProviderOnboardingChecklist.js", /approvalRequiredBeforeNetwork:true|canEnableNetworkSearch:false/, "marker:provider onboarding required before network", true),
    marker("apps/desktop/src/renderer/core/commerceProviderOnboardingChecklist.js", /approvalRequiredBeforePriceDisplay:true|canDisplayPrice:false/, "marker:provider onboarding required before price display", true),
    marker("apps/desktop/src/renderer/core/commerceProviderOnboardingChecklist.js", /legalTermsReviewed:false/, "marker:provider onboarding legal terms", true),
    marker("apps/desktop/src/renderer/core/commerceProviderOnboardingChecklist.js", /apiDocsReviewed:false/, "marker:provider onboarding api docs", true),
    marker("apps/desktop/src/renderer/core/commerceProviderOnboardingChecklist.js", /taxAndFeeFieldsReviewed:false|shippingOrBookingFeeFieldsReviewed:false/, "marker:provider onboarding tax fee fields", true),
    marker("apps/desktop/src/renderer/core/commerceProviderOnboardingChecklist.js", /privacyPolicyReviewed:false|apiKeyStoragePlanReviewed:false/, "marker:provider onboarding privacy", true),
    marker("apps/desktop/src/renderer/core/commerceProviderOnboardingChecklist.js", /noPaymentConfirmed:false|noAutoOrderConfirmed:false|noPayment:true|noOrderSubmit:true/, "marker:provider onboarding no payment no auto order", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /Provider 接入审查面板|法律条款审查|API 文档审查/, "marker:provider onboarding review panel", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /commerce-onboarding-review-panel|真实 provider 接入前必须完成以下审查/, "marker:provider onboarding review panel visible", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /commerce-onboarding-home-panel|Provider 接入审查面板|总体状态：未完成，暂不可接入真实 provider/, "marker:provider onboarding review panel visible on home card", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /commerce-onboarding-review-panel|Provider 接入审查面板|总体状态：/, "marker:provider onboarding review panel visible on detail page", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /commerceOnboardingHomePanel|commerce-onboarding-group|价格\/税费\/运费字段审查/, "marker:provider onboarding not only summary paragraph", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /合规与条款|API 与接口|价格与费用字段|安全边界|当前阻断状态/, "marker:provider onboarding grouped checklist", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /合规与条款|API 与接口|价格与费用字段|安全边界|当前阻断状态/, "marker:provider onboarding grouped checklist visible", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /合规与条款|法律条款审查|隐私政策审查|合规风险审查/, "marker:provider onboarding compliance terms group", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /API 与接口|API 文档审查|调用额度 \/ 频率限制审查|API key 存储方案/, "marker:provider onboarding api interface group", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /价格与费用字段|价格字段审查|税费 \/ 关税 \/ 运费 \/ 预订费字段审查/, "marker:provider onboarding price fee group", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /安全边界|不代付款确认|不自动下单确认|不保存证件\/银行卡确认/, "marker:provider onboarding safety boundary group", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /当前阻断状态|网络搜索|实时价格|精确跳转/, "marker:provider onboarding current blocked state", true),
    marker("tests/e2e/commerce-agent.spec.js", /not\.toContainText\("provider_onboarding_required"\)|not\.toContainText\("apiKeyConfigured=false"\)/, "marker:provider onboarding no raw field in user ui", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /toOnboardingDisplayStatus|未完成|未审查|尚未接入|未启用|不可用/, "marker:provider onboarding natural language status", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /真实接通后的状态应为|不能提前模拟|审查全部完成/, "marker:provider onboarding final connection requirements", true),
    marker("tests/e2e/commerce-agent.spec.js", /not\.toContainText\("legalTermsReviewed=false"\)|not\.toContainText\("canConnectEndpoint=false"\)/, "marker:provider onboarding no raw boolean in ui", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /只有以上审查全部完成/, "marker:provider onboarding all checks required before connection", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /config \/ adapter \/ sandbox \/ connector gate/, "marker:provider onboarding config adapter sandbox connector gate", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /不能提前模拟/, "marker:provider onboarding no fake connected state", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConnector.js", /connectorType:"readonly_search"|getCommerceProviderConnector|search:function/, "marker:commerce provider connector contract", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConnector.js", /enabled:false|connectorStatus:"not_configured"/, "marker:commerce connector disabled by default", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConnector.js", /networkAllowed:false/, "marker:commerce connector network disabled by default", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConnector.js", /readonly_search|template_disabled/, "marker:commerce connector readonly search template", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConnector.js", /dataSourceType:"template_disabled"/, "marker:commerce connector no real endpoint", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConnector.js", /hasApiKey:false|requiresApiKey:true/, "marker:commerce connector no hardcoded key", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConnector.js", /supportsCreateOrder:false/, "marker:commerce connector no order", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConnector.js", /supportsPayment:false/, "marker:commerce connector no payment", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConnector.js", /supportsIdentityStorage:false/, "marker:commerce connector no identity storage", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConfig.js", /getCommerceProviderConfig|configSource|allowNetworkSearch/, "marker:commerce provider config layer", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConfig.js", /apiKeyEnvName|hasApiKey:false|apiKeyConfigured/, "marker:commerce provider config no hardcoded key", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConfig.js", /hasApiKey:true|hasApiKey:false|redacted/, "marker:commerce provider config no key leak", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConfig.js", /allowNetworkSearch:false/, "marker:commerce provider network search disabled by default", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConfig.js", /allowCreateOrder:false/, "marker:commerce provider cannot create order", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConfig.js", /allowPay:false/, "marker:commerce provider cannot pay", true),
    marker("apps/desktop/src/renderer/core/commerceProviderConfig.js", /allowSaveIdentity:false/, "marker:commerce provider cannot save identity", true),
    marker("apps/desktop/src/renderer/core/commerceProviderSandbox.js", /sandboxMode:"dry_run"|getCommerceProviderSandbox/, "marker:commerce provider sandbox dry run", true),
    marker("apps/desktop/src/renderer/core/commerceProviderSandbox.js", /globalReadiness|getProviderGlobalReadiness|supportedRegions|supportedCountries|supportedCurrencies/, "marker:commerce provider global readiness", true),
    marker("apps/desktop/src/renderer/core/commerceProviderSandbox.js", /canProceedToRealSearch:false|provider_dry_run_blocked/, "marker:commerce provider dry run blocks real search by default", true),
    marker("apps/desktop/src/renderer/core/commerceProviderSandbox.js", /networkAllowed|networkRequestAllowed:false/, "marker:commerce provider network disabled by default", true),
    marker("apps/desktop/src/renderer/core/commerceProviderSandbox.js", /priceAllowed:false|canShowPrice:false/, "marker:commerce provider price disabled by default", true),
    marker("apps/desktop/src/renderer/core/commerceProviderSandbox.js", /createOrderAllowed:false|canCreateOrder:false/, "marker:commerce provider no order in dry run", true),
    marker("apps/desktop/src/renderer/core/commerceProviderSandbox.js", /paymentAllowed:false|canPay:false/, "marker:commerce provider no payment in dry run", true),
    marker("apps/desktop/src/renderer/core/commerceProviderSandbox.js", /identityStorageAllowed:false|canSaveIdentity:false/, "marker:commerce provider no identity storage in dry run", true),
    marker("apps/desktop/src/renderer/core/commerceLocationPolicy.js", /createCommerceLocationPolicy|locationHealthForCommerce/, "marker:commerce location policy", true),
    marker("apps/desktop/src/renderer/core/commerceLocalLawCompliance.js", /local_law_compliance_gate|evaluateLocalLawCompliance/, "marker:local law compliance gate", true),
    marker("apps/desktop/src/renderer/core/commerceLocalLawCompliance.js", /precise_location_if_available/, "marker:local law uses precise location when available", true),
    marker("apps/desktop/src/renderer/core/commerceLocalLawCompliance.js", /shipping_destination/, "marker:local law falls back to shipping destination", true),
    marker("apps/desktop/src/renderer/core/commerceLocalLawCompliance.js", /strictestRuleWins:true/, "marker:local law strictest rule wins", true),
    marker("apps/desktop/src/renderer/core/commerceLocalLawCompliance.js", /unknownLegalityBlocks:true/, "marker:local law unknown blocks price", true),
    marker("apps/desktop/src/renderer/core/commerceLocalLawCompliance.js", /noRedirectWhenUnverified:true|canShowRedirectButton:false/, "marker:local law unknown blocks redirect", true),
    marker("apps/desktop/src/renderer/core/commerceLocalLawCompliance.js", /REGULATED_CATEGORIES|regulatedCategories/, "marker:local law regulated categories", true),
    marker("apps/desktop/src/renderer/core/commerceLocalLawCompliance.js", /noLegalAdvice:true|不提供法律意见/, "marker:local law no legal advice", true),
    marker("apps/desktop/src/renderer/core/commerceLocalLawCompliance.js", /storeRawCoordinates:false|不保存原始 GPS 坐标/, "marker:local law no raw gps storage", true),
    marker("apps/desktop/src/renderer/core/commerceLocalLawCompliance.js", /shareWithThirdParty:false|不上传定位到第三方/, "marker:local law no third party location upload", true),
    marker("apps/desktop/src/renderer/core/commerceLocationPolicy.js", /shippingDestinationRequiredForAccuratePrice:true|shipping_destination_required/, "marker:commerce shipping destination policy", true),
    marker("apps/desktop/src/renderer/core/commerceLocationPolicy.js", /"off"[\s\S]*"not_requested"/, "marker:commerce location service default off", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /COMMERCE_SHIPPING_DESTINATION_REQUIRED|shipping_destination_required/, "marker:commerce shipping destination blocks accurate price", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /canShowBookingButton:false|canShowCheckoutButton:false|locationHealth/, "marker:commerce shipping destination blocks redirect", true),
    marker("apps/desktop/src/renderer/core/commerceLocationPolicy.js", /storeRawCoordinates:false|rawCoordinatesStored:false/, "marker:commerce location no raw coordinate storage", true),
    marker("apps/desktop/src/renderer/core/commerceLocationPolicy.js", /useForTracking:false|shareWithThirdParty:false/, "marker:commerce location no tracking", true),
    marker("apps/desktop/src/renderer/core/commerceLocationPolicy.js", /useForAds:false/, "marker:commerce location no ads", true),
    marker("apps/desktop/src/renderer/core/commerceLocationPolicy.js", /为了精准计算最低到手价并遵守当地法律|不会保存原始位置/, "marker:commerce location service privacy notice", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /位置与收货目的地|国家\/地区|邮编\/邮政编码/, "marker:commerce shipping destination settings fields", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /永远允许|使用 App 时允许|关闭/, "marker:commerce location service settings options", true),
    marker("apps/desktop/src/renderer/components/Sidebar.js", /WeishanConfig[\s\S]*version|appVersion/, "marker:ui version reads app config", true),
    marker("apps/desktop/src/renderer/core/i18n.js", /homeConsoleBanner:\s*"\$ weishan v\{version\} command-center"/, "marker:home console version placeholder", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderCandidate.js", /provider_candidate_evaluation|selectedFirstCandidate/, "marker:commerce product provider candidate evaluation", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderCandidate.js", /selectedFirstCandidate:"ebay_browse_api"|eBay Browse API/, "marker:commerce first candidate ebay browse api", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderCandidate.js", /selected_not_connected|endpointConnected:false/, "marker:commerce candidate selected not connected", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderCandidate.js", /noRealEndpoint:true|endpointConnected:false/, "marker:commerce candidate no real endpoint", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderCandidate.js", /noApiKey:true|apiKeyConfigured:false/, "marker:commerce candidate no api key", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderCandidate.js", /noNetworkSearch:true|networkAllowed:false/, "marker:commerce candidate no network search", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderCandidate.js", /noPriceDisplay:true|canReturnPriceNow:false/, "marker:commerce candidate no price display", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderCandidate.js", /noCheckout:true|canCheckout:false/, "marker:commerce candidate no checkout", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderCandidate.js", /noPayment:true|canPay:false/, "marker:commerce candidate no payment", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderCandidate.js", /noIdentityStorage:true|canStoreIdentity:false/, "marker:commerce candidate no identity storage", true),
    marker("apps/desktop/src/renderer/core/commerceGlobalProviderPool.js", /getCommerceGlobalProviderPool|providerCategories/, "marker:commerce global provider pool", true),
    marker("apps/desktop/src/renderer/core/commerceGlobalProviderPool.js", /multi_source_provider_pool_not_connected|compare_multiple_sources_before_redirect/, "marker:commerce multi source provider pool not connected", true),
    marker("apps/desktop/src/renderer/core/commerceGlobalProviderPool.js", /product_marketplace|商品电商平台/, "marker:commerce product marketplace providers", true),
    marker("apps/desktop/src/renderer/core/commerceGlobalProviderPool.js", /official_brand_site|品牌\/商品官网/, "marker:commerce official brand site providers", true),
    marker("apps/desktop/src/renderer/core/commerceGlobalProviderPool.js", /hotel_ota|酒店 OTA|hotel_official_site/, "marker:commerce hotel ota providers", true),
    marker("apps/desktop/src/renderer/core/commerceGlobalProviderPool.js", /flight_ota|airline_official_site/, "marker:commerce flight ota providers", true),
    marker("apps/desktop/src/renderer/core/commerceGlobalProviderPool.js", /ticketing_platform|票务平台/, "marker:commerce ticketing providers", true),
    marker("apps/desktop/src/renderer/core/commerceGlobalProviderPool.js", /noRealEndpoint:true/, "marker:commerce provider pool no real endpoint", true),
    marker("apps/desktop/src/renderer/core/commerceGlobalProviderPool.js", /noApiKey:true/, "marker:commerce provider pool no api key", true),
    marker("apps/desktop/src/renderer/core/commerceGlobalProviderPool.js", /noNetworkSearch:true|networkAllowed:false/, "marker:commerce provider pool no network search", true),
    marker("apps/desktop/src/renderer/core/commerceGlobalProviderPool.js", /noPriceDisplay:true|canReturnPriceNow:false/, "marker:commerce provider pool no price display", true),
    marker("apps/desktop/src/renderer/core/commerceGlobalProviderPool.js", /noCheckout:true|noInternalCheckout:true/, "marker:commerce provider pool no checkout", true),
    marker("apps/desktop/src/renderer/core/commerceGlobalProviderPool.js", /noPayment:true|noAutoPay:true/, "marker:commerce provider pool no payment", true),
    marker("apps/desktop/src/renderer/core/commerceGlobalProviderPool.js", /noIdentityStorage:true|noIdentityStorage:true/, "marker:commerce provider pool no identity storage", true),
    marker("docs/WEISHAN_GLOBAL_COMMERCE_STANDARD.md", /weishan 全球采购与最低到手价标准 V1|全球个人数字采购代理/, "marker:global commerce standard", true),
    marker("docs/WEISHAN_GLOBAL_COMMERCE_STANDARD.md", /weishan 全球采购与最低到手价标准 V1/, "marker:global commerce standard file", true),
    marker("docs/WEISHAN_GLOBAL_COMMERCE_STANDARD.md", /每次新功能前必须先读[\s\S]*WEISHAN_GLOBAL_COMMERCE_STANDARD\.md/, "marker:global commerce standard required before development", true),
    marker("docs/WEISHAN_GLOBAL_COMMERCE_STANDARD.md", /不是 eBay 工具|不是单一平台工具/, "marker:global commerce standard not ebay only", true),
    marker("docs/WEISHAN_GLOBAL_COMMERCE_STANDARD.md", /不代付款|不是支付平台/, "marker:global commerce standard no payment", true),
    marker("docs/WEISHAN_GLOBAL_COMMERCE_STANDARD.md", /不自动下单|不提交订单/, "marker:global commerce standard no auto order", true),
    marker("docs/WEISHAN_GLOBAL_COMMERCE_STANDARD.md", /不保存银行卡|不保存身份证|不保存护照/, "marker:global commerce standard no identity storage", true),
    marker("docs/WEISHAN_GLOBAL_COMMERCE_STANDARD.md", /totalLandedCost|最低到手价/, "marker:global commerce standard landed cost", true),
    marker("docs/WEISHAN_GLOBAL_COMMERCE_STANDARD.md", /收货目的地|Mac 定位服务只能作为辅助/, "marker:global commerce standard shipping destination", true),
    marker("docs/WEISHAN_GLOBAL_COMMERCE_STANDARD.md", /candidate evaluation|config safety|read_only adapter|sandbox dry run|connector gate/, "marker:global commerce standard provider gate", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /商品电商平台、品牌官网、商品官网、区域电商平台/, "marker:commerce product pool ui scope", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /酒店官网、酒店 OTA、区域住宿平台/, "marker:commerce hotel pool ui scope", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /机票 OTA、航司官网、区域旅行平台/, "marker:commerce flight pool ui scope", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /票务平台、活动官网、区域票务平台/, "marker:commerce ticket pool ui scope", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /接口状态：尚未接入|精确跳转：待真实 provider 接入后启用/, "marker:commerce provider pool hides raw fields", true),
    marker("apps/desktop/src/renderer/core/commerceProviders.js", /supportedRegions|supportedCountries|supportedLanguages|supportedCurrencies/, "marker:commerce provider multi region metadata", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderSelection.js", /getProductProviderSelection|multi_source_product_provider_pool_candidate|selection_ready_not_connected/, "marker:commerce product provider selection", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderSelection.js", /product_search_readonly_candidate|productProviderReadOnlyOnly:true/, "marker:commerce product provider candidate readonly", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderSelection.js", /productProviderEnabled:false|productProviderConfigured:false/, "marker:commerce product provider disabled by default", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderSelection.js", /providerEndpoint:""|networkEndpoint:""/, "marker:commerce product provider no real endpoint", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderSelection.js", /productProviderHasApiKey:false/, "marker:commerce product provider no hardcoded key", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderSelection.js", /productProviderNetworkAllowed:false/, "marker:commerce product provider no network by default", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderSelection.js", /productProviderNoCheckout:true|autoCheckout:true/, "marker:commerce product provider no checkout", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderSelection.js", /productProviderNoPayment:true|collectPaymentInfo:true/, "marker:commerce product provider no payment", true),
    marker("apps/desktop/src/renderer/core/commerceProductProviderSelection.js", /productProviderNoIdentityStorage:true|storeIdentityDocuments:true/, "marker:commerce product provider no identity storage", true),
    marker("apps/desktop/src/renderer/core/commerceProviderSandbox.js", /apiKeyPresent|networkRequestAllowed|canCallProvider/, "marker:commerce provider readiness checks", true),
    marker("apps/desktop/src/renderer/core/commerceProviderSandbox.js", /validateProviderResultShape|schemaValidationStatus/, "marker:commerce provider result schema validation", true),
    marker("apps/desktop/src/renderer/core/commerceProviderSandbox.js", /canShowPrice:false|canShowBookingButton:false|canShowCheckoutButton:false/, "marker:commerce sandbox no price button", true),
    marker("apps/desktop/src/renderer/core/commerceProviderSandbox.js", /canCreateOrder:false|canPay:false|canSaveIdentity:false/, "marker:commerce sandbox no transaction identity", true),
    marker("apps/desktop/src/renderer/core/commerceProviders.js", /getCommerceProviderRegistry|sourceType|manual_disabled/, "marker:commerce provider registry", true),
    marker("apps/desktop/src/renderer/core/commerceProviders.js", /getCommerceProviderHealth|canShowPrice|canShowBookingButton|canShowCheckoutButton/, "marker:commerce provider health", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /searchStatus:"no_provider"|canShowPrice:false/, "marker:commerce no-provider canShowPrice false", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /canShowBookingButton:false/, "marker:commerce no-provider no booking button", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /canShowCheckoutButton:false/, "marker:commerce no-provider no checkout button", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /getCommerceSearchSettings|hasCommerceSearchProvider|providerMode/, "marker:commerce search provider status", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /searchCommerceCandidates|normalizeCommerceSearchResults|isLiveResult/, "marker:commerce real search v1", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /没有可用候选方案|未配置时不会显示假价格|price !== null/, "marker:commerce no fake price", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /candidateId|sourceName|priceLabel|bookingUrlHost|recommendationReason/, "marker:commerce candidates schema", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /validateBookingUrl|parsed\.protocol === "https:" \|\| parsed\.protocol === "http:"/, "marker:commerce booking url http https only", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /OpenRouter|OPENROUTER_MODELS_URL|searchOpenRouterModels/, "marker:commerce openrouter provider", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /promptPricePerMillion|completionPricePerMillion|contextLength/, "marker:commerce openrouter model pricing", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /价格字段不可解析|OPENROUTER_MODELS_UNAVAILABLE|无法返回真实价格/, "marker:commerce openrouter no fake price", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /1000000|1M tokens|pricePerMillion/, "marker:commerce openrouter price per million", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /validateOpenRouterModelUrl|openrouter\.ai/, "marker:commerce openrouter https model link only", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /OpenRouter 搜索源不可用|搜索源不可用，无法返回真实价格/, "marker:commerce provider failure no fake result", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /isAiModelPricingTask\(request\).*searchOpenRouterModels|category === "aiModelPricing"/s, "marker:commerce non ai category no openrouter leakage", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /不下单、不付款、不提交订单|不会下单、付款或提交订单/, "marker:commerce no payment submit", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /cruise:"邮轮"|邮轮公司官网|邮轮航线/, "marker:commerce cruise category", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /privateJet:"公务机"|公务机包机平台|jet charter/, "marker:commerce private jet category", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /邮轮价格受航线、舱型、日期和人数影响较大|未接入真实搜索源时不显示价格/, "marker:commerce cruise no fake price", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /公务机属于高价值定制服务|不自动提交询价/, "marker:commerce private jet inquiry only", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /上传身份证\/护照|提交询价表/, "marker:commerce no passport upload", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /不会下单、付款、提交订单|不会下单、付款或提交订单/, "marker:commerce no charter payment", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /邮轮|公务机|私人飞机|包机/, "marker:commerce cruise private jet route", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /预定机票|预订机票|订票|买机票|航空票/, "marker:commerce flight booking intent route", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /预定|预订|订票|买票|低价|最便宜/, "marker:commerce booking keywords before chat", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /originText|destinationText|dateText|extractCommerceFields/, "marker:commerce flight origin destination date text", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /暂未配置真实机票搜索适配器|conditionSummary/, "marker:commerce no ai hijack booking intent", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /酒店|住宿|商品|电商|MacBook|commerceObject/, "marker:commerce hotel product booking route", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /上传\.\*\(\?:护照\|身份证\)|身份证\).*\(\?:预订\|预定\|订\|上传\)|自动付款/, "marker:commerce payment id upload blocked", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /搜索适配器未配置，无法返回真实价格|COMMERCE_NO_PROVIDER|no_provider/, "marker:commerce search source missing state", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /价格可能变化|预订、下单或付款前必须再次确认/, "marker:commerce price may change notice", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /getCommerceSearchScope|搜索范围|searchScope/, "marker:commerce agent search scope", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /getCommerceDecisionCriteria|价格|隐性费用|decisionCriteria/, "marker:commerce agent decision criteria", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /不付款|不真实下单|不下单/, "marker:commerce agent no payment", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /不提交订单|no order|提交订单/, "marker:commerce agent no order submit", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /createCommerceHistoryPayload|inputSummary|decisionCriteriaSummary/, "marker:commerce agent history sanitized", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /commerce-workbench|采购任务列表|计划详情/, "marker:commerce agent task workspace", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /<h1>全球采购<\/h1>|搜索、比价、推荐、执行前确认/, "marker:commerce agent chinese title", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /commerce-task-card[\s\S]*taskStatusLabel[\s\S]*(?!realExecution=false)/, "marker:commerce agent hides raw task fields", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /commerce-detail-grid|commerce-chip-list|commerce-facts/, "marker:commerce agent compact plan detail", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /该请求涉及下单 \/ 付款，已阻断|不会下单、付款或提交订单/, "marker:commerce agent blocked payment display", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /查看计划|清理计划|清理全部计划|返回首页总调度/, "marker:commerce agent no purchase buttons", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /当前为计划阶段：不真实搜索、不下单、不付款、不提交订单|不访问外部网站/, "marker:commerce agent execution boundary preserved", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /getCommerceTasks|addCommerceTask|COMMERCE_TASKS_KEY/, "marker:commerce agent task list", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /createCommercePlanDetail|candidateSchema|recommendationTemplate/, "marker:commerce agent plan detail", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /createMockSafeCandidateSchema|价格字段（留空|风险备注/, "marker:commerce agent candidate schema", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /createRecommendationTemplate|不填真实价格|推荐方案格式/, "marker:commerce agent recommendation template", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /不伪造实时价格|不填真实价格|候选方案只展示字段模板/, "marker:commerce agent no fake live price", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /不真实搜索外部网站|不真实访问外部网站/, "marker:commerce agent no real search", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /不下单、不付款、不提交订单|不提交表单/, "marker:commerce agent no payment submit", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /机票搜索已生成|data-commerce-home-summary|createCommerceDisplayTitle/, "marker:commerce agent home summary", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /data-commerce-home-summary[\s\S]*commerceViewPlanBtn/, "marker:commerce agent single home summary", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /commerceAgent\.plan\|路由判断：全球采购|isCommerceTask/, "marker:commerce agent no duplicate home result", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /commerceHomeCard|commerce-home-card|not\.toContainText\(\"realExecution=false\"\)/, "marker:commerce agent hides raw fields on home", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /完整计划内容已放入全球采购工作台|data-commerce-home-summary/, "marker:commerce agent detail only in workspace", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /查看全球采购计划|commerceViewPlanBtn/, "marker:commerce agent view plan action", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /commerceStatus|createCommerceDisplayTitle|下一步：查看全球采购计划/, "marker:commerce agent compact dispatch record", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /状态：.*已阻断|原因：涉及下单 \/ 付款|不会下单、付款或提交订单/, "marker:commerce agent payment blocked summary", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /normalizeCommerceResult|totalPrice|isRealProviderResult|urlType/, "marker:commerce unified provider result schema", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /sortCommerceCandidates\(normalized\.candidates\)\.slice\(0, 3\)|totalPrice/, "marker:commerce lowest price top three", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /CHEAPEST_REDIRECT_MODE|cheapest_redirect|isDisplayableProviderResult/, "marker:commerce cheapest redirect mode", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /compareByTotalLandedCost|landedSortValue|slice\(0, 3\)/s, "marker:commerce cheapest result sorted by totalPrice", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /isRealProviderResult === true|isBlockedSourceType|sourceType/, "marker:commerce only real provider price", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /normalizeLandedCostBreakdown|landedCostBreakdown/, "marker:commerce landed cost breakdown", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /calculateTotalLandedCost|compareByTotalLandedCost|totalLandedCost/, "marker:commerce total landed cost sorting", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /关税\/进口税|含预估费用/, "marker:commerce estimated duty fee label", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /运费|feePartText/, "marker:commerce estimated shipping fee label", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /发货 \/ 收货|跨境|海关结算/, "marker:commerce cross border fee notice", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /最低到手价推荐|slice\(0, 3\)|到手总价/, "marker:commerce lowest landed cost top three", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /外部商家平台完成购买或预订|commerce-booking-link/, "marker:commerce redirect only external merchant page", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /不代付款|不自动下单|不保存支付或证件信息/, "marker:commerce no internal payment page", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /不自动支付|不提交订单|不自动下单/, "marker:commerce no auto checkout", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /不保存支付或证件信息|不保存证件或银行卡/, "marker:commerce no identity storage", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /openExternal|外部平台完成预订或付款/, "marker:commerce redirect only no internal checkout", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /不自动支付|不提交订单/, "marker:commerce no auto order", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /不代付款|不自动支付/, "marker:commerce no auto payment", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /不保存支付或证件信息|不保存证件或银行卡/, "marker:commerce no identity storage", true),
    marker("apps/desktop/src/renderer/core/commerceSearch.js", /validateBookingUrl|parsed\.protocol === "https:" \|\| parsed\.protocol === "http:"/, "marker:commerce external provider url only", true),
    marker("apps/desktop/src/renderer/routes/CommerceAgentPage.js", /最低到手价推荐|去预订|去购买|查看详情/, "marker:commerce provider result buttons", true),
    marker("apps/desktop/src/renderer/core/commerceAgent.js", /extractProductQuery|productQuery|createCommerceDisplayTitle/, "marker:commerce product dynamic title", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /dispatch\.|createDispatchPlan|home-dispatch/, "marker:command center dispatch", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /homeAiStatus|AI 未连接|AI 已连接/, "marker:home ai gateway status", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /answerChatWithGateway|chat\.unavailable|AI 网关未接通/, "marker:home chat answer gateway required", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /客户端不保存 provider key|model_gateway|AVAILABLE_MODELS/, "marker:model gateway client key forbidden", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /model\.selected|model\.statusViewed|recordHomeDispatchAction/, "marker:model selection history", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /chat\.answered|recordChatHistory/, "marker:chat answer history", true),
    marker("apps/server/src/server.js", /\/api\/ai\/status|WEISHAN_AI_GATEWAY_URL|AI_GATEWAY_NOT_CONFIGURED/, "marker:local ai gateway placeholder", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /saveDispatchPrefill|realExecution=false/, "marker:home dispatch route prefill", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /DISPATCH_STATUS|dispatch\.confirmed|dispatch\.cancelled|dispatch\.executed|dispatch\.failed/, "marker:dispatch pending lifecycle", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /confirmPendingPayload|cancelPendingPayload|recordDispatchHistory/, "marker:dispatch confirm bridge", true),
    marker("apps/desktop/src/renderer/routes/MailPage.js", /data-dispatch-prefill=["']mail["']|来自首页调度中心的任务/, "marker:mail dispatch prefill", true),
    marker("apps/desktop/src/renderer/routes/MailPage.js", /mailDispatchConfirm|confirmDispatch|dispatch\.confirmed/, "marker:mail dispatch confirm", true),
    marker("apps/desktop/src/renderer/routes/MailPage.js", /executeDispatchMail|mail\.executed|mail\.executionRequested/, "marker:mail dispatch confirmed execution bridge", true),
    marker("apps/desktop/src/renderer/routes/MailPage.js", /mail_mock_safe_execution|本地模拟邮件任务结果/, "marker:mail mock safe execution", true),
    marker("apps/desktop/src/renderer/routes/MailPage.js", /不会自动读取邮箱|不会.*发送邮件|realExecution=false/, "marker:mail real execution guarded", true),
    marker("apps/desktop/src/renderer/routes/CrawlerPage.js", /data-dispatch-prefill=["']crawler["']|不会自动访问外网/, "marker:crawler dispatch prefill", true),
    marker("apps/desktop/src/renderer/routes/CrawlerPage.js", /crawlerDispatchConfirm|confirmDispatch|确认抓取/, "marker:crawler dispatch confirm", true),
    marker("apps/desktop/src/renderer/routes/CrawlerPage.js", /executeDispatchCrawler|crawler\.executed|crawler\.executionRequested/, "marker:crawler dispatch confirmed execution bridge", true),
    marker("apps/desktop/src/renderer/routes/CrawlerPage.js", /isMockSafeCrawlerUrl|crawler_mock_safe_execution|本地模拟抓取结果/, "marker:crawler mock safe execution", true),
    marker("apps/desktop/src/renderer/routes/CrawlerPage.js", /真实 URL|手动确认真实抓取|realExecution:false/, "marker:crawler real execution guarded", true),
    marker("apps/desktop/src/renderer/routes/BuilderPage.js", /data-dispatch-prefill=["']softwareFactory["']|不会自动调用 AI/, "marker:software factory dispatch prefill", true),
    marker("apps/desktop/src/renderer/routes/BuilderPage.js", /builderDispatchConfirm|confirmDispatch|确认生成/, "marker:software factory dispatch confirm", true),
    marker("apps/desktop/src/renderer/routes/BuilderPage.js", /executeDispatchSoftwareFactory|softwareFactory\.executed|softwareFactory\.executionRequested/, "marker:software factory dispatch confirmed execution bridge", true),
    marker("apps/desktop/src/renderer/routes/BuilderPage.js", /software_factory_mock_safe_execution|本地模拟软件工厂任务结果/, "marker:software factory mock safe execution", true),
    marker("apps/desktop/src/renderer/routes/BuilderPage.js", /不会自动生成软件|不会调用 AI|不会创建项目文件|realExecution=false/, "marker:software factory real execution guarded", true),
    marker("apps/desktop/src/renderer/routes/BuilderPage.js", /产品定位|核心功能模块|accounts|transactions|audit_logs|MVP 范围|验收标准/, "marker:software factory professional mock result", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /stagedAttachments|data-attachment-stage|附件已挂载/, "marker:home attachment staged before command", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /attachmentCount|attachmentNames|attachmentTypes/, "marker:attachment metadata only", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /chooseFiles[\s\S]*stagedAttachments|CommandApi\.enqueue\(text,\s*\{\s*attachments\s*\}\)/, "marker:no attachment auto execution", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /未读取完整内容|未上传云|attachmentNames/, "marker:no file content in history", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /cancelPendingPayload|dispatch\.cancelled/, "marker:dispatch cancellation", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /realExecution:false|requiresUserConfirmation:true/, "marker:dispatch real execution false", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /realExecution:false|mockSafeExecutionAllowed/, "marker:dispatch real execution false by default", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /requiresUserConfirmation:true/, "marker:dispatch user confirmation required", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /桌面助手与自动操作|desktopAssistantSettingsPanel/, "marker:desktop assistant settings", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /desktopAssistantEnable|桌面助手：|本次开启/, "marker:desktop assistant session toggle", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /createDesktopOperationPlan|classifyDesktopOperation/, "marker:desktop assistant operation plan", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /riskLevel|low|medium|high|getRiskLevelForStep/, "marker:desktop assistant risk levels", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /高风险操作包括|desktop-risk-high/, "marker:desktop assistant high risk red warning", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /realExecution:false/, "marker:desktop assistant real execution false", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /desktopAssistantStop|停止接管/, "marker:desktop assistant stop button", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /desktopAssistant\.planCreated|recordDesktopAssistantHistory/, "marker:desktop assistant history actions", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /系统权限准备|Accessibility|Screen Recording|Input Monitoring/, "marker:desktop assistant permission guide", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /createDesktopExecutionQueue|getDesktopExecutionQueue|DESKTOP_ASSISTANT_QUEUE_KEY/, "marker:desktop assistant execution queue", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /simulateDesktopExecutionQueue|executionSimulated|simulated/, "marker:desktop assistant simulated execution", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /blockHighRiskStep|executionBlocked|blocked/, "marker:desktop assistant high risk blocked", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /realExecution:false|不控制鼠标|不操作键盘|不读取屏幕/, "marker:desktop assistant no real system control", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /stopDesktopAssistantExecution|status:"stopped"/, "marker:desktop assistant stop execution", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /REAL_OPEN_APP_SETTING_KEY|getRealOpenAppEnabled|canRealOpenApp|markRealOpenAppExecuted/, "marker:desktop assistant real open app setting", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /isDesktopAssistantCommand\(raw\)[\s\S]*module:DISPATCH_MODULES\.desktopAssistant[\s\S]*modelKeyword/, "marker:desktop assistant route before chat", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /打开\\s\*\(\?:Google\\s\*\)\?Chrome|打开\\s\*Safari|open\\s\*Safari|open\\s\*Finder/, "marker:desktop assistant open app command classification", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /plan\.module === "chat"[\s\S]*plan\.module === "desktopAssistant"/, "marker:desktop assistant no ai hijack for app open", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /desktopAssistant\.paused|桌面助手接管能力已暂停/, "marker:desktop assistant paused", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /function desktopAssistantStrip\(\)\{[\s\S]*return ""|desktopExecutionQueuePanel\(\)\{[\s\S]*return ""/, "marker:desktop assistant ui hidden from home", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /desktopAssistant\.paused[\s\S]*realExecution:false/, "marker:desktop assistant no real app open while paused", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /desktopAssistant\.highRiskBlocked|高风险操作已阻断/, "marker:desktop assistant high risk still blocked", true),
    marker("apps/desktop/src/renderer/components/Sidebar.js", /全球采购|data-route/, "marker:commerce agent preserved", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /commerceAgent\.plan|isCommerceAgentCommand/, "marker:commerce agent route still active", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /answerChatWithGateway|chat\.answered/, "marker:chat remains fallback for normal questions", true),
    marker("apps/desktop/src/main.js", /desktopAssistant:openWhitelistedApp|DESKTOP_ASSISTANT_ALLOWED_APPS|spawn\("open", \["-a", appName\]/, "marker:desktop assistant whitelisted app ipc", true),
    marker("apps/desktop/src/preload.js", /desktopAssistantOpenApp|desktopAssistant:openWhitelistedApp/, "marker:desktop assistant safe preload bridge", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /允许真实打开白名单 App|desktopAssistantRealOpenApp/, "marker:desktop assistant real open app switch", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /desktopQueueRealOpen|realOpenAppExecuted|确认真实打开/, "marker:desktop assistant real open app confirm", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /desktopAssistantOpenAppBridge|window\.WeishanAPI\.desktopAssistantOpenApp/, "marker:desktop assistant real open homepage bridge", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /realOpenDisabled|sessionRequired|appNotAllowed|riskNotAllowed|真实打开白名单 App 当前关闭/, "marker:desktop assistant real open app gated", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /DESKTOP_APP_WHITELIST|appNotAllowed|desktopAppById/, "marker:desktop assistant whitelist app only", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /desktopQueueRealOpen[\s\S]*确认真实打开|不点击、不输入、不读屏/, "marker:desktop assistant real open button guarded", true),
    marker("apps/desktop/src/main.js", /spawn\("open", \["-a", appName\][\s\S]*shell:false/, "marker:desktop assistant real open no shell exec", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /不会点击鼠标、不会输入键盘、不会读取屏幕/, "marker:desktop assistant real open no keyboard mouse", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /createRealOpenAppHistoryPayload|inputSummary|outputSummary|realExecution/, "marker:desktop assistant real open history sanitized", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /已真实打开白名单 App|下一步建议/, "marker:desktop assistant real open success feedback", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /打开失败|检查该 App 是否已安装|WPS/, "marker:desktop assistant real open failure feedback", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /桌面助手未开启|真实打开白名单 App 当前关闭|该 App 不在白名单|高风险/, "marker:desktop assistant blocked reason messages", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /safetySummary|未点击、未输入、未读屏、未截图/, "marker:desktop assistant real open safety summary", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /resultStatus|realOpened|failed|blocked|simulated|stopped/, "marker:desktop assistant real open history result status", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /DESKTOP_ASSISTANT_TASKS_KEY|createDesktopAssistantTask|getDesktopAssistantTasks/, "marker:desktop assistant multi task queue", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /desktopTask-|taskId/, "marker:desktop assistant task id", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /stopDesktopAssistantTask|desktopAssistant\.taskStopped|taskStopped/, "marker:desktop assistant stop single task", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /stopAllDesktopAssistantTasks|stoppedAll/, "marker:desktop assistant stop all tasks", true),
    marker("apps/desktop/src/renderer/styles/app.css", /desktop-task-queue[\s\S]*max-height[\s\S]*overflow-y:auto/, "marker:desktop assistant scrollable queue", true),
    marker("apps/desktop/src/renderer/core/desktopAssistant.js", /createTaskStopHistoryPayload|safetySummary|inputSummary|outputSummary/, "marker:desktop assistant task history sanitized", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /stopDesktopAssistantTask|停止此任务/, "marker:desktop assistant multiple tasks no cross stop", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /desktopStatusLabel|desktopResultSummary|desktop-status-badge/, "marker:desktop assistant compact task queue", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /desktop-task-debug|desktopStatusLabel|desktopResultSummary/, "marker:desktop assistant hides raw debug fields", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /高风险操作已阻断：不会删除、发送、上传、付款、提交表单或输入密码/, "marker:desktop assistant compact high risk warning", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /expandedDesktopTasks|data-desktop-task-view|收起步骤/, "marker:desktop assistant expandable steps", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /confirmDesktopTask|simulateDesktopTask|realOpenDesktopTask|stopDesktopAssistantTask/, "marker:desktop assistant no behavior change", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /isBlockedTask[\s\S]*canSimulateTask/, "marker:desktop assistant blocked hides simulate button", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /sessionEnabled[\s\S]*canConfirmTask[\s\S]*canSimulateTask/, "marker:desktop assistant disabled hides execution buttons", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /请在下方“桌面助手任务队列”中查看和处理/, "marker:desktop assistant plan summary only in log", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /expandedDesktopTasks[\s\S]*desktop-task-steps/, "marker:desktop assistant steps expandable only", true),
    marker("apps/desktop/src/renderer/styles/app.css", /desktop-result-card\.is-blocked[\s\S]*padding:7px 10px/, "marker:desktop assistant compact blocked warning", true),
    marker("apps/desktop/src/renderer/modules/history/historyApi.js", /window\.HistoryApi|function record/, "marker:HistoryApi", true),
    marker("apps/desktop/src/renderer/routes/HistoryPage.js", /artifact|history-artifact-download|URL\.createObjectURL/, "marker:artifact download", false),
    marker("apps/desktop/src/renderer/core/enterpriseSecurity.js", /WeishanEnterpriseSecurity|canDownload|createSecurityAuditPayload/, "marker:enterprise security", true),
    marker("apps/desktop/src/renderer/routes/AuditPage.js", /audit\.export|risk|HistoryApi\.list/, "marker:audit actions", false),
    marker("apps/desktop/src/renderer/core/enterpriseSecurity.js", /canInviteOrganization|createCollaborationAuditPayload|getEnterpriseOrgCatalog/, "marker:collaboration invite audit", true),
    marker("apps/desktop/src/renderer/core/repairCenter.js", /WeishanRepairCenter|recordRuntimeError|installRepairErrorCapture/, "marker:repair center core", true),
    marker("apps/desktop/src/renderer/core/repairCenter.js", /sanitizeRepairText|sanitizeStack|createSafeTelemetryPayload/, "marker:repair telemetry sanitizer", true),
    marker("apps/desktop/src/renderer/core/repairCenter.js", /repair\.bugDetected|repair\.suggested|repair\.verified|repair\.reportExported/, "marker:repair history actions", true),
    marker("apps/desktop/src/renderer/core/repairCenter.js", /pending_manual_or_cloud_opt_in|clientMode:\s*["']local["']/, "marker:repair upload safety", true),
    marker("apps/server/src/cloud/storageAdapter.js", /class StorageAdapter|createStorageAdapter|s3_compatible/, "marker:storage adapter interface", true),
    marker("apps/server/src/cloud/providers/localMockStorageAdapter.js", /LocalMockStorageAdapter|mock:\/\/storage|getUsage/, "marker:local mock storage adapter", true),
    marker("apps/server/src/cloud/providers/s3CompatibleStorageAdapter.js", /S3CompatibleStorageAdapter|object storage|not_enabled_in_mvp/, "marker:s3 compatible storage adapter skeleton", true),
    marker("apps/server/src/cloud/metadataAdapter.js", /class MetadataAdapter|createMetadataAdapter|Metadata provider/, "marker:metadata adapter interface", true),
    marker("apps/server/src/cloud/metadataAdapter.js", /LocalMockMetadataAdapter|getStorageAllocation|recordFileIndex/, "marker:local mock metadata adapter", true),
    marker("apps/server/src/cloud/metadataAdapter.js", /PocketBaseMetadataAdapterSkeleton|provider:"pocketbase"|not_configured_in_mvp/, "marker:pocketbase metadata provider skeleton", true),
    marker("apps/server/src/cloud/cloudService.js", /createCloudContext|createUploadUrl|pathPrefixFor/, "marker:cloud service core", true),
    marker("apps/server/src/cloud/metadataAdapter.js", /CN_ENTERPRISE_BASIC|CN_ENTERPRISE_STANDARD|CN_ENTERPRISE_PRO|GLOBAL_ENTERPRISE_BASIC|GLOBAL_ENTERPRISE_STANDARD|GLOBAL_ENTERPRISE_PRO|storageQuotaGb|memberLimit/, "marker:enterprise plans mock", true),
    marker("apps/server/src/cloud/cloudService.js", /planById|storageQuotaFor|DEFAULT_ENTERPRISE_PLAN_ID/, "marker:enterprise quota by plan", true),
    marker("apps/server/src/cloud/cloudService.js", /inviteOrganizationMember|MEMBER_LIMIT_REACHED|activeMembers/, "marker:organization member limit", true),
    marker("apps/server/src/cloud/metadataAdapter.js", /localStorageWarning|local only|Free Local/, "marker:local storage warning", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /云服务与企业空间|loadCloudPlans|cloudEnterpriseSettings/, "marker:cloud settings ui", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /当前使用本地存储模式|LOCAL_STORAGE_WARNING/, "marker:local storage warning ui", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /CN_ENTERPRISE_BASIC|CN_ENTERPRISE_STANDARD|CN_ENTERPRISE_PRO|GLOBAL_ENTERPRISE_STANDARD/, "marker:enterprise plans visible", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /allocateCloudStorage|cloud\.storageAllocated/, "marker:cloud mock allocation", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /cloudInviteMember|MEMBER_LIMIT_REACHED|cloud\.organizationInviteRejected/, "marker:organization invite limit", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /cloud\.plansViewed|cloud\.organizationStatusViewed|cloud\.organizationInvite/, "marker:cloud history actions", true),
    marker("apps/server/src/cloud/cloudHealthcheck.js", /runCloudHealthcheck|storageProviderSwitchable|metadataProviderSwitchable/, "marker:cloud provider switchable", true),
    marker("playwright.config.js", /testDir:\s*["']\.\/tests\/e2e["']|reporter|trace/, "marker:playwright config", false),
    marker("tests/e2e/smoke.spec.js", /app launches|home page visible|crawler page visible/, "marker:playwright smoke", false)
  ];
}

function walk(dir, files) {
  if (!existsSync(dir)) return files;
  readdirSync(dir).forEach((entry) => {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry !== "node_modules" && entry !== "dist" && entry !== "build") walk(full, files);
    } else if (/\.(js|html|json)$/.test(entry) && !/package-lock\.json$/.test(entry)) {
      files.push(full);
    }
  });
  return files;
}

function checkSecretWords() {
  const scan = runSecretScan();
  const status = scan.status === "FAIL" ? "fail" : (scan.status === "WARN" ? "warn" : "pass");
  return [
    result("secret scan available", "pass", "scripts/secret-scan.js"),
    result(
      "secret scan result",
      status,
      "scannedFiles=" + scan.scannedFiles + ", warn=" + (scan.counts.warn || 0) + ", fail=" + (scan.counts.fail || 0),
      "Remove literal secrets, use Secure Storage or environment variables, and rotate exposed keys."
    )
  ];
}

function buildResults() {
  return []
    .concat(checkFiles())
    .concat(checkPackageScripts())
    .concat(checkMarkers())
    .concat(checkSecretWords());
}

function markdown(results) {
  const state = overall(results);
  const counts = results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  return [
    "# weishan 自检报告",
    "",
    "检测时间：" + new Date().toISOString(),
    "总体状态：" + state,
    "通过：" + (counts.pass || 0) + "，警告：" + (counts.warn || 0) + "，失败：" + (counts.fail || 0),
    "",
    "## 检测结果",
    "",
    "| 项目 | 状态 | 说明 | 修复建议 |",
    "| --- | --- | --- | --- |",
    ...results.map((item) => "| " + item.name + " | " + item.status + " | " + item.detail + " | " + (item.suggestion || "-") + " |"),
    "",
    "## 未覆盖",
    "",
    "- Playwright E2E",
    "- Metadata provider / database adapter 真实连接",
    "- S3-compatible / object storage provider 真实连接",
    "- Gitleaks 深度密钥扫描",
    "- GitHub Actions"
  ].join("\n");
}

function printList(results) {
  results
    .slice()
    .sort((a, b) => statusRank(b.status) - statusRank(a.status) || a.name.localeCompare(b.name))
    .forEach((item) => {
      console.log("[" + item.status.toUpperCase() + "] " + item.name + " - " + item.detail);
    });
  console.log("HEALTHCHECK " + overall(results));
}

const results = buildResults();
if (process.argv.includes("--markdown")) {
  console.log(markdown(results));
} else {
  printList(results);
}

if (overall(results) === "FAIL") process.exitCode = 1;
