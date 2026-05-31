const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");

const runId = "E2EDISPATCH-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

async function submitHomeCommand(page, text) {
  await gotoRoute(page, "home");
  await expect(page.locator("#commandInput")).toBeVisible();
  await page.locator("#commandInput").fill(text);
  await page.locator("#runBtn").click();
}

function currentTaskLogs(page) {
  return page.locator(".cmd-log-list").first();
}

async function expectHistory(page, query, pattern) {
  await gotoRoute(page, "history");
  await expect(page.locator("#historySearch")).toBeVisible();
  await page.locator("#historySearch").fill(query);
  await expect(page.locator("#historyList")).toBeVisible();
  await expect(page.locator("#historyList")).toContainText(pattern);
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

  test("model status shows local model gateway options without provider keys", async () => {
    const command = runId + " 有哪些模型可以用？";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/模型状态|weishan 自动选择|GPT-compatible|Claude-compatible|Gemini-compatible|本地模型/).first()).toBeVisible();
    await expect(page.getByText(/客户端不保存 provider key|AI 网关：未接通|无法可靠回答/).first()).toBeVisible();
    await expectHistory(page, runId, /model\.statusViewed|模型状态|weishan 自动选择/);
  });

  test("model select stores a mock-safe selected model without real provider calls", async () => {
    const command = runId + " 切换到 GPT-compatible";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/已切换到 GPT-compatible|真实调用需后端模型网关接通|未调用真实模型/).first()).toBeVisible();
    await expectHistory(page, runId, /model\.selected|GPT-compatible/);
  });

  test("realtime chat requires AI gateway or search instead of fake local answers", async () => {
    const command = runId + " 成都到北京最经济的方式是什么？";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/AI 网关未接通|需要实时信息|联网搜索能力|无法可靠回答/).first()).toBeVisible();
    await expect(currentTaskLogs(page)).not.toContainText("# 本地回答");
    await expect(currentTaskLogs(page)).not.toContainText("硬座");
    await expect(currentTaskLogs(page)).not.toContainText("机票");
    await expectHistory(page, runId, /chat\.unavailable|AI 网关未接通|实时信息/);
  });

  test("general chat unavailable state lists local capabilities without awkward mock answers", async () => {
    const command = runId + " weishan 能做什么？";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/AI 网关未接通|文档草稿|PPT 大纲|Codex 指令|邮件接管|抓取中心|软件工厂/).first()).toBeVisible();
    await expect(currentTaskLogs(page)).not.toContainText("# 本地回答");
    await expect(page.getByText(/来自首页调度中心的邮件任务|来自首页调度中心的抓取任务|来自首页调度中心的软件工厂任务/)).toHaveCount(0);
    await expectHistory(page, runId, /chat\.unavailable|AI 网关未接通|文档草稿/);
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

  test("mail dispatch confirms and runs local mock execution without reading mailbox", async () => {
    const command = runId + " 帮我总结最近的重要邮件并提取待办";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/来自首页调度中心的邮件任务/).first()).toBeVisible();
    await expect(page.getByText(/邮件接管任务|提取邮件待办|不会自动读取邮箱/).first()).toBeVisible();
    await expect(page.locator("#mailDispatchConfirm")).toBeVisible();
    await page.locator("#mailDispatchConfirm").click();
    await expect(page.getByText(/状态：executed|executed/).first()).toBeVisible();
    await expect(page.getByText(/本地模拟邮件任务结果|realExecution=false|未读取真实邮箱/).first()).toBeVisible();
    await expectHistory(page, runId, /mail\.executed|dispatch\.executed|dispatch\.confirmed|mail\.extractTodos/);
  });

  test("crawler dispatch confirms and runs local mock execution without fetching", async () => {
    const command = runId + " 抓取 https://example.com 并整理成摘要";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/来自首页调度中心的抓取任务/).first()).toBeVisible();
    await expect(page.locator("#crawlUrl")).toHaveValue("https://example.com");
    await expect(page.getByText(/确认抓取|realExecution=false|用户确认/).first()).toBeVisible();
    await page.locator("#crawlerDispatchConfirm").click();
    await expect(page.getByText(/状态：executed|executed/).first()).toBeVisible();
    await expect(page.getByText(/本地模拟抓取结果|realExecution=false|未访问外网/).first()).toBeVisible();
    await expectHistory(page, runId, /crawler\.executed|dispatch\.executed|dispatch\.confirmed|https:\/\/example\.com/);
  });

  test("software factory dispatch confirms and runs local mock execution without generating files", async () => {
    const command = runId + " 帮我做一个客户管理软件方案";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/来自首页调度中心的软件工厂任务/).first()).toBeVisible();
    await expect(page.locator("#softwareGoal")).toHaveValue(/客户管理软件方案/);
    await expect(page.getByText(/不会自动生成软件|不会调用 AI|确认生成/).first()).toBeVisible();
    await page.locator("#builderDispatchConfirm").click();
    await expect(page.getByText(/状态：executed|executed/).first()).toBeVisible();
    await expect(page.getByText(/本地模拟软件工厂任务结果|realExecution=false|未调用 AI/).first()).toBeVisible();
    await expect(page.getByText(/功能模块草案|验收标准|下一步建议/).first()).toBeVisible();
    await expectHistory(page, runId, /softwareFactory\.executed|dispatch\.executed|dispatch\.confirmed|客户管理软件方案/);
  });

  test("dispatch bridge can be cancelled without executing module work", async () => {
    const command = runId + " 帮我生成一个账本软件";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/来自首页调度中心的软件工厂任务/).first()).toBeVisible();
    await page.locator("#builderDispatchCancel").click();
    await expect(page.getByText(/状态：cancelled|cancelled/).first()).toBeVisible();
    await expectHistory(page, runId, /dispatch\.cancelled|cancelled|softwareFactory\.generatePlan|账本软件/);
  });

  test("coordination dispatch does not fetch and records involved modules", async () => {
    const command = runId + " 抓取 https://example.com 后生成软件方案并做 PPT 大纲";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/多模块协调计划|coordination|crawler|softwareFactory|ppt/).first()).toBeVisible();
    await expect(page.getByText(/Step Queue|realExecution=false/).first()).toBeVisible();
    await expectHistory(page, runId, /coordination|crawler|softwareFactory|ppt/);
  });
});
