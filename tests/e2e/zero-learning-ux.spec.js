const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2EZEROLEARNING-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

test.describe.serial("zero-learning user language", () => {
  let app;
  let page;

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
  });

  test.afterAll(async () => {
    if (page) await cleanupE2EData(page, runId);
    if (app) await app.close();
  });

  test("Home keeps internal command language out of the default result surface", async () => {
    await gotoRoute(page, "home");
    const layout = await page.locator(".home-v205-main").evaluate((node) => {
      const children = Array.from(node.children);
      const consoleCard = node.querySelector(".cmd-console-card");
      const composer = node.querySelector("#commandInput")?.closest(".cmd-input-card");
      const consoleBox = consoleCard.getBoundingClientRect();
      const composerBox = composer.getBoundingClientRect();
      return {
        childCount:children.length,
        gridRows:getComputedStyle(node).gridTemplateRows,
        order:[children.indexOf(consoleCard), children.indexOf(composer)],
        consoleIsPrimary:consoleBox.height > composerBox.height
      };
    });
    expect(layout.childCount).toBe(2);
    expect(layout.gridRows.trim().split(/\s+/)).toHaveLength(2);
    expect(layout.order).toEqual([0, 1]);
    expect(layout.consoleIsPrimary).toBe(true);
    await expect(page.locator(".home-v205-main textarea")).toHaveCount(1);
    await expect(page.locator("#commandInput")).toHaveAttribute("placeholder", "例如：比较 MacBook Air M4 16+512 的购买选择，或查成都到东京下周两人经济舱");
    await expect(page.locator("#decisionUnifiedQuestion, #decisionUnifiedStart")).toHaveCount(0);
    await expect(page.locator("#runBtn")).toHaveText("开始");
    await expect(page.locator("#openPluginsBtn")).toHaveText("插件");
    await expect(page.locator("#clearFinishedBtn")).toHaveCount(0);
    const consoleText = await page.locator("#cmdConsole").innerText();
    expect(consoleText).not.toMatch(/command\.execute|chat\.answer|dispatch|module|action/i);
    const homeText = await page.locator(".home-v205-page").innerText();
    expect(homeText).toContain("从一个问题开始");
    expect(homeText).toContain("提出目标");
    expect(homeText).toContain("不替你下单、订票或付款");
    expect(homeText).toContain("邮箱也不会在你连接前被读取");
    expect(homeText).not.toMatch(/\bProvider\b|\bAPI\b|\bnetwork\b|routes internally/i);

    const input = page.locator("#commandInput");
    await input.fill("帮我做一个视频");
    await expect(page.locator("[data-video-suggestion]")).toHaveCount(0);
    await page.locator("#openPluginsBtn").click();
    await expect(page.locator(".plugin-center-page")).toBeVisible();
  });

  test("ChatDock uses plain language and keeps failures technical-detail free", async () => {
    await gotoRoute(page, "home");
    await page.evaluate(() => new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "./renderer/components/ChatDock.js";
      script.nonce = document.querySelector("script[nonce]")?.nonce || "weishan-build-marker";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    }));
    await page.evaluate(() => {
      const shell = document.querySelector(".shell");
      shell.id = "shell";
      const host = document.createElement("div");
      host.id = "zeroLearningChatDockHost";
      shell.appendChild(host);
      window.CommandApi.execute = async () => {
        throw new Error("provider_error runtime_error HTTP 500 command.execute chat.answer stack trace");
      };
      window.ChatDock.mount(host);
    });

    const dock = page.locator(".chat-dock");
    await expect(dock.locator("#chatInput")).toHaveAttribute("placeholder", "告诉 Weishan 你想做什么");
    await expect(dock.locator("#chatSend")).toHaveText("开始");
    expect(await dock.innerText()).not.toMatch(/Execute|Run|Command|Dispatch|Module|Action/i);

    await dock.locator("#chatInput").fill("帮我写一份合同");
    await dock.locator("#chatSend").click();
    const log = dock.locator("#chatLog");
    await expect(log).toContainText("失败，请重试");
    expect(await log.innerText()).not.toMatch(/provider_error|runtime_error|HTTP 500|stack trace|command\.execute|chat\.answer/i);

    await page.evaluate(() => {
      document.getElementById("zeroLearningChatDockHost")?.remove();
      document.querySelector(".shell")?.removeAttribute("id");
      delete window.CommandApi.execute;
    });
  });

  test("Topbar uses one account menu and system-first language selection", async () => {
    await gotoRoute(page, "home");
    const topbar = page.locator(".topbar");
    await expect(topbar).toBeVisible();
    await expect(topbar.locator("#aiConnectionStatus")).toContainText(/AI 已连接|AI Connected/);
    await expect(topbar.locator("#workspaceBtn")).toBeVisible();
    await expect(topbar.locator("#workspaceBtn")).toHaveAttribute("title", "Workspace");
    await expect(topbar.locator("#settingsBtn, #logoutBtn, #mailBtn")).toHaveCount(0);
    await expect(topbar.locator("#langSelect option").first()).toContainText(/Follow System|跟随系统|跟隨系統/);
    await expect(topbar.locator("#langSelect option[value='zh']")).toContainText("中文（简体）");
    await expect(topbar.locator("#langSelect option[value='zh-Hant']")).toContainText("繁體中文");
    await expect(topbar.locator("#langSelect option")).toHaveCount(4);
    await expect(topbar.locator("#langSelect option[value='es'], #langSelect option[value='ja']")).toHaveCount(0);
    await expect(topbar.locator("#langSelect option[value='en']")).toContainText("English");

    await topbar.locator("#userMenuBtn").click();
    await expect(topbar.locator("#userMenu")).toBeVisible();
    await expect(topbar.locator("[data-user-menu-action='profile']")).toBeDisabled();
    await expect.poll(() => topbar.locator("[data-user-menu-action]").evaluateAll((items) => items.map((item) => item.getAttribute("data-user-menu-action")).join(","))).toBe("profile,workspace,settings,mail,logout");

    await topbar.locator("#langSelect").selectOption("en");
    await expect.poll(() => page.evaluate(() => window.I18n.getLanguagePreference().mode + ":" + window.I18n.getLang())).toBe("manual:en");
    await topbar.locator("#langSelect").selectOption("zh-Hant");
    await expect.poll(() => page.evaluate(() => window.I18n.getLanguagePreference().mode + ":" + window.I18n.getLang())).toBe("manual:zh-Hant");
    await expect.poll(() => page.evaluate(() => window.I18n.t("settings"))).toBe("設定中心");
    await page.evaluate(() => Object.defineProperty(window.navigator, "language", { value:"zh-TW", configurable:true }));
    await topbar.locator("#langSelect").selectOption("system");
    await expect.poll(() => page.evaluate(() => window.I18n.getLanguagePreference().mode + ":" + window.I18n.systemLanguage())).toBe("system:zh-Hant");
    await topbar.locator("#langSelect").selectOption("zh");
    await expect.poll(() => page.evaluate(() => window.I18n.getLanguagePreference().mode + ":" + window.I18n.getLang())).toBe("manual:zh");

    expect(await topbar.innerText()).not.toMatch(/openrouter|deepseek|A\/B Mode|AB Mode|A \/ B Mode/i);
  });

  test("supported languages refresh current UI chrome without rewriting user content", async () => {
    await gotoRoute(page, "home");
    await page.locator("#commandInput").fill("User-authored input remains unchanged");
    await page.locator(".topbar #langSelect").selectOption("en");
    await expect(page.locator("#runBtn")).toHaveText("Start");
    await expect(page.locator("#commandInput")).toHaveValue("User-authored input remains unchanged");
    await gotoRoute(page, "settings");
    await expect(page.locator(".ws-page > .ws-card h2").first()).toHaveText("Settings");
    await gotoRoute(page, "plugins");
    await expect(page.locator(".plugin-center-hero h2")).toHaveText("Plugins");
    await gotoRoute(page, "home");
    await page.locator(".topbar #langSelect").selectOption("zh-Hant");
    await expect(page.locator("#runBtn")).toHaveText("開始");
    await page.locator(".topbar #langSelect").selectOption("zh");
  });

  test("History keeps developer fields closed and saves a user-named result", async () => {
    await page.evaluate((id) => {
      window.HistoryApi.record("task.done", {
        title:"15 秒豪华跑车广告", inputSummary:"帮我做一个豪华跑车广告", outputSummary:"视频方案已经准备好", status:"done",
        taskId:id + "-task", schemaVersion:"weishan.task.v1", module:"chat", action:"chat.answer",
        artifacts:[{ artifactId:id + "-artifact", title:"视频方案", type:"markdown", filename:"weishan-chat-answer-123.md", mimeType:"text/markdown", content:"# 视频方案" }]
      });
    }, runId);
    await gotoRoute(page, "history");
    const card = page.locator("[data-history-index]").filter({ hasText:"15 秒豪华跑车广告" }).first();
    await expect(card).toBeVisible();
    await expect(card).toContainText("已完成");
    await expect(card).toContainText("视频方案");
    expect(await card.innerText()).not.toMatch(/taskId|schemaVersion|artifact/);

    await card.getByRole("button", { name:"查看详情" }).click();
    const moreInfo = card.locator(".history-more-info");
    const technicalInfo = card.locator(".history-technical-info");
    const developerInfo = card.locator(".history-developer-info");
    await expect(moreInfo).toBeVisible();
    await expect(moreInfo).not.toHaveAttribute("open", "");
    await moreInfo.locator(":scope > summary").click();
    await expect(technicalInfo).not.toHaveAttribute("open", "");
    await technicalInfo.locator(":scope > summary").click();
    await expect(developerInfo).not.toHaveAttribute("open", "");
    await developerInfo.locator(":scope > summary").click();
    await expect(developerInfo).toContainText("taskId");
    await expect(developerInfo).toContainText("schemaVersion");

    await page.evaluate(() => {
      const originalClick = HTMLAnchorElement.prototype.click;
      window.__zeroLearningDownloadClick = originalClick;
      HTMLAnchorElement.prototype.click = function() {
        window.__zeroLearningDownloadName = this.download;
        return originalClick.call(this);
      };
    });
    await card.locator(".history-artifact-download").click();
    await expect.poll(() => page.evaluate(() => window.__zeroLearningDownloadName || "")).toMatch(/15 秒豪华跑车广告.*视频方案\.md/);
    await page.evaluate(() => {
      HTMLAnchorElement.prototype.click = window.__zeroLearningDownloadClick;
      delete window.__zeroLearningDownloadClick;
      delete window.__zeroLearningDownloadName;
    });
  });

  test("Home, History, and Creative Tools use plain-language default surfaces", async () => {
    await gotoRoute(page, "home");
    const homeText = await page.locator(".home-v205-page").innerText();
    expect(homeText).not.toMatch(/Command|Dispatch|Module|Action|schemaVersion|taskId|artifact/i);

    await gotoRoute(page, "plugins");
    const toolsText = await page.locator(".plugin-center-page").innerText();
    expect(toolsText).toContain("插件");
    expect(toolsText).toContain("插件市场");
    expect(toolsText).toContain("已安装插件");
    expect(toolsText).toContain("视频制作");
    expect(toolsText).toContain("图片创作");
    expect(toolsText).not.toMatch(/Provider|Runtime|Capability|Permission|Plugin ID|Route ID/i);

    await page.evaluate(() => {
      window.WeishanPluginRegistry.pageForRoute = (routeId) => routeId === "plugin.video" ? "VideoPluginWorkspace" : "";
      window.WeishanRouter.setRoute("plugin.video");
    });
    const videoText = await page.locator("#videoPluginWorkspace").innerText();
    expect(videoText).toContain("一句话生成视频");
    expect(videoText).toContain("视频功能即将上线");
    expect(videoText).not.toMatch(/Provider|Runtime|Capability|Permission|Plugin ID|Route ID/i);
  });
});
