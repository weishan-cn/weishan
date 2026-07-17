const assert = require("node:assert/strict");
const path = require("node:path");

const ROOT = path.resolve(__dirname, "../..");
const {
  registerGlobalShoppingRakutenReadonlyHandlers
} = require(path.join(ROOT, "apps/desktop/src/main/globalShoppingRakutenReadonlyService.js"));

async function main() {
  const handlers = {};
  let sharedInitCalls = 0;
  const fakeIpcMain = {
    handle(channel, handler) {
      handlers[channel] = handler;
    }
  };
  registerGlobalShoppingRakutenReadonlyHandlers(fakeIpcMain, {
    env:{},
    createSharedApis:() => {
      sharedInitCalls += 1;
      throw new Error("shared init should be lazy");
    },
    fetchImpl:async () => {
      throw new Error("should not fetch");
    }
  });
  assert.equal(sharedInitCalls, 0);

  assert.deepEqual(Object.keys(handlers).sort(), [
    "global-shopping:rakuten-readonly-search",
    "global-shopping:rakuten-readonly-status"
  ]);

  const status = await handlers["global-shopping:rakuten-readonly-status"]();
  assert.equal(status.providerId, "rakuten_japan");
  assert.equal("accessKey" in status, false);
  assert.equal(sharedInitCalls, 1);

  const invalid = await handlers["global-shopping:rakuten-readonly-search"](null, {
    keyword:"Nintendo",
    url:"https://evil.example.com",
    headers:{ authorization:"Bearer leak" }
  });
  assert.equal(invalid.status, "unavailable");
  assert.equal(invalid.error.category, "shared_api_initialization_failed");

  console.log("GLOBAL_SHOPPING_RAKUTEN_IPC_CONTRACT PASS");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
