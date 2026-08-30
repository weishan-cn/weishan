"use strict";

const {
  plainRecord,
  boundedText,
  trustedLocalMainFrameSender
} = require("./merchantNativeReadonlyServiceCore");
const { createPrijsProfeetReadonlyService } = require("./prijsProfeetReadonlyService");
const { createTiendaCentroReadonlyService } = require("./tiendaCentroReadonlyService");
const { createMeblostanReadonlyService } = require("./meblostanReadonlyService");

const MERCHANT_NATIVE_READONLY_REGISTRY_VERSION = "1.0.0";
const SEARCH_CHANNEL = "global-shopping:merchant-native-readonly-search";
const STATUS_CHANNEL = "global-shopping:merchant-native-readonly-status";
const SEARCH_ENVELOPE_KEYS = new Set(["sourceId", "request"]);
const STATUS_ENVELOPE_KEYS = new Set(["sourceId"]);

const STATIC_SOURCE_DEFINITIONS = Object.freeze({
  prijsprofeet_public_api:Object.freeze({
    sourceId:"prijsprofeet_public_api",
    family:"narrow_grocery",
    enabled:true,
    createService:createPrijsProfeetReadonlyService
  }),
  tienda_centro_public_api:Object.freeze({
    sourceId:"tienda_centro_public_api",
    family:"broad_consumer_retail",
    enabled:true,
    createService:createTiendaCentroReadonlyService
  }),
  meblostan_public_api:Object.freeze({
    sourceId:"meblostan_public_api",
    family:"furniture_home_furnishings",
    enabled:true,
    createService:createMeblostanReadonlyService
  })
});

function registryError(code) {
  return {
    ok:false,
    status:"unavailable",
    code,
    results:[],
    redacted:true,
    executionGate:"CLOSED",
    authorizesExecution:false,
    productionTraffic:false
  };
}

function validateEnvelope(value, allowedKeys) {
  const safe = plainRecord(value);
  if (!safe || Object.keys(safe).some((key) => !allowedKeys.has(key))) return null;
  const sourceId = boundedText(safe.sourceId, 80);
  return sourceId ? { sourceId, request:safe.request } : null;
}

function createMerchantNativeReadonlyRegistry(options = {}) {
  const injected = plainRecord(options.services) || {};
  const services = new Map();
  for (const [sourceId, definition] of Object.entries(STATIC_SOURCE_DEFINITIONS)) {
    if (definition.enabled !== true) continue;
    const injectedService = injected[sourceId];
    const service = injectedService && typeof injectedService.search === "function" && typeof injectedService.getStatus === "function"
      ? injectedService
      : definition.createService(options.serviceOptions && options.serviceOptions[sourceId] || {});
    services.set(sourceId, service);
  }

  function serviceFor(sourceId) {
    return Object.prototype.hasOwnProperty.call(STATIC_SOURCE_DEFINITIONS, sourceId) && services.has(sourceId)
      ? services.get(sourceId)
      : null;
  }

  return Object.freeze({
    version:MERCHANT_NATIVE_READONLY_REGISTRY_VERSION,
    enabledSourceIds:Object.freeze(Array.from(services.keys())),
    async search(envelope) {
      const safe = validateEnvelope(envelope, SEARCH_ENVELOPE_KEYS);
      if (!safe || !plainRecord(safe.request)) return registryError("MERCHANT_SOURCE_REQUEST_INVALID");
      const service = serviceFor(safe.sourceId);
      if (!service) return registryError("UNKNOWN_MERCHANT_SOURCE");
      return service.search(safe.request);
    },
    getStatus(envelope) {
      const safe = validateEnvelope(envelope, STATUS_ENVELOPE_KEYS);
      if (!safe) return registryError("MERCHANT_SOURCE_REQUEST_INVALID");
      const service = serviceFor(safe.sourceId);
      if (!service) return registryError("UNKNOWN_MERCHANT_SOURCE");
      return service.getStatus();
    }
  });
}

function registerMerchantNativeReadonlyHandlers(ipcMain, options = {}) {
  const registry = options.registry || createMerchantNativeReadonlyRegistry(options);
  const validateSender = typeof options.validateSender === "function" ? options.validateSender : trustedLocalMainFrameSender;
  ipcMain.handle(SEARCH_CHANNEL, async (event, envelope) => {
    if (!validateSender(event)) return registryError("SOURCE_CALLER_INVALID");
    return registry.search(envelope);
  });
  ipcMain.handle(STATUS_CHANNEL, async (event, envelope) => {
    if (!validateSender(event)) return registryError("SOURCE_CALLER_INVALID");
    return registry.getStatus(envelope);
  });
  return registry;
}

module.exports = {
  MERCHANT_NATIVE_READONLY_REGISTRY_VERSION,
  SEARCH_CHANNEL,
  STATUS_CHANNEL,
  STATIC_SOURCE_DEFINITIONS,
  createMerchantNativeReadonlyRegistry,
  registerMerchantNativeReadonlyHandlers
};
