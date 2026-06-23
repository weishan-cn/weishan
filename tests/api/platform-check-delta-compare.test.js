const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ROOT = path.resolve(__dirname, "../..");
function load(file){ const window = {}; window.window = window; vm.runInContext(fs.readFileSync(path.join(ROOT,file), "utf8"), vm.createContext({ window, console }), { filename:file }); return window; }
const api = load("apps/desktop/src/renderer/core/platformCheckDeltaCompare.js").WeishanPlatformCheckDeltaCompare;
function cmp(obs){ return api.compareCandidateWithManualPlatformCheck({ totalPrice:100 }, { status:"accepted", observedTotalPrice:obs, observedInventoryStatus:"available" }); }
assert.equal(cmp(100).deltaDirection, "same");
assert.equal(cmp(120).deltaDirection, "up");
assert.equal(cmp(80).deltaDirection, "down");
const na = api.compareCandidateWithManualPlatformCheck({}, {});
assert.equal(na.status, "not_available");
assert.equal(cmp(100).canClaimFinalBookablePrice, false);
assert.equal(cmp(100).canClaimPriceLocked, false);
assert.equal(cmp(100).canClaimTicketAvailable, false);
assert.equal(cmp(100).bookingUrl, null);
assert.equal(cmp(100).redacted, true);
console.log("PLATFORM_CHECK_DELTA_COMPARE PASS");
