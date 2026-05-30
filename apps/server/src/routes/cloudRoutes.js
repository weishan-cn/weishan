import express from "express";
import {
  allocateStorage,
  createCloudContext,
  createUploadUrl,
  deleteObject,
  getOrganizationStatus,
  getPlans,
  getStorageStatus,
  inviteOrganizationMember
} from "../cloud/cloudService.js";
import { runCloudHealthcheck } from "../cloud/cloudHealthcheck.js";

function mountCloudRoutes(app) {
  const router = express.Router();
  const context = createCloudContext({
    metadata:{ provider:"local_mock" },
    storage:{ provider:"local_mock" },
    defaultProvider:"local_mock"
  });

  router.get("/cloud/healthcheck", async (_req, res) => {
    res.json(await runCloudHealthcheck());
  });

  router.get("/plans", async (_req, res) => {
    res.json(await getPlans(context));
  });

  router.get("/organization/status", async (req, res) => {
    res.json(await getOrganizationStatus({
      organizationId:req.query.organizationId || req.query.ownerId || "local-organization",
      planId:req.query.planId || ""
    }, context));
  });

  router.post("/organization/invite", async (req, res) => {
    const body = req.body || {};
    res.json(await inviteOrganizationMember({
      organizationId:body.organizationId || body.ownerId || "local-organization",
      planId:body.planId || "",
      email:body.email || "",
      name:body.name || "",
      role:body.role || "member"
    }, context));
  });

  router.get("/storage/status", async (req, res) => {
    const ownerType = req.query.ownerType || "user";
    const ownerId = req.query.ownerId || "local-user";
    res.json(await getStorageStatus({ ownerType, ownerId }, context));
  });

  router.post("/storage/allocate", async (req, res) => {
    const body = req.body || {};
    const allocation = await allocateStorage({
      ownerType:body.ownerType || "user",
      ownerId:body.ownerId || "local-user",
      planId:body.planId || "",
      quotaGb:Number(body.quotaGb || 0),
      provider:body.provider || "local_mock"
    }, context);
    res.json({
      ok:true,
      mock:true,
      quotaGb:Number(allocation.quotaGb || 0),
      quotaBytes:Number(allocation.quotaGb || 0) * 1024 * 1024 * 1024,
      pathPrefix:allocation.pathPrefix || "",
      provider:allocation.provider || "local_mock",
      storageMode:"local_mock",
      allocation
    });
  });

  router.post("/storage/upload-url", async (req, res) => {
    const body = req.body || {};
    res.json(await createUploadUrl({
      ownerType:body.ownerType || "user",
      ownerId:body.ownerId || "local-user",
      objectKey:body.objectKey || "",
      fileSizeBytes:Number(body.fileSizeBytes || 0)
    }, context));
  });

  router.post("/storage/delete", async (req, res) => {
    const body = req.body || {};
    res.json(await deleteObject({
      ownerType:body.ownerType || "user",
      ownerId:body.ownerId || "local-user",
      objectKey:body.objectKey || ""
    }, context));
  });

  app.use("/api", router);
}

export { mountCloudRoutes };
