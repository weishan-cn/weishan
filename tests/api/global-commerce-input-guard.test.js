const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const windowRef = {};
windowRef.window = windowRef;
vm.runInContext(
  fs.readFileSync(path.join(__dirname, "../../apps/desktop/src/renderer/core/globalCommerceInputGuard.js"), "utf8"),
  vm.createContext({ window:windowRef })
);
const guard = windowRef.WeishanGlobalCommerceInputGuard;

assert.equal(guard.guardAndCloneCommerceInput({ price:10, labels:["safe"] }).success, true);
const source = { nested:{ amount:10 } };
const clone = guard.guardAndCloneCommerceInput(source).value;
source.nested.amount = 20;
assert.equal(clone.nested.amount, 10);

let getterCalls = 0;
const getter = {};
Object.defineProperty(getter, "price", { get() { getterCalls += 1; return 10; } });
const setter = {};
Object.defineProperty(setter, "price", { set() {} });
const methods = { toJSON() { throw Error("must not run"); }, toString() { throw Error("must not run"); }, valueOf() { throw Error("must not run"); } };
const circular = {};
circular.self = circular;
const prototype = JSON.parse('{"__proto__":{"polluted":true}}');
const symbols = { value:Symbol("unsafe") };
const iterator = { [Symbol.iterator]:function () { throw Error("must not run"); } };

[getter, setter, methods, circular, prototype, symbols, iterator, { value:NaN }, { value:Infinity }, { value:-Infinity }, { token:"secret" }, { accessToken:"secret" }, { providerResponse:"raw" }, { stack:"trace" }, { credentials:"x" }].forEach((input) => {
  const result = guard.guardAndCloneCommerceInput(input);
  assert.equal(result.success, false);
  assert.deepEqual(JSON.parse(JSON.stringify(result.error)), {
    code:"COMMERCE_INPUT_REJECTED",
    stage:"INPUT_GUARD",
    recoverable:true,
    userMessage:"Commerce input could not be processed safely.",
    detailsSummary:"The commerce input did not satisfy the public boundary contract."
  });
});
assert.equal(getterCalls, 0);
assert.equal(guard.guardAndCloneCommerceInput("x".repeat(10001)).success, false);
assert.equal(guard.guardAndCloneCommerceInput(Array.from({ length:101 }, () => 1)).success, false);
console.log("GLOBAL_COMMERCE_INPUT_GUARD PASS");
