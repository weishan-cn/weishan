const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const ROOT = path.resolve(__dirname, "../..");

function load() {
  const values = new Map();
  const window = {
    WeishanStore:{
      read:(key, fallback) => values.has(key) ? structuredClone(values.get(key)) : fallback,
      write:(key, value) => values.set(key, structuredClone(value)),
      remove:(key) => values.delete(key)
    }
  };
  window.window = window;
  const context = vm.createContext({ window, console, Date, Map, Set, Object, Array, String, Number, JSON, Promise, structuredClone });
  for (const file of [
    "apps/desktop/src/renderer/core/pluginRuntimeV2Contract.js",
    "apps/desktop/src/renderer/core/pluginRuntimeV2.js",
    "apps/desktop/src/renderer/core/pluginRuntimeV2Catalog.js",
    "apps/desktop/src/renderer/core/brainCapabilityDiscovery.js"
  ]) vm.runInContext(fs.readFileSync(path.join(ROOT, file), "utf8"), context, { filename:file });
  return { window, values };
}

async function main() {
  const { window } = load();
  const contract = window.WeishanPluginRuntimeV2Contract;
  const api = window.WeishanPluginRuntimeV2;
  const catalogApi = window.WeishanPluginRuntimeV2Catalog;
  const brain = window.WeishanBrainCapabilityDiscovery;
  const catalog = catalogApi.catalog();
  const image = catalogApi.imageTools();
  const fixture = catalogApi.safeFixture();

  assert.equal(contract.PERMISSION_TAXONOMY.includes("email.send"), true);
  assert.equal(contract.PERMISSION_TAXONOMY.includes("shell.execute"), true);
  assert.equal(contract.PERMISSION_TAXONOMY.includes("credential_access"), true);
  assert.equal(contract.validateManifest(image).valid, true);
  assert.equal(contract.validateManifest(fixture).valid, true);
  assert.equal(contract.validateManifest(Object.assign({}, fixture, { private_key:"forbidden" })).reason, "unsafe_manifest");
  assert.equal(contract.validateManifest(Object.assign({}, fixture, { permissions:[] })).valid, false);

  const memory = new Map();
  const storage = {
    read:(key, fallback) => memory.has(key) ? structuredClone(memory.get(key)) : fallback,
    write:(key, value) => memory.set(key, structuredClone(value)),
    remove:(key) => memory.delete(key)
  };
  const runtime = new api.RuntimeV2({
    catalog:[fixture], storage,
    executor:async ({ capability, artifactHandlesOnly }) => ({ status:"SUCCESS", result:{ capability:capability.capabilityId, artifactHandlesOnly }, artifacts:[{ handle:"artifact:fixture:1" }], sideEffectsPerformed:[] })
  });
  const grant = "filesystem.read:fixture-artifact";
  assert.equal(runtime.install(fixture.pluginId).state, "INSTALLED");
  assert.equal(runtime.enable(fixture.pluginId).error, "PERMISSION_APPROVAL_REQUIRED");
  assert.equal(runtime.installation(fixture.pluginId).state, "PERMISSION_BLOCKED");
  assert.equal(runtime.grantPermissions(fixture.pluginId, [grant]).ok, true);
  assert.equal(runtime.enable(fixture.pluginId).state, "ENABLED");
  const invoked = await runtime.invoke(fixture.pluginId, "document.text.read", { artifactHandle:"artifact:fixture:source" });
  assert.equal(invoked.status, "SUCCESS");
  assert.equal(invoked.capability, "document.text.read");
  assert.deepEqual(Array.from(invoked.permissionsUsed), ["filesystem.read"]);
  assert.equal(invoked.result.artifactHandlesOnly, true);
  assert.equal(runtime.disable(fixture.pluginId).state, "DISABLED");
  assert.equal(runtime.enable(fixture.pluginId).state, "ENABLED");
  const retain = runtime.uninstall(fixture.pluginId, { retainData:true });
  assert.equal(retain.ok, true);
  assert.equal(retain.removed.generatedData, false);
  assert.equal(runtime.install(fixture.pluginId, { grants:[grant] }).ok, true);
  assert.equal(runtime.enable(fixture.pluginId).ok, true);
  const remove = runtime.uninstall(fixture.pluginId, { retainData:false });
  assert.equal(remove.removed.generatedData, true);
  assert.equal(remove.removed.cache, true);

  assert.equal(runtime.install(fixture.pluginId, { grants:[grant] }).ok, true);
  const expanded = structuredClone(fixture);
  expanded.version = "1.1.0";
  expanded.integrityHash = "sha256:fixturetextreaderv110";
  expanded.permissions.push({ permissionId:"network", required:false, scopes:["approved-domains"], description:"Fixture network permission." });
  assert.equal(runtime.reviewUpdate(fixture.pluginId, expanded).error, "PERMISSION_EXPANSION_APPROVAL_REQUIRED");
  assert.deepEqual(Array.from(runtime.reviewUpdate(fixture.pluginId, expanded).newPermissions), ["network:approved-domains"]);

  const imageRuntime = catalogApi.runtime;
  assert.equal(imageRuntime.installation("weishan.tools.image").state, "ENABLED");
  assert.equal(imageRuntime.candidates("image.transform", { installedOnly:true }).length, 1);
  assert.equal(image.entrypoint.mode, "IN_PROCESS_COMPATIBILITY");

  const agents = catalog.filter((manifest) => manifest.pluginId.includes("connector"));
  assert.equal(agents.length, 3);
  for (const manifest of agents) {
    assert.equal(manifest.availability, "CONNECTOR_FOUNDATION_NOT_READY_FOR_USER_EXECUTION");
    assert.equal(manifest.signature.status, "NOT_VERIFIED");
    assert.equal(manifest.downloadSize, 0);
    assert.equal(imageRuntime.install(manifest.pluginId).error, "PLUGIN_NOT_INSTALL_READY");
  }
  assert.equal(catalog.some((manifest) => /runtime binary/i.test(manifest.entrypoint.target)), false);

  const multiple = new api.RuntimeV2({ catalog:[fixture, Object.assign(structuredClone(fixture), { pluginId:"local.fixture.second-reader", name:"Second reader", integrityHash:"sha256:fixturesecondreaderv1" })], storage:{ read:(_k, fallback) => fallback, write:()=>{}, remove:()=>{} } });
  assert.equal(multiple.candidates("document.text.read").length, 2);
  const missing = brain.discoverForIntent("把这些数据整理成 Excel", imageRuntime);
  assert.deepEqual(Array.from(missing.capabilities), ["spreadsheet.write"]);
  assert.equal(missing.steps[0].status, "INSTALL_RECOMMENDATION_NOT_READY");
  const imageDiscovery = brain.discoverForIntent("帮我裁剪图片", imageRuntime);
  assert.equal(imageDiscovery.steps[0].status, "READY");
  assert.equal(imageDiscovery.authority, "WEISHAN_BRAIN");
  assert.equal(imageDiscovery.commissionInfluence, false);
  const discoverySource = brain.discoverForIntent.toString();
  assert.equal(/codex|openclaw|hermes/i.test(discoverySource), false);
  assert.equal(brain.compose(["image.transform"], imageRuntime)[0].transitivePermissionEscalation, false);

  const secretRejected = contract.normalizeResult({ status:"SUCCESS", result:{ api_token:"do-not-propagate" } }, { capability:"image.transform", pluginVersion:"1.0.0" });
  assert.equal(secretRejected.status, "FAILED");
  assert.equal(secretRejected.result, null);
  assert.equal(imageRuntime.snapshot().activity.length <= 200, true);
  console.log("PLUGIN_RUNTIME_V2_FOUNDATION PASS");
}

main().catch((error) => { console.error(error); process.exit(1); });
