# weishan v1.9.1 Stable Master Architecture

- preload.js only exposes Electron bridge.
- UI lives under apps/desktop/src/renderer.
- Each route has its own page file.
- Each capability has its own module API file.
- Home Command Center dispatches module APIs and never edits another page's DOM directly.
- Settings/model/API/permission/delete/send/write actions require confirmation.
- No model is bound or assumed. Users own the connector.
- No real keys/secrets are stored in client code.
