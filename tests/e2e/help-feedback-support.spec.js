const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test.describe.serial("in-app help feedback support", () => {
  let app;
  let page;

  test.beforeAll(async () => {
    app = await launchWeishan(null);
    page = app.page;
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test("settings exposes one privacy-safe Help & Feedback flow without sending mail", async () => {
    await page.evaluate(() => window.WeishanExperienceMode.setAdvanced(false));
    await gotoRoute(page, "settings");
    await expect(page.locator("#helpFeedbackSupportPanel")).toBeVisible();
    await expect(page.getByRole("heading", { name:/帮助与反馈|Help & Feedback/ })).toBeVisible();
    await expect(page.locator("#helpFeedbackSupportPanel")).toContainText("support@weishan.ai");
    await expect(page.locator("#helpFeedbackSupportPanel")).not.toContainText("api@weishan.ai");
    await expect(page.locator("#helpFeedbackSupportPanel")).not.toContainText("Mail Takeover");
    await expect(page.locator("#helpFeedbackSupportPanel")).not.toContainText("邮箱接管");
    await expect(page.locator("#helpFeedbackSupportPanel")).not.toContainText("Cloud & Enterprise");

    await expect(page.getByText("智能邮件").first()).toBeVisible();
    await expect(page.getByText("Connect AI service").first()).toBeVisible();
    await expect(page.locator("#supportDiagnosticsToggle")).toHaveCount(0);
    await page.evaluate(() => window.WeishanExperienceMode.setAdvanced(true));
    await gotoRoute(page, "settings");
    await expect(page.locator("#supportDiagnosticsHelp")).toContainText("不包含搜索原文");
    await expect(page.locator("#supportDiagnosticsHelp")).toContainText(/Mail content/i);
    await expect(page.locator("#supportDiagnosticsHelp")).toContainText(/saved keys/i);

    await page.locator("#supportCategory").selectOption("bug");
    await page.locator("#supportFeedbackText").fill("The retry button did not recover. <script>alert(1)</script> executionGate=OPEN");
    await page.locator("#supportContactEmail").fill("user@example.test");
    await page.locator("#supportDiagnosticsToggle").focus();
    await expect(page.locator("#supportDiagnosticsToggle")).toBeFocused();
    await page.keyboard.press("Space");
    await expect(page.locator("#supportDiagnosticsPreview")).toContainText("appVersion");
    await expect(page.locator("#supportDiagnosticsPreview")).toContainText("不会包含搜索原文");

    await page.locator("#openSupportDraft").focus();
    await expect(page.locator("#openSupportDraft")).toBeFocused();
    const handoff = await page.evaluate(async () => {
      const draft = window.WeishanInAppHelpFeedbackSupport.buildSupportMailto({
        category:document.querySelector("#supportCategory").value,
        feedbackText:document.querySelector("#supportFeedbackText").value,
        contactEmail:document.querySelector("#supportContactEmail").value,
        includeDiagnostics:document.querySelector("#supportDiagnosticsToggle").checked,
        diagnostics:{ appVersion:window.weishan.version, platformClass:"desktop", locale:window.I18n.lang, moduleId:"settings", safeErrorClass:"none", buildType:"SOURCE_DEV" }
      });
      return {
        url:draft.url,
        autoSend:draft.autoSend,
        deliveryConfirmedByApp:draft.deliveryConfirmedByApp,
        status:document.querySelector("#supportHandoffStatus").textContent,
        analytics:window.WeishanInAppHelpFeedbackSupport.analyticsEvent("feedback_started", "bug")
      };
    });
    expect(handoff.url).toMatch(/^mailto:support@weishan\.ai\?/);
    expect(handoff.autoSend).toBe(false);
    expect(handoff.deliveryConfirmedByApp).toBe(false);
    expect(decodeURIComponent(handoff.url)).not.toMatch(/api@weishan\.ai|rawQuery|Mail subject|credential|full URL|stack trace/i);
    expect(handoff.status).toContain("打开邮件应用不等于已经发送");
    expect(handoff.status).not.toContain("已发送");
    expect(handoff.analytics.feedbackText).toBe(null);
    expect(handoff.analytics.contactEmail).toBe(null);

    await page.locator("#clearSupportDraft").click();
    await expect(page.locator("#supportHandoffStatus")).toContainText("没有发送任何邮件");
  });
});
