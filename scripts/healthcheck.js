const { existsSync, readFileSync, readdirSync, statSync } = require("fs");
const { join, relative } = require("path");
const { runSecretScan } = require("./secret-scan");

const root = join(__dirname, "..");

function readText(file) {
  try {
    return readFileSync(join(root, file), "utf8");
  } catch (_) {
    return "";
  }
}

function result(name, status, detail, suggestion) {
  return { name, status, detail, suggestion: suggestion || "" };
}

function hasFile(file) {
  return existsSync(join(root, file));
}

function statusRank(status) {
  if (status === "fail") return 3;
  if (status === "warn") return 2;
  return 1;
}

function overall(results) {
  if (results.some((item) => item.status === "fail")) return "FAIL";
  if (results.some((item) => item.status === "warn")) return "WARN";
  return "PASS";
}

function checkFiles() {
  const files = [
    "apps/desktop/src/main.js",
    "apps/desktop/src/preload.js",
    "apps/desktop/src/renderer/main.js",
    "apps/desktop/src/renderer/routes/HomePage.js",
    "apps/desktop/src/renderer/routes/MailPage.js",
    "apps/desktop/src/renderer/routes/CrawlerPage.js",
    "apps/desktop/src/renderer/routes/BuilderPage.js",
    "apps/desktop/src/renderer/routes/ProjectsPage.js",
    "apps/desktop/src/renderer/routes/MemoryPage.js",
    "apps/desktop/src/renderer/routes/HistoryPage.js",
    "apps/desktop/src/renderer/routes/AuditPage.js",
    "apps/desktop/src/renderer/routes/SecurityPage.js",
    "apps/desktop/src/renderer/core/enterpriseSecurity.js",
    "apps/desktop/src/renderer/core/dispatchRouter.js",
    "apps/desktop/src/renderer/core/repairCenter.js",
    "apps/desktop/src/renderer/core/taskProtocol.js",
    "apps/server/src/cloud/storageAdapter.js",
    "apps/server/src/cloud/providers/localMockStorageAdapter.js",
    "apps/server/src/cloud/providers/s3CompatibleStorageAdapter.js",
    "apps/server/src/cloud/metadataAdapter.js",
    "apps/server/src/cloud/cloudService.js",
    "apps/server/src/cloud/cloudHealthcheck.js"
  ];
  return files.map((file) => result("file:" + file, hasFile(file) ? "pass" : "fail", hasFile(file) ? "exists" : "missing", "Restore the expected project file."));
}

function checkPackageScripts() {
  const pkg = JSON.parse(readText("package.json") || "{}");
  const scripts = pkg.scripts || {};
  return ["check", "dev:desktop", "healthcheck", "secrets:scan", "test:api", "test:e2e", "test:e2e:smoke", "test:e2e:repair", "test:e2e:dispatch", "test:e2e:cloud"].map((script) => {
    const ok = Boolean(scripts[script]);
    const status = ok ? "pass" : (script === "healthcheck" ? "warn" : "fail");
    return result("script:" + script, status, ok ? scripts[script] : "missing", "Add the missing package script.");
  });
}

function marker(file, pattern, name, required) {
  const text = readText(file);
  const ok = pattern.test(text);
  return result(name, ok ? "pass" : (required ? "fail" : "warn"), ok ? "found" : "not found", "Check module integration markers.");
}

function checkMarkers() {
  return [
    marker("apps/desktop/src/renderer/core/taskProtocol.js", /createTaskRecord|addTaskArtifact|TASK_PROTOCOL_VERSION/, "marker:task protocol helper", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /WeishanDispatchRouter|classifyCommand|createDispatchPlan/, "marker:dispatch router exists", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /mail|crawler|softwareFactory|document|ppt|codex|chat|coordination/, "marker:dispatch router module coverage", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /dispatch\.|createDispatchPlan|home-dispatch/, "marker:command center dispatch", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /cmd-brain|AI 网关/, "marker:home ai gateway status", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /answerChatWithGateway|chat\.unavailable|AI 网关未接通/, "marker:home chat answer gateway required", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /客户端不保存 provider key|model_gateway|AVAILABLE_MODELS/, "marker:model gateway client key forbidden", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /model\.selected|model\.statusViewed|recordHomeDispatchAction/, "marker:model selection history", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /chat\.answered|recordChatHistory/, "marker:chat answer history", true),
    marker("apps/server/src/server.js", /\/api\/ai\/status|WEISHAN_AI_GATEWAY_URL|AI_GATEWAY_NOT_CONFIGURED/, "marker:local ai gateway placeholder", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /saveDispatchPrefill|realExecution=false/, "marker:home dispatch route prefill", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /DISPATCH_STATUS|dispatch\.confirmed|dispatch\.cancelled|dispatch\.executed|dispatch\.failed/, "marker:dispatch pending lifecycle", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /confirmPendingPayload|cancelPendingPayload|recordDispatchHistory/, "marker:dispatch confirm bridge", true),
    marker("apps/desktop/src/renderer/routes/MailPage.js", /data-dispatch-prefill=["']mail["']|来自首页调度中心的任务/, "marker:mail dispatch prefill", true),
    marker("apps/desktop/src/renderer/routes/MailPage.js", /mailDispatchConfirm|confirmDispatch|dispatch\.confirmed/, "marker:mail dispatch confirm", true),
    marker("apps/desktop/src/renderer/routes/MailPage.js", /executeDispatchMail|mail\.executed|mail\.executionRequested/, "marker:mail dispatch confirmed execution bridge", true),
    marker("apps/desktop/src/renderer/routes/MailPage.js", /mail_mock_safe_execution|本地模拟邮件任务结果/, "marker:mail mock safe execution", true),
    marker("apps/desktop/src/renderer/routes/MailPage.js", /不会自动读取邮箱|不会.*发送邮件|realExecution=false/, "marker:mail real execution guarded", true),
    marker("apps/desktop/src/renderer/routes/CrawlerPage.js", /data-dispatch-prefill=["']crawler["']|不会自动访问外网/, "marker:crawler dispatch prefill", true),
    marker("apps/desktop/src/renderer/routes/CrawlerPage.js", /crawlerDispatchConfirm|confirmDispatch|确认抓取/, "marker:crawler dispatch confirm", true),
    marker("apps/desktop/src/renderer/routes/CrawlerPage.js", /executeDispatchCrawler|crawler\.executed|crawler\.executionRequested/, "marker:crawler dispatch confirmed execution bridge", true),
    marker("apps/desktop/src/renderer/routes/CrawlerPage.js", /isMockSafeCrawlerUrl|crawler_mock_safe_execution|本地模拟抓取结果/, "marker:crawler mock safe execution", true),
    marker("apps/desktop/src/renderer/routes/CrawlerPage.js", /真实 URL|手动确认真实抓取|realExecution:false/, "marker:crawler real execution guarded", true),
    marker("apps/desktop/src/renderer/routes/BuilderPage.js", /data-dispatch-prefill=["']softwareFactory["']|不会自动调用 AI/, "marker:software factory dispatch prefill", true),
    marker("apps/desktop/src/renderer/routes/BuilderPage.js", /builderDispatchConfirm|confirmDispatch|确认生成/, "marker:software factory dispatch confirm", true),
    marker("apps/desktop/src/renderer/routes/BuilderPage.js", /executeDispatchSoftwareFactory|softwareFactory\.executed|softwareFactory\.executionRequested/, "marker:software factory dispatch confirmed execution bridge", true),
    marker("apps/desktop/src/renderer/routes/BuilderPage.js", /software_factory_mock_safe_execution|本地模拟软件工厂任务结果/, "marker:software factory mock safe execution", true),
    marker("apps/desktop/src/renderer/routes/BuilderPage.js", /不会自动生成软件|不会调用 AI|不会创建项目文件|realExecution=false/, "marker:software factory real execution guarded", true),
    marker("apps/desktop/src/renderer/routes/BuilderPage.js", /产品定位|核心功能模块|accounts|transactions|audit_logs|MVP 范围|验收标准/, "marker:software factory professional mock result", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /stagedAttachments|data-attachment-stage|附件已挂载/, "marker:home attachment staged before command", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /attachmentCount|attachmentNames|attachmentTypes/, "marker:attachment metadata only", true),
    marker("apps/desktop/src/renderer/routes/HomePage.js", /chooseFiles[\s\S]*stagedAttachments|CommandApi\.enqueue\(text,\s*\{\s*attachments\s*\}\)/, "marker:no attachment auto execution", true),
    marker("apps/desktop/src/renderer/modules/command/commandApi.js", /未读取完整内容|未上传云|attachmentNames/, "marker:no file content in history", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /cancelPendingPayload|dispatch\.cancelled/, "marker:dispatch cancellation", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /realExecution:false|requiresUserConfirmation:true/, "marker:dispatch real execution false", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /realExecution:false|mockSafeExecutionAllowed/, "marker:dispatch real execution false by default", true),
    marker("apps/desktop/src/renderer/core/dispatchRouter.js", /requiresUserConfirmation:true/, "marker:dispatch user confirmation required", true),
    marker("apps/desktop/src/renderer/modules/history/historyApi.js", /window\.HistoryApi|function record/, "marker:HistoryApi", true),
    marker("apps/desktop/src/renderer/routes/HistoryPage.js", /artifact|history-artifact-download|URL\.createObjectURL/, "marker:artifact download", false),
    marker("apps/desktop/src/renderer/core/enterpriseSecurity.js", /WeishanEnterpriseSecurity|canDownload|createSecurityAuditPayload/, "marker:enterprise security", true),
    marker("apps/desktop/src/renderer/routes/AuditPage.js", /audit\.export|risk|HistoryApi\.list/, "marker:audit actions", false),
    marker("apps/desktop/src/renderer/core/enterpriseSecurity.js", /canInviteOrganization|createCollaborationAuditPayload|getEnterpriseOrgCatalog/, "marker:collaboration invite audit", true),
    marker("apps/desktop/src/renderer/core/repairCenter.js", /WeishanRepairCenter|recordRuntimeError|installRepairErrorCapture/, "marker:repair center core", true),
    marker("apps/desktop/src/renderer/core/repairCenter.js", /sanitizeRepairText|sanitizeStack|createSafeTelemetryPayload/, "marker:repair telemetry sanitizer", true),
    marker("apps/desktop/src/renderer/core/repairCenter.js", /repair\.bugDetected|repair\.suggested|repair\.verified|repair\.reportExported/, "marker:repair history actions", true),
    marker("apps/desktop/src/renderer/core/repairCenter.js", /pending_manual_or_cloud_opt_in|clientMode:\s*["']local["']/, "marker:repair upload safety", true),
    marker("apps/server/src/cloud/storageAdapter.js", /class StorageAdapter|createStorageAdapter|s3_compatible/, "marker:storage adapter interface", true),
    marker("apps/server/src/cloud/providers/localMockStorageAdapter.js", /LocalMockStorageAdapter|mock:\/\/storage|getUsage/, "marker:local mock storage adapter", true),
    marker("apps/server/src/cloud/providers/s3CompatibleStorageAdapter.js", /S3CompatibleStorageAdapter|object storage|not_enabled_in_mvp/, "marker:s3 compatible storage adapter skeleton", true),
    marker("apps/server/src/cloud/metadataAdapter.js", /class MetadataAdapter|createMetadataAdapter|Metadata provider/, "marker:metadata adapter interface", true),
    marker("apps/server/src/cloud/metadataAdapter.js", /LocalMockMetadataAdapter|getStorageAllocation|recordFileIndex/, "marker:local mock metadata adapter", true),
    marker("apps/server/src/cloud/metadataAdapter.js", /PocketBaseMetadataAdapterSkeleton|provider:"pocketbase"|not_configured_in_mvp/, "marker:pocketbase metadata provider skeleton", true),
    marker("apps/server/src/cloud/cloudService.js", /createCloudContext|createUploadUrl|pathPrefixFor/, "marker:cloud service core", true),
    marker("apps/server/src/cloud/metadataAdapter.js", /CN_ENTERPRISE_BASIC|CN_ENTERPRISE_STANDARD|CN_ENTERPRISE_PRO|GLOBAL_ENTERPRISE_BASIC|GLOBAL_ENTERPRISE_STANDARD|GLOBAL_ENTERPRISE_PRO|storageQuotaGb|memberLimit/, "marker:enterprise plans mock", true),
    marker("apps/server/src/cloud/cloudService.js", /planById|storageQuotaFor|DEFAULT_ENTERPRISE_PLAN_ID/, "marker:enterprise quota by plan", true),
    marker("apps/server/src/cloud/cloudService.js", /inviteOrganizationMember|MEMBER_LIMIT_REACHED|activeMembers/, "marker:organization member limit", true),
    marker("apps/server/src/cloud/metadataAdapter.js", /localStorageWarning|local only|Free Local/, "marker:local storage warning", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /云服务与企业空间|loadCloudPlans|cloudEnterpriseSettings/, "marker:cloud settings ui", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /当前使用本地存储模式|LOCAL_STORAGE_WARNING/, "marker:local storage warning ui", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /CN_ENTERPRISE_BASIC|CN_ENTERPRISE_STANDARD|CN_ENTERPRISE_PRO|GLOBAL_ENTERPRISE_STANDARD/, "marker:enterprise plans visible", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /allocateCloudStorage|cloud\.storageAllocated/, "marker:cloud mock allocation", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /cloudInviteMember|MEMBER_LIMIT_REACHED|cloud\.organizationInviteRejected/, "marker:organization invite limit", true),
    marker("apps/desktop/src/renderer/routes/SettingsPage.js", /cloud\.plansViewed|cloud\.organizationStatusViewed|cloud\.organizationInvite/, "marker:cloud history actions", true),
    marker("apps/server/src/cloud/cloudHealthcheck.js", /runCloudHealthcheck|storageProviderSwitchable|metadataProviderSwitchable/, "marker:cloud provider switchable", true),
    marker("playwright.config.js", /testDir:\s*["']\.\/tests\/e2e["']|reporter|trace/, "marker:playwright config", false),
    marker("tests/e2e/smoke.spec.js", /app launches|home page visible|crawler page visible/, "marker:playwright smoke", false)
  ];
}

function walk(dir, files) {
  if (!existsSync(dir)) return files;
  readdirSync(dir).forEach((entry) => {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry !== "node_modules" && entry !== "dist" && entry !== "build") walk(full, files);
    } else if (/\.(js|html|json)$/.test(entry) && !/package-lock\.json$/.test(entry)) {
      files.push(full);
    }
  });
  return files;
}

function checkSecretWords() {
  const scan = runSecretScan();
  const status = scan.status === "FAIL" ? "fail" : (scan.status === "WARN" ? "warn" : "pass");
  return [
    result("secret scan available", "pass", "scripts/secret-scan.js"),
    result(
      "secret scan result",
      status,
      "scannedFiles=" + scan.scannedFiles + ", warn=" + (scan.counts.warn || 0) + ", fail=" + (scan.counts.fail || 0),
      "Remove literal secrets, use Secure Storage or environment variables, and rotate exposed keys."
    )
  ];
}

function buildResults() {
  return []
    .concat(checkFiles())
    .concat(checkPackageScripts())
    .concat(checkMarkers())
    .concat(checkSecretWords());
}

function markdown(results) {
  const state = overall(results);
  const counts = results.reduce((acc, item) => {
    acc[item.status] = (acc[item.status] || 0) + 1;
    return acc;
  }, {});
  return [
    "# weishan 自检报告",
    "",
    "检测时间：" + new Date().toISOString(),
    "总体状态：" + state,
    "通过：" + (counts.pass || 0) + "，警告：" + (counts.warn || 0) + "，失败：" + (counts.fail || 0),
    "",
    "## 检测结果",
    "",
    "| 项目 | 状态 | 说明 | 修复建议 |",
    "| --- | --- | --- | --- |",
    ...results.map((item) => "| " + item.name + " | " + item.status + " | " + item.detail + " | " + (item.suggestion || "-") + " |"),
    "",
    "## 未覆盖",
    "",
    "- Playwright E2E",
    "- Metadata provider / database adapter 真实连接",
    "- S3-compatible / object storage provider 真实连接",
    "- Gitleaks 深度密钥扫描",
    "- GitHub Actions"
  ].join("\n");
}

function printList(results) {
  results
    .slice()
    .sort((a, b) => statusRank(b.status) - statusRank(a.status) || a.name.localeCompare(b.name))
    .forEach((item) => {
      console.log("[" + item.status.toUpperCase() + "] " + item.name + " - " + item.detail);
    });
  console.log("HEALTHCHECK " + overall(results));
}

const results = buildResults();
if (process.argv.includes("--markdown")) {
  console.log(markdown(results));
} else {
  printList(results);
}

if (overall(results) === "FAIL") process.exitCode = 1;
