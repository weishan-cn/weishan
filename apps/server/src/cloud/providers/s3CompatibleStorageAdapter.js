// Object storage credentials must stay on the server side only: .env or a
// managed secrets service. They must never enter the frontend, GitHub,
// installer bundles, documentation, telemetry, or logs.

class S3CompatibleStorageAdapter {
  constructor(config = {}) {
    this.config = {
      provider:"s3_compatible",
      vendor:config.vendor || "generic_s3_compatible"
    };
    this.provider = "s3_compatible";
  }

  notEnabled() {
    return new Error("S3-compatible object storage requires server-side credentials and SDK setup. Not enabled in this MVP.");
  }

  async upload() { throw this.notEnabled(); }
  async download() { throw this.notEnabled(); }
  async delete() { throw this.notEnabled(); }
  async generateSignedUrl() { throw this.notEnabled(); }
  async getUsage() { throw this.notEnabled(); }

  async testConnection() {
    return {
      ok:false,
      provider:this.provider,
      vendor:this.config.vendor,
      reason:"not_enabled_in_mvp"
    };
  }
}

export { S3CompatibleStorageAdapter };
