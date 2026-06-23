---
name: pdf-parse v2 incompatibility
description: pdf-parse@2.x changed to a class-based API with no default export; v1 must be used for the simple function API.
---

pdf-parse@2.4.5 ESM build has no default export — only named exports like `PDFParse` (a class). The CJS build also exports named-only. This breaks both static `import pdfParse from "pdf-parse"` and `require("pdf-parse")` as a function.

**Fix:** Downgrade to `pdf-parse@1.1.1` which exports a single default function `(buffer) => Promise<{text}>`.

Also add `"pdf-parse"` to the esbuild `external` array in `build.mjs` so it's not bundled (CJS-only module). Use `require("pdf-parse")` in source code.

**Why:** v2 introduced a completely different class-based API requiring `new PDFParse().parse(buffer)` with worker thread dependencies that don't work well in esbuild bundles.

**How to apply:** Any time pdf-parse is used in the api-server, ensure `package.json` pins `"pdf-parse": "1.1.1"` (no caret) and the `build.mjs` externals list includes `"pdf-parse"`.
