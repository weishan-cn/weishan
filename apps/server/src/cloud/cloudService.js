import { createStorageAdapter } from "./storageAdapter.js";
import { createMetadataAdapter } from "./metadataAdapter.js";

const PERSONAL_CLOUD_MOCK_QUOTA_GB = 20;
const DEFAULT_ENTERPRISE_PLAN_ID = "CN_ENTERPRISE_BASIC";
const ENTERPRISE_PLAN_FALLBACKS = {
  CN_ENTERPRISE_BASIC:{ storageQuotaGb:300, quotaGb:300, memberLimit:5, region:"cn" },
  CN_ENTERPRISE_STANDARD:{ storageQuotaGb:1024, quotaGb:1024, memberLimit:20, region:"cn" },
  CN_ENTERPRISE_PRO:{ storageQuotaGb:5120, quotaGb:5120, memberLimit:50, region:"cn" },
  GLOBAL_ENTERPRISE_BASIC:{ storageQuotaGb:300, quotaGb:300, memberLimit:5, region:"global" },
  GLOBAL_ENTERPRISE_STANDARD:{ storageQuotaGb:1024, quotaGb:1024, memberLimit:20, region:"global" },
  GLOBAL_ENTERPRISE_PRO:{ storageQuotaGb:5120, quotaGb:5120, memberLimit:50, region:"global" }
};
const PLAN_ID_ALIASES = {
  enterprise_basic_cn:"CN_ENTERPRISE_BASIC",
  enterprise_standard_cn:"CN_ENTERPRISE_STANDARD",
  enterprise_advanced_cn:"CN_ENTERPRISE_PRO",
  enterprise_basic_global:"GLOBAL_ENTERPRISE_BASIC",
  enterprise_standard_global:"GLOBAL_ENTERPRISE_STANDARD",
  enterprise_advanced_global:"GLOBAL_ENTERPRISE_PRO",
  enterprise_cloud_mock:DEFAULT_ENTERPRISE_PLAN_ID
};

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

function normalizePlanId(planId, ownerType) {
  const id = String(planId || defaultPlanIdFor(ownerType));
  return PLAN_ID_ALIASES[id] || id;
}

async function plansFor(ctx) {
  const plans = await ctx.metadata.getPlans();
  return Array.isArray(plans) ? plans : [];
}

function planFromFallback(planId, ownerType) {
  const id = normalizePlanId(planId, ownerType);
  if (ENTERPRISE_PLAN_FALLBACKS[id]) {
    return Object.assign({ planId:id, planType:"enterprise", cloudEnabled:true }, ENTERPRISE_PLAN_FALLBACKS[id]);
  }
  if (id === "personal_cloud_mock") {
    return { planId:id, planType:"personal", storageQuotaGb:PERSONAL_CLOUD_MOCK_QUOTA_GB, quotaGb:PERSONAL_CLOUD_MOCK_QUOTA_GB, memberLimit:1, cloudEnabled:true };
  }
  return { planId:"free_local", planType:"personal", storageQuotaGb:0, quotaGb:0, memberLimit:1, cloudEnabled:false, localStorageWarning:"免费个人用户默认 local only，本地数据仅保存在当前设备。" };
}

async function planById(ctx, planId, ownerType) {
  const id = normalizePlanId(planId, ownerType);
  const plans = await plansFor(ctx);
  return plans.find((plan) => plan && plan.planId === id) || planFromFallback(id, ownerType);
}

function defaultPlanIdFor(ownerType) {
  return ownerType === "organization" ? DEFAULT_ENTERPRISE_PLAN_ID : "free_local";
}

function storageQuotaFor(plan) {
  return Number((plan && (plan.storageQuotaGb || plan.quotaGb)) || 0);
}

function memberLimitFor(plan) {
  return Number((plan && plan.memberLimit) || 1);
}

function storageStatusFor(allocation, usage) {
  const quotaGb = Number((allocation && (allocation.storageQuotaGb || allocation.quotaGb)) || 0);
  const quotaBytes = bytesFromGb(quotaGb);
  const usedBytes = Number((usage && usage.usedBytes) || 0);
  return {
    mode:quotaGb ? "mock_cloud_allocated" : "local_only",
    quotaGb,
    quotaBytes,
    usedBytes,
    warning:usageWarning(usedBytes, quotaBytes)
  };
}

function activeMembers(members) {
  return (members || []).filter((member) => member && member.status === "active");
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
    const plan = await planById(ctx, input.planId, ownerType);
    allocation = await ctx.metadata.createStorageAllocation({
      ownerType,
      ownerId,
      planId:plan.planId,
      quotaGb:Number(input.quotaGb || storageQuotaFor(plan)),
      storageQuotaGb:Number(input.storageQuotaGb || input.quotaGb || storageQuotaFor(plan)),
      memberLimit:memberLimitFor(plan),
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
  const plan = await planById(ctx, input.planId, ownerType);
  return ctx.metadata.createStorageAllocation({
    ownerType,
    ownerId,
    planId:plan.planId,
    quotaGb:Number(input.quotaGb || storageQuotaFor(plan)),
    storageQuotaGb:Number(input.storageQuotaGb || input.quotaGb || storageQuotaFor(plan)),
    memberLimit:memberLimitFor(plan),
    provider:input.provider || "local_mock",
    pathPrefix:pathPrefixFor(ownerType, ownerId)
  });
}

async function getPlans(context) {
  const ctx = context || createCloudContext();
  return {
    ok:true,
    plans:await plansFor(ctx),
    localStorageWarning:"免费个人用户默认 local only，本地数据仅保存在当前设备；注册/登录后仍需明确启用云套餐。"
  };
}

async function getOrganizationStatus(input = {}, context) {
  const ctx = context || createCloudContext();
  const organizationId = input.organizationId || input.ownerId || "local-organization";
  const plan = await planById(ctx, input.planId, "organization");
  let allocation = await ctx.metadata.getStorageAllocation({ ownerType:"organization", ownerId:organizationId });
  if (!allocation) {
    allocation = await allocateStorage({
      ownerType:"organization",
      ownerId:organizationId,
      planId:plan.planId,
      provider:input.provider || "local_mock"
    }, ctx);
  }
  const members = await ctx.metadata.listOrganizationMembers({ organizationId });
  const active = activeMembers(members);
  const storageStatus = storageStatusFor(allocation, { usedBytes:0 });
  return {
    ok:true,
    organizationId,
    planId:allocation.planId || plan.planId,
    planType:"enterprise",
    region:plan.region || "",
    quotaGb:Number(allocation.quotaGb || storageQuotaFor(plan)),
    storageQuotaGb:Number(allocation.storageQuotaGb || allocation.quotaGb || storageQuotaFor(plan)),
    quotaBytes:bytesFromGb(allocation.quotaGb || storageQuotaFor(plan)),
    memberLimit:Number(allocation.memberLimit || memberLimitFor(plan)),
    activeMemberCount:active.length,
    totalMemberRecords:members.length,
    pathPrefix:allocation.pathPrefix || pathPrefixFor("organization", organizationId),
    provider:allocation.provider || "local_mock",
    storageMode:"local_mock",
    storageStatus,
    cloudEnabled:true,
    storageExpansionAvailable:true
  };
}

async function inviteOrganizationMember(input = {}, context) {
  const ctx = context || createCloudContext();
  const organizationId = input.organizationId || input.ownerId || "local-organization";
  const status = await getOrganizationStatus(input, ctx);
  if (status.activeMemberCount >= status.memberLimit) {
    return {
      ok:false,
      code:"MEMBER_LIMIT_REACHED",
      message:"当前企业套餐最多支持 " + status.memberLimit + " 名成员。如需继续邀请，请升级企业套餐。",
      organizationId,
      planId:status.planId,
      memberLimit:status.memberLimit,
      activeMemberCount:status.activeMemberCount,
      ignoredStatuses:["invited", "removed", "rejected", "expired"]
    };
  }
  const member = await ctx.metadata.createOrganizationMember({
    organizationId,
    email:String(input.email || "").trim(),
    name:String(input.name || "").trim(),
    role:input.role || "member",
    status:"invited"
  });
  return {
    ok:true,
    organizationId,
    result:"invited",
    member,
    memberLimit:status.memberLimit,
    activeMemberCount:status.activeMemberCount
  };
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
  getPlans,
  getOrganizationStatus,
  inviteOrganizationMember,
  createUploadUrl,
  deleteObject,
  testCloudServices,
  pathPrefixFor,
  usageWarning,
  DEFAULT_ENTERPRISE_PLAN_ID
};
