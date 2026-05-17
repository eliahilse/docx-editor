---
'@eigenpal/docx-js-editor': patch
---

Emit the synthetic `pageBreak` node BEFORE the paragraph when `<w:br w:type="page"/>` appears before any visible content (e.g. Word's "page-break run, then heading run" pattern). Previously the break was always emitted AFTER, which rendered such headings at the bottom of the prior page and the next content at the top of the new page — wasting the page tail below the heading.
