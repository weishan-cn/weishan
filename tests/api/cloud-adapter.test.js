const assert = require("node:assert/strict");

async function expectRejects(fn, pattern) {
  let failed = false;
  try {
    await fn();
  } catch (error) {
    failed = true;
    assert.match(String(error && error.message || error), pattern);
  }
  assert.equal(failed, true);
}

async function main() {
  const { createStorageAdapter } = await import("../../apps/server/src/cloud/storageAdapter.js");
  const { runCloudHealthcheck } = await import("../../apps/server/src/cloud/cloudHealthcheck.js");
  const {
    allocateStorage,
    createCloudContext,
    createUploadUrl,
    getStorageStatus
  } = await import("../../apps/server/src/cloud/cloudService.js");
  const adapter = createStorageAdapter({ provider:"local_mock" });
  assert.equal(adapter.provider, "local_mock");

  const connection = await adapter.testConnection();
  assert.deepEqual(connection, { ok:true, provider:"local_mock" });

  const uploaded = await adapter.upload({
    ownerType:"user",
    ownerId:"local-user",
    objectKey:"reports/test.txt",
    content:"hello cloud",
    metadata:{ kind:"test" }
  });
  assert.equal(uploaded.ok, true);
  assert.equal(uploaded.sizeBytes, 11);

  const downloaded = await adapter.download({
    ownerType:"user",
    ownerId:"local-user",
    objectKey:"reports/test.txt"
  });
  assert.equal(downloaded.ok, true);
  assert.equal(downloaded.content, "hello cloud");

  const signed = await adapter.generateSignedUrl({
    ownerType:"user",
    ownerId:"local-user",
    objectKey:"reports/test.txt",
    operation:"download"
  });
  assert.equal(signed.ok, true);
  assert.match(signed.signedUrl, /^mock:\/\/storage\/user\/local-user\/reports\/test\.txt$/);

  const usage = await adapter.getUsage({ pathPrefix:"user/local-user" });
  assert.equal(usage.ok, true);
  assert.equal(usage.usedBytes, 11);
  assert.equal(usage.fileCount, 1);

  const deleted = await adapter.delete({
    ownerType:"user",
    ownerId:"local-user",
    objectKey:"reports/test.txt"
  });
  assert.equal(deleted.ok, true);
  assert.equal(deleted.deleted, true);

  const unsupported = createStorageAdapter({ provider:"aws_s3" });
  await expectRejects(() => unsupported.upload({}), /not configured/i);

  const health = await runCloudHealthcheck();
  assert.equal(health.ok, true);
  assert.equal(health.checks.some((item) => item.name === "storageAdapter" && item.status === "pass"), true);
  assert.equal(health.checks.some((item) => item.name === "storageProviderSwitchable"), true);

  const context = createCloudContext();
  await allocateStorage({
    ownerType:"user",
    ownerId:"local-user",
    planId:"personal_cloud_mock",
    quotaGb:1,
    provider:"local_mock"
  }, context);
  const uploadUrl = await createUploadUrl({
    ownerType:"user",
    ownerId:"local-user",
    objectKey:"safe-output.txt",
    fileSizeBytes:32
  }, context);
  assert.equal(uploadUrl.ok, true);
  const json = JSON.stringify(uploadUrl);
  assert.equal(/secret|access.?key|token|password|authorization/i.test(json), false);

  const enterpriseContext = createCloudContext();
  const enterpriseAllocation = await allocateStorage({
    ownerType:"organization",
    ownerId:"local-company",
    provider:"local_mock"
  }, enterpriseContext);
  assert.equal(enterpriseAllocation.planId, "enterprise_cloud_mock");
  assert.equal(enterpriseAllocation.quotaGb, 1024);
  assert.equal(enterpriseAllocation.pathPrefix, "organizations/local-company/");

  const enterpriseStatus = await getStorageStatus({
    ownerType:"organization",
    ownerId:"local-company"
  }, enterpriseContext);
  assert.equal(enterpriseStatus.localOnly, false);
  assert.equal(enterpriseStatus.quotaBytes, 1024 * 1024 * 1024 * 1024);
  assert.equal(enterpriseStatus.pathPrefix, "organizations/local-company/");

  const enterpriseUploadUrl = await createUploadUrl({
    ownerType:"organization",
    ownerId:"local-company",
    objectKey:"reports/enterprise.txt",
    fileSizeBytes:1024
  }, enterpriseContext);
  assert.equal(enterpriseUploadUrl.ok, true);
  assert.equal(enterpriseUploadUrl.objectKey, "organizations/local-company/reports/enterprise.txt");
  assert.equal(/secret|access.?key|token|password|authorization/i.test(JSON.stringify(enterpriseUploadUrl)), false);

  console.log("CLOUD_ADAPTER_TEST PASS");
}

main().catch((error) => {
  console.error(error && error.message || error);
  process.exit(1);
});
