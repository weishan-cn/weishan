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
    if (!window.WeishanCommerceSearch) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceSearch.js?v=2.0.15";
        script.onload = resolve;
        document.head.appendChild(script);
      });
    }
    window.WeishanCommerceSearchProvider = {
      search: async () => ({
        providerName:"E2E Commerce Provider",
        candidates:items
      })
    };
    window.WeishanCommerceSearch.saveCommerceSearchSettings({
      enabled:true,
      providerName:"E2E Commerce Provider",
      providerMode:"manualProvider",
      apiKeyConfigured:false
    });
  }, candidates);
}

async function installOpenRouterModelsMock(page, payload, options = {}) {
  await page.evaluate(async ({ data, fail }) => {
    if (!window.WeishanCommerceSearch) {
      await new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "./renderer/core/commerceSearch.js?v=2.0.15";
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
  }, { data:payload, fail:options.fail === true });
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

  test("home commerce summary stays compact and links to workbench detail", async () => {
    const command = runId + " 帮我找成都到上海最便宜机票";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toHaveCount(1);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球采购计划已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText(/未搜索|未下单|未付款|未提交订单/);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText(/类型：机票/);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("待补充：出行日期");
    await expect(page.locator("#commerceViewPlanBtn")).toBeVisible();
    await expect(page.getByText("全球采购计划已生成")).toHaveCount(1);
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
    await expect(page.locator(".commerce-booking-link").first()).toHaveAttribute("href", /https:\/\/openrouter\.ai\/models\//);
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
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球采购计划已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("类型：机票");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("已识别为机票搜索计划");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("成都 → 北京");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("出发地：成都");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("目的地：北京");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("日期：明天");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("明天");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("未配置真实机票搜索 provider");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前不会返回实时机票价格");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("未搜索、未下单、未付款、未提交订单");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("未请求付款");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("未上传或保存身份证/护照");
    await expect(page.locator("#commerceViewPlanBtn")).toBeVisible();

    await page.locator("#commerceViewPlanBtn").click();
    await page.getByRole("button", { name:"查看计划" }).first().click();
    await expect(page.locator(".commerce-detail")).toContainText("机票");
    await expect(page.locator(".commerce-detail")).toContainText("成都");
    await expect(page.locator(".commerce-detail")).toContainText("北京");
    await expect(page.locator(".commerce-detail")).toContainText("明天");
    await expect(page.locator(".commerce-detail")).toContainText("已识别为机票搜索计划");
    await expect(page.locator(".commerce-detail")).toContainText("搜索源未配置，无法返回真实机票价格");
    await expect(page.locator(".commerce-detail")).toContainText("未配置真实机票搜索 provider");
    await expect(page.locator(".commerce-detail")).toContainText("当前不会返回实时机票价格");
    await expect(page.locator(".commerce-detail")).toContainText("不会提交订单");
    await expect(page.locator(".commerce-detail")).toContainText("不会请求付款");
    await expect(page.locator(".commerce-detail")).toContainText("不会上传或保存身份证/护照");
    await expect(page.locator(".commerce-detail")).not.toContainText(/CNY\s*\d+/);
  });

  test("flight lookup phrasing still routes to commerce instead of chat", async () => {
    await submitHomeCommand(page, runId + " 明天成都飞北京");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球采购计划已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("类型：机票");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("成都 → 北京");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("明天");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 查一下明天成都到北京的航班");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球采购计划已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("类型：机票");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("成都 → 北京");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("明天");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
  });

  test("hotel booking and product buying intents route to commerce before chat", async () => {
    await submitHomeCommand(page, runId + " 帮我预订上海低价酒店");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球采购计划已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("类型：酒店");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 帮我买一台最便宜的 MacBook");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球采购计划已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText(/类型：(电商商品|全球采购)/);
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
  });

  test("cruise category creates plan without fake price", async () => {
    const command = runId + " 帮我找上海出发的低价邮轮";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球采购计划已生成");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("类型：邮轮");
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-task-list")).toContainText("邮轮");
    await page.getByRole("button", { name:"查看计划" }).first().click();
    await expect(page.locator(".commerce-detail")).toContainText("邮轮公司官网");
    await expect(page.locator(".commerce-detail")).toContainText("总价");
    await expect(page.locator(".commerce-detail")).toContainText("舱型");
    await expect(page.locator(".commerce-detail")).toContainText("邮轮价格受航线、舱型、日期和人数影响较大");
    await expect(page.locator(".commerce-detail")).toContainText("搜索源未配置，无法返回真实价格");
    await expect(page.locator(".commerce-detail")).not.toContainText("¥999");
    await expect(page.locator(".commerce-detail")).not.toContainText("$123");
  });

  test("private jet category creates inquiry-only plan without fake price", async () => {
    const command = runId + " 帮我找一架公务机从成都飞香港";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球采购计划已生成");
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
        currency:"CNY",
        departTime:"2026-06-10 08:00",
        arriveTime:"2026-06-10 10:45",
        duration:"2h45m",
        conditions:"含基础行李",
        refundPolicySummary:"退改需按航司规则",
        riskSummary:"价格可能变化",
        hiddenFeeNote:"不含部分附加服务费",
        bookingUrl:"https://booking.example.test/flight-a",
        recommendationReason:"当前 provider 返回价格最低",
        isLiveResult:true
      },
      {
        candidateId:"bad-url",
        sourceName:"E2E Travel",
        title:"成都到上海经济舱 B",
        category:"flight",
        price:920,
        currency:"CNY",
        refundPolicySummary:"退改需复核",
        riskSummary:"链接协议不安全",
        bookingUrl:"javascript:alert(1)",
        recommendationReason:"备选方案",
        isLiveResult:true
      }
    ]);
    const command = runId + " 帮我找 2026-06-10 成都到上海最便宜机票";
    await submitHomeCommand(page, command);
    await page.locator("#commerceViewPlanBtn").click();
    await page.getByRole("button", { name:"搜索真实价格" }).first().click();
    await expect(page.locator(".commerce-detail")).toContainText("候选方案");
    await expect(page.locator(".commerce-detail")).toContainText("E2E Travel");
    await expect(page.locator(".commerce-detail")).toContainText("CNY 860");
    await expect(page.locator(".commerce-detail")).toContainText("退改需按航司规则");
    await expect(page.locator(".commerce-detail")).toContainText("价格可能变化");
    await expect(page.locator(".commerce-detail")).toContainText("推荐结果");
    await expect(page.locator(".commerce-detail")).toContainText("当前 provider 返回价格最低");
    await expect(page.locator(".commerce-booking-link")).toHaveCount(1);
    await expect(page.locator(".commerce-booking-link").first()).toHaveAttribute("href", "https://booking.example.test/flight-a");
    await expect(page.locator(".commerce-detail")).toContainText("预订链接不是 https，已阻断打开");
    await gotoRoute(page, "home");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("已找到 2 个候选方案");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最低价格 CNY 860");
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
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球采购计划已阻断");
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
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球采购计划已阻断");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("不会下单、付款或提交订单");
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-detail")).toContainText("已阻断");
    await expect(page.locator(".commerce-detail")).toContainText("不会下单、付款或提交订单");
    await expect(page.getByRole("button", { name:/付款|下单|提交订单/ })).toHaveCount(0);
  });

  test("private jet passport upload and inquiry submit are blocked", async () => {
    const command = runId + " 帮我上传护照并预订公务机";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球采购计划已阻断");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("不会下单、付款或提交订单，也不会上传身份证/护照或提交询价表");
    await page.locator("#commerceViewPlanBtn").click();
    await expect(page.locator(".commerce-detail")).toContainText("已阻断");
    await expect(page.locator(".commerce-detail")).toContainText("不会下单、付款或提交订单");
    await expect(page.locator(".commerce-detail")).toContainText(/不保存支付或身份信息|最终执行必须用户确认/);
  });

  test("flight payment and id upload request is blocked without upload payment or order submit", async () => {
    const command = runId + " 帮我上传身份证订机票并付款";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("全球采购计划已阻断");
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
