"use strict";

const { createImageToolsProcessingRuntime } = require("./imageToolsProcessingRuntime");
const fs = require("fs");
const { IMAGE_TOOLS_CHANNELS, validateExportRequest } = require("../shared/imageToolsContract");

function trustedFileSender(event) {
  try {
    const senderUrl = event && event.sender && typeof event.sender.getURL === "function" ? event.sender.getURL() : "";
    const frameUrl = event && event.senderFrame && event.senderFrame.url ? String(event.senderFrame.url) : senderUrl;
    return senderUrl.startsWith("file:") && frameUrl.startsWith("file:");
  } catch (_) { return false; }
}

function registerImageToolsIpcHandlers(ipcMain, options) {
  if (!ipcMain || typeof ipcMain.handle !== "function") throw new Error("image_tools_ipc_required");
  const config = options && typeof options === "object" ? options : {};
  const runtime = config.runtime || createImageToolsProcessingRuntime(config.runtimeOptions);
  const validateSender = typeof config.validateSender === "function" ? config.validateSender : trustedFileSender;
  const showSaveDialog = typeof config.showSaveDialog === "function" ? config.showSaveDialog : null;
  const writeFile = typeof config.writeFile === "function" ? config.writeFile : fs.promises.writeFile;
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
    return runtime.cancel(String(payload && payload.requestId || ""));
  });
  ipcMain.handle(IMAGE_TOOLS_CHANNELS.export, async (event, payload) => {
    if (!validateSender(event)) return { ok:false, saved:false, error:"INVALID_CALLER" };
    const parsed = validateExportRequest(payload);
    if (!parsed.ok) return { ok:false, saved:false, error:parsed.error };
    if (!showSaveDialog) return { ok:false, saved:false, error:"EXPORT_UNAVAILABLE" };
    const request = parsed.value;
    try {
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
