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

async function expectHomeStaticCardsRemoved(page) {
  await gotoRoute(page, "home");
  await expect(page.locator("#homeModelSelect")).toHaveCount(0);
  await expect(page.locator("[data-home-model-selector]")).toHaveCount(0);
  await expect(page.getByText("可调度模块", { exact: true })).toHaveCount(0);
}

async function expectHistory(page, query, pattern) {
  await gotoRoute(page, "history");
  await expect(page.locator("#historySearch")).toBeVisible();
  await page.locator("#historySearch").fill(query);
  await expect(page.locator("#historyList")).toBeVisible();
  await expect(page.locator("#historyList")).toContainText(pattern);
}

async function setMockSettingsAi(page, connected) {
  await page.evaluate((isConnected) => {
    if (!window.WeishanAPI) return;
    window.WeishanAPI.connector = () => isConnected ? {
      providerType:"OpenRouter",
      chatModel:"aion-labs/aion-1.0-mini",
      hasApiKey:true,
      testStatus:"success"
    } : {
      providerType:"",
      chatModel:"",
      hasApiKey:false,
      testStatus:"empty"
    };
    window.WeishanAPI.connectorStatus = () => isConnected ? "success" : "empty";
    window.WeishanAPI.chat = async () => {
      if (!isConnected) return { ok:false, error:"AI Key 未配置。" };
      return {
        ok:true,
        content:"从常规交通成本看，成都到上海通常优先比较高铁、飞机和长途客车。高铁时间稳定、总成本可控；飞机速度快但价格波动大；长途客车耗时较长。实时票价以实际查询为准。"
      };
    };
    window.dispatchEvent(new CustomEvent("weishan:command"));
  }, connected);
}

async function mockChooseFiles(page, file) {
  await page.evaluate((item) => {
    window.__WEISHAN_TEST_CHOOSE_FILES__ = async () => ({ ok:true, files:[item] });
  }, file);
}

test.describe.serial("dispatch router", () => {
  let app;
  let page;

  test.beforeAll(async ({ browser }) => {
    app = await launchWeishan(browser);
    page = app.page;
  });

  test.afterAll(async () => {
    if (page) {
      await page.evaluate((id) => {
        try {
          const keys = ["weishan:commerceAgent:lastPlan:v1", "weishan:commerceAgent:tasks:v1"];
          for (const key of keys) {
            const raw = window.localStorage.getItem(key);
            if (!raw || !raw.includes(id)) continue;
            if (key.endsWith(":tasks:v1")) {
              const tasks = JSON.parse(raw);
              window.localStorage.setItem(key, JSON.stringify((Array.isArray(tasks) ? tasks : []).filter((item) => !JSON.stringify(item).includes(id))));
            } else {
              window.localStorage.removeItem(key);
            }
          }
        } catch (_) {}
      }, runId);
      await cleanupE2EData(page, runId);
    }
    if (app) await app.close();
  });

  test("model status shows local model gateway options without provider keys", async () => {
    await expectHomeStaticCardsRemoved(page);
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

  test("traffic advice uses connected settings AI instead of refusing as realtime", async () => {
    await setMockSettingsAi(page, true);
    await gotoRoute(page, "home");
    await expect(page.getByText(/AI 已连接 · OpenRouter \/ aion-labs\/aion-1\.0-mini/).first()).toBeVisible();
    const command = runId + " 成都到上海怎么最经济？";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/高铁|飞机|实时票价以实际查询为准/).first()).toBeVisible();
    await expect(currentTaskLogs(page)).not.toContainText("AI 网关未接通");
    await expect(currentTaskLogs(page)).not.toContainText("不能给出可靠实时结果");
    await expect(currentTaskLogs(page)).not.toContainText("# 本地回答");
    await expect(currentTaskLogs(page)).not.toContainText("desktopAssistant.plan");
    await expect(currentTaskLogs(page)).not.toContainText("桌面操作计划");
    await expectHistory(page, runId, /chat\.answered|OpenRouter|aion-labs\/aion-1\.0-mini|高铁/);
  });

  test("general chat unavailable state lists local capabilities without awkward mock answers", async () => {
    await setMockSettingsAi(page, false);
    const command = runId + " weishan 能做什么？";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/AI 未接通/).first()).toBeVisible();
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

  test("commerce purchase demand routes to commerce agent instead of chat", async () => {
    const command = runId + " 帮我买一台性价比高的 MacBook，美国和日本比较，收货到中国";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("MacBook");
    await expect(page.locator("#commerceViewPlanBtn")).toBeVisible();
    await expect(currentTaskLogs(page)).not.toContainText("commerceAgent.plan");
    await expect(currentTaskLogs(page)).not.toContainText("realExecution=false");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
    await expectHistory(page, runId, /commerceAgent\.taskCreated|全球采购|MacBook/);

    await submitHomeCommand(page, runId + " 买华为1手机，中国购买，收货到成都");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("华为1手机");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
  });

  test("flight booking intent routes to commerce agent before chat", async () => {
    const command = runId + " 帮我预定 7 月 15 日成都到北京机票";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票搜索结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("成都");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("北京");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
    await expect(currentTaskLogs(page)).not.toContainText("准备调用 AI 网关");
    await expectHistory(page, runId, /commerceAgent\.taskCreated|全球采购|成都到北京机票/);
  });

  test("flight lookup phrasing routes to commerce agent before chat", async () => {
    await submitHomeCommand(page, runId + " 查 7 月 15 日成都到北京机票");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票搜索结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("成都");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("北京");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 查一下 7 月 15 日成都到北京的航班");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票搜索结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("成都");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("北京");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
  });

  test("cruise and private jet demands route to commerce agent instead of chat", async () => {
    await submitHomeCommand(page, runId + " 帮我找上海出发的邮轮");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("邮轮");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 帮我比较公务机包机价格");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("最终结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无真实价格结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("公务机");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
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

  test("software factory dispatch confirms with a professional local mock plan without generating files", async () => {
    const command = runId + " 帮我生成一个企业记账 app";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/来自首页调度中心的软件工厂任务/).first()).toBeVisible();
    await expect(page.locator("#softwareGoal")).toHaveValue(/企业记账 app/);
    await expect(page.getByText(/不会自动生成软件|不会调用 AI|确认生成/).first()).toBeVisible();
    await page.locator("#builderDispatchConfirm").click();
    await expect(page.getByText(/状态：executed|executed/).first()).toBeVisible();
    await expect(page.getByText(/本地模拟软件工厂任务结果|realExecution=false|未调用 AI/).first()).toBeVisible();
    await expect(page.getByText(/软件名称建议|核心功能模块|数据结构草案|页面\/窗口草案/).first()).toBeVisible();
    await expect(page.getByText(/MVP 范围|验收标准|下一步建议|accounts|transactions|audit_logs/).first()).toBeVisible();
    await expectHistory(page, runId, /softwareFactory\.executed|dispatch\.executed|dispatch\.confirmed|企业记账 app/);
  });

  test("home upload stages attachment metadata before command without auto execution", async () => {
    const filename = runId + "-attachment-fixture.txt";
    await gotoRoute(page, "home");
    await mockChooseFiles(page, { name:filename, type:"text/plain", size:128 });
    await page.locator("#uploadBtn").click();
    await expect(page.locator("[data-attachment-stage]")).toBeVisible();
    await expect(page.locator("[data-attachment-stage]")).toContainText(filename);
    await expect(page.locator("[data-attachment-stage]")).toContainText(/不会自动执行|不会上传云|不会读取完整文件内容/);
    await expect(page.locator("#cmdQueue")).not.toContainText(filename);
    await expect(page.locator("#cmdHistory")).not.toContainText(filename);
    await page.locator("#commandInput").fill(runId + " 继续输入文字说明");
    await expect(page.locator("#commandInput")).toHaveValue(/继续输入文字说明/);
  });

  test("home command executes after attachment plus text with metadata only", async () => {
    const filename = runId + "-analysis-fixture.txt";
    await gotoRoute(page, "home");
    await mockChooseFiles(page, { name:filename, type:"text/plain", size:256 });
    await page.locator("#uploadBtn").click();
    await expect(page.locator("[data-attachment-stage]")).toContainText(filename);
    await page.locator("#commandInput").fill(runId + " 帮我分析这个附件");
    await page.locator("#runBtn").click();
    await expect(currentTaskLogs(page)).toContainText("已挂载附件 metadata");
    await expect(currentTaskLogs(page)).toContainText(filename);
    await expect(currentTaskLogs(page)).toContainText(/未读取完整内容|未上传云/);
    await expect(page.locator("[data-attachment-stage]")).toHaveCount(0);
    await expectHistory(page, runId, /attachmentCount|attachmentNames|analysis-fixture|chat\.unavailable|chat\.answered/);
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
