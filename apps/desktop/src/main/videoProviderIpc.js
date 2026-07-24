"use strict";

const { IPC_CHANNELS, validateRequest, envelope, safeError, createTrustedSenderGuard } = require("../shared/videoProviderIpcContract");
const { toCode } = require("./videoProviderGateway");

const OPERATIONS = Object.freeze({ createTask:"createTask", queryTask:"queryTask", cancelTask:"cancelTask", listTasks:"listTasks", downloadArtifacts:"downloadArtifacts", getCapabilities:"getCapabilities", getStatus:"getStatus" });
function registerVideoProviderIpcHandlers(ipcMain, options) {
  const config = options && typeof options === "object" ? options : {};
  const gateway = config.gateway;
  if (!ipcMain || typeof ipcMain.handle !== "function" || !gateway) throw new Error("video_provider_ipc_dependencies_required");
  const senderGuard = createTrustedSenderGuard(config.validateSender);
  const registered = [];
  Object.keys(OPERATIONS).forEach((name) => {
    const channel = IPC_CHANNELS[name];
    const operation = OPERATIONS[name];
    if (typeof ipcMain.removeHandler === "function") ipcMain.removeHandler(channel);
    ipcMain.handle(channel, async (event, payload) => {
      const requestId = payload && payload.requestId;
      if (!senderGuard(event)) return envelope(requestId, null, { code:"INVALID_CHANNEL" });
      const parsed = validateRequest(name, payload);
      if (!parsed.valid) return envelope(requestId, null, parsed.error);
      try {
        const input = parsed.value;
        const data = name === "createTask" ? gateway.createTask(input) : name === "queryTask" ? gateway.queryTask(input.taskId) : name === "cancelTask" ? gateway.cancelTask(input.taskId) : name === "listTasks" ? gateway.listTasks(input) : name === "downloadArtifacts" ? gateway.downloadArtifacts(input.taskId, input.artifactTypes) : name === "getCapabilities" ? gateway.getCapabilities() : gateway.getStatus();
        return envelope(input.requestId, data, null);
      } catch (error) { return envelope(requestId, null, safeError({ code:toCode(error) })); }
    });
    registered.push(channel);
  });
  function dispose() { registered.forEach((channel) => { if (typeof ipcMain.removeHandler === "function") ipcMain.removeHandler(channel); }); }
  return { dispose };
}
module.exports = { registerVideoProviderIpcHandlers, IPC_CHANNELS };
