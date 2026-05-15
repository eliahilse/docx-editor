---
'@eigenpal/docx-js-editor': patch
---

Preserve simple/complex fields, nested SDTs, and math inside `<w:sdt>` content controls through parse, ProseMirror conversion, and paged render. Documents whose headers wrap text in `<w:sdt>` bound to a `docProps` field (e.g., Title) now render the field text correctly instead of dropping it.
