(function(){
  const MANUAL_UI_ACCEPTANCE_ASSISTANT_VERSION = "4.0.7";

  const manualSteps = [
    "打开 /Applications/weishan.app",
    "确认页面版本",
    "手动输入 7 月 15 日上海到成都最便宜的机票",
    "确认上海 / 成都 / 7 月 15 日 / 低价优先",
    "确认暂无真实价格结果",
    "展开本版新增面板",
    "确认正文不为空",
    "确认安全红线",
    "确认历史回看",
    "确认复合请求单屏最终结果",
    "保存截图证据"
  ];

  const screenshotPaths = [
    "/tmp/weishan-v2.4.1-ui-acceptance/01_app_launched.png",
    "/tmp/weishan-v2.4.1-ui-acceptance/02_settings_auth.png",
    "/tmp/weishan-v2.4.1-ui-acceptance/03_commerce_flight_result.png",
    "/tmp/weishan-v2.4.1-ui-acceptance/04_local_safety_evidence_console.png",
    "/tmp/weishan-v2.4.1-ui-acceptance/05_manual_ui_acceptance_assistant.png",
    "/tmp/weishan-v2.4.1-ui-acceptance/06_no_secret_persistence_guard.png",
    "/tmp/weishan-v2.4.1-ui-acceptance/07_settings_auth_local_security_evidence.png",
    "/tmp/weishan-v2.4.1-ui-acceptance/08_no_forbidden_controls.png",
    "/tmp/weishan-v2.4.1-ui-acceptance/09_history_reopen.png",
    "/tmp/weishan-v2.4.1-ui-acceptance/10_compound_request.png"
  ];

  const passFailRules = [
    "页面版本不匹配 -> FAIL",
    "机票解析出现 日上海 -> FAIL",
    "日期显示待补充 -> FAIL",
    "新增面板不存在 -> FAIL",
    "新增面板正文为空 -> FAIL",
    "settings auth 注册 / 登录 / 找回密码失败 -> FAIL",
    "commerce:provider-fixtures:offline failed -> FAIL",
    "no-secret persistence scan failed -> FAIL",
    "出现真实价格 -> FAIL",
    "出现虚构价格或非真实报价 -> FAIL",
    "出现 bookingUrl -> FAIL",
    "出现 API key 输入 -> FAIL",
    "出现 endpoint 测试连接 -> FAIL",
    "出现预订 / 付款 / 下单 -> FAIL",
    "自动输入不可靠且未手动确认 -> NEEDS_MANUAL_UI_CHECK",
    "全部核心项通过 -> PASS"
  ];

  const manualUiAcceptanceAssistantContract = {
    version:MANUAL_UI_ACCEPTANCE_ASSISTANT_VERSION,
    moduleName:"manual_ui_acceptance_assistant",
    status:"manual assist only",
    mode:"no automation guarantee",
    electronFocusNotice:"Electron Web content focus may require manual input",
    automatedPassFabrication:"forbidden",
    screenshotEvidence:"required",
    userConfirmation:"required",
    externalSearchClick:"forbidden",
    realNetwork:"disabled",
    redacted:true,
    capabilities:{
      canShowManualChecklist:true,
      canShowScreenshotPaths:true,
      canShowPassFailRules:true,
      canFabricatePass:false,
      canClickExternalSearch:false,
      canUseNetwork:false
    }
  };

  function clone(value){ return JSON.parse(JSON.stringify(value)); }

  function buildManualUiAcceptanceAssistant(){
    return {
      version:MANUAL_UI_ACCEPTANCE_ASSISTANT_VERSION,
      contract:clone(manualUiAcceptanceAssistantContract),
      manualSteps:manualSteps.slice(),
      screenshotPaths:screenshotPaths.slice(),
      passFailRules:passFailRules.slice(),
      audit:{
        manualUiAcceptanceAssistantAuditDraft:{
          eventType:"MANUAL_UI_ACCEPTANCE_ASSISTANT_DRAFT",
          schemaVersion:MANUAL_UI_ACCEPTANCE_ASSISTANT_VERSION,
          manualCheckState:"manual assist only",
          requiredScreenshotCount:screenshotPaths.length,
          completedScreenshotCount:0,
          userConfirmationState:"required",
          blockedReason:"automation_focus_not_guaranteed",
          redacted:true
        },
        redacted:true
      },
      display:{
        title:"manual UI acceptance assistant",
        establishedLine:"assistant 已建立",
        statusLine:"status: manual assist only",
        modeLine:"mode: no automation guarantee",
        focusLine:"Electron Web content focus may require manual input",
        fabricationLine:"automated PASS fabrication forbidden",
        screenshotLine:"screenshot evidence required",
        confirmationLine:"user confirmation required",
        externalSearchLine:"no external search click",
        networkLine:"no real network",
        redactedLine:"redacted: true"
      }
    };
  }

  function assertManualUiAcceptanceAssistantSafe(assistant){
    const target = assistant && typeof assistant === "object" ? assistant : buildManualUiAcceptanceAssistant();
    const contract = target.contract || manualUiAcceptanceAssistantContract;
    const caps = contract.capabilities || {};
    if (contract.status !== "manual assist only") throw new Error("manual assistant must stay manual assist only");
    if (contract.mode !== "no automation guarantee") throw new Error("manual assistant must not guarantee automation");
    ["canFabricatePass", "canClickExternalSearch", "canUseNetwork"].forEach(function(key){
      if (caps[key] !== false) throw new Error(key + " must stay false");
    });
    return true;
  }

  window.WeishanCommerceManualUiAcceptanceAssistant = {
    MANUAL_UI_ACCEPTANCE_ASSISTANT_VERSION,
    manualUiAcceptanceAssistantContract,
    manualSteps,
    screenshotPaths,
    passFailRules,
    buildManualUiAcceptanceAssistant,
    assertManualUiAcceptanceAssistantSafe
  };
})();
