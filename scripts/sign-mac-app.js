#!/usr/bin/env node

const fs = require('node:fs');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.resolve(__dirname, '..');
const CANDIDATE_APPS = [
  path.join(ROOT, 'apps/desktop/dist/mac-arm64/weishan.app'),
  path.join(ROOT, 'apps/desktop/dist/mac/weishan.app'),
  path.join(ROOT, 'apps/desktop/dist/weishan.app')
];

function run(command, args) {
  execFileSync(command, args, { stdio: 'inherit' });
}

function main() {
  if (process.platform !== 'darwin') {
    console.log('[skip] mac app signing is only needed on macOS.');
    return;
  }

  const appPath = CANDIDATE_APPS.find((candidate) => fs.existsSync(candidate));
  if (!appPath) {
    throw new Error(
      'Could not find a mac app bundle to sign. Looked in: ' + CANDIDATE_APPS.map((candidate) => path.relative(ROOT, candidate)).join(', ')
    );
  }

  console.log('[sign] ad-hoc signing ' + path.relative(ROOT, appPath));
  run('codesign', ['--force', '--deep', '--sign', '-', appPath]);

  console.log('[xattr] clearing quarantine/provenance flags ' + path.relative(ROOT, appPath));
  try {
    run('xattr', ['-dr', 'com.apple.quarantine', appPath]);
  } catch (_) {}
  try {
    run('xattr', ['-dr', 'com.apple.provenance', appPath]);
  } catch (_) {}

  console.log('[verify] verifying ' + path.relative(ROOT, appPath));
  run('codesign', ['--verify', '--deep', '--strict', '--verbose=2', appPath]);

  console.log('[done] mac app bundle signed and verified');
}

main();
