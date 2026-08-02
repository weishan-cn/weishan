# Home UX Optimization Report

## Removed Watermark

The Home decision entry no longer overlays the conversation area with a promotional sentence. Its empty input uses a placeholder only, so generated content retains visual priority.

## Plugin Renaming

The former Creative Tools label is now Plugins in the Home entry, navigation translations, and plugin center. Traditional Chinese uses `插件` as well.

## Plugin Navigation

Home provides one Plugin action beside attachment, voice, input, and send. It uses the existing `plugins` route. The Plugin page is a discovery surface with Marketplace, Installed Plugins, Recommended Plugins, Recently Used, and category labels. Only registry-backed installed plugins remain actionable.

## Video Workflow

Home no longer detects video phrases or displays a video-specific card. Video remains discoverable through Plugins. This change does not alter the existing video workspace, scheduler, runtime, provider boundary, or disabled-plugin safety state.

## Execution Flow

No execution behavior changed. Home remains responsible for conversation, planning, result display, and task summaries. Plugin execution remains outside Home; this work adds no scheduler, task, provider, or routing capability.

## Reading Improvements

Removed the inline watermark, large input heading, example placeholder, video interruption card, and its unused styles. The input area now keeps only attachment, Plugins, voice, the input, and Start.

## Updated Screens

- Home
- Plugins

## Verification

- `node --check` passed for HomePage, PluginsPage, and i18n.
- `npx playwright test tests/e2e/zero-learning-ux.spec.js`: 5 passed.
- `git diff --check`: passed.

## Scope Boundary

No changes were made to business logic, Workspace logic, Decision Engine, Commerce, Provider contracts, public APIs, routing implementation, security, or permissions. No commit, push, tag, build, or install was performed.
