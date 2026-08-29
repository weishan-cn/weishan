const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

test.describe.serial("Tienda Centro merchant-native real-price display", () => {
  let app;
  let page;
  const runId = "tienda-centro-display-" + Date.now();

  test.beforeAll(async () => {
    app = await launchWeishan(null);
    page = app.page;
  });

  test.afterAll(async () => {
    if (page) await cleanupE2EData(page, runId);
    if (app) await app.close();
  });

  test("renders merchant price truth, freshness, sale semantics, and exact user-click handoff", async () => {
    await gotoRoute(page, "commerce");
    await page.waitForFunction(() => !!(
      window.WeishanCommerceAgent
      && window.WeishanTiendaCentroReadonlyAdapter
      && window.WeishanReadOnlyPriceTruthLayer
      && window.weishanGlobalShopping
      && typeof window.weishanGlobalShopping.tiendaCentroReadonlySearch === "function"
      && window.CommerceAgentPage
    ), null, { timeout:15000 });

    const taskId = await page.evaluate((id) => {
      const retrievedAt = new Date().toISOString();
      const source = {
        ok:true,
        status:"ready",
        providerId:"tienda_centro_public",
        providerName:"Tienda Centro",
        requestId:id + "-request",
        fetchedAt:retrievedAt,
        requestCount:1,
        results:[{
          productId:"14035",
          title:"CELULAR IPHONE 17 256 GB NUEVO",
          merchant:"Tienda Centro",
          price:1564200,
          currency:"ARS",
          currencyMinorUnit:0,
          regularPrice:2450000,
          salePrice:1564200,
          onSale:true,
          condition:"NEW",
          officialUrl:"https://tiendacentro.com/celulares/celular-iphone-17-256-gb-nuevo/",
          retrievedAt,
          availabilityStatus:"UNKNOWN",
          priceCompleteness:"PARTIAL_PRICE",
          priceBasis:"ITEM_TOTAL",
          shippingStatus:"UNKNOWN",
          taxStatus:"UNKNOWN",
          feesStatus:"UNKNOWN"
        }]
      };
      const normalized = window.WeishanTiendaCentroReadonlyAdapter.normalizeResult(source, { evaluatedAt:retrievedAt });
      if (!normalized.ok || normalized.candidates.length !== 1) throw new Error("fixture normalization failed");
      const api = window.WeishanCommerceAgent;
      if (typeof api.clearCommerceTasks === "function") api.clearCommerceTasks();
      const task = api.createCommerceTask(id + " CELULAR IPHONE 17 256 GB NUEVO");
      task.taskId = id + "-task";
      task.category = "ecommerce";
      task.status = "recommended";
      task.searchStatus = "completed";
      task.searchProviderName = "Tienda Centro";
      task.canShowPrice = true;
      task.canShowBookingButton = true;
      task.canShowCheckoutButton = false;
      task.readOnlySearchTopResults = normalized.candidates;
      task.readOnlySearchRemainingResults = [];
      task.readOnlySearchResultSummary = {
        rankingSummary:"当前只展示一条通过价格真实性校验的证据；费用条件不完整，不能据此判断最低价。",
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
      task.searchResultSummary = { candidateCount:1, source:"tienda_centro_main_process_public_readonly" };
      api.addCommerceTask(task);
      window.sessionStorage.setItem("weishan:commerceAgent:selectedTask:v1", task.taskId);
      window.CommerceAgentPage.mount(document.getElementById("pageHost"));
      return task.taskId;
    }, runId);

    const results = page.locator('[data-commerce-readonly-search-results="true"]');
    await expect(results).toBeVisible({ timeout:15000 });
    await expect(results.locator(".commerce-readonly-search-card")).toHaveCount(2);
    await expect(results).toContainText("CELULAR IPHONE 17 256 GB NUEVO");
    await expect(results).toContainText("ARS 1564200");
    await expect(results).toContainText("Tienda Centro 商户公开 API");
    await expect(results).toContainText("数据提供：Tienda Centro");
    await expect(results).toContainText("本次检索：");
    await expect(results).toContainText("价格时效：fresh");
    await expect(results).toContainText("商户促销价：ARS 1564200 · 常规价：ARS 2450000");
    await expect(results).toContainText("配送、税费与其他费用未知");
    await expect(results).toContainText("可用性：unknown");
    await expect(results.getByRole("button", { name:"查看数据来源" })).toBeVisible();
    await expect(results.getByRole("button", { name:"去零售商核验" })).toBeVisible();
    await expect(results).not.toContainText(/已锁价|最终总价|已下单|已付款|可结算|已确认最低价|最低价已验证/);
    await expect(results.getByRole("button", { name:/付款|下单|结算|预订/ })).toHaveCount(0);

    const truth = await page.evaluate((id) => {
      const task = window.WeishanCommerceAgent.getCommerceTaskById(id);
      const item = task.readOnlySearchTopResults[0];
      return {
        truthClass:item.truthEvidence.evidenceTruthClass,
        sourceType:item.truthEvidence.sourceType,
        live:item.truthEvidence.displayAsLiveCurrentPrice,
        comparable:item.truthEvidence.comparableAsVerifiedTotal,
        availability:item.truthEvidence.availabilityStatus,
        taxes:item.truthEvidence.taxes,
        fees:item.truthEvidence.fees,
        shipping:item.truthEvidence.shipping,
        target:item.targetUrl,
        source:item.sourceType,
        onSale:item.onSale
      };
    }, taskId);
    expect(truth).toEqual({
      truthClass:"REAL_PROVIDER_PRICE",
      sourceType:"PUBLIC_READ_ONLY",
      live:true,
      comparable:false,
      availability:"UNKNOWN",
      taxes:null,
      fees:null,
      shipping:null,
      target:"https://tiendacentro.com/celulares/celular-iphone-17-256-gb-nuevo/",
      source:"tienda_centro_public_api",
      onSale:true
    });

    await page.evaluate(() => {
      window.__WEISHAN_TIENDA_CENTRO_HANDOFF_CAPTURE__ = [];
      window.__WEISHAN_TEST_OPEN_EXTERNAL__ = (url) => window.__WEISHAN_TIENDA_CENTRO_HANDOFF_CAPTURE__.push(url);
    });
    await results.getByRole("button", { name:"去零售商核验" }).click();
    await expect.poll(() => page.evaluate(() => window.__WEISHAN_TIENDA_CENTRO_HANDOFF_CAPTURE__)).toEqual([
      "https://tiendacentro.com/celulares/celular-iphone-17-256-gb-nuevo/"
    ]);
  });

  test("does not request the merchant on route entry or repeated card render", async () => {
    const state = await page.evaluate(() => {
      let requests = 0;
      const original = window.weishanGlobalShopping.tiendaCentroReadonlySearch;
      window.weishanGlobalShopping.tiendaCentroReadonlySearch = async () => { requests += 1; return { ok:true, status:"no_results", results:[] }; };
      const host = document.getElementById("pageHost");
      for (let index = 0; index < 30; index += 1) window.CommerceAgentPage.mount(host);
      window.weishanGlobalShopping.tiendaCentroReadonlySearch = original;
      return {
        requests,
        cards:document.querySelectorAll('[data-commerce-readonly-search-results="true"]').length,
        busy:document.querySelectorAll('[aria-busy="true"]').length,
        handoffs:document.querySelectorAll(".commerce-booking-link").length
      };
    });
    expect(state.requests).toBe(0);
    expect(state.cards).toBeLessThanOrEqual(1);
    expect(state.busy).toBe(0);
    expect(state.handoffs).toBeGreaterThan(0);
  });
});
