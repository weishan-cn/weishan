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
    getOrganizationStatus,
    getPlans,
    getStorageStatus,
    inviteOrganizationMember
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

  const planContext = createCloudContext();
  const plansResult = await getPlans(planContext);
  assert.equal(plansResult.ok, true);
  assert.match(plansResult.localStorageWarning, /local only|本地/i);
  const plansById = Object.fromEntries(plansResult.plans.map((plan) => [plan.planId, plan]));
  assert.equal(plansById.CN_ENTERPRISE_BASIC.storageQuotaGb, 300);
  assert.equal(plansById.CN_ENTERPRISE_BASIC.memberLimit, 5);
  assert.equal(plansById.CN_ENTERPRISE_STANDARD.storageQuotaGb, 1024);
  assert.equal(plansById.CN_ENTERPRISE_STANDARD.memberLimit, 20);
  assert.equal(plansById.CN_ENTERPRISE_PRO.storageQuotaGb, 5120);
  assert.equal(plansById.CN_ENTERPRISE_PRO.memberLimit, 50);
  assert.equal(plansById.GLOBAL_ENTERPRISE_BASIC.storageQuotaGb, 300);
  assert.equal(plansById.GLOBAL_ENTERPRISE_STANDARD.storageQuotaGb, 1024);
  assert.equal(plansById.GLOBAL_ENTERPRISE_PRO.storageQuotaGb, 5120);

  const freeStatus = await getStorageStatus({ ownerType:"user", ownerId:"free-user" }, planContext);
  assert.equal(freeStatus.localOnly, true);
  assert.equal(freeStatus.quotaBytes, 0);

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
    planId:"CN_ENTERPRISE_STANDARD",
    provider:"local_mock"
  }, enterpriseContext);
  assert.equal(enterpriseAllocation.planId, "CN_ENTERPRISE_STANDARD");
  assert.equal(enterpriseAllocation.quotaGb, 1024);
  assert.equal(enterpriseAllocation.memberLimit, 20);
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

  const defaultEnterpriseStatus = await getOrganizationStatus({
    organizationId:"default-company"
  }, createCloudContext());
  assert.equal(defaultEnterpriseStatus.planId, "CN_ENTERPRISE_BASIC");
  assert.equal(defaultEnterpriseStatus.quotaGb, 300);
  assert.equal(defaultEnterpriseStatus.memberLimit, 5);

  const basicContext = createCloudContext();
  const basicStatus = await getOrganizationStatus({
    organizationId:"basic-company",
    planId:"CN_ENTERPRISE_BASIC"
  }, basicContext);
  assert.equal(basicStatus.quotaGb, 300);
  assert.equal(basicStatus.memberLimit, 5);
  assert.equal(basicStatus.pathPrefix, "organizations/basic-company/");

  for (let i = 0; i < 5; i += 1) {
    await basicContext.metadata.createOrganizationMember({
      organizationId:"basic-company",
      email:"active" + i + "@example.test",
      status:"active"
    });
  }
  for (const status of ["invited", "removed", "rejected", "expired"]) {
    await basicContext.metadata.createOrganizationMember({
      organizationId:"basic-company",
      email:status + "@example.test",
      status
    });
  }
  const fullStatus = await getOrganizationStatus({
    organizationId:"basic-company",
    planId:"CN_ENTERPRISE_BASIC"
  }, basicContext);
  assert.equal(fullStatus.activeMemberCount, 5);
  assert.equal(fullStatus.totalMemberRecords, 9);
  const rejectedInvite = await inviteOrganizationMember({
    organizationId:"basic-company",
    planId:"CN_ENTERPRISE_BASIC",
    email:"new@example.test"
  }, basicContext);
  assert.equal(rejectedInvite.ok, false);
  assert.equal(rejectedInvite.code, "MEMBER_LIMIT_REACHED");
  assert.equal(rejectedInvite.activeMemberCount, 5);
  assert.deepEqual(rejectedInvite.ignoredStatuses, ["invited", "removed", "rejected", "expired"]);

  const standardContext = createCloudContext();
  const invited = await inviteOrganizationMember({
    organizationId:"standard-company",
    planId:"GLOBAL_ENTERPRISE_STANDARD",
    email:"invitee@example.test",
    name:"Invitee"
  }, standardContext);
  assert.equal(invited.ok, true);
  assert.equal(invited.result, "invited");
  assert.equal(invited.member.status, "invited");
  const standardStatus = await getOrganizationStatus({
    organizationId:"standard-company",
    planId:"GLOBAL_ENTERPRISE_STANDARD"
  }, standardContext);
  assert.equal(standardStatus.quotaGb, 1024);
  assert.equal(standardStatus.memberLimit, 20);
  assert.equal(standardStatus.activeMemberCount, 0);

  const advancedStatus = await getOrganizationStatus({
    organizationId:"advanced-company",
    planId:"GLOBAL_ENTERPRISE_PRO"
  }, createCloudContext());
  assert.equal(advancedStatus.quotaGb, 5120);
  assert.equal(advancedStatus.memberLimit, 50);

  console.log("CLOUD_ADAPTER_TEST PASS");
}

main().catch((error) => {
  console.error(error && error.message || error);
  process.exit(1);
});
