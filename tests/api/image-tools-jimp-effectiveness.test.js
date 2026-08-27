const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { EventEmitter } = require("node:events");
const { Jimp } = require("../../apps/desktop/node_modules/jimp");
const contract = require("../../apps/desktop/src/shared/imageToolsContract");
const { createImageToolsProcessingRuntime } = require("../../apps/desktop/src/main/imageToolsProcessingRuntime");
const { IMAGE_TOOLS_CHANNELS, trustedFileSender, registerImageToolsIpcHandlers } = require("../../apps/desktop/src/main/imageToolsIpc");

const ROOT = path.resolve(__dirname, "../..");

async function fixture(width, height, mime) {
  const image = new Jimp({ width, height, color:0x3366ccff });
  image.setPixelColor(0xffcc33ff, Math.min(2, width - 1), Math.min(2, height - 1));
  return image.getBuffer(mime, mime === "image/jpeg" ? { quality:85 } : undefined);
}

async function processImage(runtime, bytes, transform, id) {
  const result = await runtime.process({ requestId:id, bytes, transform });
  assert.equal(result.ok, true, result.error);
  return result;
}

async function main() {
  const runtime = createImageToolsProcessingRuntime();
  const png = await fixture(64, 48, "image/png");
  const jpeg = await fixture(80, 60, "image/jpeg");

  assert.deepEqual(contract.INPUT_MIME_TYPES, ["image/png", "image/jpeg"]);
  assert.deepEqual(contract.OUTPUT_MIME_TYPES, ["image/png", "image/jpeg"]);
  assert.equal(contract.IMAGE_TOOLS_LIMITS.maxFileBytes, 12 * 1024 * 1024);
  assert.equal(contract.IMAGE_TOOLS_LIMITS.maxPixels, 12 * 1000 * 1000);
  assert.equal(contract.IMAGE_TOOLS_LIMITS.maxDimension, 6000);
  assert.equal(contract.publicPolicy().processingModel, "WORKER_THREAD");
  assert.equal(contract.publicPolicy().networkRequired, false);

  const identity = await processImage(runtime, png, { outputMime:"image/png" }, "image_tools_identity");
  assert.equal(identity.width, 64);
  assert.equal(identity.height, 48);
  assert.equal(contract.probeImage(Buffer.from(identity.bytes)).mime, "image/png");

  const resized = await processImage(runtime, png, { resize:{ width:32, height:24 }, outputMime:"image/png" }, "image_tools_resize");
  assert.equal(resized.width, 32);
  assert.equal(resized.height, 24);

  const cropped = await processImage(runtime, png, { crop:{ x:4, y:3, width:20, height:10 }, outputMime:"image/png" }, "image_tools_crop");
  assert.equal(cropped.width, 20);
  assert.equal(cropped.height, 10);

  const rotated = await processImage(runtime, png, { rotation:90, outputMime:"image/png" }, "image_tools_rotate");
  assert.equal(rotated.width, 48);
  assert.equal(rotated.height, 64);

  const horizontal = await processImage(runtime, png, { flipHorizontal:true, outputMime:"image/png" }, "image_tools_flip_h");
  const vertical = await processImage(runtime, png, { flipVertical:true, outputMime:"image/png" }, "image_tools_flip_v");
  assert.equal(horizontal.width, 64);
  assert.equal(vertical.height, 48);

  const converted = await processImage(runtime, png, { outputMime:"image/jpeg", jpegQuality:80 }, "image_tools_convert");
  assert.equal(contract.probeImage(Buffer.from(converted.bytes)).mime, "image/jpeg");
  const jpegIdentity = await processImage(runtime, jpeg, { outputMime:"image/jpeg" }, "image_tools_jpeg");
  assert.equal(jpegIdentity.mime, "image/jpeg");

  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "weishan-image-tools-"));
  const sourcePath = path.join(temp, "source.png");
  const outputPath = path.join(temp, "export.jpg");
  fs.writeFileSync(sourcePath, png);
  fs.writeFileSync(outputPath, Buffer.from(converted.bytes));
  assert.deepEqual(fs.readFileSync(sourcePath), png);
  const exported = await Jimp.read(outputPath);
  assert.equal(exported.width, 64);
  assert.equal(exported.height, 48);
  fs.rmSync(temp, { recursive:true, force:true });

  const bad = Buffer.from("not an image", "utf8");
  assert.equal(contract.validateRequest({ requestId:"image_tools_bad_1", bytes:bad, transform:{} }).error, "UNSUPPORTED_OR_MALFORMED_IMAGE");
  const fakePng = Buffer.alloc(24);
  Buffer.from("89504e470d0a1a0a", "hex").copy(fakePng, 0);
  Buffer.from("IHDR", "ascii").copy(fakePng, 12);
  fakePng.writeUInt32BE(6001, 16);
  fakePng.writeUInt32BE(1, 20);
  assert.equal(contract.validateRequest({ requestId:"image_tools_large_dim", bytes:fakePng, transform:{} }).error, "IMAGE_DIMENSIONS_TOO_LARGE");
  assert.equal(contract.validateRequest({ requestId:"image_tools_bad_resize", bytes:png, transform:{ resize:{ width:0, height:20 } } }).error, "INVALID_RESIZE");
  assert.equal(contract.validateRequest({ requestId:"image_tools_bad_crop", bytes:png, transform:{ crop:{ x:60, y:0, width:10, height:10 } } }).error, "INVALID_CROP");
  assert.equal(contract.validateRequest({ requestId:"image_tools_bad_format", bytes:png, transform:{ outputMime:"image/webp" } }).error, "UNSUPPORTED_OUTPUT_FORMAT");

  class WaitingWorker extends EventEmitter {
    terminate(){ this.terminated = true; return Promise.resolve(0); }
  }
  const cancellable = createImageToolsProcessingRuntime({ WorkerClass:WaitingWorker });
  const pending = cancellable.process({ requestId:"image_tools_cancel_1", bytes:png, transform:{} });
  assert.deepEqual(cancellable.cancel("image_tools_cancel_1"), { ok:true, cancelled:true });
  assert.equal((await pending).error, "CANCELLED");
  cancellable.dispose();

  const workspace = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/routes/ImageToolsWorkspace.js"), "utf8");
  const preload = fs.readFileSync(path.join(ROOT, "apps/desktop/src/preload.js"), "utf8");
  const registry = fs.readFileSync(path.join(ROOT, "apps/desktop/src/renderer/core/pluginRegistry.js"), "utf8");
  const main = fs.readFileSync(path.join(ROOT, "apps/desktop/src/main.js"), "utf8");
  assert.equal(/fetch\(|XMLHttpRequest|openExternal|https?:\/\//.test(workspace), false);
  assert.equal(/\banalytics\b|\bdiagnostic\b|\bsupport\b|\bmail\b|\bcredential\b|secure\./i.test(workspace), false);
  assert.equal(/console\.(log|debug|info|warn|error)/.test(workspace), false);
  assert.equal(/readAnyFile|writeAnyFile|executeCommand|shellExec/.test(preload), false);
  assert.deepEqual(IMAGE_TOOLS_CHANNELS, { process:"image-tools:process", cancel:"image-tools:cancel", export:"image-tools:export" });
  assert.equal(main.includes("registerImageToolsIpcHandlers(ipcMain, {"), true);
  assert.equal(preload.includes("ipcRenderer.invoke(IMAGE_TOOLS_CHANNELS.process"), true);
  assert.equal(preload.includes("ipcRenderer.invoke(IMAGE_TOOLS_CHANNELS.cancel"), true);
  assert.equal(preload.includes("ipcRenderer.invoke(IMAGE_TOOLS_CHANNELS.export"), true);
  assert.equal(preload.includes("createImageToolsProcessingRuntime"), false);
  assert.equal(registry.includes('pluginId:"image-tools"'), true);
  assert.equal(registry.includes('connectionState:"READY"'), true);
  assert.equal(registry.includes('network:false, filesystem:true'), true);
  assert.equal(workspace.includes("currentGeneration !== generation"), true);
  assert.equal(workspace.includes("URL.revokeObjectURL"), true);
  assert.equal(workspace.includes("runtime.export"), true);
  assert.equal(workspace.includes("sourceName + \"-weishan.\""), true);
  assert.equal(workspace.includes("file.arrayBuffer()"), true);

  const handlers = new Map();
  const fakeIpcMain = { handle:(channel,handler)=>handlers.set(channel,handler), removeHandler:(channel)=>handlers.delete(channel) };
  const exportTemp = fs.mkdtempSync(path.join(os.tmpdir(), "weishan-image-export-"));
  const exportPath = path.join(exportTemp, "chosen.png");
  const fakeRuntime = { process:async()=>({ ok:true }), cancel:()=>({ ok:true,cancelled:true }), dispose:()=>{} };
  registerImageToolsIpcHandlers(fakeIpcMain, { runtime:fakeRuntime, showSaveDialog:async()=>({ canceled:false, filePath:exportPath }) });
  const trustedEvent = { sender:{ getURL:()=>"file:///app/index.html" }, senderFrame:{ url:"file:///app/index.html" } };
  const remoteFrameEvent = { sender:{ getURL:()=>"file:///app/index.html" }, senderFrame:{ url:"https://attacker.invalid/" } };
  assert.equal(trustedFileSender(trustedEvent), true);
  assert.equal(trustedFileSender(remoteFrameEvent), false);
  assert.equal((await handlers.get(IMAGE_TOOLS_CHANNELS.process)(remoteFrameEvent, {})).error, "INVALID_CALLER");
  assert.equal((await handlers.get(IMAGE_TOOLS_CHANNELS.cancel)(remoteFrameEvent, {})).error, "INVALID_CALLER");
  assert.equal((await handlers.get(IMAGE_TOOLS_CHANNELS.process)(trustedEvent, {})).ok, true);
  assert.equal((await handlers.get(IMAGE_TOOLS_CHANNELS.export)(remoteFrameEvent, {})).error, "INVALID_CALLER");
  const exportedByHandler = await handlers.get(IMAGE_TOOLS_CHANNELS.export)(trustedEvent, { requestId:"image_tools_export_1", bytes:identity.bytes, mime:"image/png", suggestedName:"../unsafe.png" });
  assert.equal(exportedByHandler.saved, true);
  assert.deepEqual(fs.readFileSync(exportPath), Buffer.from(identity.bytes));
  fs.rmSync(exportTemp, { recursive:true, force:true });

  const smallStarted = Date.now();
  await processImage(runtime, await fixture(128, 96, "image/png"), { resize:{ width:64, height:48 }, outputMime:"image/png" }, "image_tools_perf_small");
  const smallMs = Date.now() - smallStarted;
  const mediumStarted = Date.now();
  await processImage(runtime, await fixture(800, 600, "image/png"), { resize:{ width:400, height:300 }, rotation:90, outputMime:"image/jpeg" }, "image_tools_perf_medium");
  const mediumMs = Date.now() - mediumStarted;
  const largeStarted = Date.now();
  await processImage(runtime, await fixture(1600, 1200, "image/png"), { resize:{ width:800, height:600 }, outputMime:"image/jpeg" }, "image_tools_perf_large");
  const largeMs = Date.now() - largeStarted;
  assert.ok(smallMs < contract.IMAGE_TOOLS_LIMITS.timeoutMs);
  assert.ok(mediumMs < contract.IMAGE_TOOLS_LIMITS.timeoutMs);
  assert.ok(largeMs < contract.IMAGE_TOOLS_LIMITS.timeoutMs);
  runtime.dispose();

  console.log("IMAGE_TOOLS_JIMP_EFFECTIVENESS PASS " + JSON.stringify({ smallMs, mediumMs, largeMs }));
}

main().catch((error) => { console.error(error); process.exit(1); });
