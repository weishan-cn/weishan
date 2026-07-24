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
    await expect(page.locator("#commandInput")).toHaveAttribute("placeholder", /帮我制作一个视频/);
    await expect(page.locator("#runBtn")).toHaveText("开始");

    await page.evaluate((id) => {
      window.WeishanStore.write("command.queue.v205", [{
        id:id + "-task", text:"帮我写一份合同", status:"running", route:"ai.chat", module:"chat",
        logs:[{ time:"2026-07-24T00:00:00.000Z", type:"info", text:"command.execute -> dispatch module action" }]
      }]);
      window.dispatchEvent(new CustomEvent("weishan:command"));
    }, runId);

    const consoleText = await page.locator("#cmdConsole").innerText();
    expect(consoleText).toContain("正在处理……");
    expect(consoleText).not.toMatch(/command\.execute|chat\.answer|dispatch|module|action/i);

    const input = page.locator("#commandInput");
    await input.fill("帮我做一个视频");
    await expect(page.locator("[data-video-suggestion]")).toBeVisible();
    await expect(page.locator("[data-video-suggestion]")).toContainText("检测到这是视频创作");
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

  test("Topbar presents local-first mode without A/B mode language", async () => {
    await gotoRoute(page, "home");
    const topbar = page.locator(".topbar");
    await expect(topbar).toBeVisible();
    await expect(topbar).toContainText("本地优先模式");
    expect(await topbar.innerText()).not.toMatch(/A\/B Mode|AB Mode|A \/ B Mode/i);
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
    expect(toolsText).toContain("创作工具");
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
