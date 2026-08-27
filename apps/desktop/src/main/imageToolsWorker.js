"use strict";

const { parentPort, workerData } = require("worker_threads");
const { Jimp } = require("jimp");
const { IMAGE_TOOLS_LIMITS, validateRequest, validateExportRequest, validateDimensions } = require("../shared/imageToolsContract");

function safeFailure(code) {
  return { ok:false, error:String(code || "PROCESSING_FAILED") };
}

async function processImage(payload) {
  const parsed = validateRequest(payload);
  if (!parsed.ok) return safeFailure(parsed.error);
  const request = parsed.value;
  try {
    const image = await Jimp.read(request.bytes);
    if (!validateDimensions(image.bitmap.width, image.bitmap.height)) return safeFailure("IMAGE_DIMENSIONS_TOO_LARGE");
    const transform = request.transform;
    if (transform.resize) image.resize({ w:transform.resize.width, h:transform.resize.height });
    if (transform.crop) image.crop({ x:transform.crop.x, y:transform.crop.y, w:transform.crop.width, h:transform.crop.height });
    if (transform.rotation) image.rotate(transform.rotation);
    if (transform.flipHorizontal || transform.flipVertical) image.flip({ horizontal:transform.flipHorizontal, vertical:transform.flipVertical });
    if (!validateDimensions(image.bitmap.width, image.bitmap.height)) return safeFailure("OUTPUT_DIMENSIONS_TOO_LARGE");
    const options = transform.outputMime === "image/jpeg" ? { quality:transform.jpegQuality } : undefined;
    const buffer = await image.getBuffer(transform.outputMime, options);
    if (!buffer || buffer.length === 0 || buffer.length > IMAGE_TOOLS_LIMITS.maxOutputBytes) return safeFailure("OUTPUT_TOO_LARGE");
    const bytes = Uint8Array.from(buffer);
    return {
      ok:true,
      requestId:request.requestId,
      mime:transform.outputMime,
      width:image.bitmap.width,
      height:image.bitmap.height,
      sourceWidth:request.source.width,
      sourceHeight:request.source.height,
      bytes
    };
  } catch (_) {
    return safeFailure("PROCESSING_FAILED");
  }
}

async function validateExportImage(payload) {
  const parsed = validateExportRequest(payload);
  if (!parsed.ok) return safeFailure(parsed.error);
  try {
    const image = await Jimp.read(parsed.value.bytes);
    if (!validateDimensions(image.bitmap.width, image.bitmap.height)) return safeFailure("INVALID_EXPORT_IMAGE");
    return {
      ok:true,
      requestId:parsed.value.requestId,
      mime:parsed.value.mime,
      width:image.bitmap.width,
      height:image.bitmap.height
    };
  } catch (_) {
    return safeFailure("INVALID_EXPORT_IMAGE");
  }
}

const task = workerData && workerData.mode === "validate-export"
  ? validateExportImage(workerData.payload)
  : processImage(workerData && workerData.payload ? workerData.payload : workerData);

task.then((result) => {
  if (result && result.ok && result.bytes) parentPort.postMessage(result, [result.bytes.buffer]);
  else parentPort.postMessage(result);
}).catch(() => parentPort.postMessage(safeFailure("PROCESSING_FAILED")));
