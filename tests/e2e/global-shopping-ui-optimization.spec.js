const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

test.describe.serial("Global Shopping zero-learning comparison UI", () => {
  let app;
  let page;
  const runId = "shopping-ui-optimization-" + Date.now();

  test.beforeAll(async () => {
    app = await launchWeishan(null);
    page = app.page;
    await gotoRoute(page, "commerce");
    await page.waitForFunction(() => !!(
      window.WeishanCommerceAgent
      && window.WeishanRealPriceMultiMerchantComparison
      && window.WeishanMerchantNativeSourceEligibilityRouter
      && window.CommerceAgentPage
    ), null, { timeout:15000 });
  });

  test.afterAll(async () => {
    if (page) await cleanupE2EData(page, runId);
    if (app) await app.close();
  });

  async function mountState(state) {
    return page.evaluate(({ id, state }) => {
      const now = new Date().toISOString();
      const makeOffer = (merchant, price, ean, suffix, title) => ({
        id:id + "-" + suffix,
        canonicalProductIdentity:"ean:" + ean,
        ean,
        merchantId:merchant.toLowerCase().replace(/[^a-z0-9]+/g, "_"),
        retailer:merchant,
        platformName:merchant + " via PrijsProfeet",
        sourceAttributionName:"PrijsProfeet",
        sourceAttributionUrl:"https://www.prijsprofeet.nl/",
        sourceType:"prijsprofeet_public_api",
        title,
        price,
        totalPrice:price,
        priceLabel:"EUR " + price.toFixed(2),
        currency:"EUR",
        condition:"NEW",
        quantity:ean === "8710398160027" ? "150 g" : "200 g",
        market:"NL",
        destinationCountry:"Netherlands",
        targetUrl:merchant === "PLUS" ? "https://www.plus.nl/product/lays-sensations-thai-sweet-chilli-150-g" : "https://www.ah.nl/producten/product/lays-sensations-thai-sweet-chilli",
        retrievedAt:now,
        updatedAt:now,
        availability:"available",
        availabilityFreshness:{ availabilityStatus:"AVAILABLE" },
        landedCostCompleteness:"partial",
        landedCostBreakdown:{ shippingFee:{ certainty:"unknown" }, taxFee:{ certainty:"unknown" }, platformFee:{ certainty:"unknown" } },
        truthEvidence:{
          evidenceTruthClass:"REAL_PROVIDER_PRICE",
          displayAsLiveCurrentPrice:true,
          currency:"EUR",
          retrievedAt:now,
          productName:title,
          variant:ean === "8710398160027" ? "150 g" : "200 g",
          condition:"NEW",
          availabilityStatus:"AVAILABLE"
        }
      });
      const offers = state.offers || [];
      const top = offers.map((row, index) => makeOffer(row.merchant, row.price, row.ean || "8710398160027", "offer-" + index, row.title || "Lays Sensations Thai Sweet Chilli 150g"));
      const related = (state.related || []).map((row, index) => makeOffer(row.merchant, row.price, row.ean, "related-" + index, row.title));
      const api = window.WeishanCommerceAgent;
      window.__WEISHAN_SHOPPING_UI_ORIGINAL_BRAIN__ = window.__WEISHAN_SHOPPING_UI_ORIGINAL_BRAIN__ || window.WeishanAiProcurementBrainOrchestrator;
      window.WeishanAiProcurementBrainOrchestrator = {
        orchestrateAiProcurementBrain(){
          return { intentStatus:"ready", procurementCategory:"product", confidence:1, missingFields:[], clarificationQuestion:"", resultSurfaceMode:"clean_user_results", preferredReasoningBackend:"local_rules", backendDecisionReason:"deterministic e2e presentation fixture", allowExternalSearch:false, allowProviderReadOnly:false, allowPayment:false, allowOrder:false, allowIdentityUpload:false, redacted:true };
        }
      };
      if (typeof api.clearCommerceTasks === "function") api.clearCommerceTasks();
      const task = api.createCommerceTask(state.query || "荷兰 chips Lays Sensations Thai Sweet Chilli 150g");
      task.taskId = id + "-" + state.name;
      task.category = "ecommerce";
      task.status = "recommended";
      task.searchStatus = state.searchStatus || (top.length ? "completed" : "idle");
      task.searchProviderName = state.sourceAvailable ? "PrijsProfeet" : "";
      task.canShowPrice = top.length > 0;
      task.canShowBookingButton = top.length > 0;
      task.canShowCheckoutButton = false;
      task.globalProcurementIntent = {
        category:"product",
        searchQueryDraft:state.query || "荷兰 chips Lays Sensations Thai Sweet Chilli 150g",
        brand:"Lays",
        model:"Sensations Thai Sweet Chilli 150g",
        productName:"Lays Sensations Thai Sweet Chilli 150g",
        destinationCountry:"NL",
        comparisonMarkets:["NL"]
      };
      task.readOnlySearchTopResults = top;
      task.readOnlySearchRemainingResults = related;
      task.readOnlySearchResultSummary = { topResults:top, remainingResults:related, candidateCount:top.length + related.length };
      task.searchResultSummary = { candidateCount:top.length + related.length, source:state.sourceAvailable ? "deterministic_ui_fixture" : "" };
      api.addCommerceTask(task);
      window.sessionStorage.setItem("weishan:commerceAgent:selectedTask:v1", task.taskId);
      window.CommerceAgentPage.mount(document.getElementById("pageHost"));
      return task.taskId;
    }, { id:runId, state });
  }

  test("makes the Human Golden two-merchant tie obvious and separates another variant", async () => {
    await mountState({
      name:"golden-tie",
      sourceAvailable:true,
      offers:[
        { merchant:"Albert Heijn", price:2 },
        { merchant:"PLUS", price:2 }
      ],
      related:[
        { merchant:"PLUS", price:2.39, ean:"8710398160999", title:"Lays Sensations Thai Sweet Chilli 200g" }
      ]
    });

    const workspace = page.locator('[data-commerce-global-shopping-workspace="true"]');
    await expect(workspace).toBeVisible();
    await expect(workspace.locator("#commerce-shopping-product-title")).toHaveText("Lays Sensations Thai Sweet Chilli 150g");
    await expect(workspace.locator("#commerce-shopping-product-title")).not.toContainText("chips");
    await expect(workspace.locator(".commerce-workspace-original-query")).toContainText("荷兰 chips Lays Sensations Thai Sweet Chilli 150g");
    await expect(workspace.locator(".commerce-shopping-comparison-summary")).toContainText("找到 2 个可验证商户报价");
    await expect(workspace.locator(".commerce-shopping-comparison-summary")).toContainText("当前已验证最低报价并列");
    await expect(workspace.getByText("当前已验证最低报价并列", { exact:true })).toHaveCount(1);
    await expect(workspace.locator(".commerce-workspace-platform-card")).toHaveCount(2);
    await expect(workspace.locator(".commerce-workspace-platform-head strong")).toHaveText(["Albert Heijn", "PLUS"]);
    await expect(workspace.locator(".commerce-workspace-platform-price")).toHaveText(["EUR 2.00", "EUR 2.00"]);
    await expect(workspace.locator(".commerce-workspace-platform-card .is-tied")).toHaveCount(2);
    await expect(workspace.locator('[data-commerce-shopping-related="true"]')).toContainText("相关商品与其他规格");
    await expect(workspace.locator('[data-commerce-shopping-related="true"]')).toContainText("200g");
    await expect(workspace.locator('[data-commerce-shopping-related="true"] .commerce-workspace-platform-card')).toHaveCount(0);
    await expect(workspace).toContainText("运费未知");
    await expect(workspace).toContainText("税费未知");
    await expect(workspace).toContainText("其他费用未知");
    const more = workspace.locator('[data-commerce-workspace-more-disclosure="true"]');
    await expect(more).not.toHaveAttribute("open", "");
    await expect(more.locator('[data-commerce-basic-ai-mode="true"]')).not.toBeVisible();
    await expect(workspace.getByText("Search / Compare / Handoff work without AI.", { exact:false })).toHaveCount(0);
    await expect(workspace.getByText(/搜索不需要 AI：|价格显示不需要 AI：|比较不需要 AI：|安全跳转不需要 AI：/)).toHaveCount(0);
    await expect(workspace.locator('[data-commerce-workspace-refresh="true"]')).toContainText("价格可能变化，可随时刷新");
    await expect(workspace.locator('[data-commerce-workspace-refresh="true"] .commerce-search-real')).toHaveText("刷新当前价格");
    const plan = workspace.locator('[data-commerce-workspace-plan="true"]');
    await expect(plan).toContainText("本次搜索");
    await expect(plan).toContainText("2 个已验证商户报价");
    await expect(plan).not.toContainText("Lays Sensations Thai Sweet Chilli 150g");
    await expect(plan.locator(".commerce-workspace-status-pill")).toHaveCount(0);
    await expect(workspace.locator('[data-commerce-workspace-records="true"]')).toContainText("购物记录");
    await expect(workspace).not.toContainText(/全网最低|市场最低|已锁价|Buy now|立即购买/);
  });

  test("uses comparator-owned lower, one-offer, zero-offer, and no-source states", async () => {
    await mountState({ name:"lower", sourceAvailable:true, offers:[{ merchant:"Albert Heijn", price:2.19 }, { merchant:"PLUS", price:1.89 }] });
    let workspace = page.locator('[data-commerce-global-shopping-workspace="true"]');
    await expect(workspace.locator(".commerce-workspace-status-pill.is-lower")).toHaveCount(1);
    await expect(workspace.locator(".commerce-workspace-status-pill.is-lower")).toContainText("当前已验证报价中较低");
    await expect(workspace.locator('[data-commerce-workspace-recommendation="true"]')).toContainText("PLUS");

    await mountState({ name:"single", sourceAvailable:true, offers:[{ merchant:"PLUS", price:2 }] });
    workspace = page.locator('[data-commerce-global-shopping-workspace="true"]');
    await expect(workspace.locator(".commerce-shopping-comparison-summary")).toContainText("当前找到 1 个可验证报价");
    await expect(workspace.locator(".commerce-shopping-comparison-summary")).toContainText("暂不足以进行商户间价格比较");
    await expect(workspace.locator('[data-commerce-workspace-recommendation="true"]')).toContainText("无法判断它是否比其他商户更低");

    await mountState({ name:"zero", sourceAvailable:true, searchStatus:"no_results", offers:[] });
    workspace = page.locator('[data-commerce-global-shopping-workspace="true"]');
    await expect(workspace.locator('[data-commerce-shopping-empty-state="zero-offer"]')).toContainText("当前没有找到可验证实时报价");
    await expect(workspace.locator(".commerce-workspace-platform-card")).toHaveCount(0);

    await mountState({ name:"no-source", sourceAvailable:false, searchStatus:"idle", offers:[] });
    workspace = page.locator('[data-commerce-global-shopping-workspace="true"]');
    await expect(workspace.locator('[data-commerce-shopping-empty-state="no-source"]')).toContainText("当前市场暂未接入可用的实时价格来源");
    await expect(workspace.locator(".commerce-workspace-platform-card")).toHaveCount(0);

    await page.evaluate(() => {
      window.I18n.setLang("en");
      window.CommerceAgentPage.mount(document.getElementById("pageHost"));
    });
    await expect(workspace.locator('[data-commerce-shopping-empty-state="no-source"]')).toContainText("No usable live price source is connected for this market");
    await page.evaluate(() => {
      window.I18n.setLang("zh");
      window.CommerceAgentPage.mount(document.getElementById("pageHost"));
    });
  });

  test("keeps one through four offers, long copy, and large prices inside every required width without render-time requests", async () => {
    await mountState({
      name:"responsive-four",
      sourceAvailable:true,
      query:"Argentina teléfono de consumo con un nombre de producto deliberadamente largo",
      offers:[
        { merchant:"Merchant With A Deliberately Long Verified Display Name", price:1564200, title:"Long product" },
        { merchant:"Second Merchant", price:1564300 },
        { merchant:"Third Merchant", price:1564400 },
        { merchant:"Fourth Merchant", price:1564500 }
      ]
    });
    const workspace = page.locator('[data-commerce-global-shopping-workspace="true"]');
    await expect(workspace.locator(".commerce-workspace-platform-card")).toHaveCount(4);
    const requestCount = await page.evaluate(() => {
      let requests = 0;
      const bridge = window.weishanGlobalShopping;
      const original = bridge && bridge.merchantNativeReadonlySearch;
      if (bridge && typeof original === "function") bridge.merchantNativeReadonlySearch = async () => { requests += 1; return { ok:true, results:[] }; };
      for (let index = 0; index < 20; index += 1) window.CommerceAgentPage.mount(document.getElementById("pageHost"));
      if (bridge && typeof original === "function") bridge.merchantNativeReadonlySearch = original;
      return requests;
    });
    expect(requestCount).toBe(0);

    for (const viewport of [
      { width:560, height:900 },
      { width:768, height:900 },
      { width:900, height:900 },
      { width:1200, height:900 },
      { width:1440, height:900 },
      { width:1720, height:1000 }
    ]) {
      if (app.mode === "electron") {
        await app.electronApp.evaluate(({ BrowserWindow }, size) => {
          const window = BrowserWindow.getAllWindows()[0];
          window.setContentSize(size.width, size.height);
        }, viewport);
        await page.waitForTimeout(100);
      } else {
        await page.setViewportSize(viewport);
      }
      const bounds = await workspace.evaluate((root) => ({
        pageOverflow:document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
        workspaceBounds:(() => {
          const box = root.getBoundingClientRect();
          return { left:box.left, right:box.right, width:box.width, viewportWidth:window.innerWidth };
        })(),
        cards:Array.from(root.querySelectorAll(".commerce-workspace-platform-card")).map((card) => {
          const box = card.getBoundingClientRect();
          return {
            overflow:card.scrollWidth > card.clientWidth + 1,
            textOutside:Array.from(card.querySelectorAll("strong,p,dd,dt,span")).some((node) => {
              const rect = node.getBoundingClientRect();
              return rect.left < box.left - 1 || rect.right > box.right + 1;
            }),
            buttonOutside:Array.from(card.querySelectorAll("button")).some((node) => {
              const rect = node.getBoundingClientRect();
              return rect.left < box.left - 1 || rect.right > box.right + 1;
            })
          };
        })
      }));
      expect(bounds.pageOverflow).toBe(false);
      expect(bounds.workspaceBounds.left, JSON.stringify({ viewport, bounds })).toBeGreaterThanOrEqual(-1);
      expect(bounds.workspaceBounds.right, JSON.stringify({ viewport, bounds })).toBeLessThanOrEqual(bounds.workspaceBounds.viewportWidth + 1);
      for (const card of bounds.cards) expect(card).toEqual({ overflow:false, textOutside:false, buttonOutside:false });
    }
  });
});
