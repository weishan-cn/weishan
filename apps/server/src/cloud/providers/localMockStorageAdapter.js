const memoryStore = new Map();

function safePart(value) {
  return String(value || "").replace(/[^a-zA-Z0-9._/-]/g, "_").replace(/^\/+/, "");
}

function objectPath({ ownerType, ownerId, objectKey }) {
  return [safePart(ownerType), safePart(ownerId), safePart(objectKey)].filter(Boolean).join("/");
}

function byteSize(value) {
  return Buffer.byteLength(String(value || ""), "utf8");
}

class LocalMockStorageAdapter {
  constructor(config = {}) {
    this.config = Object.assign({}, config, { provider: "local_mock" });
    this.provider = "local_mock";
  }

  async upload(input = {}) {
    const key = objectPath(input);
    const content = String(input.content || "");
    const item = {
      ownerType:input.ownerType || "user",
      ownerId:input.ownerId || "local-user",
      objectKey:input.objectKey || "",
      content,
      metadata:Object.assign({}, input.metadata || {}),
      sizeBytes:byteSize(content),
      updatedAt:new Date().toISOString()
    };
    memoryStore.set(key, item);
    return {
      ok:true,
      provider:this.provider,
      objectKey:item.objectKey,
      path:key,
      sizeBytes:item.sizeBytes,
      metadata:item.metadata
    };
  }

  async download(input = {}) {
    const key = objectPath(input);
    const item = memoryStore.get(key);
    if (!item) return { ok:false, provider:this.provider, error:"object_not_found" };
    return {
      ok:true,
      provider:this.provider,
      objectKey:item.objectKey,
      content:item.content,
      metadata:item.metadata,
      sizeBytes:item.sizeBytes
    };
  }

  async delete(input = {}) {
    const key = objectPath(input);
    const existed = memoryStore.delete(key);
    return { ok:true, provider:this.provider, deleted:existed, objectKey:input.objectKey || "" };
  }

  async generateSignedUrl(input = {}) {
    const path = objectPath(input);
    return {
      ok:true,
      provider:this.provider,
      operation:input.operation || "upload",
      expiresInSeconds:Number(input.expiresInSeconds || 900),
      signedUrl:"mock://storage/" + path
    };
  }

  async getUsage(input = {}) {
    const prefix = safePart(input.pathPrefix || "");
    let usedBytes = 0;
    let fileCount = 0;
    for (const [key, item] of memoryStore.entries()) {
      if (prefix && !key.startsWith(prefix)) continue;
      usedBytes += item.sizeBytes || 0;
      fileCount += 1;
    }
    return { ok:true, provider:this.provider, usedBytes, fileCount };
  }

  async testConnection() {
    return { ok:true, provider:this.provider };
  }
}

export { LocalMockStorageAdapter };
