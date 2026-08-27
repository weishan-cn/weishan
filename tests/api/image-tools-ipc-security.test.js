const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const { Jimp } = require("../../apps/desktop/node_modules/jimp");
const { IMAGE_TOOLS_CHANNELS, registerImageToolsIpcHandlers } = require("../../apps/desktop/src/main/imageToolsIpc");

async function main() {
  const png = await new Jimp({ width:8, height:6, color:0x112233ff }).getBuffer("image/png");
  const handlers = new Map();
  const ipcMain = { handle:(channel,handler)=>handlers.set(channel,handler), removeHandler:(channel)=>handlers.delete(channel) };
  const calls = { process:0, cancel:0, dialog:0, write:0 };
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "weishan-image-ipc-"));
  const chosen = path.join(temp, "chosen.png");
  let dialogOptions = null;
  registerImageToolsIpcHandlers(ipcMain, {
    runtime:{
      process:async()=>{ calls.process += 1; return { ok:true }; },
      cancel:()=>{ calls.cancel += 1; return { ok:true, cancelled:true }; },
      dispose:()=>{}
    },
    showSaveDialog:async(options)=>{ calls.dialog += 1; dialogOptions=options; return { canceled:false, filePath:chosen }; },
    writeFile:async(filePath,bytes)=>{ calls.write += 1; assert.equal(filePath, chosen); fs.writeFileSync(filePath, bytes); }
  });
  assert.deepEqual(Array.from(handlers.keys()).sort(), ["image-tools:cancel", "image-tools:export", "image-tools:process"]);

  const trusted = { sender:{ getURL:()=>"file:///weishan/index.html" }, senderFrame:{ url:"file:///weishan/index.html" } };
  const remote = { sender:{ getURL:()=>"file:///weishan/index.html" }, senderFrame:{ url:"https://untrusted.invalid/frame" } };
  const noSender = {};
  assert.equal((await handlers.get(IMAGE_TOOLS_CHANNELS.process)(remote, {})).error, "INVALID_CALLER");
  assert.equal((await handlers.get(IMAGE_TOOLS_CHANNELS.cancel)(noSender, {})).error, "INVALID_CALLER");
  assert.equal((await handlers.get(IMAGE_TOOLS_CHANNELS.export)(remote, {})).error, "INVALID_CALLER");
  assert.deepEqual(calls, { process:0, cancel:0, dialog:0, write:0 });

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
  assert.equal(dialogOptions.defaultPath, ".._.._outside.png");
  assert.equal(dialogOptions.defaultPath.includes("/"), false);
  assert.equal(dialogOptions.properties.includes("showOverwriteConfirmation"), true);
  assert.deepEqual(fs.readFileSync(chosen), png);
  assert.equal(Object.prototype.hasOwnProperty.call(saved, "filePath"), false);

  const wrongExtension = path.join(temp, "wrong.txt");
  registerImageToolsIpcHandlers(ipcMain, {
    runtime:{ process:async()=>({ ok:true }), cancel:()=>({ ok:true }), dispose:()=>{} },
    showSaveDialog:async()=>({ canceled:false, filePath:wrongExtension }),
    writeFile:async()=>{ throw new Error("must not write"); }
  });
  const rejected = await handlers.get(IMAGE_TOOLS_CHANNELS.export)(trusted, { requestId:"image_tools_export_ext", bytes:png, mime:"image/png", suggestedName:"image.png" });
  assert.equal(rejected.error, "EXPORT_EXTENSION_MISMATCH");
  assert.equal(fs.existsSync(wrongExtension), false);

  fs.rmSync(temp, { recursive:true, force:true });
  console.log("IMAGE_TOOLS_IPC_SECURITY PASS");
}

main().catch((error) => { console.error(error); process.exit(1); });
