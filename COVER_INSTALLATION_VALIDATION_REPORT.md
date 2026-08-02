# Cover Installation and Desktop Runtime Validation Report

## Executive Summary

**Final conclusion: COVER INSTALLATION VALIDATION PASSED WITH ISSUES**

A local ARM64 macOS candidate was built from the existing repository scripts and cover-installed over the existing user-level Weishan test installation. The packaged Electron application started, closed normally, restarted, and passed focused UI smoke checks. Existing application-data files remained present, and no recent Weishan crash report was observed.

This was a local validation only. It is not a release, publication, tag, or declaration of public availability.

## Environment and Safety Boundary

- Candidate: local ARM64 macOS application bundle and DMG.
- Installation target: existing user-level Weishan application installation.
- User data: preserved in place; no profile deletion, reset, or migration was performed.
- Backup: an isolated, readable copy of the existing application profile and preferences was created before installation. The backup contained 59 files and approximately 8.4 MB. Its manifest SHA-256 was recorded locally.
- Sensitive data: no credentials, token values, private user content, or raw settings were read into this report.
- Generic live Provider execution: excluded. No real credentials, paid Provider calls, uploads, or external Provider actions were used.

## Baseline State

- Existing user-level application version: 4.2.8.
- Existing system-level application version observed: 4.2.7; it was not modified.
- Baseline user-level application launch: passed.
- Baseline Home, profile-backed application process, and normal shutdown: observed without a residual Weishan process.
- Existing persistent application state was preserved. The profile contained valid settings and existing history data. No named validation project or workspace was created because the validation used the active user profile and avoided modifying user data beyond non-destructive observation.

## Backup Evidence

- Backup was created before packaging/installation and confirmed readable afterward.
- Preserved application-profile file classes included preferences, secure storage, encrypted Provider credential storage, and limited-beta preferences.
- All four classes were present before and after the cover installation.
- Backup integrity manifest SHA-256: `451bd87cf631ae28aec65c5cea888f75c724d5340c2651947bfa9232c7e6034f`.

## Candidate Artifact

- Artifact type: ARM64 DMG and macOS application bundle.
- DMG: `weishan-4.2.8-arm64.dmg`.
- DMG size: 104,988,191 bytes.
- DMG SHA-256: `752d0d082018a1e27a51dbf5fb8fbcd4145e37a43b9b1ac29f01e594de8a32a7`.
- Bundle version / build: 4.2.8 / 4.2.8.
- Packaged `app.asar` SHA-256: `08d847849dacdcf3700f1565a702a2aeb5ab4a79bb9486472d2c6ba0aa8eaa17`.
- Code-signing verification: passed. The existing packaging script applied and verified an ad-hoc local signature.
- No dependency or lockfile changes were observed.

## Installation Method

The candidate bundle was copied over the existing user-level test installation after the application had been closed normally. The target bundle retained version 4.2.8, matched the candidate `app.asar` hash exactly, and passed deep signature verification.

No elevation was required. No file-in-use, version-conflict, user-data relocation, or setting-reset condition was observed.

## Cover Installation Result

- Candidate copied over existing application bundle: passed.
- Existing user-data directory retained in place: passed.
- Existing core profile files preserved: passed.
- Installed application bundle content equals candidate bundle content: passed.
- Signature verification after cover installation: passed.

## Startup Result

The covered application started successfully from the installed application path.

Observed:
- Main application process started.
- GPU, utility, and Renderer helper processes started.
- No immediate crash, startup loop, permanent blank window, or fatal initialization failure was observed.
- No recent Weishan crash report was found during the validation window.

## Shutdown Result

The packaged candidate and the cover-installed application each closed through the normal macOS application quit path. No Weishan process remained after the final close.

## Restart Result

- Candidate cold launch: passed.
- Candidate normal shutdown: passed.
- Candidate restart: passed.
- Cover-installed launch: passed.
- Cover-installed normal shutdown: passed.
- Cover-installed second restart: passed.

## Persistence Matrix

| State | Result | Evidence |
|---|---|---|
| Settings/profile core files | RESTORED | Preferences and secure storage classes present before and after. |
| Existing history | RESTORED | History key count was 589 in two independent packaged-app sessions. |
| Project records | NOT_EXPECTED_TO_PERSIST | No test project existed or was created in the active profile. |
| Decision memory records | NOT_EXPECTED_TO_PERSIST | No test memory existed or was created in the active profile. |
| Pending command/session queue | NOT_EXPECTED_TO_PERSIST | No queue/session test record was created. |
| Workspace/project test record | UNRESOLVED | A named record was intentionally not created in the active non-isolated profile. |

## Post-Install Core Smoke Results

Direct Playwright Electron inspection of the **installed packaged application**, not the source-development launcher, passed:

- Application title: passed.
- Home unified decision entry: passed.
- Sidebar: passed.
- History entry: passed.
- Settings entry: passed.
- Plugin disabled/coming-soon state: passed.
- Commerce entry: passed.
- Navigation return to Home: passed.
- Renderer page errors captured during the smoke: none.

Provider-neutral UI and disabled video/plugin behavior were observed only as safe UI states. No Provider key, credential, live service, or paid execution was used.

## Data Integrity Result

- No unexpected loss of core profile files observed.
- No unexpected settings reset observed.
- No malformed JSON observed in inspected non-content profile data.
- No application startup loop or migration loop observed.
- No duplicate workspace was created by this validation.
- No forced termination test was performed because the active profile was not an isolated test profile.
- Full semantic verification of user-created workspace/project/session records remains partial because no dedicated isolated profile with named test data was available.

## Runtime Observations

- Packaged desktop lifecycle: **VALIDATED**.
- Persistence recovery: **PARTIAL**.
- Cover installation: **VALIDATED** at local bundle replacement level.
- Data integrity: **PARTIAL**.
- Generic live Provider: **SEPARATE APPROVAL REQUIRED**.

## Issues by Severity

### Validation Gap: CIV-001

- Area: installer UX and platform installer behavior.
- Environment: local user-level application-bundle cover installation.
- Precondition: existing installation present.
- Reproduction: use a DMG/Finder or installer-specific workflow rather than the controlled local bundle replacement used here.
- Expected behavior: installer detection, elevation/file-in-use prompts, and version-conflict messaging are observable.
- Observed behavior: not exercised; the validation used a safe user-space bundle copy with no elevation.
- Frequency: not applicable.
- Severity: VALIDATION GAP.
- Release impact: installer UX remains unverified, while local cover replacement is verified.
- Affected data: none observed.
- Relevant logs: none.
- Rollback: available from the saved pre-cover application bundle and profile backup.
- Minimal recommended repair boundary: no repair; use a dedicated installer UX validation environment.

### Validation Gap: CIV-002

- Area: workspace/project/session persistence.
- Environment: active user profile.
- Precondition: no existing safe named test workspace/project.
- Reproduction: validate with a dedicated test profile containing only clearly named validation records.
- Expected behavior: named records survive cover installation and restart.
- Observed behavior: existing history and profile state were stable; project/workspace/session records were not independently created.
- Frequency: not applicable.
- Severity: VALIDATION GAP.
- Release impact: no data loss observed, but record-level persistence recovery is not fully certified.
- Affected data: none modified.
- Relevant logs: none.
- Rollback: profile backup exists.
- Minimal recommended repair boundary: no repair; repeat with an isolated test profile.

## Rollback Result

Rollback was not required. A readable profile backup and a pre-cover application-bundle backup exist locally, allowing a reversible restoration path if needed.

## Generic Live Provider Status

**SEPARATE APPROVAL REQUIRED.**

No generic live Provider execution was performed. The installed application only underwent credential-free UI and disabled-state validation.

## Release Impact

The packaged desktop lifecycle and local cover installation behavior are materially validated. The remaining limitations are installer-UX coverage and explicit named-record persistence coverage in a dedicated isolated profile. They do not justify changing runtime behavior, contracts, APIs, Commerce behavior, or Provider behavior in this stage.

## Recommended Next Stage

Use a dedicated non-production macOS user/profile or VM with a known, test-safe workspace/project/history/settings dataset to validate installer UX and record-level persistence recovery. Any generic live Provider validation requires separate human approval.
