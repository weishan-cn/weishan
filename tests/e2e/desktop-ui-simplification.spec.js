const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test.describe.serial("desktop UI simplification and function preservation", () => {
  let app;
  let page;

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test("Home keeps one dominant bottom composer after status/history", async () => {
    await gotoRoute(page, "home");
    await expect(page.locator("#commandInput")).toBeVisible();
    await expect(page.locator("#runBtn")).toBeVisible();
    await expect(page.locator("#cmdConsole")).toBeVisible();

    const metrics = await page.evaluate(() => {
      const composer = document.querySelector("#commandInput")?.closest(".cmd-input-card");
      const consoleCard = document.querySelector("#cmdConsole")?.closest(".cmd-console-card");
      const primaryButtons = Array.from(document.querySelectorAll(".home-v205-page .cmd-btn.primary"))
        .filter((button) => {
          const rect = button.getBoundingClientRect();
          const style = getComputedStyle(button);
          return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none";
        });
      const text = document.querySelector(".home-v205-page")?.innerText || "";
      return {
        consoleBeforeComposer:!!(composer && consoleCard && consoleCard.compareDocumentPosition(composer) & Node.DOCUMENT_POSITION_FOLLOWING),
        composerTop:composer ? composer.getBoundingClientRect().top : 0,
        consoleBottom:consoleCard ? consoleCard.getBoundingClientRect().bottom : 0,
        primaryButtonCount:primaryButtons.length,
        text
      };
    });

    expect(metrics.consoleBeforeComposer).toBe(true);
    expect(metrics.consoleBottom).toBeLessThanOrEqual(metrics.composerTop);
    expect(metrics.primaryButtonCount).toBe(1);
    expect(metrics.text).not.toMatch(/\bProvider\b|\bIPC\b|credential store|executionGate|productionTraffic|Cloud|Enterprise|Billing|Team/i);
  });

  test("Settings and Help stay calm while preserving privacy and support controls", async () => {
    await page.evaluate(() => window.WeishanExperienceMode.setAdvanced(false));
    await gotoRoute(page, "settings");
    await expect(page.locator("#anonymousAnalyticsToggle")).toBeVisible();
    await expect(page.locator("#helpFeedbackSupportPanel")).toBeVisible();
    await expect(page.locator("#openSupportDraft")).toBeVisible();
    await expect(page.locator("#supportDiagnosticsToggle")).toHaveCount(0);

    const ordinarySettingsText = await page.evaluate(() => [
      document.querySelector("#settingsUserControlPanel")?.innerText || "",
      document.querySelector("#helpFeedbackSupportPanel")?.innerText || ""
    ].join("\n"));
    expect(ordinarySettingsText).toContain("support@weishan.ai");
    expect(ordinarySettingsText).not.toMatch(/\bProvider\b|\/API\b|\bIPC\b|credential store|executionGate|productionTraffic/i);
    expect(ordinarySettingsText).toMatch(/不收集搜索原文|saved keys/i);

    await page.locator("#supportCategory").selectOption("bug");
    await page.locator("#supportFeedbackText").fill("Layout problem <script>alert(1)</script> executionGate=OPEN token=secret");
    const draft = await page.evaluate(() => window.WeishanInAppHelpFeedbackSupport.buildSupportMailto({
      category:document.querySelector("#supportCategory").value,
      feedbackText:document.querySelector("#supportFeedbackText").value,
      includeDiagnostics:false
    }));
    const decoded = decodeURIComponent(String(draft.url).replace(/\+/g, " "));
    expect(draft.autoSend).toBe(false);
    expect(decoded).not.toMatch(/alert\(1\)|executionGate|token=secret|api@weishan\.ai/i);
  });

  test("narrow desktop layout keeps primary Home action reachable", async () => {
    await page.setViewportSize({ width:900, height:760 });
    await gotoRoute(page, "home");
    await expect(page.locator("#commandInput")).toBeVisible();
    await expect(page.locator("#runBtn")).toBeVisible();
    const layout = await page.evaluate(() => {
      const input = document.querySelector("#commandInput").getBoundingClientRect();
      const button = document.querySelector("#runBtn").getBoundingClientRect();
      return {
        inputVisible:input.width > 300 && input.height > 70,
        buttonVisible:button.width > 40 && button.height > 24,
        inputLeft:input.left,
        buttonTop:button.top
      };
    });
    expect(layout.inputVisible).toBe(true);
    expect(layout.buttonVisible).toBe(true);
  });
});
