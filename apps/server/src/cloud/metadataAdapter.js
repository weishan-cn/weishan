const METADATA_PROVIDERS = new Set([
  "local_mock",
  "pocketbase",
  "postgres",
  "supabase",
  "appwrite",
  "firebase",
  "custom_api"
]);

class MetadataAdapter {
  constructor(config = {}) {
    this.config = Object.assign({}, config);
    this.provider = this.config.provider || "local_mock";
  }

  async getPlans() { throw new Error("Not implemented"); }
  async getSubscriptionStatus() { throw new Error("Not implemented"); }
  async getStorageAllocation() { throw new Error("Not implemented"); }
  async createStorageAllocation() { throw new Error("Not implemented"); }
  async getStorageUsage() { throw new Error("Not implemented"); }
  async listOrganizationMembers() { throw new Error("Not implemented"); }
  async createOrganizationMember() { throw new Error("Not implemented"); }
  async recordFileIndex() { throw new Error("Not implemented"); }
  async recordAuditLog() { throw new Error("Not implemented"); }
  async testConnection() { throw new Error("Not implemented"); }
}

class LocalMockMetadataAdapter extends MetadataAdapter {
  constructor(config = {}) {
    super(Object.assign({}, config, { provider:"local_mock" }));
    this.provider = "local_mock";
    this.plans = [
      { planId:"free_local", planType:"personal", region:"local", name:"Free Local", storageQuotaGb:0, quotaGb:0, memberLimit:1, cloudEnabled:false, localStorageWarning:"免费个人用户默认 local only，本地数据仅保存在当前设备。" },
      { planId:"personal_cloud_mock", planType:"personal", region:"mock", name:"Personal Cloud Mock", storageQuotaGb:20, quotaGb:20, memberLimit:1, cloudEnabled:true },
      { planId:"CN_ENTERPRISE_BASIC", plan_id:"CN_ENTERPRISE_BASIC", planName:"中国区企业基础版", plan_name:"中国区企业基础版", planType:"enterprise", plan_type:"enterprise", region:"CN", name:"中国区企业基础版", storageQuotaGb:300, storage_quota_gb:300, quotaGb:300, memberLimit:5, member_limit:5, monthly_price:299, yearly_price:2999, currency:"CNY", cloudEnabled:true },
      { planId:"CN_ENTERPRISE_STANDARD", plan_id:"CN_ENTERPRISE_STANDARD", planName:"中国区企业标准版", plan_name:"中国区企业标准版", planType:"enterprise", plan_type:"enterprise", region:"CN", name:"中国区企业标准版", storageQuotaGb:1024, storage_quota_gb:1024, quotaGb:1024, memberLimit:20, member_limit:20, monthly_price:699, yearly_price:6999, currency:"CNY", cloudEnabled:true },
      { planId:"CN_ENTERPRISE_PRO", plan_id:"CN_ENTERPRISE_PRO", planName:"中国区企业高级版", plan_name:"中国区企业高级版", planType:"enterprise", plan_type:"enterprise", region:"CN", name:"中国区企业高级版", storageQuotaGb:5120, storage_quota_gb:5120, quotaGb:5120, memberLimit:50, member_limit:50, monthly_price:1999, yearly_price:19999, currency:"CNY", cloudEnabled:true },
      { planId:"GLOBAL_ENTERPRISE_BASIC", plan_id:"GLOBAL_ENTERPRISE_BASIC", planName:"Global Enterprise Basic", plan_name:"Global Enterprise Basic", planType:"enterprise", plan_type:"enterprise", region:"GLOBAL", name:"Global Enterprise Basic", storageQuotaGb:300, storage_quota_gb:300, quotaGb:300, memberLimit:5, member_limit:5, monthly_price:49, yearly_price:499, currency:"USD", cloudEnabled:true },
      { planId:"GLOBAL_ENTERPRISE_STANDARD", plan_id:"GLOBAL_ENTERPRISE_STANDARD", planName:"Global Enterprise Standard", plan_name:"Global Enterprise Standard", planType:"enterprise", plan_type:"enterprise", region:"GLOBAL", name:"Global Enterprise Standard", storageQuotaGb:1024, storage_quota_gb:1024, quotaGb:1024, memberLimit:20, member_limit:20, monthly_price:99, yearly_price:999, currency:"USD", cloudEnabled:true },
      { planId:"GLOBAL_ENTERPRISE_PRO", plan_id:"GLOBAL_ENTERPRISE_PRO", planName:"Global Enterprise Pro", plan_name:"Global Enterprise Pro", planType:"enterprise", plan_type:"enterprise", region:"GLOBAL", name:"Global Enterprise Pro", storageQuotaGb:5120, storage_quota_gb:5120, quotaGb:5120, memberLimit:50, member_limit:50, monthly_price:299, yearly_price:2999, currency:"USD", cloudEnabled:true }
    ];
    this.allocations = new Map();
    this.organizationMembers = new Map();
    this.fileIndex = [];
    this.auditLogs = [];
  }

  async getPlans() {
    return this.plans.slice();
  }

  async getSubscriptionStatus({ ownerType, ownerId } = {}) {
    return {
      ok:true,
      ownerType:ownerType || "user",
      ownerId:ownerId || "local-user",
      planId:"free_local",
      status:"active",
      cloudEnabled:false
    };
  }

  async getStorageAllocation({ ownerType, ownerId } = {}) {
    const key = [ownerType || "user", ownerId || "local-user"].join(":");
    return this.allocations.get(key) || null;
  }

  async createStorageAllocation(input = {}) {
    const ownerType = input.ownerType || "user";
    const ownerId = input.ownerId || "local-user";
    const key = [ownerType, ownerId].join(":");
    const allocation = {
      storageId:input.storageId || "storage-" + Date.now().toString(36),
      ownerType,
      ownerId,
      planId:input.planId || "",
      provider:input.provider || "local_mock",
      quotaGb:Number(input.quotaGb || 0),
      storageQuotaGb:Number(input.storageQuotaGb || input.quotaGb || 0),
      memberLimit:Number(input.memberLimit || 0),
      pathPrefix:input.pathPrefix || "",
      createdAt:new Date().toISOString()
    };
    this.allocations.set(key, allocation);
    return allocation;
  }

  async getStorageUsage({ storageId } = {}) {
    return { ok:true, storageId:storageId || "", usedBytes:0, fileCount:0 };
  }

  async listOrganizationMembers({ organizationId } = {}) {
    const key = organizationId || "local-organization";
    return (this.organizationMembers.get(key) || []).slice();
  }

  async createOrganizationMember(input = {}) {
    const organizationId = input.organizationId || "local-organization";
    const members = this.organizationMembers.get(organizationId) || [];
    const member = {
      memberId:input.memberId || "member-" + Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 6),
      organizationId,
      email:input.email || "",
      name:input.name || "",
      role:input.role || "member",
      status:input.status || "invited",
      createdAt:new Date().toISOString(),
      updatedAt:new Date().toISOString()
    };
    members.push(member);
    this.organizationMembers.set(organizationId, members);
    return member;
  }

  async recordFileIndex(input = {}) {
    const record = Object.assign({ createdAt:new Date().toISOString() }, input);
    this.fileIndex.push(record);
    return { ok:true, record };
  }

  async recordAuditLog(input = {}) {
    const record = Object.assign({ createdAt:new Date().toISOString() }, input);
    this.auditLogs.push(record);
    return { ok:true, record };
  }

  async testConnection() {
    return { ok:true, provider:this.provider };
  }
}

class PocketBaseMetadataAdapterSkeleton extends MetadataAdapter {
  constructor(config = {}) {
    super(Object.assign({}, config, { provider:"pocketbase" }));
    this.provider = "pocketbase";
  }

  notConfigured() {
    return new Error("PocketBase metadata provider is not configured in this MVP.");
  }

  async getPlans() { throw this.notConfigured(); }
  async getSubscriptionStatus() { throw this.notConfigured(); }
  async getStorageAllocation() { throw this.notConfigured(); }
  async createStorageAllocation() { throw this.notConfigured(); }
  async getStorageUsage() { throw this.notConfigured(); }
  async listOrganizationMembers() { throw this.notConfigured(); }
  async createOrganizationMember() { throw this.notConfigured(); }
  async recordFileIndex() { throw this.notConfigured(); }
  async recordAuditLog() { throw this.notConfigured(); }

  async testConnection() {
    return { ok:false, provider:this.provider, reason:"not_configured_in_mvp" };
  }
}

class UnsupportedMetadataAdapter extends MetadataAdapter {
  constructor(config = {}) {
    super(config);
    this.provider = config.provider || "unsupported";
  }

  notConfigured() {
    return new Error("Metadata provider is not configured in this MVP.");
  }

  async getPlans() { throw this.notConfigured(); }
  async getSubscriptionStatus() { throw this.notConfigured(); }
  async getStorageAllocation() { throw this.notConfigured(); }
  async createStorageAllocation() { throw this.notConfigured(); }
  async getStorageUsage() { throw this.notConfigured(); }
  async listOrganizationMembers() { throw this.notConfigured(); }
  async createOrganizationMember() { throw this.notConfigured(); }
  async recordFileIndex() { throw this.notConfigured(); }
  async recordAuditLog() { throw this.notConfigured(); }

  async testConnection() {
    return { ok:false, provider:this.provider, reason:"not_configured_in_mvp" };
  }
}

function createMetadataAdapter(config = {}) {
  const provider = config.provider || "local_mock";
  if (provider === "local_mock") return new LocalMockMetadataAdapter(config);
  if (provider === "pocketbase") return new PocketBaseMetadataAdapterSkeleton(config);
  if (METADATA_PROVIDERS.has(provider)) return new UnsupportedMetadataAdapter(config);
  return new UnsupportedMetadataAdapter(Object.assign({}, config, { provider }));
}

export {
  MetadataAdapter,
  LocalMockMetadataAdapter,
  PocketBaseMetadataAdapterSkeleton,
  UnsupportedMetadataAdapter,
  createMetadataAdapter
};
