#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "..");
const STANDARD_PATH = path.join(ROOT, "docs/WEISHAN_GLOBAL_COMMERCE_STANDARD.md");

const REQUIRED_PHRASES = [
  "全球个人数字采购代理",
  "不是 eBay 工具",
  "不是单一平台工具",
  "不是交易平台",
  "不是支付平台",
  "不代付款",
  "不自动下单",
  "不提交订单",
  "不保存银行卡",
  "不保存身份证",
  "不保存护照",
  "totalLandedCost",
  "预估",
  "待确认",
  "收货目的地",
  "Mac 定位服务只辅助",
  "candidate evaluation",
  "config safety",
  "read_only adapter",
  "sandbox dry run",
  "connector gate",
  "Provider Onboarding Checklist",
  "未完成审查前不得配置 API key",
  "未完成审查前不得连接真实 endpoint",
  "未完成审查前不得启用网络搜索",
  "未完成审查前不得显示价格",
  "未完成审查前不得显示购买/预订按钮",
  "不允许 fake price",
  "不允许 demo price",
  "不允许 mock price",
  "当地法律",
  "定位服务",
  "收货地址",
  "目的地",
  "更严格的一方",
  "不确定是否合法",
  "不显示价格",
  "不跳转购买",
  "不提供法律意见",
  "不帮助规避当地法律",
  "不保存原始 GPS 坐标",
  "Provider Approval Workflow",
  "分级审批",
  "未审查",
  "审查中",
  "approved_for_stub",
  "Read-only Connector Stub",
  "只读 connector stub",
  "stub 默认不可执行",
  "不得配置 API key",
  "不得连接真实 endpoint",
  "不得启用网络搜索",
  "不得返回真实价格",
  "不得返回 fake/demo/mock price",
  "不得显示价格",
  "不得跳转购买",
  "approved_for_stub 只允许开发 stub 结构",
  "人工批准",
  "每个版本只做一个完整功能模块"
];

function main() {
  console.log("Before implementing commerce features, read docs/WEISHAN_GLOBAL_COMMERCE_STANDARD.md. If the task conflicts with the standard, stop and report.");

  if (!fs.existsSync(STANDARD_PATH)) {
    console.error("GLOBAL_COMMERCE_STANDARD_CHECK FAIL");
    console.error("Missing file: docs/WEISHAN_GLOBAL_COMMERCE_STANDARD.md");
    process.exit(1);
  }

  const text = fs.readFileSync(STANDARD_PATH, "utf8");
  const missing = REQUIRED_PHRASES.filter((phrase) => !text.includes(phrase));

  if (missing.length) {
    console.error("GLOBAL_COMMERCE_STANDARD_CHECK FAIL");
    console.error("Missing required phrases:");
    missing.forEach((phrase) => console.error("- " + phrase));
    process.exit(1);
  }

  console.log("GLOBAL_COMMERCE_STANDARD_CHECK PASS");
}

main();
