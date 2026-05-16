---
'@eigenpal/docx-js-editor': patch
---

Preserve tabs, breaks, and drawings inside `<w:hyperlink>`. The hyperlink
converter previously emitted only text content, collapsing TOC entries like
`1[tab]Introduction[tab]5` to `1Introduction5` and dropping the dot leader.
The PM → Document round-trip kept the link intact as well.
