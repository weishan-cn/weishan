#!/usr/bin/env node

const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const { Jimp, intToRGBA } = require("../../apps/desktop/node_modules/jimp");

const ROOT = path.resolve(__dirname, "../..");
const MAIN_PATH = path.join(ROOT, "apps/desktop/src/main.js");
const SOURCE_LOGO_PATH = path.join(ROOT, "apps/desktop/src/assets/ws-logo.png");
const APP_ICON_PATH = path.join(ROOT, "apps/desktop/src/assets/weishan-icon-rounded.png");
const EXPECTED_SOURCE_SHA256 = "2870ba94ec5b79a01164685e15cb98eb51998ccf8098f0e2ad968de9fea54a89";

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

function pngMetadata(buffer) {
  assert.equal(buffer.subarray(1, 4).toString("ascii"), "PNG", "asset must be PNG");
  assert.equal(buffer.subarray(12, 16).toString("ascii"), "IHDR", "asset must have PNG IHDR");
  return {
    width:buffer.readUInt32BE(16),
    height:buffer.readUInt32BE(20),
    colorType:buffer.readUInt8(25)
  };
}

function alphaBounds(image) {
  let minX = image.width;
  let minY = image.height;
  let maxX = -1;
  let maxY = -1;
  image.scan(0, 0, image.width, image.height, (x, y, index) => {
    if (image.bitmap.data[index + 3] === 0) return;
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  });
  return { minX, minY, maxX, maxY, width:maxX - minX + 1, height:maxY - minY + 1 };
}

async function main() {
  const mainSource = fs.readFileSync(MAIN_PATH, "utf8");
  const sourceLogo = fs.readFileSync(SOURCE_LOGO_PATH);
  const appIcon = fs.readFileSync(APP_ICON_PATH);
  const sourceMeta = pngMetadata(sourceLogo);
  const iconMeta = pngMetadata(appIcon);
  const sourceRatio = sourceMeta.width / sourceMeta.height;
  const renderedWidth = 896;
  const renderedHeight = 391;
  const renderedRatio = renderedWidth / renderedHeight;
  const ratioErrorPercent = Math.abs(renderedRatio - sourceRatio) / sourceRatio * 100;

  assert.equal(sha256(sourceLogo), EXPECTED_SOURCE_SHA256, "canonical logo must remain the approved source artwork");
  assert.deepEqual(sourceMeta, { width:2500, height:1092, colorType:6 }, "canonical source dimensions and alpha must remain intact");
  assert.deepEqual(iconMeta, { width:1024, height:1024, colorType:6 }, "app icon must remain a square RGBA canvas");
  assert.ok(ratioErrorPercent <= 0.5, "contain-fit must preserve source aspect ratio within integer rounding tolerance");

  const sourceImage = await Jimp.read(SOURCE_LOGO_PATH);
  const iconImage = await Jimp.read(APP_ICON_PATH);
  const sourceBounds = alphaBounds(sourceImage);
  const iconBounds = alphaBounds(iconImage);
  const sourceContentRatio = sourceBounds.width / sourceBounds.height;
  const iconContentRatio = iconBounds.width / iconBounds.height;
  const contentRatioErrorPercent = Math.abs(iconContentRatio - sourceContentRatio) / sourceContentRatio * 100;

  assert.ok(contentRatioErrorPercent <= 0.5, "visible logo content must preserve its original aspect ratio");
  assert.ok(iconBounds.minX >= 64 && iconBounds.maxX <= 959, "visible logo content must keep horizontal Dock safe-area padding");
  assert.ok(iconBounds.minY >= 316 && iconBounds.maxY <= 706, "visible logo content must remain inside the centered contain-fit region");
  for (const [x, y] of [[0, 0], [1023, 0], [0, 1023], [1023, 1023]]) {
    assert.equal(intToRGBA(iconImage.getPixelColor(x, y)).a, 0, "square icon padding must remain transparent");
  }

  assert.match(mainSource, /const APP_NAME = "Weishan";/, "runtime application name must be Weishan");
  assert.match(mainSource, /path\.join\(__dirname, "assets\/weishan-icon-rounded\.png"\)/, "runtime must use the proportional repository icon");
  assert.match(mainSource, /app\.dock\.setIcon\(img\)/, "source runtime must set the macOS Dock icon");
  assert.match(mainSource, /title: APP_NAME/, "main window must use the Weishan title");
  assert.doesNotMatch(mainSource, /Desktop\/weishan-logo\.png/, "runtime must not depend on the Desktop engineering source path");

  console.log("DESKTOP_RUNTIME_BRANDING_LOGO PASS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
