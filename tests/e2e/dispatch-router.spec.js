const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2EDISPATCH-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

async function submitHomeCommand(page, text) {
  await gotoRoute(page, "home");
  await expect(page.locator("#commandInput")).toBeVisible();
  await page.locator("#commandInput").fill(text);
  await page.locator("#runBtn").click();
}

async function expectHistory(page, query, pattern) {
  await gotoRoute(page, "history");
  await expect(page.locator("#historySearch")).toBeVisible();
  await page.locator("#historySearch").fill(query);
  await expect(page.locator("#historyList")).toBeVisible();
  await expect(page.getByText(pattern).first()).toBeVisible();
}

test.describe.serial("dispatch router", () => {
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

  test("document dispatch creates a local document draft record", async () => {
    const command = runId + " 帮我写一份 weishan 产品介绍文档";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/文档草稿|主要内容|下一步/).first()).toBeVisible();
    await expectHistory(page, runId, /document|产品介绍|文档草稿/);
  });

  test("ppt dispatch creates a local outline record", async () => {
    const command = runId + " 帮我生成一份 weishan 路演 PPT 大纲";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/PPT 大纲|封面|目录/).first()).toBeVisible();
    await expectHistory(page, runId, /ppt|PPT|封面|目录/);
  });

  test("codex instruction dispatch creates a precise local instruction", async () => {
    const command = runId + " 给 Codex 一条指令，修复抓取中心 URL 校验问题";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/Codex 精确指令|允许修改文件|禁止修改文件/).first()).toBeVisible();
    await expect(page.getByText(/npm run check|不 commit|不 push/).first()).toBeVisible();
    await expectHistory(page, runId, /codex|Codex 精确指令/);
  });

  test("coordination dispatch does not fetch and records involved modules", async () => {
    const command = runId + " 抓取 https://example.com 后生成软件方案并做 PPT 大纲";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/多模块协调计划|coordination|crawler|softwareFactory|ppt/).first()).toBeVisible();
    await expectHistory(page, runId, /coordination|crawler|softwareFactory|ppt/);
  });
});
