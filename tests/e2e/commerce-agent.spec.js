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
        script.src = "./renderer/core/commerceProviderAdapter.js?v=2.0.23";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProviderConfig) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderConfig.js?v=2.0.23";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProviderSandbox) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderSandbox.js?v=2.0.23";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProviders) {
      if (!window.WeishanCommerceProviderSandbox) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderSandbox.js?v=2.0.23";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviders.js?v=2.0.23";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceSearch) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceSearch.js?v=2.0.23";
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
  }, candidates);
}

async function installOpenRouterModelsMock(page, payload, options = {}) {
  await page.evaluate(async ({ data, fail }) => {
    if (!window.WeishanCommerceProviderAdapter) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderAdapter.js?v=2.0.23";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProviderConfig) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderConfig.js?v=2.0.23";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProviderSandbox) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviderSandbox.js?v=2.0.23";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceProviders) {
      if (!window.WeishanCommerceProviderSandbox) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderSandbox.js?v=2.0.23";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceProviders.js?v=2.0.23";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    if (!window.WeishanCommerceSearch) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceSearch.js?v=2.0.23";
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
          const keys = ["weishan:commerceAgent:lastPlan:v1", "weishan:commerceAgent:tasks:v1", "weishan:commerceSearch:settings:v1"];
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
    await expect(page.getByText("当前只搜索和展示候选方案，不下单、不付款、不提交订单")).toBeVisible();
  });

  test("provider registry defaults to no-provider health for core categories", async () => {
    await gotoRoute(page, "commerce");
    const health = await page.evaluate(async () => {
      if (!window.WeishanCommerceProviderAdapter) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderAdapter.js?v=2.0.23";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (!window.WeishanCommerceProviderConfig) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderConfig.js?v=2.0.23";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (!window.WeishanCommerceProviders) {
        if (!window.WeishanCommerceProviderSandbox) {
          await new Promise((resolve) => {
            const script = document.createElement("script");
            script.src = "./renderer/core/commerceProviderSandbox.js?v=2.0.23";
            script.onload = resolve;
            document.head.appendChild(script);
          });
        }
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviders.js?v=2.0.23";
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
      expect(provider.enabled).toBe(false);
      expect(provider.configured).toBe(false);
      expect(provider.sourceType).toBe("manual_disabled");
      expect(provider.adapterId).toBeTruthy();
      expect(provider.adapterMode).toBe("read_only");
      expect(provider.adapterConfigured).toBe(false);
      expect(provider.adapterHealth).toBe("not_configured");
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
    }
    for (const item of health.health) {
      expect(item.searchStatus).toBe("no_provider");
      expect(item.canShowPrice).toBe(false);
      expect(item.canShowBookingButton).toBe(false);
      expect(item.canShowCheckoutButton).toBe(false);
      expect(item.adapterHealth.adapterMode).toBe("read_only");
      expect(item.adapterHealth.adapterConfigured).toBe(false);
      expect(item.adapterHealth.adapterHealth).toBe("not_configured");
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

  test("provider config contract is disabled and does not leak API keys", async () => {
    await gotoRoute(page, "commerce");
    const result = await page.evaluate(async () => {
      if (!window.WeishanCommerceProviderConfig) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderConfig.js?v=2.0.23";
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
          script.src = "./renderer/core/commerceProviderConfig.js?v=2.0.23";
          script.onload = resolve;
          document.head.appendChild(script);
        });
      }
      if (!window.WeishanCommerceProviderSandbox) {
        await new Promise((resolve) => {
          const script = document.createElement("script");
          script.src = "./renderer/core/commerceProviderSandbox.js?v=2.0.23";
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
          script.src = "./renderer/core/commerceProviderAdapter.js?v=2.0.23";
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
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂未配置真实机票搜索适配器");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前无法返回实时价格");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("未下单、未付款、未提交订单、未保存证件");
    await expect(page.locator("#commerceViewPlanBtn")).toBeVisible();

    await page.locator("#commerceViewPlanBtn").click();
    await page.getByRole("button", { name:"查看计划" }).first().click();
    await expect(page.locator(".commerce-detail")).toContainText("机票");
    await expect(page.locator(".commerce-detail")).toContainText("成都");
    await expect(page.locator(".commerce-detail")).toContainText("北京");
    await expect(page.locator(".commerce-detail")).toContainText("明天");
    await expect(page.locator(".commerce-detail")).toContainText("已识别为机票搜索计划");
    await expect(page.locator(".commerce-detail")).toContainText("暂未配置真实机票搜索适配器");
    await expect(page.locator(".commerce-detail")).toContainText("当前模式");
    await expect(page.locator(".commerce-detail")).toContainText("只读搜索准备中");
    await expect(page.locator(".commerce-detail")).toContainText("当前无法返回实时价格");
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
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂未配置真实商品搜索适配器");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前无法返回实时价格");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("未下单、未付款、未提交订单、未保存银行卡或证件");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText(/CNY\s*\d+|¥\s*\d+|\$\s*\d+/);
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("去购买");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 买华为1手机");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("华为1手机搜索已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("商品关键词：华为1手机");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
  });

  test("no-provider UI exposes safe health flags for flight and product", async () => {
    await clearCommerceSearchMock(page);
    await submitHomeCommand(page, runId + " 帮我预定明天成都到北京机票");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票搜索已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂未配置真实机票搜索适配器");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("未下单、未付款、未提交订单、未保存证件");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("CNY ");
    await expect(page.locator("[data-commerce-home-summary] .commerce-booking-link")).toHaveCount(0);
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-detail")).toContainText("searchStatus");
    await expect(page.locator(".commerce-detail")).toContainText("no_provider");
    await expect(page.locator(".commerce-detail")).toContainText("canShowPrice");
    await expect(page.locator(".commerce-detail")).toContainText("false");
    await expect(page.locator(".commerce-detail")).toContainText("canShowBookingButton");
    await expect(page.locator(".commerce-detail")).toContainText("canShowCheckoutButton");
    await expect(page.locator(".commerce-detail")).toContainText("adapterMode");
    await expect(page.locator(".commerce-detail")).toContainText("read_only");
    await expect(page.locator(".commerce-detail")).toContainText("adapterHealth");
    await expect(page.locator(".commerce-detail")).toContainText("not_configured");
    await expect(page.locator(".commerce-detail")).toContainText("配置状态");
    await expect(page.locator(".commerce-detail")).toContainText("未配置真实搜索源");
    await expect(page.locator(".commerce-detail")).toContainText("网络搜索");
    await expect(page.locator(".commerce-detail")).toContainText("未启用");
    await expect(page.locator(".commerce-detail")).toContainText("实时价格");
    await expect(page.locator(".commerce-detail")).toContainText("不可用");
    await expect(page.locator(".commerce-detail")).toContainText("configStatus");
    await expect(page.locator(".commerce-detail")).toContainText("hasApiKey");
    await expect(page.locator(".commerce-detail")).toContainText("allowNetworkSearch");
    await expect(page.locator(".commerce-detail")).toContainText("allowReturnPrice");
    await expect(page.locator(".commerce-detail")).toContainText("Provider Sandbox");
    await expect(page.locator(".commerce-detail")).toContainText("dry-run");
    await expect(page.locator(".commerce-detail")).toContainText("全球搜索准备");
    await expect(page.locator(".commerce-detail")).toContainText("未启用");
    await expect(page.locator(".commerce-detail")).toContainText("Provider Dry Run");
    await expect(page.locator(".commerce-detail")).toContainText("未通过");
    await expect(page.locator(".commerce-detail")).toContainText("跨境搜索");
    await expect(page.locator(".commerce-detail")).toContainText("providerReadiness");
    await expect(page.locator(".commerce-detail")).toContainText("blocked_before_network");
    await expect(page.locator(".commerce-detail")).toContainText("schemaValidation");
    await expect(page.locator(".commerce-detail")).toContainText("not_run");
    await expect(page.locator(".commerce-detail")).toContainText("supportedRegions");
    await expect(page.locator(".commerce-detail")).toContainText("supportedCountries");
    await expect(page.locator(".commerce-detail")).toContainText("supportedLanguages");
    await expect(page.locator(".commerce-detail")).toContainText("supportedCurrencies");
    await expect(page.locator(".commerce-detail")).toContainText("complianceRegion");
    await expect(page.locator(".commerce-detail")).toContainText("unknown");
    await expect(page.locator(".commerce-detail")).toContainText("supportsReadOnlySearch");
    await expect(page.locator(".commerce-detail")).toContainText("supportsCrossBorderSearch");
    await expect(page.locator(".commerce-detail")).toContainText("requiresUserAccount");
    await expect(page.locator(".commerce-detail")).toContainText("requiresIdentityDocument");
    await expect(page.locator(".commerce-detail")).toContainText("requiresPaymentMethod");
    await expect(page.locator(".commerce-detail")).toContainText("多国家、多平台、多币种");
    await expect(page.locator(".commerce-detail .commerce-booking-link")).toHaveCount(0);

    await submitHomeCommand(page, runId + " 买华为手机");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("华为手机搜索已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂未配置真实商品搜索适配器");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("未下单、未付款、未提交订单、未保存银行卡或证件");
    await expect(page.locator("[data-commerce-home-summary]")).not.toContainText("CNY ");
    await expect(page.locator("[data-commerce-home-summary] .commerce-booking-link")).toHaveCount(0);
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
        currency:"CNY",
        url:"http://shop.example.test/huawei-http",
        urlType:"checkout",
        conditions:"HTTP provider 链接",
        extras:["含税费"],
        recommendationReason:"http provider URL 也允许打开",
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
    await expect(page.locator(".commerce-candidate-card").nth(0)).toContainText("最低价推荐");
    await expect(page.locator(".commerce-candidate-card").nth(0)).toContainText("CNY 2099");
    await expect(page.locator(".commerce-candidate-card").nth(1)).toContainText("CNY 2188");
    await expect(page.locator(".commerce-candidate-card").nth(2)).toContainText("CNY 2300");
    await expect(page.locator(".commerce-detail")).toContainText("官方授权店");
    await expect(page.locator(".commerce-detail")).toContainText("包邮");
    await expect(page.locator(".commerce-detail")).toContainText("含售后");
    await expect(page.locator(".commerce-detail")).not.toContainText("缺少币种");
    await expect(page.locator(".commerce-detail")).not.toContainText("javascript 链接");
    await expect(page.locator(".commerce-detail")).not.toContainText("file 链接");
    await expect(page.locator(".commerce-detail")).not.toContainText("data 链接");
    await expect(page.locator(".commerce-detail")).not.toContainText("空 URL");
    await expect(page.locator(".commerce-detail")).not.toContainText("无 URL");
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
    await expect(page.locator(".commerce-detail")).toContainText("weishan 不自动支付、不提交订单、不保存证件或银行卡");
    await gotoRoute(page, "home");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("华为手机搜索已完成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最低总价 CNY 2099");
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
    await expect(page.locator(".commerce-detail")).toContainText("最低价推荐");
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
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最低总价 CNY 780");
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
