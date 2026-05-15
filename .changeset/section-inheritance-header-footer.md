---
'@eigenpal/docx-js-editor': patch
---

Inherit header/footer references and titlePg from earlier sections per ECMA-376 §17.6. Documents whose headers are defined on the first section but omitted from the body-level sectPr now render headers and footers correctly.
