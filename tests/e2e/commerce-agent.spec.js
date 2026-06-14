const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2ECOMMERCE-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

async function submitHomeCommand(page, text) {
  await gotoRoute(page, "home");
  await expect(page.locator("#commandInput")).toBeVisible();
  await page.locator("#commandInput").fill(text);
  await page.locator("#runBtn").click();
}

async function waitForLatestHomeTexts(page, texts) {
  const home = page.locator('[data-commerce-home-summary="true"]').last();
  for (const text of texts) {
    await expect(home).toContainText(text, { timeout:15000 });
  }
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
  const details = scope.locator(`details.${className || "commerce-technical-disclosure"}`).first();
  await expect(details).toHaveCount(1, { timeout: 15000 });
  const summary = details.locator("> summary").first();
  await expect(summary).toBeVisible({ timeout: 15000 });
  await summary.click();
  await details.evaluate((el) => {
    const body = el.querySelector(".commerce-disclosure-body");
    const template = el.querySelector(".commerce-disclosure-template");
    if (!el.open) el.open = true;
    if (template && body && !body.innerHTML.trim()) {
      try {
        body.innerHTML = decodeURIComponent(template.dataset.commerceDisclosureHtml || "");
      } catch (_) {
        body.textContent = template.dataset.commerceDisclosureHtml || "";
      }
      el.dataset.weishanDisclosureLoaded = "true";
    }
    if (body) body.hidden = false;
  });
  await expect.poll(async () => details.evaluate((el) => {
    const body = el.querySelector(".commerce-disclosure-body");
    return !!el.open && !!body && body.hidden === false && (body.innerText || body.textContent || "").length > 0;
  }), { timeout: 15000 }).toBe(true);
}

async function openTechnicalDetails(scope) {
  await openDisclosure(scope, "commerce-technical-disclosure");
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
  await page.evaluate(() => {
    if (window.WeishanCommerceAgent && window.WeishanCommerceAgent.clearCommerceTasks) window.WeishanCommerceAgent.clearCommerceTasks();
    if (window.CommandApi && window.CommandApi.clearAll) window.CommandApi.clearAll();
    window.dispatchEvent(new CustomEvent("weishan:command"));
  });
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
          const keys = ["weishan:commerceAgent:lastPlan:v1", "weishan:commerceAgent:tasks:v1", "weishan:commerceSearch:settings:v1", "weishan:commerceLocationPolicy:v1"];
          for (const key of keys) {
            const raw = window.localStorage.getItem(key);
            if (key === "weishan:commerceSearch:settings:v1" || raw && raw.includes(id)) window.localStorage.removeItem(key);
          }
        } catch (_) {}
      }, runId);
      await cleanupE2EData(page, runId);
    }
    if (app) await app.close();
  });

  test("global commerce workbench entry shows safety boundary", async () => {
    await expect(page.locator('.nav-item[data-route="commerce"]')).toBeVisible();
    await page.locator('.nav-item[data-route="commerce"]').click();
    await expect(page.getByRole("heading", { name:"全球采购" })).toBeVisible({ timeout:15000 });
    await expect(page.locator(".commerce-hero h1")).toHaveText("全球采购", { timeout:15000 });
    await expect(page.getByText("搜索、比价、推荐、执行前确认")).toBeVisible();
    await expect(page.getByText("当前不会访问真实平台、不会返回价格、不会跳转购买或预订、不会付款或下单").first()).toBeVisible();
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
    const inputs = ["买华为手机", "订酒店", "订机票", "买演唱会门票"];
    for (const text of inputs) {
      await submitHomeCommand(page, runId + "-SECRET-PANEL " + text);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      await expect(home).toContainText("查看技术细节");
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
    const inputs = ["买华为手机", "订酒店", "订机票", "买演唱会门票"];
    for (const text of inputs) {
      await submitHomeCommand(page, runId + "-SANDBOX-DRY-RUN " + text);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      const homeVisible = await visibleTextWithoutTechnicalDetails(home);
      await expect(home).toContainText("查看技术细节");
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
    const inputs = ["买华为手机", "订酒店", "订机票", "买演唱会门票"];
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
      await expect(home).toContainText("查看技术细节");
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
    const inputs = ["买华为手机", "订酒店", "订机票", "买演唱会门票"];
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
    const inputs = ["买华为手机", "订酒店", "订机票", "买演唱会门票"];
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

      await page.locator("#commerceViewPlanBtn").click();
      const detail = page.locator(".commerce-detail").first();
      await openTechnicalDetails(detail);
      const detailPanel = detail.locator(".commerce-provider-runbook-panel").first();
      for (const required of requiredTexts) await expect(detailPanel).toContainText(required);
      await expectPanelBefore(detailPanel, detail.locator(".commerce-provider-stub-profile-panel, .commerce-readonly-stub-panel").first());
      await expect(detail).toContainText("当地法律合规审查");
      await expect(detail).toContainText("Provider 接入准备总览");
      await expect(detail).toContainText("Connector Gate");
      await expect(detail).toContainText("Provider 接入审查面板");
      for (const field of rawFields) await expect(detail).not.toContainText(field);
      await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
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
      ["买演唱会门票", "门票 / 票务"],
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
      const homeProcess = home.locator("details.commerce-process-disclosure");
      const homeTechnical = home.locator("details.commerce-technical-disclosure");
      const homeVisible = await visibleTextWithoutTechnicalDetails(home);
      await expect(home).toContainText("查看技术细节");
      expect(homeVisible).not.toContain("Provider 接入准备总览");
      expect(homeVisible).not.toContain("Connector Gate");
      expect(homeVisible).not.toContain("Provider 接入审查面板");
      for (const field of rawFields) expect(homeVisible).not.toContain(field);
      expect(homeVisible).not.toMatch(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
      await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
      await expect(homeProcess).toHaveCount(1);
      await expect(homeTechnical).toHaveCount(1);
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
      await page.locator("#commerceViewPlanBtn").click();
      const detail = page.locator(".commerce-detail").first();
      const detailPanel = detail.locator(".commerce-local-intent-panel").first();
      const detailProcess = detail.locator("details.commerce-process-disclosure");
      const detailTechnical = detail.locator("details.commerce-technical-disclosure");
      await expect(detail).toContainText("查看技术细节");
      await expect(detailProcess).toHaveCount(1);
      await expect(detailTechnical).toHaveCount(1);
      await openDisclosure(detail, "commerce-process-disclosure");
      await openTechnicalDetails(detail);
      await expect(detailPanel).toContainText("本地意图识别");
      await expect(detailPanel).toContainText("当前类别：" + categoryLabel);
      await expect(detailPanel).toContainText("是否使用 AI：否");
      for (const field of rawFields) await expect(detail).not.toContainText(field);
      await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
      await gotoRoute(page, "home");
    }
  });

  test("commerce local intent marks complex travel fallback without unlocking providers", async () => {
    await submitHomeCommand(page, runId + "-LOCAL-INTENT-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const panel = home.locator(".commerce-local-intent-panel").first();
    const homeVisible = await visibleTextWithoutTechnicalDetails(home);
    await expect(home).toContainText("查看技术细节");
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
    await expect(home).toContainText("当地法律合规审查");
    await expect(home).toContainText("Provider 接入准备总览");
    await expect(home).toContainText("Provider 接入人工审批手册");
    await expect(home).toContainText("Connector Gate");
    await expect(home).toContainText("Provider Sandbox Dry Run");
    await expect(home).toContainText("Provider 密钥安全方案");
    await expect(home).toContainText("查看技术细节");
  });

  test("commerce local intent marks complex product fallback without prices or buying buttons", async () => {
    await submitHomeCommand(page, runId + "-LOCAL-INTENT-COMPLEX-PRODUCT 我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const panel = home.locator(".commerce-local-intent-panel").first();
    const homeVisible = await visibleTextWithoutTechnicalDetails(home);
    await expect(home).toContainText("查看技术细节");
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
    for (const text of ["当地法律合规审查", "Provider 接入准备总览", "Provider 接入人工审批手册", "Connector Gate", "Provider Sandbox Dry Run", "Provider 密钥安全方案"]) {
      await expect(home).toContainText(text);
    }
    await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    const rawFields = ["matrixVersion", "matrixMode=per_subplan_gate_matrix", "subPlanMatrices", "canAccessProvider=false", "canUseNetwork=false", "canReturnRealPrice=false", "canRedirect=false", "localLawCompliance:not_verified", "connectorGate:blocked"];
    for (const field of rawFields) await expect(home).not.toContainText(field);
    await page.locator("#commerceViewPlanBtn").click();
    const detail = page.locator(".commerce-detail").first();
    const detailPanel = detail.locator(".commerce-subplan-gate-panel").first();
    await openDisclosure(detail, "commerce-process-disclosure");
    await expect(detailPanel).toContainText("子计划闸门矩阵");
    await expect(detailPanel).toContainText("子计划数量：2");
    await expect(detailPanel).toContainText("旅行计划");
    await expect(detailPanel).toContainText("商品采购计划");
    for (const text of ["出发地", "具体出行日期", "入住日期", "离店日期", "儿童年龄", "品牌偏好", "性能要求", "收货地"]) {
      await expect(detailPanel).toContainText(text);
    }
    await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
    for (const field of rawFields) await expect(detail).not.toContainText(field);
  });

  test("subplan gate matrix supports simple product ticket and local service plans", async () => {
    const cases = [
      { input:"买华为手机", expected:["子计划数量：1", "商品采购计划", "缺失信息", "收货地", "预算", "型号或配置", "是否访问真实平台：否"] },
      { input:"买演唱会门票", expected:["子计划数量：1", "门票计划", "缺失信息", "城市", "日期", "张数", "座位偏好", "是否访问真实平台：否"] },
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
      await page.locator("#commerceViewPlanBtn").click();
      const detail = page.locator(".commerce-detail").first();
      await openDisclosure(detail, "commerce-process-disclosure");
      await expect(detail.locator(".commerce-subplan-gate-panel").first()).toContainText("子计划闸门矩阵");
      await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
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
    await page.locator("#commerceViewPlanBtn").click();
    const detail = page.locator(".commerce-detail").first();
    const detailPanel = detail.locator(".commerce-subplan-question-panel").first();
    await openDisclosure(detail, "commerce-process-disclosure");
    await expect(detailPanel).toContainText("子计划补充问题");
    await expect(detailPanel).toContainText("旅行计划");
    await expect(detailPanel).toContainText("商品采购计划");
    await expect(detailPanel).toContainText("你从哪个城市出发？");
    await expect(detailPanel).toContainText("是否接受二手或翻新机？");
    for (const field of rawFields) await expect(detail).not.toContainText(field);
    await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
  });

  test("subplan question panel supports simple product ticket and local service questions", async () => {
    const cases = [
      { input:"买华为手机", expected:["子计划补充问题", "商品采购计划", "收货地在哪个国家或城市？", "预算大概是多少？", "你需要什么型号或配置？"] },
      { input:"买演唱会门票", expected:["子计划补充问题", "门票计划", "想看哪个城市的票？", "想看哪一天或哪个时间段？", "需要几张票？", "对座位区域有什么偏好？"] },
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
    await page.locator("#commerceViewPlanBtn").click();
    const detail = page.locator(".commerce-detail").first();
    const detailPanel = detail.locator(".commerce-subplan-answer-panel").first();
    await openDisclosure(detail, "commerce-process-disclosure");
    await expect(detailPanel).toContainText("子计划答案收集");
    await expect(detailPanel).toContainText("出发地：成都");
    await expect(detailPanel).toContainText("性能要求：32G内存 / 1T硬盘");
    for (const field of rawFields) await expect(detail).not.toContainText(field);
    await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
  });

  test("subplan answer panel supports ticket and local service answers", async () => {
    const cases = [
      { plan:"买演唱会门票", answer:"成都，周六晚上，两张，中区座位，预算每张500以内。", expected:["门票计划", "城市：成都", "日期 / 时间段：周六晚上", "张数：两张", "座位偏好：中区座位", "预算：每张500以内"] },
      { plan:"预约理发", answer:"在高新区，明天下午，预算100以内，不需要上门。", expected:["本地服务计划", "服务地点：高新区", "预约时间：明天下午", "预算：100以内", "是否需要上门：不需要"] }
    ];
    for (const item of cases) {
      await submitHomeCommand(page, runId + "-ANSWER-SIMPLE " + item.plan);
      const expectedPlanTitle = item.plan === "买演唱会门票" ? "门票计划" : "本地服务计划";
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
    await page.locator("#commerceViewPlanBtn").click();
    const detail = page.locator(".commerce-detail").first();
    const detailPanel = detail.locator(".commerce-subplan-completion-panel").first();
    await openDisclosure(detail, "commerce-process-disclosure");
    await expect(detailPanel).toContainText("子计划补齐工作台");
    await expect(detailPanel).toContainText("旅行计划");
    await expect(detailPanel).toContainText("商品采购计划");
    await expect(detailPanel).toContainText("出发地：成都");
    await expect(detailPanel).toContainText("性能要求：32G内存 / 1T硬盘");
    for (const field of rawFields) await expect(detail).not.toContainText(field);
    await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
  });

  test("subplan draft review summary shows confirmable drafts without raw fields", async () => {
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
    for (const text of ["请确认以下旅行计划是否准确", "出发地：成都", "出行日期：7月12日", "入住日期：7月12日", "离店日期：7月16日", "儿童年龄：8岁", "请确认以下商品采购计划是否准确", "商品需求：适合剪视频的电脑", "品牌偏好：都可以", "性能要求：32G 内存 / 1T 硬盘", "收货地：成都", "是否接受二手：不接受", "剩余风险", "当地法律合规未确认", "Provider 审批未完成", "Connector Gate 已阻断", "是否访问真实平台：否", "是否返回价格：否", "是否跳转购买：否"]) await expect(panel).toContainText(text);
    const rawFields = ["draftReviewVersion", "defaultMode=review_completed_subplan_drafts", "reviewItems", "confirmableSummary", "unconfirmedFields", "remainingRisks", "canAccessProvider=false", "canUseNetwork=false", "canReturnRealPrice=false", "canRedirect=false", "rawTask", "dispatchPayload", "commandPayload"];
    for (const field of rawFields) await expect(home).not.toContainText(field);
    await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    await page.locator("#commerceViewPlanBtn").click();
    const detail = page.locator(".commerce-detail").first();
    const detailPanel = detail.locator(".commerce-subplan-draft-review-panel").first();
    await openDisclosure(detail, "commerce-process-disclosure");
    await openTechnicalDetails(detail);
    await expect(detailPanel).toContainText("子计划草稿复核摘要");
    await expect(detailPanel).toContainText("旅行计划");
    await expect(detailPanel).toContainText("商品采购计划");
    await expect(detailPanel).toContainText("出发地：成都");
    await expect(detailPanel).toContainText("性能要求：32G 内存 / 1T 硬盘");
    for (const field of rawFields) await expect(detail).not.toContainText(field);
    await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
  });

  test("subplan completion workspace supports simple product ticket and local service next questions", async () => {
    const cases = [
      { input:"买华为手机", title:"商品采购计划", expected:["子计划补齐工作台", "收货地在哪个国家或城市？", "预算大概是多少？", "你需要什么型号或配置？"] },
      { input:"买演唱会门票", title:"门票计划", expected:["子计划补齐工作台", "想看哪个城市的票？", "想看哪一天或哪个时间段？", "需要几张票？", "对座位区域有什么偏好？"] },
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
    const demand = runId + "-COMPLETION-HISTORY 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。";
    const answer = runId + "-COMPLETION-HISTORY 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。";
    await submitHomeCommand(page, demand);
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, answer);
    await submitHomeCommand(page, runId + "-COMPLETION-HISTORY 买演唱会门票");
    const historyItems = page.locator("#cmdHistory [data-history-id]");
    await expect(historyItems.filter({ hasText:answer }).first()).toBeVisible();
    const historyCountBefore = await historyItems.count();
    await historyItems.filter({ hasText:answer }).first().click();
    const detail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    await expect(detail).toContainText("历史任务详情");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("最终结果");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("查看可执行清单");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("查看平台模板");
    await expect(detail.locator(".commerce-result-summary-panel").getByRole("button", { name:"复制全部搜索条件" })).toHaveCount(1);
    await openDisclosure(detail.locator(".commerce-result-summary-panel"), "commerce-actionable-checklist-disclosure");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("复制机票搜索条件");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("复制酒店搜索条件");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("复制电脑搜索条件");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("复制全部清单");
    await expect(detail).toContainText("查看技术细节");
    await expect(detail).toContainText("查看分析过程");
    await expect(detail).toContainText("查看安全边界");
    await expect(detail).toContainText("查看分析过程");
    await expect(detail).toContainText("查看安全边界");
    await expect(detail.locator("details.commerce-process-disclosure")).toHaveCount(1);
    await expect(detail.locator("details.commerce-safety-disclosure")).toHaveCount(1);
    await expect(detail.locator("details.commerce-process-disclosure")).not.toHaveAttribute("open", "");
    await expect(detail.locator("details.commerce-safety-disclosure")).not.toHaveAttribute("open", "");
    await expect(detail).toContainText("最终结果");
    await expect(detail).toContainText("旅行：");
    await expect(detail).toContainText("电脑：");
    await expect(detail).toContainText("历史回看不会重新执行任务");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    for (const field of ["completionWorkspaceVersion", "defaultMode=guided_subplan_completion", "workspaceItems", "temporarySessionOnly=true", "temporaryDraftOnly=true", "canAccessProvider=false", "provider", "API key", "endpoint", "Connector Gate", "Sandbox Dry Run", "AI fallback"]) await expect(detail).not.toContainText(field);
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
    await expect(summaryPanel).toContainText("我已整理好两个计划");
    await expect(summaryPanel).toContainText("旅行：");
    await expect(summaryPanel).toContainText("成都出发，7月12日去东京，7月12日入住，7月16日离店，孩子8岁，预算一万以内");
    await expect(summaryPanel).toContainText("电脑：");
    await expect(summaryPanel).toContainText("适合剪视频的新电脑，按 32G 内存、1T 硬盘、品牌不限、收货地成都、不接受二手、一万以内筛选");
    await expect(summaryPanel).toContainText("当前只是整理搜索条件，不访问真实平台，不返回价格，不跳转购买或预订，不付款或下单");
    await expect(summaryPanel.getByRole("button", { name:"复制全部搜索条件" })).toHaveCount(1);
    await expect(summaryPanel.getByRole("button", { name:"复制旅行搜索条件" })).toHaveCount(1);
    await expect(summaryPanel.getByRole("button", { name:"复制电脑搜索条件" })).toHaveCount(1);
    await expect(summaryPanel).toContainText("查看可执行清单");
    await expect(summaryPanel).toContainText("查看平台模板");
    const defaultSummaryText = await visibleText(summaryPanel);
    expect(defaultSummaryText).not.toContain("机票搜索条件");
    expect(defaultSummaryText).not.toContain("电脑搜索条件：");
    expect(defaultSummaryText).not.toContain("Google Flights search template");
    expect(defaultSummaryText).not.toContain("京东电脑搜索模板");
    await openDisclosure(summaryPanel, "commerce-actionable-checklist-disclosure");
    await expect(summaryPanel).toContainText("可执行清单");
    await expect(summaryPanel).toContainText("机票搜索条件");
    await expect(summaryPanel).toContainText("出发地：成都");
    await expect(summaryPanel).toContainText("目的地：东京");
    await expect(summaryPanel).toContainText("出发日期：7月12日");
    await expect(summaryPanel).toContainText("乘客：1名成人 + 1名8岁儿童");
    await expect(summaryPanel).toContainText("酒店搜索条件");
    await expect(summaryPanel).toContainText("入住日期：7月12日");
    await expect(summaryPanel).toContainText("离店日期：7月16日");
    await expect(summaryPanel).toContainText("电脑搜索条件");
    await expect(summaryPanel).toContainText("用途：剪视频");
    await expect(summaryPanel).toContainText("内存：32G");
    await expect(summaryPanel).toContainText("硬盘：1T");
    await expect(summaryPanel).toContainText("最终价格以真实平台为准");
    await openDisclosure(summaryPanel, "commerce-platform-template-disclosure");
    await expect(summaryPanel).toContainText("平台搜索模板");
    await expect(summaryPanel).toContainText("Google Flights 模板");
    await expect(summaryPanel).toContainText("京东模板");
    await expect(home).toContainText("两个都确认");
    await expect(home).toContainText("电脑品牌优先苹果");
    await expect(home).toContainText("查看分析过程");
    await expect(home).toContainText("查看安全边界");
    await expect(home).toContainText("查看技术细节");
    await expect(home.locator("details.commerce-process-disclosure")).not.toHaveAttribute("open", "");
    await expect(home.locator("details.commerce-safety-disclosure")).not.toHaveAttribute("open", "");
    await expect(home.locator("details.commerce-technical-disclosure")).not.toHaveAttribute("open", "");
    await page.locator("#commerceViewPlanBtn").click();
    const detail = page.locator(".commerce-detail").first();
    const detailSummary = detail.locator(".commerce-result-summary-panel");
    await expect(detailSummary).toContainText("最终结果");
    await expect(detailSummary).toContainText("查看可执行清单");
    await expect(detailSummary).toContainText("查看平台模板");
    await expect(detail.locator("details.commerce-process-disclosure")).not.toHaveAttribute("open", "");
    await expect(detail.locator("details.commerce-safety-disclosure")).not.toHaveAttribute("open", "");
    await expect(detail.locator("details.commerce-technical-disclosure")).not.toHaveAttribute("open", "");
    await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(detail.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
  });

  test("v2.0.66 actionable checklist copy buttons copy text to clipboard without side effects", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    await submitHomeCommand(page, runId + "-COPY-CHECKLIST-COMPLEX 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。");
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, runId + "-COPY-CHECKLIST-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。");
    await waitForLatestDraftReviewReady(page);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const summaryPanel = home.locator(".commerce-result-summary-panel");
    await installClipboardMock(page);
    const historyCountBefore = await page.locator("#cmdHistory [data-history-id]").count();
    await summaryPanel.getByRole("button", { name:"复制全部搜索条件" }).click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("机票搜索条件");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("电脑搜索条件");
    await summaryPanel.getByRole("button", { name:"复制旅行搜索条件" }).click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("出发地：成都");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("入住日期：7月12日");
    await summaryPanel.locator('[data-commerce-copy-kind="computer"]').last().click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("用途：剪视频");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("是否接受二手：不接受");
    await openDisclosure(summaryPanel, "commerce-actionable-checklist-disclosure");
    const copyButtons = {
      flight: summaryPanel.locator('[data-commerce-copy-kind="flight"]').first(),
      hotel: summaryPanel.locator('[data-commerce-copy-kind="hotel"]').first(),
      computer: summaryPanel.locator('[data-commerce-copy-kind="computer"]').last(),
      full: summaryPanel.locator('[data-commerce-copy-kind="full"]').last()
    };
    await copyButtons.flight.click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("出发地：成都");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("目的地：东京");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("最终价格以真实平台为准");
    await expect(summaryPanel.locator("[data-commerce-copy-feedback]").first()).toContainText("已复制，可粘贴到外部平台搜索");
    await copyButtons.hotel.click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("入住日期：7月12日");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("离店日期：7月16日");
    await copyButtons.computer.click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("内存：32G");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("硬盘：1T");
    await copyButtons.full.click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("当前不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    await expect(summaryPanel.locator(".commerce-booking-link")).toHaveCount(0);
    await disableClipboardMock(page);
    await copyButtons.flight.click();
    await expect(summaryPanel.locator("[data-commerce-copy-feedback]").first()).toContainText("复制失败，请手动选择文本复制");
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
    await expect(summaryPanel).toContainText("查看平台模板");
    const defaultSummaryText = await visibleText(summaryPanel);
    expect(defaultSummaryText).not.toContain("Google Flights search template");
    expect(defaultSummaryText).not.toContain("Booking hotel search template");
    expect(defaultSummaryText).not.toContain("京东电脑搜索模板");
    expect(defaultSummaryText).not.toContain("Amazon laptop search template");
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
    await expect(summaryPanel).toContainText("成都出发，7月12日去东京");
    await expect(summaryPanel).toContainText("适合剪视频的新电脑");
    await expect(summaryPanel).toContainText("当前只是整理搜索条件，不访问真实平台，不返回价格，不跳转购买或预订，不付款或下单");
    for (const label of ["复制全部搜索条件", "复制旅行搜索条件", "复制电脑搜索条件", "查看可执行清单", "查看平台模板", "查看分析过程", "查看安全边界", "查看技术细节"]) {
      await expect(home).toContainText(label);
    }
    const defaultHomeText = await visibleTextWithoutTechnicalDetails(home);
    for (const hidden of ["机票搜索条件", "酒店搜索条件", "电脑搜索条件：", "Google Flights search template", "Booking hotel search template", "京东电脑搜索模板", "Amazon laptop search template", "本地意图识别", "子计划补齐工作台", "provider", "API key", "endpoint", "Connector Gate", "Sandbox Dry Run"]){
      expect(defaultHomeText).not.toContain(hidden);
    }
    await openDisclosure(summaryPanel, "commerce-actionable-checklist-disclosure");
    await expect(summaryPanel).toContainText("机票搜索条件");
    await expect(summaryPanel).toContainText("酒店搜索条件");
    await expect(summaryPanel).toContainText("电脑搜索条件");
    await openDisclosure(summaryPanel, "commerce-platform-template-disclosure");
    await expect(summaryPanel).toContainText("Google Flights 模板");
    await expect(summaryPanel).toContainText("Booking 模板");
    await expect(summaryPanel).toContainText("京东模板");
    await openDisclosure(home, "commerce-process-disclosure");
    await expect(home).toContainText("本地意图识别");
    await expect(home).toContainText("子计划补齐工作台");
    await openDisclosure(home, "commerce-safety-disclosure");
    await expect(home).toContainText("当前不会访问真实平台");
    await openTechnicalDetails(home);
    await expect(home).toContainText("provider");
    await expect(home).toContainText("API key");
    await expect(home).toContainText("endpoint");
    await installClipboardMock(page);
    const historyCountBefore = await page.locator("#cmdHistory [data-history-id]").count();
    await summaryPanel.getByRole("button", { name:"复制全部搜索条件" }).click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("机票搜索条件");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    await home.getByRole("button", { name:"两个都确认" }).click();
    await expect(page.locator("#commandInput")).toHaveValue(/两个都确认/);
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    await submitHomeCommand(page, runId + "-ONE-SCREEN-HISTORY 买演唱会门票");
    const historyItem = page.locator('#cmdHistory [data-history-id]', { hasText:"下个月带孩子去东京" }).first();
    const historyCountAfterNewTask = await page.locator("#cmdHistory [data-history-id]").count();
    await historyItem.click();
    const historyDetail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    await expect(historyDetail).toContainText("历史任务详情");
    await expect(historyDetail).toContainText("最终结果");
    await expect(historyDetail).toContainText("查看可执行清单");
    await expect(historyDetail).toContainText("查看平台模板");
    const historyDefaultText = await visibleTextWithoutTechnicalDetails(historyDetail);
    expect(historyDefaultText).not.toContain("Google Flights search template");
    expect(historyDefaultText).not.toContain("provider");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountAfterNewTask);
    await disableClipboardMock(page);
  });

  test("v2.0.77 trusted external search router keeps lowest two flight offers contract gated and candidate registry collapsed", async () => {
    await resetCommerceTasks(page);
    await gotoRoute(page, "home");
    const latestButton = page.locator("#taskHistoryLatestBtn");
    if (await latestButton.count()) await latestButton.click();
    const inputText = runId + "-SIMPLE-FLIGHT 7月15日上海到成都最便宜的机票";
    await submitHomeCommand(page, inputText);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const summaryPanel = home.locator(".commerce-simple-flight-result");
    await expect(summaryPanel).toHaveCount(1, { timeout:15000 });
    await expect(summaryPanel).toContainText("机票搜索条件已整理");
    await expect(summaryPanel).toContainText("出发地：上海");
    await expect(summaryPanel).toContainText("目的地：成都");
    await expect(summaryPanel).toContainText("出发日期：7月15日");
    await expect(summaryPanel).toContainText("搜索目标：低价优先");
    await expect(summaryPanel).toContainText("当前不能返回实时价格");
    await expect(summaryPanel).toContainText("当前状态：未接入真实机票价格源，暂不能返回实时价格。");
    await expect(summaryPanel).toContainText("价格状态：暂未接入真实机票价格源，当前不能显示最低价两家。");
    await expect(summaryPanel).toContainText("接入真实只读价格源后，weishan 会只展示通过安全检查的最低价前 2 家。最终价格、库存、出票规则和付款以外部平台为准。");
    await expect(summaryPanel).toContainText("当前只是帮你整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单");
    await expect(summaryPanel).not.toContainText("最终价格以真实平台为准");
    await expect(summaryPanel).not.toContainText(/¥\s*\d+/);
    for (const label of ["打开全网搜索", "打开 Google Flights 搜索", "打开 Trip.com / 携程搜索", "复制机票搜索条件", "复制 Google Flights 模板", "复制 Trip.com / 携程模板", "查看候选平台", "查看分析过程", "查看安全边界", "查看技术细节"]) await expect(home).toContainText(label);
    await expect(summaryPanel).toContainText("点击后会打开外部搜索或外部平台");
    await expect(summaryPanel).toContainText("weishan 当前不返回价格，不付款，不下单");
    await expect(summaryPanel).toContainText("全网搜索结果由外部搜索引擎提供");
    const contract = await page.evaluate(() => window.WeishanCommerceFlightLowestOffersContract && typeof window.WeishanCommerceFlightLowestOffersContract.getFlightLowestOffersContract === "function" ? window.WeishanCommerceFlightLowestOffersContract.getFlightLowestOffersContract() : null);
    expect(contract).toEqual(expect.objectContaining({
      contractVersion:"2.0.77",
      phase:"flight_lowest_two_offers_contract",
      providerStatus:"not_configured",
      offersStatus:"unavailable",
      maxDisplayedOffers:2,
      selectionPolicy:"lowest_total_price_first"
    }));
    expect(contract.offers).toEqual([]);
    expect(contract.display).toEqual(expect.objectContaining({
      summaryTitle:"机票搜索条件已整理",
      currentStatusLine:"当前状态：未接入真实机票价格源，暂不能返回实时价格。",
      priceStateLine:"价格状态：暂未接入真实机票价格源，当前不能显示最低价两家。",
      futureLine:"接入真实只读价格源后，weishan 会只展示通过安全检查的最低价前 2 家。最终价格、库存、出票规则和付款以外部平台为准。"
    }));
    const registry = await page.evaluate(() => window.WeishanCommerceFlightProviderCandidates && typeof window.WeishanCommerceFlightProviderCandidates.getFlightProviderCandidatesRegistry === "function" ? window.WeishanCommerceFlightProviderCandidates.getFlightProviderCandidatesRegistry() : null);
    expect(registry).toEqual(expect.objectContaining({
      contractVersion:"2.0.77",
      phase:"flight_provider_candidate_registry",
      registryStatus:"candidate_registry_only",
      candidateCount:7,
      trustStatus:"candidate_only",
      manualReviewStatus:"not_reviewed"
    }));
    expect(registry.domainSafetyRules.allowedDomains).toEqual(expect.arrayContaining([
      "google.com",
      "google.com/travel/flights",
      "trip.com",
      "ctrip.com",
      "skyscanner.com",
      "kayak.com",
      "expedia.com",
      "booking.com"
    ]));
    expect(registry.domainSafetyRules.blockedRules).toEqual(expect.arrayContaining([
      "短链接",
      "非 HTTPS",
      "拼写相似的仿冒域名",
      "AI 生成域名",
      "私聊付款",
      "先转账出票",
      "低价异常",
      "无主体信息",
      "和搜索意图无关",
      "成人 / 赌博 / 武器 / 毒品等高风险域名"
    ]));
    for (const candidate of [
      { providerId:"google_flights", providerName:"Google Flights", officialDomains:["google.com", "google.com/travel/flights"], searchEntryUrl:"https://www.google.com/travel/flights", regionScope:["global"], supportedLanguages:["zh-CN", "en"], supportedCurrencies:["CNY", "USD", "HKD", "SGD"] },
      { providerId:"trip_com_ctrip", providerName:"Trip.com / 携程", officialDomains:["trip.com", "ctrip.com"], searchEntryUrl:"https://www.trip.com/flights/search/", regionScope:["global", "China outbound"], supportedLanguages:["zh-CN", "en"], supportedCurrencies:["CNY", "USD", "HKD", "SGD"] },
      { providerId:"skyscanner", providerName:"Skyscanner", officialDomains:["skyscanner.com"], searchEntryUrl:"https://www.skyscanner.com/flights", regionScope:["global"], supportedLanguages:["zh-CN", "en"], supportedCurrencies:["CNY", "USD", "GBP", "EUR"] },
      { providerId:"kayak", providerName:"Kayak", officialDomains:["kayak.com"], searchEntryUrl:"https://www.kayak.com/flights", regionScope:["global"], supportedLanguages:["en"], supportedCurrencies:["USD", "CNY", "EUR", "GBP"] },
      { providerId:"expedia", providerName:"Expedia", officialDomains:["expedia.com"], searchEntryUrl:"https://www.expedia.com/Flights", regionScope:["global"], supportedLanguages:["en"], supportedCurrencies:["USD", "CNY", "EUR", "GBP"] },
      { providerId:"booking_flights", providerName:"Booking Flights", officialDomains:["booking.com"], searchEntryUrl:"https://www.booking.com/flights", regionScope:["global"], supportedLanguages:["en"], supportedCurrencies:["USD", "CNY", "EUR", "GBP"] },
      { providerId:"airline_official_website", providerName:"航司官网占位", officialDomains:["airline-official-website.placeholder"], searchEntryUrl:"https://www.google.com/search?q=airline+official+website+flight+search", regionScope:["carrier-specific"], supportedLanguages:["varies by carrier"], supportedCurrencies:["varies by carrier"] }
    ]) {
      const profile = registry.candidateProfiles.find((item) => item.providerId === candidate.providerId);
      expect(profile).toEqual(expect.objectContaining({
        providerName: candidate.providerName,
        providerType: "flight_search_candidate",
        searchEntryUrl: candidate.searchEntryUrl,
        apiStatus: "not_connected",
        priceStatus: "not_available",
        bookingUrlStatus: "not_available",
        trustStatus: "candidate_only",
        manualReviewStatus: "not_reviewed",
        riskLevel: candidate.providerId === "airline_official_website" ? "medium" : "low"
      }));
      expect(profile.regionScope).toEqual(candidate.regionScope);
      expect(profile.supportedLanguages).toEqual(candidate.supportedLanguages);
      expect(profile.supportedCurrencies).toEqual(candidate.supportedCurrencies);
      expect(profile.officialDomains).toEqual(candidate.officialDomains);
      expect(profile.capabilities).toEqual(expect.objectContaining({
        canUseApiKey:false,
        canUseNetworkApi:false,
        canReturnPrice:false,
        canReturnBookingUrl:false,
        canOpenBookingUrl:false,
        canCreateOrder:false,
        canPay:false,
        canStoreIdentity:false,
        canStorePassport:false,
        canStoreBankCard:false
      }));
      expect(profile.safety).toEqual(expect.objectContaining({
        noRealEndpoint:true,
        noRealApiKey:true,
        noNetworkSearch:true,
        noRealResults:true,
        noRealPrice:true,
        noFakeDemoMockPrice:true,
        noBookingUrl:true,
        noRedirect:true,
        noCheckout:true,
        noPayment:true,
        noOrderSubmit:true,
        noIdentityStorage:true,
        noPassportStorage:true,
        noBankCardStorage:true
      }));
    }
    expect(contract.capabilities).toEqual(expect.objectContaining({
      canReturnOffers:false,
      canReturnPrice:false,
      canReturnBookingUrl:false,
      canOpenExternalBooking:false,
      canCreateOrder:false,
      canPay:false,
      canStoreIdentity:false
    }));
    expect(contract.safety).toEqual(expect.objectContaining({
      noRealEndpoint:true,
      noRealApiKey:true,
      noNetworkSearch:true,
      noRealResults:true,
      noRealPrice:true,
      noFakeDemoMockPrice:true,
      noBookingUrl:true,
      noRedirect:true,
      noCheckout:true,
      noPayment:true,
      noOrderSubmit:true,
      noIdentityStorage:true,
      noPassportStorage:true,
      noBankCardStorage:true
    }));
    const defaultText = await visibleTextWithoutTechnicalDetails(home);
    for (const hidden of ["商品采购计划", "酒店计划", "电脑搜索条件", "京东模板", "淘宝 / 天猫", "Amazon 模板", "Best Buy 模板", "Booking hotel search template", "Google Flights search template", "未知网站结果", "可疑域名", "约 ", "已找到机票价格", "价格如下"]) {
      expect(defaultText).not.toContain(hidden);
    }
    await expect(summaryPanel).toContainText("查看候选平台");
    const candidateDisclosure = summaryPanel.locator("details.commerce-flight-provider-candidates-disclosure");
    await expect(candidateDisclosure).not.toHaveAttribute("open", "");
    await openDisclosure(summaryPanel, "commerce-flight-provider-candidates-disclosure");
    await expect(summaryPanel).toContainText("候选平台档案与白名单规则");
    await expect(summaryPanel).toContainText("默认优先域名白名单");
    await expect(summaryPanel).toContainText("默认阻断规则");
    for (const text of ["Google Flights", "Trip.com / 携程", "Skyscanner", "Kayak", "Expedia", "Booking Flights", "航司官网占位"]) {
      await expect(summaryPanel).toContainText(text);
    }
    await expect(summaryPanel).toContainText("API 状态：未连接");
    await expect(summaryPanel).toContainText("价格状态：不可用");
    await expect(summaryPanel).toContainText("bookingUrl 状态：不可用");
    await expect(summaryPanel).toContainText("可信状态：仅候选");
    await expect(summaryPanel).toContainText("人工复核：未审查");
    await expect(summaryPanel).toContainText("风险等级：低风险");
    await expect(summaryPanel).toContainText("候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。");
    await expect(summaryPanel.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(summaryPanel.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    await expect(summaryPanel).toContainText("查看 Provider 审批状态");
    const approvalDisclosure = summaryPanel.locator("details.commerce-flight-provider-approval-disclosure");
    await expect(approvalDisclosure).not.toHaveAttribute("open", "");
    await openDisclosure(summaryPanel, "commerce-flight-provider-approval-disclosure");
    await expect(summaryPanel).toContainText("机票 Provider 接入审批");
    await expect(summaryPanel).toContainText("当前状态：候选平台已建档，尚未批准接入只读价格源。");
    await expect(summaryPanel).toContainText("审批状态：未审查");
    await expect(summaryPanel).toContainText("只读价格源：未启用");
    await expect(summaryPanel).toContainText("bookingUrl：未启用");
    await expect(summaryPanel).toContainText("付款 / 下单：不支持");
    await expect(summaryPanel).toContainText("候选平台：Google Flights / Trip.com / 携程 / Skyscanner / Kayak / Expedia");
    await expect(summaryPanel).toContainText("需要 allowlist");
    await expect(summaryPanel).toContainText("禁止未知域名 / 短链接 / 可疑域名");
    await expect(summaryPanel).toContainText("AI 不能生成可疑 provider 域名");
    await expect(summaryPanel).toContainText("人工审核后才允许进入 provider approval");
    await expect(summaryPanel).toContainText("候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。");
    await expect(summaryPanel).toContainText("默认允许域名白名单");
    await expect(summaryPanel).toContainText("默认阻断规则");
    for (const text of ["候选与白名单", "平台审批", "接口与价格", "安全与执行", "平台身份审查：未开始", "Provider 条款审查：未开始", "人工审核：未完成", "最终人工批准：未完成", "API 文档审查：未开始", "API key 存储审查：未开始", "Endpoint 审查：未开始", "价格字段审查：未开始", "bookingUrl 审查：未开始", "当地法律审查：未开始", "税费 / 退改签字段审查：未开始", "Sandbox Dry Run：未开始", "只读价格源：未启用", "bookingUrl：未启用", "付款 / 下单：不支持"]) {
      await expect(summaryPanel).toContainText(text);
    }
    await installClipboardMock(page);
    await installOpenExternalMock(page);
    const historyCountBefore = await page.locator("#cmdHistory [data-history-id]").count();
    await expect.poll(async () => page.evaluate(() => (window.__WEISHAN_TEST_OPEN_EXTERNAL_URLS__ || []).length), { timeout:5000 }).toBe(0);
    await summaryPanel.getByRole("button", { name:"打开全网搜索" }).click();
    await expect.poll(async () => latestOpenExternalUrl(page), { timeout:5000 }).toContain("https://www.google.com/search?");
    await expect.poll(async () => latestOpenExternalUrl(page), { timeout:5000 }).toContain(encodeURIComponent("7月15日 上海 到 成都 最便宜 机票"));
    await summaryPanel.getByRole("button", { name:"打开 Google Flights 搜索" }).click();
    await expect.poll(async () => latestOpenExternalUrl(page), { timeout:5000 }).toContain("https://www.google.com/travel/flights?");
    await expect.poll(async () => latestOpenExternalUrl(page), { timeout:5000 }).toContain("Shanghai");
    await summaryPanel.getByRole("button", { name:"打开 Trip.com / 携程搜索" }).click();
    await expect.poll(async () => latestOpenExternalUrl(page), { timeout:5000 }).toContain("https://www.trip.com/flights/search/");
    await expect.poll(async () => latestOpenExternalUrl(page), { timeout:5000 }).toContain("Chengdu");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    await summaryPanel.getByRole("button", { name:"复制机票搜索条件" }).click();
    for (const text of ["机票搜索条件", "出发地：上海", "目的地：成都", "出发日期：7月15日", "搜索目标：低价优先", "最终价格以真实平台为准"]) {
      await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain(text);
    }
    await summaryPanel.getByRole("button", { name:"复制 Google Flights 模板" }).click();
    for (const text of ["Google Flights search template", "From: Shanghai", "To: Chengdu", "Departure date: July 15", "lowest available fare", "final price must be checked on the real platform"]) {
      await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain(text);
    }
    await summaryPanel.getByRole("button", { name:"复制 Trip.com / 携程模板" }).click();
    for (const text of ["机票搜索模板", "出发地：上海", "目的地：成都", "出发日期：7月15日", "最终价格以真实平台为准"]) {
      await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain(text);
    }
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    await submitHomeCommand(page, runId + "-SIMPLE-FLIGHT-HISTORY 买演唱会门票");
    const historyCountAfterNewTask = await page.locator("#cmdHistory [data-history-id]").count();
    await page.locator('#cmdHistory [data-history-id]', { hasText:"上海到成都" }).first().click();
    const historyDetail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    await expect(historyDetail).toContainText("历史任务详情");
    await expect(historyDetail).toContainText("机票搜索条件已整理");
    await expect(historyDetail).toContainText("出发地：上海");
    await expect(historyDetail).toContainText("目的地：成都");
    await expect(historyDetail).toContainText("出发日期：7月15日");
    await expect(historyDetail).toContainText("当前不能返回实时价格");
    await expect(historyDetail).toContainText("当前状态：未接入真实机票价格源，暂不能返回实时价格。");
    await expect(historyDetail).toContainText("价格状态：暂未接入真实机票价格源，当前不能显示最低价两家。");
    await expect(historyDetail).not.toContainText("最终价格以真实平台为准");
    await expect(historyDetail).toContainText("打开全网搜索");
    await expect(historyDetail).toContainText("打开 Google Flights 搜索");
    await expect(historyDetail).toContainText("打开 Trip.com / 携程搜索");
    await expect(historyDetail).toContainText("查看候选平台");
    await expect(historyDetail.locator("details.commerce-flight-provider-candidates-disclosure")).not.toHaveAttribute("open", "");
    await openDisclosure(historyDetail, "commerce-flight-provider-candidates-disclosure");
    await expect(historyDetail).toContainText("候选平台档案与白名单规则");
    await expect(historyDetail).toContainText("Google Flights");
    await expect(historyDetail).toContainText("Trip.com / 携程");
    await expect(historyDetail).toContainText("Skyscanner");
    await expect(historyDetail).toContainText("Kayak");
    await expect(historyDetail).toContainText("Expedia");
    await expect(historyDetail).toContainText("Booking Flights");
    await expect(historyDetail).toContainText("航司官网占位");
    await expect(historyDetail).toContainText("查看 Provider 审批状态");
    const historyApprovalDisclosure = historyDetail.locator("details.commerce-flight-provider-approval-disclosure");
    await expect(historyApprovalDisclosure).not.toHaveAttribute("open", "");
    await openDisclosure(historyDetail, "commerce-flight-provider-approval-disclosure");
    await expect(historyDetail).toContainText("机票 Provider 接入审批");
    await expect(historyDetail).toContainText("当前状态：候选平台已建档，尚未批准接入只读价格源。");
    await expect(historyDetail).toContainText("审批状态：未审查");
    await expect(historyDetail).toContainText("只读价格源：未启用");
    await expect(historyDetail).toContainText("bookingUrl：未启用");
    await expect(historyDetail).toContainText("付款 / 下单：不支持");
    await expect(historyDetail).toContainText("候选平台：Google Flights / Trip.com / 携程 / Skyscanner / Kayak / Expedia");
    await expect(historyDetail).toContainText("需要 allowlist");
    await expect(historyDetail).toContainText("禁止未知域名 / 短链接 / 可疑域名");
    await expect(historyDetail).toContainText("AI 不能生成可疑 provider 域名");
    await expect(historyDetail).toContainText("人工审核后才允许进入 provider approval");
    await expect(historyDetail).toContainText("候选平台只作档案，不连接 API，不返回价格，不生成 booking 链接。");
    await expect(historyDetail).toContainText("默认允许域名白名单");
    await expect(historyDetail).toContainText("默认阻断规则");
    const historyOpenCountBefore = await page.evaluate(() => (window.__WEISHAN_TEST_OPEN_EXTERNAL_URLS__ || []).length);
    await historyDetail.getByRole("button", { name:"打开 Google Flights 搜索" }).click();
    await expect.poll(async () => page.evaluate(() => (window.__WEISHAN_TEST_OPEN_EXTERNAL_URLS__ || []).length), { timeout:5000 }).toBe(historyOpenCountBefore + 1);
    await expect.poll(async () => latestOpenExternalUrl(page), { timeout:5000 }).toContain("https://www.google.com/travel/flights?");
    await expect(historyDetail).toContainText("查看技术细节");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountAfterNewTask);
    await disableClipboardMock(page);
  });

  test("v2.0.77 bare flight intent still renders the simple flight result card", async () => {
    await resetCommerceTasks(page);
    await page.reload({ waitUntil:"domcontentloaded" });
    await gotoRoute(page, "home");
    const inputText = runId + "-SIMPLE-FLIGHT-BARE 7月15日上海到成都机票";
    await submitHomeCommand(page, inputText);
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    const summaryPanel = page.locator(".commerce-simple-flight-result");
    await expect(summaryPanel).toHaveCount(1, { timeout:15000 });
    await expect(summaryPanel).toContainText("机票搜索条件已整理");
    await expect(summaryPanel).toContainText("出发地：上海");
    await expect(summaryPanel).toContainText("目的地：成都");
    await expect(summaryPanel).toContainText("出发日期：7月15日");
    await expect(summaryPanel).toContainText("搜索目标：按条件筛选");
    await expect(summaryPanel).toContainText("当前状态：未接入真实机票价格源，暂不能返回实时价格。");
    await expect(summaryPanel).toContainText("当前不能返回实时价格");
    await expect(summaryPanel).toContainText("价格状态：暂未接入真实机票价格源，当前不能显示最低价两家。");
    await expect(summaryPanel).toContainText("查看候选平台");
    await expect(summaryPanel).toContainText("查看 Provider 审批状态");
    await expect(summaryPanel).not.toContainText("最终价格以真实平台为准");
    await expect(summaryPanel).not.toContainText(/¥\s*\d+/);
    const defaultText = await visibleTextWithoutTechnicalDetails(home);
    for (const hidden of ["商品采购计划", "酒店计划", "电脑搜索条件", "京东模板", "淘宝 / 天猫", "Amazon 模板", "Best Buy 模板"]) {
      expect(defaultText).not.toContain(hidden);
    }
  });

  test("v2.0.77 sidebar version stays in sync with release version", async () => {
    await gotoRoute(page, "home");
    const sidebarFoot = page.locator(".sidebar-foot");
    await expect(sidebarFoot).toContainText("weishan v2.0.77");
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
    await expect(home).toContainText("查看技术细节");
    await openTechnicalDetails(home);
    for (const text of ["provider", "API key", "endpoint", "Connector Gate", "Sandbox Dry Run", "Provider Approval", "Provider Onboarding", "Secret Storage", "Stub", "dispatch", "gate", "AI fallback"]) {
      await expect(home).toContainText(text);
    }

    await submitHomeCommand(page, runId + "-TECH-HIDE-HISTORY 买演唱会门票");
    const historyItem = page.locator('#cmdHistory [data-history-id]', { hasText:"下个月带孩子去东京" }).first();
    await historyItem.click();
    const detail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    const detailText = await visibleTextWithoutTechnicalDetails(detail);
    for (const text of ["provider", "API key", "endpoint", "Connector Gate", "Sandbox Dry Run", "AI fallback"]) {
      expect(detailText).not.toContain(text);
    }
    await expect(detail).toContainText("历史任务详情");
    await expect(detail).toContainText("最终结果");
    await expect(detail).toContainText("查看可执行清单");
    await expect(detail).toContainText("查看平台模板");
    await expect(detail.getByRole("button", { name:"复制全部搜索条件" })).toHaveCount(1);
    await expect(detail).toContainText("查看技术细节");
    await openTechnicalDetails(detail);
    for (const text of ["provider", "API key", "endpoint", "Connector Gate", "Sandbox Dry Run", "Provider Approval", "Provider Onboarding", "Secret Storage", "Stub", "dispatch", "gate", "AI fallback"]) {
      await expect(detail).toContainText(text);
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
    const homeProcess = home.locator("details.commerce-process-disclosure");
    const homeSafety = home.locator("details.commerce-safety-disclosure");
    await expect(home).toContainText("查看分析过程");
    await expect(home).toContainText("查看安全边界");
    await expect(homeProcess).toHaveCount(1);
    await expect(homeSafety).toHaveCount(1);
    await expect(homeProcess).not.toHaveAttribute("open", "");
    await expect(homeSafety).not.toHaveAttribute("open", "");
    await homeProcess.locator("summary").click();
    await homeSafety.locator("summary").click();
    await expect(homeProcess).toHaveAttribute("open", "");
    await expect(homeSafety).toHaveAttribute("open", "");
    await page.locator("#commerceViewPlanBtn").click();
    const detail = page.locator(".commerce-detail").first();
    await expect(detail.locator("details.commerce-process-disclosure")).toHaveCount(1);
    await expect(detail.locator("details.commerce-safety-disclosure")).toHaveCount(1);
    await expect(detail.locator("details.commerce-process-disclosure")).not.toHaveAttribute("open", "");
    await expect(detail.locator("details.commerce-safety-disclosure")).not.toHaveAttribute("open", "");
  });

  test("task history detail restores subplan draft review summary without rerun", async () => {
    await page.goto("file:///Users/boge/Downloads/weishan-clean-release/apps/desktop/src/index.html");
    await page.waitForLoadState("domcontentloaded");
    await gotoRoute(page, "home");
    const demand = runId + "-DRAFT-REVIEW-HISTORY 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。";
    const answer = runId + "-DRAFT-REVIEW-HISTORY 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。";
    await submitHomeCommand(page, demand);
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, answer);
    await submitHomeCommand(page, runId + "-DRAFT-REVIEW-HISTORY 买演唱会门票");
    const historyItems = page.locator("#cmdHistory [data-history-id]");
    await expect(historyItems.filter({ hasText:answer }).first()).toBeVisible();
    const historyCountBefore = await historyItems.count();
    await historyItems.filter({ hasText:answer }).first().click();
    const detail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    await expect(detail).toContainText("历史任务详情");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("最终结果");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("查看可执行清单");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("查看平台模板");
    await expect(detail.locator(".commerce-result-summary-panel").getByRole("button", { name:"复制全部搜索条件" })).toHaveCount(1);
    await openDisclosure(detail.locator(".commerce-result-summary-panel"), "commerce-actionable-checklist-disclosure");
    await expect(detail.locator(".commerce-result-summary-panel").getByRole("button", { name:"复制机票搜索条件" })).toHaveCount(1);
    await expect(detail.locator(".commerce-result-summary-panel").getByRole("button", { name:"复制酒店搜索条件" })).toHaveCount(1);
    await expect(detail.locator(".commerce-result-summary-panel").getByRole("button", { name:"复制电脑搜索条件" }).first()).toBeVisible();
    await expect(detail.locator(".commerce-result-summary-panel").getByRole("button", { name:"复制全部清单" })).toHaveCount(1);
    await expect(detail).toContainText("查看技术细节");
    await expect(detail).toContainText("历史回看不会重新执行任务");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    for (const field of ["draftReviewVersion", "defaultMode=review_completed_subplan_drafts", "reviewItems", "confirmableSummary", "unconfirmedFields", "remainingRisks", "canAccessProvider=false"]) await expect(detail).not.toContainText(field);
    await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(detail.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    await openTechnicalDetails(detail);
    await expect(detail).toContainText("子计划草稿复核摘要");
    await expect(detail).toContainText("旅行计划");
    await expect(detail).toContainText("商品采购计划");
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
    const answer = runId + "-HISTORY-ANSWER 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。";
    await submitHomeCommand(page, demand);
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, answer);

    const historyItems = page.locator("#cmdHistory [data-history-id]");
    const historyCountBefore = await historyItems.count();
    await expect(historyItems.filter({ hasText:answer }).first()).toBeVisible();
    await historyItems.filter({ hasText:answer }).first().click();

    const detail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    await expect(detail).toContainText("历史任务详情");
    await expect(detail).toContainText(answer);
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("最终结果");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("旅行：");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("电脑：");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("查看可执行清单");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("查看平台模板");
    await expect(detail.locator(".commerce-result-summary-panel").getByRole("button", { name:"复制全部搜索条件" })).toHaveCount(1);
    await openDisclosure(detail.locator(".commerce-result-summary-panel"), "commerce-actionable-checklist-disclosure");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("复制机票搜索条件");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("复制酒店搜索条件");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("复制电脑搜索条件");
    await expect(detail.locator(".commerce-result-summary-panel")).toContainText("复制全部清单");
    await expect(detail).toContainText("查看技术细节");
    await expect(detail).toContainText("历史回看不会重新执行任务");
    await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(detail.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    await openTechnicalDetails(detail);
    await expect(detail).toContainText("子计划草稿复核摘要");
    await expect(detail).toContainText("子计划草稿确认与修正");
    await expect(detail).toContainText("子计划补齐工作台");
    await expect(detail).toContainText("旅行计划");
    await expect(detail).toContainText("商品采购计划");
    for (const text of ["出发地：成都", "出行日期：7月12日", "入住日期：7月12日", "离店日期：7月16日", "儿童年龄：8岁", "品牌偏好：都可以", "性能要求：32G内存 / 1T硬盘", "收货地：成都", "是否接受二手：不接受", "补齐度", "仍缺字段"]) await expect(detail).toContainText(text);
    await expect(detail).toContainText("是否访问真实平台：否");
    await expect(detail).toContainText("是否返回价格：否");
    await expect(detail).toContainText("是否跳转购买：否");

    await page.locator("#historyBackBtn").click();
    await expect(page.locator('#cmdConsole [data-task-history-detail="true"]')).toHaveCount(0);
  });

  test("v2.0.67 task history detail keeps actionable checklist and copy buttons without rerun", async () => {
    await page.goto("file:///Users/boge/Downloads/weishan-clean-release/apps/desktop/src/index.html");
    await page.waitForLoadState("domcontentloaded");
    await gotoRoute(page, "home");
    const demand = runId + "-HISTORY-COPY 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。";
    const answer = runId + "-HISTORY-COPY 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。";
    await submitHomeCommand(page, demand);
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, answer);
    await submitHomeCommand(page, runId + "-HISTORY-COPY 买演唱会门票");

    const historyItems = page.locator("#cmdHistory [data-history-id]");
    await expect(historyItems.filter({ hasText:answer }).first()).toBeVisible();
    const historyCountBefore = await historyItems.count();

    await installClipboardMock(page);
    await historyItems.filter({ hasText:answer }).first().click();

    const detail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    const summaryPanel = detail.locator(".commerce-result-summary-panel");
    await expect(detail).toContainText("历史任务详情");
    await expect(summaryPanel).toContainText("最终结果");
    await expect(summaryPanel).toContainText("查看可执行清单");
    await expect(summaryPanel).toContainText("查看平台模板");
    await expect(summaryPanel).toContainText("旅行：");
    await expect(summaryPanel).toContainText("电脑：");
    await openDisclosure(summaryPanel, "commerce-actionable-checklist-disclosure");
    await expect(summaryPanel).toContainText("复制机票搜索条件");
    await expect(summaryPanel).toContainText("复制酒店搜索条件");
    await expect(summaryPanel).toContainText("复制电脑搜索条件");
    await expect(summaryPanel).toContainText("复制全部清单");
    await expect(detail.locator("details.commerce-process-disclosure")).not.toHaveAttribute("open", "");
    await expect(detail.locator("details.commerce-safety-disclosure")).not.toHaveAttribute("open", "");
    await expect(summaryPanel.getByRole("button", { name:"复制全部搜索条件" })).toHaveCount(1);
    await summaryPanel.locator('[data-commerce-copy-kind="flight"]').first().click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("出发地：成都");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("目的地：东京");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("最终价格以真实平台为准");
    await summaryPanel.locator('[data-commerce-copy-kind="hotel"]').first().click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("入住日期：7月12日");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("离店日期：7月16日");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("最终价格以真实平台为准");
    await summaryPanel.locator('[data-commerce-copy-kind="computer"]').last().click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("用途：剪视频");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("内存：32G");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("硬盘：1T");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("是否接受二手：不接受");
    await summaryPanel.locator('[data-commerce-copy-kind="full"]').last().click();
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("机票搜索条件");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("酒店搜索条件");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("电脑搜索条件");
    await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain("当前不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。");
    await expect(summaryPanel.locator("[data-commerce-copy-feedback]").first()).toContainText("已复制，可粘贴到外部平台搜索");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
    await disableClipboardMock(page);
    await page.locator("#historyBackBtn").click();
    await expect(page.locator('#cmdConsole [data-task-history-detail="true"]')).toHaveCount(0);
  });

  test("v2.0.68 task history detail keeps platform search template pack and copy buttons without rerun", async () => {
    await page.goto("file:///Users/boge/Downloads/weishan-clean-release/apps/desktop/src/index.html");
    await page.waitForLoadState("domcontentloaded");
    await gotoRoute(page, "home");
    const demand = runId + "-PLATFORM-TEMPLATE-HISTORY 下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。";
    const answer = runId + "-PLATFORM-TEMPLATE-HISTORY 我从成都出发，7月12日出发，7月12日入住，7月16日离店，孩子8岁。电脑品牌都可以，最好32G内存、1T硬盘，收货地成都，不接受二手。";
    await submitHomeCommand(page, demand);
    await waitForLatestHomeTexts(page, ["旅行计划", "商品采购计划"]);
    await submitHomeCommand(page, answer);
    await submitHomeCommand(page, runId + "-PLATFORM-TEMPLATE-HISTORY 买演唱会门票");
    const historyItems = page.locator("#cmdHistory [data-history-id]");
    await expect(historyItems.filter({ hasText:answer }).first()).toBeVisible();
    const historyCountBefore = await historyItems.count();
    await installClipboardMock(page);
    await historyItems.filter({ hasText:answer }).first().click();
    const detail = page.locator('#cmdConsole [data-task-history-detail="true"]').first();
    const summaryPanel = detail.locator(".commerce-result-summary-panel");
    await expect(detail).toContainText("历史任务详情");
    await expect(summaryPanel).toContainText("最终结果");
    await expect(summaryPanel).toContainText("查看可执行清单");
    await expect(summaryPanel).toContainText("查看平台模板");
    await openDisclosure(summaryPanel, "commerce-platform-template-disclosure");
    for (const text of ["复制 Google Flights 模板", "复制 Trip.com / 携程模板", "复制 Booking 模板", "复制 Agoda 模板", "复制京东模板", "复制淘宝 / 天猫模板", "复制 Amazon 模板", "复制 Best Buy 模板", "复制全部平台模板"]){
      await expect(summaryPanel).toContainText(text);
    }
    await expect(summaryPanel.locator(".commerce-platform-template-copy-btn")).toHaveCount(9);
    await expect(detail.locator("details.commerce-process-disclosure")).not.toHaveAttribute("open", "");
    await expect(detail.locator("details.commerce-safety-disclosure")).not.toHaveAttribute("open", "");
    await summaryPanel.getByRole("button", { name:"复制全部平台模板" }).click();
    for (const text of ["Google Flights search template", "Trip.com / 携程模板", "Booking hotel search template", "Agoda hotel search template", "京东电脑搜索模板", "淘宝 / 天猫电脑搜索模板", "Amazon laptop search template", "Best Buy laptop search template", "当前不会访问真实平台", "当前不会付款或下单"]){
      await expect.poll(async () => page.evaluate(() => window.__WEISHAN_TEST_CLIPBOARD_TEXT__ || ""), { timeout:5000 }).toContain(text);
    }
    await expect(summaryPanel.locator("[data-commerce-platform-template-feedback]").first()).toContainText("已复制，可粘贴到外部平台搜索");
    await expect(page.locator("#cmdHistory [data-history-id]")).toHaveCount(historyCountBefore);
    await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(detail.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    await disableClipboardMock(page);
    await page.locator("#historyBackBtn").click();
    await expect(page.locator('#cmdConsole [data-task-history-detail="true"]')).toHaveCount(0);
  });

  test("complex intent split panel separates travel product ticket and service without raw fields", async () => {
    const cases = [
      {
        input:"下个月带孩子去东京，帮我比较机票和酒店，预算一万以内，尽量性价比高。我想买一台适合剪视频的电脑，预算一万以内，帮我比较性价比。",
        expected:["拆分状态：已拆分", "拆分原因：多类别复合需求", "子计划数量：2", "子计划：旅行计划", "类别：复合旅行计划", "组件：机票 + 酒店", "目的地：东京", "时间条件：下个月", "人员条件：带孩子", "预算条件：一万以内", "优化目标：性价比高", "子计划：商品采购计划", "类别：商品", "商品需求：适合剪视频的电脑", "用途条件：剪视频", "优化目标：性价比"]
      },
      {
        input:"下个月去东京，帮我看机票酒店和演唱会门票。",
        expected:["拆分状态：已拆分", "拆分原因：多类别复合需求", "子计划数量：2", "子计划：旅行计划", "组件：机票 + 酒店", "目的地：东京", "时间条件：下个月", "子计划：门票计划", "票务需求：演唱会门票"]
      },
      {
        input:"帮我买一个手机，再预约附近理发。",
        expected:["拆分状态：已拆分", "拆分原因：多类别复合需求", "子计划数量：2", "子计划：商品采购计划", "商品需求：手机", "子计划：本地服务计划", "服务需求：理发"]
      }
    ];
    const rawFields = [
      "splitPlannerVersion",
      "splitMode=split_complex_commerce_intent",
      "shouldSplit=true",
      "splitReason=multiple_major_categories",
      "subPlanId=travel-1",
      "canAccessProvider=false",
      "canUseNetwork=false",
      "canReturnRealResults=false",
      "canReturnRealPrice=false",
      "canRedirect=false"
    ];
    for (const item of cases) {
      await submitHomeCommand(page, runId + "-SPLIT " + item.input);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      await expect(home).not.toContainText("当地法律合规审查");
      await expect(home).not.toContainText("Provider 接入准备总览");
      await expect(home).not.toContainText("Provider 接入人工审批手册");
      await expect(home).not.toContainText("Connector Gate");
      await expect(home).not.toContainText("Provider Sandbox Dry Run");
      await expect(home).not.toContainText("Provider 密钥安全方案");
      await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
      await expect(home.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
      for (const field of rawFields) await expect(home).not.toContainText(field);
      await openDisclosure(home, "commerce-process-disclosure");
      const panel = home.locator(".commerce-complex-split-panel").first();
      await expect(panel).toContainText("复杂意图拆分计划");
      await expect(panel).toContainText("复合需求会先拆成多个独立子计划，每个子计划分别走安全 gate。当前不会访问任何真实 provider。");
      for (const text of item.expected) await expect(panel).toContainText(text);
      await expect(panel).toContainText("是否访问真实平台：否");
      await expect(panel).toContainText("是否返回价格：否");
      await expect(panel).toContainText("是否跳转购买：否");
      await expect(panel).toContainText("该拆分只生成计划，不访问真实 provider，不读取 API key，不连接 endpoint，不发起网络请求，不返回商品、价格或跳转链接。");
      await page.locator("#commerceViewPlanBtn").click();
      const detail = page.locator(".commerce-detail").first();
      await openDisclosure(detail, "commerce-process-disclosure");
      const detailPanel = detail.locator(".commerce-complex-split-panel").first();
      await expect(detailPanel).toContainText("复杂意图拆分计划");
      for (const text of item.expected) await expect(detailPanel).toContainText(text);
      await expect(detailPanel).toContainText("是否访问真实平台：否");
      await expect(detailPanel).toContainText("是否返回价格：否");
      await expect(detailPanel).toContainText("是否跳转购买：否");
      await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
      for (const field of rawFields) await expect(detail).not.toContainText(field);
      await gotoRoute(page, "home");
    }
  });

  test("simple commerce intent remains a single split plan without unlocking providers", async () => {
    const cases = ["买华为手机", "订酒店", "订机票", "买演唱会门票", "预约理发"];
    for (const input of cases) {
      await submitHomeCommand(page, runId + "-NO-SPLIT " + input);
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
      await page.locator("#commerceViewPlanBtn").click();
      const detail = page.locator(".commerce-detail").first();
      await openDisclosure(detail, "commerce-process-disclosure");
      await expect(detail.locator(".commerce-complex-split-panel").first()).toContainText("拆分状态：无需拆分");
      await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
      await gotoRoute(page, "home");
    }
  });

  test("provider stub profile panel explains ebay is only a product candidate", async () => {
    await submitHomeCommand(page, runId + "-STUB-PROFILE 买华为手机");
    const home = page.locator('[data-commerce-home-summary="true"]').last();
    await openTechnicalDetails(home);
    await expect(home).toContainText("Provider Stub Profile");
    await expect(home).toContainText("eBay Browse API 目前只是商品搜索候选 provider 档案，尚未接入真实平台。");
    await expect(home).toContainText("Provider：eBay Browse API");
    await expect(home).toContainText("类别：商品电商平台");
    await expect(home).toContainText("档案状态：仅建档，尚未接入");
    await expect(home).toContainText("Connector 模式：只读");
    await expect(home).toContainText("用途：商品搜索候选");
    await expect(home).toContainText("当前连接：未接入");
    await expect(home).toContainText("API key：未配置");
    await expect(home).toContainText("网络搜索：未启用");
    await expect(home).toContainText("真实价格：不可用");
    await expect(home).toContainText("测试价格：不可用");
    await expect(home).toContainText("精确跳转：未启用");
    await expect(home).toContainText("支付 / 下单：不支持");
    await expect(home).toContainText("证件 / 银行卡：不保存");
    await expect(home).toContainText("eBay Browse API 只是商品搜索候选 provider 之一");
    await expect(home).toContainText("当前不会访问 eBay，不会返回 eBay 商品或价格，不会跳转 eBay 页面");
    await expect(home).toContainText("真实接入前仍必须通过当地法律合规、Provider Onboarding、Provider Approval、只读 Connector Stub、sandbox dry run 和 connector gate");
    await expect(home).not.toContainText("profile_only_not_connected");
    await expect(home).not.toContainText("provider_stub_profile_only");
    await expect(home).not.toContainText("endpointConnected=false");
    await expect(home).not.toContainText("apiKeyConfigured=false");
    await expect(home).not.toContainText("networkAllowed=false");
    await expect(home).not.toContainText("canSearchNow=false");
    await expect(home).not.toContainText("canReturnRealPrice=false");
    await expect(home).not.toContainText("canReturnMockPrice=false");
    await expect(home).not.toContainText("canRedirectNow=false");
    await expect(home).not.toContainText("noRealEndpoint=true");
    await expect(home).not.toContainText("noApiKey=true");
    await expect(home).not.toContainText("noNetworkSearch=true");
    await expect(home).not.toContainText("已接入 eBay");
    await expect(home).not.toContainText("正在搜索 eBay");
    await expect(home).not.toContainText("eBay 当前最低价");
    await expect(home).not.toContainText("eBay 全网最低价");
    await expect(home).not.toContainText("eBay 保证最低价");
    await expect(home).not.toContainText("eBay 已可购买");
    await expect(home).not.toContainText("eBay 付款");
    await expect(home).not.toContainText("eBay 下单");
    await expect(home).not.toContainText("eBay API key 已配置");
    await expect(home).not.toContainText("eBay endpoint 已连接");
    await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(page.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);

    await page.locator("#commerceViewPlanBtn").click();
    const detail = page.locator(".commerce-detail").first();
    await openTechnicalDetails(detail);
    await expect(detail).toContainText("Provider Stub Profile");
    await expect(detail).toContainText("Provider：eBay Browse API");
    await expect(detail).toContainText("档案状态：仅建档，尚未接入");
    await expect(detail).toContainText("当前不会访问 eBay，不会返回 eBay 商品或价格，不会跳转 eBay 页面");
    await expect(detail).not.toContainText("profile_only_not_connected");
    await expect(detail).not.toContainText("provider_stub_profile_only");
    await expect(detail).not.toContainText("endpointConnected=false");
    await expect(detail).not.toContainText("apiKeyConfigured=false");
    await expect(detail).not.toContainText("networkAllowed=false");
    await expect(detail).not.toContainText("canSearchNow=false");
    await expect(detail).not.toContainText("canReturnRealPrice=false");
    await expect(detail).not.toContainText("canReturnMockPrice=false");
    await expect(detail).not.toContainText("canRedirectNow=false");
    await expect(detail).not.toContainText("noRealEndpoint=true");
    await expect(detail).not.toContainText("noApiKey=true");
    await expect(detail).not.toContainText("noNetworkSearch=true");
    await expect(detail).not.toContainText("已接入 eBay");
    await expect(detail).not.toContainText("正在搜索 eBay");
    await expect(detail).not.toContainText("eBay 当前最低价");
    await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
  });

  test("provider stub profile does not make hotel flight or ticket flows ebay-only", async () => {
    const inputs = [
      { text:"买华为手机", expectsEbay:true },
      { text:"订酒店", expectsEbay:false },
      { text:"订机票", expectsEbay:false },
      { text:"买演唱会门票", expectsEbay:false }
    ];
    for (const item of inputs) {
      await submitHomeCommand(page, runId + "-STUB-MULTI " + item.text);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      await openTechnicalDetails(home);
      await expect(home).toContainText("当地法律合规审查");
      await expect(home).toContainText("只读 Connector Stub");
      await expect(home).toContainText("Provider 审批流程");
      await expect(home).toContainText("Provider 接入审查面板");
      if (item.expectsEbay) {
        await expect(home).toContainText("Provider Stub Profile");
        await expect(home).toContainText("eBay Browse API 只是商品搜索候选 provider 之一");
      } else {
        await expect(home.locator(".commerce-provider-stub-profile-panel")).toHaveCount(0);
        await expect(home).not.toContainText("eBay Browse API 只是商品搜索候选 provider 之一");
      }
      await expect(home).not.toContainText("已接入 eBay");
      await expect(home).not.toContainText("正在搜索 eBay");
      await expect(home).not.toContainText("eBay 当前最低价");
      await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
      await expect(page.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
      await page.locator("#commerceViewPlanBtn").click();
      const detail = page.locator(".commerce-detail").first();
      await openTechnicalDetails(detail);
      if (item.expectsEbay) {
        await expect(detail).toContainText("全球多源 provider 候选池：准备中，尚未接入");
        await expect(detail).toContainText("Provider Stub Profile");
        await expect(detail).toContainText("eBay Browse API 只是商品搜索候选 provider 之一");
      } else {
        await expect(detail.locator(".commerce-provider-stub-profile-panel")).toHaveCount(0);
        await expect(detail).not.toContainText("eBay Browse API 只是商品搜索候选 provider 之一");
      }
      await expect(detail).not.toContainText("已接入 eBay");
      await expect(detail).not.toContainText("正在搜索 eBay");
      await expect(detail).not.toContainText("eBay 当前最低价");
      await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
      await gotoRoute(page, "home");
    }
  });

  test("provider approval workflow panel explains approval stages without raw fields", async () => {
    await submitHomeCommand(page, runId + " 买华为手机");
    const home = page.locator("[data-commerce-home-summary]");
    await openTechnicalDetails(home);
    await expect(home).toContainText("Provider 审批流程");
    await expect(home).toContainText("真实 provider 接入前必须完成分级审批。当前不会连接任何真实 provider。");
    await expect(home).toContainText("审批状态：未审查");
    await expect(home).toContainText("当前阶段：尚未进入审查流程");
    await expect(home).toContainText("Connector stub：暂不可开发");
    await expect(home).toContainText("API key：不可配置");
    await expect(home).toContainText("Endpoint：不可连接");
    await expect(home).toContainText("网络搜索：未启用");
    await expect(home).toContainText("实时价格：不可用");
    await expect(home).toContainText("精确跳转：未启用");
    await expect(home).toContainText("法律条款审查：未开始");
    await expect(home).toContainText("API 文档审查：未开始");
    await expect(home).toContainText("隐私政策审查：未开始");
    await expect(home).toContainText("价格 / 税费 / 运费字段审查：未开始");
    await expect(home).toContainText("安全审查：未开始");
    await expect(home).toContainText("当地法律合规审查：未开始");
    await expect(home).toContainText("人工批准：未完成");
    await expect(home).toContainText("只读 connector stub 开发许可：未授予");
    await expect(home).toContainText("只读 connector stub 只允许开发准备，不连接真实平台");
    await expect(home).toContainText("即使批准开发 stub，仍不会显示价格或跳转购买页面");
    await expect(home).toContainText("只读 Connector Stub");
    await expect(home).toContainText("真实 provider 接入前，weishan 只能准备只读 connector stub。当前不会连接任何真实平台。");
    await expect(home).toContainText("Stub 状态：未准备");
    await expect(home).toContainText("Connector 模式：只读");
    await expect(home).toContainText("Stub 开发许可：未授予");
    await expect(home).toContainText("Stub 执行：未启用");
    await expect(home).toContainText("API key：不可配置");
    await expect(home).toContainText("Endpoint：不可连接");
    await expect(home).toContainText("网络搜索：未启用");
    await expect(home).toContainText("真实价格：不可用");
    await expect(home).toContainText("测试价格：不可用");
    await expect(home).toContainText("精确跳转：未启用");
    await expect(home).toContainText("支付 / 下单：不支持");
    await expect(home).toContainText("证件 / 银行卡：不保存");
    await expect(home).toContainText("approved_for_stub 后，才允许开发只读 connector stub");
    await expect(home).toContainText("即使允许开发 stub，也不会连接真实平台");
    await expect(home).toContainText("不会配置真实 API key");
    await expect(home).toContainText("不会启用网络搜索");
    await expect(home).toContainText("不会显示价格");
    await expect(home).toContainText("不会跳转购买或预订页面");
    await expect(home.locator(".commerce-readonly-stub-panel").last()).toContainText("只读 Connector Stub");
    await expectPanelBefore(home.locator(".commerce-onboarding-review-panel").last(), home.locator(".commerce-readonly-stub-panel").last());
    await expect(home).not.toContainText("provider_approval_required");
    await expect(home).not.toContainText("provider_approval_required_before_stub");
    await expect(home).not.toContainText("stubStatus=stub_not_ready");
    await expect(home).not.toContainText("canBuildStub=false");
    await expect(home).not.toContainText("canExecuteStub=false");
    await expect(home).not.toContainText("canUseNetwork=false");
    await expect(home).not.toContainText("canReturnRealPrice=false");
    await expect(home).not.toContainText("canReturnMockPrice=false");
    await expect(home).not.toContainText("noFakeDemoMockPrice=true");
    await expect(home).not.toContainText("noRealEndpoint=true");
    await expect(home).not.toContainText("noApiKey=true");
    await expect(home).not.toContainText("approvalStatus=not_reviewed");
    await expect(home).not.toContainText("allowConnectorStubDevelopment=false");
    await expect(home).not.toContainText("allowApiKeyConfiguration=false");
    await expect(home).not.toContainText("allowEndpointConnection=false");
    await expect(home).not.toContainText("allowNetworkSearch=false");
    await expect(home).not.toContainText("allowPriceDisplay=false");
    await expect(home).not.toContainText("legalReviewRequired=true");
    await expect(home).not.toContainText("apiDocsReviewRequired=true");
    await expect(home).not.toContainText("humanApprovalRequired=true");
    await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    await expect(page.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);

    await page.locator("#commerceViewPlanBtn").click();
    const detail = page.locator(".commerce-detail");
    await openTechnicalDetails(detail);
    await expect(detail).toContainText("Provider 审批流程");
    await expect(detail).toContainText("只读 Connector Stub");
    await expect(detail).toContainText("Stub 状态：未准备");
    await expect(detail).toContainText("Connector 模式：只读");
    await expect(detail).toContainText("Stub 开发许可：未授予");
    await expect(detail).toContainText("Stub 执行：未启用");
    await expect(detail).toContainText("真实价格：不可用");
    await expect(detail).toContainText("测试价格：不可用");
    await expect(detail).toContainText("即使允许开发 stub，也不会连接真实平台");
    await expect(detail).toContainText("只有 provider 完成分级审批，并且本地法律合规、onboarding checklist、config / adapter / sandbox / connector gate 均通过后");
    await expect(detail).toContainText("当前不会连接真实平台，不会返回价格，不会跳转购买或预订页面");
    await expect(detail.locator(".commerce-readonly-stub-panel").last()).toContainText("只读 Connector Stub");
    await expectPanelBefore(detail.locator(".commerce-readonly-stub-panel").last(), detail.locator(".commerce-onboarding-review-panel").last());
    await expect(detail).not.toContainText("provider_approval_required");
    await expect(detail).not.toContainText("provider_approval_required_before_stub");
    await expect(detail).not.toContainText("stubStatus=stub_not_ready");
    await expect(detail).not.toContainText("canBuildStub=false");
    await expect(detail).not.toContainText("canExecuteStub=false");
    await expect(detail).not.toContainText("canUseNetwork=false");
    await expect(detail).not.toContainText("canReturnRealPrice=false");
    await expect(detail).not.toContainText("canReturnMockPrice=false");
    await expect(detail).not.toContainText("noFakeDemoMockPrice=true");
    await expect(detail).not.toContainText("noRealEndpoint=true");
    await expect(detail).not.toContainText("noApiKey=true");
    await expect(detail).not.toContainText("approvalStatus=not_reviewed");
    await expect(detail).not.toContainText("allowConnectorStubDevelopment=false");
    await expect(detail).not.toContainText("allowApiKeyConfiguration=false");
    await expect(detail).not.toContainText("allowEndpointConnection=false");
    await expect(detail).not.toContainText("allowNetworkSearch=false");
    await expect(detail).not.toContainText("allowPriceDisplay=false");
    await expect(detail).not.toContainText("legalReviewRequired=true");
    await expect(detail).not.toContainText("apiDocsReviewRequired=true");
    await expect(detail).not.toContainText("humanApprovalRequired=true");
    await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
  });

  test("provider approval workflow appears for product hotel flight and ticket plans", async () => {
    const inputs = ["买华为手机", "订酒店", "订机票", "买演唱会门票"];
    for (const text of inputs) {
      await submitHomeCommand(page, runId + "-APPROVAL-MULTI " + text);
      const home = page.locator("[data-commerce-home-summary]");
      await openTechnicalDetails(home);
      await expect(home).toContainText("Provider 审批流程");
      await expect(home).toContainText("审批状态：未审查");
      await expect(home).toContainText("Connector stub：暂不可开发");
      await expect(home).toContainText("API key：不可配置");
      await expect(home).toContainText("Endpoint：不可连接");
      await expect(home).toContainText("网络搜索：未启用");
      await expect(home).toContainText("实时价格：不可用");
      await expect(home).toContainText("精确跳转：未启用");
      await expect(home).toContainText("只读 Connector Stub");
      await expect(home).toContainText("Stub 状态：未准备");
      await expect(home).toContainText("Connector 模式：只读");
      await expect(home).toContainText("Stub 开发许可：未授予");
      await expect(home).toContainText("Stub 执行：未启用");
      await expect(home).toContainText("测试价格：不可用");
      await expect(home.locator(".commerce-readonly-stub-panel").last()).toContainText("只读 Connector Stub");
      await expectPanelBefore(home.locator(".commerce-onboarding-review-panel").last(), home.locator(".commerce-readonly-stub-panel").last());
      await expect(home).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
      await expect(page.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
      await page.locator("#commerceViewPlanBtn").click();
      const detail = page.locator(".commerce-detail");
      await openTechnicalDetails(detail);
      await expect(detail).toContainText("Provider 审批流程");
      await expect(detail).toContainText("审批状态：未审查");
      await expect(detail).toContainText("只读 Connector Stub");
      await expect(detail).toContainText("Stub 状态：未准备");
      await expect(detail).toContainText("Connector 模式：只读");
      await expect(detail).toContainText("Stub 开发许可：未授予");
      await expect(detail).toContainText("Stub 执行：未启用");
      await expect(detail).toContainText("真实价格：不可用");
      await expect(detail).toContainText("测试价格：不可用");
      await expect(detail).toContainText("只读 connector stub 只允许开发准备，不连接真实平台");
      await expect(detail).toContainText("即使批准开发 stub，仍不会显示价格或跳转购买页面");
      await expect(detail.locator(".commerce-readonly-stub-panel").last()).toContainText("只读 Connector Stub");
      await expectPanelBefore(detail.locator(".commerce-readonly-stub-panel").last(), detail.locator(".commerce-onboarding-review-panel").last());
      await expect(detail).not.toContainText("provider_approval_required");
      await expect(detail).not.toContainText("provider_approval_required_before_stub");
      await expect(detail).not.toContainText("stubStatus=stub_not_ready");
      await expect(detail).not.toContainText("canBuildStub=false");
      await expect(detail).not.toContainText("canExecuteStub=false");
      await expect(detail).not.toContainText("canUseNetwork=false");
      await expect(detail).not.toContainText("canReturnRealPrice=false");
      await expect(detail).not.toContainText("canReturnMockPrice=false");
      await expect(detail).not.toContainText("noFakeDemoMockPrice=true");
      await expect(detail).not.toContainText("noRealEndpoint=true");
      await expect(detail).not.toContainText("noApiKey=true");
      await expect(detail).not.toContainText("approvalStatus=not_reviewed");
      await expect(detail).not.toContainText("allowConnectorStubDevelopment=false");
      await expect(detail).not.toContainText("allowApiKeyConfiguration=false");
      await expect(detail).not.toContainText("allowEndpointConnection=false");
      await expect(detail).not.toContainText("allowNetworkSearch=false");
      await expect(detail).not.toContainText("allowPriceDisplay=false");
      await expect(detail).not.toContainText("legalReviewRequired=true");
      await expect(detail).not.toContainText("apiDocsReviewRequired=true");
      await expect(detail).not.toContainText("humanApprovalRequired=true");
      await expect(detail.locator(".commerce-booking-link")).toHaveCount(0);
      await gotoRoute(page, "home");
    }
  });

  test("provider onboarding review panel explains required checks without raw fields", async () => {
    await submitHomeCommand(page, runId + " 买华为手机");
    await page.locator("#commerceViewPlanBtn").click();
    const detail = page.locator(".commerce-detail");
    await openTechnicalDetails(detail);
    await expect(detail).toContainText("Provider 接入审查面板");
    await expect(detail).toContainText("真实 provider 接入前必须完成以下审查。当前尚未接入任何真实 provider。");
    await expect(detail).toContainText("总体状态：未完成，暂不可接入真实 provider");
    await expect(detail).toContainText("合规与条款");
    await expect(detail).toContainText("API 与接口");
    await expect(detail).toContainText("价格与费用字段");
    await expect(detail).toContainText("安全边界");
    await expect(detail).toContainText("当前阻断状态");
    await expect(detail).toContainText("法律条款审查");
    await expect(detail).toContainText("API 文档审查");
    await expect(detail).toContainText("调用额度 / 频率限制审查");
    await expect(detail).toContainText("数据字段审查");
    await expect(detail).toContainText("价格字段审查");
    await expect(detail).toContainText("税费 / 关税 / 运费 / 预订费字段审查");
    await expect(detail).toContainText("外部跳转 URL 策略审查");
    await expect(detail).toContainText("隐私政策审查");
    await expect(detail).toContainText("API key 存储方案");
    await expect(detail).toContainText("未审查");
    await expect(detail).toContainText("不代付款确认");
    await expect(detail).toContainText("不自动下单确认");
    await expect(detail).toContainText("不保存证件/银行卡确认");
    await expect(detail).toContainText("合规风险审查");
    await expect(detail).toContainText("no_provider fallback 审查");
    await expect(detail).toContainText("网络搜索");
    await expect(detail).toContainText("未启用");
    await expect(detail).toContainText("实时价格");
    await expect(detail).toContainText("不可用");
    await expect(detail).toContainText("连接方式");
    await expect(detail).toContainText("只读搜索准备中，暂未连接真实平台");
    await expect(detail).toContainText("只有以上审查全部完成，并通过 config / adapter / sandbox / connector gate 后，weishan 才允许进入真实 provider 连接");
    await expect(detail).toContainText("真实接通后的状态应为：Provider 接入审查已完成、接口已接入、网络搜索已启用、实时价格可用、精确跳转已启用");
    await expect(detail).toContainText("不能提前模拟");
    await expect(detail).not.toContainText("legalTermsReviewed=false");
    await expect(detail).not.toContainText("apiDocsReviewed=false");
    await expect(detail).not.toContainText("canConnectEndpoint=false");
    await expect(detail).not.toContainText("canDisplayPrice=false");
    await expect(detail).not.toContainText("noRealEndpoint=true");
    await expect(detail).not.toContainText("noApiKey=true");
    await expect(detail).not.toContainText("provider_onboarding_required");
    await expect(detail).not.toContainText("endpointConnected=false");
    await expect(detail).not.toContainText("canSearchNow=false");
    await expect(detail).not.toContainText("selectedStatus");
    await expect(detail).not.toContainText("去购买");
    await expect(detail).not.toContainText("去预订");
    await expect(detail).not.toContainText("立即支付");
    await expect(detail).not.toContainText("上传身份证");
    await expect(detail).not.toContainText("上传护照");
    await expect(detail).not.toContainText("保存银行卡");
    await expect(page.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    await expect(detail).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
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
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票搜索已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText(/未搜索|未下单|未付款|未提交订单/);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText(/类型：机票/);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("待补充：出行日期");
    await expect(page.locator("#commerceViewPlanBtn")).toBeVisible();
    await expect(page.getByText("机票搜索已生成")).toHaveCount(1);
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
    await expect(page.getByRole("heading", { name:"全球采购" })).toBeVisible();
    await expect(page.locator(".commerce-task-list")).toContainText(runId + " 帮我找成都到上海最便宜机票");
    await expect(page.locator(".commerce-task-list")).toContainText("机票");
    await expect(page.locator(".commerce-task-list")).toContainText("计划中");
    await expect(page.locator(".commerce-task-list")).not.toContainText("realExecution=false");
    await expect(page.locator(".commerce-task-list")).not.toContainText("commerceTask-");
    await page.getByRole("button", { name:"查看计划" }).first().click();
    await expect(page.getByRole("heading", { name:"需求理解" })).toBeVisible();
    await expect(page.getByRole("heading", { name:"搜索范围" })).toBeVisible();
    await expect(page.getByRole("heading", { name:"比较维度" })).toBeVisible();
    await expect(page.getByRole("heading", { name:"决策规则" })).toBeVisible();
    await expect(page.getByRole("heading", { name:"推荐输出格式" })).toBeVisible();
    await expect(page.getByRole("heading", { name:"候选方案字段模板" })).toBeVisible();
    await expect(page.getByRole("heading", { name:"执行边界" })).toBeVisible();
    await expect(page.getByRole("heading", { name:"下一步建议" })).toBeVisible();
    await expect(page.locator(".commerce-detail")).not.toContainText("realExecution=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("taskId");
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
    await page.locator("#commerceViewPlanBtn").click();
    await page.getByRole("button", { name:"搜索模型结果" }).first().click();
    await expect(page.locator(".commerce-detail")).toContainText("OpenRouter");
    await expect(page.locator(".commerce-detail")).toContainText("Model A");
    await expect(page.locator(".commerce-detail")).toContainText("provider/model-a");
    await expect(page.locator(".commerce-detail")).toContainText("输入价格");
    await expect(page.locator(".commerce-detail")).toContainText("输出价格");
    await expect(page.locator(".commerce-detail")).toContainText("USD");
    await expect(page.locator(".commerce-detail")).toContainText("$0.1 / 1M tokens");
    await expect(page.locator(".commerce-detail")).toContainText("$0.4 / 1M tokens");
    await expect(page.locator(".commerce-detail")).toContainText("当前结果中的输入/输出综合成本排序");
    await expect(page.locator(".commerce-detail")).toContainText("价格可能变化");
    await expect(page.locator(".commerce-booking-link").first()).toHaveText("打开模型页");
    await expect(page.locator(".commerce-booking-link").first()).toHaveAttribute("data-url", /https:\/\/openrouter\.ai\/models\//);
    await gotoRoute(page, "home");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("已找到 2 个候选模型");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前较低价格模型 Model B");
  });

  test("OpenRouter provider failure does not show fake prices", async () => {
    await installOpenRouterModelsMock(page, { data:[] }, { fail:true });
    const command = runId + " 帮我比较 OpenRouter 和其他 AI 模型平台价格";
    await submitHomeCommand(page, command);
    await page.locator("#commerceViewPlanBtn").click();
    await page.getByRole("button", { name:"搜索模型结果" }).first().click();
    await expect(page.locator(".commerce-detail")).not.toContainText("¥999");
    await expect(page.locator(".commerce-detail")).not.toContainText("$123");
    await expect(page.locator(".commerce-detail")).not.toContainText("已找到最低价");
  });

  test("flight search requires travel date before showing prices", async () => {
    const command = runId + " 帮我找成都到上海最便宜机票";
    await submitHomeCommand(page, command);
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.getByText("请补充出行日期").first()).toBeVisible();
    await expect(page.getByRole("button", { name:"开始搜索" }).first()).toBeDisabled();
    await expect(page.locator(".commerce-detail")).not.toContainText(/CNY\s*\d+/);
  });

  test("flight booking intent routes to commerce with origin destination and date text", async () => {
    const command = runId + " 帮我预定明天成都到北京机票";
    await submitHomeCommand(page, command);
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
    await expect(currentTaskLogs(page)).not.toContainText("准备调用 AI 网关");
    await expect(currentTaskLogs(page)).not.toContainText("如何手动");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票搜索已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("类型：机票");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("已识别为机票搜索计划");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("成都 → 北京");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("出发地：成都");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("目的地：北京");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("日期：明天");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("明天");
    await openTechnicalDetails(page.locator("[data-commerce-home-summary]"));
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球多源 provider 候选池：准备中，尚未接入");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText(/机票\s*OTA/);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("航司官网");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前不会访问任何真实机票平台");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前不会返回票价");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("未下单、未付款、未提交订单、未保存证件");
    await expect(page.locator("#commerceViewPlanBtn")).toBeVisible();

    await page.locator("#commerceViewPlanBtn").click();
    await page.getByRole("button", { name:"查看计划" }).first().click();
    await openTechnicalDetails(page.locator(".commerce-detail"));
    await expect(page.locator(".commerce-detail")).toContainText("机票");
    await expect(page.locator(".commerce-detail")).toContainText("成都");
    await expect(page.locator(".commerce-detail")).toContainText("北京");
    await expect(page.locator(".commerce-detail")).toContainText("明天");
    await expect(page.locator(".commerce-detail")).toContainText("已识别为机票搜索计划");
    await expect(page.locator(".commerce-detail")).toContainText(/当前比较范围：机票\s*OTA、航司官网、区域旅行平台/);
    await expect(page.locator(".commerce-detail")).toContainText("当前不会访问任何真实机票平台");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会返回票价");
    await expect(page.locator(".commerce-detail")).toContainText("只读搜索准备中");
    await expect(page.locator(".commerce-detail")).toContainText("实时价格");
    await expect(page.locator(".commerce-detail")).toContainText("不可用");
    await expect(page.locator(".commerce-detail")).toContainText("未下单、未付款、未提交订单、未保存证件");
    await expect(page.locator(".commerce-detail")).not.toContainText(/CNY\s*\d+/);
  });

  test("flight lookup phrasing still routes to commerce instead of chat", async () => {
    await submitHomeCommand(page, runId + " 明天成都飞北京");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票搜索已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("类型：机票");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("成都 → 北京");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("明天");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 查一下明天成都到北京的航班");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票搜索已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("类型：机票");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("成都 → 北京");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("明天");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
  });

  test("hotel booking and product buying intents route to commerce before chat", async () => {
    await submitHomeCommand(page, runId + " 帮我预订上海低价酒店");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("酒店计划已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("类型：酒店");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 帮我买一台最便宜的 MacBook");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("MacBook搜索已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("类型：商品");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
  });

  test("product buying intent keeps user keyword and shows no-provider state without price", async () => {
    await submitHomeCommand(page, runId + " 买华为手机");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("华为手机搜索已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("类型：商品");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("商品关键词：华为手机");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("当地法律合规审查");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("合规状态：未确认");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("合规依据：定位服务或收货 / 目的地信息未完成");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("未确认前不显示价格、不跳转购买或预订页面");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("更严格的一方");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("不保存原始 GPS 坐标");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("去购买");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-detail")).not.toContainText("当地法律合规审查");
    await openTechnicalDetails(page.locator(".commerce-detail"));
    await expect(page.locator(".commerce-detail")).toContainText("全球多源 provider 候选池：准备中，尚未接入");
    await expect(page.locator(".commerce-detail")).toContainText("当前比较范围：商品电商平台、品牌官网、商品官网、区域电商平台");
    await expect(page.locator(".commerce-detail")).toContainText("商品搜索试点候选：eBay Browse API 等");
    await expect(page.locator(".commerce-detail")).toContainText("eBay Browse API 是商品搜索试点候选之一，尚未接入");
    await expect(page.locator(".commerce-detail")).toContainText("接口状态：尚未接入");
    await expect(page.locator(".commerce-detail")).toContainText("网络搜索：未启用");
    await expect(page.locator(".commerce-detail")).toContainText("实时价格：不可用");
    await expect(page.locator(".commerce-detail")).toContainText("精确跳转：待真实 provider 接入后启用");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会访问任何真实平台");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会返回价格");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会跳转购买页面");
    await expect(page.locator(".commerce-detail")).not.toContainText("已接入 eBay");
    await expect(page.locator(".commerce-detail")).not.toContainText("正在搜索 eBay");
    await expect(page.locator(".commerce-detail")).not.toContainText("eBay 当前最低价");
    await expect(page.locator(".commerce-detail")).not.toContainText("endpointConnected=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("apiKeyConfigured=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("networkAllowed=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("canSearchNow=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("canReturnPriceNow=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("canRedirectNow=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("selectedStatus");
    await expect(page.locator(".commerce-detail")).not.toContainText("noRealEndpoint=true");
    await expect(page.locator(".commerce-detail")).not.toContainText("noApiKey=true");
    await expect(page.locator(".commerce-detail .commerce-booking-link")).toHaveCount(0);
    await expect(page.getByRole("button", { name:"搜索适配器未配置" })).toBeDisabled();

    await submitHomeCommand(page, runId + " 买华为1手机");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("华为1手机搜索已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("商品关键词：华为1手机");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 买 iPhone");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("iPhone搜索已生成");
    await openTechnicalDetails(page.locator("[data-commerce-home-summary]"));
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球多源 provider 候选池：准备中，尚未接入");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("商品搜索试点候选：eBay Browse API 等");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当地法律合规审查");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("去购买");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 买 MacBook");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("MacBook搜索已生成");
    await openTechnicalDetails(page.locator("[data-commerce-home-summary]"));
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球多源 provider 候选池：准备中，尚未接入");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("网络搜索未启用");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当地法律合规审查");
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
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("华为手机搜索已生成");
    await openTechnicalDetails(page.locator("[data-commerce-home-summary]"));
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球多源 provider 候选池：准备中，尚未接入");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("商品搜索试点候选：eBay Browse API 等");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("需要设置收货目的地");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("去购买");
  });

  test("no-provider UI exposes safe health flags for flight and product", async () => {
    await clearCommerceSearchMock(page);
    await submitHomeCommand(page, runId + " 帮我预定明天成都到北京机票");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票搜索已生成");
    await openTechnicalDetails(page.locator("[data-commerce-home-summary]"));
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球多源 provider 候选池：准备中，尚未接入");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText(/机票\s*OTA/);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("航司官网");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("区域旅行平台");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前不会访问任何真实机票平台");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前不会返回票价");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("未下单、未付款、未提交订单、未保存证件");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("CNY ");
    await expect(page.locator("[data-commerce-home-summary] .commerce-booking-link")).toHaveCount(0);
    await page.locator("#commerceViewPlanBtn").click();
    await openTechnicalDetails(page.locator(".commerce-detail"));
    await expect(page.locator(".commerce-detail")).toContainText("全球多源 provider 候选池：准备中，尚未接入");
    await expect(page.locator(".commerce-detail")).toContainText(/当前比较范围：机票\s*OTA、航司官网、区域旅行平台/);
    await expect(page.locator(".commerce-detail")).toContainText("示例候选类型：Trip.com / Expedia / 航司官网 等");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会访问任何真实机票平台");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会返回票价");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会跳转预订页面");
    await expect(page.locator(".commerce-detail")).toContainText("接口状态");
    await expect(page.locator(".commerce-detail")).toContainText("尚未接入");
    await expect(page.locator(".commerce-detail")).toContainText("Provider 接入审查");
    await expect(page.locator(".commerce-detail")).toContainText("未完成");
    await expect(page.locator(".commerce-detail")).toContainText("接口文档审查");
    await expect(page.locator(".commerce-detail")).toContainText("API key 存储方案");
    await expect(page.locator(".commerce-detail")).toContainText("未审查");
    await expect(page.locator(".commerce-detail")).toContainText("价格/税费/运费字段审查");
    await expect(page.locator(".commerce-detail")).toContainText("隐私与合规审查");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会连接真实 provider");
    await expect(page.locator(".commerce-detail")).toContainText("连接方式");
    await expect(page.locator(".commerce-detail")).toContainText("只读搜索准备中，暂未连接真实平台");
    await expect(page.locator(".commerce-detail")).toContainText("配置状态");
    await expect(page.locator(".commerce-detail")).toContainText(/搜索能力未配置|搜索适配器未配置/);
    await expect(page.locator(".commerce-detail")).toContainText("网络搜索");
    await expect(page.locator(".commerce-detail")).toContainText("未启用");
    await expect(page.locator(".commerce-detail")).toContainText("实时价格");
    await expect(page.locator(".commerce-detail")).toContainText("不可用");
    await expect(page.locator(".commerce-detail")).toContainText("精确跳转");
    await expect(page.locator(".commerce-detail")).toContainText("待真实 provider 接入后启用");
    await expect(page.locator(".commerce-detail")).toContainText("支付/下单");
    await expect(page.locator(".commerce-detail")).toContainText("不支持，由外部平台完成");
    await expect(page.locator(".commerce-detail")).toContainText("证件/银行卡");
    await expect(page.locator(".commerce-detail")).toContainText("不保存");
    await expect(page.locator(".commerce-detail")).toContainText(/搜索准备：未配置|搜索适配器未配置/);
    await expect(page.locator(".commerce-detail")).toContainText("未启用");
    await expect(page.locator(".commerce-detail")).toContainText("Provider Sandbox Dry Run");
    await expect(page.locator(".commerce-detail")).toContainText("Dry Run 状态：未运行");
    await expect(page.locator(".commerce-detail")).toContainText("多国家、多平台、多币种");
    await expect(page.locator(".commerce-detail")).not.toContainText("endpointConnected=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("apiKeyConfigured=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("networkAllowed=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("canSearchNow=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("canReturnPriceNow=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("canRedirectNow=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("selectedStatus");
    await expect(page.locator(".commerce-detail")).not.toContainText("noRealEndpoint=true");
    await expect(page.locator(".commerce-detail")).not.toContainText("noApiKey=true");
    await expect(page.locator(".commerce-detail")).not.toContainText("legalTermsReviewed=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("apiDocsReviewed=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("canConnectEndpoint=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("canDisplayPrice=false");
    await expect(page.locator(".commerce-detail .commerce-booking-link")).toHaveCount(0);

    await submitHomeCommand(page, runId + " 买华为手机");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("华为手机搜索已生成");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("当地法律合规审查");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("合规状态：未确认");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("合规依据：定位服务或收货 / 目的地信息未完成");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("未确认前不显示价格、不跳转购买或预订页面");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("CNY ");
    await expect(page.locator("[data-commerce-home-summary] .commerce-booking-link")).toHaveCount(0);
  });

  test("global provider pool copy covers product hotel flight and ticket no-provider pages", async () => {
    const assertOnboardingPanelVisible = async () => {
      const detail = page.locator(".commerce-detail");
      await openTechnicalDetails(detail);
      await expect(detail).toContainText("Provider 接入审查面板");
      await expect(detail).toContainText("总体状态：未完成，暂不可接入真实 provider");
      await expect(detail).toContainText("合规与条款");
      await expect(detail).toContainText("API 与接口");
      await expect(detail).toContainText("价格与费用字段");
      await expect(detail).toContainText("安全边界");
      await expect(detail).toContainText("当前阻断状态");
      await expect(detail).toContainText("法律条款审查");
      await expect(detail).toContainText("API 文档审查");
      await expect(detail).toContainText("API key 存储方案");
      await expect(detail).toContainText("价格字段审查");
      await expect(detail).toContainText("税费 / 关税 / 运费 / 预订费字段审查");
      await expect(detail).toContainText("隐私政策审查");
      await expect(detail).toContainText("不代付款确认");
      await expect(detail).toContainText("不自动下单确认");
      await expect(detail).toContainText("不保存证件/银行卡确认");
      await expect(detail).toContainText("审查全部完成");
      await expect(detail).toContainText("config / adapter / sandbox / connector gate");
      await expect(detail).toContainText("接通前不会访问真实平台");
      await expect(detail).toContainText("不会返回价格");
      await expect(detail).toContainText("不会跳转购买或预订页面");
      await expect(detail).toContainText("不能提前模拟");
      await expect(detail).not.toContainText("legalTermsReviewed=false");
      await expect(detail).not.toContainText("apiDocsReviewed=false");
      await expect(detail).not.toContainText("canConnectEndpoint=false");
      await expect(detail).not.toContainText("canDisplayPrice=false");
      await expect(detail).not.toContainText("noRealEndpoint=true");
      await expect(detail).not.toContainText("noApiKey=true");
      await expect(detail).not.toContainText("provider_onboarding_required");
      await expect(detail).not.toContainText("endpointConnected=false");
      await expect(detail).not.toContainText("apiKeyConfigured=false");
      await expect(detail).not.toContainText("networkAllowed=false");
      await expect(detail).not.toContainText("canSearchNow=false");
      await expect(detail).not.toContainText("selectedStatus");
      await expect(detail).not.toContainText("立即支付");
      await expect(detail).not.toContainText("上传身份证");
      await expect(detail).not.toContainText("上传护照");
      await expect(detail).not.toContainText("保存银行卡");
      await expect(page.getByRole("button", { name:/^(去购买|去预订|付款|立即支付|提交订单)$/ })).toHaveCount(0);
    };

    const assertHomeOnboardingPanelVisible = async () => {
      const home = page.locator("[data-commerce-home-summary]");
      await expect(home.locator(".commerce-onboarding-review-panel")).toHaveCount(0);
      await expect(home).toContainText("查看技术细节");
      await expect(home).toContainText("当前只是帮你整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。");
      await openTechnicalDetails(home);
      await expect(home.locator(".commerce-onboarding-review-panel")).toHaveCount(1);
      await expect(home.locator(".commerce-onboarding-group")).toHaveCount(5);
      await expect(home).toContainText("Provider 接入审查面板");
      await expect(home).toContainText("总体状态：未完成，暂不可接入真实 provider");
      await expect(home).toContainText("合规与条款");
      await expect(home).toContainText("API 与接口");
      await expect(home).toContainText("价格与费用字段");
      await expect(home).toContainText("安全边界");
      await expect(home).toContainText("当前阻断状态");
      await expect(home).toContainText("法律条款审查：未完成");
      await expect(home).toContainText("API 文档审查：未完成");
      await expect(home).toContainText("API key 存储方案：未审查");
      await expect(home).toContainText("价格/税费/运费字段审查：未完成");
      await expect(home).toContainText("隐私与合规审查：未完成");
      await expect(home).toContainText("网络搜索：未启用");
      await expect(home).toContainText("实时价格：不可用");
      await expect(home).toContainText("精确跳转：待真实 provider 接入后启用");
      await expect(home).not.toContainText("provider_onboarding_required");
      await expect(home).not.toContainText("endpointConnected=false");
      await expect(home).not.toContainText("selectedStatus");
      await expect(home).not.toContainText("立即支付");
      await expect(home).not.toContainText("上传身份证");
      await expect(home).not.toContainText("上传护照");
      await expect(home.locator(".commerce-booking-link")).toHaveCount(0);
    };

    await submitHomeCommand(page, runId + " 买华为手机");
    await assertHomeOnboardingPanelVisible();
    await page.locator("#commerceViewPlanBtn").click();
    await assertOnboardingPanelVisible();
    await expect(page.locator(".commerce-detail")).toContainText("商品电商平台");
    await expect(page.locator(".commerce-detail")).toContainText("品牌官网");
    await expect(page.locator(".commerce-detail")).toContainText("商品官网");
    await expect(page.locator(".commerce-detail")).toContainText("区域电商平台");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会访问任何真实平台");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会返回价格");
    await expect(page.locator(".commerce-detail")).toContainText("Provider 接入审查");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会连接真实 provider");
    await assertOnboardingPanelVisible();
    await expect(page.locator(".commerce-detail")).not.toContainText("去购买");
    await expect(page.locator(".commerce-detail")).not.toContainText("legalTermsReviewed=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("apiDocsReviewed=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("canConnectEndpoint=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("canDisplayPrice=false");
    await expect(page.locator(".commerce-detail")).not.toContainText("noRealEndpoint=true");
    await expect(page.locator(".commerce-detail")).not.toContainText("noApiKey=true");

    await submitHomeCommand(page, runId + " 订酒店");
    await assertHomeOnboardingPanelVisible();
    await page.locator("#commerceViewPlanBtn").click();
    await openTechnicalDetails(page.locator(".commerce-detail"));
    await expect(page.locator(".commerce-detail")).toContainText("酒店官网");
    await expect(page.locator(".commerce-detail")).toContainText(/酒店\s*OTA/);
    await expect(page.locator(".commerce-detail")).toContainText("区域住宿平台");
    await expect(page.locator(".commerce-detail")).toContainText("Booking / Agoda / Expedia / 携程 / 酒店官网");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会访问任何真实酒店平台");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会返回房价");
    await expect(page.locator(".commerce-detail")).toContainText("Provider 接入审查");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会连接真实 provider");
    await assertOnboardingPanelVisible();
    await expect(page.locator(".commerce-detail")).not.toContainText("去预订");

    await submitHomeCommand(page, runId + " 订机票");
    await assertHomeOnboardingPanelVisible();
    await page.locator("#commerceViewPlanBtn").click();
    await openTechnicalDetails(page.locator(".commerce-detail"));
    await expect(page.locator(".commerce-detail")).toContainText(/机票\s*OTA/);
    await expect(page.locator(".commerce-detail")).toContainText("航司官网");
    await expect(page.locator(".commerce-detail")).toContainText("区域旅行平台");
    await expect(page.locator(".commerce-detail")).toContainText("Trip.com / Expedia / 航司官网");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会访问任何真实机票平台");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会返回票价");
    await expect(page.locator(".commerce-detail")).toContainText("Provider 接入审查");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会连接真实 provider");
    await assertOnboardingPanelVisible();
    await expect(page.locator(".commerce-detail")).not.toContainText("去预订");

    await submitHomeCommand(page, runId + " 买演唱会门票");
    await assertHomeOnboardingPanelVisible();
    await page.locator("#commerceViewPlanBtn").click();
    await openTechnicalDetails(page.locator(".commerce-detail"));
    await expect(page.locator(".commerce-detail")).toContainText("票务平台");
    await expect(page.locator(".commerce-detail")).toContainText("活动官网");
    await expect(page.locator(".commerce-detail")).toContainText("区域票务平台");
    await expect(page.locator(".commerce-detail")).toContainText("Ticketmaster / 大麦 / Eventbrite / 活动官网");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会访问任何真实票务平台");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会返回票价");
    await expect(page.locator(".commerce-detail")).toContainText("Provider 接入审查");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会连接真实 provider");
    await assertOnboardingPanelVisible();
    await expect(page.locator(".commerce-detail")).not.toContainText("去购买");
    await expect(page.locator(".commerce-detail")).not.toContainText("立即支付");
    await expect(page.locator(".commerce-detail")).not.toContainText("上传身份证");
    await expect(page.locator(".commerce-detail")).not.toContainText("上传护照");
    await expect(page.locator(".commerce-detail")).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
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
    await page.locator("#commerceViewPlanBtn").click();
    await page.getByRole("button", { name:"开始搜索" }).first().click();
    await expect(page.locator(".commerce-detail")).toContainText("华为手机搜索已完成");
    await expect(page.locator(".commerce-candidate-card")).toHaveCount(3);
    await expect(page.locator(".commerce-candidate-card").nth(0)).toContainText("最低到手价推荐");
    await expect(page.locator(".commerce-candidate-card").nth(0)).toContainText("CNY 2099");
    await expect(page.locator(".commerce-candidate-card").nth(1)).toContainText("CNY 2188");
    await expect(page.locator(".commerce-candidate-card").nth(2)).toContainText("CNY 2300");
    await expect(page.locator(".commerce-detail")).toContainText("免费的全球比价与跳转服务");
    await expect(page.locator(".commerce-detail")).toContainText("商品价");
    await expect(page.locator(".commerce-detail")).toContainText("运费");
    await expect(page.locator(".commerce-detail")).toContainText("关税/进口税");
    await expect(page.locator(".commerce-detail")).toContainText("税费/VAT/GST/销售税");
    await expect(page.locator(".commerce-detail")).toContainText("到手总价");
    await expect(page.locator(".commerce-detail")).toContainText("费用完整性");
    await expect(page.locator(".commerce-detail")).toContainText("预估");
    await expect(page.locator(".commerce-detail")).toContainText("待确认");
    await expect(page.locator(".commerce-detail")).toContainText("US → CN");
    await expect(page.locator(".commerce-detail")).toContainText("CN → US");
    await expect(page.locator(".commerce-detail")).toContainText("海关结算");
    await expect(page.locator(".commerce-detail")).toContainText("官方授权店");
    await expect(page.locator(".commerce-detail")).toContainText("包邮");
    await expect(page.locator(".commerce-detail")).toContainText("含售后");
    await expect(page.locator(".commerce-detail")).not.toContainText("缺少币种");
    await expect(page.locator(".commerce-detail")).not.toContainText("javascript 链接");
    await expect(page.locator(".commerce-detail")).not.toContainText("file 链接");
    await expect(page.locator(".commerce-detail")).not.toContainText("data 链接");
    await expect(page.locator(".commerce-detail")).not.toContainText("空 URL");
    await expect(page.locator(".commerce-detail")).not.toContainText("无 URL");
    await expect(page.locator(".commerce-detail")).not.toContainText("高配套装");
    await expect(page.locator(".commerce-detail")).not.toContainText("第五候选");
    await expect(page.locator(".commerce-detail")).not.toContainText("mock 低价");
    await expect(page.locator(".commerce-booking-link").nth(0)).toHaveText("去购买");
    await expect(page.locator(".commerce-booking-link").nth(0)).toHaveAttribute("data-url", "https://shop.example.test/huawei-standard");
    await expect(page.locator(".commerce-booking-link").nth(1)).toHaveText("查看详情");
    await expect(page.locator(".commerce-booking-link").nth(1)).toHaveAttribute("data-url", "https://shop.example.test/huawei-detail");
    await expect(page.locator(".commerce-booking-link").nth(2)).toHaveText("去购买");
    await expect(page.locator(".commerce-booking-link").nth(2)).toHaveAttribute("data-url", "http://shop.example.test/huawei-http");
    await page.evaluate(() => {
      window.__commerceOpenedUrl = "";
      window.WeishanAPI = window.WeishanAPI || {};
      window.WeishanAPI.openExternal = async (url) => { window.__commerceOpenedUrl = url; return true; };
    });
    await page.locator(".commerce-booking-link").nth(0).click();
    await expect.poll(() => page.evaluate(() => window.__commerceOpenedUrl)).toBe("https://shop.example.test/huawei-standard");
    await page.locator(".commerce-booking-link").nth(0).evaluate((el) => { el.setAttribute("data-url", "javascript:alert(1)"); });
    await page.locator(".commerce-booking-link").nth(0).click();
    await expect.poll(() => page.evaluate(() => window.__commerceOpenedUrl)).toBe("https://shop.example.test/huawei-standard");
    await page.locator(".commerce-booking-link").nth(0).evaluate((el) => { el.setAttribute("data-url", "file:///tmp/a"); });
    await page.locator(".commerce-booking-link").nth(0).click();
    await expect.poll(() => page.evaluate(() => window.__commerceOpenedUrl)).toBe("https://shop.example.test/huawei-standard");
    await page.locator(".commerce-booking-link").nth(0).evaluate((el) => { el.setAttribute("data-url", "data:text/html,hello"); });
    await page.locator(".commerce-booking-link").nth(0).click();
    await expect.poll(() => page.evaluate(() => window.__commerceOpenedUrl)).toBe("https://shop.example.test/huawei-standard");
    await expect(page.locator(".commerce-detail")).toContainText("weishan 只提供比价与跳转，不代付款、不自动下单、不保存支付或证件信息");
    await gotoRoute(page, "home");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("华为手机搜索已完成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最低到手价 CNY 2099");
    await clearCommerceSearchMock(page);
  });

  test("cruise category creates plan without fake price", async () => {
    const command = runId + " 帮我找上海出发的低价邮轮";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("邮轮计划已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("类型：邮轮");
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-task-list")).toContainText("邮轮");
    await page.getByRole("button", { name:"查看计划" }).first().click();
    await expect(page.locator(".commerce-detail")).toContainText("邮轮公司官网");
    await expect(page.locator(".commerce-detail")).toContainText("总价");
    await expect(page.locator(".commerce-detail")).toContainText("舱型");
    await expect(page.locator(".commerce-detail")).toContainText("邮轮价格受航线、舱型、日期和人数影响较大");
    await expect(page.locator(".commerce-detail")).toContainText("搜索能力未配置，无法返回实时价格");
    await expect(page.locator(".commerce-detail")).not.toContainText("¥999");
    await expect(page.locator(".commerce-detail")).not.toContainText("$123");
  });

  test("private jet category creates inquiry-only plan without fake price", async () => {
    const command = runId + " 帮我找一架公务机从成都飞香港";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("公务机计划已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("类型：公务机");
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-task-list")).toContainText("公务机");
    await page.getByRole("button", { name:"查看计划" }).first().click();
    await expect(page.locator(".commerce-detail")).toContainText("公务机包机平台");
    await expect(page.locator(".commerce-detail")).toContainText("包机报价");
    await expect(page.locator(".commerce-detail")).toContainText("公务机属于高价值定制服务");
    await expect(page.locator(".commerce-detail")).toContainText("价格通常需要询价确认");
    await expect(page.locator(".commerce-detail")).toContainText("不自动提交询价");
    await expect(page.locator(".commerce-detail")).not.toContainText("¥999");
    await expect(page.locator(".commerce-detail")).not.toContainText("$123");
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
    await page.locator("#commerceViewPlanBtn").click();
    await page.getByRole("button", { name:"开始搜索" }).first().click();
    await expect(page.locator(".commerce-detail")).toContainText("候选方案");
    await expect(page.locator(".commerce-detail")).toContainText("E2E Travel");
    await expect(page.locator(".commerce-detail")).toContainText("CNY 780");
    await expect(page.locator(".commerce-detail")).toContainText("退改需按航司规则");
    await expect(page.locator(".commerce-detail")).toContainText("不含托运行李");
    await expect(page.locator(".commerce-detail")).toContainText("最低到手价推荐");
    await expect(page.locator(".commerce-detail")).toContainText("价格可能变化");
    await expect(page.locator(".commerce-detail")).toContainText("推荐结果");
    await expect(page.locator(".commerce-detail")).toContainText("总价更低但服务较少");
    await expect(page.locator(".commerce-candidate-card")).toHaveCount(2);
    await expect(page.locator(".commerce-candidate-card").nth(0)).toContainText("CNY 780");
    await expect(page.locator(".commerce-candidate-card").nth(1)).toContainText("CNY 860");
    await expect(page.locator(".commerce-booking-link")).toHaveCount(2);
    await expect(page.locator(".commerce-booking-link").first()).toHaveText("去预订");
    await expect(page.locator(".commerce-booking-link").first()).toHaveAttribute("data-url", "https://booking.example.test/flight-c");
    await expect(page.locator(".commerce-detail")).not.toContainText("成都到上海经济舱 B");
    await expect(page.locator(".commerce-detail")).not.toContainText("缺少总价的结果");
    await gotoRoute(page, "home");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票搜索已完成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("已找到 2 个真实 provider 结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最低到手价 CNY 780");
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
    await page.locator("#commerceViewPlanBtn").click();
    await page.getByRole("button", { name:"搜索模型结果" }).first().click();
    await expect(page.locator(".commerce-detail")).toContainText("Unknown Price Model");
    await expect(page.locator(".commerce-detail")).toContainText("价格字段不可解析");
    await expect(page.locator(".commerce-detail")).toContainText("模型页链接不是 https 或不属于 openrouter.ai，已阻断打开");
  });

  test("ai model pricing plan uses candidate schema without fake live prices", async () => {
    const command = runId + " 帮我比较 OpenRouter 和其他 AI 模型平台价格";
    await submitHomeCommand(page, command);
    await page.locator('.nav-item[data-route="commerce"]').click();
    await expect(page.locator('.nav-item[data-route="commerce"]')).toBeVisible();
    await page.getByRole("button", { name:"查看计划" }).first().click();
    await expect(page.getByText("候选方案字段模板")).toBeVisible();
    await expect(page.getByText(/计费单位|上下文\/额度|调用稳定性/).first()).toBeVisible();
    await expect(page.getByText("不填真实价格，不伪造实时库存或可用性")).toBeVisible();
    await expect(page.locator(".commerce-detail")).not.toContainText("已找到最低价");
  });

  test("direct order and payment request remains blocked and plan-only", async () => {
    const command = runId + " 帮我直接下单并付款";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("已阻断");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("原因：涉及下单 / 付款");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("不会下单、付款或提交订单");
    await expect(page.locator("#commerceViewPlanBtn")).toBeVisible();
    await expect(currentTaskLogs(page)).not.toContainText("commerceAgent.plan");
    await expect(currentTaskLogs(page)).not.toContainText("realExecution=false");
    await expect(currentTaskLogs(page)).not.toContainText("搜索范围：");
    await expect(currentTaskLogs(page)).not.toContainText("决策目标：同等条件下价格最低");
    await page.locator('.nav-item[data-route="commerce"]').click();
    await expect(page.getByText("已阻断").first()).toBeVisible();
    await page.getByRole("button", { name:"查看计划" }).first().click();
    await expect(page.locator(".commerce-detail")).toContainText("该请求涉及下单 / 付款，已阻断");
    await expect(page.locator(".commerce-detail")).toContainText("不会下单、付款或提交订单");
    await expect(page.getByRole("button", { name:/付款|下单|提交订单/ })).toHaveCount(0);
    await expect(page.locator(".commerce-safety")).toContainText("当前不会访问真实平台、不会返回价格、不会跳转购买或预订、不会付款或下单");
  });

  test("cruise payment request is blocked without payment or order submit", async () => {
    const command = runId + " 帮我直接预订邮轮并付款";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("已阻断");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("不会下单、付款或提交订单");
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-detail")).toContainText("已阻断");
    await expect(page.locator(".commerce-detail")).toContainText("不会下单、付款或提交订单");
    await expect(page.getByRole("button", { name:/付款|下单|提交订单/ })).toHaveCount(0);
  });

  test("private jet passport upload and inquiry submit are blocked", async () => {
    const command = runId + " 帮我上传护照并预订公务机";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("已阻断");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("不会下单、付款或提交订单，也不会上传身份证/护照或提交询价表");
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-detail")).toContainText("已阻断");
    await expect(page.locator(".commerce-detail")).toContainText("不会下单、付款或提交订单");
    await expect(page.locator(".commerce-detail")).toContainText(/不保存支付或身份信息|最终执行必须用户确认/);
  });

  test("flight payment and id upload request is blocked without upload payment or order submit", async () => {
    const command = runId + " 帮我上传身份证订机票并付款";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("已阻断");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("不会下单、付款或提交订单");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("不会上传身份证/护照或提交询价表");
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-detail")).toContainText("已阻断");
    await expect(page.locator(".commerce-detail")).toContainText("不会下单、付款或提交订单");
    await expect(page.locator(".commerce-detail")).toContainText(/不保存支付或身份信息|最终执行必须用户确认/);
    await expect(page.getByRole("button", { name:/付款|下单|提交订单/ })).toHaveCount(0);
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
    await page.locator('.nav-item[data-route="commerce"]').click();
    await expect(page.locator(".commerce-task-list")).toContainText(command);
    await page.getByRole("button", { name:"清理计划" }).first().click();
    await expect(page.locator(".commerce-task-list")).not.toContainText(command);
    await gotoRoute(page, "history");
    await page.locator("#historySearch").fill(runId);
    await expect(page.locator("#historyList")).toContainText(/commerceAgent\.taskCleared|taskCleared/);
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
    await expect(home).toContainText(/计划已生成|搜索已生成/);
    await expect(home).toContainText("商品关键词");
    await expect(home).toContainText("查看分析过程");
    await expect(home).toContainText("查看安全边界");
    await expect(home).toContainText("查看技术细节");
    await expect(home).toContainText("当前只是帮你整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。");
    const defaultHomeText = await visibleTextWithoutTechnicalDetails(home);
    expect(defaultHomeText).not.toContain("provider");
    expect(defaultHomeText).not.toContain("Provider");
    expect(defaultHomeText).not.toContain("API key");
    expect(defaultHomeText).not.toContain("endpoint");
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
    await page.locator('#commerceViewPlanBtn').click();
    const detail = page.locator('.commerce-detail').first();
    const defaultDetailText = await visibleTextWithoutTechnicalDetails(detail);
    expect(defaultDetailText).not.toContain("provider");
    expect(defaultDetailText).not.toContain("Provider");
    expect(defaultDetailText).not.toContain("API key");
    expect(defaultDetailText).not.toContain("endpoint");
    expect(defaultDetailText).not.toContain("当地法律合规审查");
    expect(defaultDetailText).not.toContain("合规状态：未确认");
    await openTechnicalDetails(detail);
    await expect(detail).toContainText(/当地法律合规：未确认|当地法律合规未确认|当地法律合规审查：未开始/);
    await expect(detail).toContainText(/当前不会连接真实平台|当前不会访问真实平台|不会返回价格|不会跳转购买或预订页面|不会付款或下单/);
    await expect(detail).not.toContainText("local_law_compliance_required");
    await expect(detail).not.toContainText("local_law_compliance_not_verified");
    await expect(detail).not.toContainText("compliance_review_required");
    await expect(detail).not.toContainText("unknownLegalityBlocks=true");
    await expect(detail).not.toContainText("strictestRuleWins=true");
    await expect(detail).not.toContainText("noNetworkLegalLookup=true");
    await expect(detail).not.toContainText("noRealLegalDatabase=true");
    await expect(detail).not.toContainText("storeRawCoordinates=false");
    await expect(detail).not.toContainText("shareWithThirdParty=false");
  });

  test("v2.0.40 regulated local law review panel explains risk without legal conclusion", async () => {
    await gotoRoute(page, "home");
    const inputs = ["买大麻", "买枪", "买处方药", "成人服务", "赌博网站"];
    for (const text of inputs) {
      await submitHomeCommand(page, runId + "-LOCAL-LAW-REGULATED " + text);
      const home = page.locator('[data-commerce-home-summary="true"]').last();
      await expect(home).toContainText(/计划已生成/);
      await expect(home).toContainText("查看分析过程");
      await expect(home).toContainText("查看安全边界");
      await expect(home).toContainText("查看技术细节");
      await expect(home).toContainText("当前只是帮你整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。");
      await expect(home).not.toContainText("provider");
      await expect(home).not.toContainText("Provider");
      await expect(home).not.toContainText("API key");
      await expect(home).not.toContainText("endpoint");
      await expect(home).not.toContainText("当地法律合规审查");
      await expect(home).not.toContainText("该需求可能涉及当地法律限制");
      await expect(home).not.toContainText("需要先确认当前位置和收货地 / 目的地");
      await expect(home).not.toContainText("合法性未确认前，weishan 不显示价格、不跳转购买或预订页面");
      await expect(home).not.toContainText("当前仅做风险分类和阻断，不做真实法律结论");
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
      await openTechnicalDetails(home);
      await expect(home).toContainText(/当地法律合规未确认|当地法律合规审查：未开始|当前不会访问真实平台|不会返回价格|不会跳转购买或预订页面|不会付款或下单|不提供法律意见|不帮助规避当地法律/);
      await expect(home).not.toContainText("已确认合法");
      await expect(home).not.toContainText("可以放心购买");
      await expect(home).not.toContainText("保证合规");
      await expect(home).not.toContainText("绕过限制");
      await expect(home).not.toContainText("帮你买违禁品");
    }
  });

  test("v2.0.40 hotel flight and ticket plans show local law compliance panel", async () => {
    await gotoRoute(page, "home");
    const inputs = ["订酒店", "订机票", "买演唱会门票"];
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
      await page.locator('#commerceViewPlanBtn').click();
      const detail = page.locator('.commerce-detail').first();
      await expect(detail).not.toContainText("当地法律合规审查");
      await expect(detail).not.toContainText("合规状态：未确认");
      await openTechnicalDetails(detail);
      await expect(detail).toContainText(/当地法律合规：未确认|当地法律合规未确认|当地法律合规审查：未开始|当前不会访问真实平台|当前不会连接真实平台|不会返回价格|不会跳转购买或预订页面|不会付款或下单|不提供法律意见|不帮助规避当地法律/);
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
    await page.locator('#commerceViewPlanBtn').click();
    const detail = page.locator('.commerce-detail').first();
    await expect(detail.locator('.commerce-subplan-draft-confirmation-panel').first()).toBeHidden();
    await openTechnicalDetails(detail);
    await expect(detail.locator('.commerce-subplan-draft-confirmation-panel').first()).toBeVisible();
    await expect(detail.locator('.commerce-subplan-draft-confirmation-panel').first()).toContainText("子计划草稿确认与修正");
    await expect(detail).toContainText("已确认但仍受 gate 阻断");
    await expect(detail).not.toContainText("去购买");
    await expect(detail).not.toContainText("去预订");
    await expect(detail).not.toContainText("立即支付");
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
    await expect(main).toContainText("旅行：");
    await expect(main).toContainText("电脑：");
    await expect(main).toContainText("查看可执行清单");
    await expect(main).toContainText("查看平台模板");
    await openDisclosure(main.locator(".commerce-result-summary-panel"), "commerce-actionable-checklist-disclosure");
    await expect(main).toContainText("复制机票搜索条件");
    await expect(main).toContainText("复制酒店搜索条件");
    await expect(main).toContainText("复制电脑搜索条件");
    await expect(main).toContainText("复制全部清单");
    await expect(main).toContainText("两个都确认");
    await expect(main).toContainText("查看分析过程");
    await expect(main).toContainText("查看安全边界");
    await expect(main).toContainText("查看技术细节");
    const defaultMainText = await visibleTextWithoutTechnicalDetails(main);
    expect(defaultMainText).not.toContain("子计划草稿确认与修正");
    expect(defaultMainText).not.toContain("gate");
    expect(defaultMainText).not.toContain("provider");
    expect(defaultMainText).not.toContain("API key");
    expect(defaultMainText).not.toContain("endpoint");
    await openDisclosure(main, "commerce-process-disclosure");
    await openTechnicalDetails(main);
    await expect(main).toContainText(/子计划草稿确认与修正|用户确认草稿是否准确|确认状态|待确认|已确认|已修正待复核|草稿已补齐，等待确认/);
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
    await expect(home).toContainText(/结果摘要|全球采购计划已生成/);
    await expect(home).toContainText("草稿下一步动作");
    await expect(home).toContainText("快捷动作");
    await expect(home).toContainText("两个都确认");
    await expect(home).toContainText("查看分析过程");
    await expect(home).toContainText("查看安全边界");
    await expect(home).toContainText("查看技术细节");
    await expect(home).toContainText("当前只是帮你整理搜索条件，不会访问真实平台，不会返回价格，不会跳转购买或预订，不会付款或下单。");
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
    await page.locator("#commerceViewPlanBtn").click();
    const detail = page.locator(".commerce-detail").first();
    const detailPanel = detail.locator(".commerce-subplan-draft-action-panel").first();
    await expect(detailPanel).toContainText("草稿下一步动作");
    await expect(detailPanel).toContainText("查看安全边界");
    for (const text of ["当前只是帮你整理搜索条件", "不会访问真实平台", "不会自动执行", "不会返回价格", "不会跳转购买或预订", "不会付款或下单"]) {
      await expect(detailPanel).toContainText(text);
    }
    for (const technicalText of ["provider", "API key", "endpoint", "Connector Gate", "Sandbox Dry Run"]) {
      await expect(detailPanel).not.toContainText(technicalText);
    }
    for (const field of rawFields) await expect(detail).not.toContainText(field);
    for (const field of rawChipFields) await expect(detail).not.toContainText(field);
    for (const field of rawFocusAssistFields) await expect(detail).not.toContainText(field);
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
    await page.locator("#commerceViewPlanBtn").click();
    const detail = page.locator(".commerce-detail").first();
    await openTechnicalDetails(detail);
    const beforeHistoryCount = await page.evaluate(() => window.HistoryApi.list().length);
    await detail.locator('[data-commerce-action-chip="查看安全边界"]').click();
    await expect(page.locator("#commerceInput")).toHaveValue("查看安全边界");
    await expect(page.locator("#commerceInput")).toBeFocused();
    await expect(page.locator("#commerceGenerate")).toHaveClass(/commerce-chip-focus-start-highlight/);
    await expect(detail).toContainText("已填入指令，请确认后点击开始执行");
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

});
