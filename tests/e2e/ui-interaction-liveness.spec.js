const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test.skip(process.env.CODEX_SANDBOX === "seatbelt", "Codex seatbelt blocks canonical Electron GUI launch.");

test("Software Factory local bug draft never blocks global navigation with a native dialog", async () => {
  const app = await launchWeishan(null);
  let blockingDialog = null;
  try {
    await app.page.evaluate(() => window.WeishanExperienceMode.setAdvanced(true));
    app.page.once("dialog", async (dialog) => {
      blockingDialog = { type:dialog.type(), message:dialog.message() };
      await dialog.dismiss();
    });

    await gotoRoute(app.page, "builder");
    await app.page.locator("#softwareGoal").fill("Synthetic local-only UI liveness report");
    await app.page.locator("#reportBug").click();

    expect(blockingDialog).toBeNull();
    await app.page.locator('.nav-item[data-route="home"]').click();
    await expect(app.page.locator("#pageHost")).not.toContainText("软件工厂");
    await expect(app.page.locator('.nav-item[data-route="home"]')).toHaveAttribute("aria-current", "page");
  } finally {
    await app.close();
  }
});

test("global interaction remains live after realistic rapid route and Software Factory stress", async () => {
  test.setTimeout(120000);
  const app = await launchWeishan(null);
  const metrics = { interactions:0, routeTransitions:0, maxRouteMs:0, maxHeartbeatMs:0, dialogs:0 };
  const consoleErrors = [];
  const pageErrors = [];
  const routeLatencies = [];
  const routeSequence = ["home", "projects", "memory", "history", "mail", "crawler", "builder", "commerce", "plugins", "settings", "security", "audit"];

  app.page.on("dialog", async (dialog) => {
    metrics.dialogs += 1;
    await dialog.dismiss();
  });
  app.page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  app.page.on("pageerror", (error) => pageErrors.push(String(error && error.message || error)));

  async function heartbeat(){
    const elapsed = await app.page.evaluate(() => new Promise((resolve) => {
      const started = performance.now();
      setTimeout(() => resolve(performance.now() - started), 0);
    }));
    metrics.maxHeartbeatMs = Math.max(metrics.maxHeartbeatMs, elapsed);
    expect(elapsed).toBeLessThan(1000);
  }

  async function assertGlobalState(){
    const state = await app.page.evaluate(() => {
      const root = document.getElementById("app");
      const style = getComputedStyle(document.body);
      const visibleBackdrops = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"], .modal-backdrop, .overlay')).filter((node) => {
        const value = getComputedStyle(node);
        const rect = node.getBoundingClientRect();
        return value.display !== "none" && value.visibility !== "hidden" && Number(value.opacity || 1) > 0 && rect.width > 0 && rect.height > 0;
      });
      return {
        bodyPointerEvents:style.pointerEvents,
        bodyInert:document.body.inert === true || document.body.hasAttribute("inert"),
        rootInert:!!root && (root.inert === true || root.hasAttribute("inert")),
        visibleBackdrops:visibleBackdrops.length,
        hostText:String(document.getElementById("pageHost") && document.getElementById("pageHost").textContent || "").trim()
      };
    });
    expect(state.bodyPointerEvents).not.toBe("none");
    expect(state.bodyInert).toBe(false);
    expect(state.rootInert).toBe(false);
    expect(state.visibleBackdrops).toBe(0);
    expect(state.hostText.length).toBeGreaterThan(0);
    await heartbeat();
  }

  async function clickRoute(route){
    const button = app.page.locator(`.nav-item[data-route="${route}"]`).first();
    await expect(button).toBeVisible();
    await button.scrollIntoViewIfNeeded();
    const hit = await button.evaluate((target) => {
      const rect = target.getBoundingClientRect();
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      const actual = document.elementFromPoint(x, y);
      const style = actual ? getComputedStyle(actual) : null;
      return {
        intended:!!actual && (actual === target || target.contains(actual)),
        pointerEvents:style && style.pointerEvents,
        tag:actual && actual.tagName,
        classes:actual && actual.className
      };
    });
    expect(hit.intended, JSON.stringify(hit)).toBe(true);
    expect(hit.pointerEvents).not.toBe("none");
    const started = Date.now();
    await button.click({ timeout:5000 });
    await app.page.waitForFunction((expected) => window.WeishanRouter && window.WeishanRouter.current() === expected, route);
    const elapsed = Date.now() - started;
    routeLatencies.push(elapsed);
    metrics.maxRouteMs = Math.max(metrics.maxRouteMs, elapsed);
    metrics.interactions += 1;
    metrics.routeTransitions += 1;
    await assertGlobalState();
  }

  async function openImageTools(){
    const button = app.page.locator('article[data-plugin-id="weishan.tools.image"] [data-plugin-route="plugin.image-tools"]').first();
    await expect(button).toBeVisible();
    await button.click({ timeout:5000 });
    await app.page.waitForFunction(() => window.WeishanRouter && window.WeishanRouter.current() === "plugin.image-tools");
    await expect(app.page.locator("#imageToolsWorkspace")).toBeVisible();
    metrics.interactions += 1;
    metrics.routeTransitions += 1;
    await assertGlobalState();
  }

  try {
    expect(app.runtimeIdentity.buildType).toBe("SOURCE_DEV_ELECTRON");
    await app.page.evaluate(() => window.WeishanExperienceMode.setAdvanced(true));
    await app.page.emulateMedia({ reducedMotion:"reduce" });
    await app.page.evaluate(() => {
      window.__uiLongTasks = [];
      if (typeof PerformanceObserver === "function" && PerformanceObserver.supportedEntryTypes && PerformanceObserver.supportedEntryTypes.includes("longtask")) {
        window.__uiLongTaskObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => window.__uiLongTasks.push(entry.duration));
        });
        window.__uiLongTaskObserver.observe({ entryTypes:["longtask"] });
      }
    });

    for (let pass = 0; pass < 5; pass += 1) {
      for (const route of routeSequence) await clickRoute(route);
    }
    for (let index = 0; index < 20; index += 1) await clickRoute(index % 2 === 0 ? "plugins" : "builder");
    for (let cycle = 0; cycle < 20; cycle += 1) {
      await clickRoute("plugins");
      await openImageTools();
      await clickRoute("builder");
      await clickRoute("plugins");
      await clickRoute("home");
    }

    await clickRoute("builder");
    await app.page.evaluate(() => {
      const validPlan = [
        "# 软件方案", "## 1. 需求摘要", "Synthetic local plan", "## 2. 推荐软件类型", "桌面工具",
        "## 3. 核心功能", "- A", "- B", "- C", "- D", "- E", "- F",
        "## 4. 页面 / 模块结构", "- A", "- B", "- C", "- D", "## 5. 建议文件结构", "src/",
        "## 6. 数据结构", "Record: id, name, createdAt", "## 7. 开发步骤", "- 1", "- 2", "- 3", "- 4", "- 5", "- 6",
        "## 8. 测试清单", "- 1", "- 2", "- 3", "- 4", "- 5", "- 6", "- 7", "- 8", "## 9. 风险与待确认问题", "- none"
      ].join("\n");
      window.WeishanAPI = Object.assign({}, window.WeishanAPI, {
        chatStream:async () => ({ ok:true, content:validPlan }),
        chat:async () => ({ ok:true, content:validPlan })
      });
    });
    await app.page.locator("#softwareType").selectOption({ label:"桌面工具" });
    await app.page.locator("#softwareGoal").fill("Synthetic local-only factory liveness plan");
    metrics.interactions += 2;
    for (let index = 0; index < 10; index += 1) {
      await app.page.locator("#createPlan").click();
      await expect(app.page.locator("#createPlan")).toBeEnabled();
      metrics.interactions += 1;
    }
    for (let index = 0; index < 10; index += 1) {
      await app.page.locator("#reportBug").click();
      metrics.interactions += 1;
    }
    expect(metrics.dialogs).toBe(0);
    await expect(app.page.locator("#softwareResult")).toContainText(/本地草稿|local draft/i);

    await app.page.evaluate(() => {
      window.WeishanAPI = Object.assign({}, window.WeishanAPI, {
        chatStream:async () => ({ ok:false, error:"SYNTHETIC_AI_FAILURE" }),
        chat:async () => ({ ok:false, error:"SYNTHETIC_AI_FAILURE" })
      });
    });
    await app.page.locator("#createPlan").click();
    metrics.interactions += 1;
    await expect(app.page.locator("#createPlan")).toBeEnabled();
    await assertGlobalState();

    await app.page.setViewportSize({ width:1000, height:720 });
    await clickRoute("home");
    await clickRoute("plugins");
    await expect(app.page.locator('article[data-plugin-id="weishan.tools.image"]').first()).toBeVisible();
    await clickRoute("builder");
    await expect(app.page.locator("#softwareType")).toBeEnabled();
    await expect(app.page.locator("#softwareGoal")).toBeEditable();
    await clickRoute("settings");
    await app.page.keyboard.press("Tab");
    await app.page.keyboard.press("Enter");
    metrics.interactions += 2;
    await heartbeat();
    await app.page.evaluate(() => window.I18n && window.I18n.setLang && window.I18n.setLang("en"));
    await clickRoute("builder");
    await expect(app.page.locator("#createPlan")).toContainText(/Generate software plan/i);
    await app.page.evaluate(() => window.I18n && window.I18n.setLang && window.I18n.setLang("zh"));
    await clickRoute("home");

    const finalState = await app.page.evaluate(() => ({
      currentRoute:window.WeishanRouter.current(),
      longTasks:Array.isArray(window.__uiLongTasks) ? window.__uiLongTasks.slice() : [],
      activeElement:document.activeElement && document.activeElement.tagName,
      fullscreenFixed:Array.from(document.querySelectorAll("*")).filter((node) => {
        const style = getComputedStyle(node); const rect = node.getBoundingClientRect();
        return style.position === "fixed" && rect.width >= innerWidth * .9 && rect.height >= innerHeight * .9;
      }).length,
      fullscreenAbsolute:Array.from(document.querySelectorAll("*")).filter((node) => {
        const style = getComputedStyle(node); const rect = node.getBoundingClientRect();
        return style.position === "absolute" && rect.width >= innerWidth * .9 && rect.height >= innerHeight * .9;
      }).length
    }));
    expect(finalState.currentRoute).toBe("home");
    expect(metrics.interactions).toBeGreaterThanOrEqual(100);
    expect(metrics.routeTransitions).toBeGreaterThanOrEqual(50);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(finalState.fullscreenFixed).toBe(0);
    expect(finalState.fullscreenAbsolute).toBe(0);

    const ordered = routeLatencies.slice().sort((a,b) => a-b);
    const percentile = (fraction) => ordered[Math.min(ordered.length - 1, Math.floor(ordered.length * fraction))] || 0;
    console.log("GLOBAL_UI_INTERACTION_LIVENESS PASS " + JSON.stringify({
      totalInteractions:metrics.interactions,
      totalRouteTransitions:metrics.routeTransitions,
      maxHeartbeatMs:Number(metrics.maxHeartbeatMs.toFixed(2)),
      p50RouteMs:percentile(.5),
      p95RouteMs:percentile(.95),
      maxRouteMs:metrics.maxRouteMs,
      maxRendererLongTaskMs:Math.max(0, ...finalState.longTasks),
      dialogs:metrics.dialogs,
      consoleErrors:consoleErrors.length,
      pageErrors:pageErrors.length
    }));
  } finally {
    await app.close();
  }
});
