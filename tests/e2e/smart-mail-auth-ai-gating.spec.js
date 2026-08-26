const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute } = require("./helpers");

test.describe.serial("smart mail authorization and AI gating", () => {
  let app;
  let page;

  test.beforeAll(async () => {
    app = await launchWeishan(null);
    page = app.page;
  });

  test.afterAll(async () => {
    if (app) await app.close();
  });

  test("first entry uses Smart Mail naming and asks to connect mailbox first", async () => {
    await gotoRoute(page, "mail");
    await expect(page.locator(".mail-v204-page")).toBeVisible();
    await expect(page.getByText("智能邮件").first()).toBeVisible();
    await expect(page.getByText("连接邮箱后开始使用智能邮件")).toBeVisible();
    await expect(page.getByText("邮件接管")).toHaveCount(0);
    await expect(page.getByText("Mail Takeover")).toHaveCount(0);
    await expect(page.locator("#mailConnectBtn")).toBeVisible();
    await page.locator("#mailConnectBtn").focus();
    await expect(page.locator("#mailConnectBtn")).toBeFocused();
  });

  test("connected mailbox without AI keeps basic mail usable and gates AI actions just in time", async () => {
    await page.evaluate(() => {
      window.WeishanStore.write("mail.state", {
        accounts:[{
          email:"synthetic@example.test",
          label:"Synthetic Mailbox",
          connected:true,
          status:"connected",
          message:"Synthetic connected state.",
          total:1,
          unseen:1,
          hasAuthorizationCode:true,
          lastReadAt:"2026-08-26T08:00:00.000Z",
          messages:[{
            uid:1,
            messageId:"synthetic-1",
            threadId:"thread-1",
            from:"Client <client@example.test>",
            subject:"Please review the plan",
            bodyText:"Could you review this by tomorrow?",
            receivedAt:"2026-08-26T08:00:00.000Z",
            unread:true,
            bodySynced:true
          }]
        }],
        activeEmail:"synthetic@example.test",
        lastStatus:"connected",
        lastMessage:"Synthetic connected state.",
        updatedAt:"2026-08-26T08:00:00.000Z"
      });
      window.WeishanStore.write("smartMail.connection.v1", {
        mailState:"CONNECTED",
        activeEmail:"synthetic@example.test",
        consentGiven:true,
        firstUseCompleted:true
      });
      window.WeishanStore.write("account.current", { loggedIn:false, email:"", accountId:"" });
    });
    await gotoRoute(page, "mail");
    await expect(page.getByText("智能邮件已连接")).toBeVisible();
    await expect(page.getByRole("button", { name: /synthetic@example\.test/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Please review the plan" })).toBeVisible();
    await expect(page.getByText("连接 AI 服务以使用智能功能")).toBeVisible();

    await page.locator("[data-summarize-mail]").first().click();
    await expect(page.locator(".mail-ai-gate").first()).toContainText("连接 AI 服务以使用智能功能");
    await expect(page.locator(".mail-reader-body, .mail-reader-html")).toContainText("Could you review this by tomorrow?");
  });

  test("AI alone cannot grant mailbox read authority", async () => {
    await page.evaluate(() => {
      window.WeishanStore.write("mail.state", { accounts:[], activeEmail:"", lastStatus:"idle", lastMessage:"" });
      window.WeishanStore.write("smartMail.connection.v1", { mailState:"NOT_CONNECTED" });
      window.__WEISHAN_AI_CONNECTOR_RUNTIME_STATE__ = { status:"connected", updatedAt:Date.now() };
    });
    await gotoRoute(page, "mail");
    await expect(page.getByText("连接邮箱后开始使用智能邮件")).toBeVisible();
    await expect(page.getByText("synthetic@example.test")).toHaveCount(0);
  });

  test("disconnect removes only mailbox connection state", async () => {
    await page.evaluate(() => {
      window.WeishanStore.write("mail.state", {
        accounts:[{
          email:"synthetic@example.test",
          connected:true,
          status:"connected",
          hasAuthorizationCode:false,
          messages:[{ uid:1, subject:"Message", bodyText:"Body", bodySynced:true }]
        }],
        activeEmail:"synthetic@example.test"
      });
      window.WeishanStore.write("smartMail.connection.v1", { mailState:"CONNECTED", activeEmail:"synthetic@example.test", consentGiven:true });
      window.WeishanStore.write("settings.userControl.v1", { analyticsEnabled:false, appearance:"system" });
    });
    page.once("dialog", (dialog) => dialog.accept());
    await gotoRoute(page, "mail");
    await page.locator("#mailRemoveBtn").click();
    await expect(page.getByText("连接邮箱后开始使用智能邮件")).toBeVisible();
    const state = await page.evaluate(() => ({
      mail:window.WeishanStore.read("mail.state", null),
      smart:window.WeishanStore.read("smartMail.connection.v1", null),
      settings:window.WeishanStore.read("settings.userControl.v1", null)
    }));
    expect(state.mail.accounts).toEqual([]);
    expect(state.smart).toBe(null);
    expect(state.settings.analyticsEnabled).toBe(false);
  });
});
