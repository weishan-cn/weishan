import { createStorageAdapter } from "./storageAdapter.js";
import { createMetadataAdapter } from "./metadataAdapter.js";

function normalizeOwnerType(ownerType) {
  return ownerType === "organization" ? "organization" : "user";
}

function pathPrefixFor(ownerType, ownerId) {
  const type = normalizeOwnerType(ownerType);
  const id = String(ownerId || (type === "organization" ? "local-organization" : "local-user")).replace(/[^a-zA-Z0-9._-]/g, "_");
  return type === "organization" ? "organizations/" + id + "/" : "users/" + id + "/";
}

function bytesFromGb(gb) {
  return Number(gb || 0) * 1024 * 1024 * 1024;
}

function usageWarning(usedBytes, quotaBytes) {
  if (!quotaBytes) return { level:"local_only", percent:0, blocked:false };
  const percent = Math.round((usedBytes / quotaBytes) * 100);
  if (percent >= 100) return { level:"blocked_100", percent, blocked:true };
  if (percent >= 90) return { level:"warning_90", percent, blocked:false };
  if (percent >= 80) return { level:"warning_80", percent, blocked:false };
  return { level:"ok", percent, blocked:false };
}

function createCloudContext(config = {}) {
  return {
    metadata:createMetadataAdapter(config.metadata || { provider:"local_mock" }),
    storage:createStorageAdapter(config.storage || { provider:"local_mock" }),
    config:Object.assign({ defaultProvider:"local_mock" }, config)
  };
}

async function ensureAllocation(ctx, input = {}) {
  const ownerType = normalizeOwnerType(input.ownerType);
  const ownerId = input.ownerId || (ownerType === "organization" ? "local-organization" : "local-user");
  let allocation = await ctx.metadata.getStorageAllocation({ ownerType, ownerId });
  if (!allocation && input.createIfMissing) {
    allocation = await ctx.metadata.createStorageAllocation({
      ownerType,
      ownerId,
      planId:input.planId || "free_local",
      quotaGb:Number(input.quotaGb || 0),
      provider:input.provider || ctx.config.defaultProvider || "local_mock",
      pathPrefix:pathPrefixFor(ownerType, ownerId)
    });
  }
  return allocation;
}

async function getStorageStatus(input = {}, context) {
  const ctx = context || createCloudContext();
  const ownerType = normalizeOwnerType(input.ownerType);
  const ownerId = input.ownerId || (ownerType === "organization" ? "local-organization" : "local-user");
  const subscription = await ctx.metadata.getSubscriptionStatus({ ownerType, ownerId });
  const allocation = await ensureAllocation(ctx, { ownerType, ownerId });
  const pathPrefix = allocation && allocation.pathPrefix || pathPrefixFor(ownerType, ownerId);
  const usage = await ctx.storage.getUsage({ pathPrefix });
  const quotaBytes = bytesFromGb(allocation && allocation.quotaGb || 0);
  const warning = usageWarning(usage.usedBytes || 0, quotaBytes);
  return {
    ok:true,
    ownerType,
    ownerId,
    subscription,
    allocation,
    pathPrefix,
    usage,
    quotaBytes,
    warning,
    localOnly:!allocation || !allocation.quotaGb
  };
}

async function allocateStorage(input = {}, context) {
  const ctx = context || createCloudContext();
  const ownerType = normalizeOwnerType(input.ownerType);
  const ownerId = input.ownerId || (ownerType === "organization" ? "local-organization" : "local-user");
  return ctx.metadata.createStorageAllocation({
    ownerType,
    ownerId,
    planId:input.planId || "manual_mock",
    quotaGb:Number(input.quotaGb || 0),
    provider:input.provider || "local_mock",
    pathPrefix:pathPrefixFor(ownerType, ownerId)
  });
}

async function createUploadUrl(input = {}, context) {
  const ctx = context || createCloudContext();
  const status = await getStorageStatus(input, ctx);
  const incomingBytes = Number(input.fileSizeBytes || 0);
  if (status.warning.blocked || (status.quotaBytes && status.usage.usedBytes + incomingBytes > status.quotaBytes)) {
    return {
      ok:false,
      error:"quota_exceeded",
      warning:Object.assign({}, status.warning, { blocked:true })
    };
  }
  const objectKey = String(input.objectKey || "").replace(/^\/+/, "");
  const signed = await ctx.storage.generateSignedUrl({
    ownerType:status.ownerType,
    ownerId:status.ownerId,
    objectKey:status.pathPrefix + objectKey,
    operation:"upload",
    expiresInSeconds:900
  });
  await ctx.metadata.recordAuditLog({
    action:"storage.createUploadUrl",
    ownerType:status.ownerType,
    ownerId:status.ownerId,
    result:"mock_signed_url_created"
  });
  return {
    ok:true,
    provider:ctx.storage.provider,
    signedUrl:signed.signedUrl,
    objectKey:status.pathPrefix + objectKey,
    warning:status.warning
  };
}

async function deleteObject(input = {}, context) {
  const ctx = context || createCloudContext();
  const ownerType = normalizeOwnerType(input.ownerType);
  const ownerId = input.ownerId || (ownerType === "organization" ? "local-organization" : "local-user");
  const prefix = pathPrefixFor(ownerType, ownerId);
  const objectKey = String(input.objectKey || "").replace(/^\/+/, "");
  return ctx.storage.delete({ ownerType, ownerId, objectKey:prefix + objectKey });
}

async function testCloudServices(context) {
  const ctx = context || createCloudContext();
  const metadata = await ctx.metadata.testConnection();
  const storage = await ctx.storage.testConnection();
  return {
    ok:Boolean(storage.ok),
    metadata,
    storage,
    providerSwitchable:true
  };
}

export {
  createCloudContext,
  getStorageStatus,
  allocateStorage,
  createUploadUrl,
  deleteObject,
  testCloudServices,
  pathPrefixFor,
  usageWarning
};
