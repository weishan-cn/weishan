"use strict";

const IMAGE_TOOLS_LIMITS = Object.freeze({
  maxFileBytes:12 * 1024 * 1024,
  maxPixels:12 * 1000 * 1000,
  maxDimension:6000,
  maxOutputBytes:24 * 1024 * 1024,
  timeoutMs:15000
});

const INPUT_MIME_TYPES = Object.freeze(["image/png", "image/jpeg"]);
const OUTPUT_MIME_TYPES = Object.freeze(["image/png", "image/jpeg"]);
const ROTATIONS = Object.freeze([0, 90, 180, 270]);
const IMAGE_TOOLS_CHANNELS = Object.freeze({
  process:"image-tools:process",
  cancel:"image-tools:cancel",
  export:"image-tools:export"
});

function plainObject(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function safeBytes(value) {
  if (Buffer.isBuffer(value)) return Buffer.from(value);
  if (value instanceof Uint8Array) return Buffer.from(value.buffer, value.byteOffset, value.byteLength);
  if (value instanceof ArrayBuffer) return Buffer.from(value);
  return null;
}

function safeInteger(value, minimum, maximum) {
  const number = Number(value);
  return Number.isInteger(number) && number >= minimum && number <= maximum ? number : null;
}

function probePng(bytes) {
  if (bytes.length < 24 || bytes.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a") return null;
  if (bytes.subarray(12, 16).toString("ascii") !== "IHDR") return null;
  return { mime:"image/png", width:bytes.readUInt32BE(16), height:bytes.readUInt32BE(20) };
}

function probeJpeg(bytes) {
  if (bytes.length < 4 || bytes[0] !== 0xff || bytes[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 3 < bytes.length) {
    if (bytes[offset] !== 0xff) { offset += 1; continue; }
    while (offset < bytes.length && bytes[offset] === 0xff) offset += 1;
    const marker = bytes[offset++];
    if (marker === 0xd8 || marker === 0xd9 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (offset + 1 >= bytes.length) return null;
    const length = bytes.readUInt16BE(offset);
    if (length < 2 || offset + length > bytes.length) return null;
    const isStartOfFrame = [0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker);
    if (isStartOfFrame) {
      if (length < 7) return null;
      return { mime:"image/jpeg", height:bytes.readUInt16BE(offset + 3), width:bytes.readUInt16BE(offset + 5) };
    }
    if (marker === 0xda) return null;
    offset += length;
  }
  return null;
}

function probeImage(bytes) {
  return probePng(bytes) || probeJpeg(bytes);
}

function validateDimensions(width, height) {
  return Number.isInteger(width) && Number.isInteger(height) && width > 0 && height > 0 &&
    width <= IMAGE_TOOLS_LIMITS.maxDimension && height <= IMAGE_TOOLS_LIMITS.maxDimension &&
    width * height <= IMAGE_TOOLS_LIMITS.maxPixels;
}

function validateRequest(payload) {
  if (!plainObject(payload)) return { ok:false, error:"INVALID_REQUEST" };
  const requestId = String(payload.requestId || "");
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(requestId)) return { ok:false, error:"INVALID_REQUEST" };
  const bytes = safeBytes(payload.bytes);
  if (!bytes || bytes.length === 0) return { ok:false, error:"EMPTY_IMAGE" };
  if (bytes.length > IMAGE_TOOLS_LIMITS.maxFileBytes) return { ok:false, error:"IMAGE_TOO_LARGE" };
  const source = probeImage(bytes);
  if (!source) return { ok:false, error:"UNSUPPORTED_OR_MALFORMED_IMAGE" };
  if (!INPUT_MIME_TYPES.includes(source.mime)) return { ok:false, error:"UNSUPPORTED_FORMAT" };
  if (!validateDimensions(source.width, source.height)) return { ok:false, error:"IMAGE_DIMENSIONS_TOO_LARGE" };

  const raw = plainObject(payload.transform) ? payload.transform : {};
  const outputMime = String(raw.outputMime || source.mime);
  if (!OUTPUT_MIME_TYPES.includes(outputMime)) return { ok:false, error:"UNSUPPORTED_OUTPUT_FORMAT" };
  let resize = null;
  if (raw.resize != null) {
    if (!plainObject(raw.resize)) return { ok:false, error:"INVALID_RESIZE" };
    const width = safeInteger(raw.resize.width, 1, IMAGE_TOOLS_LIMITS.maxDimension);
    const height = safeInteger(raw.resize.height, 1, IMAGE_TOOLS_LIMITS.maxDimension);
    if (!width || !height || !validateDimensions(width, height)) return { ok:false, error:"INVALID_RESIZE" };
    resize = { width, height };
  }
  const resizedWidth = resize ? resize.width : source.width;
  const resizedHeight = resize ? resize.height : source.height;
  let crop = null;
  if (raw.crop != null) {
    if (!plainObject(raw.crop)) return { ok:false, error:"INVALID_CROP" };
    const x = safeInteger(raw.crop.x, 0, resizedWidth - 1);
    const y = safeInteger(raw.crop.y, 0, resizedHeight - 1);
    const width = safeInteger(raw.crop.width, 1, resizedWidth);
    const height = safeInteger(raw.crop.height, 1, resizedHeight);
    if (x == null || y == null || !width || !height || x + width > resizedWidth || y + height > resizedHeight) return { ok:false, error:"INVALID_CROP" };
    crop = { x, y, width, height };
  }
  const rotation = Number(raw.rotation == null ? 0 : raw.rotation);
  if (!ROTATIONS.includes(rotation)) return { ok:false, error:"INVALID_ROTATION" };
  const flipHorizontal = raw.flipHorizontal === true;
  const flipVertical = raw.flipVertical === true;
  const jpegQuality = safeInteger(raw.jpegQuality == null ? 85 : raw.jpegQuality, 60, 95);
  if (!jpegQuality) return { ok:false, error:"INVALID_JPEG_QUALITY" };
  return {
    ok:true,
    value:{
      requestId,
      bytes,
      source,
      transform:{ outputMime, resize, crop, rotation, flipHorizontal, flipVertical, jpegQuality }
    }
  };
}

function validateExportRequest(payload) {
  if (!plainObject(payload)) return { ok:false, error:"INVALID_EXPORT_REQUEST" };
  const requestId = String(payload.requestId || "");
  if (!/^[A-Za-z0-9_-]{8,80}$/.test(requestId)) return { ok:false, error:"INVALID_EXPORT_REQUEST" };
  const bytes = safeBytes(payload.bytes);
  if (!bytes || bytes.length === 0 || bytes.length > IMAGE_TOOLS_LIMITS.maxOutputBytes) return { ok:false, error:"INVALID_EXPORT_IMAGE" };
  const image = probeImage(bytes);
  const mime = String(payload.mime || "");
  if (!image || !OUTPUT_MIME_TYPES.includes(mime) || image.mime !== mime || !validateDimensions(image.width, image.height)) return { ok:false, error:"INVALID_EXPORT_IMAGE" };
  const rawName = String(payload.suggestedName || "image-weishan").replace(/\.[^.]*$/, "");
  const baseName = rawName.replace(/[^A-Za-z0-9._ -]+/g, "_").trim().slice(0, 80) || "image-weishan";
  const extension = mime === "image/jpeg" ? "jpg" : "png";
  return { ok:true, value:{ requestId, bytes, mime, suggestedName:baseName + "." + extension, extension } };
}

function publicPolicy() {
  return {
    inputMimeTypes:INPUT_MIME_TYPES.slice(),
    outputMimeTypes:OUTPUT_MIME_TYPES.slice(),
    maxFileBytes:IMAGE_TOOLS_LIMITS.maxFileBytes,
    maxPixels:IMAGE_TOOLS_LIMITS.maxPixels,
    maxDimension:IMAGE_TOOLS_LIMITS.maxDimension,
    timeoutMs:IMAGE_TOOLS_LIMITS.timeoutMs,
    processingModel:"WORKER_THREAD",
    networkRequired:false,
    accountRequired:false,
    aiRequired:false
  };
}

module.exports = {
  IMAGE_TOOLS_LIMITS,
  INPUT_MIME_TYPES,
  OUTPUT_MIME_TYPES,
  ROTATIONS,
  IMAGE_TOOLS_CHANNELS,
  probeImage,
  validateDimensions,
  validateRequest,
  validateExportRequest,
  publicPolicy
};
