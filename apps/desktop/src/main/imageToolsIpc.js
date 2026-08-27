"use strict";

const { createImageToolsProcessingRuntime } = require("./imageToolsProcessingRuntime");
const fs = require("fs");
const path = require("path");
const { fileURLToPath } = require("url");
const { IMAGE_TOOLS_CHANNELS, validateExportRequest, validateCancelRequest } = require("../shared/imageToolsContract");

const TRUSTED_RENDERER_PATH = path.resolve(__dirname, "../index.html");

function trustedFileSender(event) {
  try {
    const sender = event && event.sender;
    const frame = event && event.senderFrame;
    if (!sender || !frame || typeof sender.getURL !== "function" || sender.mainFrame !== frame) return false;
    const senderUrl = new URL(sender.getURL());
    const frameUrl = new URL(String(frame.url || ""));
    return senderUrl.protocol === "file:" && frameUrl.protocol === "file:" &&
      path.resolve(fileURLToPath(senderUrl)) === TRUSTED_RENDERER_PATH &&
      path.resolve(fileURLToPath(frameUrl)) === TRUSTED_RENDERER_PATH;
  } catch (_) { return false; }
}

function registerImageToolsIpcHandlers(ipcMain, options) {
  if (!ipcMain || typeof ipcMain.handle !== "function") throw new Error("image_tools_ipc_required");
  const config = options && typeof options === "object" ? options : {};
  const runtime = config.runtime || createImageToolsProcessingRuntime(config.runtimeOptions);
  const validateSender = typeof config.validateSender === "function" ? config.validateSender : trustedFileSender;
  const showSaveDialog = typeof config.showSaveDialog === "function" ? config.showSaveDialog : null;
  const writeFile = typeof config.writeFile === "function" ? config.writeFile : fs.promises.writeFile;
  let exportDialogActive = false;
  if (typeof ipcMain.removeHandler === "function") {
    ipcMain.removeHandler(IMAGE_TOOLS_CHANNELS.process);
    ipcMain.removeHandler(IMAGE_TOOLS_CHANNELS.cancel);
    ipcMain.removeHandler(IMAGE_TOOLS_CHANNELS.export);
  }
  ipcMain.handle(IMAGE_TOOLS_CHANNELS.process, async (event, payload) => {
    if (!validateSender(event)) return { ok:false, requestId:"", error:"INVALID_CALLER" };
    return runtime.process(payload || {});
  });
  ipcMain.handle(IMAGE_TOOLS_CHANNELS.cancel, async (event, payload) => {
    if (!validateSender(event)) return { ok:false, cancelled:false, error:"INVALID_CALLER" };
    const parsed = validateCancelRequest(payload);
    if (!parsed.ok) return { ok:false, cancelled:false, error:parsed.error };
    return runtime.cancel(parsed.value.requestId);
  });
  ipcMain.handle(IMAGE_TOOLS_CHANNELS.export, async (event, payload) => {
    if (!validateSender(event)) return { ok:false, saved:false, error:"INVALID_CALLER" };
    const parsed = validateExportRequest(payload);
    if (!parsed.ok) return { ok:false, saved:false, error:parsed.error };
    if (!showSaveDialog) return { ok:false, saved:false, error:"EXPORT_UNAVAILABLE" };
    if (exportDialogActive) return { ok:false, saved:false, error:"EXPORT_IN_PROGRESS" };
    const request = parsed.value;
    exportDialogActive = true;
    try {
      if (!runtime || typeof runtime.validateExport !== "function") return { ok:false, saved:false, error:"EXPORT_VALIDATION_UNAVAILABLE" };
      const decoded = await runtime.validateExport(request);
      if (!decoded || decoded.ok !== true) return { ok:false, saved:false, error:"INVALID_EXPORT_IMAGE" };
      const choice = await showSaveDialog({
        title:"Export image",
        defaultPath:request.suggestedName,
        filters:[{ name:request.mime === "image/jpeg" ? "JPEG image" : "PNG image", extensions:[request.extension] }],
        properties:["createDirectory", "showOverwriteConfirmation"]
      });
      if (!choice || choice.canceled || !choice.filePath) return { ok:true, saved:false, cancelled:true };
      const selectedExtension = String(choice.filePath).toLowerCase().split(".").pop();
      if (selectedExtension !== request.extension && !(request.extension === "jpg" && selectedExtension === "jpeg")) return { ok:false, saved:false, error:"EXPORT_EXTENSION_MISMATCH" };
      await writeFile(choice.filePath, request.bytes, { flag:"w" });
      return { ok:true, saved:true, cancelled:false };
    } catch (_) {
      return { ok:false, saved:false, error:"EXPORT_FAILED" };
    } finally {
      exportDialogActive = false;
    }
  });
  return {
    dispose(){
      runtime.dispose();
      if (typeof ipcMain.removeHandler === "function") {
        ipcMain.removeHandler(IMAGE_TOOLS_CHANNELS.process);
        ipcMain.removeHandler(IMAGE_TOOLS_CHANNELS.cancel);
        ipcMain.removeHandler(IMAGE_TOOLS_CHANNELS.export);
      }
    }
  };
}

module.exports = { IMAGE_TOOLS_CHANNELS, trustedFileSender, registerImageToolsIpcHandlers };
