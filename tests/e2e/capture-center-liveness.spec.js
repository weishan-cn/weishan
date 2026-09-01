const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test.skip(process.env.CODEX_SANDBOX === "seatbelt", "Codex seatbelt blocks canonical Electron GUI launch.");

test("repeated local Capture Center tasks keep the whole desktop responsive", async () => {
  test.setTimeout(180000);
  const app = await launchWeishan(null);
  const page = app.page;
  const metrics = {
    interactions:0,
    submissions:0,
    routeTransitions:0,
    networkRequests:0,
    dialogs:0,
    maxHeartbeatMs:0,
    dom1:0,
    dom10:0,
    dom50:0,
    heap1:0,
    heap50:0
  };
  const consoleErrors = [];
  const pageErrors = [];

  page.on("request", (request) => {
    if (/^https?:/i.test(request.url())) metrics.networkRequests += 1;
  });
  page.on("dialog", async (dialog) => {
    metrics.dialogs += 1;
    await dialog.dismiss();
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("pageerror", (error) => pageErrors.push(String(error && error.message || error)));

  async function instrument(){
    await page.evaluate(() => {
      const counts = new WeakMap();
      const originalAdd = EventTarget.prototype.addEventListener;
      const originalRemove = EventTarget.prototype.removeEventListener;
      EventTarget.prototype.addEventListener = function(type, listener, options){
        const record = counts.get(this) || {};
        record[type] = (record[type] || 0) + 1;
        counts.set(this, record);
        return originalAdd.call(this, type, listener, options);
      };
      EventTarget.prototype.removeEventListener = function(type, listener, options){
        const record = counts.get(this) || {};
        record[type] = Math.max(0, (record[type] || 0) - 1);
        counts.set(this, record);
        return originalRemove.call(this, type, listener, options);
      };
      window.__captureListenerCount = (target, type) => ((counts.get(target) || {})[type] || 0);
      window.__captureWindowListenersAtStart = window.__captureListenerCount(window, "click");
      window.__captureDocumentListenersAtStart = window.__captureListenerCount(document, "click");

      const originalSetInterval = window.setInterval.bind(window);
      const originalClearInterval = window.clearInterval.bind(window);
      const intervals = new Set();
      window.setInterval = function(callback, delay, ...args){
        const id = originalSetInterval(callback, delay, ...args);
        intervals.add(id);
        return id;
      };
      window.clearInterval = function(id){ intervals.delete(id); return originalClearInterval(id); };
      window.__captureActiveIntervals = () => intervals.size;

      window.__captureLongTasks = [];
      if (typeof PerformanceObserver === "function" && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes("longtask")) {
        const observer = new PerformanceObserver((list) => list.getEntries().forEach((entry) => window.__captureLongTasks.push(entry.duration)));
        observer.observe({ entryTypes:["longtask"] });
        window.__captureLongTaskObserver = observer;
      }
    });
  }

  async function heartbeat(){
    const elapsed = await page.evaluate(() => new Promise((resolve) => {
      const started = performance.now();
      setTimeout(() => resolve(performance.now() - started), 0);
    }));
    metrics.maxHeartbeatMs = Math.max(metrics.maxHeartbeatMs, elapsed);
    expect(elapsed).toBeLessThan(1000);
  }

  async function hitTestRoute(route){
    const button = page.locator(`.nav-item[data-route="${route}"]`).first();
    await expect(button).toBeVisible();
    const hit = await button.evaluate((target) => {
      const rect = target.getBoundingClientRect();
      const actual = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
      return {
        intended:!!actual && (actual === target || target.contains(actual)),
        actual:actual && (actual.getAttribute("data-route") || actual.id || actual.tagName),
        bodyPointerEvents:getComputedStyle(document.body).pointerEvents,
        bodyInert:document.body.inert === true || document.body.hasAttribute("inert"),
        rootInert:document.getElementById("app") && (document.getElementById("app").inert === true || document.getElementById("app").hasAttribute("inert"))
      };
    });
    expect(hit.intended, JSON.stringify(hit)).toBe(true);
    expect(hit.bodyPointerEvents).not.toBe("none");
    expect(hit.bodyInert).toBe(false);
    expect(hit.rootInert).toBe(false);
    return hit.actual;
  }

  async function route(route){
    await hitTestRoute(route);
    await page.locator(`.nav-item[data-route="${route}"]`).first().click({ timeout:5000 });
    await page.waitForFunction((expected) => window.WeishanRouter.current() === expected, route);
    metrics.interactions += 1;
    metrics.routeTransitions += 1;
    await heartbeat();
  }

  async function submit(target){
    const input = page.locator("#crawlUrl");
    const button = page.locator("#createCrawl");
    await expect(input).toBeEditable();
    await input.fill(target);
    metrics.interactions += 1;
    await button.click({ timeout:5000 });
    metrics.interactions += 1;
    metrics.submissions += 1;
    await expect(button).toBeEnabled();
    await heartbeat();
    const actual = await hitTestRoute("home");
    expect(actual).toBeTruthy();
  }

  try {
    expect(app.runtimeIdentity.buildType).toBe("SOURCE_DEV_ELECTRON");
    await page.evaluate(() => window.WeishanExperienceMode.setAdvanced(true));
    await instrument();
    await gotoRoute(page, "crawler");

    for (let index = 0; index < 3; index += 1) {
      await submit("https://example.com");
      await route("home");
      await route("crawler");
    }
    await expect(page.locator("[data-capture-result]")).toHaveCount(1);
    await expect(page.locator("#crawlerJobs")).toContainText("Example Domain");
    await expect(page.locator("#crawlerJobs")).toContainText(/本地模拟结果|Local simulated result/);
    await expect(page.locator("#crawlerJobs")).toContainText(/未访问外部网站|No external website was accessed/);
    await expect(page.locator("#pageHost")).not.toContainText(/realExecution|executionGate|authorizesExecution|productionTraffic|\bdone\b/);
    metrics.dom1 = await page.locator("#crawlerJobs *").count();
    metrics.heap1 = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0);

    for (const targetRoute of ["home", "builder", "plugins", "settings", "commerce", "mail"]) {
      await route(targetRoute);
    }
    await route("crawler");
    await page.evaluate(() => {
      window.__captureWindowListenersAtStart = window.__captureListenerCount(window, "click");
      window.__captureDocumentListenersAtStart = window.__captureListenerCount(document, "click");
    });

    for (let index = 1; index <= 49; index += 1) {
      await submit("https://example.com/item-" + index);
      if (index === 9) metrics.dom10 = await page.locator("#crawlerJobs *").count();
      await route("home");
      await route("crawler");
    }
    metrics.dom50 = await page.locator("#crawlerJobs *").count();
    metrics.heap50 = await page.evaluate(() => performance.memory ? performance.memory.usedJSHeapSize : 0);
    await expect(page.locator("[data-capture-result]")).toHaveCount(20);
    await page.locator("#crawlerJobs").evaluate((node) => { node.scrollTop = node.scrollHeight; });
    metrics.interactions += 1;
    await hitTestRoute("home");

    await page.locator("#crawlUrl").fill("");
    metrics.interactions += 1;
    for (let index = 0; index < 5; index += 1) {
      await page.locator("#createCrawl").click();
      metrics.interactions += 1;
      await expect(page.locator("#createCrawl")).toBeEnabled();
      await heartbeat();
    }
    await page.locator("#crawlUrl").fill("not a valid url");
    await page.locator("#createCrawl").click();
    metrics.interactions += 2;
    await expect(page.locator("#crawlerResult")).toContainText(/URL 格式无效|Invalid URL format/);
    await page.locator("#crawlUrl").fill("<script>window.__captureXss=1</script>");
    await page.locator("#createCrawl").click();
    metrics.interactions += 2;
    expect(await page.evaluate(() => window.__captureXss || 0)).toBe(0);
    await page.locator("#crawlUrl").evaluate((input) => { input.value = "https://example.com/" + "x".repeat(3000); });
    await page.locator("#createCrawl").click();
    metrics.interactions += 2;
    await expect(page.locator("#crawlerResult")).toContainText(/网址过长|URL is too long/);

    await page.locator("#crawlUrl").fill("https://example.com/rapid");
    metrics.interactions += 1;
    await page.locator("#createCrawl").evaluate((button) => {
      for (let index = 0; index < 10; index += 1) button.dispatchEvent(new MouseEvent("click", { bubbles:true }));
    });
    metrics.interactions += 10;
    await expect(page.locator("#createCrawl")).toBeEnabled();
    await expect(page.locator("[data-capture-result]")).toHaveCount(20);
    await heartbeat();

    for (let cycle = 0; cycle < 30; cycle += 1) {
      await route("plugins");
      await route("builder");
      await route("home");
      await route("crawler");
      await page.locator("#crawlUrl").press("Tab");
      metrics.interactions += 1;
    }

    const state = await page.evaluate(() => {
      const app = document.getElementById("app");
      const currentButton = document.getElementById("createCrawl");
      const visibleOverlays = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"], .modal-backdrop, .overlay')).filter((node) => {
        const style = getComputedStyle(node); const rect = node.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && Number(style.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
      });
      const jobs = window.WeishanStore.read("crawler.jobs", []);
      return {
        currentRoute:window.WeishanRouter.current(),
        buttonClickListeners:window.__captureListenerCount(currentButton, "click"),
        windowClickGrowth:window.__captureListenerCount(window, "click") - window.__captureWindowListenersAtStart,
        documentClickGrowth:window.__captureListenerCount(document, "click") - window.__captureDocumentListenersAtStart,
        activeIntervals:window.__captureActiveIntervals(),
        longTasks:window.__captureLongTasks.slice(),
        visibleOverlays:visibleOverlays.length,
        bodyPointerEvents:getComputedStyle(document.body).pointerEvents,
        bodyInert:document.body.inert === true || document.body.hasAttribute("inert"),
        rootInert:app && (app.inert === true || app.hasAttribute("inert")),
        pendingJobs:Array.isArray(jobs) ? jobs.filter((job) => ["queued", "pending", "running"].includes(String(job && job.status || "").toLowerCase())).length : 0,
        internalFlagLeaks:/realExecution|executionGate|authorizesExecution|productionTraffic|providerState|\bdone\b/.test(document.getElementById("pageHost").textContent || ""),
        scriptNodes:document.querySelectorAll("#crawlerJobs script").length
      };
    });

    expect(state.currentRoute).toBe("crawler");
    expect(state.buttonClickListeners).toBe(1);
    expect(state.windowClickGrowth).toBe(0);
    expect(state.documentClickGrowth).toBe(0);
    expect(state.activeIntervals).toBe(0);
    expect(state.visibleOverlays).toBe(0);
    expect(state.bodyPointerEvents).not.toBe("none");
    expect(state.bodyInert).toBe(false);
    expect(state.rootInert).toBe(false);
    expect(state.pendingJobs).toBe(0);
    expect(state.internalFlagLeaks).toBe(false);
    expect(state.scriptNodes).toBe(0);
    expect(metrics.networkRequests).toBe(0);
    expect(metrics.dialogs).toBe(0);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(metrics.interactions).toBeGreaterThanOrEqual(300);
    expect(metrics.routeTransitions).toBeGreaterThanOrEqual(100);

    console.log("CAPTURE_CENTER_LIVENESS PASS " + JSON.stringify({
      totalTaskSubmissions:metrics.submissions,
      totalRouteTransitions:metrics.routeTransitions,
      totalInteractions:metrics.interactions,
      resultDomNodes1:metrics.dom1,
      resultDomNodes10:metrics.dom10,
      resultDomNodes50:metrics.dom50,
      heapBytes1:metrics.heap1,
      heapBytes50:metrics.heap50,
      maxCaptureLongTaskMs:Math.max(0, ...state.longTasks),
      maxHeartbeatMs:Number(metrics.maxHeartbeatMs.toFixed(2)),
      duplicateVisibleCardsAfterThree:1,
      maxVisibleResults:20,
      activeIntervals:state.activeIntervals,
      pendingTasks:state.pendingJobs,
      dialogs:metrics.dialogs,
      networkRequests:metrics.networkRequests
    }));
  } finally {
    await app.close();
  }
});
