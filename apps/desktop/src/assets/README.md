# Weishan desktop brand assets

- `ws-logo.png` is the canonical, byte-for-byte repository copy of the Human-provided `/Users/boge/Desktop/weishan-logo.png` source artwork (SHA-256 `2870ba94ec5b79a01164685e15cb98eb51998ccf8098f0e2ad968de9fea54a89`).
- `weishan-icon-rounded.png` is the static source-development application icon. It uses a transparent 1024×1024 canvas and a centered 1024×447 bicubic contain-fit of the complete canonical artwork at `(0, 288)`.

The source artwork is always treated as one unit. Its colors, proportions, and content are not cropped or rearranged. Asset generation is an engineering-time operation; the desktop runtime never reads the Desktop source path or resizes the logo.
