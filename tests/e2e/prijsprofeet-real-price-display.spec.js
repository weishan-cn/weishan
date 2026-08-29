const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

test.describe.serial("PrijsProfeet real-price display", () => {
  let app;
  let page;
  const runId = "prijsprofeet-display-" + Date.now();

  test.beforeAll(async () => {
    app = await launchWeishan(null);
    page = app.page;
  });

  test.afterAll(async () => {
    if (page) await cleanupE2EData(page, runId);
    if (app) await app.close();
  });

  test("exposes a user-triggered public price search in the normal shopping flow", async () => {
    await gotoRoute(page, "commerce");
    await page.waitForFunction(() => !!(
      window.WeishanCommerceAgent
      && window.WeishanCommerceLocationPolicy
      && window.WeishanCommerceSearch
      && window.WeishanPrijsProfeetReadonlyAdapter
      && window.weishanGlobalShopping
      && typeof window.weishanGlobalShopping.prijsProfeetReadonlySearch === "function"
      && window.CommerceAgentPage
    ), null, { timeout:15000 });

    await page.evaluate(() => {
      if (window.WeishanCommerceAgent && typeof window.WeishanCommerceAgent.clearCommerceTasks === "function") {
        window.WeishanCommerceAgent.clearCommerceTasks();
      }
      window.WeishanCommerceLocationPolicy.saveCommerceLocationPolicy({
        shippingDestination:{ country:"NL", city:"Amsterdam", source:"manual" }
      });
      window.CommerceAgentPage.mount(document.getElementById("pageHost"));
    });
    await page.getByLabel("搜索需求").fill("帮我找 Coca-Cola Original 商品价格，收货到荷兰阿姆斯特丹");
    await page.getByRole("button", { name:"生成只读搜索建议" }).click();

    const searchButton = page.getByRole("button", { name:"搜索当前价格" });
    await expect(searchButton).toBeVisible({ timeout:15000 });
    await expect(searchButton).toBeEnabled();
    await expect(page.locator(".commerce-search-panel")).toContainText("价格仅来自公开只读来源");

    await page.evaluate(() => {
      window.__WEISHAN_SAVED_COMMERCE_SEARCH__ = window.WeishanCommerceSearch;
      window.WeishanCommerceSearch = {};
      window.CommerceAgentPage.mount(document.getElementById("pageHost"));
    });
    await expect(page.locator(".commerce-search-real").first()).toBeDisabled();
    await expect(page.locator(".commerce-search-panel")).toContainText("加载完成前按钮保持禁用");
    await page.evaluate(() => {
      window.__WEISHAN_PRIJSPROFEET_CLICK_CALLS__ = 0;
      window.WeishanCommerceSearch = {
        locationHealthForCommerce() {
          return { hasShippingDestination:true };
        },
        async searchCommerceCandidates() {
        window.__WEISHAN_PRIJSPROFEET_CLICK_CALLS__ += 1;
        return {
          ok:false,
          code:"COMMERCE_NO_RESULTS",
          message:"没有找到当前有效的公开只读价格。",
          providerId:"prijsprofeet_public",
          providerName:"PrijsProfeet",
          requestCount:1,
          candidates:[],
          redacted:true,
          executionGate:"CLOSED",
          authorizesExecution:false,
          productionTraffic:false
        };
        }
      };
      window.CommerceAgentPage.mount(document.getElementById("pageHost"));
    });
    await expect(page.getByRole("button", { name:"搜索当前价格" })).toBeEnabled();
    await page.locator(".commerce-search-real").first().click();
    await page.waitForFunction(() => window.__WEISHAN_PRIJSPROFEET_CLICK_CALLS__ === 1);
    await expect.poll(() => page.evaluate(() => {
      const tasks = window.WeishanCommerceAgent.getCommerceTasks();
      return tasks[0] && tasks[0].searchStatus;
    })).toBe("no_results");
    await expect(page.locator(".commerce-search-panel")).toContainText("没有找到当前有效");
    await expect(page.locator('[data-commerce-readonly-search-results="true"]')).toHaveCount(0);
    await page.evaluate(() => {
      window.WeishanCommerceSearch = window.__WEISHAN_SAVED_COMMERCE_SEARCH__;
      delete window.__WEISHAN_SAVED_COMMERCE_SEARCH__;
    });
  });

  test("renders current public read-only price truth with attribution and exact handoff", async () => {
    await gotoRoute(page, "commerce");
    await page.waitForFunction(() => !!(
      window.WeishanCommerceAgent
      && window.WeishanPrijsProfeetReadonlyAdapter
      && window.WeishanReadOnlyPriceTruthLayer
      && window.CommerceAgentPage
    ), null, { timeout:15000 });

    const taskId = await page.evaluate((id) => {
      const retrievedAt = new Date().toISOString();
      const source = {
        ok:true,
        status:"ready",
        providerId:"prijsprofeet_public",
        providerName:"PrijsProfeet",
        requestId:id + "-request",
        fetchedAt:retrievedAt,
        requestCount:2,
        results:[{
          productId:"ah_wi477045_2026-08-24",
          title:"Coca-Cola Original",
          brand:"Coca-Cola",
          price:0.57,
          currency:"EUR",
          quantity:"250 ml",
          retailer:"albert_heijn",
          officialUrl:"https://www.ah.nl/producten/product/wi477045/coca-cola-original",
          promotionStatus:"active",
          validFrom:"2026-08-24",
          validUntil:"2026-08-30",
          extractedAt:"2026-08-28T23:00:56.089Z",
          retrievedAt,
          availabilityStatus:"UNKNOWN",
          priceCompleteness:"PARTIAL_PRICE",
          priceBasis:"ITEM_TOTAL"
        }]
      };
      const normalized = window.WeishanPrijsProfeetReadonlyAdapter.normalizeResult(source, { evaluatedAt:retrievedAt });
      if (!normalized.ok || normalized.candidates.length !== 1) throw new Error("fixture normalization failed");
      const api = window.WeishanCommerceAgent;
      const task = api.createCommerceTask(id + " Coca-Cola Original 当前价格");
      task.taskId = id + "-task";
      task.category = "ecommerce";
      task.status = "recommended";
      task.searchStatus = "completed";
      task.searchProviderName = "PrijsProfeet";
      task.canShowPrice = true;
      task.canShowBookingButton = true;
      task.canShowCheckoutButton = false;
      task.readOnlySearchTopResults = normalized.candidates;
      task.readOnlySearchRemainingResults = [];
      task.readOnlySearchResultSummary = {
        rankingSummary:"显示 1 条当前有效的公开只读商品价格。",
        topResults:normalized.candidates,
        remainingResults:[],
        candidateCount:1
      };
      task.realProviderReadonlyStatus = normalized.status;
      task.candidates = normalized.candidates.map((item) => ({
        candidateId:item.id,
        title:item.title,
        provider:item.platformName,
        sourceName:item.sourceName,
        price:item.price,
        totalPrice:item.price,
        currency:item.currency,
        url:item.targetUrl,
        realExecution:false
      }));
      task.searchResultSummary = { candidateCount:1, source:"prijsprofeet_main_process_public_readonly" };
      api.addCommerceTask(task);
      window.sessionStorage.setItem("weishan:commerceAgent:selectedTask:v1", task.taskId);
      const host = document.getElementById("pageHost");
      window.CommerceAgentPage.mount(host);
      return task.taskId;
    }, runId);

    const results = page.locator('[data-commerce-readonly-search-results="true"]');
    await expect(results).toBeVisible({ timeout:15000 });
    await expect(results).toContainText("Coca-Cola Original");
    await expect(results).toContainText("EUR 0.57");
    await expect(results).toContainText("PrijsProfeet 公开只读 API");
    await expect(results).toContainText("数据提供：PrijsProfeet");
    await expect(results).toContainText("价格有效期：2026-08-24 → 2026-08-30");
    await expect(results).toContainText("配送、税费与其他条件未知");
    await expect(results.getByRole("button", { name:"查看数据来源" })).toBeVisible();
    await expect(results.getByRole("button", { name:"去零售商核验" })).toBeVisible();
    await expect(results).not.toContainText(/已锁价|最终总价|最终决策建议|已下单|已付款|可结算|已确认最低价|最低价已验证/);
    await expect(results.getByRole("button", { name:/付款|下单|结算|预订/ })).toHaveCount(0);

    const truth = await page.evaluate((id) => {
      const task = window.WeishanCommerceAgent.getCommerceTaskById(id);
      const item = task.readOnlySearchTopResults[0];
      return {
        truthClass:item.truthEvidence.evidenceTruthClass,
        sourceType:item.truthEvidence.sourceType,
        live:item.truthEvidence.displayAsLiveCurrentPrice,
        comparable:item.truthEvidence.comparableAsVerifiedTotal,
        target:item.targetUrl,
        attribution:item.sourceAttributionUrl
      };
    }, taskId);
    expect(truth).toEqual({
      truthClass:"REAL_PROVIDER_PRICE",
      sourceType:"PUBLIC_READ_ONLY",
      live:true,
      comparable:false,
      target:"https://www.ah.nl/producten/product/wi477045/coca-cola-original",
      attribution:"https://www.prijsprofeet.nl/"
    });

    await page.evaluate(() => {
      window.__WEISHAN_PRIJSPROFEET_HANDOFF_CAPTURE__ = [];
      window.__WEISHAN_TEST_OPEN_EXTERNAL__ = (url) => window.__WEISHAN_PRIJSPROFEET_HANDOFF_CAPTURE__.push(url);
    });
    await results.getByRole("button", { name:"去零售商核验" }).click();
    await expect.poll(() => page.evaluate(() => window.__WEISHAN_PRIJSPROFEET_HANDOFF_CAPTURE__)).toEqual([
      "https://www.ah.nl/producten/product/wi477045/coca-cola-original"
    ]);
  });

  test("keeps repeated result rendering responsive without triggering provider requests", async () => {
    const state = await page.evaluate(() => {
      const before = window.__WEISHAN_PRIJSPROFEET_TEST_REQUEST_COUNT__ || 0;
      const host = document.getElementById("pageHost");
      for (let index = 0; index < 30; index += 1) window.CommerceAgentPage.mount(host);
      return {
        before,
        after:window.__WEISHAN_PRIJSPROFEET_TEST_REQUEST_COUNT__ || 0,
        cards:document.querySelectorAll('[data-commerce-readonly-search-results="true"]').length,
        busy:document.querySelectorAll('[aria-busy="true"]').length,
        handoffs:document.querySelectorAll(".commerce-booking-link").length
      };
    });
    expect(state.after).toBe(state.before);
    expect(state.cards).toBeLessThanOrEqual(1);
    expect(state.busy).toBe(0);
    expect(state.handoffs).toBeGreaterThan(0);
  });
});
