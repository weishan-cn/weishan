const { test, expect } = require("@playwright/test");
const { launchWeishan, gotoRoute, cleanupE2EData } = require("./helpers");
const productLanguage = require("./dispatch-product-language");

const runId = "E2EDISPATCH-" + new Date().toISOString().replace(/[-:TZ.]/g, "").slice(0, 14);

async function submitHomeCommand(page, text) {
  await gotoRoute(page, "home");
  const compactExpand = page.locator("#compactComposerExpandBtn");
  if (await compactExpand.count()) {
    await compactExpand.click();
  }
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
    const connectedSummary = await page.evaluate(() => window.WeishanAPI.connectorSummary());
    expect(connectedSummary).toMatchObject({
      state:"connected",
      provider:"OpenRouter",
      model:"aion-labs/aion-1.0-mini"
    });
    await expect(page.locator("#aiConnectionStatus")).toHaveAttribute("data-ai-state", "connected");
    await expect(page.locator("#aiConnectionStatus")).toContainText("AI 已连接");
    const command = runId + " 成都到上海怎么最经济？";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/高铁|飞机|实时票价以实际查询为准/).first()).toBeVisible();
    await expect(currentTaskLogs(page)).not.toContainText("AI 网关未接通");
    await expect(currentTaskLogs(page)).not.toContainText("不能给出可靠实时结果");
    await expect(currentTaskLogs(page)).not.toContainText("# 本地回答");
    await expect(currentTaskLogs(page)).not.toContainText("desktopAssistant.plan");
    await expect(currentTaskLogs(page)).not.toContainText("桌面操作计划");
    await expectHistory(page, runId, /chat\.answered|OpenRouter|aion-labs\/aion-1\.0-mini|高铁/);

    const localTimeCommand = runId + " 今天星期几？";
    await submitHomeCommand(page, localTimeCommand);
    await expect(currentTaskLogs(page)).toContainText(productLanguage.localTimeAnswer);
    await expect(currentTaskLogs(page)).not.toContainText(productLanguage.hiddenInternalTerms[0]);
    await expectHistory(page, localTimeCommand, /今天是星期/);
  });

  test("general chat unavailable state lists local capabilities without awkward mock answers", async () => {
    await setMockSettingsAi(page, false);
    const command = runId + " weishan 能做什么？";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/AI 未配置/).first()).toBeVisible();
    await expect(page.getByText(/AI 网关未接通|文档草稿|PPT 大纲|Codex 指令|邮件接管|抓取中心|软件工厂/).first()).toBeVisible();
    await expect(currentTaskLogs(page)).not.toContainText("# 本地回答");
    await expect(page.getByText(/来自首页调度中心的邮件任务|来自首页调度中心的抓取任务|来自首页调度中心的软件工厂任务/)).toHaveCount(0);
    await expectHistory(page, runId, /chat\.unavailable|AI 未配置|文档草稿/);
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
    const command = "帮我买一台性价比高的 MacBook，美国和日本比较，收货到中国";
    await submitHomeCommand(page, command);
    const workspace = page.locator('[data-commerce-home-summary] [data-commerce-global-shopping-workspace="true"]');
    await expect(workspace).toBeVisible();
    await expect(workspace).toContainText("MacBook");
    await expect(workspace).toContainText(/当前已验证报价|商户报价比较/);
    await expect(workspace.locator("details.commerce-workspace-execution-log")).not.toHaveAttribute("open", "");
    await expect(workspace.locator("details.commerce-technical-disclosure")).not.toHaveAttribute("open", "");
    await expect(page.locator(".home-v205-side")).toHaveCount(0);
    await expect(page.locator("#cmdConsole .cmd-log-list")).toHaveCount(0);
    await expectHistory(page, "MacBook", /commerceAgent\.taskCreated|全球采购|MacBook/);

    await submitHomeCommand(page, "买华为1手机，中国购买，收货到成都");
    await expect(page.locator('[data-commerce-home-summary] [data-commerce-global-shopping-workspace="true"]')).toContainText("手机");
    await expect(page.locator("#cmdConsole .cmd-log-list")).toHaveCount(0);
  });

  test("recognized product keeps the preferred shopping workspace when the current market has no live source", async () => {
    await page.evaluate(() => {
      window.WeishanCommerceLocationPolicy.saveCommerceLocationPolicy({
        shippingDestination:{ country:"United Kingdom", city:"London", source:"manual" }
      });
    });
    await submitHomeCommand(page, "IPHONE 17");
    const workspace = page.locator('[data-commerce-home-summary] [data-commerce-global-shopping-workspace="true"]');
    await expect(workspace).toBeVisible();
    await expect(workspace).toContainText("IPHONE 17");
    await expect(workspace).toContainText(/当前已验证报价|商户报价比较/);
    await expect(workspace).toContainText("预计到手成本");
    await expect(workspace).toContainText("唯珊建议");
    await expect(workspace).toContainText("暂未接入该市场的实时价格来源");
    await expect(workspace).not.toContainText("AI 大脑采购编排");
    await expect(workspace).not.toContainText(/Official Store|Major Marketplace/);
    await expect(workspace).not.toContainText(/ARS|EUR/);
  });

  test("four exact human country plus product inputs reach preferred shopping without AI", async () => {
    await page.evaluate(() => {
      if (window.WeishanCommerceAgent && typeof window.WeishanCommerceAgent.clearCommerceTasks === "function") window.WeishanCommerceAgent.clearCommerceTasks();
      window.__WEISHAN_TEST_ORIGINAL_COMMERCE_SEARCH__ = window.WeishanCommerceSearch.searchCommerceCandidates;
      window.WeishanCommerceSearch.searchCommerceCandidates = async (task) => ({
        ok:false,
        code:"COMMERCE_NO_LOCAL_REAL_PRICE_SOURCE",
        message:"暂未接入该市场的实时价格来源。",
        request:{ query:task.inputSummary, missingFields:[] },
        candidates:[],
        readOnlySearchTopResults:[],
        readOnlySearchRemainingResults:[]
      });
    });

    const cases = [
      { input:"英国 iPhone 17pro", market:"United Kingdom", price:null },
      { input:"阿根廷 iPhone 17pro", market:"Argentina", price:null },
      { input:"阿根廷可口可乐", market:"Argentina", price:null },
      { input:"荷兰可口可乐", market:"Netherlands", price:null }
    ];
    try {
      for (const item of cases) {
        await submitHomeCommand(page, item.input);
        const workspace = page.locator('[data-commerce-home-summary] [data-commerce-global-shopping-workspace="true"]');
        await expect(workspace).toBeVisible();
        await expect(workspace).toContainText(item.market);
        await expect(workspace).toContainText(/当前已验证报价|商户报价比较/);
        await expect(workspace).not.toContainText(/coordination\.plan|AI Key 未配置|realExecution=false|AI 大脑采购编排/);
        await expect(workspace).not.toContainText(/EUR 0\.57|ARS\s*\d/);
      }
    } finally {
      await page.evaluate(() => {
        window.WeishanCommerceSearch.searchCommerceCandidates = window.__WEISHAN_TEST_ORIGINAL_COMMERCE_SEARCH__;
        delete window.__WEISHAN_TEST_ORIGINAL_COMMERCE_SEARCH__;
      });
    }

    const evidence = await page.evaluate(() => ({
      tasks:window.WeishanCommerceAgent.getCommerceTasks().slice(0, 4).map((task) => ({ input:task.inputSummary, category:task.category }))
    }));
    expect(evidence.tasks.every((task) => task.category === "ecommerce")).toBe(true);
  });

  test("flight booking intent routes to commerce agent before chat", async () => {
    const command = runId + " 帮我预定 7 月 15 日成都到北京机票";
    await submitHomeCommand(page, command);
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票搜索结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无生产真实最低价");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("只读候选价");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("以平台页面为准");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("不会付款或下单");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("成都");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("北京");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
    await expect(currentTaskLogs(page)).not.toContainText("准备调用 AI 网关");
    await expectHistory(page, runId, /commerceAgent\.taskCreated|全球采购|成都到北京机票/);
  });

  test("flight lookup phrasing routes to commerce agent before chat", async () => {
    await submitHomeCommand(page, runId + " 查 7 月 15 日成都到北京机票");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票搜索结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无生产真实最低价");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("只读候选价");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("以平台页面为准");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("不会付款或下单");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("成都");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("北京");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");

    await submitHomeCommand(page, runId + " 查一下 7 月 15 日成都到北京的航班");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("机票搜索结果");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("暂无生产真实最低价");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("只读候选价");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("以平台页面为准");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("不会付款或下单");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("成都");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("北京");
    await expect(currentTaskLogs(page)).not.toContainText("chat.answer");
  });

  test("cruise and private jet demands route to commerce agent instead of chat", async () => {
    await submitHomeCommand(page, runId + " 帮我找上海出发的邮轮");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前已验证报价");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前没有找到可验证的实时报价");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("邮轮");

    await submitHomeCommand(page, runId + " 帮我比较公务机包机价格");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前已验证报价");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("当前没有找到可验证的实时报价");
    await expect(page.locator("[data-commerce-home-summary]")).toContainText("公务机");
  });

  test("mail dispatch confirms and runs local mock execution without reading mailbox", async () => {
    const command = runId + " 帮我总结最近的重要邮件并提取待办";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/来自首页调度中心的智能邮件任务/).first()).toBeVisible();
    await expect(page.getByText(/智能邮件任务|提取邮件待办|不会自动读取邮箱/).first()).toBeVisible();
    await expect(page.locator("#mailDispatchConfirm")).toBeVisible();
    await page.locator("#mailDispatchConfirm").click();
    await expect(page.getByText(/状态：executed|executed/).first()).toBeVisible();
    await expect(page.getByText(/本地模拟邮件任务结果|realExecution=false|未读取真实邮箱/).first()).toBeVisible();
    await expectHistory(page, runId, /mail\.executed|dispatch\.executed|dispatch\.confirmed|mail\.extractTodos/);
  });

  test("mail evidence words route to Mail instead of shopping or travel", async () => {
    const command = runId + " 找上个月苹果电脑发票";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/来自首页调度中心的智能邮件任务/).first()).toBeVisible();
    await expect(page.getByText(/不会自动读取邮箱|realExecution=false/).first()).toBeVisible();
    await expect(page.locator("#mailDispatchConfirm")).toBeVisible();
    await expect(page.locator("[data-commerce-home-summary]")).toHaveCount(0);
    await expectHistory(page, runId, /mail\.open|dispatch\.pending|苹果电脑发票/);
  });

  test("ambiguous travel fragment asks for clarification instead of routing confidently", async () => {
    const command = runId + " 东京酒店";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/需要你确认一下方向/).first()).toBeVisible();
    await expect(page.getByText(/搜索价格|在邮件里找已有凭证|没有读取邮箱、没有搜索 provider/).first()).toBeVisible();
    await expect(page.locator("[data-commerce-home-summary]")).toHaveCount(0);
    await expect(currentTaskLogs(page)).not.toContainText("commerceAgent.taskCreated");
    await expectHistory(page, runId, /需要你确认一下方向|coordination/);
  });

  test("crawler dispatch confirms and runs local mock execution without fetching", async () => {
    const command = runId + " 抓取 https://example.com 并整理成摘要";
    await submitHomeCommand(page, command);
    await expect(page.getByText(/来自首页调度中心的抓取任务/).first()).toBeVisible();
    await expect(page.locator("#crawlUrl")).toHaveValue("https://example.com");
    await expect(page.getByText(/确认抓取|realExecution=false|用户确认/).first()).toBeVisible();
    await page.locator("#crawlerDispatchConfirm").click();
    await expect(page.getByText(/状态：本地模拟结果|Local simulated result/).first()).toBeVisible();
    await expect(page.getByText(/本地模拟结果|未访问外部网站|No external website was accessed/).first()).toBeVisible();
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
    await expect(page.locator("[data-attachment-stage]")).toContainText(productLanguage.attachmentSafety);
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
    await expect(currentTaskLogs(page)).toContainText(productLanguage.processing);
    await expect(currentTaskLogs(page)).not.toContainText(productLanguage.hiddenInternalTerms[1]);
    await expect(currentTaskLogs(page)).not.toContainText(productLanguage.hiddenInternalTerms[2]);
    await expect(currentTaskLogs(page)).not.toContainText(productLanguage.hiddenInternalTerms[3]);
    await expect(page.locator("[data-attachment-stage]")).toHaveCount(0);
    await expectHistory(page, runId, /帮我分析这个附件|AI 未配置|高铁/);
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
