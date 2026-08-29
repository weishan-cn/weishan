const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

test.describe.serial("read-only price truth layer", () => {
  let app;
  let page;
  const runId = "readonly-price-truth-" + Date.now();

  test.beforeAll(async () => {
    app = await launchWeishan(null);
    page = app.page;
  });

  test.afterAll(async () => {
    if (page) await cleanupE2EData(page, runId);
    if (app) await app.close();
  });

  test("shows a truthful no-live-price state and keeps manual handoff usable", async () => {
    await gotoRoute(page, "home");
    await page.waitForFunction(() => !!(
      window.WeishanReadOnlyPriceTruthLayer
      && window.WeishanCommerceAgent
      && window.HomePage
    ), null, { timeout:15000 });
    const expand = page.locator("#compactComposerExpandBtn");
    if (await expand.count()) await expand.click();
    await page.locator("#commandInput").fill("帮我看看9月1日成都到上海最便宜的机票");
    await page.locator("#runBtn").click();

    const summary = page.locator('[data-commerce-home-summary="true"]').filter({ hasText:"成都" }).last();
    await expect(summary).toBeVisible({ timeout:15000 });
    await expect(summary).toContainText("搜索条件已准备 · 机票搜索结果待验证");
    await expect(summary).toContainText("暂未获取到可验证的实时报价");
    await expect(summary.getByRole("button", { name:"打开 Google Flights 搜索" })).toBeVisible();
    await expect(summary).toContainText(/Sandbox|模拟|暂未获取到可验证/);

    const evidenceStates = await page.evaluate(() => {
      const api = window.WeishanReadOnlyPriceTruthLayer;
      const common = {
        domain:"FLIGHT",
        retrievedAt:"2026-08-29T10:00:00.000Z",
        evaluatedAt:"2026-08-29T10:02:00.000Z",
        currency:"CNY",
        totalPrice:820,
        priceCompleteness:"TOTAL_CONFIRMED",
        availabilityStatus:"AVAILABLE",
        originName:"成都",
        destinationName:"上海",
        originAirports:["CTU", "TFU"],
        destinationAirports:["SHA", "PVG"],
        departureDate:"2026-09-01"
      };
      const real = api.normalizePriceEvidence(Object.assign({}, common, {
        sourceId:"authorized_source",
        sourceName:"Authorized Source",
        sourceType:"PROVIDER_PRODUCTION_READ_ONLY",
        evidenceTruthClass:"REAL_PROVIDER_PRICE"
      }));
      const sandbox = api.normalizePriceEvidence(Object.assign({}, common, {
        sourceId:"sandbox_source",
        sourceName:"Sandbox Source",
        sourceType:"PROVIDER_TEST_API",
        evidenceTruthClass:"SANDBOX_TEST_DATA"
      }));
      return {
        real:api.buildPriceUserState({ records:[real] }),
        sandbox:api.buildPriceUserState({ records:[sandbox] })
      };
    });
    expect(evidenceStates.real.verifiedCount).toBe(1);
    expect(evidenceStates.real.cards[0].price).toBe(820);
    expect(evidenceStates.real.cards[0].source).toBe("Authorized Source");
    expect(evidenceStates.real.cards[0].retrievedAt).toBe("2026-08-29T10:00:00.000Z");
    expect(evidenceStates.sandbox.verifiedCount).toBe(0);
    expect(evidenceStates.sandbox.cards).toHaveLength(0);
    expect(evidenceStates.sandbox.testEvidenceSuppressedFromLiveUi).toBe(true);
  });

  test("keeps repeated price-state rendering responsive", async () => {
    const counts = await page.evaluate(() => {
      const api = window.WeishanReadOnlyPriceTruthLayer;
      const host = document.getElementById("pageHost");
      for (let index = 0; index < 20; index += 1) {
        api.buildPriceUserState({ records:[], manualHandoffAvailable:true });
        window.HomePage.mount(host);
      }
      return {
        panels:document.querySelectorAll('[data-commerce-home-summary="true"]').length,
        loading:document.querySelectorAll('[aria-busy="true"]').length,
        buttons:document.querySelectorAll("button:not([disabled])").length
      };
    });
    expect(counts.panels).toBeLessThanOrEqual(2);
    expect(counts.loading).toBe(0);
    expect(counts.buttons).toBeGreaterThan(0);
    await expect(page.locator("#pageHost")).toContainText("暂未获取到可验证的实时报价");
  });
});
