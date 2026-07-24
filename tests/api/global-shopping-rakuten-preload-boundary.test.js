const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const videoProviderIpcContract = require(path.join(ROOT, "apps/desktop/src/shared/videoProviderIpcContract.js"));

function main() {
  const exposed = {};
  const invoked = [];
  const electron = {
    contextBridge:{
      exposeInMainWorld(name, api) {
        exposed[name] = api;
      }
    },
    ipcRenderer:{
      invoke(channel, payload) {
        invoked.push({ channel, payload });
        return Promise.resolve({ ok:true });
      },
      on() {},
      removeListener() {}
    },
    shell:{
      openExternal() {}
    }
  };
  const source = fs.readFileSync(path.join(ROOT, "apps/desktop/src/preload.js"), "utf8");
  const context = vm.createContext({
    require(name) {
      if (name === "electron") return electron;
      if (name === "./shared/videoProviderIpcContract") return videoProviderIpcContract;
      throw new Error("unexpected require: " + name);
    },
    process:{ env:{} },
    console
  });
  vm.runInContext(source, context, { filename:"preload.js" });

  assert.ok(exposed.weishanGlobalShopping);
  assert.equal(typeof exposed.weishanGlobalShopping.rakutenReadonlySearch, "function");
  assert.equal(typeof exposed.weishanGlobalShopping.getRakutenReadonlyStatus, "function");
  assert.equal("ipcRenderer" in exposed.weishanGlobalShopping, false);
  assert.equal("getProviderKeyValue" in exposed.weishanGlobalShopping, false);

  exposed.weishanGlobalShopping.rakutenReadonlySearch({ keyword:"Nintendo" });
  exposed.weishanGlobalShopping.getRakutenReadonlyStatus();
  assert.deepEqual(invoked.map((item) => item.channel), [
    "global-shopping:rakuten-readonly-search",
    "global-shopping:rakuten-readonly-status"
  ]);

  console.log("GLOBAL_SHOPPING_RAKUTEN_PRELOAD_BOUNDARY PASS");
}

main();
