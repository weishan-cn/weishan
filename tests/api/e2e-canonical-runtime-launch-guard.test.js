const assert = require("assert");
const os = require("os");
const path = require("path");

const {
  repoRoot,
  desktopDir,
  indexFile,
  assertCanonicalE2ERuntime,
  getCanonicalE2ERuntimeDescriptor
} = require("../e2e/helpers");

function assertViolation(fn, expectedPattern) {
  let thrown = null;
  try {
    fn();
  } catch (error) {
    thrown = error;
  }
  assert(thrown, "Expected canonical runtime guard violation");
  assert.match(thrown.message, expectedPattern);
}

function run() {
  const descriptor = getCanonicalE2ERuntimeDescriptor();
  assert.strictEqual(descriptor.product, "weishan");
  assert.ok(descriptor.version);
  assert.match(descriptor.buildType, /^SOURCE_/);
  assert.notStrictEqual(descriptor.launchRoot, "PACKAGED_APP");

  const electronExecutable = path.join(
    desktopDir,
    "node_modules/electron/dist/Electron.app/Contents/MacOS/Electron"
  );
  const electronDescriptor = assertCanonicalE2ERuntime({
    mode: "electron",
    executablePath: electronExecutable,
    args: ["."],
    cwd: desktopDir
  });
  assert.strictEqual(electronDescriptor.buildType, "SOURCE_DEV_ELECTRON");
  assert.strictEqual(electronDescriptor.launchRoot, "REPO_APPS_DESKTOP");
  assert.strictEqual(electronDescriptor.executableSource, "APPS_DESKTOP_NODE_MODULES_ELECTRON");
  assert.strictEqual(electronDescriptor.userDataIsolation, "DEFAULT_PROFILE");

  const isolatedDescriptor = assertCanonicalE2ERuntime({
    mode: "electron",
    executablePath: electronExecutable,
    args: [".", "--user-data-dir=" + path.join(os.tmpdir(), "weishan-e2e-user-data-fixture")],
    cwd: desktopDir
  });
  assert.strictEqual(isolatedDescriptor.userDataIsolation, "TEMP_E2E_PROFILE");

  const browserDescriptor = assertCanonicalE2ERuntime({
    mode: "browser",
    rendererFile: indexFile
  });
  assert.strictEqual(browserDescriptor.buildType, "SOURCE_FILE_RENDERER_FALLBACK");

  assertViolation(() => assertCanonicalE2ERuntime({
    mode: "electron",
    executablePath: "/Applications/weishan.app/Contents/MacOS/weishan",
    args: ["."],
    cwd: desktopDir
  }), /Electron executable must resolve|packaged Weishan\.app executable/);

  assertViolation(() => assertCanonicalE2ERuntime({
    mode: "electron",
    executablePath: "/private/tmp/weishan-package-prep-33aff468/apps/desktop/dist/mac-arm64/Weishan.app/Contents/MacOS/Weishan",
    args: ["."],
    cwd: desktopDir
  }), /Electron executable must resolve|packaged Weishan\.app executable|packaged dist\/tmp build/);

  assertViolation(() => assertCanonicalE2ERuntime({
    mode: "electron",
    executablePath: path.join(repoRoot, "apps/desktop/dist/mac-arm64/weishan.app/Contents/MacOS/weishan"),
    args: ["."],
    cwd: desktopDir
  }), /Electron executable must resolve|packaged Weishan\.app executable|packaged dist\/tmp build/);

  assertViolation(() => assertCanonicalE2ERuntime({
    mode: "electron",
    executablePath: electronExecutable,
    args: [".."],
    cwd: desktopDir
  }), /first arg must be/);

  assertViolation(() => assertCanonicalE2ERuntime({
    mode: "electron",
    executablePath: electronExecutable,
    args: [".", "--user-data-dir=/Applications/weishan.app"],
    cwd: desktopDir
  }), /E2E userData must be an isolated temp profile/);

  assertViolation(() => assertCanonicalE2ERuntime({
    mode: "browser",
    rendererFile: path.join(repoRoot, "apps/desktop/dist/index.html")
  }), /browser fallback must load apps\/desktop\/src\/index\.html/);

  console.log("E2E canonical runtime launch guard: PASS");
}

run();
