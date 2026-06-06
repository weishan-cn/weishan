const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2ECOMMERCE-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

async function submitHomeCommand(page, text) {
  await gotoRoute(page, "home");
  await expect(page.locator("#commandInput")).toBeVisible();
  await page.locator("#commandInput").fill(text);
  await page.locator("#runBtn").click();
}

function currentTaskLogs(page) {
  return page.locator(".cmd-log-list").first();
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
    await expect(page.getByRole("heading", { name:"全球采购" })).toBeVisible();
    await expect(page.locator(".commerce-hero h1")).toHaveText("全球采购");
    await expect(page.getByText("搜索、比价、推荐、执行前确认")).toBeVisible();
    await expect(page.getByText("当前只搜索和展示候选方案，不下单、不付款、不提交订单").first()).toBeVisible();
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
          script.src = "./renderer/core/commerceProviderOnboardingChecklist.js?v=2.0.36";
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
    expect(result.checklist.checklistVersion).toBe("2.0.36");
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

  test("provider onboarding review panel explains required checks without raw fields", async () => {
    await submitHomeCommand(page, runId + " 买华为手机");
    await page.locator("#commerceViewPlanBtn").click();
    const detail = page.locator(".commerce-detail");
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
    await expect(page.getByRole("button", { name:/去购买|去预订|付款|立即支付|提交订单/ })).toHaveCount(0);
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
    expect(result.searchResult.searchStatus).toBe("no_provider");
    expect(result.searchResult.reason).toBe("connector_not_enabled");
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
    await page.getByRole("button", { name:"搜索 OpenRouter 模型价格" }).first().click();
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
    await page.getByRole("button", { name:"搜索 OpenRouter 模型价格" }).first().click();
    await expect(page.locator(".commerce-detail")).toContainText("OpenRouter 搜索源不可用，无法返回真实价格");
    await expect(page.locator(".commerce-detail")).not.toContainText("¥999");
    await expect(page.locator(".commerce-detail")).not.toContainText("$123");
    await expect(page.locator(".commerce-detail")).not.toContainText("已找到最低价");
  });

  test("flight search requires travel date before showing prices", async () => {
    const command = runId + " 帮我找成都到上海最便宜机票";
    await submitHomeCommand(page, command);
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.getByText("请补充出行日期").first()).toBeVisible();
    await expect(page.getByRole("button", { name:"搜索真实价格" }).first()).toBeDisabled();
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
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球多源 provider 候选池：准备中，尚未接入");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票 OTA");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("航司官网");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前不会访问任何真实机票平台");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前不会返回票价");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("未下单、未付款、未提交订单、未保存证件");
    await expect(page.locator("#commerceViewPlanBtn")).toBeVisible();

    await page.locator("#commerceViewPlanBtn").click();
    await page.getByRole("button", { name:"查看计划" }).first().click();
    await expect(page.locator(".commerce-detail")).toContainText("机票");
    await expect(page.locator(".commerce-detail")).toContainText("成都");
    await expect(page.locator(".commerce-detail")).toContainText("北京");
    await expect(page.locator(".commerce-detail")).toContainText("明天");
    await expect(page.locator(".commerce-detail")).toContainText("已识别为机票搜索计划");
    await expect(page.locator(".commerce-detail")).toContainText("当前比较范围：机票 OTA、航司官网、区域旅行平台");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会访问任何真实机票平台");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会返回票价");
    await expect(page.locator(".commerce-detail")).toContainText("当前模式");
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
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("收货目的地：未设置");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("定位服务：关闭 / 未授权");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("精确最低到手价不可用");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("需要收货国家/地区/邮编用于运费、税费、关税和当地合规计算");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("去设置收货目的地");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("未下单、未付款、未提交订单、未保存银行卡或证件");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("去购买");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-detail")).toContainText("需要设置收货目的地以计算精确最低到手价");
    await expect(page.locator(".commerce-detail")).toContainText("收货目的地：未设置");
    await expect(page.locator(".commerce-detail")).toContainText("定位服务：关闭 / 未授权");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会显示价格");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会跳转购买/预订页面");
    await expect(page.locator(".commerce-detail")).toContainText("去设置收货目的地");
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
    await expect(page.getByRole("button", { name:"需要设置收货目的地" })).toBeDisabled();

    await submitHomeCommand(page, runId + " 买华为1手机");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("华为1手机搜索已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("商品关键词：华为1手机");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 买 iPhone");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("iPhone搜索已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球多源 provider 候选池：准备中，尚未接入");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("商品搜索试点候选：eBay Browse API 等");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("需要收货国家/地区/邮编用于运费、税费、关税和当地合规计算");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("去购买");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 买 MacBook");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("MacBook搜索已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球多源 provider 候选池：准备中，尚未接入");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("网络搜索未启用");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("需要收货国家/地区/邮编用于运费、税费、关税和当地合规计算");
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
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球多源 provider 候选池：准备中，尚未接入");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票 OTA");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("航司官网");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("区域旅行平台");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前不会访问任何真实机票平台");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前不会返回票价");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("未下单、未付款、未提交订单、未保存证件");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("CNY ");
    await expect(page.locator("[data-commerce-home-summary] .commerce-booking-link")).toHaveCount(0);
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-detail")).toContainText("全球多源 provider 候选池：准备中，尚未接入");
    await expect(page.locator(".commerce-detail")).toContainText("当前比较范围：机票 OTA、航司官网、区域旅行平台");
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
    await expect(page.locator(".commerce-detail")).toContainText("未配置真实搜索源");
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
    await expect(page.locator(".commerce-detail")).toContainText("全球搜索准备");
    await expect(page.locator(".commerce-detail")).toContainText("未启用");
    await expect(page.locator(".commerce-detail")).toContainText("Provider Dry Run");
    await expect(page.locator(".commerce-detail")).toContainText("未通过");
    await expect(page.locator(".commerce-detail")).toContainText("跨境搜索");
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
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("收货目的地：未设置");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("精确最低到手价不可用");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("去设置收货目的地");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("未下单、未付款、未提交订单、未保存银行卡或证件");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("CNY ");
    await expect(page.locator("[data-commerce-home-summary] .commerce-booking-link")).toHaveCount(0);
  });

  test("global provider pool copy covers product hotel flight and ticket no-provider pages", async () => {
    const assertOnboardingPanelVisible = async () => {
      const detail = page.locator(".commerce-detail");
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
      await expect(page.getByRole("button", { name:/去购买|去预订|付款|立即支付|提交订单/ })).toHaveCount(0);
    };

    await submitHomeCommand(page, runId + " 买华为手机");
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
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-detail")).toContainText("酒店官网");
    await expect(page.locator(".commerce-detail")).toContainText("酒店 OTA");
    await expect(page.locator(".commerce-detail")).toContainText("区域住宿平台");
    await expect(page.locator(".commerce-detail")).toContainText("Booking / Agoda / Expedia / 携程 / 酒店官网");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会访问任何真实酒店平台");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会返回房价");
    await expect(page.locator(".commerce-detail")).toContainText("Provider 接入审查");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会连接真实 provider");
    await assertOnboardingPanelVisible();
    await expect(page.locator(".commerce-detail")).not.toContainText("去预订");

    await submitHomeCommand(page, runId + " 订机票");
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-detail")).toContainText("机票 OTA");
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
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-detail")).toContainText("票务平台");
    await expect(page.locator(".commerce-detail")).toContainText("活动官网");
    await expect(page.locator(".commerce-detail")).toContainText("区域票务平台");
    await expect(page.locator(".commerce-detail")).toContainText("Ticketmaster / 大麦 / Eventbrite / 活动官网");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会访问任何真实票务平台");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会返回票价");
    await expect(page.locator(".commerce-detail")).toContainText("Provider 接入审查");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会连接真实 provider");
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
    await page.getByRole("button", { name:"搜索真实价格" }).first().click();
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
    await expect(page.locator(".commerce-detail")).toContainText("搜索适配器未配置，无法返回真实价格");
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
    await page.getByRole("button", { name:"搜索真实价格" }).first().click();
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
    await page.getByRole("button", { name:"搜索 OpenRouter 模型价格" }).first().click();
    await expect(page.locator(".commerce-detail")).toContainText("Unknown Price Model");
    await expect(page.locator(".commerce-detail")).toContainText("价格字段不可解析");
    await expect(page.locator(".commerce-detail")).toContainText("模型页链接不是 https 或不属于 openrouter.ai，已阻断打开");
  });

  test("ai model pricing plan uses candidate schema without fake live prices", async () => {
    const command = runId + " 帮我比较 OpenRouter 和其他 AI 模型平台价格";
    await submitHomeCommand(page, command);
    await page.locator('.nav-item[data-route="commerce"]').click();
    await expect(page.getByText(/AI 模型价格|全球采购/).first()).toBeVisible();
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
    await expect(page.locator(".commerce-safety")).toContainText("当前只搜索和展示候选方案，不下单、不付款、不提交订单");
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
});
