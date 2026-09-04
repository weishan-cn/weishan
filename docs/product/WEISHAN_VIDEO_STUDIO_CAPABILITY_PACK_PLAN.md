# Weishan Video Studio Capability Pack Plan

Status: `FOUNDATION_PLANNED_NOT_READY_FOR_USER_EXECUTION`. It is the first planned flagship capability pack, not an executable renderer.

## User outcomes

Users start from Home or Tools with goals such as “把这段内容做成一个 45 秒抖音视频.” Standard UI shows progress and outcomes, not an internal graph. The same project model supports 9:16 vertical, 16:9 landscape, and 1:1 square output profiles without making one social platform the product.

## Capabilities and artifacts

The foundation declares `video.script`, `video.storyboard`, `video.generate`, `video.import`, `video.trim`, `video.edit`, `video.subtitle`, `video.caption_style`, `video.voiceover`, `video.audio_mix`, `video.music`, `video.cover`, `video.resize`, and `video.export`.

Controlled artifact types are `source_media`, `script`, `storyboard`, `audio`, `subtitle`, `project_timeline`, `rendered_video`, and `cover_image`. A deterministic provider-free proof creates only script/storyboard/timeline/cover/export plans and labels `rendered_video` as `NOT_RENDERED`; it never presents fixture output as generated video.

## Permissions and dependency model

Filesystem read/write, microphone, network, and high compute are optional, narrow, task-time permissions. Installation must not grant them all. Large dependencies stay modular and optional: Video Editing Core, Voiceover Pack, AI Video Generation Pack, and Advanced Effects Pack. Local, online-service-required, and hybrid components are disclosed separately, including download/install size, account/subscription need, cost, and unverified regional availability.

No FFmpeg, model, voice engine, codec bundle, or provider runtime is downloaded or bundled in Phase 1. Future providers compete behind generic capability IDs and Brain selects on fit, installed/permission state, user preference, cost, availability, quality, and trust—never commission.

## Continuity and security

Projects resume through Tasks & Work, Recent Activity, and Saved Information; no permanent Video navigation item is added. Weishan Brain remains the authority and every composed step rechecks permissions and side-effect gates. Large/native components target an isolated process with bounded resources.

Direct publishing to Douyin, TikTok, YouTube, or any social platform is explicitly excluded. Future `social.publish.*` capabilities require separate account authorization and external-side-effect confirmation. The Chinese UI must distinguish local features from external services without promising China availability.
