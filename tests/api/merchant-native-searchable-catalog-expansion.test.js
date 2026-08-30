"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");
const { createTiendaCentroReadonlyService } = require(path.join(ROOT, "apps/desktop/src/main/tiendaCentroReadonlyService.js"));
const { createMeblostanReadonlyService } = require(path.join(ROOT, "apps/desktop/src/main/meblostanReadonlyService.js"));

function response(payload) {
  const bytes = Buffer.from(JSON.stringify(payload));
  let delivered = false;
  return {
    ok:true,
    headers:{ get:() => String(bytes.byteLength) },
    body:{ getReader:() => ({
      read:async () => delivered ? { done:true } : (delivered = true, { done:false, value:bytes }),
      cancel:async () => { delivered = true; },
      releaseLock() {}
    }) }
  };
}

function loadRenderer(files) {
  const window = {};
  window.window = window;
  const context = vm.createContext({ window, URL, console, Date, Object, Array, Set, Number, String, RegExp, JSON });
  files.forEach((file) => vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file }));
  return window;
}

async function main() {
  const at = "2026-08-30T05:00:00.000Z";
  const tienda = createTiendaCentroReadonlyService({ now:() => at, fetchImpl:async () => response([
    { id:10, name:"Auriculares Bluetooth Negro Nuevo", permalink:"https://tiendacentro.com/audio/auriculares-bluetooth-negro/", prices:{ price:"25000", regular_price:"25000", sale_price:"25000", currency_code:"ARS", currency_minor_unit:0 } },
    { id:11, name:"Auriculares Bluetooth Azul Nuevo", permalink:"https://tiendacentro.com/audio/auriculares-bluetooth-azul/", prices:{ price:"27000", regular_price:"27000", sale_price:"27000", currency_code:"ARS", currency_minor_unit:0 } }
  ]) });
  assert.equal((await tienda.search({ query:"auriculares", requestId:"catalog-tienda", limit:3 })).results.length, 2);

  const meblostan = createMeblostanReadonlyService({ now:() => at, fetchImpl:async () => response([
    { id:20, name:"Fotel klubowy z lat 60", permalink:"https://meblostan.pl/sklep/fotel-klubowy-z-lat-60/", prices:{ price:"850", regular_price:"850", sale_price:"850", currency_code:"PLN", currency_minor_unit:0 }, is_in_stock:true },
    { id:21, name:"Fotel obrotowy vintage", permalink:"https://meblostan.pl/sklep/fotel-obrotowy-vintage/", prices:{ price:"1200", regular_price:"1200", sale_price:"1200", currency_code:"PLN", currency_minor_unit:0 }, is_in_stock:true }
  ]) });
  assert.equal((await meblostan.search({ query:"fotel", requestId:"catalog-meblostan", limit:3 })).results.length, 2);

  const rendered = loadRenderer([
    "apps/desktop/src/renderer/core/merchantNativeSourceEligibilityRouter.js"
  ]);
  const tiendaRoute = rendered.WeishanMerchantNativeSourceEligibilityRouter.routeEligibleMerchantNativeSources({ destinationMarket:"AR", query:"aire acondicionado" });
  const meblostanRoute = rendered.WeishanMerchantNativeSourceEligibilityRouter.routeEligibleMerchantNativeSources({ destinationMarket:"PL", query:"fotel vintage" });
  assert.deepEqual(Array.from(tiendaRoute.eligibleSourceIds), ["tienda_centro_public_api"]);
  assert.deepEqual(Array.from(meblostanRoute.eligibleSourceIds), ["meblostan_public_api"]);

  const commerceSource = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/commerceSearch.js"), "utf8");
  const queryFunction = commerceSource.slice(commerceSource.indexOf("function merchantNativeSourceQuery"), commerceSource.indexOf("function validateBookingUrl"));
  assert.equal(/Jesionowy stolik kawowy|productId|fixedSku|iphone 17|iphone 16/i.test(queryFunction), false);
  assert.match(queryFunction, /replace\(\/英国\|阿根廷\|荷兰\|波兰/);
  assert.doesNotMatch(queryFunction, /return\s+["'](?:Coca-Cola|stolik kawowy|fotel|krzesło)["']/);

  assert.equal(fs.readFileSync(path.join(ROOT, "apps/desktop/src/main/merchantNativeReadonlyServiceCore.js"), "utf8").includes("clampInteger(safe.limit, 3, 1, 3)"), true);
  console.log("MERCHANT_NATIVE_SEARCHABLE_CATALOG_EXPANSION PASS");
}

main().catch((error) => { console.error(error); process.exit(1); });
