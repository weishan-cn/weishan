const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

test("Home routes a Polish furniture request to Meblostan and shows truthful price evidence", async () => {
  const runId = "meblostan-home-" + Date.now();
  const app = await launchWeishan(null);
  const page = app.page;
  try {
    await page.waitForFunction(() => !!(window.WeishanCommerceSearch && window.WeishanMeblostanReadonlyAdapter && window.weishanGlobalShopping));
    await page.evaluate(() => {
      window.WeishanCommerceLocationPolicy.saveCommerceLocationPolicy({ shippingDestination:{ country:"Poland", city:"Łódź", source:"manual" } });
      window.__WEISHAN_TEST_OPEN_EXTERNAL__ = (url) => { window.__WEISHAN_MEBLOSTAN_OPENED__ = url; };
    });

    await gotoRoute(page, "home");
    const compactExpand = page.locator("#compactComposerExpandBtn");
    if (await compactExpand.count()) await compactExpand.click();
    await page.locator("#commandInput").fill("波兰白蜡木咖啡桌");
    await page.locator("#runBtn").click();

    await expect(page.locator('[data-commerce-home-summary]')).toContainText("波兰白蜡木咖啡桌", { timeout:15000 });
    await gotoRoute(page, "commerce");
    await app.electronApp.evaluate(({ ipcMain }) => {
      globalThis.__WEISHAN_MEBLOSTAN_REQUESTS__ = [];
      ipcMain.removeHandler("global-shopping:merchant-native-readonly-search");
      ipcMain.handle("global-shopping:merchant-native-readonly-search", async (_event, request) => {
        const sourceId = request && request.sourceId;
        const payload = request && request.request;
        globalThis.__WEISHAN_MEBLOSTAN_REQUESTS__.push({ sourceId, payload });
        const retrievedAt = new Date().toISOString();
        return {
          ok:true, status:"ready", providerId:"meblostan_public", providerName:"Meblostan", requestId:payload.requestId, fetchedAt:retrievedAt, requestCount:1,
          results:[{ productId:"7332", title:"Jesionowy stolik kawowy", merchant:"Meblostan", price:1575, currency:"PLN", currencyMinorUnit:0, regularPrice:1750, salePrice:1575, onSale:true, condition:"REFURBISHED", officialUrl:"https://meblostan.pl/sklep/jesionowy-stolik-kawowy/", retrievedAt, availabilityStatus:"AVAILABLE", priceCompleteness:"PARTIAL_PRICE", priceBasis:"ITEM_TOTAL", shippingStatus:"UNKNOWN", taxStatus:"UNKNOWN", feesStatus:"UNKNOWN" }],
          redacted:true, executionGate:"CLOSED", authorizesExecution:false, productionTraffic:false
        };
      });
    });
    const searchButton = page.locator(".commerce-search-real").last();
    await expect(searchButton).toBeEnabled();
    await searchButton.click();
    await expect.poll(() => app.electronApp.evaluate(() => globalThis.__WEISHAN_MEBLOSTAN_REQUESTS__.length), { timeout:5000 }).toBe(1);
    const requestAudit = await app.electronApp.evaluate(() => globalThis.__WEISHAN_MEBLOSTAN_REQUESTS__);
    expect(requestAudit[0].sourceId).toBe("meblostan_public_api");
    expect(requestAudit[0].payload.query).toBe("Jesionowy stolik kawowy");
    expect(Object.keys(requestAudit[0].payload).sort()).toEqual(["limit", "query", "requestId"]);

    const workspace = page.locator('[data-commerce-global-shopping-workspace="true"]');
    await expect(workspace).toBeVisible({ timeout:15000 });
    await expect(workspace).toContainText("Jesionowy stolik kawowy", { timeout:15000 });
    await expect(workspace).toContainText("PLN 1575");
    await expect(workspace).toContainText("Meblostan");
    await expect(workspace).toContainText("检索时间：");
    await expect(workspace).toContainText("促销价：PLN 1575 · 常规价：PLN 1750");
    await expect(workspace).toContainText("费用不完整时不计算虚假到手总价");
    await expect(workspace).not.toContainText(/已锁价|最终总价|已下单|已付款|已确认最低价/);
    await expect(workspace.getByRole("button", { name:"去零售商核验" })).toBeVisible();

    expect(requestAudit).toHaveLength(1);

    await workspace.getByRole("button", { name:"去零售商核验" }).click();
    await expect.poll(() => page.evaluate(() => window.__WEISHAN_MEBLOSTAN_OPENED__)).toBe("https://meblostan.pl/sklep/jesionowy-stolik-kawowy/");
  } finally {
    await cleanupE2EData(page, runId);
    await app.close();
  }
});
