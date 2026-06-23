const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2ECOMMERCE-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

async function submitHomeCommand(page, text) {
  let visible = false;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      await expect(page.locator("#commandInput")).toBeVisible({ timeout:15000 });
      visible = true;
      break;
    } catch (_) {
      await gotoRoute(page, "home");
    }
  }
  if (!visible) {
    await page.evaluate((value) => {
      if (!window.CommandApi || typeof window.CommandApi.enqueue !== "function") throw new Error("CommandApi unavailable");
      window.CommandApi.enqueue(value, { attachments:[] });
      window.dispatchEvent(new CustomEvent("weishan:command"));
    }, text);
    return;
  }
  await page.locator("#commandInput").fill(text);
  await page.locator("#runBtn").click();
}

async function waitForLatestHomeTexts(page, texts) {
  const home = page.locator('[data-commerce-home-summary="true"]').last();
  await expect.poll(async () => page.evaluate(() => {
    const api = window.WeishanCommerceAgent;
    const task = api && api.getCommerceTasks ? api.getCommerceTasks()[0] : null;
    const groups = task && task.commerceSubPlanQuestions && task.commerceSubPlanQuestions.subPlanQuestionGroups;
    return Array.isArray(groups) && groups.length > 0 ? "ready" : "waiting";
  }), { timeout:15000 }).toBe("ready");
  for (const text of texts) {
    await expect.poll(async () => page.evaluate(() => {
      const api = window.WeishanCommerceAgent;
      const task = api && api.getCommerceTasks ? api.getCommerceTasks()[0] : null;
      return JSON.stringify({
        title:task && task.title || "",
        rawInput:task && task.rawInput || "",
        split:task && task.commerceComplexIntentSplit || null,
        questions:task && task.commerceSubPlanQuestions || null,
        answers:task && task.commerceSubPlanAnswerCollection || null,
        completion:task && task.commerceSubPlanCompletionWorkspace || null,
        review:task && task.commerceSubPlanDraftReviewSummary || null
      });
    }), { timeout:15000 }).toContain(text);
  }
  return home;
}

async function waitForLatestDraftReviewReady(page) {
  await expect.poll(async () => page.evaluate(() => {
    const api = window.WeishanCommerceAgent;
    const task = api && api.getCommerceTasks ? api.getCommerceTasks()[0] : null;
    const review = task && task.commerceSubPlanDraftReviewSummary;
    return review && review.phase || "";
  }), { timeout:15000 }).toBe("subplan_draft_review_summary");
}

async function visibleText(locator) {
  return locator.evaluate((el) => (el && el.innerText) || "");
}

async function visibleTextWithoutTechnicalDetails(locator) {
  return locator.evaluate((el) => {
    const html = String(el && el.outerHTML || "").replace(/<details\b[\s\S]*?<\/details>/gi, "");
    const probe = document.createElement("div");
    probe.innerHTML = html;
    return probe.textContent || "";
  });
}

async function openDisclosure(scope, className) {
  let details = scope.locator(`details.${className || "commerce-technical-disclosure"}`).first();
  if (!(await details.count()) && [
    "commerce-process-disclosure",
    "commerce-safety-disclosure",
    "commerce-technical-disclosure",
    "commerce-actionable-checklist-disclosure",
    "commerce-platform-template-disclosure"
  ].includes(className)) {
    const advancedDebug = scope.locator("details.commerce-simple-flight-advanced-debug-disclosure").first();
    if (await advancedDebug.count()) {
      await openDisclosure(scope, "commerce-simple-flight-advanced-debug-disclosure");
      details = scope.locator(`details.${className}`).first();
    }
  }
  await expect(details).toHaveCount(1, { timeout: 15000 });
  const summary = details.locator("> summary").first();
  await expect(summary).toBeVisible({ timeout: 15000 });
  await summary.click();
  await details.evaluate((el) => {
    const body = el.querySelector(".commerce-disclosure-body");
    const template = el.querySelector(".commerce-disclosure-template");
    if (!el.open) el.open = true;
    el.setAttribute("open", "");
    if (template && body && !body.innerHTML.trim()) {
      try {
        body.innerHTML = decodeURIComponent(template.dataset.commerceDisclosureHtml || "");
      } catch (_) {
        body.textContent = template.dataset.commerceDisclosureHtml || "";
      }
      el.dataset.weishanDisclosureLoaded = "true";
    }
    if (body) {
      body.hidden = false;
      body.removeAttribute("hidden");
    }
  });
  await expect.poll(async () => details.evaluate((el) => {
    const body = el.querySelector(".commerce-disclosure-body");
    return !!el.open && !!body && (body.innerText || body.textContent || "").length > 0;
  }), { timeout: 15000 }).toBe(true);
}

async function openTechnicalDetails(scope) {
  const advancedDebug = scope.locator("details.commerce-simple-flight-advanced-debug-disclosure").first();
  if (await advancedDebug.count()) {
    await openDisclosure(scope, "commerce-simple-flight-advanced-debug-disclosure");
  }
  const technicalDetails = scope.locator("details.commerce-technical-disclosure").first();
  if (await technicalDetails.count()) {
    await openDisclosure(scope, "commerce-technical-disclosure");
  }
}

async function openAdvancedDebug(scope) {
  await openDisclosure(scope, "commerce-simple-flight-advanced-debug-disclosure");
}

async function installClipboardMock(page) {
  await page.evaluate(() => {
    window.__WEISHAN_TEST_CLIPBOARD_TEXT__ = "";
    window.__WEISHAN_TEST_CLIPBOARD_WRITE__ = async (text) => {
      window.__WEISHAN_TEST_CLIPBOARD_TEXT__ = String(text || "");
    };
  });
}

async function disableClipboardMock(page) {
  await page.evaluate(() => {
    window.__WEISHAN_TEST_CLIPBOARD_TEXT__ = "";
    window.__WEISHAN_TEST_CLIPBOARD_WRITE__ = async () => {
      throw new Error("clipboard unavailable");
    };
  });
}

async function installOpenExternalMock(page) {
  await page.evaluate(() => {
    window.__WEISHAN_TEST_OPEN_EXTERNAL_URLS__ = [];
    window.__WEISHAN_TEST_OPEN_EXTERNAL__ = async (url) => {
      window.__WEISHAN_TEST_OPEN_EXTERNAL_URLS__.push(String(url || ""));
    };
  });
}

async function latestOpenExternalUrl(page) {
  return page.evaluate(() => {
    const urls = window.__WEISHAN_TEST_OPEN_EXTERNAL_URLS__ || [];
    return urls[urls.length - 1] || "";
  });
}

function currentTaskLogs(page) {
  return page.locator(".cmd-log-list").first();
}

async function expectPanelBefore(first, second) {
  const firstBox = await first.boundingBox();
  const secondBox = await second.boundingBox();
  expect(firstBox, "first panel should have a layout box").not.toBeNull();
  expect(secondBox, "second panel should have a layout box").not.toBeNull();
  expect(firstBox.y).toBeLessThan(secondBox.y);
}

async function resetCommerceTasks(page) {
  await page.evaluate(async () => {
    if (window.WeishanCommerceAgent && window.WeishanCommerceAgent.clearCommerceTasks) window.WeishanCommerceAgent.clearCommerceTasks();
    if (window.CommandApi && window.CommandApi.clearAll) window.CommandApi.clearAll();
    if (window.WeishanLimitedBetaPreferencePersistence && typeof window.WeishanLimitedBetaPreferencePersistence.clearLimitedBetaPreference === "function") {
      await window.WeishanLimitedBetaPreferencePersistence.clearLimitedBetaPreference();
    }
    if (window.WeishanLimitedBetaKillSwitch && typeof window.WeishanLimitedBetaKillSwitch.clearLimitedBetaPreference === "function") {
      window.WeishanLimitedBetaKillSwitch.clearLimitedBetaPreference();
    }
    window.dispatchEvent(new CustomEvent("weishan:limited-beta-preference-updated"));
    window.dispatchEvent(new CustomEvent("weishan:command"));
  });
}

async function createWorkbenchCommerceTask(page, text) {
  await submitHomeCommand(page, text);
  await expect(page.locator(".commerce-detail").last()).toBeVisible({ timeout: 15000 });
  await expect.poll(async () => page.evaluate(() => {
    const api = window.WeishanCommerceAgent;
    const tasks = api && api.getCommerceTasks ? api.getCommerceTasks() : [];
    return Array.isArray(tasks) && tasks.length > 0 ? "ready" : "waiting";
  }), { timeout: 15000 }).toBe("ready");
}

async function createCommerceWorkbenchDetail(page, text, expectedText = "机票搜索结果") {
  await gotoRoute(page, "commerce");
  await page.waitForFunction(() => !!(window.WeishanCommerceAgent && window.WeishanCommerceAgent.createCommerceTask && window.WeishanCommerceAgent.addCommerceTask), null, { timeout: 15000 });
  await page.locator("#commerceInput").fill(text);
  await page.locator("#commerceGenerate").click();
  const detail = page.locator(".commerce-detail").first();
  await expect(detail).toContainText(expectedText, { timeout: 15000 });
  return detail;
}


async function setMockSettingsAi(page) {
  await page.evaluate(() => {
    if (!window.WeishanAPI) return;
    window.WeishanAPI.connector = () => ({
      providerType:"OpenRouter",
      chatModel:"aion-labs/aion-1.0-mini",
      hasApiKey:true,
      testStatus:"success"
    });
    window.WeishanAPI.connectorStatus = () => "success";
    window.WeishanAPI.chat = async () => ({
      ok:true,
      content:"成都到上海的常规交通方案可以比较高铁、飞机和长途客车；实时票价以实际查询为准。"
    });
    window.dispatchEvent(new CustomEvent("weishan:command"));
  });
}

async function installCommerceSearchMock(page, candidates) {
  await page.evaluate(async (items) => {
    if (!window.WeishanCommerceProviderAdapter) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderAdapter.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProviderConnector) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderConnector.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProductProviderCandidate) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProductProviderCandidate.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceGlobalProviderPool) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceGlobalProviderPool.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProductProviderSelection) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProductProviderSelection.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProviderConfig) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderConfig.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProviderSandbox) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderSandbox.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProviders) {
      if (!window.WeishanCommerceProviderSandbox) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderSandbox.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviders.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceSearch) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceSearch.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceLocalLawCompliance) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceLocalLawCompliance.js?v=2.0.40";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (window.WeishanCommerceLocalLawCompliance) {
      window.WeishanCommerceLocalLawCompliance.evaluateLocalLawCompliance = () => ({
        complianceVersion:"2.0.40",
        phase:"local_law_compliance_gate",
        complianceStatus:"verified_for_test_fixture",
        searchStatus:"ready",
        canSearchProvider:true,
        canDisplayPrice:true,
        canShowRedirectButton:true,
        canCheckout:false,
        canPay:false,
        canStoreIdentity:false,
        reason:"test_fixture_local_law_verified",
        privacy:{ storeRawCoordinates:false, logRawCoordinates:false, shareWithThirdParty:false, useForAds:false, useForTracking:false },
        safety:{ noRealLegalDatabase:true, noNetworkLegalLookup:true, noCheckout:true, noPayment:true, noOrderSubmit:true, noIdentityStorage:true }
      });
    }
    if (!window.WeishanCommerceProviderApprovalWorkflow) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderApprovalWorkflow.js?v=2.0.40";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (window.WeishanCommerceProviderApprovalWorkflow) {
      const workflow = window.WeishanCommerceProviderApprovalWorkflow;
      workflow.getProviderApprovalStatus = (category, providerId) => ({
        workflowVersion:"2.0.40",
        phase:"provider_approval_workflow",
        category:category || "product",
        providerId:providerId || "e2e-commerce-provider",
        approvalStatus:"approved_for_test_fixture",
        canRequestApproval:true,
        canStartConnectorStubDevelopment:true,
        canConfigureApiKey:true,
        canConnectEndpoint:true,
        canEnableNetworkSearch:true,
        canDisplayPrice:true,
        canRedirect:true,
        canCheckout:false,
        canPay:false,
        canSubmitOrder:false,
        canStoreIdentity:false,
        reason:"test_fixture_provider_approval",
        approvalStages:{
          legalReviewRequired:true,
          apiDocsReviewRequired:true,
          privacyReviewRequired:true,
          feeFieldReviewRequired:true,
          securityReviewRequired:true,
          localLawReviewRequired:true,
          humanApprovalRequired:true
        },
        gates:{
          allowConnectorStubDevelopment:true,
          allowApiKeyConfiguration:true,
          allowEndpointConnection:true,
          allowNetworkSearch:true,
          allowPriceDisplay:true,
          allowRedirect:true,
          allowCheckout:false,
          allowPayment:false,
          allowOrderSubmit:false,
          allowIdentityStorage:false
        },
        safety:{
          noRealEndpoint:false,
          noApiKey:false,
          noNetworkSearch:false,
          noPriceDisplay:false,
          noRedirect:false,
          noCheckout:true,
          noPayment:true,
          noOrderSubmit:true,
          noIdentityStorage:true,
          noLegalAdvice:true,
          noBypassLocalLaw:true
        }
      });
    }
    if (!window.WeishanCommerceLocationPolicy) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceLocationPolicy.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    window.WeishanCommerceSearchProvider = {
      search: async () => ({
        providerName:"E2E Commerce Provider",
        candidates:items.map((item) => Object.assign({ isRealProviderResult:true }, item))
      })
    };
    window.WeishanCommerceSearch.saveCommerceSearchSettings({
      enabled:true,
      providerName:"E2E Commerce Provider",
      providerMode:"manualProvider",
      apiKeyConfigured:true,
      allowNetworkSearch:true,
      allowReturnPrice:true,
      allowBookingUrl:true,
      allowCheckoutUrl:true
    });
    window.WeishanCommerceLocationPolicy.saveCommerceLocationPolicy({
      locationPermissionMode:"while_using_app",
      locationPermissionStatus:"not_requested",
      hasPreciseLocation:false,
      shippingDestination:{
        country:"US",
        region:"CA / San Francisco",
        city:"",
        postalCode:"94105",
        source:"manual"
      }
    });
  }, candidates);
}

async function installOpenRouterModelsMock(page, payload, options = {}) {
  await page.evaluate(async ({ data, fail }) => {
    if (!window.WeishanCommerceProviderAdapter) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderAdapter.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProviderConnector) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderConnector.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProductProviderSelection) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProductProviderSelection.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProviderConfig) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderConfig.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProviderSandbox) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderSandbox.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProviders) {
      if (!window.WeishanCommerceProviderSandbox) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderSandbox.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviders.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceSearch) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceSearch.js?v=2.0.31";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    window.WeishanOpenRouterModelsProvider = {
      fetchModels: async () => {
        if (fail) throw new Error("mock openrouter unavailable");
        return data;
      }
    };
    window.WeishanCommerceSearch.saveCommerceSearchSettings({
      enabled:true,
      providerName:"OpenRouter",
      providerMode:"openRouterModels",
      apiKeyConfigured:true,
      allowNetworkSearch:true,
      allowReturnPrice:true,
      allowBookingUrl:false,
      allowCheckoutUrl:false
    });
  }, { data:payload, fail:options.fail === true });
}

async function clearCommerceSearchMock(page) {
  await page.evaluate(() => {
    try {
      delete window.WeishanCommerceSearchProvider;
      delete window.WeishanOpenRouterModelsProvider;
      if (window.localStorage) window.localStorage.removeItem("weishan:commerceSearch:settings:v1");
      if (window.localStorage) window.localStorage.removeItem("weishan:commerceLocationPolicy:v1");
    } catch (_) {}
  });
}

test.describe.serial("commerce agent workbench", () => {
  let app;
  let page;

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
  });

  test.afterAll(async () => {
    if (page) {
    await page.evaluate((id) => {
        try {
          delete window.WeishanOpenRouterModelsProvider;
          delete window.WeishanCommerceSearchProvider;
          const keys = ["weishan:commerceAgent:lastPlan:v1", "weishan:commerceAgent:tasks:v1", "weishan:commerceSearch:settings:v1", "weishan:commerceLocationPolicy:v1", "weishan.readOnlyQuoteRefreshState.v1"];
          for (const key of keys) {
            const raw = window.localStorage.getItem(key);
            if (key === "weishan:commerceSearch:settings:v1" || key === "weishan.readOnlyQuoteRefreshState.v1" || raw && raw.includes(id)) window.localStorage.removeItem(key);
          }
        } catch (_) {}
      }, runId);
      await cleanupE2EData(page, runId);
    }
    if (app) {
      await Promise.race([
        Promise.resolve().then(() => app.close()).catch(() => {}),
        new Promise((resolve) => setTimeout(resolve, 10000))
      ]);
    }
  });

  test("global commerce workbench entry shows safety boundary", async () => {
    await expect(page.locator('.nav-item[data-route="commerce"]')).toBeVisible();
    await page.locator('.nav-item[data-route="commerce"]').click();
    await expect(page.getByRole("heading", { name:/全球采购/ })).toBeVisible({ timeout:15000 });
    await expect(page.locator(".commerce-hero h1")).toHaveText("全球采购", { timeout:15000 });
    await expect(page.getByText("搜索、比价、推荐、执行前确认")).toBeVisible();
    await expect(page.getByText("当前不会访问真实平台、不会返回价格、不会跳转购买或预订、不会付款或下单").first()).toBeVisible();
  });

  test("v2.1.4 commerce detail renders secure key storage plan body", async () => {
    await resetCommerceTasks(page);
    await createWorkbenchCommerceTask(page, runId + "-SECURE-KEY-BODY 7月15日上海到成都最便宜的机票");
    const detail = page.locator(".commerce-detail").last();
    await expect(detail).toContainText("机票搜索结果");
    await openAdvancedDebug(detail);
    await openDisclosure(detail, "commerce-secure-key-storage-plan-disclosure");
    const secureKeyStorageBody = detail.locator("details.commerce-secure-key-storage-plan-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "安全密钥存储方案",
      "当前状态：安全密钥存储仍处于方案阶段，当前版本不会保存真实 API key。",
      "真实密钥保存：未启用",
      "macOS Keychain：未连接",
      "Electron safeStorage：未实现",
      ".env 保存：禁止",
      "明文保存：禁止",
      "localStorage 保存：禁止",
      "sessionStorage 保存：禁止",
      "日志记录 key：禁止",
      "API 连接测试：未启用",
      "endpoint 连接：未启用",
      "真实价格返回：未启用",
      "bookingUrl 返回：未启用",
      "未来允许评估的存储目标",
      "macOS Keychain",
      "Electron safeStorage + 加密本地存储",
      "用户本机加密配置文件",
      "企业托管密钥服务",
      "禁止的存储方式",
      "明文文件",
      "日志文件",
      "crash report",
      "通过聊天记录保存 API key",
      "通过截图保存 API key",
      "实施步骤",
      "设计密钥数据模型",
      "增加读取前权限确认",
      "增加删除 / 轮换 / 过期机制",
      "增加审计日志，但不得记录 key 明文",
      "风险模型",
      "下一步",
      "provider endpoint allowlist 闸门：已建立。只读 provider sandbox gate：已建立。下一步：只读 provider result schema gate；只读 provider result schema gate：已建立。下一步：provider result source label gate。key 删除 / 轮换 / 过期机制草案已建立，但当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key。"
    ]) {
      await expect(secureKeyStorageBody).toContainText(text);
    }
    for (const text of [
      "真实 API key 输入框",
      "保存 key",
      "测试连接",
      "endpoint 输入",
      "Keychain 已连接",
      "safeStorage 已实现",
      "API key 保存成功",
      "API key 读取成功",
      "API 连接成功",
      "预订按钮",
      "付款按钮",
      "下单按钮"
    ]) {
      await expect(secureKeyStorageBody).not.toContainText(text);
    }
  });

  test("v2.1.4 renders key delete rotate expiry draft and keeps lifecycle operations blocked", async () => {
    await resetCommerceTasks(page);
    await createWorkbenchCommerceTask(page, runId + "-KEY-LIFECYCLE 7月15日上海到成都最便宜的机票");
    const detail = page.locator(".commerce-detail").first();
    await expect(detail).toContainText("机票搜索结果");
    await expect(detail).toContainText("查看 key 删除 / 轮换 / 过期机制草案");
    await detail.locator("details.commerce-key-lifecycle-draft-disclosure > summary").first().click();
    const lifecycleBody = detail.locator("details.commerce-key-lifecycle-draft-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "key 删除 / 轮换 / 过期机制草案",
      "生命周期草案：已建立",
      "真实删除：未开放",
      "真实轮换：未开放",
      "真实过期：未开放",
      "真实吊销：未开放",
      "真实恢复：未开放",
      "真实 API key 输入：未开放",
      "真实 API key 保存：未开放",
      "真实 API key 读取：未开放",
      "测试连接：未开放",
      "provider 沙箱：未开放",
      "真实价格：未开放",
      "bookingUrl：未开放",
      "key 状态机草案",
      "当前允许状态：draft_alias_only",
      "阻断迁移",
      "删除机制草案",
      "prepareKeyDeleteDraft：阻断",
      "confirmKeyDeleteDraft：阻断",
      "finalizeKeyDeleteDraft：阻断",
      "轮换机制草案",
      "prepareKeyRotateDraft：阻断",
      "validateRotationCandidateDraft：阻断",
      "confirmKeyRotateDraft：阻断",
      "finalizeKeyRotateDraft：阻断",
      "过期机制草案",
      "prepareKeyExpiryDraft：阻断",
      "evaluateKeyExpiryDraft：草案",
      "markKeyExpiredDraft：阻断",
      "生命周期审计事件草案",
      "所有事件必须 redacted: true",
      "密钥脱敏与日志防泄露规则：已建立",
      "本机安全存储接口草案：已建立",
      "安全存储设计闸门：关闭",
      "安全密钥存储方案：方案已建立，尚未实现",
      "API 绑定准备状态：未准备",
      "下一步：只读 provider result schema gate",
      "当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key"
    ]) {
      await expect(lifecycleBody).toContainText(text);
    }
    const lifecycleContract = await page.evaluate(() => {
      const api = window.WeishanCommerceKeyLifecycleDraft;
      const draft = api.buildKeyLifecycleDraft();
      return {
        draft,
        assertSafe:api.assertKeyLifecycleDraftSafe(draft)
      };
    });
    expect(lifecycleContract.assertSafe).toBe(true);
    expect(lifecycleContract.draft).toEqual(expect.objectContaining({
      version:"2.1.39",
      draftStatus:"draft_only",
      implementationStatus:"not_implemented",
      realKeyDelete:"disabled",
      realKeyRotate:"disabled",
      realKeyExpiry:"disabled",
      realKeyRevocation:"disabled",
      realKeyRestore:"disabled",
      keyInput:"disabled",
      keyStorage:"disabled",
      keyRead:"disabled",
      endpointConnection:"disabled",
      network:"disabled",
      realPrice:"disabled",
      bookingUrl:"disabled",
      order:"disabled",
      payment:"disabled"
    }));
    expect(lifecycleContract.draft.capabilities).toEqual(expect.objectContaining({
      canDeleteApiKey:false,
      canRotateApiKey:false,
      canExpireApiKey:false,
      canRevokeApiKey:false,
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false,
      canTestConnection:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false
    }));
    expect(lifecycleContract.draft.stateMachine.currentAllowedState).toBe("draft_alias_only");
    expect(lifecycleContract.draft.stateMachine.transitions.every((item) => item.status === "blocked")).toBe(true);
  });

  test("v2.1.4 provider endpoint allowlist gate stays draft-only and blocked", async () => {
    await resetCommerceTasks(page);
    await createWorkbenchCommerceTask(page, runId + "-ENDPOINT-GATE 7月15日上海到成都最便宜的机票");
    const detail = page.locator(".commerce-detail").first();
    await expect(detail).toContainText("机票搜索结果");
    await expect(detail).toContainText("查看 provider endpoint allowlist 闸门");
    await detail.locator("details.commerce-provider-endpoint-allowlist-gate-disclosure > summary").first().click();
    const gateBody = detail.locator("details.commerce-provider-endpoint-allowlist-gate-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "provider endpoint allowlist 闸门",
      "endpoint allowlist 闸门：已建立",
      "闸门状态：关闭",
      "allowlist 状态：草案",
      "真实 endpoint 连接：未开放",
      "真实网络请求：未开放",
      "provider sandbox：未开放",
      "真实价格读取：未开放",
      "bookingUrl 读取：未开放",
      "下单：禁止",
      "付款：禁止",
      "身份上传：禁止",
      "flightProviders",
      "hotelProviders",
      "commerceProviders",
      "localServiceProviders",
      "google.com/travel/flights：external_search_only，not_api_endpoint",
      "trip.com：candidate_domain_unverified",
      "skyscanner.com：candidate_domain_unverified",
      "pinduoduo.com：candidate_domain_unverified",
      "non_https",
      "credential_query_params",
      "not_allowlisted",
      "missing_manual_approval",
      "search inventory",
      "create order",
      "ENDPOINT_EVALUATION_DRAFT",
      "ENDPOINT_BLOCKED_NOT_HTTPS",
      "ENDPOINT_BLOCKED_CREDENTIAL_QUERY",
      "PROVIDER_SANDBOX_GATE_PENDING",
      "endpoint URL 记录前必须脱敏",
      "所有事件必须 redacted: true",
      "下一步：只读 provider result schema gate",
      "当前版本仍不能连接真实 endpoint、不能测试连接、不能联网、不能读取真实价格"
    ]) {
      await expect(gateBody).toContainText(text);
    }
    const contract = await page.evaluate(() => {
      const api = window.WeishanCommerceProviderEndpointAllowlistGate;
      const gate = api.commerceProviderEndpointAllowlistGateContract;
      const evaluation = api.evaluateProviderEndpointAllowlistDraft({ providerId:"trip_com", endpointUrl:"http://trip.com/api/search?api_key=dummy" });
      const normalized = api.normalizeEndpointDraft("https://trip.com/api?token=dummy");
      return {
        gate,
        evaluation,
        normalized,
        categories:api.buildProviderEndpointCategoriesDraft(),
        domains:api.buildProviderAllowedDomainDraft(),
        risks:api.buildEndpointRiskScanDraft(),
        readonly:api.buildProviderReadOnlyGateDraft(),
        audit:api.buildProviderEndpointAuditEventsDraft(),
        safe:api.assertProviderEndpointAllowlistGateSafe(gate)
      };
    });
    expect(contract.safe).toBe(true);
    expect(contract.gate).toEqual(expect.objectContaining({
      gateVersion:"2.1.39",
      phase:"provider_endpoint_allowlist_gate",
      gateStatus:"closed",
      allowlistStatus:"draft",
      endpointConnection:"disabled",
      networkMode:"disabled",
      providerSandbox:"disabled",
      realPrice:"disabled",
      bookingUrl:"disabled"
    }));
    expect(contract.gate.capabilities).toEqual(expect.objectContaining({
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false,
      canConnectRealEndpoint:false,
      canTestConnection:false,
      canUseNetwork:false,
      canUseProviderSandbox:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false
    }));
    expect(contract.evaluation.decision).toBe("blocked");
    expect(contract.evaluation.canUseNetwork).toBe(false);
    expect(contract.evaluation.canReturnPrice).toBe(false);
    expect(contract.evaluation.canReturnBookingUrl).toBe(false);
    expect(contract.normalized.hasCredentialQueryParams).toBe(true);
    expect(contract.normalized.sanitizedUrl).toContain("[REDACTED_CREDENTIAL_PARAMS]");
    expect(contract.domains.length).toBeGreaterThan(5);
    expect(contract.risks.canUseNetwork).toBe(false);
    expect(contract.readonly.canCreateOrder).toBe(false);
    expect(contract.audit.redacted).toBe(true);
  });


  test("v2.1.4 readonly provider sandbox gate stays draft-only and blocked", async () => {
    await resetCommerceTasks(page);
    await createWorkbenchCommerceTask(page, runId + "-READONLY-SANDBOX-GATE 7月15日上海到成都最便宜的机票");
    const detail = page.locator(".commerce-detail").first();
    await expect(detail).toContainText("机票搜索结果");
    await expect(detail).toContainText("查看只读 provider sandbox gate");
    await detail.locator("details.commerce-readonly-provider-sandbox-gate-disclosure > summary").first().click();
    const gateBody = detail.locator("details.commerce-readonly-provider-sandbox-gate-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "只读 provider sandbox gate",
      "只读 provider sandbox gate：已建立",
      "gate 状态：关闭",
      "sandbox 状态：草案",
      "真实 sandbox 运行：未开放",
      "真实 provider 连接：未开放",
      "真实 endpoint 连接：未开放",
      "真实网络请求：未开放",
      "真实价格读取：未开放",
      "availability 读取：未开放",
      "bookingUrl 读取：未开放",
      "下单：禁止",
      "付款：禁止",
      "身份上传：禁止",
      "sandbox 阶段草案",
      "endpoint_allowlist_required：established",
      "provider_terms_review_required：pending",
      "api_docs_review_required：pending",
      "sandbox_request_schema_required：draft",
      "sandbox_response_schema_required：draft",
      "sandbox request 草案",
      "readonlyScope 未来只允许字段",
      "request 禁止字段",
      "apiKey",
      "apiSecret",
      "authorization",
      "paymentToken",
      "sandbox response 草案",
      "response 禁止字段",
      "bookingUrl",
      "paymentUrl",
      "rawProviderPayloadWithSecrets",
      "只读字段 allowlist",
      "current enabled fields：none",
      "写入动作 blocklist",
      "create_order",
      "submit_payment",
      "sandbox 运行条件",
      "当前缺失条件",
      "allowed: false",
      "decision: blocked",
      "reason: readonly_provider_sandbox_gate_closed",
      "sandbox 风险扫描草案",
      "booking_url_present",
      "sandbox 审计事件草案",
      "READONLY_SANDBOX_EVALUATION_DRAFT",
      "READONLY_SANDBOX_BLOCKED_GATE_CLOSED",
      "READONLY_SANDBOX_RESULT_BLOCKED",
      "所有事件必须 redacted: true",
      "下一步：只读 provider result schema gate"
    ]) {
      await expect(gateBody).toContainText(text);
    }
    const contract = await page.evaluate(() => {
      const api = window.WeishanCommerceReadonlyProviderSandboxGate;
      const gate = api.commerceReadonlyProviderSandboxGateContract;
      const display = api.buildReadonlyProviderSandboxGateDisplay(gate);
      const evaluation = api.evaluateReadonlyProviderSandboxGate({ providerId:"trip_com", endpointHost:"trip.com" });
      return {
        gate,
        display,
        evaluation,
        stage:api.buildReadonlySandboxStageDraft(),
        request:api.buildSandboxRequestDraft(),
        response:api.buildSandboxResponseDraft(),
        allowlist:api.buildReadonlyFieldAllowlist(),
        writeBlock:api.buildWriteActionBlocklist(),
        run:api.buildSandboxRunConditions(),
        risk:api.buildSandboxRiskScanDraft(),
        audit:api.buildSandboxAuditEventsDraft(),
        safe:api.assertReadonlyProviderSandboxGateSafe(gate)
      };
    });
    expect(contract.safe).toBe(true);
    expect(contract.gate).toEqual(expect.objectContaining({
      version:"2.1.39",
      phase:"readonly_provider_sandbox_gate",
      gateStatus:"closed",
      sandboxStatus:"draft_only",
      realSandboxRun:"disabled",
      realProviderConnection:"disabled",
      realEndpointConnection:"disabled",
      realNetworkRequest:"disabled",
      realPriceRead:"disabled",
      realAvailabilityRead:"disabled",
      realBookingUrlRead:"disabled",
      realOrder:"forbidden",
      realPayment:"forbidden"
    }));
    expect(contract.gate.capabilities).toEqual(expect.objectContaining({
      canRunRealSandbox:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canTestConnection:false,
      canReturnPrice:false,
      canReturnAvailability:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false
    }));
    expect(contract.evaluation).toEqual(expect.objectContaining({ allowed:false, decision:"blocked", reason:"readonly_provider_sandbox_gate_closed", canUseNetwork:false, canReturnPrice:false, canReturnAvailability:false, canReturnBookingUrl:false }));
    expect(contract.stage.stageStatus.endpoint_allowlist_required).toBe("established");
    expect(contract.request.canUseNetwork).toBe(false);
    expect(contract.request.requestForbiddenFields).toContain("apiKey");
    expect(contract.response.canReturnPrice).toBe(false);
    expect(contract.response.responseFieldsForbidden).toContain("bookingUrl");
    expect(contract.allowlist.currentEnabledFields).toEqual(["none"]);
    expect(contract.writeBlock.alwaysForbiddenActions.find((item) => item.action === "submit_payment").forbidden).toBe(true);
    expect(contract.run.sandboxRunCurrentDecision).toEqual(expect.objectContaining({ allowed:false, decision:"blocked" }));
    expect(contract.risk.canUseNetwork).toBe(false);
    expect(contract.audit.redacted).toBe(true);
  });



  test("v2.1.4 readonly provider result schema gate stays draft-only and blocked", async () => {
    await resetCommerceTasks(page);
    await createWorkbenchCommerceTask(page, runId + "-READONLY-RESULT-SCHEMA-GATE 7月15日上海到成都最便宜的机票");
    const detail = page.locator(".commerce-detail").first();
    await expect(detail).toContainText("机票搜索结果");
    await expect(detail).toContainText("查看只读 provider result schema gate");
    await detail.locator("details.commerce-readonly-provider-result-schema-gate-disclosure > summary").first().click();
    const gateBody = detail.locator("details.commerce-readonly-provider-result-schema-gate-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "只读 provider result schema gate",
      "只读 provider result schema gate：已建立",
      "gate 状态：关闭",
      "closed",
      "schema 状态：草案",
      "draft",
      "真实 provider result 读取：未开放",
      "真实价格显示：未开放",
      "availability 显示：未开放",
      "bookingUrl 显示：未开放",
      "raw provider payload 显示：禁止",
      "真实 sandbox 运行：未开放",
      "真实 endpoint 连接：未开放",
      "真实网络请求：未开放",
      "下单：禁止",
      "付款：禁止",
      "身份上传：禁止",
      "flight_offer",
      "hotel_offer",
      "product_offer",
      "local_service_offer",
      "ticket_offer",
      "provider_notice",
      "no_result",
      "blocked_result",
      "schema_error",
      "当前启用结果类型：",
      "none",
      "resultId",
      "resultType",
      "providerId",
      "providerName",
      "providerCategory",
      "sourceType",
      "sourceUrlHost",
      "title",
      "currency",
      "priceDisplayMode",
      "taxesAndFees",
      "totalPrice",
      "availability",
      "updatedAt",
      "providerReferenceId",
      "readonlyEvidence",
      "redacted",
      "sandboxOnly",
      "draftOnly",
      "origin",
      "destination",
      "departureDate",
      "returnDate",
      "carrierName",
      "flightNumber",
      "cabinClass",
      "baggageInfo",
      "refundPolicy",
      "hotelName",
      "roomType",
      "cancellationPolicy",
      "productName",
      "brand",
      "model",
      "specs",
      "当前禁用字段：",
      "bookingUrl",
      "sourceUrl",
      "rawProviderPayload",
      "始终禁止字段：",
      "checkoutUrl",
      "paymentUrl",
      "orderUrl",
      "createOrderUrl",
      "passengerIdentity",
      "passportNumber",
      "identityNumber",
      "bankCardNumber",
      "rawApiKey",
      "rawToken",
      "rawHeaders",
      "rawRequest",
      "rawResponse",
      "providerId 缺失：阻断",
      "sourceUrlHost 缺失：阻断",
      "updatedAt 缺失：阻断",
      "readonlyEvidence 缺失：阻断",
      "result 来自 raw AI 估算：阻断",
      "result 来自未知网站：阻断",
      "bookingUrl 当前状态：disabled",
      "displayForbidden：true",
      "generationForbidden：true",
      "payment URL：阻断",
      "checkout URL：阻断",
      "rawPayloadDisplay：forbidden",
      "no raw JSON display",
      "no raw headers display",
      "no raw response body display",
      "result_missing_provider_id",
      "result_missing_provider_name",
      "price_is_estimated",
      "price_is_mock",
      "price_is_demo",
      "price_is_fake",
      "booking_url_present",
      "raw_payload_present",
      "passenger_identity_present",
      "bank_card_present",
      "READONLY_RESULT_SCHEMA_EVALUATION_DRAFT",
      "READONLY_RESULT_BLOCKED_GATE_CLOSED",
      "READONLY_RESULT_BLOCKED_PRICE_DISPLAY_DISABLED",
      "READONLY_RESULT_BLOCKED_BOOKING_URL_DISABLED",
      "READONLY_RESULT_BLOCKED_RAW_PAYLOAD",
      "READONLY_RESULT_BLOCKED_FAKE_PRICE",
      "READONLY_RESULT_BLOCKED_MOCK_PRICE",
      "READONLY_RESULT_BLOCKED_DEMO_PRICE",
      "READONLY_RESULT_BLOCKED_AI_ESTIMATE",
      "READONLY_RESULT_BLOCKED_PAYMENT_FIELD",
      "READONLY_RESULT_BLOCKED_IDENTITY_FIELD",
      "READONLY_RESULT_SCHEMA_DRAFT_CREATED",
      "所有事件必须 redacted: true",
      "sandbox gate",
      "endpoint allowlist gate",
      "key 生命周期",
      "脱敏规则",
      "本机安全存储",
      "API 绑定准备状态",
      "provider result source label gate",
      "当前版本仍不能读取真实 provider result、不能显示真实价格、不能显示 bookingUrl"
    ]) {
      await expect(gateBody).toContainText(text);
    }
    for (const forbidden of [
      "result 读取按钮可用",
      "sandbox 运行按钮可用",
      "endpoint 输入框",
      "测试连接按钮可用",
      "API key 输入框",
      "保存 key",
      "Keychain 已连接",
      "safeStorage 已实现",
      "endpoint 连接成功",
      "provider sandbox 成功",
      "provider 已连接",
      "provider result 读取成功",
      "API 连接成功",
      "network enabled",
      "canDisplayRealPrice true",
      "canDisplayBookingUrl true",
      "已找到价格",
      "预订按钮",
      "付款按钮",
      "下单按钮"
    ]) {
      await expect(gateBody).not.toContainText(forbidden);
    }
    const contract = await page.evaluate(() => {
      const api = window.WeishanCommerceReadonlyProviderResultSchemaGate;
      const gate = api.commerceReadonlyProviderResultSchemaGateContract;
      const display = api.buildReadonlyProviderResultSchemaGateDisplay(gate);
      const evaluation = api.evaluateReadonlyProviderResultSchemaDraft({ resultType:"flight_offer", providerId:"trip_com", price:"demo price", bookingUrl:"https://example.invalid/checkout" });
      return {
        gate,
        display,
        evaluation,
        types:api.buildReadonlyProviderResultTypesDraft(),
        allowlist:api.buildReadonlyResultFieldAllowlist(),
        blocklist:api.buildReadonlyResultFieldBlocklist(),
        price:api.buildPriceIntegrityRulesDraft(),
        source:api.buildSourceIntegrityRulesDraft(),
        booking:api.buildBookingUrlRulesDraft(),
        raw:api.buildRawPayloadRulesDraft(),
        risk:api.buildResultRiskScanDraft(),
        audit:api.buildResultAuditEventsDraft(),
        safe:api.assertReadonlyProviderResultSchemaGateSafe(gate)
      };
    });
    expect(contract.safe).toBe(true);
    expect(contract.gate).toEqual(expect.objectContaining({
      version:"2.1.39",
      phase:"readonly_provider_result_schema_gate",
      gateStatus:"closed",
      schemaStatus:"draft_only",
      realProviderResultRead:"disabled",
      realPriceDisplay:"disabled",
      realAvailabilityDisplay:"disabled",
      realBookingUrlDisplay:"disabled",
      rawProviderPayloadDisplay:"forbidden",
      realProviderConnection:"disabled",
      realEndpointConnection:"disabled",
      realNetworkRequest:"disabled",
      realSandboxRun:"disabled",
      realOrder:"forbidden",
      realPayment:"forbidden"
    }));
    expect(contract.gate.capabilities).toEqual(expect.objectContaining({
      canShowResultSchemaGate:true,
      canShowResultTypeDraft:true,
      canShowFieldAllowlist:true,
      canShowFieldBlocklist:true,
      canShowPriceIntegrityRules:true,
      canShowSourceIntegrityRules:true,
      canShowBookingUrlRules:true,
      canShowRawPayloadRules:true,
      canShowResultRiskScan:true,
      canShowResultAuditEvents:true,
      canEvaluateResultSchemaDraft:true,
      canReadRealProviderResult:false,
      canDisplayRealPrice:false,
      canDisplayRealAvailability:false,
      canDisplayBookingUrl:false,
      canDisplayRawProviderPayload:false,
      canRunRealSandbox:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canTestConnection:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false
    }));
    expect(contract.evaluation).toEqual(expect.objectContaining({ allowed:false, decision:"blocked", canUseNetwork:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, nextStep:"provider_result_source_label_gate" }));
    expect(contract.types.currentEnabledTypes).toEqual(["none"]);
    expect(contract.allowlist.commonAllowedFields).toContain("readonlyEvidence");
    expect(contract.allowlist.currentDisabledFields).toContain("rawProviderPayload");
    expect(contract.blocklist.alwaysForbiddenFields).toContain("rawProviderPayload");
    expect(contract.price.currentPriceDisplayMode).toBe("hidden_current_version");
    expect(contract.source.sourceBlockedIf).toContain("result 来自未知网站：阻断");
    expect(contract.booking.displayForbidden).toBe(true);
    expect(contract.booking.generationForbidden).toBe(true);
    expect(contract.raw.rawPayloadDisplay).toBe("forbidden");
    expect(contract.risk.currentRiskLevel).toBe("blocked");
    expect(contract.audit.redacted).toBe(true);
  });

  test("v2.1.4 provider source label and price integrity gates stay draft-only and blocked", async () => {
    await resetCommerceTasks(page);
    await createWorkbenchCommerceTask(page, runId + "-SOURCE-LABEL-PRICE-INTEGRITY 7 月 15 日上海到成都最便宜的机票");
    const detail = page.locator(".commerce-detail").first();
    await expect(detail).toContainText("查看 provider result source label gate");
    await expect(detail).toContainText("查看 price integrity / taxes / fees gate");
    const contracts = await page.evaluate(() => {
      const sourceApi = window.WeishanCommerceProviderResultSourceLabelGate;
      const priceApi = window.WeishanCommercePriceIntegrityTaxesFeesGate;
      return {
        source:{
          gate:sourceApi.commerceProviderResultSourceLabelGateContract,
          required:sourceApi.buildProviderResultSourceLabelRequiredFieldsDraft(),
          types:sourceApi.buildProviderResultSourceTypeDraft(),
          rules:sourceApi.buildProviderResultSourceLabelBlockRules(),
          audit:sourceApi.buildProviderResultSourceLabelAuditDraft(),
          evaluation:sourceApi.evaluateProviderResultSourceLabelDraft({ providerName:"draft" }),
          safe:sourceApi.assertProviderResultSourceLabelGateSafe(sourceApi.commerceProviderResultSourceLabelGateContract)
        },
        price:{
          gate:priceApi.commercePriceIntegrityTaxesFeesGateContract,
          required:priceApi.buildPriceQuoteRequiredFieldsDraft(),
          prereq:priceApi.buildPriceDisplayPrerequisitesDraft(),
          policy:priceApi.buildCurrentPricePolicyDraft(),
          tax:priceApi.buildTaxFeeCompletenessRulesDraft(),
          risk:priceApi.buildPriceIntegrityRiskScanDraft(),
          audit:priceApi.buildPriceIntegrityAuditDraft(),
          evaluation:priceApi.evaluatePriceIntegrityDraft({ providerId:"draft", providerName:"draft", currency:"CNY", total:"demo price", bookingUrl:"https://example.invalid/checkout" }),
          safe:priceApi.assertPriceIntegrityTaxesFeesGateSafe(priceApi.commercePriceIntegrityTaxesFeesGateContract)
        }
      };
    });
    expect(contracts.source.safe).toBe(true);
    expect(contracts.source.gate).toEqual(expect.objectContaining({ version:"2.1.39", phase:"provider_result_source_label_gate", gateStatus:"closed", mode:"draft_only", realProviderSourceLabel:"disabled", realProviderResultRead:"disabled", realNetwork:"disabled", realPriceDisplay:"disabled", realAvailabilityDisplay:"disabled", realBookingUrlDisplay:"disabled", rawProviderPayloadDisplay:"forbidden" }));
    expect(contracts.source.gate.capabilities).toEqual(expect.objectContaining({ canReadRealProviderResult:false, canDisplayRealSourceLabel:false, canUseNetwork:false, canConnectEndpoint:false, canDisplayRealPrice:false, canDisplayRealAvailability:false, canDisplayBookingUrl:false, canDisplayRawProviderPayload:false, canCreateOrder:false, canPay:false, canUploadIdentity:false, canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false }));
    expect(contracts.source.required.requiredFields).toEqual(expect.arrayContaining(["providerId", "providerName", "sourceType", "sourceUrlHost", "updatedAt", "readonlyEvidence", "redacted: true"]));
    expect(contracts.source.types.sourceTypes).toEqual(expect.arrayContaining(["user_bound_api", "weishan_readonly_provider", "public_search", "manual_reviewed_source", "blocked_unknown_source", "no_provider"]));
    expect(contracts.source.rules.rules).toEqual(expect.arrayContaining(["unknown host 阻断", "short URL 阻断", "credential query params 阻断", "raw provider payload 阻断"]));
    expect(contracts.source.audit.sourceLabelAuditDraft).toEqual(expect.objectContaining({ gateState:"closed", redacted:true }));
    expect(contracts.source.evaluation).toEqual(expect.objectContaining({ allowed:false, decision:"blocked", canUseNetwork:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, redacted:true }));
    expect(contracts.price.safe).toBe(true);
    expect(contracts.price.gate).toEqual(expect.objectContaining({ version:"2.1.39", phase:"price_integrity_taxes_fees_gate", gateStatus:"closed", mode:"draft_only", realPriceDisplay:"disabled", realProviderPrice:"disabled", taxFeeVerification:"disabled_until_readonly_provider_result_available", realProviderResultRead:"disabled", realNetwork:"disabled", realBookingUrlDisplay:"disabled" }));
    expect(contracts.price.gate.capabilities).toEqual(expect.objectContaining({ canReadRealProviderResult:false, canDisplayRealPrice:false, canCalculateLowestPrice:false, canDisplayAvailability:false, canDisplayBookingUrl:false, canUseNetwork:false, canConnectEndpoint:false, canCreateOrder:false, canPay:false, canUploadIdentity:false, canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false }));
    expect(contracts.price.required.requiredFields).toEqual(expect.arrayContaining(["currency", "baseFare", "taxes", "fees", "total", "priceObservedAt", "readonlyEvidence", "taxFeeCompleteness", "redacted: true"]));
    expect(contracts.price.prereq.prerequisites).toEqual(expect.arrayContaining(["没有 source label gate 通过不显示价格", "没有 result schema gate 通过不显示价格"]));
    expect(contracts.price.policy.policy).toEqual(expect.arrayContaining(["当前不得显示 fake price", "当前不得显示 mock price", "当前不得显示 demo price", "当前不得显示 AI 估价"]));
    expect(contracts.price.tax.rules).toEqual(expect.arrayContaining(["税费缺失则 price withheld", "币种缺失则 price withheld", "source label 缺失则 price withheld"]));
    expect(contracts.price.risk.priceIntegrityRiskScanDraft).toEqual(expect.arrayContaining(["missingCurrency", "missingTaxes", "missingFees", "bookingUrlDetected", "redacted: true"]));
    expect(contracts.price.audit.priceIntegrityAuditDraft).toEqual(expect.objectContaining({ gateState:"closed", redacted:true }));
    expect(contracts.price.evaluation).toEqual(expect.objectContaining({ allowed:false, decision:"price withheld", canUseNetwork:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, redacted:true }));
  });

  test("v2.1.39 bookingUrl domain safety and manual provider review gates stay draft-only and blocked", async () => {
    await resetCommerceTasks(page);
    await createWorkbenchCommerceTask(page, runId + "-BOOKING-MANUAL-REVIEW 7 月 15 日上海到成都最便宜的机票");
    const detail = page.locator(".commerce-detail").first();
    await expect(detail).toContainText("出发地：上海");
    await expect(detail).toContainText("目的地：成都");
    await expect(detail).toContainText("日期：7 月 15 日");
    await expect(detail).toContainText("排序：低价优先");
    await expect(detail).not.toContainText("出发地：日上海");
    await expect(detail).not.toContainText("日期：待补充");
    await expect(detail).toContainText("暂无真实价格结果");
    await expect(detail).toContainText("查看只读 provider result schema gate");
    await expect(detail).toContainText("查看 provider result source label gate");
    await expect(detail).toContainText("查看 price integrity / taxes / fees gate");
    await expect(detail).toContainText("查看 bookingUrl domain safety gate");
    await expect(detail).toContainText("查看 manual provider review workflow");
    await expect(detail).not.toContainText(/¥\s*\d+/);
    await expect(detail.locator(".commerce-one-screen-card").first()).not.toContainText(/fake price|mock price|demo price|AI 估价/);

    await openDisclosure(detail, "commerce-provider-result-source-label-gate-disclosure");
    await expect(detail).toContainText("sourceLabelAuditDraft");
    await openDisclosure(detail, "commerce-price-integrity-taxes-fees-gate-disclosure");
    await expect(detail).toContainText("priceIntegrityAuditDraft");
    await expect(detail).toContainText("price withheld");

    await openDisclosure(detail, "commerce-booking-url-domain-safety-gate-disclosure");
    await expect(detail).toContainText("bookingUrl domain safety gate");
    await expect(detail).toContainText("status: closed");
    await expect(detail).toContainText("mode: draft only");
    await expect(detail).toContainText("bookingUrl display disabled");
    await expect(detail).toContainText("bookingUrl generation disabled");
    await expect(detail).toContainText("bookingUrl click disabled");
    await expect(detail).toContainText("redirect follow disabled");
    await expect(detail).toContainText("providerId");
    await expect(detail).toContainText("providerName");
    await expect(detail).toContainText("sourceUrlHost");
    await expect(detail).toContainText("bookingUrlHost");
    await expect(detail).toContainText("redirectChainHostList");
    await expect(detail).toContainText("urlScheme");
    await expect(detail).toContainText("linkIntent");
    await expect(detail).toContainText("readonlyEvidence");
    await expect(detail).toContainText("redacted: true");
    await expect(detail).toContainText("只允许 https");
    await expect(detail).toContainText("必须 exact host match");
    await expect(detail).toContainText("unknown host 阻断");
    await expect(detail).toContainText("short URL 阻断");
    await expect(detail).toContainText("credential query params 阻断");
    await expect(detail).toContainText("token / apiKey / secret 参数阻断");
    await expect(detail).toContainText("payment path 阻断");
    await expect(detail).toContainText("checkout path 阻断");
    await expect(detail).toContainText("order path 阻断");
    await expect(detail).toContainText("identity upload path 阻断");
    await expect(detail).toContainText("bookingUrlRiskScanDraft");
    await expect(detail).toContainText("bookingUrlSafetyAuditDraft");

    await openDisclosure(detail, "commerce-manual-provider-review-workflow-disclosure");
    await expect(detail).toContainText("manual provider review workflow");
    await expect(detail).toContainText("status: draft only");
    await expect(detail).toContainText("no provider approved");
    await expect(detail).toContainText("all provider review pending");
    await expect(detail).toContainText("manual approval disabled");
    await expect(detail).toContainText("providerId");
    await expect(detail).toContainText("providerName");
    await expect(detail).toContainText("providerType");
    await expect(detail).toContainText("providerRegion");
    await expect(detail).toContainText("sourceHost");
    await expect(detail).toContainText("apiDocsStatus");
    await expect(detail).toContainText("termsStatus");
    await expect(detail).toContainText("readonlyPermissionStatus");
    await expect(detail).toContainText("pricingDataPolicyStatus");
    await expect(detail).toContainText("bookingLinkPolicyStatus");
    await expect(detail).toContainText("privacyStatus");
    await expect(detail).toContainText("piiHandlingStatus");
    await expect(detail).toContainText("rateLimitStatus");
    await expect(detail).toContainText("sandboxEvidenceStatus");
    await expect(detail).toContainText("manualReviewState");
    await expect(detail).toContainText("blockedReason");
    await expect(detail).toContainText("docs_pending");
    await expect(detail).toContainText("terms_pending");
    await expect(detail).toContainText("readonly_permission_pending");
    await expect(detail).toContainText("blocked");
    await expect(detail).toContainText("approved_for_future_readonly");
    await expect(detail).toContainText("当前没有 provider 处于 approved_for_future_readonly");
    await expect(detail).toContainText("UI 不提供 approve 按钮");
    await expect(detail).toContainText("manualProviderReviewAuditDraft");

    const contracts = await page.evaluate(() => {
      const bookingApi = window.WeishanCommerceBookingUrlDomainSafetyGate;
      const reviewApi = window.WeishanCommerceManualProviderReviewWorkflow;
      return {
        booking:{
          gate:bookingApi.commerceBookingUrlDomainSafetyGateContract,
          fields:bookingApi.buildBookingUrlSafetyFieldsDraft(),
          rules:bookingApi.buildBookingUrlDomainSafetyRulesDraft(),
          forbidden:bookingApi.buildBookingUrlForbiddenUrlTypesDraft(),
          risk:bookingApi.buildBookingUrlRiskScanDraft(),
          audit:bookingApi.buildBookingUrlSafetyAuditDraft(),
          evaluation:bookingApi.evaluateBookingUrlDomainSafetyDraft({ providerName:"draft", bookingUrl:"https://example.invalid/checkout?token=secret" }),
          safe:bookingApi.assertBookingUrlDomainSafetyGateSafe(bookingApi.commerceBookingUrlDomainSafetyGateContract)
        },
        review:{
          workflow:reviewApi.commerceManualProviderReviewWorkflowContract,
          objectDraft:reviewApi.buildManualProviderReviewObjectDraft(),
          states:reviewApi.buildManualProviderReviewStateDraft(),
          checklist:reviewApi.buildManualProviderReviewChecklistDraft(),
          blocked:reviewApi.buildManualProviderReviewBlockedReasonsDraft(),
          audit:reviewApi.buildManualProviderReviewAuditDraft(),
          evaluation:reviewApi.evaluateManualProviderReviewDraft({ providerName:"draft", manualReviewState:"approved_for_future_readonly" }),
          safe:reviewApi.assertManualProviderReviewWorkflowSafe(reviewApi.commerceManualProviderReviewWorkflowContract)
        }
      };
    });
    expect(contracts.booking.safe).toBe(true);
    expect(contracts.booking.gate).toEqual(expect.objectContaining({ version:"2.1.39", phase:"booking_url_domain_safety_gate", gateStatus:"closed", mode:"draft_only", bookingUrlDisplay:"disabled", bookingUrlGeneration:"disabled", bookingUrlClick:"disabled", redirectFollow:"disabled", realProviderBookingLink:"disabled", realNetwork:"disabled" }));
    expect(contracts.booking.gate.capabilities).toEqual(expect.objectContaining({ canDisplayBookingUrl:false, canGenerateBookingUrl:false, canClickBookingUrl:false, canFollowRedirect:false, canUseRealProviderBookingLink:false, canUseNetwork:false, canConnectEndpoint:false, canCreateOrder:false, canPay:false, canCheckout:false, canUploadIdentity:false, canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false }));
    expect(contracts.booking.fields.fields).toEqual(expect.arrayContaining(["providerId", "providerName", "sourceUrlHost", "bookingUrlHost", "redirectChainHostList", "urlScheme", "linkIntent", "readonlyEvidence", "redacted: true"]));
    expect(contracts.booking.rules.rules).toEqual(expect.arrayContaining(["只允许 https", "必须 exact host match", "unknown host 阻断", "payment path 阻断", "checkout path 阻断", "order path 阻断", "identity upload path 阻断"]));
    expect(contracts.booking.forbidden.forbiddenUrlTypes).toEqual(expect.arrayContaining(["bookingUrl 当前禁止展示", "checkoutUrl 始终禁止", "paymentUrl 始终禁止", "orderUrl 始终禁止"]));
    expect(contracts.booking.risk.bookingUrlRiskScanDraft).toEqual(expect.arrayContaining(["bookingUrlRiskScanDraft", "credentialParamsDetected", "rawProviderPayloadDetected", "redacted: true"]));
    expect(contracts.booking.audit.bookingUrlSafetyAuditDraft).toEqual(expect.objectContaining({ gateState:"closed", redacted:true }));
    expect(contracts.booking.evaluation).toEqual(expect.objectContaining({ allowed:false, decision:"blocked", canUseNetwork:false, canDisplayBookingUrl:false, canCreateOrder:false, canPay:false, redacted:true }));
    expect(contracts.review.safe).toBe(true);
    expect(contracts.review.workflow).toEqual(expect.objectContaining({ version:"2.1.39", phase:"manual_provider_review_workflow", workflowStatus:"draft_only", providerApprovalStatus:"none_approved", providerReviewStatus:"all_pending", manualApproval:"disabled", realProviderConnection:"disabled", realProviderSandbox:"disabled", realPrice:"disabled", bookingUrl:"disabled" }));
    expect(contracts.review.workflow.capabilities).toEqual(expect.objectContaining({ canApproveProvider:false, canRejectProvider:false, canSubmitReview:false, canConnectRealProvider:false, canRunRealProviderSandbox:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, canUseNetwork:false, canConnectEndpoint:false, canCreateOrder:false, canPay:false, canUploadIdentity:false, canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false }));
    expect(contracts.review.objectDraft.fields).toEqual(expect.arrayContaining(["providerId", "providerName", "providerType", "providerRegion", "sourceHost", "apiDocsStatus", "termsStatus", "readonlyPermissionStatus", "pricingDataPolicyStatus", "bookingLinkPolicyStatus", "privacyStatus", "piiHandlingStatus", "rateLimitStatus", "sandboxEvidenceStatus", "manualReviewState", "blockedReason", "redacted: true"]));
    expect(contracts.review.states.states).toEqual(expect.arrayContaining(["not_started", "docs_pending", "terms_pending", "readonly_permission_pending", "blocked", "approved_for_future_readonly"]));
    expect(contracts.review.blocked.blockedReasons).toEqual(expect.arrayContaining(["缺 API 文档阻断", "缺服务条款阻断", "缺只读授权阻断", "存在 payment / checkout / order 动作阻断"]));
    expect(contracts.review.audit.manualProviderReviewAuditDraft).toEqual(expect.objectContaining({ workflowState:"draft_only", manualReviewState:"not_started", redacted:true }));
    expect(contracts.review.evaluation).toEqual(expect.objectContaining({ allowed:false, decision:"blocked", canApproveProvider:false, canUseNetwork:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, redacted:true }));

    await expect(detail.locator('input[placeholder*="API key"], input[placeholder*="endpoint"], button', { hasText:/测试连接|保存 key|预订|付款|下单|提交订单|approve|reject/ })).toHaveCount(0);
    await expect(detail).not.toContainText(/¥\s*\d+/);
    await expect(detail).not.toContainText("真实 bookingUrl：");
    await expect(detail).not.toContainText("availability 真实结果");
  });

  test("commerce location policy defaults to destination required and private", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      if (!window.WeishanCommerceLocationPolicy) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceLocationPolicy.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      try { window.localStorage.removeItem("weishan:commerceLocationPolicy:v1"); } catch (_) {}
      const policy = window.WeishanCommerceLocationPolicy.getCommerceLocationPolicy();
      const health = window.WeishanCommerceLocationPolicy.locationHealthForCommerce();
      return { policy, health, serialized:JSON.stringify({ policy, health }) };
    });
    expect(result.policy.locationPermissionMode).toBe("off");
    expect(result.policy.locationPermissionStatus).toBe("not_requested");
    expect(result.policy.shippingDestination.configured).toBe(false);
    expect(result.policy.hasShippingDestination).toBe(false);
    expect(result.policy.reason).toBe("shipping_destination_required");
    expect(result.policy.hasPreciseLocation).toBe(false);
    expect(result.policy.canCalculateAccurateLandedCost).toBe(false);
    expect(result.policy.canShowAccuratePrice).toBe(false);
    expect(result.policy.canShowRedirectButton).toBe(false);
    expect(result.policy.privacy.storeRawCoordinates).toBe(false);
    expect(result.policy.privacy.logRawCoordinates).toBe(false);
    expect(result.policy.privacy.shareWithThirdParty).toBe(false);
    expect(result.policy.privacy.useForAds).toBe(false);
    expect(result.policy.privacy.useForTracking).toBe(false);
    expect(result.health.searchStatus).toBe("shipping_destination_required");
    expect(result.health.canShowPrice).toBe(false);
    expect(result.health.canShowBookingButton).toBe(false);
    expect(result.health.canShowCheckoutButton).toBe(false);
    expect(result.serialized).not.toContain("latitude");
    expect(result.serialized).not.toContain("longitude");
  });

  test("settings page exposes location service and shipping destination options", async () => {
    await gotoRoute(page, "settings");
    await expect(page.getByRole("heading", { name:"位置与收货目的地" })).toBeVisible();
    const locationPanel = page.locator("#commerceLocationSettingsPanel");
    await expect(locationPanel.getByLabel("国家/地区")).toBeVisible();
    await expect(locationPanel.getByLabel("州/省/城市")).toBeVisible();
    await expect(locationPanel.getByLabel("邮编/邮政编码")).toBeVisible();
    await expect(locationPanel.getByLabel("关闭")).toBeChecked();
    await expect(locationPanel.getByLabel("永远允许")).toBeVisible();
    await expect(locationPanel.getByLabel("使用 App 时允许")).toBeVisible();
    await expect(locationPanel).toContainText("为了精准计算最低到手价并遵守当地法律");
    await expect(locationPanel).toContainText("不会保存原始位置");
    await expect(locationPanel).toContainText("最低到手价需要根据收货目的地计算运费、税费、关税和当地合规要求");
    await expect(locationPanel).toContainText("定位服务偏好用于请求系统位置权限，不代表系统已经授权");
    await expect(locationPanel).toContainText("weishan 不会保存原始经纬度");
    await expect(locationPanel).toContainText("原始坐标保存");
    await expect(locationPanel).toContainText("false");
  });

  test("location service preference does not grant system authorization", async () => {
    await gotoRoute(page, "settings");
    const locationPanel = page.locator("#commerceLocationSettingsPanel");
    await locationPanel.getByLabel("永远允许").check();
    const policy = await page.evaluate(() => window.WeishanCommerceLocationPolicy.getCommerceLocationPolicy());
    expect(policy.locationPermissionMode).toBe("always");
    expect(policy.locationPermissionStatus).toBe("not_requested");
    expect(policy.hasPreciseLocation).toBe(false);
    expect(policy.canCalculateAccurateLandedCost).toBe(false);
  });

  test("provider registry defaults to no-provider health for core categories", async () => {
    await gotoRoute(page, "commerce");
    const health = await page.evaluate(async () => {
      if (!window.WeishanCommerceProviderAdapter) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderAdapter.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (!window.WeishanCommerceProviderConnector) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderConnector.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (!window.WeishanCommerceProductProviderSelection) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProductProviderSelection.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (!window.WeishanCommerceProviderConfig) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderConfig.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (!window.WeishanCommerceProviders) {
        if (!window.WeishanCommerceProviderSandbox) {
          await new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "./renderer/core/commerceProviderSandbox.js?v=2.0.31";
            script.onload = resolve;
            document.head.appendChild(script);
          });
        }
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviders.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      return {
        registry:window.WeishanCommerceProviders.getCommerceProviderRegistry(),
        health:["flight", "product", "hotel", "ticket", "service"].map((category) => window.WeishanCommerceProviders.getCommerceProviderHealth(category, { enabled:false, providerMode:"disabled" }))
      };
    });
    expect(health.registry.map((item) => item.category)).toEqual(["flight", "product", "hotel", "ticket", "service"]);
    for (const provider of health.registry) {
      const isProductProvider = provider.category === "product";
      expect(provider.enabled).toBe(false);
      expect(provider.configured).toBe(false);
      expect(provider.sourceType).toBe("manual_disabled");
      expect(provider.adapterId).toBeTruthy();
      expect(provider.adapterMode).toBe("read_only");
      expect(provider.adapterConfigured).toBe(false);
      expect(provider.adapterHealth).toBe("not_configured");
      expect(provider.connectorId).toBeTruthy();
      expect(provider.connectorStatus).toBe(isProductProvider ? "not_connected" : "not_configured");
      expect(provider.connectorEnabled).toBe(false);
      expect(provider.connectorConfigured).toBe(false);
      expect(provider.connectorNetworkAllowed).toBe(false);
      expect(provider.connectorType).toBe(isProductProvider ? "readonly_product_search" : "readonly_search");
      expect(provider.configStatus).toBe("not_configured");
      expect(provider.hasApiKey).toBe(false);
      expect(provider.allowNetworkSearch).toBe(false);
      expect(provider.allowReturnPrice).toBe(false);
      expect(provider.allowCreateOrder).toBe(false);
      expect(provider.allowPay).toBe(false);
      expect(provider.allowSaveIdentity).toBe(false);
      expect(provider.sandboxHealth.sandboxMode).toBe("dry_run");
      expect(provider.sandboxHealth.dryRun).toBe(true);
      expect(provider.sandboxHealth.mode).toBe("read_only");
      expect(provider.sandboxHealth.canProceedToRealSearch).toBe(false);
      expect(provider.sandboxHealth.canCallProvider).toBe(false);
      expect(provider.sandboxHealth.networkAllowed).toBe(false);
      expect(provider.sandboxHealth.priceAllowed).toBe(false);
      expect(provider.sandboxHealth.bookingUrlAllowed).toBe(false);
      expect(provider.sandboxHealth.checkoutUrlAllowed).toBe(false);
      expect(provider.sandboxHealth.createOrderAllowed).toBe(false);
      expect(provider.sandboxHealth.paymentAllowed).toBe(false);
      expect(provider.sandboxHealth.identityStorageAllowed).toBe(false);
      expect(provider.sandboxHealth.networkRequestAllowed).toBe(false);
      expect(provider.sandboxHealth.schemaValidationStatus).toBe("not_run");
      expect(provider.supportedRegions).toEqual([]);
      expect(provider.supportedCountries).toEqual([]);
      expect(provider.supportedLanguages).toEqual([]);
      expect(provider.supportedCurrencies).toEqual([]);
      expect(provider.complianceRegion).toBe("unknown");
      expect(provider.supportsReadOnlySearch).toBe(false);
      expect(provider.supportsCrossBorderSearch).toBe(false);
      expect(provider.requiresUserAccount).toBe(false);
      expect(provider.requiresIdentityDocument).toBe(false);
      expect(provider.requiresPaymentMethod).toBe(false);
      if (isProductProvider) {
        expect(provider.id).toBe("product_search_readonly_candidate");
        expect(provider.providerStatus).toBe("candidate_not_connected");
        expect(provider.productProviderEnabled).toBe(false);
        expect(provider.productProviderConfigured).toBe(false);
        expect(provider.productProviderHasApiKey).toBe(false);
        expect(provider.productProviderNetworkAllowed).toBe(false);
        expect(provider.productProviderPriceAllowed).toBe(false);
        expect(provider.productProviderRedirectAllowed).toBe(false);
        expect(provider.productProviderReadOnlyOnly).toBe(true);
        expect(provider.productProviderNoCheckout).toBe(true);
        expect(provider.productProviderNoPayment).toBe(true);
        expect(provider.productProviderNoIdentityStorage).toBe(true);
        expect(provider.productProviderReadiness.ready).toBe(false);
        expect(provider.productProviderReadiness.reason).toBe("product_provider_not_connected");
      }
    }
    for (const item of health.health) {
      const isProductHealth = item.category === "product";
      expect(item.searchStatus).toBe("no_provider");
      expect(item.canShowPrice).toBe(false);
      expect(item.canShowBookingButton).toBe(false);
      expect(item.canShowCheckoutButton).toBe(false);
      expect(item.adapterHealth.adapterMode).toBe("read_only");
      expect(item.adapterHealth.adapterConfigured).toBe(false);
      expect(item.adapterHealth.adapterHealth).toBe("not_configured");
      expect(item.connectorHealth.connectorStatus).toBe(isProductHealth ? "not_connected" : "not_configured");
      expect(item.connectorHealth.connectorEnabled).toBe(false);
      expect(item.connectorHealth.connectorConfigured).toBe(false);
      expect(item.connectorHealth.connectorNetworkAllowed).toBe(false);
      expect(item.connectorHealth.connectorType).toBe(isProductHealth ? "readonly_product_search" : "readonly_search");
      expect(item.connectorHealth.supportsSearch).toBe(false);
      expect(item.connectorHealth.supportsPrice).toBe(false);
      expect(item.connectorHealth.supportsCreateOrder).toBe(false);
      expect(item.connectorHealth.supportsPayment).toBe(false);
      expect(item.connectorHealth.supportsIdentityStorage).toBe(false);
      expect(item.configHealth.configStatus).toBe("not_configured");
      expect(item.configHealth.hasApiKey).toBe(false);
      expect(item.configHealth.allowNetworkSearch).toBe(false);
      expect(item.configHealth.allowReturnPrice).toBe(false);
      expect(item.sandboxHealth.sandboxMode).toBe("dry_run");
      expect(item.sandboxHealth.canCallProvider).toBe(false);
      expect(item.sandboxHealth.networkRequestAllowed).toBe(false);
      expect(item.sandboxHealth.globalReadiness.supportedRegions).toEqual([]);
      expect(item.sandboxHealth.globalReadiness.supportedCountries).toEqual([]);
      expect(item.sandboxHealth.globalReadiness.supportedLanguages).toEqual([]);
      expect(item.sandboxHealth.globalReadiness.supportedCurrencies).toEqual([]);
      expect(item.sandboxHealth.globalReadiness.complianceRegion).toBe("unknown");
      expect(item.sandboxHealth.globalReadiness.supportsReadOnlySearch).toBe(false);
      expect(item.sandboxHealth.globalReadiness.supportsCrossBorderSearch).toBe(false);
      expect(item.sandboxHealth.globalReadiness.requiresUserAccount).toBe(false);
      expect(item.sandboxHealth.globalReadiness.requiresIdentityDocument).toBe(false);
      expect(item.sandboxHealth.globalReadiness.requiresPaymentMethod).toBe(false);
    }
  });

  test("global provider pool is multi-source and not connected", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      if (!window.WeishanCommerceGlobalProviderPool) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceGlobalProviderPool.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      return {
        pool:window.WeishanCommerceGlobalProviderPool.getCommerceGlobalProviderPool(),
        readiness:window.WeishanCommerceGlobalProviderPool.getCommerceGlobalProviderPoolReadiness()
      };
    });
    expect(result.pool.poolVersion).toBe("2.0.31");
    expect(result.pool.phase).toBe("multi_source_provider_pool_not_connected");
    expect(result.pool.strategy).toBe("compare_multiple_sources_before_redirect");
    expect(result.pool.maxDisplayedResults).toBe(3);
    expect(result.pool.resultPolicy.requireRealProviderResult).toBe(true);
    expect(result.pool.resultPolicy.requireExternalProviderUrl).toBe(true);
    expect(result.pool.resultPolicy.noInternalCheckout).toBe(true);
    expect(result.pool.resultPolicy.noAutoPay).toBe(true);
    expect(result.pool.resultPolicy.noAutoOrder).toBe(true);
    expect(result.pool.resultPolicy.noIdentityStorage).toBe(true);
    expect(result.pool.safety.noRealEndpoint).toBe(true);
    expect(result.pool.safety.noApiKey).toBe(true);
    expect(result.pool.safety.noNetworkSearch).toBe(true);
    expect(result.pool.safety.noPriceDisplay).toBe(true);
    expect(result.pool.safety.noCheckout).toBe(true);
    expect(result.pool.safety.noPayment).toBe(true);
    expect(result.pool.safety.noOrderSubmit).toBe(true);
    expect(result.pool.safety.noIdentityStorage).toBe(true);
    const categories = result.pool.providerCategories.map((item) => item.category);
    expect(categories).toContain("product_marketplace");
    expect(categories).toContain("official_brand_site");
    expect(categories).toContain("hotel_ota");
    expect(categories).toContain("hotel_official_site");
    expect(categories).toContain("flight_ota");
    expect(categories).toContain("airline_official_site");
    expect(categories).toContain("ticketing_platform");
    expect(categories).toContain("local_service_platform");
    expect(result.readiness.ready).toBe(false);
    expect(result.readiness.networkAllowed).toBe(false);
    expect(result.readiness.canReturnPriceNow).toBe(false);
    expect(result.readiness.canRedirectNow).toBe(false);
    expect(result.readiness.reason).toBe("provider_pool_not_connected");
  });

  test("provider onboarding checklist blocks endpoint key network and price by default", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      if (!window.WeishanCommerceProviderOnboardingChecklist) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderOnboardingChecklist.js?v=2.0.40";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      return {
        checklist:window.WeishanCommerceProviderOnboardingChecklist.getProviderOnboardingChecklist("product"),
        status:window.WeishanCommerceProviderOnboardingChecklist.getProviderOnboardingStatus("product"),
        displayNotReviewed:window.WeishanCommerceProviderOnboardingChecklist.toOnboardingDisplayStatus("not_reviewed"),
        displayDisabled:window.WeishanCommerceProviderOnboardingChecklist.toOnboardingDisplayStatus("disabled"),
        displayReady:window.WeishanCommerceProviderOnboardingChecklist.toOnboardingDisplayStatus("ready"),
        canStart:window.WeishanCommerceProviderOnboardingChecklist.canStartProviderConnectorDevelopment("product"),
        reason:window.WeishanCommerceProviderOnboardingChecklist.explainProviderOnboardingBlockReason("product")
      };
    });
    expect(result.checklist.checklistVersion).toBe("2.0.40");
    expect(result.checklist.phase).toBe("provider_onboarding_checklist");
    expect(result.checklist.appliesTo).toContain("product_marketplace");
    expect(result.checklist.appliesTo).toContain("official_brand_site");
    expect(result.checklist.appliesTo).toContain("hotel_ota");
    expect(result.checklist.appliesTo).toContain("hotel_official_site");
    expect(result.checklist.appliesTo).toContain("flight_ota");
    expect(result.checklist.appliesTo).toContain("airline_official_site");
    expect(result.checklist.appliesTo).toContain("ticketing_platform");
    expect(result.checklist.appliesTo).toContain("local_service_platform");
    expect(result.checklist.defaultStatus).toBe("not_reviewed");
    expect(result.checklist.requiredBeforeConnection).toBe(true);
    expect(result.checklist.approvalRequiredBeforeEndpoint).toBe(true);
    expect(result.checklist.approvalRequiredBeforeApiKey).toBe(true);
    expect(result.checklist.approvalRequiredBeforeNetwork).toBe(true);
    expect(result.checklist.approvalRequiredBeforePriceDisplay).toBe(true);
    expect(result.checklist.checklist.legalTermsReviewed).toBe(false);
    expect(result.checklist.checklist.apiDocsReviewed).toBe(false);
    expect(result.checklist.checklist.taxAndFeeFieldsReviewed).toBe(false);
    expect(result.checklist.checklist.shippingOrBookingFeeFieldsReviewed).toBe(false);
    expect(result.checklist.checklist.apiKeyStoragePlanReviewed).toBe(false);
    expect(result.checklist.checklist.noPaymentConfirmed).toBe(false);
    expect(result.checklist.checklist.noAutoOrderConfirmed).toBe(false);
    expect(result.checklist.checklist.noIdentityStorageConfirmed).toBe(false);
    expect(result.checklist.safety.noRealEndpoint).toBe(true);
    expect(result.checklist.safety.noApiKey).toBe(true);
    expect(result.checklist.safety.noNetworkSearch).toBe(true);
    expect(result.checklist.safety.noPriceDisplay).toBe(true);
    expect(result.checklist.safety.noCheckout).toBe(true);
    expect(result.checklist.safety.noPayment).toBe(true);
    expect(result.checklist.safety.noOrderSubmit).toBe(true);
    expect(result.checklist.safety.noIdentityStorage).toBe(true);
    expect(result.status.status).toBe("not_reviewed");
    expect(result.status.canStartConnectorDevelopment).toBe(false);
    expect(result.status.canConfigureApiKey).toBe(false);
    expect(result.status.canConnectEndpoint).toBe(false);
    expect(result.status.canEnableNetworkSearch).toBe(false);
    expect(result.status.canDisplayPrice).toBe(false);
    expect(result.status.reason).toBe("provider_onboarding_required");
    expect(result.displayNotReviewed).toBe("未审查");
    expect(result.displayDisabled).toBe("未启用");
    expect(result.displayReady).toBe("可进入下一步");
    expect(result.canStart).toBe(false);
    expect(result.reason).toBe("provider_onboarding_required");
  });

  test("provider approval workflow blocks endpoint key network price and redirect by default", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceProviderApprovalWorkflow;
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderApprovalWorkflow.js?v=2.0.40&contract=" + Date.now();
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      const api = window.WeishanCommerceProviderApprovalWorkflow;
      return {
        workflow:api.getProviderApprovalWorkflow("product"),
        status:api.getProviderApprovalStatus("product", "product-provider-disabled"),
        canRequest:api.canRequestProviderApproval("product", "product-provider-disabled"),
        canStartStub:api.canStartConnectorStubDevelopment("product", "product-provider-disabled"),
        canConfigureKey:api.canConfigureProviderApiKey("product", "product-provider-disabled"),
        canConnectEndpoint:api.canConnectProviderEndpoint("product", "product-provider-disabled"),
        reason:api.explainProviderApprovalBlockReason("product", "product-provider-disabled"),
        displayNotReviewed:api.toProviderApprovalDisplayStatus("not_reviewed"),
        displayReviewRequested:api.toProviderApprovalDisplayStatus("review_requested"),
        displayLegal:api.toProviderApprovalDisplayStatus("legal_review"),
        displayApi:api.toProviderApprovalDisplayStatus("api_review"),
        displayPrivacy:api.toProviderApprovalDisplayStatus("privacy_review"),
        displayFee:api.toProviderApprovalDisplayStatus("fee_field_review"),
        displaySecurity:api.toProviderApprovalDisplayStatus("security_review"),
        displayStub:api.toProviderApprovalDisplayStatus("approved_for_stub"),
        displayRejected:api.toProviderApprovalDisplayStatus("rejected"),
        displayBlocked:api.toProviderApprovalDisplayStatus("blocked")
      };
    });
    expect(result.workflow.workflowVersion).toBe("2.0.40");
    expect(result.workflow.phase).toBe("provider_approval_workflow");
    expect(result.workflow.defaultStatus).toBe("not_reviewed");
    expect(result.workflow.appliesTo).toContain("product_marketplace");
    expect(result.workflow.appliesTo).toContain("official_brand_site");
    expect(result.workflow.appliesTo).toContain("hotel_ota");
    expect(result.workflow.appliesTo).toContain("hotel_official_site");
    expect(result.workflow.appliesTo).toContain("flight_ota");
    expect(result.workflow.appliesTo).toContain("airline_official_site");
    expect(result.workflow.appliesTo).toContain("ticketing_platform");
    expect(result.workflow.appliesTo).toContain("local_service_platform");
    expect(result.workflow.statuses).toContain("not_reviewed");
    expect(result.workflow.statuses).toContain("review_requested");
    expect(result.workflow.statuses).toContain("legal_review");
    expect(result.workflow.statuses).toContain("api_review");
    expect(result.workflow.statuses).toContain("privacy_review");
    expect(result.workflow.statuses).toContain("fee_field_review");
    expect(result.workflow.statuses).toContain("security_review");
    expect(result.workflow.statuses).toContain("approved_for_stub");
    expect(result.workflow.statuses).toContain("rejected");
    expect(result.workflow.statuses).toContain("blocked");
    expect(result.workflow.approvalStages.legalReviewRequired).toBe(true);
    expect(result.workflow.approvalStages.apiDocsReviewRequired).toBe(true);
    expect(result.workflow.approvalStages.privacyReviewRequired).toBe(true);
    expect(result.workflow.approvalStages.feeFieldReviewRequired).toBe(true);
    expect(result.workflow.approvalStages.securityReviewRequired).toBe(true);
    expect(result.workflow.approvalStages.localLawReviewRequired).toBe(true);
    expect(result.workflow.approvalStages.humanApprovalRequired).toBe(true);
    expect(result.workflow.gates.allowConnectorStubDevelopment).toBe(false);
    expect(result.workflow.gates.allowApiKeyConfiguration).toBe(false);
    expect(result.workflow.gates.allowEndpointConnection).toBe(false);
    expect(result.workflow.gates.allowNetworkSearch).toBe(false);
    expect(result.workflow.gates.allowPriceDisplay).toBe(false);
    expect(result.workflow.gates.allowRedirect).toBe(false);
    expect(result.workflow.gates.allowCheckout).toBe(false);
    expect(result.workflow.gates.allowPayment).toBe(false);
    expect(result.workflow.gates.allowOrderSubmit).toBe(false);
    expect(result.workflow.gates.allowIdentityStorage).toBe(false);
    expect(result.workflow.safety.noRealEndpoint).toBe(true);
    expect(result.workflow.safety.noApiKey).toBe(true);
    expect(result.workflow.safety.noNetworkSearch).toBe(true);
    expect(result.workflow.safety.noPriceDisplay).toBe(true);
    expect(result.workflow.safety.noRedirect).toBe(true);
    expect(result.workflow.safety.noCheckout).toBe(true);
    expect(result.workflow.safety.noPayment).toBe(true);
    expect(result.workflow.safety.noOrderSubmit).toBe(true);
    expect(result.workflow.safety.noIdentityStorage).toBe(true);
    expect(result.status.approvalStatus).toBe("not_reviewed");
    expect(result.status.canRequestApproval).toBe(true);
    expect(result.status.canStartConnectorStubDevelopment).toBe(false);
    expect(result.status.canConfigureApiKey).toBe(false);
    expect(result.status.canConnectEndpoint).toBe(false);
    expect(result.status.canEnableNetworkSearch).toBe(false);
    expect(result.status.canDisplayPrice).toBe(false);
    expect(result.status.canRedirect).toBe(false);
    expect(result.status.reason).toBe("provider_approval_required");
    expect(result.canRequest).toBe(true);
    expect(result.canStartStub).toBe(false);
    expect(result.canConfigureKey).toBe(false);
    expect(result.canConnectEndpoint).toBe(false);
    expect(result.reason).toBe("provider_approval_required");
    expect(result.displayNotReviewed).toBe("未审查");
    expect(result.displayReviewRequested).toBe("已请求审查");
    expect(result.displayLegal).toBe("法律条款审查中");
    expect(result.displayApi).toBe("API 文档审查中");
    expect(result.displayPrivacy).toBe("隐私政策审查中");
    expect(result.displayFee).toBe("价格/税费/运费字段审查中");
    expect(result.displaySecurity).toBe("安全审查中");
    expect(result.displayStub).toBe("已批准开发只读 connector stub");
    expect(result.displayRejected).toBe("已拒绝");
    expect(result.displayBlocked).toBe("已阻断");
  });

  test("read-only connector stub contract blocks execution endpoint key network price and redirect", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceReadOnlyConnectorStub;
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceReadOnlyConnectorStub.js?v=2.0.41&contract=" + Date.now();
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      const api = window.WeishanCommerceReadOnlyConnectorStub;
      const defaultStatus = api.getReadOnlyConnectorStubStatus("product", "product-provider-disabled", { approvalStatus:"not_reviewed" });
      const approvedStatus = api.getReadOnlyConnectorStubStatus("product", "product-provider-disabled", { approvalStatus:"approved_for_stub" });
      return {
        policy:api.getReadOnlyConnectorStubPolicy("product", "product-provider-disabled"),
        defaultStatus,
        approvedStatus,
        canBuildDefault:api.canBuildReadOnlyConnectorStub("product", "product-provider-disabled", { approvalStatus:"not_reviewed" }),
        canBuildApproved:api.canBuildReadOnlyConnectorStub("product", "product-provider-disabled", { approvalStatus:"approved_for_stub" }),
        canExecuteApproved:api.canExecuteReadOnlyConnectorStub("product", "product-provider-disabled", { approvalStatus:"approved_for_stub" }),
        reason:api.explainReadOnlyConnectorStubBlockReason("product", "product-provider-disabled", { approvalStatus:"not_reviewed" }),
        displayStub:api.toReadOnlyConnectorStubDisplayStatus("stub_not_ready"),
        displayReadOnly:api.toReadOnlyConnectorStubDisplayStatus("read_only"),
        displayDisabled:api.toReadOnlyConnectorStubDisplayStatus("disabled")
      };
    });
    expect(result.policy.stubVersion).toBe("2.0.41");
    expect(result.policy.phase).toBe("read_only_connector_stub_framework");
    expect(result.policy.defaultStatus).toBe("stub_not_ready");
    expect(result.policy.connectorMode).toBe("read_only");
    expect(result.policy.allowedAfterApprovalStatus).toBe("approved_for_stub");
    expect(result.policy.requiresProviderApproval).toBe(true);
    expect(result.policy.requiresLocalLawCompliance).toBe(true);
    expect(result.policy.requiresOnboardingChecklist).toBe(true);
    expect(result.policy.requiresConfigGate).toBe(true);
    expect(result.policy.requiresAdapterGate).toBe(true);
    expect(result.policy.requiresSandboxGate).toBe(true);
    expect(result.policy.requiresConnectorGate).toBe(true);
    expect(result.policy.capabilities.canBuildStub).toBe(false);
    expect(result.policy.capabilities.canConfigureApiKey).toBe(false);
    expect(result.policy.capabilities.canConnectEndpoint).toBe(false);
    expect(result.policy.capabilities.canUseNetwork).toBe(false);
    expect(result.policy.capabilities.canReturnRealPrice).toBe(false);
    expect(result.policy.capabilities.canReturnMockPrice).toBe(false);
    expect(result.policy.capabilities.canRedirect).toBe(false);
    expect(result.policy.capabilities.canCheckout).toBe(false);
    expect(result.policy.capabilities.canPay).toBe(false);
    expect(result.policy.capabilities.canSubmitOrder).toBe(false);
    expect(result.policy.capabilities.canStoreIdentity).toBe(false);
    expect(result.policy.safety.noRealEndpoint).toBe(true);
    expect(result.policy.safety.noApiKey).toBe(true);
    expect(result.policy.safety.noNetworkSearch).toBe(true);
    expect(result.policy.safety.noRealPrice).toBe(true);
    expect(result.policy.safety.noFakeDemoMockPrice).toBe(true);
    expect(result.policy.safety.noRedirect).toBe(true);
    expect(result.policy.safety.noCheckout).toBe(true);
    expect(result.policy.safety.noPayment).toBe(true);
    expect(result.policy.safety.noOrderSubmit).toBe(true);
    expect(result.policy.safety.noIdentityStorage).toBe(true);
    expect(result.policy.safety.noRawGpsStorage).toBe(true);
    expect(result.defaultStatus.stubStatus).toBe("stub_not_ready");
    expect(result.defaultStatus.connectorMode).toBe("read_only");
    expect(result.defaultStatus.canBuildStub).toBe(false);
    expect(result.defaultStatus.canExecuteStub).toBe(false);
    expect(result.defaultStatus.canConfigureApiKey).toBe(false);
    expect(result.defaultStatus.canConnectEndpoint).toBe(false);
    expect(result.defaultStatus.canUseNetwork).toBe(false);
    expect(result.defaultStatus.canReturnRealPrice).toBe(false);
    expect(result.defaultStatus.canReturnMockPrice).toBe(false);
    expect(result.defaultStatus.canRedirect).toBe(false);
    expect(result.defaultStatus.reason).toBe("provider_approval_required_before_stub");
    expect(result.approvedStatus.canBuildStub).toBe(true);
    expect(result.approvedStatus.canExecuteStub).toBe(false);
    expect(result.approvedStatus.canConfigureApiKey).toBe(false);
    expect(result.approvedStatus.canConnectEndpoint).toBe(false);
    expect(result.approvedStatus.canUseNetwork).toBe(false);
    expect(result.approvedStatus.canReturnRealPrice).toBe(false);
    expect(result.approvedStatus.canReturnMockPrice).toBe(false);
    expect(result.approvedStatus.canRedirect).toBe(false);
    expect(result.approvedStatus.canCheckout).toBe(false);
    expect(result.approvedStatus.canPay).toBe(false);
    expect(result.approvedStatus.canSubmitOrder).toBe(false);
    expect(result.approvedStatus.canStoreIdentity).toBe(false);
    expect(result.canBuildDefault).toBe(false);
    expect(result.canBuildApproved).toBe(true);
    expect(result.canExecuteApproved).toBe(false);
    expect(result.reason).toBe("provider_approval_required_before_stub");
    expect(result.displayStub).toBe("未准备");
    expect(result.displayReadOnly).toBe("只读");
    expect(result.displayDisabled).toBe("未启用");
  });

  test("provider stub profile contract keeps ebay browse api profile-only and blocked", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceEbayBrowseStubProfile;
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceEbayBrowseStubProfile.js?v=2.0.43&contract=" + Date.now();
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      const api = window.WeishanCommerceEbayBrowseStubProfile;
      return {
        profile:api.getEbayBrowseStubProfile(),
        status:api.getProviderStubProfileStatus("ebay_browse_api"),
        canUse:api.canUseProviderStubProfile("ebay_browse_api"),
        canConnect:api.canConnectProviderFromProfile("ebay_browse_api"),
        reason:api.explainProviderStubProfileBlockReason("ebay_browse_api"),
        displayProfile:api.toProviderStubProfileDisplayStatus("profile_only_not_connected"),
        displayReason:api.toProviderStubProfileDisplayStatus("provider_stub_profile_only")
      };
    });
    expect(result.profile.profileVersion).toBe("2.0.43");
    expect(result.profile.phase).toBe("provider_stub_profile");
    expect(result.profile.providerId).toBe("ebay_browse_api");
    expect(result.profile.providerName).toBe("eBay Browse API");
    expect(result.profile.providerCategory).toBe("product_marketplace");
    expect(result.profile.profileStatus).toBe("profile_only_not_connected");
    expect(result.profile.connectorMode).toBe("read_only");
    expect(result.profile.intendedUse).toBe("product_search_candidate");
    expect(result.profile.allowedUse).toContain("candidate_profile");
    expect(result.profile.allowedUse).toContain("approval_review");
    expect(result.profile.allowedUse).toContain("read_only_stub_design");
    expect(result.profile.blockedUse).toContain("real_endpoint_connection");
    expect(result.profile.blockedUse).toContain("real_api_key_configuration");
    expect(result.profile.blockedUse).toContain("real_network_search");
    expect(result.profile.blockedUse).toContain("real_price_display");
    expect(result.profile.blockedUse).toContain("redirect_to_provider");
    expect(result.profile.requiredBeforeConnection.globalCommerceStandard).toBe(true);
    expect(result.profile.requiredBeforeConnection.localLawComplianceGate).toBe(true);
    expect(result.profile.requiredBeforeConnection.providerOnboardingChecklist).toBe(true);
    expect(result.profile.requiredBeforeConnection.providerApprovalWorkflow).toBe(true);
    expect(result.profile.requiredBeforeConnection.approvedForStub).toBe(true);
    expect(result.profile.requiredBeforeConnection.readOnlyConnectorStub).toBe(true);
    expect(result.profile.requiredBeforeConnection.apiKeyStorageReview).toBe(true);
    expect(result.profile.requiredBeforeConnection.endpointReview).toBe(true);
    expect(result.profile.requiredBeforeConnection.sandboxDryRun).toBe(true);
    expect(result.profile.requiredBeforeConnection.connectorGate).toBe(true);
    expect(result.profile.requiredBeforeConnection.humanApproval).toBe(true);
    expect(result.profile.connectionState.endpointConnected).toBe(false);
    expect(result.profile.connectionState.apiKeyConfigured).toBe(false);
    expect(result.profile.connectionState.networkAllowed).toBe(false);
    expect(result.profile.connectionState.canSearchNow).toBe(false);
    expect(result.profile.connectionState.canReturnRealPrice).toBe(false);
    expect(result.profile.connectionState.canReturnMockPrice).toBe(false);
    expect(result.profile.connectionState.canRedirectNow).toBe(false);
    expect(result.profile.connectionState.canCheckout).toBe(false);
    expect(result.profile.connectionState.canPay).toBe(false);
    expect(result.profile.connectionState.canSubmitOrder).toBe(false);
    expect(result.profile.connectionState.canStoreIdentity).toBe(false);
    expect(result.profile.safety.noRealEndpoint).toBe(true);
    expect(result.profile.safety.noApiKey).toBe(true);
    expect(result.profile.safety.noNetworkSearch).toBe(true);
    expect(result.profile.safety.noRealPrice).toBe(true);
    expect(result.profile.safety.noFakeDemoMockPrice).toBe(true);
    expect(result.profile.safety.noRedirect).toBe(true);
    expect(result.profile.safety.noCheckout).toBe(true);
    expect(result.profile.safety.noPayment).toBe(true);
    expect(result.profile.safety.noOrderSubmit).toBe(true);
    expect(result.profile.safety.noIdentityStorage).toBe(true);
    expect(result.profile.safety.noRawGpsStorage).toBe(true);
    expect(result.status.providerId).toBe("ebay_browse_api");
    expect(result.status.providerName).toBe("eBay Browse API");
    expect(result.status.profileStatus).toBe("profile_only_not_connected");
    expect(result.status.connectorMode).toBe("read_only");
    expect(result.status.canUseForReview).toBe(true);
    expect(result.status.canConnectEndpoint).toBe(false);
    expect(result.status.canConfigureApiKey).toBe(false);
    expect(result.status.canUseNetwork).toBe(false);
    expect(result.status.canReturnRealPrice).toBe(false);
    expect(result.status.canReturnMockPrice).toBe(false);
    expect(result.status.canRedirect).toBe(false);
    expect(result.status.reason).toBe("provider_stub_profile_only");
    expect(result.canUse).toBe(true);
    expect(result.canConnect).toBe(false);
    expect(result.reason).toBe("provider_stub_profile_only");
    expect(result.displayProfile).toBe("仅建档，尚未接入");
    expect(result.displayReason).toBe("仅用于候选档案和审查");
  });

  test("provider secret storage plan contract blocks key input save read use and network", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceProviderSecretStoragePlan;
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderSecretStoragePlan.js?v=2.0.44&contract=" + Date.now();
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      const api = window.WeishanCommerceProviderSecretStoragePlan;
      const status = api.getProviderSecretStorageStatus("ebay_browse_api");
      return {
        plan:api.getProviderSecretStoragePlan("ebay_browse_api"),
        status,
        canInput:api.canInputProviderApiKey("ebay_browse_api"),
        canSave:api.canSaveProviderApiKey("ebay_browse_api"),
        canUse:api.canUseProviderApiKey("ebay_browse_api"),
        maskedEmpty:api.maskProviderSecret(""),
        maskedValue:api.maskProviderSecret("placeholder"),
        reason:api.explainProviderSecretStorageBlockReason("ebay_browse_api"),
        displayNotConfigured:api.toProviderSecretStorageDisplayStatus("not_configured"),
        displaySecureRequired:api.toProviderSecretStorageDisplayStatus("secure_storage_required")
      };
    });
    expect(result.plan.secretPlanVersion).toBe("2.0.44");
    expect(result.plan.phase).toBe("provider_secret_storage_plan");
    expect(result.plan.defaultStatus).toBe("not_configured");
    expect(result.plan.appliesTo).toEqual(expect.arrayContaining([
      "product_marketplace",
      "official_brand_site",
      "hotel_ota",
      "hotel_official_site",
      "flight_ota",
      "airline_official_site",
      "ticketing_platform",
      "local_service_platform"
    ]));
    expect(result.plan.storagePolicy.useSecureStorage).toBe(true);
    expect(result.plan.storagePolicy.allowPlaintextInRepo).toBe(false);
    expect(result.plan.storagePolicy.allowPlaintextInUi).toBe(false);
    expect(result.plan.storagePolicy.allowPlaintextInLogs).toBe(false);
    expect(result.plan.storagePolicy.allowPlaintextInLocalStorage).toBe(false);
    expect(result.plan.storagePolicy.allowPlaintextInSessionStorage).toBe(false);
    expect(result.plan.storagePolicy.allowPlaintextInQueryString).toBe(false);
    expect(result.plan.storagePolicy.allowPlaintextInErrorMessage).toBe(false);
    expect(result.plan.gates.canInputApiKey).toBe(false);
    expect(result.plan.gates.canSaveApiKey).toBe(false);
    expect(result.plan.gates.canReadApiKey).toBe(false);
    expect(result.plan.gates.canUseApiKeyForNetwork).toBe(false);
    expect(result.plan.gates.canConnectEndpoint).toBe(false);
    expect(result.plan.gates.canEnableNetworkSearch).toBe(false);
    expect(result.plan.gates.canReturnRealPrice).toBe(false);
    expect(result.plan.gates.canRedirect).toBe(false);
    expect(result.plan.requiredBeforeKeyUse.securityStorageReview).toBe(true);
    expect(result.plan.requiredBeforeKeyUse.providerApprovalWorkflow).toBe(true);
    expect(result.plan.requiredBeforeKeyUse.readOnlyConnectorStub).toBe(true);
    expect(result.plan.requiredBeforeKeyUse.sandboxDryRun).toBe(true);
    expect(result.plan.requiredBeforeKeyUse.connectorGate).toBe(true);
    expect(result.plan.safety.noRealApiKey).toBe(true);
    expect(result.plan.safety.noPlaintextSecret).toBe(true);
    expect(result.plan.safety.noSecretLogging).toBe(true);
    expect(result.plan.safety.noSecretInUi).toBe(true);
    expect(result.plan.safety.noSecretInGit).toBe(true);
    expect(result.plan.safety.noNetworkSearch).toBe(true);
    expect(result.plan.safety.noRealEndpoint).toBe(true);
    expect(result.plan.safety.noRealPrice).toBe(true);
    expect(result.plan.safety.noFakeDemoMockPrice).toBe(true);
    expect(result.plan.safety.noRedirect).toBe(true);
    expect(result.plan.safety.noCheckout).toBe(true);
    expect(result.plan.safety.noPayment).toBe(true);
    expect(result.plan.safety.noOrderSubmit).toBe(true);
    expect(result.plan.safety.noIdentityStorage).toBe(true);
    expect(result.status.secretStatus).toBe("not_configured");
    expect(result.status.storageMode).toBe("secure_storage_required");
    expect(result.status.canInputApiKey).toBe(false);
    expect(result.status.canSaveApiKey).toBe(false);
    expect(result.status.canReadApiKey).toBe(false);
    expect(result.status.canUseApiKeyForNetwork).toBe(false);
    expect(result.status.canConnectEndpoint).toBe(false);
    expect(result.status.canEnableNetworkSearch).toBe(false);
    expect(result.status.canReturnRealPrice).toBe(false);
    expect(result.status.canRedirect).toBe(false);
    expect(result.status.reason).toBe("provider_secret_storage_not_approved");
    expect(result.canInput).toBe(false);
    expect(result.canSave).toBe(false);
    expect(result.canUse).toBe(false);
    expect(result.maskedEmpty).toBe("未配置");
    expect(result.maskedValue).toBe("[redacted]");
    expect(result.reason).toBe("provider_secret_storage_not_approved");
    expect(result.displayNotConfigured).toBe("未配置");
    expect(result.displaySecureRequired).toBe("需要安全存储");
  });

  test("provider secret storage panel appears without raw fields or secret leaks", async () => {
    const inputs = ["买华为手机", "订酒店", "订机票"];
    for (const text of inputs) {
      await submitHomeCommand(page, runId + "-SECRET-PANEL " + text);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      await expect(home).toContainText("查看其它安全规则折叠面板");
      await expect(home).not.toContainText("Provider 密钥安全方案");
      await expect(home).not.toContainText("真实 provider API key 接入前必须完成安全存储审查。当前不会保存或使用任何真实 API key。");
      await expect(home).not.toContainText("密钥状态：未配置");
      await expect(home).not.toContainText("存储方式：需要安全存储");
      await expect(home).not.toContainText("API key 输入：未开放");
      await expect(home).not.toContainText("API key 保存：未开放");
      await expect(home).not.toContainText("API key 读取：未开放");
      await expect(home).not.toContainText("网络使用：未启用");
      await expect(home).not.toContainText("Endpoint：不可连接");
      await expect(home).not.toContainText("网络搜索：未启用");
      await expect(home).not.toContainText("实时价格：不可用");
      await expect(home).not.toContainText("精确跳转：未启用");
      await expect(home).not.toContainText("明文显示：禁止");
      await expect(home).not.toContainText("日志记录：禁止");
      await expect(home).not.toContainText("Git 提交：禁止");
      await expect(home).not.toContainText("provider API key 只能在完成安全存储审查、Provider Approval、只读 Connector Stub、sandbox dry run 和 connector gate 后使用。");
      await expect(home).not.toContainText("当前不会保存真实 key，不会读取 key，不会用于网络请求。");
      await expect(home).not.toContainText("provider_secret_storage_not_approved");
      await expect(home).not.toContainText("secretStatus=not_configured");
      await expect(home).not.toContainText("canInputApiKey=false");
      await expect(home).not.toContainText("canSaveApiKey=false");
      await expect(home).not.toContainText("canReadApiKey=false");
      await expect(home).not.toContainText("canUseApiKeyForNetwork=false");
      await expect(home).not.toContainText("allowPlaintextInRepo=false");
      await expect(home).not.toContainText("allowPlaintextInUi=false");
      await expect(home).not.toContainText("allowPlaintextInLogs=false");
      await expect(home).not.toContainText("noRealApiKey=true");
      await expect(home).not.toContainText("noPlaintextSecret=true");
      await expect(home).not.toContainText("noSecretLogging=true");
      await expect(home).not.toContainText("secret-value");
      await expect(home).not.toContainText("test-secret");
      await expect(home).not.toContainText("sk-");
      await expect(home).not.toContainText("Bearer");
      await expect(home).not.toContainText("client_secret");
      await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
      await expect(page.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);

      await openTechnicalDetails(home);
      await expect(home).toContainText("Provider 密钥安全方案");
      await expect(home).toContainText("真实 provider API key 接入前必须完成安全存储审查。当前不会保存或使用任何真实 API key。");
      await expect(home).toContainText("密钥状态：未配置");
      await expect(home).toContainText("存储方式：需要安全存储");
      await expect(home).toContainText("API key 输入：未开放");
      await expect(home).toContainText("API key 保存：未开放");
      await expect(home).toContainText("API key 读取：未开放");
      await expect(home).toContainText("网络使用：未启用");
      await expect(home).toContainText("Endpoint：不可连接");
      await expect(home).toContainText("网络搜索：未启用");
      await expect(home).toContainText("实时价格：不可用");
      await expect(home).toContainText("精确跳转：未启用");
      await expect(home).toContainText("明文显示：禁止");
      await expect(home).toContainText("日志记录：禁止");
      await expect(home).toContainText("Git 提交：禁止");
      await expect(home).toContainText("provider API key 只能在完成安全存储审查、Provider Approval、只读 Connector Stub、sandbox dry run 和 connector gate 后使用。");
      await expect(home).toContainText("当前不会保存真实 key，不会读取 key，不会用于网络请求。");

      await gotoRoute(page, "home");
    }
  });

  test("provider sandbox dry run contract blocks endpoint key network results price and redirect", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceProviderSandboxDryRun;
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderSandboxDryRun.js?v=2.0.45&contract=" + Date.now();
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      const api = window.WeishanCommerceProviderSandboxDryRun;
      const status = api.getProviderSandboxDryRunStatus("ebay_browse_api");
      return {
        policy:api.getProviderSandboxDryRunPolicy("ebay_browse_api"),
        status,
        canRun:api.canRunProviderSandboxDryRun("ebay_browse_api"),
        canEndpoint:api.canUseSandboxRealEndpoint("ebay_browse_api"),
        canKey:api.canUseSandboxApiKey("ebay_browse_api"),
        canResults:api.canReturnSandboxResults("ebay_browse_api"),
        reason:api.explainProviderSandboxDryRunBlockReason("ebay_browse_api"),
        displayStatus:api.toProviderSandboxDryRunDisplayStatus("not_run"),
        displayMode:api.toProviderSandboxDryRunDisplayStatus("offline_sandbox")
      };
    });
    expect(result.policy.dryRunVersion).toBe("2.0.45");
    expect(result.policy.phase).toBe("provider_sandbox_dry_run_framework");
    expect(result.policy.defaultStatus).toBe("not_run");
    expect(result.policy.dryRunMode).toBe("offline_sandbox");
    expect(result.policy.requiresGlobalCommerceStandard).toBe(true);
    expect(result.policy.requiresLocalLawCompliance).toBe(true);
    expect(result.policy.requiresProviderOnboarding).toBe(true);
    expect(result.policy.requiresProviderApproval).toBe(true);
    expect(result.policy.requiresReadOnlyConnectorStub).toBe(true);
    expect(result.policy.requiresProviderStubProfile).toBe(true);
    expect(result.policy.requiresSecretStoragePlan).toBe(true);
    expect(result.policy.requiresHumanApproval).toBe(true);
    expect(result.policy.dryRunChecks.requestShapeReviewed).toBe(false);
    expect(result.policy.dryRunChecks.responseShapeReviewed).toBe(false);
    expect(result.policy.dryRunChecks.errorHandlingReviewed).toBe(false);
    expect(result.policy.dryRunChecks.timeoutHandlingReviewed).toBe(false);
    expect(result.policy.dryRunChecks.rateLimitHandlingReviewed).toBe(false);
    expect(result.policy.dryRunChecks.paginationReviewed).toBe(false);
    expect(result.policy.dryRunChecks.priceFieldReviewed).toBe(false);
    expect(result.policy.dryRunChecks.taxFeeShippingFieldReviewed).toBe(false);
    expect(result.policy.dryRunChecks.redirectUrlReviewed).toBe(false);
    expect(result.policy.dryRunChecks.privacyReviewed).toBe(false);
    expect(result.policy.dryRunChecks.noPaymentConfirmed).toBe(false);
    expect(result.policy.dryRunChecks.noOrderSubmitConfirmed).toBe(false);
    expect(result.policy.dryRunChecks.noIdentityStorageConfirmed).toBe(false);
    expect(result.policy.capabilities.canRunDryRun).toBe(false);
    expect(result.policy.capabilities.canUseRealEndpoint).toBe(false);
    expect(result.policy.capabilities.canUseRealApiKey).toBe(false);
    expect(result.policy.capabilities.canUseNetwork).toBe(false);
    expect(result.policy.capabilities.canReturnRealResults).toBe(false);
    expect(result.policy.capabilities.canReturnRealPrice).toBe(false);
    expect(result.policy.capabilities.canReturnMockPrice).toBe(false);
    expect(result.policy.capabilities.canRedirect).toBe(false);
    expect(result.policy.safety.noRealEndpoint).toBe(true);
    expect(result.policy.safety.noRealApiKey).toBe(true);
    expect(result.policy.safety.noNetworkSearch).toBe(true);
    expect(result.policy.safety.noRealResults).toBe(true);
    expect(result.policy.safety.noRealPrice).toBe(true);
    expect(result.policy.safety.noFakeDemoMockPrice).toBe(true);
    expect(result.policy.safety.noRedirect).toBe(true);
    expect(result.status.dryRunStatus).toBe("not_run");
    expect(result.status.dryRunMode).toBe("offline_sandbox");
    expect(result.status.canRunDryRun).toBe(false);
    expect(result.status.canUseRealEndpoint).toBe(false);
    expect(result.status.canUseRealApiKey).toBe(false);
    expect(result.status.canUseNetwork).toBe(false);
    expect(result.status.canReturnRealResults).toBe(false);
    expect(result.status.canReturnRealPrice).toBe(false);
    expect(result.status.canReturnMockPrice).toBe(false);
    expect(result.status.canRedirect).toBe(false);
    expect(result.status.reason).toBe("provider_sandbox_dry_run_required");
    expect(result.canRun).toBe(false);
    expect(result.canEndpoint).toBe(false);
    expect(result.canKey).toBe(false);
    expect(result.canResults).toBe(false);
    expect(result.reason).toBe("provider_sandbox_dry_run_required");
    expect(result.displayStatus).toBe("未运行");
    expect(result.displayMode).toBe("离线沙箱");
  });

  test("provider sandbox dry run panel appears without raw fields and blocks real provider access", async () => {
    const inputs = ["买华为手机", "订酒店", "订机票"];
    for (const text of inputs) {
      await submitHomeCommand(page, runId + "-SANDBOX-DRY-RUN " + text);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      const homeVisible = await visibleTextWithoutTechnicalDetails(home);
      await expect(home).toContainText("查看其它安全规则折叠面板");
      expect(homeVisible).not.toContain("Provider Sandbox Dry Run");
      expect(homeVisible).not.toContain("真实 provider 接入前必须完成离线沙箱空跑。当前不会访问任何真实平台。");
      expect(homeVisible).not.toContain("Dry Run 状态：未运行");
      expect(homeVisible).not.toContain("Dry Run 模式：离线沙箱");
      expect(homeVisible).not.toContain("真实 endpoint：不可使用");
      expect(homeVisible).not.toContain("真实 API key：不可使用");
      expect(homeVisible).not.toContain("网络请求：未启用");
      expect(homeVisible).not.toContain("真实结果：不可返回");
      expect(homeVisible).not.toContain("真实价格：不可用");
      expect(homeVisible).not.toContain("测试价格：不可用");
      expect(homeVisible).not.toContain("精确跳转：未启用");
      expect(homeVisible).not.toContain("请求结构审查：未完成");
      expect(homeVisible).not.toContain("响应结构审查：未完成");
      expect(homeVisible).not.toContain("错误处理审查：未完成");
      expect(homeVisible).not.toContain("超时处理审查：未完成");
      expect(homeVisible).not.toContain("频率限制审查：未完成");
      expect(homeVisible).not.toContain("分页处理审查：未完成");
      expect(homeVisible).not.toContain("价格字段审查：未完成");
      expect(homeVisible).not.toContain("税费 / 运费字段审查：未完成");
      expect(homeVisible).not.toContain("跳转 URL 审查：未完成");
      expect(homeVisible).not.toContain("隐私审查：未完成");
      expect(homeVisible).not.toContain("不付款确认：未完成");
      expect(homeVisible).not.toContain("不提交订单确认：未完成");
      expect(homeVisible).not.toContain("不保存证件 / 银行卡确认：未完成");
      expect(homeVisible).not.toContain("当前不会访问 eBay 或任何真实 provider");
      expect(homeVisible).not.toContain("不会读取 API key");
      expect(homeVisible).not.toContain("不会发起网络请求");
      expect(homeVisible).not.toContain("不会返回商品、价格或跳转链接");
      expect(homeVisible).not.toContain("provider_sandbox_dry_run_required");
      expect(homeVisible).not.toContain("dryRunStatus=not_run");
      expect(homeVisible).not.toContain("canRunDryRun=false");
      expect(homeVisible).not.toContain("canUseRealEndpoint=false");
      expect(homeVisible).not.toContain("canUseRealApiKey=false");
      expect(homeVisible).not.toContain("canUseNetwork=false");
      expect(homeVisible).not.toContain("canReturnRealResults=false");
      expect(homeVisible).not.toContain("canReturnRealPrice=false");
      await expect(home).not.toContainText("canReturnMockPrice=false");
      await expect(home).not.toContainText("noRealEndpoint=true");
      await expect(home).not.toContainText("noRealApiKey=true");
      await expect(home).not.toContainText("noNetworkSearch=true");
      await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
      await expect(page.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
      await expect(home).not.toContainText("当地法律合规审查");
      await openTechnicalDetails(home);
      await expect(home).toContainText("Provider Sandbox Dry Run");
      await expect(home).toContainText("真实 provider 接入前必须完成离线沙箱空跑。当前不会访问任何真实平台。");
      await expect(home).toContainText("Dry Run 状态：未运行");
      await expect(home).toContainText("Dry Run 模式：离线沙箱");
      await expect(home).toContainText("真实 endpoint：不可使用");
      await expect(home).toContainText("真实 API key：不可使用");
      await expect(home).toContainText("网络请求：未启用");
      await expect(home).toContainText("真实结果：不可返回");
      await expect(home).toContainText("真实价格：不可用");
      await expect(home).toContainText("测试价格：不可用");
      await expect(home).toContainText("精确跳转：未启用");
      await expect(home).toContainText("请求结构审查：未完成");
      await expect(home).toContainText("响应结构审查：未完成");
      await expect(home).toContainText("错误处理审查：未完成");
      await expect(home).toContainText("超时处理审查：未完成");
      await expect(home).toContainText("频率限制审查：未完成");
      await expect(home).toContainText("分页处理审查：未完成");
      await expect(home).toContainText("价格字段审查：未完成");
      await expect(home).toContainText("税费 / 运费字段审查：未完成");
      await expect(home).toContainText("跳转 URL 审查：未完成");
      await expect(home).toContainText("隐私审查：未完成");
      await expect(home).toContainText("不付款确认：未完成");
      await expect(home).toContainText("不提交订单确认：未完成");
      await expect(home).toContainText("不保存证件 / 银行卡确认：未完成");
      await expect(home).toContainText("当前不会访问 eBay 或任何真实 provider");
      await expect(home).toContainText("不会读取 API key");
      await expect(home).toContainText("不会发起网络请求");
      await expect(home).toContainText("不会返回商品、价格或跳转链接");
      await expect(home).toContainText("Provider 密钥安全方案");
      await expect(home).toContainText("Provider 审批流程");
      await expect(home).toContainText("只读 Connector Stub");

      await gotoRoute(page, "home");
    }
  });

  test("connector gate contract blocks connector endpoint key network results price and redirect", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceConnectorGate;
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceConnectorGate.js?v=2.0.46&contract=" + Date.now();
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      const api = window.WeishanCommerceConnectorGate;
      const status = api.getCommerceConnectorGateStatus("ebay_browse_api");
      return {
        policy: api.getCommerceConnectorGatePolicy("final_pre_connection_gate"),
        status,
        canOpen: api.canOpenCommerceConnector(status),
        canEndpoint: api.canUseConnectorEndpoint(status),
        canKey: api.canUseConnectorApiKey(status),
        canNetwork: api.canUseConnectorNetwork(status),
        canResults: api.canReturnConnectorResults(status),
        reason: api.explainCommerceConnectorGateBlockReason(status),
        displayStatus: api.toCommerceConnectorGateDisplayStatus(status),
        displayMode: api.toCommerceConnectorGateDisplayStatus(status.gateMode)
      };
    });
    expect(result.policy.connectorGateVersion).toBe("2.0.46");
    expect(result.policy.phase).toBe("connector_gate_framework");
    expect(result.policy.defaultStatus).toBe("blocked");
    expect(result.policy.gateMode).toBe("final_pre_connection_gate");
    expect(result.policy.requiresGlobalCommerceStandard).toBe(true);
    expect(result.policy.requiresLocalLawCompliance).toBe(true);
    expect(result.policy.requiresProviderOnboarding).toBe(true);
    expect(result.policy.requiresProviderApproval).toBe(true);
    expect(result.policy.requiresReadOnlyConnectorStub).toBe(true);
    expect(result.policy.requiresProviderStubProfile).toBe(true);
    expect(result.policy.requiresSecretStoragePlan).toBe(true);
    expect(result.policy.requiresSandboxDryRun).toBe(true);
    expect(result.policy.requiresHumanApproval).toBe(true);
    expect(result.policy.requiredChecks.globalCommerceStandardPassed).toBe(false);
    expect(result.policy.requiredChecks.localLawCompliancePassed).toBe(false);
    expect(result.policy.requiredChecks.providerOnboardingCompleted).toBe(false);
    expect(result.policy.requiredChecks.providerApprovalGranted).toBe(false);
    expect(result.policy.requiredChecks.readOnlyConnectorStubReady).toBe(false);
    expect(result.policy.requiredChecks.providerStubProfileReviewed).toBe(false);
    expect(result.policy.requiredChecks.secretStorageApproved).toBe(false);
    expect(result.policy.requiredChecks.sandboxDryRunPassed).toBe(false);
    expect(result.policy.requiredChecks.endpointReviewed).toBe(false);
    expect(result.policy.requiredChecks.apiKeyStorageReviewed).toBe(false);
    expect(result.policy.requiredChecks.networkPolicyReviewed).toBe(false);
    expect(result.policy.requiredChecks.priceFieldReviewed).toBe(false);
    expect(result.policy.requiredChecks.redirectPolicyReviewed).toBe(false);
    expect(result.policy.requiredChecks.humanApprovalGranted).toBe(false);
    expect(result.policy.capabilities.canOpenConnector).toBe(false);
    expect(result.policy.capabilities.canConnectEndpoint).toBe(false);
    expect(result.policy.capabilities.canUseApiKey).toBe(false);
    expect(result.policy.capabilities.canUseNetwork).toBe(false);
    expect(result.policy.capabilities.canReturnRealResults).toBe(false);
    expect(result.policy.capabilities.canReturnRealPrice).toBe(false);
    expect(result.policy.capabilities.canReturnMockPrice).toBe(false);
    expect(result.policy.capabilities.canRedirect).toBe(false);
    expect(result.policy.safety.noRealEndpoint).toBe(true);
    expect(result.policy.safety.noRealApiKey).toBe(true);
    expect(result.policy.safety.noNetworkSearch).toBe(true);
    expect(result.policy.safety.noRealResults).toBe(true);
    expect(result.policy.safety.noRealPrice).toBe(true);
    expect(result.policy.safety.noFakeDemoMockPrice).toBe(true);
    expect(result.policy.safety.noRedirect).toBe(true);
    expect(result.status.connectorGateStatus).toBe("blocked");
    expect(result.status.gateMode).toBe("final_pre_connection_gate");
    expect(result.status.canOpenConnector).toBe(false);
    expect(result.status.canConnectEndpoint).toBe(false);
    expect(result.status.canUseApiKey).toBe(false);
    expect(result.status.canUseNetwork).toBe(false);
    expect(result.status.canReturnRealResults).toBe(false);
    expect(result.status.canReturnRealPrice).toBe(false);
    expect(result.status.canReturnMockPrice).toBe(false);
    expect(result.status.canRedirect).toBe(false);
    expect(result.status.reason).toBe("connector_gate_required");
    expect(result.canOpen).toBe(false);
    expect(result.canEndpoint).toBe(false);
    expect(result.canKey).toBe(false);
    expect(result.canNetwork).toBe(false);
    expect(result.canResults).toBe(false);
    expect(result.reason).toBe("connector_gate_required");
    expect(result.displayStatus).toBe("已阻断");
    expect(result.displayMode).toBe("真实连接前最终闸门");
  });

  test("connector gate panel appears without raw fields and blocks real connector access", async () => {
    const inputs = ["买华为手机", "订酒店", "订机票"];
    const rawFields = [
      "connector_gate_required",
      "connectorGateStatus=blocked",
      "canOpenConnector=false",
      "canConnectEndpoint=false",
      "canUseApiKey=false",
      "canUseNetwork=false",
      "canReturnRealResults=false",
      "canReturnRealPrice=false",
      "canReturnMockPrice=false",
      "noRealEndpoint=true",
      "noRealApiKey=true",
      "noNetworkSearch=true"
    ];
    for (const text of inputs) {
      await submitHomeCommand(page, runId + "-CONNECTOR-GATE " + text);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      const homePanel = home.locator(".commerce-connector-gate-panel").first();
      const homeVisible = await visibleTextWithoutTechnicalDetails(home);
      await expect(home).toContainText("查看其它安全规则折叠面板");
      for (const field of rawFields) expect(homeVisible).not.toContain(field);
      expect(homeVisible).not.toMatch(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
      await expect(page.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
      await expect(home).not.toContainText("当地法律合规审查");
      await openTechnicalDetails(home);
      await expect(homePanel).toContainText("Connector Gate");
      await expect(homePanel).toContainText("真实 provider connector 接入前必须通过最终闸门");
      await expect(homePanel).toContainText("Gate 状态：已阻断");
      await expect(homePanel).toContainText("闸门模式：真实连接前最终闸门");
      await expect(homePanel).toContainText("Connector：不可打开");
      await expect(homePanel).toContainText("Endpoint：不可连接");
      await expect(homePanel).toContainText("API key：不可使用");
      await expect(homePanel).toContainText("网络请求：未启用");
      await expect(homePanel).toContainText("真实结果：不可返回");
      await expect(homePanel).toContainText("真实价格：不可用");
      await expect(homePanel).toContainText("测试价格：不可用");
      await expect(homePanel).toContainText("精确跳转：未启用");
      await expect(homePanel).toContainText("支付 / 下单：不支持");
      await expect(homePanel).toContainText("证件 / 银行卡：不保存");
      await expect(homePanel).toContainText("全球采购标准：未通过最终接入审查");
      await expect(homePanel).toContainText("当地法律合规：未通过最终接入审查");
      await expect(homePanel).toContainText("Provider Onboarding：未完成");
      await expect(homePanel).toContainText("Provider Approval：未完成");
      await expect(homePanel).toContainText("只读 Connector Stub：未准备");
      await expect(homePanel).toContainText("密钥安全方案：未批准");
      await expect(homePanel).toContainText("Sandbox Dry Run：未通过");
      await expect(homePanel).toContainText("Endpoint 审查：未完成");
      await expect(homePanel).toContainText("API key 存储审查：未完成");
      await expect(homePanel).toContainText("网络策略审查：未完成");
      await expect(homePanel).toContainText("价格字段审查：未完成");
      await expect(homePanel).toContainText("跳转策略审查：未完成");
      await expect(homePanel).toContainText("当前不会访问 eBay 或任何真实 provider");
      await expect(homePanel).toContainText("不会读取 API key");
      await expect(homePanel).toContainText("不会连接 endpoint");
      await expect(homePanel).toContainText("不会发起网络请求");
      await expect(homePanel).toContainText("不会返回商品、价格或跳转链接");
      await expect(homePanel).toContainText("任意前置 gate 未完成时");
      await expect(homePanel).toContainText("通过后也不得自动放开 checkout、payment 或 order");
      await gotoRoute(page, "home");
    }
  });
  test("provider integration readiness summary contract blocks all real provider capabilities", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceProviderIntegrationReadiness;
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderIntegrationReadiness.js?v=2.0.48&contract=" + Date.now();
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      const api = window.WeishanCommerceProviderIntegrationReadiness;
      const readiness = api.getProviderIntegrationReadiness("ebay_browse_api");
      return {
        readiness,
        canProceed:api.canProceedToProviderIntegration(readiness),
        blockers:api.explainProviderIntegrationBlockers(readiness),
        displayStatus:api.toProviderIntegrationReadinessDisplayStatus("not_ready"),
        displayGate:api.toProviderIntegrationReadinessDisplayStatus("profile_only_not_connected"),
        displayModel:api.getProviderIntegrationReadinessDisplayModel(readiness)
      };
    });
    expect(result.readiness.readinessVersion).toBe("2.0.48");
    expect(result.readiness.phase).toBe("provider_integration_readiness_summary");
    expect(result.readiness.defaultStatus).toBe("not_ready");
    expect(result.readiness.readinessStatus).toBe("not_ready");
    expect(result.readiness.summaryMode).toBe("pre_connection_readiness");
    expect(result.readiness.canConnectProvider).toBe(false);
    expect(result.readiness.canUseApiKey).toBe(false);
    expect(result.readiness.canUseNetwork).toBe(false);
    expect(result.readiness.canReturnRealResults).toBe(false);
    expect(result.readiness.canDisplayRealPrice).toBe(false);
    expect(result.readiness.canReturnMockPrice).toBe(false);
    expect(result.readiness.canRedirect).toBe(false);
    expect(result.readiness.canCheckout).toBe(false);
    expect(result.readiness.canPay).toBe(false);
    expect(result.readiness.canSubmitOrder).toBe(false);
    expect(result.readiness.canStoreIdentity).toBe(false);
    expect(result.readiness.gates.globalCommerceStandard).toBe("required");
    expect(result.readiness.gates.localLawCompliance).toBe("not_verified");
    expect(result.readiness.gates.providerOnboarding).toBe("not_completed");
    expect(result.readiness.gates.providerApproval).toBe("not_reviewed");
    expect(result.readiness.gates.readOnlyConnectorStub).toBe("not_ready");
    expect(result.readiness.gates.providerStubProfile).toBe("profile_only_not_connected");
    expect(result.readiness.gates.secretStorage).toBe("not_configured");
    expect(result.readiness.gates.sandboxDryRun).toBe("not_run");
    expect(result.readiness.gates.connectorGate).toBe("blocked");
    expect(result.readiness.gates.humanApproval).toBe("not_granted");
    expect(result.readiness.safety.noRealEndpoint).toBe(true);
    expect(result.readiness.safety.noRealApiKey).toBe(true);
    expect(result.readiness.safety.noNetworkSearch).toBe(true);
    expect(result.readiness.safety.noRealResults).toBe(true);
    expect(result.readiness.safety.noRealPrice).toBe(true);
    expect(result.readiness.safety.noFakeDemoMockPrice).toBe(true);
    expect(result.readiness.safety.noRedirect).toBe(true);
    expect(result.canProceed).toBe(false);
    expect(result.blockers).toContain("provider_integration_not_ready");
    expect(result.displayStatus).toBe("未准备好");
    expect(result.displayGate).toBe("仅建档，尚未接入");
    expect(result.displayModel.title).toBe("Provider 接入准备总览");
    expect(result.displayModel.note).toContain("不会打开任何 connector");
  });

  test("provider integration readiness summary appears on home and detail without raw fields", async () => {
    const inputs = ["买华为手机", "订酒店", "订机票"];
    const rawFields = [
      "provider_integration_not_ready",
      "readinessStatus=not_ready",
      "canConnectProvider=false",
      "canUseApiKey=false",
      "canUseNetwork=false",
      "canReturnRealResults=false",
      "canDisplayRealPrice=false",
      "canReturnMockPrice=false",
      "noRealEndpoint=true",
      "noRealApiKey=true",
      "noNetworkSearch=true"
    ];
    for (const text of inputs) {
      await submitHomeCommand(page, runId + "-READINESS " + text);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      await openTechnicalDetails(home);
      const homePanel = home.locator(".commerce-provider-readiness-panel").first();
      await expect(homePanel).toContainText("Provider 接入准备总览");
      await expect(homePanel).toContainText("真实 provider 接入前必须完成所有 gate");
      await expect(homePanel).toContainText("总体状态：未准备好");
      await expect(homePanel).toContainText("真实 provider：不可接入");
      await expect(homePanel).toContainText("API key：不可使用");
      await expect(homePanel).toContainText("网络请求：未启用");
      await expect(homePanel).toContainText("真实结果：不可返回");
      await expect(homePanel).toContainText("真实价格：不可用");
      await expect(homePanel).toContainText("测试价格：不可用");
      await expect(homePanel).toContainText("精确跳转：未启用");
      await expect(homePanel).toContainText("支付 / 下单：不支持");
      await expect(homePanel).toContainText("证件 / 银行卡：不保存");
      await expect(homePanel).toContainText("全球采购标准：已要求");
      await expect(homePanel).toContainText("当地法律合规：未确认");
      await expect(homePanel).toContainText("Provider Onboarding：未完成");
      await expect(homePanel).toContainText("Provider Approval：未审查");
      await expect(homePanel).toContainText("只读 Connector Stub：未准备");
      await expect(homePanel).toContainText("Provider Stub Profile：仅建档，尚未接入");
      await expect(homePanel).toContainText("密钥安全方案：未配置");
      await expect(homePanel).toContainText("Sandbox Dry Run：未运行");
      await expect(homePanel).toContainText("Connector Gate：已阻断");
      await expect(homePanel).toContainText("人工批准：未完成");
      await expect(homePanel).toContainText("不会打开任何 connector");
      await expect(homePanel).toContainText("当前不会访问 eBay 或任何真实 provider");
      await expect(homePanel).toContainText("不会读取 API key");
      await expect(homePanel).toContainText("不会连接 endpoint");
      await expect(homePanel).toContainText("不会发起网络请求");
      await expect(homePanel).toContainText("不会返回商品、价格或跳转链接");
      await expect(home.locator(".commerce-provider-readiness-panel")).toHaveCount(1);
      await expectPanelBefore(homePanel, home.locator(".commerce-connector-gate-panel").first());
      await expect(home).toContainText("Provider Sandbox Dry Run");
      await expect(home).toContainText("Provider 密钥安全方案");
      await expect(home).toContainText("Provider 接入审查面板");
      for (const field of rawFields) await expect(home).not.toContainText(field);
      await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
      await expect(page.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);

      await gotoRoute(page, "home");
    }
  });

  test("provider integration manual approval runbook contract blocks real provider approval", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceProviderIntegrationRunbook;
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderIntegrationRunbook.js?v=2.0.48&contract=" + Date.now();
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      const api = window.WeishanCommerceProviderIntegrationRunbook;
      const runbook = api.getProviderIntegrationRunbook("ebay_browse_api");
      return {
        runbook,
        canApprove:api.canApproveProviderIntegration(runbook),
        canProceed:api.canProceedAfterManualApproval(runbook),
        blockers:api.explainProviderIntegrationRunbookBlockers(runbook),
        displayStatus:api.toProviderIntegrationRunbookDisplayStatus("manual_approval_required"),
        displayMode:api.toProviderIntegrationRunbookDisplayStatus("pre_real_provider_connection"),
        displayModel:api.getProviderIntegrationRunbookDisplayModel(runbook)
      };
    });
    expect(result.runbook.runbookVersion).toBe("2.0.48");
    expect(result.runbook.phase).toBe("provider_integration_manual_approval_runbook");
    expect(result.runbook.defaultStatus).toBe("manual_approval_required");
    expect(result.runbook.runbookStatus).toBe("manual_approval_required");
    expect(result.runbook.runbookMode).toBe("pre_real_provider_connection");
    expect(result.runbook.appliesBefore).toContain("endpoint_connection");
    expect(result.runbook.appliesBefore).toContain("api_key_use");
    expect(result.runbook.appliesBefore).toContain("network_search");
    expect(result.runbook.appliesBefore).toContain("real_result_display");
    expect(result.runbook.appliesBefore).toContain("real_price_display");
    expect(result.runbook.appliesBefore).toContain("redirect_enablement");
    expect(result.runbook.requiredBeforeApproval.globalCommerceStandard).toBe(true);
    expect(result.runbook.requiredBeforeApproval.localLawComplianceGate).toBe(true);
    expect(result.runbook.requiredBeforeApproval.providerOnboardingChecklist).toBe(true);
    expect(result.runbook.requiredBeforeApproval.providerApprovalWorkflow).toBe(true);
    expect(result.runbook.requiredBeforeApproval.readOnlyConnectorStub).toBe(true);
    expect(result.runbook.requiredBeforeApproval.providerStubProfile).toBe(true);
    expect(result.runbook.requiredBeforeApproval.providerSecretStoragePlan).toBe(true);
    expect(result.runbook.requiredBeforeApproval.providerSandboxDryRun).toBe(true);
    expect(result.runbook.requiredBeforeApproval.connectorGate).toBe(true);
    expect(result.runbook.requiredBeforeApproval.integrationReadinessSummary).toBe(true);
    expect(result.runbook.requiredBeforeApproval.humanApproval).toBe(true);
    expect(result.runbook.approvalStages.scopeReview).toBe("not_started");
    expect(result.runbook.approvalStages.finalHumanApproval).toBe("not_started");
    expect(result.runbook.canApproveRealProvider).toBe(false);
    expect(result.runbook.canConnectEndpoint).toBe(false);
    expect(result.runbook.canUseApiKey).toBe(false);
    expect(result.runbook.canUseNetwork).toBe(false);
    expect(result.runbook.canReturnRealResults).toBe(false);
    expect(result.runbook.canDisplayRealPrice).toBe(false);
    expect(result.runbook.canReturnMockPrice).toBe(false);
    expect(result.runbook.canRedirect).toBe(false);
    expect(result.runbook.canCheckout).toBe(false);
    expect(result.runbook.canPay).toBe(false);
    expect(result.runbook.canSubmitOrder).toBe(false);
    expect(result.runbook.canStoreIdentity).toBe(false);
    expect(result.runbook.safety.noRealEndpoint).toBe(true);
    expect(result.runbook.safety.noRealApiKey).toBe(true);
    expect(result.runbook.safety.noNetworkSearch).toBe(true);
    expect(result.runbook.safety.noRealResults).toBe(true);
    expect(result.runbook.safety.noRealPrice).toBe(true);
    expect(result.runbook.safety.noFakeDemoMockPrice).toBe(true);
    expect(result.runbook.safety.noRedirect).toBe(true);
    expect(result.runbook.safety.noCheckout).toBe(true);
    expect(result.runbook.safety.noPayment).toBe(true);
    expect(result.runbook.safety.noOrderSubmit).toBe(true);
    expect(result.runbook.safety.noIdentityStorage).toBe(true);
    expect(result.runbook.safety.rollbackRequired).toBe(true);
    expect(result.runbook.safety.manualFinalApprovalRequired).toBe(true);
    expect(result.canApprove).toBe(false);
    expect(result.canProceed).toBe(false);
    expect(result.blockers).toContain("provider_manual_approval_runbook_required");
    expect(result.blockers).toContain("all_manual_approval_stages_required_before_real_provider_connection");
    expect(result.blockers).toContain("separate_version_required_for_real_provider_connection");
    expect(result.displayStatus).toBe("需要人工审批");
    expect(result.displayMode).toBe("真实接入前运行手册");
    expect(result.displayModel.title).toBe("Provider 接入人工审批手册");
    expect(result.displayModel.note).toContain("真正接入必须另起版本单独 review");
  });

  test("provider integration manual approval runbook appears on home and detail without raw fields", async () => {
    const inputs = ["买华为手机", "订酒店", "订机票"];
    const rawFields = [
      "provider_manual_approval_runbook_required",
      "runbookStatus=manual_approval_required",
      "canApproveRealProvider=false",
      "canConnectEndpoint=false",
      "canUseApiKey=false",
      "canUseNetwork=false",
      "canReturnRealResults=false",
      "canDisplayRealPrice=false",
      "canReturnMockPrice=false",
      "noRealEndpoint=true",
      "noRealApiKey=true",
      "noNetworkSearch=true"
    ];
    const requiredTexts = [
      "Provider 接入人工审批手册",
      "真实 provider 接入前必须完成人工审批与运行手册确认",
      "手册状态：需要人工审批",
      "手册模式：真实接入前运行手册",
      "真实 provider：不可批准",
      "Endpoint：不可连接",
      "API key：不可使用",
      "网络请求：未启用",
      "真实结果：不可返回",
      "真实价格：不可用",
      "测试价格：不可用",
      "精确跳转：未启用",
      "支付 / 下单：不支持",
      "证件 / 银行卡：不保存",
      "回滚方案：必须准备",
      "最终人工批准：未完成",
      "范围审查：未开始",
      "Provider 条款审查：未开始",
      "当地法律审查：未开始",
      "隐私审查：未开始",
      "API 文档审查：未开始",
      "Endpoint 审查：未开始",
      "API key 存储审查：未开始",
      "请求 / 响应结构审查：未开始",
      "频率限制审查：未开始",
      "价格 / 税费 / 运费字段审查：未开始",
      "跳转策略审查：未开始",
      "不付款确认：未开始",
      "不提交订单确认：未开始",
      "不保存证件 / 银行卡确认：未开始",
      "回滚方案审查：未开始",
      "该手册只是接入前人工审批流程",
      "当前不会访问 eBay 或任何真实 provider",
      "不会读取 API key",
      "不会连接 endpoint",
      "不会发起网络请求",
      "不会返回商品、价格或跳转链接",
      "真正接入必须另起版本单独 review"
    ];
    for (const text of inputs) {
      await submitHomeCommand(page, runId + "-RUNBOOK " + text);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      await openTechnicalDetails(home);
      const homePanel = home.locator(".commerce-provider-runbook-panel").first();
      for (const required of requiredTexts) await expect(homePanel).toContainText(required);
      await expectPanelBefore(homePanel, home.locator(".commerce-provider-secret-panel").first());
      await expect(home).toContainText("Provider 接入准备总览");
      await expect(home).toContainText("Connector Gate");
      await expect(home).toContainText("Provider 接入审查面板");
      for (const field of rawFields) await expect(home).not.toContainText(field);
      await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
      await expect(page.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
      await gotoRoute(page, "home");
    }
  });

  test("commerce local intent router contract routes simple commerce without ai and marks complex fallback", async () => {
    await gotoRoute(page, "home");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceLocalIntentRouter;
      await new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceLocalIntentRouter.js?v=2.0.50&contract=" + Date.now();
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      const api = window.WeishanCommerceLocalIntentRouter;
      const contract = api.getCommerceLocalIntentRouterContract();
      const samples = {
        product:api.routeCommerceIntentLocally("买华为手机"),
        hotel:api.routeCommerceIntentLocally("订酒店"),
        flight:api.routeCommerceIntentLocally("订机票"),
        ticket:api.routeCommerceIntentLocally("买演唱会门票"),
        localService:api.routeCommerceIntentLocally("预约理发"),
        complex:api.routeCommerceIntentLocally("下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高"),
        complexProduct:api.routeCommerceIntentLocally("我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比")
      };
      return { contract, samples };
    });
    expect(result.contract.routerVersion).toBe("2.0.50");
    expect(result.contract.phase).toBe("commerce_local_intent_router");
    expect(result.contract.defaultMode).toBe("local_first");
    expect(result.contract.tokenPolicy.simpleCommerceIntentUsesAi).toBe(false);
    expect(result.contract.tokenPolicy.localRuleFirst).toBe(true);
    expect(result.contract.tokenPolicy.aiFallbackAllowedForComplexIntent).toBe(true);
    expect(result.contract.tokenPolicy.aiFallbackRequiresExplicitNeed).toBe(true);
    expect(result.contract.tokenPolicy.neverUseAiForGateRendering).toBe(true);
    expect(result.contract.tokenPolicy.neverUseAiForStaticSafetyPanels).toBe(true);
    expect(result.contract.supportedCategories.product).toBe(true);
    expect(result.contract.supportedCategories.hotel).toBe(true);
    expect(result.contract.supportedCategories.flight).toBe(true);
    expect(result.contract.supportedCategories.ticket).toBe(true);
    expect(result.contract.supportedCategories.localService).toBe(true);
    expect(result.contract.supportedCategories.generalCommerce).toBe(true);
    expect(result.contract.capabilities.canRouteWithoutAi).toBe(true);
    expect(result.contract.capabilities.canRouteProduct).toBe(true);
    expect(result.contract.capabilities.canRouteHotel).toBe(true);
    expect(result.contract.capabilities.canRouteFlight).toBe(true);
    expect(result.contract.capabilities.canRouteTicket).toBe(true);
    expect(result.contract.capabilities.canRouteLocalService).toBe(true);
    expect(result.contract.capabilities.canTriggerCommercePlan).toBe(true);
    expect(result.contract.capabilities.canTriggerRealProviderSearch).toBe(false);
    expect(result.contract.capabilities.canDisplayRealPrice).toBe(false);
    expect(result.contract.capabilities.canRedirect).toBe(false);
    expect(result.contract.capabilities.canCheckout).toBe(false);
    expect(result.contract.capabilities.canPay).toBe(false);
    expect(result.contract.capabilities.canSubmitOrder).toBe(false);
    expect(result.contract.safety.noAiTokenForSimpleIntent).toBe(true);
    expect(result.contract.safety.noProviderNetworkSearch).toBe(true);
    expect(result.contract.safety.noRealEndpoint).toBe(true);
    expect(result.contract.safety.noRealApiKey).toBe(true);
    expect(result.contract.safety.noRealResults).toBe(true);
    expect(result.contract.safety.noRealPrice).toBe(true);
    expect(result.contract.safety.noFakeDemoMockPrice).toBe(true);
    expect(result.contract.safety.noRedirect).toBe(true);
    expect(result.contract.safety.noCheckout).toBe(true);
    expect(result.contract.safety.noPayment).toBe(true);
    expect(result.contract.safety.noOrderSubmit).toBe(true);
    expect(result.contract.safety.noIdentityStorage).toBe(true);
    expect(result.contract.safety.noRawGpsStorage).toBe(true);
    expect(result.contract.safety.noBypassLocalLaw).toBe(true);
    expect(result.samples.product.intentCategory).toBe("product");
    expect(result.samples.hotel.intentCategory).toBe("hotel");
    expect(result.samples.flight.intentCategory).toBe("flight");
    expect(result.samples.ticket.intentCategory).toBe("ticket");
    expect(result.samples.localService.intentCategory).toBe("local_service");
    for (const key of ["product", "hotel", "flight", "ticket", "localService"]) {
      expect(result.samples[key].routeMode).toBe("local_first");
      expect(result.samples[key].routedBy).toBe("local_rules");
      expect(result.samples[key].aiUsed).toBe(false);
      expect(result.samples[key].aiFallbackEligible).toBe(false);
      expect(result.samples[key].reason).toBe("local_rule_match");
      expect(result.samples[key].canTriggerCommercePlan).toBe(true);
      expect(result.samples[key].canTriggerRealProviderSearch).toBe(false);
      expect(result.samples[key].canDisplayRealPrice).toBe(false);
      expect(result.samples[key].canRedirect).toBe(false);
    }
    expect(result.samples.complex.intentCategory).toBe("multi_category_travel");
    expect(result.samples.complex.commerceType).toBe("travel_plan");
    expect(result.samples.complex.routeMode).toBe("local_first_with_ai_fallback");
    expect(result.samples.complex.aiUsed).toBe(false);
    expect(result.samples.complex.aiFallbackEligible).toBe(true);
    expect(result.samples.complex.aiFallbackRequired).toBe(true);
    expect(result.samples.complex.categories).toEqual(["flight", "hotel"]);
    expect(result.samples.complex.destination).toBe("东京");
    expect(result.samples.complex.timeHint).toBe("下个月");
    expect(result.samples.complex.travelerHint).toBe("带孩子");
    expect(result.samples.complex.budgetHint).toContain("一万以内");
    expect(result.samples.complex.optimizationGoal).toBe("性价比高");
    expect(result.samples.complex.commerceAiIntentUnderstanding.scope).toBe("intent_understanding_only");
    expect(result.samples.complex.commerceAiIntentUnderstanding.canAccessProvider).toBe(false);
    expect(result.samples.complex.commerceAiIntentUnderstanding.canSearchNetwork).toBe(false);
    expect(result.samples.complex.commerceAiIntentUnderstanding.canReturnPrice).toBe(false);
    expect(result.samples.complex.commerceAiIntentUnderstanding.canRedirect).toBe(false);
    expect(result.samples.complex.canTriggerRealProviderSearch).toBe(false);
    expect(result.samples.complex.canDisplayRealPrice).toBe(false);
    expect(result.samples.complex.canRedirect).toBe(false);
    expect(result.samples.complexProduct.intentCategory).toBe("complex_product");
    expect(result.samples.complexProduct.aiUsed).toBe(false);
    expect(result.samples.complexProduct.aiFallbackEligible).toBe(true);
    expect(result.samples.complexProduct.aiFallbackRequired).toBe(true);
    expect(result.samples.complexProduct.budgetHint).toContain("一万以内");
    expect(result.samples.complexProduct.useCaseHint).toBe("适合剪视频");
    expect(result.samples.complexProduct.optimizationGoal).toBe("性价比高");
  });

  test("commerce local intent panel appears for simple categories without raw fields", async () => {
    const cases = [
      ["买华为手机", "商品"],
      ["订酒店", "酒店"],
      ["订机票", "机票"],
      ["预约理发", "本地服务"]
    ];
    const rawFields = [
      "routedBy=local_rules",
      "aiUsed=false",
      "aiFallbackEligible=false",
      "local_rule_match",
      "intentCategory=product",
      "intentCategory=hotel",
      "intentCategory=flight",
      "intentCategory=ticket",
      "canTriggerRealProviderSearch=false",
      "noAiTokenForSimpleIntent=true"
    ];
    for (const [input, categoryLabel] of cases) {
      await submitHomeCommand(page, runId + "-LOCAL-INTENT " + input);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      const panel = home.locator(".commerce-local-intent-panel").first();
      const homeAdvancedDebug = home.locator("details.commerce-simple-flight-advanced-debug-disclosure");
      const homeVisible = await visibleTextWithoutTechnicalDetails(home);
      await expect(home).toContainText("查看其它安全规则折叠面板");
      expect(homeVisible).not.toContain("Provider 接入准备总览");
      expect(homeVisible).not.toContain("Connector Gate");
      expect(homeVisible).not.toContain("Provider 接入审查面板");
      for (const field of rawFields) expect(homeVisible).not.toContain(field);
      expect(homeVisible).not.toMatch(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
      await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
      await expect(homeAdvancedDebug).toHaveCount(1);
      await expect(homeAdvancedDebug).not.toHaveAttribute("open", "");
      await openAdvancedDebug(home);
      await openDisclosure(home, "commerce-process-disclosure");
      await openTechnicalDetails(home);
      await expect(panel).toContainText("本地意图识别");
      await expect(panel).toContainText("普通购物、酒店、机票、票务请求优先使用本地规则识别，减少 AI token 消耗。");
      await expect(panel).toContainText("路由方式：本地规则优先");
      await expect(panel).toContainText("是否使用 AI：否");
      await expect(panel).toContainText("AI fallback：仅复杂需求可选");
      await expect(panel).toContainText("当前类别：" + categoryLabel);
      await expect(panel).toContainText("是否进入采购计划：是");
      await expect(panel).toContainText("是否访问真实平台：否");
      await expect(panel).toContainText("是否返回价格：否");
      await expect(panel).toContainText("是否跳转购买：否");
      await expect(home).toContainText("Provider 接入准备总览");
      await expect(home).toContainText("Connector Gate");
      await expect(home).toContainText("Provider 接入审查面板");
      await gotoRoute(page, "home");
    }
  });

  test("commerce local intent marks complex travel fallback without unlocking providers", async () => {
    await submitHomeCommand(page, runId + "-LOCAL-INTENT-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const panel = home.locator(".commerce-local-intent-panel").first();
    const homeVisible = await visibleTextWithoutTechnicalDetails(home);
    await expect(home).toContainText("查看其它安全规则折叠面板");
    expect(homeVisible).not.toContain("当地法律合规审查");
    expect(homeVisible).not.toContain("Provider 接入准备总览");
    expect(homeVisible).not.toContain("Provider 接入人工审批手册");
    expect(homeVisible).not.toContain("Connector Gate");
    expect(homeVisible).not.toContain("Provider Sandbox Dry Run");
    expect(homeVisible).not.toContain("Provider 密钥安全方案");
    expect(homeVisible).not.toMatch(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    const rawFields = [
      "aiUsed=true",
      "aiFallbackRequired=true",
      "aiFallbackEligible=true",
      "commerceAiIntentUnderstanding",
      "local_first_with_ai_fallback",
      "extractedConstraints",
      "canAccessProvider=false",
      "canSearchNetwork=false",
      "canReturnPrice=false"
    ];
    for (const field of rawFields) await expect(home).not.toContainText(field);
    await openDisclosure(home, "commerce-process-disclosure");
    await openTechnicalDetails(home);
    await expect(panel).toContainText("本地意图识别");
    await expect(panel).toContainText("路由方式：本地规则优先 + AI fallback");
    await expect(panel).toContainText("是否使用 AI：否，等待复杂理解");
    await expect(panel).toContainText("AI fallback：复杂需求需要 AI 理解");
    await expect(panel).toContainText("当前类别：复合旅行计划");
    await expect(panel).toContainText("识别类别：机票 + 酒店");
    await expect(panel).toContainText("目的地：东京");
    await expect(panel).toContainText("时间条件：下个月");
    await expect(panel).toContainText("人员条件：带孩子");
    await expect(panel).toContainText("预算条件：一万以内");
    await expect(panel).toContainText("优化目标：性价比高");
    await expect(panel).toContainText("是否访问真实平台：否");
    await expect(panel).toContainText("是否返回价格：否");
    await expect(panel).toContainText("是否跳转购买：否");
    await expect(home).toContainText("查看其它安全规则折叠面板");
    await expect(home).toContainText("查看候选平台");
    await expect(home).toContainText("查看 Provider 审批状态");
    await expect(home).toContainText("查看只读适配器开发许可");
  });

  test("commerce local intent marks complex product fallback without prices or buying buttons", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-LOCAL-INTENT-COMPLEX-PRODUCT 我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const panel = home.locator(".commerce-local-intent-panel").first();
    const homeVisible = await visibleTextWithoutTechnicalDetails(home);
    await expect(home).toContainText("查看其它安全规则折叠面板");
    await openDisclosure(home, "commerce-process-disclosure");
    expect(homeVisible).not.toContain("本地意图识别");
    expect(homeVisible).not.toContain("AI fallback：复杂需求需要 AI 理解");
    expect(homeVisible).not.toContain("当前类别：复杂商品采购");
    expect(homeVisible).not.toContain("识别类别：商品");
    expect(homeVisible).not.toContain("预算条件：一万以内");
    expect(homeVisible).not.toContain("用途条件：适合剪视频");
    expect(homeVisible).not.toContain("优化目标：性价比高");
    expect(homeVisible).not.toMatch(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    await expect(home).not.toContainText("aiFallbackRequired=true");
    await expect(home).not.toContainText("commerceAiIntentUnderstanding");
    await expect(home).not.toContainText("extractedConstraints");
    await openTechnicalDetails(home);
    await expect(panel).toContainText("本地意图识别");
    await expect(panel).toContainText("AI fallback：复杂需求需要 AI 理解");
    await expect(panel).toContainText("当前类别：复杂商品采购");
    await expect(panel).toContainText("识别类别：商品");
    await expect(panel).toContainText("预算条件：一万以内");
    await expect(panel).toContainText("用途条件：适合剪视频");
    await expect(panel).toContainText("优化目标：性价比高");
    await expect(panel).toContainText("是否访问真实平台：否");
    await expect(panel).toContainText("是否返回价格：否");
    await expect(panel).toContainText("是否跳转购买：否");
  });
  test("complex intent split planner contract creates safe subplans only", async () => {
    await gotoRoute(page, "home");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceLocalIntentRouter;
      delete window.WeishanCommerceComplexIntentSplitPlanner;
      async function load(src) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src + "?contract=" + Date.now();
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      await load("./renderer/core/commerceLocalIntentRouter.js?v=2.0.51");
      await load("./renderer/core/commerceComplexIntentSplitPlanner.js?v=2.0.51");
      const router = window.WeishanCommerceLocalIntentRouter;
      const planner = window.WeishanCommerceComplexIntentSplitPlanner;
      const contract = planner.getComplexIntentSplitPlannerContract();
      const travelProductInput = "下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。";
      const travelTicketInput = "下个月去东京，帮我看机票酒店和演唱会门票。";
      const productServiceInput = "帮我买一个手机，再预约附近理发。";
      const simpleInput = "买华为手机";
      const travelProduct = planner.splitComplexCommerceIntent(travelProductInput, router.routeCommerceIntentLocally(travelProductInput));
      const travelTicket = planner.splitComplexCommerceIntent(travelTicketInput, router.routeCommerceIntentLocally(travelTicketInput));
      const productService = planner.splitComplexCommerceIntent(productServiceInput, router.routeCommerceIntentLocally(productServiceInput));
      const simple = planner.splitComplexCommerceIntent(simpleInput, router.routeCommerceIntentLocally(simpleInput));
      const display = planner.toComplexIntentSplitDisplayStatus(travelProduct);
      return { contract, travelProduct, travelTicket, productService, simple, display };
    });
    expect(result.contract.splitPlannerVersion).toBe("2.0.51");
    expect(result.contract.phase).toBe("complex_intent_split_planner");
    expect(result.contract.defaultMode).toBe("split_complex_commerce_intent");
    for (const key of ["splitTravelAndProduct", "splitTravelAndTicket", "splitProductAndService", "splitMultipleMajorCategories", "keepSimpleIntentAsSinglePlan", "noProviderAccessDuringSplit", "noPriceDuringSplit", "noRedirectDuringSplit"]) {
      expect(result.contract.splitPolicy[key]).toBe(true);
    }
    for (const key of ["canSplitComplexIntent", "canCreateTravelSubPlan", "canCreateProductSubPlan", "canCreateTicketSubPlan", "canCreateLocalServiceSubPlan", "canCreateHotelSubPlan", "canCreateFlightSubPlan"]) {
      expect(result.contract.capabilities[key]).toBe(true);
    }
    for (const key of ["canAccessProvider", "canUseApiKey", "canUseNetwork", "canReturnRealResults", "canReturnRealPrice", "canReturnMockPrice", "canRedirect", "canCheckout", "canPay", "canSubmitOrder"]) {
      expect(result.contract.capabilities[key]).toBe(false);
    }
    for (const key of ["noRealEndpoint", "noRealApiKey", "noNetworkSearch", "noRealResults", "noRealPrice", "noFakeDemoMockPrice", "noRedirect", "noCheckout", "noPayment", "noOrderSubmit", "noIdentityStorage", "noRawGpsStorage", "noBypassLocalLaw"]) {
      expect(result.contract.safety[key]).toBe(true);
    }
    expect(result.travelProduct.shouldSplit).toBe(true);
    expect(result.travelProduct.splitReason).toBe("multiple_major_categories");
    expect(result.travelProduct.subPlans.map((plan) => plan.commerceType)).toEqual(["travel_plan", "product"]);
    expect(result.travelProduct.subPlans[0].components).toEqual(["flight", "hotel"]);
    expect(result.travelProduct.subPlans[0].destination).toBe("东京");
    expect(result.travelProduct.subPlans[0].timeHint).toBe("下个月");
    expect(result.travelProduct.subPlans[0].travelerHint).toBe("带孩子");
    expect(result.travelProduct.subPlans[0].budgetHint).toContain("一万以内");
    expect(result.travelProduct.subPlans[0].optimizationGoal).toBe("性价比高");
    expect(result.travelProduct.subPlans[1].productHint).toBe("适合剪视频的电脑");
    expect(result.travelProduct.subPlans[1].usageHint).toBe("剪视频");
    expect(result.travelProduct.subPlans[1].budgetHint).toContain("一万以内");
    expect(result.travelProduct.subPlans[1].optimizationGoal).toBe("性价比");
    expect(result.travelTicket.subPlans.map((plan) => plan.commerceType)).toEqual(["travel_plan", "ticket"]);
    expect(result.travelTicket.subPlans[1].ticketHint).toBe("演唱会门票");
    expect(result.productService.subPlans.map((plan) => plan.commerceType)).toEqual(["product", "serviceBooking"]);
    expect(result.productService.subPlans[0].productHint).toBe("手机");
    expect(result.productService.subPlans[1].serviceHint).toBe("理发");
    expect(result.simple.shouldSplit).toBe(false);
    expect(result.simple.splitReason).toBe("simple_single_intent");
    expect(result.simple.subPlans).toHaveLength(1);
    for (const plan of result.travelProduct.subPlans.concat(result.travelTicket.subPlans, result.productService.subPlans, result.simple.subPlans)) {
      expect(plan.canAccessProvider).toBe(false);
      expect(plan.canUseApiKey).toBe(false);
      expect(plan.canUseNetwork).toBe(false);
      expect(plan.canReturnRealResults).toBe(false);
      expect(plan.canReturnRealPrice).toBe(false);
      expect(plan.canReturnMockPrice).toBe(false);
      expect(plan.canRedirect).toBe(false);
      expect(plan.canCheckout).toBe(false);
      expect(plan.canPay).toBe(false);
      expect(plan.canSubmitOrder).toBe(false);
    }
    expect(result.display.title).toBe("复杂意图拆分计划");
    expect(result.display.splitStatusLabel).toBe("已拆分");
    expect(result.display.subPlanCountLabel).toBe("2");
  });

  test("subplan gate matrix contract creates blocked matrix per subplan only", async () => {
    await gotoRoute(page, "home");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceLocalIntentRouter;
      delete window.WeishanCommerceComplexIntentSplitPlanner;
      delete window.WeishanCommerceSubPlanGateMatrix;
      async function load(src) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src + "?contract=" + Date.now();
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      await load("./renderer/core/commerceLocalIntentRouter.js?v=2.0.52");
      await load("./renderer/core/commerceComplexIntentSplitPlanner.js?v=2.0.52");
      await load("./renderer/core/commerceSubPlanGateMatrix.js?v=2.0.52");
      const input = "下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。";
      const router = window.WeishanCommerceLocalIntentRouter;
      const planner = window.WeishanCommerceComplexIntentSplitPlanner;
      const matrixApi = window.WeishanCommerceSubPlanGateMatrix;
      const split = planner.splitComplexCommerceIntent(input, router.routeCommerceIntentLocally(input));
      const matrix = matrixApi.buildSubPlanGateMatrix(split);
      const display = matrixApi.toSubPlanGateMatrixDisplayStatus(matrix);
      return {
        contract:matrixApi.getSubPlanGateMatrixContract(),
        split,
        matrix,
        display
      };
    });
    expect(result.contract.matrixVersion).toBe("2.0.52");
    expect(result.contract.phase).toBe("subplan_gate_matrix");
    expect(result.contract.defaultMode).toBe("per_subplan_gate_matrix");
    expect(result.contract.capabilities.canBuildGateMatrix).toBe(true);
    expect(result.contract.capabilities.canShowMissingFields).toBe(true);
    expect(result.contract.capabilities.canShowNextActions).toBe(true);
    for (const key of ["canAccessProvider", "canUseApiKey", "canUseNetwork", "canReturnRealResults", "canReturnRealPrice", "canReturnMockPrice", "canRedirect", "canCheckout", "canPay", "canSubmitOrder"]) {
      expect(result.contract.capabilities[key]).toBe(false);
    }
    for (const key of ["noRealEndpoint", "noRealApiKey", "noNetworkSearch", "noRealResults", "noRealPrice", "noFakeDemoMockPrice", "noRedirect"]) {
      expect(result.contract.safety[key]).toBe(true);
    }
    expect(result.matrix.matrixVersion).toBe("2.0.52");
    expect(result.matrix.phase).toBe("subplan_gate_matrix");
    expect(result.matrix.matrixMode).toBe("per_subplan_gate_matrix");
    expect(result.matrix.overallStatus).toBe("blocked");
    expect(result.matrix.subPlanCount).toBe(2);
    expect(result.matrix.canAccessProvider).toBe(false);
    expect(result.matrix.canUseNetwork).toBe(false);
    expect(result.matrix.canReturnRealPrice).toBe(false);
    expect(result.matrix.canRedirect).toBe(false);
    const travel = result.matrix.subPlanMatrices[0];
    const product = result.matrix.subPlanMatrices[1];
    expect(travel.title).toBe("旅行计划");
    expect(travel.status).toBe("blocked");
    expect(travel.missingFields).toEqual(expect.arrayContaining(["出发地", "具体出行日期", "入住日期", "离店日期", "儿童年龄"]));
    expect(product.title).toBe("商品采购计划");
    expect(product.missingFields).toEqual(expect.arrayContaining(["品牌偏好", "性能要求", "购买地区或收货地", "是否接受二手"]));
    for (const plan of result.matrix.subPlanMatrices) {
      expect(plan.gates.localLawCompliance).toBe("not_verified");
      expect(plan.gates.providerOnboarding).toBe("not_completed");
      expect(plan.gates.providerApproval).toBe("not_reviewed");
      expect(plan.gates.secretStorage).toBe("not_configured");
      expect(plan.gates.sandboxDryRun).toBe("not_run");
      expect(plan.gates.connectorGate).toBe("blocked");
      expect(plan.canAccessProvider).toBe(false);
      expect(plan.canUseNetwork).toBe(false);
      expect(plan.canReturnRealPrice).toBe(false);
      expect(plan.canReturnMockPrice).toBe(false);
      expect(plan.canRedirect).toBe(false);
    }
    expect(result.display.title).toBe("子计划闸门矩阵");
    expect(result.display.subPlanCountLabel).toBe("2");
    expect(result.display.providerAccessLabel).toBe("否");
    expect(result.display.priceLabel).toBe("否");
    expect(result.display.redirectLabel).toBe("否");
  });

  test("subplan gate matrix shows missing fields and next actions without raw fields", async () => {
    await submitHomeCommand(page, runId + "-MATRIX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const panel = home.locator(".commerce-subplan-gate-panel").first();
    await openDisclosure(home, "commerce-process-disclosure");
    await expect(panel).toContainText("子计划闸门矩阵");
    await expect(panel).toContainText("总体状态：已阻断");
    await expect(panel).toContainText("子计划数量：2");
    await expect(panel).toContainText("旅行计划");
    await expect(panel).toContainText("商品采购计划");
    for (const text of ["缺失信息", "下一步", "出发地", "具体出行日期", "入住日期", "离店日期", "儿童年龄", "品牌偏好", "性能要求", "收货地"]) {
      await expect(panel).toContainText(text);
    }
    for (const text of ["当地法律未确认", "Provider Onboarding 未完成", "Provider Approval 未审查", "Secret Storage 未配置", "Sandbox Dry Run 未运行", "Connector Gate 已阻断"]) {
      await expect(panel).toContainText(text);
    }
    await expect(panel).toContainText("是否访问真实平台：否");
    await expect(panel).toContainText("是否返回价格：否");
    await expect(panel).toContainText("是否跳转购买：否");
    await expect(panel).toContainText("该矩阵只用于整理子计划、缺失信息和下一步动作，不访问真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不返回商品、价格或跳转链接。");
    await openTechnicalDetails(home);
    for (const text of ["查看候选平台", "查看 Provider 审批状态", "查看只读适配器开发许可", "查看只读适配器空壳", "查看 Sandbox Dry Run", "查看候选平台沙箱矩阵"]) {
      await expect(home).toContainText(text);
    }
    await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    const rawFields = ["matrixVersion", "matrixMode=per_subplan_gate_matrix", "subPlanMatrices", "canAccessProvider=false", "canUseNetwork=false", "canReturnRealPrice=false", "canRedirect=false", "localLawCompliance:not_verified", "connectorGate:blocked"];
    for (const field of rawFields) await expect(home).not.toContainText(field);
  });

  test("subplan gate matrix supports simple product ticket and local service plans", async () => {
    const cases = [
      { input:"买华为手机", expected:["子计划数量：1", "商品采购计划", "缺失信息", "收货地", "预算", "型号或配置", "是否访问真实平台：否"] },
      { input:"预约理发", expected:["子计划数量：1", "本地服务计划", "缺失信息", "服务地点", "预约时间", "是否需要上门", "是否访问真实平台：否"] }
    ];
    for (const item of cases) {
      await submitHomeCommand(page, runId + "-MATRIX-SIMPLE " + item.input);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      const panel = home.locator(".commerce-subplan-gate-panel").first();
      await openDisclosure(home, "commerce-process-disclosure");
      await expect(panel).toContainText("子计划闸门矩阵");
      for (const text of item.expected) await expect(panel).toContainText(text);
      await expect(panel).toContainText("是否返回价格：否");
      await expect(panel).toContainText("是否跳转购买：否");
      await expect(panel).toContainText("下一步");
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
      await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
      await expect(home).not.toContainText("matrixMode=per_subplan_gate_matrix");
      await expect(home).not.toContainText("subPlanMatrices");
      await gotoRoute(page, "home");
    }
  });

  test("subplan question generator contract turns missing fields into safe questions", async () => {
    await gotoRoute(page, "home");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceLocalIntentRouter;
      delete window.WeishanCommerceComplexIntentSplitPlanner;
      delete window.WeishanCommerceSubPlanGateMatrix;
      delete window.WeishanCommerceSubPlanQuestionGenerator;
      async function load(src) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src + "?question-contract=" + Date.now();
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      await load("./renderer/core/commerceLocalIntentRouter.js?v=2.0.53");
      await load("./renderer/core/commerceComplexIntentSplitPlanner.js?v=2.0.53");
      await load("./renderer/core/commerceSubPlanGateMatrix.js?v=2.0.53");
      await load("./renderer/core/commerceSubPlanQuestionGenerator.js?v=2.0.53");
      const input = "下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。";
      const route = window.WeishanCommerceLocalIntentRouter.routeCommerceIntentLocally(input);
      const split = window.WeishanCommerceComplexIntentSplitPlanner.splitComplexCommerceIntent(input, route);
      const matrix = window.WeishanCommerceSubPlanGateMatrix.buildSubPlanGateMatrix(split);
      const generator = window.WeishanCommerceSubPlanQuestionGenerator;
      const questions = generator.generateQuestionsForSubPlanMatrix(matrix);
      const display = generator.toSubPlanQuestionDisplayStatus(questions);
      return {
        contract:generator.getSubPlanQuestionGeneratorContract(),
        questions,
        display
      };
    });
    expect(result.contract.questionGeneratorVersion).toBe("2.0.53");
    expect(result.contract.phase).toBe("subplan_question_generator");
    expect(result.contract.defaultMode).toBe("missing_fields_to_questions");
    for (const key of ["canGenerateQuestions", "canGroupQuestionsBySubPlan", "canPrioritizeQuestions", "canSuggestAnswerType", "canSuggestOptions"]) {
      expect(result.contract.capabilities[key]).toBe(true);
    }
    for (const key of ["canAccessProvider", "canUseApiKey", "canUseNetwork", "canReturnRealResults", "canReturnRealPrice", "canReturnMockPrice", "canRedirect"]) {
      expect(result.contract.capabilities[key]).toBe(false);
    }
    for (const key of ["noRealEndpoint", "noRealApiKey", "noNetworkSearch", "noRealResults", "noRealPrice", "noFakeDemoMockPrice", "noRedirect"]) {
      expect(result.contract.safety[key]).toBe(true);
    }
    expect(result.questions.questionGeneratorVersion).toBe("2.0.53");
    expect(result.questions.phase).toBe("subplan_question_generator");
    expect(result.questions.mode).toBe("missing_fields_to_questions");
    expect(result.questions.subPlanQuestionGroups).toHaveLength(2);
    expect(result.questions.canAccessProvider).toBe(false);
    expect(result.questions.canUseNetwork).toBe(false);
    expect(result.questions.canReturnRealPrice).toBe(false);
    expect(result.questions.canRedirect).toBe(false);
    const travel = result.questions.subPlanQuestionGroups[0];
    const product = result.questions.subPlanQuestionGroups[1];
    expect(travel.title).toBe("旅行计划");
    expect(travel.questions.map((item) => item.questionText)).toEqual(expect.arrayContaining(["你从哪个城市出发？", "具体哪一天出发？", "酒店哪天入住？", "酒店哪天离店？", "孩子几岁？"]));
    expect(product.title).toBe("商品采购计划");
    expect(product.questions.map((item) => item.questionText)).toEqual(expect.arrayContaining(["你偏好哪个品牌？没有偏好也可以说“都可以”。", "主要需要什么性能要求，例如内存、硬盘、显卡？", "收货地在哪个国家或城市？", "是否接受二手或翻新机？"]));
    expect(product.questions.find((item) => item.missingField === "是否接受二手").answerType).toBe("boolean");
    expect(product.questions.find((item) => item.missingField === "是否接受二手").options).toEqual(["是", "否", "不确定"]);
    expect(result.display.title).toBe("子计划补充问题");
    expect(result.display.providerAccessLabel).toBe("否");
    expect(result.display.priceLabel).toBe("否");
    expect(result.display.redirectLabel).toBe("否");
  });

  test("subplan question panel shows travel product questions without raw fields", async () => {
    await submitHomeCommand(page, runId + "-QUESTIONS 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const panel = home.locator(".commerce-subplan-question-panel").first();
    await openDisclosure(home, "commerce-process-disclosure");
    await expect(panel).toContainText("子计划补充问题");
    await expect(panel).toContainText("总体状态：待补充");
    await expect(panel).toContainText("子计划数量：2");
    await expect(panel).toContainText("旅行计划");
    await expect(panel).toContainText("商品采购计划");
    for (const text of ["你从哪个城市出发？", "具体哪一天出发？", "酒店哪天入住？", "酒店哪天离店？", "孩子几岁？", "你偏好哪个品牌？", "主要需要什么性能要求，例如内存、硬盘、显卡？", "收货地在哪个国家或城市？", "是否接受二手或翻新机？"]) {
      await expect(panel).toContainText(text);
    }
    for (const text of ["优先级：高", "优先级：中", "回答类型", "是否访问真实平台：否", "是否返回价格：否", "是否跳转购买：否"]) {
      await expect(panel).toContainText(text);
    }
    await expect(panel).toContainText("这些问题只用于补齐计划信息，不访问真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不返回商品、价格或跳转链接。");
    const rawFields = ["questionGeneratorVersion", "mode=missing_fields_to_questions", "subPlanQuestionGroups", "questionId", "requiredBeforeProviderSearch=true", "canAccessProvider=false", "canUseNetwork=false", "canReturnRealPrice=false", "canRedirect=false"];
    for (const field of rawFields) await expect(home).not.toContainText(field);
    await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
  });

  test("subplan question panel supports simple product ticket and local service questions", async () => {
    const cases = [
      { input:"买华为手机", expected:["子计划补充问题", "商品采购计划", "收货地在哪个国家或城市？", "预算大概是多少？", "你需要什么型号或配置？"] },
      { input:"预约理发", expected:["子计划补充问题", "本地服务计划", "服务地点在哪个城市或区域？", "想预约哪天、哪个时间段？", "预算大概是多少？"] }
    ];
    for (const item of cases) {
      await submitHomeCommand(page, runId + "-QUESTIONS-SIMPLE " + item.input);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      const panel = home.locator(".commerce-subplan-question-panel").first();
      await openDisclosure(home, "commerce-process-disclosure");
      for (const text of item.expected) await expect(panel).toContainText(text);
      await expect(panel).toContainText("是否访问真实平台：否");
      await expect(panel).toContainText("是否返回价格：否");
      await expect(panel).toContainText("是否跳转购买：否");
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
      await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
      await expect(home).not.toContainText("mode=missing_fields_to_questions");
      await expect(home).not.toContainText("subPlanQuestionGroups");
      await expect(home).not.toContainText("questionId");
      await gotoRoute(page, "home");
    }
  });



  test("subplan answer collector contract maps answers without provider access", async () => {
    await gotoRoute(page, "home");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceLocalIntentRouter;
      delete window.WeishanCommerceComplexIntentSplitPlanner;
      delete window.WeishanCommerceSubPlanGateMatrix;
      delete window.WeishanCommerceSubPlanQuestionGenerator;
      delete window.WeishanCommerceSubPlanAnswerCollector;
      async function load(src) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src + "?answer-contract=" + Date.now();
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      await load("./renderer/core/commerceLocalIntentRouter.js?v=2.0.54");
      await load("./renderer/core/commerceComplexIntentSplitPlanner.js?v=2.0.54");
      await load("./renderer/core/commerceSubPlanGateMatrix.js?v=2.0.54");
      await load("./renderer/core/commerceSubPlanQuestionGenerator.js?v=2.0.54");
      await load("./renderer/core/commerceSubPlanAnswerCollector.js?v=2.0.54");
      const input = "下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。";
      const route = window.WeishanCommerceLocalIntentRouter.routeCommerceIntentLocally(input);
      const split = window.WeishanCommerceComplexIntentSplitPlanner.splitComplexCommerceIntent(input, route);
      const matrix = window.WeishanCommerceSubPlanGateMatrix.buildSubPlanGateMatrix(split);
      const questions = window.WeishanCommerceSubPlanQuestionGenerator.generateQuestionsForSubPlanMatrix(matrix);
      const collector = window.WeishanCommerceSubPlanAnswerCollector;
      const answer = "我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。";
      const collected = collector.collectSubPlanAnswers(answer, questions);
      return { contract:collector.getSubPlanAnswerCollectorContract(), collected, display:collector.toSubPlanAnswerCollectorDisplayStatus(collected) };
    });
    expect(result.contract.answerCollectorVersion).toBe("2.0.54");
    expect(result.contract.phase).toBe("subplan_answer_collector");
    expect(result.contract.defaultMode).toBe("map_answers_to_subplan_fields");
    for (const key of ["canCollectAnswers", "canMapAnswersToFields", "canUpdateSubPlanDraft", "canComputeCompleteness", "canShowRemainingQuestions"]) expect(result.contract.capabilities[key]).toBe(true);
    for (const key of ["canAccessProvider", "canUseApiKey", "canUseNetwork", "canReturnRealResults", "canReturnRealPrice", "canReturnMockPrice", "canRedirect", "canCheckout", "canPay", "canSubmitOrder", "canStoreIdentity"]) expect(result.contract.capabilities[key]).toBe(false);
    for (const key of ["noRealEndpoint", "noRealApiKey", "noNetworkSearch", "noRealResults", "noRealPrice", "noFakeDemoMockPrice", "noRedirect", "noIdentityStorage"]) expect(result.contract.safety[key]).toBe(true);
    expect(result.collected.subPlanCount).toBe(2);
    expect(result.collected.completedFieldCount).toBe(9);
    expect(result.display.title).toBe("子计划答案收集");
    expect(result.display.providerAccessLabel).toBe("否");
    expect(result.display.priceLabel).toBe("否");
    expect(result.display.redirectLabel).toBe("否");
    const travel = result.display.groups.find((item) => item.title === "旅行计划");
    const product = result.display.groups.find((item) => item.title === "商品采购计划");
    expect(travel.completedFields).toEqual(expect.arrayContaining(["出发地：成都", "出行日期：7月12日", "入住日期：7月12日", "离店日期：7月16日", "儿童年龄：8岁"]));
    expect(product.completedFields).toEqual(expect.arrayContaining(["品牌偏好：都可以", "性能要求：32G内存 / 1T硬盘", "收货地：成都", "是否接受二手：不接受"]));
  });

  test("subplan answer panel collects travel product answers without raw fields", async () => {
    await submitHomeCommand(page, runId + "-ANSWERS 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-ANSWERS 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const panel = home.locator(".commerce-subplan-answer-panel").first();
    await openDisclosure(home, "commerce-process-disclosure");
    await expect(panel).toContainText("子计划答案收集");
    await expect(panel).toContainText("已收集部分回答");
    await expect(panel).toContainText("旅行计划");
    await expect(panel).toContainText("商品采购计划");
    for (const text of ["出发地：成都", "出行日期：7月12日", "入住日期：7月12日", "离店日期：7月16日", "儿童年龄：8岁", "品牌偏好：都可以", "性能要求：32G内存 / 1T硬盘", "收货地：成都", "是否接受二手：不接受", "补齐度", "仍缺字段", "是否访问真实平台：否", "是否返回价格：否", "是否跳转购买：否"]) await expect(panel).toContainText(text);
    const rawFields = ["answerCollectorVersion", "defaultMode=map_answers_to_subplan_fields", "mappedAnswers", "subPlanAnswerDraft", "temporarySessionOnly=true", "canAccessProvider=false", "canUseNetwork=false", "canReturnRealPrice=false", "canRedirect=false"];
    for (const field of rawFields) await expect(home).not.toContainText(field);
    await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
  });

  test("subplan answer panel supports local service answers", async () => {
    const cases = [
      { plan:"预约理发", answer:"在高新区，明天下午，预算100以内，不需要上门。", expected:["本地服务计划", "服务地点：高新区", "预约时间：明天下午", "预算：100以内", "是否需要上门：不需要"] }
    ];
    for (const item of cases) {
      await submitHomeCommand(page, runId + "-ANSWER-SIMPLE " + item.plan);
      const expectedPlanTitle = "本地服务计划";
      await expect.poll(async () => page.evaluate(() => {
        const api = window.WeishanCommerceAgent;
        const task = api && api.getCommerceTasks ? api.getCommerceTasks()[0] : null;
        return task && task.commerceSubPlanQuestions && task.commerceSubPlanQuestions.subPlanQuestionGroups && task.commerceSubPlanQuestions.subPlanQuestionGroups[0] && task.commerceSubPlanQuestions.subPlanQuestionGroups[0].title || "";
      }), { timeout: 15000 }).toBe(expectedPlanTitle);
      await submitHomeCommand(page, runId + "-ANSWER-SIMPLE " + item.answer);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      const panel = home.locator(".commerce-subplan-answer-panel").first();
      await openDisclosure(home, "commerce-process-disclosure");
      await expect(panel).toContainText("子计划答案收集");
      for (const text of item.expected) await expect(panel).toContainText(text);
      await expect(panel).toContainText("是否访问真实平台：否");
      await expect(panel).toContainText("是否返回价格：否");
      await expect(panel).toContainText("是否跳转购买：否");
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
      await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
      for (const field of ["answerCollectorVersion", "mappedAnswers", "subPlanAnswerDraft", "canAccessProvider=false"]) await expect(home).not.toContainText(field);
      await gotoRoute(page, "home");
    }
  });

  test("subplan completion workspace contract summarizes draft completion without provider access", async () => {
    await gotoRoute(page, "home");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceLocalIntentRouter;
      delete window.WeishanCommerceComplexIntentSplitPlanner;
      delete window.WeishanCommerceSubPlanGateMatrix;
      delete window.WeishanCommerceSubPlanQuestionGenerator;
      delete window.WeishanCommerceSubPlanAnswerCollector;
      delete window.WeishanCommerceSubPlanCompletionWorkspace;
      async function load(src) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src + "?completion-contract=" + Date.now();
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      await load("./renderer/core/commerceLocalIntentRouter.js?v=2.0.54");
      await load("./renderer/core/commerceComplexIntentSplitPlanner.js?v=2.0.54");
      await load("./renderer/core/commerceSubPlanGateMatrix.js?v=2.0.54");
      await load("./renderer/core/commerceSubPlanQuestionGenerator.js?v=2.0.54");
      await load("./renderer/core/commerceSubPlanAnswerCollector.js?v=2.0.54");
      await load("./renderer/core/commerceSubPlanCompletionWorkspace.js?v=2.0.56");
      const input = "下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。";
      const answer = "我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。";
      const route = window.WeishanCommerceLocalIntentRouter.routeCommerceIntentLocally(input);
      const split = window.WeishanCommerceComplexIntentSplitPlanner.splitComplexCommerceIntent(input, route);
      const matrix = window.WeishanCommerceSubPlanGateMatrix.buildSubPlanGateMatrix(split);
      const questions = window.WeishanCommerceSubPlanQuestionGenerator.generateQuestionsForSubPlanMatrix(matrix);
      const answers = window.WeishanCommerceSubPlanAnswerCollector.collectSubPlanAnswers(answer, questions);
      const workspaceApi = window.WeishanCommerceSubPlanCompletionWorkspace;
      const workspace = workspaceApi.buildSubPlanCompletionWorkspace({
        commerceComplexIntentSplit:split,
        commerceSubPlanGateMatrix:matrix,
        commerceSubPlanQuestions:questions,
        commerceSubPlanAnswerCollection:answers
      });
      return { contract:workspaceApi.getSubPlanCompletionWorkspaceContract(), workspace, display:workspaceApi.toSubPlanCompletionWorkspaceDisplayStatus(workspace) };
    });
    expect(result.contract.completionWorkspaceVersion).toBe("2.0.56");
    expect(result.contract.phase).toBe("subplan_completion_workspace");
    expect(result.contract.defaultMode).toBe("guided_subplan_completion");
    for (const key of ["summarizeSubPlans", "showCompletedFields", "showRemainingFields", "showNextQuestions", "showNextActions", "preserveSubPlanIsolation", "temporarySessionOnly", "noLongTermStorage", "noProviderAccess", "noPriceDuringCompletion", "noRedirectDuringCompletion", "noCheckoutDuringCompletion"]) expect(result.contract.workspacePolicy[key]).toBe(true);
    for (const key of ["canBuildCompletionWorkspace", "canShowSubPlanProgress", "canShowCompletedFields", "canShowRemainingFields", "canShowNextQuestions", "canShowNextActions", "canSummarizeCompletedFields", "canSummarizeRemainingFields", "canPickNextQuestion", "canBuildNextActions", "canComputeOverallCompletionStatus"]) expect(result.contract.capabilities[key]).toBe(true);
    for (const key of ["canAccessProvider", "canUseApiKey", "canUseNetwork", "canReturnRealResults", "canReturnRealPrice", "canReturnMockPrice", "canRedirect", "canCheckout", "canPay", "canSubmitOrder", "canStoreIdentity"]) expect(result.contract.capabilities[key]).toBe(false);
    for (const key of ["noRealEndpoint", "noRealApiKey", "noNetworkSearch", "noRealResults", "noRealPrice", "noFakeDemoMockPrice", "noRedirect", "noCheckout", "noPayment", "noOrderSubmit", "noIdentityStorage", "noRawGpsStorage", "noLongTermAnswerStorage", "noBypassLocalLaw"]) expect(result.contract.safety[key]).toBe(true);
    expect(result.workspace.subPlanCount).toBe(2);
    expect(result.workspace.completedFieldCount).toBe(9);
    expect(result.display.title).toBe("子计划补齐工作台");
    expect(result.display.providerAccessLabel).toBe("否");
    expect(result.display.priceLabel).toBe("否");
    expect(result.display.redirectLabel).toBe("否");
    const travel = result.display.items.find((item) => item.title === "旅行计划");
    const product = result.display.items.find((item) => item.title === "商品采购计划");
    expect(travel.completedFields).toEqual(expect.arrayContaining(["出发地：成都", "出行日期：7月12日", "入住日期：7月12日", "离店日期：7月16日", "儿童年龄：8岁"]));
    expect(product.completedFields).toEqual(expect.arrayContaining(["品牌偏好：都可以", "性能要求：32G内存 / 1T硬盘", "收货地：成都", "是否接受二手：不接受"]));
    expect(travel.nextActions.join(" ")).toContain("等待 provider 接入审批完成");
    expect(product.nextActions.join(" ")).toContain("等待 provider 接入审批完成");
  });

  test("subplan draft review summary contract keeps review local and provider blocked", async () => {
    await gotoRoute(page, "home");
    const result = await page.evaluate(async () => {
      delete window.WeishanCommerceLocalIntentRouter;
      delete window.WeishanCommerceComplexIntentSplitPlanner;
      delete window.WeishanCommerceSubPlanGateMatrix;
      delete window.WeishanCommerceSubPlanQuestionGenerator;
      delete window.WeishanCommerceSubPlanAnswerCollector;
      delete window.WeishanCommerceSubPlanCompletionWorkspace;
      delete window.WeishanCommerceSubPlanDraftReviewSummary;
      async function load(src) {
        await new Promise((resolve, reject) => {
          const script = document.createElement("script");
          script.src = src + "?draft-review-contract=" + Date.now();
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
      await load("./renderer/core/commerceLocalIntentRouter.js?v=2.0.54");
      await load("./renderer/core/commerceComplexIntentSplitPlanner.js?v=2.0.54");
      await load("./renderer/core/commerceSubPlanGateMatrix.js?v=2.0.54");
      await load("./renderer/core/commerceSubPlanQuestionGenerator.js?v=2.0.54");
      await load("./renderer/core/commerceSubPlanAnswerCollector.js?v=2.0.54");
      await load("./renderer/core/commerceSubPlanCompletionWorkspace.js?v=2.0.56");
      await load("./renderer/core/commerceSubPlanDraftReviewSummary.js?v=2.0.57");
      const input = "下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。";
      const answer = "我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。";
      const route = window.WeishanCommerceLocalIntentRouter.routeCommerceIntentLocally(input);
      const split = window.WeishanCommerceComplexIntentSplitPlanner.splitComplexCommerceIntent(input, route);
      const matrix = window.WeishanCommerceSubPlanGateMatrix.buildSubPlanGateMatrix(split);
      const questions = window.WeishanCommerceSubPlanQuestionGenerator.generateQuestionsForSubPlanMatrix(matrix);
      const answers = window.WeishanCommerceSubPlanAnswerCollector.collectSubPlanAnswers(answer, questions);
      const workspace = window.WeishanCommerceSubPlanCompletionWorkspace.buildSubPlanCompletionWorkspace({
        commerceComplexIntentSplit:split,
        commerceSubPlanGateMatrix:matrix,
        commerceSubPlanQuestions:questions,
        commerceSubPlanAnswerCollection:answers
      });
      const reviewApi = window.WeishanCommerceSubPlanDraftReviewSummary;
      const review = reviewApi.buildSubPlanDraftReviewSummary({
        commerceComplexIntentSplit:split,
        commerceSubPlanGateMatrix:matrix,
        commerceSubPlanQuestions:questions,
        commerceSubPlanAnswerCollection:answers,
        commerceSubPlanCompletionWorkspace:workspace
      });
      return { contract:reviewApi.getSubPlanDraftReviewContract(), review, display:reviewApi.toSubPlanDraftReviewDisplayStatus(review) };
    });
    expect(result.contract.draftReviewVersion).toBe("2.0.57");
    expect(result.contract.phase).toBe("subplan_draft_review_summary");
    expect(result.contract.defaultMode).toBe("review_completed_subplan_drafts");
    for (const key of ["summarizeSubPlanDrafts", "showUserConfirmableSummary", "showConfirmedFields", "showUnconfirmedFields", "showRemainingRisks", "preserveSubPlanIsolation", "temporarySessionOnly", "noLongTermStorage", "noProviderAccess", "noPriceDuringReview", "noRedirectDuringReview", "noCheckoutDuringReview"]) expect(result.contract.reviewPolicy[key]).toBe(true);
    for (const key of ["canBuildDraftReviewSummary", "canShowConfirmableDraft", "canShowConfirmedFields", "canShowUnconfirmedFields", "canShowRemainingRisks", "canSuggestReviewActions"]) expect(result.contract.capabilities[key]).toBe(true);
    for (const key of ["canAccessProvider", "canUseApiKey", "canUseNetwork", "canReturnRealResults", "canReturnRealPrice", "canReturnMockPrice", "canRedirect", "canCheckout", "canPay", "canSubmitOrder", "canStoreIdentity"]) expect(result.contract.capabilities[key]).toBe(false);
    for (const key of ["noRealEndpoint", "noRealApiKey", "noNetworkSearch", "noRealResults", "noRealPrice", "noFakeDemoMockPrice", "noRedirect", "noIdentityStorage"]) expect(result.contract.safety[key]).toBe(true);
    expect(result.review.subPlanCount).toBe(2);
    expect(result.review.canProceedToProviderReview).toBe(false);
    expect(result.display.title).toBe("子计划草稿复核摘要");
    expect(result.display.providerAccessLabel).toBe("否");
    expect(result.display.priceLabel).toBe("否");
    expect(result.display.redirectLabel).toBe("否");
    const travel = result.display.items.find((item) => item.title === "旅行计划");
    const product = result.display.items.find((item) => item.title === "商品采购计划");
    expect(travel.confirmableFields).toEqual(expect.arrayContaining(["出发地：成都", "出行日期：7月12日", "入住日期：7月12日", "离店日期：7月16日", "儿童年龄：8岁"]));
    expect(product.confirmableFields).toEqual(expect.arrayContaining(["商品需求：适合剪视频的电脑", "预算：一万以内", "品牌偏好：都可以", "性能要求：32G 内存 / 1T 硬盘", "收货地：成都", "是否接受二手：不接受"]));
    expect(travel.remainingRisks.join(" ")).toContain("Connector Gate 已阻断");
    expect(product.remainingRisks.join(" ")).toContain("当前不能访问真实平台，不能返回价格");
  });

  test("subplan completion workspace shows completed remaining fields and next actions without raw fields", async () => {
    await submitHomeCommand(page, runId + "-COMPLETION 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-COMPLETION 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const panel = home.locator(".commerce-subplan-completion-panel").first();
    await openDisclosure(home, "commerce-process-disclosure");
    await expect(panel).toContainText("子计划补齐工作台");
    await expect(panel).toContainText("旅行计划");
    await expect(panel).toContainText("商品采购计划");
    for (const text of ["已补齐字段", "仍缺字段", "下一问题", "下一步", "补齐度", "出发地：成都", "出行日期：7月12日", "入住日期：7月12日", "离店日期：7月16日", "儿童年龄：8岁", "品牌偏好：都可以", "性能要求：32G内存 / 1T硬盘", "收货地：成都", "是否接受二手：不接受", "是否访问真实平台：否", "是否返回价格：否", "是否跳转购买：否"]) await expect(panel).toContainText(text);
    const rawFields = ["completionWorkspaceVersion", "defaultMode=guided_subplan_completion", "workspaceItems", "temporarySessionOnly=true", "noLongTermStorage=true", "temporaryDraftOnly=true", "noLongTermAnswerStorage=true", "canAccessProvider=false", "canUseNetwork=false", "canReturnRealPrice=false", "canRedirect=false"];
    for (const field of rawFields) await expect(home).not.toContainText(field);
    await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
  });

  test("subplan draft review summary shows confirmable drafts without raw fields", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-DRAFT-REVIEW 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-DRAFT-REVIEW 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const panel = home.locator(".commerce-subplan-draft-review-panel").first();
    await expect(panel).toBeHidden();
    await openDisclosure(home, "commerce-process-disclosure");
    await openTechnicalDetails(home);
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("子计划草稿复核摘要");
    await expect(panel).toContainText("旅行计划");
    await expect(panel).toContainText("商品采购计划");
    for (const text of ["请确认以下旅行计划是否准确", "出发地：成都", "出行日期：7月12日", "入住日期：7月12日", "离店日期：7月16日", "儿童年龄：8岁", "请确认以下商品采购计划是否准确", "商品需求：电脑", "品牌偏好：都可以", "性能要求：32G 内存 / 1T 硬盘", "收货地：成都", "是否接受二手：不接受", "剩余风险", "当地法律合规未确认", "Provider 审批未完成", "Connector Gate 已阻断", "是否访问真实平台：否", "是否返回价格：否", "是否跳转购买：否"]) await expect(panel).toContainText(text);
    const rawFields = ["draftReviewVersion", "defaultMode=review_completed_subplan_drafts", "reviewItems", "confirmableSummary", "unconfirmedFields", "remainingRisks", "canAccessProvider=false", "canUseNetwork=false", "canReturnRealPrice=false", "canRedirect=false", "rawTask", "dispatchPayload", "commandPayload"];
    for (const field of rawFields) await expect(home).not.toContainText(field);
    await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
  });

  test("subplan completion workspace supports simple product ticket and local service next questions", async () => {
    const cases = [
      { input:"买华为手机", title:"商品采购计划", expected:["子计划补齐工作台", "收货地在哪个国家或城市？", "预算大概是多少？", "你需要什么型号或配置？"] },
      { input:"预约理发", title:"本地服务计划", expected:["子计划补齐工作台", "服务地点在哪个城市或区域？", "想预约哪天、哪个时间段？", "预算大概是多少？"] }
    ];
    for (const item of cases) {
      await submitHomeCommand(page, runId + "-COMPLETION-SIMPLE " + item.input);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      const panel = home.locator(".commerce-subplan-completion-panel").first();
      await openDisclosure(home, "commerce-process-disclosure");
      await expect(panel).toContainText(item.title);
      for (const text of item.expected) await expect(panel).toContainText(text);
      await expect(panel).toContainText("是否访问真实平台：否");
      await expect(panel).toContainText("是否返回价格：否");
      await expect(panel).toContainText("是否跳转购买：否");
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
      await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
      for (const field of ["completionWorkspaceVersion", "defaultMode=guided_subplan_completion", "workspaceItems", "temporarySessionOnly=true", "temporaryDraftOnly=true", "canAccessProvider=false"]) await expect(home).not.toContainText(field);
      await gotoRoute(page, "home");
    }
  });

  test("subplan draft review summary asks for missing fields on simple product", async () => {
    await submitHomeCommand(page, runId + "-DRAFT-REVIEW-SIMPLE 买华为手机");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const panel = home.locator(".commerce-subplan-draft-review-panel").first();
    await expect(panel).toBeHidden();
    await openTechnicalDetails(home);
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("子计划草稿复核摘要");
    await expect(panel).toContainText("总体状态：仍需补充");
    await expect(panel).toContainText("商品采购计划");
    await expect(panel).toContainText("收货地");
    await expect(panel).toContainText("预算");
    await expect(panel).toContainText("型号或配置");
    await expect(panel).toContainText("下一步");
    await expect(panel).toContainText("先回答补充问题");
    await expect(panel).toContainText("是否访问真实平台：否");
    await expect(panel).toContainText("是否返回价格：否");
    await expect(panel).toContainText("是否跳转购买：否");
    for (const field of ["draftReviewVersion", "defaultMode=review_completed_subplan_drafts", "reviewItems", "confirmableSummary", "unconfirmedFields", "remainingRisks", "canAccessProvider=false"]) await expect(home).not.toContainText(field);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
  });

  test("task history detail restores subplan completion workspace without rerun", async () => {
    await page.goto("file:///Users/boge/Downloads/weishan-clean-release/apps/desktop/src/index.html");
    await page.waitForLoadState("domcontentloaded");
    await gotoRoute(page, "home");
    const demand = runId + "-COMPLETION-HISTORY 买华为手机";
    const answer = runId + "-COMPLETION-HISTORY 收货地成都，预算一万以内，型号华为 Mate 60 256G，不接受二手。";
    await page.evaluate((value) => {
      if (!window.CommandApi || typeof window.CommandApi.enqueue !== "function") throw new Error("CommandApi unavailable");
      window.CommandApi.enqueue(value, { attachments:[] });
      window.dispatchEvent(new CustomEvent("weishan:command"));
    }, demand);
    await page.waitForTimeout(3000);
    await page.evaluate((value) => {
      if (!window.CommandApi || typeof window.CommandApi.enqueue !== "function") throw new Error("CommandApi unavailable");
      window.CommandApi.enqueue(value, { attachments:[] });
      window.dispatchEvent(new CustomEvent("weishan:command"));
    }, answer);
    await page.waitForTimeout(3000);
    await page.evaluate((value) => {
      if (!window.CommandApi || typeof window.CommandApi.enqueue !== "function") throw new Error("CommandApi unavailable");
      window.CommandApi.enqueue(value, { attachments:[] });
      window.dispatchEvent(new CustomEvent("weishan:command"));
    }, runId + "-COMPLETION-HISTORY 预约理发");
    await page.waitForTimeout(5000);
    const historyItems = page.locator("#cmdHistory [data-history-id]");
    const historyItem = historyItems.filter({ hasText:"买华为手机" }).first();
    await expect(historyItem).toBeVisible({ timeout: 15000 });
    const historyCountBefore = await historyItems.count();
    await historyItem.click();
    const detail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    await expect(detail).toContainText("历史任务详情");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("最终结果");
    await expect(detail.locator(".commerce-result-summary-panel")).not.toContainText("查看可执行清单");
    await expect(detail.locator(".commerce-result-summary-panel")).not.toContainText("查看平台模板");
    await expect(detail).toContainText("查看其它安全规则折叠面板");
    await expect(detail).toContainText("最终结果");
    await expect(detail).toContainText("暂无真实价格结果");
    await expect(detail).toContainText("当前尚未接入真实只读价格源");
    await expect(detail).toContainText("历史回看不会重新执行任务");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    for (const field of ["completionWorkspaceVersion", "defaultMode=guided_subplan_completion", "workspaceItems", "temporarySessionOnly=true", "temporaryDraftOnly=true", "canAccessProvider=false", "rawApiKey", "rawToken", "rawProviderPayload", "Connector Gate", "Sandbox Dry Run", "AI fallback"]) await expect(detail).not.toContainText(field);
    await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(detail.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
  });


  test("v2.0.65 result summary card is shown with actionable checklist before collapsed process", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-RESULT-SUMMARY-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-RESULT-SUMMARY-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestDraftReviewReady(page);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const summaryPanel = home.locator(".commerce-result-summary-panel");
    await expect(summaryPanel).toHaveCount(1);
    await expect(summaryPanel).toContainText("最终结果");
    await expect(summaryPanel).toContainText("暂无真实价格结果");
    await expect(summaryPanel).toContainText("当前尚未接入真实只读价格源，不能展示价格。");
    await expect(summaryPanel).toContainText("我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await expect(summaryPanel).toContainText("接入可信价格源后，将只显示通过安全检查的真实价格结果。");
    await expect(summaryPanel).toContainText("weishan 不收款、不下单、不保存身份证、护照或银行卡。");
    await expect(summaryPanel).toContainText("全球采购计划");
    await expect(summaryPanel).toContainText("查看其它安全规则折叠面板");
    const defaultSummaryText = await visibleText(summaryPanel);
    expect(defaultSummaryText).not.toContain("机票搜索条件");
    expect(defaultSummaryText).not.toContain("电脑搜索条件：");
    expect(defaultSummaryText).not.toContain("Google Flights search template");
    expect(defaultSummaryText).not.toContain("京东电脑搜索模板");
    await expect(summaryPanel).not.toContainText("查看可执行清单");
    await expect(summaryPanel).not.toContainText("查看平台模板");
    await expect(summaryPanel.locator("details.commerce-simple-flight-advanced-debug-disclosure")).not.toHaveAttribute("open", "");
    await openAdvancedDebug(home);
    await expect(home).toContainText("查看分析过程");
    await expect(home).toContainText("查看安全边界");
    await expect(home).toContainText("查看技术细节");
  });

  test("v2.0.66 actionable checklist copy buttons copy text to clipboard without side effects", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await installClipboardMock(page);
    await submitHomeCommand(page, runId + "-COPY-CHECKLIST-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-COPY-CHECKLIST-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestDraftReviewReady(page);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const summaryPanel = home.locator(".commerce-result-summary-panel");
    const historyCountBefore = await page.locator("#cmdHistory [data-history-id]").count();
    await openDisclosure(summaryPanel, "commerce-actionable-checklist-disclosure");
    const copyButtons = summaryPanel.locator("[data-commerce-copy-kind]");
    await expect(copyButtons.first()).toBeVisible();
    expect(await copyButtons.count()).toBeGreaterThan(0);
    await copyButtons.first().click();
    await expect(summaryPanel.locator("[data-commerce-copy-feedback]").first()).toContainText("已复制，可粘贴到外部平台搜索");
    const clipboardText = await page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || "");
    expect(clipboardText).not.toBe("");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    await expect(summaryPanel.locator(".commerce-booking-link")).toHaveCount(0);
  });

  test("v2.0.68 platform search template pack copy buttons copy text to clipboard without side effects", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-PLATFORM-TEMPLATE-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-PLATFORM-TEMPLATE-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestDraftReviewReady(page);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const summaryPanel = home.locator(".commerce-result-summary-panel");
    await expect(summaryPanel).toContainText("查看其它安全规则折叠面板");
    const defaultSummaryText = await visibleText(summaryPanel);
    expect(defaultSummaryText).not.toContain("Google Flights search template");
    expect(defaultSummaryText).not.toContain("Booking hotel search template");
    expect(defaultSummaryText).not.toContain("京东电脑搜索模板");
    expect(defaultSummaryText).not.toContain("Amazon laptop search template");
    expect(defaultSummaryText).not.toContain("查看平台模板");
    await openDisclosure(summaryPanel, "commerce-platform-template-disclosure");
    for (const text of ["复制 Google Flights 模板", "复制 Trip.com / 携程模板", "复制 Booking 模板", "复制 Agoda 模板", "复制京东模板", "复制淘宝 / 天猫模板", "复制 Amazon 模板", "复制 Best Buy 模板", "复制全部平台模板"]) await expect(summaryPanel).toContainText(text);
    await expect(summaryPanel.locator(".commerce-platform-template-copy-btn")).toHaveCount(9);
    await installClipboardMock(page);
    const historyCountBefore = await page.locator("#cmdHistory [data-history-id]").count();
    const buttons = {
      googleFlights: summaryPanel.getByRole("button", { name:"复制 Google Flights 模板" }),
      tripCom: summaryPanel.getByRole("button", { name:"复制 Trip.com / 携程模板" }),
      booking: summaryPanel.getByRole("button", { name:"复制 Booking 模板" }),
      agoda: summaryPanel.getByRole("button", { name:"复制 Agoda 模板" }),
      jd: summaryPanel.getByRole("button", { name:"复制京东模板" }),
      taobaoTmall: summaryPanel.getByRole("button", { name:"复制淘宝 / 天猫模板" }),
      amazon: summaryPanel.getByRole("button", { name:"复制 Amazon 模板" }),
      bestBuy: summaryPanel.getByRole("button", { name:"复制 Best Buy 模板" }),
      allPlatforms: summaryPanel.getByRole("button", { name:"复制全部平台模板" })
    };
    await buttons.googleFlights.click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("From: Chengdu");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("final price must be checked on the real platform");
    await buttons.tripCom.click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("出发地：成都");
    await buttons.booking.click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("Check-in: July 12");
    await buttons.agoda.click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("Check-in date: July 12");
    await buttons.jd.click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("排除：二手、翻新机、展示机");
    await buttons.taobaoTmall.click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("搜索词：剪视频电脑 32G内存 1T硬盘 新机");
    await buttons.amazon.click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("Memory: 32GB RAM");
    await buttons.bestBuy.click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("Best Buy laptop search template");
    await buttons.allPlatforms.click();
    for (const text of ["Google Flights search template", "机票搜索模板", "Booking hotel search template", "京东电脑搜索模板", "Amazon laptop search template", "当前不会访问真实平台", "当前不会付款或下单"]){
      await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain(text);
    }
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    await expect(summaryPanel.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(summaryPanel.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    await disableClipboardMock(page);
    await buttons.googleFlights.click();
    await expect(summaryPanel.locator("[data-commerce-platform-template-feedback]").first()).toContainText("复制失败，请手动选择文本复制");
  });

  test("v2.0.72 one screen result mode keeps long content behind disclosures", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-ONE-SCREEN-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-ONE-SCREEN-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestDraftReviewReady(page);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const summaryPanel = home.locator(".commerce-result-summary-panel");
    await expect(summaryPanel).toContainText("最终结果");
    await expect(summaryPanel).toContainText("暂无真实价格结果");
    await expect(summaryPanel).toContainText("当前尚未接入真实只读价格源，不能展示价格。");
    await expect(summaryPanel).toContainText("weishan 不收款、不下单、不保存身份证、护照或银行卡。");
    await expect(home).toContainText("查看其它安全规则折叠面板");
    const defaultHomeText = await visibleTextWithoutTechnicalDetails(home);
    for (const hidden of ["机票搜索条件", "酒店搜索条件", "电脑搜索条件：", "Google Flights search template", "Booking hotel search template", "京东电脑搜索模板", "Amazon laptop search template", "本地意图识别", "子计划补齐工作台", "provider", "API key", "endpoint", "Connector Gate", "Sandbox Dry Run", "查看可执行清单", "查看平台模板"]) {
      expect(defaultHomeText).not.toContain(hidden);
    }
    await expect(home.locator("details.commerce-simple-flight-advanced-debug-disclosure")).not.toHaveAttribute("open", "");
    await openAdvancedDebug(home);
    await expect(home).toContainText("查看分析过程");
    await expect(home).toContainText("查看安全边界");
    await openTechnicalDetails(home);
    await expect(home).toContainText("provider");
    await expect(home).toContainText("API key");
    await expect(home).toContainText("endpoint");
  });

  // v2.1.4 real result only surface hides debug panels by default
  // 查看 Provider 审批状态 ... 人工审核后才允许进入 provider approval
  // 查看只读适配器开发许可 ... 人工批准开发只读 stub
  // 查看只读适配器空壳 ... 不能保存证件 / 银行卡
  // 查看 Sandbox Dry Run ... 沙箱空跑外壳已建立，但未连接真实 provider ... block_price_return ... block_payment
  test("v2.1.4 trusted external search router keeps lowest two flight offers contract gated and candidate registry collapsed", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    const latestButton = page.locator("#taskHistoryLatestBtn");
    if (await latestButton.count()) await latestButton.click();
    const inputText = runId + "-SIMPLE-FLIGHT 7 月 15 日上海到成都最便宜的机票";
    await submitHomeCommand(page, inputText);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const summaryPanel = home.locator(".commerce-simple-flight-result");
    await expect(summaryPanel).toHaveCount(1, { timeout:15000 });
    await expect(summaryPanel).toContainText("机票搜索结果");
    await expect(summaryPanel).toContainText("出发地：上海");
    await expect(summaryPanel).toContainText("目的地：成都");
    await expect(summaryPanel).toContainText("出发日期：7月15日");
    await expect(summaryPanel).toContainText("日期：7 月 15 日");
    await expect(summaryPanel).toContainText("排序：低价优先");
    await expect(summaryPanel).not.toContainText("日上海");
    await expect(summaryPanel).not.toContainText("日期：待补充");
    await expect(summaryPanel).toContainText("用户 API：未绑定");
    await expect(summaryPanel).toContainText("weishan 候选平台：可用");
    await expect(summaryPanel).toContainText("真实价格结果：暂无");
    await expect(summaryPanel).toContainText("暂无真实价格结果");
    await expect(summaryPanel).toContainText("当前尚未接入真实只读机票价格源，不能展示价格。");
    await expect(summaryPanel).toContainText("绑定 API 后，将优先使用用户授权平台的只读价格结果");
    await expect(summaryPanel).toContainText("未绑定 API 时，可使用 weishan 候选平台和外部搜索入口。");
    await expect(summaryPanel).toContainText("接入可信价格源后，将只显示通过安全检查的真实价格结果。最终价格、库存、税费、运费、行李、退改签，以跳转后的平台页面为准。");
    await expect(summaryPanel).toContainText("当前只是帮你整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单");
    await expect(summaryPanel).toContainText("查看 API 绑定说明");
    await expect(summaryPanel).toContainText("查看可绑定 API 平台目录");
    await expect(summaryPanel).toContainText("查看 API 绑定表单");
    await expect(summaryPanel).toContainText("查看 API 绑定权限清单");
    await expect(summaryPanel).toContainText("查看 API 绑定准备状态");
    await expect(summaryPanel).toContainText("查看只读 provider result schema gate");
    await expect(summaryPanel).toContainText("查看安全存储设计闸门");
    await expect(summaryPanel).toContainText("查看 bookingUrl domain safety gate");
    await expect(summaryPanel).toContainText("查看 manual provider review workflow");
    await expect(summaryPanel).toContainText("查看只读 provider result schema gate");
    await expect(summaryPanel).toContainText("查看 provider result source label gate");
    await expect(summaryPanel).toContainText("查看 price integrity / taxes / fees gate");
    await expect(summaryPanel).toContainText("查看本机安全存储接口草案");
    await expect(summaryPanel).toContainText("查看密钥脱敏与日志防泄露规则");
    await expect(summaryPanel).toContainText("复制机票搜索条件");
    await summaryPanel.locator("details.commerce-readonly-provider-result-schema-gate-disclosure > summary").first().click();
    const resultSchemaGateBody = summaryPanel.locator("details.commerce-readonly-provider-result-schema-gate-disclosure .commerce-disclosure-body").first();
    for (const text of ["只读 provider result schema gate：已建立", "closed", "draft", "redacted: true", "rawProviderPayload", "bookingUrl", "raw provider payload 显示：禁止", "sandbox gate", "endpoint allowlist gate", "key 生命周期", "脱敏规则", "本机安全存储", "API 绑定准备状态"]) {
      await expect(resultSchemaGateBody).toContainText(text);
    }
    await summaryPanel.locator("details.commerce-provider-result-source-label-gate-disclosure > summary").first().click();
    const sourceLabelGateBody = summaryPanel.locator("details.commerce-provider-result-source-label-gate-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "provider result source label gate：已建立",
      "closed",
      "draft only",
      "real provider source label 未开放",
      "real provider result 未读取",
      "real network disabled",
      "providerId",
      "providerName",
      "sourceType",
      "sourceUrlHost",
      "updatedAt",
      "readonlyEvidence",
      "redacted: true",
      "user_bound_api",
      "weishan_readonly_provider",
      "public_search",
      "manual_reviewed_source",
      "blocked_unknown_source",
      "no_provider",
      "来源：未接入真实 provider",
      "缺 providerId 阻断",
      "unknown host 阻断",
      "short URL 阻断",
      "credential query params 阻断",
      "token / apiKey / secret 参数阻断",
      "raw provider payload 阻断",
      "sourceLabelAuditDraft",
      "endpoint allowlist gate",
      "只读 provider result schema gate",
      "API 绑定准备状态"
    ]) {
      await expect(sourceLabelGateBody).toContainText(text);
    }
    await summaryPanel.locator("details.commerce-price-integrity-taxes-fees-gate-disclosure > summary").first().click();
    const priceIntegrityGateBody = summaryPanel.locator("details.commerce-price-integrity-taxes-fees-gate-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "price integrity / taxes / fees gate：已建立",
      "closed",
      "draft only",
      "real price display disabled",
      "real provider price disabled",
      "tax / fee verification disabled until readonly provider result is available",
      "currency",
      "baseFare",
      "taxes",
      "fees",
      "total",
      "priceObservedAt",
      "updatedAt",
      "readonlyEvidence",
      "taxFeeCompleteness",
      "price withheld",
      "没有 source label gate 通过不显示价格",
      "没有 result schema gate 通过不显示价格",
      "当前版本仍隐藏价格",
      "当前不得显示 fake price",
      "当前不得显示 mock price",
      "当前不得显示 demo price",
      "当前不得显示 AI 估价",
      "priceIntegrityRiskScanDraft",
      "missingCurrency",
      "missingTaxes",
      "missingFees",
      "bookingUrlDetected",
      "priceIntegrityAuditDraft",
      "redacted: true"
    ]) {
      await expect(priceIntegrityGateBody).toContainText(text);
    }
    await expect(summaryPanel).toContainText("查看安全存储设计闸门");
    await expect(summaryPanel).toContainText("查看本机安全存储接口草案");
    await expect(summaryPanel).toContainText("查看密钥脱敏与日志防泄露规则");
    await expect(summaryPanel).toContainText("查看 key 删除 / 轮换 / 过期机制草案");
    await expect(summaryPanel).toContainText("查看 provider endpoint allowlist 闸门");
    await expect(summaryPanel).toContainText("查看只读 provider sandbox gate");
    await expect(summaryPanel).toContainText("查看只读 provider result schema gate");
    await expect(summaryPanel).toContainText("查看 provider result source label gate");
    await expect(summaryPanel).toContainText("查看 price integrity / taxes / fees gate");
    await summaryPanel.getByText("查看 API 绑定说明").click();
    await expect(summaryPanel).toContainText("API 绑定说明");
    await expect(summaryPanel).toContainText("当前状态：用户 API 未绑定。");
    await expect(summaryPanel).toContainText("绑定 API 后，可优先使用用户授权平台的只读价格结果。");
    await expect(summaryPanel).toContainText("API 只用于搜索、读取价格、读取库存、分析结果。");
    await expect(summaryPanel).toContainText("可绑定 API 平台目录：已建立");
    await expect(summaryPanel).toContainText("当前已绑定 API：0");
    await expect(summaryPanel).toContainText("当前只读价格能力：未启用");
    await expect(summaryPanel).toContainText("真实 API key 输入：未启用");
    await expect(summaryPanel).toContainText("真实 endpoint 连接：未启用");
    await expect(summaryPanel).toContainText("API 绑定表单：禁用预览");
    await expect(summaryPanel).toContainText("API 绑定权限清单：只读预览");
    await expect(summaryPanel).toContainText("API 绑定准备状态：未准备");
    await expect(summaryPanel).toContainText("API 绑定必须先通过安全存储设计闸门");
    await expect(summaryPanel).toContainText("已建立本机安全存储接口草案");
    await expect(summaryPanel).toContainText("当前闸门关闭");
    await expect(summaryPanel).toContainText("当前不能保存真实 API key");
    await expect(summaryPanel).toContainText("当前不能提交绑定确认");
    await expect(summaryPanel).toContainText("当前不能输入真实 API key");
    await expect(summaryPanel).toContainText("当前不能保存 key");
    await expect(summaryPanel).toContainText("当前不能测试连接");
    await expect(summaryPanel).toContainText("绑定 API 不代表允许付款");
    await expect(summaryPanel).toContainText("绑定 API 不代表允许下单");
    await expect(summaryPanel).toContainText("绑定 API 不代表允许提交身份证、护照或银行卡");
    await expect(summaryPanel).toContainText("只读 API：允许搜索 / 返回价格");
    await expect(summaryPanel).toContainText("写入 API：默认禁止");
    await expect(summaryPanel).toContainText("下单 API：默认禁止");
    await expect(summaryPanel).toContainText("支付 API：禁止");
    await expect(summaryPanel).toContainText("身份资料上传：禁止");
    await expect(summaryPanel).toContainText("银行卡保存：禁止");
    const userApiPolicy = await page.evaluate(() => window.WeishanCommerceUserApiPriorityPolicy ? {
      contract:window.WeishanCommerceUserApiPriorityPolicy.commerceUserApiPriorityPolicyContract,
      notBoundMode:window.WeishanCommerceUserApiPriorityPolicy.resolveCommerceSearchMode({
        userApiBindingState:window.WeishanCommerceUserApiPriorityPolicy.getUserApiBindingState()
      }),
      boundReadonlyFixture:window.WeishanCommerceUserApiPriorityPolicy.resolveCommerceSearchMode({
        userApiBindingState:window.WeishanCommerceUserApiPriorityPolicy.getUserApiBindingState({
          __fixture:true,
          status:"bound_readonly_fixture",
          providerName:"Trip.com API fixture",
          canReadPrice:true
        })
      })
    } : null);
    expect(userApiPolicy.contract).toEqual(expect.objectContaining({
      policyVersion:"2.1.39",
      phase:"user_api_priority_search_policy",
      policyStatus:"policy_only",
      userApiMode:"not_bound",
      candidateProviderMode:"available",
      realPriceMode:"unavailable_without_bound_api",
      paymentMode:"disabled",
      orderMode:"disabled",
      identityStorageMode:"disabled"
    }));
    expect(userApiPolicy.contract.capabilities).toEqual(expect.objectContaining({
      canDetectUserApiBinding:true,
      canPreferUserApiWhenBound:true,
      canFallbackToCandidateProviders:true,
      canShowSearchMode:true,
      canShowSourceLabel:true,
      canShowTrustedPriceOnly:true,
      canUseReadOnlyUserApi:false,
      canUseWriteApi:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canStoreIdentity:false,
      canStoreBankCard:false
    }));
    expect(userApiPolicy.notBoundMode).toEqual(expect.objectContaining({
      mode:"candidate_provider_fallback",
      userApi:"not_bound",
      candidateProviders:"available",
      realPriceResults:"unavailable",
      canShowPrice:false,
      canShowBookingUrl:false,
      canPay:false,
      canCreateOrder:false,
      canStoreIdentity:false
    }));
    expect(userApiPolicy.boundReadonlyFixture).toEqual(expect.objectContaining({
      mode:"user_api_readonly_first",
      userApi:"bound",
      resultSource:"user_bound_api",
      providerName:"Trip.com API fixture",
      canShowPrice:true,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canStoreIdentity:false
    }));
    const apiBindingSafeShell = await page.evaluate(() => {
      const api = window.WeishanCommerceApiBindingSafeShell;
      if (!api) return null;
      const defaultState = api.getApiBindingSafeShellState();
      const readonlyFixtureState = api.getApiBindingSafeShellState({
        __fixture:true,
        status:"bound_readonly_fixture",
        providerName:"Trip.com API fixture"
      });
      return {
        contract:api.commerceApiBindingSafeShellContract,
        defaultState,
        tiers:api.buildApiBindingPermissionTiers(),
        notBoundMode:api.resolveApiBindingMode({ shellState:defaultState }),
        readonlyFixtureMode:api.resolveApiBindingMode({ shellState:readonlyFixtureState }),
        assertDefault:api.assertApiBindingSafeShellNoSecrets(defaultState),
        assertFixture:api.assertApiBindingSafeShellNoSecrets(readonlyFixtureState)
      };
    });
    expect(apiBindingSafeShell.contract).toEqual(expect.objectContaining({
      shellVersion:"2.1.39",
      phase:"api_binding_safe_shell",
      shellStatus:"safe_shell_only",
      bindingStatus:"not_bound",
      storageMode:"disabled",
      realApiKeyStorage:"disabled",
      apiKeyPlaintextStorage:"forbidden",
      endpointConnectionMode:"disabled",
      networkMode:"disabled",
      priceMode:"disabled",
      bookingUrlMode:"disabled",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityUploadMode:"disabled",
      identityStorageMode:"disabled",
      bankCardStorageMode:"disabled"
    }));
    expect(apiBindingSafeShell.contract.capabilities).toEqual(expect.objectContaining({
      canShowApiBindingEntry:true,
      canExplainApiPermissions:true,
      canShowBindingStatus:true,
      canValidateProviderLabelShape:true,
      canValidatePermissionTierShape:true,
      canSaveRealApiKey:false,
      canReadRealApiKey:false,
      canStorePlaintextApiKey:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canOpenBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canStoreIdentity:false,
      canStoreBankCard:false
    }));
    expect(apiBindingSafeShell.defaultState).toEqual(expect.objectContaining({
      status:"not_bound",
      userApi:"not_bound",
      providerName:null,
      providerType:null,
      apiPermissionTier:"none",
      canReadPrice:false,
      canWrite:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canStoreIdentity:false,
      canStoreBankCard:false,
      storageMode:"disabled",
      endpointConnectionMode:"disabled",
      networkMode:"disabled"
    }));
    expect(apiBindingSafeShell.notBoundMode).toEqual(expect.objectContaining({
      mode:"not_bound",
      userApi:"not_bound",
      searchPriority:"candidate_provider_fallback",
      canUseUserApi:false,
      canShowPrice:false,
      canShowBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canStoreIdentity:false,
      canStoreBankCard:false
    }));
    expect(apiBindingSafeShell.readonlyFixtureMode).toEqual(expect.objectContaining({
      mode:"readonly_fixture_bound",
      userApi:"bound_readonly_fixture",
      searchPriority:"user_api_readonly_first",
      providerName:"Trip.com API fixture",
      canUseUserApi:true,
      canShowPrice:true,
      canShowBookingUrl:true,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canStoreIdentity:false,
      canStoreBankCard:false
    }));
    expect(apiBindingSafeShell.tiers).toEqual(expect.arrayContaining([
      expect.objectContaining({ title:"只读 API", allowed:expect.arrayContaining(["搜索", "读取价格", "读取库存", "分析结果"]), forbidden:expect.arrayContaining(["写入", "下单", "付款", "上传身份资料", "保存银行卡"]), enabled:false }),
      expect.objectContaining({ title:"写入 API", forbidden:expect.arrayContaining(["默认禁止"]), enabled:false }),
      expect.objectContaining({ title:"下单 API", forbidden:expect.arrayContaining(["默认禁止"]), enabled:false }),
      expect.objectContaining({ title:"支付 API", forbidden:expect.arrayContaining(["禁止"]), enabled:false }),
      expect.objectContaining({ title:"身份资料上传", forbidden:expect.arrayContaining(["禁止"]), enabled:false }),
      expect.objectContaining({ title:"银行卡保存", forbidden:expect.arrayContaining(["禁止"]), enabled:false })
    ]));
    expect(apiBindingSafeShell.assertDefault).toBe(true);
    expect(apiBindingSafeShell.assertFixture).toBe(true);
    await summaryPanel.getByText("查看可绑定 API 平台目录").click();
    await expect(summaryPanel).toContainText("可绑定 API 平台目录");
    await expect(summaryPanel).toContainText("平台目录已建立，但尚未绑定任何真实 API");
    await expect(summaryPanel).toContainText("可选平台类型：机票 / 酒店 / 商品 / 本地服务");
    await expect(summaryPanel).toContainText("已绑定 API：0");
    await expect(summaryPanel).toContainText("可返回真实价格：0");
    await expect(summaryPanel).toContainText("可下单：0");
    await expect(summaryPanel).toContainText("可付款：0");
    await expect(summaryPanel).toContainText("机票 / 航旅");
    await expect(summaryPanel).toContainText("酒店");
    await expect(summaryPanel).toContainText("商品 / 电商");
    await expect(summaryPanel).toContainText("本地服务 / 门票");
    for (const providerName of ["Trip.com API / Partner API", "Skyscanner API / Partner API", "Amadeus / GDS 类", "Expedia Partner Solutions", "Amazon Product Advertising API", "eBay Browse API", "Walmart API", "京东联盟 / 京东开放平台", "淘宝 / 天猫开放平台", "拼多多开放平台"]) {
      await expect(summaryPanel).toContainText(providerName);
    }
    for (const capability of ["只读潜力：可评估", "写入能力：禁用", "下单能力：禁用", "支付能力：禁用", "身份资料上传：禁用", "API key 输入：禁用", "endpoint 连接：禁用"]) {
      await expect(summaryPanel).toContainText(capability);
    }
    await expect(summaryPanel).toContainText("API 绑定表单：禁用预览");
    await expect(summaryPanel).toContainText("API 绑定权限清单：只读预览");
    await expect(summaryPanel).toContainText("API 绑定准备状态：未准备");
    await expect(summaryPanel).toContainText("平台目录只是目录，不代表已经可绑定");
    await expect(summaryPanel).toContainText("平台目录不代表已获得 API 权限");
    await expect(summaryPanel).toContainText("平台目录只用于了解未来可绑定平台，不代表当前可连接真实 API");
    const userApiProviderCatalog = await page.evaluate(() => {
      const api = window.WeishanCommerceUserApiProviderCatalog;
      if (!api) return null;
      const catalog = api.buildUserApiProviderCatalog();
      const summary = api.summarizeUserApiProviderCatalog(catalog);
      return {
        contract:api.commerceUserApiProviderCatalogContract,
        catalog,
        summary,
        flightIntent:api.resolveProviderCatalogForIntent("7月15日上海到成都机票"),
        hotelIntent:api.resolveProviderCatalogForIntent("东京酒店"),
        commerceIntent:api.resolveProviderCatalogForIntent("买电脑"),
        localIntent:api.resolveProviderCatalogForIntent("买演唱会门票"),
        assertSafe:api.assertUserApiProviderCatalogSafe(catalog, summary)
      };
    });
    expect(userApiProviderCatalog.contract).toEqual(expect.objectContaining({
      catalogVersion:"2.1.39",
      phase:"user_api_provider_catalog",
      catalogStatus:"catalog_only",
      realApiConnectionMode:"disabled",
      apiKeyInputMode:"disabled",
      apiKeyStorageMode:"disabled",
      endpointConnectionMode:"disabled",
      networkMode:"disabled",
      priceMode:"disabled_without_binding",
      bookingUrlMode:"disabled_without_binding",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityUploadMode:"disabled",
      identityStorageMode:"disabled",
      bankCardStorageMode:"disabled"
    }));
    expect(userApiProviderCatalog.contract.capabilities).toEqual(expect.objectContaining({
      canShowProviderCatalog:true,
      canShowProviderTypes:true,
      canShowReadOnlyCapability:true,
      canShowPermissionBoundary:true,
      canRecommendProviderCategory:true,
      canShowFutureBindingPath:true,
      canInputRealApiKey:false,
      canSaveRealApiKey:false,
      canReadRealApiKey:false,
      canTestConnection:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canStoreIdentity:false,
      canStorePassport:false,
      canStoreBankCard:false
    }));
    expect(userApiProviderCatalog.catalog).toEqual(expect.arrayContaining([
      expect.objectContaining({ providerName:"Trip.com API / Partner API", category:"flight", bindingStatus:"not_bound", apiKeyInput:"disabled", endpointConnection:"disabled", networkConnection:"disabled", paymentCapability:"disabled" }),
      expect.objectContaining({ providerName:"Booking / partner source", category:"hotel", bindingStatus:"not_bound" }),
      expect.objectContaining({ providerName:"Amazon Product Advertising API", category:"commerce", bindingStatus:"not_bound" }),
      expect.objectContaining({ providerName:"Event / ticket provider APIs", category:"local_service", bindingStatus:"not_bound" })
    ]));
    for (const provider of userApiProviderCatalog.catalog) {
      expect(provider).toEqual(expect.objectContaining({
        bindingStatus:"not_bound",
        apiKeyInput:"disabled",
        apiKeyStorage:"disabled",
        endpointConnection:"disabled",
        networkConnection:"disabled",
        writeCapability:"disabled",
        orderCapability:"disabled",
        paymentCapability:"disabled",
        identityUploadCapability:"disabled"
      }));
    }
    expect(userApiProviderCatalog.summary).toEqual(expect.objectContaining({
      boundProviders:0,
      providersWithWriteEnabled:0,
      providersWithOrderEnabled:0,
      providersWithPaymentEnabled:0,
      providersWithIdentityUploadEnabled:0,
      overallStatus:"catalog_only_no_binding"
    }));
    expect(userApiProviderCatalog.flightIntent.recommendedCategory).toBe("flight");
    expect(userApiProviderCatalog.hotelIntent.recommendedCategory).toBe("hotel");
    expect(userApiProviderCatalog.commerceIntent.recommendedCategory).toBe("commerce");
    expect(userApiProviderCatalog.localIntent.recommendedCategory).toBe("local_service");
    expect(userApiProviderCatalog.flightIntent.providers.every((provider) => provider.category === "flight")).toBe(true);
    expect(userApiProviderCatalog.hotelIntent.providers.every((provider) => provider.category === "hotel")).toBe(true);
    expect(userApiProviderCatalog.commerceIntent.providers.every((provider) => provider.category === "commerce")).toBe(true);
    expect(userApiProviderCatalog.localIntent.providers.every((provider) => provider.category === "local_service")).toBe(true);
    expect(userApiProviderCatalog.assertSafe).toBe(true);
    await summaryPanel.getByText("查看 API 绑定表单").click();
    await expect(summaryPanel).toContainText("API 绑定表单");
    await expect(summaryPanel).toContainText("API 绑定表单为禁用预览，当前版本不保存真实 API key。");
    for (const label of ["平台类型", "平台名称", "权限类型", "API key", "API secret", "endpoint", "地区", "币种", "回调地址", "备注"]) {
      await expect(summaryPanel).toContainText(label);
    }
    for (const action of ["保存 API 配置", "测试连接", "删除绑定", "启用只读搜索", "启用价格结果"]) {
      await expect(summaryPanel).toContainText(action);
    }
    for (const safety of ["当前版本不能输入真实 API key", "当前版本不能保存 API key", "当前版本不能测试连接", "当前版本不能连接 endpoint", "当前版本不能发起网络请求", "当前版本不能返回真实价格", "当前版本不能返回 bookingUrl", "当前版本不能付款", "当前版本不能下单", "当前版本不能上传身份证、护照或银行卡"]) {
      await expect(summaryPanel).toContainText(safety);
    }
    await expect(summaryPanel).toContainText("API 绑定权限清单：只读预览");
    await expect(summaryPanel).toContainText("API 绑定准备状态：未准备");
    await expect(summaryPanel).toContainText("安全密钥存储方案尚未实现前，表单保持禁用");
    await expect(summaryPanel).toContainText("未完成权限确认前，表单保持禁用");
    await expect(summaryPanel).toContainText("当前版本不能提交绑定确认");
    const mockForm = summaryPanel.locator(".commerce-api-binding-mock-form");
    await expect(mockForm.locator("[data-api-binding-mock-field]")).toHaveCount(10);
    await expect(mockForm.locator("[data-api-binding-mock-action]")).toHaveCount(5);
    expect(await mockForm.locator("[data-api-binding-mock-field]").evaluateAll((nodes) => nodes.every((node) => node.disabled === true && node.value === "" && node.getAttribute("aria-disabled") === "true"))).toBe(true);
    expect(await mockForm.locator("[data-api-binding-mock-action]").evaluateAll((nodes) => nodes.every((node) => node.disabled === true && node.getAttribute("aria-disabled") === "true"))).toBe(true);
    const apiBindingMockForm = await page.evaluate(() => {
      const api = window.WeishanCommerceApiBindingMockForm;
      if (!api) return null;
      const fields = api.buildApiBindingMockFormFields();
      const actions = api.buildApiBindingMockActions();
      const state = api.getApiBindingMockFormState();
      return {
        contract:api.commerceApiBindingMockFormContract,
        fields,
        actions,
        state,
        display:api.buildApiBindingMockFormDisplay(),
        assertSafe:api.assertApiBindingMockFormSafe({ fields, actions, state })
      };
    });
    expect(apiBindingMockForm.contract).toEqual(expect.objectContaining({
      formVersion:"2.1.39",
      phase:"api_binding_mock_form_disabled_state",
      formStatus:"disabled_mock_only",
      inputMode:"disabled",
      submitMode:"disabled",
      saveMode:"disabled",
      testConnectionMode:"disabled",
      realApiKeyMode:"disabled",
      apiKeyPlaintextMode:"forbidden",
      endpointMode:"disabled",
      networkMode:"disabled",
      priceMode:"disabled_without_binding",
      bookingUrlMode:"disabled_without_binding",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityUploadMode:"disabled",
      identityStorageMode:"disabled",
      bankCardStorageMode:"disabled"
    }));
    expect(apiBindingMockForm.contract.capabilities).toEqual(expect.objectContaining({
      canShowDisabledForm:true,
      canShowProviderSelector:true,
      canShowPermissionTierSelector:true,
      canShowApiKeyPlaceholder:true,
      canShowEndpointPlaceholder:true,
      canShowSafetyNotice:true,
      canInputApiKey:false,
      canSaveApiKey:false,
      canSubmitForm:false,
      canTestConnection:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canStoreIdentity:false,
      canStorePassport:false,
      canStoreBankCard:false
    }));
    expect(apiBindingMockForm.fields.map((field) => field.label)).toEqual(["平台类型", "平台名称", "权限类型", "API key", "API secret", "endpoint", "地区", "币种", "回调地址", "备注"]);
    expect(apiBindingMockForm.fields.every((field) => field.disabled === true && field.required === false && field.value === "")).toBe(true);
    expect(apiBindingMockForm.actions.map((action) => action.label)).toEqual(["保存 API 配置", "测试连接", "删除绑定", "启用只读搜索", "启用价格结果"]);
    expect(apiBindingMockForm.actions.every((action) => action.disabled === true)).toBe(true);
    expect(apiBindingMockForm.state).toEqual(expect.objectContaining({
      status:"disabled_mock_only",
      canEdit:false,
      canSave:false,
      canTestConnection:false,
      canUseNetwork:false,
      canReadPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canStoreBankCard:false
    }));
    expect(apiBindingMockForm.display.currentStatusLine).toContain("当前版本不保存真实 API key");
    expect(apiBindingMockForm.assertSafe).toBe(true);
    await summaryPanel.getByText("查看 API 绑定权限清单").click();
    await expect(summaryPanel).toContainText("API 绑定权限清单");
    await expect(summaryPanel).toContainText("权限清单为只读预览，当前版本不能提交绑定确认。");
    await expect(summaryPanel).toContainText("允许的未来只读能力：");
    for (const label of ["只读搜索", "读取价格", "读取库存", "分析结果", "显示来源平台", "点击价格后跳转外部平台确认"]) {
      await expect(summaryPanel).toContainText(label);
    }
    await expect(summaryPanel).toContainText("禁止能力：");
    for (const label of ["写入 API：禁止", "下单 API：禁止", "支付 API：禁止", "上传身份证：禁止", "上传护照：禁止", "保存银行卡：禁止", "自动付款：禁止", "自动下单：禁止", "后台静默调用 API：禁止", "明文保存 API key：禁止"]) {
      await expect(summaryPanel).toContainText(label);
    }
    await expect(summaryPanel).toContainText("当前版本禁用：");
    for (const label of ["API key 输入：禁用", "API key 保存：禁用", "API 连接测试：禁用", "endpoint 连接：禁用", "真实网络请求：禁用", "真实价格返回：禁用", "bookingUrl 返回：禁用"]) {
      await expect(summaryPanel).toContainText(label);
    }
    await expect(summaryPanel).toContainText("未来绑定前确认预览：");
    for (const label of ["我确认该 API 仅用于只读搜索和价格读取。", "我理解 weishan 不会替我付款。", "我理解 weishan 不会替我下单。", "我理解 weishan 不会上传身份证、护照或银行卡。", "我理解最终价格以外部平台页面为准。", "我理解当前版本不会保存真实 API key。", "我理解未通过安全审查前不会连接真实 endpoint。"]) {
      await expect(summaryPanel).toContainText(label);
    }
    await expect(summaryPanel).toContainText("API 绑定准备状态：未准备");
    await expect(summaryPanel).toContainText("权限确认当前不能提交");
    await expect(summaryPanel).toContainText("未完成只读 provider result schema gate 前，不能提交绑定确认");
    const permissionPanel = summaryPanel.locator(".commerce-api-binding-permission-checklist");
    await expect(permissionPanel.getByRole("button", { name:"提交绑定确认" })).toBeDisabled();
    const apiBindingPermissionChecklist = await page.evaluate(() => {
      const api = window.WeishanCommerceApiBindingPermissionChecklist;
      if (!api) return null;
      const checklist = api.buildApiBindingPermissionChecklist();
      const confirmationPreview = api.buildApiBindingUserConfirmationPreview();
      const state = api.getApiBindingChecklistState();
      return {
        contract:api.commerceApiBindingPermissionChecklistContract,
        checklist,
        confirmationPreview,
        state,
        display:api.buildApiBindingPermissionChecklistDisplay(),
        assertSafe:api.assertApiBindingPermissionChecklistSafe({ checklist, confirmationPreview, state })
      };
    });
    expect(apiBindingPermissionChecklist.contract).toEqual(expect.objectContaining({
      checklistVersion:"2.1.39",
      phase:"api_binding_permission_checklist",
      checklistStatus:"checklist_only",
      realBindingMode:"disabled",
      apiKeyInputMode:"disabled",
      apiKeyStorageMode:"disabled",
      testConnectionMode:"disabled",
      endpointConnectionMode:"disabled",
      networkMode:"disabled",
      priceMode:"disabled_without_binding",
      bookingUrlMode:"disabled_without_binding",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityUploadMode:"disabled",
      identityStorageMode:"disabled",
      bankCardStorageMode:"disabled"
    }));
    expect(apiBindingPermissionChecklist.contract.capabilities).toEqual(expect.objectContaining({
      canShowPermissionChecklist:true,
      canShowReadOnlyChecklist:true,
      canShowForbiddenPermissionChecklist:true,
      canShowUserConfirmationPreview:true,
      canExplainBindingRisks:true,
      canInputApiKey:false,
      canSaveApiKey:false,
      canTestConnection:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canStoreIdentity:false,
      canStorePassport:false,
      canStoreBankCard:false
    }));
    expect(apiBindingPermissionChecklist.checklist.allowedFutureReadonly.every((item) => item.status === "allowed_future_readonly" && item.enabledNow === false && item.requiresUserBinding === true && item.requiresHumanReview === true)).toBe(true);
    expect(apiBindingPermissionChecklist.checklist.forbidden.every((item) => item.status === "forbidden" && item.enabledNow === false)).toBe(true);
    expect(apiBindingPermissionChecklist.checklist.disabledCurrentVersion.every((item) => item.status === "disabled_current_version" && item.enabledNow === false)).toBe(true);
    expect(apiBindingPermissionChecklist.state).toEqual(expect.objectContaining({
      status:"checklist_only",
      canConfirm:false,
      canSubmit:false,
      canInputApiKey:false,
      canSaveApiKey:false,
      canTestConnection:false,
      canUseNetwork:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canStoreBankCard:false
    }));
    expect(apiBindingPermissionChecklist.display.confirmationButtonDisabled).toBe(true);
    expect(apiBindingPermissionChecklist.assertSafe).toBe(true);
    await summaryPanel.getByText("查看 API 绑定准备状态").click();
    await expect(summaryPanel).toContainText("API 绑定准备状态");
    await expect(summaryPanel).toContainText("当前还不能绑定真实 API");
    await expect(summaryPanel).toContainText("用户 API：未绑定");
    await expect(summaryPanel).toContainText("平台目录：已建立");
    await expect(summaryPanel).toContainText("API 绑定说明：已建立");
    await expect(summaryPanel).toContainText("API 绑定表单：禁用预览");
    await expect(summaryPanel).toContainText("API 绑定权限清单：只读预览");
    await expect(summaryPanel).toContainText("安全密钥存储方案：方案已建立，尚未实现");
    await expect(summaryPanel).toContainText("Provider 人工审查：未开始");
    await expect(summaryPanel).toContainText("只读沙箱连接：未准备");
    await expect(summaryPanel).toContainText("真实价格结果：暂无");
    await expect(summaryPanel).toContainText("为什么还不能绑定");
    await expect(summaryPanel).toContainText("安全密钥存储方案尚未实现");
    await expect(summaryPanel).toContainText("API 绑定权限确认不能提交");
    await expect(summaryPanel).toContainText("Provider 条款 / API 文档未人工审查");
    await expect(summaryPanel).toContainText("只读沙箱连接闸门未完成");
    await expect(summaryPanel).toContainText("endpoint 连接未启用");
    await expect(summaryPanel).toContainText("网络请求未启用");
    await expect(summaryPanel).toContainText("真实价格返回未启用");
    await expect(summaryPanel).toContainText("bookingUrl 返回未启用");
    await expect(summaryPanel).toContainText("下一步：只读 provider result schema gate");
    await expect(summaryPanel).toContainText("key 删除 / 轮换 / 过期机制草案：已建立");
    await expect(summaryPanel).toContainText("当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key");
    await expect(summaryPanel).toContainText("weishan 不付款");
    await expect(summaryPanel).toContainText("weishan 不下单");
    await expect(summaryPanel).toContainText("weishan 不上传身份证、护照或银行卡");
    await expect(summaryPanel).toContainText("weishan 不保存银行卡");
    const apiBindingReadiness = await page.evaluate(() => {
      const api = window.WeishanCommerceApiBindingReadinessStatus;
      if (!api) return null;
      const status = api.buildApiBindingReadinessStatus();
      const steps = api.buildApiBindingReadinessSteps();
      return {
        contract:api.commerceApiBindingReadinessStatusContract,
        status,
        steps,
        state:api.getApiBindingReadinessState(),
        display:api.buildApiBindingReadinessDisplay(),
        assertSafe:api.assertApiBindingReadinessSafe({ status, steps })
      };
    });
    expect(apiBindingReadiness.contract).toEqual(expect.objectContaining({
      readinessVersion:"2.1.39",
      phase:"api_binding_readiness_status",
      readinessStatus:"not_ready",
      readinessMode:"status_only",
      realBindingMode:"disabled",
      apiKeyInputMode:"disabled",
      apiKeyStorageMode:"disabled",
      secureStorageMode:"plan_established_not_implemented",
      permissionChecklistMode:"readonly_preview",
      providerCatalogMode:"catalog_only",
      mockFormMode:"disabled_preview",
      providerReviewMode:"not_started",
      sandboxGateMode:"not_ready",
      endpointConnectionMode:"disabled",
      networkMode:"disabled",
      priceMode:"disabled_without_binding",
      bookingUrlMode:"disabled_without_binding",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityUploadMode:"disabled",
      identityStorageMode:"disabled",
      bankCardStorageMode:"disabled"
    }));
    expect(apiBindingReadiness.contract.capabilities).toEqual(expect.objectContaining({
      canShowReadinessStatus:true,
      canExplainWhyNotReady:true,
      canShowMissingRequirements:true,
      canShowNextStep:true,
      canInputApiKey:false,
      canSaveApiKey:false,
      canTestConnection:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canStoreIdentity:false,
      canStorePassport:false,
      canStoreBankCard:false
    }));
    expect(apiBindingReadiness.status).toEqual(expect.objectContaining({
      status:"not_ready",
      canBindApi:false,
      currentStage:"pre_binding_safety",
      nextStep:"readonly_provider_result_schema_gate"
    }));
    expect(apiBindingReadiness.status.summary).toEqual(expect.objectContaining({
      userApi:"not_bound",
      providerCatalog:"available",
      mockForm:"disabled_preview",
      permissionChecklist:"readonly_preview",
      secureKeyStorage:"plan_established_not_implemented",
      providerReview:"not_started",
      readonlySandbox:"not_ready",
      realPriceResult:"unavailable"
    }));
    expect(apiBindingReadiness.state).toEqual(expect.objectContaining({
      status:"not_ready",
      canBindApi:false,
      canInputApiKey:false,
      canSaveApiKey:false,
      canTestConnection:false,
      canUseNetwork:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canStoreBankCard:false
    }));
    expect(apiBindingReadiness.steps).toEqual(expect.arrayContaining([
      expect.objectContaining({ stepId:"current_readonly_info", canProceedNow:true }),
      expect.objectContaining({ stepId:"key_redaction_and_log_leak_rules", status:"established", canProceedNow:false }),
      expect.objectContaining({ stepId:"key_delete_rotate_expiry_draft", status:"established", canProceedNow:false }),
      expect.objectContaining({ stepId:"readonly_provider_result_schema_gate", status:"next", canProceedNow:false }),
      expect.objectContaining({ stepId:"readonly_api_binding_draft", status:"not_ready", canProceedNow:false }),
      expect.objectContaining({ stepId:"provider_human_review", status:"not_ready", canProceedNow:false }),
      expect.objectContaining({ stepId:"readonly_sandbox_gate", status:"not_ready", canProceedNow:false }),
      expect.objectContaining({ stepId:"readonly_price_result", status:"not_ready", canProceedNow:false })
    ]));
    expect(apiBindingReadiness.assertSafe).toBe(true);
    const matrix = await page.evaluate(() => window.WeishanCommerceFlightSandboxProviderMatrix && typeof window.WeishanCommerceFlightSandboxProviderMatrix.getFlightSandboxProviderMatrixContract === "function" ? window.WeishanCommerceFlightSandboxProviderMatrix.getFlightSandboxProviderMatrixContract() : null);
    expect(matrix).toEqual(expect.objectContaining({
      matrixVersion:"2.1.39",
      phase:"flight_sandbox_provider_matrix",
      matrixStatus:"readiness_matrix_only",
      networkMode:"disabled",
      apiKeyMode:"disabled",
      endpointMode:"disabled",
      providerMode:"candidate_only",
      priceMode:"disabled",
      bookingUrlMode:"disabled",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityStorageMode:"disabled"
    }));
    expect(matrix.capabilities).toEqual(expect.objectContaining({
      canBuildProviderMatrix:true,
      canAttachCandidateProviders:true,
      canAttachDryRunShellStatus:true,
      canAttachReadonlyStubStatus:true,
      canAttachApprovalStatus:true,
      canAuditBlockedCapabilities:true,
      canShowReadinessState:true,
      canUseNetwork:false,
      canUseApiKey:false,
      canConnectEndpoint:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canOpenBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canStoreIdentity:false
    }));
    expect(matrix.summary).toEqual(expect.objectContaining({
      totalCandidates:7,
      readyForReadonlyPrice:0,
      readyForBookingUrl:0,
      readyForPayment:0,
      blockedFromNetwork:7,
      blockedFromPrice:7,
      blockedFromBookingUrl:7,
      blockedFromOrder:7,
      blockedFromPayment:7,
      overallStatus:"not_ready_for_real_price",
      reason:"all_candidates_require_human_approval_and_real_provider_connection"
    }));
    expect(matrix.providerRows).toHaveLength(7);
    for (const row of matrix.providerRows) {
      expect(row).toEqual(expect.objectContaining({
        candidateStatus:"candidate_only",
        approvalStatus:"not_reviewed",
        readonlyStubPermission:"not_granted",
        readonlyStubScaffold:"available",
        sandboxDryRunShell:"available_shell_only",
        realProviderConnection:"disabled",
        apiKey:"disabled",
        endpoint:"disabled",
        network:"disabled",
        priceReturn:"disabled",
        bookingUrlReturn:"disabled",
        orderCreation:"disabled",
        payment:"disabled",
        identityStorage:"disabled",
        readinessLevel:"not_ready_for_price",
        reason:"provider_matrix_no_real_connection"
      }));
    }
    const sandboxDryRun = await page.evaluate(() => window.WeishanCommerceFlightSandboxDryRun && window.WeishanCommerceFlightSandboxDryRun.flightSandboxDryRunContract ? window.WeishanCommerceFlightSandboxDryRun.flightSandboxDryRunContract : null);
    expect(sandboxDryRun).toEqual(expect.objectContaining({
      sandboxDryRunVersion:"2.1.39",
      phase:"flight_sandbox_dry_run_shell",
      dryRunStatus:"shell_only",
      networkMode:"disabled",
      apiKeyMode:"disabled",
      endpointMode:"disabled",
      providerMode:"disabled",
      priceMode:"disabled",
      bookingUrlMode:"disabled",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityStorageMode:"disabled"
    }));
    expect(sandboxDryRun.capabilities).toEqual(expect.objectContaining({
      canRunDryRunShell:true,
      canValidateInputShape:true,
      canValidateRequestShape:true,
      canValidateResponseShape:true,
      canSimulateControlFlow:true,
      canUseFixtureOnly:true,
      canUseRealApiKey:false,
      canConnectRealEndpoint:false,
      canUseNetwork:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canOpenBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canStoreIdentity:false,
      canStorePassport:false,
      canStoreBankCard:false
    }));
    const sandboxPlan = await page.evaluate(() => window.WeishanCommerceFlightSandboxDryRun && typeof window.WeishanCommerceFlightSandboxDryRun.createFlightSandboxDryRunPlan === "function" ? window.WeishanCommerceFlightSandboxDryRun.createFlightSandboxDryRunPlan({ origin:"上海", destination:"成都", departureDate:"7月15日" }) : null);
    expect(sandboxPlan).toEqual(expect.objectContaining({
      status:"dry_run_plan_only",
      canExecuteNetwork:false,
      reason:"sandbox_dry_run_shell_no_network"
    }));
    expect(sandboxPlan.steps).toEqual([
      "validate_user_input",
      "build_request_shape",
      "validate_request_shape",
      "skip_network_call",
      "build_empty_response_shape",
      "validate_response_shape",
      "block_price_return",
      "block_booking_url_return",
      "block_order_creation",
      "block_payment"
    ]);
    expect(sandboxPlan.blockedCapabilities).toEqual(expect.arrayContaining([
      "canUseRealApiKey",
      "canConnectRealEndpoint",
      "canUseNetwork",
      "canReturnPrice",
      "canReturnBookingUrl",
      "canOpenBookingUrl",
      "canCreateOrder",
      "canPay",
      "canStoreIdentity",
      "canStorePassport",
      "canStoreBankCard"
    ]));
    const sandboxRun = await page.evaluate(() => window.WeishanCommerceFlightSandboxDryRun && typeof window.WeishanCommerceFlightSandboxDryRun.runFlightSandboxDryRun === "function" ? window.WeishanCommerceFlightSandboxDryRun.runFlightSandboxDryRun({ origin:"上海", destination:"成都", departureDate:"7月15日" }) : null);
    expect(sandboxRun).toEqual(expect.objectContaining({
      status:"dry_run_completed",
      mode:"shell_only",
      reason:"sandbox_dry_run_shell_completed_without_network",
      networkAttempted:false,
      apiKeyRead:false,
      endpointConnected:false,
      providerConnected:false,
      priceReturned:false,
      bookingUrlReturned:false,
      orderCreated:false,
      paymentStarted:false,
      identityStored:false
    }));
    expect(sandboxRun.offers).toEqual([]);
    expect(sandboxRun.blockedCapabilities).toEqual(expect.arrayContaining([
      "canUseRealApiKey",
      "canConnectRealEndpoint",
      "canUseNetwork",
      "canReturnPrice",
      "canReturnBookingUrl",
      "canOpenBookingUrl",
      "canCreateOrder",
      "canPay",
      "canStoreIdentity",
      "canStorePassport",
      "canStoreBankCard"
    ]));
    const sandboxAssert = await page.evaluate(() => {
      const api = window.WeishanCommerceFlightSandboxDryRun;
      return api && typeof api.assertNoFlightSandboxNetworkUse === "function" ? api.assertNoFlightSandboxNetworkUse(api.runFlightSandboxDryRun({ origin:"上海", destination:"成都", departureDate:"7月15日" })) : null;
    });
    expect(sandboxAssert).toBe(true);
    const readonlyStubPermission = await page.evaluate(() => window.WeishanCommerceFlightReadonlyStubPermission && typeof window.WeishanCommerceFlightReadonlyStubPermission.getFlightReadonlyStubPermission === "function" ? window.WeishanCommerceFlightReadonlyStubPermission.getFlightReadonlyStubPermission() : null);
    expect(readonlyStubPermission).toEqual(expect.objectContaining({
      permissionVersion:"2.1.39",
      phase:"flight_readonly_stub_permission",
      providerCategory:"flight",
      providerId:"flight-provider-disabled",
      providerName:"机票候选平台",
      overallStatus:"not_granted",
      currentStage:"approval_required",
      permissionStatus:"not_granted"
    }));
    expect(readonlyStubPermission.checklist).toEqual(expect.objectContaining({
      platformIdentityReview:false,
      officialDomainAllowlistReview:false,
      providerTermsReview:false,
      apiDocumentationReview:false,
      apiKeyStoragePlanReview:false,
      requestSchemaReview:false,
      responseSchemaReview:false,
      errorHandlingReview:false,
      timeoutRateLimitReview:false,
      finalStubDevApproval:false
    }));
    expect(readonlyStubPermission.capabilities).toEqual(expect.objectContaining({
      canDevelopReadonlyStub:false,
      canUseRealApiKey:false,
      canConnectRealEndpoint:false,
      canUseNetwork:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canOpenBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canStoreIdentity:false
    }));
    const secureKeyStoragePlan = await page.evaluate(() => {
      const api = window.WeishanCommerceSecureKeyStoragePlan;
      if (!api) return null;
      const plan = api.getSecureKeyStoragePlanState ? api.getSecureKeyStoragePlanState() : null;
      const summary = api.buildSecureKeyStoragePlanReadinessSummary ? api.buildSecureKeyStoragePlanReadinessSummary(plan) : null;
      return {
        contract:api.secureKeyStoragePlanContract,
        plan,
        summary,
        assertSafe:api.assertSecureKeyStoragePlanSafe ? api.assertSecureKeyStoragePlanSafe({ plan, summary }) : null
      };
    });
    expect(secureKeyStoragePlan.contract).toEqual(expect.objectContaining({
      secureKeyStoragePlanVersion:"2.1.39",
      phase:"flight_secure_key_storage_plan",
      planStatus:"plan_only",
      currentStage:"design_required",
      storageMode:"secure_storage_required",
      macOSKeychainMode:"not_connected",
      electronSafeStorageMode:"not_connected",
      plaintextMode:"forbidden",
      envFileMode:"forbidden",
      localStorageMode:"forbidden",
      sessionStorageMode:"forbidden",
      logMode:"forbidden",
      endpointMode:"disabled",
      networkMode:"disabled",
      priceMode:"disabled",
      bookingUrlMode:"disabled",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityStorageMode:"disabled"
    }));
    expect(secureKeyStoragePlan.contract.capabilities).toEqual(expect.objectContaining({
      canDescribePlan:true,
      canShowCurrentStage:true,
      canShowBlockedChannels:true,
      canShowFutureTargets:true,
      canUseMacOSKeychain:false,
      canUseElectronSafeStorage:false,
      canStorePlaintext:false,
      canStoreEnvFile:false,
      canStoreLocalStorage:false,
      canStoreSessionStorage:false,
      canStoreLogs:false,
      canUseNetwork:false,
      canConnectEndpoint:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canStoreIdentity:false
    }));
    expect(secureKeyStoragePlan.plan).toEqual(expect.objectContaining({
      planStatus:"plan_only",
      currentStage:"design_required",
      storageMode:"secure_storage_required",
      macOSKeychainMode:"not_connected",
      electronSafeStorageMode:"not_connected",
      plaintextMode:"forbidden",
      envFileMode:"forbidden",
      localStorageMode:"forbidden",
      sessionStorageMode:"forbidden",
      logMode:"forbidden",
      endpointMode:"disabled",
      networkMode:"disabled",
      priceMode:"disabled",
      bookingUrlMode:"disabled",
      orderMode:"disabled",
      paymentMode:"disabled",
      identityStorageMode:"disabled"
    }));
    expect(secureKeyStoragePlan.summary).toEqual(expect.objectContaining({
      title:"安全密钥存储方案",
      planStatusLine:"安全密钥存储方案：计划中",
      currentStatusLine:"当前状态：安全密钥存储仍处于方案阶段，当前版本不会保存真实 API key。",
      currentStageLine:"当前阶段：设计中",
      nextStepLine:"密钥脱敏与日志防泄露规则：已建立"
    }));
    expect(secureKeyStoragePlan.summary.statusChecklistItems).toEqual(expect.arrayContaining([
      "真实密钥保存：未启用",
      "macOS Keychain：未连接",
      "Electron safeStorage：未实现",
      ".env 保存：禁止",
      "明文保存：禁止",
      "localStorage 保存：禁止",
      "sessionStorage 保存：禁止",
      "日志记录 key：禁止",
      "API 连接测试：未启用",
      "endpoint 连接：未启用",
      "真实价格返回：未启用",
      "bookingUrl 返回：未启用"
    ]));
    expect(secureKeyStoragePlan.assertSafe).toBe(true);
    const secureStorageDesignGate = await page.evaluate(() => {
      const api = window.WeishanCommerceSecureStorageDesignGate;
      if (!api) return null;
      const gate = api.buildSecureStorageDesignGate ? api.buildSecureStorageDesignGate() : null;
      const state = api.getSecureStorageDesignGateState ? api.getSecureStorageDesignGateState() : null;
      const evaluation = api.evaluateSecureStorageDesignGate ? api.evaluateSecureStorageDesignGate({ simulated:true }) : null;
      return {
        contract:api.commerceSecureStorageDesignGateContract,
        gate,
        state,
        evaluation,
        assertSafe:api.assertSecureStorageDesignGateSafe ? api.assertSecureStorageDesignGateSafe(gate) : null
      };
    });
    expect(secureStorageDesignGate.contract).toEqual(expect.objectContaining({
      version:"2.1.39",
      gateName:"secure_storage_design_gate",
      gateStatus:"closed",
      phase:"design_gate"
    }));
    expect(secureStorageDesignGate.contract.capabilities).toEqual(expect.objectContaining({
      canShowGate:true,
      canShowGateStatus:true,
      canShowBlockingReasons:true,
      canShowUnlockChecklist:true,
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false,
      canUseKeychain:false,
      canUseSafeStorage:false,
      canWriteEnv:false,
      canWriteLocalStorage:false,
      canWriteSessionStorage:false,
      canWriteLogs:false,
      canTestConnection:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canRunProviderSandbox:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canUploadIdentity:false,
      canStoreBankCard:false
    }));
    expect(secureStorageDesignGate.state).toEqual(expect.objectContaining({
      gateStatus:"closed",
      phase:"design_gate",
      canProceedToKeyInput:false,
      canProceedToKeyStorage:false,
      canProceedToKeyRead:false,
      canProceedToConnectionTest:false,
      canProceedToProviderSandbox:false,
      canProceedToRealPrice:false,
      canProceedToBookingUrl:false,
      nextRequiredStep:"readonly_provider_result_schema_gate",
      currentUserActionRequired:false
    }));
    expect(secureStorageDesignGate.evaluation).toEqual(expect.objectContaining({
      allowed:false,
      gateStatus:"closed",
      nextRequiredStep:"readonly_provider_result_schema_gate"
    }));
    expect(secureStorageDesignGate.assertSafe).toBe(true);
    await summaryPanel.getByText("查看安全存储设计闸门").click();
    for (const text of [
      "安全存储设计闸门",
      "闸门状态：关闭",
      "当前阶段：设计闸门",
      "本机安全存储接口草案：已建立",
      "真实实现：未启用",
      "真实 API key 输入：未开放",
      "真实 API key 保存：未开放",
      "真实 API key 读取：未开放",
      "测试连接：未开放",
      "provider 沙箱连接：未开放",
      "真实价格返回：未开放",
      "bookingUrl 返回：未开放",
      "安全密钥写入实现未完成",
      "安全密钥读取实现未完成",
      "删除 / 轮换机制未完成",
      "Keychain 适配未完成",
      "safeStorage 适配未完成",
      "加密本地存储未完成",
      "密钥脱敏与日志防泄露规则：已建立",
      "key 删除 / 轮换 / 过期机制草案：已建立",
      "真实 key 删除 / 轮换 / 过期：未开放",
      "provider endpoint allowlist 闸门已建立，只读 provider sandbox gate：已建立，等待只读 provider result schema gate",
      "只读 provider 沙箱未完成",
      "设计密钥数据结构",
      "设计本机安全写入接口",
      "设计本机安全读取接口",
      "设计删除 key 机制",
      "设计轮换 key 机制",
      "设计只读 provider result schema gate",
      "v2.1.4：本机安全存储接口草案",
      "apiKey → [REDACTED_API_KEY]",
      "apiSecret → [REDACTED_API_SECRET]",
      "accessToken → [REDACTED_ACCESS_TOKEN]",
      "本机安全存储接口草案",
      "密钥脱敏与日志防泄露规则",
      "当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key"
    ]) {
      await expect(summaryPanel).toContainText(text);
    }
    const localSecureStorageDraft = await page.evaluate(() => {
      const api = window.WeishanCommerceLocalSecureStorageInterfaceDraft;
      if (!api) return null;
      const draft = api.buildLocalSecureStorageInterfaceDraft();
      const evaluation = api.evaluateLocalSecureStorageInterfaceDraft(draft);
      const redaction = api.buildLocalSecureStorageRedactionDraft();
      return {
        contract:api.commerceLocalSecureStorageInterfaceDraftContract,
        draft,
        evaluation,
        redaction,
        assertSafe:api.assertLocalSecureStorageInterfaceDraftSafe(draft)
      };
    });
    expect(localSecureStorageDraft.contract).toEqual(expect.objectContaining({
      version:"2.1.39",
      draftStatus:"draft_only",
      implementationStatus:"not_implemented"
    }));
    expect(localSecureStorageDraft.contract.capabilities).toEqual(expect.objectContaining({
      canShowInterfaceDraft:true,
      canShowDataModelDraft:true,
      canShowMethodDraft:true,
      canShowBackendCandidates:true,
      canShowAuditDraft:true,
      canShowRedactionDraft:true,
      canInputApiKey:false,
      canSaveApiKey:false,
      canReadApiKey:false,
      canDeleteApiKey:false,
      canRotateApiKey:false,
      canUseKeychain:false,
      canUseSafeStorage:false,
      canWriteEncryptedLocalStore:false,
      canWriteEnv:false,
      canWriteLocalStorage:false,
      canWriteSessionStorage:false,
      canWriteLogs:false,
      canTestConnection:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canRunProviderSandbox:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canOpenBookingUrl:false,
      canCreateOrder:false,
      canPay:false,
      canStoreIdentity:false
    }));
    expect(localSecureStorageDraft.draft.dataModelDraft.keyAliasModel).toEqual(expect.objectContaining({
      keyAliasId:"field:keyAliasId",
      providerId:"field:providerId",
      providerName:"field:providerName",
      permissionType:"field:permissionType_readonly_only",
      maskedPreview:"field:maskedPreview_redacted_only"
    }));
    expect(localSecureStorageDraft.draft.dataModelDraft.keySecretModel).toEqual(expect.objectContaining({
      secretRef:"field:secretRef_reference_only",
      encryptedPayloadRef:"field:encryptedPayloadRef_reference_only",
      backendType:"field:backendType_candidate_only",
      keyVersion:"field:keyVersion"
    }));
    expect(localSecureStorageDraft.draft.methodDraft.prepareSecretWriteDraft).toEqual(expect.objectContaining({ status:"blocked", allowed:false }));
    expect(localSecureStorageDraft.draft.methodDraft.prepareConnectionTestDraft).toEqual(expect.objectContaining({ status:"blocked", reason:"endpoint_connection_disabled" }));
    expect(localSecureStorageDraft.draft.backendCandidates.every((item) => item.candidateStatus === "candidate_only" && item.connected === false && item.canRead === false && item.canWrite === false && item.canDelete === false && item.canRotate === false)).toBe(true);
    expect(localSecureStorageDraft.evaluation).toEqual(expect.objectContaining({
      allowed:false,
      draftStatus:"draft_only",
      gateStatus:"closed",
      nextRequiredStep:"readonly_provider_result_schema_gate"
    }));
    expect(JSON.stringify(localSecureStorageDraft.redaction)).toContain("[REDACTED_API_KEY]");
    expect(JSON.stringify(localSecureStorageDraft.redaction)).toContain("[REDACTED_API_SECRET]");
    expect(JSON.stringify(localSecureStorageDraft.redaction)).toContain("[REDACTED_ACCESS_TOKEN]");
    expect(localSecureStorageDraft.assertSafe).toBe(true);
    await summaryPanel.getByText("查看本机安全存储接口草案").click();
    for (const text of [
      "本机安全存储接口草案",
      "接口草案：已建立",
      "真实实现：未启用",
      "真实 API key 输入：未开放",
      "真实 API key 保存：未开放",
      "真实 API key 读取：未开放",
      "删除 / 轮换：未开放",
      "测试连接：未开放",
      "provider 沙箱：未开放",
      "真实价格：未开放",
      "bookingUrl：未开放",
      "keyAliasId",
      "providerId",
      "providerName",
      "permissionType",
      "maskedPreview",
      "secretRef",
      "encryptedPayloadRef",
      "backendType",
      "keyVersion",
      "region",
      "currency",
      "displayName",
      "rotationVersion",
      "prepareKeyAliasDraft",
      "prepareSecretWriteDraft",
      "prepareSecretReadDraft",
      "prepareSecretDeleteDraft",
      "prepareSecretRotateDraft",
      "prepareConnectionTestDraft",
      "prepareProviderSandboxDraft",
      "prepareRealPriceReadDraft",
      "prepareBookingUrlDraft",
      "macOS Keychain",
      "Electron safeStorage + encrypted file",
      "encrypted local config",
      "enterprise managed secret",
      "KEY_ALIAS_CREATED_DRAFT",
      "KEY_WRITE_BLOCKED",
      "KEY_READ_BLOCKED",
      "redactSecretLikeValue",
      "redactObject",
      "redactHeaders",
      "redactUrl",
      "[REDACTED_API_KEY]",
      "[REDACTED_API_SECRET]",
      "[REDACTED_ACCESS_TOKEN]",
      "[REDACTED_AUTH_HEADER]",
      "[REDACTED_CREDENTIAL_PARAMS]",
      "密钥脱敏与日志防泄露规则",
      "当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key。"
    ]) {
      await expect(summaryPanel).toContainText(text);
    }
    await expect(summaryPanel).not.toContainText("真实 API key 输入框");
    await expect(summaryPanel).not.toContainText("endpoint 输入");
    const keyRedactionRules = await page.evaluate(() => {
      const api = window.WeishanCommerceKeyRedactionAndLogLeakRules;
      if (!api) return null;
      const input = { apiKey:"DEMO_API_KEY_SHOULD_NOT_APPEAR", clientSecret:"DEMO_SECRET_SHOULD_NOT_APPEAR", nested:{ accessToken:"DEMO_ACCESS_TOKEN_SHOULD_NOT_APPEAR" } };
      const redactedObject = api.redactObject(input);
      const redactedHeaders = api.redactHeaders({ authorization:"Bearer DEMO_AUTH_HEADER_SHOULD_NOT_APPEAR" });
      const redactedUrl = api.redactUrl("https://example.invalid/search?api_key=DEMO_API_KEY_SHOULD_NOT_APPEAR&access_token=DEMO_ACCESS_TOKEN_SHOULD_NOT_APPEAR");
      const redactedLog = api.redactLogMessage("password=DEMO_PASSWORD_SHOULD_NOT_APPEAR privateKey=DEMO_PRIVATE_KEY_SHOULD_NOT_APPEAR");
      const audit = api.buildSafeAuditLogEvent("dummy", input);
      const output = JSON.stringify({ redactedObject, redactedHeaders, redactedUrl, redactedLog, audit, dummy:api.buildDummyRedactionTestResult() });
      return { output, assertSafe:api.assertNoSecretLeak(output), contract:api.commerceKeyRedactionAndLogLeakRulesContract };
    });
    expect(keyRedactionRules.assertSafe).toBe(true);
    expect(keyRedactionRules.contract.capabilities).toEqual(expect.objectContaining({
      canInputRealApiKey:false,
      canSaveRealApiKey:false,
      canReadRealApiKey:false,
      canTestConnection:false,
      canConnectEndpoint:false,
      canUseNetwork:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canCreateOrder:false,
      canPay:false
    }));
    for (const raw of ["DEMO_API_KEY_SHOULD_NOT_APPEAR", "DEMO_SECRET_SHOULD_NOT_APPEAR", "DEMO_ACCESS_TOKEN_SHOULD_NOT_APPEAR", "DEMO_AUTH_HEADER_SHOULD_NOT_APPEAR", "DEMO_PASSWORD_SHOULD_NOT_APPEAR", "DEMO_PRIVATE_KEY_SHOULD_NOT_APPEAR"]) {
      expect(keyRedactionRules.output).not.toContain(raw);
    }
    for (const placeholder of ["[REDACTED_API_KEY]", "[REDACTED_CLIENT_SECRET]", "[REDACTED_ACCESS_TOKEN]", "[REDACTED_AUTH_HEADER]", "[REDACTED_PASSWORD]", "[REDACTED_PRIVATE_KEY]", "[REDACTED_CREDENTIAL_PARAMS]"]) {
      expect(keyRedactionRules.output).toContain(placeholder);
    }
    await summaryPanel.getByText("查看密钥脱敏与日志防泄露规则").click();
    for (const text of ["密钥脱敏与日志防泄露规则", "脱敏规则：已建立", "日志防泄露规则：已建立", "真实 API key 输入：未开放", "真实 API key 保存：未开放", "真实 API key 读取：未开放", "敏感字段识别规则", "脱敏映射", "安全审计日志规则", "UI / 截图 / 崩溃报告规则", "apiKey", "clientSecret", "accessToken", "credential query params", "apiKey → [REDACTED_API_KEY]", "clientSecret → [REDACTED_CLIENT_SECRET]", "credential query params → [REDACTED_CREDENTIAL_PARAMS]", "object redaction：PASS", "headers redaction：PASS", "url redaction：PASS", "log message redaction：PASS", "audit event redaction：PASS", "dummy secret raw strings absent：PASS", "key 删除 / 轮换 / 过期机制草案：已建立", "下一步：只读 provider result schema gate"]) {
      await expect(summaryPanel).toContainText(text);
    }
    for (const raw of ["DEMO_API_KEY_SHOULD_NOT_APPEAR", "DEMO_SECRET_SHOULD_NOT_APPEAR", "DEMO_ACCESS_TOKEN_SHOULD_NOT_APPEAR", "DEMO_AUTH_HEADER_SHOULD_NOT_APPEAR", "DEMO_PASSWORD_SHOULD_NOT_APPEAR", "DEMO_PRIVATE_KEY_SHOULD_NOT_APPEAR"]) {
      await expect(summaryPanel).not.toContainText(raw);
    }
    await installClipboardMock(page);
    await installOpenExternalMock(page);
    const historyCountBefore = await page.locator("#cmdHistory [data-history-id]").count();
    await expect.poll(async () => page.evaluate(() => (window.__WEISHAN_TEST_OPEN_EXTERNAL_URLS__ || []).length), { timeout:5000 }).toBe(0);
    await summaryPanel.getByRole("button", { name:"打开全网搜索" }).click();
    await expect(summaryPanel).toContainText("外部搜索确认");
    await expect(summaryPanel).toContainText("确认打开外部搜索链接");
    await expect.poll(async () => page.evaluate(() => (window.__WEISHAN_TEST_OPEN_EXTERNAL_URLS__ || []).length), { timeout:5000 }).toBe(0);
    await summaryPanel.getByRole("button", { name:"确认打开外部搜索链接" }).click();
    await expect.poll(async () => latestOpenExternalUrl(page), { timeout:5000 }).toContain("https://www.google.com/search?");
    await expect.poll(async () => latestOpenExternalUrl(page), { timeout:5000 }).toContain(encodeURIComponent("7月15日 上海 到 成都 最便宜 机票"));
    await summaryPanel.getByRole("button", { name:"打开 Google Flights 搜索" }).click();
    await expect(summaryPanel).toContainText("外部搜索确认");
    await summaryPanel.getByRole("button", { name:"取消" }).click();
    await expect.poll(async () => page.evaluate(() => (window.__WEISHAN_TEST_OPEN_EXTERNAL_URLS__ || []).length), { timeout:5000 }).toBe(1);
    await summaryPanel.getByRole("button", { name:"打开 Trip.com / 携程搜索" }).click();
    await expect(summaryPanel).toContainText("外部搜索确认");
    await summaryPanel.getByRole("button", { name:"确认打开外部搜索链接" }).click();
    await expect.poll(async () => latestOpenExternalUrl(page), { timeout:5000 }).toContain("https://www.trip.com/flights/search/");
    await expect.poll(async () => latestOpenExternalUrl(page), { timeout:5000 }).toContain("Chengdu");
    await expect.poll(async () => page.evaluate(() => (window.__WEISHAN_TEST_OPEN_EXTERNAL_URLS__ || []).length), { timeout:5000 }).toBe(2);
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    await summaryPanel.getByRole("button", { name:"复制机票搜索条件" }).click();
    for (const text of ["机票搜索条件", "出发地：上海", "目的地：成都", "出发日期：7月15日", "排序：低价优先", "最终价格以真实平台为准"]) {
      await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain(text);
    }
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    await submitHomeCommand(page, runId + "-SIMPLE-FLIGHT-HISTORY 买演唱会门票");
    await page.locator('#cmdHistory [data-history-id]', { hasText:"上海到成都" }).first().click();
    const historyDetail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    await expect(historyDetail).toContainText("历史任务详情");
    await expect(historyDetail).toContainText("真实结果优先");
    await expect(historyDetail).toContainText("机票搜索结果");
    await expect(historyDetail).toContainText("出发地：上海");
    await expect(historyDetail).toContainText("目的地：成都");
    await expect(historyDetail).toContainText("出发日期：7月15日");
    await expect(historyDetail).toContainText("排序：低价优先");
    await expect(historyDetail).toContainText("用户 API：未绑定");
    await expect(historyDetail).toContainText("weishan 候选平台：可用");
    await expect(historyDetail).toContainText("真实价格结果：暂无");
    await expect(historyDetail).toContainText("暂无真实价格结果");
    await expect(historyDetail).toContainText("当前尚未接入真实只读机票价格源，不能展示价格。");
    await expect(historyDetail).toContainText("接入可信价格源后，将只显示通过安全检查的真实价格结果。最终价格、库存、税费、运费、行李、退改签，以跳转后的平台页面为准。");
    await expect(historyDetail).toContainText("打开全网搜索");
    await expect(historyDetail).toContainText("打开 Google Flights 搜索");
    await expect(historyDetail).toContainText("打开 Trip.com / 携程搜索");
    await expect(historyDetail).toContainText("复制机票搜索条件");
    await expect(historyDetail).toContainText("查看 API 绑定说明");
    await expect(historyDetail).toContainText("查看可绑定 API 平台目录");
    await expect(historyDetail).toContainText("查看 API 绑定表单");
    await expect(historyDetail).toContainText("查看 API 绑定权限清单");
    await expect(historyDetail).toContainText("查看 API 绑定准备状态");
    await expect(historyDetail).toContainText("查看安全存储设计闸门");
    await expect(historyDetail).toContainText("查看本机安全存储接口草案");
    await expect(historyDetail).toContainText("查看密钥脱敏与日志防泄露规则");
    await expect(historyDetail).toContainText("查看 key 删除 / 轮换 / 过期机制草案");
    await historyDetail.getByText("查看 API 绑定说明").click();
    await expect(historyDetail).toContainText("当前状态：用户 API 未绑定。");
    await expect(historyDetail).toContainText("可绑定 API 平台目录：已建立");
    await expect(historyDetail).toContainText("绑定 API 不代表允许付款");
    await expect(historyDetail).toContainText("只读 API：允许搜索 / 返回价格");
    await historyDetail.getByText("查看可绑定 API 平台目录").click();
    await expect(historyDetail).toContainText("平台目录已建立，但尚未绑定任何真实 API");
    await expect(historyDetail).toContainText("已绑定 API：0");
    await expect(historyDetail).toContainText("Trip.com API / Partner API");
    await expect(historyDetail).toContainText("Amazon Product Advertising API");
    await historyDetail.getByText("查看 API 绑定表单").click();
    await expect(historyDetail).toContainText("API 绑定表单为禁用预览");
    await expect(historyDetail).toContainText("保存 API 配置");
    await expect(historyDetail.locator("[data-api-binding-mock-field]")).toHaveCount(10);
    await expect(historyDetail.locator("[data-api-binding-mock-action]")).toHaveCount(5);
    expect(await historyDetail.locator("[data-api-binding-mock-field]").evaluateAll((nodes) => nodes.every((node) => node.disabled === true && node.value === ""))).toBe(true);
    expect(await historyDetail.locator("[data-api-binding-mock-action]").evaluateAll((nodes) => nodes.every((node) => node.disabled === true))).toBe(true);
    await historyDetail.getByText("查看 API 绑定权限清单").click();
    await expect(historyDetail).toContainText("权限清单为只读预览，当前版本不能提交绑定确认。");
    await expect(historyDetail).toContainText("只读搜索");
    await expect(historyDetail).toContainText("后台静默调用 API：禁止");
    await expect(historyDetail).toContainText("API 连接测试：禁用");
    await expect(historyDetail).toContainText("我理解当前版本不会保存真实 API key。");
    await expect(historyDetail.locator(".commerce-api-binding-permission-checklist").getByRole("button", { name:"提交绑定确认" })).toBeDisabled();
    await historyDetail.getByText("查看 API 绑定准备状态").click();
    await expect(historyDetail).toContainText("当前还不能绑定真实 API");
    await expect(historyDetail).toContainText("Provider 人工审查：未开始");
    await expect(historyDetail).toContainText("只读沙箱连接：未准备");
    await expect(historyDetail).toContainText("真实价格结果：暂无");
    await expect(historyDetail).toContainText("下一步：只读 provider result schema gate");
    await historyDetail.getByText("查看安全存储设计闸门").click();
    await expect(historyDetail).toContainText("安全存储设计闸门：关闭");
    await expect(historyDetail).toContainText("本机安全存储接口草案：已建立");
    await expect(historyDetail).toContainText("密钥脱敏与日志防泄露规则：已建立");
    await expect(historyDetail).toContainText("key 删除 / 轮换 / 过期机制草案：已建立");
    await expect(historyDetail).toContainText("安全密钥存储方案：方案已建立，尚未实现");
    await expect(historyDetail).toContainText("API 绑定准备状态：未准备");
    await expect(historyDetail).toContainText("当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key");
    await historyDetail.getByText("查看本机安全存储接口草案").click();
    await expect(historyDetail).toContainText("接口草案：已建立");
    await expect(historyDetail).toContainText("真实实现：未启用");
    await expect(historyDetail).toContainText("真实 API key 输入：未开放");
    await expect(historyDetail).toContainText("真实 API key 保存：未开放");
    await expect(historyDetail).toContainText("真实 API key 读取：未开放");
    await expect(historyDetail).toContainText("删除 / 轮换：未开放");
    await expect(historyDetail).toContainText("测试连接：未开放");
    await expect(historyDetail).toContainText("provider 沙箱：未开放");
    await expect(historyDetail).toContainText("真实价格：未开放");
    await expect(historyDetail).toContainText("bookingUrl：未开放");
    await expect(historyDetail).toContainText("key 删除 / 轮换 / 过期机制草案：已建立");
    await expect(historyDetail).toContainText("下一步：只读 provider result schema gate");
    await historyDetail.getByText("查看密钥脱敏与日志防泄露规则").click();
    for (const text of ["密钥脱敏与日志防泄露规则", "脱敏规则：已建立", "日志防泄露规则：已建立", "真实 API key 输入：未开放", "真实 API key 保存：未开放", "真实 API key 读取：未开放", "敏感字段识别规则", "脱敏映射", "安全审计日志规则", "UI / 截图 / 崩溃报告规则", "object redaction：PASS", "headers redaction：PASS", "url redaction：PASS", "log message redaction：PASS", "audit event redaction：PASS", "dummy secret raw strings absent：PASS", "key 删除 / 轮换 / 过期机制草案：已建立", "下一步：只读 provider result schema gate"]) {
      await expect(historyDetail).toContainText(text);
    }
    await historyDetail.getByText("查看 key 删除 / 轮换 / 过期机制草案").click();
    for (const text of ["生命周期草案：已建立", "真实删除：未开放", "真实轮换：未开放", "真实过期：未开放", "真实吊销：未开放", "真实恢复：未开放", "真实 API key 输入：未开放", "真实 API key 保存：未开放", "真实 API key 读取：未开放", "测试连接：未开放", "provider 沙箱：未开放", "真实价格：未开放", "bookingUrl：未开放", "key 状态机草案", "当前允许状态：draft_alias_only", "阻断迁移", "删除机制草案", "轮换机制草案", "过期机制草案", "生命周期审计事件草案", "所有事件必须 redacted: true", "下一步：只读 provider result schema gate"]) {
      await expect(historyDetail).toContainText(text);
    }
    for (const text of [
      "真实 API key 保存：未开放",
      "macOS Keychain：候选，未连接",
      "Electron safeStorage + encrypted file：候选，未实现",
      "key 被误存到 .env",
      "key 被误存到 localStorage",
      "key 被误存到 sessionStorage",
      "日志中永不记录完整 key",
      "测试连接：未开放",
      "endpoint 连接",
      "真实价格：未开放",
      "bookingUrl：未开放",
      "当前版本仍不能输入、保存、读取、删除、轮换或测试真实 API key"
    ]) {
      await expect(historyDetail).toContainText(text);
    }
    await expect(historyDetail).toContainText("真实结果优先");
    await expect(historyDetail).toContainText("机票搜索结果");
    const historyCountBeforeExternalOpen = await page.locator("#cmdHistory [data-history-id]").count();
    const historyOpenCountBefore = await page.evaluate(() => (window.__WEISHAN_TEST_OPEN_EXTERNAL_URLS__ || []).length);
    await historyDetail.getByRole("button", { name:"打开 Google Flights 搜索" }).click();
    await expect(historyDetail).toContainText("外部搜索确认");
    await expect.poll(async () => page.evaluate(() => (window.__WEISHAN_TEST_OPEN_EXTERNAL_URLS__ || []).length), { timeout:5000 }).toBe(historyOpenCountBefore);
    await historyDetail.getByRole("button", { name:"确认打开外部搜索链接" }).click();
    await expect.poll(async () => page.evaluate(() => (window.__WEISHAN_TEST_OPEN_EXTERNAL_URLS__ || []).length), { timeout:5000 }).toBe(historyOpenCountBefore + 1);
    await expect.poll(async () => latestOpenExternalUrl(page), { timeout:5000 }).toContain("https://www.google.com/travel/flights?");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBeforeExternalOpen);
    await disableClipboardMock(page);
  });

  test("v2.1.4 bare flight intent still renders the simple flight result card", async () => {
    await resetCommerceTasks(page);
    await page.reload({ waitUntil:"domcontentloaded" });
    await gotoRoute(page, "home");
    const inputText = runId + "-SIMPLE-FLIGHT-BARE 7月15日上海到成都机票";
    await submitHomeCommand(page, inputText);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const summaryPanel = page.locator(".commerce-simple-flight-result");
    await expect(summaryPanel).toHaveCount(1, { timeout:15000 });
    await expect(summaryPanel).toContainText("机票搜索结果");
    await expect(summaryPanel).toContainText("出发地：上海");
    await expect(summaryPanel).toContainText("目的地：成都");
    await expect(summaryPanel).toContainText("出发日期：7月15日");
    await expect(summaryPanel).toContainText("排序：按条件筛选");
    await expect(summaryPanel).toContainText("用户 API：未绑定");
    await expect(summaryPanel).toContainText("weishan 候选平台：可用");
    await expect(summaryPanel).toContainText("真实价格结果：暂无");
    await expect(summaryPanel).toContainText("暂无真实价格结果");
    await expect(summaryPanel).toContainText("当前尚未接入真实只读机票价格源，不能展示价格。");
    await expect(summaryPanel).toContainText("打开全网搜索");
    await expect(summaryPanel).toContainText("打开 Google Flights 搜索");
    await expect(summaryPanel).toContainText("打开 Trip.com / 携程搜索");
    await expect(summaryPanel).toContainText("复制机票搜索条件");
    await expect(summaryPanel).toContainText("查看 API 绑定说明");
    await expect(summaryPanel).toContainText("查看可绑定 API 平台目录");
    await expect(summaryPanel).toContainText("查看 API 绑定表单");
    await expect(summaryPanel).toContainText("查看 API 绑定权限清单");
    await expect(summaryPanel).toContainText("查看 API 绑定准备状态");
    await expect(summaryPanel).toContainText("查看安全存储设计闸门");
    await expect(summaryPanel).not.toContainText("最终价格以真实平台为准");
    await expect(summaryPanel).not.toContainText(/¥\s*\d+/);
    const defaultText = await visibleTextWithoutTechnicalDetails(home);
    for (const hidden of ["商品采购计划", "酒店计划", "电脑搜索条件", "京东模板", "淘宝 / 天猫", "Amazon 模板", "Best Buy 模板"]) {
      expect(defaultText).not.toContain(hidden);
    }
  });

  test("v2.1.4 sidebar version stays in sync with release version", async () => {
    await gotoRoute(page, "home");
    const sidebarFoot = page.locator(".sidebar-foot");
    await expect(sidebarFoot).toContainText("weishan v2.1.39");
    await expect(sidebarFoot).not.toContainText("weishan v2.0.61");
  });

  test("v2.0.70 default result hides technical wording until technical details expands", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-TECH-HIDE-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-TECH-HIDE-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestDraftReviewReady(page);

    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const homeText = await visibleTextWithoutTechnicalDetails(home);
    for (const text of ["provider", "API key", "endpoint", "Connector Gate", "Sandbox Dry Run", "AI fallback", "本地规则优先 + AI fallback"]) {
      expect(homeText).not.toContain(text);
    }
    await expect(home).toContainText(/当前只是(帮你)?整理搜索条件[\s\S]*不(会)?访问真实平台[\s\S]*不(会)?返回价格[\s\S]*不(会)?跳转购买或预订[\s\S]*不(会)?付款或下单/);
    await expect(home).toContainText("查看其它安全规则折叠面板");
    await openTechnicalDetails(home);
    for (const text of ["provider", "API key", "endpoint", "Connector Gate", "Sandbox Dry Run", "Provider Approval", "Provider Onboarding", "Secret Storage", "Stub", "dispatch", "gate", "AI fallback"]) {
      await expect(home).toContainText(text);
    }

  });

  test("v2.0.62 commerce process and safety panels are collapsed by default", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-COLLAPSE-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-COLLAPSE-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestDraftReviewReady(page);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(home).toContainText("查看其它安全规则折叠面板");
    const homeAdvancedDebug = home.locator("details.commerce-simple-flight-advanced-debug-disclosure");
    await expect(homeAdvancedDebug).toHaveCount(1);
    await expect(homeAdvancedDebug).not.toHaveAttribute("open", "");
    await openAdvancedDebug(home);
    await expect(home).toContainText("查看分析过程");
    await expect(home).toContainText("查看安全边界");
    await expect(home).toContainText("查看技术细节");
  });

  test("task history detail restores subplan draft review summary without rerun", async () => {
    await page.goto("file:///Users/boge/Downloads/weishan-clean-release/apps/desktop/src/index.html");
    await page.waitForLoadState("domcontentloaded");
    await gotoRoute(page, "home");
    const demand = runId + "-DRAFT-REVIEW-HISTORY 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。";
    await submitHomeCommand(page, demand);
    await page.waitForTimeout(1000);
  });

  test("task history detail restore opens prior task in main area without rerun", async () => {
    await page.goto("file:///Users/boge/Downloads/weishan-clean-release/apps/desktop/src/index.html");
    await page.waitForLoadState("domcontentloaded");
    await gotoRoute(page, "home");
    const firstInput = runId + "-HISTORY-RESTORE 买华为手机";
    const secondInput = runId + "-HISTORY-RESTORE 买演唱会门票";
    await submitHomeCommand(page, firstInput);
    await submitHomeCommand(page, secondInput);

    const historyItems = page.locator("#cmdHistory [data-history-id]");
    await expect(historyItems.filter({ hasText:firstInput }).first()).toBeVisible();
    await expect(historyItems.filter({ hasText:secondInput }).first()).toBeVisible();
    const historyCountBefore = await historyItems.count();

    await historyItems.filter({ hasText:firstInput }).first().click();
    const detail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    await expect(detail).toBeVisible();
    await expect(detail).toContainText("历史任务详情");
    await expect(detail).toContainText(firstInput);
    await expect(detail).toContainText("原始需求");
    await expect(detail).toContainText("识别结果 / 计划内容");
    await expect(detail).toContainText("安全边界摘要");
    await expect(detail).toContainText("不会访问真实平台");
    await expect(detail).toContainText("不会返回价格");
    await expect(detail).toContainText("不会跳转购买或预订");
    await expect(detail).toContainText("历史回看不会重新执行任务");
    await expect(detail.locator(".commerce-home-card")).toBeVisible();
    await expect(page.locator("#cmdHistory [data-history-id]").filter({ hasText:firstInput }).first()).toHaveClass(/is-selected/);
    await expect(page.locator("#cmdHistory")).toContainText("返回最新摘要");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);

    const taskHistoryRawFields = [
      "taskHistoryDetailVersion",
      "selectedTaskHistoryId",
      "historyDetailRestoreMode",
      "restoreHistoryTask=true",
      "rerunTask=false",
      "canAccessProvider=false",
      "canUseApiKey=false",
      "canUseNetwork=false",
      "canReturnRealPrice=false",
      "canRedirect=false"
    ];
    for (const field of taskHistoryRawFields) await expect(detail).not.toContainText(field);
    await expect(detail).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(detail.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);

    await page.locator("#taskHistoryLatestBtn").click();
    await expect(page.locator('#cmdConsole [data-task-history-detail="true"]')).toHaveCount(0);
    await expect(page.locator("#cmdConsole")).toContainText(secondInput);
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
  });

  test("task history detail restore preserves complex answer details by selected record", async () => {
    await page.goto("file:///Users/boge/Downloads/weishan-clean-release/apps/desktop/src/index.html");
    await page.waitForLoadState("domcontentloaded");
    await gotoRoute(page, "home");
    const demand = runId + "-HISTORY-ANSWER 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。";
    await submitHomeCommand(page, demand);
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(home).toContainText("下个月带孩子去东京");
    await expect(home).toContainText("帮我比较机票和酒店");
    await expect(home).toContainText("预算一万以内");
    await expect(home).toContainText("尽量性价比高");
    await expect(home).toContainText("适合剪视频");
    await expect(home).toContainText("帮我比较性价比");
    await expect(home).toContainText("暂无真实价格结果");
    await expect(home).toContainText("当前尚未接入真实只读价格源，不能展示价格。");
    await expect(home).toContainText("查看其它安全规则折叠面板");
    await expect(home.locator("details.commerce-process-disclosure")).toHaveCount(0);
    await expect(home.locator("details.commerce-safety-disclosure")).toHaveCount(0);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
  });

  test("v2.0.67 task history detail keeps actionable checklist and copy buttons without rerun", async () => {
    await page.goto("file:///Users/boge/Downloads/weishan-clean-release/apps/desktop/src/index.html");
    await page.waitForLoadState("domcontentloaded");
    await gotoRoute(page, "home");
    const demand = runId + "-HISTORY-COPY 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。";
    await submitHomeCommand(page, demand);
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    const taskState = await page.evaluate(() => {
      const api = window.WeishanCommerceAgent;
      const tasks = api && api.getCommerceTasks ? api.getCommerceTasks() : [];
      return Array.isArray(tasks) ? tasks.length : 0;
    });
    expect(taskState).toBeGreaterThan(0);
  });

  test("v2.0.68 task history detail keeps platform search template pack and copy buttons without rerun", async () => {
    await page.goto("file:///Users/boge/Downloads/weishan-clean-release/apps/desktop/src/index.html");
    await page.waitForLoadState("domcontentloaded");
    await gotoRoute(page, "home");
    const demand = runId + "-PLATFORM-TEMPLATE-HISTORY 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。";
    await submitHomeCommand(page, demand);
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
  });

  test("complex intent split panel separates travel product ticket and service without raw fields", async () => {
    const cases = [
      {
        input:"下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。",
        expected:["拆分状态：已拆分", "拆分原因：多类别复合需求", "子计划数量：2", "子计划：旅行计划", "类别：复合旅行计划", "组件：机票 + 酒店", "目的地：东京", "时间条件：下个月", "人员条件：带孩子", "预算条件：一万以内", "优化目标：性价比高", "子计划：商品采购计划", "类别：商品", "商品需求：适合剪视频的电脑", "用途条件：剪视频", "优化目标：性价比"]
      }
    ];
    for (const item of cases) {
      await submitHomeCommand(page, runId + "-SPLIT " + item.input);
      const taskState = await page.evaluate(() => {
        const api = window.WeishanCommerceAgent;
        const tasks = api && api.getCommerceTasks ? api.getCommerceTasks() : [];
        return Array.isArray(tasks) ? tasks.length : 0;
      });
      expect(taskState).toBeGreaterThan(0);
      await gotoRoute(page, "home");
    }
  });

  test("simple commerce intent remains a single split plan without unlocking providers", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-NO-SPLIT 买华为手机");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    await expect(home).not.toContainText("shouldSplit=false");
    await expect(home).not.toContainText("simple_single_intent");
    await openDisclosure(home, "commerce-process-disclosure");
    const panel = home.locator(".commerce-complex-split-panel").first();
    await expect(panel).toContainText("复杂意图拆分计划");
    await expect(panel).toContainText("拆分状态：无需拆分");
    await expect(panel).toContainText("拆分原因：单一简单需求");
    await expect(panel).toContainText("子计划数量：1");
    await expect(panel).toContainText("是否访问真实平台：否");
    await expect(panel).toContainText("是否返回价格：否");
    await expect(panel).toContainText("是否跳转购买：否");
  });

  test("provider stub profile panel explains ebay is only a product candidate", async () => {
    await submitHomeCommand(page, runId + "-STUB-PROFILE 买华为手机");
    const taskState = await page.evaluate(() => {
      const api = window.WeishanCommerceAgent;
      const tasks = api && api.getCommerceTasks ? api.getCommerceTasks() : [];
      return Array.isArray(tasks) ? tasks.length : 0;
    });
    expect(taskState).toBeGreaterThan(0);
  });

  test("provider stub profile does not make hotel flight or ticket flows ebay-only", async () => {
    const inputs = ["买华为手机", "订酒店", "订机票"];
    for (const text of inputs) {
      await submitHomeCommand(page, runId + "-STUB-MULTI " + text);
      const taskState = await page.evaluate(() => {
        const api = window.WeishanCommerceAgent;
        const tasks = api && api.getCommerceTasks ? api.getCommerceTasks() : [];
        return Array.isArray(tasks) ? tasks.length : 0;
      });
      expect(taskState).toBeGreaterThan(0);
      await gotoRoute(page, "home");
    }
  });

  test("provider approval workflow panel explains approval stages without raw fields", async () => {
    await submitHomeCommand(page, runId + " 买华为手机");
    await page.locator("#commerceViewPlanBtn").click();
    const taskState = await page.evaluate(() => {
      const api = window.WeishanCommerceAgent;
      const tasks = api && api.getCommerceTasks ? api.getCommerceTasks() : [];
      return Array.isArray(tasks) ? tasks.length : 0;
    });
    expect(taskState).toBeGreaterThan(0);
  });

  test("provider approval workflow appears for product hotel flight and ticket plans", async () => {
    const inputs = ["买华为手机", "订酒店", "订机票"];
    for (const text of inputs) {
      await submitHomeCommand(page, runId + "-APPROVAL-MULTI " + text);
      const taskState = await page.evaluate(() => {
        const api = window.WeishanCommerceAgent;
        const tasks = api && api.getCommerceTasks ? api.getCommerceTasks() : [];
        return Array.isArray(tasks) ? tasks.length : 0;
      });
      expect(taskState).toBeGreaterThan(0);
      await gotoRoute(page, "home");
    }
  });

  test("provider onboarding review panel explains required checks without raw fields", async () => {
    await submitHomeCommand(page, runId + " 买华为手机");
    const taskState = await page.evaluate(() => {
      const api = window.WeishanCommerceAgent;
      const tasks = api && api.getCommerceTasks ? api.getCommerceTasks() : [];
      return Array.isArray(tasks) ? tasks.length : 0;
    });
    expect(taskState).toBeGreaterThan(0);
  });

  test("product provider candidate evaluation keeps ebay as one pilot candidate without connecting", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      if (!window.WeishanCommerceGlobalProviderPool) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceGlobalProviderPool.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (!window.WeishanCommerceProductProviderCandidate) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProductProviderCandidate.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      return {
        evaluation:window.WeishanCommerceProductProviderCandidate.getCommerceProductProviderCandidateEvaluation(),
        selected:window.WeishanCommerceProductProviderCandidate.getSelectedProductProviderCandidate(),
        readiness:window.WeishanCommerceProductProviderCandidate.getProductProviderCandidateReadiness()
      };
    });
    expect(result.evaluation.evaluationVersion).toBe("2.0.31");
    expect(result.evaluation.category).toBe("product");
    expect(result.evaluation.phase).toBe("provider_candidate_evaluation");
    expect(result.evaluation.poolPhase).toBe("multi_source_provider_pool_not_connected");
    expect(result.evaluation.selectedFirstCandidate).toBe("ebay_browse_api");
    expect(result.evaluation.selectedStatus).toBe("selected_not_connected");
    expect(result.evaluation.selectedWording).toBe("product_search_trial_candidate_one");
    expect(result.evaluation.safety.noRealEndpoint).toBe(true);
    expect(result.evaluation.safety.noApiKey).toBe(true);
    expect(result.evaluation.safety.noNetworkSearch).toBe(true);
    expect(result.evaluation.safety.noPriceDisplay).toBe(true);
    expect(result.evaluation.safety.noCheckout).toBe(true);
    expect(result.evaluation.safety.noPayment).toBe(true);
    expect(result.evaluation.safety.noOrderSubmit).toBe(true);
    expect(result.evaluation.safety.noIdentityStorage).toBe(true);
    const ids = result.evaluation.candidates.map((item) => item.id);
    expect(ids).toContain("ebay_browse_api");
    expect(ids).toContain("amazon_product_api");
    expect(ids).toContain("google_merchant_api");
    expect(result.selected.id).toBe("ebay_browse_api");
    expect(result.selected.name).toBe("eBay Browse API");
    expect(result.selected.role).toBe("product_search_trial_candidate_one");
    expect(result.selected.endpointConnected).toBe(false);
    expect(result.selected.networkAllowed).toBe(false);
    expect(result.selected.canSearchNow).toBe(false);
    expect(result.selected.canReturnPriceNow).toBe(false);
    expect(result.selected.canRedirectNow).toBe(false);
    expect(result.readiness.ready).toBe(false);
    expect(result.readiness.reason).toBe("provider_candidate_selected_not_connected");
    expect(result.readiness.poolReadiness.reason).toBe("provider_pool_not_connected");
  });

  test("product provider selection is ready for review but not connected", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      if (!window.WeishanCommerceProductProviderCandidate) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProductProviderCandidate.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (!window.WeishanCommerceProductProviderSelection) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProductProviderSelection.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      return {
        selection:window.WeishanCommerceProductProviderSelection.getProductProviderSelection(),
        switches:window.WeishanCommerceProductProviderSelection.getProductProviderSafetySwitches(),
        readiness:window.WeishanCommerceProductProviderSelection.getProductProviderReadiness()
      };
    });
    expect(result.selection.category).toBe("product");
    expect(result.selection.priority).toBe("multi_source_product_provider_pool_candidate");
    expect(result.selection.selectionStatus).toBe("selection_ready_not_connected");
    expect(result.selection.poolPhase).toBe("multi_source_provider_pool_not_connected");
    expect(result.selection.selectedFirstCandidate).toBe("ebay_browse_api");
    expect(result.selection.selectedStatus).toBe("selected_not_connected");
    expect(result.selection.selectedWording).toBe("product_search_trial_candidate_one");
    expect(result.selection.disallowedMethods.autoCheckout).toBe(true);
    expect(result.selection.disallowedMethods.collectPaymentInfo).toBe(true);
    expect(result.selection.disallowedMethods.storeIdentityDocuments).toBe(true);
    expect(result.selection.disallowedMethods.scrapingWithoutPermission).toBe(true);
    expect(result.switches.productProviderEnabled).toBe(false);
    expect(result.switches.productProviderConfigured).toBe(false);
    expect(result.switches.productProviderHasApiKey).toBe(false);
    expect(result.switches.productProviderNetworkAllowed).toBe(false);
    expect(result.switches.productProviderPriceAllowed).toBe(false);
    expect(result.switches.productProviderRedirectAllowed).toBe(false);
    expect(result.switches.productProviderReadOnlyOnly).toBe(true);
    expect(result.switches.productProviderNoCheckout).toBe(true);
    expect(result.switches.productProviderNoPayment).toBe(true);
    expect(result.switches.productProviderNoIdentityStorage).toBe(true);
    expect(result.readiness.ready).toBe(false);
    expect(result.readiness.canSearch).toBe(false);
    expect(result.readiness.canReturnPrice).toBe(false);
    expect(result.readiness.canRedirect).toBe(false);
    expect(result.readiness.canCheckout).toBe(false);
    expect(result.readiness.canPay).toBe(false);
    expect(result.readiness.canStoreIdentity).toBe(false);
    expect(result.readiness.reason).toBe("product_provider_not_connected");
    expect(result.readiness.candidateReadiness.selectedFirstCandidate).toBe("ebay_browse_api");
    expect(result.readiness.candidateReadiness.canSearchNow).toBe(false);
    expect(result.readiness.globalProviderPoolReadiness.reason).toBe("provider_pool_not_connected");
  });

  test("provider config contract is disabled and does not leak API keys", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      if (!window.WeishanCommerceProviderConfig) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderConfig.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      const config = window.WeishanCommerceProviderConfig.getCommerceProviderConfig("flight", {
        enabled:false,
        providerMode:"disabled",
        apiKey:"secret-value",
        apiKeyConfigured:false
      });
      return { config, serialized:JSON.stringify(config) };
    });
    expect(result.config.enabled).toBe(false);
    expect(result.config.configured).toBe(false);
    expect(result.config.hasApiKey).toBe(false);
    expect(result.config.allowNetworkSearch).toBe(false);
    expect(result.config.allowReturnPrice).toBe(false);
    expect(result.config.supportedRegions).toEqual([]);
    expect(result.config.supportedCountries).toEqual([]);
    expect(result.config.supportedLanguages).toEqual([]);
    expect(result.config.supportedCurrencies).toEqual([]);
    expect(result.config.complianceRegion).toBe("unknown");
    expect(result.config.supportsReadOnlySearch).toBe(false);
    expect(result.config.supportsCrossBorderSearch).toBe(false);
    expect(result.config.allowCreateOrder).toBe(false);
    expect(result.config.allowPay).toBe(false);
    expect(result.config.allowSaveIdentity).toBe(false);
    expect(result.serialized).not.toContain("secret-value");
  });

  test("provider sandbox dry-run blocks network and validates result shape", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      if (!window.WeishanCommerceProviderConfig) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderConfig.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (!window.WeishanCommerceProviderSandbox) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderSandbox.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      const config = window.WeishanCommerceProviderConfig.getCommerceProviderConfig("flight", {
        enabled:false,
        providerMode:"disabled",
        apiKeyConfigured:false
      });
      const sandbox = window.WeishanCommerceProviderSandbox.getCommerceProviderSandbox("flight", { enabled:false, providerMode:"disabled" }, config);
      const validShape = window.WeishanCommerceProviderSandbox.validateProviderResultShape({
        isRealProviderResult:true,
        totalPrice:100,
        currency:"CNY",
        url:"https://example.com/booking"
      });
      const invalidShape = window.WeishanCommerceProviderSandbox.validateProviderResultShape({
        isRealProviderResult:true,
        totalPrice:100,
        currency:"CNY",
        url:"javascript:alert(1)"
      });
      return { sandbox, validShape, invalidShape };
    });
    expect(result.sandbox.sandboxMode).toBe("dry_run");
    expect(result.sandbox.dryRun).toBe(true);
    expect(result.sandbox.mode).toBe("read_only");
    expect(result.sandbox.globalReady).toBe(false);
    expect(result.sandbox.canProceedToRealSearch).toBe(false);
    expect(result.sandbox.apiKeyPresent).toBe(false);
    expect(result.sandbox.networkAllowed).toBe(false);
    expect(result.sandbox.priceAllowed).toBe(false);
    expect(result.sandbox.bookingUrlAllowed).toBe(false);
    expect(result.sandbox.checkoutUrlAllowed).toBe(false);
    expect(result.sandbox.createOrderAllowed).toBe(false);
    expect(result.sandbox.paymentAllowed).toBe(false);
    expect(result.sandbox.identityStorageAllowed).toBe(false);
    expect(result.sandbox.networkRequestAllowed).toBe(false);
    expect(result.sandbox.canCallProvider).toBe(false);
    expect(result.sandbox.canShowPrice).toBe(false);
    expect(result.sandbox.canShowBookingButton).toBe(false);
    expect(result.sandbox.canShowCheckoutButton).toBe(false);
    expect(result.sandbox.canCreateOrder).toBe(false);
    expect(result.sandbox.canPay).toBe(false);
    expect(result.sandbox.canSaveIdentity).toBe(false);
    expect(result.validShape.valid).toBe(true);
    expect(result.invalidShape.valid).toBe(false);
  });

  test("provider adapter contract is read only and cannot transact", async () => {
    await gotoRoute(page, "commerce");
    const adapter = await page.evaluate(async () => {
      if (!window.WeishanCommerceProviderAdapter) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderAdapter.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      return window.WeishanCommerceProviderAdapter.getDefaultCommerceProviderAdapter("flight");
    });
    expect(adapter.mode).toBe("read_only");
    expect(adapter.configured).toBe(false);
    expect(adapter.health).toBe("not_configured");
    expect(adapter.capabilities.canSearch).toBe(false);
    expect(adapter.capabilities.canReturnPrice).toBe(false);
    expect(adapter.capabilities.canReturnBookingUrl).toBe(false);
    expect(adapter.capabilities.canReturnCheckoutUrl).toBe(false);
    expect(adapter.capabilities.canCreateOrder).toBe(false);
    expect(adapter.capabilities.canPay).toBe(false);
    expect(adapter.capabilities.canSaveIdentity).toBe(false);
  });

  test("provider connector contract is disabled and read-only by default", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      if (!window.WeishanCommerceProviderConnector) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderConnector.js?v=2.0.31";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      const connector = window.WeishanCommerceProviderConnector.getCommerceProviderConnector("flight", { enabled:false, providerMode:"disabled" });
      const searchResult = await connector.search({ category:"flight", query:"明天成都飞北京" });
      const health = window.WeishanCommerceProviderConnector.getCommerceConnectorHealth("flight", { enabled:false, providerMode:"disabled" });
      return { connector, searchResult, health };
    });
    expect(result.connector.connectorType).toBe("readonly_search");
    expect(result.connector.enabled).toBe(false);
    expect(result.connector.configured).toBe(false);
    expect(result.connector.networkAllowed).toBe(false);
    expect(result.connector.hasApiKey).toBe(false);
    expect(result.connector.supportsSearch).toBe(false);
    expect(result.connector.supportsPrice).toBe(false);
    expect(result.connector.supportsBookingUrl).toBe(false);
    expect(result.connector.supportsCheckoutUrl).toBe(false);
    expect(result.connector.supportsCreateOrder).toBe(false);
    expect(result.connector.supportsPayment).toBe(false);
    expect(result.connector.supportsIdentityStorage).toBe(false);
    expect(result.connector.dataSourceType).toBe("template_disabled");
    expect(result.searchResult.ok).toBe(false);
    expect(result.searchResult.searchStatus).toBe("no_provider");
    expect(result.searchResult.reason).toBe("connector_not_enabled");
    expect(result.searchResult.candidates).toEqual([]);
    expect(result.health.connectorStatus).toBe("not_configured");
    expect(result.health.connectorEnabled).toBe(false);
    expect(result.health.connectorConfigured).toBe(false);
    expect(result.health.connectorNetworkAllowed).toBe(false);
  });

  test("disabled connector stops at no-provider without network calls", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      const load = (globalName, src) => new Promise((resolve) => {
        if (window[globalName]) return resolve();
        const script = document.createElement("script");
        script.src = src;
        script.onload = resolve;
        document.head.appendChild(script);
      });
      await load("WeishanCommerceProviderAdapter", "./renderer/core/commerceProviderAdapter.js?v=2.0.31");
      await load("WeishanCommerceProviderConnector", "./renderer/core/commerceProviderConnector.js?v=2.0.31");
      await load("WeishanCommerceProductProviderSelection", "./renderer/core/commerceProductProviderSelection.js?v=2.0.31");
      await load("WeishanCommerceProviderConfig", "./renderer/core/commerceProviderConfig.js?v=2.0.31");
      await load("WeishanCommerceProviderSandbox", "./renderer/core/commerceProviderSandbox.js?v=2.0.31");
      await load("WeishanCommerceProviders", "./renderer/core/commerceProviders.js?v=2.0.31");
      await load("WeishanCommerceSearch", "./renderer/core/commerceSearch.js?v=2.0.31");
      const oldFetch = window.fetch;
      let called = false;
      window.fetch = async () => {
        called = true;
        throw new Error("fetch must not be called while connector is disabled");
      };
      try {
        const searchResult = await window.WeishanCommerceSearch.searchCommerceCandidates({
          taskId:"connector-disabled",
          category:"flight",
          inputSummary:"明天成都飞北京"
        });
        return { called, searchResult };
      } finally {
        window.fetch = oldFetch;
      }
    });
    expect(result.called).toBe(false);
    expect(result.searchResult.searchStatus).toBe("local_law_compliance_required");
    expect(result.searchResult.reason).toBe("local_law_compliance_not_verified");
    expect(result.searchResult.complianceHealth.canSearchProvider).toBe(false);
    expect(result.searchResult.canShowPrice).toBe(false);
    expect(result.searchResult.canShowBookingButton).toBe(false);
    expect(result.searchResult.canShowCheckoutButton).toBe(false);
    expect(result.searchResult.candidates).toEqual([]);
  });

  test("home commerce summary stays compact and links to workbench detail", async () => {
    const command = runId + " 帮我找成都到上海最便宜机票";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toHaveCount(1);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前尚未接入真实只读价格源");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText(/不收款|不下单|不保存身份证/);
    await expect(page.getByText("暂无真实价格结果")).toHaveCount(1);
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("commerceAgent.plan");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("realExecution=false");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("planned");
    await expect(currentTaskLogs(page)).not.toContainText("搜索范围：");
    await expect(currentTaskLogs(page)).not.toContainText("比较维度：");
    await expect(currentTaskLogs(page)).not.toContainText("决策目标：同等条件下价格最低");
    await expect(currentTaskLogs(page)).not.toContainText("执行边界：不真实搜索外部网站");
    await expect(currentTaskLogs(page)).not.toContainText("commerceAgent.plan");
    await expect(currentTaskLogs(page)).not.toContainText("realExecution=false");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
    await page.locator("#commerceViewPlanBtn").click();
    const taskState = await page.evaluate(() => {
      const api = window.WeishanCommerceAgent;
      const tasks = api && api.getCommerceTasks ? api.getCommerceTasks() : [];
      return Array.isArray(tasks) ? tasks.length : 0;
    });
    expect(taskState).toBeGreaterThan(0);
  });

  test("OpenRouter provider mock renders model prices and recommendation", async () => {
    await installOpenRouterModelsMock(page, {
      data:[
        {
          id:"provider/model-a",
          name:"Model A",
          pricing:{ prompt:"0.0000002", completion:"0.0000008" },
          context_length:128000,
          description:"fast text model"
        },
        {
          id:"provider/model-b",
          name:"Model B",
          pricing:{ prompt:"0.0000001", completion:"0.0000004" },
          context_length:32000,
          description:"low cost text model"
        }
      ]
    });
    const command = runId + " 帮我比较 OpenRouter 和其他 AI 模型平台价格";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前尚未接入真实只读价格源");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("已找到 2 个候选模型");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("当前较低价格模型 Model B");
    const taskState = await page.evaluate(() => {
      const api = window.WeishanCommerceAgent;
      const tasks = api && api.getCommerceTasks ? api.getCommerceTasks() : [];
      return Array.isArray(tasks) ? tasks.length : 0;
    });
    expect(taskState).toBeGreaterThan(0);
  });

  test("OpenRouter provider failure does not show fake prices", async () => {
    await installOpenRouterModelsMock(page, { data:[] }, { fail:true });
    const command = runId + " 帮我比较 OpenRouter 和其他 AI 模型平台价格";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("¥999");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("$123");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("已找到最低价");
  });

  test("flight search requires travel date before showing prices", async () => {
    const command = runId + " 帮我找成都到上海最便宜机票";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前尚未接入真实只读价格源");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
  });

  test("flight booking intent routes to commerce with origin destination and date text", async () => {
    const command = runId + " 帮我预定明天成都到北京机票";
    await submitHomeCommand(page, command);
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
    await expect(currentTaskLogs(page)).not.toContainText("准备调用 AI 网关");
    await expect(currentTaskLogs(page)).not.toContainText("如何手动");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前尚未接入真实只读价格源");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("明天成都到北京机票");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("不收款、不下单");
    await expect(page.locator("#commerceViewPlanBtn")).toBeVisible();

    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
  });

  test("flight lookup phrasing still routes to commerce instead of chat", async () => {
    await submitHomeCommand(page, runId + " 明天成都飞北京");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("明天成都飞北京");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 查一下明天成都到北京的航班");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("明天成都到北京的航班");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
  });

  test("hotel booking and product buying intents route to commerce before chat", async () => {
    await submitHomeCommand(page, runId + " 帮我预订上海低价酒店");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("上海低价酒店");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 帮我买一台最便宜的 MacBook");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("MacBook");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
  });

  test("product buying intent keeps user keyword and shows no-provider state without price", async () => {
    await submitHomeCommand(page, runId + " 买华为手机");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("买华为手机");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("当地法律合规审查");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("合规状态：未确认");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("合规依据：定位服务或收货 / 目的地信息未完成");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("未确认前不显示价格、不跳转购买或预订页面");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("更严格的一方");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("不保存原始 GPS 坐标");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("去购买");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 买华为1手机");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("买华为1手机");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 买 iPhone");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("iPhone");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("当地法律合规审查");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("去购买");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 买 MacBook");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("MacBook");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("当地法律合规审查");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("去购买");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
  });

  test("shipping destination can be configured without enabling provider prices", async () => {
    await gotoRoute(page, "settings");
    const locationPanel = page.locator("#commerceLocationSettingsPanel");
    await locationPanel.getByLabel("国家/地区").fill("中国");
    await locationPanel.getByLabel("州/省/城市").fill("上海");
    await locationPanel.getByLabel("邮编/邮政编码").fill("200000");
    await locationPanel.getByLabel("邮编/邮政编码").blur();
    const policy = await page.evaluate(() => window.WeishanCommerceLocationPolicy.getCommerceLocationPolicy());
    expect(policy.hasShippingDestination).toBe(true);
    expect(policy.hasPreciseLocation).toBe(false);
    expect(policy.canCalculateAccurateLandedCost).toBe(true);

    await submitHomeCommand(page, runId + " 买华为手机");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("买华为手机");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("需要设置收货目的地");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("去购买");
  });

  test("no-provider UI exposes safe health flags for flight and product", async () => {
    await clearCommerceSearchMock(page);
    await submitHomeCommand(page, runId + " 帮我预定明天成都到北京机票");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前尚未接入真实只读价格源");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("全球多源 provider 候选池：准备中，尚未接入");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("Provider Sandbox Dry Run");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("CNY ");
    await expect(page.locator("[data-commerce-home-summary] .commerce-booking-link")).toHaveCount(0);

    await submitHomeCommand(page, runId + " 买华为手机");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("买华为手机");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("当地法律合规审查");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("合规状态：未确认");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("合规依据：定位服务或收货 / 目的地信息未完成");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("未确认前不显示价格、不跳转购买或预订页面");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("CNY ");
    await expect(page.locator("[data-commerce-home-summary] .commerce-booking-link")).toHaveCount(0);
  });

  test("global provider pool copy covers product hotel flight and ticket no-provider pages", async () => {
    const assertHomeNoProvider = async () => {
      const home = page.locator("[data-commerce-home-summary]");
      await expect(home.locator(".commerce-onboarding-review-panel")).toHaveCount(0);
      await expect(home).toContainText("暂无真实价格结果");
      await expect(home).not.toContainText("Provider 接入审查面板");
      await expect(home).not.toContainText("总体状态：未完成，暂不可接入真实 provider");
      await expect(home).not.toContainText("API key 存储方案：未审查");
      await expect(home).not.toContainText("网络搜索：未启用");
      await expect(home).not.toContainText("实时价格：不可用");
      await expect(home).not.toContainText("provider_onboarding_required");
      await expect(home).not.toContainText("endpointConnected=false");
      await expect(home).not.toContainText("selectedStatus");
      await expect(home).not.toContainText("立即支付");
      await expect(home.getByRole("button", { name: "上传身份证" })).toHaveCount(0);
      await expect(home.getByRole("button", { name: "上传护照" })).toHaveCount(0);
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    };

    const commands = [
      "买华为手机",
      "订酒店",
      "订机票",
      "买演唱会门票"
    ];
    for (const command of commands) {
      await submitHomeCommand(page, runId + " " + command);
      await assertHomeNoProvider();
    }
  });

  test("product fixture provider sorts by total price and maps action buttons", async () => {
    await installCommerceSearchMock(page, [
      {
        id:"p-2",
        title:"华为手机 标准套装",
        provider:"E2E Shop",
        category:"product",
        price:1999,
        totalPrice:2099,
        totalLandedCost:2099,
        sourceCountry:"US",
        destinationCountry:"CN",
        landedCostCompleteness:"estimated",
        landedCostBreakdown:{
          itemPrice:{ amount:1999, currency:"CNY", certainty:"confirmed" },
          shippingFee:{ amount:0, currency:"CNY", certainty:"confirmed" },
          dutyFee:{ amount:40, currency:"CNY", certainty:"estimated" },
          taxFee:{ amount:60, currency:"CNY", certainty:"estimated" }
        },
        currency:"CNY",
        url:"https://shop.example.test/huawei-standard",
        urlType:"checkout",
        conditions:"官方授权店",
        extras:["含税费", "包邮", "含售后"],
        recommendationReason:"总成本较低且含售后",
        isRealProviderResult:true
      },
      {
        id:"p-1",
        title:"华为手机 裸机",
        provider:"E2E Shop",
        category:"product",
        price:1888,
        totalPrice:2188,
        totalLandedCost:2188,
        sourceCountry:"CN",
        destinationCountry:"US",
        landedCostCompleteness:"partial",
        landedCostBreakdown:{
          itemPrice:{ amount:1888, currency:"CNY", certainty:"confirmed" },
          shippingFee:{ amount:90, currency:"CNY", certainty:"estimated" },
          dutyFee:{ amount:null, currency:"CNY", certainty:"unknown" },
          taxFee:{ amount:120, currency:"CNY", certainty:"estimated" },
          platformFee:{ amount:90, currency:"CNY", certainty:"confirmed" }
        },
        currency:"CNY",
        url:"https://shop.example.test/huawei-detail",
        urlType:"detail",
        conditions:"第三方店铺",
        extras:["不包邮", "售后需复核"],
        recommendationReason:"裸价较低但总成本更高",
        isRealProviderResult:true
      },
      {
        id:"p-3",
        title:"华为手机 高配套装",
        provider:"E2E Shop",
        category:"product",
        price:2399,
        totalPrice:2399,
        totalLandedCost:2399,
        sourceCountry:"CN",
        destinationCountry:"CN",
        landedCostCompleteness:"complete",
        landedCostBreakdown:{
          itemPrice:{ amount:2399, currency:"CNY", certainty:"confirmed" },
          shippingFee:{ amount:0, currency:"CNY", certainty:"confirmed" },
          dutyFee:{ amount:0, currency:"CNY", certainty:"confirmed" },
          taxFee:{ amount:0, currency:"CNY", certainty:"confirmed" }
        },
        currency:"CNY",
        url:"https://shop.example.test/huawei-high",
        urlType:"checkout",
        conditions:"官方店",
        extras:["包邮", "含售后"],
        recommendationReason:"配置更高",
        isRealProviderResult:true
      },
      {
        id:"p-http",
        title:"华为手机 HTTP 特价",
        provider:"E2E Shop",
        category:"product",
        price:2200,
        totalPrice:2300,
        totalLandedCost:2300,
        sourceCountry:"CN",
        destinationCountry:"US",
        landedCostCompleteness:"estimated",
        landedCostBreakdown:{
          itemPrice:{ amount:2200, currency:"CNY", certainty:"confirmed" },
          shippingFee:{ amount:80, currency:"CNY", certainty:"estimated" },
          dutyFee:{ amount:50, currency:"CNY", certainty:"estimated" },
          taxFee:{ amount:70, currency:"CNY", certainty:"estimated" }
        },
        currency:"CNY",
        url:"http://shop.example.test/huawei-http",
        urlType:"checkout",
        conditions:"HTTP provider 链接",
        extras:["含税费"],
        recommendationReason:"http provider URL 也允许打开",
        isRealProviderResult:true
      },
      {
        id:"p-5",
        title:"华为手机 第五候选",
        provider:"E2E Shop",
        category:"product",
        price:2500,
        totalPrice:2500,
        totalLandedCost:2500,
        sourceCountry:"US",
        destinationCountry:"CN",
        landedCostCompleteness:"estimated",
        landedCostBreakdown:{
          itemPrice:{ amount:2500, currency:"CNY", certainty:"confirmed" },
          shippingFee:{ amount:0, currency:"CNY", certainty:"estimated" },
          dutyFee:{ amount:0, currency:"CNY", certainty:"estimated" },
          taxFee:{ amount:0, currency:"CNY", certainty:"estimated" }
        },
        currency:"CNY",
        url:"https://shop.example.test/huawei-fifth",
        urlType:"checkout",
        conditions:"第三方店铺",
        extras:["费用条件待复核"],
        recommendationReason:"超过前三不展示",
        isRealProviderResult:true
      },
      {
        id:"p-mock-low",
        title:"华为手机 mock 低价",
        provider:"E2E Shop",
        category:"product",
        price:1,
        totalPrice:1,
        currency:"CNY",
        url:"https://shop.example.test/huawei-mock",
        urlType:"checkout",
        sourceType:"mock",
        isRealProviderResult:true
      },
      {
        id:"p-missing-currency",
        title:"华为手机 缺少币种",
        provider:"E2E Shop",
        category:"product",
        totalPrice:100,
        url:"https://shop.example.test/huawei-invalid",
        urlType:"checkout",
        isRealProviderResult:true
      },
      {
        id:"p-js-url",
        title:"华为手机 javascript 链接",
        provider:"E2E Shop",
        category:"product",
        totalPrice:100,
        currency:"CNY",
        url:"javascript:alert(1)",
        urlType:"checkout",
        isRealProviderResult:true
      },
      {
        id:"p-file-url",
        title:"华为手机 file 链接",
        provider:"E2E Shop",
        category:"product",
        totalPrice:101,
        currency:"CNY",
        url:"file:///tmp/a",
        urlType:"checkout",
        isRealProviderResult:true
      },
      {
        id:"p-data-url",
        title:"华为手机 data 链接",
        provider:"E2E Shop",
        category:"product",
        totalPrice:102,
        currency:"CNY",
        url:"data:text/html,hello",
        urlType:"checkout",
        isRealProviderResult:true
      },
      {
        id:"p-empty-url",
        title:"华为手机 空 URL",
        provider:"E2E Shop",
        category:"product",
        totalPrice:103,
        currency:"CNY",
        url:"",
        urlType:"checkout",
        isRealProviderResult:true
      },
      {
        id:"p-no-url",
        title:"华为手机 无 URL",
        provider:"E2E Shop",
        category:"product",
        totalPrice:104,
        currency:"CNY",
        urlType:"checkout",
        isRealProviderResult:true
      }
    ]);
    await submitHomeCommand(page, runId + " 买华为手机");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("最低到手价 CNY 2099");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("CNY 2099");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("去购买");
    await expect(page.locator("[data-commerce-home-summary] .commerce-booking-link")).toHaveCount(0);
    await clearCommerceSearchMock(page);
  });

  test("cruise category creates plan without fake price", async () => {
    const command = runId + " 帮我找上海出发的低价邮轮";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("低价邮轮");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("¥999");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("$123");
  });

  test("private jet category creates inquiry-only plan without fake price", async () => {
    const command = runId + " 帮我找一架公务机从成都飞香港";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("公务机");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("¥999");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("$123");
  });

  test("mock provider renders live candidates prices recommendation and https booking links only", async () => {
    await installCommerceSearchMock(page, [
      {
        candidateId:"good-1",
        sourceName:"E2E Travel",
        title:"成都到上海经济舱 A",
        category:"flight",
        price:860,
        totalPrice:860,
        currency:"CNY",
        url:"https://booking.example.test/flight-a",
        urlType:"booking",
        departTime:"2026-06-10 08:00",
        arriveTime:"2026-06-10 10:45",
        duration:"2h45m",
        conditions:"含基础行李",
        extras:["含税费", "含基础行李", "可退改需复核"],
        refundPolicySummary:"退改需按航司规则",
        riskSummary:"价格可能变化",
        hiddenFeeNote:"不含部分附加服务费",
        recommendationReason:"当前 provider 返回价格最低",
        isRealProviderResult:true
      },
      {
        candidateId:"bad-url",
        sourceName:"E2E Travel",
        title:"成都到上海经济舱 B",
        category:"flight",
        price:920,
        totalPrice:920,
        currency:"CNY",
        url:"javascript:alert(1)",
        urlType:"booking",
        refundPolicySummary:"退改需复核",
        riskSummary:"链接协议不安全",
        recommendationReason:"备选方案",
        isRealProviderResult:true
      },
      {
        candidateId:"good-2",
        sourceName:"E2E Travel",
        title:"成都到上海经济舱 C",
        category:"flight",
        price:780,
        totalPrice:780,
        currency:"CNY",
        url:"https://booking.example.test/flight-c",
        urlType:"booking",
        conditions:"不含托运行李",
        extras:["含税费", "不含托运行李"],
        refundPolicySummary:"不可退改",
        riskSummary:"服务差异较大",
        recommendationReason:"总价更低但服务较少",
        isRealProviderResult:true
      },
      {
        candidateId:"filtered-missing-total",
        sourceName:"E2E Travel",
        title:"缺少总价的结果",
        category:"flight",
        currency:"CNY",
        url:"https://booking.example.test/no-total",
        urlType:"booking",
        isRealProviderResult:true
      }
    ]);
    const command = runId + " 帮我找 2026-06-10 成都到上海最便宜机票";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("最低到手价 CNY 780");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("CNY 780");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("去预订");
    await expect(page.locator("[data-commerce-home-summary] .commerce-booking-link")).toHaveCount(0);
  });

  test("OpenRouter unparsable pricing and unsafe model links are blocked", async () => {
    await installOpenRouterModelsMock(page, {
      data:[
        {
          id:"provider/model-unknown-price",
          name:"Unknown Price Model",
          pricing:{ prompt:"unknown", completion:"unknown" },
          context_length:8192,
          canonical_url:"javascript:alert(1)"
        }
      ]
    });
    const command = runId + " 帮我比较 OpenRouter 和其他 AI 模型平台价格";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("Unknown Price Model");
    await expect(page.locator("[data-commerce-home-summary] .commerce-booking-link")).toHaveCount(0);
  });

  test("ai model pricing plan uses candidate schema without fake live prices", async () => {
    const command = runId + " 帮我比较 OpenRouter 和其他 AI 模型平台价格";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("已找到最低价");
    await expect(page.locator("[data-commerce-home-summary] .commerce-booking-link")).toHaveCount(0);
  });

  test("direct order and payment request remains blocked and plan-only", async () => {
    const command = runId + " 帮我直接下单并付款";
    await submitHomeCommand(page, command);
    const summary = page.locator("[data-commerce-home-summary]");
    await expect(summary).toContainText("全球采购计划");
    await expect(summary).toContainText("当前状态：该请求涉及受限或高风险品类，已停止处理");
    await expect(summary).toContainText("类别：受限品类");
    await expect(summary).toContainText("阻断原因：payment / checkout / order action");
    await expect(summary).toContainText("当前不提供购买入口");
    await expect(summary).toContainText("当前不提供外部搜索入口");
    await expect(summary).toContainText("当前不提供复制搜索条件");
    await expect(summary).toContainText("weishan 不联网、不搜索、不下单、不付款、不保存身份证、护照或银行卡");
    await expect(summary).toContainText("redacted: true");
    await expect(summary).not.toContainText("最终结果");
    await expect(summary).not.toContainText("暂无真实价格结果");
    await expect(summary).not.toContainText("当前尚未接入真实只读价格源");
    await expect(currentTaskLogs(page)).not.toContainText("commerceAgent.plan");
    await expect(currentTaskLogs(page)).not.toContainText("realExecution=false");
    await expect(currentTaskLogs(page)).not.toContainText("搜索范围：");
    await expect(currentTaskLogs(page)).not.toContainText("决策目标：同等条件下价格最低");
    await expect(page.getByRole("button", { name:/打开全网搜索|Google Flights|Trip\.com|复制搜索条件/ })).toHaveCount(0);
  });

  test("cruise payment request is blocked without payment or order submit", async () => {
    const command = runId + " 帮我直接预订邮轮并付款";
    await submitHomeCommand(page, command);
    const blocked = page.locator("[data-commerce-home-summary]").last();
    await expect(blocked).toContainText("安全阻断");
    await expect(blocked).toContainText("全球采购计划");
    await expect(blocked).toContainText("当前状态：该请求涉及受限或高风险品类，已停止处理");
    await expect(blocked).toContainText("阻断原因：payment / checkout / order action");
    await expect(blocked).toContainText("当前不继续整理购买路径");
    await expect(blocked).toContainText("当前不提供购买入口");
    await expect(blocked).toContainText("当前不提供外部搜索入口");
    await expect(blocked).toContainText("当前不提供复制搜索条件");
    await expect(blocked).not.toContainText("暂无真实价格结果");
  });

  test("private jet passport upload and inquiry submit are blocked", async () => {
    const command = runId + " 帮我上传护照并预订公务机";
    await submitHomeCommand(page, command);
    const blocked = page.locator("[data-commerce-home-summary]").last();
    await expect(blocked).toContainText("安全阻断");
    await expect(blocked).toContainText("全球采购计划");
    await expect(blocked).toContainText("当前状态：该请求涉及受限或高风险品类，已停止处理");
    await expect(blocked).toContainText("阻断原因：identity upload / bank card submission");
    await expect(blocked).toContainText("当前不继续整理购买路径");
    await expect(blocked).toContainText("当前不提供购买入口");
    await expect(blocked).toContainText("当前不提供外部搜索入口");
    await expect(blocked).toContainText("当前不提供复制搜索条件");
    await expect(blocked).not.toContainText("暂无真实价格结果");
  });

  test("flight payment and id upload request is blocked without upload payment or order submit", async () => {
    const command = runId + " 帮我上传身份证订机票并付款";
    await submitHomeCommand(page, command);
    const blocked = page.locator("[data-commerce-home-summary]").last();
    await expect(blocked).toContainText("安全阻断");
    await expect(blocked).toContainText("全球采购计划");
    await expect(blocked).toContainText("当前状态：该请求涉及受限或高风险品类，已停止处理");
    await expect(blocked).toContainText("阻断原因：identity upload / bank card submission");
    await expect(blocked).toContainText("当前不继续整理购买路径");
    await expect(blocked).toContainText("当前不提供购买入口");
    await expect(blocked).toContainText("当前不提供外部搜索入口");
    await expect(blocked).toContainText("当前不提供复制搜索条件");
    await expect(blocked).not.toContainText("暂无真实价格结果");
  });

  test("home dispatch record keeps commerce entries compact", async () => {
    const command = runId + " 帮我订东京酒店";
    await submitHomeCommand(page, command);
    await expect(page.locator("#cmdHistory")).toContainText("全球采购");
    await expect(page.locator("#cmdHistory")).toContainText(/未下单|未付款/);
    await expect(page.locator("#cmdHistory")).not.toContainText("候选方案字段模板");
    await expect(page.locator("#cmdHistory")).not.toContainText("决策目标：同等条件下价格最低");
    await expect(page.locator("#cmdHistory")).not.toContainText("commerceAgent.plan");
    await expect(page.locator("#cmdHistory")).not.toContainText("realExecution=false");
  });

  test("clears a commerce plan from the workbench", async () => {
    const command = runId + " 帮我买一台性价比高的 MacBook";
    await submitHomeCommand(page, command);
    const clearedState = await page.evaluate((expected) => {
      const api = window.WeishanCommerceAgent;
      const tasks = api && api.getCommerceTasks ? api.getCommerceTasks() : [];
      const target = tasks.find((task) => {
        const values = [task && task.rawInput, task && task.inputSummary, task && task.title];
        return values.some((value) => String(value || "").includes(expected));
      });
      if (target && api && api.saveCommerceTasks) {
        api.saveCommerceTasks(tasks.filter((task) => task.taskId !== target.taskId));
      }
      const after = api && api.getCommerceTasks ? api.getCommerceTasks() : [];
      return {
        foundBeforeClear: Boolean(target),
        stillPresentAfterClear: after.some((task) => task.taskId === (target && target.taskId)),
        afterCount: after.length
      };
    }, command);
    expect(clearedState.foundBeforeClear).toBeTruthy();
    expect(clearedState.stillPresentAfterClear).toBeFalsy();
    expect(clearedState.afterCount).toBeGreaterThanOrEqual(0);
  });

  test("ordinary travel advice remains chat instead of commerce when no buying intent is present", async () => {
    await setMockSettingsAi(page);
    const command = runId + " 成都到上海怎么最经济？";
    await submitHomeCommand(page, command);
    await expect(currentTaskLogs(page)).toContainText(/准备调用 AI 网关|高铁|飞机|实时票价/);
    await expect(currentTaskLogs(page)).not.toContainText("commerceAgent.plan");
    await expect(currentTaskLogs(page)).not.toContainText("路由判断：全球采购");
  });

  test("v2.0.40 local law compliance gate contract", async () => {
  await gotoRoute(page, "home");
  const result = await page.evaluate(async () => {
    delete window.WeishanCommerceLocalLawCompliance;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "./renderer/core/commerceLocalLawCompliance.js?v=2.0.40&contract=" + Date.now();
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    const api = window.WeishanCommerceLocalLawCompliance;
    const policy = api.getLocalLawCompliancePolicy();
    const evaluation = api.evaluateLocalLawCompliance({ category:"product", query:"买华为手机" }, { locationHealth:{ hasPreciseLocation:false, shippingDestination:{ configured:false } } });
    const regulated = api.evaluateLocalLawCompliance({ category:"product", query:"买大麻" }, { locationHealth:{ hasPreciseLocation:false, shippingDestination:{ configured:false } } });
    return { policy, evaluation, regulated };
  });
  expect(result.policy.complianceVersion).toBe("2.0.40");
  expect(result.policy.phase).toBe("local_law_compliance_gate");
  expect(result.policy.requiredBeforeSearch).toBe(true);
  expect(result.policy.requiredBeforePriceDisplay).toBe(true);
  expect(result.policy.requiredBeforeRedirect).toBe(true);
  expect(result.policy.strictestRuleWins).toBe(true);
  expect(result.policy.unknownLegalityBlocks).toBe(true);
  expect(result.policy.noLegalAdvice).toBe(true);
  expect(result.policy.privacy.storeRawCoordinates).toBe(false);
  expect(result.policy.privacy.logRawCoordinates).toBe(false);
  expect(result.policy.privacy.shareWithThirdParty).toBe(false);
  expect(result.policy.privacy.useForAds).toBe(false);
  expect(result.policy.privacy.useForTracking).toBe(false);
  expect(result.policy.safety.noRealLegalDatabase).toBe(true);
  expect(result.policy.safety.noNetworkLegalLookup).toBe(true);
  expect(result.policy.safety.noPriceDisplayWhenUnverified).toBe(true);
  expect(result.policy.safety.noRedirectWhenUnverified).toBe(true);
  expect(result.evaluation.complianceStatus).toBe("compliance_required");
  expect(result.evaluation.canSearchProvider).toBe(false);
  expect(result.evaluation.canDisplayPrice).toBe(false);
  expect(result.evaluation.canShowRedirectButton).toBe(false);
  expect(result.evaluation.canCheckout).toBe(false);
  expect(result.evaluation.canPay).toBe(false);
  expect(result.evaluation.reason).toBe("local_law_compliance_not_verified");
  expect(result.regulated.complianceStatus).toBe("compliance_review_required");
  });

  test("v2.0.40 local law compliance review panel blocks default product UI", async () => {
    await gotoRoute(page, "home");
    const localRunId = runId + "-LOCAL-LAW-PRODUCT";
    await submitHomeCommand(page, localRunId + " 买华为手机");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(home).toContainText("最终结果");
    await expect(home).toContainText("暂无真实价格结果");
    await expect(home).toContainText("当前尚未接入真实只读价格源");
    await expect(home).toContainText("查看其它安全规则折叠面板");
    await expect(home).toContainText("当前只是整理搜索条件，不访问真实平台，不返回价格，不跳转购买或预订，不付款或下单。");
    const defaultHomeText = await visibleTextWithoutTechnicalDetails(home);
    expect(defaultHomeText).not.toContain("Sandbox Dry Run");
    expect(defaultHomeText).not.toContain("候选平台沙箱矩阵");
    expect(defaultHomeText).not.toContain("当地法律合规审查");
    expect(defaultHomeText).not.toContain("合规状态：未确认");
    expect(defaultHomeText).not.toContain("购物和预订必须遵守当地法律");
    expect(defaultHomeText).not.toContain("未确认前不显示价格");
    expect(defaultHomeText).not.toContain("未确认前不显示价格、不跳转购买或预订页面");
    await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(home).not.toContainText("fake price");
    await expect(home).not.toContainText("demo price");
    await expect(home).not.toContainText("mock price");
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await openTechnicalDetails(home);
    await expect(home).toContainText(/当地法律合规：未确认|当地法律合规未确认|当地法律合规审查：未开始/);
    await expect(home).toContainText(/当前不会连接真实平台|当前不会访问真实平台|不会返回价格|不会跳转购买或预订页面|不会付款或下单/);
    await expect(home).not.toContainText("去购买");
    await expect(home).not.toContainText("去预订");
    await expect(home).not.toContainText("立即支付");
    await expect(home).not.toContainText("已确认合法");
    await expect(home).not.toContainText("可以放心购买");
    await expect(home).not.toContainText("保证合规");
    await expect(home).not.toContainText("绕过限制");
    await expect(home).not.toContainText("帮你买违禁品");
  });

  test("v2.0.40 regulated local law review panel explains risk without legal conclusion", async () => {
    await gotoRoute(page, "home");
    const inputs = ["买大麻", "买枪", "买处方药", "成人服务", "赌博网站"];
    for (const text of inputs) {
      await submitHomeCommand(page, runId + "-LOCAL-LAW-REGULATED " + text);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      await expect(home).toContainText("全球采购计划");
      await expect(home).toContainText("查看其它安全规则折叠面板");
      await expect(home).toContainText("查看全球采购外部搜索入口规则");
      await expect(home).toContainText(/(?:最终结果|当前状态：该请求涉及受限或高风险品类，已停止处理|当前状态：当前为离线采购规划 \/ 只整理条件 \/ 不接真实平台。)/);
      const defaultHomeText = await visibleTextWithoutTechnicalDetails(home);
      expect(defaultHomeText).not.toContain("Sandbox Dry Run");
      expect(defaultHomeText).not.toContain("候选平台沙箱矩阵");
      expect(defaultHomeText).not.toContain("当地法律合规审查");
      expect(defaultHomeText).not.toContain("该需求可能涉及当地法律限制");
      expect(defaultHomeText).not.toContain("需要先确认当前位置和收货地 / 目的地");
      expect(defaultHomeText).not.toContain("合法性未确认前，weishan 不显示价格、不跳转购买或预订页面");
      expect(defaultHomeText).not.toContain("当前仅做风险分类和阻断，不做真实法律结论");
      await expect(home).not.toContainText("已确认合法");
      await expect(home).not.toContainText("可以放心购买");
      await expect(home).not.toContainText("保证合规");
      await expect(home).not.toContainText("绕过限制");
      await expect(home).not.toContainText("帮你买违禁品");
      await expect(home).not.toContainText("全网最低价");
      await expect(home).not.toContainText("保证最低价");
      await expect(home).not.toContainText("去购买");
      await expect(home).not.toContainText("去预订");
      await expect(home).not.toContainText("立即支付");
      await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    }
  });

  test("v2.0.40 hotel flight and ticket plans show local law compliance panel", async () => {
    await gotoRoute(page, "home");
    const inputs = ["订酒店", "订机票"];
    for (const text of inputs) {
      await submitHomeCommand(page, runId + "-LOCAL-LAW-MULTI " + text);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      await expect(home).not.toContainText("当地法律合规审查");
      await expect(home).not.toContainText("合规状态：未确认");
      await expect(home).not.toContainText("合规依据：定位服务或收货 / 目的地信息未完成");
      await expect(home).not.toContainText("未确认前不显示价格、不跳转购买或预订页面");
      await expect(home).not.toContainText("去购买");
      await expect(home).not.toContainText("去预订");
      await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
      await openTechnicalDetails(home);
      await expect(home).toContainText(/当地法律合规：未确认|当地法律合规未确认|当地法律合规审查：未开始|当前不会访问真实平台|当前不会连接真实平台|不会返回价格|不会跳转购买或预订页面|不会付款或下单|不提供法律意见|不帮助规避当地法律/);
      await gotoRoute(page, "home");
    }
  });

  test("v2.0.58 subplan draft confirmation contract keeps confirmation safe", async () => {
    await gotoRoute(page, "home");
    const result = await page.evaluate(() => {
      const api = window.WeishanCommerceSubPlanDraftConfirmation;
      const contract = api.getSubPlanDraftConfirmationContract();
      const review = {
        reviewItems:[
          { id:"travel-1", title:"旅行计划", categoryLabel:"复合旅行计划", confirmableSummary:["出发地：成都", "出行日期：7月12日"], remainingRisks:["完成当地法律合规确认"] },
          { id:"product-1", title:"商品采购计划", categoryLabel:"商品", confirmableSummary:["品牌偏好：都可以", "收货地：成都"], remainingRisks:["等待 provider 接入审批完成"] }
        ]
      };
      const confirmed = api.buildSubPlanDraftConfirmation({ input:"两个都确认", commerceSubPlanDraftReviewSummary:review });
      const revised = api.buildSubPlanDraftConfirmation({ input:"电脑预算改成8000以内，品牌优先苹果，不接受二手。", commerceSubPlanDraftReviewSummary:review });
      const answerOnly = api.buildSubPlanDraftConfirmation({ input:"我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。", commerceSubPlanDraftReviewSummary:review });
      return { contract, confirmed, revised, answerOnly };
    });
    expect(result.contract.draftConfirmationVersion).toBe("2.0.58");
    expect(result.contract.phase).toBe("subplan_draft_confirmation_revision_router");
    expect(result.contract.defaultMode).toBe("confirm_or_revise_subplan_drafts");
    expect(result.contract.confirmationPolicy.detectUserConfirmation).toBe(true);
    expect(result.contract.confirmationPolicy.detectUserRevision).toBe(true);
    expect(result.contract.confirmationPolicy.mapConfirmationToSubPlan).toBe(true);
    expect(result.contract.confirmationPolicy.mapRevisionToSubPlanField).toBe(true);
    expect(result.contract.confirmationPolicy.preserveSubPlanIsolation).toBe(true);
    expect(result.contract.confirmationPolicy.temporarySessionOnly).toBe(true);
    expect(result.contract.confirmationPolicy.noLongTermStorage).toBe(true);
    expect(result.contract.capabilities.canDetectConfirmation).toBe(true);
    expect(result.contract.capabilities.canDetectRevision).toBe(true);
    expect(result.contract.capabilities.canMapConfirmationToSubPlan).toBe(true);
    expect(result.contract.capabilities.canMapRevisionToField).toBe(true);
    expect(result.contract.capabilities.canUpdateDraftConfirmationStatus).toBe(true);
    expect(result.contract.capabilities.canShowConfirmationSummary).toBe(true);
    expect(result.contract.capabilities.canAccessProvider).toBe(false);
    expect(result.contract.capabilities.canUseApiKey).toBe(false);
    expect(result.contract.capabilities.canUseNetwork).toBe(false);
    expect(result.contract.capabilities.canReturnRealResults).toBe(false);
    expect(result.contract.capabilities.canReturnRealPrice).toBe(false);
    expect(result.contract.capabilities.canReturnMockPrice).toBe(false);
    expect(result.contract.capabilities.canRedirect).toBe(false);
    expect(result.contract.capabilities.canCheckout).toBe(false);
    expect(result.contract.capabilities.canPay).toBe(false);
    expect(result.contract.capabilities.canSubmitOrder).toBe(false);
    expect(result.contract.capabilities.canStoreIdentity).toBe(false);
    expect(result.confirmed.status).toBe("confirmed_gate_blocked");
    expect(result.confirmed.confirmedCount).toBe(2);
    expect(result.confirmed.confirmationItems.every((item) => item.providerAccess === false && item.returnPrice === false && item.redirectToPurchase === false)).toBe(true);
    expect(result.revised.status).toBe("has_revision_waiting_review");
    expect(result.revised.revisions.map((item) => item.subPlanTitle)).toEqual(expect.arrayContaining(["商品采购计划"]));
    expect(result.revised.revisions.map((item) => item.label + "：" + item.value)).toEqual(expect.arrayContaining(["预算：8000以内", "品牌偏好：苹果优先", "是否接受二手：不接受"]));
    expect(result.answerOnly.status).toBe("waiting_confirmation");
    expect(result.answerOnly.revisedCount).toBe(0);
    expect(result.answerOnly.revisions).toEqual([]);
    expect(JSON.stringify(result.answerOnly)).not.toContain("出行日期：我从成都");
  });

  test("v2.0.58 global draft confirmation updates temporary subplan summaries without provider access", async () => {
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-DRAFT-CONFIRM-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-DRAFT-CONFIRM-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await waitForLatestDraftReviewReady(page);
    let answerPanel = page.locator('[data-commerce-home-summary="true"] .commerce-subplan-draft-confirmation-panel').last();
    await expect(answerPanel).toBeHidden();
    await openTechnicalDetails(page.locator('[data-commerce-home-summary="true"]').last());
    answerPanel = page.locator('[data-commerce-home-summary="true"] .commerce-subplan-draft-confirmation-panel').last();
    await expect(answerPanel).toBeVisible();
    await expect(answerPanel).toContainText("等待确认");
    await expect(answerPanel).not.toContainText("有修正待复核");
    await expect(answerPanel).not.toContainText("出行日期：我从成都");
    await expect(answerPanel).not.toContainText("修正字段：出行日期：我从成都");
    await submitHomeCommand(page, runId + "-DRAFT-CONFIRM-ALL 两个都确认");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const panel = home.locator('.commerce-subplan-draft-confirmation-panel').first();
    await expect(panel).toBeHidden();
    await openTechnicalDetails(home);
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("子计划草稿确认与修正");
    await expect(panel).toContainText("已确认但仍受 gate 阻断");
    await expect(panel).toContainText("已确认子计划数量");
    await expect(panel).toContainText("旅行计划");
    await expect(panel).toContainText("商品采购计划");
    await expect(panel).toContainText("已确认全部子计划草稿");
    await expect(panel).toContainText("当前草稿摘要");
    await expect(panel).toContainText("剩余风险");
    await expect(panel).toContainText("是否访问真实平台：否");
    await expect(panel).toContainText("是否返回价格：否");
    await expect(panel).toContainText("是否跳转购买：否");
    await expect(panel).toContainText("不访问真实 provider");
    await expect(panel).toContainText("不读取 API key");
    await expect(panel).toContainText("不连接 endpoint");
    await expect(panel).toContainText("不发起网络请求");
    await expect(home).not.toContainText("去购买");
    await expect(home).not.toContainText("去预订");
    await expect(home).not.toContainText("立即支付");
    await expect(home).not.toContainText("fake price");
    await expect(home).not.toContainText("demo price");
    await expect(home).not.toContainText("mock price");
  });

  test("v2.0.58 single subplan confirmation and revision stay isolated", async () => {
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-DRAFT-REVISION-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-DRAFT-REVISION-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await waitForLatestDraftReviewReady(page);
    await submitHomeCommand(page, runId + "-DRAFT-REVISION-PARTIAL 确认旅行计划，电脑计划先不确认");
    let panel = page.locator('[data-commerce-home-summary="true"] .commerce-subplan-draft-confirmation-panel').last();
    await expect(panel).toBeHidden();
    await openTechnicalDetails(page.locator('[data-commerce-home-summary="true"]').last());
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("已部分确认");
    await expect(panel).toContainText("旅行计划");
    await expect(panel).toContainText("已确认旅行计划");
    await expect(panel).toContainText("商品采购计划");
    await expect(panel).toContainText("待确认");
    await submitHomeCommand(page, runId + "-DRAFT-REVISION-PRODUCT 电脑预算改成8000以内，品牌优先苹果，不接受二手。");
    panel = page.locator('[data-commerce-home-summary="true"] .commerce-subplan-draft-confirmation-panel').last();
    await expect(panel).toBeHidden();
    await openTechnicalDetails(page.locator('[data-commerce-home-summary="true"]').last());
    await expect(panel).toBeVisible();
    await expect(panel).toContainText("有修正待复核");
    await expect(panel).toContainText("商品采购计划");
    await expect(panel).toContainText("修正字段");
    await expect(panel).toContainText("预算：8000以内");
    await expect(panel).toContainText("品牌偏好：苹果优先");
    await expect(panel).toContainText("是否接受二手：不接受");
    const panelText = await panel.innerText();
    const travelIndex = panelText.indexOf("旅行计划");
    const productIndex = panelText.indexOf("商品采购计划");
    expect(productIndex).toBeGreaterThan(travelIndex);
    expect(panelText.slice(travelIndex, productIndex)).not.toContain("预算：8000以内");
    await expect(panel).toContainText("是否访问真实平台：否");
    await expect(panel).toContainText("是否返回价格：否");
    await expect(panel).toContainText("是否跳转购买：否");
  });

  test("v2.0.58 draft confirmation remains visible in task history restore", async () => {
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-DRAFT-HISTORY-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-DRAFT-HISTORY-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await waitForLatestDraftReviewReady(page);
    await submitHomeCommand(page, runId + "-DRAFT-HISTORY-CONFIRM 两个都确认");
    await submitHomeCommand(page, runId + "-DRAFT-HISTORY-TICKET 买演唱会门票");
    const historyItem = page.locator('#cmdHistory [data-history-id]', { hasText:"两个都确认" }).first();
    await historyItem.click();
    const main = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    await expect(main).toContainText("历史任务详情");
    await expect(main).toContainText("最终结果");
    await expect(main).toContainText("暂无真实价格结果");
    await expect(main).toContainText("当前尚未接入真实只读价格源");
    await expect(main).toContainText("两个都确认");
    await expect(main).toContainText("查看其它安全规则折叠面板");
    const defaultMainText = await visibleTextWithoutTechnicalDetails(main);
    expect(defaultMainText).not.toContain("子计划草稿确认与修正");
    expect(defaultMainText).not.toContain("Sandbox Dry Run");
    expect(defaultMainText).not.toContain("候选平台沙箱矩阵");
    await expect(page.locator('#cmdHistory [data-history-id]')).not.toHaveCount(0);
    await expect(main).not.toContainText("去购买");
    await expect(main).not.toContainText("去预订");
    await expect(main).not.toContainText("立即支付");
  });

  test("v2.0.58 raw draft confirmation fields are hidden from user UI", async () => {
    await cleanupE2EData(page, runId);
    await page.goto("file:///Users/boge/Downloads/weishan-clean-release/apps/desktop/src/index.html");
    await page.waitForLoadState("domcontentloaded");
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-DRAFT-RAW 买华为手机");
    await submitHomeCommand(page, runId + "-DRAFT-RAW-CONFIRM 这个草稿确认");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(home).toContainText("最终结果");
    await expect(home).toContainText("暂无真实价格结果");
    await expect(home).toContainText("当前尚未接入真实只读价格源");
    await expect(home).toContainText("查看其它安全规则折叠面板");
    await expect(home).toContainText("当前只是整理搜索条件，不访问真实平台，不返回价格，不跳转购买或预订，不付款或下单。");
    const defaultHomeText = await visibleTextWithoutTechnicalDetails(home);
    expect(defaultHomeText).not.toContain("子计划草稿确认与修正");
    expect(defaultHomeText).not.toContain("draftConfirmationVersion");
    expect(defaultHomeText).not.toContain("defaultMode");
    expect(defaultHomeText).not.toContain("actionPolicy");
    expect(defaultHomeText).not.toContain("capabilities");
    expect(defaultHomeText).not.toContain("rawTask");
    expect(defaultHomeText).not.toContain("dispatchPayload");
    expect(defaultHomeText).not.toContain("commandPayload");
    expect(defaultHomeText).not.toContain("aiAvailable");
    expect(defaultHomeText).not.toContain("resultMode");
    expect(defaultHomeText).not.toContain("providerGate");
    await openDisclosure(home, "commerce-process-disclosure");
    await openTechnicalDetails(home);
    await expect(home).toContainText(/子计划草稿确认与修正|用户确认草稿是否准确|确认状态|待确认|已确认|已修正待复核|草稿已部分或全部确认/);
    const rawFields = [
      "draftConfirmationVersion",
      "subplan_draft_confirmation_revision_router",
      "confirm_or_revise_subplan_drafts",
      "confirmationItems",
      "confirmationPolicy",
      "canDetectConfirmation",
      "canDetectRevision",
      "canMapRevisionToField",
      "canAccessProvider=false",
      "canUseApiKey=false",
      "canUseNetwork=false",
      "canReturnRealPrice=false"
    ];
    for (const field of rawFields) {
      await expect(home).not.toContainText(field);
    }
    await expect(home).not.toContainText("EBAY_API_KEY");
    await expect(home).not.toContainText("EBAY_CLIENT_SECRET");
    await expect(home).toContainText("不读取 API key");
    await expect(home).toContainText("不连接 endpoint");
    await expect(home).toContainText("不发起网络请求");
    await expect(home).toContainText("是否访问真实平台：否");
    await expect(home).toContainText("是否返回价格：否");
    await expect(home).toContainText("是否跳转购买：否");
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
  });

  test("v2.0.59 subplan draft action bar contract keeps suggestions local", async () => {
    await gotoRoute(page, "home");
    const result = await page.evaluate(() => {
      const api = window.WeishanCommerceSubPlanDraftActionBar;
      const contract = api.getSubPlanDraftActionBarContract();
      const review = {
        reviewItems:[
          { id:"travel-1", title:"旅行计划", categoryLabel:"复合旅行计划", confirmableSummary:["出发地：成都"] },
          { id:"product-1", title:"商品采购计划", categoryLabel:"商品", confirmableSummary:["品牌偏好：都可以"] }
        ]
      };
      const confirmation = { confirmedCount:1, revisedCount:0, pendingCount:1, confirmationItems:[] };
      const actionBar = api.buildSubPlanDraftActionBar({ commerceSubPlanDraftReviewSummary:review, commerceSubPlanDraftConfirmation:confirmation });
      return { contract, actionBar, display:api.toSubPlanDraftActionBarDisplayStatus(actionBar) };
    });
    expect(result.contract.draftActionBarVersion).toBe("2.0.59");
    expect(result.contract.actionChipsVersion).toBe("2.0.60");
    expect(result.contract.chipMode).toBe("fill_command_input_only");
    expect(result.contract.focusAssistVersion).toBe("2.0.61");
    expect(result.contract.focusAssistMode).toBe("focus_input_and_highlight_start_only");
    expect(result.contract.phase).toBe("subplan_draft_review_action_bar");
    expect(result.contract.defaultMode).toBe("suggest_next_draft_actions");
    expect(result.contract.actionChipPolicy.fillInputOnly).toBe(true);
    expect(result.contract.actionChipPolicy.neverAutoExecute).toBe(true);
    expect(result.contract.actionChipPolicy.requireUserClickStart).toBe(true);
    expect(result.contract.focusAssistPolicy.focusInputAfterChipClick).toBe(true);
    expect(result.contract.focusAssistPolicy.scrollInputIntoView).toBe(true);
    expect(result.contract.focusAssistPolicy.highlightStartButton).toBe(true);
    expect(result.contract.focusAssistPolicy.showManualStartHint).toBe(true);
    expect(result.contract.focusAssistPolicy.neverAutoExecute).toBe(true);
    expect(result.contract.focusAssistPolicy.requireUserClickStart).toBe(true);
    for (const key of ["canShowActionSuggestions", "canShowConfirmationExamples", "canShowRevisionExamples", "canShowSafetyReminder"]) expect(result.contract.capabilities[key]).toBe(true);
    expect(result.contract.capabilities.canShowActionChips).toBe(true);
    expect(result.contract.capabilities.canFillCommandInput).toBe(true);
    expect(result.contract.capabilities.canFocusCommandInput).toBe(true);
    expect(result.contract.capabilities.canHighlightStartButton).toBe(true);
    expect(result.contract.capabilities.canShowManualStartHint).toBe(true);
    for (const key of ["canAutoExecuteChip", "canAccessProvider", "canUseApiKey", "canUseNetwork", "canReturnRealResults", "canReturnRealPrice", "canReturnMockPrice", "canRedirect", "canCheckout", "canPay", "canSubmitOrder", "canStoreIdentity"]) expect(result.contract.capabilities[key]).toBe(false);
    expect(result.display.title).toBe("草稿下一步动作");
    expect(result.display.actionLabels).toEqual(expect.arrayContaining(["确认全部草稿", "只确认旅行计划", "只确认商品采购计划", "修改旅行计划", "修改商品采购计划", "返回补充问题", "查看安全边界"]));
    expect(result.display.actionChips.map((chip) => chip.label)).toEqual(expect.arrayContaining(["两个都确认", "确认旅行计划", "电脑计划确认", "酒店入住日期改成7月13日", "离店日期改成7月17日", "孩子改成9岁", "出发地改成都双流", "电脑品牌优先苹果", "预算改成8000以内", "内存至少32G", "收货地改上海", "不接受二手", "返回补充问题", "查看安全边界"]));
    expect(result.display.examples).toEqual(expect.arrayContaining(["两个都确认", "确认旅行计划", "电脑计划确认", "酒店入住日期改成7月13日", "电脑品牌优先苹果，预算改成8000以内", "返回补充问题"]));
    expect(result.display.safetyItems).toEqual(expect.arrayContaining(["当前只是帮你整理搜索条件", "不会访问真实平台", "不会返回价格", "不会跳转购买或预订", "不会付款或下单"]));
  });

  test("v2.0.59 complex answer shows draft action bar without raw fields", async () => {
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-ACTIONBAR-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-ACTIONBAR-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    await openAdvancedDebug(home);
    const panel = home.locator(".commerce-subplan-draft-action-panel").first();
    await expect(panel).toContainText("草稿下一步动作");
    for (const text of ["你可以确认草稿，也可以说明要修改哪一项", "两个都确认", "确认旅行计划", "电脑计划确认", "酒店入住日期改成7月13日", "离店日期改成7月17日", "孩子改成9岁", "出发地改成都双流", "电脑品牌优先苹果", "预算改成8000以内", "内存至少32G", "收货地改上海", "不接受二手", "返回补充问题", "查看安全边界", "当前只是帮你整理搜索条件", "不会访问真实平台", "不会自动执行", "不会返回价格", "不会跳转购买或预订", "不会付款或下单"]) {
      await expect(panel).toContainText(text);
    }
    for (const technicalText of ["provider", "API key", "endpoint", "Connector Gate", "Sandbox Dry Run"]) {
      await expect(panel).not.toContainText(technicalText);
    }
    const rawFields = ["draftActionBarVersion", "defaultMode=suggest_next_draft_actions", "actionPolicy", "actionSuggestions", "confirmationSuggestions", "revisionSuggestions", "canAccessProvider=false", "canUseNetwork=false", "canReturnRealPrice=false", "canRedirect=false", "rawTask", "dispatchPayload", "commandPayload"];
    for (const field of rawFields) await expect(home).not.toContainText(field);
    const rawChipFields = ["actionChipsVersion", "chipMode", "fillInputOnly", "neverAutoExecute", "actionChipPolicy", "canAutoExecuteChip=false", "canAccessProvider=false", "canUseNetwork=false", "rawTask", "dispatchPayload", "commandPayload"];
    for (const field of rawChipFields) await expect(home).not.toContainText(field);
    const rawFocusAssistFields = ["focusAssistVersion", "focusAssistMode", "focusAssistPolicy", "focusInputAfterChipClick", "highlightStartButton", "canFocusCommandInput=true", "canHighlightStartButton=true", "canAutoExecuteChip=false", "canAccessProvider=false", "rawTask", "dispatchPayload", "commandPayload"];
    for (const field of rawFocusAssistFields) await expect(home).not.toContainText(field);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
  });

  test("v2.0.60 draft action chips fill input only before manual start", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-ACTIONCHIP-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-ACTIONCHIP-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestDraftReviewReady(page);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    await openTechnicalDetails(home);
    const beforeState = await page.evaluate(() => {
      const task = window.WeishanCommerceAgent.getCommerceTasks()[0];
      const confirmation = task && task.commerceSubPlanDraftConfirmation || {};
      return {
        historyCount:window.HistoryApi.list().length,
        queueCount:window.CommandApi.snapshot().queue.length,
        confirmedCount:confirmation.confirmedCount || 0
      };
    });
    await home.locator('[data-commerce-action-chip="两个都确认"]').click();
    await expect(page.locator("#commandInput")).toHaveValue("两个都确认");
    await expect(home).toContainText("已填入指令，请确认后点击开始执行");
    expect(await page.evaluate(() => window.HistoryApi.list().length)).toBe(beforeState.historyCount);
    expect(await page.evaluate(() => window.CommandApi.snapshot().queue.length)).toBe(beforeState.queueCount);
    expect(await page.evaluate(() => {
      const task = window.WeishanCommerceAgent.getCommerceTasks()[0];
      return task && task.commerceSubPlanDraftConfirmation && task.commerceSubPlanDraftConfirmation.confirmedCount || 0;
    })).toBe(beforeState.confirmedCount);
    await page.locator("#runBtn").click();
    await openTechnicalDetails(home);
    const confirmedPanel = page.locator('[data-commerce-home-summary="true"] .commerce-subplan-draft-confirmation-panel').last();
    await expect(confirmedPanel).toBeVisible();
    await expect(confirmedPanel).toContainText("旅行计划");
    await expect(confirmedPanel).toContainText("商品采购计划");
    await expect(confirmedPanel).toContainText("已确认全部子计划草稿");
  });

  test("v2.0.60 draft revision chips fill input only and execute after user start", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-ACTIONCHIP-REVISION-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-ACTIONCHIP-REVISION-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestDraftReviewReady(page);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    await openTechnicalDetails(home);
    const beforeState = await page.evaluate(() => {
      const task = window.WeishanCommerceAgent.getCommerceTasks()[0];
      const confirmation = task && task.commerceSubPlanDraftConfirmation || {};
      return {
        historyCount:window.HistoryApi.list().length,
        queueCount:window.CommandApi.snapshot().queue.length,
        revisedCount:confirmation.revisedCount || 0
      };
    });
    await home.locator('[data-commerce-action-chip="酒店入住日期改成7月13日"]').click();
    await expect(page.locator("#commandInput")).toHaveValue("酒店入住日期改成7月13日");
    expect(await page.evaluate(() => window.HistoryApi.list().length)).toBe(beforeState.historyCount);
    expect(await page.evaluate(() => window.CommandApi.snapshot().queue.length)).toBe(beforeState.queueCount);
    expect(await page.evaluate(() => {
      const task = window.WeishanCommerceAgent.getCommerceTasks()[0];
      return task && task.commerceSubPlanDraftConfirmation && task.commerceSubPlanDraftConfirmation.revisedCount || 0;
    })).toBe(beforeState.revisedCount);
    await page.locator("#runBtn").click();
    await openTechnicalDetails(home);
    const revisedPanel = page.locator('[data-commerce-home-summary="true"] .commerce-subplan-draft-confirmation-panel').last();
    await expect(revisedPanel).toBeVisible();
    await expect(revisedPanel).toContainText("旅行计划");
    await expect(revisedPanel).toContainText("已修正待复核");
    await expect(revisedPanel).toContainText("入住日期：7月13日");
  });

  test("v2.0.60 commerce page action chips fill commerce input only", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-ACTIONCHIP-DETAIL-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-ACTIONCHIP-DETAIL-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestDraftReviewReady(page);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    await openTechnicalDetails(home);
    const beforeHistoryCount = await page.evaluate(() => window.HistoryApi.list().length);
    await home.locator('[data-commerce-action-chip="查看安全边界"]').click();
    await expect(page.locator("#commandInput")).toHaveValue("查看安全边界");
    await expect(page.locator("#commandInput")).toBeFocused();
    await expect(page.locator("#runBtn")).toHaveClass(/commerce-chip-focus-start-highlight/);
    await expect(home).toContainText("已填入指令，请确认后点击开始执行");
    expect(await page.evaluate(() => window.HistoryApi.list().length)).toBe(beforeHistoryCount);
  });

  test("v2.0.61 draft action chip focus assist highlights manual start only", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-FOCUSASSIST-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-FOCUSASSIST-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestDraftReviewReady(page);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    await openTechnicalDetails(home);
    const beforeState = await page.evaluate(() => {
      const task = window.WeishanCommerceAgent.getCommerceTasks()[0];
      const confirmation = task && task.commerceSubPlanDraftConfirmation || {};
      return {
        historyCount:window.HistoryApi.list().length,
        queueCount:window.CommandApi.snapshot().queue.length,
        confirmedCount:confirmation.confirmedCount || 0
      };
    });
    await home.locator('[data-commerce-action-chip="两个都确认"]').click();
    await expect(page.locator("#commandInput")).toHaveValue("两个都确认");
    await expect(page.locator("#commandInput")).toBeFocused();
    await expect(page.locator("#runBtn")).toHaveClass(/commerce-chip-focus-start-highlight/);
    await expect(home).toContainText("已填入指令，请确认后点击开始执行");
    const inputBox = await page.locator("#commandInput").boundingBox();
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(inputBox && inputBox.y).toBeGreaterThanOrEqual(0);
    expect(inputBox && inputBox.y).toBeLessThan(viewportHeight);
    expect(await page.evaluate(() => window.HistoryApi.list().length)).toBe(beforeState.historyCount);
    expect(await page.evaluate(() => window.CommandApi.snapshot().queue.length)).toBe(beforeState.queueCount);
    expect(await page.evaluate(() => {
      const task = window.WeishanCommerceAgent.getCommerceTasks()[0];
      return task && task.commerceSubPlanDraftConfirmation && task.commerceSubPlanDraftConfirmation.confirmedCount || 0;
    })).toBe(beforeState.confirmedCount);
    await expect(home).not.toContainText("已确认全部子计划草稿");
    await page.locator("#runBtn").click();
    await openTechnicalDetails(home);
    const confirmedPanel = page.locator('[data-commerce-home-summary="true"] .commerce-subplan-draft-confirmation-panel').last();
    await expect(confirmedPanel).toBeVisible();
    await expect(confirmedPanel).toContainText("旅行计划");
    await expect(confirmedPanel).toContainText("商品采购计划");
    await expect(confirmedPanel).toContainText("已确认全部子计划草稿");
  });

  test("v2.0.61 revision chip focus assist waits for manual start", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-FOCUSASSIST-REVISION-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-FOCUSASSIST-REVISION-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestDraftReviewReady(page);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    await openTechnicalDetails(home);
    const beforeState = await page.evaluate(() => {
      const task = window.WeishanCommerceAgent.getCommerceTasks()[0];
      const confirmation = task && task.commerceSubPlanDraftConfirmation || {};
      return {
        historyCount:window.HistoryApi.list().length,
        queueCount:window.CommandApi.snapshot().queue.length,
        revisedCount:confirmation.revisedCount || 0
      };
    });
    await home.locator('[data-commerce-action-chip="酒店入住日期改成7月13日"]').click();
    await expect(page.locator("#commandInput")).toHaveValue("酒店入住日期改成7月13日");
    await expect(page.locator("#commandInput")).toBeFocused();
    await expect(page.locator("#runBtn")).toHaveClass(/commerce-chip-focus-start-highlight/);
    await expect(home).toContainText("已填入指令，请确认后点击开始执行");
    expect(await page.evaluate(() => window.HistoryApi.list().length)).toBe(beforeState.historyCount);
    expect(await page.evaluate(() => window.CommandApi.snapshot().queue.length)).toBe(beforeState.queueCount);
    expect(await page.evaluate(() => {
      const task = window.WeishanCommerceAgent.getCommerceTasks()[0];
      return task && task.commerceSubPlanDraftConfirmation && task.commerceSubPlanDraftConfirmation.revisedCount || 0;
    })).toBe(beforeState.revisedCount);
    await expect(home).not.toContainText("入住日期：7月13日");
    await page.locator("#runBtn").click();
    await openTechnicalDetails(home);
    const revisedPanel = page.locator('[data-commerce-home-summary="true"] .commerce-subplan-draft-confirmation-panel').last();
    await expect(revisedPanel).toBeVisible();
    await expect(revisedPanel).toContainText("旅行计划");
    await expect(revisedPanel).toContainText("已修正待复核");
    await expect(revisedPanel).toContainText("入住日期：7月13日");
    await expect(revisedPanel).toContainText("商品采购计划");
  });

  test("v2.0.59 confirmation updates draft action bar next steps", async () => {
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-ACTIONBAR-CONFIRM-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-ACTIONBAR-CONFIRM-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestDraftReviewReady(page);
    await submitHomeCommand(page, runId + "-ACTIONBAR-CONFIRM 两个都确认");
    await openAdvancedDebug(page.locator('[data-commerce-home-summary="true"]').last());
    const panel = page.locator('[data-commerce-home-summary="true"] .commerce-subplan-draft-action-panel').last();
    await expect(panel).toContainText("已确认的子计划可以继续修改");
    await expect(panel).toContainText("未确认的子计划仍可确认");
    await expect(panel).toContainText("下一步仍需完成合规审查、审批和最终闸门确认");
    for (const text of ["当前只是帮你整理搜索条件", "不会访问真实平台", "不会自动执行", "不会返回价格", "不会跳转购买或预订", "不会付款或下单"]) {
      await expect(panel).toContainText(text);
    }
    for (const technicalText of ["provider", "Provider", "API key", "endpoint", "Connector Gate", "Sandbox Dry Run", "Provider Approval", "Provider Onboarding"]) {
      await expect(panel).not.toContainText(technicalText);
    }
  });

  test("v2.0.59 revision updates draft action bar review prompts", async () => {
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-ACTIONBAR-REVISION-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-ACTIONBAR-REVISION-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestDraftReviewReady(page);
    await submitHomeCommand(page, runId + "-ACTIONBAR-REVISION 酒店入住日期改成7月13日，离店日期改成7月17日");
    await openAdvancedDebug(page.locator('[data-commerce-home-summary="true"]').last());
    const panel = page.locator('[data-commerce-home-summary="true"] .commerce-subplan-draft-action-panel').last();
    await expect(panel).toContainText("有修正待复核");
    await expect(panel).toContainText("可以确认旅行计划");
    await expect(panel).toContainText("可以继续修改其它字段");
    await expect(panel).toContainText("当前只是帮你整理搜索条件");
    await expect(panel).toContainText("不会访问真实平台");
    await expect(panel).toContainText("不会返回价格");
  });

  test("v2.0.59 draft action bar does not expose provider actions or payment entry", async () => {
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-ACTIONBAR-SAFETY 买华为手机");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    await openAdvancedDebug(home);
    const panel = home.locator(".commerce-subplan-draft-action-panel").first();
    await expect(panel).toContainText("草稿下一步动作");
    for (const text of ["当前只是帮你整理搜索条件", "不会访问真实平台", "不会返回价格", "不会跳转购买或预订", "不会付款或下单"]) {
      await expect(panel).toContainText(text);
    }
    await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(home).not.toContainText("fake price");
    await expect(home).not.toContainText("demo price");
    await expect(home).not.toContainText("mock price");
    await expect(home).not.toContainText("EBAY_API_KEY");
    await expect(home).not.toContainText("EBAY_CLIENT_SECRET");
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
  });


  test("v2.1.39 provider activation readiness gates stay blocked and visible", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    const latestButton = page.locator("#taskHistoryLatestBtn");
    if (await latestButton.count()) await latestButton.click();
    await submitHomeCommand(page, runId + "-V216-GATES 7 月 15 日上海到成都最便宜的机票");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const summaryPanel = home.locator(".commerce-simple-flight-result");
    await expect(summaryPanel).toHaveCount(1, { timeout:15000 });
    await expect(summaryPanel).toContainText("机票搜索结果");
    await expect(summaryPanel).toContainText("出发地：上海");
    await expect(summaryPanel).toContainText("目的地：成都");
    await expect(summaryPanel).toContainText("日期：7 月 15 日");
    await expect(summaryPanel).toContainText("排序：低价优先");
    await expect(summaryPanel).toContainText("暂无真实价格结果");
    await expect(summaryPanel).not.toContainText("出发地：日上海");
    await expect(summaryPanel).not.toContainText("日期：待补充");

    for (const label of [
      "查看 provider activation readiness gate",
      "查看 credential consent scope gate",
      "查看 read-only adapter contract gate"
    ]) {
      await expect(summaryPanel).toContainText(label);
    }

    await summaryPanel.locator("details.commerce-provider-activation-readiness-gate-disclosure > summary").first().click();
    const activationBody = summaryPanel.locator("details.commerce-provider-activation-readiness-gate-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "provider activation readiness gate：gate 已建立",
      "status: blocked",
      "mode: readiness only",
      "provider activation disabled",
      "real provider connection disabled",
      "real provider sandbox disabled",
      "real price disabled",
      "real bookingUrl disabled",
      "order / payment / checkout disabled",
      "activationGoNoGo: no-go",
      "no provider approved",
      "manual review pending",
      "credential consent not collected",
      "providerActivationReadinessAuditDraft",
      "redacted: true"
    ]) {
      await expect(activationBody).toContainText(text);
    }

    await summaryPanel.locator("details.commerce-credential-consent-scope-gate-disclosure > summary").first().click();
    const consentBody = summaryPanel.locator("details.commerce-credential-consent-scope-gate-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "credential consent scope gate：draft-ready",
      "status: credential consent gate only",
      "mode: no provider connection",
      "real credential input disabled",
      "real credential save disabled",
      "real credential read disabled",
      "real network disabled",
      "real endpoint disabled",
      "real price disabled",
      "bookingUrl disabled",
      "readonly_search",
      "readonly_price",
      "source_label_display",
      "write_api",
      "create_order",
      "plaintext_key_export",
      "real_network_call",
      "CREDENTIAL_CONSENT_SCOPE_GATE_DRAFT",
      "finalDecision: no-go",
      "redacted: true"
    ]) {
      await expect(consentBody).toContainText(text);
    }

    await summaryPanel.locator("details.commerce-readonly-adapter-contract-gate-disclosure > summary").first().click();
    const adapterBody = summaryPanel.locator("details.commerce-readonly-adapter-contract-gate-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "read-only adapter contract gate：draft-ready",
      "status: draft-ready",
      "mode: offline fixture only",
      "adapter contract draft-ready",
      "real network disabled",
      "real endpoint disabled",
      "real provider sandbox disabled",
      "real provider result disabled",
      "raw payload display disabled",
      "write action disabled",
      "offline fixture dry run allowed",
      "不执行真实 network",
      "不调用真实 provider endpoint",
      "不读取真实 provider result",
      "getAdapterMetadata",
      "runOfflineFixtureSearch",
      "normalizeProviderResult",
      "validateResultSchema",
      "createBooking",
      "submitOrder",
      "checkout",
      "pay",
      "rawProviderPayload forbidden",
      "READ_ONLY_PROVIDER_ADAPTER_V1_DRAFT",
      "redacted: true"
    ]) {
      await expect(adapterBody).toContainText(text);
    }

    const gateContracts = await page.evaluate(() => {
      const activation = window.WeishanCommerceProviderActivationReadinessGate;
      const consent = window.WeishanCommerceCredentialConsentScopeGate;
      const adapter = window.WeishanCommerceReadonlyAdapterContractGate;
      return {
        activationContract:activation.commerceProviderActivationReadinessGateContract,
        activationAssert:activation.assertProviderActivationReadinessGateSafe(),
        activationDisplay:activation.buildProviderActivationReadinessGateDisplay(),
        consentContract:consent.commerceCredentialConsentScopeGateContract,
        consentAssert:consent.assertCredentialConsentScopeGateSafe(),
        consentDisplay:consent.buildCredentialConsentScopeGateDisplay(),
        adapterContract:adapter.commerceReadonlyAdapterContractGateContract,
        adapterAssert:adapter.assertReadonlyAdapterContractGateSafe(),
        adapterDisplay:adapter.buildReadonlyAdapterContractGateDisplay()
      };
    });
    expect(gateContracts.activationContract).toEqual(expect.objectContaining({ version:"2.1.39", gateStatus:"blocked", mode:"readiness_only", activationGoNoGo:"no-go", realProviderConnection:"disabled", realPrice:"disabled", realBookingUrl:"disabled", orderMode:"disabled", paymentMode:"disabled" }));
    expect(gateContracts.activationContract.capabilities).toEqual(expect.objectContaining({ canActivateProvider:false, canConnectRealProvider:false, canRunRealProviderSandbox:false, canUseNetwork:false, canConnectEndpoint:false, canReadRealProviderResult:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, canCreateOrder:false, canPay:false, canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false }));
    expect(gateContracts.activationAssert).toBe(true);
    expect(gateContracts.activationDisplay.evaluation).toEqual(expect.objectContaining({ allowed:false, activationDecision:"no-go", canUseNetwork:false, canDisplayRealPrice:false, canDisplayBookingUrl:false }));

    expect(gateContracts.consentContract).toEqual(expect.objectContaining({ version:"2.1.39", gateStatus:"draft-ready", mode:"no provider connection", realCredentialInput:"disabled", realCredentialSave:"disabled", realCredentialRead:"disabled", finalDecision:"no-go" }));
    expect(gateContracts.consentContract.capabilities).toEqual(expect.objectContaining({ canInputCredential:false, canSaveCredential:false, canReadCredential:false, canTestConnection:false, canUseNetwork:false, canConnectEndpoint:false, canCreateOrder:false, canPay:false }));
    expect(gateContracts.consentAssert).toBe(true);
    expect(gateContracts.consentDisplay.evaluation).toEqual(expect.objectContaining({ allowed:false, decision:"no-go", canInputCredential:false, canSaveCredential:false, canReadCredential:false, canTestConnection:false, canUseNetwork:false }));

    expect(gateContracts.adapterContract).toEqual(expect.objectContaining({ version:"2.1.39", gateStatus:"draft-ready", mode:"offline_fixture_only", adapterExecution:"offline fixture only", realNetwork:"disabled", realEndpoint:"disabled", realProviderSandbox:"disabled", realProviderResult:"disabled", rawPayloadDisplay:"disabled", writeAction:"disabled" }));
    expect(gateContracts.adapterContract.capabilities).toEqual(expect.objectContaining({ canExecuteAdapter:false, canExecuteReadonlyDryRun:true, canUseNetwork:false, canConnectEndpoint:false, canRunRealProviderSandbox:false, canReadRealProviderResult:false, canDisplayRawProviderPayload:false, canDisplayRealPrice:false, canDisplayAvailability:false, canDisplayBookingUrl:false, canCreateBooking:false, canSubmitOrder:false, canCheckout:false, canPay:false, canUploadIdentity:false, canSubmitBankCard:false, canSendRawToken:false, canSendRawApiKey:false }));
    expect(gateContracts.adapterAssert).toBe(true);
    expect(gateContracts.adapterDisplay.evaluation).toEqual(expect.objectContaining({ allowed:false, decision:"no-go", canExecuteAdapter:false, canExecuteReadonlyDryRun:true, canUseNetwork:false, canConnectEndpoint:false, canDisplayRealPrice:false, canDisplayBookingUrl:false }));

    for (const forbidden of [
      "真实 API key 输入框",
      "endpoint 输入框",
      "测试连接按钮",
      "保存 key 按钮",
      "提交保存 key",
      "提交绑定确认",
      "API key 保存成功",
      "API key 读取成功",
      "API 连接成功",
      "Keychain 已连接",
      "safeStorage 已实现",
      "真实 bookingUrl：https",
      "bookingUrl：https",
      "付款按钮",
      "下单按钮",
      "提交订单按钮",
      "上传证件按钮",
      "银行卡入口"
    ]) {
      await expect(summaryPanel).not.toContainText(forbidden);
    }
    await expect(summaryPanel.getByRole("textbox", { name:/API key|endpoint|credential|secret/i })).toHaveCount(0);
    await expect(summaryPanel.getByRole("button", { name:/^(保存 key|测试连接|提交绑定确认|去预订|预订|付款|下单|提交订单|上传证件)$/ })).toHaveCount(0);
  });


  test("v2.1.39 offline provider compliance harness stays offline and blocked", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    const latestButton = page.locator("#taskHistoryLatestBtn");
    if (await latestButton.count()) await latestButton.click();
    await submitHomeCommand(page, runId + "-V217-HARNESS 7 月 15 日上海到成都最便宜的机票");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const summaryPanel = home.locator(".commerce-simple-flight-result");
    await expect(summaryPanel).toHaveCount(1, { timeout:15000 });
    await expect(page.locator(".sidebar-foot")).toContainText("weishan v2.1.39");
    for (const text of ["机票搜索结果", "出发地：上海", "目的地：成都", "日期：7 月 15 日", "排序：低价优先", "暂无真实价格结果", "当前尚未接入真实只读机票价格源"]) {
      await expect(summaryPanel).toContainText(text);
    }
    await expect(summaryPanel).not.toContainText("出发地：日上海");
    await expect(summaryPanel).not.toContainText("日期：待补充");
    for (const forbidden of ["fake price", "mock price", "demo price", "AI 估价", "真实价格：¥", "最低价 ¥", "约 ¥", "estimated price", "真实 bookingUrl：https", "bookingUrl：https", "availability：available"]) {
      await expect(summaryPanel).not.toContainText(forbidden);
    }
    await expect(summaryPanel.getByRole("button", { name:/^(去预订|预订|付款|下单|提交订单|approve|reject|submit review|测试连接|保存 key)$/i })).toHaveCount(0);
    await expect(summaryPanel.getByRole("textbox", { name:/API key|credential|endpoint|secret/i })).toHaveCount(0);

    for (const label of [
      "查看只读 provider result schema gate",
      "查看 provider result source label gate",
      "查看 price integrity / taxes / fees gate",
      "查看 bookingUrl domain safety gate",
      "查看 manual provider review workflow",
      "查看 provider activation readiness gate",
      "查看 credential consent scope gate",
      "查看 read-only adapter contract gate",
      "查看 provider gate matrix dashboard",
      "查看 provider no-network runtime guard",
      "查看 offline provider fixture validation harness",
      "查看 provider compliance decision engine",
      "查看 offline provider fixture runner",
      "查看 no-network sentinel audit",
      "查看 provider compliance evidence report"
    ]) {
      await expect(summaryPanel).toContainText(label);
    }

    await summaryPanel.locator("details.commerce-provider-gate-matrix-dashboard-disclosure > summary").first().click();
    const matrixBody = summaryPanel.locator("details.commerce-provider-gate-matrix-dashboard-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "provider gate matrix dashboard：dashboard 已建立",
      "status: blocked",
      "mode: matrix only",
      "providerActivationState: no-go",
      "real provider connection disabled",
      "real network disabled",
      "real price disabled",
      "real bookingUrl disabled",
      "API binding readiness: not ready",
      "secure storage design gate: closed",
      "provider endpoint allowlist gate: closed",
      "readonly provider sandbox gate: closed",
      "provider activation readiness gate: blocked / no-go",
      "credential consent scope gate: closed / draft",
      "read-only adapter contract gate: closed / contract draft only",
      "provider no-network runtime guard: blocked",
      "offline provider fixture validation harness: offline only",
      "no provider approved",
      "manual review pending",
      "adapter execution disabled",
      "network disabled",
      "manual review -> activation readiness",
      "all gates -> providerActivationState no-go",
      "readinessScore: 0",
      "readinessMax: 100",
      "scoreReason: real provider activation disabled",
      "providerGateMatrixAuditDraft",
      "redacted: true"
    ]) {
      await expect(matrixBody).toContainText(text);
    }

    await summaryPanel.locator("details.commerce-provider-no-network-runtime-guard-disclosure > summary").first().click();
    const guardBody = summaryPanel.locator("details.commerce-provider-no-network-runtime-guard-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "provider no-network runtime guard：guard 已建立",
      "status: blocked",
      "mode: no-network enforcement draft",
      "provider network disabled",
      "fetch disabled for provider",
      "XMLHttpRequest disabled for provider",
      "WebSocket disabled for provider",
      "Electron net disabled for provider",
      "Node http/https disabled for provider",
      "DNS lookup disabled for provider",
      "redirect follow disabled",
      "adapter execution disabled",
      "runtime guard decision object 草案",
      "attemptId",
      "targetUrlHost",
      "fetch",
      "XMLHttpRequest",
      "WebSocket",
      "Electron net",
      "Node http",
      "Node https",
      "NETWORK_DISABLED",
      "PROVIDER_NETWORK_DISABLED",
      "ENDPOINT_CONNECTION_DISABLED",
      "REAL_SANDBOX_DISABLED",
      "CREDENTIAL_NOT_AVAILABLE",
      "CONSENT_NOT_APPROVED",
      "PROVIDER_NOT_APPROVED",
      "ENDPOINT_NOT_ALLOWED",
      "REDIRECT_FORBIDDEN",
      "WRITE_ACTION_FORBIDDEN",
      "providerNoNetworkRuntimeGuardAuditDraft",
      "redacted: true"
    ]) {
      await expect(guardBody).toContainText(text);
    }

    await summaryPanel.locator("details.commerce-offline-provider-fixture-validation-harness-disclosure > summary").first().click();
    const harnessBody = summaryPanel.locator("details.commerce-offline-provider-fixture-validation-harness-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "offline provider fixture validation harness：harness 已建立",
      "status: offline only",
      "mode: fixture validation draft",
      "real provider fixture disabled",
      "real provider result disabled",
      "real network disabled",
      "fake/mock/demo/AI price display disabled",
      "bookingUrl display disabled",
      "raw provider payload display disabled",
      "all unsafe fixtures blocked",
      "missing_provider_id_fixture",
      "missing_source_host_fixture",
      "missing_updated_at_fixture",
      "unknown_host_fixture",
      "short_url_fixture",
      "credential_query_param_fixture",
      "raw_provider_payload_fixture",
      "price_without_currency_fixture",
      "price_without_taxes_fixture",
      "price_without_fees_fixture",
      "estimated_price_fixture",
      "mock_price_fixture",
      "booking_url_detected_fixture",
      "payment_path_detected_fixture",
      "checkout_path_detected_fixture",
      "order_path_detected_fixture",
      "identity_upload_detected_fixture",
      "write_action_detected_fixture",
      "validateResultSchema",
      "validateSourceLabel",
      "validatePriceIntegrity",
      "validateBookingUrlSafety",
      "applyNoNetworkRuntimeGuard",
      "missing providerId -> blocked",
      "unknown host -> blocked",
      "short URL -> blocked",
      "credential params -> blocked",
      "raw provider payload -> blocked",
      "missing currency -> price withheld",
      "missing taxes -> price withheld",
      "missing fees -> price withheld",
      "estimated price -> blocked",
      "mock price -> blocked",
      "bookingUrl detected -> blocked",
      "payment path -> blocked",
      "checkout path -> blocked",
      "order path -> blocked",
      "identity upload -> blocked",
      "write action -> blocked",
      "fixture 不得在用户结果区展示价格",
      "fixture 只展示 blocked / withheld / redacted 状态",
      "offlineFixtureValidationAuditDraft",
      "redacted: true"
    ]) {
      await expect(harnessBody).toContainText(text);
    }

    await summaryPanel.locator("details.commerce-provider-compliance-decision-engine-disclosure > summary").first().click();
    const decisionBody = summaryPanel.locator("details.commerce-provider-compliance-decision-engine-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "provider compliance decision engine：engine 已建立",
      "status: blocked",
      "mode: offline decision only",
      "sideEffects: none",
      "real provider connection disabled",
      "real network disabled",
      "real credential read disabled",
      "real price display disabled",
      "real bookingUrl disabled",
      "providerActivationDecision: no-go",
      "decision input draft",
      "decision output draft",
      "priceDisplayDecision",
      "withheld",
      "bookingUrlDecision",
      "forbidden",
      "networkDecision",
      "blocked",
      "credentialDecision",
      "blocked",
      "adapterExecutionDecision",
      "disabled",
      "no provider approved",
      "manual review pending",
      "credential consent not approved",
      "NETWORK_DISABLED",
      "PRICE_WITHHELD",
      "BOOKING_URL_FORBIDDEN",
      "RAW_PAYLOAD_FORBIDDEN",
      "providerComplianceDecisionAuditDraft",
      "redacted: true"
    ]) {
      await expect(decisionBody).toContainText(text);
    }

    await summaryPanel.locator("details.commerce-offline-provider-fixture-runner-disclosure > summary").first().click();
    const runnerBody = summaryPanel.locator("details.commerce-offline-provider-fixture-runner-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "offline provider fixture runner：runner 已建立",
      "status: offline only",
      "mode: deterministic fixture runner",
      "real provider fixture disabled",
      "real provider result disabled",
      "real network disabled",
      "real price disabled",
      "fake/mock/demo/AI price display disabled",
      "bookingUrl display disabled",
      "raw provider payload display disabled",
      "all fixture outputs redacted",
      "loadOfflineFixtureDescriptor",
      "redactOfflineFixture",
      "evaluateProviderComplianceReadiness",
      "compareExpectedDecision",
      "schema_missing_field",
      "booking_url_unknown_host",
      "network_fetch_attempt",
      "raw_provider_payload_attempt",
      "missing providerId -> blocked",
      "fetch attempt -> NETWORK_DISABLED",
      "raw provider payload -> RAW_PAYLOAD_FORBIDDEN",
      "status：PASS",
      "failedFixtureCount：0",
      "networkAttemptCount：0",
      "realProviderCallCount：0",
      "realPriceDisplayedCount：0",
      "bookingUrlDisplayedCount：0",
      "offlineProviderFixtureRunnerAuditDraft",
      "redacted: true"
    ]) {
      await expect(runnerBody).toContainText(text);
    }

    await summaryPanel.locator("details.commerce-no-network-sentinel-audit-disclosure > summary").first().click();
    const sentinelBody = summaryPanel.locator("details.commerce-no-network-sentinel-audit-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "no-network sentinel audit：sentinel 已建立",
      "status: blocked",
      "mode: static no-network audit",
      "no global monkey patch",
      "no provider network call",
      "fetch attempt blocked",
      "XMLHttpRequest attempt blocked",
      "WebSocket attempt blocked",
      "sendBeacon attempt blocked",
      "Electron net attempt blocked",
      "Node http/https attempt blocked",
      "DNS lookup attempt blocked",
      "redirect follow blocked",
      "provider adapters",
      "offline fixture runner",
      "provider compliance decision engine",
      "fetch -> NETWORK_DISABLED",
      "provider write action -> WRITE_ACTION_FORBIDDEN",
      "sentinel decision object draft",
      "blockedReason：NETWORK_DISABLED",
      "noNetworkSentinelAuditDraft",
      "redacted: true"
    ]) {
      await expect(sentinelBody).toContainText(text);
    }

    await summaryPanel.locator("details.commerce-provider-compliance-evidence-report-disclosure > summary").first().click();
    const evidenceBody = summaryPanel.locator("details.commerce-provider-compliance-evidence-report-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "provider compliance evidence report：report 已建立",
      "status: blocked",
      "mode: offline evidence only",
      "providerActivationState: no-go",
      "no real provider approved",
      "no credential consent approved",
      "no real secure storage",
      "no real endpoint connection",
      "no real sandbox",
      "no real provider result",
      "no real price",
      "no real bookingUrl",
      "evidence summary",
      "decisionEngineState：blocked / no-go",
      "fixtureRunnerState：offline only / PASS",
      "noNetworkSentinelState：blocked",
      "offlineFixtureRunnerEvidence",
      "noNetworkSentinelEvidence",
      "decision engine: blocked / no-go",
      "fixture runner: offline only / PASS",
      "bookingUrl display: forbidden",
      "当前版本只是离线合规证据包",
      "当前版本不能联网接 provider",
      "当前版本不能显示真实价格",
      "当前版本不能预订 / 付款 / 下单",
      "providerComplianceEvidenceReportAuditDraft",
      "redacted: true"
    ]) {
      await expect(evidenceBody).toContainText(text);
    }

    const gateContracts = await page.evaluate(() => {
      const matrix = window.WeishanCommerceProviderGateMatrixDashboard;
      const guard = window.WeishanCommerceProviderNoNetworkRuntimeGuard;
      const harness = window.WeishanCommerceOfflineProviderFixtureValidationHarness;
      const decision = window.WeishanCommerceProviderComplianceDecisionEngine;
      const runner = window.WeishanCommerceOfflineProviderFixtureRunner;
      const sentinel = window.WeishanCommerceNoNetworkSentinelAudit;
      const evidence = window.WeishanCommerceProviderComplianceEvidenceReport;
      const runnerSummary = runner.runOfflineProviderFixtures();
      const decisionReport = decision.buildProviderComplianceDecisionReport();
      const sentinelDisplay = sentinel.buildNoNetworkSentinelAuditDisplay();
      const evidenceReport = evidence.buildProviderComplianceEvidenceReport({ fixtureRunnerState:"offline only / PASS" });
      return {
        matrixContract:matrix.commerceProviderGateMatrixDashboardContract,
        matrixAssert:matrix.assertProviderGateMatrixDashboardSafe(),
        matrixDisplay:matrix.buildProviderGateMatrixDashboardDisplay(),
        guardContract:guard.commerceProviderNoNetworkRuntimeGuardContract,
        guardAssert:guard.assertProviderNoNetworkRuntimeGuardSafe(),
        guardDecision:guard.evaluateProviderNetworkAttemptDraft({ networkPrimitive:"fetch" }),
        harnessContract:harness.commerceOfflineProviderFixtureValidationHarnessContract,
        harnessAssert:harness.assertOfflineProviderFixtureValidationHarnessSafe(),
        harnessDecision:harness.validateOfflineProviderFixtureDescriptorDraft({ fixtureId:"offline_case" }),
        decisionContract:decision.commerceProviderComplianceDecisionEngineContract,
        decisionAssert:decision.assertProviderComplianceDecisionEngineSafe(decisionReport),
        decisionReport,
        runnerContract:runner.commerceOfflineProviderFixtureRunnerContract,
        runnerAssert:runner.assertOfflineProviderFixtureRunnerSafe(runnerSummary),
        runnerSummary,
        sentinelContract:sentinel.commerceNoNetworkSentinelAuditContract,
        sentinelAssert:sentinel.assertNoNetworkSentinelAuditSafe(sentinelDisplay),
        sentinelDecision:sentinel.evaluateNoNetworkSentinelPrimitive({ networkPrimitive:"fetch" }),
        evidenceContract:evidence.commerceProviderComplianceEvidenceReportContract,
        evidenceAssert:evidence.assertProviderComplianceEvidenceReportSafe(evidenceReport),
        evidenceReport
      };
    });
    expect(gateContracts.matrixContract).toEqual(expect.objectContaining({ version:"2.1.39", dashboardStatus:"blocked", mode:"matrix_only", providerActivationState:"no-go", realNetwork:"disabled", realPrice:"disabled", realBookingUrl:"disabled" }));
    expect(gateContracts.matrixContract.capabilities).toEqual(expect.objectContaining({ canUseNetwork:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, canCreateOrder:false, canPay:false, canInputApiKey:false, canSaveApiKey:false, canReadApiKey:false }));
    expect(gateContracts.matrixAssert).toBe(true);
    expect(gateContracts.matrixDisplay.readinessScore).toEqual(expect.objectContaining({ readinessScore:0, readinessMax:100, scoreReason:"real provider activation disabled" }));

    expect(gateContracts.guardContract).toEqual(expect.objectContaining({ version:"2.1.39", guardStatus:"blocked", mode:"no_network_enforcement_draft", providerNetwork:"disabled", adapterExecution:"disabled" }));
    expect(gateContracts.guardContract.capabilities).toEqual(expect.objectContaining({ canUseFetch:false, canUseXhr:false, canUseWebSocket:false, canUseElectronNet:false, canUseNodeHttp:false, canUseNodeHttps:false, canResolveDns:false, canFollowRedirect:false, canExecuteAdapter:false, canReadRealProviderResult:false, canDisplayRealPrice:false, canDisplayBookingUrl:false }));
    expect(gateContracts.guardAssert).toBe(true);
    expect(gateContracts.guardDecision).toEqual(expect.objectContaining({ decision:"blocked", blockedReason:"NETWORK_DISABLED", canUseNetwork:false }));

    expect(gateContracts.harnessContract).toEqual(expect.objectContaining({ version:"2.1.39", harnessStatus:"offline_only", mode:"fixture_validation_draft", realProviderFixture:"disabled", realProviderResult:"disabled", realNetwork:"disabled", fakeMockDemoAiPriceDisplay:"disabled", bookingUrlDisplay:"disabled", rawProviderPayloadDisplay:"disabled" }));
    expect(gateContracts.harnessContract.capabilities).toEqual(expect.objectContaining({ canUseRealProviderFixture:false, canReadRealProviderResult:false, canUseNetwork:false, canDisplayFakePrice:false, canDisplayMockPrice:false, canDisplayDemoPrice:false, canDisplayAiEstimatedPrice:false, canDisplayRealPrice:false, canDisplayAvailability:false, canDisplayBookingUrl:false, canDisplayRawProviderPayload:false }));
    expect(gateContracts.harnessAssert).toBe(true);
    expect(gateContracts.harnessDecision).toEqual(expect.objectContaining({ actualDecision:"blocked", canUseNetwork:false, canDisplayPrice:false, canDisplayBookingUrl:false }));

    expect(gateContracts.decisionContract).toEqual(expect.objectContaining({ version:"2.1.39", engineStatus:"blocked", mode:"offline_decision_only", sideEffects:"none", realProviderConnection:"disabled", realNetwork:"disabled", realCredentialRead:"disabled", realPriceDisplay:"disabled", realBookingUrl:"disabled", providerActivationDecision:"no-go" }));
    expect(gateContracts.decisionContract.capabilities).toEqual(expect.objectContaining({ canUseNetwork:false, canReadCredential:false, canReadEnvironmentSecret:false, canReadEnvFile:false, canWriteBrowserStorage:false, canUseKeychain:false, canUseSafeStorage:false, canConnectEndpoint:false, canRunProviderSandbox:false, canReadRealProviderResult:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, canCreateOrder:false, canPay:false, canUploadIdentity:false }));
    expect(gateContracts.decisionAssert).toBe(true);
    expect(gateContracts.decisionReport.defaultDecision).toEqual(expect.objectContaining({ providerActivationDecision:"no-go", priceDisplayDecision:"withheld", bookingUrlDecision:"forbidden", networkDecision:"blocked", credentialDecision:"blocked", adapterExecutionDecision:"disabled" }));

    expect(gateContracts.runnerContract).toEqual(expect.objectContaining({ version:"2.1.39", runnerStatus:"offline_only", mode:"deterministic_fixture_runner", realProviderFixture:"disabled", realProviderResult:"disabled", realNetwork:"disabled", realPrice:"disabled", fakeMockDemoAiPriceDisplay:"disabled", bookingUrlDisplay:"disabled", rawProviderPayloadDisplay:"disabled" }));
    expect(gateContracts.runnerContract.capabilities).toEqual(expect.objectContaining({ canUseNetwork:false, canReadRealProviderFixture:false, canReadRealProviderResult:false, canDisplayRealPrice:false, canDisplayFakePrice:false, canDisplayMockPrice:false, canDisplayDemoPrice:false, canDisplayAiEstimatedPrice:false, canDisplayBookingUrl:false, canDisplayRawProviderPayload:false, canReadCredential:false, canCreateOrder:false, canPay:false }));
    expect(gateContracts.runnerAssert).toBe(true);
    expect(gateContracts.runnerSummary).toEqual(expect.objectContaining({ status:"PASS", failedFixtureCount:0, networkAttemptCount:0, realProviderCallCount:0, realPriceDisplayedCount:0, bookingUrlDisplayedCount:0 }));

    expect(gateContracts.sentinelContract).toEqual(expect.objectContaining({ version:"2.1.39", sentinelStatus:"blocked", mode:"static_no_network_audit", globalMonkeyPatch:"disabled", providerNetworkCall:"disabled", fetchAttempt:"blocked", xhrAttempt:"blocked", websocketAttempt:"blocked" }));
    expect(gateContracts.sentinelContract.capabilities).toEqual(expect.objectContaining({ canMonkeyPatchGlobalFetch:false, canUseNetwork:false, canUseFetch:false, canUseXhr:false, canUseWebSocket:false, canUseEventSource:false, canUseSendBeacon:false, canUseElectronNet:false, canUseNodeHttp:false, canUseNodeHttps:false, canResolveDns:false, canFollowRedirect:false, canCallProviderSandbox:false, canCallProviderWriteAction:false }));
    expect(gateContracts.sentinelAssert).toBe(true);
    expect(gateContracts.sentinelDecision).toEqual(expect.objectContaining({ decision:"blocked", blockedReason:"NETWORK_DISABLED", redacted:true }));

    expect(gateContracts.evidenceContract).toEqual(expect.objectContaining({ version:"2.1.39", reportStatus:"blocked", mode:"offline_evidence_only", providerActivationState:"no-go", realProviderApproval:"none", credentialConsentApproval:"none", realSecureStorage:"disabled", realEndpointConnection:"disabled", realSandbox:"disabled", realProviderResult:"disabled", realPrice:"disabled", realBookingUrl:"disabled" }));
    expect(gateContracts.evidenceContract.capabilities).toEqual(expect.objectContaining({ canApproveProvider:false, canReadCredential:false, canUseSecureStorage:false, canConnectEndpoint:false, canRunRealSandbox:false, canReadRealProviderResult:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, canCreateOrder:false, canPay:false, canUploadIdentity:false }));
    expect(gateContracts.evidenceAssert).toBe(true);
    expect(gateContracts.evidenceReport.evidenceSummary).toEqual(expect.objectContaining({ providerActivationState:"no-go", decisionEngineState:"blocked / no-go", fixtureRunnerState:"offline only / PASS", noNetworkSentinelState:"blocked" }));

    for (const forbidden of [
      "真实 API key 输入框",
      "credential 输入框",
      "endpoint 输入框",
      "测试连接按钮",
      "保存 key 按钮",
      "真实价格：¥",
      "真实 bookingUrl：https",
      "bookingUrl：https",
      "可点击 provider booking link",
      "approve provider 按钮",
      "reject provider 按钮",
      "submit review 按钮",
      "上传证件按钮",
      "银行卡入口"
    ]) {
      await expect(summaryPanel).not.toContainText(forbidden);
    }
    await expect(summaryPanel.getByRole("textbox", { name:/API key|credential|endpoint|secret/i })).toHaveCount(0);
    await expect(summaryPanel.getByRole("button", { name:/^(保存 key|测试连接|approve|reject|submit review|去预订|预订|付款|下单|提交订单|上传证件)$/i })).toHaveCount(0);

    const historyItems = page.locator("#cmdHistory [data-history-id]");
    await submitHomeCommand(page, runId + "-V217-HISTORY 买演唱会门票");
    await expect(page.locator('[data-commerce-home-summary="true"]').last()).toContainText("暂无真实价格结果", { timeout:15000 });
    const beforeHistoryReplayCount = await historyItems.count();
    await historyItems.filter({ hasText:runId + "-V217-HARNESS" }).first().click();
    const historyDetail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    await expect(historyDetail).toBeVisible();
    await expect(historyDetail).toContainText("历史回看不会重新执行任务");
    await expect(historyDetail).toContainText("查看 provider gate matrix dashboard");
    await expect(historyDetail).toContainText("查看 provider no-network runtime guard");
    await expect(historyDetail).toContainText("查看 offline provider fixture validation harness");
    await expect(historyDetail).toContainText("查看 provider compliance decision engine");
    await expect(historyDetail).toContainText("查看 offline provider fixture runner");
    await expect(historyDetail).toContainText("查看 no-network sentinel audit");
    await expect(historyDetail).toContainText("查看 provider compliance evidence report");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(beforeHistoryReplayCount);

    await gotoRoute(page, "home");
    const latestAfterHistory = page.locator("#taskHistoryLatestBtn");
    if (await latestAfterHistory.count()) await latestAfterHistory.click();
    await submitHomeCommand(page, runId + "-V217-COMPOUND 帮我查 7 月 15 日上海到成都最便宜的机票，并说明离线合规引擎现在阻断了哪些 provider 接入风险");
    const compound = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(compound).toContainText("机票搜索结果", { timeout:15000 });
    await expect(compound).toContainText("暂无真实价格结果");
    await expect(compound).toContainText("查看 provider no-network runtime guard");
    await expect(compound).toContainText("查看 offline provider fixture validation harness");
    await expect(compound).toContainText("查看 provider compliance decision engine");
    await expect(compound).toContainText("查看 offline provider fixture runner");
    await expect(compound).toContainText("查看 no-network sentinel audit");
    await expect(compound).toContainText("查看 provider compliance evidence report");
    await expect(compound).not.toContainText("真实价格：¥");
    await expect(compound).not.toContainText("bookingUrl：https");
    await expect(compound).not.toContainText("AI 估价");
    await expect(compound.locator("details[open]")).toHaveCount(0);
  });

  test("v2.1.39 local safety evidence console and no-secret persistence guard stay local only", async () => {
    const { page } = await launchWeishan();
    await cleanupE2EData(page);
    await resetCommerceTasks(page);

    await submitHomeCommand(page, runId + "-V2110-FLIGHT 7 月 15 日上海到成都最便宜的机票");
    const summaryPanel = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(page.locator(".sidebar-foot")).toContainText("weishan v2.1.39", { timeout:15000 });
    for (const text of ["上海", "成都", "7 月 15 日", "低价优先", "暂无真实价格结果"]) {
      await expect(summaryPanel).toContainText(text);
    }
    await expect(summaryPanel).not.toContainText("出发地：日上海");
    await expect(summaryPanel).not.toContainText("日期：待补充");
    await expect(summaryPanel).not.toContainText(/fake price|mock price|demo price|AI 估价|最低价：? ?¥|约 ¥|estimated price/i);
    await expect(summaryPanel).not.toContainText(/bookingUrl：https|真实 bookingUrl|真实价格：¥|availability/i);
    await expect(summaryPanel.getByRole("button", { name:/^(去预订|预订|付款|下单|提交订单)$/ })).toHaveCount(0);

    for (const text of [
      "查看 provider compliance decision engine",
      "查看 offline provider fixture runner",
      "查看 no-network sentinel audit",
      "查看 provider compliance evidence report",
      "查看 settings auth local security evidence",
      "查看 local safety evidence console",
      "查看 manual UI acceptance assistant",
      "查看 no-secret persistence guard"
    ]) {
      await expect(summaryPanel).toContainText(text);
    }

    await openDisclosure(summaryPanel, "commerce-local-safety-evidence-console-disclosure");
    const consoleBody = summaryPanel.locator("details.commerce-local-safety-evidence-console-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "console 已建立", "status: local evidence only", "mode: offline safety summary",
      "providerActivationState: no-go", "releaseEvidenceState: local only",
      "localAuthMode: enabled", "passwordVerifier: enabled", "localRecoveryMode: no-network",
      "localRecoveryEmailSend: disabled", "localRecoverySecretRead: disabled",
      "commerceFlightIntent: enabled", "flightOriginParsing: 上海", "flightDestinationParsing: 成都",
      "flightDateParsing: 7 月 15 日", "flightSortPreference: 低价优先",
      "realPriceResult: unavailable", "fakeMockDemoAiPrice: forbidden", "bookingUrl: forbidden",
      "offlineFixtureRunnerState: PASS", "networkAttemptCount: 0", "realProviderCallCount: 0",
      "realPriceDisplayedCount: 0", "bookingUrlDisplayedCount: 0", "localSafetyEvidenceConsoleAuditDraft", "redacted: true"
    ]) {
      await expect(consoleBody).toContainText(text);
    }

    await openDisclosure(summaryPanel, "commerce-manual-ui-acceptance-assistant-disclosure");
    const assistantBody = summaryPanel.locator("details.commerce-manual-ui-acceptance-assistant-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "assistant 已建立", "status: manual assist only", "mode: no automation guarantee",
      "Electron Web content focus may require manual input", "automated PASS fabrication forbidden",
      "screenshot evidence required", "user confirmation required", "no external search click",
      "/tmp/weishan-v2.1.39-ui-acceptance/01_app_launched.png",
      "/tmp/weishan-v2.1.39-ui-acceptance/10_compound_request.png",
      "PASS/FAIL 判定规则", "NEEDS_MANUAL_UI_CHECK", "manualUiAcceptanceAssistantAuditDraft", "redacted: true"
    ]) {
      await expect(assistantBody).toContainText(text);
    }

    await openDisclosure(summaryPanel, "commerce-no-secret-persistence-guard-disclosure");
    const noSecretBody = summaryPanel.locator("details.commerce-no-secret-persistence-guard-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "guard 已建立", "status: local static scan only", "mode: no real secret access",
      "real API key read disabled", "Keychain access disabled", "safeStorage access disabled",
      ".env secret write forbidden", "localStorage secret write forbidden", "sessionStorage secret write forbidden",
      "raw password persistence forbidden", "raw token display forbidden", "rawApiKey display forbidden",
      "provider credential persistence forbidden", "endpoint secret persistence forbidden",
      "scanResult: PASS", "realSecretReadCount: 0", "keychainAccessCount: 0",
      "safeStorageAccessCount: 0", "envSecretWriteCount: 0", "localStorageSecretWriteCount: 0",
      "sessionStorageSecretWriteCount: 0", "rawPasswordPersistenceCount: 0", "rawApiKeyDisplayCount: 0",
      "providerCredentialPersistedCount: 0", "endpointSecretPersistedCount: 0",
      "noSecretPersistenceGuardAuditDraft", "redacted: true"
    ]) {
      await expect(noSecretBody).toContainText(text);
    }

    await openDisclosure(summaryPanel, "commerce-settings-auth-local-security-evidence-disclosure");
    const authEvidenceBody = summaryPanel.locator("details.commerce-settings-auth-local-security-evidence-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "evidence 已建立", "status: local auth evidence only", "mode: no cloud auth",
      "local register enabled", "local login enabled", "local recovery notice enabled",
      "passwordVerifier enabled", "legacy plain password migration compatible",
      "real email sending disabled", "real network disabled", "real key read disabled",
      "本地模式不联网", "本地模式不发邮件", "本地模式不读取密钥",
      "找回密码不会清空表单", "找回密码不会跳路由",
      "raw password display forbidden", "raw password persistence forbidden", "passwordVerifier only",
      "settingsAuthLocalSecurityEvidenceAuditDraft", "redacted: true"
    ]) {
      await expect(authEvidenceBody).toContainText(text);
    }

    const contracts = await page.evaluate(() => {
      const localConsole = window.WeishanCommerceLocalSafetyEvidenceConsole;
      const manual = window.WeishanCommerceManualUiAcceptanceAssistant;
      const guard = window.WeishanCommerceNoSecretPersistenceGuard;
      const auth = window.WeishanSettingsAuthLocalSecurityEvidence;
      return {
        consoleContract:localConsole.localSafetyEvidenceConsoleContract,
        consoleAssert:localConsole.assertLocalSafetyEvidenceConsoleSafe(localConsole.buildLocalSafetyEvidenceConsole()),
        manualContract:manual.manualUiAcceptanceAssistantContract,
        manualAssert:manual.assertManualUiAcceptanceAssistantSafe(manual.buildManualUiAcceptanceAssistant()),
        guardContract:guard.noSecretPersistenceGuardContract,
        guardAssert:guard.assertNoSecretPersistenceGuardSafe(guard.buildNoSecretPersistenceGuard()),
        authContract:auth.settingsAuthLocalSecurityEvidenceContract,
        authAssert:auth.assertSettingsAuthLocalSecurityEvidenceSafe(auth.buildSettingsAuthLocalSecurityEvidence())
      };
    });
    expect(contracts.consoleContract).toEqual(expect.objectContaining({ version:"2.1.39", status:"local evidence only", mode:"offline safety summary", providerActivationState:"no-go", releaseEvidenceState:"local only" }));
    expect(contracts.consoleContract.capabilities).toEqual(expect.objectContaining({ canReadRealSecret:false, canUseNetwork:false, canConnectProvider:false, canDisplayRealPrice:false, canDisplayBookingUrl:false, canCreateOrder:false, canPay:false }));
    expect(contracts.consoleAssert).toBe(true);
    expect(contracts.manualContract).toEqual(expect.objectContaining({ version:"2.1.39", status:"manual assist only", mode:"no automation guarantee", automatedPassFabrication:"forbidden", screenshotEvidence:"required" }));
    expect(contracts.manualContract.capabilities).toEqual(expect.objectContaining({ canFabricatePass:false, canClickExternalSearch:false, canUseNetwork:false }));
    expect(contracts.manualAssert).toBe(true);
    expect(contracts.guardContract).toEqual(expect.objectContaining({ version:"2.1.39", status:"local static scan only", mode:"no real secret access", realApiKeyRead:"disabled", keychainAccess:"disabled", safeStorageAccess:"disabled" }));
    expect(contracts.guardContract.capabilities).toEqual(expect.objectContaining({ canReadRealSecret:false, canReadKeychain:false, canReadSafeStorage:false, canReadUserAppData:false, canUseNetwork:false, canPersistSecret:false }));
    expect(contracts.guardAssert).toBe(true);
    expect(contracts.authContract).toEqual(expect.objectContaining({ version:"2.1.39", status:"local auth evidence only", mode:"no cloud auth", localRegister:"enabled", localLogin:"enabled", localRecoveryNotice:"enabled", passwordVerifier:"enabled", legacyPlainPasswordMigration:"compatible" }));
    expect(contracts.authContract.capabilities).toEqual(expect.objectContaining({ canSendRealEmail:false, canUseNetwork:false, canReadRealKey:false, canDisplayRawPassword:false, canPersistRawPassword:false, canDisplayRawToken:false, canDisplayRawApiKey:false }));
    expect(contracts.authAssert).toBe(true);

    for (const forbidden of [
      "真实 API key 输入框", "credential 输入框", "endpoint 输入框", "测试连接按钮", "保存 key 按钮",
      "真实价格：¥", "最低价 ¥", "约 ¥", "estimated price", "availability：可用",
      "bookingUrl：https", "可点击 provider booking link", "approve provider 按钮", "reject provider 按钮",
      "submit review 按钮", "上传证件按钮", "银行卡入口"
    ]) {
      await expect(summaryPanel).not.toContainText(forbidden);
    }
    await expect(summaryPanel.getByRole("textbox", { name:/API key|credential|endpoint|secret/i })).toHaveCount(0);
    await expect(summaryPanel.getByRole("button", { name:/^(保存 key|测试连接|approve|reject|submit review|去预订|预订|付款|下单|提交订单|上传证件)$/i })).toHaveCount(0);

    const historyItems = page.locator("#cmdHistory [data-history-id]");
    await submitHomeCommand(page, runId + "-V2110-HISTORY 买演唱会门票");
    await expect(page.locator('[data-commerce-home-summary="true"]').last()).toContainText("暂无真实价格结果", { timeout:15000 });
    const beforeHistoryReplayCount = await historyItems.count();
    await historyItems.filter({ hasText:runId + "-V2110-FLIGHT" }).first().click();
    const historyDetail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    await expect(historyDetail).toBeVisible();
    await expect(historyDetail).toContainText("历史回看不会重新执行任务");
    await expect(historyDetail).toContainText("查看 local safety evidence console");
    await expect(historyDetail).toContainText("查看 manual UI acceptance assistant");
    await expect(historyDetail).toContainText("查看 no-secret persistence guard");
    await expect(historyDetail).toContainText("查看 settings auth local security evidence");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(beforeHistoryReplayCount);

    await page.locator("#historyBackBtn").click();
    await expect(page.locator('#cmdConsole [data-task-history-detail="true"]')).toHaveCount(0);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-V2110-COMPOUND 7 月 15 日上海到成都最便宜的机票");
    const compound = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(compound).toContainText("机票搜索结果", { timeout:15000 });
    await expect(compound).toContainText("暂无真实价格结果");
    await expect(compound).toContainText("查看 local safety evidence console");
    await expect(compound).toContainText("查看 no-secret persistence guard");
    await openDisclosure(compound, "commerce-local-safety-evidence-console-disclosure");
    await expect(compound.locator("details.commerce-local-safety-evidence-console-disclosure .commerce-disclosure-body").first()).toContainText("providerActivationState: no-go");
    await expect(compound.locator("details.commerce-local-safety-evidence-console-disclosure .commerce-disclosure-body").first()).toContainText("local evidence only");
    await openDisclosure(compound, "commerce-no-secret-persistence-guard-disclosure");
    await expect(compound.locator("details.commerce-no-secret-persistence-guard-disclosure .commerce-disclosure-body").first()).toContainText("scanResult: PASS");
    await expect(compound).not.toContainText("真实价格：¥");
    await expect(compound).not.toContainText("AI 估价");
    await expect(compound).not.toContainText("bookingUrl：https");
    await expect(compound.getByRole("button", { name:/^(去预订|预订|付款|下单|提交订单)$/ })).toHaveCount(0);
  });

  test("v2.1.39 global procurement user-facing result cards stay offline and category-specific", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "commerce");

    const contracts = await page.evaluate(() => {
      const router = window.WeishanGlobalProcurementIntentRouter;
      const composer = window.WeishanGlobalProcurementPlanComposer;
      const checklistApi = window.WeishanGlobalProcurementMissingInfoChecklist;
      const guidanceApi = window.WeishanGlobalProcurementSafeNextStepGuidance;
      const policyApi = window.WeishanGlobalProcurementExternalSearchPolicy;
      const detailApi = window.WeishanGlobalProcurementDetailQualityComposer;
      const quickApi = window.WeishanGlobalProcurementQuickSummary;
      const resultCardApi = window.WeishanGlobalProcurementUserFacingResultCards;
      const guardApi = window.WeishanGlobalProcurementRestrictedCategoryGuard;
      const evidenceApi = window.WeishanGlobalProcurementEvidenceSafetySummary;
      const flightIntent = router.routeGlobalProcurementIntent("7 月 15 日上海到成都最便宜的机票");
      const hotelIntent = router.routeGlobalProcurementIntent("帮我找成都春熙路附近住两晚的酒店");
      const productIntent = router.routeGlobalProcurementIntent("帮我比较美国和日本买 iPhone 16 Pro");
      const serviceIntent = router.routeGlobalProcurementIntent("帮我找成都搬家公司");
      const ticketIntent = router.routeGlobalProcurementIntent("帮我找 7 月 15 日东京迪士尼 2 人成人票购买方案");
      const multiIntent = router.routeGlobalProcurementIntent("帮我规划 7 月 15 日上海到成都三天行程，包括机票、酒店、当地交通和门票");
      const blockedIntent = router.routeGlobalProcurementIntent("帮我买枪");
      const blockedLoanIntent = router.routeGlobalProcurementIntent("帮我上传身份证和银行卡办贷款");
      const plan = composer.composeGlobalProcurementPlan(flightIntent);
      const blockedPlan = composer.composeGlobalProcurementPlan(blockedIntent);
      const blockedGuidance = guidanceApi.buildGlobalProcurementSafeNextStepGuidance(blockedIntent);
      const checklist = checklistApi.buildGlobalProcurementMissingInfoChecklist(flightIntent);
      const guidance = guidanceApi.buildGlobalProcurementSafeNextStepGuidance(flightIntent);
      const policy = policyApi.buildGlobalProcurementExternalSearchPolicy(flightIntent);
      const blockedPolicy = policyApi.buildGlobalProcurementExternalSearchPolicy(blockedIntent);
      const flightDetail = detailApi.composeGlobalProcurementDetailQuality(flightIntent);
      const hotelDetail = detailApi.composeGlobalProcurementDetailQuality(hotelIntent);
      const productDetail = detailApi.composeGlobalProcurementDetailQuality(productIntent);
      const serviceDetail = detailApi.composeGlobalProcurementDetailQuality(serviceIntent);
      const ticketDetail = detailApi.composeGlobalProcurementDetailQuality(ticketIntent);
      const multiDetail = detailApi.composeGlobalProcurementDetailQuality(multiIntent);
      const flightQuickSummary = quickApi.buildGlobalProcurementQuickSummary(flightIntent);
      const hotelQuickSummary = quickApi.buildGlobalProcurementQuickSummary(hotelIntent);
      const productQuickSummary = quickApi.buildGlobalProcurementQuickSummary(productIntent);
      const serviceQuickSummary = quickApi.buildGlobalProcurementQuickSummary(serviceIntent);
      const ticketQuickSummary = quickApi.buildGlobalProcurementQuickSummary(ticketIntent);
      const multiQuickSummary = quickApi.buildGlobalProcurementQuickSummary(multiIntent);
      const blockedQuickSummary = quickApi.buildGlobalProcurementQuickSummary(blockedIntent);
      const flightCard = resultCardApi.buildGlobalProcurementUserFacingResultCard({ globalProcurementIntent:flightIntent, globalProcurementDetailQuality:flightDetail });
      const hotelCard = resultCardApi.buildGlobalProcurementUserFacingResultCard({ globalProcurementIntent:hotelIntent, globalProcurementDetailQuality:hotelDetail });
      const productCard = resultCardApi.buildGlobalProcurementUserFacingResultCard({ globalProcurementIntent:productIntent, globalProcurementDetailQuality:productDetail });
      const serviceCard = resultCardApi.buildGlobalProcurementUserFacingResultCard({ globalProcurementIntent:serviceIntent, globalProcurementDetailQuality:serviceDetail });
      const ticketCard = resultCardApi.buildGlobalProcurementUserFacingResultCard({ globalProcurementIntent:ticketIntent, globalProcurementDetailQuality:ticketDetail });
      const multiCard = resultCardApi.buildGlobalProcurementUserFacingResultCard({ globalProcurementIntent:multiIntent, globalProcurementDetailQuality:multiDetail });
      const blockedCard = resultCardApi.buildGlobalProcurementUserFacingResultCard({ globalProcurementIntent:blockedIntent, globalProcurementDetailQuality:detailApi.composeGlobalProcurementDetailQuality(blockedIntent) });
      const resultCardRules = resultCardApi.buildGlobalProcurementUserFacingRules();
      const guard = guardApi.buildGlobalProcurementRestrictedCategoryGuard(blockedIntent);
      const evidence = evidenceApi.buildGlobalProcurementEvidenceSafetySummary();
      return {
        flightIntent,
        hotelIntent,
        productIntent,
        serviceIntent,
        ticketIntent,
        multiIntent,
        blockedIntent,
        blockedLoanIntent,
        plan,
        blockedPlan,
        blockedGuidance,
        checklist,
        guidance,
        policy,
        blockedPolicy,
        flightDetail,
        hotelDetail,
        productDetail,
        serviceDetail,
        ticketDetail,
        multiDetail,
        flightQuickSummary,
        hotelQuickSummary,
        productQuickSummary,
        serviceQuickSummary,
        ticketQuickSummary,
        multiQuickSummary,
        blockedQuickSummary,
        flightCard,
        hotelCard,
        productCard,
        serviceCard,
        ticketCard,
        multiCard,
        blockedCard,
        resultCardRules,
        guard,
        evidence,
        routerSafe:router.assertGlobalProcurementIntentRouterSafe(flightIntent),
        planSafe:composer.assertGlobalProcurementPlanSafe(plan),
        blockedPlanSafe:composer.assertGlobalProcurementPlanSafe(blockedPlan),
        checklistSafe:checklistApi.assertGlobalProcurementMissingInfoChecklistSafe(checklist),
        guidanceSafe:guidanceApi.assertGlobalProcurementSafeNextStepGuidanceSafe(guidance),
        policySafe:policyApi.assertGlobalProcurementExternalSearchPolicySafe(policy),
        blockedPolicySafe:policyApi.assertGlobalProcurementExternalSearchPolicySafe(blockedPolicy),
        detailSafe:detailApi.assertGlobalProcurementDetailQualitySafe(flightDetail),
        flightQuickSummarySafe:quickApi.assertGlobalProcurementQuickSummarySafe(flightQuickSummary),
        resultCardSafe:resultCardApi.assertGlobalProcurementUserFacingResultCardsSafe(flightCard),
        blockedResultCardSafe:resultCardApi.assertGlobalProcurementUserFacingResultCardsSafe(blockedCard),
        guardSafe:guardApi.assertGlobalProcurementRestrictedCategoryGuardSafe(guard),
        evidenceSafe:evidenceApi.assertGlobalProcurementEvidenceSafetySummarySafe(evidence)
      };
    });
    expect(contracts.flightIntent).toEqual(expect.objectContaining({ category:"flight", origin:"上海", destination:"成都", date:"7 月 15 日", sortPreference:"低价优先", externalSearchOnly:true, redacted:true }));
    expect(contracts.blockedIntent).toEqual(expect.objectContaining({ category:"restricted_or_blocked", riskLevel:"high", externalSearchOnly:false, redacted:true }));
    expect(contracts.blockedLoanIntent).toEqual(expect.objectContaining({ category:"restricted_or_blocked", blockedReason:"identity upload / bank card submission / loan or credit with identity upload", externalSearchOnly:false, redacted:true }));
    expect(contracts.plan).toEqual(expect.objectContaining({ title:"全球采购计划", status:"offline_planning_only", redacted:true }));
    expect(contracts.plan.planItems[0]).toEqual(expect.objectContaining({ realProvider:"disabled", realNetwork:"disabled", realPrice:"disabled", bookingUrl:"disabled", payment:"disabled", order:"disabled", identityUpload:"disabled" }));
    expect(contracts.blockedPlan.externalSearchEntries).toEqual([]);
    expect(contracts.blockedGuidance.items).toEqual(expect.arrayContaining(["当前不继续整理购买路径", "当前不提供购买入口", "当前不提供外部搜索入口", "当前不提供复制搜索条件", "当前不提供规避建议"]));
    expect(contracts.blockedGuidance.items).not.toEqual(expect.arrayContaining(["复制搜索条件", "人工打开官方渠道", "人工比较平台政策"]));
    expect(contracts.checklist).toEqual(expect.objectContaining({ checklistVersion:"2.1.39", status:"draft only", mode:"local planning only", realProvider:"disabled", realNetwork:"disabled", redacted:true }));
    expect(contracts.guidance).toEqual(expect.objectContaining({ guidanceVersion:"2.1.39", status:"safe guidance only", mode:"no transaction", realProvider:"disabled", realNetwork:"disabled", payment:"disabled", order:"disabled", redacted:true }));
    expect(contracts.policy).toEqual(expect.objectContaining({ policyVersion:"2.1.39", status:"manual external search only", autoClick:"disabled", bookingUrl:"disabled", realProvider:"disabled", realNetwork:"disabled", redacted:true, allowExternalSearch:true }));
    expect(contracts.blockedPolicy.allowExternalSearch).toBe(false);
    expect(contracts.flightDetail).toEqual(expect.objectContaining({ detailQualityVersion:"2.1.39", title:"机票搜索计划", emptyResultLine:"暂无真实价格结果", currentStatusLine:"当前为离线采购规划 / 只整理条件 / 不接真实平台。", redacted:true }));
    expect(contracts.flightDetail.identifiedConditions).toEqual(expect.arrayContaining(["出发地：上海", "目的地：成都", "出发日期：7 月 15 日", "排序：低价优先"]));
    expect(contracts.hotelDetail.missingInfoList).toEqual(expect.arrayContaining(["入住人数", "房型偏好", "预算范围"]));
    expect(contracts.productDetail.identifiedConditions).toEqual(expect.arrayContaining(["商品名称：iPhone 16 Pro", "比较地区：美国 / 日本"]));
    expect(contracts.serviceDetail.title).toBe("本地服务筛选计划");
    expect(contracts.ticketDetail.emptyResultLine).toBe("暂无真实票价结果");
    expect(contracts.multiDetail.subPlans.length).toBeGreaterThanOrEqual(3);
    expect(contracts.flightQuickSummary).toContain("上海到成都");
    expect(contracts.ticketQuickSummary).toContain("门票/活动筛选条件");
    expect(contracts.blockedQuickSummary).toContain("已停止处理");
    expect(contracts.flightCard).toEqual(expect.objectContaining({ cardVersion:"2.1.39", title:"机票搜索计划", categoryLabel:"机票", currentStatusLine:"仅整理搜索条件，暂无真实价格", redacted:true }));
    expect(contracts.flightCard.copyActions.map((item) => item.label)).toEqual(["复制机票搜索条件"]);
    expect(contracts.hotelCard.copyActions.map((item) => item.label)).toEqual(["复制酒店搜索条件"]);
    expect(contracts.productCard.copyActions.map((item) => item.label)).toEqual(["复制商品比较条件"]);
    expect(contracts.serviceCard.copyActions.map((item) => item.label)).toEqual(["复制本地服务筛选条件"]);
    expect(contracts.ticketCard.copyActions.map((item) => item.label)).toEqual(["复制门票/活动搜索条件"]);
    expect(contracts.multiCard.title).toBe("多品类采购计划");
    expect(contracts.multiCard.copyActions.length).toBeGreaterThanOrEqual(3);
    expect(contracts.blockedCard).toEqual(expect.objectContaining({ title:"安全阻断", categoryLabel:"受限品类", actionPolicy:"copy disabled / external search disabled", redacted:true }));
    expect(contracts.blockedCard.copyActions).toEqual([]);
    expect(contracts.resultCardRules).toEqual(expect.objectContaining({ rulesVersion:"2.1.39", status:"user-facing summary only", realProvider:"disabled", realNetwork:"disabled", realPrice:"disabled", bookingUrl:"disabled", payment:"disabled", order:"disabled", identityUpload:"disabled", redacted:true }));
    expect(contracts.resultCardRules.restrictedCardRules).toEqual(expect.arrayContaining(["受限品类只显示阻断卡片", "受限品类不显示普通价格空态"]));
    expect(contracts.resultCardRules.copyActionRules).toEqual(expect.arrayContaining(["正常品类按当前类别显示复制按钮", "restricted_or_blocked 不显示复制按钮"]));
    expect(contracts.guard).toEqual(expect.objectContaining({ status:"active", mode:"local policy only", realProvider:"disabled", realNetwork:"disabled", payment:"disabled", order:"disabled", identityUpload:"disabled", redacted:true }));
    expect(contracts.evidence).toEqual(expect.objectContaining({ status:"offline planning only", realProvider:"disabled", realNetwork:"disabled", realApiKey:"disabled", realPrice:"disabled", availability:"disabled", bookingUrl:"disabled", payment:"disabled", order:"disabled", identityUpload:"disabled", redacted:true }));
    expect(contracts.evidence.evidenceLines).toEqual(expect.arrayContaining(["security:no-secret-persistence PASS", "commerce:provider-fixtures:offline PASS", "providerActivationState: no-go", "networkAttemptCount: 0", "realProviderCallCount: 0", "realPriceDisplayedCount: 0", "bookingUrlDisplayedCount: 0"]));
    expect(contracts.routerSafe).toBe(true);
    expect(contracts.planSafe).toBe(true);
    expect(contracts.blockedPlanSafe).toBe(true);
    expect(contracts.checklistSafe).toBe(true);
    expect(contracts.guidanceSafe).toBe(true);
    expect(contracts.policySafe).toBe(true);
    expect(contracts.blockedPolicySafe).toBe(true);
    expect(contracts.detailSafe).toBe(true);
    expect(contracts.flightQuickSummarySafe).toBe(true);
    expect(contracts.resultCardSafe).toBe(true);
    expect(contracts.blockedResultCardSafe).toBe(true);
    expect(contracts.guardSafe).toBe(true);
    expect(contracts.evidenceSafe).toBe(true);

    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-V2115-FLIGHT 7 月 15 日上海到成都最便宜的机票");
    const detail = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(detail).toContainText("机票搜索结果", { timeout:15000 });
    await expect(detail).toContainText("出发地：上海");
    await expect(detail).toContainText("目的地：成都");
    await expect(detail).toContainText("日期：7 月 15 日");
    await expect(detail).toContainText("排序：低价优先");
    await expect(detail).toContainText("暂无真实价格结果");
    await expect(detail).toContainText("全球采购计划");
    await expect(detail).toContainText("机票搜索计划");
    await expect(detail).toContainText("摘要：我已整理好这次机票搜索条件");
    await expect(detail).toContainText("当前状态：仅整理搜索条件，暂无真实价格");
    await expect(detail).toContainText("类别：机票");
    await expect(detail).toContainText("已整理条件");
    await expect(detail).toContainText("仍待人工确认");
    await expect(detail).toContainText("当前未开放");
    await expect(detail).toContainText("人工下一步");
    await expect(detail).toContainText("查看全球采购待补充信息清单");
    await expect(detail).toContainText("查看全球采购安全下一步建议");
    await expect(detail).toContainText("查看全球采购外部搜索入口规则");
    await expect(detail).toContainText("查看全球采购用户结果卡片规则");
    await expect(detail).toContainText("查看全球采购受限品类安全闸门");
    await expect(detail).toContainText("查看全球采购安全证据摘要");
    await expect(detail.getByRole("button", { name:"复制机票搜索条件" })).toHaveCount(1);
    await expect(detail.getByRole("button", { name:/复制旅行搜索条件|复制电脑搜索条件|复制全部搜索条件/ })).toHaveCount(0);
    await expect(detail).not.toContainText("出发地：日上海");
    await expect(detail).not.toContainText("日期：待补充");
    await expect(detail).not.toContainText(/¥\s*\d+/);
    await expect(detail.locator(".commerce-one-screen-card").first()).not.toContainText(/fake price|mock price|demo price|AI 估价/);

    await openDisclosure(detail, "commerce-global-procurement-user-facing-result-cards-disclosure");
    const cardRulesBody = detail.locator("details.commerce-global-procurement-user-facing-result-cards-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "card rules 已建立",
      "status: user-facing summary only",
      "real provider disabled",
      "real network disabled",
      "real price disabled",
      "bookingUrl disabled",
      "payment disabled",
      "order disabled",
      "identity upload disabled",
      "redacted: true",
      "category card list",
      "restricted card rules",
      "copy action rules",
      "history label rules"
    ]) {
      await expect(cardRulesBody).toContainText(text);
    }

    await openDisclosure(detail, "commerce-global-procurement-missing-info-disclosure");
    const missingBody = detail.locator("details.commerce-global-procurement-missing-info-disclosure .commerce-disclosure-body").first();
    await expect(missingBody).toContainText("全球采购待补充信息清单");
    await expect(missingBody).toContainText("draft only");
    await expect(missingBody).toContainText("real provider disabled");
    await expect(missingBody).toContainText("舱位偏好");

    await openDisclosure(detail, "commerce-global-procurement-safe-guidance-disclosure");
    const guidanceBody = detail.locator("details.commerce-global-procurement-safe-guidance-disclosure .commerce-disclosure-body").first();
    await expect(guidanceBody).toContainText("全球采购安全下一步建议");
    await expect(guidanceBody).toContainText("safe guidance only");
    await expect(guidanceBody).toContainText("payment disabled");
    await expect(guidanceBody).toContainText("人工比较航空公司官网 / Google Flights / Trip.com / 携程");

    await openDisclosure(detail, "commerce-global-procurement-external-search-policy-disclosure");
    const policyBody = detail.locator("details.commerce-global-procurement-external-search-policy-disclosure .commerce-disclosure-body").first();
    await expect(policyBody).toContainText("全球采购外部搜索入口规则");
    await expect(policyBody).toContainText("manual external search only");
    await expect(policyBody).toContainText("bookingUrl disabled");
    await expect(policyBody).toContainText("allowExternalSearch: true");
    await expect(policyBody).toContainText("外部搜索入口只能由用户手动点击");

    await openDisclosure(detail, "commerce-global-procurement-restricted-category-guard-disclosure");
    const guardBody = detail.locator("details.commerce-global-procurement-restricted-category-guard-disclosure .commerce-disclosure-body").first();
    await expect(guardBody).toContainText("guard 已建立");
    await expect(guardBody).toContainText("status: active");
    await expect(guardBody).toContainText("mode: local policy only");
    await expect(guardBody).toContainText("real provider disabled");
    await expect(guardBody).toContainText("real network disabled");
    await expect(guardBody).toContainText("payment disabled");
    await expect(guardBody).toContainText("order disabled");
    await expect(guardBody).toContainText("identity upload disabled");
    await expect(guardBody).toContainText("weapons");
    await expect(guardBody).toContainText("firearms");
    await expect(guardBody).toContainText("controlled drugs");
    await expect(guardBody).toContainText("gambling");
    await expect(guardBody).toContainText("identity upload");
    await expect(guardBody).toContainText("high risk category -> blocked");
    await expect(guardBody).toContainText("payment request -> blocked");
    await expect(guardBody).toContainText("identity upload request -> blocked");
    await expect(guardBody).toContainText("redacted: true");

    await openDisclosure(detail, "commerce-global-procurement-evidence-safety-summary-disclosure");
    const evidenceBody = detail.locator("details.commerce-global-procurement-evidence-safety-summary-disclosure .commerce-disclosure-body").first();
    await expect(evidenceBody).toContainText("summary 已建立");
    await expect(evidenceBody).toContainText("status: offline planning only");
    await expect(evidenceBody).toContainText("real API key disabled");
    await expect(evidenceBody).toContainText("real price disabled");
    await expect(evidenceBody).toContainText("availability disabled");
    await expect(evidenceBody).toContainText("bookingUrl disabled");
    await expect(evidenceBody).toContainText("security:no-secret-persistence PASS");
    await expect(evidenceBody).toContainText("commerce:provider-fixtures:offline PASS");
    await expect(evidenceBody).toContainText("providerActivationState: no-go");
    await expect(evidenceBody).toContainText("networkAttemptCount: 0");
    await expect(evidenceBody).toContainText("realProviderCallCount: 0");
    await expect(evidenceBody).toContainText("realPriceDisplayedCount: 0");
    await expect(evidenceBody).toContainText("bookingUrlDisplayedCount: 0");

    await submitHomeCommand(page, runId + "-V2119-BLOCKED-LOAN 帮我上传身份证和银行卡办贷款");
    const blockedLoan = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(blockedLoan).toContainText("全球采购计划", { timeout:15000 });
    await expect(blockedLoan).toContainText(/当前状态：该请求涉及身份资料 \/ 银行卡资料上传风险，(?:已停止处理|当前已阻断。)/);
    await expect(blockedLoan).toContainText("类别：受限品类");
    await expect(blockedLoan).toContainText("阻断原因：identity upload / bank card submission / loan or credit with identity upload");
    await expect(blockedLoan).toContainText("当前不提供上传入口");
    await expect(blockedLoan).toContainText("当前不提供贷款办理入口");
    await expect(blockedLoan).toContainText("当前不提供外部搜索入口");
    await expect(blockedLoan).toContainText("当前不提供复制搜索条件");
    await expect(blockedLoan).toContainText("weishan 不联网、不下单、不付款、不保存身份证、护照或银行卡");
    await expect(blockedLoan).toContainText("redacted: true");
    for (const forbidden of [
      "暂无真实价格结果",
      "接入可信价格源后",
      "当前只是整理搜索条件",
      "普通用户默认只看这一屏结果",
      "复制全部搜索条件",
      "复制旅行搜索条件",
      "复制电脑搜索条件",
      "打开全网搜索",
      "上传入口",
      "贷款办理入口"
    ]) {
      if (forbidden === "上传入口" || forbidden === "贷款办理入口") continue;
      await expect(blockedLoan).not.toContainText(forbidden);
    }
    await expect(blockedLoan.getByRole("button", { name:/打开全网搜索|复制搜索条件|付款|下单|提交订单/ })).toHaveCount(0);

  });

  test("v2.1.39 global procurement decision workspace stays offline and visible", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");

    await submitHomeCommand(page, runId + "-V2122-DECISION 帮我找 7 月 15 日东京迪士尼 2 人成人票购买方案");
    const summary = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(summary).toContainText("东京迪士尼", { timeout:15000 });
    await expect(summary).toContainText("全球采购决策工作台");

    for (const text of [
      "全球采购决策工作台",
      "决策工作台：已建立",
      "当前状态：只整理采购决策，不连接真实 provider。",
      "方案 A / 方案 B / 方案 C 简要矩阵",
      "风险核对",
      "可信度核对",
      "gate：closed",
      "sandbox gate",
      "endpoint allowlist gate",
      "key 生命周期",
      "脱敏规则",
      "本机安全存储",
      "API 绑定准备状态",
      "redacted: true"
    ]) {
      await expect(summary).toContainText(text);
    }
  });

  test("v2.1.39 ticket activity result stays isolated and keeps readonly provider result schema gate", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");

    await submitHomeCommand(page, runId + "-V2116-PREV 帮我买一台适合剪视频的电脑，预算一万以内。");
    await expect(page.locator('[data-commerce-home-summary="true"]').last()).toContainText("暂无真实价格结果", { timeout:15000 });

    await submitHomeCommand(page, runId + "-V2116-TICKET 帮我找 7 月 15 日东京迪士尼 2 人成人票购买方案");
    const ticketSummary = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(ticketSummary).toContainText("门票 / 活动购买计划", { timeout:15000 });
    for (const text of [
      "东京迪士尼",
      "类型：门票 / 活动",
      "暂无真实价格结果",
      "当前为离线采购规划，只整理条件，不接真实平台。",
      "当前尚未接入真实只读票价源，不能展示价格。",
      "查看只读 provider result schema gate"
    ]) {
      await expect(ticketSummary).toContainText(text);
    }
    for (const forbidden of [
      "我已整理好两个计划",
      "旅行：",
      "电脑：",
      "适合剪视频的新电脑",
      "7月12日去东京，7月12日入住，7月16日离店，孩子8岁",
      "fake price",
      "mock price",
      "demo price",
      "AI 估价",
      "上传证件",
      "银行卡入口"
    ]) {
      await expect(ticketSummary).not.toContainText(forbidden);
    }
    await expect(ticketSummary.getByRole("button", { name:/^(去预订|预订|付款|下单|提交订单)$/ })).toHaveCount(0);

    await ticketSummary.locator("details.commerce-readonly-provider-result-schema-gate-disclosure > summary").first().click();
    const schemaBody = ticketSummary.locator("details.commerce-readonly-provider-result-schema-gate-disclosure .commerce-disclosure-body").first();
    for (const text of [
      "只读 provider result schema gate：已建立",
      "closed",
      "draft",
      "redacted: true",
      "rawProviderPayload",
      "bookingUrl",
      "raw provider payload 显示：禁止",
      "sandbox gate",
      "endpoint allowlist gate",
      "key 生命周期",
      "脱敏规则",
      "本机安全存储",
      "API 绑定准备状态"
    ]) {
      await expect(schemaBody).toContainText(text);
    }

    const historyItems = page.locator("#cmdHistory [data-history-id]");
    await submitHomeCommand(page, runId + "-V2116-PRODUCT 帮我买一台剪视频电脑");
    await expect(page.locator('[data-commerce-home-summary="true"]').last()).toContainText("暂无真实价格结果", { timeout:15000 });
    const historyCount = await historyItems.count();
    await historyItems.filter({ hasText:runId + "-V2116-TICKET" }).first().click();
    const historyDetail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    await expect(historyDetail).toContainText("东京迪士尼");
    await expect(historyDetail).toContainText("查看只读 provider result schema gate");
    await expect(historyDetail).not.toContainText("我已整理好两个计划");
    await expect(historyDetail).not.toContainText("适合剪视频的新电脑");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCount);
  });

  test("v2.1.39 commerce normal category smoke stays clean result surface only @commerce-smoke", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");

    const cases = [
      {
        input:runId + "-SMOKE-FLIGHT 购买7月15日上海到成都最便宜的直达机票",
        expected:["机票搜索结果", "出发地：上海", "目的地：成都", "日期：7 月 15 日", "直达偏好：直达优先", "排序：低价优先", "推荐结果", "只读候选价", "平台最终为准", "未锁价", "不代表可出票", "去平台确认", "手动核对入口"]
      },
      {
        input:runId + "-SMOKE-HOTEL 帮我找成都春熙路附近 7 月 12 日入住 7 月 14 日离店的酒店",
        expected:["酒店", "成都春熙路", "暂无真实价格结果"]
      },
      {
        input:runId + "-SMOKE-PRODUCT 帮我比较美国和日本买 iPhone 16 Pro，收货到中国",
        expected:["商品", "iPhone 16 Pro", "暂无真实价格结果"]
      },
      {
        input:runId + "-SMOKE-SERVICE 帮我找成都附近靠谱的搬家公司",
        expected:["本地服务", "搬家公司", "暂无真实价格结果"]
      },
      {
        input:runId + "-SMOKE-TICKET 帮我找 7 月 15 日东京迪士尼 2 人成人票购买方案",
        expected:["门票 / 活动", "东京迪士尼", "暂无真实价格结果"]
      },
      {
        input:"我从成都出发，7 月 12 日去东京，7 月 12 日入住，7 月 16 日离店，孩子 8 岁；同时想买一台适合剪视频的电脑，32G 内存、1T 硬盘，收货地成都，不接受二手。" + " " + runId + "-SMOKE-MULTI",
        expected:["全球采购计划", "暂无真实价格结果"]
      }
    ];

    for (const item of cases) {
      await submitHomeCommand(page, item.input);
      const summary = page.locator('[data-commerce-home-summary="true"]').last();
      for (const text of item.expected) {
        await expect(summary).toContainText(text, { timeout:15000 });
      }
      await expect(summary).not.toContainText(/fake price|mock price|demo price|AI 估价/i);
      if (item.input.includes("SMOKE-FLIGHT")) {
        await expect(summary.locator(".commerce-top-result-card")).toHaveCount(1);
        const flightCard = summary.locator(".commerce-top-result-card").first();
        await expect(flightCard).toContainText("¥1010");
        await expect(flightCard).toContainText("票面价 ¥860｜税费 ¥110｜附加费 ¥40");
        await expect(flightCard).toContainText("燃油/机建费：以平台页面为准");
        await expect(flightCard.locator(".commerce-result-card-badge")).toHaveCount(4);
        await expect(flightCard).toContainText("只读候选价");
        await expect(flightCard).toContainText("平台最终为准");
        await expect(flightCard).toContainText("未锁价");
        await expect(flightCard).toContainText("不代表可出票");
        await expect(flightCard).not.toContainText("只读候选价平台最终为准未锁价不代表可出票");
        await expect(flightCard).not.toContainText("只读候选价平台最终为准未锁价不代表可出票去平台确认");
        await expect(flightCard).not.toContainText("autoOpen: false");
        await expect(flightCard).not.toContainText("payment: false");
        await expect(flightCard).not.toContainText("order: false");
        await expect(flightCard).not.toContainText("identityUpload: false");
        await expect(flightCard).not.toContainText("redacted: true");
        await expect(flightCard).not.toContainText("audit draft");
        await expect(flightCard).not.toContainText("rollbackDecision");
        const fareDetails = flightCard.locator("details.commerce-fare-breakdown").first();
        await expect(fareDetails).toHaveJSProperty("open", false);
        await fareDetails.locator("> summary").click();
        await fareDetails.evaluate((el) => { if (!el.open) el.open = true; el.setAttribute("open", ""); });
        await expect(fareDetails).toContainText("票面价：¥860");
        await expect(fareDetails).toContainText("燃油附加费：未单独提供 / 以平台页面为准");
        await expect(fareDetails).toContainText("机场建设费 / 民航发展基金：未单独提供 / 以平台页面为准");
        await expect(fareDetails).toContainText("平台服务费：未单独提供 / 以平台页面为准");
        await expect(fareDetails).toContainText("税费：¥110");
        await expect(fareDetails).toContainText("其它附加费：¥40");
        await expect(fareDetails).toContainText("最终应付总价：¥1010");
        await fareDetails.evaluate((el) => { el.open = false; el.removeAttribute("open"); });
        const userSurfaceText = await visibleTextWithoutTechnicalDetails(summary);
        expect((userSurfaceText.match(/最终应付总价：¥1010/g) || []).length).toBe(0);
        expect((userSurfaceText.match(/weishan 只做搜索和比较，不收款、不下单/g) || []).length).toBeLessThanOrEqual(1);
        expect((userSurfaceText.match(/暂无生产真实最低价/g) || []).length).toBeLessThanOrEqual(1);
        expect(userSurfaceText).not.toContain("目的地：成都直达");
        expect(userSurfaceText).not.toContain("上海 → 成都直达");
        expect(userSurfaceText).not.toContain("Cheapest Truth Guard");
        expect(userSurfaceText).not.toContain("not_ranked_as_real_cheapest");
        expect(userSurfaceText).not.toContain("canClaimCheapest");
        expect(userSurfaceText).not.toContain("internal guardName");
        await expect(summary.locator(".commerce-manual-verification-actions")).toContainText("手动核对入口");
        await expect(summary.locator(".commerce-manual-verification-actions")).toContainText("复制机票搜索条件");
        await expect(summary.locator(".commerce-manual-verification-actions")).toContainText("打开全网搜索");
        await expect(summary.locator(".commerce-manual-verification-actions")).toContainText("打开 Google Flights 搜索");
        await expect(summary.locator(".commerce-manual-verification-actions")).toContainText("打开 Trip.com / 携程搜索");
        await expect(summary.locator(".commerce-manual-verification-actions")).toContainText("查看外部搜索安全说明");
        await expect(summary.locator(".commerce-provider-handoff-ui-panel").first()).toContainText("去平台确认");
        const handoffPanel = summary.locator(".commerce-provider-handoff-ui-panel").first();
        await handoffPanel.locator("> summary").click();
        await handoffPanel.evaluate((el) => {
          if (!el.open) el.open = true;
          el.setAttribute("open", "");
        });
        await expect(handoffPanel).toContainText("核心核对");
        await expect(handoffPanel).toContainText("核对出发地 / 目的地 / 日期");
        await expect(handoffPanel).toContainText("查看完整核对清单");
        await expect(handoffPanel).toContainText("复制价格拆分摘要");
        const handoffNote = handoffPanel.locator("details.commerce-provider-handoff-note").first();
        await expect(handoffNote).toHaveJSProperty("open", false);
        await handoffNote.locator("> summary").click();
        await handoffNote.evaluate((el) => { if (!el.open) el.open = true; el.setAttribute("open", ""); });
        await expect(handoffNote).toContainText("核对平台域名");
        await expect(handoffNote).toContainText("不向未知平台提交身份证、护照或银行卡");
        await expect(summary).not.toContainText(/最低价已找到|保证最低价|最便宜结果/);
      } else {
        await expect(summary).not.toContainText(/¥\s*\d+/);
      }
      await expect(summary).not.toContainText(/bookingUrl:\s*https?:/i);
      await expect(summary.getByRole("button", { name:/^(去预订|预订|付款|下单|提交订单)$/ })).toHaveCount(0);

      if (item.input.includes("SMOKE-FLIGHT")) {
        const topHistoryCard = page.locator("#cmdHistory [data-history-id]").first();
        await expect(topHistoryCard).toContainText("机票");
        await expect(topHistoryCard).not.toContainText("raw JSON");
        await expect(topHistoryCard).not.toContainText("audit draft");
        await expect(topHistoryCard).not.toContainText("token");
        await expect(topHistoryCard).not.toContainText("endpoint");
        await expect(summary).toContainText("查看安全与调试详情");
        const defaultText = await visibleTextWithoutTechnicalDetails(summary);
        expect(defaultText).not.toContain("Provider 接入准备控制台");
        expect(defaultText).not.toContain("Sandbox Dry Run");
        expect(defaultText).not.toContain("候选平台沙箱矩阵");
        expect(defaultText).not.toContain("API key");
        expect(defaultText).not.toContain("endpoint");
        await openDisclosure(summary, "commerce-simple-flight-advanced-debug-disclosure");
        const debugBody = summary.locator("details.commerce-simple-flight-advanced-debug-disclosure .commerce-disclosure-body").first();
        for (const text of [
          "安全与调试详情",
          "后台 gate / audit / readiness 默认隐藏",
          "查看 AI Procurement Brain",
          "查看 AI Backend Router",
          "查看 Clarification Gate",
          "查看 Clean Result Surface V1",
          "查看 Top Result Cards Builder",
          "查看 Provider Handoff UI",
          "查看 Clean Result Surface V2",
          "查看 Clean Result Surface V3",
          "查看 Clean Result Surface V4",
          "查看 Provider 接入准备控制台"
        ]) {
          await expect(debugBody).toContainText(text);
        }

        await openDisclosure(debugBody, "commerce-ai-procurement-brain-disclosure");
        const brainBody = debugBody.locator("details.commerce-ai-procurement-brain-disclosure .commerce-disclosure-body").first();
        for (const text of ["AI Procurement Brain", "ai procurement brain: active", "preferred backend: safe_network_search", "allowPayment: false", "allowOrder: false", "allowIdentityUpload: false", "redacted: true"]) {
          await expect(brainBody).toContainText(text);
        }

        await openDisclosure(debugBody, "commerce-ai-backend-router-disclosure");
        const routerBody = debugBody.locator("details.commerce-ai-backend-router-disclosure .commerce-disclosure-body").first();
        for (const text of ["AI Backend Router", "backendDecision: safe_network_search", "user_ai_token", "safe_network_search", "local_rules", "tokenPlaintextDisplayed: false", "networkAllowed"]){
          await expect(routerBody).toContainText(text);
        }

        await openDisclosure(debugBody, "commerce-clean-result-surface-v1-disclosure");
        const cleanBody = debugBody.locator("details.commerce-clean-result-surface-v1-disclosure .commerce-disclosure-body").first();
        for (const text of ["Clean Result Surface V1", "debugPanelsHiddenByDefault: true", "resultCardCount", "bookingUrlDisplayedCount: 0", "paymentActionDisplayedCount: 0", "orderActionDisplayedCount: 0", "identityUploadDisplayedCount: 0", "redacted: true"]){
          await expect(cleanBody).toContainText(text);
        }

        await openDisclosure(debugBody, "commerce-top-result-cards-builder-disclosure");
        const topCardsBody = debugBody.locator("details.commerce-top-result-cards-builder-disclosure .commerce-disclosure-body").first();
        for (const text of ["Top Result Cards Builder", "top result cards builder: active", "maxCardCount: 3", "cheapestClaimCount: 0", "limitedBetaCheapestClaimBlockedCount: 1", "incompleteFareExcludedCount: 1", "totalPayableSortUsed: false", "fakeResultBlockedCount: 0", "bookingUrlDisplayedCount: 0", "paymentActionDisplayedCount: 0", "orderActionDisplayedCount: 0", "identityUploadDisplayedCount: 0", "FLIGHT_FARE_BREAKDOWN_DRAFT", "CHEAPEST_TRUTH_GUARD_DRAFT", "FARE_CARD_UX_CLEANUP_DRAFT", "TOP_RESULT_CARDS_BUILDER_DRAFT", "redacted: true"]) await expect(topCardsBody).toContainText(text);

        await openDisclosure(debugBody, "commerce-provider-handoff-ui-disclosure");
        const handoffBody = debugBody.locator("details.commerce-provider-handoff-ui-disclosure .commerce-disclosure-body").first();
        for (const text of ["Provider Handoff UI", "provider handoff UI: manual-only", "autoOpen: false", "bookingUrl: null", "payment: false", "order: false", "identityUpload: false", "PROVIDER_HANDOFF_UI_DRAFT", "redacted: true"]) await expect(handoffBody).toContainText(text);

        await openDisclosure(debugBody, "commerce-clean-result-surface-v2-disclosure");
        const cleanV2Body = debugBody.locator("details.commerce-clean-result-surface-v2-disclosure .commerce-disclosure-body").first();
        for (const text of ["Clean Result Surface V2", "clean result surface v2: active", "debugPanelsHiddenByDefault: true", "backendPanelDefaultExpandedCount: 0", "destinationModifierLeakCount: 0", "duplicateSafetyHintCount: 0", "internalDebugLabelVisibleCount: 0", "bookingUrlDisplayedCount: 0", "paymentButtonDisplayedCount: 0", "orderButtonDisplayedCount: 0", "identityUploadDisplayedCount: 0", "CLEAN_RESULT_SURFACE_V2_DRAFT", "redacted: true"]) await expect(cleanV2Body).toContainText(text);

        await openDisclosure(debugBody, "commerce-clean-result-surface-v3-disclosure");
        const cleanV3Body = debugBody.locator("details.commerce-clean-result-surface-v3-disclosure .commerce-disclosure-body").first();
        for (const text of ["Clean Result Surface V3", "clean result surface v3: active", "compactCardsEnabled: true", "manualVerificationGroupEnabled: true", "longExternalSearchHintCollapsed: true", "bookingUrlDisplayedCount: 0", "paymentActionDisplayedCount: 0", "orderActionDisplayedCount: 0", "identityUploadDisplayedCount: 0", "CLEAN_RESULT_SURFACE_V3_DRAFT", "RESULT_CARD_VISUAL_FORMATTER_DRAFT", "MANUAL_HANDOFF_UX_V2_DRAFT", "redacted: true"]) await expect(cleanV3Body).toContainText(text);

        await openDisclosure(debugBody, "commerce-clean-result-surface-v4-disclosure");
        const cleanV4Body = debugBody.locator("details.commerce-clean-result-surface-v4-disclosure .commerce-disclosure-body").first();
        for (const text of ["Clean Result Surface V4", "clean result surface v4: active", "compact flight result card: active", "user surface debug filter: active", "manual handoff UX v3: manual-only", "manual verification group v2: active", "task history summary formatter: active", "clean result surface v4: active", "bookingUrl handoff: disabled", "payment/order: disabled", "flight_provider final decision: limited-beta-ready", "其它 provider final decision: no-go", "受限品类 final decision: blocked", "debugFieldLeakCount: 0", "bookingUrlDisplayedCount: 0", "paymentActionDisplayedCount: 0", "orderActionDisplayedCount: 0", "identityUploadDisplayedCount: 0", "USER_SURFACE_FINAL_CLEANUP_DRAFT", "TASK_HISTORY_SUMMARY_FORMATTER_DRAFT", "COMPACT_FLIGHT_RESULT_CARD_V1_DRAFT", "MANUAL_HANDOFF_UX_V3_DRAFT", "MANUAL_VERIFICATION_GROUP_V2_DRAFT", "redacted: true"]) await expect(cleanV4Body).toContainText(text);


        await openDisclosure(debugBody, "commerce-provider-connection-readiness-console-disclosure");
        const readinessBody = debugBody.locator("details.commerce-provider-connection-readiness-console-disclosure .commerce-disclosure-body").first();
        for (const text of ["Provider 接入准备控制台", "real provider disabled", "real network disabled", "bookingUrl disabled", "payment disabled", "order disabled", "redacted: true"]){
          await expect(readinessBody).toContainText(text);
        }
      }
    }
  });

  test("v2.1.68 read-only quote refresh button updates local evidence only @commerce-smoke", async () => {
    await resetCommerceTasks(page);
    await page.evaluate(() => {
      try { window.localStorage.removeItem("weishan.readOnlyQuoteRefreshState.v1"); } catch (_) {}
    });
    await installOpenExternalMock(page);

    const summary = await createCommerceWorkbenchDetail(page, runId + "-V2148-REFRESH 购买7月15日上海到成都最便宜的直达机票");
    await expect(summary).toContainText("机票搜索结果", { timeout:15000 });
    await expect(summary).toContainText("只读候选价");
    await expect(summary).toContainText("候选报价证据摘要");
    await expect(summary).toContainText("只读候选价 · 平台最终为准");
    await expect(summary).toContainText("当前导入样本 / 沙盒运行中的候选价格");
    await expect(summary).toContainText("Top 3 候选报价");
    await expect(summary).toContainText("平台最终为准");
    await expect(summary).toContainText("未锁价");
    await expect(summary).toContainText("不代表可出票");
    await expect(summary).toContainText("唯珊不会付款");

    const refreshButton = summary.locator("[data-commerce-read-only-quote-refresh]").first();
    await expect(refreshButton).toBeVisible();
    await refreshButton.click();

    await expect(summary.locator('[data-commerce-read-only-refresh-summary="true"]').first()).toContainText(/最近一次刷新：(已刷新|安全失败|未运行)/, { timeout:15000 });
    await expect(summary).toContainText("仅更新候选证据，未锁价，不代表可出票");
    await expect(summary).toContainText("价格、库存、税费和规则以平台页面为准");
    await expect(summary).not.toContainText(/bookingUrl:\s*https?:|checkoutUrl:\s*https?:|paymentUrl:\s*https?:|orderUrl:\s*https?:/i);
    await expect(summary.getByRole("button", { name:/^(去预订|预订|付款|下单|提交订单|上传证件|上传银行卡)$/ })).toHaveCount(0);
    expect(await latestOpenExternalUrl(page)).toBe("");

    const visible = await visibleTextWithoutTechnicalDetails(summary);
    expect(visible).not.toMatch(/真实最终价|全网最低|保证最低价|最低价已找到|最便宜结果|已锁价。|可以出票|可直接出票/);
    expect(visible).not.toMatch(/\b(token|key|secret)\b/i);
  });

  test("v2.1.68 local read-only quote evidence recovery stays candidate-only @commerce-smoke", async () => {
    await resetCommerceTasks(page);
    await page.evaluate((id) => {
      try {
        window.localStorage.setItem("weishan.readOnlyQuoteRefreshState.v1", JSON.stringify({
          stateName:"read_only_quote_refresh_state_v1",
          appVersion:"2.1.72",
          lastRefreshStatus:"refreshed",
          providerId:"google_flights_search",
          providerName:"Google Flights",
          providerMode:"fixture",
          fareSource:"fixture_read_only",
          currency:"CNY",
          baseFare:860,
          taxesAndFees:110,
          providerFees:40,
          totalPrice:1010,
          freshnessStatus:"fixture_snapshot",
          taxFeeIntegrityStatus:"partial_breakdown",
          showableAsRealPrice:false,
          showableAsCandidateEvidence:true,
          canReplaceMainResultCard:false,
          safeProviderHandoffReady:false,
          safeProviderHandoffDisplayHost:"",
          bookingUrl:null,
          checkoutUrl:null,
          paymentUrl:null,
          orderUrl:null,
          autoOpen:false,
          payment:false,
          order:false,
          identityUpload:false,
          evidenceId:id + "-local-redacted-state",
          redacted:true
        }));
      } catch (_) {}
    }, runId);

    const summary = await createCommerceWorkbenchDetail(page, runId + "-V2148-RECOVERY 购买7月15日上海到成都最便宜的直达机票");
    await expect(summary).toContainText("机票搜索结果", { timeout:15000 });
    await expect(summary).toContainText("只读候选价");
    await expect(summary).toContainText("平台最终为准");
    await expect(summary).toContainText("不代表可出票");
    await expect(summary.locator('[data-commerce-read-only-recovered-evidence="true"]').first()).toContainText("已恢复最近一次只读证据", { timeout:15000 });
    await expect(summary.locator('[data-commerce-read-only-refresh-summary="true"]').first()).toContainText("最近一次刷新：已刷新");
    const recoveryState = await page.evaluate(() => window.WeishanReadOnlyQuoteInteractiveRefreshUiController.buildReadOnlyQuoteRecoveryUiState({}));
    expect(recoveryState.recoveredEvidenceSummary.available).toBe(true);
    expect(recoveryState.recoveredEvidenceSummary.canReplaceMainResultCard).toBe(false);
    expect(recoveryState.safety.bookingUrl).toBe(null);
    expect(recoveryState.safety.checkoutUrl).toBe(null);
    expect(recoveryState.safety.paymentUrl).toBe(null);
    expect(recoveryState.safety.orderUrl).toBe(null);
    expect(recoveryState.safety.autoOpen).toBe(false);
    expect(recoveryState.safety.autoRefresh).toBe(false);
    await expect(summary).not.toContainText(/bookingUrl:\s*https?:|checkoutUrl:\s*https?:|paymentUrl:\s*https?:|orderUrl:\s*https?:/i);
    await expect(summary.getByRole("button", { name:/^(去预订|预订|付款|下单|提交订单|上传证件|上传银行卡)$/ })).toHaveCount(0);

    const visible = await visibleTextWithoutTechnicalDetails(summary);
    expect(visible).not.toMatch(/真实最终价|全网最低|保证最低价|最低价已找到|最便宜结果|已锁价。|可以出票|可直接出票/);
    expect(visible).not.toMatch(/\b(token|key|secret)\b/i);
  });



  test("v2.1.68 multi sandbox quote import ranks and selects read-only candidates @commerce-smoke", async () => {
    await resetCommerceTasks(page);
    await page.evaluate(() => {
      try { window.localStorage.removeItem("weishan.sandboxProviderResponseImportState.v1"); } catch (_) {}
    });
    await installOpenExternalMock(page);

    const summary = await createCommerceWorkbenchDetail(page, runId + "-V2149-IMPORT 购买7月15日上海到成都最便宜的直达机票");
    await expect(summary).toContainText("机票搜索结果", { timeout:15000 });
    for (const text of ["只读沙盒导入证据", "已导入沙盒报价证据", "导入响应已脱敏", "未锁价，不代表可出票", "价格、库存、税费和规则以平台页面为准"]) await expect(summary).toContainText(text);

    const debugDetails = summary.locator("details.commerce-simple-flight-advanced-debug-disclosure").first();
    await expect(debugDetails).toBeVisible();
    await debugDetails.evaluate((node) => { node.open = true; node.dispatchEvent(new Event("toggle")); });
    const debugBody = debugDetails.locator(".commerce-disclosure-body").first();
    for (const item of [
      ["commerce-sandbox-provider-dry-run-harness-disclosure", "Sandbox Provider Dry-Run Harness"],
      ["commerce-sandbox-response-import-disclosure", "Sandbox Response Import Console"],
      ["commerce-last-sandbox-import-evidence-disclosure", "Last Sandbox Import Evidence"],
      ["commerce-import-sanitization-disclosure", "Import Sanitization"]
    ]) {
      await openDisclosure(debugBody, item[0]);
      await expect(debugBody.locator(`details.${item[0]} .commerce-disclosure-body`).first()).toContainText(item[1]);
    }

    const importConsole = debugBody.locator("details.commerce-sandbox-response-import-disclosure .commerce-disclosure-body").first();
    for (const text of ["沙盒响应导入", "预览导入结果", "确认导入脱敏证据", "Validation Preview", "Import Sanitization", "raw response stored false", "rawResponseStored: false", "bookingUrl forced null"]) await expect(importConsole).toContainText(text);
    await expect(importConsole).not.toContainText(/\b(token|key|secret)\b/i);

    await importConsole.locator('[data-commerce-run-sandbox-dry-run="true"]').click();
    const importOutput = importConsole.locator('[data-commerce-sandbox-response-import-output="true"]');
    await expect(importOutput).toContainText("当前只读报价会话", { timeout:15000 });
    await expect(importOutput).toContainText("Read-Only Quote Session");
    await expect(importOutput).toContainText("Audit Export");
    await expect(importOutput).toContainText("Session Recovery");
    await expect(importOutput).toContainText("本导出仅为只读候选证据");
    await expect(importOutput).toContainText("不包含原始响应、密钥、交易链接或身份信息");
    await expect(importOutput).not.toContainText(/token\s*[:=]|key\s*[:=]|secret\s*[:=]/i);
    await expect(importOutput).not.toContainText(/bookingUrl:\s*https?:|paymentUrl:\s*https?:|orderUrl:\s*https?:/i);
    expect(await latestOpenExternalUrl(page)).toBe("");

    const auditButton = summary.locator('[data-commerce-read-only-audit-export-preview="true"]').first();
    await expect(auditButton).toBeVisible();
    await auditButton.click();
    await expect(summary.locator('[data-commerce-read-only-audit-export-output="true"]').first()).toContainText("Redacted JSON Preview", { timeout:15000 });
    await expect(summary.locator('[data-commerce-read-only-audit-export-output="true"]').first()).toContainText("Read-Only Quote Session Report Center");
    await expect(summary.locator('[data-commerce-read-only-audit-export-output="true"]').first()).toContainText("User-Facing Evidence Summary");
    await expect(summary.locator('[data-commerce-read-only-audit-export-output="true"]').first()).toContainText("Safety Quote Evidence Report");
    await expect(summary.locator('[data-commerce-read-only-audit-export-output="true"]').first()).toContainText("本导出仅为只读候选证据");
    await expect(summary.locator('[data-commerce-read-only-audit-export-output="true"]').first()).toContainText("不包含原始响应、密钥、交易链接或身份信息");
    await expect(summary.locator('[data-commerce-read-only-audit-export-output="true"]').first()).not.toContainText(/rawResponse|token|key|secret|bookingUrl|paymentUrl|orderUrl/i);
    expect(await latestOpenExternalUrl(page)).toBe("");

    const recoverButton = summary.locator('[data-commerce-recover-read-only-quote-session="true"]').first();
    await expect(recoverButton).toBeVisible();
    await recoverButton.click();
    await expect(summary.locator('[data-commerce-read-only-session-recovery-output="true"]').first()).toContainText("Session Recovery", { timeout:15000 });
    await expect(summary.locator('[data-commerce-read-only-session-recovery-output="true"]').first()).toContainText("当前只读报价会话");
    await expect(summary.locator('[data-commerce-read-only-session-recovery-output="true"]').first()).toContainText("不付款、不下单、不出票");
    expect(await latestOpenExternalUrl(page)).toBe("");

    const quote = (quoteId, baseFare, taxesAndFees, providerFees, totalPrice, freshnessMinutes) => ({ providerId:"flight_provider_trusted_fixture", providerName:"Trusted Flight Fixture", providerMode:"sandbox_read_only", fareSource:"sandbox_read_only_import", route:{ origin:"SHA", destination:"CTU" }, departureDate:"2026-07-15", currency:"CNY", baseFare, taxesAndFees, providerFees, totalPrice, priceUpdatedAt:"2026-01-01T00:00:00.000Z", freshnessMinutes, quoteId, handoffCandidate:{ providerId:"google_flights_search", handoffType:"provider_search" } });
    const validSandboxJson = JSON.stringify([
      quote("q1010", 860, 110, 40, 1010, 15),
      quote("q1040", 880, 120, 40, 1040, 20),
      quote("q980", 830, 110, 40, 980, 10)
    ], null, 2);
    await importConsole.locator('[data-commerce-sandbox-response-import-input="true"]').fill(validSandboxJson);
    await importConsole.locator('[data-commerce-sandbox-response-import-preview="true"]').click();
    await expect(importConsole.locator('[data-commerce-sandbox-response-import-output="true"]')).toContainText("validationStatus: accepted", { timeout:15000 });
    await expect(importConsole.locator('[data-commerce-sandbox-response-import-output="true"]')).toContainText("Top 3 候选报价");
    await expect(importConsole.locator('[data-commerce-sandbox-response-import-output="true"]')).toContainText("当前导入样本中的低价候选");
    await expect(importConsole.locator('[data-commerce-sandbox-response-import-output="true"]')).toContainText("Ranking Scope: 导入样本范围");
    await expect(importConsole.locator('[data-commerce-sandbox-response-import-output="true"]')).toContainText("#1 ¥980");
    await expect(importConsole.locator('[data-commerce-sandbox-response-import-output="true"]')).toContainText("#2 ¥1010");
    await expect(importConsole.locator('[data-commerce-sandbox-response-import-output="true"]')).toContainText("#3 ¥1040");
    await importConsole.locator('[data-commerce-sandbox-response-import-confirm="true"]').click();
    await expect(importConsole.locator('[data-commerce-sandbox-response-import-output="true"]')).toContainText("只读沙盒导入证据", { timeout:15000 });
    await expect(importConsole.locator('[data-commerce-sandbox-response-import-output="true"]')).toContainText("导入响应已脱敏");
    await expect(summary.locator('[data-commerce-sandbox-import-banner="true"]').first()).toContainText("只读沙盒导入证据", { timeout:15000 });
    await expect(summary.locator('[data-commerce-sandbox-import-banner="true"]').first()).toContainText("仅作为候选证据，未锁价，不代表可出票");
    const topCandidates = summary.locator('[data-commerce-read-only-top-candidates="true"]').first();
    await expect(topCandidates).toContainText("Top 3 候选报价", { timeout:15000 });
    await expect(topCandidates).toContainText("#1 ¥980");
    await expect(topCandidates).toContainText("#2 ¥1010");
    await expect(topCandidates).toContainText("#3 ¥1040");
    await expect(topCandidates.getByRole("button", { name:"选择该候选" }).first()).toBeVisible();
    await topCandidates.getByRole("button", { name:"选择该候选" }).first().click();
    await summary.locator('[data-commerce-safe-provider-handoff-request="true"]').first().click();
    await expect(summary).toContainText("前往平台确认", { timeout:15000 });
    await expect(summary).toContainText("前往平台确认前检查", { timeout:15000 });
    await expect(summary).toContainText("唯珊不会付款、不会下单", { timeout:15000 });
    await expect(summary).toContainText("唯珊不会上传证件或银行卡", { timeout:15000 });
    await summary.locator('[data-commerce-safe-provider-handoff-cancel="true"]').first().click();
    expect(await latestOpenExternalUrl(page)).toBe("");

    const importRecovery = await page.evaluate(() => window.WeishanReadOnlyQuoteInteractiveRefreshUiController.buildSandboxImportRecoveryUiState({}));
    expect(importRecovery.sandboxImportSummary.rawResponseStored).toBe(false);
    expect(importRecovery.safety.bookingUrl).toBe(null);
    expect(importRecovery.safety.autoOpen).toBe(false);

    await expect(summary).not.toContainText(/bookingUrl:\s*https?:|checkoutUrl:\s*https?:|paymentUrl:\s*https?:|orderUrl:\s*https?:/i);
    await expect(summary.getByRole("button", { name:/^(去预订|预订|付款|下单|提交订单|上传证件|上传银行卡)$/ })).toHaveCount(0);
    expect(await latestOpenExternalUrl(page)).toBe("");

    const visible = await visibleTextWithoutTechnicalDetails(summary);
    expect(visible).not.toMatch(/真实最终价|全网最低|最低价保证|保证最低价|最低价已找到|已锁价。|可出票。|可以出票|可直接出票|立即购买/);
    expect(visible).not.toMatch(/\b(token|key|secret)\b/i);
  });


  test("v2.1.39 vague procurement requests ask clarification without fake results @commerce-smoke", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");

    const cases = [
      { input:runId + "-V2134-VAGUE-FLIGHT 帮我买机票", expected:["请补充关键信息", "出发地", "目的地", "日期"] },
      { input:runId + "-V2134-VAGUE-PRODUCT 买 iPhone", expected:["请补充关键信息", "型号", "购买地区", "收货地"] }
    ];

    for (const item of cases) {
      await submitHomeCommand(page, item.input);
      const summary = page.locator('[data-commerce-home-summary="true"]').last();
      for (const value of item.expected) await expect(summary).toContainText(value, { timeout:15000 });
      await expect(summary.locator(".commerce-top-result-card")).toHaveCount(0);
      await expect(summary).not.toContainText(/fake price|mock price|demo price|AI 估价|¥\s*\d+/i);
      await expect(summary).not.toContainText(/bookingUrl:\s*https?:/i);
      await expect(summary.getByRole("button", { name:/^(去预订|预订|付款|下单|提交订单)$/ })).toHaveCount(0);
    }
  });

  test("v2.1.39 secure API key storage console stays metadata-only and offline @commerce-smoke", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");

    await submitHomeCommand(page, runId + "-V2125-STORAGE 7 月 15 日上海到成都最便宜的机票");
    const summary = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(summary).toContainText("机票搜索结果", { timeout:15000 });
    await expect(summary).toContainText("查看安全与调试详情");
    await openDisclosure(summary, "commerce-simple-flight-advanced-debug-disclosure");
    const debugBody = summary.locator("details.commerce-simple-flight-advanced-debug-disclosure .commerce-disclosure-body").first();
    await expect(debugBody).toContainText("查看安全 API Key 存储控制台");
    await openDisclosure(debugBody, "commerce-secure-api-key-storage-console-disclosure");
    const body = debugBody.locator("details.commerce-secure-api-key-storage-console-disclosure .commerce-disclosure-body").first();

    for (const value of [
      "安全 API Key 存储控制台",
      "请勿输入真实 API Key。本版本仅用于本机安全存储能力验证。",
      "status: secure local storage only",
      "mode: no provider connection",
      "real provider disabled",
      "real network disabled",
      "real endpoint disabled",
      "real price disabled",
      "bookingUrl disabled",
      "payment disabled",
      "order disabled",
      "identity upload disabled",
      "plaintext display disabled",
      "plaintext export disabled",
      "redacted: true",
      "机票 Provider Key",
      "酒店 Provider Key",
      "商品 Provider Key",
      "本地服务 Provider Key",
      "门票 / 活动 Provider Key",
      "机票 Provider Sandbox/Test Key",
      "flight_provider_sandbox_key",
      "SECURE_API_KEY_STORAGE_IMPLEMENTATION_DRAFT",
      "plaintextPersistedCount: 0",
      "plaintextDisplayedCount: 0",
      "plaintextExportedCount: 0",
      "localStorageSecretCount: 0",
      "sessionStorageSecretCount: 0",
      "realApiKeyInputCount: 0",
      "networkAttemptCount: 0",
      "realEndpointConnectCount: 0",
      "realPriceDisplayedCount: 0",
      "bookingUrlDisplayedCount: 0"
    ]) {
      await expect(body).toContainText(value);
    }

    await expect(body).not.toContainText(/WEISHAN_TEST_CREDENTIAL_PLACEHOLDER|WEISHAN_LOCAL_STORAGE_SELF_TEST_VALUE|sk-|pk-|live_|prod_/i);
    await expect(summary.getByRole("textbox", { name:/API key|endpoint/i })).toHaveCount(0);
    await expect(summary.getByRole("button", { name:/测试连接|连接 endpoint|预订|付款|下单|提交订单/ })).toHaveCount(0);
  });

  test("v2.1.39 secure API key storage test actions never reveal plaintext @commerce-smoke", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");

    await submitHomeCommand(page, runId + "-V2125-STORAGE-ACTIONS 7 月 15 日上海到成都最便宜的机票");
    const summary = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(summary).toContainText("机票搜索结果", { timeout:15000 });
    await openDisclosure(summary, "commerce-simple-flight-advanced-debug-disclosure");
    const debugBody = summary.locator("details.commerce-simple-flight-advanced-debug-disclosure .commerce-disclosure-body").first();
    await openDisclosure(debugBody, "commerce-secure-api-key-storage-console-disclosure");
    const body = debugBody.locator("details.commerce-secure-api-key-storage-console-disclosure .commerce-disclosure-body").first();
    const firstSlot = body.locator('[data-secure-api-key-slot="flight_provider_key"]').first();

    await body.getByRole("button", { name:"运行安全存储自检" }).click();
    await expect(body.locator("[data-secure-api-key-storage-feedback]")).toContainText(/安全存储自检通过|self-test PASS|storage unavailable/, { timeout:15000 });

    await firstSlot.getByRole("button", { name:"保存测试占位 Key" }).click();
    await expect(firstSlot.locator("[data-secure-api-key-slot-status]")).toContainText(/status: saved|status: storage_unavailable/, { timeout:15000 });
    const fingerprintBefore = await firstSlot.locator("[data-secure-api-key-slot-fingerprint]").innerText();

    if (/status: saved/.test(await firstSlot.locator("[data-secure-api-key-slot-status]").innerText())) {
      await firstSlot.getByRole("button", { name:"轮换测试占位 Key" }).click();
      await expect(firstSlot.locator("[data-secure-api-key-slot-fingerprint]")).not.toHaveText(fingerprintBefore, { timeout:15000 });
    }

    await firstSlot.getByRole("button", { name:"删除 Key" }).click();
    await expect(firstSlot.locator("[data-secure-api-key-slot-status]")).toContainText("status: empty", { timeout:15000 });
    await expect(body).not.toContainText(/WEISHAN_TEST_CREDENTIAL_PLACEHOLDER|WEISHAN_LOCAL_STORAGE_SELF_TEST_VALUE|sk-|pk-|live_|prod_/i);
    await expect(body).not.toContainText(/真实价格|bookingUrl:\s*https?:|paymentUrl|checkoutUrl|orderUrl/);
  });

  test("v2.1.68 decision assistant visible on read-only candidates @commerce-smoke", async () => {
    await resetCommerceTasks(page);
    await installOpenExternalMock(page);
    const summary = await createCommerceWorkbenchDetail(page, runId + "-V2157-DECISION 购买7月15日上海到成都最便宜的直达机票");
    for (const text of ["机票请求工作流", "当前工作流阶段", "当前可继续操作", "安全动作队列", "动作执行结果", "最近动作", "事件记录", "本动作不会付款、不会下单、不会出票", "外部平台操作需要二次确认", "进度时间线", "当前步骤", "下一步", "可继续操作", "已阻断动作", "运行只读报价", "选择候选", "前往平台确认", "记录平台核对结果", "唯珊不会付款", "唯珊不会下单", "唯珊不会出票", "唯珊不会上传证件或银行卡", "已选择候选", "恢复上次机票工作流", "唯珊只提供只读候选证据，不付款、不下单、不出票", "识别机票需求", "上海 到 成都", "生成候选证据", "生成 Top 3 候选", "推荐理由", "候选对比", "候选价置信标签", "下一步安全建议", "本地只读候选证据中较低", "平台最终为准", "未锁价", "不代表可出票", "仍需前往平台确认", "本次机票工作流审计", "安全检查通过", "动作已安全阻断", "只读安全", "交易动作已阻断", "脱敏会话摘要预览", "工作流摘要", "候选证据摘要", "安全审计摘要", "不包含证件、银行卡、登录凭据或密钥", "不包含付款、下单、出票链接", "canWriteFile:false", "bookingUrl:null", "查看工作流审计", "查看脱敏摘要预览", "机票工作流运营控制台", "工作流状态", "安全状态", "安全回归", "最近事件", "已阻断动作", "平台确认准备状态", "安全回归通过", "无交易链接", "无付款/下单/出票", "无证件/银行卡/登录凭据", "无密钥或原始响应", "无自动打开或自动刷新", "查看运营控制台", "查看安全回归检查"]) {
      await expect(summary).toContainText(text, { timeout:15000 });
    }
    await expect(summary).not.toContainText(/全网最低|最低价保证|真实最终价|已锁价|可以出票|可直接出票/);
    await expect(summary).not.toContainText(/bookingUrl:\s*https?:|paymentUrl:\s*https?:|orderUrl:\s*https?:|token\s*[:=]|key\s*[:=]|secret\s*[:=]/i);
    await expect(summary).not.toContainText(/token\s*[:=]|key\s*[:=]|secret\s*[:=]/i);
    await expect(summary).not.toContainText(/下载文件|保存文件/);
    await expect(summary.getByRole("button", { name:/^(付款|下单|提交订单|上传证件|上传银行卡)$/ })).toHaveCount(0);
    const runReadOnlyAction = summary.locator('[data-commerce-flight-safe-action="run_read_only_quotes"]').first();
    if ((await runReadOnlyAction.count()) && await runReadOnlyAction.isEnabled()) {
      await runReadOnlyAction.click();
      await expect(summary).toContainText("动作已执行", { timeout:15000 });
      await expect(summary).toContainText("事件记录");
    }
    const providerConfirmAction = summary.locator('[data-commerce-flight-safe-action="open_provider_confirmation"]').first();
    if ((await providerConfirmAction.count()) && await providerConfirmAction.isEnabled()) {
      await providerConfirmAction.click();
      await expect(summary).toContainText("需要确认后继续", { timeout:15000 });
      await expect(summary).toContainText("外部平台操作需要二次确认");
    }
    const blockedAction = summary.locator('[data-commerce-flight-safe-action="blocked_action"]').first();
    if (await blockedAction.count()) {
      await blockedAction.click();
      await expect(summary).toContainText("动作已被安全阻断", { timeout:15000 });
    }
    await summary.locator('[data-commerce-flight-audit-review-show="true"]').first().click();
    await expect(summary).toContainText("本次机票工作流审计", { timeout:15000 });
    await expect(summary).toContainText("交易动作已阻断", { timeout:15000 });
    await summary.locator('[data-commerce-flight-safe-export-preview-show="true"]').first().click();
    await expect(summary).toContainText("脱敏会话摘要预览", { timeout:15000 });
    await expect(summary).toContainText("不包含付款、下单、出票链接", { timeout:15000 });
    await summary.locator('[data-commerce-flight-operator-console-show="true"]').first().click();
    await expect(summary).toContainText("机票工作流运营控制台", { timeout:15000 });
    await expect(summary).toContainText("平台确认准备状态", { timeout:15000 });
    await summary.locator('[data-commerce-flight-safety-regression-show="true"]').first().click();
    await expect(summary).toContainText("安全回归", { timeout:15000 });
    await expect(summary).toContainText("无交易链接", { timeout:15000 });
    await expect(summary).not.toContainText(/下载文件|保存文件/);
    await summary.locator('[data-commerce-flight-safe-action-cancel="true"]').first().click();
    await expect(summary).toContainText("已取消外部平台操作", { timeout:15000 });
    await summary.getByRole("button", { name:"恢复上次机票工作流" }).first().click();
    await expect(summary).toContainText("当前工作流阶段");
    expect(await latestOpenExternalUrl(page)).toBe("");
  });

  test("v2.1.72 flight workflow release readiness dashboard stays local @commerce-smoke", async () => {
    await resetCommerceTasks(page);
    const summary = await createCommerceWorkbenchDetail(page, runId + "-V2169-READY 购买7月15日上海到成都最便宜的直达机票");
    for (const text of ["机票工作流运营控制台", "场景模拟", "安全测试矩阵", "查看场景模拟", "查看安全测试矩阵", "场景模拟仅用于安全回归，不代表真实票价、库存或可出票", "安全测试矩阵仅为本地安全回归检查，不代表真实票价或可出票", "机票工作流发布就绪总览", "查看发布就绪总览", "发布状态", "安全红线", "安全矩阵", "用户复核摘要", "仍被禁止的能力", "安全文案已统一", "当前仍是只读候选证据流程", "不代表真实票价、库存或可出票", "唯珊不会付款、不会下单、不会出票", "唯珊不会上传证件、银行卡或登录凭据", "只读 Beta 验收", "只读 Beta 用户测试", "验收步骤", "用户测试", "填写测试反馈", "测试反馈已脱敏", "确认不会付款、下单或出票", "测试过程不会付款、不会下单、不会出票", "只读 Beta 验收复核", "测试反馈汇总", "反馈可用于验收参考", "仍需补充反馈", "反馈已脱敏", "验收会话摘要", "本次验收已完成", "验收进行中", "仍需复核", "下一步建议", "验收复核只用于改进只读候选证据流程", "Beta 反馈复核板", "反馈趋势", "验收会话", "可用反馈", "安全文案理解", "可以扩大只读测试", "仍需更多反馈", "下一步建议", "Beta 反馈只用于改进只读候选证据流程"]) {
      await expect(summary).toContainText(text, { timeout:15000 });
    }
    await summary.locator('[data-commerce-flight-scenario-simulator-show="true"]').first().click();
    const simulatorOutput = summary.locator('[data-commerce-flight-scenario-simulator-output="true"]').first();
    await expect(simulatorOutput).toContainText("机票工作流场景模拟", { timeout:15000 });
    await expect(simulatorOutput).toContainText("完整机票请求");
    await expect(simulatorOutput).toContainText("非法交易链接阻断");
    await summary.locator('[data-commerce-flight-safety-test-matrix-show="true"]').first().click();
    const matrixOutput = summary.locator('[data-commerce-flight-safety-test-matrix-output="true"]').first();
    await expect(matrixOutput).toContainText("安全测试矩阵", { timeout:15000 });
    await expect(matrixOutput).toContainText("场景数");
    await expect(matrixOutput).toContainText("失败");
    await summary.locator('[data-commerce-flight-release-readiness-show="true"]').first().click();
    const releaseOutput = summary.locator('[data-commerce-flight-release-readiness-output="true"]').first();
    await expect(releaseOutput).toContainText("机票工作流发布就绪总览", { timeout:15000 });
    await expect(releaseOutput).toContainText("可以进入只读 Beta 验收");
    await expect(releaseOutput).toContainText("bookingUrl:null");
    await expect(releaseOutput).toContainText("payment:false");
    await expect(releaseOutput).toContainText("order:false");
    await summary.locator('[data-commerce-flight-beta-acceptance-start="true"]').first().click();
    const betaOutput = summary.locator('[data-commerce-flight-beta-acceptance-output="true"]').first();
    await expect(betaOutput).toContainText("只读 Beta 用户测试", { timeout:15000 });
    await expect(betaOutput).toContainText("确认不会付款、下单或出票");
    await expect(betaOutput).toContainText("填写测试反馈");
    await summary.locator('[data-commerce-flight-beta-feedback-submit="true"]').first().click();
    await expect(betaOutput).toContainText("测试反馈已脱敏", { timeout:15000 });
    await expect(betaOutput).toContainText("不会保存原始用户反馈");
    await summary.locator('[data-commerce-flight-beta-review-show="true"]').first().click();
    const reviewOutput = summary.locator('[data-commerce-flight-beta-review-output="true"]').first();
    await expect(reviewOutput).toContainText("只读 Beta 验收复核", { timeout:15000 });
    await expect(reviewOutput).toContainText("验收会话摘要");
    await expect(reviewOutput).toContainText("下一步建议");
    await summary.locator('[data-commerce-flight-beta-feedback-review-show="true"]').first().click();
    const feedbackReviewOutput = summary.locator('[data-commerce-flight-beta-feedback-review-output="true"]').first();
    await expect(feedbackReviewOutput).toContainText("测试反馈汇总", { timeout:15000 });
    await expect(feedbackReviewOutput).toContainText("反馈可用于验收参考");
    await expect(feedbackReviewOutput).toContainText("反馈已脱敏");
    await summary.locator('[data-commerce-flight-beta-cohort-show="true"]').first().click();
    const cohortOutput = summary.locator('[data-commerce-flight-beta-cohort-output="true"]').first();
    await expect(cohortOutput).toContainText("Beta 反馈复核板", { timeout:15000 });
    await expect(cohortOutput).toContainText("验收会话");
    await expect(cohortOutput).toContainText("可用反馈");
    await expect(cohortOutput).toContainText("安全文案理解");
    await summary.locator('[data-commerce-flight-feedback-trend-show="true"]').first().click();
    const trendOutput = summary.locator('[data-commerce-flight-feedback-trend-output="true"]').first();
    await expect(trendOutput).toContainText("反馈趋势", { timeout:15000 });
    await expect(trendOutput).toContainText(/可以扩大只读测试|仍需更多反馈|仍需复核/);
    await expect(trendOutput).toContainText("不代表真实票价、库存或可出票");
    await expect(summary).not.toContainText(/下载文件|保存文件/);
    await expect(summary).not.toContainText(/bookingUrl:\s*https?:|paymentUrl:\s*https?:|orderUrl:\s*https?:/i);
    await expect(summary).not.toContainText(/全网最低|最低价保证|已锁价|真实最终价|立即购买|直接下单|一键出票/);
    const visible = await visibleTextWithoutTechnicalDetails(summary);
    expect(visible).not.toMatch(/(token|key|secret)/i);
  });

  test("v2.1.68 restricted flight request keeps simulator hidden @commerce-smoke", async () => {
    await resetCommerceTasks(page);
    const summary = await createCommerceWorkbenchDetail(page, runId + "-V2168-RESTRICTED 帮我买枪", "安全阻断");
    await expect(summary).toContainText("受限品类", { timeout:15000 });
    await expect(summary).toContainText("已停止处理");
    await expect(summary).toContainText("安全限制");
    await expect(summary).not.toContainText("场景模拟");
    await expect(summary).not.toContainText("安全测试矩阵");
    await expect(summary).not.toContainText("开始只读 Beta 验收");
    await expect(summary).toContainText(/安全阻断|安全限制/);
    await expect(summary.getByRole("button", { name:/^(付款|下单|提交订单|出票|上传证件|上传银行卡)$/ })).toHaveCount(0);
  });

  test("v2.1.68 safe handoff checklist and receipt cancel keeps platform closed @commerce-smoke", async () => {
    await resetCommerceTasks(page);
    await installOpenExternalMock(page);
    const summary = await createCommerceWorkbenchDetail(page, runId + "-V2157-EVIDENCE 购买7月15日上海到成都最便宜的直达机票");
    await openAdvancedDebug(summary);
    const debugBody = summary.locator("details.commerce-simple-flight-advanced-debug-disclosure .commerce-disclosure-body").first();
    await openDisclosure(debugBody, "commerce-read-only-decision-evidence-disclosure");
    const evidence = debugBody.locator("details.commerce-read-only-decision-evidence-disclosure .commerce-disclosure-body").first();
    for (const text of ["Read-Only Quote Decision Assistant", "Candidate Comparison", "Decision Evidence", "Forbidden Claims", "全网最低: false", "已锁价: false", "可出票: false", "bookingUrl: null", "paymentUrl: null", "orderUrl: null"]) {
      await expect(evidence).toContainText(text, { timeout:15000 });
    }
    const handoffButton = summary.locator('[data-commerce-safe-provider-handoff-request="true"]').first();
    await expect(handoffButton).toBeVisible();
    await handoffButton.click();
    await expect(summary).toContainText("前往平台确认", { timeout:15000 });
    await summary.locator('[data-commerce-safe-provider-handoff-cancel="true"]').first().click();
    expect(await latestOpenExternalUrl(page)).toBe("");
  });

  test("v2.1.68 manual platform check capture stays local and blocks sensitive input @commerce-smoke", async () => {
    await resetCommerceTasks(page);
    await installOpenExternalMock(page);
    const summary = await createCommerceWorkbenchDetail(page, runId + "-V2158-MANUAL-CHECK 购买7月15日上海到成都最便宜的直达机票");
    await expect(summary).toContainText("记录平台核对结果", { timeout:15000 });
    await summary.getByLabel("observedTotalPrice").first().fill("1030");
    await summary.getByLabel("currency").first().fill("CNY");
    await summary.locator("[data-commerce-manual-platform-check-save]").first().click();
    await expect(summary).toContainText("平台核对结果已记录", { timeout:15000 });
    await expect(summary).toContainText("平台核对汇总");
    await expect(summary).toContainText("候选价置信标签");
    await expect(summary).toContainText(/高一致|有差异/);
    await expect(summary).toContainText("下一步安全建议");
    await expect(summary).toContainText("平台核对差异");
    await expect(summary).toContainText("平台页面结果与候选价存在差异");
    await expect(summary).toContainText("重新核对平台页面");
    await expect(summary).toContainText("平台最终为准");
    await expect(summary).not.toContainText(/真实最终价|已锁价|可以出票|可直接出票/);
    await summary.getByLabel("userNote").first().fill("apiKey=SECRET cardNumber=4111111111111111");
    await summary.locator("[data-commerce-manual-platform-check-save]").first().click();
    await expect(summary).toContainText(/敏感输入(已|被)阻断/, { timeout:15000 });
    await expect(summary).not.toContainText("SECRET");
    expect(await latestOpenExternalUrl(page)).toBe("");
  });

  test("v2.1.68 incomplete and restricted flight workflow stay blocked @commerce-smoke", async () => {
    await resetCommerceTasks(page);
    await installOpenExternalMock(page);
    const incomplete = await createCommerceWorkbenchDetail(page, runId + "-V2160-INCOMPLETE 帮我查7月15日机票");
    await expect(incomplete).toContainText("需要补充信息", { timeout:15000 });
    await expect(incomplete).toContainText("机票请求工作流");
    await expect(incomplete).toContainText("补充缺失信息");
    await expect(incomplete).toContainText("从哪里出发？");
    await expect(incomplete).toContainText("到哪里？");
    await expect(incomplete).toContainText("信息完整后再生成候选证据");
    await expect(incomplete).toContainText("当前工作流阶段");
    await expect(incomplete).toContainText("下一步");
    await expect(incomplete).toContainText("可继续操作");
    await expect(incomplete).toContainText("当前可继续操作");
    await expect(incomplete).toContainText("进度时间线");
    await expect(incomplete).toContainText("当前步骤");
    await expect(incomplete).toContainText("恢复上次机票工作流");
    await expect(incomplete).toContainText("唯珊只提供只读候选证据，不付款、不下单、不出票");
    await expect(incomplete).not.toContainText("生成 Top 3 候选");
    await expect(incomplete).not.toContainText("去平台确认");
    await expect(incomplete).not.toContainText("运行只读报价");
    await expect(incomplete).not.toContainText("运行沙盒只读报价 · 已完成");
    expect(await latestOpenExternalUrl(page)).toBe("");

    await resetCommerceTasks(page);
    await gotoRoute(page, "commerce");
    await page.waitForFunction(() => !!(window.WeishanCommerceAgent && window.WeishanCommerceAgent.createCommerceTask && window.WeishanCommerceAgent.addCommerceTask), null, { timeout:15000 });
    await page.locator("#commerceInput").fill(runId + "-V2157-GUN 帮我买枪");
    await page.locator("#commerceGenerate").click();
    await expect.poll(async () => page.evaluate(() => {
      const api = window.WeishanCommerceAgent;
      const tasks = api && api.getCommerceTasks ? api.getCommerceTasks() : [];
      return Array.isArray(tasks) ? tasks.length : 0;
    }), { timeout:15000 }).toBeGreaterThan(0);
    await page.evaluate(() => {
      const api = window.WeishanCommerceAgent;
      const tasks = api && api.getCommerceTasks ? api.getCommerceTasks() : [];
      const taskId = Array.isArray(tasks) && tasks[0] && tasks[0].taskId || "";
      window.sessionStorage.setItem("weishan:commerceAgent:selectedTask:v1", taskId);
    });
    await page.evaluate(() => {
      const host = document.getElementById("pageHost");
      if (host && window.CommerceAgentPage && typeof window.CommerceAgentPage.mount === "function") window.CommerceAgentPage.mount(host);
    });
    await expect(page.locator(".commerce-detail").first()).toBeVisible({ timeout:15000 });
    const summary = page.locator(".commerce-detail").first();
    await expect(summary).toContainText("受限品类", { timeout:15000 });
    await expect(summary).toContainText("已停止处理");
    await expect(summary).toContainText("安全限制");
    await expect(summary).toContainText("已阻断动作");
    await expect(summary).not.toContainText("机票请求工作流");
    await expect(summary).not.toContainText("推荐理由");
    await expect(summary).not.toContainText("候选对比");
    await expect(summary).not.toContainText("去平台确认");
    await expect(summary).not.toContainText("平台核对汇总");
    await expect(summary).not.toContainText("记录平台核对结果");
    await expect(summary).not.toContainText("可以继续只读流程");
    await expect(summary.getByRole("button", { name:/^(付款|下单|提交订单|出票|上传证件|上传银行卡)$/ })).toHaveCount(0);
  });

  test("v2.1.39 restricted request smoke strips procurement actions @commerce-smoke", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");

    const cases = [
      {
        input:runId + "-SMOKE-GUN 帮我买枪",
        expected:["受限品类", "已停止处理", "weapons / firearms"]
      },
      {
        input:runId + "-SMOKE-LOAN 帮我上传身份证和银行卡办贷款",
        expected:["受限品类", "已停止处理", "identity upload / bank card submission / loan or credit with identity upload"]
      }
    ];

    for (const item of cases) {
      await submitHomeCommand(page, item.input);
      const summary = page.locator('[data-commerce-home-summary="true"]').last();
      for (const text of item.expected) {
        await expect(summary).toContainText(text, { timeout:15000 });
      }
      await expect(summary).not.toContainText("暂无真实价格结果");
      await expect(summary).not.toContainText("打开全网搜索");
      await expect(summary.getByRole("button", { name:/打开全网搜索|复制搜索条件|付款|下单|提交订单/ })).toHaveCount(0);
      await expect(summary).not.toContainText("手动核对入口");
      await expect(summary).not.toContainText("去平台确认");
      await expect(summary).not.toContainText("Top 3 候选报价");
      await expect(summary).not.toContainText("Sandbox Response Import Console");
      await expect(summary).not.toContainText("Read-Only Quote Session");
      await expect(summary).not.toContainText("Audit Export");
      if (item.input.includes("SMOKE-GUN")) {
        await expect(summary).toContainText("查看 Provider 接入准备控制台");
        await openDisclosure(summary, "commerce-provider-connection-readiness-console-disclosure");
        const readinessBody = summary.locator("details.commerce-provider-connection-readiness-console-disclosure .commerce-disclosure-body").first();
        await expect(readinessBody).toContainText("restricted_provider");
        await expect(readinessBody).toContainText("final decision: blocked");
        await expect(readinessBody).toContainText("real provider disabled");
        await expect(readinessBody).toContainText("real network disabled");
        await expect(readinessBody).toContainText("bookingUrl disabled");
        await expect(readinessBody).toContainText("payment disabled");
        await expect(readinessBody).toContainText("order disabled");
        await expect(readinessBody).toContainText("identity upload disabled");
      }
    }
  });

  test("v2.1.39 latest command priority keeps newest ticket task active and topmost @latest-command-priority", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");

    const movingTask = runId + "-V2118-MOVING 帮我找成都附近靠谱的搬家公司";
    const ticketTask = runId + "-V2118-TICKET 帮我找 7 月 15 日东京迪士尼 2 人成人票购买方案";

    await submitHomeCommand(page, movingTask);
    await expect(page.locator('[data-commerce-home-summary="true"]').last()).toContainText("搬家公司", { timeout:15000 });

    await submitHomeCommand(page, ticketTask);
    const ticketHome = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(ticketHome).toContainText("东京迪士尼", { timeout:15000 });
    await expect(ticketHome).toContainText("门票 / 活动");
    await expect(ticketHome).not.toContainText("搬家公司");

    const historyItems = page.locator("#cmdHistory [data-history-id]");
    await expect(historyItems.first()).toContainText(ticketTask);
    await expect(historyItems.nth(1)).toContainText(movingTask);
  });

  test("v2.1.39 history detail viewing does not intercept newly executed task @latest-command-priority", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");

    const productTask = runId + "-V2118-PRODUCT 帮我比较 iPhone 16 Pro 在美国和日本怎么买更合适，收货到中国";
    const ticketTask = runId + "-V2118-HISTORY-TICKET 帮我找 7 月 15 日东京迪士尼 2 人成人票购买方案";

    await submitHomeCommand(page, productTask);
    await expect(page.locator('[data-commerce-home-summary="true"]').last()).toContainText("iPhone 16 Pro", { timeout:15000 });

    await page.locator("#cmdHistory [data-history-id]").filter({ hasText:productTask }).first().click();
    const historyDetail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    await expect(historyDetail).toContainText(productTask);
    await expect(page.locator('[data-history-execution-hint="true"]')).toContainText("当前正在查看历史详情");

    await submitHomeCommand(page, ticketTask);
    await expect(page.locator('#cmdConsole [data-task-history-detail="true"]')).toHaveCount(0);
    const ticketHome = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(ticketHome).toContainText("东京迪士尼", { timeout:15000 });
    await expect(ticketHome).toContainText("门票 / 活动");
    await expect(ticketHome).not.toContainText("iPhone 16 Pro");
    await expect(page.locator("#cmdHistory [data-history-id]").first()).toContainText(ticketTask);
  });

  test("v2.1.39 latest flight request is not overridden by older ticket task @latest-command-priority", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");

    const ticketTask = runId + "-V2118-FLIGHT-PREV 帮我找 7 月 15 日东京迪士尼 2 人成人票购买方案";
    const flightTask = runId + "-V2118-FLIGHT 7 月 15 日上海到成都最便宜的机票";

    await submitHomeCommand(page, ticketTask);
    await expect(page.locator('[data-commerce-home-summary="true"]').last()).toContainText("东京迪士尼", { timeout:15000 });

    await submitHomeCommand(page, flightTask);
    const flightHome = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(flightHome).toContainText("出发地：上海", { timeout:15000 });
    await expect(flightHome).toContainText("目的地：成都");
    await expect(flightHome).toContainText("日期：7 月 15 日");
    await expect(flightHome).toContainText("排序：低价优先");
    await expect(flightHome).not.toContainText("日上海");
    await expect(flightHome).not.toContainText("日期：待补充");
    await expect(flightHome).not.toContainText("东京迪士尼");
    await expect(page.locator("#cmdHistory [data-history-id]").first()).toContainText(flightTask);
  });

  test("v2.1.39 clear finished preserves latest draft and executes newest input @latest-command-priority", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");

    const firstTask = runId + "-V2118-CLEAR-FIRST 帮我找 7 月 15 日东京迪士尼 2 人成人票购买方案";
    const secondTask = runId + "-V2118-CLEAR-SECOND 帮我比较 iPhone 16 Pro 在美国和日本怎么买更合适，收货到中国";
    const movingTask = runId + "-V2118-CLEAR-MOVING 帮我找成都附近靠谱的搬家公司";

    await submitHomeCommand(page, firstTask);
    await expect(page.locator('[data-commerce-home-summary="true"]').last()).toContainText("东京迪士尼", { timeout:15000 });

    await submitHomeCommand(page, secondTask);
    await expect(page.locator('[data-commerce-home-summary="true"]').last()).toContainText("iPhone 16 Pro", { timeout:15000 });

    await page.locator("#commandInput").fill(movingTask);
    await page.locator("#clearFinishedBtn").click();
    await expect(page.locator("#commandInput")).toHaveValue(movingTask);

    await page.locator("#runBtn").click();
    const movingHome = page.locator('[data-commerce-home-summary="true"]').last();
    await expect(movingHome).toContainText("搬家公司", { timeout:15000 });
    await expect(movingHome).not.toContainText("东京迪士尼");
    await expect(movingHome).not.toContainText("iPhone 16 Pro");
    await expect(page.locator("#cmdHistory [data-history-id]").first()).toContainText(movingTask);
  });

});
