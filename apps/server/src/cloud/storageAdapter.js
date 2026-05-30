import { LocalMockStorageAdapter } from "./providers/localMockStorageAdapter.js";
import { S3CompatibleStorageAdapter } from "./providers/s3CompatibleStorageAdapter.js";

const UNSUPPORTED_PROVIDERS = new Set([
  "aliyun_oss",
  "huawei_obs",
  "aws_s3",
  "google_gcs",
  "azure_blob",
  "minio"
]);

class StorageAdapter {
  constructor(config = {}) {
    this.config = Object.assign({}, config);
    this.provider = this.config.provider || "unknown";
  }

  async upload() {
    throw new Error("Not implemented");
  }

  async download() {
    throw new Error("Not implemented");
  }

  async delete() {
    throw new Error("Not implemented");
  }

  async generateSignedUrl() {
    throw new Error("Not implemented");
  }

  async getUsage() {
    throw new Error("Not implemented");
  }

  async testConnection() {
    throw new Error("Not implemented");
  }
}

class UnsupportedStorageAdapter extends StorageAdapter {
  constructor(config = {}) {
    super(config);
    this.provider = config.provider || "unsupported";
  }

  providerError() {
    return new Error("Provider adapter is not configured in this MVP.");
  }

  async upload() { throw this.providerError(); }
  async download() { throw this.providerError(); }
  async delete() { throw this.providerError(); }
  async generateSignedUrl() { throw this.providerError(); }
  async getUsage() { throw this.providerError(); }

  async testConnection() {
    return { ok: false, provider: this.provider, reason: "not_configured_in_mvp" };
  }
}

function createStorageAdapter(config = {}) {
  const provider = config.provider || "local_mock";
  if (provider === "local_mock") return new LocalMockStorageAdapter(config);
  if (provider === "s3_compatible") return new S3CompatibleStorageAdapter(config);
  if (UNSUPPORTED_PROVIDERS.has(provider)) return new UnsupportedStorageAdapter(config);
  return new UnsupportedStorageAdapter(Object.assign({}, config, { provider }));
}

export {
  StorageAdapter,
  UnsupportedStorageAdapter,
  createStorageAdapter
};
