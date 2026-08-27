const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { pathToFileURL } = require("node:url");
const { Jimp } = require("../../apps/desktop/node_modules/jimp");
const { IMAGE_TOOLS_CHANNELS, registerImageToolsIpcHandlers } = require("../../apps/desktop/src/main/imageToolsIpc");

async function main() {
  const png = await new Jimp({ width:8, height:6, color:0x112233ff }).getBuffer("image/png");
  const handlers = new Map();
  const ipcMain = { handle:(channel,handler)=>handlers.set(channel,handler), removeHandler:(channel)=>handlers.delete(channel) };
  const calls = { process:0, validateExport:0, cancel:0, dialog:0, write:0 };
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "weishan-image-ipc-"));
  const chosen = path.join(temp, "chosen.png");
  let dialogOptions = null;
  registerImageToolsIpcHandlers(ipcMain, {
    runtime:{
      process:async()=>{ calls.process += 1; return { ok:true }; },
      validateExport:async()=>{ calls.validateExport += 1; return { ok:true }; },
      cancel:()=>{ calls.cancel += 1; return { ok:true, cancelled:true }; },
      dispose:()=>{}
    },
    showSaveDialog:async(options)=>{ calls.dialog += 1; dialogOptions=options; return { canceled:false, filePath:chosen }; },
    writeFile:async(filePath,bytes)=>{ calls.write += 1; assert.equal(filePath, chosen); fs.writeFileSync(filePath, bytes); }
  });
  assert.deepEqual(Array.from(handlers.keys()).sort(), ["image-tools:cancel", "image-tools:export", "image-tools:process"]);

  const rendererUrl = pathToFileURL(path.join(__dirname, "../../apps/desktop/src/index.html")).href;
  const mainFrame = { url:rendererUrl };
  const sender = { getURL:()=>rendererUrl, mainFrame };
  const trusted = { sender, senderFrame:mainFrame };
  const remote = { sender, senderFrame:{ url:"https://untrusted.invalid/frame" } };
  const localSubframe = { sender, senderFrame:{ url:rendererUrl } };
  const otherLocalUrl = pathToFileURL(path.join(temp, "other.html")).href;
  const otherMainFrame = { url:otherLocalUrl };
  const otherLocalMain = { sender:{ getURL:()=>otherLocalUrl, mainFrame:otherMainFrame }, senderFrame:otherMainFrame };
  const noSender = {};
  assert.equal((await handlers.get(IMAGE_TOOLS_CHANNELS.process)(remote, {})).error, "INVALID_CALLER");
  assert.equal((await handlers.get(IMAGE_TOOLS_CHANNELS.process)(localSubframe, {})).error, "INVALID_CALLER");
  assert.equal((await handlers.get(IMAGE_TOOLS_CHANNELS.process)(otherLocalMain, {})).error, "INVALID_CALLER");
  assert.equal((await handlers.get(IMAGE_TOOLS_CHANNELS.cancel)(noSender, {})).error, "INVALID_CALLER");
  assert.equal((await handlers.get(IMAGE_TOOLS_CHANNELS.export)(remote, {})).error, "INVALID_CALLER");
  assert.deepEqual(calls, { process:0, validateExport:0, cancel:0, dialog:0, write:0 });

  await handlers.get(IMAGE_TOOLS_CHANNELS.process)(trusted, { requestId:"image_tools_process_1" });
  await handlers.get(IMAGE_TOOLS_CHANNELS.cancel)(trusted, { requestId:"image_tools_process_1" });
  assert.equal(calls.process, 1);
  assert.equal(calls.cancel, 1);

  const invalidExport = await handlers.get(IMAGE_TOOLS_CHANNELS.export)(trusted, { requestId:"image_tools_export_bad", bytes:Buffer.from("bad"), mime:"image/png", suggestedName:"../../outside.png" });
  assert.equal(invalidExport.error, "INVALID_EXPORT_IMAGE");
  assert.equal(calls.dialog, 0);
  assert.equal(calls.write, 0);

  const saved = await handlers.get(IMAGE_TOOLS_CHANNELS.export)(trusted, { requestId:"image_tools_export_good", bytes:png, mime:"image/png", suggestedName:"../../outside.png" });
  assert.deepEqual(saved, { ok:true, saved:true, cancelled:false });
  assert.equal(calls.dialog, 1);
  assert.equal(calls.write, 1);
  assert.equal(calls.validateExport, 1);
  assert.equal(dialogOptions.defaultPath, ".._.._outside.png");
  assert.equal(dialogOptions.defaultPath.includes("/"), false);
  assert.equal(dialogOptions.properties.includes("showOverwriteConfirmation"), true);
  assert.deepEqual(fs.readFileSync(chosen), png);
  assert.equal(Object.prototype.hasOwnProperty.call(saved, "filePath"), false);

  const wrongExtension = path.join(temp, "wrong.txt");
  registerImageToolsIpcHandlers(ipcMain, {
    runtime:{ process:async()=>({ ok:true }), validateExport:async()=>({ ok:true }), cancel:()=>({ ok:true }), dispose:()=>{} },
    showSaveDialog:async()=>({ canceled:false, filePath:wrongExtension }),
    writeFile:async()=>{ throw new Error("must not write"); }
  });
  const rejected = await handlers.get(IMAGE_TOOLS_CHANNELS.export)(trusted, { requestId:"image_tools_export_ext", bytes:png, mime:"image/png", suggestedName:"image.png" });
  assert.equal(rejected.error, "EXPORT_EXTENSION_MISMATCH");
  assert.equal(fs.existsSync(wrongExtension), false);

  for (const extension of ["js", "sh", "command", "plist", "json"]) {
    const unsafePath = path.join(temp, "unsafe." + extension);
    registerImageToolsIpcHandlers(ipcMain, {
      runtime:{ process:async()=>({ ok:true }), validateExport:async()=>({ ok:true }), cancel:()=>({ ok:true }), dispose:()=>{} },
      showSaveDialog:async()=>({ canceled:false, filePath:unsafePath }),
      writeFile:async()=>{ throw new Error("must not write"); }
    });
    const unsafeType = await handlers.get(IMAGE_TOOLS_CHANNELS.export)(trusted, { requestId:"image_tools_type_" + extension, bytes:png, mime:"image/png", suggestedName:"image.png" });
    assert.equal(unsafeType.error, "EXPORT_EXTENSION_MISMATCH");
    assert.equal(fs.existsSync(unsafePath), false);
  }

  let releaseDialog;
  const waitingDialog = new Promise((resolve) => { releaseDialog = resolve; });
  registerImageToolsIpcHandlers(ipcMain, {
    runtime:{ process:async()=>({ ok:true }), validateExport:async()=>({ ok:true }), cancel:()=>({ ok:true }), dispose:()=>{} },
    showSaveDialog:async()=>waitingDialog,
    writeFile:async()=>{}
  });
  const firstExport = handlers.get(IMAGE_TOOLS_CHANNELS.export)(trusted, { requestId:"image_tools_export_wait", bytes:png, mime:"image/png", suggestedName:"image.png" });
  await new Promise((resolve) => setImmediate(resolve));
  const concurrentExport = await handlers.get(IMAGE_TOOLS_CHANNELS.export)(trusted, { requestId:"image_tools_export_next", bytes:png, mime:"image/png", suggestedName:"image.png" });
  assert.equal(concurrentExport.error, "EXPORT_IN_PROGRESS");
  releaseDialog({ canceled:true });
  assert.equal((await firstExport).cancelled, true);

  fs.rmSync(temp, { recursive:true, force:true });
  console.log("IMAGE_TOOLS_IPC_SECURITY PASS");
}

main().catch((error) => { console.error(error); process.exit(1); });
