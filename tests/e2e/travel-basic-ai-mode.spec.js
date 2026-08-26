const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

test.describe.serial("travel basic and AI enhanced mode", () => {
  let app;
  let page;
  const runId = "travel-basic-ai-mode-" + Date.now();

  test.beforeAll(async () => {
    app = await launchWeishan(null);
    page = app.page;
  });

  test.afterAll(async () => {
    if (page) await cleanupE2EData(page, runId);
    if (app) await app.close();
  });

  test("keeps flight hotel and cruise basic work usable when AI is not configured", async () => {
    await gotoRoute(page, "commerce");
    await page.waitForFunction(() => !!(
      window.WeishanCommerceAgent
      && typeof window.WeishanCommerceAgent.createCommerceTask === "function"
      && typeof window.WeishanCommerceAgent.addCommerceTask === "function"
      && window.WeishanTravelBasicAiMode
    ), null, { timeout:15000 });

    const taskId = await page.evaluate((id) => {
      const api = window.WeishanCommerceAgent;
      const task = api.createCommerceTask(id + " SFO to NRT flight 2027-03-01 lowest price");
      task.taskId = id + "-flight-task";
      task.category = "flight";
      task.status = "recommended";
      task.candidates = [
        {
          id:"flight-a",
          domain:"flight",
          title:"Flight A",
          provider:"Synthetic Airline A",
          sourceEnvironment:"LIVE",
          sourceRole:"READ_ONLY_PRICE_SOURCE",
          origin:"SFO",
          destination:"NRT",
          departureDate:"2027-03-01",
          passengers:1,
          cabin:"economy",
          nonstop:true,
          totalComparableCost:820,
          price:820,
          currency:"USD",
          availability:"AVAILABLE",
          freshness:"CURRENT",
          priceBasis:"TOTAL_PARTY",
          comparable:true,
          handoffUrl:"https://airline-a.example/flights/sfo-nrt",
          evidence:{ origin:"SFO", destination:"NRT", departureDate:"2027-03-01", passengers:1, cabin:"economy", totalComparableCost:820, currency:"USD", availability:"AVAILABLE" }
        },
        {
          id:"flight-b",
          domain:"flight",
          title:"Flight B",
          provider:"Synthetic Airline B",
          sourceEnvironment:"LIVE",
          sourceRole:"READ_ONLY_PRICE_SOURCE",
          origin:"SFO",
          destination:"NRT",
          departureDate:"2027-03-01",
          passengers:1,
          cabin:"economy",
          nonstop:true,
          totalComparableCost:760,
          price:760,
          currency:"USD",
          availability:"AVAILABLE",
          freshness:"CURRENT",
          priceBasis:"TOTAL_PARTY",
          comparable:true,
          handoffUrl:"https://airline-b.example/flights/sfo-nrt",
          evidence:{ origin:"SFO", destination:"NRT", departureDate:"2027-03-01", passengers:1, cabin:"economy", totalComparableCost:760, currency:"USD", availability:"AVAILABLE" }
        }
      ];
      task.readOnlySearchTopResults = task.candidates;
      api.addCommerceTask(task);
      window.sessionStorage.setItem("weishan:commerceAgent:selectedTask:v1", task.taskId);
      return task.taskId;
    }, runId);

    await page.evaluate(() => {
      const host = document.getElementById("pageHost");
      if (host && window.CommerceAgentPage && typeof window.CommerceAgentPage.mount === "function") window.CommerceAgentPage.mount(host);
    });

    const travelCard = page.locator('[data-travel-basic-ai-mode="true"]').first();
    await expect(travelCard).toBeVisible({ timeout:15000 });
    await expect(travelCard).toContainText("旅行可直接用，AI 只增强行程分析");
    await expect(travelCard).toContainText("搜索不需要 AI：NO");
    await expect(travelCard).toContainText("价格显示不需要 AI：NO");
    await expect(travelCard).toContainText("比较不需要 AI：NO");
    await expect(travelCard).toContainText("安全跳转不需要 AI：NO");
    await expect(travelCard).toContainText("未连接：搜索、价格、比较和安全跳转仍可用");
    await expect(travelCard.getByRole("button", { name:"帮我分析" })).toBeVisible();
    await expect(travelCard.getByRole("button", { name:"连接 AI 服务" })).toBeVisible();

    const comparison = await page.evaluate((id) => {
      const task = window.WeishanCommerceAgent.getCommerceTaskById(id);
      return window.WeishanTravelBasicAiMode.buildDeterministicComparison(task.candidates, {
        domain:"flight",
        context:{ origin:"SFO", destination:"NRT", departureDate:"2027-03-01", passengers:1, cabin:"economy" }
      });
    }, taskId);
    expect(comparison.deterministicRecommendation.candidateId).toBe("flight-b");

    await travelCard.getByRole("button", { name:"帮我分析" }).focus();
    await expect(travelCard.getByRole("button", { name:"帮我分析" })).toBeFocused();
    await travelCard.getByRole("button", { name:"帮我分析" }).click();
    await expect(travelCard.locator('[data-travel-ai-analysis-status]')).toContainText("连接 AI 服务以获得智能行程分析");

    const crossDomain = await page.evaluate(() => {
      const mode = window.WeishanTravelBasicAiMode;
      const hotel = mode.buildViewModel({
        domain:"hotel",
        aiState:"NOT_CONFIGURED",
        context:{ propertyId:"h-1", checkIn:"2027-04-10", checkOut:"2027-04-12", occupancy:"2 adults", roomType:"King" },
        results:[
          { id:"hotel-a", domain:"hotel", title:"Hotel A", provider:"Hotel Source A", sourceEnvironment:"LIVE", sourceRole:"READ_ONLY_PRICE_SOURCE", propertyId:"h-1", propertyName:"Hotel A", checkIn:"2027-04-10", checkOut:"2027-04-12", occupancy:"2 adults", roomType:"King", totalComparableCost:420, price:420, currency:"USD", availability:"AVAILABLE", freshness:"CURRENT", priceBasis:"TOTAL_STAY", comparable:true, handoffUrl:"https://hotel.example/h-1", evidence:{ propertyName:"Hotel A", totalComparableCost:420, currency:"USD" } }
        ]
      });
      const cruise = mode.buildViewModel({
        domain:"cruise",
        aiState:"CONNECTED",
        context:{ sailingId:"s-1", departureDate:"2027-05-20", occupancy:"2 adults", cabin:"balcony" },
        results:[
          { id:"cruise-a", domain:"cruise", title:"Cruise A", provider:"Cruise Source A", sourceEnvironment:"LIVE", sourceRole:"READ_ONLY_PRICE_SOURCE", ship:"Ship A", sailingId:"s-1", departureDate:"2027-05-20", occupancy:"2 adults", cabinType:"balcony", totalComparableCost:1900, price:1900, currency:"USD", availability:"AVAILABLE", freshness:"CURRENT", priceBasis:"TOTAL_PARTY", comparable:true, handoffUrl:"https://cruise.example/s-1", evidence:{ ship:"Ship A", totalComparableCost:1900, currency:"USD" } }
        ]
      });
      const unsafeAi = mode.requestAiAnalysis({
        domain:"cruise",
        aiState:"CONNECTED",
        results:cruise.results,
        aiOutput:{ recommendedResultId:"cruise-a", summary:"Go pay at https://evil.example/pay?token=abc", claims:[] }
      });
      return { hotel, cruise, unsafeAi };
    });
    expect(crossDomain.hotel.basicAvailable).toBe(true);
    expect(crossDomain.hotel.aiAnalysisAvailable).toBe(false);
    expect(crossDomain.cruise.basicAvailable).toBe(true);
    expect(crossDomain.cruise.aiAnalysisAvailable).toBe(true);
    expect(crossDomain.unsafeAi.status).toBe("AI_FAILED_SAFE");
    expect(crossDomain.unsafeAi.basicResultsPreserved).toBe(true);
    expect(JSON.stringify(crossDomain)).not.toMatch(/Bearer\s+|sk-[A-Za-z0-9_-]{8,}|password[:=]|api[_-]?key[:=]|token[:=]/i);
  });
});
