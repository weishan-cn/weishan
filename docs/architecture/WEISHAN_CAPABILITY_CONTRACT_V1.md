# Weishan Capability Contract V1

## Manifest

Required fields: `pluginId`, `name`, `publisher`, `version`, `runtimeVersion`, `description`, `capabilities`, `permissions`, `entrypoint`, `supportedPlatforms`, `minimumWeishanVersion`, `installSize`, `downloadSize`, `dataPolicy`, `updatePolicy`, `signature`, `integrityHash`, `homepage`, `license`, and `riskClass`. Runtime V2 additionally validates availability, online dependency, and cost disclosure.

## Capability declaration

Each capability declares `capabilityId`, description, JSON-like input/output schemas, permission requirements, execution mode, timeout class, and one side-effect class: `READ_ONLY`, `LOCAL_MUTATION`, `EXTERNAL_MUTATION`, `FINANCIAL`, `COMMUNICATION`, or `DEVICE_CONTROL`.

Canonical IDs describe outcomes (`software.modify`, `browser.navigate`, `spreadsheet.write`, `image.transform`) rather than implementations. Multiple manifests may advertise one ID.

## Permission declaration

The taxonomy includes network, scoped filesystem read/write, browser control, shell execution, Git read/write, mail read/draft/send, calendar read/write, camera, microphone, clipboard, local-app control, credential access, background tasks, and high compute. Each declaration has a required flag, human explanation, and one or more narrow scopes. Absence is denial.

## Invocation and result

An invocation identifies one installed/enabled plugin and declared capability, re-evaluates the capability's permissions, passes schema-conforming input and controlled artifact handles, and returns only:

`status`, `capability`, `result`, `artifacts`, `warnings`, `sideEffectsPerformed`, `permissionsUsed`, `duration`, and `pluginVersion`.

Unknown fields do not become authority. Secret-shaped results fail closed. Planning never authorizes side effects, and permissions are evaluated at every step of a composed task.

## SDK/package direction

The future SDK consists of this manifest schema, capability/permission schemas, versioned host RPC, normalized results, signed package format, compatibility rules, test harness, signing workflow, and local-developer mode. Third parties add capability declarations without editing Brain routing.
