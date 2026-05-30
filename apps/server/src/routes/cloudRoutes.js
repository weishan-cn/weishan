import express from "express";
import {
  allocateStorage,
  createCloudContext,
  createUploadUrl,
  deleteObject,
  getStorageStatus
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

  router.get("/storage/status", async (req, res) => {
    const ownerType = req.query.ownerType || "user";
    const ownerId = req.query.ownerId || "local-user";
    res.json(await getStorageStatus({ ownerType, ownerId }, context));
  });

  router.post("/storage/allocate", async (req, res) => {
    const body = req.body || {};
    res.json({
      ok:true,
      allocation:await allocateStorage({
        ownerType:body.ownerType || "user",
        ownerId:body.ownerId || "local-user",
        planId:body.planId || "manual_mock",
        quotaGb:Number(body.quotaGb || 1),
        provider:body.provider || "local_mock"
      }, context)
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
