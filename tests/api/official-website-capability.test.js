const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const videoProviderIpcContract = require(path.join(ROOT, "apps/desktop/src/shared/videoProviderIpcContract.js"));

async function main() {
  const source = fs.readFileSync(path.join(ROOT, "apps/desktop/src/preload.js"), "utf8");
  const mainSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/main.js"), "utf8");
  const settingsSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/routes/SettingsPage.js"), "utf8");
  const exposed = {};
  const invoked = [];
  const electron = {
    contextBridge:{ exposeInMainWorld(name, api) { exposed[name] = api; } },
    ipcRenderer:{
      invoke(channel, payload) { invoked.push({ channel, payload }); return Promise.resolve({ ok:true }); },
      on() {}, removeListener() {}
    },
    shell:{ openExternal() {} }
  };
  vm.runInContext(source, vm.createContext({
    require(name) { if (name === "electron") return electron; if (name === "./shared/videoProviderIpcContract") return videoProviderIpcContract; if (name === "../package.json") return { version:"0.0.0-test", productName:"Weishan" }; throw new Error("unexpected require: " + name); },
    process:{ env:{} }, console
  }), { filename:"preload.js" });

  assert.equal(mainSource.includes('const WEISHAN_OFFICIAL_WEBSITE_URL = "https://weishan.ai/";'), true);
  assert.equal(mainSource.includes('ipcMain.handle("weishan:open-official-website", async () => shell.openExternal(WEISHAN_OFFICIAL_WEBSITE_URL));'), true);
  assert.equal(typeof exposed.weishan.openWeishanOfficialWebsite, "function");
  await exposed.weishan.openWeishanOfficialWebsite();
  assert.deepEqual(invoked, [{ channel:"weishan:open-official-website", payload:undefined }]);
  assert.equal(settingsSource.includes("openWeishanOfficialWebsite"), true);
  assert.equal(settingsSource.includes("await window.weishan.openWeishanOfficialWebsite();"), true);
  assert.equal(settingsSource.includes("https://weishan.ai/"), false);
  assert.equal(settingsSource.includes("openExternal("), false);
  assert.equal(settingsSource.includes("WeishanPluginRegistry"), false);
  console.log("OFFICIAL_WEBSITE_CAPABILITY PASS");
}

main();
