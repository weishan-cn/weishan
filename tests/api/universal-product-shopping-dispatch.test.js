"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const window = { localStorage:{ getItem(){ return null; }, setItem(){}, removeItem(){} } };
window.window = window;
const context = vm.createContext({ window, console, URL, Date, Blob });
["apps/desktop/src/renderer/core/homeUnifiedIntentRouter.js", "apps/desktop/src/renderer/core/dispatchRouter.js"]
  .forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }));

const positives = [
  "荷兰 mac", "荷兰 鸡蛋", "荷兰 火腿", "荷兰 咖啡", "荷兰 洗发水",
  "荷兰 跑鞋", "荷兰 乐高积木", "荷兰 微波炉", "荷兰 小说", "荷兰 防晒霜",
  "阿根廷 空调", "阿根廷 Motorola 手机", "阿根廷 洗衣机", "阿根廷 网球拍", "阿根廷 儿童玩具",
  "波兰 沙发", "波兰 椅子", "波兰 五斗柜", "波兰 床头灯", "波兰 羊毛外套",
  "阿根廷 iPhone 17", "波兰 咖啡桌"
];
const negatives = [
  "苹果公司的 CEO 是谁", "帮我写一封邮件", "检查项目状态", "总结这个文档", "解释什么是通货膨胀",
  "荷兰的首都是哪里", "日本人口是多少", "法国天气怎么样", "德国历史简介", "美国总统是谁"
];

for (const input of positives) {
  const decision = window.WeishanHomeUnifiedIntentRouter.classifyHomeIntent(input);
  const dispatch = window.WeishanDispatchRouter.classifyCommand(input);
  assert.equal(decision.destination, "COMMERCE", input);
  assert.equal(decision.searchScope.domain, "SHOPPING", input);
  assert.equal(dispatch.module, "commerceAgent", input);
  assert.equal(dispatch.targetRoute, "commerce", input);
}
for (const input of negatives) {
  assert.notEqual(window.WeishanDispatchRouter.classifyCommand(input).module, "commerceAgent", input);
}

const source = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/homeUnifiedIntentRouter.js"), "utf8");
const structuralFunction = source.slice(source.indexOf("function hasMarketProductStructure"), source.indexOf("function signalCounts"));
assert.doesNotMatch(structuralFunction, /鸡蛋|火腿|mac|洗发水|沙发|五斗柜|跑鞋|乐高/i);
assert.match(structuralFunction, /marketContext/);
assert.match(structuralFunction, /STRUCTURAL_NON_SHOPPING/);

console.log("UNIVERSAL_PRODUCT_SHOPPING_DISPATCH PASS positives=" + positives.length + " negatives=" + negatives.length);
