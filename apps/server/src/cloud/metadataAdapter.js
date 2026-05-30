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
      { planId:"enterprise_basic_cn", planType:"enterprise", region:"cn", name:"企业基础版 中国区", storageQuotaGb:300, quotaGb:300, memberLimit:5, cloudEnabled:true },
      { planId:"enterprise_standard_cn", planType:"enterprise", region:"cn", name:"企业标准版 中国区", storageQuotaGb:1024, quotaGb:1024, memberLimit:20, cloudEnabled:true },
      { planId:"enterprise_advanced_cn", planType:"enterprise", region:"cn", name:"企业高级版 中国区", storageQuotaGb:5120, quotaGb:5120, memberLimit:50, cloudEnabled:true },
      { planId:"enterprise_basic_global", planType:"enterprise", region:"global", name:"Enterprise Basic Global", storageQuotaGb:300, quotaGb:300, memberLimit:5, cloudEnabled:true },
      { planId:"enterprise_standard_global", planType:"enterprise", region:"global", name:"Enterprise Standard Global", storageQuotaGb:1024, quotaGb:1024, memberLimit:20, cloudEnabled:true },
      { planId:"enterprise_advanced_global", planType:"enterprise", region:"global", name:"Enterprise Advanced Global", storageQuotaGb:5120, quotaGb:5120, memberLimit:50, cloudEnabled:true }
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
