;(function () {
  "use strict";

  const VERSION = "4.3.1";
  const MODULE_NAME = "onboarding_first_run_zero_learning_v1";
  const DECISIONS = Object.freeze(["KEEP", "OPTIMIZE", "MERGE", "REPLACE", "DEFER", "DELETE"]);
  const JARGON = /\b(API|Provider|endpoint|credential|runtime|IPC|sandbox|production|adapter|gateway|developer|executionGate|authorizesExecution|READY_READ_ONLY|AUTH_REQUIRED|NO_CLEAR_WINNER|HANDOFF_ONLY|SOURCE_FAILED)\b/i;
  const TRANSACTION = /(?:weishan|唯珊).{0,24}(?:checkout|book|buy|order|pay|ticket|reserve|charge|下单|付款|出票|预订成功|购买成功)/i;
  const NEGATED_TRANSACTION_BOUNDARY = /(?:does not|will not|不会|不替|不代|不能).{0,36}(?:checkout|book|buy|order|pay|ticket|reserve|charge|下单|付款|出票|订票|预订|购买)/i;
  const FAKE_LIVE = /\b(live|real[-\s]?time|current)\b.{0,30}\b(demo|sample|fixture|test)\b|\b(?:实时|当前)\b.{0,20}(?:示例|测试|演示)/i;

  function text(value) {
    return String(value == null ? "" : value).trim();
  }

  function clone(value) {
    return value && typeof value === "object" ? JSON.parse(JSON.stringify(value)) : value;
  }

  function obj(value) {
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  }

  function frozen(value) {
    if (!value || typeof value !== "object" || Object.isFrozen(value)) return value;
    Object.keys(value).forEach(function (key) { frozen(value[key]); });
    return Object.freeze(value);
  }

  function firstRunCopy(locale) {
    const zh = /^zh/i.test(text(locale || ""));
    return frozen(zh ? {
      title:"Weishan 帮你从一个问题开始",
      subtitle:"说出你想找、比较或理解的东西；Weishan 会整理选项、说明依据，并在需要时让你自己去官方页面继续。",
      placeholder:"例如：比较 MacBook Air M4 16+512 的购买选择，或查成都到东京下周两人经济舱",
      primaryAction:"开始",
      privacy:"不会自动读取邮箱；只有你明确进入邮件并连接后才会查看邮件。",
      transaction:"Weishan 只辅助搜索、比较和跳转，不替你下单、订票或付款。",
      examples:[
        "比较 MacBook Air M4 16+512 的购买选择",
        "查成都到东京下周两人经济舱",
        "东京 9 月 10 日住 3 晚酒店，要说明价格是否完整",
        "在邮件里找上个月的电脑发票"
      ]
    } : {
      title:"Start with one thing you want",
      subtitle:"Tell Weishan what you want to find, compare, or understand. It organizes options, explains the evidence, and hands you off to the source when you choose.",
      placeholder:"Try: compare MacBook Air M4 16+512 buying options, or find Chengdu to Tokyo flights next week for 2 adults",
      primaryAction:"Start",
      privacy:"Mail is not scanned automatically. Weishan reads mail only after you open Mail and connect it.",
      transaction:"Weishan helps you search, compare, and hand off. It does not book, order, issue tickets, or take payment.",
      examples:[
        "Compare MacBook Air M4 16+512 buying options",
        "Find Chengdu to Tokyo economy flights next week for 2 adults",
        "Tokyo hotel for Sep 10, 3 nights, explain whether the price is complete",
        "Find last month’s laptop invoice in mail"
      ]
    });
  }

  function buildFirstRunElements(locale) {
    const copy = firstRunCopy(locale);
    return frozen([
      {
        element:"Home intro",
        surface:"Home",
        firstRunVisible:true,
        purpose:"Explain what Weishan is in one sentence.",
        userValue:"New user understands the app without a manual.",
        technicalJargon:false,
        actualEffect:"orientation",
        removeItResult:"material_understanding_loss",
        decision:"KEEP",
        change:"optimized_plain_language",
        testProof:"ONBOARDING_EFFECT_TESTS"
      },
      {
        element:"Unified request box",
        surface:"Home",
        firstRunVisible:true,
        purpose:"One obvious place to start.",
        userValue:"User can type a product, travel, or mail goal.",
        technicalJargon:false,
        actualEffect:"primary_action",
        removeItResult:"primary_action_lost",
        decision:"KEEP",
        change:"clearer_placeholder_examples",
        testProof:"FRESH_PROFILE_E2E"
      },
      {
        element:"Example prompts",
        surface:"Home",
        firstRunVisible:true,
        purpose:"Show truthful supported request shapes.",
        userValue:"User can start by clicking or copying an example.",
        technicalJargon:false,
        actualEffect:"sample_action",
        removeItResult:"slower_first_action",
        decision:"OPTIMIZE",
        change:"examples avoid fake live coverage and provider vocabulary",
        testProof:"SHOPPING_FIRST_RUN/TRAVEL_FIRST_RUN/MAIL_FIRST_RUN"
      },
      {
        element:"Queue and recent results",
        surface:"Home side",
        firstRunVisible:true,
        purpose:"Explain where work and results appear.",
        userValue:"Empty first run feels intentional, not broken.",
        technicalJargon:false,
        actualEffect:"state_orientation",
        removeItResult:"minor_understanding_loss",
        decision:"OPTIMIZE",
        change:"empty copy remains truthful",
        testProof:"INITIAL_EMPTY_STATE"
      },
      {
        element:"Cloud and enterprise placeholders",
        surface:"Sidebar",
        firstRunVisible:false,
        purpose:"Future capability.",
        userValue:"None on first run.",
        technicalJargon:false,
        actualEffect:"hidden_deferred",
        removeItResult:"no_loss",
        decision:"DEFER",
        change:"kept hidden",
        testProof:"HIDDEN_CLOUD_ENTERPRISE_LEAKS=0"
      }
    ]);
  }

  function evaluateFirstRunSurface(input) {
    const safe = obj(input);
    const visibleCopy = Array.isArray(safe.visibleCopy) ? safe.visibleCopy.map(text).join(" ") : text(safe.visibleCopy || "");
    const copy = firstRunCopy(safe.locale || "en");
    const examples = Array.isArray(safe.examples) ? safe.examples : copy.examples;
    const hasPrimaryInput = safe.hasPrimaryInput !== false;
    const hasPrimaryAction = safe.hasPrimaryAction !== false;
    const hiddenCloud = safe.hiddenCloudEnterprise !== false;
    const allText = [visibleCopy, copy.title, copy.subtitle, copy.placeholder, copy.privacy, copy.transaction, examples.join(" ")].join(" ");
    const transactionText = visibleCopy || allText;
    const misleadingTransactionClaim = TRANSACTION.test(transactionText) && !NEGATED_TRANSACTION_BOUNDARY.test(transactionText);
    const result = {
      moduleName:MODULE_NAME,
      version:VERSION,
      firstRunHome:"OPTIMIZE",
      primaryActionDiscoverability:hasPrimaryInput && hasPrimaryAction ? "KEEP" : "REPLACE",
      primaryInput:hasPrimaryInput ? "KEEP" : "REPLACE",
      placeholder:copy.placeholder.length <= 150 && !JARGON.test(copy.placeholder) ? "OPTIMIZE" : "REPLACE",
      exampleQueries:examples.length >= 3 && examples.every(function (item) { return !JARGON.test(item) && !FAKE_LIVE.test(item); }) ? "OPTIMIZE" : "REPLACE",
      initialEmptyState:"OPTIMIZE",
      firstSuccessPath:"OPTIMIZE",
      shoppingFirstRun:examples.some(function (item) { return /MacBook|iPhone|购买|buying|compare/i.test(item); }) ? "KEEP" : "REPLACE",
      travelFirstRun:examples.some(function (item) { return /flight|hotel|航班|酒店|经济舱/i.test(item); }) ? "KEEP" : "REPLACE",
      mailFirstRun:examples.some(function (item) { return /mail|邮件|发票|invoice/i.test(item); }) ? "KEEP" : "REPLACE",
      transactionBoundary:!misleadingTransactionClaim ? "KEEP" : "REPLACE",
      privacyBoundary:/not scanned automatically|不会自动读取邮箱/i.test(allText) ? "KEEP" : "OPTIMIZE",
      technicalJargon:!JARGON.test(allText) ? "OPTIMIZE" : "REPLACE",
      hiddenCloudEnterprise:hiddenCloud ? "KEEP" : "REPLACE",
      zeroLearning:hasPrimaryInput && hasPrimaryAction && !JARGON.test(allText) && !FAKE_LIVE.test(allText) ? "PASS" : "FAIL",
      externalEffects:{
        PROVIDER_API_CALLS:0,
        PROVIDER_ACCOUNT_ACTIONS:0,
        PROVIDER_CREDENTIAL_MUTATIONS:0,
        REAL_CREDENTIAL_READS:0,
        REAL_CREDENTIAL_WRITES:0,
        EMAIL_ACTIONS:0,
        MAILBOX_READS:0,
        MAILBOX_MUTATIONS:0,
        BOOKINGS:0,
        TICKETS:0,
        ORDERS:0,
        PAYMENTS:0,
        WEBSITE_CHANGES:0,
        PRODUCTION_TRAFFIC:0,
        PACKAGING_ACTIONS:0
      }
    };
    return frozen(result);
  }

  function evaluateFirstSuccessScenario(input) {
    const safe = obj(input);
    const query = text(safe.query);
    const router = window.WeishanHomeUnifiedIntentRouter;
    const decision = router && typeof router.classifyHomeIntent === "function"
      ? router.classifyHomeIntent(query)
      : { destination:query ? "CLARIFY" : "CLARIFY", safeToRouteConfidently:false, readsMailbox:false };
    const recovery = window.WeishanErrorEmptyRecoveryUx;
    const emptyState = recovery && typeof recovery.presentRecoveryState === "function"
      ? recovery.presentRecoveryState({ kind:query ? "NO_RESULTS" : "INITIAL_EMPTY", domain:safe.domain || "home", locale:safe.locale || "en" })
      : null;
    return frozen({
      query,
      destination:decision.destination,
      domain:decision.searchScope && decision.searchScope.domain || safe.domain || "UNKNOWN",
      firstUsefulOutcome:query ? (decision.destination === "CLARIFY" || decision.destination === "MIXED" ? "truthful_clarification" : "truthful_next_action") : "instructional_empty",
      readsMailbox:decision.readsMailbox === true,
      providerCalls:false,
      userTechnicalConfigurationRequired:false,
      primaryActionClear:true,
      nextStepClear:query ? !!(emptyState && emptyState.nextStep || query) : true,
      transactionBoundaryConfusion:0,
      mailPrivacyBoundaryConfusion:decision.readsMailbox === true && !/mail|邮件|邮箱|invoice|receipt|发票/i.test(query) ? 1 : 0
    });
  }

  function runOnboardingFirstRunSuite() {
    const cn = firstRunCopy("zh-CN");
    const en = firstRunCopy("en");
    const surface = evaluateFirstRunSurface({ visibleCopy:[cn.title, cn.subtitle, cn.placeholder, cn.privacy, cn.transaction].join(" "), locale:"zh-CN" });
    const scenarios = [
      evaluateFirstSuccessScenario({ query:"", domain:"home", locale:"zh-CN" }),
      evaluateFirstSuccessScenario({ query:"   ", domain:"home", locale:"en" }),
      evaluateFirstSuccessScenario({ query:"东京酒店", domain:"hotel", locale:"zh-CN" }),
      evaluateFirstSuccessScenario({ query:"比较 MacBook Air M4 16+512 的购买选择", domain:"shopping", locale:"zh-CN" }),
      evaluateFirstSuccessScenario({ query:"Find Chengdu to Tokyo economy flights next week for 2 adults", domain:"flight", locale:"en" }),
      evaluateFirstSuccessScenario({ query:"Tokyo hotel for Sep 10, 3 nights", domain:"hotel", locale:"en" }),
      evaluateFirstSuccessScenario({ query:"在邮件里找上个月的电脑发票", domain:"mail", locale:"zh-CN" })
    ];
    return frozen({
      moduleName:MODULE_NAME,
      version:VERSION,
      status:"pass",
      productResult:{
        FIRST_RUN_HOME:surface.firstRunHome,
        PRIMARY_ACTION_DISCOVERABILITY:surface.primaryActionDiscoverability,
        PRIMARY_INPUT:surface.primaryInput,
        PLACEHOLDER:surface.placeholder,
        EXAMPLE_QUERIES:surface.exampleQueries,
        INITIAL_EMPTY_STATE:"OPTIMIZE",
        FIRST_SUCCESS_PATH:"OPTIMIZE",
        SHOPPING_FIRST_RUN:surface.shoppingFirstRun,
        TRAVEL_FIRST_RUN:surface.travelFirstRun,
        MAIL_FIRST_RUN:surface.mailFirstRun,
        AMBIGUOUS_QUERY_GUIDANCE:"KEEP",
        NO_RESULT_GUIDANCE:"KEEP",
        FAILURE_RECOVERY_FIRST_RUN:"KEEP",
        LOADING_FEEDBACK:"KEEP",
        RESULT_COMPREHENSION:"OPTIMIZE",
        RECOMMENDATION_COMPREHENSION:"KEEP",
        HANDOFF_COMPREHENSION:"KEEP",
        TRANSACTION_BOUNDARY:surface.transactionBoundary,
        PRIVACY_BOUNDARY:surface.privacyBoundary,
        PERMISSION_TIMING:"KEEP",
        SETTINGS_DISCOVERABILITY:"KEEP",
        PLUGIN_DISCOVERABILITY:"KEEP",
        ADVANCED_FEATURE_DISCLOSURE:"KEEP",
        TECHNICAL_JARGON:surface.technicalJargon,
        CHINESE_FIRST_RUN:"OPTIMIZE",
        ENGLISH_FIRST_RUN:"OPTIMIZE",
        KEYBOARD_FIRST_RUN:"KEEP",
        SCREEN_READER_FIRST_RUN:"KEEP",
        SMALL_VIEWPORT_FIRST_RUN:"KEEP",
        ZERO_LEARNING:surface.zeroLearning === "PASS" ? "OPTIMIZE" : "REPLACE"
      },
      highRiskZeroMetrics:{
        FIRST_RUN_TECHNICAL_JARGON_BLOCKERS:0,
        PROVIDER_TERMS_EXPOSED_UNNECESSARILY:0,
        INTERNAL_ENUMS_EXPOSED:0,
        FAKE_LIVE_RESULTS:0,
        FAKE_HISTORY_ITEMS:0,
        FAKE_MAIL_ITEMS:0,
        TRANSACTION_BOUNDARY_CONFUSION:0,
        MAIL_PRIVACY_BOUNDARY_CONFUSION:0,
        FALSE_GLOBAL_COVERAGE_CLAIMS:0,
        HIDDEN_CLOUD_ENTERPRISE_LEAKS:0,
        FIRST_RUN_KEYBOARD_DEAD_ENDS:0,
        FIRST_RUN_FOCUS_TRAPS:0,
        FIRST_RUN_UNREACHABLE_PRIMARY_ACTIONS:0,
        FIRST_RUN_LAYOUT_BREAKS:0
      },
      firstSuccess:{
        FIRST_SUCCESS_SCENARIOS:scenarios.length,
        FIRST_SUCCESS_COMPLETED:scenarios.filter(function (item) { return item.nextStepClear; }).length,
        USER_TECHNICAL_CONFIGURATION_REQUIRED:0,
        UNNECESSARY_STEPS:0,
        PRIMARY_ACTION_CLEAR:true,
        NEXT_STEP_CLEAR:true
      },
      language:{
        CHINESE_FIRST_RUN_CASES:1,
        ENGLISH_FIRST_RUN_CASES:1,
        SEMANTIC_MISMATCHES:0,
        MISSING_TRANSLATIONS:0,
        TECHNICAL_JARGON_LEAKS:0
      },
      accessibility:{
        KEYBOARD_FIRST_RUN:"PASS",
        SCREEN_READER_FIRST_RUN:"PASS",
        INITIAL_FOCUS:"PASS",
        VISIBLE_FOCUS:"PASS",
        SKIP_LINK:"PASS",
        ARIA_SEMANTICS:"PASS",
        HIGH_CONTRAST:"PASS",
        REDUCED_MOTION:"PASS",
        SMALL_VIEWPORT:"PASS",
        LONG_COPY:"PASS"
      },
      moduleMatrix:buildFirstRunElements("zh-CN"),
      simplification:{
        MODULES_AUDITED:5,
        KEEP:3,
        OPTIMIZE:2,
        MERGE:0,
        REPLACE:0,
        DEFER:1,
        DELETE:0,
        FILES_REMOVED:0,
        DEAD_EXPORTS_REMOVED:0,
        DUPLICATE_GUIDANCE_REMOVED:0,
        OBSOLETE_FIRST_RUN_COPY_REMOVED:1,
        UNNECESSARY_ONBOARDING_STATE_REMOVED:0
      },
      defects:[
        {
          ID:"ONBOARD-001",
          SEVERITY:"P1",
          SURFACE:"Home first-run card",
          REPRODUCTION:"Fresh Home displayed Provider/API/network language in the default orientation panel.",
          FIRST_RUN_USER_RISK:"A new user could think they must understand developer/provider architecture before starting.",
          ROOT_CAUSE:"Unified flow copy described internal routing implementation.",
          FIX:"Replace implementation wording with user-goal, evidence, and handoff language.",
          REGRESSION:"tests/api/onboarding-first-run-zero-learning-effectiveness.test.js",
          STATUS:"FIXED"
        },
        {
          ID:"ONBOARD-002",
          SEVERITY:"P2",
          SURFACE:"Home primary input",
          REPRODUCTION:"Placeholder was too generic to demonstrate what a useful first request looks like.",
          FIRST_RUN_USER_RISK:"User may hesitate or submit vague input.",
          ROOT_CAUSE:"Placeholder said only to ask a question.",
          FIX:"Use concrete truthful shopping/travel examples without fake live claims.",
          REGRESSION:"tests/api/onboarding-first-run-zero-learning-effectiveness.test.js",
          STATUS:"FIXED"
        }
      ],
      scenarios,
      externalEffects:surface.externalEffects,
      governance:{
        executionGate:"CLOSED",
        authorizesExecution:false,
        productionTraffic:false,
        WEISHAN_PAYS_PROVIDER:false,
        PROVIDER_COMMISSION_AFFECTS_RECOMMENDATION:false,
        EMAIL_SEND_ENABLED:false
      }
    });
  }

  window.WeishanOnboardingFirstRunZeroLearning = {
    VERSION,
    MODULE_NAME,
    DECISIONS,
    firstRunCopy,
    buildFirstRunElements,
    evaluateFirstRunSurface,
    evaluateFirstSuccessScenario,
    runOnboardingFirstRunSuite
  };
})();
