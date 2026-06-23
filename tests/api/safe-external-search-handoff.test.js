const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function loadRendererCore(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, console, URL });
  for (const file of files) {
    vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  }
  return window;
}

const windowRef = loadRendererCore([
  "apps/desktop/src/renderer/core/commerceSafeExternalSearchHandoff.js"
]);

const api = windowRef.WeishanSafeExternalSearchHandoff;

async function main() {
  assert.equal(api.SAFE_EXTERNAL_SEARCH_HANDOFF_VERSION, "2.1.73");

  const urls = api.buildTrustedExternalSearchUrls({
    web: "https://www.google.com/search?q=7%E6%9C%887%E6%97%A5",
    googleFlights: "https://www.google.com/travel/flights/search",
    tripCom: "https://www.trip.com/flights/search"
  });
  assert.equal(urls.web.startsWith("https://www.google.com/search"), true);
  assert.equal(urls.googleFlights.startsWith("https://www.google.com/travel/flights"), true);
  assert.equal(urls.tripCom.startsWith("https://www.trip.com/flights/search"), true);
  assert.equal(api.buildTrustedExternalSearchUrls({ web:"https://evil.example/search", googleFlights:"javascript:alert(1)", tripCom:"https://phishing.example" }).web, "");

  const gate = api.buildSafeExternalSearchHandoffGate({
    kind: "googleFlights",
    url: "https://www.google.com/travel/flights/search",
    taskId: "task-1",
    taskTitle: "7 月 15 日上海到成都最便宜的机票"
  });
  assert.equal(gate.status, "manual_confirmation_required");
  assert.equal(gate.allowed, true);
  assert.equal(gate.autoOpen, false);
  assert.equal(gate.bookingUrl, "disabled");
  assert.equal(gate.payment, "disabled");
  assert.equal(gate.order, "disabled");
  assert.equal(gate.realProvider, "disabled");
  assert.equal(gate.realNetwork, "disabled");
  assert.equal(gate.redacted, true);
  assert.equal(api.assertSafeExternalSearchHandoffGate(gate), true);

  const ui = api.buildExternalSearchConfirmationUi(gate);
  assert.equal(ui.title, "外部搜索确认");
  assert.equal(ui.confirmButtonLabel, "确认打开外部搜索链接");
  assert.equal(ui.cancelButtonLabel, "取消");
  assert.equal(ui.redacted, true);
  assert.equal(api.assertExternalSearchConfirmationUiSafe(ui), true);
  const html = api.renderExternalSearchConfirmationHtml(gate);
  assert.equal(html.includes("确认打开外部搜索链接"), true);
  assert.equal(html.includes("取消"), true);
  assert.equal(html.includes("https://www.google.com/travel/flights/search"), false);
  assert.equal(html.includes("apiKey"), false);

  let opened = [];
  windowRef.__WEISHAN_TEST_OPEN_EXTERNAL__ = async (url) => { opened.push(String(url || "")); };
  const openAllowed = await api.openTrustedExternalSearch("https://www.google.com/travel/flights/search");
  assert.equal(openAllowed.ok, true);
  assert.equal(opened.length, 1);
  assert.equal(opened[0].startsWith("https://www.google.com/travel/flights/search"), true);
  const openBlocked = await api.openTrustedExternalSearch("https://evil.example/search");
  assert.equal(openBlocked.ok, false);
  assert.equal(opened.length, 1);

  console.log("SAFE_EXTERNAL_SEARCH_HANDOFF_CORE PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
