# Plugin Runtime V2 Migration Plan

## Gap matrix

| Feature | Existing state | V2 Phase 1 | Gap | Migration |
|---|---|---|---|---|
| Registry/manifest | PARTIAL | READY | Legacy schema is route-oriented | Adapter then V2-native manifests |
| Capabilities | PARTIAL | READY | Legacy capability strings lack contracts | Add schema/side-effect metadata |
| Permissions | PARTIAL | READY | Legacy booleans are broad | Scoped, deny-by-default grants |
| Install/uninstall | MISSING | READY abstraction | Package file host is absent | Phase 2 signed package manager |
| Enable/disable | PARTIAL | READY | Legacy enabled flag is static | V2 lifecycle state |
| Update/rollback | MISSING | PARTIAL | No downloader/version store | Phase 2 verified updater and rollback slots |
| Brain discovery | MISSING | READY foundation | Intent vocabulary is bounded | Expand evaluated capability intents |
| Multi-provider capability | MISSING | READY | Selection quality policy is minimal | Add measured availability/preference policy |
| Process isolation | NEEDS_REDESIGN | PARTIAL contract | Generic plugin host is absent | Phase 2 out-of-process host/resource limits |
| Signature/integrity | MISSING | PARTIAL validation | No signing service/package verifier | Phase 2 signing pipeline |
| Marketplace metadata/UI | PARTIAL | READY foundation | No remote backend | Local catalog now; reviewed API later |
| Third-party SDK | MISSING | PARTIAL contract | No distributable harness | Phase 2 SDK/tooling |
| Large packs | MISSING | READY metadata | No pack is executable | Optional download only after validation |

## Compatibility sequence

1. Keep legacy Registry and routes stable.
2. Map Image Tools to a V2 manifest and lifecycle record without changing its image-processing boundary.
3. Route new discovery through capability IDs, not plugin names.
4. Add a signed local package manager and out-of-process host.
5. Migrate remaining first-party tools one at a time.
6. Enable reviewed third-party submission only after signing, malware review, permission review, privacy/license review, compatibility tests, and revocation notices exist.

Rollback preserves the legacy Image Tools path. Global Shopping and Smart Mail are outside this migration.
