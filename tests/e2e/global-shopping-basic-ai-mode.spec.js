const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

test.describe.serial("global shopping basic and AI enhanced mode", () => {
  let app;
  let page;
  const runId = "basic-ai-mode-" + Date.now();

  test.beforeAll(async () => {
    app = await launchWeishan(null);
    page = app.page;
  });

  test.afterAll(async () => {
    if (page) await cleanupE2EData(page, runId);
    if (app) await app.close();
  });

  test("keeps shopping search compare and handoff usable when AI is not configured", async () => {
    await gotoRoute(page, "commerce");
    await page.waitForFunction(() => !!(
      window.WeishanCommerceAgent
      && typeof window.WeishanCommerceAgent.createCommerceTask === "function"
      && typeof window.WeishanCommerceAgent.addCommerceTask === "function"
      && window.WeishanGlobalShoppingBasicAiMode
    ), null, { timeout:15000 });

    const taskId = await page.evaluate((id) => {
      const api = window.WeishanCommerceAgent;
      const task = api.createCommerceTask(id + " iPhone 17 256GB 全球比价");
      task.taskId = id + "-task";
      task.category = "ecommerce";
      task.status = "recommended";
      task.candidates = [
        {
          id:"store-a",
          title:"Apple iPhone 17 256GB",
          provider:"Source A",
          variantKey:"iphone17|256gb|new",
          condition:"new",
          totalComparablePrice:999,
          price:999,
          currency:"USD",
          availability:"IN_STOCK",
          freshness:"CURRENT",
          comparable:true,
          handoffUrl:"https://source-a.example/products/iphone-17-256",
          evidence:{ title:true, source:true, totalComparablePrice:true, currency:true, availability:true, variant:true, condition:true }
        },
        {
          id:"store-b",
          title:"Apple iPhone 17 256GB",
          provider:"Source B",
          variantKey:"iphone17|256gb|new",
          condition:"new",
          totalComparablePrice:899,
          price:899,
          currency:"USD",
          availability:"IN_STOCK",
          freshness:"CURRENT",
          comparable:true,
          handoffUrl:"https://source-b.example/products/iphone-17-256",
          evidence:{ title:true, source:true, totalComparablePrice:true, currency:true, availability:true, variant:true, condition:true }
        }
      ];
      task.readOnlySearchTopResults = task.candidates;
      task.searchStatus = "completed";
      task.searchResultSummary = { candidateCount:2, sourceEnvironment:"SYNTHETIC_E2E" };
      api.addCommerceTask(task);
      window.sessionStorage.setItem("weishan:commerceAgent:selectedTask:v1", task.taskId);
      return task.taskId;
    }, runId);

    await page.evaluate(() => {
      const host = document.getElementById("pageHost");
      if (host && window.CommerceAgentPage && typeof window.CommerceAgentPage.mount === "function") window.CommerceAgentPage.mount(host);
    });

    const basicCard = page.locator('[data-commerce-basic-ai-mode="true"]').first();
    await expect(basicCard).toBeVisible({ timeout:15000 });
    await expect(basicCard).toContainText("购物可直接用，AI 只增强分析");
    await expect(basicCard).toContainText("搜索不需要 AI：NO");
    await expect(basicCard).toContainText("价格显示不需要 AI：NO");
    await expect(basicCard).toContainText("比较不需要 AI：NO");
    await expect(basicCard).toContainText("安全跳转不需要 AI：NO");
    await expect(basicCard).toContainText("未连接：搜索、价格、比较和安全跳转仍可用");
    const basicComparison = await page.evaluate((id) => {
      const api = window.WeishanCommerceAgent;
      const task = api.getCommerceTaskById(id);
      return window.WeishanGlobalShoppingBasicAiMode.buildDeterministicComparison(task.candidates);
    }, taskId);
    expect(basicComparison.deterministicRecommendation.candidateId).toBe("store-b");
    await expect(basicCard.getByRole("button", { name:"帮我分析" })).toBeVisible();
    await expect(basicCard.getByRole("button", { name:"连接 AI 服务" })).toBeVisible();

    await basicCard.getByRole("button", { name:"帮我分析" }).focus();
    await expect(basicCard.getByRole("button", { name:"帮我分析" })).toBeFocused();
    await basicCard.getByRole("button", { name:"帮我分析" }).click();
    await expect(basicCard.locator('[data-commerce-ai-analysis-status]')).toContainText("连接 AI 服务以获得智能分析");
    await expect(page.locator(".commerce-workspace-product-card").first()).toBeVisible();
    await expect(page.locator(".commerce-workspace-platform-card")).toHaveCount(0);
    await expect(page.locator("[data-commerce-shopping-empty-state]")).toBeVisible();

    const result = await page.evaluate((id) => {
      const api = window.WeishanCommerceAgent;
      const task = api.getCommerceTaskById(id);
      const mode = window.WeishanGlobalShoppingBasicAiMode;
      return mode.requestAiAnalysis({
        aiState:"CONNECTED",
        candidates:task.candidates,
        aiOutput:{
          recommendedCandidateId:"store-b",
          summary:"Source B has the lowest comparable total.",
          claims:[{ field:"totalComparablePrice", value:"899" }, { field:"currency", value:"USD" }]
        }
      });
    }, taskId);
    expect(result.status).toBe("AI_ANALYSIS_READY");
    expect(result.basicResultsPreserved).toBe(true);
    expect(JSON.stringify(result)).not.toMatch(/api_key|secret|token|password|Authorization/i);

    const unsafe = await page.evaluate((id) => {
      const api = window.WeishanCommerceAgent;
      const task = api.getCommerceTaskById(id);
      const mode = window.WeishanGlobalShoppingBasicAiMode;
      return mode.requestAiAnalysis({
        aiState:"CONNECTED",
        candidates:task.candidates,
        aiOutput:{ recommendedCandidateId:"store-b", summary:"Buy here https://evil.example/checkout?token=abc", claims:[] }
      });
    }, taskId);
    expect(unsafe.status).toBe("AI_FAILED_SAFE");
    expect(unsafe.basicResultsPreserved).toBe(true);
  });
});
