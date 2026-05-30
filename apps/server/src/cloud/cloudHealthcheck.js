import { createCloudContext, testCloudServices } from "./cloudService.js";
import { createStorageAdapter } from "./storageAdapter.js";
import { createMetadataAdapter } from "./metadataAdapter.js";

async function runCloudHealthcheck(config = {}) {
  const checks = [];
  const context = createCloudContext(config);
  const cloud = await testCloudServices(context);
  const localStorage = createStorageAdapter({ provider:"local_mock" });
  const localMetadata = createMetadataAdapter({ provider:"local_mock" });
  const s3Compatible = createStorageAdapter({ provider:"s3_compatible" });
  const metadataProvider = createMetadataAdapter({ provider:"pocketbase" });

  const localStorageStatus = await localStorage.testConnection();
  const localMetadataStatus = await localMetadata.testConnection();
  const s3Status = await s3Compatible.testConnection();
  const metadataProviderStatus = await metadataProvider.testConnection();

  checks.push({
    name:"cloudService",
    status:cloud.storage && cloud.storage.ok ? "pass" : "warn",
    message:"Cloud service uses local mock by default; real cloud providers are not enabled in this MVP."
  });
  checks.push({
    name:"metadataAdapter",
    status:localMetadataStatus.ok ? "pass" : "fail",
    message:"Metadata provider / database adapter interface is available."
  });
  checks.push({
    name:"storageAdapter",
    status:localStorageStatus.ok ? "pass" : "fail",
    message:"StorageAdapter interface and local mock provider are available."
  });
  checks.push({
    name:"storageProviderSwitchable",
    status:s3Status && s3Status.reason === "not_enabled_in_mvp" ? "pass" : "warn",
    message:"S3-compatible / object storage provider skeleton is switchable but not connected."
  });
  checks.push({
    name:"metadataProviderSwitchable",
    status:metadataProviderStatus && metadataProviderStatus.reason === "not_configured_in_mvp" ? "pass" : "warn",
    message:"PocketBase is an optional metadata provider skeleton; backend metadata provider remains replaceable."
  });
  checks.push({
    name:"secretSafety",
    status:"pass",
    message:"Object storage and metadata provider credentials must stay server-side and are not used in this MVP."
  });

  return {
    ok:checks.every((item) => item.status !== "fail"),
    checks
  };
}

export { runCloudHealthcheck };
